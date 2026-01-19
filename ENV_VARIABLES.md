# Environment Variables Configuration

## Railway (Backend) Environment Variables

Set these in your Railway project dashboard:

### Required Variables

```bash
# Database (Auto-provided by Railway PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database
# Railway automatically provides this when you add PostgreSQL

# Security
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"

# CORS - Your Vercel frontend URL
FRONTEND_URL=https://your-app.vercel.app
# Add your actual Vercel domain here

# Port (Auto-provided by Railway)
PORT=5000
# Railway sets this automatically

# Flask Environment
FLASK_ENV=production
```

### Optional Variables (Email functionality)

```bash
# Mail Configuration (for password reset, etc.)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

## Vercel (Frontend) Environment Variables

Set these in your Vercel project settings:

### Required Variables

```bash
# Backend API URL - Your Railway backend URL
VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api
# Replace with your actual Railway deployment URL
```

## How to Set Environment Variables

### Railway
1. Go to https://railway.app/dashboard
2. Select your project
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable one by one
6. Deploy will automatically restart

### Vercel
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add each variable
5. Redeploy for changes to take effect

## Important Notes

1. **JWT_SECRET_KEY**: Generate a secure random key, don't use default
2. **DATABASE_URL**: Automatically provided when you add PostgreSQL to Railway
3. **FRONTEND_URL**: Update with your actual Vercel domain after deployment
4. **VITE_API_BASE_URL**: Update with your actual Railway backend URL after deployment

## Security Checklist

- [ ] Change JWT_SECRET_KEY from default
- [ ] Set FRONTEND_URL to your actual Vercel domain
- [ ] Set VITE_API_BASE_URL to your actual Railway backend URL
- [ ] Never commit .env files to git
- [ ] Use strong passwords for database
- [ ] Enable 2FA on Railway and Vercel accounts
