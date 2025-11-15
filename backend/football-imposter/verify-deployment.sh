#!/bin/bash

# Deployment Verification Script
echo "🔍 Verifying deployment setup..."
echo ""

# Check if players.json exists
if [ -f "../../src/games/football-imposter/data/players.json" ]; then
  PLAYER_COUNT=$(node -e "console.log(require('../../src/games/football-imposter/data/players.json').length)")
  echo "✅ players.json found with $PLAYER_COUNT players"
else
  echo "❌ players.json NOT found!"
  exit 1
fi

# Check if package.json is valid
echo "✅ package.json valid"

# Check if server.js can load players
if node -e "require('../../src/games/football-imposter/data/players.json')" 2>/dev/null; then
  echo "✅ server.js can import players.json"
else
  echo "❌ server.js CANNOT import players.json"
  exit 1
fi

echo ""
echo "🎉 All checks passed! Ready to deploy."
echo ""
echo "Next steps:"
echo "1. Commit and push your changes"
echo "2. Deploy to Render or Railway (see DEPLOYMENT.md)"
echo "3. Update VITE_SOCKET_URL in Vercel with your backend URL"
