#!/bin/bash

# Start all backend servers for FootyArena games

echo "🚀 Starting all FootyArena backend servers..."
echo ""

# Start Football Imposter server (port 3000) - Also used by Guess Who
echo "📡 Starting Football Imposter/Guess Who server (port 3000)..."
cd backend/football-imposter
node server.js &
IMPOSTER_PID=$!
cd ../..

# Wait a moment
sleep 2

# Start Football Alphabet server (port 3002)
echo "📡 Starting Football Alphabet server (port 3002)..."
cd backend/football-alphabet
node server.js &
ALPHABET_PID=$!
cd ../..

echo ""
echo "✅ All servers started!"
echo ""
echo "📊 Server Status:"
echo "  - Football Imposter & Guess Who: http://localhost:3000 (PID: $IMPOSTER_PID)"
echo "  - Football Alphabet: http://localhost:3002 (PID: $ALPHABET_PID)"
echo ""
echo "⚠️  To stop all servers, press Ctrl+C"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping all servers...'; kill $IMPOSTER_PID $ALPHABET_PID 2>/dev/null; exit" INT TERM

# Keep script running
wait
