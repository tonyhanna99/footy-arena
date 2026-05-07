/**
 * Generates a static HTML page listing every player's photo + name
 * so you can visually scan for generic "no player found" placeholder images.
 *
 * Usage:
 *   node scripts/generate-photo-review.cjs
 *
 * Opens: scripts/data/photo-review.html  (delete when done)
 */

'use strict';

require('../backend/node_modules/dotenv').config({ path: __dirname + '/../backend/.env' });
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const OUT_FILE = path.join(__dirname, 'data', 'photo-review.html');

async function main() {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, photo')
    .order('name', { ascending: true });

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }

  console.log(`Fetched ${players.length} players — building HTML…`);

  const cards = players.map(p => {
    const src  = p.photo || '';
    const name = p.name  || '(no name)';
    return `
    <div class="card" data-id="${p.id}">
      <img src="${src}" alt="${name}" loading="lazy"
           onerror="this.style.outline='3px solid #e53e3e'; this.title='broken URL'">
      <div class="label">${name}<span class="id">${p.id}</span></div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Player Photo Review (${players.length} players)</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #1a1a2e;
      color: #eee;
      padding: 16px;
    }
    h1 { margin-bottom: 12px; font-size: 1.2rem; color: #aaa; }
    .toolbar {
      display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap;
    }
    .toolbar input {
      padding: 6px 10px; border-radius: 6px; border: 1px solid #444;
      background: #2a2a3e; color: #eee; width: 220px; font-size: 0.9rem;
    }
    .toolbar label { font-size: 0.85rem; color: #aaa; display: flex; align-items: center; gap: 6px; cursor: pointer; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 10px;
    }
    .card {
      background: #16213e;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #2a2a4e;
      transition: border-color .15s;
    }
    .card:hover { border-color: #4a90d9; }
    .card img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      display: block;
      background: #0f0f1e;
    }
    .label {
      padding: 4px 6px;
      font-size: 0.7rem;
      line-height: 1.3;
      display: flex;
      flex-direction: column;
    }
    .id { color: #666; font-size: 0.65rem; }
    .card.flagged { border: 2px solid #e53e3e !important; }
    .count { font-size: 0.85rem; color: #aaa; margin-left: auto; }
  </style>
</head>
<body>
  <h1>Player Photo Review — ${players.length} players</h1>
  <div class="toolbar">
    <input type="text" id="search" placeholder="Filter by name…" oninput="filterCards()">
    <label>
      <input type="checkbox" id="flagOnly" onchange="filterCards()"> Show flagged only
    </label>
    <span class="count" id="count">${players.length} shown</span>
  </div>
  <div class="grid" id="grid">
    ${cards}
  </div>

  <script>
    // Allow clicking a card to toggle "flagged" (red border) for easy tracking
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => card.classList.toggle('flagged'));
    });

    function filterCards() {
      const q        = document.getElementById('search').value.toLowerCase();
      const flagOnly = document.getElementById('flagOnly').checked;
      let visible    = 0;
      document.querySelectorAll('.card').forEach(card => {
        const name    = card.querySelector('.label').textContent.toLowerCase();
        const matches = (!q || name.includes(q)) && (!flagOnly || card.classList.contains('flagged'));
        card.style.display = matches ? '' : 'none';
        if (matches) visible++;
      });
      document.getElementById('count').textContent = visible + ' shown';
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(OUT_FILE, html, 'utf8');
  console.log(`✅ Written to: ${OUT_FILE}`);
  console.log(`   Open in browser: file://${OUT_FILE}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
