'use strict';
// Dev-only test harness. Loaded only when the URL contains ?dev. Drives the game frame by frame.
(function () {
  const T = window.T = {
    async tick(n = 1) { for (let i = 0; i < n; i++) { G.debug.tick(1); for (let k = 0; k < 30; k++) await null; } },
    top() { const s = G.top(); return s ? s.constructor.name : null; },
    text() { const d = G.scenes.filter((s) => s instanceof G.Dialog).pop(); return d ? d.pages[d.page].join(' ') : ''; },
    async a(n = 1, gap = 8) {
      for (let i = 0; i < n; i++) {
        if (T.top() === 'NameEntry') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
        else G.debug.press('a');
        await T.tick(gap);
      }
    },
    async key(k, gap = 8) { G.debug.press(k); await T.tick(gap); },
    async face(d) { G.debug.hold(d, true); await T.tick(3); G.debug.hold(d, false); await T.tick(3); },
    async go(dir, n) {
      const p = G.world.player; const [dx, dy] = G.DIRS[dir]; const tx = p.x + dx * n, ty = p.y + dy * n;
      G.debug.hold(dir, true); let k = 0;
      while (k++ < 60 * n + 60 && !(p.x === tx && p.y === ty && !p.moving) && !G.world.busy) await T.tick(1);
      G.debug.hold(dir, false); await T.tick(3); return [p.x, p.y, G.S.map];
    },
    inBattle() { return G.scenes.some((s) => s instanceof G.Battle); },
    // press through dialogs/battles until the world is idle; answers NO to nickname/forget prompts
    async settle(limit = 3000, log = []) {
      for (let i = 0; i < limit; i++) {
        const t = T.text(); if (t && log[log.length - 1] !== t) log.push(t);
        const top = T.top();
        if (top === 'Choice' && /nickname|Forget a move|another orb|Start a new|save the game/i.test(t)) { G.debug.press('down'); await T.tick(4); G.debug.press('a'); await T.tick(10); continue; }
        if (top === 'StatPanel') { await T.a(1, 6); continue; }
        if (top === 'MoveMenu') { const sc = G.top(), mv = sc.b.P.mon.moves; if (!mv[sc.i] || mv[sc.i].pp <= 0) { const j = mv.findIndex((x) => x.pp > 0); if (j >= 0) sc.i = j; } }
        if (top === 'PartyScene' && G.top().o.mode === 'forced') {
          const sc = G.top(); const i = G.S.party.findIndex((m) => m.hp > 0 && m !== sc.o.active);
          if (i >= 0) sc.i = i; G.debug.press('a'); await T.tick(10); continue;
        }
        if (top === 'World' && !G.world.busy && !T.inBattle() && G.fade < 0.01) return log;
        await T.a(1, 8);
      }
      log.push('!! settle limit'); return log;
    },
    errs: [],
  };
  const oe = console.error; console.error = (...a) => { T.errs.push(String((a[0] && a[0].stack) || a[0])); oe(...a); };
  window.addEventListener('error', (e) => T.errs.push(String(e.message)));
  window.addEventListener('unhandledrejection', (e) => T.errs.push('rej ' + String(e.reason && e.reason.stack || e.reason)));
  // flood fill from every entrance; report doors/items/exits/warps that can't be reached
  T.reach = () => {
    const out = [];
    const walk = (m, x, y) => { const t = m.grid[y] && m.grid[y][x]; return t && G.TILEDEF[t] && !G.TILEDEF[t].solid && !m.bmask[y][x]; };
    for (const [id, m0] of Object.entries(G.MAPS)) {
      const m = G.buildMap(m0); const seen = new Set(); const q = [];
      const add = (x, y) => { const k = x + ',' + y; if (!seen.has(k) && walk(m, x, y)) { seen.add(k); q.push([x, y]); } };
      // entrances: tiles below doors leading here, warp arrivals, exit edges
      for (const [oid, o0] of Object.entries(G.MAPS)) { const o = G.buildMap(o0);
        for (const b of o.buildings || []) if (b.to === id) add(b.tx, b.ty);
        for (const w of o.warps || []) if (w.to === id) add(w.tx, w.ty);
        for (const [side, ex] of Object.entries(o.exits || {})) if (ex.to === id) for (let k = 0; k < Math.max(m.w, m.h); k++) { if (side === 'n') add(k, m.h - 1); if (side === 's') add(k, 0); if (side === 'w') add(m.w - 1, k); if (side === 'e') add(0, k); }
      }
      if (id === 'home') add(7, 2);
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (m.grid[ny] && m.grid[ny][nx] === 'L' && dy !== 1) continue; add(nx, ny); } }
      const has = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
      for (const b of m.buildings || []) { const B = G.BLD[b.kind]; if (!seen.has((b.x + B.door) + ',' + (b.y + B.h))) out.push(id + ' door unreachable ' + b.to); }
      for (const it of m.items || []) if (!has(it.x, it.y)) out.push(id + ' item unreachable ' + it.item + ' ' + it.x + ',' + it.y);
      for (const n of m.npcs || []) if (!has(n.x, n.y)) out.push(id + ' npc unreachable ' + (n.id || n.speaker || '?') + ' ' + n.x + ',' + n.y);
      for (const w of m.warps || []) if (!seen.has(w.x + ',' + w.y)) out.push(id + ' warp unreachable ' + w.to);
      for (const [side, ex] of Object.entries(m.exits || {})) { let ok = false; for (let k = 0; k < Math.max(m.w, m.h); k++) { if (side === 'n' && seen.has(k + ',0')) ok = true; if (side === 's' && seen.has(k + ',' + (m.h - 1))) ok = true; if (side === 'w' && seen.has('0,' + k)) ok = true; if (side === 'e' && seen.has((m.w - 1) + ',' + k)) ok = true; } if (!ok) out.push(id + ' exit unreachable ' + side); }
      if (!seen.size) out.push(id + ' no entrance');
    }
    return out;
  };
  // draw a whole map at 3px per tile on top of the page for screenshots
  T.minimap = (id, s = 3) => {
    const m = G.buildMap(G.MAPS[id]); let cv = document.getElementById('mini');
    if (!cv) { cv = document.createElement('canvas'); cv.id = 'mini'; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:9;background:#000;image-rendering:pixelated'; document.body.appendChild(cv); }
    cv.width = m.w * 16; cv.height = m.h * 16; cv.style.width = (m.w * s * 2) + 'px'; const c = cv.getContext('2d');
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) G.drawTile(c, m.grid[y][x], x * 16, y * 16, x, y);
    for (const b of m.buildings || []) c.drawImage(G.buildingSprite(b.kind), b.x * 16, b.y * 16);
    for (const n of m.npcs || []) { c.fillStyle = n.trainer ? '#f00' : '#ff0'; c.fillRect(n.x * 16 + 4, n.y * 16 + 4, 8, 8); }
    for (const it of m.items || []) { c.fillStyle = it.hidden ? '#f0f' : '#0ff'; c.fillRect(it.x * 16 + 5, it.y * 16 + 5, 6, 6); }
    return [m.w, m.h];
  };
  T.hideMini = () => { const cv = document.getElementById('mini'); if (cv) cv.remove(); };
  T.fresh = async () => {
    const files = ['core', 'ui', 'audio', 'data_types', 'data_moves', 'data_species', 'data_items', 'sprites', 'tiles', 'mon', 'battle', 'menus', 'world', 'maps', 'maps2', 'story', 'title', 'devtest'];
    await Promise.all(files.map((f) => fetch('js/' + f + '.js', { cache: 'reload' })));
    location.reload();
  };
})();
