/**
 * Phase 4: Enrich players — fetch profiles from API-Football and upsert to Supabase
 *
 * Two modes per player:
 *   'full'       — new players from new-player-ids.json: full upsert (all fields + photo)
 *   'photo_only' — existing players already in Supabase: update photo column only
 *
 * Usage:
 *   node scripts/enrich-players.cjs
 *
 * Safe to re-run — resumes from enrich-checkpoint.json, skips already-processed IDs.
 * Stops gracefully if daily API quota is exceeded and saves progress.
 */

'use strict';

require('../backend/node_modules/dotenv').config({ path: __dirname + '/../backend/.env' });
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');
const https = require('https');
const fs   = require('fs');
const path = require('path');

const API_KEY  = process.env.API_FOOTBALL_KEY;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const RATE_LIMIT_MS    = 300;
const CHECKPOINT_EVERY = 25;

const NEW_IDS_FILE      = path.join(__dirname, 'data', 'new-player-ids.json');
const CHECKPOINT_FILE   = path.join(__dirname, 'data', 'enrich-checkpoint.json');

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
        catch (e) { reject(new Error('Failed to parse API response')); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Load curated new players
  const newPlayers   = JSON.parse(fs.readFileSync(NEW_IDS_FILE, 'utf8'));
  const newPlayerMap = new Map(newPlayers.map(p => [p.id, p.name])); // id → curated name

  // 2. Load existing player IDs from Supabase
  const { data: existingRows, error: fetchErr } = await supabase
    .from('players')
    .select('id')
    .order('id');

  if (fetchErr) {
    console.error('❌ Failed to load existing players:', fetchErr.message);
    process.exit(1);
  }

  const existingIds = new Set((existingRows || []).map(r => r.id));
  console.log(`📡 ${existingIds.size} players already in Supabase`);
  console.log(`📋 ${newPlayers.length} new players to add\n`);

  // 3. Build work list
  //    - new players    → full upsert (all profile fields + photo)
  //    - existing-only  → photo_only update
  const workList = [];

  for (const p of newPlayers) {
    workList.push({ id: p.id, name: p.name, mode: 'full' });
  }
  for (const row of existingRows) {
    if (!newPlayerMap.has(row.id)) {
      workList.push({ id: row.id, name: null, mode: 'photo_only' });
    }
  }

  // 4. Filter already-done
  const done      = loadDone();
  const remaining = workList.filter(p => !done.has(p.id));

  console.log(`🔍 ${workList.length} total players to process`);
  console.log(`   Already done: ${done.size}`);
  console.log(`   Remaining:    ${remaining.length}\n`);
  console.log('─'.repeat(60));

  let inserted = 0, photoUpdated = 0, failed = 0, ops = 0;

  for (const entry of remaining) {
    // Fetch profile
    let profile;
    try {
      const data = await apiGet(`/players/profiles?player=${entry.id}`);

      // Quota exceeded check
      const errStr = JSON.stringify(data.errors || {});
      if (errStr.includes('requests') || errStr.includes('rateLimit') || errStr.includes('Requests')) {
        console.log('\n⛔ Daily API quota exceeded — progress saved, re-run tomorrow');
        saveDone(done);
        process.exit(0);
      }

      if (!data.response || data.response.length === 0) {
        console.log(`  ⚠️  No profile returned for ID ${entry.id}${entry.name ? ` (${entry.name})` : ''}`);
        done.add(entry.id); // skip next time too
        failed++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      profile = data.response[0].player;
    } catch (err) {
      console.error(`  ❌ API error for ID ${entry.id}: ${err.message}`);
      failed++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    const photoUrl = profile.photo || null;

    if (entry.mode === 'full') {
      // ── Full upsert for new players ────────────────────────────────────────
      const heightRaw = profile.height;
      const weightRaw = profile.weight;
      const height    = heightRaw ? parseInt(String(heightRaw).replace(/[^0-9]/g, '')) || null : null;
      const weight    = weightRaw ? parseInt(String(weightRaw).replace(/[^0-9]/g, '')) || null : null;

      const row = {
        id:           profile.id,
        name:         entry.name,             // curated name from new-player-ids.json
        firstname:    profile.firstname,
        lastname:     profile.lastname,
        nationality:  profile.nationality,
        birth_date:   profile.birth?.date    || null,
        birth_country: profile.birth?.country || null,
        height,
        weight,
        position:     profile.position,
        photo:        photoUrl,
        popularity_tier: null,
        override_tier:   null,
        last_updated: new Date().toISOString(),
      };

      const { error } = await supabase.from('players').upsert(row, { onConflict: 'id' });

      if (error) {
        console.error(`  ❌ DB error for "${entry.name}" (${entry.id}): ${error.message}`);
        failed++;
      } else {
        console.log(`  ✅ [NEW]   ${entry.name} (${entry.id}) — ${profile.nationality ?? '?'}, ${profile.position ?? '?'}`);
        inserted++;
        done.add(entry.id);
      }

    } else {
      // ── Photo-only update for existing players ─────────────────────────────
      const { error } = await supabase
        .from('players')
        .update({ photo: photoUrl, last_updated: new Date().toISOString() })
        .eq('id', entry.id);

      if (error) {
        console.error(`  ❌ DB error updating photo for ID ${entry.id}: ${error.message}`);
        failed++;
      } else {
        console.log(`  📸 [PHOTO] ${profile.firstname} ${profile.lastname} (${entry.id})`);
        photoUpdated++;
        done.add(entry.id);
      }
    }

    ops++;
    if (ops % CHECKPOINT_EVERY === 0) {
      saveDone(done);
      console.log(`  💾 Checkpoint saved (${done.size}/${workList.length})`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  saveDone(done);

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Enrichment complete`);
  console.log(`   New players inserted: ${inserted}`);
  console.log(`   Photos updated:       ${photoUpdated}`);
  console.log(`   Failed / skipped:     ${failed}`);
  console.log('═'.repeat(60));
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
