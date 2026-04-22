"""
One-time script to refund 10 points to a user who was double-charged for AI matching.
Run with: python refund_points.py
"""
from app import create_app
from app.models import db
from app.models.user import User
from app.utils.points import record_transaction

TARGET_EMAIL = "ahmed@student.com"
REFUND_AMOUNT = 10
REASON = "Refund: double-charged for AI recommendations due to request timeout"

app = create_app()

with app.app_context():
    user = User.query.filter_by(email=TARGET_EMAIL).first()
    if not user:
        print(f"❌ User not found: {TARGET_EMAIL}")
        exit(1)

    before = user.points or 0
    record_transaction(user, REFUND_AMOUNT, 'refund', service_name='ai_matching', description=REASON)
    db.session.commit()
    after = user.points or 0

    print(f"✅ Refunded {REFUND_AMOUNT} points to {user.name} ({TARGET_EMAIL})")
    print(f"   Balance: {before} → {after}")
