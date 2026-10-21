'use strict';
// Menus: start menu, team, summary, bag, item use, dex, storage PC, shop, options, trainer card, save.
(function () {
  const sfx = (n) => G.audio.sfx(n);
  const I = () => G.input;

  // ---------- small list helper ----------
  function listNav(sc, n, wrap = true) {
    const inp = I();
    if (inp.rep('up') && n) { sc.i = wrap ? (sc.i + n - 1) % n : Math.max(0, sc.i - 1); sfx('move'); return true; }
    if (inp.rep('down') && n) { sc.i = wrap ? (sc.i + 1) % n : Math.min(n - 1, sc.i + 1); sfx('move'); return true; }
    return false;
  }
  function drawHpBar(m, x, y, w = 64) { const f = m.hp / G.maxHp(m); G.bar(x, y, w, 4, f, G.hpColor(f)); }
  function statusTag(m, x, y) {
    if (m.hp <= 0) { G.rrect(x, y, 26, 9, '#c04848'); G.text('FNT', x + 13, y + 1, '#fff', { size: 6, align: 'center', shadow: false }); return; }
    if (!m.status) return; const [t, col] = G.STATUS_TAG[m.status];
    G.rrect(x, y, 26, 9, col); G.text(t, x + 13, y + 1, '#fff', { size: 6, align: 'center', shadow: false });
  }

  // =====================================================================
  // TEAM
  // =====================================================================
  class PartyScene {
    constructor(o) { this.o = o; this.i = 0; this.swap = -1; this.msg = o.msg || 'Choose a creature.'; this.t = 0; }
    get party() { return G.S.party; }
    update() {
      this.t++;
      const n = this.party.length; listNav(this, n);
      if (I().pressed('a')) { sfx('select'); this.pick(); }
      else if (I().pressed('b') || I().pressed('start')) {
        if (this.swap >= 0) { this.swap = -1; sfx('back'); return; }
        if (this.o.mode === 'forced') { sfx('bump'); return; }
        sfx('back'); G.pop(this, -1);
      }
    }
    async pick() {
      if (this.busy) return; this.busy = true;
      try {
        const m = this.party[this.i], mode = this.o.mode;
        if (this.swap >= 0) {
          const a = this.swap, b = this.i; [this.party[a], this.party[b]] = [this.party[b], this.party[a]]; this.swap = -1; sfx('select'); return;
        }
        if (mode === 'item' || mode === 'pick') { G.pop(this, this.i); return; }
        if (mode === 'forced') {
          if (m.hp <= 0) { await G.say('It\'s too exhausted to battle!'); return; }
          if (m === this.o.active) { await G.say(G.monName(m) + ' is already out!'); return; }
          G.pop(this, this.i); return;
        }
        const opts = mode === 'battle' ? ['SEND OUT', 'SUMMARY', 'CANCEL'] : ['SUMMARY', 'SWITCH', 'ITEM', 'CANCEL'];
        const k = await G.choose(opts, { cancel: opts.length - 1, x: 214, y: 120 });
        const sel = opts[k];
        if (sel === 'SEND OUT') {
          if (m.hp <= 0) { await G.say(G.monName(m) + ' is too exhausted to battle!'); return; }
          G.pop(this, this.i); return;
        }
        if (sel === 'SUMMARY') { const j = await G.push(new SummaryScene(this.party, this.i)); this.i = j; return; }
        if (sel === 'SWITCH') { this.swap = this.i; return; }
        if (sel === 'ITEM') {
          const r = await G.openBag({ pickFor: m });
          if (r) await G.useItemOn(r.id, m);
        }
      } finally { this.busy = false; }
    }
    draw(c) {
      G.drawPattern(c, '#3c8c78', '#348070');
      const able = (m) => {
        if (this.o.mode !== 'item' || !this.o.item) return null;
        const it = G.ITEMS[this.o.item];
        if (it.pocket === 'discs') return G.canLearnDisc(m, it) ? (m.moves.some((x) => x.id === it.fx.teach) ? 'LEARNED' : 'ABLE') : 'UNABLE';
        if (it.fx.evo) return G.itemEvo(m, this.o.item) ? 'ABLE' : 'UNABLE';
        return null;
      };
      this.party.forEach((m, k) => {
        const y = 6 + k * 30, sel = k === this.i;
        G.rrect(6, y, 308, 28, sel ? '#f8f0a8' : m.hp > 0 ? '#e8f4f0' : '#e8c8c8');
        G.rrect(7, y + 1, 306, 26, sel ? '#fffad0' : m.hp > 0 ? '#ffffff' : '#f4dcdc');
        if (this.swap === k) { G.rrect(6, y, 6, 28, '#e05050'); }
        const bob = sel && Math.floor(this.t / 12) % 2 ? -2 : 0;
        c.drawImage(G.creatureIcon(m.sp, m.shiny), 12, y - 3 + bob);
        G.text(G.monName(m), 50, y + 5);
        if (m.shiny) G.text('*', 150, y + 5, '#e0a020');
        G.text('Lv' + m.lv, 50, y + 16, '#606878', { size: 7 });
        const ab = able(m);
        if (ab) G.text(ab, 304, y + 10, ab === 'ABLE' ? '#3c8c3c' : '#a04040', { align: 'right' });
        else {
          G.text('HP', 164, y + 6, '#e0a030', { size: 7 }); drawHpBar(m, 184, y + 7, 80);
          G.text(m.hp + '/' + G.maxHp(m), 304, y + 16, '#383838', { align: 'right', size: 7 });
          statusTag(m, 96, y + 15);
        }
      });
      G.box(4, 190, 312, 46);
      G.text(this.swap >= 0 ? 'Move to where?' : this.msg, 16, 208);
    }
  }
  G.openParty = (o = {}) => G.push(new PartyScene(o));

  // =====================================================================
  // SUMMARY
  // =====================================================================
  class SummaryScene {
    constructor(list, i) { this.list = list; this.i = i; this.page = 0; this.mi = 0; this.t = 0; }
    update() {
      this.t++;
      const inp = I();
      if (inp.pressed('left')) { this.page = (this.page + 2) % 3; sfx('move'); }
      if (inp.pressed('right')) { this.page = (this.page + 1) % 3; sfx('move'); }
      if (this.page === 2) { const n = this.list[this.i].moves.length; if (inp.rep('down')) { this.mi = (this.mi + 1) % n; sfx('move'); } if (inp.rep('up')) { this.mi = (this.mi + n - 1) % n; sfx('move'); } }
      else {
        if (inp.rep('down') && this.list.length > 1) { this.i = (this.i + 1) % this.list.length; this.mi = 0; sfx('move'); G.audio.cry(this.list[this.i].sp); }
        if (inp.rep('up') && this.list.length > 1) { this.i = (this.i + this.list.length - 1) % this.list.length; this.mi = 0; sfx('move'); G.audio.cry(this.list[this.i].sp); }
      }
      if (inp.pressed('b') || inp.pressed('start')) { sfx('back'); G.pop(this, this.i); }
      if (inp.pressed('a') && this.page !== 2) { this.page = (this.page + 1) % 3; sfx('move'); }
    }
    draw(c) {
      const m = this.list[this.i], sp = G.SPECIES[m.sp];
      G.drawPattern(c, '#e8e0f0', '#ddd4ea');
      c.fillStyle = '#58508c'; c.fillRect(0, 0, 320, 22);
      ['INFO', 'STATS', 'MOVES'].forEach((t, k) => G.text(t, 12 + k * 70, 7, k === this.page ? '#f8e070' : '#b0a8d8', { shadow: false }));
      G.text('<  >', 300, 7, '#b0a8d8', { align: 'right', shadow: false });
      // left panel
      G.box(6, 28, 108, 150);
      c.fillStyle = '#d8ecf4'; c.fillRect(12, 34, 96, 84);
      c.drawImage(G.creatureSprite(m.sp, m.shiny), 28, 44);
      G.text(G.monName(m), 14, 124);
      G.text('Lv' + m.lv, 14, 138, '#606878');
      if (m.shiny) G.text('* SHINY', 108, 138, '#d09010', { align: 'right', size: 7 });
      c.drawImage(G.orbSprite(m.ball || 'bindorb', 10), 96, 122);
      sp.types.forEach((t, k) => G.typeBadge(t, 14 + k * 48, 156));
      G.box(118, 28, 196, 150);
      const x = 130; let y = 40;
      if (this.page === 0) {
        const row = (a, b) => { G.text(a, x, y, '#6870a0', { size: 7 }); G.text(String(b), 300, y, '#383838', { align: 'right', size: 7 }); y += 15; };
        row('No.', String(sp.num).padStart(3, '0'));
        row('Species', sp.name);
        row('Trainer', m.ot || '-');
        row('ID No.', m.otId || '-');
        row('Temper', m.nature);
        row('Ability', G.ABILITIES[m.ability].name);
        y += 2; G.wrap(G.ABILITIES[m.ability].desc, 168, 7).forEach((l) => { G.text(l, x, y, '#606060', { size: 7 }); y += 11; });
        y = 154; G.text('Met at Lv' + (m.metLv || m.lv) + (m.met ? ', ' + m.met : ''), x, y, '#606878', { size: 6 });
        G.text('To next Lv: ' + G.expToNext(m), x, y + 10, '#606878', { size: 6 });
      } else if (this.page === 1) {
        const st = G.stats(m), nat = G.NATURES[m.nature];
        G.text('HP', x, y, '#6870a0'); G.text(m.hp + '/' + st.hp, 300, y, '#383838', { align: 'right' }); drawHpBar(m, x + 40, y + 12, 130); y += 26;
        for (const k of ['atk', 'def', 'spa', 'spd', 'spe']) {
          const col = nat.up === k ? '#c84040' : nat.down === k ? '#4060c8' : '#6870a0';
          G.text(G.STAT_NAMES[k], x, y, col); G.text(st[k], 300, y, '#383838', { align: 'right' }); y += 16;
        }
        y += 4; G.text('EXP', x, y, '#6870a0'); G.text(m.exp, 300, y, '#383838', { align: 'right' }); y += 14;
        G.bar(x, y, 168, 3, G.expFrac(m), '#48a8f0', '#d0d8d0');
      } else {
        m.moves.forEach((mv, k) => {
          const mm = G.MOVES[mv.id], yy = 36 + k * 22;
          if (k === this.mi) G.rrect(124, yy - 3, 186, 20, '#f8f0b0');
          G.typeBadge(mm.type, 128, yy);
          G.text(mm.name, 178, yy + 2, '#383838', { size: 7 });
          G.text(mv.pp + '/' + mm.pp, 304, yy + 2, '#606878', { size: 7, align: 'right' });
        });
        const mm = G.MOVES[m.moves[this.mi].id];
        c.fillStyle = '#c8c0dc'; c.fillRect(124, 126, 186, 1);
        G.text((mm.cat === 'ph' ? 'Physical' : mm.cat === 'sp' ? 'Special' : 'Status') + '  Pow ' + (mm.pow > 1 ? mm.pow : '-') + '  Acc ' + (mm.acc || '-'), 128, 131, '#6870a0', { size: 6 });
        let yy = 143; G.wrap(mm.desc, 178, 7).forEach((l) => { G.text(l, 128, yy, '#484848', { size: 7 }); yy += 11; });
      }
      G.box(4, 184, 312, 52);
      if (this.page === 0) { let yy = 196; G.wrap(sp.dex, 290, 7).slice(0, 3).forEach((l) => { G.text(l, 14, yy, '#484848', { size: 7 }); yy += 12; }); }
      else G.text(this.page === 2 ? 'Up/Down: choose move  B: back' : 'Up/Down: switch creature  B: back', 14, 204, '#606878', { size: 7 });
    }
  }
  G.SummaryScene = SummaryScene;

  // =====================================================================
  // BAG
  // =====================================================================
  class BagScene {
    constructor(o) { this.o = o; this.p = o.battle ? 1 : (G.S.lastPocket || 0); this.i = 0; this.top = 0; this.t = 0; }
    items() { return G.bagList(G.POCKETS[this.p].id); }
    update() {
      this.t++;
      const inp = I(); const list = this.items();
      if (inp.pressed('left')) { this.p = (this.p + G.POCKETS.length - 1) % G.POCKETS.length; this.i = 0; this.top = 0; sfx('move'); }
      if (inp.pressed('right')) { this.p = (this.p + 1) % G.POCKETS.length; this.i = 0; this.top = 0; sfx('move'); }
      listNav(this, list.length + 1);
      if (this.i < this.top) this.top = this.i; if (this.i > this.top + 7) this.top = this.i - 7;
      if (inp.pressed('a')) { sfx('select'); if (this.i >= list.length) { G.pop(this, null); return; } this.act(list[this.i]); }
      else if (inp.pressed('b') || inp.pressed('start')) { sfx('back'); G.S.lastPocket = this.p; G.pop(this, null); }
    }
    async act(id) {
      if (this.busy) return; this.busy = true;
      try {
        const it = G.ITEMS[id], o = this.o;
        if (o.pickFor) { G.pop(this, { id }); return; }
        if (o.sell) { await o.sell(this, id); return; }
        if (o.battle) {
          if (it.fx.ball) { G.pop(this, { id }); return; }
          if (it.fx.boost) { G.pop(this, { id }); return; }
          if (!it.fx.battle) { await G.say('That can\'t be used now.'); return; }
          const t = await G.openParty({ mode: 'item', item: id, msg: 'Use on which creature?' });
          if (t < 0) return;
          const m = G.S.party[t];
          const why = G.itemNoEffect(id, m);
          if (why) { await G.say(why); return; }
          let moveIdx;
          if (it.fx.pp) { moveIdx = await G.askList('Restore which move?', m.moves.map((x) => G.MOVES[x.id].name + ' ' + x.pp + '/' + G.MOVES[x.id].pp), { cancel: -1, x: 150, y: 70 }); if (moveIdx < 0) return; }
          G.pop(this, { id, target: t, moveIdx }); return;
        }
        // overworld
        const opts = it.pocket === 'key' ? ['USE', 'CANCEL'] : it.pocket === 'discs' ? ['USE', 'CANCEL'] : ['USE', 'TOSS', 'CANCEL'];
        const k = await G.choose(opts, { cancel: opts.length - 1, x: 230, y: 120 });
        if (opts[k] === 'USE') {
          const r = await G.useItemField(id, this);
          if (r === 'close') { G.S.lastPocket = this.p; G.pop(this, null); }
        } else if (opts[k] === 'TOSS') {
          const n = await G.pickNumber(G.S.bag[id]); if (!n) return;
          if (await G.ask('Throw away ' + n + ' ' + it.name + '?')) { G.takeItem(id, n); await G.say('Threw away ' + n + ' ' + it.name + '.'); }
          if (this.i > this.items().length) this.i = this.items().length;
        }
      } finally { this.busy = false; }
    }
    draw(c) {
      G.drawPattern(c, '#e8a858', '#e09c4c');
      // bag graphic
      c.fillStyle = '#7c4c24'; c.fillRect(20, 40, 72, 74); c.fillStyle = '#b87038'; c.fillRect(24, 44, 64, 66); c.fillStyle = '#d89050'; c.fillRect(24, 44, 64, 10);
      c.fillStyle = '#7c4c24'; c.fillRect(44, 30, 24, 14); c.fillStyle = '#e8c048'; c.fillRect(52, 64, 8, 8);
      const P = G.POCKETS[this.p];
      G.box(8, 120, 96, 28); G.text(P.name, 56, 130, '#383838', { align: 'center', size: 7 });
      for (let k = 0; k < G.POCKETS.length; k++) { c.fillStyle = k === this.p ? '#f8f8f8' : '#9c6838'; c.fillRect(30 + k * 12, 154, 8, 4); }
      G.text('$' + G.S.money, 56, 166, '#ffffff', { align: 'center', shadowCol: 'rgba(0,0,0,0.4)' });
      G.box(110, 6, 206, 172);
      const list = this.items();
      for (let r = 0; r < 8; r++) {
        const k = this.top + r; if (k > list.length) break;
        const y = 16 + r * 20;
        if (k === list.length) { G.text('CLOSE BAG', 132, y + 4); }
        else {
          const it = G.ITEMS[list[k]];
          c.drawImage(G.itemIcon(list[k]), 124, y);
          G.text(it.name.length > 17 ? it.name.slice(0, 16) + '.' : it.name, 144, y + 4, '#383838', { size: it.name.length > 14 ? 7 : 8 });
          if (it.pocket !== 'key' && it.pocket !== 'discs') G.text('x' + G.S.bag[list[k]], 306, y + 4, '#383838', { align: 'right', size: 7 });
        }
        if (k === this.i) G.cursor(116, y + 4);
      }
      G.box(4, 182, 312, 54);
      const id = list[this.i];
      if (id) { c.drawImage(G.itemIcon(id), 14, 196); let y = 192; G.wrap(G.ITEMS[id].desc, 260, 7).forEach((l) => { G.text(l, 38, y, '#383838', { size: 7 }); y += 12; }); if (this.o.sell) G.text('Sells for $' + Math.floor(G.ITEMS[id].price / 2), 306, 222, '#606878', { align: 'right', size: 7 }); }
      else G.text('Close the bag.', 38, 200);
    }
  }
  G.openBag = (o = {}) => G.push(new BagScene(o));

  G.itemNoEffect = (id, m) => {
    const fx = G.ITEMS[id].fx; const max = G.maxHp(m);
    if (fx.revive) return m.hp > 0 ? 'It won\'t have any effect.' : null;
    if (m.hp <= 0) return 'It won\'t have any effect on a fainted creature.';
    if (fx.heal && m.hp < max) return null;
    if (fx.cure && m.status && (fx.cure === 'all' || fx.cure === m.status)) return null;
    if (fx.pp && m.moves.some((x) => x.pp < G.MOVES[x.id].pp)) return null;
    if (fx.ppAll && m.moves.some((x) => x.pp < G.MOVES[x.id].pp)) return null;
    if (fx.levelup) return m.lv >= 100 ? 'It won\'t have any effect.' : null;
    return 'It won\'t have any effect.';
  };

  // use an item on a specific creature (overworld)
  G.useItemOn = async (id, m) => {
    const it = G.ITEMS[id], fx = it.fx;
    if (fx.teach) {
      if (!G.canLearnDisc(m, it)) { await G.say(G.monName(m) + ' can\'t learn ' + G.MOVES[fx.teach].name + '.'); return false; }
      if (m.moves.some((x) => x.id === fx.teach)) { await G.say(G.monName(m) + ' already knows ' + G.MOVES[fx.teach].name + '.'); return false; }
      return G.learnMove(m, fx.teach);
    }
    if (fx.evo) {
      const to = G.itemEvo(m, id);
      if (!to) { await G.say('It won\'t have any effect.'); return false; }
      G.takeItem(id); await G.evolveScene(m, to, false); return true;
    }
    if (!(fx.heal || fx.cure || fx.revive || fx.pp || fx.ppAll || fx.levelup)) { await G.say('That can\'t be used on a creature.'); return false; }
    const why = G.itemNoEffect(id, m);
    if (why) { await G.say(why); return false; }
    if (fx.levelup) {
      G.takeItem(id);
      const before = G.stats(m), lost = before.hp - m.hp;
      m.lv++; m.exp = Math.max(m.exp, G.expFor(G.SPECIES[m.sp].gr, m.lv));
      const after = G.stats(m); m.hp = after.hp - lost;
      sfx('levelup'); await G.say(G.monName(m) + ' reached level ' + m.lv + '!');
      for (const mv of G.movesAt(m.sp, m.lv)) await G.learnMove(m, mv);
      const to = G.lvEvo(m); if (to) await G.evolveScene(m, to, true);
      return true;
    }
    if (fx.pp) {
      const k = await G.askList('Restore which move?', m.moves.map((x) => G.MOVES[x.id].name + ' ' + x.pp + '/' + G.MOVES[x.id].pp), { cancel: -1, x: 150, y: 70 });
      if (k < 0) return false;
      G.takeItem(id); const mv = m.moves[k]; mv.pp = Math.min(G.MOVES[mv.id].pp, mv.pp + fx.pp);
      sfx('heal'); await G.say(G.MOVES[mv.id].name + '\'s EN was restored.'); return true;
    }
    G.takeItem(id);
    if (fx.revive) { m.hp = Math.max(1, Math.floor(G.maxHp(m) * fx.revive)); m.status = null; sfx('heal'); await G.say(G.monName(m) + ' was revived!'); return true; }
    const before = m.hp;
    if (fx.heal) m.hp = Math.min(G.maxHp(m), m.hp + fx.heal);
    if (fx.cure && (fx.cure === 'all' || fx.cure === m.status)) { m.status = null; m.slp = 0; }
    if (fx.ppAll) for (const x of m.moves) x.pp = Math.min(G.MOVES[x.id].pp, x.pp + fx.ppAll);
    sfx('heal');
    if (fx.heal && m.hp > before) await G.say(G.monName(m) + '\'s HP was restored by ' + (m.hp - before) + ' points.');
    else if (fx.ppAll) await G.say('EN was restored.');
    else await G.say(G.monName(m) + ' was cured!');
    return true;
  };

  // use from the bag in the overworld; returns 'close' to close the bag
  G.useItemField = async (id, bag) => {
    const it = G.ITEMS[id], fx = it.fx;
    if (fx.key === 'bike') {
      const map = G.MAPS[G.S.map];
      if (map.indoor || map.cave) { await G.say('You can\'t ride a bike here!'); return; }
      G.S.bike = !G.S.bike; await G.say(G.S.bike ? G.S.name + ' got on the Bicycle.' : G.S.name + ' got off the Bicycle.');
      G.audio.play(G.S.bike ? 'route' : (G.MAPS[G.S.map].music || 'town'), true);
      return 'close';
    }
    if (fx.key === 'rod') { if (bag) G.pop(bag, null); await G.world.fish(fx.rod); return; }
    if (fx.key === 'map') { await G.openRegionMap(false); return; }
    if (fx.key === 'fly') {
      const map = G.MAPS[G.S.map];
      if (map.indoor || map.cave) { await G.say('You can\'t use that here. Step outside first!'); return; }
      const dest = await G.openRegionMap(true);
      if (dest) { if (bag) G.pop(bag, null); await G.world.flyTo(dest); }
      return;
    }
    if (fx.key === 'share') { G.S.shareOn = !G.S.shareOn; await G.say('The Share Band was switched ' + (G.S.shareOn ? 'ON.' : 'OFF.')); return; }
    if (it.pocket === 'key') { await G.say('That can\'t be used here.'); return; }
    if (fx.repel) { G.takeItem(id); G.S.repel = fx.repel; sfx('heal'); await G.say(G.S.name + ' used the ' + it.name + '. Weak wild creatures will stay away.'); return; }
    if (fx.escape) {
      const map = G.MAPS[G.S.map];
      if (!map.cave && !map.dungeon) { await G.say('It can\'t be used here.'); return; }
      G.takeItem(id); if (bag) G.pop(bag, null); await G.world.escapeRope(); return;
    }
    if (fx.boost || fx.ball) { await G.say('That can only be used in battle.'); return; }
    if (it.pocket === 'items' && !fx.evo) { await G.say('That can\'t be used right now.'); return; }
    if (!G.S.party.length) { await G.say('You have no creatures!'); return; }
    while (true) {
      const t = await G.openParty({ mode: 'item', item: id, msg: 'Use on which creature?' });
      if (t < 0) return;
      await G.useItemOn(id, G.S.party[t]);
      if (!G.S.bag[id] || it.pocket !== 'med') return;
    }
  };

  // =====================================================================
  // DEX
  // =====================================================================
  class DexScene {
    constructor() { this.i = 0; this.top = 0; this.t = 0; }
    update() {
      this.t++; const n = G.DEX_ORDER.length;
      if (I().rep('up')) { this.i = Math.max(0, this.i - 1); sfx('move'); }
      if (I().rep('down')) { this.i = Math.min(n - 1, this.i + 1); sfx('move'); }
      if (I().rep('left')) { this.i = Math.max(0, this.i - 8); sfx('move'); }
      if (I().rep('right')) { this.i = Math.min(n - 1, this.i + 8); sfx('move'); }
      if (this.i < this.top) this.top = this.i; if (this.i > this.top + 9) this.top = this.i - 9;
      const id = G.DEX_ORDER[this.i];
      if (I().pressed('a') && G.S.dex.seen[id]) { sfx('select'); G.audio.cry(id); G.push(new DexEntry(id)); }
      if (I().pressed('b') || I().pressed('start')) { sfx('back'); G.pop(this); }
    }
    draw(c) {
      G.drawPattern(c, '#c84848', '#bc4040');
      c.fillStyle = '#7c2424'; c.fillRect(0, 0, 320, 22);
      G.text('WILDLING DEX', 10, 7, '#f8f0e0', { shadow: false });
      const ct = G.dexCount(); G.text('SEEN ' + ct.seen + '  CAUGHT ' + ct.caught, 310, 7, '#f8d8a0', { align: 'right', shadow: false, size: 7 });
      G.box(6, 28, 130, 150);
      const id = G.DEX_ORDER[this.i], sp = G.SPECIES[id];
      c.fillStyle = '#e8f0f0'; c.fillRect(12, 34, 118, 100);
      if (G.S.dex.seen[id]) c.drawImage(G.creatureSprite(id), 39, 50);
      else { c.globalAlpha = 0.25; c.drawImage(G.silhouette(G.creatureSprite(id), '#000000'), 39, 50); c.globalAlpha = 1; }
      G.text(G.S.dex.seen[id] ? sp.name : '?????', 70, 142, '#383838', { align: 'center' });
      if (G.S.dex.seen[id]) sp.types.forEach((t, k) => G.typeBadge(t, 20 + k * 52 + (sp.types.length === 1 ? 26 : 0), 158));
      G.box(140, 28, 176, 208);
      for (let r = 0; r < 10; r++) {
        const k = this.top + r; if (k >= G.DEX_ORDER.length) break;
        const sid = G.DEX_ORDER[k], y = 38 + r * 19;
        if (k === this.i) G.rrect(146, y - 4, 164, 17, '#f8e8a0');
        G.text(String(k + 1).padStart(3, '0'), 152, y, '#606878', { size: 7 });
        G.text(G.S.dex.seen[sid] ? G.SPECIES[sid].name : '----------', 194, y, '#383838', { size: 7 });
        if (G.S.dex.caught[sid]) c.drawImage(G.orbSprite('bindorb', 8), 296, y);
      }
      G.box(6, 182, 130, 54); G.text('A: details', 16, 196, '#606878', { size: 7 }); G.text('<> : page', 16, 212, '#606878', { size: 7 });
    }
  }
  class DexEntry {
    constructor(id) { this.id = id; }
    update() { if (I().pressed('b') || I().pressed('a') || I().pressed('start')) { sfx('back'); G.pop(this); } }
    draw(c) {
      const sp = G.SPECIES[this.id], own = G.S.dex.caught[this.id];
      G.drawPattern(c, '#c84848', '#bc4040');
      G.box(8, 8, 304, 224);
      c.fillStyle = '#e8f0f0'; c.fillRect(20, 20, 96, 96);
      c.drawImage(G.creatureSprite(this.id), 36, 36);
      G.text('No.' + String(sp.num).padStart(3, '0'), 130, 24, '#606878');
      G.text(sp.name, 130, 42, '#383838', { size: 10 });
      sp.types.forEach((t, k) => G.typeBadge(t, 130 + k * 48, 62));
      G.text('HT  ' + (own ? sp.ht.toFixed(1) + ' m' : '??? m'), 130, 84, '#383838', { size: 7 });
      G.text('WT  ' + (own ? sp.wt.toFixed(1) + ' kg' : '??? kg'), 130, 98, '#383838', { size: 7 });
      c.fillStyle = '#d8d0c8'; c.fillRect(20, 126, 280, 1);
      let y = 136;
      const text = own ? sp.dex : 'Catch one to learn more about this creature.';
      G.wrap(text, 270, 8).forEach((l) => { G.text(l, 24, y); y += 16; });
      if (own) {
        const evo = sp.evo; let t = '';
        if (evo) t = 'Evolves into ' + (G.S.dex.seen[evo.to] ? G.SPECIES[evo.to].name : '?????') + (evo.lv ? ' at Lv' + evo.lv : ' with a ' + G.ITEMS[evo.item].name);
        if (t) G.text(t, 24, 212, '#6870a0', { size: 7 });
      }
    }
  }
  G.openDex = () => G.push(new DexScene());

  // =====================================================================
  // STORAGE PC
  // =====================================================================
  class BoxScene {
    constructor(mode) { this.mode = mode; this.i = 0; this.t = 0; }
    box() { return G.S.boxes[G.S.curBox]; }
    update() {
      this.t++; const inp = I();
      if (this.mode === 'withdraw') {
        const n = 30;
        if (inp.rep('left')) { if (this.i % 6 === 0) { G.S.curBox = (G.S.curBox + G.BOXES - 1) % G.BOXES; } else this.i--; sfx('move'); }
        if (inp.rep('right')) { if (this.i % 6 === 5) { G.S.curBox = (G.S.curBox + 1) % G.BOXES; } else this.i++; sfx('move'); }
        if (inp.rep('up')) { this.i = (this.i + n - 6) % n; sfx('move'); }
        if (inp.rep('down')) { this.i = (this.i + 6) % n; sfx('move'); }
      } else {
        listNav(this, G.S.party.length);
        if (inp.pressed('left')) { G.S.curBox = (G.S.curBox + G.BOXES - 1) % G.BOXES; sfx('move'); }
        if (inp.pressed('right')) { G.S.curBox = (G.S.curBox + 1) % G.BOXES; sfx('move'); }
      }
      if (inp.pressed('a')) this.pick();
      if (inp.pressed('b') || inp.pressed('start')) { sfx('back'); G.pop(this); }
    }
    async pick() {
      if (this.busy) return; this.busy = true;
      try {
        if (this.mode === 'withdraw') {
          const m = this.box()[this.i]; if (!m) return; sfx('select');
          const k = await G.choose(['WITHDRAW', 'SUMMARY', 'RELEASE', 'CANCEL'], { cancel: 3, x: 214, y: 100 });
          if (k === 0) {
            if (G.S.party.length >= 6) { await G.say('Your team is full!'); return; }
            this.box().splice(this.i, 1); G.S.party.push(m); sfx('select'); await G.say(G.monName(m) + ' joined your team.');
          } else if (k === 1) await G.push(new SummaryScene(this.box(), this.i));
          else if (k === 2) {
            if (await G.ask('Release ' + G.monName(m) + ' back into the wild?')) { this.box().splice(this.i, 1); await G.say(G.monName(m) + ' was released. Bye-bye, ' + G.monName(m) + '!'); }
          }
        } else {
          const m = G.S.party[this.i]; if (!m) return; sfx('select');
          const k = await G.choose(['DEPOSIT', 'SUMMARY', 'CANCEL'], { cancel: 2, x: 214, y: 100 });
          if (k === 0) {
            if (G.S.party.filter((x) => x.hp > 0 && x !== m).length === 0) { await G.say('That\'s your last creature that can battle!'); return; }
            if (this.box().length >= G.BOX_SIZE) { await G.say('This box is full!'); return; }
            G.S.party.splice(this.i, 1); this.box().push(m); this.i = Math.min(this.i, G.S.party.length - 1);
            await G.say(G.monName(m) + ' was stored in Box ' + (G.S.curBox + 1) + '.');
          } else if (k === 1) await G.push(new SummaryScene(G.S.party, this.i));
        }
      } finally { this.busy = false; }
    }
    draw(c) {
      G.drawPattern(c, '#6c8cc8', '#6484c0');
      G.box(6, 6, 200, 24); G.text('<  BOX ' + (G.S.curBox + 1) + '  >', 106, 14, '#383838', { align: 'center' });
      G.box(6, 32, 200, 168);
      c.fillStyle = '#e4ecf8'; c.fillRect(12, 38, 188, 156);
      const b = this.box();
      for (let k = 0; k < 30; k++) {
        const x = 14 + (k % 6) * 31, y = 40 + Math.floor(k / 6) * 31; const m = b[k];
        if (this.mode === 'withdraw' && k === this.i) G.rrect(x - 1, y - 1, 30, 30, '#f8d860');
        if (m) c.drawImage(G.creatureIcon(m.sp, m.shiny), x - 2, y - 3);
      }
      G.box(210, 6, 104, 194);
      G.text('TEAM', 262, 14, '#383838', { align: 'center' });
      G.S.party.forEach((m, k) => {
        const y = 28 + k * 28;
        if (this.mode === 'deposit' && k === this.i) G.rrect(214, y - 2, 96, 28, '#f8e8a0');
        c.drawImage(G.creatureIcon(m.sp, m.shiny), 214, y - 4);
        G.text(G.monName(m).slice(0, 7), 246, y + 4, '#383838', { size: 7 }); G.text('Lv' + m.lv, 246, y + 14, '#606878', { size: 6 });
      });
      G.box(4, 202, 312, 34);
      const sel = this.mode === 'withdraw' ? b[this.i] : G.S.party[this.i];
      G.text(sel ? G.monName(sel) + '  Lv' + sel.lv + (sel.shiny ? '  *' : '') : (this.mode === 'withdraw' ? 'Withdraw: pick a creature.' : ''), 16, 214);
    }
  }
  G.usePC = async () => {
    G.audio.sfx('select');
    await G.say(G.S.name + ' switched on the PC.');
    while (true) {
      const k = await G.askList('Creature storage terminal ready.', ['WITHDRAW', 'DEPOSIT', 'LOG OFF'], { cancel: 2, x: 200, y: 96 });
      if (k === 0) await G.push(new BoxScene('withdraw'));
      else if (k === 1) await G.push(new BoxScene('deposit'));
      else break;
    }
  };

  // =====================================================================
  // SHOP
  // =====================================================================
  class BuyScene {
    constructor(stock) { this.stock = stock; this.i = 0; this.overlay = false; }
    update() {
      listNav(this, this.stock.length + 1);
      if (I().pressed('a')) { sfx('select'); if (this.i === this.stock.length) { G.pop(this); return; } this.buy(this.stock[this.i]); }
      if (I().pressed('b')) { sfx('back'); G.pop(this); }
    }
    async buy(id) {
      if (this.busy) return; this.busy = true;
      try {
        const it = G.ITEMS[id];
        if (G.S.money < it.price) { await G.say('You don\'t have enough money.'); return; }
        const n = await G.pickNumber(Math.min(99, Math.floor(G.S.money / it.price)), { price: it.price });
        if (!n) return;
        if (!(await G.ask(n + ' x ' + it.name + ' will cost $' + n * it.price + '. Buy them?'))) return;
        G.S.money -= n * it.price; G.giveItem(id, n); sfx('buy');
        await G.say('Thanks for shopping!');
        if (id === 'bindorb' && n >= 10) { G.giveItem('greatorb', 1); await G.say('You bought a bunch, so here\'s a Snare Orb on the house!'); }
      } finally { this.busy = false; }
    }
    draw(c) {
      G.drawPattern(c, '#58a0d8', '#5098d0');
      G.box(6, 6, 120, 30); G.text('$' + G.S.money, 116, 17, '#383838', { align: 'right' });
      G.box(130, 6, 186, 176);
      this.stock.forEach((id, k) => {
        const y = 16 + k * 18, it = G.ITEMS[id];
        c.drawImage(G.itemIcon(id), 142, y - 3);
        G.text(it.name, 162, y + 1, '#383838', { size: it.name.length > 12 ? 6 : 7 });
        G.text('$' + it.price, 306, y + 1, '#383838', { align: 'right', size: 7 });
      });
      G.text('CANCEL', 162, 16 + this.stock.length * 18 + 1, '#383838', { size: 7 });
      G.cursor(134, 16 + this.i * 18);
      G.box(4, 186, 312, 50);
      const id = this.stock[this.i];
      if (id) { let y = 198; G.wrap(G.ITEMS[id].desc, 290, 7).forEach((l) => { G.text(l, 14, y, '#383838', { size: 7 }); y += 12; }); G.text('In bag: ' + (G.S.bag[id] || 0), 306, 222, '#606878', { align: 'right', size: 7 }); }
    }
  }
  G.shop = async (stock) => {
    await G.say('Hello! Looking for supplies?');
    while (true) {
      const k = await G.askList('What would you like to do?', ['BUY', 'SELL', 'QUIT'], { cancel: 2, x: 230, y: 110 });
      if (k === 0) await G.push(new BuyScene(stock));
      else if (k === 1) {
        await G.openBag({
          sell: async (bag, id) => {
            const it = G.ITEMS[id];
            if (it.pocket === 'key' || it.pocket === 'discs' || !it.price) { await G.say('Sorry, I can\'t buy that.'); return; }
            const price = Math.floor(it.price / 2);
            const n = await G.pickNumber(G.S.bag[id], { price }); if (!n) return;
            if (await G.ask('I\'ll give you $' + n * price + ' for that. Deal?')) { G.takeItem(id, n); G.S.money += n * price; sfx('buy'); await G.say('Turned over the ' + it.name + ' and got $' + n * price + '.'); }
          },
        });
      } else break;
    }
    await G.say('Please come again!');
  };

  // =====================================================================
  // OPTIONS / CARD / SAVE / START MENU
  // =====================================================================
  class OptionsScene {
    constructor() { this.i = 0; }
    rows() {
      const o = G.S.options;
      return [
        ['TEXT SPEED', ['SLOW', 'MID', 'FAST', 'INSTANT'], 'textSpeed', o.textSpeed],
        ['BATTLE ANIMS', ['ON', 'OFF'], 'anims', o.anims ? 0 : 1],
        ['MUSIC', ['ON', 'OFF'], 'music', o.music !== false ? 0 : 1],
        ['SOUND', ['ON', 'OFF'], 'sound', o.sound !== false ? 0 : 1],
      ];
    }
    update() {
      const rows = this.rows(); listNav(this, rows.length + 1);
      const r = rows[this.i];
      if (r && (I().pressed('left') || I().pressed('right'))) {
        const d = I().pressed('left') ? -1 : 1; const n = r[1].length; const v = (r[3] + d + n) % n;
        if (r[2] === 'textSpeed') G.S.options.textSpeed = v; else G.S.options[r[2]] = v === 0;
        G.audio.applyOptions(); if (r[2] === 'music' && v === 0) G.audio.play(G.audio.curName || (G.MAPS[G.S.map] && G.MAPS[G.S.map].music) || 'town', true);
        sfx('move');
      }
      if ((I().pressed('a') && this.i === rows.length) || I().pressed('b') || I().pressed('start')) { sfx('back'); G.pop(this); }
    }
    draw(c) {
      G.drawPattern(c, '#8c8cb8', '#8484b0');
      G.box(20, 20, 280, 200);
      G.text('OPTIONS', 160, 32, '#383838', { align: 'center' });
      this.rows().forEach((r, k) => {
        const y = 62 + k * 30;
        G.text(r[0], 44, y, '#383838', { size: 7 });
        r[1].forEach((v, j) => G.text(v, 150 + j * (r[1].length > 2 ? 38 : 50), y, j === r[3] ? '#d04040' : '#a0a0a8', { size: 7 }));
        if (k === this.i) G.cursor(32, y);
      });
      G.text('DONE', 44, 62 + 4 * 30, '#383838', { size: 7 }); if (this.i === 4) G.cursor(32, 62 + 4 * 30);
      G.text('Left/Right to change', 160, 200, '#7c7c98', { align: 'center', size: 7 });
    }
  }
  class CardScene {
    update() { if (I().pressed('a') || I().pressed('b') || I().pressed('start')) { sfx('back'); G.pop(this); } }
    draw(c) {
      G.drawPattern(c, '#58a878', '#50a070');
      G.box(16, 20, 288, 200);
      c.fillStyle = '#e8f4ec'; c.fillRect(24, 28, 272, 22);
      G.text('TRAINER CARD', 32, 35, '#3c6c4c');
      G.text('IDNo.' + G.S.playerId, 288, 35, '#3c6c4c', { align: 'right', size: 7 });
      G.text('NAME: ' + G.S.name, 34, 64);
      G.text('MONEY: $' + G.S.money, 34, 84);
      G.text('DEX: ' + G.dexCount().caught, 34, 104);
      const t = Math.floor(G.S.time); G.text('TIME: ' + Math.floor(t / 3600) + ':' + String(Math.floor(t / 60) % 60).padStart(2, '0'), 34, 124);
      c.drawImage(G.portrait(G.S.look, 4), 210, 56);
      c.fillStyle = '#d8e8dc'; c.fillRect(24, 150, 272, 60);
      G.text('SIGILS', 34, 156, '#3c6c4c', { size: 7 });
      const B = [['stone', '#a89878'], ['ember', '#f07838'], ['storm', '#f0c828'], ['tide', '#4c94e4'], ['frost', '#98e0f0']];
      B.forEach(([b, col], k) => {
        const x = 46 + k * 40, y = 180, has = G.S.badges.includes(b);
        c.fillStyle = has ? '#28202c' : '#b8c8bc'; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x + 12, y); c.lineTo(x, y + 12); c.lineTo(x - 12, y); c.fill();
        if (has) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 9, y); c.lineTo(x, y + 9); c.lineTo(x - 9, y); c.fill(); c.fillStyle = '#fff'; c.fillRect(x - 3, y - 5, 2, 2); }
      });
      if (G.hasFlag('champion')) { G.text('CHAMPION', 160, 196, '#d09010', { align: 'center' }); }
    }
  }
  // =====================================================================
  // VERDANIA MAP (and fast travel picker)
  // =====================================================================
  class RegionMap {
    constructor(fly) {
      this.fly = fly; this.t = 0;
      this.nodes = Object.keys(G.REGION);
      const towns = this.nodes.filter((k) => G.REGION[k][3] === 'town' && (!fly || (G.S.visited || {})[k]));
      this.towns = towns.length ? towns : ['fernhollow'];
      const cur = G.S.region || 'fernhollow';
      this.i = Math.max(0, fly ? this.towns.indexOf(cur) : this.towns.indexOf(cur));
      if (this.i < 0) this.i = 0;
    }
    update() {
      this.t++; const n = this.towns.length;
      if (G.input.rep('up') || G.input.rep('left')) { this.i = (this.i + n - 1) % n; sfx('move'); }
      if (G.input.rep('down') || G.input.rep('right')) { this.i = (this.i + 1) % n; sfx('move'); }
      if (G.input.pressed('a') && this.fly) { sfx('select'); G.pop(this, this.towns[this.i]); }
      else if (G.input.pressed('b') || G.input.pressed('start') || (G.input.pressed('a') && !this.fly)) { sfx('back'); G.pop(this, null); }
    }
    draw(c) {
      c.fillStyle = '#3c6c9c'; c.fillRect(0, 0, 320, 240);
      c.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 12; i++) c.fillRect(0, i * 20 + (this.t / 3) % 20, 320, 2);
      // landmass
      c.fillStyle = '#d8c890'; c.beginPath(); c.moveTo(20, 230); c.lineTo(14, 120); c.lineTo(40, 30); c.lineTo(120, 4); c.lineTo(230, 20); c.lineTo(300, 70); c.lineTo(306, 150); c.lineTo(270, 168); c.lineTo(160, 160); c.lineTo(90, 230); c.closePath(); c.fill();
      c.fillStyle = '#8cc070'; c.beginPath(); c.moveTo(28, 222); c.lineTo(24, 124); c.lineTo(48, 40); c.lineTo(120, 14); c.lineTo(226, 30); c.lineTo(292, 74); c.lineTo(296, 146); c.lineTo(266, 158); c.lineTo(160, 150); c.lineTo(86, 222); c.closePath(); c.fill();
      c.fillStyle = '#e8f0f8'; c.beginPath(); c.moveTo(60, 40); c.lineTo(120, 14); c.lineTo(190, 22); c.lineTo(170, 58); c.lineTo(90, 50); c.fill();
      c.fillStyle = '#a89070'; c.beginPath(); c.moveTo(100, 112); c.lineTo(140, 112); c.lineTo(150, 150); c.lineTo(104, 150); c.fill();
      c.strokeStyle = '#f8f0d0'; c.lineWidth = 3;
      for (const [a, b] of G.REGION_LINKS) { const A = G.REGION[a], B = G.REGION[b]; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); }
      const cur = G.S.region;
      for (const k of this.nodes) {
        const [x, y, , kind] = G.REGION[k]; const seen = kind !== 'town' || (G.S.visited || {})[k];
        c.fillStyle = '#28202c'; c.fillRect(x - 5, y - 5, 10, 10);
        c.fillStyle = kind === 'town' ? (seen ? '#e05050' : '#a0a0a0') : kind === 'cave' ? '#8c6c48' : '#f8e070';
        c.fillRect(x - 4, y - 4, 8, 8);
        if (k === cur && (this.t >> 4) % 2) { c.fillStyle = '#ffffff'; c.fillRect(x - 2, y - 2, 4, 4); }
      }
      const sel = this.towns[this.i], [sx, sy] = G.REGION[sel];
      G.cursor(sx - 14, sy - 4, '#ffffff');
      G.box(4, 200, 312, 36);
      const label = this.fly ? 'Fly to: ' + G.REGION[sel][2] + '?' : 'You are here: ' + ((G.REGION[cur] || G.REGION.fernhollow)[2]);
      G.text(label, 16, 210);
      G.text(this.fly ? 'Arrows: choose   A: fly   B: cancel' : 'Arrows: browse towns   B: close', 16, 224, '#6c7890', { size: 6 });
      if (!this.fly) G.text(G.REGION[sel][2], sx, sy + 10, '#ffffff', { size: 6, align: 'center', shadowCol: 'rgba(0,0,0,0.6)' });
    }
  }
  G.openRegionMap = (fly) => G.push(new RegionMap(fly));

  G.saveFlow = async () => {
    if (!(await G.ask('Would you like to save the game?'))) return false;
    await G.say('Saving... Please don\'t close the game.', { auto: 30 });
    const ok = G.saveGame();
    G.audio.sfx('save');
    await G.say(ok ? G.S.name + ' saved the game.' : 'The save failed! Storage may be full or blocked.');
    return ok;
  };
  G.openStartMenu = async () => {
    sfx('select');
    let last = G.S.lastMenu || 0;
    while (true) {
      const items = [];
      if (G.hasFlag('dex')) items.push('DEX');
      if (G.S.party.length) items.push('TEAM');
      items.push('BAG');
      if (G.hasItem('townmap')) items.push('MAP');
      items.push(G.S.name, 'SAVE', 'OPTIONS', 'EXIT');
      const k = await G.choose(items, { cancel: items.length - 1, x: 222, y: 4, w: 94, start: Math.min(last, items.length - 1) });
      last = k; G.S.lastMenu = k;
      const s = items[k];
      if (s === 'DEX') await G.openDex();
      else if (s === 'TEAM') await G.openParty({ mode: 'menu' });
      else if (s === 'BAG') await G.openBag({});
      else if (s === 'MAP') await G.openRegionMap(false);
      else if (s === G.S.name) await G.push(new CardScene());
      else if (s === 'SAVE') { await G.saveFlow(); }
      else if (s === 'OPTIONS') await G.push(new OptionsScene());
      else break;
      if (G.world && G.world.pendingClose) { G.world.pendingClose = false; break; }
    }
  };
})();
