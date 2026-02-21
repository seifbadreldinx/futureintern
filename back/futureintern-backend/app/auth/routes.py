import os
import requests as http_requests
from flask import Blueprint, request, jsonify, current_app, url_for
from app.models import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from datetime import timedelta
from itsdangerous import URLSafeTimedSerializer
from app.utils.validators import validate_email, validate_password, sanitize_string
from app.utils.rate_limiter import rate_limit_auth
from app.utils.logger import log_audit

auth_bp = Blueprint("auth", __name__)

def get_serializer():
    return URLSafeTimedSerializer(current_app.config['JWT_SECRET_KEY'])

@auth_bp.route("/forgot-password", methods=["POST"])
@rate_limit_auth
def forgot_password():
    try:
        data = request.get_json()
        email = sanitize_string(data.get('email', ''), max_length=120)
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user:
            # Don't reveal user existence
            return jsonify({'message': 'If your email is registered, you will receive a reset link.'}), 200
            
        s = get_serializer()
        token = s.dumps(user.email, salt='recover-key')
        
        # Generate reset link
        # Adjust for frontend URL if running separately (e.g. localhost:5173)
        frontend_url = current_app.config.get('CORS_ORIGINS', ['http://localhost:5173'])[0]
        reset_link = f"{frontend_url}/reset-password?token={token}"
        
        # Send Email
        from flask_mail import Message
        from app import mail
        
        msg = Message("Reset Your Password - FutureIntern",
                      recipients=[email])
        msg.body = f"""Hello,

You requested a password reset for your FutureIntern account.
Please click the link below to reset your password:

{reset_link}

If you did not request this, please ignore this email.
The link will expire in 1 hour.

Best regards,
FutureIntern Team
"""
        mail.send(msg)
        
        return jsonify({'message': 'If your email is registered, you will receive a reset link.'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route("/reset-password", methods=["POST"])
@rate_limit_auth
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        password = data.get('password')
        
        if not token or not password:
            return jsonify({'error': 'Token and password are required'}), 400
        
        # Validate password strength
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
            
        s = get_serializer()
        try:
            email = s.loads(token, salt='recover-key', max_age=3600) # 1 hour expiration
        except Exception:
            return jsonify({'error': 'Invalid or expired token'}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        user.set_password(password)
        db.session.commit()
        log_audit('password_reset', resource='user', resource_id=user.id, user_id=user.id)
        
        return jsonify({'message': 'Password reset successful'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route("/")
def index():
    return jsonify({"message": "Auth API - Endpoints: /register, /login, /refresh"})

# ========== Task 2.2: Register API ==========

@auth_bp.route("/register/student", methods=["POST"])
def register_student():
    """
    Register Student
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - email
            - password
            - university
            - major
          properties:
            name:
              type: string
              example: Ahmed Ali
            email:
              type: string
              example: student@example.com
            password:
              type: string
              example: password123
            university:
              type: string
              example: Cairo University
            major:
              type: string
              example: Computer Science
    responses:
      201:
        description: Student registered successfully
      400:
        description: Validation error
    """
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['name', 'email', 'password', 'university', 'major']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Sanitize inputs
        email = sanitize_string(data['email'], max_length=120)
        name = sanitize_string(data['name'], max_length=100)
        university = sanitize_string(data['university'], max_length=100)
        major = sanitize_string(data['major'], max_length=100)
        
        # Validate email
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        is_valid, error_msg = validate_password(data['password'])
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new student
        user = User(
            name=name,
            email=email,
            role='student',
            university=university,
            major=major
        )
        user.set_password(data['password'])  # Hash password
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Student registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route("/register/company", methods=["POST"])
def register_company():
    """تسجيل شركة جديدة"""
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['name', 'email', 'password', 'company_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Sanitize inputs
        email = sanitize_string(data['email'], max_length=120)
        name = sanitize_string(data['name'], max_length=100)
        company_name = sanitize_string(data['company_name'], max_length=100)
        
        # Validate email
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        is_valid, error_msg = validate_password(data['password'])
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new company
        user = User(
            name=name,
            email=email,
            role='company',
            company_name=company_name
        )
        user.set_password(data['password'])  # Hash password
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Company registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ========== Task 2.3: Login API & JWT ==========

@auth_bp.route("/login", methods=["POST"])
@rate_limit_auth
def login():
    """
    User Login
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: password123
    responses:
      200:
        description: Login successful
      401:
        description: Invalid credentials
    """
    try:
        data = request.get_json()
        
        # Sanitize inputs
        email = sanitize_string(data.get('email', ''), max_length=120)
        password = data.get('password', '')
        
        # Validation
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        # Check credentials
        if not user or not user.check_password(password):
            log_audit('login_failed', resource='user', details={'email': email})
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create JWT tokens with role (identity must be string for JWT 4.7.1)
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'email': user.email}
        )
        
        refresh_token = create_refresh_token(
            identity=str(user.id)
        )

        log_audit('login_success', resource='user', resource_id=user.id, user_id=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh token rotation — blacklist old refresh token, issue new pair"""
    try:
        from app.models.token_blacklist import TokenBlacklist

        current_user_id = int(get_jwt_identity())
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Blacklist the current refresh token so it cannot be reused
        jwt_data = get_jwt()
        old_jti = jwt_data.get('jti')
        if old_jti:
            entry = TokenBlacklist(
                jti=old_jti,
                token_type='refresh',
                user_id=current_user_id,
            )
            db.session.add(entry)

        # Issue a fresh access + refresh token pair
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'email': user.email}
        )
        refresh_token = create_refresh_token(identity=str(user.id))

        db.session.commit()
        log_audit('token_refresh', resource='user', resource_id=user.id, user_id=user.id)

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """الحصول على معلومات المستخدم الحالي"""
    try:
        current_user_id = int(get_jwt_identity())
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ────────────────────────────────────────────────────────
# Google OAuth Login / Register
# ────────────────────────────────────────────────────────
@auth_bp.route("/google", methods=["POST"])
def google_auth():
    """
    Authenticate with Google. Frontend sends the Google credential (ID token).
    We verify it with Google and either login or create a new user.
    """
    try:
        data = request.get_json()
        google_token = data.get('credential')

        if not google_token:
            return jsonify({'error': 'Google credential is required'}), 400

        # Verify the token with Google
        google_response = http_requests.get(
            f'https://oauth2.googleapis.com/tokeninfo?id_token={google_token}'
        )

        if google_response.status_code != 200:
            return jsonify({'error': 'Invalid Google token'}), 401

        google_data = google_response.json()
        google_id = google_data.get('sub')
        email = google_data.get('email')
        name = google_data.get('name', email.split('@')[0])

        if not google_id or not email:
            return jsonify({'error': 'Could not retrieve Google account info'}), 400

        # Check if user exists by google_id or email
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            user = User.query.filter_by(email=email).first()

        if user:
            # Existing user — link Google account if not already linked
            if not user.google_id:
                user.google_id = google_id
                user.auth_provider = 'google'
                db.session.commit()
        else:
            # New user — create account automatically
            user = User(
                name=name,
                email=email,
                role='student',
                google_id=google_id,
                auth_provider='google'
            )
            db.session.add(user)
            db.session.commit()

        # Issue JWT tokens
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'email': user.email}
        )
        refresh_token = create_refresh_token(identity=str(user.id))

        log_audit('google_login', resource='user', resource_id=user.id, user_id=user.id)

        return jsonify({
            'message': 'Google login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
