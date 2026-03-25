from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db
from app.models.push_token import UserPushToken

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route("/register", methods=["POST"])
@jwt_required()
def register_token():
    """Register or refresh an Expo push token for the current user."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    token = (data.get('token') or '').strip()
    platform = (data.get('platform') or '').strip().lower()

    if not token:
        return jsonify({'error': 'token is required'}), 400
    if not token.startswith('ExponentPushToken['):
        return jsonify({'error': 'Invalid Expo push token format'}), 400

    existing = UserPushToken.query.filter_by(token=token).first()
    if existing:
        # Re-assign to current user if it moved devices
        existing.user_id = user_id
        existing.platform = platform or existing.platform
    else:
        db.session.add(UserPushToken(user_id=user_id, token=token, platform=platform))

    db.session.commit()
    return jsonify({'message': 'Push token registered'}), 200


@notifications_bp.route("/unregister", methods=["POST"])
@jwt_required()
def unregister_token():
    """Remove a push token (called on logout)."""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    token = (data.get('token') or '').strip()

    if token:
        UserPushToken.query.filter_by(user_id=user_id, token=token).delete()
    else:
        # Remove all tokens for this user
        UserPushToken.query.filter_by(user_id=user_id).delete()

    db.session.commit()
    return jsonify({'message': 'Push token removed'}), 200
