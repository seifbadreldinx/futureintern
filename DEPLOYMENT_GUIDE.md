# Deployment Guide: Vercel + Railway (Monorepo)

This guide will help you deploy your FutureIntern application with:
- **Frontend** on Vercel
- **Backend** on Railway
- **Using your existing monorepo:** https://github.com/seifbadreldinx/futureintern

## Prerequisites
- GitHub account (you already have your repo!)
- Vercel account (sign up at https://vercel.com)
- Railway account (sign up at https://railway.app)

---

## Part 1: Deploy Backend to Railway

### Step 1: Your Backend is Ready!
Your backend is already configured for Railway deployment from the monorepo with:
- ✅ `Procfile` - Tells Railway how to start the app
- ✅ `runtime.txt` - Specifies Python version
- ✅ `requirements.txt` - Lists Python dependencies
- ✅ `railway.json` - Railway configuration (updated for monorepo)
- ✅ `nixpacks.toml` - Build configuration (updated for monorepo)

### Step 2: Ensure Latest Code is on GitHub
```bash
# Navigate to your project root
cd "c:\Users\Seif Badreldin\Downloads\futureintern\futureintern"

# Add and commit any changes
git add .
git commit -m "Configure for Railway and Vercel deployment"

# Push to GitHub
git push origin main
```

If you haven't pushed yet:
```bash
git remote add origin https://github.com/seifbadreldinx/futureintern.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Railway
1. Go to https://railway.app and sign in with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your **futureintern** repository (https://github.com/seifbadreldinx/futureintern)
5. Railway will detect the backend configuration
6. **Important:** Set the root directory to `back/futureintern-backend`
   - In Railway dashboard → Settings → Root Directory → Enter: `back/futureintern-backend`

### Step 4: Configure Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production-2024
FLASK_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Important:** Generate a strong JWT secret key. You can use:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Step 5: Get Your Railway Backend URL
- Once deployed, Railway will give you a URL like: `https://your-app-name.up.railway.app`
- **Save this URL** - you'll need it for the frontend

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Your Frontend is Ready!
Your frontend is already configured for Vercel deployment from the monorepo with:
- ✅ `vercel.json` - Vercel configuration (updated for monorepo)
- ✅ `.env.example` - Environment variables template
- ✅ `.env.production` - Production environment variables

### Step 2: Update Production Environment Variables
Edit `front/.env.production` and replace with your Railway backend URL:

```
VITE_API_BASE_URL=https://your-app-name.up.railway.app/api
```

### Step 3: Push Changes to GitHub
```bash
# Navigate to your project root
cd "c:\Users\Seif Badreldin\Downloads\futureintern\futureintern"

# Add and commit changes
git add .
git commit -m "Update production API URL"
git push origin main
```

### Step 4: Deploy to Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import your **futureintern** repository (https://github.com/seifbadreldinx/futureintern)
4. **Important:** Configure the project settings:
   - **Root Directory:** Click "Edit" and select `front` folder
   - **Framework Preset:** Vite (should auto-detect)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### Step 5: Add Environment Variables
In Vercel project settings → Environment Variables, add:

```
VITE_API_BASE_URL=https://your-app-name.up.railway.app/api
```

Make sure to use your actual Railway backend URL!

### Step 6: Deploy
Click "Deploy" and Vercel will build and deploy your app.

---

## Part 3: Connect Frontend and Backend

### Update Railway with Frontend URL
1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` environment variable with your Vercel URL:
   ```
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
3. Redeploy the backend (Railway will auto-redeploy when you change env vars)

### Test the Integration
1. Visit your Vercel frontend URL
2. Try to sign up / log in
3. Test internship browsing and other features

---

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
- Make sure `FRONTEND_URL` in Railway matches your Vercel domain exactly
- Check that Railway has redeployed after updating the env variable

### API Connection Errors
- Verify `VITE_API_BASE_URL` in Vercel includes `/api` at the end
- Check Railway logs for backend errors

### Database Issues
- The app uses SQLite by default, which works on Railway
- For production, consider upgrading to Railway's PostgreSQL addon

---

## Deployment Checklist

### Backend (Railway)
- [ ] Code pushed to GitHub
- [ ] Railway project created and deployed
- [ ] Environment variables configured (`JWT_SECRET_KEY`, `FLASK_ENV`, `FRONTEND_URL`)
- [ ] Backend URL saved for frontend configuration

### Frontend (Vercel)
- [ ] Code pushed to GitHub
- [ ] `.env.production` updated with Railway backend URL
- [ ] Vercel project created and deployed
- [ ] Environment variable `VITE_API_BASE_URL` configured in Vercel

### Integration
- [ ] Railway `FRONTEND_URL` updated with Vercel domain
- [ ] Both services redeployed
- [ ] App tested end-to-end

---

## Useful Commands

### Redeploy Backend (Railway)
Railway auto-deploys on git push. To manually redeploy:
- Push a new commit to your GitHub repo
- Or use Railway dashboard "Redeploy" button

### Redeploy Frontend (Vercel)
Vercel auto-deploys on git push. To manually redeploy:
- Push a new commit to your GitHub repo
- Or use Vercel dashboard "Redeploy" button

### View Logs
- **Railway:** Dashboard → Deployments → Click deployment → View logs
- **Vercel:** Dashboard → Deployments → Click deployment → View function logs

---

## Production Best Practices

1. **Use Strong Secrets:** Generate strong JWT secret keys
2. **Enable HTTPS:** Both platforms provide free SSL certificates
3. **Database Upgrade:** Consider PostgreSQL on Railway for production
4. **Error Monitoring:** Set up error tracking (Sentry, etc.)
5. **Environment Variables:** Never commit `.env` files to Git
6. **Database Backups:** Railway provides backup options for PostgreSQL

---

## Cost Estimation

### Vercel (Frontend)
- **Free tier:** Includes hobby projects with generous limits
- Perfect for this application size

### Railway (Backend)
- **Free trial:** $5 credit (good for testing)
- **Starter plan:** $5/month + usage-based pricing
- Estimate: ~$5-10/month for small traffic

---

## Support

If you encounter issues:
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Check application logs in respective dashboards
