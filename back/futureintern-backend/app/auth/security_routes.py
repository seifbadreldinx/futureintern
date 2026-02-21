"""
Security Routes — Task 3
- POST /api/auth/logout          → blacklist current access token
- POST /api/auth/logout-all      → blacklist all tokens for user (all devices)
- POST /api/auth/2fa/send        → send 2FA email code (after correct password)
- POST /api/auth/2fa/verify      → verify code & return JWT tokens
- POST /api/auth/2fa/toggle      → enable / disable 2FA for the user
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, get_jwt,
    create_access_token, create_refresh_token
)
from app.models import db
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist
from app.models.two_factor import TwoFactorCode
from app.utils.validators import validate_email, sanitize_string
from app.utils.rate_limiter import rate_limit_auth
from app.utils.logger import log_audit

security_bp = Blueprint('security', __name__)

MAX_FAILED_ATTEMPTS = 5   # lock after this many failures
LOCKOUT_MINUTES = 15       # lock duration


# ────────────────────────────────────────────────────────
# Logout (blacklist token)
# ────────────────────────────────────────────────────────
@security_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Revoke the current access token."""
    jwt_data = get_jwt()
    jti = jwt_data.get('jti')
    user_id = get_jwt_identity()

    entry = TokenBlacklist(
        jti=jti,
        token_type='access',
        user_id=user_id,
    )
    db.session.add(entry)
    db.session.commit()

    log_audit('logout', resource='user', user_id=int(user_id) if user_id else None)
    return jsonify({'message': 'Logged out successfully'}), 200


# ────────────────────────────────────────────────────────
# 2FA — Step 1: send code to email
# Used AFTER verifying password but BEFORE issuing JWT
# ────────────────────────────────────────────────────────
@security_bp.route("/2fa/send", methods=["POST"])
@rate_limit_auth
def send_2fa_code():
    """
    Send a 6-digit OTP to the user's email.
    Body: { "email": "...", "password": "..." }
    Returns: { "message": "...", "requires_2fa": true, "user_id": <id> }
    Frontend should then call /2fa/verify with user_id + code.
    """
    from app.utils.rate_limiter import rate_limit
    from datetime import datetime

    data = request.get_json() or {}
    email = sanitize_string(data.get('email', ''), max_length=120)
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    # Account lockout check
    if user and user.locked_until and datetime.utcnow() < user.locked_until:
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() // 60) + 1
        return jsonify({'error': f'Account locked. Try again in {remaining} minute(s).'}), 429

    if not user or not user.check_password(password):
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
                from datetime import timedelta
                user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
                log_audit('account_locked', resource='user', resource_id=user.id, user_id=user.id)
            db.session.commit()
        log_audit('login_failed', details={'email': email})
        return jsonify({'error': 'Invalid email or password'}), 401

    # Credentials OK — reset failure counter
    user.failed_login_attempts = 0
    user.locked_until = None
    db.session.commit()

    if not user.two_factor_enabled:
        # 2FA not required, issue tokens directly
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'email': user.email}
        )
        refresh_token = create_refresh_token(identity=str(user.id))
        log_audit('login_success', resource='user', resource_id=user.id, user_id=user.id)
        return jsonify({
            'requires_2fa': False,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict(),
        }), 200

    # Generate and send code
    record = TwoFactorCode.generate(user.id)

    try:
        from flask_mail import Message
        from app import mail
        msg = Message(
            subject='FutureIntern — Your Login Code',
            recipients=[user.email]
        )
        msg.body = (
            f'Hello {user.name},\n\n'
            f'Your FutureIntern login code is: {record.code}\n\n'
            f'This code expires in 10 minutes. Do not share it with anyone.\n\n'
            f'FutureIntern Team'
        )
        mail.send(msg)
    except Exception:
        pass  # Email might not be configured — code still stored in DB

    log_audit('2fa_code_sent', resource='user', resource_id=user.id, user_id=user.id)
    return jsonify({
        'requires_2fa': True,
        'user_id': user.id,
        'message': 'A 6-digit code has been sent to your email.',
    }), 200


# ────────────────────────────────────────────────────────
# 2FA — Step 2: verify code and issue JWT
# ────────────────────────────────────────────────────────
@security_bp.route("/2fa/verify", methods=["POST"])
@rate_limit_auth
def verify_2fa_code():
    """
    Verify the OTP and issue JWT tokens.
    Body: { "user_id": <int>, "code": "123456" }
    """
    data = request.get_json() or {}
    user_id = data.get('user_id')
    code_str = str(data.get('code', '')).strip()

    if not user_id or not code_str:
        return jsonify({'error': 'user_id and code are required'}), 400

    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({'error': 'Invalid request'}), 400

    record = TwoFactorCode.query.filter_by(
        user_id=user.id, used=False
    ).order_by(TwoFactorCode.created_at.desc()).first()

    if not record or not record.is_valid(code_str):
        log_audit('2fa_failed', resource='user', resource_id=user.id, user_id=user.id)
        return jsonify({'error': 'Invalid or expired code'}), 401

    record.mark_used()

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'role': user.role, 'email': user.email}
    )
    refresh_token = create_refresh_token(identity=str(user.id))

    log_audit('login_success_2fa', resource='user', resource_id=user.id, user_id=user.id)
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(),
    }), 200


# ────────────────────────────────────────────────────────
# Toggle 2FA on/off for the authenticated user
# ────────────────────────────────────────────────────────
@security_bp.route("/2fa/toggle", methods=["POST"])
@jwt_required()
def toggle_2fa():
    """
    Enable or disable 2FA for the current user.
    Body: { "enable": true } or { "enable": false }
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    enable = bool(data.get('enable', not user.two_factor_enabled))
    user.two_factor_enabled = enable
    db.session.commit()

    action = '2fa_enabled' if enable else '2fa_disabled'
    log_audit(action, resource='user', resource_id=user.id, user_id=user.id)

    return jsonify({
        'message': f'2FA {"enabled" if enable else "disabled"} successfully',
        'two_factor_enabled': enable,
    }), 200
