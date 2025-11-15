# 🚀 Quick Deployment Guide

## What You Need to Deploy

Your backend consists of:
1. ✅ `server.js` - Socket.IO server
2. ✅ `package.json` - Dependencies (Express, Socket.IO, CORS)
3. ✅ `../../src/games/football-imposter/data/players.json` - **382 players** (shared with frontend)

All files are ready and verified! ✅

---

## 📋 Step-by-Step Deployment (Choose One)

### Option A: Render (Recommended - Best for Free Tier)

**Time: ~5 minutes**

1. **Commit & Push Your Code**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin imposter-online
   ```

2. **Go to Render**
   - Visit: https://render.com
   - Sign up/login with GitHub

3. **Create Web Service**
   - Click **"New +"** → **"Web Service"**
   - Select your repo: `tonyhanna99/footy-arena`
   - **Root Directory**: `backend/football-imposter`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - Click **"Create Web Service"**

4. **Copy Your Backend URL**
   - After deployment, copy the URL (e.g., `https://footy-arena-backend.onrender.com`)

5. **Update Frontend in Vercel**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add: `VITE_SOCKET_URL` = `https://footy-arena-backend.onrender.com`
   - Redeploy frontend

---

### Option B: Railway (Alternative)

**Time: ~5 minutes**

1. **Commit & Push** (same as above)

2. **Go to Railway**
   - Visit: https://railway.app
   - Sign up/login with GitHub

3. **Deploy**
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select `footy-arena`
   - **Root Directory**: `backend/football-imposter`
   - Railway auto-detects Node.js

4. **Get URL & Update Frontend** (same as above)

---

## ✅ After Deployment Checklist

- [ ] Backend URL is live (visit it, should show "Cannot GET /")
- [ ] Frontend deployed with `VITE_SOCKET_URL` environment variable
- [ ] Can create a lobby (test it!)
- [ ] Can join a lobby
- [ ] Players are randomized (no Kevin De Bruyne twice in 6 games!)
- [ ] No CORS errors in browser console

---

## 🎯 What Happens with players.json

✅ **The JSON file WILL be deployed automatically** because:

1. It's in your Git repository at `src/games/football-imposter/data/players.json`
2. Your `server.js` imports it with: `require('../../src/games/football-imposter/data/players.json')`
3. Render/Railway deploy your **entire repository**, including all directories
4. The relative path works because the folder structure is preserved

**You don't need to do anything special!** The deployment service will:
- Clone your entire repo
- Keep the folder structure intact
- The `require()` statement will find the file automatically

---

## 🐛 Troubleshooting

### "Cannot find module '../../src/games/football-imposter/data/players.json'"

This should NOT happen because:
- The file exists in your repo ✅
- The path is correct ✅  
- The file is committed to Git ✅

But if it does:
1. Check Render/Railway logs
2. Verify the file is in your Git repository: `git ls-files | grep players.json`
3. Make sure you pushed all changes

### Frontend Can't Connect

- Clear browser cache
- Check environment variable is set in Vercel
- Redeploy frontend after adding env var
- Check browser console for errors

---

## 💡 Pro Tips

### Keep Backend Alive (Optional)
Free tier backends "sleep" after 15 min of inactivity. To keep it alive:

1. Add health endpoint to `server.js`:
   ```javascript
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', players: FOOTBALL_PLAYERS.length });
   });
   ```

2. Use cron-job.org to ping it every 10 minutes:
   - Visit: https://cron-job.org
   - Create job: `https://your-backend.onrender.com/health`
   - Schedule: Every 10 minutes

### Monitor Your Backend
- Render/Railway provide free logs
- Check logs if something breaks
- Set up email alerts for downtime

---

## 📞 Need Help?

If deployment fails:
1. Read the full guide: `DEPLOYMENT.md`
2. Check deployment logs in Render/Railway
3. Verify `package.json` has all dependencies
4. Test locally first: `npm start`

---

## 🎉 You're Ready!

Everything is configured and verified. Just:
1. Push to GitHub
2. Deploy to Render/Railway
3. Update Vercel environment variable
4. Test your game!

The `players.json` file will automatically be included in the deployment. No extra steps needed! ✅
