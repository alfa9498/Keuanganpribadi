# Vercel Environment Variables Setup Guide

## 🚨 Critical: Production 401 Error Fix

If you're experiencing 401 errors on login in production, it's because `VITE_API_URL` is not set in Vercel.

## Frontend Environment Variables

Add these in **Vercel Dashboard → Project Settings → Environment Variables**:

### Production Environment

```
VITE_API_URL=https://your-backend-domain.vercel.app
VITE_SOCKET_URL=https://your-backend-domain.vercel.app
```

**Important Notes:**

- Replace `your-backend-domain` with your actual backend Vercel URL
- Both frontend and backend should be deployed separately on Vercel
- Or use the same domain if backend is in `/api` routes

### Example Setup:

If your deployments are:

- Frontend: `https://keuanganpribadi-frontend.vercel.app`
- Backend: `https://keuanganpribadi-backend.vercel.app`

Then set:

```
VITE_API_URL=https://keuanganpribadi-backend.vercel.app
VITE_SOCKET_URL=https://keuanganpribadi-backend.vercel.app
```

## Backend Environment Variables

Already configured in your `.env` file, but make sure these are also in Vercel:

```
DB_HOST=your_tidb_host
DB_USER=your_tidb_user
DB_PASSWORD=your_tidb_password
DB_NAME=myapp_db
DB_PORT=4000
DB_SSL=true

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

TELEGRAM_BOT_TOKEN=your_telegram_bot_token

VERCEL=1
VERCEL_URL=auto-set-by-vercel
WEBHOOK_URL=https://your-backend-domain.vercel.app
```

## How to Set in Vercel:

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with:
   - **Key**: Variable name (e.g., `VITE_API_URL`)
   - **Value**: Variable value
   - **Environment**: Select **Production** (or All)
5. Click **Save**
6. **Redeploy** your project for changes to take effect

## After Setting Variables:

1. Trigger a new deployment (or wait for auto-deploy)
2. Check browser console to verify API calls go to correct URL
3. Login should now work without 401 errors
