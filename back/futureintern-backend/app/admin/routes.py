"""
Admin Dashboard APIs - Task 5.2
Provides statistics and management endpoints for administrators
"""
from flask import Blueprint, jsonify
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
