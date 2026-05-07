/**
 * Detects players whose API-Football photo URL serves a generic placeholder
 * silhouette (valid URL, but identical image for all "no photo" players).
 *
 * How it works:
 *   1. Hashes every player photo in parallel batches of 10 using MD5.
 *   2. Flags any that match the known silhouette fingerprint.
 *   3. For each flagged player, fetches their Transfermarkt profile via
 *      GET http://localhost:8000/players/{tm_id}/profile and uses imageUrl.
 *   4. Writes the Transfermarkt image URL into players.photo in Supabase.
 *
 * Requires: local Transfermarkt API running at http://localhost:8000
 * Usage:    node scripts/fix-placeholder-photos.cjs
 */

'use strict';

require('../backend/node_modules/dotenv').config({ path: __dirname + '/../backend/.env' });
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');
const https  = require('https');
const http   = require('http');
const crypto = require('crypto');

// apiGet handles both http and https

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Known placeholder — Paul Scholes has a valid URL that serves the silhouette
// MD5 of the API-Football generic silhouette — confirmed on 2026-05-07 by hashing
// all 7 known placeholder players (all returned f512b984..., 8624 bytes each).
// Hardcoded so the fingerprint never changes even if the reference player's photo is updated.
const PLACEHOLDER_HASH = 'f512b984f93ca6915dd623351b93b531';

const BATCH_SIZE = 10;   // concurrent image downloads
const TM_BASE    = 'http://localhost:8000';
const TM_DELAY   = 150;

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function downloadBytes(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 10000 }, res => {
      if (res.statusCode >= 400) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

function apiGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 10000 }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('JSON parse error')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Transfermarkt photo lookup ──────────────────────────────────────────────

async function getTmPhoto(tmId) {
  try {
    await sleep(TM_DELAY);
    const profile = await apiGet(`${TM_BASE}/players/${tmId}/profile`);
    return profile?.imageUrl || null;
  } catch {
    return null;
  }
}

// ─── Batch runner ─────────────────────────────────────────────────────────────

async function runBatch(items, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const res   = await Promise.all(batch.map(fn));
    results.push(...res);
    process.stdout.write(`\r  Scanned ${Math.min(i + BATCH_SIZE, items.length)}/${items.length}…`);
  }
  process.stdout.write('\n');
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  fix-placeholder-photos.cjs');
  console.log('════════════════════════════════════════════════════════════\n');

  console.log(`🔒 Using hardcoded placeholder hash: ${PLACEHOLDER_HASH}\n`);
  const placeholderHash = PLACEHOLDER_HASH;

  // ── Step 1: load all players with a photo URL ──────────────────────────────
  console.log('📋 Step 1: Loading all players with a photo URL from Supabase…');
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, photo, tm_id')
    .not('photo', 'is', null)
    .order('id');

  if (error) { console.error('❌ Supabase error:', error.message); process.exit(1); }
  console.log(`   ${players.length} players with a non-null photo URL\n`);

  // ── Step 3: hash every photo, flag placeholders ────────────────────────────
  console.log(`🔍 Step 2: Hashing all ${players.length} photos in batches of ${BATCH_SIZE}…`);

  const hashResults = await runBatch(players, async (p) => {
    try {
      const buf  = await downloadBytes(p.photo);
      const hash = md5(buf);
      return { ...p, hash, isPlaceholder: hash === placeholderHash };
    } catch {
      return { ...p, hash: null, isPlaceholder: false };
    }
  });

  const placeholders = hashResults.filter(p => p.isPlaceholder);
  const errors       = hashResults.filter(p => p.hash === null);

  console.log(`\n   ✅ Real photos:     ${hashResults.length - placeholders.length - errors.length}`);
  console.log(`   ❌ Placeholders:    ${placeholders.length}`);
  console.log(`   ⚠️  Download errors: ${errors.length}`);

  if (placeholders.length === 0) {
    console.log('\n🎉 No placeholder images found — nothing to fix!');
    return;
  }

  console.log('\n  Placeholder players:');
  placeholders.forEach(p => console.log(`    • ${p.name} (${p.id})`));

  // ── Step 4: fetch Transfermarkt photos for placeholders ─────────────────────
  console.log(`\n🌐 Step 4: Fetching Transfermarkt photos for ${placeholders.length} players…\n`);

  let fixed = 0, notFound = 0;

  for (const p of placeholders) {
    process.stdout.write(`  🔎 ${p.name}… `);

    if (!p.tm_id) {
      console.log('no tm_id — skipping (set tm_id in Supabase first)');
      notFound++;
      continue;
    }

    const tmUrl = await getTmPhoto(p.tm_id);

    if (!tmUrl) {
      console.log(`no image returned from TM profile (tm_id: ${p.tm_id})`);
      notFound++;
      continue;
    }

    console.log(`found → ${tmUrl}`);

    const { error: dbErr } = await supabase
      .from('players')
      .update({ photo: tmUrl, last_updated: new Date().toISOString() })
      .eq('id', p.id);

    if (dbErr) {
      console.error(`  ❌ DB update failed for ${p.name}: ${dbErr.message}`);
    } else {
      console.log(`  ✅ Updated ${p.name} (${p.id})`);
      fixed++;
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Done');
  console.log(`   Placeholders found:    ${placeholders.length}`);
  console.log(`   Fixed with Wikipedia:  ${fixed}`);
  console.log(`   No Wikipedia image:    ${notFound}`);
  console.log('═'.repeat(60));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
