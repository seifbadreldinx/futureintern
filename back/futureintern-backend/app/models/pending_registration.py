"""
PendingRegistration — stores registration data until email is verified.

Users are NOT added to the `users` table until they click the verification
link.  This table is the staging area.
"""

import hashlib
import secrets
from datetime import datetime, timedelta

from app.models import db


class PendingRegistration(db.Model):
    __tablename__ = 'pending_registrations_v2'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)          # student | company

    # Student-specific
    university = db.Column(db.String(200))
    major = db.Column(db.String(200))
    interests = db.Column(db.Text)                            # JSON string

    # Company-specific
    company_name = db.Column(db.String(200))

    # Verification token (hashed)
    token_hash = db.Column(db.String(64), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

    # ── helpers ──────────────────────────────────────────

    @staticmethod
    def hash_token(raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    def generate_token(self, expires_hours: int = 24) -> str:
        """Generate a new token, update this record, and return the raw token."""
        raw_token = secrets.token_urlsafe(32)
        self.token_hash = self.hash_token(raw_token)
        self.expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
        return raw_token

    def is_valid(self) -> bool:
        return datetime.utcnow() < self.expires_at
