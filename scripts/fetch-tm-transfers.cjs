'use strict';
require('../backend/node_modules/dotenv').config({ path: __dirname + '/../backend/.env' });
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const http = require('http');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const TM_BASE = 'http://localhost:8000';
const RESULTS_FILE = path.join(__dirname, 'data/tm-results.json');
const CHECKPOINT_FILE = path.join(__dirname, 'data/tm-checkpoint.json');
const DELAY_MS = 150;

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`JSON parse error [${url}]: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

/** Parse "* DD/MM/YYYY in City, Country" → "YYYY-MM-DD" */
function parseDOB(description) {
  if (!description) return null;
  const m = description.match(/\*\s*(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** Extract TM ID from Transfermarkt CDN photo URLs */
function extractTmIdFromPhoto(photoUrl) {
  if (!photoUrl || !photoUrl.includes('transfermarkt')) return null;
  const m = photoUrl.match(/portrait\/header\/(?:s_\d+_)?(\d+)-/);
  return m ? m[1] : null;
}

/** Current age given a birth date string "YYYY-MM-DD" */
function currentAge(birthDate) {
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age;
}

// ─── TM API calls ───────────────────────────────────────────────────────────

async function searchTm(query, maxPages = 4) {
  const all = [];
  let page = 1;
  let lastPage = 1;

  do {
    const url = `${TM_BASE}/players/search/${encodeURIComponent(query)}?page=${page}`;
    try {
      const data = await fetchJson(url);
      if (Array.isArray(data.results)) all.push(...data.results);
      lastPage = data.lastPageNumber || 1;
    } catch (e) {
      console.error(`    Search error "${query}" p${page}: ${e.message}`);
      break;
    }
    await sleep(DELAY_MS);
    page++;
  } while (page <= lastPage && page <= maxPages);

  return all;
}

async function fetchProfile(tmId) {
  try {
    await sleep(DELAY_MS);
    return await fetchJson(`${TM_BASE}/players/${tmId}/profile`);
  } catch (e) {
    console.error(`    Profile error TM ${tmId}: ${e.message}`);
    return null;
  }
}

async function fetchTransfers(tmId) {
  try {
    await sleep(DELAY_MS);
    return await fetchJson(`${TM_BASE}/players/${tmId}/transfers`);
  } catch (e) {
    console.error(`    Transfers error TM ${tmId}: ${e.message}`);
    return null;
  }
}

// ─── Matching logic ─────────────────────────────────────────────────────────

/**
 * Search TM for a player, match by exact DOB.
 * Tiebreakers: age range filter, nationality soft-match.
 * Returns { tmId, profile, confidence } or null.
 */
async function findTmMatch(player) {
  const expected = currentAge(player.birth_date);

  // Queries to try in order: lastname first, then full name
  const queries = [];
  if (player.lastname) queries.push(player.lastname.trim());
  if (player.name && player.name !== player.lastname) queries.push(player.name.trim());

  for (const query of queries) {
    if (!query) continue;

    const results = await searchTm(query);

    // Pre-filter: keep results within ±2 years age-wise (skip if no age info)
    const byAge = results.filter(r => !r.age || Math.abs(r.age - expected) <= 2);

    // Soft nationality filter to rank candidates higher (don't discard)
    const nat = (player.nationality || '').toLowerCase();
    const scored = byAge.map(r => {
      const hasNat = (r.nationalities || []).some(n =>
        n.toLowerCase().includes(nat) || nat.includes(n.toLowerCase())
      );
      return { ...r, _natMatch: hasNat };
    }).sort((a, b) => b._natMatch - a._natMatch); // nat matches first

    // Check up to 6 candidates; stop on first exact DOB match
    for (const candidate of scored.slice(0, 6)) {
      const profile = await fetchProfile(candidate.id);
      if (!profile) continue;

      const tmDob = parseDOB(profile.description);
      if (tmDob === player.birth_date) {
        return { tmId: candidate.id, profile, confidence: 'confirmed' };
      }
    }
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Load checkpoint + existing results
  const checkpoint = fs.existsSync(CHECKPOINT_FILE)
    ? JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'))
    : { processed: [] };

  const results = fs.existsSync(RESULTS_FILE)
    ? JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'))
    : [];

  // Fetch candidates from Supabase
  const { data: players, error } = await supabase
    .from('players')
    .select('id,name,lastname,birth_date,nationality,photo')
    .lt('birth_date', '1987-01-01')
    .not('birth_date', 'is', null)
    .order('birth_date', { ascending: true });

  if (error) { console.error('Supabase error:', error); process.exit(1); }

  const todo = players.filter(p => !checkpoint.processed.includes(p.id));

  console.log(`Candidates: ${players.length} total | ${checkpoint.processed.length} done | ${todo.length} remaining\n`);

  let matched = 0, knownId = 0, noMatch = 0;

  for (let i = 0; i < todo.length; i++) {
    const player = todo[i];
    const knownTmId = extractTmIdFromPhoto(player.photo);

    process.stdout.write(
      `[${i + 1}/${todo.length}] ${player.name} (${player.birth_date})` +
      (knownTmId ? ` [known TM: ${knownTmId}]` : '') +
      ' … '
    );

    const entry = {
      api_id: player.id,
      name: player.name,
      birth_date: player.birth_date,
      nationality: player.nationality,
      tm_id: null,
      match_confidence: null,
      status: 'no_match',
      tm_transfers: null,
      youth_clubs: null,
    };

    let tmId = knownTmId;
    let confidence = knownTmId ? 'known' : null;

    if (!tmId) {
      const found = await findTmMatch(player);
      if (found) {
        tmId = found.tmId;
        confidence = found.confidence;
      }
    }

    if (tmId) {
      const transfersData = await fetchTransfers(tmId);
      entry.tm_id = tmId;
      entry.match_confidence = confidence;
      entry.tm_transfers = transfersData?.transfers ?? null;
      entry.youth_clubs = transfersData?.youthClubs ?? null;
      entry.status = 'matched';

      const count = entry.tm_transfers?.length ?? 0;
      console.log(`✓ TM ${tmId} (${confidence}) — ${count} transfers`);

      if (knownTmId) knownId++;
      else matched++;
    } else {
      console.log('✗ no match');
      noMatch++;
    }

    // Upsert into results array
    const idx = results.findIndex(r => r.api_id === player.id);
    if (idx >= 0) results[idx] = entry;
    else results.push(entry);

    checkpoint.processed.push(player.id);

    // Persist after every player so it's resumable
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  }

  console.log('\n─── Summary ───────────────────────────────');
  console.log(`  Matched via known TM ID : ${knownId}`);
  console.log(`  Matched via search      : ${matched}`);
  console.log(`  No match                : ${noMatch}`);
  console.log(`\nResults → scripts/data/tm-results.json`);
  console.log('Nothing has been written to the database.');
}

main().catch(console.error);
