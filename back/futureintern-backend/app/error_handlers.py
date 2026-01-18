"""
Global Error Handlers - Task 6.2
Centralized error handling for all API routes
"""
from flask import jsonify
from werkzeug.exceptions import HTTPException


def register_error_handlers(app):
    """Register all global error handlers"""
    
    @app.errorhandler(400)
    def bad_request(err):
        return jsonify({'error': 'Bad Request', 'message': str(err)}), 400
    
    @app.errorhandler(401)
    def unauthorized(err):
        return jsonify({'error': 'Unauthorized', 'message': 'Authentication required'}), 401
    
    @app.errorhandler(403)
    def forbidden(err):
        return jsonify({'error': 'Forbidden', 'message': 'Access denied'}), 403
    
    @app.errorhandler(404)
    def not_found(err):
        return jsonify({'error': 'Not Found', 'message': 'Resource not found'}), 404

    @app.errorhandler(HTTPException)
    def handle_http_exception(err):
        return jsonify({'error': err.name, 'message': err.description}), err.code

    @app.errorhandler(Exception)
    def handle_generic_exception(err):
        app.logger.exception('Unhandled exception: %s', err)
        return jsonify({'error': 'Internal Server Error', 'message': str(err)}), 500

