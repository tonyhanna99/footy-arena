#!/usr/bin/env node

/**
 * Sync player data from frontend to backend
 * Run this script whenever you update src/shared/data/players.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Import the frontend players data
const frontendPlayersPath = path.join(__dirname, '../src/shared/data/players.js');
const backendPlayersPath = path.join(__dirname, '../backend/football-imposter/players.json');
const frontendJsonPath = path.join(__dirname, '../src/games/football-imposter/data/players.json');

// Read the frontend file
const frontendContent = fs.readFileSync(frontendPlayersPath, 'utf8');

// Extract the FOOTBALL_PLAYERS array using regex
const match = frontendContent.match(/export const FOOTBALL_PLAYERS = (\[[\s\S]*?\]);/);

if (!match) {
  console.error('❌ Could not find FOOTBALL_PLAYERS array in players.js');
  process.exit(1);
}

// Create a safe evaluation context
const playersArrayString = match[1];

try {
  // Use vm.runInNewContext for safer evaluation
  const players = vm.runInNewContext(`(${playersArrayString})`);
  
  // Write full player objects to both backend and frontend JSON
  fs.writeFileSync(
    backendPlayersPath,
    JSON.stringify(players, null, 2),
    'utf8'
  );
  
  // Frontend JSON also gets the full objects (will destructure .name when needed)
  fs.writeFileSync(
    frontendJsonPath,
    JSON.stringify(players, null, 2),
    'utf8'
  );
  
  console.log('✅ Successfully synced players data!');
  console.log(`📊 Total players: ${players.length}`);
  console.log(`📍 Frontend source: ${frontendPlayersPath}`);
  console.log(`📍 Backend target: ${backendPlayersPath}`);
  console.log(`📍 Frontend JSON: ${frontendJsonPath}`);
  
  const withImages = players.filter(p => p.image).length;
  const withoutImages = players.length - withImages;
  console.log(`🖼️  With images: ${withImages}`);
  console.log(`❓ Without images: ${withoutImages}`);
  
} catch (error) {
  console.error('❌ Error syncing players:', error.message);
  process.exit(1);
}
