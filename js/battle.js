'use strict';
// Turn-based battle engine + battle scene, catching, experience, level-ups, move learning, evolution.
(function () {
  const W = 320;
  const STAT_KEYS = ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva'];
  const STATUS_TAG = { brn: ['BRN', '#e07040'], par: ['NUM', '#d8b828'], psn: ['PSN', '#a050b0'], slp: ['SLP', '#8c8c9c'], frz: ['ICE', '#58b8d8'] };
  G.STATUS_TAG = STATUS_TAG;

  // ---------- battle menus ----------
  class ActionMenu {
    constructor(b) { this.overlay = true; this.b = b; this.i = b.lastAction || 0; }
    update() {
      const I = G.input; let i = this.i;
      if (I.pressed('up') || I.pressed('down')) i ^= 2;
      if (I.pressed('left') || I.pressed('right')) i ^= 1;
      if (i !== this.i) { this.i = i; G.audio.sfx('move'); }
      if (I.pressed('a')) { G.audio.sfx('select'); this.b.lastAction = this.i; G.pop(this, this.i); }
    }
    draw() {
      G.box(4, 178, 312, 58, 'battle');
      G.text('What will', 16, 192); G.text(G.monName(this.b.P.mon) + ' do?', 16, 210);
      G.box(170, 178, 146, 58);
      const L = ['FIGHT', 'BAG', 'TEAM', 'RUN'];
      L.forEach((s, k) => G.text(s, 190 + (k % 2) * 64, 194 + (k >> 1) * 20));
      G.cursor(180 + (this.i % 2) * 64, 194 + (this.i >> 1) * 20);
    }
  }
  class MoveMenu {
    constructor(b) { this.overlay = true; this.b = b; this.i = b.lastMove || 0; if (this.i >= b.P.mon.moves.length) this.i = 0; }
    update() {
      const I = G.input, n = this.b.P.mon.moves.length; let i = this.i;
      if (I.pressed('up') || I.pressed('down')) i ^= 2;
      if (I.pressed('left') || I.pressed('right')) i ^= 1;
      if (i < n && i !== this.i) { this.i = i; G.audio.sfx('move'); }
      if (I.pressed('a')) {
        const mv = this.b.P.mon.moves[this.i];
        if (mv.pp <= 0) { G.audio.sfx('bump'); this.noPP = 60; return; }
        G.audio.sfx('select'); this.b.lastMove = this.i; G.pop(this, this.i);
      } else if (I.pressed('b')) { G.audio.sfx('back'); G.pop(this, -1); }
      if (this.noPP) this.noPP--;
    }
    draw() {
      const mon = this.b.P.mon;
      G.box(4, 178, 208, 58, 'white');
      mon.moves.forEach((mv, k) => G.text(G.MOVES[mv.id].name.slice(0, 10), 22 + (k % 2) * 94, 192 + (k >> 1) * 20, mv.pp ? '#383838' : '#b03030'));
      G.cursor(12 + (this.i % 2) * 94, 192 + (this.i >> 1) * 20);
      G.box(212, 178, 104, 58, 'white');
      const mv = mon.moves[this.i], m = G.MOVES[mv.id];
      if (this.noPP) { G.text('No EN', 222, 192, '#b03030'); G.text('left!', 222, 208, '#b03030'); return; }
      G.text('EN', 222, 190); G.text(mv.pp + '/' + m.pp, 304, 190, mv.pp ? '#383838' : '#b03030', { align: 'right' });
      G.typeBadge(m.type, 222, 204);
      const eff = G.typeEff(m.type, G.SPECIES[this.b.E.mon.sp].types);
      if (m.cat !== 'st' && G.S.dex.caught[this.b.E.mon.sp]) {
        const t = eff === 0 ? 'NONE' : eff > 1 ? 'GOOD' : eff < 1 ? 'WEAK' : '';
        if (t) G.text(t, 270, 207, eff > 1 ? '#c03030' : '#6c6c6c', { size: 7 });
      }
      G.text(m.cat === 'ph' ? 'PHYS' : m.cat === 'sp' ? 'SPEC' : 'STAT', 222, 220, '#6c6c7c', { size: 7 });
      G.text(m.pow > 1 ? 'P' + m.pow : '', 304, 220, '#6c6c7c', { size: 7, align: 'right' });
    }
  }

  // ---------- level-up stat panel ----------
  class StatPanel {
    constructor(before, after) { this.overlay = true; this.b = before; this.a = after; this.stage = 0; }
    update() { if (G.input.pressed('a') || G.input.pressed('b')) { G.audio.sfx('blip'); if (this.stage === 0) this.stage = 1; else G.pop(this); } }
    draw() {
      G.box(176, 66, 140, 108);
      const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
      keys.forEach((k, i) => {
        G.text(G.STAT_NAMES[k], 186, 78 + i * 15, '#383838', { size: 7 });
        const v = this.stage === 0 ? '+' + (this.a[k] - this.b[k]) : String(this.a[k]);
        G.text(v, 306, 78 + i * 15, '#383838', { align: 'right' });
      });
    }
  }

  // ---------- the battle ----------
  class Battle {
    constructor(cfg) {
      this.cfg = cfg; this.wild = !!cfg.wild; this.trainer = cfg.trainer || null;
      this.bg = cfg.bg || 'grass';
      const mk = (id, party) => ({ id, party, mon: null, stages: {}, vol: {}, spr: { ox: 0, oy: 0, vis: false, white: 0, scale: 1, sink: 0, blink: 0 }, hud: { hp: 0, exp: 0, show: false } });
      this.P = mk(0, G.S.party);
      this.E = mk(1, this.wild ? [cfg.wild] : this.trainer.mons);
      this.turn = 0; this.runs = 0; this.parts = new Set(); this.leveled = new Set();
      this.fx = []; this.shake = 0; this.t = 0; this.intro = 0;
      this.trSpr = { p: 0, e: this.trainer ? 1 : 0, pox: 0, eox: 0 };
      this.orb = null; this.enemyItems = this.trainer && this.trainer.items ? this.trainer.items.slice() : [];
    }
    other(s) { return s === this.P ? this.E : this.P; }
    sideName(s) { return s === this.P ? G.monName(s.mon) : (this.wild ? 'Wild ' : 'Foe ') + G.monName(s.mon); }
    say(t, o = {}) { return G.say(t, Object.assign({ style: 'battle', auto: 50 }, o)); }
    sayWait(t) { return G.say(t, { style: 'battle' }); }

    update() {
      this.t++;
      for (const p of this.fx) { p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.life--; }
      this.fx = this.fx.filter((p) => p.life > 0);
      if (this.shake > 0) this.shake--;
      for (const s of [this.P, this.E]) if (s.mon && s.hud.show) {
        const tgt = s.mon.hp, max = G.maxHp(s.mon);
        if (Math.abs(s.hud.hp - tgt) > 0.01) { const step = Math.max(0.25, max / 60); s.hud.hp += Math.sign(tgt - s.hud.hp) * Math.min(step, Math.abs(tgt - s.hud.hp)); }
      }
    }
    // wait until HP bars finished animating
    async settle() { let n = 0; while ([this.P, this.E].some((s) => s.mon && Math.abs(s.hud.hp - s.mon.hp) > 0.01) && n++ < 240) await G.wait(1); }

    // ---------- drawing ----------
    draw(c) {
      const sx = this.shake ? (Math.random() * 4 - 2) | 0 : 0, sy = this.shake ? (Math.random() * 3 - 1.5) | 0 : 0;
      c.save(); c.translate(sx, sy);
      drawBackground(c, this.bg, this.t);
      const slide = this.introSlide != null ? this.introSlide : 0;
      // platforms
      const plat = PLAT[this.bg] || PLAT.grass;
      c.fillStyle = plat[0]; ell(c, 232 - slide * 260, 108, 62, 13); c.fillStyle = plat[1]; ell(c, 232 - slide * 260, 106, 56, 10);
      c.fillStyle = plat[0]; ell(c, 84 + slide * 260, 174, 72, 14); c.fillStyle = plat[1]; ell(c, 84 + slide * 260, 172, 66, 11);
      // enemy side
      if (this.trSpr.e) { const pr = G.portrait(this.trainer.look, 3); c.drawImage(pr, 208 + this.trSpr.eox - slide * 260, 106 - pr.height + 4); }
      this.drawMon(c, this.E, 200 - slide * 260, 48, false);
      // player side
      if (this.trSpr.p) { const pr = G.portrait(Object.assign({}, G.S.look), 4); const back = G.personSprite(G.S.look, 'up', 0); c.drawImage(back, 52 + this.trSpr.pox + slide * 260, 110, 64, 68); }
      this.drawMon(c, this.P, 44 + slide * 260, 98, true);
      // particles
      for (const p of this.fx) drawParticle(c, p);
      // orb
      if (this.orb) { const o = this.orb; c.save(); c.translate(o.x, o.y); c.rotate(o.rot || 0); c.drawImage(G.orbSprite(o.id, 12), -6, -6); c.restore(); if (o.stars) for (let i = 0; i < 3; i++) { const a = this.t / 8 + i * 2.1; c.fillStyle = '#f8e070'; c.fillRect(o.x + Math.cos(a) * 12 - 1, o.y - 8 + Math.sin(a) * 5 - 1, 3, 3); } }
      // huds
      if (this.E.hud.show && this.E.mon) this.drawEnemyHud(c);
      if (this.P.hud.show && this.P.mon) this.drawPlayerHud(c);
      c.restore();
      G.box(0, 176, W, 64, 'dark');
      if (this.trainer && this.showBalls) this.drawPartyBalls(c);
    }
    drawMon(c, s, x, y, back) {
      if (!s.mon || !s.spr.vis) return;
      const r = s.spr; if (r.blink && Math.floor(this.t / 3) % 2) return;
      const img = G.creatureSprite(s.mon.sp, s.mon.shiny, back);
      const w = img.width * r.scale, h = img.height * r.scale;
      const dx = x + r.ox + (img.width - w) / 2, dy = y + r.oy + (img.height - h) + r.sink;
      c.save();
      if (r.sink > 0) { c.beginPath(); c.rect(x - 10, y - 20, img.width + 20, img.height + 20); c.clip(); }
      // ghost-type float bob
      const bob = G.SPECIES[s.mon.sp].art.plan === 'ghost' || G.SPECIES[s.mon.sp].ab.includes('levitate') ? Math.sin(this.t / 20) * 2 : 0;
      c.globalAlpha = r.alpha != null ? r.alpha : 1;
      c.drawImage(img, dx, dy + bob, w, h);
      if (r.white > 0) { c.globalAlpha = r.white; c.drawImage(G.silhouette(img), dx, dy + bob, w, h); }
      if (r.tint) { c.globalAlpha = 0.45; c.drawImage(G.silhouette(img, r.tint), dx, dy + bob, w, h); }
      c.restore();
    }
    drawEnemyHud(c) {
      const s = this.E, m = s.mon, x = 10, y = 14;
      G.box(x, y, 140, 38, 'white');
      G.text(G.monName(m), x + 8, y + 7);
      G.text('Lv' + m.lv, x + 132, y + 7, '#383838', { align: 'right' });
      if (m.shiny) G.text('*', x + 92, y + 7, '#e0a020');
      G.text('HP', x + 26, y + 22, '#e0a030', { size: 7 });
      const max = G.maxHp(m), f = s.hud.hp / max;
      G.bar(x + 44, y + 23, 88, 5, f, G.hpColor(f));
      if (m.status) { const [t, col] = STATUS_TAG[m.status]; G.rrect(x + 4, y + 21, 22, 9, col); G.text(t, x + 15, y + 22, '#fff', { size: 6, align: 'center', shadow: false }); }
      if (this.wild && G.S.dex.caught[m.sp]) c.drawImage(G.orbSprite('bindorb', 8), x + 116, y + 7 + 11);
    }
    drawPlayerHud(c) {
      const s = this.P, m = s.mon, x = 172, y = 118;
      G.box(x, y, 142, 54, 'white');
      G.text(G.monName(m), x + 10, y + 7);
      G.text('Lv' + m.lv, x + 134, y + 7, '#383838', { align: 'right' });
      if (m.shiny) G.text('*', x + 94, y + 7, '#e0a020');
      G.text('HP', x + 28, y + 21, '#e0a030', { size: 7 });
      const max = G.maxHp(m), f = s.hud.hp / max;
      G.bar(x + 46, y + 22, 88, 5, f, G.hpColor(f));
      G.text(Math.ceil(s.hud.hp) + '/' + max, x + 134, y + 31, '#383838', { align: 'right' });
      if (m.status) { const [t, col] = STATUS_TAG[m.status]; G.rrect(x + 6, y + 20, 22, 9, col); G.text(t, x + 17, y + 21, '#fff', { size: 6, align: 'center', shadow: false }); }
      G.bar(x + 30, y + 45, 104, 2, s.hud.exp, '#48a8f0', '#d0d8d0');
      G.text('EXP', x + 8, y + 42, '#4878c0', { size: 6, shadow: false });
    }
    drawPartyBalls(c) {
      const list = this.E.party;
      for (let i = 0; i < 6; i++) {
        const m = list[i]; const x = 160 + i * 10, y = 4;
        if (!m) { c.globalAlpha = 0.3; c.drawImage(G.orbSprite('bindorb', 8), x, y); c.globalAlpha = 1; continue; }
        c.globalAlpha = m.hp > 0 ? 1 : 0.35; c.drawImage(G.orbSprite('bindorb', 8), x, y); c.globalAlpha = 1;
      }
    }

    // ---------- effects ----------
    burst(side, type, big) {
      const tx = side === this.E ? 232 : 84, ty = side === this.E ? 80 : 140;
      const T = G.TYPES[type] || G.TYPES.Normal; const n = big ? 26 : 16;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 2.5;
        const p = { x: tx + (Math.random() - 0.5) * 20, y: ty + (Math.random() - 0.5) * 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 18 + G.ri(0, 14), col: Math.random() < 0.5 ? T.color : '#ffffff', size: G.ri(2, 4), shape: 'sq' };
        if (type === 'Fire') { p.vy = -Math.random() * 2.5 - 0.5; p.col = G.pick(['#f8d040', '#f07828', '#f84818']); }
        if (type === 'Water' || type === 'Toxic') { p.shape = 'ring'; p.col = type === 'Water' ? G.pick(['#78b8f8', '#c8e8ff']) : G.pick(['#a050b0', '#d080e0']); }
        if (type === 'Plant' || type === 'Bug') { p.shape = 'leaf'; p.col = G.pick(['#58b848', '#98e070', '#3c8c30']); }
        if (type === 'Spark') { p.shape = 'bolt'; p.col = G.pick(['#f8e040', '#ffffff']); }
        if (type === 'Ice') { p.shape = 'shard'; p.col = G.pick(['#a8f0ff', '#ffffff', '#58b8d8']); }
        if (type === 'Earth' || type === 'Stone') { p.y = ty - 40 - Math.random() * 20; p.vy = 2 + Math.random() * 2; p.vx *= 0.3; p.col = type === 'Earth' ? G.pick(['#b89048', '#8c6c34']) : G.pick(['#9c9488', '#6c6458']); p.size = G.ri(3, 5); }
        if (type === 'Mind') { p.shape = 'ring'; p.col = G.pick(['#f05888', '#f8a8c8']); }
        if (type === 'Spirit' || type === 'Drake') { p.vy = -Math.random() * 1.5; p.col = type === 'Spirit' ? G.pick(['#7058a0', '#b8a0e8']) : G.pick(['#7038f8', '#a888ff', '#58b8f8']); }
        if (type === 'Wind') { p.shape = 'line'; p.col = '#ffffff'; }
        this.fx.push(p);
      }
      if (big || type === 'Earth') this.shake = 14;
    }
    sparkle(side, up = true) {
      const tx = side === this.E ? 232 : 84, ty = side === this.E ? 84 : 145;
      for (let i = 0; i < 12; i++) this.fx.push({ x: tx + (Math.random() - 0.5) * 50, y: ty + (Math.random() - 0.5) * 30, vx: 0, vy: up ? -1.2 : 1.2, life: 26, col: up ? '#f8f0a0' : '#88a8f8', size: 2, shape: 'sq' });
    }
    shinyFx(side) {
      const tx = side === this.E ? 232 : 84, ty = side === this.E ? 76 : 136;
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; this.fx.push({ x: tx, y: ty, vx: Math.cos(a) * 1.8, vy: Math.sin(a) * 1.8, life: 30, col: G.pick(['#f8f0a0', '#ffffff', '#f8d040']), size: 3, shape: 'star' }); }
      G.audio.sfx('shiny');
    }
    async lunge(side) {
      if (!G.S.options.anims) return;
      const d = side === this.P ? 1 : -1;
      await G.tween(5, (t) => { side.spr.ox = d * 12 * t; side.spr.oy = -d * 4 * t; });
      await G.tween(6, (t) => { side.spr.ox = d * 12 * (1 - t); side.spr.oy = -d * 4 * (1 - t); });
    }
    async blink(side, n = 18) { side.spr.blink = 1; await G.wait(n); side.spr.blink = 0; }
    async sendOut(side, idx, first) {
      const mon = side.party[idx];
      if (side === this.P) { // move it to the front of the party
        if (idx !== 0 && !first) { /* keep party order; track active by reference */ }
      }
      side.mon = mon; side.stages = {}; side.vol = {}; side.idx = idx;
      for (const k of STAT_KEYS) side.stages[k] = 0;
      side.hud.hp = mon.hp; side.hud.exp = side === this.P ? G.expFrac(mon) : 0;
      G.dexSee(mon.sp);
      // orb pop
      const x = side === this.E ? 232 : 84, y = side === this.E ? 82 : 140;
      G.audio.sfx('pop');
      side.spr.vis = true; side.spr.white = 1; side.spr.scale = 0.2; side.spr.sink = 0; side.spr.ox = 0; side.spr.oy = 0; side.spr.alpha = 1;
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; this.fx.push({ x, y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, life: 14, col: '#ffffff', size: 2, shape: 'sq' }); }
      await G.tween(12, (t) => { side.spr.scale = 0.2 + 0.8 * t; });
      await G.tween(8, (t) => { side.spr.white = 1 - t; });
      G.audio.cry(mon.sp);
      side.hud.show = true;
      if (mon.shiny) { this.shinyFx(side); await G.wait(30); }
      if (side === this.P) { this.parts.add(mon.uid); }
      await this.onEntry(side);
    }
    async withdraw(side) {
      await G.tween(10, (t) => { side.spr.white = t; side.spr.scale = 1 - 0.8 * t; });
      side.spr.vis = false; side.spr.white = 0; side.spr.scale = 1; side.hud.show = false;
    }
    async onEntry(side) {
      const foe = this.other(side);
      if (side.mon.ability === 'menace' && foe.mon && foe.mon.hp > 0) {
        await this.say(this.sideName(side) + '\'s Menace!');
        await this.changeStat(foe, 'atk', -1, side);
      }
    }

    // ---------- stats & damage ----------
    stat(side, s, crit) {
      let v = G.stats(side.mon)[s]; let st = side.stages[s] || 0;
      if (crit) { if (side === this.critAtt && st < 0) st = 0; if (side !== this.critAtt && st > 0) st = 0; }
      v *= st >= 0 ? (2 + st) / 2 : 2 / (2 - st);
      if (s === 'spe' && side.mon.status === 'par') v *= 0.5;
      if (s === 'spd' && side.mon.ability === 'pressure') v *= 1.2;
      return Math.max(1, v);
    }
    calcDamage(att, def, move, crit) {
      const A = att.mon, D = def.mon, types = G.SPECIES[D.sp].types;
      if (move.fx.fixed) return { dmg: move.fx.fixed === 'level' ? A.lv : move.fx.fixed, eff: G.typeEff(move.type, types) === 0 ? 0 : 1 };
      let eff = G.typeEff(move.type, types);
      if (move.type === 'Earth' && D.ability === 'levitate') eff = 0;
      if (eff === 0) return { dmg: 0, eff };
      const phys = move.cat === 'ph';
      this.critAtt = att;
      let a = this.stat(att, phys ? 'atk' : 'spa', crit), d = this.stat(def, phys ? 'def' : 'spd', crit);
      let pow = move.pow;
      const pinch = { verdant: 'Plant', blaze: 'Fire', torrent: 'Water', swarm: 'Bug' }[A.ability];
      if (pinch === move.type && A.hp <= G.maxHp(A) / 3) pow *= 1.5;
      let dmg = Math.floor(Math.floor((Math.floor(2 * A.lv / 5 + 2) * pow * a / d)) / 50) + 2;
      if (phys && A.status === 'brn') dmg = Math.floor(dmg / 2);
      if (G.SPECIES[A.sp].types.includes(move.type)) dmg = Math.floor(dmg * 1.5);
      dmg = Math.floor(dmg * eff);
      if (crit) dmg = Math.floor(dmg * 1.5);
      if (D.ability === 'thickhide' && (move.type === 'Fire' || move.type === 'Ice')) dmg = Math.floor(dmg / 2);
      dmg = Math.floor(dmg * (0.85 + Math.random() * 0.15));
      return { dmg: Math.max(1, dmg), eff };
    }

    // ---------- status helpers ----------
    canStatus(side, st) {
      const m = side.mon, types = G.SPECIES[m.sp].types;
      if (m.status || m.hp <= 0) return false;
      if (st === 'brn' && types.includes('Fire')) return false;
      if (st === 'psn' && types.includes('Toxic')) return false;
      if (st === 'frz' && types.includes('Ice')) return false;
      if (st === 'par' && types.includes('Spark')) return false;
      return true;
    }
    async inflict(side, st) {
      const m = side.mon; m.status = st;
      if (st === 'slp') m.slp = G.ri(1, 3);
      G.audio.sfx('status');
      side.spr.tint = { brn: '#f07030', par: '#f8e040', psn: '#b050c0', slp: '#a0a0b0', frz: '#88e0f0' }[st];
      await G.wait(16); side.spr.tint = null;
      const msg = { brn: ' was burned!', par: ' went numb! It may be unable to move!', psn: ' was poisoned!', slp: ' fell asleep!', frz: ' was encased in ice!' }[st];
      await this.say(this.sideName(side) + msg);
    }
    async changeStat(side, stat, n, src) {
      const cur = side.stages[stat] || 0; const name = G.STAT_NAMES[stat];
      if ((n > 0 && cur >= 6) || (n < 0 && cur <= -6)) { await this.say(this.sideName(side) + '\'s ' + name + ' won\'t go ' + (n > 0 ? 'any higher!' : 'any lower!')); return false; }
      side.stages[stat] = G.clamp(cur + n, -6, 6);
      G.audio.sfx(n > 0 ? 'statup' : 'statdown'); this.sparkle(side, n > 0);
      await G.wait(12);
      const how = n >= 2 ? ' rose a lot!' : n === 1 ? ' rose!' : n === -1 ? ' fell!' : ' fell a lot!';
      await this.say(this.sideName(side) + '\'s ' + name + how);
      return true;
    }
    async damage(side, amt) {
      side.mon.hp = Math.max(0, side.mon.hp - amt);
      await this.settle();
    }
    async heal(side, amt) {
      const max = G.maxHp(side.mon); side.mon.hp = Math.min(max, side.mon.hp + amt); await this.settle();
    }

    // ---------- choosing ----------
    async playerChoose() {
      while (true) {
        const a = await G.push(new ActionMenu(this));
        if (a === 0) {
          const mon = this.P.mon;
          if (mon.moves.every((m) => m.pp <= 0)) { await this.sayWait(G.monName(mon) + ' has no EN left for any move!'); return { type: 'move', idx: -1 }; }
          const i = await G.push(new MoveMenu(this)); if (i < 0) continue;
          return { type: 'move', idx: i };
        }
        if (a === 1) {
          const r = await G.openBag({ battle: true, wild: this.wild });
          if (!r) continue;
          return { type: 'item', id: r.id, target: r.target, moveIdx: r.moveIdx };
        }
        if (a === 2) {
          const i = await G.openParty({ mode: 'battle', active: this.P.mon });
          if (i == null || i < 0) continue;
          if (this.P.party[i] === this.P.mon) { await this.sayWait(G.monName(this.P.mon) + ' is already out there!'); continue; }
          return { type: 'switch', idx: i };
        }
        if (a === 3) {
          if (!this.wild) { await this.sayWait('You can\'t flee from a trainer\'s challenge!'); continue; }
          return { type: 'run' };
        }
      }
    }
    enemyChoose() {
      const s = this.E, m = s.mon, foe = this.P.mon;
      if (this.trainer && this.enemyItems.length && m.hp > 0 && m.hp < G.maxHp(m) * 0.3 && Math.random() < 0.65) {
        return { type: 'item', id: this.enemyItems.shift() };
      }
      const usable = m.moves.map((mv, i) => ({ mv, i })).filter((o) => o.mv.pp > 0);
      if (!usable.length) return { type: 'move', idx: -1 };
      if (this.wild) return { type: 'move', idx: G.pick(usable).i };
      const smart = this.trainer.smart;
      let best = null, bs = -1;
      for (const { mv, i } of usable) {
        const M = G.MOVES[mv.id]; let sc;
        if (M.cat === 'st') {
          sc = 18;
          const fx = M.fx;
          if ((fx.slp || fx.par || fx.psn || fx.brn) && foe.status) sc = 0;
          if (fx.conf && this.P.vol.conf) sc = 0;
          if (fx.self && Object.keys(fx.self).some((k) => (s.stages[k] || 0) >= 2)) sc = 2;
          if (fx.heal && m.hp > G.maxHp(m) * 0.6) sc = 0;
          if (fx.heal && m.hp < G.maxHp(m) * 0.4) sc = 60;
          if (fx.seed && (this.P.vol.seed || G.SPECIES[foe.sp].types.includes('Plant'))) sc = 0;
          if (fx.rest && m.hp > G.maxHp(m) * 0.5) sc = 0;
          if (fx.haze) sc = Object.values(this.P.stages).some((v) => v > 0) ? 40 : 0;
          if (this.turn > 3) sc *= 0.6;
        } else {
          const eff = M.fx.fixed ? 1 : G.typeEff(M.type, G.SPECIES[foe.sp].types);
          const stab = G.SPECIES[m.sp].types.includes(M.type) ? 1.5 : 1;
          sc = (M.fx.fixed ? (M.fx.fixed === 'level' ? m.lv : 40) : M.pow * stab) * eff * ((M.acc || 100) / 100);
          if (M.fx.selfKO) sc *= m.hp < G.maxHp(m) * 0.25 ? 1.5 : 0.1;
        }
        sc *= smart ? 0.92 + Math.random() * 0.16 : 0.6 + Math.random() * 0.8;
        if (sc > bs) { bs = sc; best = i; }
      }
      return { type: 'move', idx: best };
    }

    // ---------- main flow ----------
    async run() {
      const T = this.trainer;
      G.audio.play(this.cfg.music || (T ? (T.boss ? 'boss' : 'trainer') : (this.cfg.legend ? 'boss' : 'battle')));
      // intro
      this.introSlide = 1; this.trSpr.p = 1;
      await G.tween(30, (t) => { this.introSlide = 1 - G.ease(t); });
      this.introSlide = 0;
      if (this.wild) {
        this.E.mon = this.cfg.wild; this.E.idx = 0; for (const k of STAT_KEYS) this.E.stages[k] = 0;
        this.E.spr.vis = true; this.E.hud.hp = this.E.mon.hp; G.dexSee(this.E.mon.sp);
        G.audio.cry(this.E.mon.sp);
        if (this.E.mon.shiny) { this.shinyFx(this.E); await G.wait(20); }
        this.E.hud.show = true;
        await this.say((this.cfg.legend ? (this.cfg.legendText || G.monName(this.E.mon) + ' descends from the altar!') : 'A wild ' + G.monName(this.E.mon) + ' leaps out!'), { auto: 70 });
      } else {
        this.showBalls = true;
        await this.say(G.fmt(T.name) + ' challenges you!', { auto: 70 });
        await G.tween(16, (t) => { this.trSpr.eox = t * 120; });
        this.trSpr.e = 0; this.showBalls = false;
        await this.say(G.fmt(T.name) + ' sends in ' + G.monName(T.mons[0]) + '!', { auto: 30 });
        await this.sendOut(this.E, 0, true);
      }
      await G.tween(14, (t) => { this.trSpr.pox = -t * 120; });
      this.trSpr.p = 0;
      const lead = this.P.party.findIndex((m) => m.hp > 0);
      await this.say('You\'re up, ' + G.monName(this.P.party[lead]) + '!', { auto: 25 });
      await this.sendOut(this.P, lead, true);
      if (this.E.mon && this.wild) await this.onEntry(this.E);

      while (true) {
        const r = await this.doTurn();
        if (r) return this.finish(r);
      }
    }
    order(pa, ea) {
      const list = [];
      if (pa) list.push({ side: this.P, act: pa }); if (ea) list.push({ side: this.E, act: ea });
      const pr = (o) => (o.act.idx >= 0 ? (G.MOVES[o.side.mon.moves[o.act.idx].id].fx.prio || 0) : 0);
      list.sort((a, b) => pr(b) - pr(a) || this.stat(b.side, 'spe') - this.stat(a.side, 'spe') || (Math.random() - 0.5));
      return list;
    }
    async doTurn() {
      this.turn++; this.replaced = false;
      let pa = await this.playerChoose();
      const ea = this.enemyChoose();
      if (pa.type === 'run') {
        this.runs++;
        const ps = this.stat(this.P, 'spe'), es = this.stat(this.E, 'spe');
        const ok = this.P.mon.ability === 'runaway' || ps >= es || Math.random() < (ps / es) * 0.55 + 0.2 + 0.15 * (this.runs - 1);
        if (ok) { G.audio.sfx('run'); await this.say('You escaped safely!', { auto: 40 }); return 'run'; }
        await this.say('Couldn\'t get away!'); pa = null;
      } else if (pa.type === 'switch') {
        await this.say('Good work, ' + G.monName(this.P.mon) + '. Return!', { auto: 25 });
        await this.withdraw(this.P);
        await this.say('You\'re up, ' + G.monName(this.P.party[pa.idx]) + '!', { auto: 25 });
        await this.sendOut(this.P, pa.idx); pa = null;
      } else if (pa.type === 'item') {
        const r = await this.useItem(pa); if (r === 'caught') return 'caught';
        pa = null;
      }
      let ea2 = ea;
      if (ea.type === 'item') { await this.enemyItem(ea.id); ea2 = null; }
      for (const o of this.order(pa, ea2)) {
        const att = o.side, def = this.other(att);
        if (att.mon.hp <= 0 || def.mon.hp <= 0) continue;
        await this.useMove(att, def, o.act.idx);
        const r = await this.checkFaints(); if (r) return r;
        if (this.replaced) break;
      }
      if (!this.replaced) { await this.endTurn(); const r = await this.checkFaints(); if (r) return r; }
      this.P.vol.flinch = this.E.vol.flinch = false;
      return null;
    }
    async endTurn() {
      for (const s of [this.E, this.P]) {
        const m = s.mon; if (!m || m.hp <= 0) continue; const max = G.maxHp(m);
        if (m.status === 'brn') { this.burst(s, 'Fire'); await this.damage(s, Math.max(1, Math.floor(max / 16))); await this.say(this.sideName(s) + ' is hurt by its burn!'); }
        else if (m.status === 'psn') { this.burst(s, 'Toxic'); await this.damage(s, Math.max(1, Math.floor(max / 8))); await this.say(this.sideName(s) + ' is hurt by poison!'); }
        if (m.hp <= 0) continue;
        if (s.vol.seed) {
          const o = this.other(s); const amt = Math.max(1, Math.floor(max / 8));
          this.burst(s, 'Plant'); await this.damage(s, amt);
          if (o.mon.hp > 0) await this.heal(o, amt);
          await this.say(this.sideName(s) + '\'s health is sapped by the Leech Pod!');
        }
        if (m.hp > 0 && m.ability === 'regrow' && m.hp < max) { await this.heal(s, Math.max(1, Math.floor(max / 16))); await this.say(this.sideName(s) + ' regrew some HP!'); }
      }
    }
    async faintAnim(s) {
      G.audio.cry(s.mon.sp, 0.7);
      await G.wait(10);
      G.audio.sfx('faint');
      await G.tween(18, (t) => { s.spr.sink = t * 80; });
      s.spr.vis = false; s.spr.sink = 0; s.hud.show = false;
      await this.say(this.sideName(s) + ' was knocked out!');
      s.mon.status = null; s.vol = {};
    }
    async checkFaints() {
      if (this.E.mon.hp <= 0 && this.E.spr.vis) {
        await this.faintAnim(this.E);
        if (this.P.mon.hp > 0 || true) await this.awardExp(this.E.mon);
      }
      if (this.P.mon.hp <= 0 && this.P.spr.vis) {
        await this.faintAnim(this.P);
        this.parts.delete(this.P.mon.uid);
      }
      const pAble = this.P.party.some((m) => m.hp > 0), eAble = this.E.party.some((m) => m.hp > 0);
      if (!pAble) return 'lose';
      if (!eAble) return 'win';
      if (this.E.mon.hp <= 0) {
        const nx = this.E.party.findIndex((m) => m.hp > 0);
        this.parts = new Set(this.P.mon.hp > 0 ? [this.P.mon.uid] : []);
        await this.say(G.fmt(this.trainer.name) + ' sends in ' + G.monName(this.E.party[nx]) + '!', { auto: 30 });
        await this.sendOut(this.E, nx); this.replaced = true;
      }
      if (this.P.mon.hp <= 0) {
        let i = -1;
        while (i < 0 || this.P.party[i].hp <= 0) i = await G.openParty({ mode: 'forced' });
        await this.say('You\'re up, ' + G.monName(this.P.party[i]) + '!', { auto: 25 });
        await this.sendOut(this.P, i); this.replaced = true;
      }
      return null;
    }

    // ---------- using a move ----------
    async useMove(att, def, idx) {
      const m = att.mon; const name = this.sideName(att);
      // pre-move status
      if (m.status === 'slp') {
        m.slp--;
        if (m.slp > 0) { await this.say(name + ' is sound asleep.'); return; }
        m.status = null; await this.say(name + ' woke up!');
      }
      if (m.status === 'frz') {
        if (Math.random() < 0.2) { m.status = null; await this.say(name + ' thawed out!'); }
        else { await this.say(name + ' is stuck in the ice!'); return; }
      }
      if (att.vol.flinch) { await this.say(name + ' faltered!'); return; }
      if (m.status === 'par' && Math.random() < 0.25) { await this.say(name + ' is too numb to move!'); return; }
      if (att.vol.conf) {
        att.vol.conf--;
        if (att.vol.conf <= 0) { att.vol.conf = 0; await this.say(name + ' snapped out of confusion!'); }
        else {
          await this.say(name + ' is confused!');
          if (Math.random() < 0.33) {
            const d = Math.max(1, Math.floor((Math.floor(2 * m.lv / 5 + 2) * 40 * this.stat(att, 'atk') / this.stat(att, 'def')) / 50) + 2);
            this.burst(att, 'Normal'); G.audio.sfx('hit'); await this.blink(att, 10);
            await this.damage(att, d); await this.say(name + ' stumbled and hit itself!'); return;
          }
        }
      }
      let mv, move;
      if (idx < 0) { move = G.MOVES.struggle; }
      else { mv = m.moves[idx]; move = G.MOVES[mv.id]; mv.pp = Math.max(0, mv.pp - 1); }
      await this.say(name + ' used ' + move.name + '!', { auto: 28 });
      const fx = move.fx;
      const selfOnly = move.cat === 'st' && (fx.self || fx.heal || fx.rest || fx.haze) && !(fx.foe || fx.slp || fx.par || fx.psn || fx.brn || fx.conf || fx.seed);
      // accuracy
      if (!selfOnly && move.acc) {
        const st = G.clamp((att.stages.acc || 0) - (def.stages.eva || 0), -6, 6);
        const mult = st >= 0 ? (3 + st) / 3 : 3 / (3 - st);
        if (Math.random() * 100 >= move.acc * mult) { await this.lunge(att); await this.say(name + ' missed!'); return; }
      }
      if (move.cat === 'st') return this.statusMove(att, def, move);

      // damaging
      const hits = fx.hits ? G.ri(fx.hits[0], fx.hits[1]) : 1;
      let total = 0, eff = 1, crits = 0, n = 0;
      const sturdyOK = def.mon.ability === 'sturdy' && def.mon.hp === G.maxHp(def.mon);
      for (let h = 0; h < hits; h++) {
        if (def.mon.hp <= 0) break;
        const critStage = (fx.crit ? 1 : 0) + (m.ability === 'keen' ? 1 : 0);
        const crit = !fx.fixed && Math.random() < [1 / 16, 1 / 8, 1 / 4, 1 / 3][critStage];
        const r = this.calcDamage(att, def, move, crit); eff = r.eff;
        if (eff === 0) { await this.lunge(att); await this.say(this.sideName(def) + ' is unaffected!'); return; }
        let dmg = Math.min(r.dmg, def.mon.hp);
        if (sturdyOK && dmg >= def.mon.hp && h === 0) { dmg = def.mon.hp - 1; this.sturdyHit = true; }
        await this.lunge(att);
        this.burst(def, move.type, eff > 1 || crit);
        G.audio.sfx(eff > 1 ? 'hitSuper' : eff < 1 ? 'hitWeak' : 'hit');
        await this.blink(def, 14);
        await this.damage(def, dmg); total += dmg; n++;
        if (crit) { crits++; await this.say('A critical strike!', { auto: 30 }); }
      }
      if (eff > 1) await this.say('A super-effective hit!', { auto: 36 });
      else if (eff < 1) await this.say('It barely made a dent...', { auto: 36 });
      if (hits > 1) await this.say('Hit ' + n + ' time' + (n > 1 ? 's' : '') + '!', { auto: 30 });
      if (this.sturdyHit) { this.sturdyHit = false; await this.say(this.sideName(def) + ' endured the hit with Bedrock!'); }
      if (def.mon.status === 'frz' && move.type === 'Fire' && def.mon.hp > 0) { def.mon.status = null; await this.say(this.sideName(def) + ' thawed out!'); }
      // drain / recoil
      if (fx.drain && total > 0 && m.hp > 0) { await this.heal(att, Math.max(1, Math.floor(total * fx.drain))); await this.say(this.sideName(def) + ' lost health to the drain!'); }
      if (fx.recoil && total > 0) { await this.damage(att, Math.max(1, Math.floor(fx.struggle ? G.maxHp(m) / 4 : total * fx.recoil))); await this.say(name + ' took recoil damage!'); }
      if (fx.selfKO) { await this.damage(att, m.hp); }
      // contact abilities
      if (move.cat === 'ph' && def.mon.hp >= 0 && m.hp > 0 && Math.random() < 0.3) {
        const ab = def.mon.ability, st = { staticskin: 'par', flamebody: 'brn', toxictouch: 'psn' }[ab];
        if (st && this.canStatus(att, st)) { await this.say(this.sideName(def) + '\'s ' + G.ABILITIES[ab].name + '!'); await this.inflict(att, st); }
      }
      // secondary effects on the target
      if (def.mon.hp > 0) {
        for (const st of ['brn', 'par', 'psn', 'slp', 'frz']) if (fx[st] && Math.random() * 100 < fx[st] && this.canStatus(def, st)) { await this.inflict(def, st); break; }
        if (fx.conf && Math.random() * 100 < fx.conf && !def.vol.conf) { def.vol.conf = G.ri(2, 5); await this.say(this.sideName(def) + ' became confused!'); }
        if (fx.flinch && Math.random() * 100 < fx.flinch && att === this.firstMover(att)) def.vol.flinch = true;
        if (fx.foe && (fx.chance == null || Math.random() * 100 < fx.chance)) for (const k in fx.foe) await this.changeStat(def, k, fx.foe[k], att);
      }
      if (fx.self && m.hp > 0) for (const k in fx.self) await this.changeStat(att, k, fx.self[k], att);
    }
    firstMover(att) { return this._first ? this._first : att; }
    async statusMove(att, def, move) {
      const fx = move.fx; const m = att.mon;
      await this.lunge(att);
      if (fx.heal) {
        const max = G.maxHp(m); if (m.hp >= max) { await this.say('But ' + this.sideName(att).replace(/^The /, 'the ') + '\'s HP is already full!'); return; }
        this.sparkle(att, true); G.audio.sfx('heal'); await this.heal(att, Math.floor(max * fx.heal)); await this.say(this.sideName(att) + ' restored its HP!'); return;
      }
      if (fx.rest) {
        const max = G.maxHp(m); if (m.hp >= max) { await this.say('It didn\'t work!'); return; }
        m.status = 'slp'; m.slp = 3; this.sparkle(att, true); await this.heal(att, max);
        await this.say(this.sideName(att) + ' fell into a deep sleep and recovered!'); return;
      }
      if (fx.haze) { for (const s of [this.P, this.E]) for (const k of STAT_KEYS) s.stages[k] = 0; this.burst(att, 'Ice'); await this.say('All stat changes were wiped away!'); return; }
      if (fx.seed) {
        if (G.SPECIES[def.mon.sp].types.includes('Plant') || def.vol.seed) { await this.say('It didn\'t work!'); return; }
        def.vol.seed = true; this.burst(def, 'Plant'); await this.say('A pod was planted on ' + this.sideName(def).replace(/^The /, 'the ') + '!'); return;
      }
      if (fx.conf) {
        if (def.vol.conf) { await this.say(this.sideName(def) + ' is already confused!'); return; }
        def.vol.conf = G.ri(2, 5); this.burst(def, 'Mind'); await this.say(this.sideName(def) + ' became confused!'); return;
      }
      for (const st of ['brn', 'par', 'psn', 'slp', 'frz']) if (fx[st]) {
        if (move.type === 'Spark' && G.SPECIES[def.mon.sp].types.includes('Earth')) { await this.say(this.sideName(def) + ' is unaffected!'); return; }
        if (def.mon.status === st) { await this.say(this.sideName(def) + ' is already ' + { brn: 'burned', par: 'paralyzed', psn: 'poisoned', slp: 'asleep', frz: 'frozen' }[st] + '!'); return; }
        if (!this.canStatus(def, st)) { await this.say('It didn\'t work!'); return; }
        this.burst(def, move.type); await this.inflict(def, st); return;
      }
      let any = false;
      if (fx.self) for (const k in fx.self) { any = true; await this.changeStat(att, k, fx.self[k], att); }
      if (fx.foe) for (const k in fx.foe) { any = true; await this.changeStat(def, k, fx.foe[k], att); }
      if (!any) await this.say('But nothing happened!');
    }

    // ---------- items ----------
    async useItem(a) {
      const it = G.ITEMS[a.id]; const fx = it.fx;
      if (fx.ball) return this.throwOrb(a.id);
      G.takeItem(a.id);
      if (fx.boost) {
        await this.say(G.S.name + ' used the ' + it.name + '!', { auto: 30 });
        await this.changeStat(this.P, fx.boost, 2); return;
      }
      const mon = this.P.party[a.target];
      await this.say(G.S.name + ' used the ' + it.name + '!', { auto: 30 });
      const isActive = mon === this.P.mon;
      if (fx.revive) { mon.hp = Math.max(1, Math.floor(G.maxHp(mon) * fx.revive)); mon.status = null; await this.say(G.monName(mon) + ' was revived!'); return; }
      if (fx.heal) {
        const before = mon.hp; mon.hp = Math.min(G.maxHp(mon), mon.hp + fx.heal);
        if (isActive) { this.sparkle(this.P, true); G.audio.sfx('heal'); await this.settle(); }
        await this.say(G.monName(mon) + '\'s HP was restored by ' + (mon.hp - before) + '.');
      }
      if (fx.cure) {
        if (fx.cure === 'all' || mon.status === fx.cure) { const had = mon.status; mon.status = null; mon.slp = 0; if (isActive && fx.cure === 'all') this.P.vol.conf = 0; if (had) await this.say(G.monName(mon) + ' was cured!'); }
      }
      if (fx.pp) { const mv = mon.moves[a.moveIdx]; mv.pp = Math.min(G.MOVES[mv.id].pp, mv.pp + fx.pp); await this.say(G.MOVES[mv.id].name + '\'s EN was restored.'); }
      if (fx.ppAll) { for (const mv of mon.moves) mv.pp = Math.min(G.MOVES[mv.id].pp, mv.pp + fx.ppAll); await this.say('EN was restored.'); }
    }
    async enemyItem(id) {
      const it = G.ITEMS[id], m = this.E.mon;
      await this.say(G.fmt(this.trainer.name) + ' used a ' + it.name + '!', { auto: 30 });
      if (it.fx.heal) { this.sparkle(this.E, true); G.audio.sfx('heal'); m.hp = Math.min(G.maxHp(m), m.hp + it.fx.heal); await this.settle(); }
      if (it.fx.cure) m.status = null;
    }
    async throwOrb(id) {
      const T = this.trainer;
      if (T) {
        await this.say(G.S.name + ' threw an orb...', { auto: 25 });
        await this.say('The trainer knocked it away! Catching another trainer\'s creature is not allowed!');
        return null;
      }
      G.takeItem(id);
      const it = G.ITEMS[id], m = this.E.mon, sp = G.SPECIES[m.sp];
      await this.say(G.S.name + ' threw a ' + it.name + '!', { auto: 18 });
      // arc
      const o = this.orb = { id, x: 60, y: 160, rot: 0 };
      G.audio.sfx('throw');
      await G.tween(28, (t) => { o.x = G.lerp(60, 232, t); o.y = G.lerp(160, 66, t) - Math.sin(t * Math.PI) * 60; o.rot = t * 12; });
      o.rot = 0; G.audio.sfx('pop');
      await G.tween(10, (t) => { this.E.spr.white = t; this.E.spr.scale = 1 - t * 0.9; });
      this.E.spr.vis = false; this.E.spr.white = 0; this.E.spr.scale = 1;
      await G.tween(14, (t) => { o.y = G.lerp(66, 98, t * t); });
      await G.wait(12);
      // odds
      const max = G.maxHp(m);
      let ball = it.fx.ball;
      const night = (() => { const h = new Date().getHours(); return h >= 19 || h < 6; })();
      if (ball === 'net') ball = sp.types.includes('Water') || sp.types.includes('Bug') ? 3 : 1;
      else if (ball === 'dusk') ball = night || this.bg === 'cave' ? 3 : 1;
      else if (ball === 'quick') ball = this.turn <= 1 ? 4 : 1;
      const stat = m.status === 'slp' || m.status === 'frz' ? 2.5 : m.status ? 1.5 : 1;
      const a = ((3 * max - 2 * m.hp) * sp.cr * ball * stat) / (3 * max);
      let shakes = 0;
      if (ball >= 255 || a >= 255) shakes = 4;
      else { const q = Math.pow(a / 255, 0.25); while (shakes < 4 && Math.random() < q) shakes++; }
      for (let i = 0; i < Math.min(3, shakes); i++) {
        G.audio.sfx('shake');
        await G.tween(16, (t) => { o.rot = Math.sin(t * Math.PI * 2) * 0.5; o.x = 232 + Math.sin(t * Math.PI * 2) * 3; });
        await G.wait(16);
      }
      if (shakes >= 4) {
        o.stars = true; G.audio.sfx('caught');
        await this.say('Got it! ' + sp.name + ' is now yours!', { auto: 70 });
        G.audio.play('victory');
        const fresh = !G.S.dex.caught[m.sp];
        m.ball = id; m.ot = G.S.name; m.otId = G.S.playerId; m.met = G.MAPS[G.S.map] ? G.MAPS[G.S.map].name : ''; m.metLv = m.lv;
        m.status = m.status; // keeps status
        G.dexCatch(m.sp);
        if (fresh) await this.sayWait(sp.name + ' has been recorded in the Wildling Dex.');
        // exp for the catch
        await this.awardExp(m);
        if (await G.ask('Give a nickname to the caught ' + sp.name + '?')) {
          const nn = await G.nameEntry('Nickname for ' + sp.name + '?', sp.name, 10, G.creatureSprite(m.sp, m.shiny));
          if (nn && nn !== sp.name) m.nick = nn;
        }
        const where = G.storeMon(m);
        if (where === null) await this.sayWait('Every box is full! ' + G.monName(m) + ' was released...');
        else if (where !== 'party') await this.sayWait(G.monName(m) + ' was sent to Box ' + (where + 1) + '.');
        this.orb = null;
        return 'caught';
      }
      G.audio.sfx('pop');
      this.orb = null; this.E.spr.vis = true; this.E.spr.white = 1;
      await G.tween(8, (t) => { this.E.spr.white = 1 - t; });
      await this.say(['It burst right out!', 'Argh, it slipped free!', 'So close!', 'It was almost caught!'][shakes]);
      return null;
    }

    // ---------- experience ----------
    async awardExp(defeated) {
      const sp = G.SPECIES[defeated.sp];
      const base = Math.floor(sp.xp * defeated.lv / 7 * (this.trainer ? 1.5 : 1));
      const list = this.P.party.filter((m) => m.hp > 0 && this.parts.has(m.uid));
      if (!list.length) return;
      const each = Math.max(1, Math.floor(base / list.length));
      for (const m of list) await this.gainExp(m, each);
      if (G.S.shareOn && G.hasItem('shareband')) {
        const rest = this.P.party.filter((m) => m.hp > 0 && !this.parts.has(m.uid));
        if (rest.length) { await this.say('The Share Band passed experience to the rest of the team!', { auto: 34 }); for (const m of rest) await this.gainExp(m, Math.max(1, Math.floor(base / 2)), true); }
      }
    }
    async gainExp(m, amt, quiet) {
      if (m.lv >= 100) return;
      if (!quiet) await this.say(G.monName(m) + ' earned ' + amt + ' experience!', { auto: 34 });
      const sp = G.SPECIES[m.sp];
      let remaining = amt;
      while (remaining > 0 && m.lv < 100) {
        const need = G.expFor(sp.gr, m.lv + 1) - m.exp;
        const add = Math.min(need, remaining); remaining -= add;
        const active = m === this.P.mon;
        const from = G.expFrac(m); m.exp += add; const to = add === need ? 1 : G.expFrac(m);
        if (active) { G.audio.sfx('blip'); await G.tween(Math.max(6, Math.round((to - from) * 40)), (t) => { this.P.hud.exp = G.lerp(from, to, t); }); }
        if (add === need) {
          const before = G.stats(m), hpLost = before.hp - m.hp;
          m.lv++; const after = G.stats(m);
          if (m.hp > 0) m.hp = after.hp - hpLost;
          if (active) { this.P.hud.hp = m.hp; this.P.hud.exp = 0; }
          G.audio.sfx('levelup'); this.leveled.add(m);
          await this.sayWait(G.monName(m) + ' reached level ' + m.lv + '!');
          await G.push(new StatPanel(before, after));
          for (const id of G.movesAt(m.sp, m.lv)) await G.learnMove(m, id, (t) => this.sayWait(t));
        }
      }
    }

    // ---------- end of battle ----------
    async finish(r) {
      const T = this.trainer;
      if (r === 'win' && T) {
        G.audio.play('victory');
        this.trSpr.e = 1; this.trSpr.eox = 120;
        await G.tween(16, (t) => { this.trSpr.eox = 120 * (1 - t); });
        await this.sayWait('You beat ' + G.fmt(T.name) + '!');
        if (T.lose) await this.sayWait(G.fmt(T.lose));
        const prize = T.money != null ? T.money : (T.base || 20) * T.mons[T.mons.length - 1].lv;
        G.S.money += prize;
        await this.sayWait(G.S.name + ' earned $' + prize + ' in prize money.');
      } else if (r === 'win') {
        G.audio.play('victory');
        await G.wait(30);
      } else if (r === 'lose' && this.cfg.noWhiteout) {
        await this.sayWait(G.S.name + '\'s whole team is exhausted!');
      } else if (r === 'lose') {
        await this.sayWait(G.S.name + '\'s whole team is exhausted!');
        // lose a slice of money: capped by the team's strength so late-game losses don't wipe savings
        const lead = Math.max(...G.S.party.map((m) => m.lv));
        const lost = Math.min(Math.floor(G.S.money * (T ? 0.25 : 0.1)), lead * (T ? 80 : 40));
        G.S.money -= lost;
        if (T) await this.sayWait(G.S.name + ' paid $' + lost + ' to ' + G.fmt(T.name) + '...');
        else if (lost) await this.sayWait(G.S.name + ' dropped $' + lost + ' in the panic...');
        await this.sayWait(G.S.name + ' hurried back to safety...');
      }
      for (const m of G.S.party) if (m.status === 'slp' && m.hp <= 0) m.status = null;
      // evolutions
      if (r !== 'lose') {
        await G.fadeOut(12);
        G.pop(this); G.fade = 0;
        for (const m of this.leveled) {
          if (!G.S.party.includes(m) || m.hp <= 0) continue;
          const to = G.lvEvo(m); if (to) await G.evolveScene(m, to, true);
        }
        G.fade = 1;
        return r;
      }
      await G.fadeOut(20);
      G.pop(this);
      return r;
    }
  }
  G.Battle = Battle;

  // ---------- learning moves (shared with menus / evolution) ----------
  // say: async fn to show text
  G.learnMove = async (m, id, say = (t) => G.say(t)) => {
    const mv = G.MOVES[id];
    if (m.moves.some((x) => x.id === id)) return false;
    if (m.moves.length < 4) { m.moves.push({ id, pp: mv.pp }); G.audio.sfx('levelup'); await say(G.monName(m) + ' learned ' + mv.name + '!'); return true; }
    while (true) {
      await say(G.monName(m) + ' wants to learn ' + mv.name + ', but it already knows four moves.');
      if (await G.ask('Forget a move to make room for ' + mv.name + '?')) {
        const opts = m.moves.map((x) => G.MOVES[x.id].name).concat([mv.name + ' (new)']);
        const k = await G.askList('Which move should be forgotten?', opts, { cancel: 4, x: 150, y: 70 });
        if (k < 4) {
          const old = G.MOVES[m.moves[k].id].name;
          m.moves[k] = { id, pp: mv.pp };
          await say(G.monName(m) + ' let go of ' + old + '.');
          G.audio.sfx('levelup');
          await say('In its place, it learned ' + mv.name + '!');
          return true;
        }
      }
      if (await G.ask('Give up on learning ' + mv.name + '?')) { await say(G.monName(m) + ' did not learn ' + mv.name + '.'); return false; }
    }
  };

  // ---------- evolution ----------
  class EvoScene {
    constructor(m, to) { this.m = m; this.to = to; this.t = 0; this.phase = 0; this.mix = 0; this.white = 0; this.canceled = false; this.stars = []; }
    update() {
      this.t++;
      if (this.allowCancel && this.phase === 1 && G.input.pressed('b')) this.canceled = true;
      if (this.phase === 1 && this.t % 6 === 0) this.stars.push({ x: 160, y: 96, a: Math.random() * 6.28, r: 0 });
      for (const s of this.stars) s.r += 2;
      this.stars = this.stars.filter((s) => s.r < 200);
    }
    draw(c) {
      c.fillStyle = '#181828'; c.fillRect(0, 0, 320, 240);
      const g = c.createRadialGradient(160, 96, 10, 160, 96, 160); g.addColorStop(0, 'rgba(120,140,220,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, 320, 240);
      for (const s of this.stars) { c.fillStyle = '#f8f0c0'; c.fillRect(160 + Math.cos(s.a) * s.r, 96 + Math.sin(s.a) * s.r, 2, 2); }
      const a = G.creatureSprite(this.m.sp, this.m.shiny), b = G.creatureSprite(this.to, this.m.shiny);
      const img = this.mix > 0.5 ? b : a;
      c.drawImage(img, 128, 64);
      if (this.white > 0) { c.globalAlpha = this.white; c.drawImage(G.silhouette(img), 128, 64); c.globalAlpha = 1; }
      G.box(0, 176, 320, 64, 'dark');
    }
  }
  G.evolveScene = async (m, to, allowCancel) => {
    const sc = new EvoScene(m, to); sc.allowCancel = allowCancel;
    G.push(sc); G.fade = 0;
    G.audio.play('evolve');
    await G.say('Something is happening to ' + G.monName(m) + '!', { style: 'battle' });
    G.audio.sfx('evolve');
    await G.tween(30, (t) => { sc.white = t; });
    sc.phase = 1;
    // flicker between the two forms, faster and faster
    let period = 30;
    for (let total = 0; total < 300 && !sc.canceled;) {
      sc.mix = sc.mix > 0.5 ? 0 : 1;
      await G.wait(Math.max(2, period)); total += period; period = Math.max(2, Math.floor(period * 0.8));
    }
    sc.phase = 2;
    if (sc.canceled) {
      sc.mix = 0; await G.tween(20, (t) => { sc.white = 1 - t; });
      await G.say(G.monName(m) + ' stayed just as it was.', { style: 'battle' });
      G.pop(sc); return false;
    }
    sc.mix = 1; G.flash(6);
    await G.tween(30, (t) => { sc.white = 1 - t; });
    const oldName = G.monName(m), oldSp = m.sp;
    G.evolveMon(m, to);
    G.audio.cry(to); G.audio.sfx('caught');
    await G.say(oldName + ' grew into ' + G.SPECIES[to].name + '!', { style: 'battle' });
    const offered = G.movesAt(oldSp, m.lv);
    for (const id of G.movesAt(to, m.lv)) if (!offered.includes(id)) await G.learnMove(m, id, (t) => G.say(t, { style: 'battle' }));
    G.pop(sc);
    return true;
  };

  // ---------- backgrounds ----------
  const PLAT = {
    grass: ['#589c48', '#88c868'], cave: ['#5c4c3c', '#8c7860'], hall: ['#7c7498', '#b0a8cc'], water: ['#3c78c8', '#78b0e8'],
    hq: ['#3c4058', '#6c7488'], summit: ['#9c8878', '#d8c8b0'], ash: ['#6c5c54', '#a8948c'], shrine: ['#9c94c0', '#dcd4ec'], indoor: ['#a07850', '#d4a46c'],
    snow: ['#a8c4dc', '#f0f6fc'], forest: ['#2c6c2c', '#4c9c44'], ruins: ['#5c5870', '#8c8478'], marsh: ['#4c7c5c', '#78a878'], ice: ['#5c94c0', '#bce4f4'],
  };
  function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
  function drawBackground(c, bg, t) {
    const sky = {
      grass: ['#88c8f0', '#d8f0f8', '#a8d880'], water: ['#78b8f0', '#d0ecf8', '#5c9ce0'], cave: ['#2c2420', '#4c3c30', '#5c4c3c'],
      hall: ['#3c3460', '#6c6098', '#8c84b0'], hq: ['#181c2c', '#2c3048', '#3c4058'], summit: ['#f0a070', '#f8d8a8', '#c8b098'],
      ash: ['#a07868', '#d8b8a0', '#9c8478'], shrine: ['#5c4c9c', '#b8a8e8', '#d8d0f0'], indoor: ['#c8a878', '#f0dcb8', '#d8b888'],
      snow: ['#a8c8e8', '#e8f0f8', '#f4f8fc'], forest: ['#3c6c48', '#7cac78', '#4c8c44'], ruins: ['#24203c', '#4c4868', '#6c6478'], marsh: ['#7ca8b0', '#c8dcd0', '#6c9c70'], ice: ['#2c4c78', '#6c9cc8', '#a8d4ec'],
    }[bg] || ['#88c8f0', '#d8f0f8', '#a8d880'];
    const g = c.createLinearGradient(0, 0, 0, 176); g.addColorStop(0, sky[0]); g.addColorStop(0.55, sky[1]); g.addColorStop(0.56, sky[2]); g.addColorStop(1, G.shadeHex(sky[2], 0.85));
    c.fillStyle = g; c.fillRect(0, 0, 320, 176);
    if (bg === 'grass' || bg === 'water') {
      c.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 3; i++) { const x = ((i * 120 + t * 0.15) % 380) - 40; ell(c, x, 24 + i * 12, 22, 6); ell(c, x + 14, 20 + i * 12, 14, 6); }
      if (bg === 'grass') { c.fillStyle = '#5c9c48'; for (let x = 0; x < 320; x += 14) ell(c, x, 96, 12, 10); c.fillStyle = '#4c8c3c'; for (let x = 7; x < 320; x += 14) ell(c, x, 98, 8, 6); }
      else { c.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 12; i++) c.fillRect(((i * 41 + t * 0.4) % 340) - 10, 100 + (i % 4) * 18, 18, 1); }
    } else if (bg === 'snow') {
      c.fillStyle = '#d8e4f0'; c.beginPath(); c.moveTo(0, 97); c.lineTo(70, 60); c.lineTo(130, 90); c.lineTo(200, 50); c.lineTo(270, 88); c.lineTo(320, 66); c.lineTo(320, 97); c.fill();
      c.fillStyle = '#ffffff'; for (let i = 0; i < 30; i++) c.fillRect((i * 53 + t * 0.4) % 320, (i * 29 + t * (0.5 + (i % 3) * 0.3)) % 176, 2, 2);
    } else if (bg === 'forest') {
      c.fillStyle = '#2c5c34'; for (let x = 0; x < 330; x += 22) { c.beginPath(); c.moveTo(x - 14, 98); c.lineTo(x, 30 + (x * 7) % 30); c.lineTo(x + 14, 98); c.fill(); }
      c.fillStyle = 'rgba(255,255,200,0.12)'; for (let i = 0; i < 4; i++) c.fillRect(40 + i * 80, 0, 10, 100);
    } else if (bg === 'marsh') {
      c.fillStyle = '#5c8c68'; for (let x = 0; x < 320; x += 9) c.fillRect(x, 84 - (x * 13) % 14, 2, 16);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, 70, 320, 6);
    } else if (bg === 'ruins' || bg === 'ice') {
      c.fillStyle = bg === 'ruins' ? '#3c3858' : '#4c7cac'; for (let x = 10; x < 320; x += 60) c.fillRect(x, 10, 18, 88);
    } else if (bg === 'cave') {
      c.fillStyle = '#3c3028'; for (let x = 0; x < 320; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 12, 18 + (x % 48 ? 10 : 0)); c.lineTo(x + 24, 0); c.fill(); }
    } else if (bg === 'hall' || bg === 'shrine') {
      c.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = 20; x < 320; x += 70) c.fillRect(x, 0, 16, 96);
    } else if (bg === 'hq') {
      for (let y = 10; y < 90; y += 16) for (let x = 8; x < 320; x += 24) { c.fillStyle = (x * y + Math.floor(t / 20)) % 7 ? '#2c3450' : '#58e068'; c.fillRect(x, y, 10, 4); }
    } else if (bg === 'summit') {
      c.fillStyle = '#a89080'; c.beginPath(); c.moveTo(0, 97); c.lineTo(60, 50); c.lineTo(110, 80); c.lineTo(170, 40); c.lineTo(240, 85); c.lineTo(290, 55); c.lineTo(320, 70); c.lineTo(320, 97); c.fill();
      c.fillStyle = '#f8f8f8'; c.beginPath(); c.moveTo(160, 46); c.lineTo(170, 40); c.lineTo(182, 48); c.fill();
    } else if (bg === 'ash') {
      c.fillStyle = 'rgba(80,60,60,0.25)'; for (let i = 0; i < 20; i++) c.fillRect((i * 37 + t * 0.3) % 320, (i * 23 + t * 0.6) % 176, 2, 2);
    }
  }
  function drawParticle(c, p) {
    c.globalAlpha = Math.min(1, p.life / 10); c.fillStyle = p.col; c.strokeStyle = p.col;
    if (p.shape === 'ring') { c.lineWidth = 1; c.beginPath(); c.arc(p.x, p.y, p.size + 1, 0, Math.PI * 2); c.stroke(); }
    else if (p.shape === 'leaf') { c.fillRect(p.x, p.y, p.size + 1, p.size - 1); }
    else if (p.shape === 'bolt') { c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + 3, p.y + 4); c.lineTo(p.x - 1, p.y + 6); c.lineTo(p.x + 2, p.y + 11); c.stroke(); }
    else if (p.shape === 'shard') { c.beginPath(); c.moveTo(p.x, p.y - p.size); c.lineTo(p.x + 2, p.y); c.lineTo(p.x, p.y + p.size); c.lineTo(p.x - 2, p.y); c.fill(); }
    else if (p.shape === 'line') { c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 4, p.y - p.vy * 4); c.stroke(); }
    else if (p.shape === 'star') { c.fillRect(p.x - 1, p.y - 3, 2, 6); c.fillRect(p.x - 3, p.y - 1, 6, 2); }
    else c.fillRect(p.x, p.y, p.size, p.size);
    c.globalAlpha = 1;
  }

  // ---------- public entry points ----------
  G.startBattle = async (cfg) => {
    if (cfg.trainer) {
      const T = cfg.trainer;
      T.mons = (typeof T.party === 'function' ? T.party() : T.party).map(([sp, lv, moves]) => G.makeMon(sp, lv, { ivs: T.ivs != null ? T.ivs : 10, moves, shiny: false }));
    }
    const b = new Battle(cfg);
    await battleTransition();
    G.push(b);
    G.fade = 0;
    const r = await b.run();
    return r;
  };
  async function battleTransition() {
    G.audio.sfx('encounter');
    for (let i = 0; i < 3; i++) { G.fadeColor = '255,255,255'; G.fade = 0.8; await G.wait(3); G.fade = 0; await G.wait(3); }
    await G.fadeOut(16);
  }
})();
