"""
Admin Dashboard APIs - Task 5.2
Provides statistics and management endpoints for administrators
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.utils.auth import role_required
from app.models.user import User
from app.models.intern import Internship
from app.models.application import Application
from app.models import db
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__)

@admin_bp.route("/")
def index():
    return jsonify({"message": "Admin API"})

@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_stats():
    """Get system statistics - Admin only"""
    try:
        # Count users by role
        total_users = User.query.count()
        total_students = User.query.filter_by(role='student').count()
        total_companies = User.query.filter_by(role='company').count()
        verified_companies = User.query.filter_by(role='company', is_verified=True).count()
        
        # Count internships
        total_internships = Internship.query.count()
        active_internships = Internship.query.filter_by(is_active=True).count()
        
        # Count applications by status
        total_applications = Application.query.count()
        pending_applications = Application.query.filter_by(status='pending').count()
        accepted_applications = Application.query.filter_by(status='accepted').count()
        rejected_applications = Application.query.filter_by(status='rejected').count()
        
        # Get top companies by internships posted
        top_companies = db.session.query(
            User.id,
            User.company_name,
            func.count(Internship.id).label('internship_count')
        ).join(Internship, User.id == Internship.company_id)\
         .filter(User.role == 'company')\
         .group_by(User.id, User.company_name)\
         .order_by(func.count(Internship.id).desc())\
         .limit(5).all()
        
        # Get top students by applications
        top_students = db.session.query(
            User.id,
            User.name,
            User.email,
            func.count(Application.id).label('application_count')
        ).join(Application, User.id == Application.student_id)\
         .filter(User.role == 'student')\
         .group_by(User.id, User.name, User.email)\
         .order_by(func.count(Application.id).desc())\
         .limit(5).all()
        
        return jsonify({
            'users': {
                'total': total_users,
                'students': total_students,
                'companies': total_companies,
                'verified_companies': verified_companies
            },
            'internships': {
                'total': total_internships,
                'active': active_internships,
                'inactive': total_internships - active_internships
            },
            'applications': {
                'total': total_applications,
                'pending': pending_applications,
                'accepted': accepted_applications,
                'rejected': rejected_applications
            },
            'top_companies': [
                {
                    'id': company.id,
                    'name': company.company_name,
                    'internships_posted': company.internship_count
                }
                for company in top_companies
            ],
            'top_students': [
                {
                    'id': student.id,
                    'name': student.name,
                    'email': student.email,
                    'applications_submitted': student.application_count
                }
                for student in top_students
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/companies/pending", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_pending_companies():
    """Get list of companies pending verification"""
    try:
        pending_companies = User.query.filter_by(
            role='company',
            is_verified=False
        ).all()
        
        return jsonify({
            'total': len(pending_companies),
            'companies': [
                {
                    'id': company.id,
                    'company_name': company.company_name,
                    'email': company.email,
                    'location': company.company_location,
                    'website': company.company_website,
                    'created_at': company.created_at.isoformat() if company.created_at else None
                }
                for company in pending_companies
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/companies/<int:company_id>/approve", methods=["POST"])
@jwt_required()
@role_required('admin')
def approve_company(company_id):
    """Approve/verify a company"""
    try:
        company = User.query.get(company_id)
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        if company.role != 'company':
            return jsonify({'error': 'User is not a company'}), 400
        
        if company.is_verified:
            return jsonify({'message': 'Company is already verified'}), 200
        
        company.is_verified = True
        db.session.commit()
        
        return jsonify({
            'message': 'Company approved successfully',
            'company': {
                'id': company.id,
                'company_name': company.company_name,
                'is_verified': company.is_verified
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/users/<int:user_id>/deactivate", methods=["POST"])
@jwt_required()
@role_required('admin')
def deactivate_user(user_id):
    """Deactivate a user account (soft delete)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role == 'admin':
            return jsonify({'error': 'Cannot deactivate admin users'}), 403
        
        # For now, we'll just mark companies as unverified
        # In production, you might add an 'is_active' field
        if user.role == 'company':
            user.is_verified = False
            db.session.commit()
            
            return jsonify({
                'message': 'Company deactivated successfully',
                'user_id': user_id
            }), 200
        
        return jsonify({
            'message': 'User deactivation not fully implemented for students',
            'note': 'Consider adding is_active field to User model'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
# ========== New Admin Endpoints ==========

@admin_bp.route("/ping", methods=["GET"])
def ping_admin():
    """Health check for admin router"""
    return jsonify({"status": "ok", "message": "Admin router is live"}), 200

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@role_required('admin')
def list_all_users():
    """Get all users with pagination - Admin only"""
    try:
        skip = request.args.get('skip', 0, type=int)
        limit = request.args.get('limit', 100, type=int)
        
        users = User.query.offset(skip).limit(limit).all()
        
        return jsonify([
            {
                'id': user.id,
                'full_name': user.name,
                'email': user.email,
                'role': user.role,
                'is_active': True,  # Default to True, adjust based on your User model
                'is_verified': user.is_verified if user.role == 'company' else None,
                'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
                'company_name': user.company_name if user.role == 'company' else None
            }
            for user in users
        ]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@role_required('admin')
def delete_user(user_id):
    """Delete a user and all related data - Admin only"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent deleting admin users
        if user.role == 'admin':
            return jsonify({'error': 'Cannot delete admin users'}), 403
        
        # Delete user (cascading should handle related data if configured)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User and all related data deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/users", methods=["POST"])
@jwt_required()
@role_required('admin')
def create_user():
    """Create a new user - Admin only"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['full_name', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        from werkzeug.security import generate_password_hash
        
        user_data = {
            'name': data['full_name'],
            'email': data['email'],
            'password': generate_password_hash(data['password']),
            'role': data['role']
        }
        
        # Add company-specific fields
        if data['role'] == 'company':
            user_data['company_name'] = data.get('company_name', '')
            user_data['company_industry'] = data.get('industry', '')
            user_data['is_verified'] = False  # New companies need verification
        
        new_user = User(**user_data)
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'id': new_user.id,
            'full_name': new_user.name,
            'email': new_user.email,
            'role': new_user.role,
            'message': 'User created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/internships", methods=["GET"])
@jwt_required()
@role_required('admin')
def list_all_internships():
    """Get all internships - Admin only"""
    try:
        internships = Internship.query.all()
        
        return jsonify([
            {
                'id': internship.id,
                'title': internship.title,
                'company_id': internship.company_id,
                'company_name': User.query.get(internship.company_id).company_name if User.query.get(internship.company_id) else 'Unknown',
                'location': internship.location,
                'description': internship.description,
                'requirements': internship.requirements,
                'status': 'Active' if internship.is_active else 'Inactive',
                'is_active': internship.is_active,
                'created_at': internship.created_at.isoformat() if hasattr(internship, 'created_at') and internship.created_at else None
            }
            for internship in internships
        ]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/internships/<int:internship_id>", methods=["DELETE"])
@jwt_required()
@role_required('admin')
def delete_internship(internship_id):
    """Delete an internship - Admin only"""
    try:
        internship = Internship.query.get(internship_id)
        if not internship:
            return jsonify({'error': 'Internship not found'}), 404
        
        db.session.delete(internship)
        db.session.commit()
        
        return jsonify({'message': 'Internship deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/applications", methods=["GET"])
@jwt_required()
@role_required('admin')
def list_all_applications():
    """Get all applications - Admin only"""
    try:
        applications = Application.query.all()
        
        return jsonify([
            {
                'id': app.id,
                'student_id': app.student_id,
                'student_name': User.query.get(app.student_id).name if User.query.get(app.student_id) else 'Unknown',
                'student_email': User.query.get(app.student_id).email if User.query.get(app.student_id) else 'Unknown',
                'internship_id': app.internship_id,
                'internship_title': Internship.query.get(app.internship_id).title if Internship.query.get(app.internship_id) else 'Unknown',
                'company_name': User.query.get(Internship.query.get(app.internship_id).company_id).company_name if Internship.query.get(app.internship_id) and User.query.get(Internship.query.get(app.internship_id).company_id) else 'Unknown',
                'status': app.status,
                'created_at': app.created_at.isoformat() if hasattr(app, 'created_at') and app.created_at else None
            }
            for app in applications
        ]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/companies", methods=["GET"])
@jwt_required()
@role_required('admin')
def list_all_companies():
    """Get all companies - Admin only"""
    try:
        companies = User.query.filter_by(role='company').all()
        
        return jsonify([
            {
                'id': company.id,
                'company_name': company.company_name,
                'email': company.email,
                'industry': company.company_industry if hasattr(company, 'company_industry') else None,
                'location': company.company_location if hasattr(company, 'company_location') else None,
                'is_verified': company.is_verified,
                'created_at': company.created_at.isoformat() if hasattr(company, 'created_at') and company.created_at else None
            }
            for company in companies
        ]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/companies/<int:company_id>/verify", methods=["POST"])
@jwt_required()
@role_required('admin')
def verify_company(company_id):
    """Verify a company - Admin only"""
    try:
        company = User.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        if company.role != 'company':
            return jsonify({'error': 'User is not a company'}), 400
        
        company.is_verified = True
        db.session.commit()
        
        return jsonify({'message': 'Company verified'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500