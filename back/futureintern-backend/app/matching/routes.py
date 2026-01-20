from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.utils.auth import role_required, get_current_user_id
from app.models.user import User
from app.models.intern import Internship
from app.matching.service import MatchingService

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

        # 2️⃣ Get all active internships
        internships = Internship.query.filter_by(is_active=True).all()

        if not internships:
            return jsonify({
                'message': 'No active internships available',
                'recommendations': []
            }), 200

        # 3️⃣ Prepare student data
        student_skills = []
        if student.skills:
            if isinstance(student.skills, str):
                student_skills = [s.strip() for s in student.skills.split(',') if s.strip()]
            else:
                student_skills = student.skills if isinstance(student.skills, list) else []

        # Parse interests and merge into skills
        student_interests = []
        if student.interests:
            if isinstance(student.interests, str):
                try:
                    import json
                    # Only parse if it looks like a list
                    if student.interests.startswith('['):
                        student_interests = json.loads(student.interests)
                    else:
                        student_interests = [s.strip() for s in student.interests.split(',') if s.strip()]
                except:
                     student_interests = [s.strip() for s in student.interests.split(',') if s.strip()]
            elif isinstance(student.interests, list):
                student_interests = student.interests

        # Merge unique capabilities (skills + interests)
        all_capabilities = list(set(student_skills + student_interests))

        student_data = {
            'id': student.id,
            'skills': all_capabilities,
            'major': student.major or '',
            'location': student.location or '', 
            'availability': 40
        }
        
        # DEBUG: Log student data
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"DEBUG - Student Data for Matching:")
        logger.info(f"  ID: {student.id}")
        logger.info(f"  Raw Skills from DB: {student.skills}")
        logger.info(f"  Parsed Skills: {student_skills}")
        logger.info(f"  Raw Interests from DB: {student.interests}")
        logger.info(f"  Parsed Interests: {student_interests}")
        logger.info(f"  Combined Capabilities: {all_capabilities}")
        logger.info(f"  Major: {student.major}")
        logger.info(f"  Location: {student.location}")

        # 4️⃣ Prepare internships data
        internships_data = []
        for internship in internships:
            # Use stored JSON skills if available, otherwise fallback to parsing requirements
            required_skills = []
            if internship.required_skills:
                try:
                    import json
                    required_skills = json.loads(internship.required_skills)
                except:
                    required_skills = [s.strip() for s in str(internship.required_skills).split(',') if s.strip()]
            elif internship.requirements:
                required_skills = [s.strip() for s in internship.requirements.split(',') if s.strip()]

            internships_data.append({
                'id': internship.id,
                'required_skills': required_skills,
                'major': internship.major or '',
                'location': internship.location or '',
                'required_availability': 30
            })

        # 5️⃣ Run matching service
        matching_service = MatchingService()
        recommendations = matching_service.match_student(student_data, internships_data)

        # 6️⃣ Enrich recommendations with internship details
        enriched_recommendations = []
        for rec in recommendations:
            internship = next((i for i in internships if i.id == rec['internship_id']), None)
            if internship:
                enriched_recommendations.append({
                    'score': rec['score'],
                    'match_details': rec['details'],
                    'internship': internship.to_dict(include_company=True)
                })

        # 7️⃣ Optional filters
        min_score = request.args.get('min_score', type=int)
        if min_score is not None:
            enriched_recommendations = [
                r for r in enriched_recommendations if r['score'] >= min_score
            ]

        limit = request.args.get('limit', 10, type=int)
        enriched_recommendations = enriched_recommendations[:limit]

        # 8️⃣ Final response
        return jsonify({
            'message': 'Recommendations generated successfully',
            'total': len(enriched_recommendations),
            'student': {
                'id': student.id,
                'name': student.name,
                'major': student.major,
                'skills': student_skills
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
            'message': 'Matching system is working',
            'student': student.to_dict() if student else None,
            'matching_weights': MatchingService.WEIGHTS
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
