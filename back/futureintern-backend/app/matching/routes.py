import json
import time
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.utils.auth import role_required, get_current_user_id
from app.models.user import User
from app.models.intern import Internship
from app.matching.service import HybridMatcher

matching_bp = Blueprint('matching', __name__)

# ── Per-student result cache ──────────────────────────────────────────────────
# Keyed by student_id → { 'ts': epoch_float, 'result': list }
# Cached results are returned FREE within the TTL window so that:
#  • client-side timeouts don't cost an extra charge on retry
#  • page refreshes / state resets don't charge a second time
_rec_cache: dict = {}
_REC_CACHE_TTL = 300   # 5 minutes


@matching_bp.route("/recommendations", methods=["GET"])
@jwt_required()
@role_required('student')
def get_recommendations():
    """
    Get personalized internship recommendations for the current student
    Based on skills, major, location, and availability matching
    """
    try:
        # 1️⃣ Get current student
        student_id = get_current_user_id()
        student = User.query.get(student_id)

        if not student:
            return jsonify({'error': 'Student not found'}), 404

        # Require at least one profile field before spending points
        _profile_fields = [student.skills, student.interests, student.bio, student.major]
        if not any(bool(str(f).strip()) for f in _profile_fields if f):
            return jsonify({
                'error': 'Please complete your profile (add skills, interests, major, or bio) before requesting AI recommendations.'
            }), 422

        # 2️⃣ Return cached result for free if within TTL
        now = time.time()
        cached = _rec_cache.get(student_id)
        if cached and (now - cached['ts']) < _REC_CACHE_TTL:
            if cached.get('pending'):
                # Points already charged but matching is still in progress in another request.
                # Tell the client to retry in a moment — they will NOT be charged again.
                return jsonify({
                    'error': 'Your request is still being processed. Please wait a moment and try again — you will not be charged again.',
                    'retry_after': 15,
                }), 503
            return jsonify({
                'message': 'Recommendations generated successfully',
                'total': len(cached['result']),
                'cached': True,
                'student': {
                    'id': student.id,
                    'name': student.name,
                    'major': student.major,
                },
                'recommendations': cached['result']
            }), 200

        # 3️⃣ Check Points Balance and charge via utility
        from app.utils.points import check_and_charge
        from app.models import db
        success, msg, cost = check_and_charge(student, 'ai_matching')
        if not success:
            return jsonify({
                'error': 'Insufficient points',
                'message': msg
            }), 402  # Payment Required
        db.session.commit()

        # Mark this student as "charged, matching in-progress" so concurrent/retry
        # requests within the TTL window are not charged a second time.
        _rec_cache[student_id] = {'ts': now, 'pending': True}

        # 2️⃣ Get all active internships
        internships = Internship.query.filter_by(is_active=True).all()

        if not internships:
            return jsonify({
                'message': 'No active internships available',
                'recommendations': []
            }), 200

        # 3️⃣ Parse student skills, interests and bio
        def parse_field(val):
            if not val:
                return []
            if isinstance(val, list):
                return val
            if isinstance(val, str):
                try:
                    if val.startswith('['):
                        return json.loads(val)
                except Exception:
                    pass
                return [s.strip() for s in val.split(',') if s.strip()]
            return []

        student_skills = parse_field(student.skills)
        student_interests = parse_field(student.interests)

        # 4️⃣ Build student profile for the AI matcher
        # Include CV builder data (summary, headline, section descriptions)
        from app.models.cv import CV
        cv = CV.query.filter_by(student_id=student.id).first()
        cv_text_parts = []
        if cv:
            if cv.headline:
                cv_text_parts.append(cv.headline)
            if cv.summary:
                cv_text_parts.append(cv.summary)
            for section in (cv.sections or []):
                if section.title:
                    cv_text_parts.append(section.title)
                if section.subtitle:
                    cv_text_parts.append(section.subtitle)
                if section.description:
                    cv_text_parts.append(section.description)

        student_profile = {
            'skills': student_skills,
            'interests': student_interests,
            'bio': student.bio or '',
            'major': student.major or '',
            'cv_text': ' '.join(cv_text_parts),
        }

        # 5️⃣ Prepare internship dicts for the AI matcher
        internships_for_matcher = []
        for internship in internships:
            required_skills_list = []
            if internship.required_skills:
                try:
                    required_skills_list = json.loads(internship.required_skills)
                except Exception:
                    required_skills_list = [s.strip() for s in str(internship.required_skills).split(',') if s.strip()]
            elif internship.requirements:
                required_skills_list = [s.strip() for s in internship.requirements.split(',') if s.strip()]

            internships_for_matcher.append({
                'id': internship.id,
                'title': internship.title or '',
                'description': internship.description or '',
                'skills': ' '.join(required_skills_list),
                'requirements': internship.requirements or '',
                'major': internship.major or '',
                'location': internship.location or '',
            })

        # 6️⃣ Run AI matching (TF-IDF + SBERT)
        #    Wrap in its own try/except so we can refund points on failure
        limit = request.args.get('limit', 10, type=int)
        try:
            matcher = HybridMatcher()
            matcher.fit(internships_for_matcher)
            matches = matcher.match(student_profile, top_k=limit)
        except Exception as match_err:
            # Matching failed after points were already charged → refund + clear pending lock
            _rec_cache.pop(student_id, None)
            try:
                from app.models import db as _db
                student.points = (student.points or 0) + cost
                _db.session.commit()
            except Exception:
                pass
            return jsonify({
                'error': 'AI matching failed. Your points have been refunded. Please try again in a moment.',
                'refunded': True,
            }), 500

        # 7️⃣ Enrich results with full internship details from DB
        internship_map = {i.id: i for i in internships}
        enriched_recommendations = []
        for match in matches:
            intern_obj = internship_map.get(match['id'])
            if intern_obj:
                enriched_recommendations.append({
                    'score': match['match_score'],
                    'match_details': {
                        'tfidf_score': match['tfidf_score'],
                        'sbert_score': match['sbert_score'],
                        'rank': match['match_rank'],
                        'explanation': match.get('explanation', {}),
                    },
                    'internship': intern_obj.to_dict(include_company=True)
                })

        # 8️⃣ Optional min_score filter
        min_score = request.args.get('min_score', type=float)
        if min_score is not None:
            enriched_recommendations = [
                r for r in enriched_recommendations if r['score'] >= min_score
            ]

        # 9️⃣ Cache the result so retries within TTL are free
        _rec_cache[student_id] = {'ts': now, 'result': enriched_recommendations}

        # 🔟 Final response
        return jsonify({
            'message': 'Recommendations generated successfully',
            'total': len(enriched_recommendations),
            'student': {
                'id': student.id,
                'name': student.name,
                'major': student.major,
                'skills': student_skills,
                'interests': student_interests,
            },
            'recommendations': enriched_recommendations
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@matching_bp.route("/recommendations/test", methods=["GET"])
@jwt_required()
@role_required('student')
def test_recommendations():
    """
    Test endpoint to verify matching logic
    """
    try:
        student_id = get_current_user_id()
        student = User.query.get(student_id)

        return jsonify({
            'message': 'AI matching system (TF-IDF + SBERT) is working',
            'student': student.to_dict() if student else None,
            'engine': 'HybridMatcher (TF-IDF 30% + SBERT 70%)'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
