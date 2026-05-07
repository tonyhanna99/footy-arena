/**
 * Phase 4c: Fetch transfer history for all players → store in players.transfers
 *
 * Calls GET /transfers?player={id} for every player in Supabase.
 * Stores an array of transfers (sorted newest first) in the `transfers` jsonb column.
 * Each entry: { date, type, team_in: { id, name, logo }, team_out: { id, name, logo } }
 *
 * Deduplicates same-date/same-team entries from API, keeping the one with a real team ID.
 *
 * Usage:
 *   node scripts/fetch-transfers.cjs
 *
 * Safe to re-run — resumes from transfers-checkpoint.json.
 * Requires a `transfers` jsonb column on the players table in Supabase.
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
const CHECKPOINT_FILE  = path.join(__dirname, 'data', 'transfers-checkpoint.json');

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
        catch (e) { reject(new Error('JSON parse error: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Dedup transfers ──────────────────────────────────────────────────────────
// Some players have duplicate entries for the same transfer with one having null ID.
// Keep the entry with a real team ID; if both have IDs, keep both (different clubs).

function deduplicateTransfers(transfers) {
  const seen = new Map(); // key: "date|team_in_name_normalized"

  // Sort so entries with real IDs come first
  const sorted = [...transfers].sort((a, b) => {
    const aHasId = (a.team_in.id !== null) ? 0 : 1;
    const bHasId = (b.team_in.id !== null) ? 0 : 1;
    return aHasId - bHasId;
  });

  const result = [];
  for (const t of sorted) {
    const normName = (t.team_in.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = (t.date || '') + '|' + normName;
    if (!seen.has(key)) {
      seen.set(key, true);
      result.push(t);
    }
  }

  // Sort final result newest first
  return result.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name')
    .order('id');

  if (error) { console.error('❌ Supabase error:', error.message); process.exit(1); }

  const done      = loadDone();
  const remaining = players.filter(p => !done.has(p.id));

  console.log('📡 ' + players.length + ' players in Supabase');
  console.log('\n🔍 Total to process: ' + players.length);
  console.log('   Already done: ' + done.size);
  console.log('   Remaining:    ' + remaining.length);
  console.log('\n' + '─'.repeat(60));

  let updated = 0, noData = 0, failed = 0, ops = 0;

  for (const player of remaining) {
    let transfers;

    try {
      const data = await apiGet('/transfers?player=' + player.id);

      // Quota check
      const errStr = JSON.stringify(data.errors || {});
      if (errStr.includes('requests') || errStr.includes('rateLimit') || errStr.includes('Requests')) {
        console.log('\n⛔ Daily API quota exceeded — progress saved, re-run tomorrow');
        saveDone(done);
        process.exit(0);
      }

      if (!data.response || data.response.length === 0 || !data.response[0].transfers) {
        console.log('  ⚠️  No transfers for ' + player.name + ' (' + player.id + ')');
        done.add(player.id);
        noData++;
        await sleep(RATE_LIMIT_MS);
        ops++;
        if (ops % CHECKPOINT_EVERY === 0) { saveDone(done); console.log('  💾 Checkpoint saved (' + done.size + '/' + players.length + ')'); }
        continue;
      }

      // Map to clean structure, keeping logos for career path UI
      const raw = data.response[0].transfers.map(t => ({
        date:     t.date || null,
        type:     t.type || null,
        team_in:  { id: t.teams.in.id  || null, name: t.teams.in.name,  logo: t.teams.in.logo  || null },
        team_out: { id: t.teams.out.id || null, name: t.teams.out.name, logo: t.teams.out.logo || null },
      }));

      transfers = deduplicateTransfers(raw);

    } catch (err) {
      console.error('  ❌ API error for ' + player.name + ' (' + player.id + '): ' + err.message);
      failed++;
      await sleep(RATE_LIMIT_MS);
      ops++;
      continue;
    }

    const { error: dbErr } = await supabase
      .from('players')
      .update({ transfers, last_updated: new Date().toISOString() })
      .eq('id', player.id);

    if (dbErr) {
      console.error('  ❌ DB error for ' + player.name + ' (' + player.id + '): ' + dbErr.message);
      failed++;
    } else {
      const chrono = [...transfers].reverse(); // oldest first for display
      const clubs = chrono.slice(0, 3).map(t => t.team_in.name).join(' → ');
      const more  = transfers.length > 3 ? ' (+' + (transfers.length - 3) + ' more)' : '';
      console.log('  ✅ ' + player.name + ' (' + player.id + ') — ' + transfers.length + ' transfers: ' + clubs + more);
      updated++;
    }

    done.add(player.id);
    await sleep(RATE_LIMIT_MS);
    ops++;

    if (ops % CHECKPOINT_EVERY === 0) {
      saveDone(done);
      console.log('  💾 Checkpoint saved (' + done.size + '/' + players.length + ')');
    }
  }

  saveDone(done);

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Transfers fetch complete');
  console.log('   Updated:          ' + updated);
  console.log('   No transfer data: ' + noData);
  console.log('   Failed:           ' + failed);
  console.log('═'.repeat(60));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
