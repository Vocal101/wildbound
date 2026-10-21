'use strict';
// Moves. cat: ph = physical, sp = special, st = status. acc 0 = never misses.
// fx keys: brn/par/psn/slp/frz/conf/flinch (chance %), self/foe: {stat: stages}, chance (for stat fx),
// drain, recoil, heal, hits:[min,max], prio, crit, fixed ('level' or number), rest, seed, haze, selfKO, struggle
(function () {
  const M = G.MOVES = {};
  const add = (id, name, type, cat, pow, acc, pp, fx, desc) => { M[id] = { id, name, type, cat, pow, acc, pp, fx: fx || {}, desc }; };

  // Normal
  add('bump', 'Bump', 'Normal', 'ph', 40, 100, 35, null, 'A clumsy full-body bump.');
  add('swipe', 'Paw Swipe', 'Normal', 'ph', 40, 100, 35, null, 'Rakes the foe with small claws.');
  add('quickjab', 'Quick Jab', 'Normal', 'ph', 40, 100, 30, { prio: 1 }, 'A blur of a strike. Always goes first.');
  add('growl', 'Low Rumble', 'Normal', 'st', 0, 100, 40, { foe: { atk: -1 } }, 'A menacing rumble. Lowers the foe\'s Attack.');
  add('glare', 'Stare Down', 'Normal', 'st', 0, 100, 30, { foe: { def: -1 } }, 'An intimidating stare. Lowers the foe\'s Defense.');
  add('hone', 'Hone', 'Normal', 'st', 0, 0, 30, { self: { atk: 1 } }, 'Sharpens focus. Raises Attack.');
  add('toughen', 'Toughen', 'Normal', 'st', 0, 0, 30, { self: { def: 1 } }, 'Tenses up. Raises Defense.');
  add('bodyrush', 'Body Rush', 'Normal', 'ph', 85, 100, 15, { par: 30 }, 'Charges with full weight. May paralyze.');
  add('heavyslam', 'Crushing Slam', 'Normal', 'ph', 80, 75, 20, null, 'A powerful but wild slam.');
  add('chomp', 'Chomp', 'Normal', 'ph', 60, 100, 25, { flinch: 30 }, 'Bites down hard. May cause flinching.');
  add('ram', 'Head Ram', 'Normal', 'ph', 70, 100, 15, { flinch: 30 }, 'A headfirst ram. May cause flinching.');
  add('reckless', 'Reckless Charge', 'Normal', 'ph', 120, 100, 15, { recoil: 1 / 3 }, 'A huge charge that also hurts the user.');
  add('restore', 'Restore', 'Normal', 'st', 0, 0, 10, { heal: 0.5 }, 'Restores up to half of max HP.');
  add('lullaby', 'Lullaby', 'Normal', 'st', 0, 55, 15, { slp: 100 }, 'A soothing song that may cause sleep.');
  add('starburst', 'Star Burst', 'Normal', 'sp', 60, 0, 20, null, 'Star-shaped rays that never miss.');
  add('furyswipes', 'Flurry Claws', 'Normal', 'ph', 18, 80, 15, { hits: [2, 5] }, 'Swipes 2 to 5 times in a row.');
  add('deepsleep', 'Deep Sleep', 'Normal', 'st', 0, 0, 10, { rest: true }, 'Sleeps for 2 turns to fully heal.');
  add('afterimage', 'Afterimage', 'Normal', 'st', 0, 0, 15, { self: { eva: 1 } }, 'Leaves afterimages. Raises evasion.');
  add('shriek', 'Shriek', 'Normal', 'st', 0, 85, 40, { foe: { def: -2 } }, 'A piercing shriek. Sharply lowers Defense.');
  add('detonate', 'Detonate', 'Normal', 'ph', 200, 100, 5, { selfKO: true }, 'An explosion. The user faints.');
  add('megablast', 'Mega Blast', 'Normal', 'sp', 120, 90, 5, null, 'A tremendous beam of raw energy.');
  add('struggle', 'Desperation', 'Normal', 'ph', 50, 0, 1, { recoil: 1 / 4, struggle: true }, 'Used when no move has EN left.');

  // Fire
  add('cinderspit', 'Cinder Spit', 'Fire', 'sp', 40, 100, 25, { brn: 10 }, 'Spits hot cinders. May burn.');
  add('flamefang', 'Flame Fang', 'Fire', 'ph', 65, 95, 15, { brn: 10, flinch: 10 }, 'A burning bite. May burn or flinch.');
  add('blazeroll', 'Blaze Roll', 'Fire', 'ph', 60, 100, 25, { brn: 10 }, 'Rolls in flames into the foe.');
  add('flametorrent', 'Flame Torrent', 'Fire', 'sp', 90, 100, 15, { brn: 10 }, 'A stream of fire. May burn.');
  add('inferno', 'Inferno Burst', 'Fire', 'sp', 110, 85, 5, { brn: 30 }, 'An enormous blast of fire.');
  add('ghostflame', 'Ghost Flame', 'Fire', 'st', 0, 85, 15, { brn: 100 }, 'Eerie flames that inflict a burn.');
  add('heatwave', 'Scorch Gale', 'Fire', 'sp', 95, 90, 10, { brn: 10 }, 'Scorching air. May burn.');
  add('solarram', 'Solar Ram', 'Fire', 'ph', 120, 100, 15, { recoil: 1 / 3, brn: 10 }, 'A blazing charge with heavy recoil.');

  // Water
  add('splashjet', 'Splash Jet', 'Water', 'sp', 40, 100, 25, null, 'Squirts a jet of water.');
  add('bubblespray', 'Bubble Spray', 'Water', 'sp', 40, 100, 30, { foe: { spe: -1 }, chance: 10 }, 'Sprays bubbles. May lower Speed.');
  add('aquadash', 'Aqua Dash', 'Water', 'ph', 40, 100, 20, { prio: 1 }, 'A watery dash. Always goes first.');
  add('tidepulse', 'Tide Pulse', 'Water', 'sp', 60, 100, 20, { conf: 20 }, 'A pulsing wave. May confuse.');
  add('surgewave', 'Surging Wave', 'Water', 'sp', 90, 100, 15, null, 'A great wave crashes down.');
  add('hydrocannon', 'Hydro Cannon', 'Water', 'sp', 110, 80, 5, null, 'Blasts high-pressure water.');
  add('riptail', 'Riptail', 'Water', 'ph', 90, 90, 10, null, 'Swings a tail like a rip current.');
  add('shellup', 'Shell Up', 'Water', 'st', 0, 0, 40, { self: { def: 1 } }, 'Withdraws into a shell. Raises Defense.');

  // Plant
  add('vinelash', 'Vine Lash', 'Plant', 'ph', 45, 100, 25, null, 'Lashes with thin vines.');
  add('sap', 'Sap', 'Plant', 'sp', 20, 100, 25, { drain: 0.5 }, 'Drains HP to heal half the damage.');
  add('deepsap', 'Deep Sap', 'Plant', 'sp', 40, 100, 15, { drain: 0.5 }, 'Drains more HP to heal.');
  add('lifesiphon', 'Life Siphon', 'Plant', 'sp', 75, 100, 10, { drain: 0.5 }, 'A powerful draining attack.');
  add('leafblade', 'Leaf Cutter', 'Plant', 'ph', 55, 95, 25, { crit: 1 }, 'Sharp leaves. High critical-hit ratio.');
  add('leechpod', 'Leech Pod', 'Plant', 'st', 0, 90, 10, { seed: true }, 'Plants a pod that drains HP each turn.');
  add('slumberspores', 'Slumber Spores', 'Plant', 'st', 0, 75, 15, { slp: 100 }, 'Scatters spores that cause sleep.');
  add('numbspores', 'Numb Spores', 'Plant', 'st', 0, 75, 30, { par: 100 }, 'Scatters spores that paralyze.');
  add('bloomorb', 'Bloom Orb', 'Plant', 'sp', 90, 100, 10, { foe: { spd: -1 }, chance: 10 }, 'A ball of life energy.');
  add('verdantstorm', 'Verdant Storm', 'Plant', 'sp', 120, 85, 5, null, 'A raging storm of petals.');
  add('photosynth', 'Photosynth', 'Plant', 'st', 0, 0, 5, { heal: 0.5 }, 'Absorbs light to restore HP.');

  // Spark
  add('staticzap', 'Static Zap', 'Spark', 'sp', 40, 100, 30, { par: 10 }, 'A small zap. May paralyze.');
  add('arctackle', 'Arc Tackle', 'Spark', 'ph', 65, 100, 20, { par: 30 }, 'A charged tackle. May paralyze.');
  add('joltwave', 'Jolt Wave', 'Spark', 'st', 0, 90, 20, { par: 100 }, 'A weak jolt that paralyzes.');
  add('voltlance', 'Volt Lance', 'Spark', 'sp', 90, 100, 15, { par: 10 }, 'A spear of lightning.');
  add('stormstrike', 'Storm Strike', 'Spark', 'sp', 110, 70, 10, { par: 30 }, 'A wild lightning strike.');
  add('overcharge', 'Overcharge', 'Spark', 'st', 0, 0, 20, { self: { spa: 1, spd: 1 } }, 'Builds charge. Raises Sp. Atk and Sp. Def.');
  add('voltcrash', 'Volt Crash', 'Spark', 'ph', 90, 100, 15, { recoil: 1 / 4, par: 10 }, 'An electrified crash with recoil.');

  // Ice
  add('frostpuff', 'Frost Puff', 'Ice', 'sp', 40, 100, 25, { frz: 10 }, 'A puff of freezing air.');
  add('iceneedle', 'Ice Needle', 'Ice', 'ph', 40, 100, 30, { prio: 1 }, 'A fast ice needle. Goes first.');
  add('frostfang', 'Frost Fang', 'Ice', 'ph', 65, 95, 15, { frz: 10, flinch: 10 }, 'A freezing bite.');
  add('glacialray', 'Glacial Ray', 'Ice', 'sp', 90, 100, 10, { frz: 10 }, 'A beam of glacial cold.');
  add('whiteout', 'Whiteout', 'Ice', 'sp', 110, 70, 5, { frz: 10 }, 'A furious snowstorm.');
  add('frostmist', 'Frost Mist', 'Ice', 'st', 0, 0, 30, { haze: true }, 'A mist that resets all stat changes.');

  // Brawl
  add('chop', 'Chop', 'Brawl', 'ph', 50, 100, 25, { crit: 1 }, 'A hand chop. High critical-hit ratio.');
  add('sweepkick', 'Sweep Kick', 'Brawl', 'ph', 60, 100, 20, { foe: { spe: -1 }, chance: 30 }, 'A low kick. May lower Speed.');
  add('twinkick', 'Twin Kick', 'Brawl', 'ph', 30, 100, 30, { hits: [2, 2] }, 'Kicks twice in a row.');
  add('bricksmash', 'Brick Smash', 'Brawl', 'ph', 75, 100, 15, null, 'A smashing karate blow.');
  add('flex', 'Flex', 'Brawl', 'st', 0, 0, 20, { self: { atk: 1, def: 1 } }, 'Bulks up. Raises Attack and Defense.');
  add('allout', 'All-Out Brawl', 'Brawl', 'ph', 120, 100, 5, { self: { def: -1, spd: -1 } }, 'Fights all-out, lowering own defenses.');
  add('snappunch', 'Snap Punch', 'Brawl', 'ph', 40, 100, 30, { prio: 1 }, 'A lightning punch. Goes first.');

  // Toxic
  add('venombarb', 'Venom Barb', 'Toxic', 'ph', 15, 100, 35, { psn: 30 }, 'A poison barb. May poison.');
  add('corrode', 'Corrode', 'Toxic', 'sp', 40, 100, 30, { foe: { spd: -1 }, chance: 10 }, 'Sprays acid that may melt defenses.');
  add('toxicsmog', 'Toxic Smog', 'Toxic', 'sp', 30, 70, 20, { psn: 40 }, 'Foul gas. May poison.');
  add('venomcloud', 'Venom Cloud', 'Toxic', 'st', 0, 90, 10, { psn: 100 }, 'A cloud of venom that poisons.');
  add('sludgeshot', 'Sludge Shot', 'Toxic', 'sp', 90, 100, 10, { psn: 30 }, 'Hurls toxic sludge.');
  add('venomfang', 'Venom Fang', 'Toxic', 'ph', 80, 100, 20, { psn: 30 }, 'A venomous strike.');

  // Earth
  add('mudfling', 'Mud Fling', 'Earth', 'sp', 20, 100, 10, { foe: { acc: -1 } }, 'Flings mud. Lowers accuracy.');
  add('sandtoss', 'Sand Toss', 'Earth', 'st', 0, 100, 15, { foe: { acc: -1 } }, 'Tosses sand in the foe\'s eyes.');
  add('burrowstrike', 'Burrow Strike', 'Earth', 'ph', 80, 100, 10, null, 'Strikes from underground.');
  add('quake', 'Quake', 'Earth', 'ph', 100, 100, 10, null, 'Shakes the ground violently.');
  add('trample', 'Trample', 'Earth', 'ph', 60, 100, 20, { foe: { spe: -1 } }, 'Stomps the ground. Lowers Speed.');
  add('magmasurge', 'Magma Surge', 'Earth', 'sp', 90, 100, 10, { foe: { spd: -1 }, chance: 10 }, 'Erupts power from the earth.');

  // Wind
  add('gust', 'Breeze Cut', 'Wind', 'sp', 40, 100, 35, null, 'Whips up a cutting breeze.');
  add('peck', 'Beak Jab', 'Wind', 'ph', 35, 100, 35, null, 'Jabs with a sharp beak.');
  add('wingstrike', 'Wing Strike', 'Wind', 'ph', 60, 100, 35, null, 'Strikes with spread wings.');
  add('skyslash', 'Sky Slash', 'Wind', 'ph', 60, 0, 20, null, 'A swift slash that never misses.');
  add('airblade', 'Air Blade', 'Wind', 'sp', 75, 95, 15, { flinch: 30 }, 'A blade of air. May flinch.');
  add('skydive', 'Sky Dive', 'Wind', 'ph', 120, 100, 15, { recoil: 1 / 3 }, 'A reckless dive with recoil.');
  add('tailwind', 'Tailwind Rush', 'Wind', 'st', 0, 0, 30, { self: { spe: 2 } }, 'Rides the wind. Sharply raises Speed.');
  add('perch', 'Perch', 'Wind', 'st', 0, 0, 10, { heal: 0.5 }, 'Rests on a perch to restore HP.');

  // Mind
  add('mindprod', 'Mind Prod', 'Mind', 'sp', 50, 100, 25, { conf: 10 }, 'A weak telekinetic prod. May confuse.');
  add('psiwave', 'Psi Wave', 'Mind', 'sp', 65, 100, 20, { conf: 10 }, 'A strange wave. May confuse.');
  add('psycrush', 'Psychic Crush', 'Mind', 'sp', 90, 100, 10, { foe: { spd: -1 }, chance: 10 }, 'A crushing psychic force.');
  add('hypnotize', 'Hypnotize', 'Mind', 'st', 0, 60, 20, { slp: 100 }, 'Hypnotic gaze that causes sleep.');
  add('meditate', 'Inner Calm', 'Mind', 'st', 0, 0, 20, { self: { spa: 1, spd: 1 } }, 'Calms the mind. Raises Sp. Atk and Sp. Def.');
  add('mindram', 'Mind Ram', 'Mind', 'ph', 80, 90, 15, { flinch: 20 }, 'A psychic-charged headbutt.');
  add('clearmind', 'Clear Mind', 'Mind', 'st', 0, 0, 20, { self: { spd: 2 } }, 'Empties the mind. Sharply raises Sp. Def.');
  add('prismray', 'Prism Ray', 'Mind', 'sp', 100, 100, 5, { conf: 20 }, 'A dazzling ray of rainbow light.');

  // Bug
  add('nibble', 'Nibble', 'Bug', 'ph', 60, 100, 20, null, 'Nibbles with tiny mandibles.');
  add('silkshot', 'Silk Shot', 'Bug', 'st', 0, 95, 40, { foe: { spe: -2 } }, 'Sticky silk. Sharply lowers Speed.');
  add('bloodsip', 'Blood Sip', 'Bug', 'ph', 80, 100, 10, { drain: 0.5 }, 'Drains the foe to heal.');
  add('glowbeam', 'Glow Beam', 'Bug', 'sp', 75, 100, 15, { conf: 10 }, 'A strange glowing beam.');
  add('crosscut', 'Cross Cut', 'Bug', 'ph', 80, 100, 15, null, 'Slashes in an X shape.');
  add('dronebuzz', 'Drone Buzz', 'Bug', 'sp', 90, 100, 10, { foe: { spd: -1 }, chance: 10 }, 'A damaging buzzing sound.');
  add('wingdance', 'Wing Dance', 'Bug', 'st', 0, 0, 20, { self: { spa: 1, spd: 1, spe: 1 } }, 'A mystic dance. Raises Sp. Atk, Sp. Def and Speed.');

  // Stone
  add('pebbletoss', 'Pebble Toss', 'Stone', 'ph', 50, 90, 15, null, 'Throws small rocks.');
  add('rockwall', 'Rock Wall', 'Stone', 'ph', 60, 95, 15, { foe: { spe: -1 } }, 'Boulders that lower Speed.');
  add('rockfall', 'Rockfall', 'Stone', 'ph', 75, 90, 10, { flinch: 30 }, 'Drops rocks. May flinch.');
  add('shardedge', 'Shard Edge', 'Stone', 'ph', 100, 80, 5, { crit: 1 }, 'Sharp stones. High critical-hit ratio.');
  add('stoneskin', 'Stone Skin', 'Stone', 'st', 0, 0, 15, { self: { def: 2 } }, 'Hardens the body. Sharply raises Defense.');
  add('gleamshard', 'Gleam Shard', 'Stone', 'sp', 80, 100, 20, null, 'Fires shards of glowing crystal.');

  // Spirit
  add('spectrallick', 'Spectral Lick', 'Spirit', 'ph', 30, 100, 30, { par: 30 }, 'An eerie lick. May paralyze.');
  add('spook', 'Spook', 'Spirit', 'ph', 30, 100, 15, { flinch: 30 }, 'A sudden scare. May flinch.');
  add('shadeorb', 'Shade Orb', 'Spirit', 'sp', 80, 100, 15, { foe: { spd: -1 }, chance: 20 }, 'A shadowy blob.');
  add('nightterror', 'Night Terror', 'Spirit', 'sp', 1, 100, 15, { fixed: 'level' }, 'Damage equal to the user\'s level.');
  add('wisplight', 'Wisp Light', 'Spirit', 'st', 0, 100, 10, { conf: 100 }, 'A dancing light that confuses.');
  add('shadeclaw', 'Shade Claw', 'Spirit', 'ph', 70, 100, 15, { crit: 1 }, 'A claw of shadow. High critical-hit ratio.');

  // Drake
  add('twister', 'Whirl Lash', 'Drake', 'sp', 40, 100, 20, { flinch: 20 }, 'A small whirlwind. May flinch.');
  add('drakebreath', 'Drake Breath', 'Drake', 'sp', 60, 100, 20, { par: 30 }, 'A strange breath. May paralyze.');
  add('drakeclaw', 'Drake Claw', 'Drake', 'ph', 80, 100, 15, null, 'Rends with great claws.');
  add('wyrmfury', 'Wyrm Fury', 'Drake', 'sp', 1, 100, 10, { fixed: 40 }, 'Always deals 40 HP of damage.');
  add('drakedance', 'Drake Dance', 'Drake', 'st', 0, 0, 20, { self: { atk: 1, spe: 1 } }, 'A mystic dance. Raises Attack and Speed.');
  add('starfall', 'Star Fall', 'Drake', 'sp', 130, 90, 5, { self: { spa: -2 } }, 'Calls down meteors. Lowers own Sp. Atk.');
})();
