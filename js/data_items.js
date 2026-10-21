'use strict';
// Items. pocket: items | med | orbs | discs | key
(function () {
  const I = G.ITEMS = {};
  const add = (id, name, pocket, price, desc, fx = {}) => { I[id] = { id, name, pocket, price, desc, fx }; };

  // medicine
  add('potion', 'Tonic', 'med', 200, 'Restores 20 HP to one creature.', { heal: 20, battle: true });
  add('superpotion', 'Strong Tonic', 'med', 600, 'Restores 60 HP to one creature.', { heal: 60, battle: true });
  add('hyperpotion', 'Vital Tonic', 'med', 1200, 'Restores 150 HP to one creature.', { heal: 150, battle: true });
  add('maxpotion', 'Full Tonic', 'med', 2400, 'Fully restores HP.', { heal: 9999, battle: true });
  add('fullrestore', 'Panacea', 'med', 3000, 'Fully restores HP and cures status.', { heal: 9999, cure: 'all', battle: true });
  add('revive', 'Rekindle Herb', 'med', 1500, 'Revives a fainted creature with half its HP.', { revive: 0.5, battle: true });
  add('maxrevive', 'Dawn Herb', 'med', 4000, 'Revives a fainted creature with full HP.', { revive: 1, battle: true });
  add('antidote', 'Antidote', 'med', 100, 'Cures poison.', { cure: 'psn', battle: true });
  add('burnsalve', 'Burn Salve', 'med', 250, 'Heals a burn.', { cure: 'brn', battle: true });
  add('unjolt', 'Unjolt Tonic', 'med', 200, 'Cures paralysis.', { cure: 'par', battle: true });
  add('wakebell', 'Wake Bell', 'med', 250, 'A loud bell that wakes a sleeping creature.', { cure: 'slp', battle: true });
  add('thawdrop', 'Thaw Drop', 'med', 250, 'Thaws a frozen creature.', { cure: 'frz', battle: true });
  add('fullheal', 'Cure-All', 'med', 600, 'Cures any status problem.', { cure: 'all', battle: true });
  add('ether', 'Focus Drop', 'med', 1200, 'Restores 10 EN to one move.', { pp: 10, battle: true });
  add('elixir', 'Focus Bundle', 'med', 3000, 'Restores 10 EN to all moves.', { ppAll: 10, battle: true });
  add('rarecandy', 'Growth Candy', 'med', 4800, 'Raises a creature\'s level by 1.', { levelup: true });
  add('berry', 'Sweetfruit', 'med', 80, 'A sweet fruit. Restores 10 HP.', { heal: 10, battle: true });

  // battle items + field items
  add('xattack', 'Power Draught', 'items', 500, 'Greatly raises Attack during one battle.', { boost: 'atk' });
  add('xdefense', 'Guard Draught', 'items', 550, 'Greatly raises Defense during one battle.', { boost: 'def' });
  add('xspatk', 'Mind Draught', 'items', 350, 'Greatly raises Sp. Atk during one battle.', { boost: 'spa' });
  add('xspeed', 'Swift Draught', 'items', 350, 'Greatly raises Speed during one battle.', { boost: 'spe' });
  add('repel', 'Ward Spray', 'items', 350, 'Keeps weak wild creatures away for 100 steps.', { repel: 100 });
  add('superrepel', 'Strong Ward', 'items', 500, 'Keeps weak wild creatures away for 200 steps.', { repel: 200 });
  add('escaperope', 'Return Feather', 'items', 550, 'Whisks you out of a cave or tower, back to where you last rested.', { escape: true });
  add('thunderstone', 'Storm Stone', 'items', 2100, 'A crackling stone. Makes certain creatures evolve.', { evo: true });
  add('moonstone', 'Lunar Stone', 'items', 2100, 'A pale, softly glowing stone. Makes certain creatures evolve.', { evo: true });
  add('nugget', 'Gold Nugget', 'items', 10000, 'A lump of pure gold. Sells for a high price.', {});

  // orbs (capture devices)
  add('bindorb', 'Bind Orb', 'orbs', 200, 'A device for catching wild creatures.', { ball: 1 });
  add('greatorb', 'Snare Orb', 'orbs', 600, 'A better orb with a higher catch rate.', { ball: 1.5 });
  add('ultraorb', 'Apex Orb', 'orbs', 1200, 'A high-grade orb with an even higher catch rate.', { ball: 2 });
  add('netorb', 'Tide Orb', 'orbs', 1000, 'Works especially well on Water and Bug creatures.', { ball: 'net' });
  add('duskorb', 'Night Orb', 'orbs', 1000, 'Works well at night or in caves.', { ball: 'dusk' });
  add('quickorb', 'Swift Orb', 'orbs', 1000, 'Works best when thrown at the start of a battle.', { ball: 'quick' });
  add('masterorb', 'Sovereign Orb', 'orbs', 0, 'The ultimate orb. It never fails.', { ball: 255 });

  // key items
  add('bike', 'Bicycle', 'key', 0, 'A folding bike. Ride it to move twice as fast.', { key: 'bike' });
  add('oldrod', 'Bamboo Rod', 'key', 0, 'A simple fishing rod. Face water and use it to fish.', { key: 'rod', rod: 1 });
  add('goodrod', 'Steel Rod', 'key', 0, 'A sturdy rod that hooks stronger creatures.', { key: 'rod', rod: 2 });
  add('shard', 'Aether Shard', 'key', 0, 'A shard that glows with a strange inner light.', {});
  add('keycard', 'Tower Keycard', 'key', 0, 'Opens locked doors in the Syndicate Tower.', {});
  add('shinycharm', 'Glimmer Charm', 'key', 0, 'A glittering charm. Shiny creatures appear more often.', {});
  add('parcel', 'Wren\'s Parcel', 'key', 0, 'A parcel for Professor Wren.', {});
  add('townmap', 'Verdania Map', 'key', 0, 'A folding map of the Verdania region. Shows where you are.', { key: 'map' });
  add('wingwhistle', 'Wing Whistle', 'key', 0, 'Calls a friendly sky creature to carry you to any town you have visited.', { key: 'fly' });
  add('shareband', 'Share Band', 'key', 0, 'While switched on, team members that didn\'t battle still earn half the experience.', { key: 'share' });
  add('daycareslip', 'Daycare Slip', 'key', 0, 'Proof that a creature is staying at the Route 6 Daycare.', {});

  // discs (reusable move teachers). compat: types that can learn it
  const disc = (n, move, compat) => {
    const m = G.MOVES[move];
    add('disc' + String(n).padStart(2, '0'), 'Disc ' + String(n).padStart(2, '0') + ' ' + m.name, 'discs', 0,
      'Teaches ' + m.name + ' (' + m.type + '). Can be used again and again.', { teach: move, compat });
  };
  disc(1, 'rockwall', ['Stone', 'Earth', 'Brawl', 'Fire', 'Water', 'Drake']);
  disc(2, 'flametorrent', ['Fire', 'Drake', 'Normal']);
  disc(3, 'voltlance', ['Spark', 'Normal', 'Mind', 'Water', 'Drake']);
  disc(4, 'quake', ['Earth', 'Stone', 'Fire', 'Brawl', 'Water', 'Drake', 'Toxic', 'Normal']);
  disc(5, 'shadeorb', ['Spirit', 'Mind', 'Toxic', 'Normal', 'Wind', 'Bug']);
  disc(6, 'glacialray', ['Ice', 'Water', 'Normal', 'Drake', 'Mind']);
  disc(7, 'psycrush', ['Mind', 'Spirit', 'Bug', 'Normal', 'Wind']);
  disc(8, 'sludgeshot', ['Toxic', 'Plant', 'Spirit', 'Water']);
  disc(9, 'skyslash', ['Wind', 'Normal', 'Bug', 'Drake', 'Brawl']);
  disc(10, 'surgewave', ['Water', 'Normal', 'Ice', 'Drake']);
  disc(11, 'bricksmash', ['Brawl', 'Fire', 'Normal', 'Stone', 'Water', 'Earth']);
  disc(12, 'bloomorb', ['Plant', 'Bug', 'Mind', 'Normal']);
  disc(13, 'hydrocannon', ['Water', 'Ice', 'Drake']);
  disc(14, 'whiteout', ['Ice', 'Water', 'Wind', 'Mind']);
  disc(15, 'shadeclaw', ['Spirit', 'Drake', 'Toxic', 'Normal', 'Brawl', 'Earth']);
  disc(16, 'drakeclaw', ['Drake', 'Fire', 'Water', 'Earth', 'Brawl']);
  disc(17, 'airblade', ['Wind', 'Bug', 'Normal', 'Drake']);
  disc(18, 'gleamshard', ['Stone', 'Earth', 'Ice', 'Water', 'Mind']);

  G.POCKETS = [
    { id: 'items', name: 'ITEMS' }, { id: 'med', name: 'MEDICINE' }, { id: 'orbs', name: 'ORBS' },
    { id: 'discs', name: 'DISCS' }, { id: 'key', name: 'KEY ITEMS' },
  ];
  G.canLearnDisc = (mon, item) => {
    const sp = G.SPECIES[mon.sp]; const fx = item.fx;
    return sp.types.some((t) => fx.compat.includes(t)) || G.MOVES[fx.teach].type === 'Normal';
  };
})();
