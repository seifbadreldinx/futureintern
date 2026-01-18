from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import role_required, get_current_user_role
from app.models.user import User
from app.models import db

users_bp = Blueprint("users", __name__)

@users_bp.route("/")
def index():
    return jsonify({"message": "Users API"})

@users_bp.route("/test")
def test():
    return jsonify({"message": "Users route is working!"})

# ========== Task 3.1: Student Profile APIs ==========

@users_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Get current user's profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'profile': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update current user's profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Common fields
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data:
            user.phone = data['phone']
        
        # Student-specific fields
        if user.role == 'student':
            if 'university' in data:
                user.university = data['university']
            if 'major' in data:
                user.major = data['major']
            if 'skills' in data:
                user.skills = data['skills']
            if 'interests' in data:
                user.interests = data['interests']
            if 'bio' in data:
                user.bio = data['bio']
            if 'location' in data:
                user.location = data['location']
        
        # Company-specific fields (Task 3.2)
        elif user.role == 'company':
            if 'company_name' in data:
                user.company_name = data['company_name']
            if 'company_description' in data:
                user.company_description = data['company_description']
            if 'company_website' in data:
                user.company_website = data['company_website']
            if 'company_location' in data:
                user.company_location = data['company_location']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ========== Admin Endpoints ==========

@users_bp.route("/all")
@jwt_required()
@role_required('admin')
def all_users():
    """Get all users - Admin only (Task 2.4: Role-Based Access)"""
    try:
        users = User.query.all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== Task 5.1: CV Upload & Storage ==========

@users_bp.route("/upload-cv", methods=["POST"])
@jwt_required()
@role_required('student')
def upload_cv():
    """Upload CV for student"""
    try:
        from app.utils.file_upload import save_cv, delete_cv
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if 'cv' not in request.files:
            return jsonify({'error': 'No CV file provided'}), 400
        
        file = request.files['cv']
        
        # Save new CV
        cv_path, error = save_cv(file, user_id)
        
        if error:
            return jsonify({'error': error}), 400
        
        # Delete old CV if exists
        if user.resume_url:
            delete_cv(user.resume_url)
        
        # Update user's CV URL
        user.resume_url = cv_path
        db.session.commit()
        
        return jsonify({
            'message': 'CV uploaded successfully',
            'cv_url': cv_path,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ========== Admin APIs ==========

@users_bp.route("/<int:user_id>/verify", methods=["POST"])
@jwt_required()
@role_required('admin')
def verify_company(user_id):
    """Verify a company - Admin only (Task 3.2)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role != 'company':
            return jsonify({'error': 'User is not a company'}), 400
        
        user.is_verified = True
        db.session.commit()
        
        return jsonify({
            'message': 'Company verified successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
