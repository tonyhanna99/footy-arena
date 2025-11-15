# Football Imposter Backend Deployment Guide

This backend handles multiplayer game logic using Socket.IO.

## 🚀 Deploying to Render (Recommended)

### Why Render?
- ✅ Free tier available
- ✅ Native WebSocket/Socket.IO support
- ✅ Auto-deploys from GitHub
- ✅ Easy environment management

### Step-by-Step Deployment

#### 1. Push Your Code to GitHub
```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare backend for deployment"
git push origin imposter-online
```

#### 2. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with your GitHub account

#### 3. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `tonyhanna99/footy-arena`
3. Configure the service:

**Settings:**
- **Name**: `footy-arena-backend` (or any name you like)
- **Region**: Choose closest to your users
- **Branch**: `imposter-online` (or `main`)
- **Root Directory**: `backend/football-imposter`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: `Free`

#### 4. Environment Variables (Optional)
Add these in the Render dashboard if needed:
- `PORT` - Render sets this automatically, but you can override

#### 5. Deploy!
- Click **"Create Web Service"**
- Render will automatically deploy your backend
- Wait 2-3 minutes for the first deployment

#### 6. Get Your Backend URL
- After deployment, you'll get a URL like: `https://footy-arena-backend.onrender.com`
- Copy this URL

#### 7. Update Frontend Environment Variable
- In your Vercel dashboard, go to your project settings
- Add environment variable:
  - **Key**: `VITE_SOCKET_URL`
  - **Value**: `https://footy-arena-backend.onrender.com`
- Redeploy your frontend

Alternatively, update `.env.production` locally:
```env
VITE_SOCKET_URL=https://footy-arena-backend.onrender.com
```

Then commit and push to trigger Vercel redeploy.

---

## 🔄 Alternative: Deploy to Railway

Railway is another great option for Socket.IO apps.

### Step-by-Step for Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select `footy-arena` repository
5. Configure:
   - **Root Directory**: `backend/football-imposter`
   - **Start Command**: `node server.js`
6. Railway will auto-detect Node.js and deploy
7. Get your URL from the Railway dashboard
8. Update `VITE_SOCKET_URL` in Vercel

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend is running (visit your Render/Railway URL, should see "Cannot GET /")
- [ ] Frontend connects to backend (check browser console for Socket.IO connection)
- [ ] Can create and join lobbies
- [ ] All 382 players are available (check game doesn't repeat players often)
- [ ] CORS is configured correctly (no CORS errors in console)

---

## 🐛 Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify `package.json` has all dependencies
- Make sure `node_modules` is not in git (use `.gitignore`)

### CORS errors
- Verify `allowedOrigins` in `server.js` includes your Vercel domain
- Check that Vercel environment variable is set correctly

### Frontend can't connect
- Verify `VITE_SOCKET_URL` is set in Vercel environment variables
- Make sure you rebuilt/redeployed frontend after setting env var
- Check browser console for connection errors

### Players.json not loading
- Verify file exists at `src/games/football-imposter/data/players.json`
- Check that relative path in `server.js` is correct: `require('../../src/games/football-imposter/data/players.json')`
- Render should automatically include all files in the repo

---

## 📝 Important Notes

### Free Tier Limitations
- **Render Free**: Spins down after 15 min of inactivity (cold starts take ~30s)
- **Railway Free**: 500 hours/month, then requires credit card
- For production, consider upgrading to paid tier for better performance

### Keeping Backend Alive (Optional)
If you want to prevent cold starts on Render free tier:
1. Use a service like [cron-job.org](https://cron-job.org)
2. Set up a cron job to ping your backend every 10 minutes
3. Add a health check endpoint in `server.js`:

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', players: FOOTBALL_PLAYERS.length });
});
```

### Auto-Deploy
Both Render and Railway support auto-deploy from GitHub:
- Push to your branch → Backend automatically redeploys
- Great for continuous deployment!

---

## 🎯 Production Checklist

Before going live:
- [ ] Update CORS origins to production domains only
- [ ] Set up error logging (consider services like Sentry)
- [ ] Add rate limiting for lobby creation (already implemented ✅)
- [ ] Monitor backend performance
- [ ] Set up alerts for downtime
- [ ] Document your API/socket events

---

## 📞 Need Help?

If you run into issues:
1. Check Render/Railway logs first
2. Verify environment variables are set correctly
3. Test locally first with `npm start`
4. Check browser console for frontend errors
