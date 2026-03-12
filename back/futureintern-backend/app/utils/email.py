"""
Email helpers — supports Brevo, Resend (HTTP APIs, work on Railway) with Flask-Mail fallback.

Every send function returns ``(success: bool, error: str | None)`` so
callers can decide how to handle SMTP failures (graceful fallback).
"""

from flask import current_app
import requests as http_requests


def _get_frontend_url():
    origins = current_app.config.get('CORS_ORIGINS', ['http://localhost:5173'])
    valid_origins = [o for o in origins if o and o != '*']
    return valid_origins[0] if valid_origins else 'http://localhost:5173'


def _send_via_brevo(to_email: str, subject: str, html: str, text: str):
    """Send via Brevo (formerly Sendinblue) HTTP API. Returns (ok, error)."""
    api_key = current_app.config.get('BREVO_API_KEY') or ''
    sender_email = current_app.config.get('BREVO_SENDER_EMAIL', '')
    sender_name = current_app.config.get('BREVO_SENDER_NAME', 'FutureIntern')
    try:
        resp = http_requests.post(
            'https://api.brevo.com/v3/smtp/email',
            headers={'api-key': api_key, 'Content-Type': 'application/json'},
            json={
                'sender': {'name': sender_name, 'email': sender_email},
                'to': [{'email': to_email}],
                'subject': subject,
                'htmlContent': html,
                'textContent': text,
            },
            timeout=15,
        )
        if resp.status_code in (200, 201):
            return True, None
        return False, f'Brevo error {resp.status_code}: {resp.text}'
    except Exception as exc:
        return False, str(exc)


def _send_via_resend(to_email: str, subject: str, html: str, text: str):
    """Send via Resend HTTP API. Returns (ok, error)."""
    api_key = current_app.config.get('RESEND_API_KEY') or ''
    sender = current_app.config.get('RESEND_FROM', 'FutureIntern <onboarding@resend.dev>')
    try:
        resp = http_requests.post(
            'https://api.resend.com/emails',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={'from': sender, 'to': [to_email], 'subject': subject, 'html': html, 'text': text},
            timeout=15,
        )
        if resp.status_code in (200, 201):
            return True, None
        return False, f'Resend error {resp.status_code}: {resp.text}'
    except Exception as exc:
        return False, str(exc)


def _send_via_smtp(msg):
    """Send via Flask-Mail (SMTP). Returns (ok, error)."""
    import socket
    old_timeout = socket.getdefaulttimeout()
    try:
        socket.setdefaulttimeout(10)
        from app import mail
        mail.send(msg)
        return True, None
    except Exception as exc:
        current_app.logger.warning('SMTP send failed: %s', exc)
        return False, str(exc)
    finally:
        socket.setdefaulttimeout(old_timeout)


def _send(to_email: str, subject: str, html: str, text: str, flask_mail_msg=None):
    """Try Brevo, then Resend, then SMTP."""
    if current_app.config.get('BREVO_API_KEY'):
        ok, err = _send_via_brevo(to_email, subject, html, text)
        if ok:
            return True, None
        current_app.logger.warning('Brevo failed: %s — trying next provider', err)
    if current_app.config.get('RESEND_API_KEY'):
        ok, err = _send_via_resend(to_email, subject, html, text)
        if ok:
            return True, None
        current_app.logger.warning('Resend failed: %s — trying SMTP fallback', err)
    if flask_mail_msg is not None:
        return _send_via_smtp(flask_mail_msg)
    return False, 'No email provider configured'


def send_verification_email(user, raw_token: str):
    """Send an account-verification email to *user*. Returns (success, error)."""
    from flask_mail import Message

    frontend_url = _get_frontend_url()
    verify_link = f"{frontend_url}/verify-email?token={raw_token}"

    subject = 'Verify Your Email — FutureIntern'
    text = (
        f"Hello {user.name},\n\n"
        f"Thank you for registering on FutureIntern!\n"
        f"Please verify your email by visiting:\n\n"
        f"{verify_link}\n\n"
        f"This link expires in 24 hours.\n\n"
        f"— FutureIntern Team"
    )
    html = (
        f"<h2>Welcome to FutureIntern!</h2>"
        f"<p>Hello {user.name},</p>"
        f"<p>Thank you for registering. Please verify your email address:</p>"
        f'<p><a href="{verify_link}" style="display:inline-block;padding:12px 24px;'
        f'background-color:#f43f5e;color:#fff;text-decoration:none;border-radius:8px;'
        f'font-weight:bold;">Verify Email</a></p>'
        f"<p>Or copy this link: {verify_link}</p>"
        f"<p><small>Expires in 24 hours.</small></p>"
        f"<p>— FutureIntern Team</p>"
    )

    msg = Message(subject=subject, recipients=[user.email], body=text, html=html)
    return _send(user.email, subject, html, text, flask_mail_msg=msg)


def send_password_reset_email(user, raw_token: str):
    """Send a password-reset email to *user*. Returns (success, error)."""
    from flask_mail import Message

    frontend_url = _get_frontend_url()
    reset_link = f"{frontend_url}/reset-password?token={raw_token}"

    subject = 'Reset Your Password — FutureIntern'
    text = (
        f"Hello {user.name},\n\n"
        f"You requested a password reset for your FutureIntern account.\n"
        f"Click the link below to reset your password:\n\n"
        f"{reset_link}\n\n"
        f"This link expires in 1 hour. If you did not request this, ignore this email.\n\n"
        f"— FutureIntern Team"
    )
    html = (
        f"<h2>Reset Your Password</h2>"
        f"<p>Hello {user.name},</p>"
        f"<p>You requested a password reset. Click the button below:</p>"
        f'<p><a href="{reset_link}" style="display:inline-block;padding:12px 24px;'
        f'background-color:#f43f5e;color:#fff;text-decoration:none;border-radius:8px;'
        f'font-weight:bold;">Reset Password</a></p>'
        f"<p>Or copy this link: {reset_link}</p>"
        f"<p><small>Expires in 1 hour.</small></p>"
        f"<p>— FutureIntern Team</p>"
    )

    msg = Message(subject=subject, recipients=[user.email], body=text, html=html)
    return _send(user.email, subject, html, text, flask_mail_msg=msg)
