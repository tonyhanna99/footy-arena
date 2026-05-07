/**
 * Phase 4b: Fetch club/team history for all players and store in players.clubs
 *
 * Calls GET /players/teams?player={id} for every player in Supabase.
 * Stores a trimmed array [ { id, name, seasons: [...] } ] in the `clubs` jsonb column.
 *
 * Usage:
 *   node scripts/fetch-player-teams.cjs
 *
 * Safe to re-run — resumes from teams-checkpoint.json, skips already-processed IDs.
 * Requires a `clubs` jsonb column on the players table in Supabase.
 */

'use strict';

require('../backend/node_modules/dotenv').config({ path: __dirname + '/../backend/.env' });
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const API_KEY  = process.env.API_FOOTBALL_KEY;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const RATE_LIMIT_MS    = 300;
const CHECKPOINT_EVERY = 25;
const CHECKPOINT_FILE  = path.join(__dirname, 'data', 'teams-checkpoint.json');

if (!API_KEY) { console.error('❌ API_FOOTBALL_KEY not set'); process.exit(1); }

// ─── Checkpoint helpers ───────────────────────────────────────────────────────

function loadDone() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return new Set(JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')).done);
  }
  return new Set();
}

function saveDone(done) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ done: [...done] }, null, 2));
}

// ─── API helper ───────────────────────────────────────────────────────────────

function apiGet(urlPath) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'v3.football.api-sports.io',
      path:     urlPath,
      method:   'GET',
      headers:  { 'x-apisports-key': API_KEY }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Only load players with no transfers — clubs is a fallback for transfer-less players only.
  // RULE: never populate clubs when transfers already exist.
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name')
    .is('transfers', null)
    .order('id');

  if (error) { console.error('❌ Supabase error:', error.message); process.exit(1); }

  console.log(`📡 ${players.length} players in Supabase`);

  const done      = loadDone();
  const remaining = players.filter(p => !done.has(p.id));

  console.log(`\n🔍 ${players.length} total players to process`);
  console.log(`   Already done: ${done.size}`);
  console.log(`   Remaining:    ${remaining.length}`);
  console.log('\n' + '─'.repeat(60));

  let updated = 0, failed = 0, ops = 0;

  for (const player of remaining) {
    let teamsData;

    try {
      const data = await apiGet(`/players/teams?player=${player.id}`);

      // Quota exceeded check
      const errStr = JSON.stringify(data.errors || {});
      if (errStr.includes('requests') || errStr.includes('rateLimit') || errStr.includes('Requests')) {
        console.log('\n⛔ Daily API quota exceeded — progress saved, re-run tomorrow');
        saveDone(done);
        process.exit(0);
      }

      if (!data.response || data.response.length === 0) {
        console.log(`  ⚠️  No teams returned for ${player.name} (${player.id})`);
        done.add(player.id);
        failed++;
        await sleep(RATE_LIMIT_MS);
        ops++;
        if (ops % CHECKPOINT_EVERY === 0) {
          saveDone(done);
          console.log(`  💾 Checkpoint saved (${done.size}/${players.length})`);
        }
        continue;
      }

      // Trim to { id, name, seasons } — drop logo URL
      teamsData = data.response.map(entry => ({
        id:      entry.team.id,
        name:    entry.team.name,
        seasons: entry.seasons,
      }));
    } catch (err) {
      console.error(`  ❌ API error for ${player.name} (${player.id}): ${err.message}`);
      failed++;
      await sleep(RATE_LIMIT_MS);
      ops++;
      continue;
    }

    // Update Supabase
    const { error: dbErr } = await supabase
      .from('players')
      .update({ clubs: teamsData, last_updated: new Date().toISOString() })
      .eq('id', player.id);

    if (dbErr) {
      console.error(`  ❌ DB error for ${player.name} (${player.id}): ${dbErr.message}`);
      failed++;
    } else {
      const teamNames = teamsData.slice(0, 3).map(t => t.name).join(', ');
      const more = teamsData.length > 3 ? ` +${teamsData.length - 3} more` : '';
      console.log(`  ✅ ${player.name} (${player.id}) — ${teamsData.length} teams: ${teamNames}${more}`);
      updated++;
    }

    done.add(player.id);
    await sleep(RATE_LIMIT_MS);
    ops++;

    if (ops % CHECKPOINT_EVERY === 0) {
      saveDone(done);
      console.log(`  💾 Checkpoint saved (${done.size}/${players.length})`);
    }
  }

  saveDone(done);

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Teams fetch complete');
  console.log(`   Updated:         ${updated}`);
  console.log(`   Failed / skipped: ${failed}`);
  console.log('═'.repeat(60));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
