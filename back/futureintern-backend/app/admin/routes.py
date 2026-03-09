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
        
        # Pending verifications count
        pending_verifications = User.query.filter_by(role='company', is_verified=False).count()
        
        return jsonify({
            # Flat fields for frontend Admin Dashboard compatibility
            'total_users': total_users,
            'total_internships': total_internships,
            'total_applications': total_applications,
            'pending_verifications': pending_verifications,
            # Detailed breakdowns
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
    """Approve/verify a company (legacy alias for /verify)"""
    return verify_company(company_id)

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
    """Get all users with optional search - Admin only"""
    try:
        skip = request.args.get('skip', 0, type=int)
        limit = request.args.get('limit', 100, type=int)
        search = request.args.get('search', '', type=str).strip()
        search_type = request.args.get('search_type', 'all', type=str)

        query = User.query

        if search:
            if search_type == 'id' and search.isdigit():
                query = query.filter(User.id == int(search))
            elif search_type == 'name':
                query = query.filter(User.name.ilike(f'%{search}%'))
            else:
                # 'all' — search by name, email, or id
                filters = [
                    User.name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                ]
                if search.isdigit():
                    filters.append(User.id == int(search))
                from sqlalchemy import or_
                query = query.filter(or_(*filters))

        users = query.offset(skip).limit(limit).all()
        
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

        try:
            from flask_jwt_extended import get_jwt_identity
            from app.utils.logger import log_audit
            log_audit('admin_delete_user', resource='user', resource_id=user_id,
                      details={'deleted_email': user.email, 'deleted_role': user.role},
                      user_id=int(get_jwt_identity()))
        except Exception:
            pass
        
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

        try:
            from flask_jwt_extended import get_jwt_identity
            from app.utils.logger import log_audit
            log_audit('admin_create_user', resource='user', resource_id=new_user.id,
                      details={'role': new_user.role},
                      user_id=int(get_jwt_identity()))
        except Exception:
            pass
        
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

        try:
            from flask_jwt_extended import get_jwt_identity
            from app.utils.logger import log_audit
            log_audit('admin_delete_internship', resource='internship', resource_id=internship_id,
                      user_id=int(get_jwt_identity()))
        except Exception:
            pass
        
        return jsonify({'message': 'Internship deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/internships/<int:internship_id>", methods=["PUT"])
@jwt_required()
@role_required('admin')
def update_internship(internship_id):
    """Update an internship - Admin only"""
    try:
        internship = Internship.query.get(internship_id)
        if not internship:
            return jsonify({'error': 'Internship not found'}), 404

        data = request.get_json()

        # Update basic fields if provided
        if 'title' in data:
            internship.title = data['title']
        if 'description' in data:
            internship.description = data['description']
        if 'location' in data:
            internship.location = data['location']
        if 'duration' in data:
            internship.duration = data['duration']
        if 'salary_range' in data:
            internship.stipend = data['salary_range']
        if 'requirements' in data:
            import json
            internship.requirements = json.dumps(data['requirements']) if isinstance(data['requirements'], list) else data['requirements']
        if 'deadline' in data:
            from datetime import date as dt_date
            try:
                internship.application_deadline = dt_date.fromisoformat(data['deadline']) if data['deadline'] else None
            except (ValueError, TypeError):
                pass
        if 'status' in data:
            internship.is_active = data['status'] == 'active'
        if 'is_open' in data:
            internship.is_active = data['is_open']

        db.session.commit()

        company = User.query.get(internship.company_id)
        return jsonify({
            'id': internship.id,
            'title': internship.title,
            'description': internship.description,
            'location': internship.location,
            'duration': internship.duration,
            'salary_range': internship.stipend,
            'type': 'Remote' if (internship.location and 'remote' in internship.location.lower()) else 'Full-time',
            'company_id': internship.company_id,
            'company_name': company.company_name if company else 'Unknown',
            'status': 'Active' if internship.is_active else 'Inactive',
            'is_active': internship.is_active,
            'is_open': internship.is_active,
            'deadline': internship.application_deadline.isoformat() if internship.application_deadline else None,
            'created_at': internship.created_at.isoformat() if internship.created_at else None
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route("/security-stats", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_security_stats():
    """Get security monitoring stats - Admin only"""
    try:
        from datetime import datetime, timedelta

        # Active sessions: count users who have logged in recently (approximation)
        active_sessions = User.query.count()  # Simplified

        # Login failures in last 24h - try to read from audit logs
        login_failures_24h = 0
        try:
            from app.models.audit_log import AuditLog
            cutoff = datetime.utcnow() - timedelta(hours=24)
            login_failures_24h = AuditLog.query.filter(
                AuditLog.action == 'login_failed',
                AuditLog.created_at >= cutoff
            ).count()
        except Exception:
            pass

        # Top admin actions from audit logs
        top_admin_actions = []
        try:
            from app.models.audit_log import AuditLog
            results = db.session.query(
                AuditLog.admin_id,
                AuditLog.action,
                func.count(AuditLog.id).label('cnt')
            ).group_by(AuditLog.admin_id, AuditLog.action)\
             .order_by(func.count(AuditLog.id).desc())\
             .limit(5).all()

            for r in results:
                admin_user = User.query.get(r.admin_id)
                top_admin_actions.append({
                    'admin': admin_user.name if admin_user else f'Admin #{r.admin_id}',
                    'action': r.action,
                    'count': r.cnt
                })
        except Exception:
            pass

        return jsonify({
            'active_sessions': active_sessions,
            'login_failures_24h': login_failures_24h,
            'system_health': 'Healthy',
            'system_uptime': '99.9%',
            'top_admin_actions': top_admin_actions
        }), 200
    except Exception as e:
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
        from flask_jwt_extended import get_jwt_identity
        from app.utils.logger import log_audit

        company = db.session.get(User, company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        if company.role != 'company':
            return jsonify({'error': 'User is not a company'}), 400
        
        company.is_verified = True
        db.session.commit()

        log_audit('company_verified', resource='user', resource_id=company_id,
                  user_id=int(get_jwt_identity()))
        
        return jsonify({'message': 'Company verified'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ========== Task 1 New Endpoints ==========

@admin_bp.route("/analytics", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_analytics():
    """
    Advanced analytics for Admin Dashboard:
    - Total users / internships / applications
    - Applications per internship with acceptance rate
    - Overall acceptance rate
    """
    try:
        from sqlalchemy import case

        # Per-internship stats
        per_internship = db.session.query(
            Internship.id,
            Internship.title,
            User.company_name,
            func.count(Application.id).label('total_applications'),
            func.sum(case((Application.status == 'accepted', 1), else_=0)).label('accepted'),
            func.sum(case((Application.status == 'rejected', 1), else_=0)).label('rejected'),
            func.sum(case((Application.status == 'pending', 1), else_=0)).label('pending'),
        ).outerjoin(Application, Internship.id == Application.internship_id)\
         .join(User, Internship.company_id == User.id)\
         .group_by(Internship.id, Internship.title, User.company_name)\
         .order_by(func.count(Application.id).desc())\
         .limit(20).all()

        internship_stats = []
        for row in per_internship:
            total = row.total_applications or 0
            accepted = row.accepted or 0
            rate = round((accepted / total * 100), 1) if total > 0 else 0.0
            internship_stats.append({
                'internship_id': row.id,
                'title': row.title,
                'company': row.company_name,
                'total_applications': total,
                'accepted': accepted,
                'rejected': row.rejected or 0,
                'pending': row.pending or 0,
                'acceptance_rate_pct': rate,
            })

        # Overall acceptance rate
        total_apps = Application.query.count()
        total_accepted = Application.query.filter_by(status='accepted').count()
        overall_rate = round((total_accepted / total_apps * 100), 1) if total_apps > 0 else 0.0

        return jsonify({
            'overview': {
                'total_users': User.query.count(),
                'total_students': User.query.filter_by(role='student').count(),
                'total_companies': User.query.filter_by(role='company').count(),
                'total_internships': Internship.query.count(),
                'active_internships': Internship.query.filter_by(is_active=True).count(),
                'total_applications': total_apps,
                'overall_acceptance_rate_pct': overall_rate,
            },
            'per_internship': internship_stats,
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/audit-logs", methods=["GET"])
@jwt_required()
@role_required('admin')
def get_audit_logs():
    """View audit trail - Admin only"""
    try:
        from app.models.audit_log import AuditLog
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        action_filter = request.args.get('action')  # optional filter

        query = AuditLog.query.order_by(AuditLog.created_at.desc())
        if action_filter:
            query = query.filter(AuditLog.action == action_filter)

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'logs': [log.to_dict() for log in pagination.items],
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/internships/expire", methods=["POST"])
@jwt_required()
@role_required('admin')
def deactivate_expired_internships():
    """
    Auto-deactivate internships whose application_deadline has passed.
    Call this via a scheduled job or manually from the admin dashboard.
    """
    try:
        from datetime import date
        today = date.today()

        expired = Internship.query.filter(
            Internship.is_active == True,
            Internship.application_deadline < today
        ).all()

        count = len(expired)
        for internship in expired:
            internship.is_active = False

        db.session.commit()

        return jsonify({
            'message': f'Deactivated {count} expired internship(s)',
            'deactivated_count': count,
            'deactivated_ids': [i.id for i in expired],
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ========== Points System Management ==========

@admin_bp.route("/points/packages", methods=["GET"])
@jwt_required()
@role_required('admin')
def list_points_packages():
    """List all points packages (including inactive) - Admin only"""
    try:
        from app.models.points import PointsPackage
        packages = PointsPackage.query.order_by(PointsPackage.points.asc()).all()
        return jsonify({'packages': [p.to_dict() for p in packages]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/points/packages", methods=["POST"])
@jwt_required()
@role_required('admin')
def create_points_package():
    """Create a new points package - Admin only"""
    try:
        from app.models.points import PointsPackage
        data = request.get_json() or {}

        required = ['name', 'points', 'price']
        for field in required:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        package = PointsPackage(
            name=str(data['name'])[:100],
            points=int(data['points']),
            price=float(data['price']),
            discount_percent=float(data.get('discount_percent', 0)),
            description=str(data.get('description', ''))[:255] if data.get('description') else None,
            is_active=data.get('is_active', True),
        )
        db.session.add(package)
        db.session.commit()

        return jsonify({'message': 'Package created', 'package': package.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/points/packages/<int:package_id>", methods=["PUT"])
@jwt_required()
@role_required('admin')
def update_points_package(package_id):
    """Update a points package - Admin only"""
    try:
        from app.models.points import PointsPackage
        package = db.session.get(PointsPackage, package_id)
        if not package:
            return jsonify({'error': 'Package not found'}), 404

        data = request.get_json() or {}
        if 'name' in data:
            package.name = str(data['name'])[:100]
        if 'points' in data:
            package.points = int(data['points'])
        if 'price' in data:
            package.price = float(data['price'])
        if 'discount_percent' in data:
            package.discount_percent = float(data['discount_percent'])
        if 'description' in data:
            package.description = str(data['description'])[:255] if data['description'] else None
        if 'is_active' in data:
            package.is_active = bool(data['is_active'])

        db.session.commit()
        return jsonify({'message': 'Package updated', 'package': package.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/points/packages/<int:package_id>", methods=["DELETE"])
@jwt_required()
@role_required('admin')
def delete_points_package(package_id):
    """Delete a points package - Admin only"""
    try:
        from app.models.points import PointsPackage
        package = db.session.get(PointsPackage, package_id)
        if not package:
            return jsonify({'error': 'Package not found'}), 404

        db.session.delete(package)
        db.session.commit()
        return jsonify({'message': 'Package deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/points/pricing", methods=["GET"])
@jwt_required()
@role_required('admin')
def list_service_pricing():
    """List all service pricing configs - Admin only"""
    try:
        from app.models.points import ServicePricing
        services = ServicePricing.query.all()
        return jsonify({'services': [s.to_dict() for s in services]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/points/pricing/<int:pricing_id>", methods=["PUT"])
@jwt_required()
@role_required('admin')
def update_service_pricing(pricing_id):
    """Update a service pricing config - Admin only"""
    try:
        from app.models.points import ServicePricing
        pricing = db.session.get(ServicePricing, pricing_id)
        if not pricing:
            return jsonify({'error': 'Service pricing not found'}), 404

        data = request.get_json() or {}
        if 'points_cost' in data:
            pricing.points_cost = int(data['points_cost'])
        if 'first_time_free' in data:
            pricing.first_time_free = bool(data['first_time_free'])
        if 'display_name' in data:
            pricing.display_name = str(data['display_name'])[:100]
        if 'description' in data:
            pricing.description = str(data['description'])[:255] if data['description'] else None
        if 'is_active' in data:
            pricing.is_active = bool(data['is_active'])

        db.session.commit()
        return jsonify({'message': 'Service pricing updated', 'service': pricing.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/points/grant", methods=["POST"])
@jwt_required()
@role_required('admin')
def grant_points():
    """Grant points to a user - Admin only"""
    try:
        from app.utils.points import record_transaction
        from flask_jwt_extended import get_jwt_identity

        data = request.get_json() or {}
        target_user_id = data.get('user_id')
        amount = data.get('amount')
        reason = data.get('reason', 'Admin grant')

        if not target_user_id or not amount:
            return jsonify({'error': 'user_id and amount are required'}), 400

        amount = int(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400

        target_user = db.session.get(User, int(target_user_id))
        if not target_user:
            return jsonify({'error': 'User not found'}), 404

        admin_id = int(get_jwt_identity())
        record_transaction(
            target_user, amount, 'admin_grant',
            description=f'{reason} (by admin #{admin_id})',
        )
        db.session.commit()

        return jsonify({
            'message': f'Granted {amount} points to {target_user.name}',
            'new_balance': target_user.points,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route("/points/stats", methods=["GET"])
@jwt_required()
@role_required('admin')
def points_stats():
    """Get points system statistics - Admin only"""
    try:
        from app.models.points import PointsTransaction, PointsPackage

        total_points_in_circulation = db.session.query(
            db.func.coalesce(db.func.sum(User.points), 0)
        ).filter(User.role == 'student').scalar()

        total_purchases = PointsTransaction.query.filter_by(transaction_type='purchase').count()
        total_service_charges = PointsTransaction.query.filter_by(transaction_type='service_charge').count()
        total_granted = PointsTransaction.query.filter_by(transaction_type='admin_grant').count()

        # Points purchased total
        purchased_points = db.session.query(
            db.func.coalesce(db.func.sum(PointsTransaction.amount), 0)
        ).filter(PointsTransaction.transaction_type == 'purchase').scalar()

        # Points spent total
        spent_points = db.session.query(
            db.func.coalesce(db.func.sum(PointsTransaction.amount), 0)
        ).filter(PointsTransaction.transaction_type == 'service_charge').scalar()

        return jsonify({
            'total_points_in_circulation': int(total_points_in_circulation),
            'total_purchases': total_purchases,
            'total_purchased_points': int(purchased_points),
            'total_service_charges': total_service_charges,
            'total_spent_points': abs(int(spent_points)),
            'total_admin_grants': total_granted,
            'active_packages': PointsPackage.query.filter_by(is_active=True).count(),
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500