"""
2FA Email Code Model — stores temporary OTPs sent to users during login.
Code expires after 10 minutes and is single-use.
"""
from app.models import db
from datetime import datetime, timedelta
import secrets


class TwoFactorCode(db.Model):
    __tablename__ = 'two_factor_codes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    code = db.Column(db.String(8), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='two_factor_codes')

    @staticmethod
    def generate(user_id, expiry_minutes=10):
        """Create a new 2FA code, invalidate old ones for this user."""
        # Expire any existing unused codes for this user
        TwoFactorCode.query.filter_by(user_id=user_id, used=False).delete()
        code = secrets.randbelow(1_000_000)
        entry = TwoFactorCode(
            user_id=user_id,
            code=f'{code:06d}',
            expires_at=datetime.utcnow() + timedelta(minutes=expiry_minutes),
        )
        db.session.add(entry)
        db.session.commit()
        return entry

    def is_valid(self, code_str):
        """Check if the provided code string matches and is not expired or used."""
        if self.used:
            return False
        if datetime.utcnow() > self.expires_at:
            return False
        return self.code == code_str.strip()

    def mark_used(self):
        self.used = True
        db.session.commit()
