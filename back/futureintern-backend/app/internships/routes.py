from flask import Blueprint, jsonify, request
from app.models import db
from app.models.intern import Internship
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth import role_required, get_current_user_role
from datetime import datetime
from sqlalchemy.orm import joinedload

internships_bp = Blueprint('internships', __name__)

# ========== Task 3.3: Internship CRUD APIs ==========

@internships_bp.route("/", methods=["GET"])
def get_internships():
    """Get all active internships with pagination"""
    try:
        # Pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)
        
        # Query active internships and eager-load company to ensure we can serialize company data reliably
        query = Internship.query.options(joinedload(Internship.company)).filter_by(is_active=True)
        
        # Pagination
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        internships = [internship.to_dict() for internship in pagination.items]

        # Debug log to help diagnosis in dev — shows whether company names are present
        try:
            companies_present = sum(1 for it in internships if it.get('company') and it['company'].get('name'))
            print(f"Returning {len(internships)} internships (companies with names: {companies_present})")
        except Exception:
            pass
        
        return jsonify({
            'internships': internships,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@internships_bp.route("/<int:id>", methods=["GET"])
def get_internship(id):
    """Get single internship by ID"""
    try:
        internship = Internship.query.get(id)
        
        if not internship:
            return jsonify({'error': 'Internship not found'}), 404
        
        return jsonify({
            'internship': internship.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@internships_bp.route("/", methods=["POST"])
@jwt_required()
@role_required('company')
def create_internship():
    """Create new internship (Company only)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validation
        required_fields = ['title', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create internship
        internship = Internship(
            title=data['title'],
            description=data['description'],
            requirements=data.get('requirements'),
            location=data.get('location'),
            duration=data.get('duration'),
            stipend=data.get('stipend'),
            major=data.get('major'),
            company_id=user_id
        )
        
        # Parse dates if provided
        if data.get('application_deadline'):
            try:
                internship.application_deadline = datetime.strptime(data['application_deadline'], '%Y-%m-%d').date()
            except:
                pass
        
        if data.get('start_date'):
            try:
                internship.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            except:
                pass
        
        db.session.add(internship)
        db.session.commit()
        
        return jsonify({
            'message': 'Internship created successfully',
            'internship': internship.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@internships_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
@role_required('company')
def update_internship(id):
    """Update internship (Company owner only)"""
    try:
        user_id = int(get_jwt_identity())  # Convert to int for comparison
        internship = Internship.query.get(id)
        
        if not internship:
            return jsonify({'error': 'Internship not found'}), 404
        
        # Check ownership
        if internship.company_id != user_id:
            return jsonify({'error': 'Not authorized to update this internship'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            internship.title = data['title']
        if 'description' in data:
            internship.description = data['description']
        if 'requirements' in data:
            internship.requirements = data['requirements']
        if 'location' in data:
            internship.location = data['location']
        if 'duration' in data:
            internship.duration = data['duration']
        if 'stipend' in data:
            internship.stipend = data['stipend']
        if 'major' in data:
            internship.major = data['major']
        if 'is_active' in data:
            internship.is_active = data['is_active']
        
        # Update dates
        if 'application_deadline' in data:
            try:
                internship.application_deadline = datetime.strptime(data['application_deadline'], '%Y-%m-%d').date()
            except:
                pass
        
        if 'start_date' in data:
            try:
                internship.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            except:
                pass
        
        db.session.commit()
        
        return jsonify({
            'message': 'Internship updated successfully',
            'internship': internship.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@internships_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
@role_required('company')
def delete_internship(id):
    """Delete internship (Company owner only)"""
    try:
        user_identity = get_jwt_identity()
        print(f"DEBUG: raw identity: {user_identity} (type: {type(user_identity)})")
        
        try:
            user_id = int(str(user_identity)) # Force string then int conversion to be safe
        except:
            print(f"DEBUG: Could not convert identity to int: {user_identity}")
            return jsonify({'error': 'Invalid authentication token format'}), 401
            
        internship = Internship.query.get(id)
        
        if not internship:
            return jsonify({'error': 'Internship not found'}), 404
        
        print(f"DEBUG: ownership check - User: {user_id} (type: {type(user_id)}), Owner: {internship.company_id} (type: {type(internship.company_id)})")
        
        # Check ownership
        if internship.company_id != user_id:
            return jsonify({'error': f'Not authorized. User {user_id} does not own internship {id} (owned by {internship.company_id})'}), 403
        
        db.session.delete(internship)
        db.session.commit()
        
        return jsonify({
            'message': 'Internship deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@internships_bp.route("/my", methods=["GET"])
@jwt_required()
@role_required('company')
def get_my_internships():
    """Get company's own internships"""
    try:
        user_id = get_jwt_identity()
        internships = Internship.query.filter_by(company_id=user_id).all()
        
        return jsonify({
            'internships': [internship.to_dict() for internship in internships]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
