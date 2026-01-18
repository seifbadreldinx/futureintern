from flask import Blueprint, request, jsonify, current_app, url_for
from app.models import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import timedelta
from itsdangerous import URLSafeTimedSerializer

auth_bp = Blueprint("auth", __name__)

def get_serializer():
    return URLSafeTimedSerializer(current_app.config['JWT_SECRET_KEY'])

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
            
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
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        password = data.get('password')
        
        if not token or not password:
            return jsonify({'error': 'Token and password are required'}), 400
            
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
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new student
        user = User(
            name=data['name'],
            email=data['email'],
            role='student',
            university=data['university'],
            major=data['major']
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
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new company
        user = User(
            name=data['name'],
            email=data['email'],
            role='company',
            company_name=data['company_name']
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
        
        # Validation
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        
        # Check credentials
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create JWT tokens with role (identity must be string for JWT 4.7.1)
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'email': user.email}
        )
        
        refresh_token = create_refresh_token(
            identity=str(user.id)
        )
        
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
    """تجديد Access Token باستخدام Refresh Token"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create new access token
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'email': user.email}
        )
        
        return jsonify({
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """الحصول على معلومات المستخدم الحالي"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
