"""
PasswordResetToken — single-use, time-limited password reset tokens.

Tokens are stored as SHA-256 hashes so a database leak never exposes
usable tokens.  Each token can only be used once (``used`` flag) and
expires after 1 hour.
"""

import hashlib
import secrets
from datetime import datetime, timedelta

from app.models import db


class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    token_hash = db.Column(db.String(64), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime, nullable=True)

    # ── helpers ──────────────────────────────────────────

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Return the SHA-256 hex digest of *raw_token*."""
        return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    @classmethod
    def create_for_user(cls, user_id: int, expires_hours: int = 1):
        """Generate a new reset token for *user_id*.

        Returns ``(raw_token, db_record)`` — the raw token is what goes
        into the email link; only the hash is persisted.
        """
        # Invalidate any previous unused tokens for this user
        cls.query.filter_by(user_id=user_id, used=False).update({'used': True, 'used_at': datetime.utcnow()})

        raw_token = secrets.token_urlsafe(32)
        record = cls(
            user_id=user_id,
            token_hash=cls.hash_token(raw_token),
            expires_at=datetime.utcnow() + timedelta(hours=expires_hours),
        )
        db.session.add(record)
        return raw_token, record

    def is_valid(self) -> bool:
        """``True`` if the token has not been used and has not expired."""
        return not self.used and datetime.utcnow() < self.expires_at

    def mark_used(self) -> None:
        self.used = True
        self.used_at = datetime.utcnow()
