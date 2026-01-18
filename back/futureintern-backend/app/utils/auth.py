from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt

def role_required(*allowed_roles):
    """
    Decorator للتحقق من صلاحيات المستخدم
    Usage: @role_required('admin', 'company')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # التحقق من وجود JWT token
            verify_jwt_in_request()
            
            # الحصول على معلومات المستخدم من التوكن
            claims = get_jwt()
            user_role = claims.get('role')
            
            # التحقق من الصلاحية
            if user_role not in allowed_roles:
                return jsonify({
                    'error': 'Access denied',
                    'message': f'❌ Admin access required. Your role: {user_role}. Required: {", ".join(allowed_roles)}',
                    'your_role': user_role,
                    'required_roles': list(allowed_roles)
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def get_current_user_id():
    """الحصول على ID المستخدم الحالي من التوكن"""
    # Convert string identity back to int
    return int(get_jwt_identity())

def get_current_user_role():
    """الحصول على دور المستخدم الحالي من التوكن"""
    claims = get_jwt()
    return claims.get('role')
