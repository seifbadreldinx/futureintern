"""
Input validation and sanitization utilities
"""
import re
from flask import current_app

def validate_email(email):
    """Validate email format"""
    if not email:
        return False
    # RFC 5322 compliant email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """
    Validate password strength
    Returns: (is_valid, error_message)
    """
    if not password:
        return False, "Password is required"
    
    min_length = current_app.config.get('MIN_PASSWORD_LENGTH', 8)
    
    if len(password) < min_length:
        return False, f"Password must be at least {min_length} characters long"
    
    if current_app.config.get('REQUIRE_PASSWORD_COMPLEXITY', True):
        # Check for complexity: letters, numbers, and special characters
        has_letter = re.search(r'[a-zA-Z]', password)
        has_number = re.search(r'\d', password)
        has_special = re.search(r'[!@#$%^&*(),.?":{}|<>]', password)
        
        if not has_letter:
            return False, "Password must contain at least one letter"
        if not has_number:
            return False, "Password must contain at least one number"
        if not has_special:
            return False, "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"
    
    return True, None

def sanitize_string(text, max_length=None):
    """
    Sanitize user input string
    - Trim whitespace
    - Remove null bytes
    - Optionally limit length
    """
    if not text:
        return text
    
    # Remove null bytes and strip whitespace
    text = text.replace('\x00', '').strip()
    
    # Limit length if specified
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text

def validate_phone(phone):
    """Validate phone number format"""
    if not phone:
        return True  # Phone is optional
    
    # Remove common separators
    clean_phone = re.sub(r'[\s\-\(\)]', '', phone)
    
    # Check if it's a valid phone number (10-15 digits)
    if not re.match(r'^\+?\d{10,15}$', clean_phone):
        return False
    
    return True

def validate_url(url):
    """Validate URL format"""
    if not url:
        return True  # URL is optional
    
    # Basic URL validation
    pattern = r'^https?://[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(/.*)?$'
    return re.match(pattern, url) is not None

def validate_user_input(data, required_fields):
    """
    Validate required fields are present and non-empty
    Returns: (is_valid, error_message)
    """
    for field in required_fields:
        if field not in data or not data[field]:
            return False, f"{field} is required"
    
    return True, None

def prevent_sql_injection(text):
    """
    Check for common SQL injection patterns
    This is a defense-in-depth measure; SQLAlchemy ORM already prevents SQL injection
    """
    if not text:
        return True
    
    # Check for dangerous SQL keywords
    dangerous_patterns = [
        r"('\s*(OR|AND)\s*')",  # ' OR ' or ' AND '
        r"(--)",                 # SQL comment
        r"(;.*DROP)",            # DROP statements
        r"(;.*DELETE)",          # DELETE statements
        r"(;.*UPDATE)",          # UPDATE statements
        r"(UNION.*SELECT)",      # UNION SELECT
        r"(EXEC\s*\()",          # EXEC statements
    ]
    
    text_upper = str(text).upper()
    for pattern in dangerous_patterns:
        if re.search(pattern, text_upper, re.IGNORECASE):
            return False
    
    return True

def validate_file_extension(filename, allowed_extensions):
    """Validate file extension"""
    if not filename or '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in allowed_extensions

def sanitize_filename(filename):
    """
    Sanitize filename to prevent path traversal
    """
    if not filename:
        return None
    
    # Remove any path components
    filename = filename.replace('\\', '/').split('/')[-1]
    
    # Remove dangerous characters
    filename = re.sub(r'[^\w\s\-\.]', '', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')
    
    return filename

def validate_integer(value, min_val=None, max_val=None):
    """
    Validate integer value and optional range
    Returns: (is_valid, value_or_error)
    """
    try:
        int_val = int(value)
        
        if min_val is not None and int_val < min_val:
            return False, f"Value must be at least {min_val}"
        
        if max_val is not None and int_val > max_val:
            return False, f"Value must be at most {max_val}"
        
        return True, int_val
    except (ValueError, TypeError):
        return False, "Invalid integer value"
