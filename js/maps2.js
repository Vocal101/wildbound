'use strict';
// Expansion: bigger towns and routes, new regions (marsh, Mistmere, Whisperwood, Frostvale,
// Frost Hollow, Sunken Ruins, lower Whisper Cave), many more characters and trainers.
(function () {
  const M = G.MAPS, L = G.LOOKS, { haven, shop, house, hall, TR } = G.MAPT;

  // ---------- extra looks ----------
  Object.assign(L, {
    coralie: { hair: '#3cb8c8', shirt: '#2c6cb8', pants: '#f0f0f8', shoes: '#3cb8c8', style: 'long' },
    halden: { hair: '#e8f0f8', shirt: '#5c9cd8', pants: '#2c3c58', shoes: '#f0f8ff', style: 'short' },
    juno: { hair: '#c84c6c', shirt: '#f0e070', pants: '#4c4c6c', shoes: '#c84c6c', style: 'cap', accent: '#2c2c3c' },
    tobin: { hair: '#6c4c2c', shirt: '#f4f4f4', pants: '#4c7c4c', shoes: '#3c3c48', style: 'short' },
    daycare: { hair: '#c8b8a8', shirt: '#e89c58', pants: '#6c4c3c', shoes: '#4c3028', style: 'long' },
    mystic: { hair: '#7c4cb8', shirt: '#3c2c5c', pants: '#2c2040', shoes: '#7c4cb8', style: 'long' },
    wanderer: { hair: '#8c6c48', shirt: '#7c9c5c', pants: '#5c4c3c', shoes: '#3c2c1c', style: 'cap', accent: '#5c7c3c' },
    skier: { hair: '#f0c048', shirt: '#e84858', pants: '#2c3c6c', shoes: '#f0f0f8', style: 'cap', accent: '#f0f0f8' },
    diver: { hair: '#2c4c6c', shirt: '#2c8cb8', pants: '#2c4c6c', shoes: '#2c4c6c', style: 'short' },
    ranger: { hair: '#3c2c1c', shirt: '#4c7c3c', pants: '#5c4c34', shoes: '#2c2c1c', style: 'cap', accent: '#4c7c3c' },
    fortune: { hair: '#2c2c3c', shirt: '#b84c9c', pants: '#4c2c5c', shoes: '#f0c048', style: 'long' },
    farmer: { hair: '#a87c4c', shirt: '#c8a858', pants: '#3c5c8c', shoes: '#4c3020', style: 'cap', accent: '#e8d070' },
    tutor: { hair: '#4c4c58', shirt: '#9c3c3c', pants: '#2c2c34', shoes: '#2c2c2c', style: 'short' },
    hale: { hair: '#5c3c3c', shirt: '#58a8c8', pants: '#4c4c6c', shoes: '#6c3c2c', style: 'long' },
    ott: { hair: '#f0f0f0', shirt: '#6c5c8c', pants: '#3c3c48', shoes: '#3c3028', style: 'short' },
    sage: { hair: '#d8d8d8', shirt: '#5c8c8c', pants: '#2c4c4c', shoes: '#2c2c2c', style: 'long' },
    engineer: { hair: '#3c3c3c', shirt: '#e8b048', pants: '#4c4c58', shoes: '#2c2c2c', style: 'cap', accent: '#e8b048' },
  });

  // ---------- map builder ----------
  class MB {
    constructor(w, h, fill = 'T') { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => new Array(w).fill(fill)); }
    set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = c; return this; }
    rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); return this; }
    // axis-aligned polyline, t tiles thick (grows right/down)
    path(c, t, ...p) { for (let k = 0; k + 3 < p.length; k += 2) { const [x0, y0, x1, y1] = p.slice(k, k + 4); this.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) + t, Math.abs(y1 - y0) + t, c); } return this; }
    scatter(x, y, w, h, c, n, seed = 1, on = '.') {
      let s = seed * 7919 + 13;
      const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      for (let k = 0; k < n * 8 && n > 0; k++) { const i = x + Math.floor(rnd() * w), j = y + Math.floor(rnd() * h); if (this.g[j] && this.g[j][i] === on) { this.g[j][i] = c; n--; } }
      return this;
    }
    rows() { return this.g.map((r) => r.join('')); }
  }
  G.MB = MB;

  // =====================================================================
  // FERNHOLLOW (bigger)
  // =====================================================================
  {
    const b = new MB(28, 24); b.rect(2, 2, 24, 20, '.');
    b.rect(13, 0, 2, 11, '='); b.rect(5, 9, 19, 1, '='); b.rect(18, 9, 2, 10, '='); b.rect(5, 18, 19, 1, '=');
    b.rect(3, 20, 6, 2, '~'); b.scatter(2, 2, 24, 18, '*', 14, 3); b.set(11, 10, 'S');
    M.fernhollow = {
      name: 'Fernhollow Town', music: 'town', bg: 'grass', region: 'fernhollow', rows: b.rows(),
      buildings: [
        { kind: 'home', x: 4, y: 5, to: 'home', tx: 4, ty: 6 },
        { kind: 'house', x: 19, y: 5, to: 'rivalhouse', tx: 4, ty: 5 },
        { kind: 'lab', x: 10, y: 14, to: 'lab', tx: 5, ty: 8 },
        { kind: 'house', x: 4, y: 14, to: 'fern_house', tx: 4, ty: 5 },
        { kind: 'hut', x: 21, y: 15, to: 'fern_hut', tx: 4, ty: 5 },
      ],
      exits: { n: { to: 'route1', d: 0 } },
      signs: [{ x: 11, y: 10, text: 'FERNHOLLOW TOWN - "Where every journey takes root."' }],
      npcs: [
        { x: 9, y: 11, look: L.girl, move: 'wander', talk: ['Professor Wren\'s lab is the big white building down south.', 'He studies how people and wild creatures live together.'] },
        { x: 9, y: 20, dir: 'left', look: L.old, speaker: 'Old Man', talk: () => G.story.oldFisher() },
        { x: 24, y: 12, look: L.kid, move: 'wander', talk: ['If you get hurt out there, go home and your mom will patch you up!'] },
        { x: 15, y: 6, look: L.woman, move: 'turn', talk: ['Mrs. Hale next to the lab draws maps of the whole region. She\'s ever so clever.'] },
        { x: 23, y: 20, look: L.man, move: 'wander', talk: ['I used to be a trainer. Now I just grow tomatoes. Both are hard work!'] },
      ],
      triggers: [{ x: 13, y: 1, w: 2, h: 1, cond: '!starter', run: () => G.story.stopLeaving() }],
      wild: { fish1: { list: [['minnox', 4, 7, 80], ['crabbit', 5, 7, 20]] }, fish2: { list: [['minnox', 12, 16, 60], ['reefhorn', 18, 20, 10], ['crabbit', 12, 16, 30]] } },
    };
  }
  house('fern_house', 'Hale House', 'fernhollow', 6, 18, [
    { x: 6, y: 2, dir: 'down', look: L.hale, speaker: 'Mrs. Hale', talk: () => G.story.townMapGift() },
    { x: 2, y: 4, look: L.kid, move: 'wander', talk: ['Mom made a map of every town and route in Verdania! I helped color the lakes.'] },
  ]);
  house('fern_hut', 'Storyteller\'s Hut', 'fernhollow', 22, 18, [
    { x: 6, y: 2, dir: 'down', look: L.ott, speaker: 'Grandpa Ott', talk: () => G.story.ottLore() },
  ]);

  // =====================================================================
  // ROUTE 1 (longer)
  // =====================================================================
  {
    const b = new MB(24, 46); b.rect(2, 1, 20, 44, '.');
    b.path('=', 2, 13, 45, 13, 35, 6, 35, 6, 21, 16, 21, 16, 0);
    b.rect(16, 38, 6, 6, ','); b.rect(2, 38, 4, 6, ','); b.rect(9, 25, 6, 8, ','); b.rect(17, 26, 5, 6, ',');
    b.rect(2, 10, 8, 7, ','); b.rect(19, 3, 3, 10, ','); b.rect(3, 2, 10, 4, ',');
    b.rect(8, 34, 14, 1, 'L'); b.rect(2, 18, 14, 1, 'L');
    b.rect(10, 7, 3, 3, 'T'); b.rect(18, 15, 3, 2, 'T'); b.rect(9, 39, 4, 3, '~');
    b.scatter(2, 1, 20, 44, '*', 12, 5); b.set(15, 43, 'S');
    M.route1 = {
      name: 'Route 1', music: 'route', bg: 'grass', region: 'route1', rows: b.rows(),
      exits: { s: { to: 'fernhollow', d: 0 }, n: { to: 'brookvale', d: 0 } },
      signs: [{ x: 15, y: 43, text: 'ROUTE 1 - North: Brookvale City. South: Fernhollow Town.' }],
      items: [{ x: 21, y: 2, item: 'potion' }, { x: 3, y: 44, item: 'bindorb', n: 3 }, { x: 21, y: 44, item: 'berry', n: 2 }, { x: 13, y: 9, item: 'potion', hidden: true }, { x: 4, y: 7, item: 'repel' }],
      npcs: [
        { x: 5, y: 28, dir: 'right', look: L.youngster, sight: 4, trainer: TR('Scout', 'Pip', L.youngster, [['nibbit', 4], ['pipwing', 4]], { base: 16, intro: 'Hey! You\'re a trainer, right? Let\'s battle!', lose: 'Aw man, my creatures need more training...', after: 'I\'m gonna catch a stronger creature in the tall grass!' }) },
        { x: 18, y: 10, dir: 'left', look: L.lass, sight: 4, trainer: TR('Daydreamer', 'Ivy', L.lass, [['larvine', 5], ['puffkin', 5]], { base: 16, intro: 'Let\'s see if you\'re any good!', lose: 'Oh! You\'re pretty good!', after: 'Puffkin is so fluffy. I can\'t stop hugging it.' }) },
        { x: 15, y: 40, dir: 'left', look: L.kid, sight: 3, trainer: TR('Scout', 'Lina', L.kid, [['moundle', 4]], { base: 16, intro: 'My Moundle dug its way here all by itself!', lose: 'Back into your tunnel, Moundle...', after: 'Moundle love digging near the path.' }) },
        { x: 4, y: 20, dir: 'right', look: L.bug, sight: 3, trainer: TR('Bug Fan', 'Tad', L.bug, [['larvine', 5], ['larvine', 6]], { base: 12, intro: 'Two Larvine are better than one!', lose: 'Squish...', after: 'Larvine evolve super quickly. Raise one!' }) },
        { x: 10, y: 43, look: L.man, move: 'wander', talk: () => G.story.route1Helper() },
        { x: 20, y: 20, look: L.oldlady, move: 'turn', talk: ['Ledges only let you hop down. Plan your route before you jump!'] },
      ],
      wild: { grass: { rate: 11, list: [['pipwing', 2, 4, 30], ['nibbit', 2, 4, 30], ['larvine', 3, 4, 18], ['moundle', 3, 5, 12], ['puffkin', 3, 5, 6], ['duskwing', 3, 4, 12, 'night'], ['sporelet', 3, 4, 4]] },
        fish1: { list: [['minnox', 4, 7, 90], ['crabbit', 5, 7, 10]] }, fish2: { list: [['minnox', 12, 16, 70], ['crabbit', 12, 16, 30]] } },
    };
  }

  // =====================================================================
  // BROOKVALE CITY (bigger, with a brook)
  // =====================================================================
  {
    const b = new MB(34, 30); b.rect(2, 2, 30, 26, '.');
    b.rect(16, 0, 2, 30, '='); b.rect(2, 12, 30, 2, '~'); b.rect(16, 12, 2, 2, 'B');
    b.rect(5, 8, 24, 1, '='); b.rect(5, 21, 24, 1, '=');
    b.scatter(2, 2, 30, 26, '*', 16, 7); b.set(19, 26, 'S');
    M.brookvale = {
      name: 'Brookvale City', music: 'town', bg: 'grass', region: 'brookvale', town: 'brookvale', rows: b.rows(),
      buildings: [
        { kind: 'haven', x: 5, y: 4, to: 'brook_haven', tx: 6, ty: 6 },
        { kind: 'house', x: 11, y: 4, to: 'brook_office', tx: 4, ty: 5 },
        { kind: 'house', x: 19, y: 4, to: 'brook_house2', tx: 4, ty: 5 },
        { kind: 'shop', x: 24, y: 4, to: 'brook_shop', tx: 5, ty: 5 },
        { kind: 'house', x: 4, y: 16, to: 'brook_house', tx: 4, ty: 5 },
        { kind: 'hall', x: 22, y: 15, to: 'brook_hall', tx: 5, ty: 10 },
        { kind: 'hut', x: 10, y: 23, to: 'brook_hut', tx: 4, ty: 5 },
      ],
      exits: { s: { to: 'route1', d: 0 }, n: { to: 'route2', d: 0 } },
      signs: [{ x: 19, y: 26, text: 'BROOKVALE CITY - "A city built on solid stone."' }],
      npcs: [
        { id: 'grunt_a', x: 16, y: 1, dir: 'down', look: L.grunt, cond: '!badge1', speaker: 'Grunt', talk: ['This road is closed by order of the Hollow Syndicate!', 'Scram, kid. Unless you think you can take on a Warden... hah!'] },
        { id: 'grunt_b', x: 17, y: 1, dir: 'down', look: L.grunt, cond: '!badge1', speaker: 'Grunt', talk: ['We\'re, uh, doing very important digging up north. Nothing suspicious. Go away.'] },
        { x: 9, y: 10, look: L.old, move: 'wander', talk: ['Warden Petra runs the Hall here. She uses tough Stone types.', 'Water and Plant moves will crack those rocks wide open!'] },
        { x: 24, y: 10, look: L.woman, move: 'wander', talk: ['Those Syndicate people showed up a few days ago. They keep talking about "awakening the guardian".'] },
        { x: 13, y: 18, look: L.kid, move: 'wander', talk: ['The Supply Shop sells Bind Orbs. Buy ten at once and they throw in a Snare Orb!'] },
        { x: 27, y: 25, look: L.fisher, dir: 'up', talk: ['The brook runs right through town. You can fish in it if you have a rod!'] },
        { x: 6, y: 25, look: L.girl, move: 'wander', talk: ['The man in the little hut can give your creatures new nicknames. He\'s a bit dramatic about it.'] },
        { x: 21, y: 9, look: L.man, move: 'turn', talk: ['Have you seen the Brookvale Bulletin? Juno writes the whole thing herself!'] },
      ],
      wild: { fish1: { list: [['minnox', 5, 8, 85], ['crabbit', 5, 8, 15]] }, fish2: { list: [['minnox', 14, 18, 60], ['crabbit', 14, 18, 30], ['sparkfin', 15, 18, 10]] } },
    };
  }
  haven('brook_haven', 'Brookvale', 'brookvale', 7, 8);
  M.brook_haven.npcs.push({ id: 'tobin', x: 9, y: 5, dir: 'left', look: L.tobin, cond: 'badge1', speaker: 'Tobin', talk: () => G.story.tobin() });
  shop('brook_shop', 'brookvale', 26, 8, ['bindorb', 'potion', 'antidote', 'unjolt', 'wakebell', 'burnsalve', 'thawdrop', 'repel', 'escaperope']);
  house('brook_office', 'Brookvale Bulletin', 'brookvale', 13, 8, [
    { id: 'juno1', x: 6, y: 2, dir: 'down', look: L.juno, speaker: 'Juno', talk: () => G.story.juno(1) },
    { x: 2, y: 4, look: L.man, move: 'turn', talk: ['I deliver the Bulletin to every town in Verdania. My legs are very strong.'] },
  ]);
  house('brook_house2', 'Fossil Collector\'s House', 'brookvale', 21, 8, [
    { x: 6, y: 2, dir: 'down', look: L.hiker, talk: ['I collect old stones from Whisper Cave. Some of them glow in the dark!', 'There\'s a hole in the cave floor that leads deeper underground. Bring a light heart!'] },
    { x: 3, y: 3, look: L.woman, move: 'wander', talk: ['My husband\'s rock collection takes up three whole rooms...'] },
  ]);
  house('brook_hut', 'Name Rater\'s Hut', 'brookvale', 11, 26, [
    { x: 6, y: 2, dir: 'down', look: L.ott, speaker: 'Name Rater', talk: () => G.story.nameRater() },
  ]);

  // =====================================================================
  // ROUTE 2 (bigger)
  // =====================================================================
  {
    const b = new MB(36, 34); b.rect(2, 2, 32, 30, '.');
    b.rect(0, 0, 36, 2, '#'); b.set(30, 1, 'E');
    b.path('=', 2, 16, 33, 16, 24, 8, 24, 8, 14, 22, 14, 22, 4, 29, 4); b.rect(30, 2, 1, 4, '=');
    b.rect(3, 6, 7, 5, '~');
    b.rect(19, 26, 10, 6, ','); b.rect(3, 27, 10, 4, ','); b.rect(11, 17, 9, 5, ','); b.rect(25, 7, 8, 6, ',');
    b.rect(12, 4, 8, 6, ','); b.rect(26, 17, 7, 6, ',');
    b.rect(2, 22, 6, 1, 'L'); b.rect(11, 11, 3, 2, 'T'); b.rect(28, 14, 3, 2, 'T');
    b.scatter(2, 2, 32, 30, '*', 10, 9); b.set(18, 32, 'S');
    M.route2 = {
      name: 'Route 2', music: 'route', bg: 'grass', region: 'route2', rows: b.rows(),
      exits: { s: { to: 'brookvale', d: 0 } },
      warps: [{ x: 30, y: 1, to: 'cave', tx: 12, ty: 18, dir: 'up' }],
      signs: [{ x: 18, y: 32, text: 'ROUTE 2 - Whisper Cave lies at the end of the road.' }],
      items: [{ x: 32, y: 20, item: 'greatorb' }, { x: 3, y: 3, item: 'disc09' }, { x: 3, y: 20, item: 'potion', n: 2 }, { x: 13, y: 30, item: 'berry', n: 3, hidden: true }, { x: 33, y: 3, item: 'antidote', n: 2 }],
      npcs: [
        { x: 10, y: 8, dir: 'left', look: L.fisher, speaker: 'Fisherman', talk: () => G.story.oldRodGuy() },
        { x: 7, y: 18, dir: 'right', look: L.bug, sight: 4, trainer: TR('Bug Fan', 'Milo', L.bug, [['larvine', 7], ['cocoonix', 8], ['stinglet', 9], ['lumimoth', 10]], { base: 12, intro: 'My bugs have been training all summer!', lose: 'My bugs got squashed!', after: 'Stinglet\'s sting can poison. Carry Antidotes!' }) },
        { x: 24, y: 10, dir: 'left', look: L.hiker, sight: 4, trainer: TR('Climber', 'Gus', L.hiker, [['pebblin', 10], ['brawlet', 11]], { base: 30, intro: 'Hah! Mountains made me strong!', lose: 'Whoa! You\'re stronger than a mountain!', after: 'Whisper Cave is just up ahead. It\'s dark, so watch your step.' }) },
        { x: 20, y: 16, dir: 'up', look: L.lass, sight: 3, trainer: TR('Daydreamer', 'Rose', L.lass, [['sporelet', 10], ['pipwing', 10]], { base: 16, intro: 'Wanna see my cutest creatures?', lose: 'Aww, they tried so hard...', after: 'Sporelet\'s spores can put your creatures to sleep. Bring a Wake Bell!' }) },
        { x: 15, y: 29, dir: 'right', look: L.youngster, sight: 3, trainer: TR('Scout', 'Remy', L.youngster, [['thistlet', 9], ['nibbit', 9]], { base: 16, intro: 'I caught a Thistlet! It\'s super prickly!', lose: 'Ouch! In more ways than one.', after: 'Thistlet evolve into total brawlers.' }) },
        { x: 27, y: 3, dir: 'down', look: L.wanderer, sight: 3, trainer: TR('Wanderer', 'Faye', L.wanderer, [['psyfawn', 11], ['zapkit', 11]], { base: 24, intro: 'I\'ve walked every road in Verdania. Let\'s see how you walk yours!', lose: 'A fine stride, traveler.', after: 'Whisper Cave goes deeper than most people think.' }) },
        { x: 4, y: 13, look: L.kid, move: 'wander', talk: ['The pond is full of Minnox. They\'re easy to hook!'] },
      ],
      wild: {
        grass: { rate: 11, list: [['pipwing', 5, 8, 20], ['nibbit', 5, 8, 15], ['slitherin', 6, 8, 15], ['sporelet', 6, 8, 12], ['stinglet', 6, 8, 10], ['thistlet', 6, 9, 10], ['zapkit', 6, 9, 7], ['psyfawn', 7, 9, 4], ['duskwing', 6, 8, 14, 'night'], ['wispette', 7, 9, 8, 'night'], ['cocoonix', 7, 8, 7]] },
        fish1: { list: [['minnox', 5, 9, 85], ['crabbit', 6, 9, 15]] }, fish2: { list: [['minnox', 15, 20, 50], ['crabbit', 15, 20, 35], ['reefhorn', 20, 24, 15]] },
      },
    };
  }

  // =====================================================================
  // WHISPER CAVE - LOWER LEVEL
  // =====================================================================
  {
    const b = new MB(30, 24, 'C');
    b.rect(2, 2, 8, 6, 'c'); b.rect(9, 4, 12, 2, 'c'); b.rect(19, 2, 8, 8, 'c'); b.rect(22, 9, 3, 8, 'c');
    b.rect(8, 15, 17, 4, 'c'); b.rect(3, 8, 3, 12, 'c'); b.rect(3, 18, 6, 3, 'c');
    b.set(4, 3, 'O'); b.set(24, 4, 'K'); b.set(12, 17, 'K'); b.set(6, 5, 'K'); b.set(20, 7, 'K');
    M.cave_b1 = {
      name: 'Whisper Cave B1', music: 'cave', bg: 'cave', cave: true, border: 'C', dark: true, region: 'cave', rows: b.rows(),
      warps: [{ x: 4, y: 3, to: 'cave', tx: 3, ty: 11, dir: 'up' }],
      items: [{ x: 26, y: 2, item: 'rarecandy' }, { x: 3, y: 19, item: 'disc15' }, { x: 23, y: 16, item: 'greatorb', n: 2 }, { x: 9, y: 2, item: 'ether', hidden: true }, { x: 15, y: 18, item: 'nugget', hidden: true }],
      npcs: [
        { x: 14, y: 16, dir: 'left', look: L.hiker, sight: 5, trainer: TR('Climber', 'Orin', L.hiker, [['nutling', 13], ['pebblin', 14], ['magmite', 14]], { base: 30, intro: 'Nobody comes down this far! A battle, then!', lose: 'Rocked and rolled...', after: 'Wispette float around down here. Spooky little things.' }) },
        { x: 21, y: 3, dir: 'down', look: L.mystic, sight: 4, trainer: TR('Mystic', 'Vela', L.mystic, [['wispette', 14], ['duskwing', 14]], { base: 30, intro: 'The darkness whispers your name...', lose: 'The whispers have gone quiet.', after: 'Some say a sealed creature sleeps beneath the eastern marsh.' }) },
      ],
      wild: { cave: { rate: 10, list: [['duskwing', 12, 15, 25], ['nutling', 12, 14, 20], ['pebblin', 12, 15, 15], ['wispette', 12, 15, 15], ['magmite', 13, 15, 12], ['brawlet', 12, 15, 10], ['moundle', 12, 14, 3]] } },
    };
  }

  // ---------- Emberfall extras ----------
  M.emberfall.buildings.push({ kind: 'hut', x: 8, y: 13, to: 'ember_springs', tx: 4, ty: 5 });
  M.emberfall.region = 'emberfall'; M.emberfall.town = 'emberfall';
  M.emberfall.npcs.push(
    { id: 'juno2', x: 14, y: 4, look: L.juno, cond: 'badge1', speaker: 'Juno', talk: () => G.story.juno(2) },
    { x: 8, y: 18, look: L.kindler, move: 'wander', talk: ['The hot springs hut is free for everyone. Grandma Sel says warm water heals the heart.'] },
  );
  house('ember_springs', 'Hot Springs', 'emberfall', 9, 16, [
    { x: 6, y: 2, dir: 'down', look: L.oldlady, speaker: 'Grandma Sel', talk: () => G.story.springs() },
    { x: 2, y: 3, look: L.man, move: 'turn', talk: ['Ahhh... my creatures and I come here every evening.'] },
  ], ['WwWWWWWwW', 'f~~~fffff', 'f~~~fffff', 'fffffrrff', 'fffffrrff', 'pfffffffp', 'xxxxmxxxx']);
  M.route3.region = 'route3'; M.cave.region = 'cave';
  M.route3.wild.grass.list.push(['lanternip', 15, 17, 8, 'night'], ['moundle', 14, 16, 8]);

  // =====================================================================
  // ROUTE 4 (longer coast)
  // =====================================================================
  {
    const b = new MB(50, 16); b.rect(2, 1, 46, 12, '.');
    b.rect(0, 7, 50, 2, '=');
    b.rect(20, 1, 4, 12, '~'); b.rect(20, 7, 4, 2, 'B');
    b.rect(2, 11, 46, 1, ':'); b.rect(2, 12, 46, 3, '~');
    b.rect(36, 2, 3, 3, '~');
    b.rect(3, 2, 8, 4, ','); b.rect(26, 2, 8, 4, ','); b.rect(12, 9, 6, 2, ','); b.rect(30, 9, 8, 2, ','); b.rect(46, 2, 2, 4, ',');
    b.scatter(2, 1, 46, 10, '*', 8, 11);
    M.route4 = {
      name: 'Route 4', music: 'route', bg: 'grass', region: 'route4', rows: b.rows(),
      buildings: [{ kind: 'hut', x: 41, y: 2, to: 'beach_hut', tx: 4, ty: 5 }],
      exits: { w: { to: 'emberfall', d: 0 }, e: { to: 'stormcrest', d: 0 } },
      items: [{ x: 47, y: 9, item: 'disc10' }, { x: 3, y: 6, item: 'hyperpotion' }, { x: 12, y: 1, item: 'xspeed' }, { x: 30, y: 11, item: 'nugget', hidden: true }, { x: 25, y: 1, item: 'netorb', n: 2 }],
      npcs: [
        { x: 16, y: 11, dir: 'down', look: L.fisher, speaker: 'Angler', talk: () => G.story.goodRodGuy() },
        { x: 10, y: 10, dir: 'up', look: L.sailor, sight: 2, trainer: TR('Deckhand', 'Hank', L.sailor, [['crabbit', 20], ['reefhorn', 21]], { base: 32, intro: 'Ahoy! Let\'s see what you\'re made of!', lose: 'I\'ve been sunk!', after: 'Fish in deeper water with a better rod for rarer creatures.' }) },
        { x: 33, y: 6, dir: 'down', look: L.ace, sight: 1, trainer: TR('Veteran', 'Drew', L.ace, [['galeclaw', 21], ['voltlynx', 22], ['gnawbeast', 21]], { base: 60, intro: 'Veterans only battle the best. Show me you\'re worth it!', lose: 'Okay... you\'ve earned my respect.', after: 'Stormcrest is overrun with Syndicate goons. Be careful.' }) },
        { x: 6, y: 1, dir: 'down', look: L.acef, sight: 6, trainer: TR('Veteran', 'Mira', L.acef, [['psyfawn', 21], ['frostpup', 22]], { base: 60, intro: 'A battle by the sea? Lovely!', lose: 'The tide turned against me.', after: 'Psyfawn evolves at level 30. Its antlers are gorgeous.' }) },
        { x: 26, y: 10, dir: 'up', look: L.fisher, sight: 2, trainer: TR('Angler', 'Pike', L.fisher, [['minnox', 20], ['sparkfin', 21], ['minnox', 20]], { base: 24, intro: 'Reeled one in! A trainer!', lose: 'The one that got away...', after: 'Sparkfin gather where the river meets the sea.' }) },
        { x: 40, y: 9, dir: 'up', look: L.sailor, sight: 2, trainer: TR('Deckhand', 'Marlo', L.sailor, [['pondlet', 21], ['brawlet', 22]], { base: 32, intro: 'Swab the deck! Then battle me!', lose: 'Man overboard!', after: 'The old sailor in the hut knows tales of the Sunken Ruins.' }) },
        { x: 45, y: 10, look: L.girl, move: 'wander', talk: ['I collect shells on the beach. Sometimes something shiny washes up!'] },
      ],
      wild: {
        grass: { rate: 11, list: [['galeclaw', 18, 22, 18], ['gnawbeast', 19, 22, 14], ['zapkit', 18, 21, 12], ['frostpup', 18, 21, 10], ['psyfawn', 18, 21, 9], ['slitherin', 18, 21, 9], ['pondlet', 18, 21, 10], ['puffkin', 18, 21, 7], ['hauntwisp', 20, 22, 6, 'night']] },
        fish1: { list: [['minnox', 8, 12, 70], ['crabbit', 8, 12, 15], ['sparkfin', 9, 12, 15]] }, fish2: { list: [['minnox', 18, 24, 30], ['crabbit', 18, 24, 25], ['sparkfin', 20, 24, 15], ['reefhorn', 22, 26, 20], ['clawdron', 24, 26, 10]] },
      },
    };
  }
  house('beach_hut', 'Beach Hut', 'route4', 42, 5, [
    { x: 6, y: 2, dir: 'down', look: L.sailor, speaker: 'Old Sailor', talk: () => G.story.beachHut() },
  ]);

  // =====================================================================
  // STORMCREST CITY (bigger)
  // =====================================================================
  {
    const b = new MB(34, 28); b.rect(2, 2, 30, 24, '.');
    b.rect(0, 7, 18, 2, '='); b.rect(16, 0, 2, 22, '='); b.rect(4, 21, 26, 1, '='); b.rect(5, 16, 12, 1, '=');
    b.rect(18, 10, 12, 1, '='); b.rect(3, 23, 6, 2, '~');
    b.scatter(2, 2, 30, 24, '*', 12, 13); b.set(19, 8, 'S');
    M.stormcrest = {
      name: 'Stormcrest City', music: 'town', bg: 'grass', region: 'stormcrest', town: 'stormcrest', rows: b.rows(), musicFn: () => (G.hasFlag('hq_clear') ? 'town' : 'hq'),
      buildings: [
        { kind: 'haven', x: 4, y: 2, to: 'storm_haven', tx: 6, ty: 6 },
        { kind: 'shop', x: 10, y: 2, to: 'storm_shop', tx: 5, ty: 5 },
        { kind: 'hall', x: 22, y: 2, to: 'storm_hall', tx: 5, ty: 10, lock: { cond: 'hq_clear', text: 'The door is locked. A note reads: "Hall closed. The Syndicate seized our power plant. -Volta"' } },
        { kind: 'tower', x: 4, y: 9, to: 'hq1', tx: 7, ty: 10 },
        { kind: 'house', x: 26, y: 11, to: 'storm_house2', tx: 4, ty: 5 },
        { kind: 'house', x: 20, y: 17, to: 'storm_whistle', tx: 4, ty: 5 },
        { kind: 'hut', x: 12, y: 22, to: 'storm_hut', tx: 4, ty: 5 },
      ],
      exits: { w: { to: 'route4', d: 0 }, n: { to: 'route6', d: 0 } },
      signs: [{ x: 19, y: 8, text: 'STORMCREST CITY - "The city that never loses power." North: Route 6 marshlands.' }],
      npcs: [
        { id: 'guard_a', x: 16, y: 1, dir: 'down', look: L.guard, cond: '!badge3', speaker: 'Guard', talk: ['Beyond here lie the Route 6 marshlands. Wild creatures there are fierce.', 'Show me the Storm Sigil from Warden Volta and I\'ll let you pass.'] },
        { id: 'guard_b', x: 17, y: 1, dir: 'down', look: L.guard, cond: '!badge3', speaker: 'Guard', talk: ['Sorry! Storm Sigil first. Volta\'s orders.'] },
        { x: 12, y: 12, look: L.man, move: 'wander', cond: '!hq_clear', talk: ['The Hollow Syndicate took over that tower and shut down the Hall.', 'Somebody has to stop them!'] },
        { x: 12, y: 12, look: L.man, move: 'wander', cond: 'hq_clear', talk: ['You drove out the Syndicate! The whole city is talking about you!'] },
        { x: 26, y: 24, look: L.girl, move: 'wander', talk: ['My big sister Volta is the Warden here. She\'s really strong!'] },
        { id: 'juno3', x: 22, y: 12, look: L.juno, cond: 'hq_clear', speaker: 'Juno', talk: () => G.story.juno(3) },
        { x: 6, y: 19, look: L.engineer, move: 'turn', talk: ['The tower\'s generators power the whole city. Good thing they\'re back in safe hands.'] },
        { x: 29, y: 4, look: L.woman, move: 'wander', talk: ['There\'s a man in the house by the south road who raises sky creatures. I hear he gives out whistles!'] },
      ],
    };
  }
  haven('storm_haven', 'Stormcrest', 'stormcrest', 6, 6);
  shop('storm_shop', 'stormcrest', 12, 6, ['greatorb', 'ultraorb', 'netorb', 'duskorb', 'quickorb', 'superpotion', 'hyperpotion', 'maxpotion', 'revive', 'fullheal', 'superrepel', 'escaperope', 'xattack', 'xdefense', 'xspatk', 'xspeed', 'disc07', 'disc12', 'disc11']);
  house('storm_whistle', 'Sky Keeper\'s House', 'stormcrest', 22, 21, [
    { x: 6, y: 2, dir: 'down', look: L.ranger, speaker: 'Sky Keeper', talk: () => G.story.wingWhistle() },
    { x: 2, y: 4, look: L.kid, move: 'wander', talk: ['Grandpa\'s sky creatures can fly you to any town you\'ve been to before!'] },
  ]);
  house('storm_house2', 'Engineer\'s House', 'stormcrest', 28, 15, [
    { x: 6, y: 2, dir: 'down', look: L.engineer, talk: ['I invented a band that shares battle experience with your whole team.', 'I gave the prototype to Professor Wren\'s aide, Tobin. Have you met him?'] },
  ]);
  house('storm_hut', 'Fortune Teller', 'stormcrest', 13, 25, [
    { x: 6, y: 2, dir: 'down', look: L.fortune, speaker: 'Madame Iris', talk: () => G.story.fortune() },
  ]);

  // =====================================================================
  // ROUTE 6 - THE MARSH
  // =====================================================================
  {
    const b = new MB(32, 46); b.rect(2, 1, 28, 44, '.');
    b.rect(16, 0, 2, 46, '=');
    b.rect(3, 37, 8, 5, '~'); b.rect(26, 36, 3, 7, ',');
    b.rect(10, 26, 14, 2, '~'); b.rect(16, 26, 2, 2, 'B');
    b.rect(3, 29, 10, 5, ','); b.rect(20, 29, 9, 5, '~');
    b.rect(4, 17, 8, 7, '~'); b.rect(20, 16, 9, 8, ',');
    b.rect(3, 4, 10, 9, ','); b.rect(19, 8, 10, 6, '~'); b.rect(20, 2, 9, 5, ',');
    b.rect(2, 13, 6, 3, '#'); b.set(5, 15, 'E');
    b.rect(18, 41, 6, 1, '='); b.rect(3, 34, 5, 2, ',');
    b.scatter(2, 1, 28, 44, '*', 10, 17);
    M.route6 = {
      name: 'Route 6', music: 'route', bg: 'marsh', region: 'route6', rows: b.rows(),
      buildings: [{ kind: 'house', x: 21, y: 37, to: 'daycare', tx: 4, ty: 5 }],
      exits: { s: { to: 'stormcrest', d: 0 }, n: { to: 'mistmere', d: 0 } },
      warps: [{ x: 5, y: 15, to: 'ruins1', tx: 12, ty: 19, dir: 'up' }],
      signs: [],
      items: [{ x: 28, y: 44, item: 'superpotion', n: 2 }, { x: 2, y: 28, item: 'revive' }, { x: 28, y: 1, item: 'disc17' }, { x: 7, y: 7, item: 'thunderstone', hidden: true }, { x: 12, y: 24, item: 'ultraorb' }, { x: 25, y: 15, item: 'fullheal', n: 2 }],
      npcs: [
        { x: 18, y: 22, dir: 'left', look: L.fisher, sight: 4, trainer: TR('Angler', 'Reed', L.fisher, [['pondlet', 29], ['sparkfin', 30], ['minnox', 29]], { base: 26, intro: 'The marsh is my kind of fishing spot!', lose: 'Snapped my line!', after: 'Pondlet sing when it\'s about to rain.' }) },
        { x: 15, y: 35, dir: 'right', look: L.bug, sight: 3, trainer: TR('Bug Fan', 'Pell', L.bug, [['stinglet', 29], ['waspire', 31]], { base: 14, intro: 'Bzzzz! My bugs rule the marsh!', lose: 'Bzz... z...', after: 'Waspire are fast. Super fast.' }) },
        { x: 13, y: 10, dir: 'right', look: L.acef, sight: 3, trainer: TR('Veteran', 'Sola', L.acef, [['thornbrawl', 31], ['gustling', 30], ['voltlynx', 31]], { base: 60, intro: 'Mistmere\'s Warden is tough. Practice on me first!', lose: 'You\'ll do just fine against Coralie.', after: 'Bring Spark or Plant moves to Mistmere Hall.' }) },
        { x: 18, y: 4, dir: 'left', look: L.wanderer, sight: 4, trainer: TR('Wanderer', 'Moss', L.wanderer, [['bogroar', 31], ['cobrax', 30]], { base: 26, intro: 'The fog hides many travelers. Including me!', lose: 'Lost in the fog...', after: 'There\'s a cave entrance in the cliffs to the west. The ruins inside are ancient.' }) },
        { x: 15, y: 14, dir: 'right', look: L.mystic, sight: 2, trainer: TR('Mystic', 'Lune', L.mystic, [['hauntwisp', 31], ['lanternip', 30]], { base: 30, intro: 'The marsh lights are souls, you know. Or creatures. Hard to say.', lose: 'The lights have dimmed.', after: 'Lanternip glow brightest at night.' }) },
        { x: 18, y: 31, dir: 'left', look: L.diver, sight: 4, trainer: TR('Diver', 'Kai-Lin', L.diver, [['sparkfin', 30], ['clawdron', 31]], { base: 28, intro: 'I just came up from the deep pools! Battle?', lose: 'Bubbles...', after: 'Use a Steel Rod in the deeper pools for Voltray.' }) },
        { x: 9, y: 44, look: L.oldlady, move: 'turn', talk: ['The Daycare down the road will look after one of your creatures. It grows stronger as you walk!'] },
      ],
      wild: {
        grass: { rate: 12, list: [['pondlet', 28, 31, 18], ['thistlet', 28, 30, 14], ['gustling', 28, 31, 12], ['slitherin', 28, 30, 8], ['cobrax', 30, 32, 5], ['fungore', 29, 32, 8], ['zapkit', 28, 30, 8], ['bogroar', 30, 32, 4], ['thornbrawl', 30, 32, 4], ['lanternip', 28, 31, 10, 'night'], ['gloomwing', 30, 32, 8, 'night']] },
        fish1: { list: [['minnox', 20, 25, 50], ['sparkfin', 22, 26, 30], ['pondlet', 22, 26, 20]] }, fish2: { list: [['sparkfin', 28, 32, 35], ['voltray', 30, 33, 15], ['reefhorn', 28, 32, 25], ['bogroar', 30, 33, 10], ['clawdron', 30, 33, 15]] },
      },
    };
  }
  house('daycare', 'Marsh Daycare', 'route6', 23, 41, [
    { x: 6, y: 2, dir: 'down', look: L.daycare, speaker: 'Daycare Lady', talk: () => G.story.daycare() },
    { x: 2, y: 4, look: L.old, move: 'turn', speaker: 'Daycare Man', talk: ['We take good care of every creature that stays with us.', 'It earns experience as you walk. The longer you\'re away, the stronger it gets!'] },
  ]);

  // ---------- Sunken Ruins ----------
  {
    const b = new MB(26, 22, 'X');
    b.rect(11, 15, 4, 7, 'z'); b.rect(3, 10, 20, 5, 'z'); b.rect(3, 3, 4, 7, 'z'); b.rect(19, 3, 4, 7, 'z'); b.rect(7, 3, 12, 3, 'z');
    b.rect(11, 1, 4, 2, 'z'); b.set(12, 1, 'O');
    b.set(5, 11, 'Z'); b.set(20, 11, 'Z'); b.set(9, 13, 'Q'); b.set(16, 13, 'Q');
    M.ruins1 = {
      name: 'Sunken Ruins', music: 'cave', bg: 'ruins', cave: true, encTile: 'z', border: 'X', dark: true, dungeon: true, region: 'ruins', rows: b.rows(),
      warps: [{ x: 12, y: 21, to: 'route6', tx: 5, ty: 16, dir: 'down', }, { x: 12, y: 1, to: 'ruins2', tx: 10, ty: 15, dir: 'up', cond: 'ruins_open' }],
      items: [{ x: 3, y: 3, item: 'maxrevive' }, { x: 22, y: 3, item: 'disc18' }, { x: 21, y: 14, item: 'nugget' }, { x: 3, y: 14, item: 'rarecandy', hidden: true }],
      npcs: [
        { id: 'seal', x: 12, y: 2, look: L.sage, noFace: true, cond: '!ruins_open', speaker: 'Stone Tablet', talk: () => G.story.ruinsSeal() },
        { x: 7, y: 11, dir: 'right', look: L.mystic, sight: 4, trainer: TR('Mystic', 'Ash-Ra', L.mystic, [['hauntwisp', 33], ['pyrewraith', 34]], { base: 30, intro: 'These ruins belong to the shadows...', lose: 'The shadows retreat.', after: 'The tablet at the back speaks of a seal. Only a Champion could break it.' }) },
        { x: 19, y: 6, dir: 'left', look: L.hiker, sight: 4, trainer: TR('Climber', 'Tor', L.hiker, [['barkade', 33], ['glacierra', 33]], { base: 32, intro: 'Ruin diving! Best hobby in the world!', lose: 'Buried under rubble...', after: 'I found old carvings of three great creatures here.' }) },
      ],
      wild: { cave: { rate: 10, list: [['lanternip', 30, 33, 22], ['wispette', 30, 33, 18], ['hauntwisp', 32, 34, 10], ['nutling', 30, 33, 18], ['barkade', 32, 34, 8], ['gloomwing', 31, 34, 14], ['pyrewraith', 34, 35, 3]] } },
    };
    const c = new MB(22, 18, 'X');
    c.rect(3, 3, 16, 13, 'z'); c.rect(10, 16, 2, 1, 'z'); c.set(10, 16, 'O');
    c.set(5, 5, 'Q'); c.set(16, 5, 'Q'); c.set(5, 11, 'Q'); c.set(16, 11, 'Q'); c.set(10, 2, 'A'); c.set(11, 2, 'A');
    M.ruins2 = {
      name: 'Ruins Sanctum', music: 'cave', bg: 'ruins', cave: true, encTile: 'none', border: 'X', dark: true, dungeon: true, region: 'ruins', rows: c.rows(),
      warps: [{ x: 10, y: 16, to: 'ruins1', tx: 12, ty: 3, dir: 'down' }],
      npcs: [
        { id: 'vex2', x: 10, y: 9, dir: 'down', look: L.vex, cond: '!vex2', speaker: 'Vex', talk: () => G.story.vexRuins() },
        { id: 'umbrath', x: 10, y: 4, mon: 'umbrath', noFace: true, cond: ['vex2', '!umbrath_done'], talk: () => G.story.umbrath() },
      ],
      triggers: [{ x: 9, y: 12, w: 4, h: 1, cond: '!vex2', run: () => G.story.vexRuins() }],
    };
  }

  // =====================================================================
  // MISTMERE TOWN
  // =====================================================================
  {
    const b = new MB(34, 30); b.rect(2, 2, 30, 26, '.');
    b.rect(6, 2, 22, 7, '~'); b.rect(16, 6, 2, 3, 'B');
    b.rect(16, 9, 2, 21, '='); b.rect(18, 14, 16, 2, '='); b.rect(4, 13, 12, 1, '='); b.rect(4, 21, 26, 1, '=');
    b.scatter(2, 9, 30, 19, '*', 14, 19); b.set(19, 26, 'S');
    M.mistmere = {
      name: 'Mistmere Town', music: 'haven', bg: 'marsh', region: 'mistmere', town: 'mistmere', rows: b.rows(),
      buildings: [
        { kind: 'haven', x: 3, y: 9, to: 'mist_haven', tx: 6, ty: 6 },
        { kind: 'shop', x: 9, y: 9, to: 'mist_shop', tx: 5, ty: 5 },
        { kind: 'hall', x: 23, y: 16, to: 'mist_hall', tx: 5, ty: 10 },
        { kind: 'house', x: 3, y: 16, to: 'mist_trade', tx: 4, ty: 5 },
        { kind: 'house', x: 9, y: 16, to: 'mist_farm', tx: 4, ty: 5 },
        { kind: 'hut', x: 20, y: 23, to: 'mist_hut', tx: 4, ty: 5 },
      ],
      exits: { s: { to: 'route6', d: 0 }, e: { to: 'route7', d: 0 } },
      signs: [{ x: 19, y: 26, text: 'MISTMERE TOWN - "Where the lake meets the sky."' }],
      npcs: [
        { id: 'fogranger_a', x: 32, y: 14, dir: 'left', look: L.ranger, cond: '!badge4', speaker: 'Forest Ranger', talk: ['Whisperwood Forest is thick with fog right now. It\'s easy to get lost.', 'Earn the Tide Sigil from Warden Coralie and I\'ll guide you to the trail.'] },
        { id: 'fogranger_b', x: 32, y: 15, dir: 'left', look: L.ranger, cond: '!badge4', speaker: 'Forest Ranger', talk: ['Tide Sigil first, please. It\'s for your own safety!'] },
        { id: 'rivalm', x: 16, y: 18, dir: 'down', look: L.rival, cond: ['!rivalm'], speaker: '{RIVAL}', talk: () => G.story.rivalMist() },
        { x: 18, y: 10, look: L.fisher, dir: 'up', talk: ['The lake is so still you can see the clouds in it. Great fishing, too.'] },
        { x: 8, y: 25, look: L.oldlady, move: 'wander', talk: ['Warden Coralie can swim across the whole lake and back before breakfast.'] },
        { x: 27, y: 12, look: L.kid, move: 'wander', talk: ['The farmer gives away a free fruit every day! I go every morning.'] },
        { id: 'juno4', x: 12, y: 14, look: L.juno, cond: 'badge4', speaker: 'Juno', talk: () => G.story.juno(4) },
        { x: 28, y: 25, look: L.woman, move: 'turn', talk: ['The man in the house by the haven loves trading creatures. He\'s always looking for something.'] },
      ],
      triggers: [{ x: 16, y: 27, w: 2, h: 1, cond: '!rivalm', run: () => G.story.rivalMist() }],
      wild: { fish1: { list: [['minnox', 20, 25, 60], ['pondlet', 22, 26, 40]] }, fish2: { list: [['pondlet', 30, 34, 30], ['sparkfin', 30, 34, 30], ['voltray', 32, 35, 15], ['bogroar', 32, 35, 10], ['reefhorn', 30, 34, 15]] } },
    };
  }
  haven('mist_haven', 'Mistmere', 'mistmere', 5, 13);
  shop('mist_shop', 'mistmere', 11, 13, ['ultraorb', 'greatorb', 'netorb', 'hyperpotion', 'superpotion', 'maxpotion', 'revive', 'fullheal', 'superrepel', 'escaperope', 'ether', 'xattack', 'xdefense']);
  house('mist_trade', 'Trader\'s House', 'mistmere', 5, 20, [
    { x: 6, y: 2, dir: 'down', look: L.man, speaker: 'Trader Bo', talk: () => G.story.trade('mist') },
  ]);
  house('mist_farm', 'Fruit Farm', 'mistmere', 11, 20, [
    { x: 6, y: 2, dir: 'down', look: L.farmer, speaker: 'Farmer Ilse', talk: () => G.story.farmer() },
    { x: 2, y: 4, look: L.girl, move: 'wander', talk: ['Sweetfruit grow best in the misty air here.'] },
  ]);
  house('mist_hut', 'Lakeside Hut', 'mistmere', 21, 26, [
    { x: 6, y: 2, dir: 'down', look: L.sage, speaker: 'Sage Morrow', talk: () => G.story.sageLore() },
  ]);
  hall('mist_hall', 'Mistmere Hall', 'mistmere', 26, 21, [
    { x: 5, y: 1, dir: 'down', look: L.coralie, speaker: 'Coralie', talk: () => G.story.warden('coralie') },
    { x: 3, y: 6, dir: 'right', look: L.diver, sight: 4, trainer: TR('Diver', 'Nami', L.diver, [['sparkfin', 33], ['pondlet', 33], ['minnox', 33]], { base: 28, intro: 'Coralie taught me to hold my breath for five minutes!', lose: 'Glub glub...', after: 'Spark and Plant moves make a splash here.' }) },
    { x: 7, y: 4, dir: 'left', look: L.acef, sight: 4, trainer: TR('Veteran', 'Shore', L.acef, [['reefhorn', 34], ['crabbit', 34], ['voltray', 35]], { base: 60, intro: 'The tide waits for no one. Battle!', lose: 'Washed ashore...', after: 'The Warden is waiting.' }) },
    { x: 7, y: 9, dir: 'down', look: L.guide, speaker: 'Hall Guide', talk: ['Warden Coralie uses Water types. Spark and Plant moves will turn the tide!'] },
  ]);

  // =====================================================================
  // ROUTE 7 - WHISPERWOOD FOREST
  // =====================================================================
  {
    const b = new MB(46, 30);
    b.path('d', 2, 0, 14, 8, 14, 8, 5, 20, 5, 20, 22, 32, 22, 32, 10, 40, 10, 40, 14, 46, 14);
    b.rect(3, 3, 6, 4, 'd'); b.rect(12, 8, 6, 6, 'D'); b.rect(12, 7, 2, 1, 'd');
    b.rect(22, 13, 8, 6, 'D'); b.rect(34, 16, 9, 6, 'D'); b.rect(24, 2, 8, 3, 'd'); b.rect(22, 3, 2, 3, 'd');
    b.rect(10, 18, 8, 7, 'D'); b.rect(18, 20, 2, 1, 'd'); b.rect(36, 2, 8, 6, 'D'); b.rect(38, 8, 2, 2, 'd');
    b.rect(2, 22, 6, 5, 'D'); b.rect(8, 23, 2, 1, 'd'); b.rect(26, 25, 10, 3, 'D'); b.rect(26, 24, 2, 1, 'd');
    for (const [x, y] of [[10, 12], [22, 9], [31, 18], [36, 12], [19, 16], [42, 13]]) b.set(x, y, 'd');
    M.route7 = {
      name: 'Whisperwood', music: 'cave', bg: 'forest', region: 'route7', border: 'T', rows: b.rows(),
      exits: { w: { to: 'mistmere', d: 0 }, e: { to: 'frostvale', d: 0 } },
      items: [{ x: 3, y: 3, item: 'rarecandy' }, { x: 43, y: 2, item: 'disc16' }, { x: 2, y: 26, item: 'ultraorb', n: 2 }, { x: 35, y: 26, item: 'maxpotion' }, { x: 29, y: 2, item: 'moonstone' }, { x: 16, y: 24, item: 'nugget', hidden: true }, { x: 41, y: 21, item: 'fullrestore', hidden: true }],
      npcs: [
        { x: 10, y: 12, dir: 'left', look: L.bug, sight: 2, trainer: TR('Bug Fan', 'Sid', L.bug, [['waspire', 36], ['lumimoth', 36], ['barkade', 37]], { base: 14, intro: 'The forest is MY bug kingdom!', lose: 'My kingdom crumbles...', after: 'Some people say a sleepy round creature naps deep in the woods.' }) },
        { x: 22, y: 9, dir: 'left', look: L.mystic, sight: 1, trainer: TR('Mystic', 'Ione', L.mystic, [['pyrewraith', 37], ['cyclonix', 37]], { base: 30, intro: 'The trees told me you would come.', lose: 'The trees were wrong about who would win.', after: 'Listen to the leaves. They know the way out.' }) },
        { x: 31, y: 18, dir: 'right', look: L.ace, sight: 2, trainer: TR('Veteran', 'Kade', L.ace, [['quakefang', 38], ['oracervus', 37], ['voltray', 37]], { base: 60, intro: 'Only Veterans make it this deep into Whisperwood!', lose: 'You belong here, it seems.', after: 'Frostvale is just past the edge of the forest. Dress warmly!' }) },
        { x: 36, y: 12, dir: 'up', look: L.wanderer, sight: 1, trainer: TR('Wanderer', 'Fen', L.wanderer, [['fungore', 37], ['thornbrawl', 38]], { base: 26, intro: 'I\'ve been lost here for three days. Battle me while I figure it out!', lose: 'Still lost. Still losing.', after: 'East. Definitely east. I think.' }) },
        { x: 14, y: 6, dir: 'up', look: L.lass, sight: 1, trainer: TR('Daydreamer', 'Opal', L.lass, [['puffaria', 36], ['gustling', 36]], { base: 18, intro: 'I was just dreaming about a battle!', lose: 'Wake up, me...', after: 'The forest is so pretty when the fog lifts.' }) },
        { x: 19, y: 16, dir: 'right', look: L.ranger, talk: ['Ranger here! Tall forest grass hides rare creatures. Watch your step!'] },
        { x: 42, y: 13, dir: 'left', look: L.ranger, talk: ['Frostvale is just ahead! The cold hits hard, so keep your team healthy.'] },
      ],
      wild: { grass: { rate: 12, list: [['stinglet', 34, 36, 12], ['waspire', 35, 38, 8], ['nutling', 34, 37, 12], ['barkade', 36, 38, 6], ['lumimoth', 35, 37, 9], ['sporelet', 34, 36, 8], ['fungore', 36, 38, 6], ['psyfawn', 34, 36, 8], ['oracervus', 36, 38, 3], ['thistlet', 34, 36, 8], ['mimicube', 36, 38, 2], ['lanternip', 34, 37, 10, 'night'], ['pyrewraith', 36, 38, 3, 'night']] } },
    };
  }

  // =====================================================================
  // FROSTVALE TOWN (snow)
  // =====================================================================
  {
    const b = new MB(32, 28, 'J'); b.rect(2, 2, 28, 24, 's');
    b.rect(14, 0, 2, 16, '='); b.rect(0, 14, 30, 2, '='); b.rect(4, 21, 24, 1, '=');
    b.rect(24, 2, 6, 3, '#'); b.set(27, 4, 'E'); b.rect(27, 5, 1, 9, '=');
    b.rect(3, 23, 5, 2, 'e'); b.scatter(2, 2, 28, 24, 'J', 8, 23, 's'); b.set(17, 18, 'G');
    M.frostvale = {
      name: 'Frostvale Town', music: 'haven', bg: 'snow', region: 'frostvale', town: 'frostvale', rows: b.rows(),
      buildings: [
        { kind: 'haven', x: 3, y: 8, to: 'frost_haven', tx: 6, ty: 6 },
        { kind: 'shop', x: 9, y: 8, to: 'frost_shop', tx: 5, ty: 5 },
        { kind: 'hall', x: 19, y: 16, to: 'frost_hall', tx: 5, ty: 10 },
        { kind: 'house', x: 3, y: 16, to: 'frost_tutor', tx: 4, ty: 5 },
        { kind: 'house', x: 10, y: 16, to: 'frost_trade', tx: 4, ty: 5 },
      ],
      exits: { w: { to: 'route7', d: 0 }, n: { to: 'route5', d: 0 } },
      warps: [{ x: 27, y: 4, to: 'frost_hollow', tx: 13, ty: 20, dir: 'up' }],
      signs: [{ x: 17, y: 18, text: 'FROSTVALE TOWN - "Warm hearth, cold heart, steady hands."' }],
      npcs: [
        { id: 'snowguard_a', x: 14, y: 1, dir: 'down', look: L.guard, cond: '!badge5', speaker: 'Guard', talk: ['The Summit Path leads to the Champion\'s Hall.', 'Only trainers with all five Sigils may climb it.'] },
        { id: 'snowguard_b', x: 15, y: 1, dir: 'down', look: L.guard, cond: '!badge5', speaker: 'Guard', talk: ['Stone, Ember, Storm, Tide, and Frost. Five Sigils. No exceptions!'] },
        { x: 20, y: 11, look: L.skier, move: 'wander', talk: ['The ice cave up the hill is called Frost Hollow. Legend says a crystal stag sleeps inside.'] },
        { x: 7, y: 25, look: L.kid, move: 'wander', talk: ['I built a snow Glaciwolf! It looks more like a snow potato...'] },
        { x: 25, y: 23, look: L.oldlady, move: 'turn', talk: ['Warden Halden hasn\'t lost in years. His Ice types are as stubborn as he is.'] },
        { x: 9, y: 4, look: L.man, move: 'wander', talk: ['Fire, Brawl, Stone, and Earth moves melt Ice types. Just don\'t tell Halden I told you.'] },
      ],
    };
  }
  haven('frost_haven', 'Frostvale', 'frostvale', 5, 12);
  shop('frost_shop', 'frostvale', 11, 12, ['ultraorb', 'duskorb', 'quickorb', 'hyperpotion', 'maxpotion', 'fullrestore', 'revive', 'maxrevive', 'fullheal', 'superrepel', 'escaperope', 'elixir', 'disc06']);
  G.ITEMS.disc06.price = 3500;
  house('frost_tutor', 'Move Tutor\'s House', 'frostvale', 5, 20, [
    { x: 6, y: 2, dir: 'down', look: L.tutor, speaker: 'Tutor Varn', talk: () => G.story.tutor() },
  ]);
  house('frost_trade', 'Trader\'s Cabin', 'frostvale', 12, 20, [
    { x: 6, y: 2, dir: 'down', look: L.woman, speaker: 'Trader Pia', talk: () => G.story.trade('frost') },
    { x: 2, y: 4, look: L.skier, move: 'wander', talk: ['Mom trades creatures with travelers. She once traded a scarf for a Frostpup!'] },
  ]);
  hall('frost_hall', 'Frostvale Hall', 'frostvale', 22, 21, [
    { x: 5, y: 1, dir: 'down', look: L.halden, speaker: 'Halden', talk: () => G.story.warden('halden') },
    { x: 3, y: 6, dir: 'right', look: L.skier, sight: 4, trainer: TR('Skier', 'Ulf', L.skier, [['flurrbit', 38], ['frostpup', 38], ['shardling', 39]], { base: 30, intro: 'Whoosh! I\'ll slalom right past you!', lose: 'Wiped out on the slopes...', after: 'Halden\'s Glacierra is like a wall of ice.' }) },
    { x: 7, y: 4, dir: 'left', look: L.acef, sight: 4, trainer: TR('Veteran', 'Brisa', L.acef, [['blizzowl', 40], ['glaciwolf', 40]], { base: 60, intro: 'Halden is my mentor. I won\'t let you pass easily!', lose: 'He\'s going to be so proud of you anyway.', after: 'Go on. The Warden awaits.' }) },
    { x: 7, y: 9, dir: 'down', look: L.guide, speaker: 'Hall Guide', talk: ['Warden Halden uses Ice types. Fire, Brawl, Stone, and Earth moves crack the ice!'] },
  ]);

  // ---------- Frost Hollow (ice cave) ----------
  {
    const b = new MB(28, 22, 'I');
    b.rect(12, 16, 4, 6, 'e'); b.rect(4, 12, 20, 4, 'e'); b.rect(4, 3, 4, 9, 'e'); b.rect(20, 3, 4, 9, 'e'); b.rect(8, 3, 12, 3, 'e');
    b.rect(10, 8, 8, 2, 'e'); b.rect(10, 10, 2, 2, 'e'); b.set(9, 13, 'I'); b.set(18, 14, 'I'); b.set(6, 7, 'I'); b.set(21, 6, 'I');
    M.frost_hollow = {
      name: 'Frost Hollow', music: 'cave', bg: 'ice', cave: true, encTile: 'e', border: 'I', region: 'frost_hollow', rows: b.rows(),
      warps: [{ x: 13, y: 21, to: 'frostvale', tx: 27, ty: 5, dir: 'down' }],
      items: [{ x: 4, y: 3, item: 'maxrevive' }, { x: 23, y: 3, item: 'xspatk', n: 2 }, { x: 17, y: 9, item: 'ultraorb', n: 3 }, { x: 4, y: 15, item: 'rarecandy', hidden: true }],
      npcs: [
        { x: 5, y: 13, dir: 'right', look: L.skier, sight: 4, trainer: TR('Skier', 'Rune', L.skier, [['glaciwolf', 41], ['glacierra', 42]], { base: 30, intro: 'This cave is my secret practice rink!', lose: 'Slipped up...', after: 'An icy wind blows from the top chamber. Something powerful lives up there.' }) },
        { id: 'glaciel', x: 13, y: 4, mon: 'glaciel', noFace: true, cond: ['champion', '!glaciel_done'], talk: () => G.story.glaciel() },
        { x: 14, y: 4, look: L.sage, cond: '!champion', dir: 'down', speaker: 'Hermit', talk: ['Shh... A great frozen guardian visits this chamber, but only for the Champion of Verdania.', 'Return when you\'ve earned that title.'] },
      ],
      wild: { cave: { rate: 10, list: [['shardling', 38, 41, 25], ['glacierra', 42, 44, 6], ['frostpup', 38, 41, 18], ['glaciwolf', 41, 43, 8], ['flurrbit', 38, 41, 15], ['wispette', 38, 41, 12], ['gloomwing', 40, 42, 10]] } },
    };
  }

  // =====================================================================
  // ROUTE 5 - SUMMIT PATH (snowy, longer)
  // =====================================================================
  {
    const b = new MB(24, 40, '#'); b.rect(2, 1, 20, 38, 's');
    b.path('=', 2, 14, 39, 14, 30, 6, 30, 6, 18, 16, 18, 16, 8, 10, 8, 10, 0);
    b.rect(17, 32, 4, 6, 'i'); b.rect(2, 32, 4, 6, 'i'); b.rect(9, 22, 6, 6, 'i'); b.rect(18, 21, 4, 8, 'i');
    b.rect(2, 10, 7, 6, 'i'); b.rect(12, 2, 8, 5, 'i'); b.rect(19, 10, 3, 7, 'i');
    b.rect(9, 12, 3, 2, 'J'); b.rect(2, 24, 3, 3, 'J');
    M.route5 = {
      name: 'Summit Path', music: 'summit', bg: 'snow', region: 'route5', rows: b.rows(),
      exits: { s: { to: 'frostvale', d: 0 }, n: { to: 'summit', d: 0 } },
      items: [{ x: 2, y: 1, item: 'disc04' }, { x: 21, y: 1, item: 'maxrevive' }, { x: 3, y: 38, item: 'fullrestore' }, { x: 20, y: 38, item: 'rarecandy' }, { x: 19, y: 9, item: 'ultraorb', n: 3 }, { x: 4, y: 20, item: 'elixir', hidden: true }],
      npcs: [
        { x: 8, y: 24, dir: 'left', look: L.ace, sight: 2, trainer: TR('Veteran', 'Rex', L.ace, [['glaciwolf', 43], ['bouldrok', 43], ['gloomwing', 44]], { base: 60, intro: 'Only the strongest reach the summit!', lose: 'You might actually have a shot at the Champion.', after: 'The Champion has never lost a battle. Ever.' }) },
        { x: 12, y: 31, dir: 'up', look: L.acef, sight: 1, trainer: TR('Veteran', 'Nell', L.acef, [['oracervus', 44], ['puffaria', 44], ['blizzowl', 44]], { base: 60, intro: 'The thin air makes my creatures even sharper!', lose: 'Breathtaking...', after: 'Keep climbing. You\'re almost there.' }) },
        { x: 18, y: 14, dir: 'left', look: L.hiker, sight: 2, trainer: TR('Climber', 'Bjorn', L.hiker, [['cragtitan', 45], ['volcanor', 44], ['glacierra', 44]], { base: 32, intro: 'I\'ve climbed this path a hundred times!', lose: 'I\'ll make it a hundred and one.', after: 'Drakelets live up here. Super rare!' }) },
        { x: 13, y: 9, dir: 'up', look: L.ace, sight: 1, trainer: TR('Veteran', 'Vale', L.ace, [['wyrmling', 45], ['clawdron', 44], ['hauntwisp', 45], ['quakefang', 45]], { base: 60, intro: 'One final test before the summit!', lose: 'Go on. The summit awaits.', after: 'Your rival passed through here an hour ago.' }) },
        { x: 5, y: 22, dir: 'right', look: L.skier, sight: 1, trainer: TR('Skier', 'Tove', L.skier, [['blizzowl', 43], ['shardling', 43]], { base: 30, intro: 'Fresh powder and a fresh challenger!', lose: 'Avalanche of defeat!', after: 'Watch for falling snow up top.' }) },
      ],
      wild: { grass: { rate: 11, list: [['flurrbit', 40, 43, 14], ['blizzowl', 43, 45, 6], ['frostpup', 40, 43, 10], ['glaciwolf', 42, 45, 6], ['bouldrok', 40, 44, 10], ['skyraptor', 42, 45, 8], ['burrowolf', 40, 43, 8], ['quakefang', 44, 46, 3], ['shardling', 40, 43, 10], ['drakelet', 40, 44, 6], ['wyrmling', 44, 46, 2], ['gloomwing', 41, 44, 8, 'night'], ['hauntwisp', 41, 44, 8, 'night']] } },
    };
  }
  M.summit.region = 'summit'; M.summit.town = 'summit';

  // ---------- fast travel spots (just outside each Haven) ----------
  G.FLY = {
    fernhollow: { map: 'fernhollow', x: 6, y: 9, name: 'Fernhollow Town' },
    brookvale: { map: 'brookvale', x: 7, y: 8, name: 'Brookvale City' },
    emberfall: { map: 'emberfall', x: 5, y: 6, name: 'Emberfall Town' },
    stormcrest: { map: 'stormcrest', x: 6, y: 6, name: 'Stormcrest City' },
    mistmere: { map: 'mistmere', x: 5, y: 13, name: 'Mistmere Town' },
    frostvale: { map: 'frostvale', x: 5, y: 12, name: 'Frostvale Town' },
    summit: { map: 'summit', x: 7, y: 11, name: 'Verdania Summit' },
  };
  M.fernhollow.town = 'fernhollow';
  // region nodes for the Verdania Map (x, y on a 320x240 screen)
  G.REGION = {
    fernhollow: [48, 186, 'Fernhollow Town', 'town'], route1: [48, 160, 'Route 1'], brookvale: [48, 132, 'Brookvale City', 'town'],
    route2: [62, 98, 'Route 2'], cave: [92, 76, 'Whisper Cave', 'cave'], route3: [118, 98, 'Route 3'], emberfall: [128, 132, 'Emberfall Town', 'town'],
    route4: [178, 140, 'Route 4'], stormcrest: [228, 140, 'Stormcrest City', 'town'], route6: [244, 104, 'Route 6'], ruins: [282, 112, 'Sunken Ruins', 'cave'],
    mistmere: [244, 64, 'Mistmere Town', 'town'], route7: [196, 44, 'Whisperwood'], frostvale: [146, 40, 'Frostvale Town', 'town'],
    frost_hollow: [150, 14, 'Frost Hollow', 'cave'], route5: [108, 30, 'Summit Path'], summit: [72, 22, 'Verdania Summit', 'town'],
  };
  G.REGION_LINKS = [['fernhollow', 'route1'], ['route1', 'brookvale'], ['brookvale', 'route2'], ['route2', 'cave'], ['cave', 'route3'], ['route3', 'emberfall'], ['emberfall', 'route4'], ['route4', 'stormcrest'], ['stormcrest', 'route6'], ['route6', 'ruins'], ['route6', 'mistmere'], ['mistmere', 'route7'], ['route7', 'frostvale'], ['frostvale', 'frost_hollow'], ['frostvale', 'route5'], ['route5', 'summit']];
})();
