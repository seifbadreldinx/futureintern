from flask import Blueprint, jsonify, request, current_app
import os
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

@users_bp.route("/companies", methods=["GET"])
def get_all_companies():
    """Get all companies (public endpoint)"""
    try:
        from app.models.intern import Internship
        
        # Get all users with role='company'
        companies = User.query.filter_by(role='company').all()
        
        # For each company, count their internships
        companies_data = []
        for company in companies:
            internship_count = Internship.query.filter_by(company_id=company.id).count()
            company_dict = company.to_dict()
            company_dict['internship_count'] = internship_count
            companies_data.append(company_dict)
        
        # Sort by internship count (descending)
        companies_data.sort(key=lambda x: x['internship_count'], reverse=True)
        
        return jsonify({
            'companies': companies_data,
            'total': len(companies_data)
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
        
        # EXTRACT SKILLS FROM CV
        try:
            from app.utils.cv_parser import parse_cv
            # Construct full path to file
            full_path = os.path.join(current_app.root_path, '..', cv_path.lstrip('/'))
            _, extracted_skills = parse_cv(full_path)
            
            if extracted_skills:
                # Merge with existing skills
                current_skills = set()
                if user.skills:
                    if isinstance(user.skills, list):
                         current_skills = set(user.skills)
                    elif isinstance(user.skills, str):
                        current_skills = set([s.strip() for s in user.skills.split(',') if s.strip()])
                
                combined_skills = current_skills.union(set(extracted_skills))
                # Save as comma-separated string
                user.skills = ','.join(sorted(list(combined_skills)))
        except Exception as e:
            print(f"CV parsing failed: {str(e)}")
            # Continue without fail
            
        db.session.commit()
        
        return jsonify({
            'message': 'CV uploaded successfully',
            'resume_url': user.resume_url,
            'skills': user.skills
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route("/delete-cv", methods=["DELETE"])
@jwt_required()
@role_required('student')
def delete_cv_route():
    """Delete CV for student"""
    try:
        from app.utils.file_upload import delete_cv
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.resume_url:
            return jsonify({'error': 'No CV to delete'}), 404
        
        # Delete the CV file
        delete_cv(user.resume_url)
        
        # Clear the resume_url from database
        user.resume_url = None
        db.session.commit()
        
        return jsonify({
            'message': 'CV deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ========== Logo Upload for Companies ==========

@users_bp.route("/upload-logo", methods=["POST"])
@jwt_required()
@role_required('company')
def upload_logo():
    """Upload logo for company"""
    try:
        from app.utils.file_upload import save_logo, delete_logo
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if 'logo' not in request.files:
            return jsonify({'error': 'No logo file provided'}), 400
        
        file = request.files['logo']
        
        # Save new logo
        logo_path, error = save_logo(file, user_id)
        
        if error:
            return jsonify({'error': error}), 400
        
        # Delete old logo if exists
        if user.profile_image:
            delete_logo(user.profile_image)
        
        # Update user's profile image URL
        user.profile_image = logo_path
        db.session.commit()
        
        return jsonify({
            'message': 'Logo uploaded successfully',
            'profile_image': user.profile_image
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route("/delete-logo", methods=["DELETE"])
@jwt_required()
@role_required('company')
def delete_logo_route():
    """Delete logo for company"""
    try:
        from app.utils.file_upload import delete_logo
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.profile_image:
            return jsonify({'error': 'No logo to delete'}), 404
        
        # Delete the logo file
        delete_logo(user.profile_image)
        
        # Clear the profile_image from database
        user.profile_image = None
        db.session.commit()
        
        return jsonify({
            'message': 'Logo deleted successfully'
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

# ========== Saved Internships APIs ==========

@users_bp.route("/saved-internships", methods=["GET"])
@jwt_required()
def get_saved_internships():
    """Get all saved internships for current user"""
    try:
        from app.models.intern import Internship
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get saved internships
        saved = user.saved_internships_rel.all()
        
        return jsonify({
            'saved_internships': [internship.to_dict() for internship in saved],
            'count': len(saved)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route("/saved-internships/<int:internship_id>", methods=["POST"])
@jwt_required()
def save_internship(internship_id):
    """Save/bookmark an internship"""
    try:
        from app.models.intern import Internship
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        internship = Internship.query.get(internship_id)
        if not internship:
            return jsonify({'error': 'Internship not found'}), 404
        
        # Check if already saved
        if internship in user.saved_internships_rel:
            return jsonify({'message': 'Internship already saved'}), 200
        
        # Add to saved internships
        user.saved_internships_rel.append(internship)
        db.session.commit()
        
        return jsonify({
            'message': 'Internship saved successfully',
            'internship': internship.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route("/saved-internships/<int:internship_id>", methods=["DELETE"])
@jwt_required()
def unsave_internship(internship_id):
    """Remove an internship from saved list"""
    try:
        from app.models.intern import Internship
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        internship = Internship.query.get(internship_id)
        if not internship:
            return jsonify({'error': 'Internship not found'}), 404
        
        # Check if saved
        if internship not in user.saved_internships_rel:
            return jsonify({'error': 'Internship not in saved list'}), 400
        
        # Remove from saved
        user.saved_internships_rel.remove(internship)
        db.session.commit()
        
        return jsonify({
            'message': 'Internship removed from saved list'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route("/saved-internships/<int:internship_id>/check", methods=["GET"])
@jwt_required()
def check_if_saved(internship_id):
    """Check if an internship is saved by current user"""
    try:
        from app.models.intern import Internship
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        internship = Internship.query.get(internship_id)
        if not internship:
            return jsonify({'error': 'Internship not found'}), 404
        
        is_saved = internship in user.saved_internships_rel
        
        return jsonify({
            'is_saved': is_saved
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
