# 🚀 Complete Deployment Guide - Vercel & Railway

## Prerequisites
- GitHub account with your project pushed
- Vercel account (free tier is fine)
- Railway account (free tier is fine)

---

## Part 1: Deploy Backend to Railway (5 minutes)

### Step 1: Create Railway Project
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select your `futureintern` repository
6. Click "Deploy Now"

### Step 2: Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "+ New"
3. Select "Database" → "PostgreSQL"
4. Railway will automatically create the database
5. Wait for it to provision (30 seconds)

### Step 3: Configure Backend Service
1. Click on your backend service (not the database)
2. Go to "Settings"
3. Scroll to "Root Directory"
4. Set it to: `back/futureintern-backend`
5. Click "Save"

### Step 4: Set Environment Variables
1. Click on your backend service
2. Go to "Variables" tab
3. Add these variables:

```bash
JWT_SECRET_KEY=paste-your-generated-key-here
FRONTEND_URL=https://your-app.vercel.app
FLASK_ENV=production
```

To generate JWT_SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

4. The `DATABASE_URL` is automatically added by Railway when you add PostgreSQL

### Step 5: Get Your Backend URL
1. Go to "Settings" tab
2. Find "Domains" section
3. Click "Generate Domain"
4. Copy the URL (e.g., `https://your-app.up.railway.app`)
5. **Save this URL - you'll need it for Vercel!**

### Step 6: Deploy
1. Go to "Deployments" tab
2. Click "Deploy" or it will auto-deploy from GitHub
3. Wait for deployment to complete (2-3 minutes)
4. **Check deployment logs** - should see "Server started"

### Step 7: Initialize Data (First Time Only)
After first successful deployment:
1. In Railway dashboard, click on your backend service
2. Go to "Settings" → scroll down to "Service"
3. Click "Create TCP Proxy" (if needed for database access)
4. Or use Railway CLI:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link project
railway login
railway link

# Run initialization
railway run python init_railway.py
```

This will import the 30 internships from CSV into your database.

---

## Part 2: Deploy Frontend to Vercel (3 minutes)

### Step 1: Create Vercel Project
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select `futureintern`

### Step 2: Configure Build Settings
1. Framework Preset: **Vite**
2. Root Directory: `front`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Install Command: `npm install`

### Step 3: Set Environment Variables
1. Click "Environment Variables"
2. Add this variable:

```bash
VITE_API_BASE_URL=https://your-railway-app.up.railway.app/api
```

**Important**: Replace `your-railway-app.up.railway.app` with your actual Railway backend URL from Part 1, Step 5!

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment to complete (2-3 minutes)
3. Vercel will provide your live URL

### Step 5: Update Railway CORS
1. Go back to Railway
2. Click on your backend service
3. Go to "Variables"
4. Update `FRONTEND_URL` with your Vercel URL (e.g., `https://your-app.vercel.app`)
5. Redeploy the backend service

---

## Part 3: Verify Deployment ✅

### Test Backend
1. Open: `https://your-railway-app.up.railway.app/`
2. You should see: `{"message": "🚀 FutureIntern Backend API", "status": "running"}`
3. Test internships: `https://your-railway-app.up.railway.app/api/internships`
4. Should return JSON with 30 internships

### Test Frontend
1. Open your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Click "Browse Internships"
3. You should see 30 internships loaded
4. Test clicking "Apply Now" - should open external links

---

## Troubleshooting

### Backend Issues

**Problem**: Deployment fails
- Check Railway logs for errors
- Ensure PostgreSQL is connected
- Verify root directory is `back/futureintern-backend`

**Problem**: Database errors
- Check if PostgreSQL service is running
- Verify DATABASE_URL is set automatically
- Try redeploying after database is fully provisioned

**Problem**: No internships showing
- Check logs for "Data import completed"
- If import failed, manually run in Railway console:
  ```bash
  python import_excel_data.py
  ```

### Frontend Issues

**Problem**: "Failed to load internships"
- Check VITE_API_BASE_URL is set correctly
- Verify Railway backend URL is accessible
- Check Railway CORS settings (FRONTEND_URL)

**Problem**: CORS errors in browser console
- Update FRONTEND_URL in Railway to match your Vercel domain
- Redeploy Railway backend
- Clear browser cache

**Problem**: 404 errors on refresh
- Vercel.json is configured correctly, should work
- If not, check "Rewrites" are set in Vercel dashboard

---

## Post-Deployment Checklist

- [ ] Backend is running on Railway
- [ ] PostgreSQL database is connected
- [ ] 30 internships are imported
- [ ] Frontend is deployed on Vercel
- [ ] Can browse internships
- [ ] Can click "Apply Now" and external links open
- [ ] All environment variables are set
- [ ] CORS is configured correctly
- [ ] Both URLs are saved for future reference

---

## Managing Your Deployment

### Update Code
1. Push changes to GitHub
2. Railway and Vercel will auto-deploy (if enabled)
3. Or manually trigger deploy from dashboards

### View Logs
- **Railway**: Click service → "Deployments" → Select deployment → "View Logs"
- **Vercel**: Project → "Deployments" → Select deployment → "View Function Logs"

### Scale / Monitor
- **Railway**: Free tier includes 500 hours/month
- **Vercel**: Free tier includes 100GB bandwidth/month
- Both have monitoring dashboards

---

## Support

If you encounter issues:
1. Check logs first (Railway and Vercel)
2. Verify all environment variables are set
3. Test backend endpoint directly in browser
4. Check browser console for frontend errors
5. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Your Deployment URLs

After deployment, save these:

```
Backend (Railway): https://_____________________.up.railway.app
Frontend (Vercel): https://_____________________.vercel.app

Admin Panel: https://your-vercel-url.vercel.app/admin
Browse Internships: https://your-vercel-url.vercel.app/browse
```

---

## 🎉 Congratulations!

Your FutureIntern platform is now live!

- Students can browse and apply to internships
- Companies can post internships
- Admins can manage the platform
- All data is stored in PostgreSQL
- Everything is automatically deployed
