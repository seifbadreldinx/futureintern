"""
Rate limiting middleware for API endpoints
Prevents brute force attacks and API abuse
"""
from functools import wraps
from flask import request, jsonify
from datetime import datetime, timedelta
from collections import defaultdict
import threading

class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
        self.cleanup_interval = 300  # Clean up old entries every 5 minutes
        self.last_cleanup = datetime.utcnow()
    
    def is_allowed(self, key, max_requests, window_seconds):
        """
        Check if request is allowed based on rate limit
        
        Args:
            key: Unique identifier (e.g., IP address, user ID)
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
        
        Returns:
            bool: True if request is allowed, False otherwise
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=window_seconds)
        
        with self.lock:
            # Cleanup old entries periodically
            if (now - self.last_cleanup).total_seconds() > self.cleanup_interval:
                self._cleanup()
                self.last_cleanup = now
            
            # Remove old requests outside the window
            self.requests[key] = [req_time for req_time in self.requests[key] if req_time > cutoff]
            
            # Check if limit exceeded
            if len(self.requests[key]) >= max_requests:
                return False
            
            # Add current request
            self.requests[key].append(now)
            return True
    
    def _cleanup(self):
        """Remove old entries to prevent memory leak"""
        now = datetime.utcnow()
        keys_to_delete = []
        
        for key, requests in self.requests.items():
            # Remove requests older than 1 hour
            cutoff = now - timedelta(hours=1)
            recent_requests = [req for req in requests if req > cutoff]
            
            if not recent_requests:
                keys_to_delete.append(key)
            else:
                self.requests[key] = recent_requests
        
        for key in keys_to_delete:
            del self.requests[key]

# Global rate limiter instance
_limiter = RateLimiter()

def rate_limit(max_requests=100, window_seconds=60, key_func=None):
    """
    Decorator to rate limit API endpoints
    
    Args:
        max_requests: Maximum number of requests allowed in the window
        window_seconds: Time window in seconds
        key_func: Optional function to generate rate limit key (default: IP address)
    
    Usage:
        @rate_limit(max_requests=5, window_seconds=60)
        def login():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Generate rate limit key
            if key_func:
                key = key_func()
            else:
                # Default to IP address
                key = request.remote_addr or 'unknown'
            
            # Check rate limit
            if not _limiter.is_allowed(key, max_requests, window_seconds):
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Please try again later.',
                    'retry_after': window_seconds
                }), 429
            
            return f(*args, **kwargs)
        return wrapped
    return decorator

# Predefined rate limiters for common use cases
def rate_limit_auth(f):
    """Rate limiter for authentication endpoints (stricter)"""
    return rate_limit(max_requests=5, window_seconds=60)(f)

def rate_limit_api(f):
    """Rate limiter for general API endpoints"""
    return rate_limit(max_requests=100, window_seconds=60)(f)

def rate_limit_upload(f):
    """Rate limiter for file upload endpoints"""
    return rate_limit(max_requests=10, window_seconds=60)(f)
