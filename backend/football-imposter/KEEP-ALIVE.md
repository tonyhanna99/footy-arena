# Keep Backend Alive - Uptime Monitoring Guide

Your Render backend goes to sleep after 15 minutes of inactivity on the free tier. This guide shows you how to keep it awake using free cron services.

## ✅ Health Endpoints Available

Your backend now has these endpoints:

### 1. `/ping` - Minimal Response
```
GET https://footy-arena-backend.onrender.com/ping
Response: "pong"
```
**Use this for cron jobs** - fastest, minimal bandwidth.

### 2. `/health` - Detailed Stats
```
GET https://footy-arena-backend.onrender.com/health
Response: {
  "status": "healthy",
  "uptime": { "hours": 2, "minutes": 45, "human": "2h 45m" },
  "activeLobbies": 3,
  "totalPlayers": 382,
  "activeSockets": 5
}
```
**Use this for monitoring** - shows server health and stats.

---

## 🔧 Setup Free Uptime Monitoring

### Option 1: Cron-Job.org (Recommended - Easiest)

**Why:** Free, reliable, no signup needed for basic use.

1. **Go to**: https://cron-job.org
2. **Sign up** (free account)
3. **Create New Cron Job**:
   - **Title**: `Footy Arena Backend Keep-Alive`
   - **URL**: `https://footy-arena-backend.onrender.com/ping`
   - **Schedule**: Every 10 minutes
     - Pattern: `*/10 * * * *`
   - **Save and enable**

✅ Done! Your backend will be pinged every 10 minutes.

---

### Option 2: UptimeRobot (Best for Monitoring)

**Why:** Free monitoring + alerts if server goes down.

1. **Go to**: https://uptimerobot.com
2. **Sign up** (free account - up to 50 monitors)
3. **Add New Monitor**:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Footy Arena Backend`
   - **URL**: `https://footy-arena-backend.onrender.com/health`
   - **Monitoring Interval**: 5 minutes (free tier)
   - **Save**

**Bonus**: Set up email/SMS alerts if server goes down!

---

### Option 3: BetterUptime (Free + Status Page)

**Why:** Professional monitoring + public status page for users.

1. **Go to**: https://betteruptime.com
2. **Sign up** (free for 1 monitor)
3. **Create HTTP Monitor**:
   - **URL**: `https://footy-arena-backend.onrender.com/health`
   - **Name**: `Footy Arena Backend`
   - **Check frequency**: 3 minutes
   
**Bonus**: Create a public status page at `status.footyarena.com`!

---

## 🎯 Recommended Setup (Best of Both Worlds)

Use **TWO** services for redundancy:

1. **UptimeRobot** (Primary)
   - Monitors `/health` every 5 minutes
   - Sends alerts if down
   - Free dashboard to check uptime %

2. **Cron-Job.org** (Backup)
   - Pings `/ping` every 10 minutes
   - Ensures server stays warm
   - Redundancy if UptimeRobot fails

---

## 📊 How It Works

### Without Monitoring:
```
User visits → Server cold (asleep) → 30s wait → Page loads ❌
```

### With Monitoring:
```
Cron pings every 10 min → Server always warm → Instant loads ✅
```

---

## ⚙️ Advanced: Self-Hosted Ping (Optional)

If you want to ping from your own frontend:

### Add to Your Frontend (App.jsx or main.jsx):

```javascript
// Keep backend alive - ping every 10 minutes
useEffect(() => {
  // Only run in production
  if (import.meta.env.PROD) {
    const pingBackend = () => {
      fetch('https://footy-arena-backend.onrender.com/ping')
        .catch(() => {}); // Ignore errors
    };
    
    // Ping immediately on load
    pingBackend();
    
    // Then ping every 10 minutes
    const interval = setInterval(pingBackend, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }
}, []);
```

**Pros**: No external dependency
**Cons**: Only works when users have your site open

---

## 📈 Monitor Your Uptime

Test your health endpoint:
```bash
curl https://footy-arena-backend.onrender.com/health
```

You should see:
```json
{
  "status": "healthy",
  "uptime": { "hours": 5, "minutes": 342, "human": "5h 42m" },
  "activeLobbies": 2,
  "totalPlayers": 382,
  "activeSockets": 4
}
```

---

## 🎯 Quick Start (Do This Now!)

1. **Set up Cron-Job.org** (5 minutes):
   - Go to https://cron-job.org
   - Create job for `https://footy-arena-backend.onrender.com/ping`
   - Schedule: `*/10 * * * *` (every 10 minutes)

2. **Done!** Your backend will stay alive 24/7 ✅

---

## 💡 Cost Comparison

| Solution | Free Tier | Paid Upgrade |
|----------|-----------|--------------|
| Cron-Job.org | Unlimited jobs | €2.99/mo for more features |
| UptimeRobot | 50 monitors, 5-min checks | $7/mo for 1-min checks |
| BetterUptime | 1 monitor | $20/mo for team features |
| Render (upgrade) | N/A | $7/mo for always-on server |

**Recommendation**: Use free tier of Cron-Job.org + UptimeRobot. Total cost: **$0/month** ✅

---

## ✅ Verify It's Working

After setting up:

1. Wait 15 minutes (let Render sleep)
2. Visit https://footy-arena-backend.onrender.com/health
3. Check `uptime.human` - should be > 15 minutes!
4. If working, your cron job is keeping it alive ✅

---

## 🚨 Important Notes

### Cold Start Still Happens If:
- Your cron job fails
- Render restarts the server (deployments, etc.)
- Service outage

**Solution**: Use 2 monitoring services for redundancy!

### Render Free Tier Limits:
- 750 hours/month free
- With cron pinging every 10 min, you'll use ~730 hours/month
- **You're safe!** Won't hit the limit ✅

---

## 🎉 Summary

1. ✅ Backend has `/ping` and `/health` endpoints
2. ✅ Set up Cron-Job.org to ping every 10 minutes
3. ✅ Optional: Add UptimeRobot for monitoring + alerts
4. ✅ Backend stays warm 24/7 for free!

Your users will never experience cold starts again! 🚀
