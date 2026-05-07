/**
 * lookup-player.cjs  — debug helper
 * Usage: node scripts/lookup-player.cjs <search term>
 * Shows all players returned by /players/profiles?search=<term>
 */
require('../backend/node_modules/dotenv/config');
const path = require('path');
// Explicit env load from backend
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const fetch = (...args) => import('../backend/node_modules/node-fetch/src/index.js').then(m => m.default(...args));

const API_KEY  = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function lookup(term) {
  const url = `${BASE_URL}/players/profiles?search=${encodeURIComponent(term)}`;
  const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } });
  const data = await res.json();

  console.log(`\n🔍 Search: "${term}" → ${data.results} results (${data.paging?.total || 1} page(s))\n`);
  for (const item of (data.response || [])) {
    const p = item.player;
    console.log(`  ID: ${p.id}  |  name: "${p.name}"  |  first: "${p.firstname}"  |  last: "${p.lastname}"  |  nat: "${p.nationality}"  |  pos: "${p.position}"`);
  }

  if (data.paging?.total > 1) {
    const url2 = `${BASE_URL}/players/profiles?search=${encodeURIComponent(term)}&page=2`;
    const res2 = await fetch(url2, { headers: { 'x-apisports-key': API_KEY } });
    const data2 = await res2.json();
    console.log(`\n  --- page 2 ---`);
    for (const item of (data2.response || [])) {
      const p = item.player;
      console.log(`  ID: ${p.id}  |  name: "${p.name}"  |  first: "${p.firstname}"  |  last: "${p.lastname}"  |  nat: "${p.nationality}"  |  pos: "${p.position}"`);
    }
  }
}

const term = process.argv[2];
if (!term) { console.error('Usage: node scripts/lookup-player.cjs <search term>'); process.exit(1); }
lookup(term).catch(console.error);
