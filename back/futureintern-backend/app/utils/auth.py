from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
import logging

# Set up logging for security events
logger = logging.getLogger(__name__)

def role_required(*allowed_roles):
    """
    Decorator to check user permissions
    Usage: @role_required('admin', 'company')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                # Verify JWT token is present and valid
                verify_jwt_in_request()
            except Exception as e:
                logger.warning(f"JWT verification failed: {e}, IP: {request.remote_addr}")
                return jsonify({
                    'error': 'Invalid or missing authentication token',
                    'message': 'Please login to access this resource'
                }), 401
            
            # Get user information from token
            claims = get_jwt()
            user_role = claims.get('role')
            user_id = get_jwt_identity()
            
            # Check permissions
            if user_role not in allowed_roles:
                logger.warning(f"Unauthorized access attempt - User: {user_id}, Role: {user_role}, Required: {allowed_roles}, IP: {request.remote_addr}")
                return jsonify({
                    'error': 'Access denied',
                    'message': f'This resource requires one of the following roles: {", ".join(allowed_roles)}',
                    'your_role': user_role,
                    'required_roles': list(allowed_roles)
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def get_current_user_id():
    """Get current user ID from token - with validation"""
    try:
        identity = get_jwt_identity()
        return int(identity)
    except (ValueError, TypeError):
        logger.error(f"Invalid user ID in token: {identity}")
        return None

def get_current_user_role():
    """Get current user role from token - with validation"""
    claims = get_jwt()
    role = claims.get('role')
    
    # Validate role is one of the expected values
    valid_roles = ['student', 'company', 'admin']
    if role not in valid_roles:
        logger.warning(f"Invalid role in token: {role}")
        return None
    
    return role

def verify_resource_ownership(resource_owner_id, error_message="You do not have permission to access this resource"):
    """
    Verify that the current user owns the resource
    
    Args:
        resource_owner_id: ID of the resource owner
        error_message: Custom error message
    
    Returns:
        tuple: (is_owner, error_response) - error_response is None if owner
    """
    current_user_id = get_current_user_id()
    
    if current_user_id != resource_owner_id:
        logger.warning(f"Unauthorized access - User {current_user_id} attempted to access resource owned by {resource_owner_id}")
        return False, jsonify({'error': error_message}), 403
    
    return True, None
