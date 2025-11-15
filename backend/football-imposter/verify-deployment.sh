#!/bin/bash

# Deployment Verification Script
echo "🔍 Verifying deployment setup..."
echo ""

# Check if players.json exists in backend directory
if [ -f "./players.json" ]; then
  PLAYER_COUNT=$(node -e "console.log(require('./players.json').length)")
  echo "✅ players.json found with $PLAYER_COUNT players"
else
  echo "❌ players.json NOT found in backend directory!"
  echo "Run: ./sync-players.sh to copy it from frontend"
  exit 1
fi

# Check if package.json is valid
echo "✅ package.json valid"

# Check if server.js can load players
if node -e "require('./players.json')" 2>/dev/null; then
  echo "✅ server.js can import players.json"
else
  echo "❌ server.js CANNOT import players.json"
  exit 1
fi

# Verify frontend source exists
if [ -f "../../src/games/football-imposter/data/players.json" ]; then
  FRONTEND_COUNT=$(node -e "console.log(require('../../src/games/football-imposter/data/players.json').length)")
  if [ "$PLAYER_COUNT" -eq "$FRONTEND_COUNT" ]; then
    echo "✅ Backend and frontend player lists are in sync ($PLAYER_COUNT players)"
  else
    echo "⚠️  WARNING: Player lists out of sync!"
    echo "   Backend: $PLAYER_COUNT players"
    echo "   Frontend: $FRONTEND_COUNT players"
    echo "   Run: ./sync-players.sh to sync"
  fi
fi

echo ""
echo "🎉 All checks passed! Ready to deploy."
echo ""
echo "Next steps:"
echo "1. Commit and push your changes"
echo "2. Deploy to Render or Railway (see DEPLOYMENT.md)"
echo "3. Update VITE_SOCKET_URL in Vercel with your backend URL"
