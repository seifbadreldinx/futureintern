"""
Email helpers — centralised wrappers around Flask-Mail.

Every send function returns ``(success: bool, error: str | None)`` so
callers can decide how to handle SMTP failures (graceful fallback).
"""

from flask import current_app


def _send(msg):
    """Send a ``flask_mail.Message`` and return ``(ok, error)``."""
    import socket
    old_timeout = socket.getdefaulttimeout()
    try:
        socket.setdefaulttimeout(10)  # fail fast if SMTP port is blocked
        from app import mail
        mail.send(msg)
        return True, None
    except Exception as exc:
        current_app.logger.warning('Email send failed: %s', exc)
        return False, str(exc)
    finally:
        socket.setdefaulttimeout(old_timeout)


def send_verification_email(user, raw_token: str):
    """Send an account-verification email to *user*.

    Returns ``(success, error)``.
    """
    from flask_mail import Message

    origins = current_app.config.get('CORS_ORIGINS', ['http://localhost:5173'])
    valid_origins = [o for o in origins if o and o != '*']
    frontend_url = valid_origins[0] if valid_origins else 'http://localhost:5173'
    verify_link = f"{frontend_url}/verify-email?token={raw_token}"

    msg = Message(
        subject='Verify Your Email — FutureIntern',
        recipients=[user.email],
    )
    msg.body = (
        f"Hello {user.name},\n\n"
        f"Thank you for registering on FutureIntern!\n"
        f"Please verify your email address by clicking the link below:\n\n"
        f"{verify_link}\n\n"
        f"This link will expire in 24 hours.\n\n"
        f"If you did not create an account, please ignore this email.\n\n"
        f"Best regards,\n"
        f"FutureIntern Team"
    )
    msg.html = (
        f"<h2>Welcome to FutureIntern!</h2>"
        f"<p>Hello {user.name},</p>"
        f"<p>Thank you for registering. Please verify your email address by clicking the button below:</p>"
        f'<p><a href="{verify_link}" style="display:inline-block;padding:12px 24px;'
        f'background-color:#f43f5e;color:#fff;text-decoration:none;border-radius:8px;'
        f'font-weight:bold;">Verify Email</a></p>'
        f"<p>Or copy and paste this link into your browser:</p>"
        f"<p>{verify_link}</p>"
        f"<p><small>This link expires in 24 hours.</small></p>"
        f"<p>— FutureIntern Team</p>"
    )
    return _send(msg)


def send_password_reset_email(user, raw_token: str):
    """Send a password-reset email to *user*.

    Returns ``(success, error)``.
    """
    from flask_mail import Message

    origins = current_app.config.get('CORS_ORIGINS', ['http://localhost:5173'])
    # Filter out wildcard '*' which can't be used as a URL
    valid_origins = [o for o in origins if o and o != '*']
    frontend_url = valid_origins[0] if valid_origins else 'http://localhost:5173'
    reset_link = f"{frontend_url}/reset-password?token={raw_token}"

    msg = Message(
        subject='Reset Your Password — FutureIntern',
        recipients=[user.email],
    )
    msg.body = (
        f"Hello {user.name},\n\n"
        f"You requested a password reset for your FutureIntern account.\n"
        f"Please click the link below to reset your password:\n\n"
        f"{reset_link}\n\n"
        f"If you did not request this, please ignore this email.\n"
        f"The link will expire in 1 hour.\n\n"
        f"Best regards,\n"
        f"FutureIntern Team"
    )
    msg.html = (
        f"<h2>Password Reset</h2>"
        f"<p>Hello {user.name},</p>"
        f"<p>You requested a password reset. Click the button below to set a new password:</p>"
        f'<p><a href="{reset_link}" style="display:inline-block;padding:12px 24px;'
        f'background-color:#f43f5e;color:#fff;text-decoration:none;border-radius:8px;'
        f'font-weight:bold;">Reset Password</a></p>'
        f"<p>Or copy and paste this link into your browser:</p>"
        f"<p>{reset_link}</p>"
        f"<p><small>This link expires in 1 hour.</small></p>"
        f"<p>— FutureIntern Team</p>"
    )
    return _send(msg)
