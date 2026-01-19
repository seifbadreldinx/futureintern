# 🚀 Quick Fix for "Failed to fetch" Error

## ❌ Problem
When trying to register as a company on your deployed Vercel app, you get a **"Failed to fetch"** error.

## ✅ Root Cause
Your frontend on Vercel was trying to connect to `http://localhost:5000` which doesn't exist in production. It needs to connect to your Railway backend URL.

## 🔧 What I Fixed (Code Changes)
1. ✅ Updated `CompanyRegister.tsx` to use environment variables
2. ✅ Fixed `.env` file with correct variable name
3. ✅ Created deployment guides

## 📋 What YOU Need to Do (Deployment Config)

### Step 1: Get Your Railway Backend URL
1. Open your Railway dashboard
2. Click on your backend service
3. Copy the public URL (looks like: `https://futureintern-backend-production-xxxx.up.railway.app`)

### Step 2: Configure Vercel Environment Variable
1. Go to Vercel dashboard → Your project
2. Settings → Environment Variables
3. Add new variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://your-railway-url.railway.app/api` ⚠️ **Must include `/api` at the end!**
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
4. Click **Save**

### Step 3: Configure Railway Environment Variable
1. Go to Railway dashboard → Your backend project
2. Variables tab
3. Add new variable:
   - **Name:** `FRONTEND_URL`
   - **Value:** `https://your-vercel-app.vercel.app,https://your-vercel-app-*.vercel.app,http://localhost:5173`
   - Replace `your-vercel-app` with your actual Vercel project name
4. This fixes CORS errors

### Step 4: Redeploy Both Apps
1. **Vercel:** Go to Deployments → Redeploy latest
2. **Railway:** Should auto-redeploy when you save the variable

### Step 5: Test
1. Open your Vercel app in browser
2. Try registering as a company
3. Should work now! ✅

## 🧪 Testing Checklist
- [ ] Backend is live on Railway (visit the URL directly to check)
- [ ] `VITE_API_BASE_URL` set in Vercel with `/api` suffix
- [ ] `FRONTEND_URL` set in Railway with your Vercel domain
- [ ] Both apps redeployed
- [ ] Can register as a company without "Failed to fetch" error

## 🆘 If Still Not Working

### Check 1: Verify Environment Variables
**Vercel:**
```
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

**Railway:**
```
FRONTEND_URL=https://your-app.vercel.app,https://your-app-*.vercel.app
```

### Check 2: Browser DevTools
1. Open DevTools (F12) → Network tab
2. Try to register
3. Look at the failed request:
   - ❌ Going to `localhost:5000`? → Vercel env var not set/not redeployed
   - ❌ CORS error? → Railway `FRONTEND_URL` not set correctly
   - ❌ 404 error? → Railway backend not running or wrong URL
   - ❌ 500 error? → Check Railway logs for backend errors

### Check 3: Railway Logs
1. Railway dashboard → Your backend
2. Click "View Logs"
3. Look for errors or confirm it's running

## 📚 More Details
- See `DEPLOYMENT_GUIDE.md` for complete explanation
- See `RAILWAY_ENV_VARS.md` for all backend variables
- See `.env.example` in `front/` folder for frontend variables

## 🎯 Expected Result
After following these steps, your company registration should work on Vercel, connecting to your Railway backend seamlessly!
