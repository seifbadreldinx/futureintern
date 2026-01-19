"""
File upload utilities for CV storage
"""
import os
import magic  # python-magic for MIME type validation
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg', 'webp'}

# MIME types for validation
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

ALLOWED_IMAGE_MIME_TYPES = {
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'image/webp'
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_LOGO_SIZE = 2 * 1024 * 1024  # 2MB for logos

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_mime_type(file, allowed_mime_types):
    """
    Validate file MIME type using python-magic
    This prevents users from uploading malicious files with fake extensions
    """
    try:
        # Read first 2048 bytes for MIME detection
        file.seek(0)
        header = file.read(2048)
        file.seek(0)
        
        # Detect MIME type
        mime = magic.Magic(mime=True)
        detected_mime = mime.from_buffer(header)
        
        return detected_mime in allowed_mime_types
    except:
        # If magic fails, fall back to extension check only
        # In production, you might want to reject the file instead
        return True

def validate_file_size(file, max_size=MAX_FILE_SIZE):
    """Check if file size is within limit"""
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)  # Reset file pointer
    return size <= max_size

def sanitize_filename_safe(filename):
    """
    Sanitize filename to prevent path traversal and other attacks
    """
    if not filename:
        return None
    
    # Use werkzeug's secure_filename
    filename = secure_filename(filename)
    
    # Additional sanitization: remove any remaining dangerous characters
    import re
    filename = re.sub(r'[^\w\s\-\.]', '', filename)
    
    # Limit filename length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')
    
    return filename

def save_cv(file, user_id):
    """
    Save CV file and return the file path
    
    Args:
        file: FileStorage object from request.files
        user_id: ID of the user uploading the CV
        
    Returns:
        str: Relative path to saved file or None if validation fails
    """
    if not file or file.filename == '':
        return None, "No file selected"
    
    # Sanitize filename first
    safe_filename = sanitize_filename_safe(file.filename)
    if not safe_filename:
        return None, "Invalid filename"
    
    if not allowed_file(safe_filename):
        return None, "Invalid file type. Only PDF, DOC, and DOCX are allowed"
    
    if not validate_file_size(file, MAX_FILE_SIZE):
        return None, f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024)}MB"
    
    # Validate MIME type to prevent file type spoofing
    if not validate_file_mime_type(file, ALLOWED_MIME_TYPES):
        return None, "Invalid file type. File content does not match extension."
    
    # Create uploads directory if it doesn't exist
    upload_folder = os.path.join(current_app.root_path, '..', 'uploads', 'cvs')
    os.makedirs(upload_folder, exist_ok=True)
    
    # Generate secure filename
    name, ext = os.path.splitext(safe_filename)
    unique_filename = f"cv_{user_id}_{name}{ext}"
    
    # Ensure the filename is still safe after adding prefix
    unique_filename = sanitize_filename_safe(unique_filename)
    
    # Save file
    filepath = os.path.join(upload_folder, unique_filename)
    
    # Additional safety: ensure we're not writing outside uploads directory
    abs_upload_folder = os.path.abspath(upload_folder)
    abs_filepath = os.path.abspath(filepath)
    if not abs_filepath.startswith(abs_upload_folder):
        return None, "Invalid file path"
    
    file.save(filepath)
    
    # Return relative path for storage in database
    return f"/uploads/cvs/{unique_filename}", None

def delete_cv(cv_path):
    """
    Delete CV file from storage
    
    Args:
        cv_path: Relative path to the CV file
        
    Returns:
        bool: True if deleted successfully, False otherwise
    """
    if not cv_path:
        return False
    
    try:
        full_path = os.path.join(current_app.root_path, '..', cv_path.lstrip('/'))
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
    except Exception:
        pass
    
    return False

# ========== Logo Upload Functions ==========

def allowed_logo(filename):
    """Check if file extension is allowed for logos"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def save_logo(file, user_id):
    """
    Save logo file and return the file path
    
    Args:
        file: FileStorage object from request.files
        user_id: ID of the user uploading the logo
        
    Returns:
        tuple: (file_path, error_message) - file_path is None if error occurred
    """
    if not file or file.filename == '':
        return None, "No file selected"
    
    # Sanitize filename
    safe_filename = sanitize_filename_safe(file.filename)
    if not safe_filename:
        return None, "Invalid filename"
    
    if not allowed_logo(safe_filename):
        return None, "Invalid file type. Only PNG, JPG, JPEG, SVG, and WEBP are allowed"
    
    if not validate_file_size(file, MAX_LOGO_SIZE):
        return None, f"File too large. Maximum size is {MAX_LOGO_SIZE / (1024*1024)}MB"
    
    # Validate MIME type
    if not validate_file_mime_type(file, ALLOWED_IMAGE_MIME_TYPES):
        return None, "Invalid file type. File content does not match extension."
    
    # Create uploads directory if it doesn't exist
    upload_folder = os.path.join(current_app.root_path, '..', 'uploads', 'logos')
    os.makedirs(upload_folder, exist_ok=True)
    
    # Generate secure filename
    name, ext = os.path.splitext(safe_filename)
    unique_filename = f"logo_{user_id}_{name}{ext}"
    unique_filename = sanitize_filename_safe(unique_filename)
    
    # Save file
    filepath = os.path.join(upload_folder, unique_filename)
    
    # Additional safety: ensure we're not writing outside uploads directory
    abs_upload_folder = os.path.abspath(upload_folder)
    abs_filepath = os.path.abspath(filepath)
    if not abs_filepath.startswith(abs_upload_folder):
        return None, "Invalid file path"
    
    file.save(filepath)
    
    # Return relative path for storage in database
    return f"/uploads/logos/{unique_filename}", None
        str: Relative path to saved file or None if validation fails
    """
    if not file or file.filename == '':
        return None, "No file selected"
    
    if not allowed_logo(file.filename):
        return None, "Invalid file type. Only PNG, JPG, JPEG, SVG, and WEBP are allowed"
    
    # Check logo file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_LOGO_SIZE:
        return None, f"File too large. Maximum size is {MAX_LOGO_SIZE / (1024*1024)}MB"
    
    # Create uploads directory if it doesn't exist
    upload_folder = os.path.join(current_app.root_path, '..', 'uploads', 'logos')
    os.makedirs(upload_folder, exist_ok=True)
    
    # Generate secure filename
    filename = secure_filename(file.filename)
    # Add user_id to filename to avoid conflicts
    name, ext = os.path.splitext(filename)
    unique_filename = f"logo_{user_id}_{name}{ext}"
    
    # Save file
    filepath = os.path.join(upload_folder, unique_filename)
    file.save(filepath)
    
    # Return relative path for storage in database
    return f"/uploads/logos/{unique_filename}", None

def delete_logo(logo_path):
    """
    Delete logo file from storage
    
    Args:
        logo_path: Relative path to the logo file
        
    Returns:
        bool: True if deleted successfully, False otherwise
    """
    if not logo_path:
        return False
    
    try:
        full_path = os.path.join(current_app.root_path, '..', logo_path.lstrip('/'))
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
    except Exception:
        pass
    
    return False
