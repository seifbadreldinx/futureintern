# Quick Fix: "Failed to load internships"

## The Problem
The frontend (React) needs the backend (Flask) to be running to load data.

## The Solution - 3 Easy Steps

### Option 1: Use the Startup Script (Easiest!)

1. **Double-click** `START-ALL.bat` in the project folder
2. Two windows will open:
   - Backend window (Flask server)
   - Frontend window (Vite dev server)
3. **Wait 10 seconds** for both to start
4. Open browser: http://localhost:5173
5. **Keep both windows open!**

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd back/futureintern-backend
python run.py
```
Leave this running!

**Terminal 2 - Frontend (NEW WINDOW):**
```bash
cd front
npm run dev
```
Leave this running too!

**Then open:** http://localhost:5173

---

## Why This Happens

The error occurs when:
- ❌ Backend is not running
- ❌ Frontend can't connect to http://localhost:5000
- ❌ Only one server is running instead of both

## What Should You See

**Backend Terminal:**
```
✅ Database tables verified/created successfully
 * Running on http://127.0.0.1:5000
```

**Frontend Terminal:**
```
➜  Local:   http://localhost:5173/
```

**Browser Console (F12):**
- No red errors
- Internships load successfully

---

## Still Not Working?

### 1. Check Backend is Running
Open in browser: http://localhost:5000

You should see:
```json
{
  "message": "🚀 FutureIntern Backend API",
  "status": "running"
}
```

If not, backend isn't running!

### 2. Check Database Has Data
```bash
cd back/futureintern-backend
python -c "from app import create_app, db; from app.models.intern import Internship; app = create_app(); app.app_context().push(); print(f'Internships: {Internship.query.count()}')"
```

Should show: `Internships: 30`

If 0, run:
```bash
python import_excel_data.py
```

### 3. Check Frontend .env File
File: `front/.env`
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Clear Browser Cache
- Press `Ctrl + Shift + Delete`
- Clear cached data
- Refresh page

---

## Production (Vercel/Railway)

If deployed and getting this error:

1. **Check Railway backend is running:**
   - Go to Railway dashboard
   - Check deployment status
   - View logs for errors

2. **Check Vercel environment variable:**
   - Go to Vercel project settings
   - Environment Variables
   - Verify `VITE_API_BASE_URL` = your Railway URL

3. **Check CORS:**
   - In Railway, verify `FRONTEND_URL` = your Vercel URL
   - Redeploy backend if you changed it

---

## Quick Checklist

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] Both terminal windows are open
- [ ] Database has 30 internships
- [ ] No errors in browser console (F12)
- [ ] Backend URL in frontend .env is correct

---

## Need Help?

1. Check both terminal windows for errors
2. Look at browser console (F12 → Console tab)
3. Try closing everything and using START-ALL.bat again
