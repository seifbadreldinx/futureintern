from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError
from app.utils.auth import role_required, get_current_user_role, get_current_user_id
from app.models.user import User
from app.models.intern import Internship
from app.models.application import Application
from app.models import db
from datetime import datetime

applications_bp = Blueprint("applications", __name__)

@applications_bp.route("/")
def index():
    return jsonify({"message": "Applications API"})

@applications_bp.route("/test")
def test():
    return jsonify({"message": "Applications route is working!"})

# ========== Task 3.4: Application Workflow APIs ==========

@applications_bp.route("/apply", methods=["POST"])
@jwt_required()
@role_required('student')
def apply_for_internship():
    """Submit application for an internship - Students only"""
    try:
        student_id = get_current_user_id()
        data = request.get_json()
        
        # Validate required fields
        if 'internship_id' not in data:
            return jsonify({'error': 'internship_id is required'}), 400
        
        internship_id = data['internship_id']
        
        # Check if internship exists
        internship = Internship.query.get(internship_id)
        if not internship:
            return jsonify({'error': 'Internship not found'}), 404
        
        # Check if internship is active
        if not internship.is_active:
            return jsonify({'error': 'This internship is no longer accepting applications'}), 400
        
        # Check if deadline has passed
        if internship.application_deadline and datetime.utcnow().date() > internship.application_deadline:
            return jsonify({'error': 'Application deadline has passed'}), 400
        
        # Create application
        application = Application(
            student_id=student_id,
            internship_id=internship_id,
            cover_letter=data.get('cover_letter'),
            resume_url=data.get('resume_url'),
            status='pending'
        )
        
        try:
            db.session.add(application)
            db.session.commit()
            
            return jsonify({
                'message': 'Application submitted successfully',
                'application': application.to_dict(include_details=True)
            }), 201
            
        except IntegrityError:
            db.session.rollback()
            return jsonify({'error': 'You have already applied for this internship'}), 400
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@applications_bp.route("/my", methods=["GET"])
@jwt_required()
@role_required('student')
def get_my_applications():
    """Get all applications for current student"""
    try:
        student_id = get_current_user_id()
        
        applications = Application.query.filter_by(student_id=student_id).all()
        
        return jsonify({
            'applications': [app.to_dict(include_details=True) for app in applications],
            'total': len(applications)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@applications_bp.route("/internship/<int:internship_id>", methods=["GET"])
@jwt_required()
@role_required('company')
def get_internship_applications(internship_id):
    """Get all applications for a specific internship - Company only"""
    try:
        company_id = get_current_user_id()
        
        # Check if internship exists and belongs to company
        internship = Internship.query.get(internship_id)
        if not internship:
            return jsonify({'error': 'Internship not found'}), 404
        
        if internship.company_id != company_id:
            return jsonify({'error': 'You do not have permission to view these applications'}), 403
        
        applications = Application.query.filter_by(internship_id=internship_id).all()
        
        return jsonify({
            'applications': [app.to_dict(include_details=True) for app in applications],
            'total': len(applications),
            'internship': internship.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@applications_bp.route("/<int:application_id>/status", methods=["PUT"])
@jwt_required()
@role_required('company')
def update_application_status(application_id):
    """Update application status - Company only"""
    try:
        company_id = get_current_user_id()
        data = request.get_json()
        
        # Validate status
        if 'status' not in data:
            return jsonify({'error': 'status is required'}), 400
        
        new_status = data['status']
        valid_statuses = ['pending', 'accepted', 'rejected', 'withdrawn']
        
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        # Get application
        application = Application.query.get(application_id)
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        
        # Check if internship belongs to company
        if application.internship.company_id != company_id:
            return jsonify({'error': 'You do not have permission to update this application'}), 403
        
        # Update status
        application.status = new_status
        db.session.commit()
        
        return jsonify({
            'message': 'Application status updated successfully',
            'application': application.to_dict(include_details=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@applications_bp.route("/<int:application_id>/withdraw", methods=["PUT"])
@jwt_required()
@role_required('student')
def withdraw_application(application_id):
    """Withdraw application - Student only"""
    try:
        student_id = get_current_user_id()
        
        # Get application
        application = Application.query.get(application_id)
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        
        # Check if application belongs to student
        if application.student_id != student_id:
            return jsonify({'error': 'You do not have permission to withdraw this application'}), 403
        
        # Check if already withdrawn
        if application.status == 'withdrawn':
            return jsonify({'error': 'Application is already withdrawn'}), 400
        
        # Update status
        application.status = 'withdrawn'
        db.session.commit()
        
        return jsonify({
            'message': 'Application withdrawn successfully',
            'application': application.to_dict(include_details=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@applications_bp.route("/<int:application_id>", methods=["GET"])
@jwt_required()
def get_application(application_id):
    """Get application details"""
    try:
        current_user_id = get_current_user_id()
        current_user_role = get_current_user_role()
        
        application = Application.query.get(application_id)
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        
        # Check permission: student can view their own, company can view their internship's applications
        if current_user_role == 'student' and application.student_id != current_user_id:
            return jsonify({'error': 'You do not have permission to view this application'}), 403
        
        if current_user_role == 'company' and application.internship.company_id != current_user_id:
            return jsonify({'error': 'You do not have permission to view this application'}), 403
        
        return jsonify({
            'application': application.to_dict(include_details=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
