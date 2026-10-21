'use strict';
// Creature instances: stats, temperaments, experience, moves, evolution, party/box storage.
(function () {
  const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  G.STAT_NAMES = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed', acc: 'accuracy', eva: 'evasion' };
  const ADJ = {
    atk: { def: 'Reckless', spa: 'Gritty', spd: 'Rowdy', spe: 'Stubborn' },
    def: { atk: 'Gentle', spa: 'Stoic', spd: 'Prickly', spe: 'Patient' },
    spa: { atk: 'Dreamy', def: 'Curious', spd: 'Fiery', spe: 'Studious' },
    spd: { atk: 'Kindly', def: 'Serene', spa: 'Earnest', spe: 'Polite' },
    spe: { atk: 'Skittish', def: 'Restless', spa: 'Zippy', spd: 'Hasty' },
  };
  G.NATURES = {};
  for (const up in ADJ) for (const down in ADJ[up]) G.NATURES[ADJ[up][down]] = { up, down };
  for (const n of ['Even', 'Mellow', 'Plain', 'Balanced', 'Easygoing']) G.NATURES[n] = { up: null, down: null };
  const NATURE_LIST = Object.keys(G.NATURES);

  G.expFor = (gr, lv) => { if (lv <= 1) return 0; const c = lv * lv * lv; return Math.floor(gr === 'fast' ? c * 0.8 : gr === 'slow' ? c * 1.25 : c); };

  let uidC = Date.now() % 100000;
  G.makeMon = (spId, lv, o = {}) => {
    const sp = G.SPECIES[spId]; if (!sp) throw new Error('no species ' + spId);
    let rate = G.SHINY_RATE; if (G.S && G.S.bag && G.S.bag.shinycharm) rate *= 3;
    const m = {
      uid: (uidC++) + '-' + Math.floor(Math.random() * 1e6),
      sp: spId, nick: null, lv, exp: G.expFor(sp.gr, lv),
      ivs: {}, nature: o.nature || G.pick(NATURE_LIST), ability: G.pick(sp.ab),
      moves: [], hp: 1, status: null, slp: 0,
      shiny: o.shiny != null ? o.shiny : Math.random() < rate,
      ot: o.ot || null, otId: o.otId || null, ball: o.ball || 'bindorb', met: o.met || '', metLv: lv,
    };
    for (const s of STATS) m.ivs[s] = o.ivs ? o.ivs : G.ri(0, 31);
    const mv = o.moves || G.defaultMoves(spId, lv);
    m.moves = mv.map((id) => ({ id, pp: G.MOVES[id].pp }));
    m.hp = G.stats(m).hp;
    return m;
  };
  G.stats = (m) => {
    const sp = G.SPECIES[m.sp], nat = G.NATURES[m.nature] || {}, out = {};
    STATS.forEach((s, i) => {
      const b = sp.base[i], iv = m.ivs[s] || 0;
      if (s === 'hp') out.hp = Math.floor(((2 * b + iv) * m.lv) / 100) + m.lv + 10;
      else {
        let v = Math.floor(((2 * b + iv) * m.lv) / 100) + 5;
        if (nat.up === s) v = Math.floor(v * 1.1); if (nat.down === s) v = Math.floor(v * 0.9);
        out[s] = v;
      }
    });
    return out;
  };
  G.maxHp = (m) => G.stats(m).hp;
  G.monName = (m) => m.nick || G.SPECIES[m.sp].name;
  G.defaultMoves = (spId, lv) => {
    const out = [];
    for (const [l, id] of G.SPECIES[spId].learn) if (l <= lv) { const i = out.indexOf(id); if (i >= 0) out.splice(i, 1); out.push(id); }
    return out.slice(-4);
  };
  G.movesAt = (spId, lv) => G.SPECIES[spId].learn.filter(([l]) => l === lv).map(([, id]) => id);
  G.healMon = (m) => { m.hp = G.maxHp(m); m.status = null; m.slp = 0; for (const mv of m.moves) mv.pp = G.MOVES[mv.id].pp; };
  G.healParty = () => G.S.party.forEach(G.healMon);
  G.ableMons = () => G.S.party.filter((m) => m.hp > 0);
  G.expToNext = (m) => { const sp = G.SPECIES[m.sp]; return m.lv >= 100 ? 0 : G.expFor(sp.gr, m.lv + 1) - m.exp; };
  G.expFrac = (m) => { const sp = G.SPECIES[m.sp]; if (m.lv >= 100) return 1; const a = G.expFor(sp.gr, m.lv), b = G.expFor(sp.gr, m.lv + 1); return (m.exp - a) / (b - a); };
  G.lvEvo = (m) => { const e = G.SPECIES[m.sp].evo; return e && e.lv && m.lv >= e.lv ? e.to : null; };
  G.itemEvo = (m, item) => { const e = G.SPECIES[m.sp].evo; return e && e.item === item ? e.to : null; };
  G.evolveMon = (m, to) => {
    const before = G.maxHp(m), wasNamed = m.nick && m.nick !== G.SPECIES[m.sp].name;
    m.sp = to; if (!wasNamed) m.nick = null;
    const after = G.maxHp(m); if (m.hp > 0) m.hp = Math.min(after, m.hp + (after - before));
    G.dexCatch(to);
  };

  // ---------- dex ----------
  G.dexSee = (id) => { if (G.S) G.S.dex.seen[id] = 1; };
  G.dexCatch = (id) => { if (G.S) { G.S.dex.seen[id] = 1; G.S.dex.caught[id] = 1; } };
  G.dexCount = () => ({ seen: Object.keys(G.S.dex.seen).length, caught: Object.keys(G.S.dex.caught).length });

  // ---------- storage ----------
  G.BOXES = 8; G.BOX_SIZE = 30;
  // returns 'party' or the box number it went to, or null if all full
  G.storeMon = (m) => {
    G.dexCatch(m.sp);
    if (G.S.party.length < 6) { G.S.party.push(m); return 'party'; }
    for (let k = 0; k < G.BOXES; k++) {
      const b = (G.S.curBox + k) % G.BOXES;
      if (G.S.boxes[b].length < G.BOX_SIZE) { G.S.boxes[b].push(m); return b; }
    }
    return null;
  };

  // ---------- bag ----------
  G.giveItem = (id, n = 1) => { G.S.bag[id] = (G.S.bag[id] || 0) + n; };
  G.takeItem = (id, n = 1) => { if (!G.S.bag[id]) return false; G.S.bag[id] -= n; if (G.S.bag[id] <= 0) delete G.S.bag[id]; return true; };
  G.hasItem = (id) => (G.S.bag[id] || 0) > 0;
  G.bagList = (pocket) => Object.keys(G.S.bag).filter((id) => G.ITEMS[id] && G.ITEMS[id].pocket === pocket && G.S.bag[id] > 0)
    .sort((a, b) => Object.keys(G.ITEMS).indexOf(a) - Object.keys(G.ITEMS).indexOf(b));

  // ---------- daycare: one exp per step, learns moves on its own ----------
  G.daycareStep = () => {
    const d = G.S.daycare, m = d.mon, sp = G.SPECIES[m.sp];
    if (m.lv >= 100) return;
    m.exp++;
    while (m.lv < 100 && m.exp >= G.expFor(sp.gr, m.lv + 1)) {
      m.lv++;
      for (const id of G.movesAt(m.sp, m.lv)) {
        if (m.moves.some((x) => x.id === id)) continue;
        if (m.moves.length >= 4) m.moves.shift();
        m.moves.push({ id, pp: G.MOVES[id].pp });
      }
    }
  };

  // ---------- new game state ----------
  G.newState = (name, rival) => ({
    v: 1, name, rival, money: 3000, playerId: G.ri(10000, 65535),
    party: [], boxes: Array.from({ length: 8 }, () => []), curBox: 0,
    bag: { potion: 1 }, flags: {}, badges: [], dex: { seen: {}, caught: {} },
    map: 'home', x: 4, y: 5, dir: 'up', heal: { map: 'home', x: 4, y: 5 },
    time: 0, steps: 0, repel: 0, bike: false,
    options: { textSpeed: 1, anims: true, music: true, sound: true },
    visited: { fernhollow: 1 }, daycare: null, shareOn: false, trades: {},
  });
})();
