'use strict';
// Procedural creature sprites. Each part is rasterized to a mask, outlined, then composited,
// which gives a hand-drawn pixel-art look. Shinies are hue-shifted palettes.
(function () {
  const PI = Math.PI;
  // ---------- color helpers ----------
  const hex2rgb = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => G.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h * 360, s, l];
  }
  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    if (s === 0) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  const hueShift = (hex, deg, sat = 1) => { const [h, s, l] = rgb2hsl(...hex2rgb(hex)); return rgb2hex(...hsl2rgb(h + deg, G.clamp(s * sat, 0, 1), l)); };
  G.hueShift = hueShift; G.hex2rgb = hex2rgb; G.rgb2hex = rgb2hex;

  // ---------- pixel layer ----------
  const scratch = document.createElement('canvas');
  const sctx = scratch.getContext('2d', { willReadFrequently: true });
  class Layer {
    constructor(n) { this.n = n; this.d = new Uint8ClampedArray(n * n * 4); this.k = new Uint8Array(n * n); }
    mask(fn) {
      const n = this.n;
      if (scratch.width !== n) { scratch.width = n; scratch.height = n; }
      sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, n, n);
      sctx.setTransform(n / 64, 0, 0, n / 64, 0, 0);
      sctx.fillStyle = '#000'; sctx.strokeStyle = '#000'; sctx.lineCap = 'round'; sctx.lineJoin = 'round';
      fn(sctx);
      const a = sctx.getImageData(0, 0, n, n).data; const m = new Uint8Array(n * n);
      for (let i = 0; i < n * n; i++) m[i] = a[i * 4 + 3] >= 110 ? 1 : 0;
      return m;
    }
    set(i, rgb, kind) { const d = this.d; d[i * 4] = rgb[0]; d[i * 4 + 1] = rgb[1]; d[i * 4 + 2] = rgb[2]; d[i * 4 + 3] = 255; this.k[i] = kind; }
    // o: outline (default true), oc (outline color), clip (only on existing fill), flat (no shading)
    part(fn, col, o = {}) {
      const n = this.n, m = this.mask(fn), k = this.k;
      if (o.clip) for (let i = 0; i < n * n; i++) if (k[i] !== 1 && k[i] !== 3) m[i] = 0;
      const rgb = hex2rgb(col);
      if (o.outline !== false && !o.clip) {
        const oc = o.oc ? hex2rgb(o.oc) : [rgb[0] * 0.38, rgb[1] * 0.36, rgb[2] * 0.42 + 12];
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const i = y * n + x; if (m[i]) continue;
          if ((x > 0 && m[i - 1]) || (x < n - 1 && m[i + 1]) || (y > 0 && m[i - n]) || (y < n - 1 && m[i + n])) this.set(i, oc, 2);
        }
      }
      for (let i = 0; i < n * n; i++) if (m[i]) this.set(i, rgb, o.flat ? 3 : 1);
    }
    finish() {
      const n = this.n, k = this.k, d = this.d, out = new Uint8ClampedArray(d);
      let top = n, bot = 0;
      for (let i = 0; i < n * n; i++) if (k[i]) { const y = (i / n) | 0; if (y < top) top = y; if (y > bot) bot = y; }
      const kk = (x, y) => (x < 0 || y < 0 || x >= n || y >= n ? 0 : k[y * n + x]);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const i = y * n + x; if (k[i] !== 1) continue;
        let f = 1.06 - 0.16 * ((y - top) / Math.max(1, bot - top));
        const tl = kk(x - 1, y - 1), br = kk(x + 1, y + 1), br2 = kk(x + 2, y + 2);
        if (tl === 0 || tl === 2) f *= 1.16;
        else if (br === 0 || br === 2) f *= 0.76;
        else if (br2 === 0 || br2 === 2) f *= 0.9;
        for (let c = 0; c < 3; c++) out[i * 4 + c] = f > 1 ? d[i * 4 + c] + (255 - d[i * 4 + c]) * (f - 1) * 0.9 : d[i * 4 + c] * f;
      }
      const cv = document.createElement('canvas'); cv.width = n; cv.height = n;
      cv.getContext('2d').putImageData(new ImageData(out, n, n), 0, 0);
      return cv;
    }
  }
  G.Layer = Layer;

  // ---------- shape helpers (64-unit space) ----------
  const E = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, PI * 2); c.fill(); };
  const P = (c, pts) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); };
  const R = (c, x, y, w, h) => c.fillRect(x, y, w, h);
  const LINE = (c, w, pts) => { c.lineWidth = w; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); };
  const CURVE = (c, w, x0, y0, cx, cy, x1, y1) => { c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke(); };
  // leaf from (x,y) pointing at angle a (radians), length l, width w
  const LEAF = (c, x, y, a, l, w) => {
    const tx = x + Math.cos(a) * l, ty = y + Math.sin(a) * l;
    const nx = -Math.sin(a) * w, ny = Math.cos(a) * w, mx = (x + tx) / 2, my = (y + ty) / 2;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx + nx, my + ny, tx, ty); c.quadraticCurveTo(mx - nx, my - ny, x, y); c.fill();
  };
  const FLAME = (c, x, y, h, w) => { // base at (x,y), pointing up
    c.beginPath(); c.moveTo(x - w, y);
    c.quadraticCurveTo(x - w * 1.1, y - h * 0.5, x - w * 0.45, y - h * 0.62);
    c.lineTo(x - w * 0.3, y - h * 0.85); c.lineTo(x - w * 0.05, y - h * 0.6);
    c.lineTo(x, y - h); c.lineTo(x + w * 0.2, y - h * 0.6);
    c.lineTo(x + w * 0.5, y - h * 0.82); c.lineTo(x + w * 0.55, y - h * 0.55);
    c.quadraticCurveTo(x + w * 1.1, y - h * 0.4, x + w, y);
    c.quadraticCurveTo(x, y + w * 0.8, x - w, y); c.fill();
  };

  // ---------- palette ----------
  function palette(sp, shiny) {
    const a = sp.art;
    let main = a.c[0], acc = a.c[1], belly = a.c[2], acc2 = a.acc2 || hueShift(a.c[1], 30, 1.1);
    if (shiny) {
      let h = 0; for (const ch of sp.id) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
      const deg = a.shinyShift != null ? a.shinyShift : 90 + (h % 160);
      main = hueShift(main, deg, 1.15); acc = hueShift(acc, deg, 1.15); acc2 = hueShift(acc2, deg * 0.7, 1.1);
      belly = hueShift(belly, deg * 0.5, 0.8);
    }
    return { main, acc, belly, acc2, eye: '#26222e', white: '#ffffff', fl1: '#f8d848', fl2: '#f07828', ivory: '#f4ecd2', claw: '#f4ecd2' };
  }

  // ---------- rigs ----------
  function rigFor(plan, s) {
    const r = { s, ground: 61, plan };
    if (plan === 'quad') {
      r.brx = 12 + 9 * s; r.bry = 9 + 6 * s; r.legH = 3 + 4 * s;
      r.bx = 32; r.by = r.ground - r.legH - r.bry * 0.8;
      r.hr = 10.5 + 4.5 * s; r.hx = 32; r.hy = r.by - r.bry * 0.45 - r.hr * 0.55;
    } else if (plan === 'biped') {
      r.brx = 8.5 + 7 * s; r.bry = 8.5 + 6.5 * s;
      r.bx = 32; r.by = r.ground - 4 - r.bry;
      r.hr = 9.5 + 3.8 * s; r.hx = 32; r.hy = r.by - r.bry - r.hr * 0.5;
    } else if (plan === 'bird') {
      r.brx = 11 + 7 * s; r.bry = 10 + 6 * s; r.bx = 32; r.by = r.ground - 3 - r.bry;
      if (s >= 0.6) { r.hr = 8 + 4 * s; r.hx = 32; r.hy = r.by - r.bry - r.hr * 0.25; r.sepHead = true; }
      else { r.hr = r.brx * 0.82; r.hx = 32; r.hy = r.by - r.bry * 0.18; r.noHead = true; }
    } else if (plan === 'blob') {
      r.brx = 13 + 8 * s; r.bry = 11 + 8 * s; r.bx = 32; r.by = r.ground - r.bry;
      r.hr = r.brx * 0.8; r.hx = 32; r.hy = r.by - r.bry * 0.15; r.noHead = true;
    } else if (plan === 'ghost') {
      r.brx = 11 + 7 * s; r.bry = 11 + 7 * s; r.bx = 32; r.by = 30 - 2 * s;
      r.hr = r.brx * 0.82; r.hx = 32; r.hy = r.by - r.bry * 0.1; r.noHead = true;
    } else if (plan === 'golem') {
      r.brx = 13 + 9 * s; r.bry = 11 + 7 * s; r.bx = 32; r.by = r.ground - 3 - r.bry;
      if (s >= 0.6) { r.hr = 6 + 3 * s; r.hx = 32; r.hy = r.by - r.bry - r.hr * 0.1; r.sepHead = true; }
      else { r.hr = r.brx * 0.75; r.hx = 32; r.hy = r.by - r.bry * 0.05; r.noHead = true; }
    } else if (plan === 'serpent') {
      r.crx = 13 + 9 * s; r.cry = 5 + 2.5 * s; r.bx = 32; r.by = r.ground - r.cry;
      r.hr = 9 + 4 * s; r.hx = 32; r.hy = 20 + (1 - s) * 16;
    } else if (plan === 'fish') {
      r.side = true; r.brx = 13 + 9 * s; r.bry = 9 + 6 * s; r.bx = 31; r.by = 40 - s * 2;
      r.hr = r.bry; r.hx = r.bx - r.brx * 0.45; r.hy = r.by - r.bry * 0.15;
    } else if (plan === 'moth') {
      r.brx = 5 + 3 * s; r.bry = 10 + 5 * s; r.bx = 32; r.by = 40;
      r.hr = 7 + 3 * s; r.hx = 32; r.hy = r.by - r.bry - r.hr * 0.4;
    } else if (plan === 'bug') {
      r.brx = 13 + 8 * s; r.bry = 8 + 5 * s; r.bx = 32; r.by = r.ground - 5 - r.bry;
      r.hr = 9 + 4 * s; r.hx = 18; r.hy = r.ground - r.hr; r.side = true;
    }
    return r;
  }

  // ---------- creature generator ----------
  function makeCreature(spId, opts = {}) {
    const sp = G.SPECIES[spId]; const a = sp.art; const n = opts.size || 64;
    const L = new Layer(n); const p = palette(sp, opts.shiny);
    const s = a.s; let plan = a.plan;
    const feats = {}; for (const f of a.f || []) { const [k, v] = f.split(':'); feats[k] = v || true; }
    if (plan === 'bug' && feats.claws) plan = 'crab';
    const r = rigFor(plan === 'crab' ? 'bug' : plan, s);
    if (plan === 'crab') { r.side = false; r.hx = 32; r.hy = r.by - 2; r.hr = r.brx * 0.6; r.noHead = true; }
    const back = !!opts.back;
    const F = (k) => feats[k];

    // ---- behind layer ----
    if (F('wings')) wings(L, r, p, F('wings'), plan);
    if (F('hood')) L.part((c) => E(c, r.hx, r.hy + r.hr * 0.4, r.hr * 1.75, r.hr * 1.5), p.acc);
    if (F('bloom')) bloom(L, r, p);
    if (F('leaf')) L.part((c) => { LEAF(c, r.bx + 2, r.by - r.bry * 0.5, -PI / 2 + 0.55, r.bry * 2.3, r.bry * 0.75); LEAF(c, r.bx - 2, r.by - r.bry * 0.5, -PI / 2 - 0.55, r.bry * 2.1, r.bry * 0.7); }, p.acc);
    if (F('spikes') && plan !== 'golem' && plan !== 'crab') spikes(L, r, p, plan);
    if (F('mane')) mane(L, r, p, F('mane'));
    if (F('tail') && !back) tail(L, r, p, F('tail'), plan);
    if (F('coral')) L.part((c) => { LINE(c, 3, [r.bx + 2, r.by - r.bry + 2, r.bx + 5, r.by - r.bry - 9, r.bx + 9, r.by - r.bry - 13]); LINE(c, 2.5, [r.bx + 5, r.by - r.bry - 8, r.bx + 1, r.by - r.bry - 13]); LINE(c, 2.5, [r.bx + 10, r.by - r.bry + 2, r.bx + 14, r.by - r.bry - 6]); }, p.acc2);

    // ---- body ----
    BODY[plan](L, r, p, feats, back);

    // ---- head ----
    if (F('ears')) ears(L, r, p, F('ears'));
    if (F('horn')) horns(L, r, p, F('horn'));
    if (F('antlers')) antlers(L, r, p);
    if (F('fin') === 'head') headFin(L, r, p, plan);
    if (F('crest')) crest(L, r, p, F('crest') === 'big');
    if (F('antenna')) antenna(L, r, p);
    if (!r.noHead && plan !== 'fish') L.part((c) => E(c, r.hx, r.hy, r.hr * 1.08, r.hr), p.main);
    if (F('cap')) cap(L, r, p, F('cap') === 'big');
    if (F('band')) L.part((c) => R(c, r.hx - r.hr * 1.2, r.hy - r.hr * 0.62, r.hr * 2.4, Math.max(2, r.hr * 0.26)), p.acc, { clip: true });
    if (F('sprout')) sprout(L, r, p);
    if (F('flame') && plan !== 'golem') L.part((c) => FLAME(c, r.hx, r.hy - r.hr * 0.7, r.hr * 1.3, r.hr * 0.55), p.fl2);
    if (F('wisp')) { L.part((c) => FLAME(c, r.hx, r.hy - r.hr * 0.55, r.hr * 1.5, r.hr * 0.7), p.acc); L.part((c) => FLAME(c, r.hx, r.hy - r.hr * 0.5, r.hr * 0.9, r.hr * 0.35), p.belly, { outline: false }); }
    if (F('tuft')) L.part((c) => { E(c, r.hx, r.hy - r.hr * 0.95, r.hr * 0.28, r.hr * 0.22); E(c, r.hx + r.hr * 0.22, r.hy - r.hr * 1.12, r.hr * 0.2, r.hr * 0.16); }, p.acc);
    if (back) {
      if (F('tail')) tail(L, r, p, F('tail'), plan, true);
    } else {
      face(L, r, p, feats, plan);
    }
    if (F('gem') && !back) gem(L, r, p, plan);
    return L.finish();
  }

  // ---------- bodies ----------
  const BODY = {
    quad(L, r, p, f, back) {
      const lw = 4 + 3 * r.s, lh = r.legH + 5;
      for (const sx of [-1, 1]) L.part((c) => E(c, r.bx + sx * r.brx * 0.68, r.ground - lh * 0.5, lw * 0.55, lh * 0.55), p.acc === p.main ? p.main : shadeHex(p.main, 0.82));
      L.part((c) => E(c, r.bx, r.by, r.brx, r.bry), p.main);
      if (f.stripes) stripes(L, r, p);
      if (f.spots) spots(L, r, p);
      if (f.belly && !back) L.part((c) => E(c, r.bx, r.by + r.bry * 0.35, r.brx * 0.55, r.bry * 0.55), p.belly, { clip: true });
      for (const sx of [-1, 1]) L.part((c) => E(c, r.bx + sx * r.brx * 0.32, r.ground - lh * 0.45, lw * 0.6, lh * 0.5), p.main);
      for (const sx of [-1, 1]) L.part((c) => { for (let t = -1; t <= 1; t += 2) R(c, r.bx + sx * r.brx * 0.32 + t * 1.2 - 0.4, r.ground - 2.2, 0.9, 2); }, shadeHex(p.main, 0.45), { clip: true, flat: true });
    },
    biped(L, r, p, f, back) {
      const fx = 4 + 4 * r.s;
      for (const sx of [-1, 1]) L.part((c) => E(c, r.bx + sx * fx, r.ground - 2.5, 3.5 + 2.5 * r.s, 3 + 0.8 * r.s), shadeHex(p.main, 0.85));
      L.part((c) => E(c, r.bx, r.by, r.brx, r.bry), p.main);
      if (f.stripes) stripes(L, r, p);
      if (f.belly && !back) L.part((c) => E(c, r.bx, r.by + r.bry * 0.15, r.brx * 0.62, r.bry * 0.72), p.belly, { clip: true });
      const big = f.arms === 'big';
      for (const sx of [-1, 1]) {
        L.part((c) => E(c, r.bx + sx * (r.brx * 0.95), r.by - r.bry * 0.05, 2.6 + 1.8 * r.s, 5 + 3 * r.s, sx * 0.45), p.main);
        if (big) L.part((c) => E(c, r.bx + sx * (r.brx * 1.15), r.by + r.bry * 0.38, 3.2 + 2.4 * r.s, 3 + 2.2 * r.s), f.band ? p.belly : shadeHex(p.main, 0.9));
      }
    },
    bird(L, r, p, f, back) {
      for (const sx of [-1, 1]) L.part((c) => { LINE(c, 1.4, [r.bx + sx * 4, r.ground - 4, r.bx + sx * 4, r.ground]); LINE(c, 1.2, [r.bx + sx * 4, r.ground, r.bx + sx * 6.5, r.ground]); LINE(c, 1.2, [r.bx + sx * 4, r.ground, r.bx + sx * 1.5, r.ground]); }, '#f0a030');
      L.part((c) => E(c, r.bx, r.by, r.brx, r.bry), p.main);
      if (!back) L.part((c) => E(c, r.bx, r.by + r.bry * 0.35, r.brx * 0.6, r.bry * 0.6), p.belly, { clip: true });
      // wings at sides
      for (const sx of [-1, 1]) L.part((c) => { c.beginPath(); c.moveTo(r.bx + sx * r.brx * 0.7, r.by - r.bry * 0.45); c.quadraticCurveTo(r.bx + sx * (r.brx * 1.6), r.by - r.bry * 0.2, r.bx + sx * (r.brx * 1.25), r.by + r.bry * 0.75); c.quadraticCurveTo(r.bx + sx * r.brx * 0.8, r.by + r.bry * 0.4, r.bx + sx * r.brx * 0.7, r.by - r.bry * 0.45); c.fill(); }, p.acc === p.belly ? shadeHex(p.main, 0.8) : shadeHex(p.main, 0.82));
      if (r.sepHead) { /* head drawn by generic head step */ }
    },
    blob(L, r, p, f, back) {
      if (f.feet) for (const sx of [-1, 1]) L.part((c) => E(c, r.bx + sx * r.brx * 0.45, r.ground - 2, 3.5 + 2 * r.s, 2.6), shadeHex(p.main, 0.75));
      L.part((c) => { c.beginPath(); c.ellipse(r.bx, r.by, r.brx, r.bry, 0, PI, 0); c.lineTo(r.bx + r.brx, r.by + r.bry * 0.55); c.quadraticCurveTo(r.bx + r.brx, r.by + r.bry, r.bx + r.brx * 0.6, r.by + r.bry); c.lineTo(r.bx - r.brx * 0.6, r.by + r.bry); c.quadraticCurveTo(r.bx - r.brx, r.by + r.bry, r.bx - r.brx, r.by + r.bry * 0.55); c.closePath(); c.fill(); }, p.main);
      if (f.stripes) stripes(L, r, p);
      if (!back && !f.cap) L.part((c) => E(c, r.bx, r.by + r.bry * 0.55, r.brx * 0.55, r.bry * 0.42), p.belly, { clip: true });
      if (f.arms) for (const sx of [-1, 1]) L.part((c) => E(c, r.bx + sx * r.brx * 0.98, r.by + r.bry * 0.25, 3 + 2 * r.s, 4.5 + 2.5 * r.s, sx * 0.5), p.main);
    },
    ghost(L, r, p, f, back) {
      L.part((c) => E(c, r.bx, r.ground - 1, r.brx * 0.6, 2), '#000000', { outline: false, flat: true });
      // shadow is replaced below by a translucent ellipse in battle; keep sprite clean
      const k = L.k, d = L.d; for (let i = 0; i < k.length; i++) if (k[i] === 3) { k[i] = 0; d[i * 4 + 3] = 0; }
      L.part((c) => {
        c.beginPath(); c.ellipse(r.bx, r.by, r.brx, r.bry, 0, PI, 0);
        c.quadraticCurveTo(r.bx + r.brx, r.by + r.bry * 1.2, r.bx + r.brx * 0.3, r.by + r.bry * 1.5);
        c.quadraticCurveTo(r.bx + r.brx * 0.55, r.by + r.bry * 2.0, r.bx - r.brx * 0.1, r.by + r.bry * 2.25);
        c.quadraticCurveTo(r.bx - r.brx * 0.1, r.by + r.bry * 1.6, r.bx - r.brx * 0.65, r.by + r.bry * 1.25);
        c.quadraticCurveTo(r.bx - r.brx * 1.05, r.by + r.bry * 0.9, r.bx - r.brx, r.by);
        c.fill();
      }, p.main);
      if (!back) L.part((c) => E(c, r.bx, r.by + r.bry * 0.75, r.brx * 0.5, r.bry * 0.45), p.belly, { clip: true });
      if (f.arms) for (const sx of [-1, 1]) L.part((c) => E(c, r.bx + sx * r.brx * 1.05, r.by + r.bry * 0.35, 2.5 + 2 * r.s, 4 + 2 * r.s, -sx * 0.6), p.main);
    },
    golem(L, r, p, f, back) {
      for (const sx of [-1, 1]) L.part((c) => E(c, r.bx + sx * r.brx * 0.5, r.ground - 3, 4 + 3 * r.s, 3.5), shadeHex(p.main, 0.8));
      L.part((c) => P(c, [r.bx - r.brx, r.by + r.bry * 0.3, r.bx - r.brx * 0.85, r.by - r.bry * 0.7, r.bx - r.brx * 0.3, r.by - r.bry, r.bx + r.brx * 0.4, r.by - r.bry * 0.95, r.bx + r.brx * 0.95, r.by - r.bry * 0.55, r.bx + r.brx, r.by + r.bry * 0.45, r.bx + r.brx * 0.6, r.by + r.bry, r.bx - r.brx * 0.6, r.by + r.bry]), p.main);
      L.part((c) => { E(c, r.bx - r.brx * 0.35, r.by + r.bry * 0.3, r.brx * 0.18, r.bry * 0.12); E(c, r.bx + r.brx * 0.5, r.by - r.bry * 0.45, r.brx * 0.14, r.bry * 0.1); E(c, r.bx + r.brx * 0.15, r.by + r.bry * 0.65, r.brx * 0.12, r.bry * 0.08); }, shadeHex(p.main, 0.82), { clip: true, flat: true });
      if (f.cracks) L.part((c) => { LINE(c, 1.4, [r.bx - r.brx * 0.6, r.by - r.bry * 0.2, r.bx - r.brx * 0.3, r.by + r.bry * 0.1, r.bx - r.brx * 0.4, r.by + r.bry * 0.5]); LINE(c, 1.4, [r.bx + r.brx * 0.7, r.by - r.bry * 0.3, r.bx + r.brx * 0.35, r.by, r.bx + r.brx * 0.55, r.by + r.bry * 0.45]); LINE(c, 1.2, [r.bx - r.brx * 0.1, r.by + r.bry * 0.6, r.bx + r.brx * 0.1, r.by + r.bry * 0.9]); }, p.acc, { clip: true, flat: true });
      if (f.spikes) for (const sx of [-1, 1]) L.part((c) => { P(c, [r.bx + sx * r.brx * 0.5, r.by - r.bry * 0.9, r.bx + sx * r.brx * 0.85, r.by - r.bry * 1.45, r.bx + sx * r.brx * 0.95, r.by - r.bry * 0.6]); }, f.gem ? p.acc2 : shadeHex(p.main, 0.9));
      // arms
      for (const sx of [-1, 1]) L.part((c) => P(c, [r.bx + sx * r.brx * 0.85, r.by - r.bry * 0.5, r.bx + sx * (r.brx * 1.35), r.by - r.bry * 0.2, r.bx + sx * (r.brx * 1.4), r.by + r.bry * 0.55, r.bx + sx * r.brx * 1.05, r.by + r.bry * 0.75, r.bx + sx * r.brx * 0.85, r.by + r.bry * 0.3]), shadeHex(p.main, 0.92));
      if (f.flame) L.part((c) => FLAME(c, r.bx, r.by - r.bry * 0.85, f.flame === 'big' ? 26 : 16, f.flame === 'big' ? 9 : 6), p.fl2);
      if (f.flame) L.part((c) => FLAME(c, r.bx, r.by - r.bry * 0.85, f.flame === 'big' ? 15 : 9, f.flame === 'big' ? 5 : 3.5), p.fl1, { outline: false });
      if (r.sepHead) L.part((c) => P(c, [r.hx - r.hr * 1.3, r.hy + r.hr * 0.8, r.hx - r.hr * 1.2, r.hy - r.hr * 0.6, r.hx - r.hr * 0.3, r.hy - r.hr, r.hx + r.hr * 1.1, r.hy - r.hr * 0.7, r.hx + r.hr * 1.3, r.hy + r.hr * 0.8]), p.main);
      r.noHead = true; // head (if any) already drawn as a rock
      if (r.sepHead) { r.hr *= 1.1; }
    },
    serpent(L, r, p, f, back) {
      const s = r.s;
      L.part((c) => E(c, r.bx, r.ground - r.cry, r.crx, r.cry), p.main);
      L.part((c) => E(c, r.bx + 2, r.ground - r.cry * 2.4, r.crx * 0.78, r.cry * 0.95), p.main);
      // neck
      L.part((c) => { c.lineWidth = 7 + 5 * s; c.beginPath(); c.moveTo(r.bx + 3, r.ground - r.cry * 2.6); c.quadraticCurveTo(r.bx + r.crx * 0.55, r.hy + r.hr * 1.6, r.hx, r.hy + r.hr * 0.4); c.stroke(); }, p.main);
      if (!back) L.part((c) => { c.lineWidth = 3 + 2.5 * s; c.beginPath(); c.moveTo(r.bx + 1, r.ground - r.cry * 2.6); c.quadraticCurveTo(r.bx + r.crx * 0.45, r.hy + r.hr * 1.6, r.hx - 1, r.hy + r.hr * 0.5); c.stroke(); }, p.belly, { clip: true });
      if (f.stripes) L.part((c) => { for (let i = 0; i < 4; i++) R(c, r.bx - r.crx + i * r.crx * 0.55, r.ground - r.cry * 3.5, 2.5, r.cry * 3.6); }, p.acc, { clip: true });
      // tail tip
      L.part((c) => P(c, [r.bx + r.crx * 0.8, r.ground - r.cry * 0.8, r.bx + r.crx * 1.35, r.ground - r.cry * 2.2, r.bx + r.crx * 0.95, r.ground - r.cry * 0.1]), p.main);
    },
    fish(L, r, p, f, back) {
      // tail fin
      L.part((c) => P(c, [r.bx + r.brx * 0.8, r.by, r.bx + r.brx * 1.45, r.by - r.bry * 0.95, r.bx + r.brx * 1.25, r.by, r.bx + r.brx * 1.45, r.by + r.bry * 0.95]), p.acc);
      L.part((c) => P(c, [r.bx - r.brx * 0.1, r.by - r.bry * 0.8, r.bx + r.brx * 0.35, r.by - r.bry * 1.55, r.bx + r.brx * 0.55, r.by - r.bry * 0.7]), p.acc);
      L.part((c) => E(c, r.bx, r.by, r.brx, r.bry), p.main);
      L.part((c) => E(c, r.bx, r.by + r.bry * 0.55, r.brx * 0.95, r.bry * 0.5), p.belly, { clip: true });
      if (f.spots) L.part((c) => { E(c, r.bx + r.brx * 0.2, r.by - r.bry * 0.35, 2.2, 2.2); E(c, r.bx + r.brx * 0.5, r.by - r.bry * 0.05, 1.8, 1.8); E(c, r.bx - r.brx * 0.05, r.by + r.bry * 0.1, 1.6, 1.6); }, p.acc, { clip: true, flat: true });
      L.part((c) => P(c, [r.bx - r.brx * 0.1, r.by + r.bry * 0.25, r.bx + r.brx * 0.3, r.by + r.bry * 0.55, r.bx - r.brx * 0.15, r.by + r.bry * 0.75]), p.acc);
      if (f.horn) L.part((c) => P(c, [r.bx - r.brx * 0.75, r.by - r.bry * 0.55, r.bx - r.brx * 1.15, r.by - r.bry * 1.5, r.bx - r.brx * 0.45, r.by - r.bry * 0.8]), p.ivory);
      r._fishDone = true;
    },
    moth(L, r, p, f, back) {
      for (const sx of [-1, 1]) {
        L.part((c) => { c.beginPath(); c.moveTo(r.bx, r.by - r.bry * 0.6); c.quadraticCurveTo(r.bx + sx * 30, r.by - r.bry * 2.2, r.bx + sx * 29, r.by - r.bry * 0.3); c.quadraticCurveTo(r.bx + sx * 18, r.by + 2, r.bx, r.by); c.fill(); }, p.main);
        L.part((c) => { c.beginPath(); c.moveTo(r.bx, r.by); c.quadraticCurveTo(r.bx + sx * 24, r.by + 2, r.bx + sx * 18, r.by + r.bry * 1.25); c.quadraticCurveTo(r.bx + sx * 6, r.by + r.bry * 1.2, r.bx, r.by + r.bry * 0.5); c.fill(); }, shadeHex(p.main, 0.85));
        L.part((c) => { E(c, r.bx + sx * 17, r.by - r.bry * 0.9, 5, 4); }, p.acc, { clip: true, flat: true });
        L.part((c) => { E(c, r.bx + sx * 17, r.by - r.bry * 0.9, 2.2, 1.8); E(c, r.bx + sx * 12, r.by + r.bry * 0.7, 2.2, 2.2); }, p.belly, { clip: true, flat: true });
      }
      L.part((c) => E(c, r.bx, r.by, r.brx, r.bry), p.belly);
      L.part((c) => { for (let i = 0; i < 3; i++) R(c, r.bx - r.brx, r.by - r.bry * 0.2 + i * r.bry * 0.38, r.brx * 2, 1.4); }, shadeHex(p.belly, 0.75), { clip: true, flat: true });
    },
    bug(L, r, p, f, back) { // caterpillar, side view, facing left
      const segs = 3; const sr = r.hr * 0.78;
      for (let i = segs; i >= 1; i--) {
        const cx = r.hx + i * sr * 1.25, rr = sr * (1 - i * 0.08), cy = r.ground - rr - (i === 2 ? 2 : 0);
        L.part((c) => E(c, cx, cy, rr, rr), p.main);
        L.part((c) => E(c, cx, cy + rr * 0.55, rr * 0.8, rr * 0.45), p.belly, { clip: true });
        if (f.spots) L.part((c) => E(c, cx, cy - rr * 0.45, rr * 0.32, rr * 0.28), p.acc, { clip: true, flat: true });
        L.part((c) => R(c, cx - 1, r.ground - 2, 2, 2), shadeHex(p.main, 0.5), { flat: true });
      }
      L.part((c) => E(c, r.hx, r.hy, r.hr * 1.02, r.hr), p.main);
      r.noHead = true;
    },
    crab(L, r, p, f, back) {
      const big = f.claws === 'big';
      for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) L.part((c) => LINE(c, 1.6, [r.bx + sx * (r.brx * 0.4 + i * 3), r.by + r.bry * 0.4, r.bx + sx * (r.brx * 0.8 + i * 3.4), r.by + r.bry * 0.8, r.bx + sx * (r.brx * 0.75 + i * 3.6), r.ground]), shadeHex(p.main, 0.8));
      if (f.eyestalks) for (const sx of [-1, 1]) L.part((c) => LINE(c, 2, [r.bx + sx * 5, r.by - r.bry * 0.6, r.bx + sx * 6, r.by - r.bry - 6]), p.main);
      L.part((c) => E(c, r.bx, r.by, r.brx, r.bry), p.main);
      L.part((c) => E(c, r.bx, r.by + r.bry * 0.5, r.brx * 0.7, r.bry * 0.45), p.belly, { clip: true });
      if (f.spikes) L.part((c) => { for (let i = -2; i <= 2; i++) P(c, [r.bx + i * 5 - 2.5, r.by - r.bry * 0.8, r.bx + i * 5, r.by - r.bry - 4, r.bx + i * 5 + 2.5, r.by - r.bry * 0.8]); }, p.acc);
      for (const sx of [-1, 1]) {
        const cx = r.bx + sx * (r.brx + (big ? 7 : 4)), cy = r.by - r.bry * (big ? 0.9 : 0.5), cr = big ? 8.5 : 5.5;
        L.part((c) => LINE(c, 3, [r.bx + sx * r.brx * 0.8, r.by, cx, cy + cr * 0.6]), p.main);
        L.part((c) => { c.beginPath(); c.ellipse(cx, cy, cr, cr * 0.9, 0, 0, PI * 2); c.fill(); }, p.main);
        L.part((c) => P(c, [cx - sx * cr * 0.1, cy - cr * 0.1, cx + sx * cr * 0.3, cy - cr * 1.2, cx + sx * cr * 1.1, cy - cr * 0.6]), '#000', { clip: true, flat: true });
      }
      // remove the black notch pixels (make them transparent) to form pincers
      const k = L.k, d = L.d; for (let i = 0; i < k.length; i++) if (k[i] === 3 && d[i * 4] === 0 && d[i * 4 + 1] === 0 && d[i * 4 + 2] === 0) { k[i] = 0; d[i * 4 + 3] = 0; }
      r.eyes = f.eyestalks ? [[r.bx - 6, r.by - r.bry - 6], [r.bx + 6, r.by - r.bry - 6]] : null;
      r.hy = r.by - r.bry * 0.15; r.hr = r.bry * 1.1;
    },
  };
  function shadeHex(hex, f) { const [r, g, b] = hex2rgb(hex); return rgb2hex(r * f, g * f, b * f); }
  G.shadeHex = shadeHex;

  // ---------- features ----------
  function face(L, r, p, f, plan) {
    const fierce = r.s >= 0.85 || f.brow;
    if (r.side) { // single eye, facing left
      const er = Math.max(2.4, r.hr * 0.26), ex = r.hx - r.hr * 0.25, ey = r.hy - r.hr * 0.15;
      L.part((c) => E(c, ex, ey, er * 0.9, er * 1.1), p.white, { oc: p.eye, flat: true });
      L.part((c) => E(c, ex - er * 0.2, ey + er * 0.15, er * 0.55, er * 0.8), p.eye, { outline: false, flat: true });
      L.part((c) => R(c, ex - er * 0.45, ey - er * 0.45, 1.1, 1.1), p.white, { outline: false, flat: true });
      const mx = plan === 'fish' ? r.bx - r.brx * 0.92 : r.hx - r.hr * 0.85, my = r.hy + r.hr * 0.3;
      L.part((c) => LINE(c, 1.1, [mx, my, mx + 3, my + 0.6]), p.eye, { outline: false, flat: true });
      if (f.fangs) L.part((c) => P(c, [mx + 1, my + 0.5, mx + 2.5, my + 3, mx + 3, my + 0.5]), p.white, { outline: false, flat: true });
      return;
    }
    const er = Math.max(2.3, r.hr * 0.23);
    const ex = r.hr * 0.42, ey = r.hy + r.hr * 0.02;
    const eyes = r.eyes || [[r.hx - ex, ey], [r.hx + ex, ey]];
    if (f.sleepy) {
      for (const [x, y] of eyes) L.part((c) => { c.lineWidth = 1.3; c.beginPath(); c.arc(x, y - er * 0.4, er, 0.2 * PI, 0.8 * PI); c.stroke(); }, p.eye, { outline: false, flat: true });
    } else {
      eyes.forEach(([x, y], i) => {
        const sx = i === 0 ? -1 : 1;
        L.part((c) => E(c, x, y, er * 0.82, er * (fierce ? 0.95 : 1.15)), p.white, { oc: p.eye, flat: true });
        L.part((c) => E(c, x - sx * er * 0.12, y + er * 0.18, er * 0.55, er * (fierce ? 0.65 : 0.82)), p.eye, { outline: false, flat: true });
        L.part((c) => R(c, x - er * 0.4, y - er * 0.45, Math.max(1, er * 0.32), Math.max(1, er * 0.32)), p.white, { outline: false, flat: true });
        if (fierce) L.part((c) => P(c, [x - sx * er * 1.2, y - er * 1.6, x + sx * er * 1.3, y - er * 0.2, x + sx * er * 1.3, y - er * 1.6]), f.brow ? shadeHex(p.main, 0.55) : p.main, { clip: true, flat: !!f.brow });
      });
    }
    if (f.cheeks) for (const [x, y] of eyes) L.part((c) => E(c, x + (x < r.hx ? -er * 0.5 : er * 0.5), y + er * 1.5, er * 0.6, er * 0.42), plan === 'quad' && p.acc2 ? p.acc2 : '#f4889c', { clip: true, flat: true });
    if (f.beak) {
      const by = ey + er * 0.9;
      L.part((c) => P(c, [r.hx - er * 0.9, by, r.hx + er * 0.9, by, r.hx, by + er * 1.5]), '#f0a830');
    } else if (!r.eyes) {
      const my = r.hy + r.hr * 0.48, mw = Math.max(1.6, r.hr * 0.16);
      L.part((c) => { c.lineWidth = 1.1; c.beginPath(); c.moveTo(r.hx - mw * 1.6, my - 0.6); c.quadraticCurveTo(r.hx - mw * 0.8, my + 1.4, r.hx, my); c.quadraticCurveTo(r.hx + mw * 0.8, my + 1.4, r.hx + mw * 1.6, my - 0.6); c.stroke(); }, p.eye, { outline: false, flat: true });
      if (f.fangs) for (const sx of [-1, 1]) L.part((c) => P(c, [r.hx + sx * mw * 0.6 - 0.8, my + 0.6, r.hx + sx * mw * 0.6 + 0.8, my + 0.6, r.hx + sx * mw * 0.6, my + 2.6]), p.white, { outline: false, flat: true });
      if (f.teeth) L.part((c) => R(c, r.hx - 1.5, my + 0.5, 3, 2.5), p.white, { oc: p.eye, flat: true });
    } else {
      const my = r.hy + 2;
      L.part((c) => { c.lineWidth = 1.1; c.beginPath(); c.moveTo(r.hx - 3, my); c.quadraticCurveTo(r.hx, my + 2, r.hx + 3, my); c.stroke(); }, p.eye, { outline: false, flat: true });
    }
    if (f.whiskers) for (const sx of [-1, 1]) L.part((c) => { for (let i = -1; i <= 1; i++) LINE(c, 0.8, [r.hx + sx * r.hr * 0.55, r.hy + r.hr * 0.38 + i * 1.6, r.hx + sx * r.hr * 1.25, r.hy + r.hr * 0.3 + i * 2.6]); }, p.eye, { outline: false, flat: true });
  }
  function ears(L, r, p, kind) {
    const { hx, hy, hr } = r;
    for (const sx of [-1, 1]) {
      if (kind === 'pointy') {
        L.part((c) => P(c, [hx + sx * hr * 0.15, hy - hr * 0.75, hx + sx * hr * 1.05, hy - hr * 1.55, hx + sx * hr * 0.95, hy - hr * 0.2]), p.main);
        L.part((c) => P(c, [hx + sx * hr * 0.4, hy - hr * 0.72, hx + sx * hr * 0.92, hy - hr * 1.25, hx + sx * hr * 0.85, hy - hr * 0.5]), p.acc, { outline: false });
      } else if (kind === 'round') {
        L.part((c) => E(c, hx + sx * hr * 0.75, hy - hr * 0.72, hr * 0.38, hr * 0.38), p.main);
        L.part((c) => E(c, hx + sx * hr * 0.75, hy - hr * 0.72, hr * 0.2, hr * 0.2), p.acc, { outline: false });
      } else if (kind === 'long') {
        L.part((c) => E(c, hx + sx * hr * 0.5, hy - hr * 1.3, hr * 0.24, hr * 0.72, sx * 0.3), p.main);
        L.part((c) => E(c, hx + sx * hr * 0.5, hy - hr * 1.25, hr * 0.11, hr * 0.5, sx * 0.3), p.acc, { outline: false });
      } else if (kind === 'fin') {
        L.part((c) => P(c, [hx + sx * hr * 0.7, hy - hr * 0.5, hx + sx * hr * 1.7, hy - hr * 0.55, hx + sx * hr * 0.85, hy + hr * 0.3]), p.acc);
      }
    }
  }
  function horns(L, r, p, kind) {
    const { hx, hy, hr } = r; const col = p.ivory;
    if (kind === 'one') L.part((c) => P(c, [hx - hr * 0.22, hy - hr * 0.7, hx, hy - hr * 1.7, hx + hr * 0.22, hy - hr * 0.7]), col);
    else for (const sx of [-1, 1]) L.part((c) => { c.beginPath(); c.moveTo(hx + sx * hr * 0.3, hy - hr * 0.7); c.quadraticCurveTo(hx + sx * hr * 0.6, hy - hr * 1.5, hx + sx * hr * 1.05, hy - hr * 1.6); c.quadraticCurveTo(hx + sx * hr * 0.85, hy - hr * 1.05, hx + sx * hr * 0.75, hy - hr * 0.55); c.fill(); }, col);
  }
  function antlers(L, r, p) {
    const { hx, hy, hr } = r;
    for (const sx of [-1, 1]) L.part((c) => { LINE(c, 2.4, [hx + sx * hr * 0.35, hy - hr * 0.75, hx + sx * hr * 0.75, hy - hr * 1.6, hx + sx * hr * 1.35, hy - hr * 2.0]); LINE(c, 2, [hx + sx * hr * 0.62, hy - hr * 1.3, hx + sx * hr * 1.25, hy - hr * 1.35]); LINE(c, 2, [hx + sx * hr * 0.8, hy - hr * 1.7, hx + sx * hr * 0.75, hy - hr * 2.2]); }, p.acc2);
  }
  function headFin(L, r, p, plan) {
    if (plan === 'fish') { r._fin = true; return; }
    const { hx, hy, hr } = r;
    L.part((c) => P(c, [hx - hr * 0.35, hy - hr * 0.7, hx - hr * 0.05, hy - hr * 1.75, hx + hr * 0.55, hy - hr * 1.15, hx + hr * 0.4, hy - hr * 0.7]), p.acc);
  }
  function crest(L, r, p, big) {
    const { hx, hy, hr } = r; const k = big ? 1.5 : 1; const top = r.noHead ? hy - hr * 0.95 : hy - hr * 0.85;
    L.part((c) => { LEAF(c, hx, top + 2, -PI / 2, hr * 0.8 * k, hr * 0.22 * k); LEAF(c, hx - 1, top + 2, -PI / 2 - 0.5, hr * 0.62 * k, hr * 0.2 * k); LEAF(c, hx + 1, top + 2, -PI / 2 + 0.5, hr * 0.62 * k, hr * 0.2 * k); }, big ? p.acc2 : p.acc);
  }
  function antenna(L, r, p) {
    const { hx, hy, hr } = r;
    for (const sx of [-1, 1]) {
      L.part((c) => CURVE(c, 1.1, hx + sx * hr * 0.3, hy - hr * 0.8, hx + sx * hr * 0.4, hy - hr * 1.6, hx + sx * hr * 0.95, hy - hr * 1.7), p.eye, { outline: false, flat: true });
      L.part((c) => E(c, hx + sx * hr * 0.95, hy - hr * 1.7, 1.8, 1.8), p.acc);
    }
  }
  function sprout(L, r, p) {
    const { hx, hy, hr } = r; const top = hy - hr * 0.9;
    L.part((c) => LINE(c, 1.6, [hx, top + 2, hx, top - 4]), '#3c8c34');
    L.part((c) => { LEAF(c, hx, top - 3, -PI / 2 - 0.9, hr * 0.85, hr * 0.32); LEAF(c, hx, top - 3, -PI / 2 + 0.9, hr * 0.85, hr * 0.32); }, '#64c048');
  }
  function cap(L, r, p, big) {
    const { hx, hy, hr } = r; const k = big ? 1.12 : 1;
    const cy = hy - hr * 0.3;
    L.part((c) => { c.beginPath(); c.ellipse(hx, cy, hr * 1.5 * k, hr * 1.05 * k, 0, PI, 0); c.quadraticCurveTo(hx + hr * 1.5 * k, cy + hr * 0.35, hx, cy + hr * 0.25); c.quadraticCurveTo(hx - hr * 1.5 * k, cy + hr * 0.35, hx - hr * 1.5 * k, cy); c.fill(); }, p.acc);
    L.part((c) => { E(c, hx - hr * 0.7, cy - hr * 0.45, hr * 0.28, hr * 0.22); E(c, hx + hr * 0.5, cy - hr * 0.7, hr * 0.3, hr * 0.24); E(c, hx + hr * 1.05, cy - hr * 0.1, hr * 0.2, hr * 0.18); E(c, hx - hr * 0.1, cy - hr * 0.15, hr * 0.18, hr * 0.15); }, p.belly, { clip: true, flat: true });
    // shift the face down under the cap
    r.hy = hy + hr * 0.35; r.hr = hr * 0.85;
  }
  function gem(L, r, p, plan) {
    let x = r.hx, y = r.hy - r.hr * 0.62, g = Math.max(2.2, r.hr * 0.2);
    if (plan === 'golem') { y = r.by - r.bry * 0.1; g = 3.5; }
    L.part((c) => P(c, [x, y - g, x + g * 0.8, y, x, y + g, x - g * 0.8, y]), p.acc2, { oc: shadeHex(p.acc2, 0.4) });
    L.part((c) => R(c, x - g * 0.3, y - g * 0.4, 1, 1), '#ffffff', { outline: false, flat: true });
  }
  function bloom(L, r, p) {
    const cx = r.bx, cy = r.by - r.bry * 0.95, pr = r.bry * 0.75;
    for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * PI * 2 / 5; L.part((c) => E(c, cx + Math.cos(a) * pr, cy + Math.sin(a) * pr * 0.8, pr * 0.62, pr * 0.5, a), p.acc2); }
    L.part((c) => E(c, cx, cy, pr * 0.45, pr * 0.4), '#f8d848');
  }
  function spikes(L, r, p, plan) {
    const top = plan === 'serpent' ? r.hy : r.by - r.bry * 0.75;
    const w = r.brx || r.crx;
    L.part((c) => { for (let i = -2; i <= 2; i++) { const x = r.bx + i * w * 0.32; const h = 5 + 4 * r.s - Math.abs(i) * 1.5; P(c, [x - 3, top + 2, x + i * 0.8, top - h, x + 3, top + 2]); } }, p.acc);
  }
  function mane(L, r, p, kind) {
    const { hx, hy, hr } = r;
    if (kind === 'flame') {
      L.part((c) => { for (let i = 0; i < 7; i++) { const a = PI * 0.95 + i * (PI * 1.1 / 6); FLAME(c, hx + Math.cos(a) * hr * 0.9, hy + Math.sin(a) * hr * 0.85 + 3, hr * 0.85, hr * 0.32); } }, p.fl2);
      L.part((c) => { for (let i = 0; i < 7; i++) { const a = PI * 0.95 + i * (PI * 1.1 / 6); FLAME(c, hx + Math.cos(a) * hr * 0.9, hy + Math.sin(a) * hr * 0.85 + 3, hr * 0.5, hr * 0.18); } }, p.fl1, { outline: false });
    } else {
      L.part((c) => { for (let i = 0; i < 9; i++) { const a = PI * 0.8 + i * (PI * 1.4 / 8); E(c, hx + Math.cos(a) * hr * 1.0, hy + Math.sin(a) * hr * 0.95, hr * 0.42, hr * 0.42); } }, p.acc);
    }
  }
  function stripes(L, r, p) {
    L.part((c) => { for (let i = -3; i <= 3; i++) LINE(c, 2, [r.bx + i * r.brx * 0.35 - 3, r.by - r.bry * 1.2, r.bx + i * r.brx * 0.35 + 2, r.by - r.bry * 0.35]); }, p.acc, { clip: true });
  }
  function spots(L, r, p) {
    L.part((c) => { E(c, r.bx - r.brx * 0.55, r.by - r.bry * 0.35, 2.2, 1.8); E(c, r.bx + r.brx * 0.6, r.by - r.bry * 0.25, 2.4, 2); E(c, r.bx + r.brx * 0.15, r.by - r.bry * 0.6, 1.8, 1.5); E(c, r.bx - r.brx * 0.2, r.by - r.bry * 0.1, 1.5, 1.3); }, p.belly, { clip: true, flat: true });
  }
  function wings(L, r, p, kind, plan) {
    const sy = plan === 'blob' || plan === 'ghost' ? r.by - r.bry * 0.2 : r.by - r.bry * 0.6;
    const W = 14 + 12 * r.s, H = 10 + 10 * r.s;
    for (const sx of [-1, 1]) {
      if (kind === 'bat') {
        L.part((c) => { const x0 = r.bx + sx * (r.brx || 10) * 0.5; P(c, [x0, sy - 2, x0 + sx * W * 0.6, sy - H, x0 + sx * W, sy - H * 0.85, x0 + sx * W * 1.05, sy + H * 0.35, x0 + sx * W * 0.75, sy + H * 0.1, x0 + sx * W * 0.5, sy + H * 0.4, x0 + sx * W * 0.25, sy + H * 0.15, x0, sy + H * 0.4]); }, p.acc);
        L.part((c) => { const x0 = r.bx + sx * (r.brx || 10) * 0.5; LINE(c, 1.6, [x0, sy - 2, x0 + sx * W * 0.6, sy - H, x0 + sx * W, sy - H * 0.85]); }, shadeHex(p.acc, 0.7), { clip: true, flat: true });
      } else if (kind === 'feather') {
        for (let i = 0; i < 4; i++) L.part((c) => LEAF(c, r.bx + sx * (r.brx * 0.5), sy, (sx < 0 ? PI : 0) + sx * (-0.9 + i * 0.32), W * (1.15 - i * 0.12), 4.2), i % 2 ? p.acc : p.main);
      } else if (kind === 'fin') {
        L.part((c) => P(c, [r.bx + sx * r.brx * 0.4, sy, r.bx + sx * W * 1.2, sy - H * 1.1, r.bx + sx * W * 1.0, sy - H * 0.4, r.bx + sx * W * 1.25, sy - H * 0.2, r.bx + sx * W * 0.8, sy + H * 0.3, r.bx + sx * r.brx * 0.5, sy + H * 0.4]), p.acc);
      }
    }
  }
  function tail(L, r, p, kind, plan, back) {
    const x0 = r.bx + (r.brx || r.crx || 10) * 0.65, y0 = r.by + (r.bry || 6) * 0.1;
    const x1 = x0 + 8 + 6 * r.s, y1 = y0 - 12 - 10 * r.s;
    const bx = back ? r.bx : x0, bxx = back ? r.bx + 2 : x1; // back view: tail centered behind
    const X1 = back ? r.bx + 3 : x1, Y1 = back ? r.by + (r.bry || 6) * 0.2 : y1;
    const X0 = back ? r.bx : x0, Y0 = back ? r.by + (r.bry || 6) * 0.7 : y0;
    switch (kind) {
      case 'stub': L.part((c) => E(c, back ? r.bx : x0 + 3, back ? r.by + r.bry * 0.5 : y0 - 2, 3.5, 3), p.main); break;
      case 'flame':
        L.part((c) => CURVE(c, 3.2, X0, Y0, X1 + 4, (Y0 + Y1) / 2 + 4, X1, Y1 + 4), p.main);
        L.part((c) => FLAME(c, X1, Y1 + 5, 12 + 6 * r.s, 4.5 + 2 * r.s), p.fl2);
        L.part((c) => FLAME(c, X1, Y1 + 4.5, 6 + 3 * r.s, 2.2 + r.s), p.fl1, { outline: false });
        break;
      case 'leaf':
        L.part((c) => CURVE(c, 2.4, X0, Y0, X1 + 3, (Y0 + Y1) / 2 + 4, X1, Y1 + 3), p.main);
        L.part((c) => LEAF(c, X1, Y1 + 3, -PI / 2 + 0.3, 12 + 5 * r.s, 5), p.acc);
        break;
      case 'thin':
        L.part((c) => CURVE(c, 1.6, X0, Y0, X1 + 8, Y0, X1 + 4, Y1 + 2), p.main);
        L.part((c) => E(c, X1 + 4, Y1 + 2, 2, 2), p.acc);
        break;
      case 'bolt':
        L.part((c) => P(c, [X0 - 1, Y0 + 2, X0 + 6, Y0 - 6, X0 + 2, Y0 - 8, X1 + 2, Y1 - 4, X1 - 1, Y1 + 6, X0 + 7, Y0 - 1, X0 + 4, Y0 + 1]), p.main);
        L.part((c) => P(c, [X0 - 1, Y0 + 2, X0 + 6, Y0 - 6, X0 + 4, Y0 - 4]), p.acc, { clip: true });
        break;
      case 'fin':
        L.part((c) => P(c, [X0 - 2, Y0 + 4, X1 + 4, Y0 - 2, X1 + 2, Y0 + 4, X1 + 6, Y0 + 10, X0, Y0 + 10]), p.acc);
        break;
      case 'fluffy':
        L.part((c) => E(c, (X0 + X1) / 2 + 2, (Y0 + Y1) / 2, 6 + 3 * r.s, 10 + 5 * r.s, 0.5), p.main);
        L.part((c) => E(c, X1 + 1, Y1 + 2, 4 + 2 * r.s, 4 + 2 * r.s), p.belly, { clip: true });
        break;
      case 'feather':
        for (let i = -1; i <= 1; i++) L.part((c) => LEAF(c, back ? r.bx : r.bx, r.by + r.bry * 0.6, PI / 2 + i * 0.5, r.bry * 0.9, 3.5), i === 0 ? p.acc : p.main);
        break;
      case 'thick':
        L.part((c) => { c.lineWidth = 6 + 3 * r.s; c.beginPath(); c.moveTo(X0 - 4, Y0 + 8); c.quadraticCurveTo(X1 + 10, Y0 + 12, X1 + 10, Y1 + 8); c.stroke(); }, p.main);
        L.part((c) => P(c, [X1 + 6, Y1 + 9, X1 + 10, Y1 - 2, X1 + 15, Y1 + 9]), p.acc);
        break;
    }
  }

  // ---------- cache ----------
  const cache = {};
  G.creatureSprite = (spId, shiny = false, back = false) => {
    const key = spId + (shiny ? '*' : '') + (back ? 'B' : 'F');
    if (!cache[key]) {
      const sp = G.SPECIES[spId];
      const side = ['fish', 'bug'].includes(sp.art.plan) && !(sp.art.f || []).some((f) => f.startsWith('claws'));
      let cv = makeCreature(spId, { shiny, back: back && !side, size: back ? 80 : 64 });
      if (back && side) { // side-view creatures: mirror instead
        const m = document.createElement('canvas'); m.width = 80; m.height = 80; const mc = m.getContext('2d');
        mc.imageSmoothingEnabled = false; mc.translate(80, 0); mc.scale(-1, 1); mc.drawImage(cv, 0, 0); cv = m;
      }
      cache[key] = cv;
    }
    return cache[key];
  };
  // small 32px icon
  G.creatureIcon = (spId, shiny = false) => {
    const key = spId + (shiny ? '*' : '') + 'I';
    if (!cache[key]) cache[key] = makeCreature(spId, { shiny, size: 32 });
    return cache[key];
  };
  // white silhouette (for evolution/flash effects)
  const silCache = {};
  G.silhouette = (cv, col = '#ffffff') => {
    const key = cv.__id || (cv.__id = Math.random().toString(36)) ; const k2 = key + col;
    if (!silCache[k2]) {
      const s = document.createElement('canvas'); s.width = cv.width; s.height = cv.height; const c = s.getContext('2d');
      c.drawImage(cv, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, s.width, s.height);
      silCache[k2] = s;
    }
    return silCache[k2];
  };
})();
