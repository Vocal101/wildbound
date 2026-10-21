'use strict';
// Species data. base: [hp, atk, def, spa, spd, spe]. gr: growth rate. art: procedural sprite recipe.
(function () {
  G.ABILITIES = {
    verdant: { name: 'Verdant Heart', desc: 'Powers up Plant moves when HP is low.' },
    blaze: { name: 'Blaze Heart', desc: 'Powers up Fire moves when HP is low.' },
    torrent: { name: 'Riptide Heart', desc: 'Powers up Water moves when HP is low.' },
    swarm: { name: 'Swarm Heart', desc: 'Powers up Bug moves when HP is low.' },
    menace: { name: 'Menace', desc: 'Lowers the foe\'s Attack on entry.' },
    staticskin: { name: 'Static Skin', desc: 'Contact may paralyze the attacker.' },
    flamebody: { name: 'Ember Skin', desc: 'Contact may burn the attacker.' },
    toxictouch: { name: 'Toxic Touch', desc: 'Contact may poison the attacker.' },
    levitate: { name: 'Hover', desc: 'Floats, so Earth moves miss.' },
    sturdy: { name: 'Bedrock', desc: 'Survives one hit from full HP.' },
    regrow: { name: 'Regrowth', desc: 'Restores a little HP every turn.' },
    keen: { name: 'Keen Edge', desc: 'Lands critical hits more often.' },
    thickhide: { name: 'Thick Hide', desc: 'Halves damage from Fire and Ice moves.' },
    runaway: { name: 'Fleet Foot', desc: 'Can always escape from wild battles.' },
    pressure: { name: 'Aura', desc: 'A radiant presence that boosts its Sp. Def.' },
  };

  const L = {
    sprig: [[1, 'bump'], [1, 'growl'], [7, 'vinelash'], [9, 'sap'], [10, 'leechpod'], [13, 'leafblade'], [16, 'numbspores'], [19, 'deepsap'], [22, 'slumberspores'], [26, 'bodyrush'], [30, 'photosynth'], [34, 'lifesiphon'], [38, 'trample'], [42, 'bloomorb'], [46, 'magmasurge'], [50, 'verdantstorm']],
    ember: [[1, 'swipe'], [1, 'growl'], [7, 'cinderspit'], [9, 'quickjab'], [11, 'chomp'], [14, 'blazeroll'], [18, 'flamefang'], [22, 'hone'], [26, 'ghostflame'], [30, 'flametorrent'], [34, 'snappunch'], [37, 'bricksmash'], [41, 'heatwave'], [45, 'allout'], [50, 'inferno'], [54, 'solarram']],
    drizz: [[1, 'bump'], [1, 'growl'], [7, 'splashjet'], [9, 'bubblespray'], [10, 'shellup'], [13, 'aquadash'], [17, 'tidepulse'], [21, 'chomp'], [25, 'riptail'], [29, 'twister'], [33, 'surgewave'], [36, 'drakebreath'], [40, 'drakeclaw'], [44, 'hydrocannon'], [50, 'drakedance'], [55, 'starfall']],
    pip: [[1, 'peck'], [1, 'growl'], [5, 'sandtoss'], [9, 'gust'], [13, 'quickjab'], [17, 'wingstrike'], [21, 'afterimage'], [25, 'airblade'], [30, 'tailwind'], [35, 'skyslash'], [40, 'perch'], [46, 'skydive']],
    nib: [[1, 'bump'], [1, 'swipe'], [4, 'quickjab'], [8, 'chomp'], [12, 'hone'], [16, 'furyswipes'], [20, 'ram'], [25, 'bodyrush'], [30, 'afterimage'], [35, 'reckless'], [40, 'megablast']],
    larv: [[1, 'bump'], [1, 'silkshot'], [5, 'nibble'], [7, 'toughen'], [10, 'mindprod'], [12, 'numbspores'], [14, 'slumberspores'], [17, 'gust'], [20, 'glowbeam'], [24, 'psiwave'], [28, 'airblade'], [32, 'dronebuzz'], [36, 'wingdance'], [40, 'psycrush']],
    zap: [[1, 'bump'], [1, 'growl'], [4, 'staticzap'], [8, 'quickjab'], [12, 'joltwave'], [16, 'arctackle'], [20, 'afterimage'], [24, 'chomp'], [28, 'voltlance'], [33, 'overcharge'], [38, 'voltcrash'], [44, 'stormstrike']],
    peb: [[1, 'bump'], [1, 'toughen'], [5, 'mudfling'], [8, 'pebbletoss'], [12, 'stoneskin'], [16, 'trample'], [20, 'rockwall'], [24, 'ram'], [28, 'rockfall'], [32, 'burrowstrike'], [36, 'detonate'], [40, 'quake'], [46, 'shardedge']],
    dusk: [[1, 'spook'], [1, 'gust'], [5, 'spectrallick'], [9, 'chomp'], [13, 'wisplight'], [17, 'wingstrike'], [21, 'nightterror'], [25, 'airblade'], [30, 'shadeorb'], [35, 'shadeclaw'], [40, 'skydive']],
    spore: [[1, 'swipe'], [1, 'sap'], [5, 'venombarb'], [9, 'numbspores'], [13, 'deepsap'], [17, 'slumberspores'], [21, 'toxicsmog'], [25, 'leafblade'], [29, 'venomcloud'], [33, 'lifesiphon'], [37, 'sludgeshot'], [42, 'photosynth'], [46, 'verdantstorm']],
    minn: [[1, 'splashjet'], [1, 'bump'], [6, 'bubblespray'], [10, 'aquadash'], [15, 'pebbletoss'], [20, 'tidepulse'], [24, 'rockwall'], [28, 'riptail'], [32, 'gleamshard'], [36, 'surgewave'], [42, 'shardedge'], [48, 'hydrocannon']],
    frost: [[1, 'bump'], [1, 'growl'], [4, 'frostpuff'], [8, 'chomp'], [12, 'iceneedle'], [16, 'hone'], [20, 'frostfang'], [25, 'frostmist'], [30, 'glacialray'], [35, 'ram'], [40, 'bodyrush'], [45, 'whiteout']],
    magma: [[1, 'bump'], [1, 'toughen'], [5, 'cinderspit'], [9, 'pebbletoss'], [13, 'blazeroll'], [17, 'rockwall'], [21, 'stoneskin'], [25, 'flamefang'], [30, 'rockfall'], [34, 'flametorrent'], [38, 'magmasurge'], [42, 'quake'], [48, 'inferno']],
    wisp: [[1, 'spook'], [1, 'growl'], [5, 'spectrallick'], [9, 'wisplight'], [13, 'mindprod'], [17, 'nightterror'], [21, 'hypnotize'], [25, 'psiwave'], [30, 'shadeorb'], [35, 'meditate'], [40, 'psycrush'], [45, 'shadeclaw']],
    brawl: [[1, 'bump'], [1, 'glare'], [4, 'chop'], [8, 'snappunch'], [12, 'twinkick'], [16, 'hone'], [20, 'sweepkick'], [24, 'bricksmash'], [28, 'flex'], [33, 'ram'], [38, 'rockfall'], [44, 'allout']],
    slith: [[1, 'venombarb'], [1, 'glare'], [5, 'chomp'], [9, 'toxicsmog'], [13, 'corrode'], [17, 'venomcloud'], [21, 'venomfang'], [25, 'shriek'], [30, 'sludgeshot'], [35, 'shadeclaw'], [40, 'megablast']],
    fawn: [[1, 'bump'], [1, 'growl'], [4, 'mindprod'], [8, 'quickjab'], [12, 'hypnotize'], [16, 'psiwave'], [20, 'afterimage'], [24, 'meditate'], [28, 'mindram'], [32, 'starburst'], [36, 'psycrush'], [40, 'restore'], [45, 'clearmind'], [50, 'megablast']],
    drake: [[1, 'bump'], [1, 'glare'], [5, 'twister'], [10, 'wyrmfury'], [15, 'chomp'], [20, 'drakebreath'], [25, 'afterimage'], [30, 'drakeclaw'], [35, 'drakedance'], [40, 'wingstrike'], [45, 'quake'], [50, 'skydive'], [55, 'starfall']],
    crab: [[1, 'bump'], [1, 'shellup'], [5, 'splashjet'], [9, 'swipe'], [13, 'aquadash'], [17, 'chomp'], [21, 'stoneskin'], [25, 'crosscut'], [29, 'riptail'], [33, 'bricksmash'], [38, 'surgewave'], [44, 'hydrocannon']],
    puff: [[1, 'bump'], [1, 'lullaby'], [5, 'growl'], [9, 'starburst'], [13, 'afterimage'], [17, 'ram'], [21, 'restore'], [25, 'bodyrush'], [30, 'deepsleep'], [35, 'megablast']],
    aur: [[1, 'mindprod'], [1, 'twister'], [10, 'psiwave'], [20, 'drakebreath'], [30, 'meditate'], [40, 'psycrush'], [45, 'drakeclaw'], [50, 'prismray'], [60, 'restore'], [70, 'starfall']],
    bog: [[1, 'bump'], [1, 'bubblespray'], [5, 'mudfling'], [9, 'splashjet'], [13, 'chomp'], [17, 'tidepulse'], [21, 'trample'], [25, 'riptail'], [30, 'burrowstrike'], [35, 'surgewave'], [40, 'quake'], [46, 'hydrocannon']],
    thist: [[1, 'bump'], [1, 'glare'], [5, 'vinelash'], [9, 'chop'], [13, 'leafblade'], [17, 'twinkick'], [21, 'deepsap'], [25, 'bricksmash'], [30, 'flex'], [35, 'lifesiphon'], [40, 'allout'], [45, 'verdantstorm']],
    flurr: [[1, 'peck'], [1, 'growl'], [5, 'frostpuff'], [9, 'gust'], [13, 'iceneedle'], [17, 'wingstrike'], [21, 'afterimage'], [25, 'airblade'], [30, 'glacialray'], [35, 'tailwind'], [40, 'perch'], [45, 'whiteout']],
    nut: [[1, 'bump'], [1, 'toughen'], [5, 'nibble'], [9, 'pebbletoss'], [13, 'silkshot'], [17, 'rockwall'], [21, 'stoneskin'], [25, 'crosscut'], [30, 'rockfall'], [35, 'bloodsip'], [40, 'shardedge'], [45, 'quake']],
    spark: [[1, 'splashjet'], [1, 'staticzap'], [6, 'bubblespray'], [10, 'aquadash'], [15, 'joltwave'], [20, 'tidepulse'], [24, 'arctackle'], [28, 'voltlance'], [33, 'surgewave'], [38, 'overcharge'], [44, 'stormstrike'], [48, 'hydrocannon']],
    gust: [[1, 'gust'], [1, 'growl'], [5, 'mindprod'], [9, 'quickjab'], [13, 'twister'], [17, 'psiwave'], [21, 'airblade'], [25, 'afterimage'], [30, 'tailwind'], [35, 'psycrush'], [40, 'meditate'], [45, 'skydive']],
    mound: [[1, 'bump'], [1, 'sandtoss'], [5, 'mudfling'], [9, 'chomp'], [13, 'trample'], [17, 'hone'], [21, 'burrowstrike'], [25, 'sweepkick'], [30, 'rockwall'], [35, 'bricksmash'], [40, 'quake'], [46, 'allout']],
    shard: [[1, 'bump'], [1, 'toughen'], [5, 'frostpuff'], [9, 'pebbletoss'], [13, 'iceneedle'], [17, 'rockwall'], [21, 'stoneskin'], [25, 'frostfang'], [30, 'rockfall'], [35, 'glacialray'], [40, 'shardedge'], [46, 'whiteout']],
    sting: [[1, 'venombarb'], [1, 'silkshot'], [5, 'nibble'], [9, 'corrode'], [12, 'furyswipes'], [16, 'venomcloud'], [20, 'crosscut'], [25, 'venomfang'], [30, 'airblade'], [35, 'sludgeshot'], [40, 'dronebuzz']],
    lant: [[1, 'spook'], [1, 'cinderspit'], [5, 'wisplight'], [9, 'spectrallick'], [13, 'blazeroll'], [17, 'nightterror'], [21, 'ghostflame'], [25, 'flametorrent'], [30, 'shadeorb'], [36, 'heatwave'], [42, 'inferno']],
    mimic: [[1, 'bump'], [1, 'lullaby'], [10, 'starburst'], [20, 'restore'], [30, 'bodyrush'], [40, 'megablast']],
    glac: [[1, 'frostpuff'], [1, 'mindprod'], [10, 'iceneedle'], [20, 'psiwave'], [30, 'glacialray'], [40, 'meditate'], [50, 'psycrush'], [55, 'whiteout'], [60, 'restore'], [70, 'prismray']],
    umb: [[1, 'spook'], [1, 'twister'], [10, 'shadeclaw'], [20, 'drakebreath'], [30, 'shadeorb'], [40, 'drakeclaw'], [50, 'drakedance'], [60, 'starfall'], [70, 'restore']],
  };

  const SP = G.SPECIES = {}; const ORDER = G.DEX_ORDER = [];
  const S = (id, name, types, base, cr, xp, gr, ab, evo, learn, art, dex, ht, wt) => {
    SP[id] = { id, name, types, base, cr, xp, gr, ab, evo, learn: L[learn], art, dex, ht, wt, num: ORDER.length + 1 };
    ORDER.push(id);
  };

  // --- starters ---
  S('sprigling', 'Sprigling', ['Plant'], [45, 49, 49, 65, 65, 45], 45, 64, 'med', ['verdant'], { lv: 16, to: 'thornback' }, 'sprig',
    { plan: 'quad', s: 0.55, c: ['#7ccc5c', '#3e8c3a', '#eef4c4'], f: ['sprout', 'ears:round', 'tail:stub', 'belly', 'cheeks'] },
    'A sprout grows from its head. It soaks up sunlight on warm stones and naps the afternoon away.', 0.4, 6.2);
  S('thornback', 'Thornback', ['Plant'], [60, 62, 63, 80, 80, 60], 45, 142, 'med', ['verdant'], { lv: 32, to: 'briarox' }, 'sprig',
    { plan: 'quad', s: 0.75, c: ['#5cb84c', '#2e7432', '#e4eeb4'], f: ['leaf', 'spikes', 'ears:round', 'tail:leaf', 'belly'] },
    'The thorns on its back harden as it grows. It guards forest paths from intruders.', 0.9, 21.0);
  S('briarox', 'Briarox', ['Plant', 'Earth'], [80, 90, 92, 98, 95, 70], 45, 236, 'med', ['verdant'], null, 'sprig',
    { plan: 'quad', s: 1.0, c: ['#4c9c48', '#a8642c', '#e8e0a8'], acc2: '#f070a8', f: ['bloom', 'spikes', 'horn:two', 'tail:leaf', 'belly'] },
    'A great flower blooms on its back. Its stomp can split boulders and plant seeds at once.', 1.9, 120.0);
  S('embercub', 'Embercub', ['Fire'], [39, 52, 43, 60, 50, 65], 45, 62, 'med', ['blaze'], { lv: 16, to: 'blazefang' }, 'ember',
    { plan: 'quad', s: 0.55, c: ['#f08a3a', '#c84a28', '#fff0c4'], f: ['ears:pointy', 'tail:flame', 'belly', 'cheeks'] },
    'The flame on its tail flickers with its mood. It loves to curl up beside campfires.', 0.5, 8.0);
  S('blazefang', 'Blazefang', ['Fire'], [58, 64, 58, 80, 65, 80], 45, 142, 'med', ['blaze'], { lv: 34, to: 'infernox' }, 'ember',
    { plan: 'quad', s: 0.78, c: ['#e8742c', '#a83a20', '#ffe8b0'], f: ['ears:pointy', 'tail:flame', 'mane:flame', 'belly', 'fangs'] },
    'Its fiery mane blazes brighter in battle. It hunts at dusk on rocky slopes.', 1.1, 26.0);
  S('infernox', 'Infernox', ['Fire', 'Brawl'], [78, 104, 75, 90, 75, 103], 45, 240, 'med', ['blaze'], null, 'ember',
    { plan: 'biped', s: 1.0, c: ['#c83838', '#2c2028', '#f8d088'], f: ['ears:pointy', 'mane:flame', 'tail:flame', 'belly', 'fangs', 'arms:big', 'brow'] },
    'It stands tall to fight with flaming fists. Its roar can be heard across three valleys.', 1.8, 90.5);
  S('drizzlet', 'Drizzlet', ['Water'], [44, 48, 65, 50, 64, 43], 45, 63, 'med', ['torrent'], { lv: 16, to: 'tidalon' }, 'drizz',
    { plan: 'biped', s: 0.5, c: ['#5aa8ea', '#2c6cb8', '#f0f4d8'], f: ['fin:head', 'tail:fin', 'belly', 'cheeks'] },
    'It splashes in shallow streams and blows bubbles when it is happy.', 0.5, 7.5);
  S('tidalon', 'Tidalon', ['Water'], [59, 63, 80, 65, 80, 58], 45, 142, 'med', ['torrent'], { lv: 34, to: 'maelstrake' }, 'drizz',
    { plan: 'biped', s: 0.75, c: ['#3c90d8', '#1c5498', '#e8f0d0'], f: ['fin:head', 'ears:fin', 'tail:fin', 'belly', 'arms'] },
    'Its fins let it swim against the strongest currents. It rescues travelers lost at sea.', 1.0, 24.0);
  S('maelstrake', 'Maelstrake', ['Water', 'Drake'], [79, 85, 100, 88, 102, 76], 45, 239, 'med', ['torrent'], null, 'drizz',
    { plan: 'biped', s: 1.0, c: ['#2878c0', '#123c78', '#d8ecf0'], f: ['horn:two', 'fin:head', 'wings:fin', 'tail:fin', 'belly', 'arms:big'] },
    'Legends say it stirs up whirlpools with a flick of its tail. It rules deep ocean trenches.', 2.0, 98.0);

  // --- route regulars ---
  S('pipwing', 'Pipwing', ['Normal', 'Wind'], [40, 45, 40, 35, 35, 56], 255, 50, 'med', ['keen'], { lv: 18, to: 'galeclaw' }, 'pip',
    { plan: 'bird', s: 0.45, c: ['#c09060', '#f4e4c4', '#fff4e4'], f: ['crest', 'beak'] },
    'A tiny bird that chirps at dawn. Flocks of them hop through tall grass looking for seeds.', 0.3, 1.8);
  S('galeclaw', 'Galeclaw', ['Normal', 'Wind'], [63, 60, 55, 50, 50, 71], 120, 122, 'med', ['keen'], { lv: 36, to: 'skyraptor' }, 'pip',
    { plan: 'bird', s: 0.7, c: ['#a87048', '#f0d8b0', '#fff0dc'], f: ['crest', 'beak', 'tail:feather'] },
    'It patrols its territory from the sky, swooping on anything that wanders too close.', 1.1, 30.0);
  S('skyraptor', 'Skyraptor', ['Normal', 'Wind'], [83, 80, 75, 70, 70, 101], 45, 216, 'med', ['keen'], null, 'pip',
    { plan: 'bird', s: 1.0, c: ['#885434', '#e8c890', '#f8f0e0'], acc2: '#e04838', f: ['crest:big', 'beak', 'tail:feather'] },
    'It soars above the clouds and can spot a pebble moving from a mile up.', 1.5, 39.5);
  S('nibbit', 'Nibbit', ['Normal'], [30, 56, 35, 25, 35, 72], 255, 51, 'med', ['runaway'], { lv: 20, to: 'gnawbeast' }, 'nib',
    { plan: 'quad', s: 0.45, c: ['#9cb4c4', '#f4c8b8', '#f4f8fa'], f: ['ears:long', 'whiskers', 'teeth', 'tail:fluffy'] },
    'It gnaws on anything hard to keep its teeth short. It is found almost everywhere.', 0.3, 3.5);
  S('gnawbeast', 'Gnawbeast', ['Normal'], [55, 81, 60, 50, 70, 97], 127, 145, 'med', ['runaway'], null, 'nib',
    { plan: 'quad', s: 0.72, c: ['#6c8498', '#f0b8a4', '#eef4f8'], f: ['ears:long', 'whiskers', 'teeth', 'tail:fluffy', 'stripes', 'brow'] },
    'Its huge teeth can chew through fences. Farmers consider it a pest.', 0.7, 18.5);
  S('larvine', 'Larvine', ['Bug'], [45, 30, 35, 20, 20, 45], 255, 39, 'fast', ['swarm'], { lv: 7, to: 'cocoonix' }, 'larv',
    { plan: 'bug', s: 0.45, c: ['#4cb8a0', '#f88cb4', '#e0f8f0'], f: ['antenna', 'spots'] },
    'It munches leaves all day long. Bright spots on its back warn birds away.', 0.3, 2.9);
  S('cocoonix', 'Cocoonix', ['Bug'], [50, 20, 55, 25, 25, 30], 120, 72, 'fast', ['sturdy'], { lv: 10, to: 'lumimoth' }, 'larv',
    { plan: 'blob', s: 0.55, c: ['#ccbc6c', '#8c7c3c', '#ece0a8'], f: ['stripes', 'sleepy'] },
    'Wrapped in a silk shell, it waits silently for the moment it will emerge.', 0.7, 9.9);
  S('lumimoth', 'Lumimoth', ['Bug', 'Wind'], [60, 45, 50, 90, 80, 70], 45, 178, 'fast', ['swarm'], null, 'larv',
    { plan: 'moth', s: 0.85, c: ['#54c0b0', '#f890b8', '#f4fff8'], f: ['antenna', 'spots'] },
    'Its wings scatter glowing dust that lights up forests at night.', 1.1, 32.0);
  S('zapkit', 'Zapkit', ['Spark'], [35, 55, 40, 50, 50, 90], 190, 105, 'med', ['staticskin'], { item: 'thunderstone', to: 'voltlynx' }, 'zap',
    { plan: 'quad', s: 0.5, c: ['#48c4d4', '#f4e04c', '#e4f8fc'], acc2: '#f4e04c', f: ['antenna', 'spikes', 'ears:round', 'belly'] },
    'Static builds up in its fur as it runs. Touching it can make your hair stand on end.', 0.4, 6.0);
  S('voltlynx', 'Voltlynx', ['Spark'], [60, 90, 55, 90, 80, 110], 75, 218, 'med', ['staticskin'], null, 'zap',
    { plan: 'quad', s: 0.85, c: ['#2c5c9c', '#58e0f0', '#d8f4fc'], acc2: '#f4e04c', f: ['ears:pointy', 'tail:bolt', 'spikes', 'stripes', 'gem'] },
    'It moves like lightning across the plains. Thunder follows its footsteps.', 1.2, 30.0);
  S('pebblin', 'Pebblin', ['Stone', 'Earth'], [40, 80, 100, 30, 30, 20], 255, 60, 'med', ['sturdy'], { lv: 25, to: 'bouldrok' }, 'peb',
    { plan: 'golem', s: 0.45, c: ['#a49c8c', '#787064', '#cac2b2'], f: ['brow'] },
    'Often mistaken for a rock. Hikers step on it by accident and get a nasty surprise.', 0.4, 20.0);
  S('bouldrok', 'Bouldrok', ['Stone', 'Earth'], [55, 95, 115, 45, 45, 35], 120, 137, 'med', ['sturdy'], { lv: 38, to: 'cragtitan' }, 'peb',
    { plan: 'golem', s: 0.7, c: ['#98907c', '#686050', '#bcb4a0'], f: ['brow', 'spikes'] },
    'It rolls down mountain slopes to travel. Landslides are often its doing.', 1.0, 105.0);
  S('cragtitan', 'Cragtitan', ['Stone', 'Earth'], [80, 120, 130, 55, 65, 45], 45, 223, 'med', ['sturdy'], null, 'peb',
    { plan: 'golem', s: 1.0, c: ['#8c8470', '#585044', '#b0a890'], acc2: '#68b8d8', f: ['brow', 'spikes', 'gem'] },
    'A walking mountain. Crystals grow from its shoulders over hundreds of years.', 1.6, 300.0);
  S('duskwing', 'Duskwing', ['Spirit', 'Wind'], [40, 45, 35, 40, 40, 55], 255, 49, 'med', ['levitate'], { lv: 22, to: 'gloomwing' }, 'dusk',
    { plan: 'blob', s: 0.45, c: ['#6c5cac', '#d84c7c', '#ece4f8'], f: ['wings:bat', 'ears:pointy', 'fangs'] },
    'It flits through caves at night. It hates bright light and sleeps upside down.', 0.6, 5.0);
  S('gloomwing', 'Gloomwing', ['Spirit', 'Wind'], [75, 80, 70, 65, 75, 90], 90, 159, 'med', ['levitate'], null, 'dusk',
    { plan: 'blob', s: 0.8, c: ['#4c3c8c', '#d83c6c', '#e4dcf4'], f: ['wings:bat', 'ears:pointy', 'fangs', 'gem'] },
    'Its silent wings let it glide unseen. Its eerie cry chills travelers to the bone.', 1.4, 41.0);
  S('sporelet', 'Sporelet', ['Plant', 'Toxic'], [35, 60, 45, 60, 50, 35], 190, 57, 'med', ['regrow'], { lv: 24, to: 'fungore' }, 'spore',
    { plan: 'blob', s: 0.45, c: ['#f4ecd4', '#d84c3c', '#ffffff'], f: ['cap', 'feet'] },
    'It buries itself in damp soil. The spots on its cap release a sleepy dust.', 0.3, 4.5);
  S('fungore', 'Fungore', ['Plant', 'Toxic'], [70, 95, 80, 85, 75, 40], 75, 162, 'med', ['regrow'], null, 'spore',
    { plan: 'blob', s: 0.85, c: ['#ece0c4', '#b83030', '#ffffff'], f: ['cap:big', 'arms', 'feet'] },
    'Spores puff from its huge cap when it stomps. Forests grow wherever it lives.', 1.1, 40.0);
  S('minnox', 'Minnox', ['Water'], [45, 50, 55, 35, 40, 65], 255, 40, 'fast', ['runaway'], { lv: 22, to: 'reefhorn' }, 'minn',
    { plan: 'fish', s: 0.45, c: ['#ec9c4c', '#fff0b8', '#ffffff'], f: ['fin:head', 'spots'] },
    'A common little fish. It nibbles at fishing lines just to tease anglers.', 0.3, 2.0);
  S('reefhorn', 'Reefhorn', ['Water', 'Stone'], [75, 95, 100, 60, 75, 70], 60, 170, 'fast', ['thickhide'], null, 'minn',
    { plan: 'fish', s: 0.85, c: ['#e86c5c', '#fff0c8', '#ffffff'], acc2: '#f4b8d0', f: ['fin:head', 'horn:one', 'coral'] },
    'Coral grows on its body as it ages. It rams ships that sail over its reef.', 1.3, 65.0);
  S('frostpup', 'Frostpup', ['Ice'], [50, 60, 45, 45, 45, 60], 120, 70, 'med', ['thickhide'], { lv: 28, to: 'glaciwolf' }, 'frost',
    { plan: 'quad', s: 0.5, c: ['#e0f4ff', '#7cbcec', '#ffffff'], f: ['ears:pointy', 'tail:fluffy', 'cheeks'] },
    'Its breath is always frosty. It rolls in snow to keep its fur fluffy.', 0.5, 9.0);
  S('glaciwolf', 'Glaciwolf', ['Ice'], [80, 100, 70, 70, 75, 100], 45, 175, 'med', ['thickhide'], null, 'frost',
    { plan: 'quad', s: 0.9, c: ['#cce8fc', '#4c94d4', '#ffffff'], f: ['ears:pointy', 'tail:fluffy', 'mane', 'spikes', 'fangs'] },
    'Packs of them howl on frozen peaks. Ice crystals form wherever they run.', 1.4, 60.0);
  S('magmite', 'Magmite', ['Fire', 'Stone'], [50, 64, 70, 50, 40, 30], 120, 73, 'med', ['flamebody'], { lv: 30, to: 'volcanor' }, 'magma',
    { plan: 'golem', s: 0.5, c: ['#5c4c4c', '#f87c2c', '#ffcc4c'], f: ['flame', 'cracks'] },
    'Lava bubbles through the cracks in its rocky skin. It lives near hot springs.', 0.5, 45.0);
  S('volcanor', 'Volcanor', ['Fire', 'Stone'], [80, 100, 105, 85, 65, 40], 45, 185, 'med', ['flamebody'], null, 'magma',
    { plan: 'golem', s: 0.95, c: ['#4c3c3c', '#f86c1c', '#ffd44c'], f: ['flame:big', 'cracks', 'spikes'] },
    'A living volcano. When angered, it erupts with blasts of molten rock.', 1.7, 250.0);
  S('wispette', 'Wispette', ['Spirit'], [30, 30, 35, 70, 60, 60], 190, 62, 'med', ['levitate'], { lv: 25, to: 'hauntwisp' }, 'wisp',
    { plan: 'ghost', s: 0.5, c: ['#bcacec', '#7c5ccc', '#ffffff'], f: ['wisp'] },
    'A floating flame of pale light. It giggles as it leads travelers in circles.', 0.4, 0.1);
  S('hauntwisp', 'Hauntwisp', ['Spirit', 'Mind'], [55, 50, 55, 105, 90, 95], 60, 172, 'med', ['levitate'], null, 'wisp',
    { plan: 'ghost', s: 0.85, c: ['#9c84dc', '#4c2c9c', '#ffffff'], acc2: '#f05888', f: ['wisp', 'arms', 'gem'] },
    'It reads the dreams of sleeping people and replays them as flickering shadows.', 1.2, 0.5);
  S('brawlet', 'Brawlet', ['Brawl'], [50, 75, 45, 25, 35, 50], 180, 61, 'med', ['menace'], { lv: 28, to: 'pugilox' }, 'brawl',
    { plan: 'biped', s: 0.55, c: ['#dc8c5c', '#c83c3c', '#f8e4cc'], f: ['band', 'arms:big', 'brow'] },
    'It trains by punching tree trunks every morning. It never backs down from a challenge.', 0.7, 19.0);
  S('pugilox', 'Pugilox', ['Brawl'], [80, 110, 75, 40, 65, 85], 60, 170, 'med', ['menace'], null, 'brawl',
    { plan: 'biped', s: 0.9, c: ['#c4743c', '#b02828', '#f4dcc0'], f: ['band', 'arms:big', 'brow', 'horn:two'] },
    'Its fists strike faster than the eye can follow. It respects only strong opponents.', 1.5, 80.0);
  S('slitherin', 'Slitherin', ['Toxic'], [35, 60, 44, 40, 54, 55], 255, 58, 'med', ['toxictouch'], { lv: 22, to: 'cobrax' }, 'slith',
    { plan: 'serpent', s: 0.5, c: ['#ac5ccc', '#f4d44c', '#ecdcf4'], f: ['fangs', 'stripes'] },
    'It slithers through tall grass, flicking its tongue to taste the air.', 2.0, 6.9);
  S('cobrax', 'Cobrax', ['Toxic'], [65, 95, 69, 65, 79, 80], 90, 157, 'med', ['toxictouch'], null, 'slith',
    { plan: 'serpent', s: 0.9, c: ['#8c3cac', '#f4c434', '#e8d4f0'], f: ['fangs', 'stripes', 'hood'] },
    'The pattern on its hood frightens foes. Its venom can topple a tree.', 3.5, 65.0);
  S('psyfawn', 'Psyfawn', ['Mind'], [45, 40, 45, 70, 65, 65], 120, 66, 'med', ['keen'], { lv: 30, to: 'oracervus' }, 'fawn',
    { plan: 'quad', s: 0.55, c: ['#f4bcdc', '#8c5ccc', '#fff4fa'], f: ['ears:long', 'gem', 'spots'] },
    'It senses danger before it happens. It appears to lost children and leads them home.', 0.7, 12.0);
  S('oracervus', 'Oracervus', ['Mind'], [75, 65, 75, 105, 100, 90], 45, 180, 'med', ['keen'], null, 'fawn',
    { plan: 'quad', s: 0.95, c: ['#e8a4cc', '#6c3cac', '#fff0f8'], f: ['ears:long', 'gem', 'antlers', 'spots', 'mane'] },
    'Its glowing antlers can see the future. It is said to appear only to the pure of heart.', 1.6, 70.0);
  S('crabbit', 'Crabbit', ['Water'], [30, 80, 90, 30, 30, 50], 225, 65, 'med', ['thickhide'], { lv: 26, to: 'clawdron' }, 'crab',
    { plan: 'bug', s: 0.5, c: ['#ec6c4c', '#fcd4b4', '#fff0e4'], f: ['claws', 'eyestalks'] },
    'It scuttles sideways along beaches. Its claws can snap a stick in two.', 0.4, 6.5);
  S('clawdron', 'Clawdron', ['Water', 'Brawl'], [55, 120, 110, 50, 60, 75], 60, 166, 'med', ['thickhide'], null, 'crab',
    { plan: 'bug', s: 0.9, c: ['#cc3c34', '#fcc4a4', '#ffece0'], f: ['claws:big', 'eyestalks', 'spikes'] },
    'Its giant claw packs a punch that can crack stone. It boxes rivals on the shore.', 1.3, 60.0);
  S('puffkin', 'Puffkin', ['Normal'], [90, 40, 30, 45, 30, 20], 170, 76, 'fast', ['regrow'], { item: 'moonstone', to: 'puffaria' }, 'puff',
    { plan: 'blob', s: 0.5, c: ['#fcc4dc', '#ec7cac', '#fff4f8'], f: ['ears:round', 'cheeks', 'tuft'] },
    'It puffs up like a balloon and floats on the breeze. Its song makes anyone sleepy.', 0.5, 5.5);
  S('puffaria', 'Puffaria', ['Normal'], [130, 70, 45, 85, 60, 40], 50, 196, 'fast', ['regrow'], null, 'puff',
    { plan: 'blob', s: 0.85, c: ['#fcb4d0', '#dc5c94', '#fff0f6'], acc2: '#f8e070', f: ['ears:long', 'cheeks', 'tuft', 'arms', 'gem'] },
    'Its soft body is as light as a cloud. It sings duets with the wind on moonlit nights.', 1.0, 12.0);
  S('drakelet', 'Drakelet', ['Drake'], [41, 64, 45, 50, 50, 50], 45, 60, 'slow', ['menace'], { lv: 30, to: 'wyrmling' }, 'drake',
    { plan: 'serpent', s: 0.5, c: ['#5cacac', '#f4f4d4', '#ecf8f4'], f: ['horn:one', 'whiskers'] },
    'A rare serpent found near mountain springs. It sheds its skin as it grows stronger.', 1.8, 3.3);
  S('wyrmling', 'Wyrmling', ['Drake'], [61, 84, 65, 70, 70, 70], 45, 147, 'slow', ['menace'], { lv: 44, to: 'dracoryn' }, 'drake',
    { plan: 'serpent', s: 0.8, c: ['#4c94b8', '#f4f0c8', '#e8f4f8'], acc2: '#e8f0ff', f: ['horn:one', 'whiskers', 'fin:head', 'gem'] },
    'Its body glows faintly. It is said to control the weather in its valley.', 4.0, 16.5);
  S('dracoryn', 'Dracoryn', ['Drake', 'Wind'], [91, 134, 95, 100, 100, 80], 45, 270, 'slow', ['menace'], null, 'drake',
    { plan: 'biped', s: 1.0, c: ['#3c8c88', '#c8a040', '#f0e8c8'], acc2: '#e8f0ff', f: ['horn:two', 'wings:feather', 'tail:thick', 'belly', 'arms', 'gem'] },
    'A gentle giant that guides ships through storms. It can circle the world in a day.', 2.2, 210.0);
  S('aurelis', 'Aurelis', ['Mind', 'Drake'], [100, 100, 100, 125, 105, 100], 3, 306, 'slow', ['pressure'], null, 'aur',
    { plan: 'biped', s: 1.0, c: ['#f8f0dc', '#e4b434', '#7cccf4'], acc2: '#f05888', f: ['crest:big', 'gem', 'wings:feather', 'tail:fluffy', 'horn:two', 'arms'] },
    'The guardian of the summit. Its wings shine with every color of dawn. Few have seen it and returned unchanged.', 3.0, 199.0);

  // --- expansion: marsh, forest, snow and ruins creatures ---
  S('pondlet', 'Pondlet', ['Water'], [50, 45, 50, 45, 50, 45], 190, 60, 'med', ['thickhide'], { lv: 28, to: 'bogroar' }, 'bog',
    { plan: 'quad', s: 0.5, c: ['#6cc4a8', '#3c8c74', '#e8f8d8'], f: ['cheeks', 'belly', 'tail:stub', 'spots'] },
    'It sits on lily pads and sings to the rain. Its skin dries out if it leaves the marsh for long.', 0.4, 7.0);
  S('bogroar', 'Bogroar', ['Water', 'Earth'], [95, 85, 85, 65, 65, 40], 75, 170, 'med', ['thickhide'], null, 'bog',
    { plan: 'quad', s: 0.92, c: ['#4c9c80', '#7c5c3c', '#e0f0c8'], f: ['spots', 'belly', 'brow', 'tail:stub'] },
    'Its croaking roar shakes the reeds for miles. It wallows in mud to cool its huge body.', 1.4, 98.0);
  S('thistlet', 'Thistlet', ['Plant'], [45, 60, 50, 35, 40, 45], 190, 58, 'med', ['regrow'], { lv: 26, to: 'thornbrawl' }, 'thist',
    { plan: 'blob', s: 0.45, c: ['#a8d860', '#c070d0', '#f0f8d8'], f: ['spikes', 'feet', 'cheeks'] },
    'A prickly ball that rolls through meadows. It plants its spikes in anything that tries to eat it.', 0.3, 3.0);
  S('thornbrawl', 'Thornbrawl', ['Plant', 'Brawl'], [80, 105, 80, 50, 60, 70], 75, 165, 'med', ['regrow'], null, 'thist',
    { plan: 'biped', s: 0.85, c: ['#78b840', '#a048b8', '#e8f4c8'], f: ['spikes', 'arms:big', 'band', 'brow'] },
    'It boxes with fists covered in thorns. Even boulders fear its one-two punch.', 1.5, 66.0);
  S('flurrbit', 'Flurrbit', ['Ice'], [45, 40, 45, 55, 50, 60], 190, 60, 'med', ['keen'], { lv: 30, to: 'blizzowl' }, 'flurr',
    { plan: 'bird', s: 0.45, c: ['#e8f4ff', '#88c0f0', '#ffffff'], f: ['crest', 'beak'] },
    'A puffball of a bird that hops through fresh snow. Its feathers trap air to keep it warm.', 0.3, 1.5);
  S('blizzowl', 'Blizzowl', ['Ice', 'Wind'], [75, 70, 70, 95, 85, 95], 75, 175, 'med', ['keen'], null, 'flurr',
    { plan: 'bird', s: 0.95, c: ['#c8e4fc', '#4c84c8', '#ffffff'], acc2: '#a8f0ff', f: ['crest:big', 'beak', 'tail:feather', 'brow'] },
    'It flies silently through blizzards. A single beat of its wings brings a whirl of snow.', 1.3, 28.0);
  S('nutling', 'Nutling', ['Bug', 'Stone'], [50, 65, 90, 30, 45, 25], 190, 62, 'med', ['sturdy'], { lv: 27, to: 'barkade' }, 'nut',
    { plan: 'golem', s: 0.45, c: ['#b08850', '#6c4c2c', '#e8d0a0'], f: ['antenna', 'brow'] },
    'It looks just like an acorn. Squirrels that try to bury it get a nasty pinch.', 0.3, 9.0);
  S('barkade', 'Barkade', ['Bug', 'Stone'], [75, 100, 125, 45, 70, 40], 75, 168, 'med', ['sturdy'], null, 'nut',
    { plan: 'golem', s: 0.85, c: ['#9c7444', '#4c3420', '#dcc090'], acc2: '#78c858', f: ['antenna', 'spikes', 'gem', 'brow'] },
    'Its armor is as hard as old oak bark. Moss and tiny mushrooms grow on its back.', 1.2, 140.0);
  S('sparkfin', 'Sparkfin', ['Spark', 'Water'], [45, 40, 45, 60, 45, 70], 190, 62, 'med', ['staticskin'], { lv: 30, to: 'voltray' }, 'spark',
    { plan: 'fish', s: 0.45, c: ['#f8e050', '#3c78d8', '#ffffff'], f: ['fin:head', 'spots'] },
    'Little sparks crackle off its fins. Schools of them light up the marsh at night.', 0.4, 3.0);
  S('voltray', 'Voltray', ['Spark', 'Water'], [80, 65, 70, 105, 80, 90], 75, 175, 'med', ['staticskin'], null, 'spark',
    { plan: 'fish', s: 0.9, c: ['#3c64c8', '#f8e040', '#e8f0ff'], acc2: '#f8e040', f: ['fin:head', 'horn:one', 'spots'] },
    'It glides like a kite underwater and shocks prey with its long horn.', 1.8, 60.0);
  S('gustling', 'Gustling', ['Wind'], [40, 45, 40, 55, 45, 70], 190, 58, 'med', ['levitate'], { lv: 32, to: 'cyclonix' }, 'gust',
    { plan: 'blob', s: 0.45, c: ['#d8e8f8', '#a8b8e8', '#ffffff'], f: ['wings:feather', 'tuft', 'cheeks'] },
    'A fluffy wisp of cloud with wings. It rides the breeze wherever the wind goes.', 0.3, 0.6);
  S('cyclonix', 'Cyclonix', ['Wind', 'Mind'], [70, 60, 65, 105, 80, 110], 75, 178, 'med', ['levitate'], null, 'gust',
    { plan: 'ghost', s: 0.85, c: ['#b8c8f0', '#6c7cd8', '#ffffff'], acc2: '#f05888', f: ['wisp', 'arms', 'gem'] },
    'It spins itself into a small tornado. People say it can sense storms days in advance.', 1.5, 12.0);
  S('moundle', 'Moundle', ['Earth'], [50, 60, 50, 30, 40, 45], 190, 58, 'med', ['thickhide'], { lv: 20, to: 'burrowolf' }, 'mound',
    { plan: 'quad', s: 0.45, c: ['#c8a068', '#8c6438', '#f0e0c0'], f: ['ears:round', 'whiskers', 'tail:stub'] },
    'It digs tunnels under fields and pops up in surprising places.', 0.3, 5.0);
  S('burrowolf', 'Burrowolf', ['Earth'], [70, 85, 70, 40, 55, 75], 120, 140, 'med', ['thickhide'], { lv: 38, to: 'quakefang' }, 'mound',
    { plan: 'quad', s: 0.72, c: ['#b08848', '#6c4c28', '#ecd8b0'], f: ['ears:pointy', 'fangs', 'tail:fluffy', 'stripes'] },
    'Packs of them hunt underground, listening for footsteps above.', 0.9, 32.0);
  S('quakefang', 'Quakefang', ['Earth', 'Brawl'], [95, 120, 95, 50, 70, 90], 45, 230, 'med', ['thickhide'], null, 'mound',
    { plan: 'quad', s: 1.0, c: ['#9c7038', '#4c3420', '#e8d0a0'], acc2: '#e8c048', f: ['ears:pointy', 'fangs', 'mane', 'spikes', 'tail:fluffy', 'brow'] },
    'When it howls and stomps, the ground cracks open beneath its foes.', 1.6, 110.0);
  S('shardling', 'Shardling', ['Ice', 'Stone'], [50, 55, 85, 45, 60, 25], 150, 64, 'med', ['sturdy'], { lv: 35, to: 'glacierra' }, 'shard',
    { plan: 'golem', s: 0.45, c: ['#b8e0f0', '#6cb0d8', '#e8f8ff'], f: ['spikes', 'brow'] },
    'A chunk of living ice. It grows by freezing snowflakes onto its body.', 0.4, 30.0);
  S('glacierra', 'Glacierra', ['Ice', 'Stone'], [90, 95, 120, 80, 85, 35], 60, 190, 'med', ['sturdy'], null, 'shard',
    { plan: 'golem', s: 0.9, c: ['#a0d0ec', '#3c84c0', '#e0f4ff'], acc2: '#ffffff', f: ['spikes', 'gem', 'cracks'] },
    'It slumbers inside glaciers for centuries. Its crystal core never melts.', 2.0, 400.0);
  S('stinglet', 'Stinglet', ['Bug', 'Toxic'], [40, 50, 35, 30, 35, 60], 255, 45, 'fast', ['toxictouch'], { lv: 12, to: 'waspire' }, 'sting',
    { plan: 'bug', s: 0.45, c: ['#68c8a0', '#7c4cb8', '#e8f8f0'], f: ['antenna', 'spots'] },
    'The stinger on its tail tingles for hours. Its jewel-toned shell warns others to stay away.', 0.3, 3.2);
  S('waspire', 'Waspire', ['Bug', 'Toxic'], [65, 90, 50, 45, 70, 95], 90, 160, 'fast', ['toxictouch'], null, 'sting',
    { plan: 'moth', s: 0.8, c: ['#3cb8a8', '#5c3c98', '#e8fff8'], f: ['antenna', 'spots'] },
    'It guards its hive with lightning-fast stings. Whole forests go quiet when it buzzes past.', 1.0, 29.0);
  S('lanternip', 'Lanternip', ['Spirit', 'Fire'], [40, 40, 40, 65, 55, 55], 190, 62, 'med', ['flamebody'], { lv: 33, to: 'pyrewraith' }, 'lant',
    { plan: 'ghost', s: 0.45, c: ['#f8d080', '#f07838', '#fff8e0'], f: ['wisp'] },
    'It glows like a paper lantern in dark woods. Following its light is said to lead you home... or not.', 0.3, 0.2);
  S('pyrewraith', 'Pyrewraith', ['Spirit', 'Fire'], [70, 60, 65, 110, 85, 95], 60, 180, 'med', ['flamebody'], null, 'lant',
    { plan: 'ghost', s: 0.85, c: ['#e8a058', '#c03828', '#fff0d0'], acc2: '#f8e070', f: ['wisp', 'arms', 'brow'] },
    'Its ghostly flames burn without heat. It dances among old ruins on moonless nights.', 1.4, 1.0);
  S('mimicube', 'Snoozel', ['Normal'], [70, 70, 70, 70, 70, 70], 45, 150, 'med', ['regrow'], null, 'mimic',
    { plan: 'blob', s: 0.55, c: ['#c8ecd8', '#78b898', '#ffffff'], f: ['cheeks', 'sleepy', 'tuft', 'ears:round'] },
    'An odd, sleepy creature rarely seen in deep forests. It is perfectly balanced in every way.', 0.5, 10.0);
  S('glaciel', 'Glaciel', ['Ice', 'Mind'], [95, 80, 105, 120, 115, 95], 3, 290, 'slow', ['pressure'], null, 'glac',
    { plan: 'quad', s: 1.0, c: ['#e0f4ff', '#58a8e0', '#ffffff'], acc2: '#a8f0ff', f: ['antlers', 'gem', 'mane', 'tail:fluffy', 'ears:long'] },
    'A crystal stag that guards the frozen north. Its antlers of living ice ring like bells in the wind.', 2.2, 75.0);
  S('umbrath', 'Umbrath', ['Spirit', 'Drake'], [110, 120, 100, 110, 100, 90], 3, 300, 'slow', ['pressure'], null, 'umb',
    { plan: 'biped', s: 1.0, c: ['#3c3058', '#a048d8', '#c8b8e8'], acc2: '#f05888', f: ['horn:two', 'wings:bat', 'tail:thick', 'arms', 'gem', 'fangs'] },
    'The shadow twin of the summit guardian. Sealed beneath the marsh long ago, it dreams of endless night.', 3.2, 220.0);
  G.LEGENDS = ['aurelis', 'glaciel', 'umbrath'];

  G.SHINY_RATE = 1 / 512;
})();
