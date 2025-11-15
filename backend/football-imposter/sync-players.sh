#!/bin/bash

# Sync players.json between frontend and backend
# Run this whenever you update the player list

SOURCE="../../src/games/football-imposter/data/players.json"
DEST="./players.json"

if [ ! -f "$SOURCE" ]; then
  echo "❌ Source file not found: $SOURCE"
  exit 1
fi

cp "$SOURCE" "$DEST"

PLAYER_COUNT=$(node -e "console.log(require('./players.json').length)")

echo "✅ Synced players.json"
echo "📊 Total players: $PLAYER_COUNT"
echo ""
echo "Frontend: $SOURCE"
echo "Backend:  $DEST"
