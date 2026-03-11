"""
EmailVerificationToken — single-use, time-limited email verification tokens.

Same hashed-token pattern as PasswordResetToken.  Tokens expire after
24 hours and can only be consumed once.
"""

import hashlib
import secrets
from datetime import datetime, timedelta

from app.models import db


class EmailVerificationToken(db.Model):
    __tablename__ = 'email_verification_tokens'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    token_hash = db.Column(db.String(64), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

    # ── helpers ──────────────────────────────────────────

    @staticmethod
    def hash_token(raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    @classmethod
    def create_for_user(cls, user_id: int, expires_hours: int = 24):
        """Generate a new verification token for *user_id*.

        Returns ``(raw_token, db_record)``.
        """
        # Invalidate previous unused tokens for this user
        cls.query.filter_by(user_id=user_id, used=False).update({'used': True})

        raw_token = secrets.token_urlsafe(32)
        record = cls(
            user_id=user_id,
            token_hash=cls.hash_token(raw_token),
            expires_at=datetime.utcnow() + timedelta(hours=expires_hours),
        )
        db.session.add(record)
        return raw_token, record

    def is_valid(self) -> bool:
        return not self.used and datetime.utcnow() < self.expires_at

    def mark_used(self) -> None:
        self.used = True
