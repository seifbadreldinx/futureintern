# Quick Deployment Commands - Monorepo Setup

Your repo: https://github.com/seifbadreldinx/futureintern

## Step 1: Push Latest Changes to GitHub

```bash
# Navigate to project root
cd "c:\Users\Seif Badreldin\Downloads\futureintern\futureintern"

# Add all changes
git add .
git commit -m "Configure for Railway and Vercel deployment"

# Push to GitHub
git push origin main
```

## Step 2: Deploy Backend to Railway

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select: **seifbadreldinx/futureintern**
4. **Set Root Directory:** `back/futureintern-backend`
   - Go to Settings → Root Directory → Enter: `back/futureintern-backend`
5. Add environment variables:
   ```
   JWT_SECRET_KEY=your-secret-key-here
   FLASK_ENV=production
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
6. Save your Railway URL: `https://________.up.railway.app`

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import: **seifbadreldinx/futureintern**
4. **Configure Root Directory:** Select `front` folder
5. Verify settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variable:
   ```
   VITE_API_BASE_URL=https://your-railway-url.railway.app/api
   ```
7. Click "Deploy"
8. Save your Vercel URL: `https://________.vercel.app`

## Step 4: Final Configuration

1. **Update Railway FRONTEND_URL:**
   - Go to Railway → Your Project → Variables
   - Update: `FRONTEND_URL=https://your-actual-vercel-domain.vercel.app`
   - Railway will auto-redeploy

2. **Test Your Application:**
   - Visit your Vercel URL
   - Try signing up, logging in, browsing internships

## Important URLs to Save

- **GitHub Repo:** https://github.com/seifbadreldinx/futureintern
- **Railway Backend:** `https://__________.up.railway.app`
- **Vercel Frontend:** `https://__________.vercel.app`

## Generate Secure JWT Secret

Run this in PowerShell to generate a secure secret key:
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Use the output as your `JWT_SECRET_KEY` in Railway.

## Need Help?

See full guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
