"""
File upload utilities for CV storage
"""
import os
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_LOGO_SIZE = 2 * 1024 * 1024  # 2MB for logos

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    """Check if file size is within limit"""
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)  # Reset file pointer
    return size <= MAX_FILE_SIZE

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
    
    if not allowed_file(file.filename):
        return None, "Invalid file type. Only PDF, DOC, and DOCX are allowed"
    
    if not validate_file_size(file):
        return None, f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024)}MB"
    
    # Create uploads directory if it doesn't exist
    upload_folder = os.path.join(current_app.root_path, '..', 'uploads', 'cvs')
    os.makedirs(upload_folder, exist_ok=True)
    
    # Generate secure filename
    filename = secure_filename(file.filename)
    # Add user_id to filename to avoid conflicts
    name, ext = os.path.splitext(filename)
    unique_filename = f"cv_{user_id}_{name}{ext}"
    
    # Save file
    filepath = os.path.join(upload_folder, unique_filename)
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
