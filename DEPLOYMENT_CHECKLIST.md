# Deployment Checklist for futureintern

Repository: https://github.com/seifbadreldinx/futureintern

## Pre-Deployment

- [ ] All code changes committed and pushed to GitHub
- [ ] Railway account created
- [ ] Vercel account created

## Railway Backend Deployment

- [ ] Go to https://railway.app
- [ ] Sign in with GitHub
- [ ] Click "New Project" → "Deploy from GitHub repo"
- [ ] Select **seifbadreldinx/futureintern**
- [ ] Set Root Directory: `back/futureintern-backend`
- [ ] Add environment variables:
  - [ ] `JWT_SECRET_KEY` (use: `python -c "import secrets; print(secrets.token_hex(32))"`)
  - [ ] `FLASK_ENV=production`
  - [ ] `FRONTEND_URL` (update after Vercel deployment)
- [ ] Wait for deployment to complete
- [ ] Copy Railway URL: ___________________________

## Vercel Frontend Deployment

- [ ] Go to https://vercel.com
- [ ] Sign in with GitHub
- [ ] Click "Add New Project"
- [ ] Import **seifbadreldinx/futureintern**
- [ ] Set Root Directory: `front`
- [ ] Verify build settings:
  - [ ] Framework: Vite
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
- [ ] Add environment variable:
  - [ ] `VITE_API_BASE_URL` = Railway URL + `/api`
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Copy Vercel URL: ___________________________

## Final Configuration

- [ ] Go back to Railway → Variables
- [ ] Update `FRONTEND_URL` with Vercel URL
- [ ] Wait for Railway to redeploy
- [ ] Test the application:
  - [ ] Visit Vercel URL
  - [ ] Sign up works
  - [ ] Login works
  - [ ] Browse internships works
  - [ ] No CORS errors in console

## Troubleshooting

If you see errors:
- Check Railway logs: Railway Dashboard → Deployments → Click deployment → View logs
- Check Vercel logs: Vercel Dashboard → Deployments → Click deployment → View logs
- Check browser console for frontend errors
- Verify environment variables are set correctly

## URLs

- **GitHub:** https://github.com/seifbadreldinx/futureintern
- **Railway:** ___________________________
- **Vercel:** ___________________________

---

✅ Deployment Complete! Share your Vercel URL with users.
