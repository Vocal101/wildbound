'use strict';
// The Verdania region: maps, NPCs, trainers, items, wild encounter tables.
(function () {
  const M = G.MAPS;
  const say = (...t) => G.sayAll(t);
  const W = () => G.world;

  // ---------- looks ----------
  const L = G.LOOKS = {
    mom: { hair: '#8c4c30', shirt: '#e88cb0', pants: '#5c4c78', shoes: '#6c4c3c', style: 'long' },
    prof: { hair: '#d8d8d8', shirt: '#f4f4f4', pants: '#6c5040', shoes: '#4c3c30', style: 'short' },
    aide: { hair: '#3c3c48', shirt: '#f4f4f4', pants: '#3c5c8c', shoes: '#3c3c48', style: 'short' },
    rival: { hair: '#e8c048', shirt: '#3c78c8', pants: '#2c2c3c', shoes: '#e05040', style: 'short' },
    nurse: { hair: '#f08cac', shirt: '#ffffff', pants: '#f8c8d8', shoes: '#f8f8f8', style: 'long' },
    clerk: { hair: '#4c3c30', shirt: '#4c84d8', pants: '#383c58', shoes: '#28283c', style: 'cap', accent: '#4c84d8' },
    youngster: { hair: '#4c3020', shirt: '#f0c040', pants: '#3c58a8', shoes: '#c03838', style: 'cap', accent: '#d84040' },
    lass: { hair: '#3c2c2c', shirt: '#f088b0', pants: '#384870', shoes: '#c04870', style: 'long' },
    bug: { hair: '#6c4c2c', shirt: '#68b848', pants: '#c8a868', shoes: '#4c3c2c', style: 'cap', accent: '#68b848' },
    hiker: { hair: '#5c3c24', shirt: '#a87848', pants: '#6c5c3c', shoes: '#3c2c1c', style: 'cap', accent: '#a82828' },
    fisher: { hair: '#3c2c1c', shirt: '#48a8b8', pants: '#3c4c5c', shoes: '#2c2c2c', style: 'cap', accent: '#f0d040' },
    old: { hair: '#e8e8e8', shirt: '#8c7058', pants: '#4c4c58', shoes: '#3c3028', style: 'short' },
    oldlady: { hair: '#d8d8e0', shirt: '#9c78b8', pants: '#5c4c6c', shoes: '#3c3028', style: 'long' },
    kid: { hair: '#c86830', shirt: '#58c8a8', pants: '#3c4c8c', shoes: '#e8e8e8', style: 'short' },
    girl: { hair: '#f0b848', shirt: '#e85858', pants: '#f8f8f8', shoes: '#e85858', style: 'long' },
    man: { hair: '#2c2c34', shirt: '#6c8c58', pants: '#3c3c4c', shoes: '#2c2c2c', style: 'short' },
    woman: { hair: '#a85830', shirt: '#d8c058', pants: '#4c5c7c', shoes: '#6c3c2c', style: 'long' },
    grunt: { hair: '#2c2c3c', shirt: '#383848', pants: '#2c2c3c', shoes: '#181820', style: 'cap', accent: '#2c2c3c', emblem: '#e04878', skin: '#e8c0a0' },
    rook: { hair: '#8c2c4c', shirt: '#4c2c5c', pants: '#2c2030', shoes: '#181820', style: 'short', emblem: '#e04878' },
    vex: { hair: '#f0f0f8', shirt: '#1c1c28', pants: '#1c1c28', shoes: '#e04878', style: 'long', emblem: '#e04878' },
    petra: { hair: '#8c6c48', shirt: '#a89878', pants: '#5c5040', shoes: '#3c3028', style: 'long' },
    ignatius: { hair: '#e84828', shirt: '#f08838', pants: '#3c2c2c', shoes: '#2c2020', style: 'short' },
    volta: { hair: '#f8e048', shirt: '#2c2c3c', pants: '#2c2c3c', shoes: '#f8e048', style: 'long' },
    seraphine: { hair: '#e8e8f8', shirt: '#7c5cc8', pants: '#3c2c68', shoes: '#f8d870', style: 'long' },
    ace: { hair: '#4c2c6c', shirt: '#d84848', pants: '#f0f0f0', shoes: '#2c2c3c', style: 'short' },
    acef: { hair: '#2c4c8c', shirt: '#4c8cd8', pants: '#f0f0f0', shoes: '#2c2c3c', style: 'long' },
    sailor: { hair: '#2c2c2c', shirt: '#f0f0f8', pants: '#3c58a8', shoes: '#2c2c2c', style: 'cap', accent: '#f0f0f8' },
    kindler: { hair: '#c84028', shirt: '#7c4c2c', pants: '#4c3c2c', shoes: '#2c2020', style: 'short' },
    guide: { hair: '#4c3c30', shirt: '#58a858', pants: '#3c3c4c', shoes: '#2c2c2c', style: 'cap', accent: '#f0d040' },
    guard: { hair: '#2c2c34', shirt: '#4c5c8c', pants: '#2c3048', shoes: '#181820', style: 'cap', accent: '#2c3048' },
  };

  // ---------- trainer helper ----------
  let tc = 0;
  const TR = (cls, name, look, party, o = {}) => Object.assign({ id: o.id || ('t' + (++tc)), name: cls + ' ' + name, look, party, base: o.base || 20 }, o);

  // ---------- interior templates ----------
  function haven(id, name, exit, ex, ey) {
    M[id] = {
      name: name + ' Haven', indoor: true, music: 'haven', bg: 'indoor',
      rows: ['WWWWWhWWWWWWW', 'gggggggggggPg', 'pgggkkkkkgggp', 'ggggggggggggg', 'ggggggggggggg', 'ggtgggggggtgg', 'ggggggggggggg', 'xxxxxxmxxxxxx'],
      warps: [{ x: 6, y: 7, to: exit, tx: ex, ty: ey, dir: 'down' }],
      npcs: [
        { id: 'nurse', x: 6, y: 1, look: L.nurse, speaker: 'Nurse', talk: () => G.story.nurse(id) },
        { x: 2, y: 4, look: L.kid, move: 'wander', talk: G.pick([['The nurse here heals your team for free. Isn\'t that amazing?'], ['You can store extra creatures in the PC over there.']]) },
        { x: 10, y: 3, look: L.woman, move: 'turn', talk: ['Some creatures evolve when they reach a certain level. Others need a special stone.'] },
      ],
    };
  }
  function shop(id, exit, ex, ey, stock) {
    M[id] = {
      name: 'Supply Shop', indoor: true, music: 'haven', bg: 'indoor',
      rows: ['WWWWWWWWWWW', 'gkgggggbbgg', 'gkggggggggg', 'gkgggggbbgg', 'ggggggggggg', 'ggggggggggg', 'xxxxxmxxxxx'],
      warps: [{ x: 5, y: 6, to: exit, tx: ex, ty: ey, dir: 'down' }],
      npcs: [
        { id: 'clerk', x: 0, y: 2, dir: 'right', look: L.clerk, talk: () => G.shop(stock) },
        { x: 6, y: 4, look: L.man, move: 'wander', talk: ['Great Orbs catch creatures more easily than Bind Orbs. Worth the price!'] },
      ],
    };
  }
  function house(id, name, exit, ex, ey, npcs, rows) {
    M[id] = {
      name, indoor: true, music: 'town', bg: 'indoor',
      rows: rows || ['WwWbbWWwW', 'fffffffff', 'fttffffff', 'fttffrrff', 'fffffrrff', 'pfffffffp', 'xxxxmxxxx'],
      warps: [{ x: 4, y: 6, to: exit, tx: ex, ty: ey, dir: 'down' }], npcs,
    };
  }
  function hall(id, name, exit, ex, ey, npcs) {
    M[id] = {
      name, indoor: true, music: 'trainer', bg: 'hall',
      rows: ['WWWWWWWWWWW', 'qqqqqqqqqqq', 'qQqqqqqqqQq', 'qqqqqqqqqqq', 'qQqqqqqqqQq', 'qqqqqqqqqqq', 'qQqqqqqqqQq', 'qqqqqqqqqqq', 'qQqqqqqqqQq', 'qqqqqqqqqqq', 'Zqqqqqqqqqz'.replace('z', 'Z'), 'xxxxxmxxxxx'],
      warps: [{ x: 5, y: 11, to: exit, tx: ex, ty: ey, dir: 'down' }], npcs,
    };
  }

  G.MAPT = { haven, shop, house, hall, TR };

  // =====================================================================
  // FERNHOLLOW
  // =====================================================================
  M.home = {
    name: 'Home', indoor: true, music: 'town', bg: 'indoor',
    rows: ['WwWbbWWwWW', 'ffffffffYf', 'fVffffffYf', 'fffrrrrfff', 'ffttrrrfff', 'ffttrrrfff', 'ffffffffpf', 'xxxxmxxxxx'],
    warps: [{ x: 4, y: 7, to: 'fernhollow', tx: 6, ty: 9, dir: 'down' }],
    npcs: [{ id: 'mom', x: 4, y: 4, dir: 'left', look: L.mom, talk: () => G.story.mom() }],
  };
  house('rivalhouse', '{RIVAL}\'s House', 'fernhollow', 21, 9, [
    { x: 3, y: 3, dir: 'right', look: L.woman, speaker: 'Lena', talk: () => G.story.rivalSister() },
    { x: 6, y: 1, look: L.old, move: 'turn', speaker: 'Grandpa', talk: ['My grandson {RIVAL} has been bouncing off the walls all morning.', 'He\'s determined to become the Champion of Verdania. Hah! Just like I was at his age.'] },
  ]);
  M.lab = {
    name: 'Wren Lab', indoor: true, music: 'town', bg: 'indoor',
    rows: ['WbbWWWWWbbW', 'ffffffffffP', 'fffffffffff', 'fffftttffff', 'fffffffffff', 'bfffffffffb', 'fffffffffff', 'fffffffffff', 'fffffffffff', 'xxxxxmxxxxx'],
    warps: [{ x: 5, y: 9, to: 'fernhollow', tx: 13, ty: 18, dir: 'down' }],
    npcs: [
      { id: 'prof', x: 5, y: 2, look: L.prof, speaker: 'Prof. Wren', talk: () => G.story.profTalk() },
      { id: 'rival', x: 3, y: 5, dir: 'up', look: L.rival, cond: '!rival1', speaker: '{RIVAL}', talk: () => G.story.rivalLabTalk() },
      { x: 8, y: 7, look: L.aide, move: 'wander', speaker: 'Aide', talk: ['The professor has spent thirty years studying wild creatures.', 'He says each one has a personality as unique as a person\'s.'] },
      { x: 1, y: 7, look: L.aide, move: 'turn', speaker: 'Aide', talk: () => G.hasFlag('dex') ? ['The Wildling Dex records every creature you see and catch.', 'Fill it up and the professor might just give you something special!'] : ['The professor is choosing three young creatures for new trainers.'] },
    ],
    interact: (x, y) => (y === 3 && x >= 4 && x <= 6 ? G.story.starterTable(x) : null),
    decor: (c, cx, cy) => { for (let x = 4; x <= 6; x++) if (!G.hasFlag('starter_x' + x)) c.drawImage(G.orbSprite('bindorb', 10), x * 16 - cx + 3, 3 * 16 - cy + 2); },
    triggers: [{ x: 4, y: 8, w: 3, h: 1, cond: ['starter', '!rival1'], run: () => G.story.rivalLabBattle() }],
  };

  // =====================================================================
  // ROUTE 1
  // =====================================================================

  // =====================================================================
  // BROOKVALE CITY
  // =====================================================================
  house('brook_house', 'Cycle Workshop', 'brookvale', 6, 20, [
    { x: 6, y: 2, dir: 'down', look: L.man, speaker: 'Mechanic', talk: () => G.story.bikeGuy() },
    { x: 2, y: 4, look: L.kid, move: 'wander', talk: ['My dad builds folding bikes! They\'re twice as fast as running.'] },
  ]);
  hall('brook_hall', 'Brookvale Hall', 'brookvale', 25, 20, [
    { x: 5, y: 1, dir: 'down', look: L.petra, speaker: 'Petra', talk: () => G.story.warden('petra') },
    { x: 3, y: 6, dir: 'right', look: L.hiker, sight: 4, trainer: TR('Climber', 'Bram', L.hiker, [['pebblin', 9], ['pebblin', 10]], { base: 30, intro: 'You want to challenge Petra? Get through my rocks first!', lose: 'Crushed... like gravel.', after: 'Petra\'s creatures are even harder than mine.' }) },
    { x: 7, y: 9, dir: 'down', look: L.guide, speaker: 'Hall Guide', talk: ['Welcome to Brookvale Hall! Warden Petra trains Stone types.', 'Stone shrugs off Normal and Fire moves, but Water, Plant, Brawl, and Earth hit hard!'] },
  ]);

  // =====================================================================
  // ROUTE 2
  // =====================================================================

  // =====================================================================
  // WHISPER CAVE
  // =====================================================================
  M.cave = {
    name: 'Whisper Cave', music: 'cave', bg: 'cave', cave: true, border: 'C', dark: true,
    rows: [
      'CCCCCCCCCCCCCCCCCCCCcCCC',
      'CCccccCCCCCCCCCCCCccccCC',
      'CCccccccccCCCCCCcccccCCC',
      'CCcccKccccccCCCcccccccCC',
      'CCCCcccccccccccccKccccCC',
      'CCCCcccCCCCCCcccccccCCCC',
      'CCcccccCCCCCCcccCCCCCCCC',
      'CCcccccccccccccccccccCCC',
      'CCccKcccccccccccccKccCCC',
      'CCccccCCCCCCCCcccccccCCC',
      'CCccccCCCCCCCCcccccccCCC',
      'CCccccccccccCCccccccccCC',
      'CCCOccccccccCCcccccccCCC',
      'CCCCCCccccccccccccCCCCCC',
      'CCCCCCccccccccccccCCCCCC',
      'CCCCCCCCCCccccCCCCCCCCCC',
      'CCCCCCCCCCccccCCCCCCCCCC',
      'CCCCCCCCCCcccccCCCCCCCCC',
      'CCCCCCCCCCccccCCCCCCCCCC',
      'CCCCCCCCCCCCcCCCCCCCCCCC',
    ],
    warps: [{ x: 12, y: 19, to: 'route2', tx: 30, ty: 2, dir: 'down' }, { x: 20, y: 0, to: 'route3', tx: 4, ty: 18, dir: 'up' }, { x: 3, y: 12, to: 'cave_b1', tx: 5, ty: 3, dir: 'down' }],
    items: [{ x: 3, y: 8, item: 'moonstone' }, { x: 21, y: 11, item: 'disc08' }, { x: 3, y: 1, item: 'escaperope' }, { x: 16, y: 14, item: 'ether' }, { x: 10, y: 17, item: 'potion', n: 2 }, { x: 7, y: 11, item: 'rarecandy', hidden: true }],
    npcs: [
      { x: 12, y: 7, dir: 'down', look: L.grunt, sight: 4, trainer: TR('Grunt', '', L.grunt, [['slitherin', 11], ['nibbit', 11]], { id: 'cave_g1', base: 30, name: 'Syndicate Grunt', intro: 'You\'re not supposed to be down here! The Syndicate is digging for treasure!', lose: 'Ugh! I\'m just a lowly grunt!', after: 'Admin Rook is up ahead. He\'ll squash you flat.' }) },
      { x: 4, y: 3, dir: 'right', look: L.grunt, sight: 4, trainer: TR('Grunt', '', L.grunt, [['duskwing', 11], ['duskwing', 12]], { id: 'cave_g2', base: 30, name: 'Syndicate Grunt', intro: 'Hey! Who let a kid in here?', lose: 'Bah! The boss won\'t be happy...', after: 'We\'re looking for Aether Shards. They glow in the dark.' }) },
      { id: 'rook1', x: 20, y: 1, dir: 'down', look: L.rook, cond: '!rook1', speaker: 'Rook', talk: () => G.story.rookCave() },
      { x: 15, y: 8, look: L.hiker, move: 'wander', talk: ['These Syndicate folks have been chipping away at the cave walls for days.', 'They\'re scaring the wild creatures half to death!'] },
    ],
    triggers: [{ x: 15, y: 3, w: 7, h: 1, cond: '!rook1', run: () => G.story.rookCave() }],
    wild: { cave: { rate: 9, list: [['duskwing', 9, 12, 35], ['pebblin', 9, 12, 30], ['brawlet', 10, 12, 12], ['magmite', 10, 12, 8], ['wispette', 10, 13, 10], ['crabbit', 10, 12, 5]] } },
  };

  // =====================================================================
  // ROUTE 3 (volcanic)
  // =====================================================================
  M.route3 = {
    name: 'Route 3', music: 'route', bg: 'ash',
    rows: [
      'TTTTTTTTTTTTTT==TTTTTT',
      'TTvvvvvvvvvvvv==vvvvTT',
      'TTvaaaaavvvvvv==vaaaTT',
      'TTvaaaaavvvvvv==vaaaTT',
      'TTvaaaaavvvvvv==vvvvTT',
      'TTvvvvvvvv======vvvvTT',
      'TTvvvvvvvv=vvvvvvvvvTT',
      'TTllllvvvv=vvvvaaaavTT',
      'TTllllvvvv=vvvvaaaavTT',
      'TTvvvvvvvv=vvvvaaaavTT',
      'TTvvvvvvvv=vvvvvvvvvTT',
      'TTLLLLLLvv=vvLLLLLLLTT',
      'TTvvvvvvvv=vvvvvvvvvTT',
      'TTvaaaavvv=vvvaaaaavTT',
      'TTvaaaavvv=vvvaaaaavTT',
      'TTvaaaavvv=vvvaaaaavTT',
      'TTvvvvvvvv=vvvvvvvvvTT',
      'TTvv=======vvvvvvvvvTT',
      'TTvv=vvvvvvvvvvvvvvvTT',
      '####E#################',
    ],
    exits: { n: { to: 'emberfall', d: -2 } },
    warps: [{ x: 4, y: 19, to: 'cave', tx: 20, ty: 1, dir: 'down' }],
    items: [{ x: 19, y: 1, item: 'burnsalve', n: 2 }, { x: 2, y: 10, item: 'superpotion' }, { x: 19, y: 16, item: 'xattack' }],
    npcs: [
      { x: 16, y: 9, dir: 'left', look: L.hiker, sight: 4, trainer: TR('Climber', 'Dale', L.hiker, [['magmite', 15], ['pebblin', 15], ['bouldrok', 16]], { base: 30, intro: 'The ground here is hot enough to cook an egg!', lose: 'Ow, ow! Hot loss!', after: 'Emberfall\'s hot springs are great for sore muscles.' }) },
      { x: 6, y: 14, dir: 'right', look: L.kindler, sight: 4, trainer: TR('Kindler', 'Ash', L.kindler, [['embercub', 15], ['magmite', 16]], { base: 28, intro: 'Feel the burn!', lose: 'My fire went out...', after: 'Warden Ignatius can melt a boulder with a glare.' }) },
      { x: 12, y: 3, look: L.man, move: 'wander', talk: ['The creatures around here love the heat. Frostpup never come this way!'] },
    ],
    triggers: [{ x: 8, y: 10, w: 5, h: 1, cond: '!rival2', run: () => G.story.rival2() }],
    wild: { grass: { rate: 11, list: [['magmite', 13, 16, 25], ['slitherin', 13, 16, 20], ['brawlet', 13, 16, 15], ['zapkit', 13, 16, 12], ['galeclaw', 15, 17, 12], ['psyfawn', 14, 16, 6], ['wispette', 14, 16, 10, 'night']] } },
  };

  // =====================================================================
  // EMBERFALL TOWN
  // =====================================================================
  M.emberfall = {
    name: 'Emberfall Town', music: 'town', bg: 'ash',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TTvvvvvvvvvvvvvvvvvvvvTT',
      'TTvvvvvvvvvvvvvvvvvvvvTT',
      'TTvvvvvvvvvvvvvvvvvvvvTT',
      'TTvvvvvvvvvvvvvvvvvvvvTT',
      'TTvvvvvvvvvvvvvvvvvvvvTT',
      'TTvv================vvTT',
      'TTvvvvvvvvvv==vvvvvvvv==',
      'TTvvvvvvvvvv============',
      'TTvvvvvvvvvv==vvvvvvvvTT',
      'TTllllvvvvvv==vvvvvvvvTT',
      'TTllllvvvvvv==vvvvvvvvTT',
      'TTvvvvvvvvvv==vvvvvvvvTT',
      'TTvvvvvvvvvv==vvvvvvvvTT',
      'TTvvvvvvvvvv==vvvvvvvvTT',
      'TTvvvvvvvvvv==vvvvvvvvTT',
      'TTvvvvvvvvvv========vvTT',
      'TTvSvvvvvvvv==vvvvvvvvTT',
      'TTvvvvvvvvvv==vvvvvvvvTT',
      'TTTTTTTTTTTT==TTTTTTTTTT',
    ],
    buildings: [
      { kind: 'haven', x: 3, y: 2, to: 'ember_haven', tx: 6, ty: 6 },
      { kind: 'shop', x: 16, y: 2, to: 'ember_shop', tx: 5, ty: 5 },
      { kind: 'hall', x: 15, y: 11, to: 'ember_hall', tx: 5, ty: 10 },
      { kind: 'house', x: 3, y: 12, to: 'ember_house', tx: 4, ty: 5 },
    ],
    exits: { s: { to: 'route3', d: 2 }, e: { to: 'route4', d: 0 } },
    signs: [{ x: 3, y: 17, text: 'EMBERFALL TOWN - "Warm springs, warmer hearts."' }],
    npcs: [
      { id: 'ranger_a', x: 22, y: 7, dir: 'left', look: L.guard, cond: '!badge2', speaker: 'Ranger', talk: ['The coast road east is dangerous for new trainers.', 'Earn the Ember Sigil from Warden Ignatius and I\'ll let you through.'] },
      { id: 'ranger_b', x: 22, y: 8, dir: 'left', look: L.guard, cond: '!badge2', speaker: 'Ranger', talk: ['Sorry, kid. Rules are rules. Ember Sigil first!'] },
      { x: 8, y: 9, look: L.oldlady, move: 'wander', talk: ['Those steaming pools are lava, dear. Don\'t touch!'] },
      { x: 19, y: 18, look: L.kid, move: 'wander', talk: ['Ignatius is super cool! His creatures breathe fire!'] },
    ],
  };
  haven('ember_haven', 'Emberfall', 'emberfall', 5, 6);
  shop('ember_shop', 'emberfall', 18, 6, ['bindorb', 'greatorb', 'potion', 'superpotion', 'revive', 'antidote', 'unjolt', 'wakebell', 'burnsalve', 'thawdrop', 'fullheal', 'repel', 'superrepel', 'escaperope']);
  house('ember_house', 'Shine Collector\'s House', 'emberfall', 5, 16, [
    { x: 6, y: 2, dir: 'down', look: L.oldlady, speaker: 'Collector', talk: () => G.story.shinyCollector() },
    { x: 2, y: 4, look: L.man, move: 'turn', talk: ['Mom collects shiny creatures. Only about one in five hundred wild ones sparkle like that!'] },
  ]);
  hall('ember_hall', 'Emberfall Hall', 'emberfall', 18, 16, [
    { x: 5, y: 1, dir: 'down', look: L.ignatius, speaker: 'Ignatius', talk: () => G.story.warden('ignatius') },
    { x: 3, y: 6, dir: 'right', look: L.kindler, sight: 4, trainer: TR('Kindler', 'Blaze', L.kindler, [['magmite', 17], ['embercub', 17]], { base: 28, intro: 'Ignatius taught me everything about fire!', lose: 'Fizzled out...', after: 'Water moves make fire types sizzle.' }) },
    { x: 7, y: 4, dir: 'left', look: L.kindler, sight: 4, trainer: TR('Kindler', 'Cinda', L.lass, [['blazefang', 18]], { base: 28, intro: 'You\'ll never get past my flames!', lose: 'Extinguished!', after: 'The Warden is just up ahead. Good luck!' }) },
    { x: 7, y: 9, dir: 'down', look: L.guide, speaker: 'Hall Guide', talk: ['Warden Ignatius uses Fire types. They\'re weak to Water, Earth, and Stone.', 'Bring a Burn Salve or two!'] },
  ]);

  // =====================================================================
  // ROUTE 4 (coast)
  // =====================================================================

  // =====================================================================
  // STORMCREST CITY
  // =====================================================================
  G.ITEMS.disc07.price = 3000; G.ITEMS.disc12.price = 2500; G.ITEMS.disc11.price = 2500;
  hall('storm_hall', 'Stormcrest Hall', 'stormcrest', 25, 7, [
    { x: 5, y: 1, dir: 'down', look: L.volta, speaker: 'Volta', talk: () => G.story.warden('volta') },
    { x: 3, y: 6, dir: 'right', look: L.ace, sight: 4, trainer: TR('Engineer', 'Watts', L.man, [['zapkit', 26], ['zapkit', 26], ['voltlynx', 27]], { base: 40, intro: 'Volta\'s Hall runs on pure power!', lose: 'Short-circuited!', after: 'Earth types are immune to Spark moves. Just saying.' }) },
    { x: 7, y: 4, dir: 'left', look: L.acef, sight: 4, trainer: TR('Veteran', 'Kira', L.acef, [['galeclaw', 27], ['lumimoth', 27]], { base: 60, intro: 'This is the final test before Volta!', lose: 'Shocking...', after: 'Go get her!' }) },
    { x: 7, y: 9, dir: 'down', look: L.guide, speaker: 'Hall Guide', talk: ['Warden Volta specializes in Spark types. Earth types are completely immune to them!'] },
  ]);

  // ---------- Syndicate Tower ----------
  M.hq1 = {
    name: 'Syndicate Tower', indoor: true, dungeon: true, music: 'hq', bg: 'hq',
    rows: ['NNNNNNNNNNNNNNNN', 'nnMnnnnnnnnnnnun', 'nnnnnnnnnnnnnnnn', 'NNNNNNNNnnNNNNNN', 'nnnnnnnnnnnnnnnn', 'nMnnnnnnnnnnnnMn', 'nnnnnnnNNnnnnnnn', 'nnnnnnnNNnnnnnnn', 'NNNNNnnnnnnNNNNN', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'xxxxxxxmxxxxxxxx'],
    warps: [{ x: 7, y: 11, to: 'stormcrest', tx: 7, ty: 16, dir: 'down' }, { x: 14, y: 1, to: 'hq2', tx: 13, ty: 10, dir: 'left' }],
    items: [{ x: 1, y: 9, item: 'superpotion', n: 2 }, { x: 1, y: 1, item: 'disc05' }, { x: 15, y: 4, item: 'revive' }],
    npcs: [
      { x: 3, y: 9, dir: 'right', look: L.grunt, sight: 4, trainer: TR('Grunt', '', L.grunt, [['cobrax', 23], ['gnawbeast', 23]], { id: 'hq_g1', name: 'Syndicate Grunt', base: 30, intro: 'An intruder! Stop right there!', lose: 'Gah! Sound the alarm!', after: 'The boss is upstairs. You\'ll regret going up there.' }) },
      { x: 12, y: 4, dir: 'left', look: L.grunt, sight: 5, trainer: TR('Grunt', '', L.grunt, [['gloomwing', 24], ['slitherin', 22], ['duskwing', 22]], { id: 'hq_g2', name: 'Syndicate Grunt', base: 30, intro: 'Once we awaken the guardian, the whole region will obey the Syndicate!', lose: 'This wasn\'t in the plan!', after: 'The Aether Shards will awaken Aurelis... or so the boss says.' }) },
      { x: 9, y: 1, dir: 'down', look: L.grunt, sight: 2, trainer: TR('Grunt', '', L.grunt, [['magmite', 24], ['brawlet', 24]], { id: 'hq_g3', name: 'Syndicate Grunt', base: 30, intro: 'You\'ll never reach the stairs!', lose: 'Ack! Fine, go up!', after: 'Boss Vex is not someone you want to anger.' }) },
      { x: 4, y: 4, look: L.man, move: 'turn', speaker: 'Engineer', cond: '!hq_clear', talk: ['They locked us out of the city\'s power controls!', 'Their leader, Vex, is on the top floor.'] },
    ],
  };
  M.hq2 = {
    name: 'Syndicate Tower', indoor: true, dungeon: true, music: 'hq', bg: 'hq',
    rows: ['NNNNNNNNNNNNNNNN', 'nnnnnnnMMnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'NNNNNNNnnNNNNNNN', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnun', 'NNNNNNNNNNNNNNNN'],
    warps: [{ x: 14, y: 10, to: 'hq1', tx: 13, ty: 1, dir: 'left' }],
    items: [{ x: 1, y: 7, item: 'ultraorb', n: 2 }],
    npcs: [
      { id: 'rook2', x: 7, y: 6, dir: 'down', look: L.rook, cond: '!rook2', speaker: 'Rook', talk: () => G.story.rookHQ() },
      { id: 'vex', x: 8, y: 2, dir: 'down', look: L.vex, cond: '!hq_clear', speaker: 'Vex', talk: () => G.story.vex() },
    ],
    triggers: [
      { x: 6, y: 7, w: 4, h: 1, cond: '!rook2', run: () => G.story.rookHQ() },
      { x: 6, y: 4, w: 4, h: 1, cond: ['rook2', '!hq_clear'], run: () => G.story.vex() },
    ],
  };

  // =====================================================================
  // ROUTE 5 / SUMMIT PATH
  // =====================================================================
  M.summit = {
    name: 'Verdania Summit', music: 'summit', bg: 'summit',
    rows: ['################', '#############E##', '##...........=##', '##...........=##', '##...........=##', '##...........=##', '##...........=##', '##...........=##', '##.....=.....=##', '##.....=======##', '##.*......==.*##', '##........==..##', '##........==..##', '##########==####'],
    buildings: [{ kind: 'hall', x: 4, y: 3, to: 'champion', tx: 5, ty: 10 }],
    exits: { s: { to: 'route5', d: 0 } },
    warps: [{ x: 13, y: 1, to: 'shrine', tx: 5, ty: 8, dir: 'up' }],
    npcs: [
      { id: 'elder', x: 13, y: 2, dir: 'down', look: L.old, cond: '!champion', speaker: 'Elder', talk: ['Beyond me lies the Shrine of Dawn, where the guardian Aurelis sleeps.', 'Only the Champion may enter. Prove yourself first, young one.'] },
      { id: 'rival3', x: 7, y: 9, dir: 'down', look: L.rival, cond: '!rival3', speaker: '{RIVAL}', talk: () => G.story.rival3() },
      { x: 3, y: 11, look: L.nurse, dir: 'right', speaker: 'Nurse', talk: () => G.story.summitNurse() },
    ],
    triggers: [{ x: 10, y: 10, w: 2, h: 1, cond: '!rival3', run: () => G.story.rival3() }],
  };
  M.champion = {
    name: 'Champion\'s Hall', indoor: true, music: 'boss', bg: 'shrine',
    rows: ['WWWWWWWWWWW', 'ooooooooooo', 'oQoooooooQo', 'ooooooooooo', 'oQoooooooQo', 'ooooooooooo', 'oQoooooooQo', 'ooooooooooo', 'oQoooooooQo', 'ooooooooooo', 'ZoooooooooZ', 'xxxxxmxxxxx'],
    warps: [{ x: 5, y: 11, to: 'summit', tx: 7, ty: 8, dir: 'down' }],
    npcs: [{ id: 'seraphine', x: 5, y: 2, dir: 'down', look: L.seraphine, speaker: 'Seraphine', talk: () => G.story.champion() }],
  };
  M.shrine = {
    name: 'Shrine of Dawn', indoor: true, music: 'summit', bg: 'shrine',
    rows: ['WWWWWAWWWWW', 'ooooooooooo', 'ooQoooooQoo', 'ooooooooooo', 'ooQoooooQoo', 'ooooooooooo', 'ooQoooooQoo', 'ooooooooooo', 'ooooooooooo', 'xxxxxmxxxxx'],
    warps: [{ x: 5, y: 9, to: 'summit', tx: 13, ty: 2, dir: 'down' }],
    npcs: [{ id: 'aurelis', x: 5, y: 2, dir: 'down', mon: 'aurelis', cond: '!aurelis_done', noFace: true, talk: () => G.story.aurelis() }],
  };
})();
