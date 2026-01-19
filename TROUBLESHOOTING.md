# Troubleshooting Guide: "Failed to load internships"

## Quick Checks

### 1. Verify Backend is Running
Open a new terminal and run:
```bash
cd back/futureintern-backend
python run.py
```

You should see:
```
✅ Database tables verified/created successfully
 * Running on http://127.0.0.1:5000
```

### 2. Test API Directly
In PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/internships" -UseBasicParsing
```

Expected: Status 200 with JSON data containing internships

### 3. Verify Frontend is Running
```bash
cd front
npm run dev
```

You should see:
```
➜  Local:   http://localhost:5173/
```

### 4. Check Browser Console
1. Open http://localhost:5173/browse in your browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for errors (usually red text)

## Common Issues & Solutions

### Issue 1: CORS Error
**Symptom**: Console shows "CORS policy" error

**Solution**: Backend .env should have:
```
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Issue 2: Backend Not Running
**Symptom**: "Unable to connect" or "Network Error"

**Solution**:
```bash
cd back/futureintern-backend
python run.py
```

### Issue 3: Wrong API URL
**Symptom**: 404 errors in console

**Solution**: Check `front/.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Issue 4: Database Empty
**Symptom**: No internships showing, but no errors

**Solution**: Re-import data:
```bash
cd back/futureintern-backend
python import_excel_data.py
```

## Verification Steps

1. **Test Backend Health**:
   ```powershell
   curl http://localhost:5000/
   ```
   Should return JSON with status "running"

2. **Test Internships Endpoint**:
   ```powershell
   curl http://localhost:5000/api/internships
   ```
   Should return JSON with "total": 30

3. **Check Database**:
   ```powershell
   cd back/futureintern-backend
   python -c "from app import create_app, db; from app.models.intern import Internship; app = create_app(); app.app_context().push(); print(f'Total: {Internship.query.count()}')"
   ```
   Should print "Total: 30"

## Still Not Working?

1. Clear browser cache (Ctrl + Shift + Del)
2. Restart both servers
3. Check firewall isn't blocking localhost:5000
4. Try opening http://localhost:5173/browse in incognito mode
5. Check the Network tab in Developer Tools to see the actual request/response

## Current Status
- ✅ Database has 30 internships
- ✅ Backend code is correct
- ✅ Frontend code is correct
- ❓ Need to verify servers are both running simultaneously
