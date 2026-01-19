# Deployment Guide: Vercel + Railway

## Problem Solved
The "Failed to fetch" error when registering as a company was caused by the frontend trying to connect to `localhost:5000` on Vercel, which doesn't exist in production. The frontend needed to use your Railway backend URL instead.

## What Was Fixed
1. ✅ Updated `CompanyRegister.tsx` to use environment variables instead of hardcoded localhost
2. ✅ Fixed `.env` file to use correct variable name (`VITE_API_BASE_URL`)
3. ✅ Created production environment template

## Vercel Configuration (CRITICAL)

You **MUST** set the following environment variable in Vercel:

### Steps to Configure Vercel:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://your-backend-name.railway.app/api` (replace with your actual Railway URL)
   - **Environment:** Production, Preview, Development (check all three)
4. Click **Save**
5. **Redeploy** your application for changes to take effect

### How to Find Your Railway Backend URL:
1. Go to your Railway project dashboard
2. Look for your backend service
3. You should you see a domain like: `futureintern-backend.up.railway.app`
4. Add `/api` at the end: `https://futureintern-backend.up.railway.app/api`

## Railway Backend CORS Configuration

Your backend also needs to allow requests from your Vercel domain. 

### Check `config.py`:
Make sure your `CORS_ORIGINS` includes your Vercel URL:
```python
CORS_ORIGINS = [
    'https://your-app.vercel.app',
    'https://your-app-*.vercel.app',  # For preview deployments
    'http://localhost:5173',  # For local development
    '*'  # Remove this in production for security
]
```

### Environment Variable in Railway:
Set this in Railway's environment variables:
- **Name:** `CORS_ORIGINS`
- **Value:** `https://your-app.vercel.app,https://your-app-*.vercel.app,http://localhost:5173`

## Testing Locally

1. Make sure backend is running:
   ```bash
   cd back/futureintern-backend
   python run.py
   ```

2. Make sure frontend uses the .env file:
   ```bash
   cd front
   npm run dev
   ```

3. The backend should be at `http://localhost:5000`
4. The frontend should connect to it via the environment variable

## Testing After Deployment

1. Open your Vercel app
2. Open browser DevTools (F12) → Network tab
3. Try to register as a company
4. Check the network request - it should go to your Railway URL, not localhost
5. If you see `localhost:5000`, the environment variable wasn't set correctly in Vercel

## Common Issues

### Issue: Still seeing "Failed to fetch"
**Solution:** 
- Check Vercel environment variables are set correctly
- Redeploy the application after setting env vars
- Check Railway backend is running and accessible

### Issue: CORS error instead of "Failed to fetch"
**Solution:**
- Update Railway backend's `CORS_ORIGINS` to include your Vercel domain
- Restart Railway backend after changing environment variables

### Issue: Works locally but not on Vercel
**Solution:**
- Verify `VITE_API_BASE_URL` is set in Vercel (not just locally)
- Make sure you're using `https://` for Railway URL, not `http://`
- Redeploy both Vercel and Railway apps

## Quick Checklist

- [ ] Backend running on Railway with public URL
- [ ] Vercel environment variable `VITE_API_BASE_URL` set to Railway URL
- [ ] Railway environment variable `CORS_ORIGINS` includes Vercel domain
- [ ] Both apps redeployed after configuration changes
- [ ] Tested registration flow in production
