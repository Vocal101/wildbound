'use strict';
// Wildbound core: namespace, canvas, input, scene stack, timers, save.
(function () {
  const G = window.G = {
    W: 320, H: 240,
    scenes: [], tasks: [], frame: 0,
    fade: 0, fadeColor: '0,0,0',
    S: null,           // persistent game state (saved)
    debug: {},
    SAVE_KEY: 'wildbound_save_v1',
  };

  // ---------- small helpers ----------
  G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  G.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  G.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  G.chance = (p) => Math.random() < p;
  G.shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  G.weighted = (list, wkey = 'w') => {
    let tot = 0; for (const e of list) tot += e[wkey];
    let r = Math.random() * tot;
    for (const e of list) { r -= e[wkey]; if (r < 0) return e; }
    return list[list.length - 1];
  };
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // ---------- canvas ----------
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  G.canvas = cv; G.ctx = ctx; G.scale = 1;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.max(0.5, Math.min(innerWidth / G.W, (innerHeight - 4) / G.H));
    const s = Math.max(1, Math.round(fit * dpr));
    cv.width = G.W * s; cv.height = G.H * s;
    cv.style.width = Math.floor(G.W * fit) + 'px';
    cv.style.height = Math.floor(G.H * fit) + 'px';
    G.scale = s;
  }
  addEventListener('resize', resize); resize();

  // ---------- input ----------
  const KEYS = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Space: 'a', Enter: 'a', NumpadEnter: 'a', KeyJ: 'a',
    KeyX: 'b', Backspace: 'b', KeyK: 'b',
    Escape: 'start', KeyM: 'start', Tab: 'start',
    ShiftLeft: 'run', ShiftRight: 'run',
  };
  const downAt = {}; let queued = {}; let pressed = {};
  G.textHandler = null; // set by name entry to capture raw typing
  addEventListener('keydown', (e) => {
    if (G.audio) G.audio.unlock();
    if (G.textHandler && G.textHandler(e)) { e.preventDefault(); return; }
    const k = KEYS[e.code]; if (!k) return;
    e.preventDefault();
    if (!downAt[k]) { downAt[k] = G.frame || 1; queued[k] = true; }
  });
  addEventListener('keyup', (e) => { const k = KEYS[e.code]; if (k) downAt[k] = 0; });
  addEventListener('blur', () => { for (const k in downAt) downAt[k] = 0; });
  addEventListener('mousedown', () => { if (G.audio) G.audio.unlock(); cv.focus(); });

  G.input = {
    down: (k) => !!downAt[k],
    pressed: (k) => !!pressed[k],
    // pressed, or held long enough to auto-repeat (menus)
    rep: (k) => {
      if (pressed[k]) return true;
      const t = downAt[k]; if (!t) return false;
      const held = G.frame - t;
      return held > 20 && held % 5 === 0;
    },
    held: (k) => (downAt[k] ? G.frame - downAt[k] : 0),
    clear: () => { pressed = {}; queued = {}; },
    // direction currently held, newest wins
    dir: () => {
      let best = null, bt = -1;
      for (const d of ['up', 'down', 'left', 'right']) if (downAt[d] && downAt[d] > bt) { bt = downAt[d]; best = d; }
      return best;
    },
  };
  // debug: inject a key press
  G.debug.press = (k) => { queued[k] = true; };
  G.debug.hold = (k, on) => { downAt[k] = on ? (G.frame || 1) : 0; if (on) queued[k] = true; };

  // ---------- scenes ----------
  // A scene: { update(), draw(ctx), overlay?:bool, bgUpdate?() }
  G.push = (sc) => new Promise((res) => {
    sc._res = res; G.scenes.push(sc); if (sc.enter) sc.enter();
  });
  G.pop = (sc, val) => {
    const i = G.scenes.indexOf(sc);
    if (i >= 0) G.scenes.splice(i, 1);
    const r = sc._res; sc._res = null; if (r) r(val);
  };
  // resolve a scene's promise without removing it (used by dialogs that stay visible)
  G.resolve = (sc, val) => { const r = sc._res; sc._res = null; if (r) r(val); };
  G.top = () => G.scenes[G.scenes.length - 1];
  G.replaceAll = (sc) => { G.scenes.length = 0; return G.push(sc); };

  // ---------- timers / tweens (run every frame regardless of scene) ----------
  G.wait = (n) => new Promise((r) => { let c = Math.max(1, Math.round(n)); G.tasks.push(() => { if (--c <= 0) { r(); return true; } return false; }); });
  G.tween = (n, fn) => new Promise((r) => {
    let i = 0; n = Math.max(1, Math.round(n));
    G.tasks.push(() => { i++; fn(Math.min(1, i / n)); if (i >= n) { r(); return true; } return false; });
  });
  G.fadeOut = (n = 14, color = '0,0,0') => { G.fadeColor = color; const s = G.fade; return G.tween(n, (t) => (G.fade = s + (1 - s) * t)); };
  G.fadeIn = (n = 14) => { const s = G.fade; return G.tween(n, (t) => (G.fade = s * (1 - t))); };
  G.flash = async (n = 4, color = '255,255,255') => { G.fadeColor = color; G.fade = 1; await G.wait(n); G.fade = 0; };

  // ---------- main loop ----------
  let last = performance.now(), acc = 0;
  const STEP = 1000 / 60;
  function update() {
    pressed = queued; queued = {};
    G.frame++;
    if (G.tasks.length) {
      const list = G.tasks.slice();
      for (const t of list) { let done = true; try { done = t(); } catch (e) { console.error(e); } if (done) { const i = G.tasks.indexOf(t); if (i >= 0) G.tasks.splice(i, 1); } }
    }
    const top = G.top();
    for (const s of G.scenes) if (s !== top && s.bgUpdate) s.bgUpdate();
    if (top && top.update) { try { top.update(); } catch (e) { console.error(e); } }
    if (G.S && !G.paused) G.S.time = (G.S.time || 0) + 1 / 60;
  }
  function draw() {
    ctx.setTransform(G.scale, 0, 0, G.scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, G.W, G.H);
    let start = 0;
    for (let i = G.scenes.length - 1; i >= 0; i--) if (!G.scenes[i].overlay) { start = i; break; }
    for (let i = start; i < G.scenes.length; i++) {
      const s = G.scenes[i];
      if (s.draw) { ctx.save(); try { s.draw(ctx); } catch (e) { console.error(e); } ctx.restore(); }
    }
    if (G.fade > 0.001) { ctx.fillStyle = `rgba(${G.fadeColor},${G.fade})`; ctx.fillRect(0, 0, G.W, G.H); }
  }
  function loop(now) {
    acc += Math.min(250, now - last); last = now;
    let steps = 0;
    while (acc >= STEP && steps < 6) { update(); acc -= STEP; steps++; }
    if (steps >= 6) acc = 0;
    draw();
    requestAnimationFrame(loop);
  }
  G.start = () => { last = performance.now(); requestAnimationFrame(loop); };
  // debug: advance n frames synchronously (works while the tab is hidden)
  G.debug.tick = (n = 1) => { for (let i = 0; i < n; i++) update(); draw(); };

  // ---------- save / load ----------
  G.saveGame = () => {
    try { G.S.savedAt = Date.now(); localStorage.setItem(G.SAVE_KEY, JSON.stringify(G.S)); return true; }
    catch (e) { console.error(e); return false; }
  };
  G.loadGame = () => {
    try { const s = localStorage.getItem(G.SAVE_KEY); return s ? JSON.parse(s) : null; }
    catch (e) { return null; }
  };
  G.hasFlag = (f) => !!(G.S && G.S.flags[f]);
  G.setFlag = (f, v = true) => { if (v) G.S.flags[f] = v; else delete G.S.flags[f]; };
  // flag condition: string "a", "!a", or array of those (all must hold)
  G.cond = (c) => {
    if (!c) return true;
    if (Array.isArray(c)) return c.every(G.cond);
    if (typeof c === 'function') return c();
    if (c[0] === '!') return !G.hasFlag(c.slice(1));
    return G.hasFlag(c);
  };
  G.plural = (s) => (/[sx]$|Herb$|Candy$/.test(s) ? s.replace(/Candy$/, 'Candies') : s + 's');
  // text substitution
  G.fmt = (s) => String(s)
    .replace(/\{PLAYER\}/g, G.S ? G.S.name : 'You')
    .replace(/\{RIVAL\}/g, G.S ? G.S.rival : 'Kai');
})();
