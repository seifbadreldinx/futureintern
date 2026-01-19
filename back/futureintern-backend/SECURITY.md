# Security Implementation Documentation

## Overview
This document outlines all security measures implemented in the FutureIntern backend API to protect against common vulnerabilities and attacks.

## Security Measures Implemented

### 1. Authentication Security

#### Password Policy
- **Minimum Length**: 8 characters
- **Complexity Requirements**: 
  - At least one letter
  - At least one number
  - At least one special character (!@#$%^&*(),.?":{}|<>)
- **Storage**: Passwords are hashed using Werkzeug's `generate_password_hash` (PBKDF2 with salt)
- **Validation**: Enforced on registration and password reset

#### JWT Token Security
- **Secret Key**: Auto-generated using `secrets.token_urlsafe(32)` if not provided in environment
- **Token Expiration**: 
  - Access tokens: 24 hours
  - Refresh tokens: 30 days
- **CSRF Protection**: Disabled for API (using Bearer tokens, not cookies)
- **Claims**: Includes user role and email for authorization

#### Rate Limiting (Brute Force Protection)
- **Authentication Endpoints**: 5 requests per 60 seconds per IP
- **General API Endpoints**: 100 requests per 60 seconds per IP
- **File Upload Endpoints**: 10 requests per 60 seconds per IP
- **Implementation**: In-memory rate limiter with automatic cleanup

### 2. Authorization & Access Control

#### Role-Based Access Control (RBAC)
- **Roles**: student, company, admin
- **Middleware**: `@role_required()` decorator validates user roles
- **Resource Ownership**: Verified before allowing updates/deletes
- **Logging**: Unauthorized access attempts are logged with IP address

#### Protected Endpoints
- Students can only access their own applications and profiles
- Companies can only manage their own internships and view applications
- Admins have full access to system statistics and user management

### 3. Input Validation & Sanitization

#### Email Validation
- RFC 5322 compliant regex pattern
- Applied to registration, login, and password reset

#### Input Sanitization
- Removes null bytes and excessive whitespace
- Enforces maximum length limits
- Prevents path traversal in filenames

#### SQL Injection Prevention
- **Primary**: SQLAlchemy ORM with parameterized queries (no raw SQL)
- **Secondary**: Input validation checks for dangerous SQL patterns
- All database queries use `filter_by()` or safe query methods

### 4. File Upload Security

#### File Type Validation
- **Extension Check**: Only allowed extensions (.pdf, .doc, .docx for CVs)
- **MIME Type Validation**: Uses python-magic to verify actual file content
- **Double Verification**: Both extension and content must match

#### File Size Limits
- **CVs**: 5MB maximum
- **Logos**: 2MB maximum
- **Global**: Flask `MAX_CONTENT_LENGTH` config

#### Filename Security
- **Sanitization**: Uses Werkzeug's `secure_filename()`
- **Path Traversal Prevention**: Validates absolute paths
- **Unique Names**: Prefixed with user_id to prevent conflicts

#### Upload Directory Protection
- Files stored outside web root in `/uploads/` directory
- Path traversal attacks prevented by absolute path validation

### 5. Security Headers

All responses include the following security headers:

```http
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Protection Against**:
- Clickjacking (X-Frame-Options)
- MIME sniffing (X-Content-Type-Options)
- XSS attacks (X-XSS-Protection, CSP)
- Man-in-the-middle (HSTS)
- Information leakage (Referrer-Policy)

### 6. CORS Configuration

- **Allowed Origins**: Configured via environment variable `FRONTEND_URL`
- **Credentials**: Supported for authenticated requests
- **Headers**: Only Content-Type and Authorization allowed
- **Methods**: Standard HTTP methods (GET, POST, PUT, DELETE)

### 7. Session Security

- **Cookie Flags**:
  - `Secure`: Only transmitted over HTTPS
  - `HttpOnly`: Not accessible via JavaScript
  - `SameSite=Lax`: CSRF protection

### 8. Error Handling

- **Generic Error Messages**: Don't reveal system internals
- **User Enumeration Prevention**: Same response for existing/non-existing users
- **Stack Traces**: Hidden in production
- **Logging**: Detailed errors logged server-side only

### 9. Additional Security Measures

#### Email Security
- Password reset tokens expire in 1 hour
- Token-based authentication for password reset
- No user enumeration in forgot password response

#### Database Security
- Environment-based connection strings
- PostgreSQL in production with SSL
- SQLite for local development only

#### Logging & Monitoring
- Security events logged (failed logins, unauthorized access)
- IP addresses tracked for suspicious activity
- Audit trail for sensitive operations

## Environment Variables (Required for Production)

```bash
# JWT Secret - MUST be set in production
JWT_SECRET_KEY=<generate-strong-random-key>

# Database - Use PostgreSQL in production
DATABASE_URL=postgresql://user:password@host:port/database

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_USE_TLS=true

# Frontend URL for CORS
FRONTEND_URL=https://yourdomain.com
```

## Security Checklist for Deployment

- [ ] Set strong `JWT_SECRET_KEY` environment variable
- [ ] Use PostgreSQL with SSL in production (not SQLite)
- [ ] Enable HTTPS/TLS (certificates configured)
- [ ] Set `FRONTEND_URL` to actual domain (not localhost)
- [ ] Configure email server credentials securely
- [ ] Review and restrict CORS origins
- [ ] Set up firewall rules (only ports 80/443 exposed)
- [ ] Enable database backups
- [ ] Set up monitoring and alerting
- [ ] Review file upload directory permissions
- [ ] Implement log rotation
- [ ] Keep dependencies updated (run `pip list --outdated`)

## Vulnerability Testing

### Manual Testing
1. **SQL Injection**: Try inputs like `' OR '1'='1` in login
2. **XSS**: Try `<script>alert('XSS')</script>` in text fields
3. **Path Traversal**: Try `../../etc/passwd` in file uploads
4. **Brute Force**: Attempt multiple failed logins
5. **CSRF**: Test cross-origin requests without proper headers

### Automated Testing
Consider using:
- **OWASP ZAP**: Web application security scanner
- **Bandit**: Python security linter
- **Safety**: Check for known vulnerabilities in dependencies

## Known Limitations

1. **Rate Limiting**: In-memory (resets on restart) - Consider Redis for production
2. **File Type Detection**: Requires `python-magic` library and libmagic
3. **Session Management**: Stateless JWT (can't revoke tokens before expiry)

## Updates & Maintenance

- Regularly update dependencies: `pip install --upgrade -r requirements.txt`
- Monitor security advisories for Flask, SQLAlchemy, and JWT
- Review logs for suspicious activity patterns
- Perform periodic security audits

## Contact

For security issues, please report to: security@futureintern.com

---
**Last Updated**: January 19, 2026  
**Version**: 1.0  
**Reviewed By**: Security Audit Team
