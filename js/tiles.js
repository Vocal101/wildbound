'use strict';
// Overworld art: 16x16 tiles, buildings, people, orbs and item icons. All drawn in code.
(function () {
  const T = 16;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
  const px = (c, col, x, y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0); };
  G.hash = hash;

  // ---------- tile painters ----------
  function grass(c, v) {
    px(c, '#7cc858', 0, 0, T, T);
    const r = (k) => hash(v, k, 7) % 16;
    for (let i = 0; i < 4; i++) { const x = r(i * 2), y = r(i * 2 + 1); px(c, '#5ca83c', x, y, 1, 2); px(c, '#5ca83c', x + 1, y + 1, 1, 1); px(c, '#9cdc74', x, y - 1 < 0 ? 0 : y - 1); }
  }
  function tallGrass(c, base = ['#5cb040', '#3c8c2c', '#8cd864', '#2c6c20']) {
    px(c, base[0], 0, 0, T, T);
    const tuft = (ox, oy) => {
      px(c, base[3], ox, oy + 6, 8, 1);
      for (let i = 0; i < 4; i++) { px(c, base[1], ox + i * 2, oy + 1 + (i % 2), 1, 6 - (i % 2)); px(c, base[2], ox + i * 2 + 1, oy + 2 + (i % 2), 1, 4); }
    };
    tuft(0, 0); tuft(8, 0); tuft(0, 8); tuft(8, 8);
  }
  function tree(c) {
    grass(c, 3);
    px(c, '#2c4c24', 2, 1, 12, 11); px(c, '#2c4c24', 1, 3, 14, 7); px(c, '#2c4c24', 3, 0, 10, 1);
    px(c, '#3c8c3c', 3, 1, 10, 10); px(c, '#3c8c3c', 2, 3, 12, 6);
    px(c, '#58ac48', 4, 2, 6, 3); px(c, '#58ac48', 3, 4, 3, 3); px(c, '#78c858', 5, 2, 3, 1); px(c, '#78c858', 4, 3, 1, 2);
    px(c, '#2c6c2c', 9, 7, 4, 2); px(c, '#2c6c2c', 6, 9, 5, 1);
    px(c, '#4c3020', 6, 11, 4, 4); px(c, '#8c5c34', 7, 11, 2, 4); px(c, '#4c3020', 5, 15, 6, 1);
  }
  function water(c, f) {
    px(c, '#4c94e4', 0, 0, T, T);
    for (let y = 0; y < T; y += 4) {
      const o = (f * 2 + (y / 4) * 5) % 16;
      px(c, '#7cb8f4', (o) % 16, y + 1, 4, 1); px(c, '#7cb8f4', (o + 9) % 16, y + 3, 3, 1);
      px(c, '#3c7ccc', (o + 5) % 16, y + 2, 3, 1);
    }
  }
  function path(c, v) {
    px(c, '#dcc48c', 0, 0, T, T);
    for (let i = 0; i < 5; i++) { const h = hash(v, i, 3); px(c, '#c4a874', h % 16, (h >> 4) % 16, 2, 1); px(c, '#ecd8a8', (h >> 8) % 16, (h >> 12) % 16, 1, 1); }
  }
  function sand(c, v) {
    px(c, '#f0e0a4', 0, 0, T, T);
    for (let i = 0; i < 6; i++) { const h = hash(v, i, 9); px(c, '#dcc888', h % 16, (h >> 4) % 16); }
  }
  function flowers(c, v, f) {
    grass(c, v);
    const cols = [['#f05050', '#f8d0d0'], ['#f8f8f8', '#f8e050'], ['#f8d040', '#f89030']][v % 3];
    for (const [x, y] of [[3, 3], [10, 9]]) {
      const o = f ? 1 : 0;
      px(c, cols[0], x - 1 + o, y, 3, 1); px(c, cols[0], x + o, y - 1, 1, 3); px(c, cols[1], x + o, y, 1, 1);
      px(c, '#3c8c2c', x, y + 2, 1, 2);
    }
  }
  function fence(c) {
    grass(c, 5);
    px(c, '#5c3c24', 0, 5, 16, 3); px(c, '#b48450', 0, 6, 16, 1);
    px(c, '#5c3c24', 0, 10, 16, 3); px(c, '#b48450', 0, 11, 16, 1);
    for (const x of [2, 12]) { px(c, '#5c3c24', x - 1, 3, 4, 12); px(c, '#c89460', x, 4, 2, 10); px(c, '#e0b480', x, 4, 1, 3); }
  }
  function rock(c, base) {
    if (base) base(c); else grass(c, 1);
    px(c, '#3c3c44', 2, 5, 12, 10); px(c, '#3c3c44', 3, 4, 10, 1);
    px(c, '#9c9ca8', 3, 5, 10, 9); px(c, '#c4c4cc', 4, 6, 5, 3); px(c, '#74747c', 8, 10, 5, 3); px(c, '#e0e0e8', 5, 6, 2, 1);
  }
  function ledge(c) {
    grass(c, 2);
    px(c, '#4c8c34', 0, 10, 16, 2); px(c, '#3c6c28', 0, 12, 16, 2); px(c, '#9cdc74', 0, 9, 16, 1);
    for (let x = 1; x < 16; x += 4) px(c, '#2c5c20', x, 13, 2, 1);
  }
  function sign(c, snowy) {
    if (snowy === true) snowGrass(c, 1); else grass(c, 4);
    px(c, '#4c3020', 7, 9, 2, 6); px(c, '#4c3020', 2, 2, 12, 8); px(c, '#c89460', 3, 3, 10, 6);
    px(c, '#8c6034', 4, 4, 8, 1); px(c, '#8c6034', 4, 6, 6, 1);
  }
  function cliff(c, v) {
    px(c, '#9c8464', 0, 0, T, T);
    px(c, '#7c6448', 0, 4, 16, 1); px(c, '#7c6448', 0, 10, 16, 1);
    const o = v % 2 ? 4 : 0;
    for (const x of [o, o + 8]) { px(c, '#7c6448', x, 0, 1, 4); px(c, '#7c6448', (x + 4) % 16, 5, 1, 5); px(c, '#7c6448', x, 11, 1, 5); }
    px(c, '#b8a080', 2, 1, 3, 1); px(c, '#b8a080', 9, 6, 3, 1); px(c, '#b8a080', 4, 12, 3, 1);
  }
  function caveFloor(c, v) {
    px(c, '#8c7860', 0, 0, T, T);
    for (let i = 0; i < 5; i++) { const h = hash(v, i, 11); px(c, '#74644c', h % 16, (h >> 4) % 16, 2, 1); px(c, '#a08c74', (h >> 8) % 16, (h >> 12) % 16); }
  }
  function caveWall(c, v) {
    px(c, '#4c3c34', 0, 0, T, T);
    px(c, '#64503c', 1, 1, 6, 5); px(c, '#64503c', 9, 3, 6, 6); px(c, '#64503c', 3, 9, 7, 6);
    px(c, '#7c6450', 2, 1, 3, 1); px(c, '#7c6450', 10, 3, 3, 1); px(c, '#7c6450', 4, 9, 3, 1);
    px(c, '#2c2420', 0, 15, 16, 1);
  }
  function caveEntrance(c) {
    cliff(c, 0);
    px(c, '#2c2018', 2, 3, 12, 13); px(c, '#2c2018', 4, 1, 8, 2); px(c, '#100c08', 4, 5, 8, 11);
  }
  function bridge(c) {
    water(c, 0);
    px(c, '#6c4428', 0, 0, T, T);
    for (let y = 0; y < 16; y += 4) { px(c, '#c08c58', 0, y, 16, 3); px(c, '#dca878', 0, y, 16, 1); }
    px(c, '#4c2c18', 0, 0, 1, 16); px(c, '#4c2c18', 15, 0, 1, 16);
  }
  function wood(c, v) {
    px(c, '#d4a46c', 0, 0, T, T);
    for (let y = 0; y < 16; y += 4) { px(c, '#b48450', 0, y + 3, 16, 1); px(c, '#b48450', (y * 3 + v * 5) % 16, y, 1, 3); }
  }
  function tileFloor(c) {
    px(c, '#ecece4', 0, 0, T, T); px(c, '#d4d4cc', 0, 0, 16, 1); px(c, '#d4d4cc', 0, 0, 1, 16); px(c, '#d4d4cc', 8, 0, 1, 16); px(c, '#d4d4cc', 0, 8, 16, 1);
  }
  function wall(c) {
    px(c, '#f0e4cc', 0, 0, T, T); px(c, '#e0d0b0', 0, 0, 16, 2);
    for (let x = 2; x < 16; x += 6) px(c, '#e8d8bc', x, 2, 2, 11);
    px(c, '#a07850', 0, 13, 16, 3); px(c, '#c09868', 0, 13, 16, 1);
  }
  function counter(c) {
    tileFloor(c);
    px(c, '#6c4428', 0, 2, 16, 14); px(c, '#d88c50', 0, 2, 16, 4); px(c, '#f0a868', 0, 2, 16, 1); px(c, '#a86438', 0, 6, 16, 10);
  }
  function pc(c) {
    tileFloor(c);
    px(c, '#3c3c48', 1, 9, 14, 7); px(c, '#9ca0b0', 2, 10, 12, 5);
    px(c, '#2c2c38', 2, 0, 12, 10); px(c, '#58c8f0', 3, 1, 10, 7); px(c, '#a8ecff', 4, 2, 3, 2); px(c, '#f05050', 12, 11, 1, 1);
  }
  function table(c) {
    wood(c, 1);
    px(c, '#4c2c18', 0, 2, 16, 12); px(c, '#b07040', 1, 3, 14, 8); px(c, '#c88850', 1, 3, 14, 2); px(c, '#4c2c18', 2, 11, 2, 4); px(c, '#4c2c18', 12, 11, 2, 4);
  }
  function shelf(c) {
    px(c, '#4c2c18', 0, 0, T, T); px(c, '#8c5c34', 1, 1, 14, 14);
    for (const y of [1, 6, 11]) { px(c, '#4c2c18', 1, y + 4, 14, 1); for (let x = 2; x < 14; x += 2) px(c, ['#c84c4c', '#4c7cc8', '#58a858', '#d8b048'][(x + y) % 4], x, y, 2, 4); }
  }
  function mat(c) { tileFloor(c); px(c, '#a83030', 1, 3, 14, 10); px(c, '#d85050', 2, 4, 12, 8); px(c, '#f0d050', 3, 7, 10, 1); }
  function rug(c) { wood(c, 2); px(c, '#3c64a8', 0, 1, 16, 14); px(c, '#5888d0', 1, 2, 14, 12); px(c, '#f0e0a0', 3, 4, 10, 1); px(c, '#f0e0a0', 3, 11, 10, 1); }
  function healer(c) {
    tileFloor(c);
    px(c, '#4c4c58', 0, 4, 16, 12); px(c, '#d8d8e4', 1, 5, 14, 10);
    for (let i = 0; i < 3; i++) { px(c, '#383848', 2 + i * 4.5, 6, 3, 3); px(c, '#f06888', 3 + i * 4.5, 7, 1, 1); }
    px(c, '#58c8f0', 3, 11, 10, 3);
  }
  function plant(c) {
    tileFloor(c);
    px(c, '#8c4c2c', 4, 10, 8, 6); px(c, '#b8683c', 5, 10, 6, 5);
    px(c, '#2c6c2c', 3, 2, 10, 8); px(c, '#4ca848', 4, 1, 8, 8); px(c, '#78c858', 5, 2, 3, 3);
  }
  function bed(c) {
    wood(c, 3);
    px(c, '#4c2c18', 1, 0, 14, 16); px(c, '#f8f8f8', 2, 1, 12, 4); px(c, '#4c7cd8', 2, 5, 12, 10); px(c, '#6c9ce8', 2, 5, 12, 2);
  }
  function tv(c) {
    wood(c, 1);
    px(c, '#2c2c34', 1, 2, 14, 11); px(c, '#4c5c78', 2, 3, 12, 8); px(c, '#78a0c8', 3, 4, 4, 2); px(c, '#2c2c34', 6, 13, 4, 2);
  }
  function stairs(c) {
    wood(c, 0);
    for (let i = 0; i < 4; i++) { px(c, '#8c6040', 0, i * 4, 16, 1); px(c, '#e8c090', 0, i * 4 + 1, 16, 3); }
  }
  function lava(c, f) {
    px(c, '#e04c18', 0, 0, T, T);
    for (let i = 0; i < 4; i++) { const h = hash(i, f, 5); px(c, '#f8a030', (h % 12), (h >> 4) % 14, 4, 2); px(c, '#f8e070', (h >> 8) % 14, (h >> 12) % 14, 2, 1); }
  }
  function ashGround(c, v) {
    px(c, '#a08c80', 0, 0, T, T);
    for (let i = 0; i < 5; i++) { const h = hash(v, i, 13); px(c, '#88746c', h % 16, (h >> 4) % 16, 2, 1); px(c, '#b8a89c', (h >> 8) % 16, (h >> 12) % 16); }
  }
  function hallFloor(c, v) {
    const a = (v % 2) ? '#c8c4dc' : '#b8b4cc';
    px(c, a, 0, 0, T, T); px(c, '#a8a4bc', 0, 15, 16, 1); px(c, '#a8a4bc', 15, 0, 1, 16); px(c, '#e0dcf0', 1, 1, 3, 1);
  }
  function pillar(c) {
    hallFloor(c, 0);
    px(c, '#4c4860', 3, 0, 10, 16); px(c, '#e8e4f4', 4, 0, 8, 16); px(c, '#c8c4dc', 9, 0, 3, 16); px(c, '#a8a4bc', 3, 0, 10, 2); px(c, '#a8a4bc', 3, 14, 10, 2);
  }
  function statue(c) {
    hallFloor(c, 0);
    px(c, '#4c4860', 2, 10, 12, 6); px(c, '#a8a4bc', 3, 11, 10, 4);
    px(c, '#4c4860', 4, 1, 8, 10); px(c, '#d0ccdc', 5, 2, 6, 8); px(c, '#f0ecf8', 6, 3, 2, 2); px(c, '#4c4860', 5, 5, 1, 1); px(c, '#4c4860', 10, 5, 1, 1);
  }
  function metalFloor(c) {
    px(c, '#6c7488', 0, 0, T, T); px(c, '#5c6478', 0, 7, 16, 1); px(c, '#5c6478', 7, 0, 1, 16); px(c, '#8c94a8', 1, 1, 2, 1); px(c, '#8c94a8', 9, 9, 2, 1);
  }
  function metalWall(c) {
    px(c, '#343850', 0, 0, T, T); px(c, '#4c5070', 0, 0, 16, 3); px(c, '#c83c5c', 0, 9, 16, 2); px(c, '#24283c', 0, 14, 16, 2);
  }
  function machine(c, f) {
    metalFloor(c);
    px(c, '#24283c', 1, 1, 14, 15); px(c, '#4c5070', 2, 2, 12, 12);
    for (let i = 0; i < 4; i++) px(c, (hash(i, f, 1) % 3) ? '#58e068' : '#f05050', 3 + i * 3, 4, 2, 2);
    px(c, '#78c8f0', 3, 8, 10, 4);
  }
  function shrineFloor(c, v) { px(c, '#dcd4ec', 0, 0, T, T); px(c, '#c4bcd8', 0, 0, 16, 1); px(c, '#c4bcd8', 0, 0, 1, 16); if (v % 3 === 0) px(c, '#f0ecfa', 5, 5, 2, 2); }
  function altar(c, f) {
    shrineFloor(c, 1);
    px(c, '#4c4468', 1, 6, 14, 10); px(c, '#9c94c0', 2, 7, 12, 8); px(c, '#c8c0e8', 2, 7, 12, 2);
    px(c, f ? '#f8f0a0' : '#f0d070', 6, 1, 4, 5); px(c, '#ffffff', 7, 2, 1, 2);
  }
  function snowGrass(c, v) {
    px(c, '#eef4fa', 0, 0, T, T);
    for (let i = 0; i < 5; i++) { const h = hash(v, i, 17); px(c, '#d4e0ec', h % 16, (h >> 4) % 16, 2, 1); px(c, '#ffffff', (h >> 8) % 16, (h >> 12) % 16); }
  }
  function pine(c, snowy) {
    if (snowy) snowGrass(c, 2); else grass(c, 2);
    px(c, '#1c3c2c', 7, 0, 2, 1); px(c, '#1c3c2c', 5, 1, 6, 3); px(c, '#1c3c2c', 3, 4, 10, 4); px(c, '#1c3c2c', 1, 8, 14, 4);
    px(c, '#2c6c48', 7, 1, 2, 2); px(c, '#2c6c48', 6, 2, 4, 2); px(c, '#2c6c48', 4, 5, 8, 2); px(c, '#2c6c48', 2, 9, 12, 2);
    px(c, '#3c8c58', 6, 2, 1, 1); px(c, '#3c8c58', 4, 5, 2, 1); px(c, '#3c8c58', 2, 9, 3, 1);
    if (snowy) { px(c, '#ffffff', 6, 1, 3, 1); px(c, '#ffffff', 4, 4, 5, 1); px(c, '#ffffff', 2, 8, 6, 1); px(c, '#e0ecf8', 9, 8, 4, 1); }
    px(c, '#4c3020', 7, 12, 2, 4);
  }
  function iceFloor(c, v) {
    px(c, '#bce4f4', 0, 0, T, T); px(c, '#d8f4fc', 1, 1, 6, 1); px(c, '#d8f4fc', 9, 8, 5, 1);
    if (v % 2) { px(c, '#a0d4ec', 3, 10, 7, 1); px(c, '#ffffff', 12, 3, 2, 1); }
  }
  function iceWall(c) {
    px(c, '#4c84b0', 0, 0, T, T); px(c, '#78b0d8', 1, 1, 6, 5); px(c, '#78b0d8', 9, 3, 6, 6); px(c, '#78b0d8', 3, 9, 7, 6);
    px(c, '#c8ecfc', 2, 1, 3, 1); px(c, '#c8ecfc', 10, 3, 3, 1); px(c, '#c8ecfc', 4, 9, 3, 1); px(c, '#2c5478', 0, 15, 16, 1);
  }
  function darkGrass(c, v) {
    px(c, '#4c9c44', 0, 0, T, T);
    for (let i = 0; i < 5; i++) { const h = hash(v, i, 23); px(c, '#3c7c34', h % 16, (h >> 4) % 16, 1, 2); px(c, '#6cbc58', (h >> 8) % 16, (h >> 12) % 16); }
  }
  function ruinWall(c, v) {
    px(c, '#4c4860', 0, 0, T, T);
    for (let y = 0; y < 16; y += 5) { const o = (y / 5) % 2 ? 0 : 4; for (let x = -4; x < 16; x += 8) { px(c, '#6c6884', x + o + 1, y + 1, 6, 3); px(c, '#8c88a4', x + o + 1, y + 1, 6, 1); } }
    if (v % 3 === 0) px(c, '#58a868', 3, 12, 3, 2);
  }
  function ruinFloor(c, v) {
    px(c, '#8c8478', 0, 0, T, T); px(c, '#7c7468', 0, 7, 16, 1); px(c, '#7c7468', 7, 0, 1, 7); px(c, '#7c7468', 12, 8, 1, 8);
    if (v % 3 === 0) { px(c, '#5c9c58', 2, 2, 2, 1); px(c, '#5c9c58', 10, 11, 2, 1); }
  }
  function voidTile(c) { px(c, '#000000', 0, 0, T, T); }
  function hole(c) { caveFloor(c, 1); px(c, '#2c2018', 3, 4, 10, 9); px(c, '#100c08', 4, 5, 8, 7); }
  function window_(c) { wall(c); px(c, '#6c4c34', 3, 2, 10, 9); px(c, '#9cd4f0', 4, 3, 8, 7); px(c, '#6c4c34', 7, 3, 1, 7); px(c, '#d8f4ff', 5, 4, 2, 2); }

  // tile definitions: draw fn, solid, frames
  const DEF = {
    '.': { d: grass, v: 4 }, ',': { d: () => 0, grass: true }, 'T': { d: tree, solid: true }, '~': { d: water, solid: true, frames: 8, water: true },
    '=': { d: path, v: 4 }, ':': { d: sand, v: 4 }, '*': { d: flowers, v: 3, frames: 2 }, 'F': { d: fence, solid: true },
    'R': { d: (c) => rock(c), solid: true }, 'L': { d: ledge, ledge: true }, 'S': { d: sign, solid: true }, '#': { d: cliff, solid: true, v: 2 },
    'c': { d: caveFloor, v: 4 }, 'C': { d: caveWall, solid: true }, 'E': { d: caveEntrance }, 'B': { d: bridge },
    'K': { d: (c) => rock(c, (cc) => caveFloor(cc, 2)), solid: true }, 'O': { d: hole },
    'f': { d: wood, v: 3 }, 'g': { d: tileFloor }, 'W': { d: wall, solid: true }, 'w': { d: window_, solid: true }, 'k': { d: counter, solid: true },
    'P': { d: pc, solid: true }, 't': { d: table, solid: true }, 'b': { d: shelf, solid: true }, 'm': { d: mat }, 'r': { d: rug },
    'h': { d: healer, solid: true }, 'p': { d: plant, solid: true }, 'x': { d: voidTile, solid: true }, 'Y': { d: bed, solid: true },
    'V': { d: tv, solid: true }, 'u': { d: stairs }, 'l': { d: lava, solid: true, frames: 4 }, 'v': { d: ashGround, v: 4 },
    'a': { d: () => 0, grass: true, ash: true }, 'q': { d: hallFloor, v: 2 }, 'Q': { d: pillar, solid: true }, 'Z': { d: statue, solid: true },
    'n': { d: metalFloor }, 'N': { d: metalWall, solid: true }, 'M': { d: machine, solid: true, frames: 4 }, 'o': { d: shrineFloor, v: 3 },
    'A': { d: altar, solid: true, frames: 2 }, 's': { d: snowGrass, v: 4 },
    'i': { d: () => 0, grass: true, snow: true }, 'J': { d: (c) => pine(c, true), solid: true }, 'j': { d: (c) => pine(c, false), solid: true },
    'e': { d: iceFloor, v: 2 }, 'I': { d: iceWall, solid: true }, 'd': { d: darkGrass, v: 4 }, 'D': { d: () => 0, grass: true, forest: true },
    'X': { d: ruinWall, solid: true, v: 3 }, 'z': { d: ruinFloor, v: 3 }, 'G': { d: (c) => sign(c, true), solid: true },
  };
  G.TILEDEF = DEF;
  const cache = {};
  function tileCanvas(ch, v, f) {
    const key = ch + v + '_' + f;
    if (cache[key]) return cache[key];
    const [cv, c] = mk(T, T); const d = DEF[ch] || DEF.x;
    if (ch === ',') tallGrass(c);
    else if (ch === 'a') tallGrass(c, ['#9c9c78', '#6c6c50', '#c0c09c', '#54543c']);
    else if (ch === 'i') tallGrass(c, ['#dce8f4', '#8cb0cc', '#ffffff', '#6c90b0']);
    else if (ch === 'D') tallGrass(c, ['#3c8c38', '#245c24', '#5cac4c', '#1c4c1c']);
    else d.d(c, d.frames ? f : v, f);
    cache[key] = cv; return cv;
  }
  G.drawTile = (ctx, ch, x, y, mx, my) => {
    const d = DEF[ch] || DEF.x;
    const v = d.v ? hash(mx, my) % d.v : 0;
    const f = d.frames ? Math.floor(G.frame / (d.water ? 10 : 24)) % d.frames : 0;
    ctx.drawImage(tileCanvas(ch, v, f), x, y);
  };
  // the front blades of tall grass drawn over a character's feet
  const fronts = {};
  const GRASS_COLS = { ',': ['#5cb040', '#3c8c2c', '#8cd864', '#2c6c20'], a: ['#9c9c78', '#6c6c50', '#c0c09c', '#54543c'], i: ['#dce8f4', '#8cb0cc', '#ffffff', '#6c90b0'], D: ['#3c8c38', '#245c24', '#5cac4c', '#1c4c1c'] };
  G.grassOverlay = (t) => {
    if (t === true) t = 'a'; if (!GRASS_COLS[t]) t = ',';
    if (!fronts[t]) {
      const [cv, c] = mk(T, 8); const base = GRASS_COLS[t];
      for (const ox of [0, 8]) { px(c, base[3], ox, 6, 8, 1); for (let i = 0; i < 4; i++) { px(c, base[1], ox + i * 2, 1 + (i % 2), 1, 6 - (i % 2)); px(c, base[2], ox + i * 2 + 1, 2 + (i % 2), 1, 4); } }
      px(c, base[0], 0, 7, 16, 1); fronts[t] = cv;
    }
    return fronts[t];
  };

  // ---------- buildings ----------
  const BLD = {
    house: { w: 5, h: 4, roof: ['#b84c3c', '#d86c50', '#7c2c24'], wall: '#f0e0c0', door: 2 },
    home: { w: 5, h: 4, roof: ['#4c7cc0', '#6c9cdc', '#2c4c88'], wall: '#f4e8cc', door: 2 },
    lab: { w: 7, h: 4, roof: ['#7c8c9c', '#a0b0c0', '#4c5868'], wall: '#f8f8f4', door: 3 },
    haven: { w: 5, h: 4, roof: ['#e05068', '#f07890', '#982c40'], wall: '#fcf8f4', door: 2, sign: 'heal' },
    shop: { w: 5, h: 4, roof: ['#3c74cc', '#5c94e4', '#244c90'], wall: '#fcf8f4', door: 2, sign: 'shop' },
    hall: { w: 7, h: 5, roof: ['#6c5ca0', '#8c7cc0', '#3c3068'], wall: '#e8e4f0', door: 3, sign: 'hall' },
    tower: { w: 7, h: 7, roof: ['#2c3048', '#4c5070', '#181c2c'], wall: '#3c4058', door: 3, sign: 'tower' },
    hut: { w: 4, h: 3, roof: ['#a07040', '#c09060', '#604020'], wall: '#e8d4b0', door: 1 },
  };
  G.BLD = BLD;
  const bcache = {};
  G.buildingSprite = (kind) => {
    if (bcache[kind]) return bcache[kind];
    const b = BLD[kind]; const W = b.w * T, H = b.h * T;
    const [cv, c] = mk(W, H);
    const roofH = Math.round(H * (kind === 'tower' ? 0.18 : 0.5));
    // walls
    px(c, '#3c2c28', 0, roofH - 2, W, H - roofH + 2);
    px(c, b.wall, 1, roofH - 1, W - 2, H - roofH);
    if (kind === 'tower') {
      for (let y = roofH + 4; y < H - 18; y += 12) for (let x = 6; x < W - 8; x += 14) { px(c, '#1c2030', x, y, 9, 7); px(c, (x + y) % 3 ? '#f0d870' : '#5c6c9c', x + 1, y + 1, 7, 5); }
      px(c, '#c83c5c', 1, roofH + 1, W - 2, 2);
    } else {
      // windows
      const winCols = []; for (let i = 0; i < b.w; i++) if (i !== b.door && (i % 2 === (b.door % 2 === 0 ? 1 : 0) || b.w <= 4)) winCols.push(i);
      for (const i of winCols) { if (i === b.door) continue; const x = i * T + 3, y = roofH + 3; px(c, '#5c4030', x - 1, y - 1, 12, 9); px(c, '#9cd4f0', x, y, 10, 7); px(c, '#d8f4ff', x + 1, y + 1, 3, 2); px(c, '#5c4030', x + 4, y, 1, 7); }
    }
    px(c, '#9c8468', 1, H - 3, W - 2, 3);
    // roof
    const [r1, r2, r3] = b.roof;
    if (kind === 'tower') { px(c, r3, 0, 0, W, roofH); px(c, r1, 2, 2, W - 4, roofH - 4); px(c, r2, 2, 2, W - 4, 2); }
    else {
      px(c, r3, 0, 0, W, roofH); px(c, r1, 1, 1, W - 2, roofH - 3);
      for (let y = 3; y < roofH - 3; y += 4) px(c, r2, 1, y, W - 2, 1);
      px(c, r3, 0, roofH - 3, W, 2); px(c, r2, 1, 1, W - 2, 1);
    }
    // door
    const dx = b.door * T + 3, dy = H - T + 1;
    px(c, '#3c2418', dx - 1, dy - 1, 12, 16); px(c, kind === 'tower' ? '#58607c' : '#9c6438', dx, dy, 10, 15); px(c, '#c48c58', dx + 1, dy + 1, 3, 13);
    if (kind === 'haven' || kind === 'shop') { px(c, '#a8d8f0', dx, dy, 10, 15); px(c, '#ffffff', dx + 1, dy + 1, 2, 12); px(c, '#3c2418', dx + 4, dy, 1, 15); }
    px(c, '#f0d070', dx + 7, dy + 7, 2, 2);
    // signs
    if (b.sign) {
      const sx = W / 2 - 12, sy = roofH - 12;
      const col = { heal: '#f05070', shop: '#3c74cc', hall: '#e8c048', tower: '#c83c5c' }[b.sign];
      px(c, '#2c2028', sx - 1, sy - 1, 26, 11); px(c, '#ffffff', sx, sy, 24, 9);
      if (b.sign === 'heal') { px(c, col, sx + 8, sy + 2, 3, 2); px(c, col, sx + 13, sy + 2, 3, 2); px(c, col, sx + 7, sy + 3, 10, 2); px(c, col, sx + 8, sy + 5, 8, 1); px(c, col, sx + 9, sy + 6, 6, 1); px(c, col, sx + 11, sy + 7, 2, 1); }
      else if (b.sign === 'shop') { px(c, col, sx + 3, sy + 2, 18, 5); px(c, '#ffffff', sx + 6, sy + 3, 12, 1); px(c, '#ffffff', sx + 6, sy + 5, 12, 1); }
      else if (b.sign === 'hall') { px(c, '#3c3068', sx, sy, 24, 9); px(c, col, sx + 9, sy + 1, 6, 7); px(c, col, sx + 7, sy + 3, 10, 3); }
      else { px(c, '#181c2c', sx, sy, 24, 9); px(c, col, sx + 6, sy + 2, 12, 5); px(c, '#181c2c', sx + 9, sy + 3, 6, 3); }
    }
    bcache[kind] = cv; return cv;
  };

  // ---------- people ----------
  // template chars: O outline, H hair, h hair shade, S skin, E eye, C shirt, c shirt shade, P pants, B shoes, A accent, W white
  const HEAD = {
    down: ['.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OHSSSSSSHO...', '...OSSESSESSO...', '...OSSESSESSO...', '....OSSSSSSO....', '.....OOSSOO.....'],
    up: ['.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OhHHHHHHhO...', '....OhhhhhhO....', '.....OOSSOO.....'],
    left: ['.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OSSHHHHHHO...', '...OESSHHHHHO...', '...OSSSSHHHHO...', '....OSSSSSHO....', '.....OOSSOO.....'],
  };
  const CAP = {
    down: ['.....OOOOOO.....', '....OAAAAAAO....', '...OAAAAAAAAO...', '..OOOOOOOOOOOO..'],
    up: ['.....OOOOOO.....', '....OAAAAAAO....', '...OAAAAAAAAO...', '...OAAAAAAAAO...'],
    left: ['.....OOOOOO.....', '....OAAAAAAO....', '...OAAAAAAAAO...', '.OOOOOAAAAAAO...'],
  };
  const BODY = {
    down: ['....OCCCCCCO....', '...OCCCCCCCCO...', '...OSCCCCCCSO...'],
    up: ['....OCCCCCCO....', '...OCCCCCCCCO...', '...OSCCCCCCSO...'],
    left: ['.....OCCCCO.....', '....OCCCCCCO....', '....OCSSCCCO....'],
  };
  const LEGS = {
    down: [['....OPPPPPPO....', '....OPPOOPPO....', '....OBBOOBBO....', '....OOO..OOO....'],
      ['....OPPPPPPO....', '....OPPOOPPO....', '....OBBOOPPO....', '....OOO.OBBO....']],
    left: [['.....OPPPPO.....', '.....OPPPPO.....', '.....OBBBBO.....', '.....OOOOOO.....'],
      ['....OPPPPPPO....', '....OPPOOPPO....', '...OBBO..OBBO...', '...OOO....OOO...']],
  };
  LEGS.up = LEGS.down;
  const pcache = {};
  // look: {hair, skin, shirt, pants, shoes, accent, style:'short'|'long'|'cap', emblem}
  G.personSprite = (look, dir, frame) => {
    const key = JSON.stringify(look) + dir + frame;
    if (pcache[key]) return pcache[key];
    const flip = dir === 'right'; const d = flip ? 'left' : dir;
    let head = HEAD[d].slice();
    if (look.style === 'cap') { const cap = CAP[d]; for (let i = 0; i < cap.length; i++) head[i] = cap[i]; }
    let legs = LEGS[d][frame % 2 === 1 ? 1 : 0];
    if (frame === 3 && d !== 'left') legs = legs.map((r) => r.split('').reverse().join(''));
    const rows = head.concat(BODY[d], legs);
    const [cv, c] = mk(16, 17);
    const col = {
      O: '#28202c', H: look.hair, h: G.shadeHex(look.hair, 0.75), S: look.skin || '#f8d0a8', E: '#28202c',
      C: look.shirt, c: G.shadeHex(look.shirt, 0.8), P: look.pants || '#384058', B: look.shoes || '#c03838', A: look.accent || '#d03838', W: '#ffffff',
    };
    const bob = frame % 2 === 1 ? 1 : 0;
    rows.forEach((row, y) => {
      for (let x = 0; x < 16; x++) {
        const ch = row[x]; if (ch === '.') continue;
        const X = flip ? 15 - x : x;
        px(c, col[ch] || '#ff00ff', X, y + (y < 12 ? bob : 0), 1, 1);
      }
    });
    // long hair falls down the sides
    if (look.style === 'long') {
      const sides = d === 'left' ? [flip ? 4 : 11] : [3, 12];
      for (const sx of sides) for (let y = 4; y <= 10; y++) { px(c, col.H, sx, y + bob); px(c, col.O, sx + (sx < 8 ? -1 : 1), y + bob); }
      for (const sx of sides) px(c, col.O, sx, 11 + bob);
    }
    if (look.emblem && dir !== 'up') { const ex = d === 'left' ? (flip ? 8 : 7) : 7; px(c, look.emblem, ex, 10 + bob, 2, 2); }
    if (look.scarf && dir !== 'up') px(c, look.scarf, 5, 9 + bob, 6, 1);
    pcache[key] = cv; return cv;
  };
  // big front portrait for battles
  G.portrait = (look, scale = 4) => {
    const key = 'P' + JSON.stringify(look) + scale;
    if (pcache[key]) return pcache[key];
    const s = G.personSprite(look, 'down', 0);
    const [cv, c] = mk(16 * scale, 17 * scale); c.drawImage(s, 0, 0, 16 * scale, 17 * scale);
    pcache[key] = cv; return cv;
  };

  // ---------- orbs & item icons ----------
  const ORB = {
    bindorb: ['#3c8cdc', '#e0b040'], greatorb: ['#3cb878', '#c8d0d8'], ultraorb: ['#7c4cc8', '#f0c840'],
    masterorb: ['#e8e0f8', '#d04890'], netorb: ['#48b0b0', '#2c6c6c'], duskorb: ['#3c3c5c', '#68e080'], quickorb: ['#f0c838', '#3c78d8'],
  };
  const ocache = {};
  G.orbSprite = (id = 'bindorb', size = 12) => {
    const key = id + size; if (ocache[key]) return ocache[key];
    const [glass, ring] = ORB[id] || ORB.bindorb;
    const [cv, c] = mk(size, size); const r = size / 2;
    c.fillStyle = '#20202c'; c.beginPath(); c.arc(r, r, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = glass; c.beginPath(); c.arc(r, r, r - 1, 0, Math.PI * 2); c.fill();
    c.fillStyle = G.shadeHex(glass, 0.7); c.beginPath(); c.arc(r + 1, r + 1, r - 2.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = glass; c.beginPath(); c.arc(r - 0.5, r - 0.5, r - 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = ring; c.fillRect(1, r - 1, size - 2, 2); c.fillRect(r - 1, 1, 2, size - 2);
    c.fillStyle = '#ffffff'; c.fillRect(Math.round(r * 0.5), Math.round(r * 0.45), Math.max(1, size / 8), Math.max(1, size / 8));
    ocache[key] = cv; return cv;
  };
  G.itemIcon = (itemId) => {
    const key = 'I' + itemId; if (ocache[key]) return ocache[key];
    const it = G.ITEMS[itemId]; const [cv, c] = mk(16, 16);
    if (it.pocket === 'orbs') c.drawImage(G.orbSprite(itemId, 14), 1, 1);
    else if (it.pocket === 'med') {
      const col = itemId.includes('revive') ? '#f0d040' : it.fx.cure && !it.fx.heal ? '#68c868' : it.fx.pp || it.fx.ppAll ? '#58a8f0' : itemId === 'rarecandy' ? '#e070c0' : itemId === 'berry' ? '#4c78e0' : '#c858d8';
      if (itemId === 'berry') { px(c, '#28202c', 3, 4, 10, 10); px(c, col, 4, 5, 8, 8); px(c, '#3c8c2c', 7, 1, 2, 4); px(c, '#ffffff', 5, 6, 2, 2); }
      else if (itemId.includes('revive')) { px(c, '#28202c', 2, 2, 12, 12); px(c, col, 3, 3, 10, 10); px(c, '#ffffff', 7, 4, 2, 8); px(c, '#ffffff', 4, 7, 8, 2); }
      else if (itemId === 'rarecandy') { px(c, '#28202c', 2, 5, 12, 6); px(c, col, 3, 6, 10, 4); px(c, '#28202c', 0, 6, 3, 4); px(c, '#28202c', 13, 6, 3, 4); px(c, '#ffffff', 5, 7, 2, 1); }
      else { px(c, '#28202c', 4, 1, 8, 15); px(c, '#28202c', 3, 5, 10, 10); px(c, '#d8d8e0', 5, 2, 6, 3); px(c, col, 4, 6, 8, 8); px(c, '#ffffff', 5, 7, 2, 4); }
    } else if (it.pocket === 'discs') {
      const m = G.MOVES[it.fx.teach]; const tc = G.TYPES[m.type].color;
      px(c, '#28202c', 1, 1, 14, 14); px(c, tc, 2, 2, 12, 12); px(c, '#ffffff', 6, 6, 4, 4); px(c, '#28202c', 7, 7, 2, 2); px(c, '#ffffff', 3, 3, 3, 1);
    } else if (it.pocket === 'key') {
      px(c, '#28202c', 2, 2, 12, 12); px(c, '#e8c048', 3, 3, 10, 10); px(c, '#fff0a0', 4, 4, 4, 2);
      if (itemId === 'bike') { c.clearRect(0, 0, 16, 16); for (const x of [4, 12]) { px(c, '#28202c', x - 3, 9, 6, 6); px(c, '#d8d8e0', x - 2, 10, 4, 4); px(c, '#28202c', x - 1, 11, 2, 2); } px(c, '#d83838', 4, 7, 9, 2); px(c, '#d83838', 8, 4, 2, 4); }
      if (itemId.includes('rod')) { c.clearRect(0, 0, 16, 16); for (let i = 0; i < 13; i++) px(c, itemId === 'goodrod' ? '#3c78d8' : '#9c6438', 2 + i, 14 - i, 2, 2); px(c, '#d8d8e0', 14, 1, 1, 10); px(c, '#f05050', 13, 10, 3, 3); }
    } else {
      const col = itemId.startsWith('x') ? '#f05050' : itemId.includes('repel') ? '#58c8a0' : itemId.includes('stone') ? (itemId === 'thunderstone' ? '#58c060' : '#d8d0f0') : itemId === 'nugget' ? '#f0c838' : '#c08850';
      px(c, '#28202c', 3, 3, 10, 10); px(c, col, 4, 4, 8, 8); px(c, '#ffffff', 5, 5, 2, 2);
    }
    ocache[key] = cv; return cv;
  };
})();
