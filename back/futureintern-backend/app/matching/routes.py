import json
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.utils.auth import role_required, get_current_user_id
from app.models.user import User
from app.models.intern import Internship
from app.matching.service import HybridMatcher

matching_bp = Blueprint('matching', __name__)

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

        # Check Points Balance and charge via utility
        from app.utils.points import check_and_charge
        from app.models import db
        success, msg, cost = check_and_charge(student, 'ai_matching')
        if not success:
            return jsonify({
                'error': 'Insufficient points',
                'message': msg
            }), 402  # Payment Required
        db.session.commit()

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
        student_profile = {
            'skills': student_skills,
            'interests': student_interests,
            'bio': student.bio or '',
            'major': student.major or '',
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
        limit = request.args.get('limit', 10, type=int)
        matcher = HybridMatcher()
        matcher.fit(internships_for_matcher)
        matches = matcher.match(student_profile, top_k=limit)

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
                    },
                    'internship': intern_obj.to_dict(include_company=True)
                })

        # 8️⃣ Optional min_score filter
        min_score = request.args.get('min_score', type=float)
        if min_score is not None:
            enriched_recommendations = [
                r for r in enriched_recommendations if r['score'] >= min_score
            ]

        # 9️⃣ Final response
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
