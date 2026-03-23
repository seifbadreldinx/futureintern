"""
Email helpers — supports Mailjet, Brevo, Resend (HTTP APIs, work on Railway) with Flask-Mail fallback.

Priority order: Mailjet → Brevo → Resend → SMTP

Every send function returns ``(success: bool, error: str | None)`` so
callers can decide how to handle failures (graceful fallback).
"""

from flask import current_app
import requests as http_requests


def _get_frontend_url():
    origins = current_app.config.get('CORS_ORIGINS', ['http://localhost:5173'])
    valid_origins = [o for o in origins if o and o != '*']
    return valid_origins[0] if valid_origins else 'http://localhost:5173'


def _send_via_mailjet(to_email: str, to_name: str, subject: str, html: str, text: str):
    """Send via Mailjet HTTP API. Returns (ok, error).
    Free plan: 200 emails/day, sends to ANY email, no domain verification needed.
    Sign up at https://app.mailjet.com — grab API Key + Secret Key from Account > API Keys.
    """
    api_key = current_app.config.get('MAILJET_API_KEY') or ''
    api_secret = current_app.config.get('MAILJET_API_SECRET') or ''
    sender_email = current_app.config.get('MAILJET_SENDER_EMAIL') or ''
    sender_name = current_app.config.get('MAILJET_SENDER_NAME', 'FutureIntern')

    if not api_key or not api_secret or not sender_email:
        return False, 'Mailjet not configured (MAILJET_API_KEY, MAILJET_API_SECRET, MAILJET_SENDER_EMAIL required)'

    try:
        resp = http_requests.post(
            'https://api.mailjet.com/v3.1/send',
            auth=(api_key, api_secret),
            json={
                'Messages': [{
                    'From': {'Email': sender_email, 'Name': sender_name},
                    'To': [{'Email': to_email, 'Name': to_name or to_email}],
                    'Subject': subject,
                    'HTMLPart': html,
                    'TextPart': text,
                }]
            },
            timeout=15,
        )
        if resp.status_code in (200, 201):
            return True, None
        return False, f'Mailjet error {resp.status_code}: {resp.text}'
    except Exception as exc:
        return False, str(exc)


def _send_via_brevo(to_email: str, subject: str, html: str, text: str):
    """Send via Brevo (formerly Sendinblue) HTTP API. Returns (ok, error).
    Free plan: 300 emails/day. Requires sender email verification.
    Sign up at https://brevo.com
    """
    api_key = current_app.config.get('BREVO_API_KEY') or ''
    sender_email = current_app.config.get('BREVO_SENDER_EMAIL', '')
    sender_name = current_app.config.get('BREVO_SENDER_NAME', 'FutureIntern')

    if not api_key or not sender_email:
        return False, 'Brevo not configured'

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
    """Send via Resend HTTP API. Returns (ok, error).
    WARNING: free tier onboarding@resend.dev sender only delivers to your own registered email.
    For sending to any email you need a verified custom domain.
    """
    api_key = current_app.config.get('RESEND_API_KEY') or ''
    sender = current_app.config.get('RESEND_FROM', '')

    if not api_key or not sender:
        return False, 'Resend not configured'

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


def _send(to_email: str, subject: str, html: str, text: str, flask_mail_msg=None, to_name: str = ''):
    """Try Mailjet → Brevo → Resend → SMTP (in order)."""
    # 1. Mailjet (best free option — sends to any email, no domain needed)
    if current_app.config.get('MAILJET_API_KEY') and current_app.config.get('MAILJET_SENDER_EMAIL'):
        ok, err = _send_via_mailjet(to_email, to_name or to_email, subject, html, text)
        if ok:
            current_app.logger.info('Email sent via Mailjet to %s', to_email)
            return True, None
        current_app.logger.warning('Mailjet failed: %s — trying Brevo', err)

    # 2. Brevo (300/day free, needs verified sender)
    if current_app.config.get('BREVO_API_KEY') and current_app.config.get('BREVO_SENDER_EMAIL'):
        ok, err = _send_via_brevo(to_email, subject, html, text)
        if ok:
            current_app.logger.info('Email sent via Brevo to %s', to_email)
            return True, None
        current_app.logger.warning('Brevo failed: %s — trying Resend', err)

    # 3. Resend (limited to your own email on free tier without domain)
    if current_app.config.get('RESEND_API_KEY') and current_app.config.get('RESEND_FROM'):
        ok, err = _send_via_resend(to_email, subject, html, text)
        if ok:
            current_app.logger.info('Email sent via Resend to %s', to_email)
            return True, None
        current_app.logger.warning('Resend failed: %s — trying SMTP', err)

    # 4. SMTP fallback (blocked on Railway)
    if flask_mail_msg is not None:
        return _send_via_smtp(flask_mail_msg)

    return False, 'No email provider configured. Set MAILJET_API_KEY + MAILJET_API_SECRET + MAILJET_SENDER_EMAIL in Railway variables.'


def send_via_any_provider(to_email: str, to_name: str, subject: str, html: str, text: str):
    """Public helper — send an email using whichever provider is configured."""
    return _send(to_email, subject, html, text, to_name=to_name)


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
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#f43f5e;">Welcome to FutureIntern! 🚀</h2>
      <p>Hello <strong>{user.name}</strong>,</p>
      <p>Thank you for registering. Please verify your email address to get started:</p>
      <p style="text-align:center;margin:32px 0;">
        <a href="{verify_link}"
           style="display:inline-block;padding:14px 32px;background-color:#f43f5e;color:#fff;
                  text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
          Verify Email
        </a>
      </p>
      <p style="color:#666;font-size:13px;">Or copy this link:<br><a href="{verify_link}">{verify_link}</a></p>
      <p style="color:#999;font-size:12px;">This link expires in 24 hours. If you didn't register, ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#999;font-size:12px;">— FutureIntern Team</p>
    </div>
    """

    msg = Message(subject=subject, recipients=[user.email], body=text, html=html)
    return _send(user.email, subject, html, text, flask_mail_msg=msg, to_name=user.name)


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
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#f43f5e;">Reset Your Password 🔐</h2>
      <p>Hello <strong>{user.name}</strong>,</p>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <p style="text-align:center;margin:32px 0;">
        <a href="{reset_link}"
           style="display:inline-block;padding:14px 32px;background-color:#f43f5e;color:#fff;
                  text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
          Reset Password
        </a>
      </p>
      <p style="color:#666;font-size:13px;">Or copy this link:<br><a href="{reset_link}">{reset_link}</a></p>
      <p style="color:#999;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#999;font-size:12px;">— FutureIntern Team</p>
    </div>
    """

    msg = Message(subject=subject, recipients=[user.email], body=text, html=html)
    return _send(user.email, subject, html, text, flask_mail_msg=msg, to_name=user.name)


def send_2fa_email(user, code: str):
    """Send a 2FA login code email. Returns (success, error)."""
    from flask_mail import Message

    subject = 'Your FutureIntern Login Code'
    text = (
        f"Hello {user.name},\n\n"
        f"Your login verification code is: {code}\n\n"
        f"This code expires in 10 minutes. Do not share it with anyone.\n\n"
        f"— FutureIntern Team"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#f43f5e;">Login Verification Code 🔑</h2>
      <p>Hello <strong>{user.name}</strong>,</p>
      <p>Your one-time login code is:</p>
      <p style="text-align:center;margin:32px 0;">
        <span style="display:inline-block;padding:16px 40px;background:#f43f5e;color:#fff;
                     border-radius:8px;font-size:32px;font-weight:bold;letter-spacing:8px;">
          {code}
        </span>
      </p>
      <p style="color:#999;font-size:12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#999;font-size:12px;">— FutureIntern Team</p>
    </div>
    """

    msg = Message(subject=subject, recipients=[user.email], body=text, html=html)
    return _send(user.email, subject, html, text, flask_mail_msg=msg, to_name=user.name)
