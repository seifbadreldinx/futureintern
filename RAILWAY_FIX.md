# Railway Deployment Fix - "Application failed to respond"

## The Issue
Railway deployment is failing because the build script runs during startup, which can timeout.

## The Fix

### 1. Updated Configuration
The deployment now uses a simpler approach:
- Gunicorn starts immediately (no build script blocking)
- Data import is done separately after deployment

### 2. Deploy Steps

**A. Push the latest code:**
```bash
git add .
git commit -m "Fix Railway deployment configuration"
git push
```

**B. Railway will auto-deploy**
- Go to Railway dashboard
- Watch the deployment logs
- It should succeed this time

**C. Import data (one-time setup):**

**Option 1 - Using Railway CLI (Recommended):**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Import data
railway run python init_railway.py
```

**Option 2 - Using Railway Web Console:**
1. In Railway dashboard, click your backend service
2. Go to "Variables" tab
3. Add temporary variable: `RUN_IMPORT=true`
4. Redeploy
5. After deployment succeeds, remove the variable

**Option 3 - Manual via Database:**
1. Connect to Railway PostgreSQL
2. Use a PostgreSQL client
3. Run the SQL import script (if provided)

### 3. Verify It Works

**Test Backend:**
```
https://your-railway-app.up.railway.app/
```
Should return:
```json
{
  "message": "🚀 FutureIntern Backend API",
  "status": "running"
}
```

**Test Internships:**
```
https://your-railway-app.up.railway.app/api/internships
```
Should return JSON with internships (after import)

## Why This Happens

Railway has a 10-minute deployment timeout. Running migrations + data import during startup can exceed this, especially on the first deployment when:
- Installing all Python packages
- Creating database tables
- Importing CSV data

The fix separates these concerns:
1. **Deploy**: Just start the app (fast)
2. **Initialize**: Import data separately (one-time)

## Alternative: Skip Auto-Import

If you want to add internships manually:
1. Use the admin dashboard at `/admin`
2. Or use the frontend "Create Internship" feature
3. Or import via Railway CLI as shown above

## Current Configuration

**Procfile:**
```
web: gunicorn -w 4 -b 0.0.0.0:$PORT run:app
```

**railway.json:**
```json
{
  "deploy": {
    "startCommand": "gunicorn -w 4 -b 0.0.0.0:$PORT run:app"
  }
}
```

This starts the app immediately without running any build scripts that could timeout.
