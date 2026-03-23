import os
import requests as http_requests
from flask import Blueprint, request, jsonify, current_app, url_for
from app.models import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from datetime import timedelta
from app.utils.validators import validate_email, validate_password, sanitize_string
from app.utils.rate_limiter import rate_limit_auth
from app.utils.logger import log_audit

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/forgot-password", methods=["POST"])
@rate_limit_auth
def forgot_password():
    try:
        from app.models.password_reset import PasswordResetToken
        from app.utils.email import send_password_reset_email

        data = request.get_json()
        email = sanitize_string(data.get('email', ''), max_length=120)
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'No account found with this email.', 'not_registered': True}), 404

        # Create single-use token (invalidates previous tokens for this user)
        raw_token, _record = PasswordResetToken.create_for_user(user.id)
        db.session.commit()

        # Send email — log errors but always return success (security + UX)
        success, _err = send_password_reset_email(user, raw_token)
        if not success:
            current_app.logger.error('Password reset email failed for user %s: %s', user.id, _err)
            # Still return success — don't reveal email/provider issues to users
            # Check Railway logs for the actual error message

        return jsonify({'message': 'If your email is registered, you will receive a reset link.'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route("/reset-password", methods=["POST"])
@rate_limit_auth
def reset_password():
    try:
        from app.models.password_reset import PasswordResetToken

        data = request.get_json()
        token = data.get('token')
        password = data.get('password')
        
        if not token or not password:
            return jsonify({'error': 'Token and password are required'}), 400
        
        # Validate password strength
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Look up by hash
        token_hash = PasswordResetToken.hash_token(token)
        record = PasswordResetToken.query.filter_by(token_hash=token_hash).first()

        if not record or not record.is_valid():
            return jsonify({'error': 'Invalid or expired token'}), 400

        user = db.session.get(User, record.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        user.set_password(password)
        record.mark_used()
        db.session.commit()
        log_audit('password_reset', resource='user', resource_id=user.id, user_id=user.id)
        
        return jsonify({'message': 'Password reset successful'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route("/")
def index():
    return jsonify({"message": "Auth API - Endpoints: /register, /login, /refresh"})


# ========== Email Verification ==========

@auth_bp.route("/verify-email", methods=["POST"])
def verify_email():
    """Verify a user's email address using the token from the verification email."""
    try:
        from app.models.email_verification import EmailVerificationToken

        data = request.get_json() or {}
        raw_token = data.get('token', '').strip()

        if not raw_token:
            return jsonify({'error': 'Verification token is required'}), 400

        token_hash = EmailVerificationToken.hash_token(raw_token)
        record = EmailVerificationToken.query.filter_by(token_hash=token_hash).first()

        if not record or not record.is_valid():
            return jsonify({'error': 'Invalid or expired verification link'}), 400

        user = db.session.get(User, record.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.email_verified = True
        record.mark_used()
        db.session.commit()

        log_audit('email_verified', resource='user', resource_id=user.id, user_id=user.id)
        return jsonify({'message': 'Email verified successfully. You can now log in.'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route("/resend-verification", methods=["POST"])
@rate_limit_auth
def resend_verification():
    """Resend the email verification link. Rate-limited to prevent abuse."""
    try:
        from app.models.email_verification import EmailVerificationToken
        from app.utils.email import send_verification_email

        data = request.get_json() or {}
        email = sanitize_string(data.get('email', ''), max_length=120)

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400

        # Don't reveal user existence (same message regardless)
        user = User.query.filter_by(email=email).first()
        if not user or user.email_verified:
            return jsonify({'message': 'If the email is registered and unverified, a new link has been sent.'}), 200

        raw_token, _record = EmailVerificationToken.create_for_user(user.id)
        db.session.commit()

        success, _err = send_verification_email(user, raw_token)
        if not success:
            current_app.logger.warning('Resend verification email failed for user %s', user.id)

        return jsonify({'message': 'If the email is registered and unverified, a new link has been sent.'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


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
        
        # Create new student with signup bonus
        user = User(
            name=name,
            email=email,
            role='student',
            university=university,
            major=major,
            points=0,
            email_verified=False,
        )
        user.set_password(data['password'])  # Hash password
        
        db.session.add(user)
        db.session.flush()  # get user.id before recording transaction

        from app.utils.points import grant_signup_bonus
        grant_signup_bonus(user, bonus=50)

        # Send verification email (graceful fallback)
        from app.models.email_verification import EmailVerificationToken
        from app.utils.email import send_verification_email
        raw_token, _record = EmailVerificationToken.create_for_user(user.id)
        db.session.commit()

        email_sent = True
        success, _err = send_verification_email(user, raw_token)
        if not success:
            email_sent = False
            current_app.logger.warning('Verification email failed for user %s', user.id)

        log_audit('register_student', resource='user', resource_id=user.id, user_id=user.id)

        return jsonify({
            'message': 'Student registered successfully. Please check your email to verify your account.',
            'user': user.to_dict(),
            'email_sent': email_sent,
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
            company_name=company_name,
            email_verified=False,
        )
        user.set_password(data['password'])  # Hash password
        
        db.session.add(user)
        db.session.flush()

        # Send verification email (graceful fallback)
        from app.models.email_verification import EmailVerificationToken
        from app.utils.email import send_verification_email
        raw_token, _record = EmailVerificationToken.create_for_user(user.id)
        db.session.commit()

        email_sent = True
        success, _err = send_verification_email(user, raw_token)
        if not success:
            email_sent = False
            current_app.logger.warning('Verification email failed for user %s', user.id)

        log_audit('register_company', resource='user', resource_id=user.id, user_id=user.id)

        return jsonify({
            'message': 'Company registered successfully. Please check your email to verify your account.',
            'user': user.to_dict(),
            'email_sent': email_sent,
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
        from datetime import datetime as dt
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

        # ── Account lockout check ──
        if user and user.locked_until and user.locked_until > dt.utcnow():
            remaining = int((user.locked_until - dt.utcnow()).total_seconds() // 60) + 1
            log_audit('login_locked', resource='user', resource_id=user.id,
                      details={'email': email}, user_id=user.id)
            return jsonify({
                'error': f'Account locked due to too many failed attempts. Try again in {remaining} minute(s).'
            }), 429

        # ── Credential check ──
        if not user or not user.check_password(password):
            if user:
                user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                if user.failed_login_attempts >= 5:
                    user.locked_until = dt.utcnow() + timedelta(minutes=15)
                    user.failed_login_attempts = 0
                    db.session.commit()
                    log_audit('login_failed', resource='user', resource_id=user.id,
                              details={'email': email, 'reason': 'account_locked'}, user_id=user.id)
                    return jsonify({'error': 'Too many failed attempts. Account locked for 15 minutes.'}), 429
                db.session.commit()
            log_audit('login_failed', resource='user', details={'email': email})
            return jsonify({'error': 'Invalid email or password'}), 401

        # ── Successful login: reset lockout counters ──
        user.failed_login_attempts = 0
        user.locked_until = None
        db.session.commit()

        # ── Email verification check (local accounts only) ──
        if user.auth_provider == 'local' and not user.email_verified:
            return jsonify({
                'error': 'Please verify your email address before logging in.',
                'needs_verification': True,
                'email': user.email,
            }), 403

        # ── 2FA check ──
        if user.two_factor_enabled:
            from app.models.two_factor import TwoFactorCode
            from app.utils.email import send_2fa_email
            code_entry = TwoFactorCode.generate(user.id)
            try:
                send_2fa_email(user, code_entry.code)
            except Exception:
                pass  # Fail silently — code is still in DB
            log_audit('2fa_code_sent', resource='user', resource_id=user.id, user_id=user.id)
            return jsonify({
                'requires_2fa': True,
                'user_id': user.id,
                'message': 'Verification code sent to your email.'
            }), 200

        # ── Daily login reward ──
        daily_reward_info = None
        if user.role == 'student':
            from app.utils.points import process_daily_login
            daily_reward_info = process_daily_login(user)
            db.session.commit()

        # ── Issue JWT tokens ──
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'email': user.email}
        )
        refresh_token = create_refresh_token(identity=str(user.id))

        log_audit('login_success', resource='user', resource_id=user.id, user_id=user.id)

        response = {
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }
        if daily_reward_info:
            response['daily_reward'] = daily_reward_info

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/verify-2fa', methods=['POST'])
@rate_limit_auth
def verify_2fa():
    """Verify the 2FA email code and issue JWT tokens."""
    try:
        from app.models.two_factor import TwoFactorCode
        data = request.get_json() or {}
        user_id = data.get('user_id')
        code_str = str(data.get('code', '')).strip()

        if not user_id or not code_str:
            return jsonify({'error': 'user_id and code are required'}), 400

        user = db.session.get(User, int(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404

        entry = TwoFactorCode.query.filter_by(
            user_id=user.id, used=False
        ).order_by(TwoFactorCode.created_at.desc()).first()

        if not entry or not entry.is_valid(code_str):
            log_audit('2fa_failed', resource='user', resource_id=user.id, user_id=user.id)
            return jsonify({'error': 'Invalid or expired verification code'}), 401

        entry.mark_used()

        # ── Daily login reward ──
        daily_reward_info = None
        if user.role == 'student':
            from app.utils.points import process_daily_login
            daily_reward_info = process_daily_login(user)
            db.session.commit()

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'email': user.email}
        )
        refresh_token = create_refresh_token(identity=str(user.id))

        log_audit('2fa_success', resource='user', resource_id=user.id, user_id=user.id)

        response = {
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }
        if daily_reward_info:
            response['daily_reward'] = daily_reward_info

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Blacklist the current access token so it cannot be reused after logout."""
    try:
        from app.models.token_blacklist import TokenBlacklist
        jwt_data = get_jwt()
        jti = jwt_data.get('jti')
        user_id = get_jwt_identity()

        if jti:
            entry = TokenBlacklist(
                jti=jti,
                token_type='access',
                user_id=int(user_id) if user_id else None,
            )
            db.session.add(entry)
            db.session.commit()

        log_audit('logout', resource='user', resource_id=int(user_id) if user_id else None,
                  user_id=int(user_id) if user_id else None)

        return jsonify({'message': 'Logged out successfully'}), 200

    except Exception as e:
        db.session.rollback()
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
        google_access_token = data.get('access_token')

        if not google_token and not google_access_token:
            return jsonify({'error': 'Google credential or access_token is required'}), 400

        if google_access_token:
            # Verify via Google userinfo endpoint (implicit flow)
            google_response = http_requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {google_access_token}'}
            )
            if google_response.status_code != 200:
                return jsonify({'error': 'Invalid Google access token'}), 401
            google_data = google_response.json()
            google_id = google_data.get('sub')
            email = google_data.get('email')
            name = google_data.get('name', email.split('@')[0] if email else 'User')
        else:
            # Verify the id_token with Google
            google_response = http_requests.get(
                f'https://oauth2.googleapis.com/tokeninfo?id_token={google_token}'
            )
            if google_response.status_code != 200:
                return jsonify({'error': 'Invalid Google token'}), 401
            google_data = google_response.json()
            google_id = google_data.get('sub')
            email = google_data.get('email')
            name = google_data.get('name', email.split('@')[0] if email else 'User')

        if not google_id or not email:
            return jsonify({'error': 'Could not retrieve Google account info'}), 400

        # Check if user exists by google_id or email
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            user = User.query.filter_by(email=email).first()

        # Validate audience claim to prevent token substitution (id_token only)
        if google_token:
            expected_client_id = current_app.config.get('GOOGLE_CLIENT_ID', '')
            token_aud = google_data.get('aud', '')
            if expected_client_id and token_aud != expected_client_id:
                return jsonify({'error': 'Invalid Google token audience'}), 401

        if user:
            # Existing user — link Google account if not already linked
            if not user.google_id:
                user.google_id = google_id
                user.auth_provider = 'google'
            user.email_verified = True  # Google verifies email
            db.session.commit()
        else:
            # New user — create account automatically with signup bonus
            from werkzeug.security import generate_password_hash
            import secrets
            user = User(
                name=name,
                email=email,
                password_hash=generate_password_hash(secrets.token_urlsafe(32)),
                role='student',
                google_id=google_id,
                auth_provider='google',
                email_verified=True,  # Google verifies email
                points=0
            )
            db.session.add(user)
            db.session.flush()

            from app.utils.points import grant_signup_bonus
            grant_signup_bonus(user, bonus=50)
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
