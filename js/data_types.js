'use strict';
// Elemental types and the effectiveness chart.
(function () {
  const T = G.TYPES = {
    Normal:  { color: '#a8a088', dark: '#6c6858', short: 'NORM' },
    Fire:    { color: '#f07838', dark: '#a84818', short: 'FIRE' },
    Water:   { color: '#5890f0', dark: '#2858a8', short: 'WATR' },
    Plant:   { color: '#68c048', dark: '#3c7c28', short: 'PLNT' },
    Spark:   { color: '#f0c828', dark: '#a08010', short: 'SPRK' },
    Ice:     { color: '#88d8d8', dark: '#4c9090', short: 'ICE' },
    Brawl:   { color: '#c03828', dark: '#802018', short: 'BRWL' },
    Toxic:   { color: '#a048a0', dark: '#682868', short: 'TOXC' },
    Earth:   { color: '#d8b858', dark: '#907430', short: 'ERTH' },
    Wind:    { color: '#98a8f0', dark: '#5c68b0', short: 'WIND' },
    Mind:    { color: '#f05888', dark: '#a83058', short: 'MIND' },
    Bug:     { color: '#a8b820', dark: '#6c7810', short: 'BUG' },
    Stone:   { color: '#b8a038', dark: '#786420', short: 'STNE' },
    Spirit:  { color: '#7058a0', dark: '#463468', short: 'SPRT' },
    Drake:   { color: '#7038f8', dark: '#4420a8', short: 'DRKE' },
  };
  G.TYPE_LIST = Object.keys(T);
  // attacker: { 2: [...], h: [...half], 0: [...immune] }
  const C = {
    Normal: { 2: [], h: ['Stone'], 0: ['Spirit'] },
    Fire:   { 2: ['Plant', 'Ice', 'Bug'], h: ['Fire', 'Water', 'Stone', 'Drake'], 0: [] },
    Water:  { 2: ['Fire', 'Earth', 'Stone'], h: ['Water', 'Plant', 'Drake'], 0: [] },
    Plant:  { 2: ['Water', 'Earth', 'Stone'], h: ['Fire', 'Plant', 'Toxic', 'Wind', 'Bug', 'Drake'], 0: [] },
    Spark:  { 2: ['Water', 'Wind'], h: ['Spark', 'Plant', 'Drake'], 0: ['Earth'] },
    Ice:    { 2: ['Plant', 'Earth', 'Wind', 'Drake'], h: ['Fire', 'Water', 'Ice'], 0: [] },
    Brawl:  { 2: ['Normal', 'Ice', 'Stone'], h: ['Toxic', 'Wind', 'Mind', 'Bug'], 0: ['Spirit'] },
    Toxic:  { 2: ['Plant'], h: ['Toxic', 'Earth', 'Stone', 'Spirit'], 0: [] },
    Earth:  { 2: ['Fire', 'Spark', 'Toxic', 'Stone'], h: ['Plant', 'Bug'], 0: ['Wind'] },
    Wind:   { 2: ['Plant', 'Brawl', 'Bug'], h: ['Spark', 'Stone'], 0: [] },
    Mind:   { 2: ['Brawl', 'Toxic'], h: ['Mind'], 0: [] },
    Bug:    { 2: ['Plant', 'Mind'], h: ['Fire', 'Brawl', 'Toxic', 'Wind', 'Spirit'], 0: [] },
    Stone:  { 2: ['Fire', 'Ice', 'Wind', 'Bug'], h: ['Brawl', 'Earth'], 0: [] },
    Spirit: { 2: ['Mind', 'Spirit'], h: [], 0: ['Normal'] },
    Drake:  { 2: ['Drake'], h: [], 0: [] },
  };
  G.typeEff = (atk, defTypes) => {
    let m = 1; const c = C[atk]; if (!c) return 1;
    for (const d of defTypes) {
      if (c[0].includes(d)) m *= 0; else if (c[2].includes(d)) m *= 2; else if (c.h.includes(d)) m *= 0.5;
    }
    return m;
  };
})();
