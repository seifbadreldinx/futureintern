"""
Points System API Routes
Endpoints for viewing balance, transaction history, store, and purchasing packages.
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db
from app.models.user import User
from app.models.points import PointsTransaction, PointsPackage, ServicePricing, PurchaseRequest
from app.utils.points import record_transaction, process_daily_login, get_earning_activities

points_bp = Blueprint('points', __name__)


# ────────────────────────────────────────────────────────
# GET /api/points/balance  →  current balance + summary
# ────────────────────────────────────────────────────────
@points_bp.route("/balance", methods=["GET"])
@jwt_required()
def get_balance():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    total_earned = db.session.query(db.func.coalesce(db.func.sum(PointsTransaction.amount), 0)).filter(
        PointsTransaction.user_id == user_id, PointsTransaction.amount > 0
    ).scalar()
    total_spent = db.session.query(db.func.coalesce(db.func.sum(PointsTransaction.amount), 0)).filter(
        PointsTransaction.user_id == user_id, PointsTransaction.amount < 0
    ).scalar()

    return jsonify({
        'balance': user.points or 0,
        'total_earned': int(total_earned),
        'total_spent': abs(int(total_spent)),
    }), 200


# ────────────────────────────────────────────────────────
# GET /api/points/transactions  →  transaction history
# ────────────────────────────────────────────────────────
@points_bp.route("/transactions", methods=["GET"])
@jwt_required()
def get_transactions():
    user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    query = PointsTransaction.query.filter_by(user_id=user_id).order_by(PointsTransaction.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'transactions': [t.to_dict() for t in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
    }), 200


# ────────────────────────────────────────────────────────
# GET /api/points/store  →  available packages for purchase
# ────────────────────────────────────────────────────────
@points_bp.route("/store", methods=["GET"])
@jwt_required()
def get_store():
    packages = PointsPackage.query.filter_by(is_active=True).order_by(PointsPackage.points.asc()).all()
    return jsonify({
        'packages': [p.to_dict() for p in packages],
    }), 200


# ────────────────────────────────────────────────────────
# POST /api/points/purchase  →  buy a points package
# ────────────────────────────────────────────────────────
@points_bp.route("/purchase", methods=["POST"])
@jwt_required()
def purchase_package():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    package_id = data.get('package_id')
    if not package_id:
        return jsonify({'error': 'package_id is required'}), 400

    package = db.session.get(PointsPackage, int(package_id))
    if not package or not package.is_active:
        return jsonify({'error': 'Package not found or no longer available'}), 404

    # Create a pending purchase request (admin must approve before points are credited)
    purchase_req = PurchaseRequest(
        user_id=user_id,
        package_id=package.id,
        package_name=package.name,
        points=package.points,
        price=package.effective_price(),
        status='pending',
    )
    db.session.add(purchase_req)
    db.session.commit()

    return jsonify({
        'message': 'Purchase request submitted! An admin will review and approve it shortly.',
        'request': purchase_req.to_dict(),
    }), 200


# ────────────────────────────────────────────────────────
# GET /api/points/my-purchases  →  student's purchase requests
# ────────────────────────────────────────────────────────
@points_bp.route("/my-purchases", methods=["GET"])
@jwt_required()
def my_purchases():
    user_id = int(get_jwt_identity())
    requests = PurchaseRequest.query.filter_by(user_id=user_id).order_by(PurchaseRequest.created_at.desc()).all()
    return jsonify({'requests': [r.to_dict() for r in requests]}), 200


# ────────────────────────────────────────────────────────
# GET /api/points/pricing  →  service pricing list
# ────────────────────────────────────────────────────────
@points_bp.route("/pricing", methods=["GET"])
@jwt_required()
def get_pricing():
    services = ServicePricing.query.filter_by(is_active=True).all()
    return jsonify({
        'services': [s.to_dict() for s in services],
    }), 200


# ────────────────────────────────────────────────────────
# POST /api/points/daily-claim  →  manually claim daily login reward
# ────────────────────────────────────────────────────────
@points_bp.route("/daily-claim", methods=["POST"])
@jwt_required()
def daily_claim():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    result = process_daily_login(user)
    if result is None:
        return jsonify({'message': 'Already claimed today', 'already_claimed': True}), 200

    db.session.commit()
    return jsonify({
        'message': f'Earned {result["total_earned"]} points!',
        'already_claimed': False,
        'daily_reward': result,
        'new_balance': user.points,
    }), 200


# ────────────────────────────────────────────────────────
# GET /api/points/earning-activities  →  ways to earn
# ────────────────────────────────────────────────────────
@points_bp.route("/earning-activities", methods=["GET"])
@jwt_required()
def earning_activities():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    activities = get_earning_activities(user)
    return jsonify({'activities': activities}), 200
