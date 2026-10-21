'use strict';
// Overworld: map loading, player movement, NPCs, trainers, encounters, fishing, warps, scripts.
(function () {
  const T = 16;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  G.DIRS = DIRS; G.OPP = OPP;
  G.MAPS = G.MAPS || {};
  G.PLAYER_LOOK = { hair: '#5c3c2c', skin: '#f8d0a8', shirt: '#e05848', pants: '#38405c', shoes: '#3c3c48', scarf: '#f8d050', style: 'short' };

  const isNight = () => { const h = new Date().getHours(); return h >= 19 || h < 6; };
  G.isNight = isNight;

  // build (once) a runtime grid for a map definition
  function build(def) {
    if (def._built) return def;
    const rows = def.rows; def.h = rows.length; def.w = Math.max(...rows.map((r) => r.length));
    def.grid = rows.map((r) => r.padEnd(def.w, def.border || (def.indoor ? 'x' : 'T')).split(''));
    def.bmask = Array.from({ length: def.h }, () => new Array(def.w).fill(0));
    def.doors = [];
    for (const b of def.buildings || []) {
      const B = G.BLD[b.kind];
      for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) if (def.bmask[b.y + y]) def.bmask[b.y + y][b.x + x] = 1;
      const dx = b.x + B.door, dy = b.y + B.h - 1;
      def.bmask[dy][dx] = 0;
      def.doors.push({ x: dx, y: dy, to: b.to, tx: b.tx, ty: b.ty, dir: 'up', lock: b.lock });
    }
    def._built = true; return def;
  }
  G.buildMap = build;

  class Entity {
    constructor(x, y, dir, look) { this.x = x; this.y = y; this.dir = dir || 'down'; this.look = look; this.prog = 0; this.moving = false; this.frame = 0; this.stepN = 0; this.hop = 0; }
    get px() { return this.x * T + (this.moving ? DIRS[this.dir][0] * (this.prog - T) : 0); }
    get py() { return this.y * T + (this.moving ? DIRS[this.dir][1] * (this.prog - T) : 0); }
  }

  class World {
    constructor() { this.busy = 0; this.npcs = []; this.cam = { x: 0, y: 0 }; this.t = 0; this.popup = null; this.player = new Entity(0, 0, 'down', G.PLAYER_LOOK); this.emote = null; }

    // ---------- map loading ----------
    load(id, x, y, dir) {
      const def = build(G.MAPS[id]); if (!def) throw new Error('map ' + id);
      this.map = def; this.mapId = id;
      G.S.map = id; G.S.x = x; G.S.y = y; if (dir) G.S.dir = dir;
      const p = this.player; p.x = x; p.y = y; p.dir = G.S.dir; p.moving = false; p.prog = 0; p.look = G.S.look;
      if (def.indoor || def.cave) G.S.bike = false;
      this.npcs = [];
      (def.npcs || []).forEach((n) => {
        if (n.cond && !G.cond(n.cond)) return;
        const pos = n.pos ? n.pos() : null;
        const e = new Entity(pos ? pos[0] : n.x, pos ? pos[1] : n.y, n.dir || 'down', n.look);
        e.def = n; e.home = [e.x, e.y]; e.wt = G.ri(60, 180); this.npcs.push(e);
      });
      this.items = (def.items || []).filter((it, i) => !G.hasFlag('item_' + id + '_' + i)).map((it) => Object.assign({ idx: def.items.indexOf(it) }, it));
      const mus = (def.musicFn ? def.musicFn() : def.music) || 'town';
      G.audio.play(G.S.bike && !def.indoor && !def.cave ? 'route' : mus);
      if (!def.indoor && def.name && this.lastName !== def.name) this.popup = { text: def.name, t: 150 };
      if (def.town) { G.S.visited = G.S.visited || {}; G.S.visited[def.town] = 1; }
      if (def.region) G.S.region = def.region;
      if (def.name) this.lastName = def.name;
      this.updateCam();
    }
    // back from a battle: keep NPCs and state, just restore music and camera
    resume() {
      const def = this.map; const mus = (def.musicFn ? def.musicFn() : def.music) || 'town';
      G.audio.play(G.S.bike && !def.indoor && !def.cave ? 'route' : mus, true);
      this.player.moving = false; this.updateCam();
    }
    async warp(id, x, y, dir, opts = {}) {
      this.busy++;
      if (!opts.noSfx) G.audio.sfx('door');
      await G.fadeOut(opts.fast ? 8 : 12);
      this.load(id, x, y, dir);
      await G.wait(4);
      await G.fadeIn(opts.fast ? 8 : 12);
      this.busy--;
      if (this.map.onEnter) await this.run(this.map.onEnter);
    }
    async run(fn, ...args) {
      this.busy++;
      try { return await fn(...args); }
      catch (e) { console.error(e); }
      finally { this.busy--; G.input.clear(); }
    }

    // ---------- queries ----------
    tile(x, y) { const m = this.map; if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null; return m.grid[y][x]; }
    npcAt(x, y) { return this.npcs.find((n) => (n.x === x && n.y === y) || (n.moving && n.x - DIRS[n.dir][0] === x && n.y - DIRS[n.dir][1] === y && n.prog < T)); }
    itemAt(x, y) { return this.items.find((i) => i.x === x && i.y === y); }
    solid(x, y, who) {
      const t = this.tile(x, y); if (t == null) return true;
      const d = G.TILEDEF[t]; if (!d || d.solid) return true;
      if (this.map.bmask[y][x]) return true;
      const it = this.itemAt(x, y); if (it && !it.hidden) return true;
      const n = this.npcAt(x, y); if (n && n !== who) return true;
      if (who !== this.player && this.player.x === x && this.player.y === y) return true;
      if (who !== this.player && this.map.doors.some((d) => d.x === x && d.y === y)) return true;
      return false;
    }
    front() { const p = this.player, [dx, dy] = DIRS[p.dir]; return [p.x + dx, p.y + dy]; }

    // ---------- update ----------
    update() {
      this.t++;
      const p = this.player;
      if (this.popup && --this.popup.t <= 0) this.popup = null;
      this.updateNpcs();
      if (p.moving) { this.stepEntity(p, this.speed()); if (!p.moving) this.afterStep(); this.updateCam(); return; }
      if (this.busy) return;
      const I = G.input;
      if (I.pressed('start')) { this.run(() => G.openStartMenu()); return; }
      if (I.pressed('a')) { this.run(() => this.interact()); return; }
      const d = I.dir();
      if (d) {
        if (p.dir !== d && I.held(d) < 6 && !this.wasWalking) { p.dir = d; this.turnT = 6; return; }
        if (this.turnT > 0) { this.turnT--; if (I.held(d) < 6) return; }
        p.dir = d; this.tryMove(d);
        this.wasWalking = p.moving;
      } else this.wasWalking = false;
      this.updateCam();
    }
    speed() { if (G.S.bike) return 4; return G.input.down('run') && !this.map.indoor ? 2 : (G.input.down('run') ? 2 : 1); }
    stepEntity(e, sp) {
      e.prog += sp;
      if (e.hop) { e.hopT = (e.hopT || 0) + sp; }
      if (e.prog >= T) {
        e.moving = false; e.prog = 0;
        if (e.hopRemain) { e.hopRemain--; e.x += DIRS[e.dir][0]; e.y += DIRS[e.dir][1]; e.moving = true; e.prog = 0; }
        else { e.hop = 0; e.hopT = 0; }
      }
      e.frame = e.moving ? (e.stepN % 2 ? (e.prog < 8 ? 1 : 0) : (e.prog < 8 ? 3 : 0)) : 0;
    }
    tryMove(d) {
      const p = this.player, [dx, dy] = DIRS[d]; const nx = p.x + dx, ny = p.y + dy;
      const m = this.map;
      // edge exits
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) {
        const side = ny < 0 ? 'n' : ny >= m.h ? 's' : nx < 0 ? 'w' : 'e';
        const ex = m.exits && m.exits[side];
        if (ex && G.cond(ex.cond)) { this.edgeExit(side, ex); return; }
        this.bump(); return;
      }
      const t = this.tile(nx, ny);
      if (t === 'L' && d === 'down' && !this.solid(nx, ny + 1, p)) { // ledge hop
        p.moving = true; p.prog = 0; p.x = nx; p.y = ny; p.hop = 1; p.hopRemain = 1; p.stepN++; G.audio.sfx('ledge');
        return;
      }
      if (t === 'L') { this.bump(); return; }
      const door = m.doors.find((o) => o.x === nx && o.y === ny);
      if (door && d === 'up') { this.run(() => this.useDoor(door)); return; }
      if (this.solid(nx, ny, p)) { this.bump(); return; }
      p.moving = true; p.prog = 0; p.x = nx; p.y = ny; p.stepN++;
    }
    bump() { if (this.bumpT && this.t - this.bumpT < 20) return; this.bumpT = this.t; G.audio.sfx('bump'); }
    async useDoor(door) {
      if (door.lock && !G.cond(door.lock.cond)) { await G.say(door.lock.text); return; }
      await this.warp(door.to, door.tx, door.ty, 'up');
    }
    async edgeExit(side, ex) {
      const p = this.player; const tgt = build(G.MAPS[ex.to]);
      let x = p.x, y = p.y;
      if (side === 'n') { x = p.x + (ex.d || 0); y = tgt.h - 1; }
      if (side === 's') { x = p.x + (ex.d || 0); y = 0; }
      if (side === 'w') { x = tgt.w - 1; y = p.y + (ex.d || 0); }
      if (side === 'e') { x = 0; y = p.y + (ex.d || 0); }
      await this.run(() => this.warp(ex.to, x, y, p.dir, { fast: true, noSfx: true }));
    }
    afterStep() {
      const p = this.player; G.S.x = p.x; G.S.y = p.y; G.S.dir = p.dir; G.S.steps++;
      if (G.S.daycare) G.daycareStep();
      if (G.S.repel > 0) { G.S.repel--; if (G.S.repel === 0) this.run(() => G.say('The repel\'s effect wore off...')); }
      const m = this.map;
      // warps
      const w = (m.warps || []).find((o) => o.x === p.x && o.y === p.y && G.cond(o.cond));
      if (w) { this.run(() => this.warp(w.to, w.tx, w.ty, w.dir || p.dir)); return; }
      // triggers
      const tr = (m.triggers || []).find((o) => p.x >= o.x && p.x < o.x + (o.w || 1) && p.y >= o.y && p.y < o.y + (o.h || 1) && G.cond(o.cond));
      if (tr) { this.run(tr.run); return; }
      // trainers
      for (const n of this.npcs) if (this.seesPlayer(n)) { this.run(() => this.trainerSpotted(n)); return; }
      // encounters
      const t = this.tile(p.x, p.y);
      const grass = G.TILEDEF[t] && G.TILEDEF[t].grass;
      if (m.wild && (grass && m.wild.grass || (m.cave && m.wild.cave && t === (m.encTile || 'c')))) {
        const tab = grass ? m.wild.grass : m.wild.cave;
        const rate = tab.rate || 10;
        if (Math.random() * 100 < rate) { this.run(() => this.wildEncounter(tab, grass ? m.bg || 'grass' : 'cave')); }
      }
    }
    pickWild(tab) {
      const night = isNight();
      const list = tab.list.filter((e) => (!e[4] || (e[4] === 'night' ? night : !night))).map((e) => ({ sp: e[0], lo: e[1], hi: e[2], w: e[3] }));
      const e = G.weighted(list);
      return { sp: e.sp, lv: G.ri(e.lo, e.hi) };
    }
    async wildEncounter(tab, bg) {
      const { sp, lv } = this.pickWild(tab);
      const lead = G.S.party.find((m) => m.hp > 0);
      if (G.S.repel > 0 && lead && lv < lead.lv) return;
      if (!lead) return;
      const mon = G.makeMon(sp, lv, { met: this.map.name });
      await this.doBattle({ wild: mon, bg });
    }
    async doBattle(cfg) {
      const r = await G.startBattle(cfg);
      if (r === 'lose' && !cfg.noWhiteout) { await this.whiteout(); return r; }
      if (r === 'lose') G.healParty();
      this.resume();
      await G.fadeIn(14);
      return r;
    }
    async whiteout() {
      G.fade = 1;
      const h = G.S.heal;
      this.load(h.map, h.x, h.y, 'down');
      G.healParty(); G.S.bike = false;
      await G.wait(20);
      await G.fadeIn(20);
      if (h.map === 'home') await G.say('Mom: You\'re back! You look exhausted... Rest up, sweetie. There, all better!');
      else await G.say('Nurse: Your creatures have been restored to full health. Please be more careful out there!');
    }

    // ---------- trainers ----------
    seesPlayer(n) {
      const tr = n.def.trainer; if (!tr || G.hasFlag('beat_' + tr.id) || n.def.noSight) return false;
      const p = this.player, [dx, dy] = DIRS[n.dir], range = n.def.sight || 4;
      for (let k = 1; k <= range; k++) {
        const x = n.x + dx * k, y = n.y + dy * k;
        if (x === p.x && y === p.y) return true;
        const t = this.tile(x, y); if (t == null || (G.TILEDEF[t] && G.TILEDEF[t].solid) || this.map.bmask[y][x] || this.npcAt(x, y)) return false;
      }
      return false;
    }
    async trainerSpotted(n) {
      const p = this.player; const tr = n.def.trainer;
      G.audio.play(tr.boss ? 'boss' : 'trainer');
      G.audio.sfx('alert');
      this.emote = { npc: n, t: 40 }; await G.wait(40); this.emote = null;
      // walk to the player
      while (Math.abs(n.x - p.x) + Math.abs(n.y - p.y) > 1) await this.npcStep(n, n.dir);
      p.dir = OPP[n.dir];
      await this.trainerBattle(n);
    }
    async trainerBattle(n) {
      const tr = n.def.trainer;
      if (tr.intro) await G.sayAll([].concat(tr.intro).map((s) => (tr.speaker ? tr.speaker + ': ' : '') + s));
      const r = await this.doBattle({ trainer: Object.assign({}, tr), bg: tr.bg || this.map.bg || 'grass' });
      if (r === 'win') { G.setFlag('beat_' + tr.id); if (tr.onWin) await tr.onWin(n); }
      return r;
    }

    // ---------- npcs ----------
    updateNpcs() {
      for (const n of this.npcs) {
        if (n.moving) { this.stepEntity(n, n.speed || 1); continue; }
        if (this.busy || n.def.move === 'still' || !n.def.move) continue;
        if (--n.wt > 0) continue;
        n.wt = G.ri(70, 200);
        if (n.def.move === 'turn') { n.dir = G.pick(['up', 'down', 'left', 'right']); continue; }
        if (n.def.move === 'wander') {
          const d = G.pick(['up', 'down', 'left', 'right']); const [dx, dy] = DIRS[d];
          const nx = n.x + dx, ny = n.y + dy;
          n.dir = d;
          if (Math.abs(nx - n.home[0]) > 2 || Math.abs(ny - n.home[1]) > 2) continue;
          const t = this.tile(nx, ny);
          if (this.solid(nx, ny, n) || (G.TILEDEF[t] && (G.TILEDEF[t].ledge || G.TILEDEF[t].grass))) continue;
          n.x = nx; n.y = ny; n.moving = true; n.prog = 0; n.stepN++;
        }
      }
    }
    // script helper: one step, waits until done
    async npcStep(n, d, force) {
      const [dx, dy] = DIRS[d]; n.dir = d;
      if (!force && this.solid(n.x + dx, n.y + dy, n)) { await G.wait(8); return false; }
      n.x += dx; n.y += dy; n.moving = true; n.prog = 0; n.stepN++;
      while (n.moving) await G.wait(1);
      return true;
    }
    async npcWalk(n, path, force) { for (const ch of path) { const d = { u: 'up', d: 'down', l: 'left', r: 'right' }[ch]; if (d) await this.npcStep(n, d, force); } }
    async playerWalk(path) {
      const p = this.player;
      for (const ch of path) {
        const d = { u: 'up', d: 'down', l: 'left', r: 'right' }[ch]; if (!d) continue;
        p.dir = d; p.x += DIRS[d][0]; p.y += DIRS[d][1]; p.moving = true; p.prog = 0; p.stepN++;
        while (p.moving) { await G.wait(1); }
        G.S.x = p.x; G.S.y = p.y;
      }
      G.S.dir = p.dir;
    }
    npc(id) { return this.npcs.find((n) => n.def.id === id); }
    addNpc(def, x, y, dir) { const e = new Entity(x, y, dir || 'down', def.look); e.def = def; e.home = [x, y]; e.wt = 999999; this.npcs.push(e); return e; }
    removeNpc(n) { const i = this.npcs.indexOf(n); if (i >= 0) this.npcs.splice(i, 1); }
    facePlayer(n) {
      const p = this.player; const dx = p.x - n.x, dy = p.y - n.y;
      n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }

    // ---------- interaction ----------
    async interact() {
      const [fx, fy] = this.front(); const m = this.map;
      let n = this.npcAt(fx, fy);
      // talk across counters
      if (!n && this.tile(fx, fy) === 'k') { const [dx, dy] = DIRS[this.player.dir]; n = this.npcAt(fx + dx, fy + dy); }
      if (n) {
        if (!n.def.noFace) this.facePlayer(n);
        const d = n.def;
        if (d.trainer && !G.hasFlag('beat_' + d.trainer.id)) { await this.trainerBattle(n); return; }
        const talk = d.trainer && G.hasFlag('beat_' + d.trainer.id) && d.trainer.after ? d.trainer.after : d.talk;
        if (typeof talk === 'function') await talk(n);
        else if (talk) await G.sayAll([].concat(talk).map((s) => (d.speaker ? d.speaker + ': ' : '') + s));
        return;
      }
      const it = this.itemAt(fx, fy) || (this.itemAt(this.player.x, this.player.y));
      if (it) { await this.pickItem(it); return; }
      const sign = (m.signs || []).find((s) => s.x === fx && s.y === fy);
      if (sign) { await G.sayAll([].concat(typeof sign.text === 'function' ? sign.text() : sign.text)); return; }
      const t = this.tile(fx, fy);
      if (t === 'P') { await G.usePC(); return; }
      if (t === 'b') { await G.say(G.pick(['It\'s crammed with books about wild creatures.', 'A book titled "Orbs and You: A Beginner\'s Guide."', 'A book about the legend of the summit guardian...'])); return; }
      if (t === 'V') { await G.say('A show about a trainer exploring the world is on TV. Looks fun!'); return; }
      if (t === 'Z') { await G.say('A statue of the region\'s Champion. "Strength, kindness, and courage."'); return; }
      if (t === '~') {
        const rod = G.hasItem('goodrod') ? 2 : G.hasItem('oldrod') ? 1 : 0;
        if (rod) { if (await G.ask('The water is deep blue. Want to fish here?')) await this.fish(rod); }
        else await G.say('The water is deep blue...');
        return;
      }
      if (m.interact) { const r = m.interact(fx, fy, t); if (r) await r; }
    }
    async pickItem(it) {
      const item = G.ITEMS[it.item];
      G.setFlag('item_' + this.mapId + '_' + it.idx);
      this.items.splice(this.items.indexOf(it), 1);
      G.giveItem(it.item, it.n || 1);
      G.audio.sfx('item');
      await G.say('Picked up ' + (it.n > 1 ? it.n + ' ' + G.plural(item.name) : item.name) + '!');
      await G.say('It went into the ' + G.POCKETS.find((p) => p.id === item.pocket).name + ' pocket.');
    }
    async fish(rod) {
      const [fx, fy] = this.front();
      if (this.tile(fx, fy) !== '~') { await G.say('There\'s no water to fish in here.'); return; }
      const tab = this.map.wild && (rod >= 2 && this.map.wild.fish2 ? this.map.wild.fish2 : this.map.wild.fish1);
      this.fishing = { t: 0 };
      await G.say('You cast your line...', { auto: 20 });
      const dots = G.ri(1, 4);
      for (let i = 0; i < dots; i++) await G.say('. . .', { auto: 20 });
      if (!tab || Math.random() < 0.25) { this.fishing = null; await G.say('Not even a nibble...'); return; }
      G.audio.sfx('alert');
      await G.say('Oh! A bite!', { auto: 30 });
      this.fishing = null;
      const { sp, lv } = this.pickWild(tab);
      await this.doBattle({ wild: G.makeMon(sp, lv, { met: this.map.name }), bg: 'water' });
    }
    async flyTo(town) {
      const f = G.FLY[town]; if (!f) return;
      G.S.bike = false;
      await G.say('The sky creature swept ' + G.S.name + ' up into the air!', { auto: 40 });
      G.audio.sfx('whoosh');
      await this.warp(f.map, f.x, f.y, 'down', { noSfx: true });
    }
    async escapeRope() {
      const h = G.S.heal;
      await this.warp(h.map, h.x, h.y, 'down');
    }

    // ---------- drawing ----------
    updateCam() {
      const p = this.player, m = this.map; if (!m) return;
      let cx = p.px - 152, cy = p.py - 112;
      cx = m.w * T > 320 ? G.clamp(cx, 0, m.w * T - 320) : (m.w * T - 320) / 2;
      cy = m.h * T > 240 ? G.clamp(cy, 0, m.h * T - 240) : (m.h * T - 240) / 2;
      this.cam.x = Math.round(cx); this.cam.y = Math.round(cy);
    }
    draw(c) {
      const m = this.map; if (!m) return;
      const cx = this.cam.x, cy = this.cam.y;
      c.fillStyle = m.indoor ? '#000' : '#285028'; c.fillRect(0, 0, 320, 240);
      const x0 = Math.floor(cx / T), y0 = Math.floor(cy / T);
      const border = m.border || (m.indoor ? 'x' : 'T');
      for (let y = y0; y <= y0 + 15; y++) for (let x = x0; x <= x0 + 20; x++) {
        let t = this.tile(x, y); if (t == null) t = border;
        G.drawTile(c, t, x * T - cx, y * T - cy, x, y);
      }
      for (const b of m.buildings || []) c.drawImage(G.buildingSprite(b.kind), b.x * T - cx, b.y * T - cy);
      for (const it of this.items) if (!it.hidden) c.drawImage(G.orbSprite('bindorb', 12), it.x * T - cx + 2, it.y * T - cy + 2);
      if (m.decor) m.decor(c, cx, cy);
      // entities sorted by y
      const ents = this.npcs.concat([this.player]).sort((a, b) => a.py - b.py);
      for (const e of ents) this.drawEntity(c, e, cx, cy);
      if (this.emote) {
        const n = this.emote.npc; const x = n.px - cx + 4, y = n.py - cy - 18;
        G.rrect(x - 1, y - 1, 10, 13, '#28202c'); G.rrect(x, y, 8, 11, '#ffffff');
        c.fillStyle = '#e03030'; c.fillRect(x + 3, y + 2, 2, 5); c.fillRect(x + 3, y + 8, 2, 2);
      }
      if (this.fishing) { const [fx, fy] = this.front(); c.fillStyle = '#ffffff'; c.fillRect(fx * T - cx + 7, fy * T - cy + 7 + Math.sin(this.t / 6) * 1.5, 2, 2); }
      // day / night tint outdoors
      if (!m.indoor && !m.cave) {
        const h = new Date().getHours();
        if (h >= 19 || h < 6) { c.fillStyle = 'rgba(20,24,72,0.32)'; c.fillRect(0, 0, 320, 240); }
        else if (h >= 17) { c.fillStyle = 'rgba(240,120,40,0.12)'; c.fillRect(0, 0, 320, 240); }
      }
      if (m.cave && m.dark) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 0, 320, 240); }
      if (this.popup) {
        const t = this.popup.t, y = t > 130 ? -30 + (150 - t) * 1.6 : t < 20 ? -30 + t * 1.6 : 2;
        const w = Math.max(110, G.textW(this.popup.text) + 24);
        G.box(4, y, w, 26); G.text(this.popup.text, 4 + w / 2, y + 9, '#383838', { align: 'center' });
      }
    }
    drawEntity(c, e, cx, cy) {
      const x = Math.round(e.px - cx), y0 = Math.round(e.py - cy);
      let hopY = 0;
      if (e.hop) { const t = ((e.hopRemain ? 0 : T) + e.prog) / (2 * T); hopY = -Math.sin(t * Math.PI) * 10; }
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(x + 8, y0 + 14, 6, 2.5, 0, 0, Math.PI * 2); c.fill();
      if (e.def && e.def.mon) { // a creature standing in the overworld
        const ic = G.creatureIcon(e.def.mon); c.drawImage(ic, x - 8, y0 - 18 + Math.sin(this.t / 18) * 2); return;
      }
      const spr = G.personSprite(e.look, e.dir, e.moving ? e.frame : 0);
      c.drawImage(spr, x, y0 - 4 + hopY);
      if (e === this.player && G.S.bike) { c.fillStyle = '#28202c'; c.fillRect(x + 2, y0 + 12, 12, 2); c.fillStyle = '#d83838'; c.fillRect(x + 4, y0 + 10, 8, 2); }
      // tall grass over feet
      const tx = Math.round(e.px / T), ty = Math.round(e.py / T);
      const t = this.tile(tx, ty);
      if (t && G.TILEDEF[t] && G.TILEDEF[t].grass && !e.hop) c.drawImage(G.grassOverlay(t), tx * T - cx, ty * T - cy + 8);
    }
  }
  G.World = World;
})();
