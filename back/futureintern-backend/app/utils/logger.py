"""
Structured Request Logger + Audit Trail Helper
- Logs every API request (who, what, when, IP) to app logger
- Provides log_audit() helper to write sensitive actions to the AuditLog table
"""
import json
import logging
import time
from flask import request, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request


# ---------- structured request logger ----------

def setup_request_logger(app):
    """
    Attach before/after request hooks to log every API call.
    Log format: [timestamp] method path | user=<id> ip=<ip> status=<code> duration=<ms>ms
    """
    logger = logging.getLogger('api.requests')

    @app.before_request
    def _before():
        g.start_time = time.time()
        # Try to resolve current user from JWT (optional, non-blocking)
        g.current_user_id = None
        try:
            verify_jwt_in_request(optional=True)
            g.current_user_id = get_jwt_identity()
        except Exception:
            pass

    @app.after_request
    def _after(response):
        duration_ms = int((time.time() - g.get('start_time', time.time())) * 1000)
        user_id = g.get('current_user_id', 'anonymous')
        ip = request.remote_addr
        logger.info(
            '[REQUEST] %s %s | user=%s ip=%s status=%s duration=%dms',
            request.method,
            request.path,
            user_id,
            ip,
            response.status_code,
            duration_ms
        )
        return response


# ---------- audit trail helper ----------

def log_audit(action, resource=None, resource_id=None, details=None, user_id=None):
    """
    Write an entry to the audit_logs table.

    Usage:
        log_audit('login_success', resource='user', resource_id=user.id, user_id=user.id)
        log_audit('login_failed', details={'email': email})
        log_audit('application_status_change', resource='application',
                  resource_id=app.id, details={'new_status': 'accepted'}, user_id=admin_id)
    """
    try:
        from app.models.audit_log import AuditLog
        from app.models import db

        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=json.dumps(details) if details and not isinstance(details, str) else details,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:300],
        )
        db.session.add(entry)
        db.session.commit()
    except Exception as e:
        # Never let audit logging crash the main request
        logging.getLogger('api.audit').warning('Could not write audit log: %s', e)
