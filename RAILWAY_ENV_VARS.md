# Railway Backend Environment Variables

Set these environment variables in your Railway project dashboard:

## Required Variables

### 1. DATABASE_URL
This should be automatically set by Railway if you're using a Railway PostgreSQL database.
If not showing, it looks like: `postgresql://user:password@host:port/database`

### 2. JWT_SECRET_KEY
A secure random string for JWT token signing.
Example: `your-super-secret-jwt-key-change-this-in-production-2024`

**Generate a secure key:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

### 3. FRONTEND_URL
Your Vercel frontend URLs (comma-separated for multiple origins).
Example: `https://your-app.vercel.app,https://your-app-*.vercel.app,http://localhost:5173`

**Full value:**
```
https://futureintern.vercel.app,https://futureintern-*.vercel.app,http://localhost:5173
```

## Optional Variables

### 4. MAIL_SERVER (for password reset)
Default: `smtp.gmail.com`

### 5. MAIL_PORT
Default: `587`

### 6. MAIL_USE_TLS
Default: `true`

### 7. MAIL_USERNAME
Your email address for sending password reset emails.
Example: `your-email@gmail.com`

### 8. MAIL_PASSWORD
Your Gmail App Password (not your regular password).

**How to get Gmail App Password:**
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate a new app password
5. Use that 16-character password here

### 9. PORT
Railway sets this automatically. Don't override.

## Complete Railway Variables List

Copy-paste format for Railway:
```
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-2024
FRONTEND_URL=https://your-app.vercel.app,https://your-app-*.vercel.app,http://localhost:5173
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
```

## Verification

After setting these, check the Railway deployment logs for:
- ✅ `Database tables verified/created successfully`
- ✅ Server running on `0.0.0.0:PORT`
- ❌ No CORS errors when making requests from Vercel
