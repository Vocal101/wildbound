'use strict';
// Story scripts and cutscenes for the Verdania region.
(function () {
  const W = () => G.world;
  const L = G.LOOKS;
  const say = (...t) => G.sayAll(t.map((s) => G.fmt(s)));
  const sfx = (n) => G.audio.sfx(n);

  const STARTERS = { 4: 'sprigling', 5: 'embercub', 6: 'drizzlet' };
  const COUNTER = { sprigling: 'embercub', embercub: 'drizzlet', drizzlet: 'sprigling' };
  const LINES = { sprigling: ['sprigling', 'thornback', 'briarox'], embercub: ['embercub', 'blazefang', 'infernox'], drizzlet: ['drizzlet', 'tidalon', 'maelstrake'] };
  const rivalLine = () => LINES[G.S.rivalStarter || COUNTER[G.S.starter || 'sprigling']];

  async function give(id, n = 1, from) {
    const it = G.ITEMS[id];
    G.giveItem(id, n); sfx('item');
    await G.say((from ? from + ' gave ' : G.S.name + ' received ') + (n > 1 ? n + ' ' + G.plural(it.name) : it.name) + (from ? ' to ' + G.S.name : '') + '!');
    await G.say((n > 1 ? 'They went' : 'It went') + ' into the ' + G.POCKETS.find((p) => p.id === it.pocket).name + ' pocket.');
  }
  G.give = give;

  // small panel that shows a creature while a question is asked
  class MonPanel {
    constructor(sp) { this.sp = sp; this.overlay = true; }
    update() { }
    draw(c) { G.box(112, 36, 96, 96); c.fillStyle = '#e8f4f8'; c.fillRect(118, 42, 84, 84); c.drawImage(G.creatureSprite(this.sp), 128, 52); }
  }
  async function healJingle() {
    G.audio.stop(0.05); sfx('heal');
    await G.wait(110);
    const m = G.MAPS[G.S.map]; G.audio.play((m.musicFn ? m.musicFn() : m.music) || 'town', true);
  }

  G.story = {
    // ---------------- home ----------------
    async mom() {
      if (!G.hasFlag('starter')) {
        await say('Mom: Good morning, {PLAYER}! Professor Wren came by earlier.', 'Mom: He said he has something special for you at his lab. Hurry along now!');
        return;
      }
      if (G.hasFlag('champion')) await say('Mom: My child, the Champion of Verdania! I\'m so proud of you!');
      else await say('Mom: Oh, {PLAYER}! You look worn out. Let me take care of your team.');
      await healJingle(); G.healParty();
      G.S.heal = { map: 'home', x: 4, y: 5 };
      await say('Mom: There! Everyone\'s feeling much better. Come home whenever you need a rest!');
    },
    async rivalSister() {
      if (G.hasFlag('lena_gift')) { await say('Lena: My brother can be a handful, but he means well. Look after him for me, okay?'); return; }
      await say('Lena: Oh, you\'re {RIVAL}\'s friend! He ran off to the lab already.', 'Lena: Here, take these. Wild creatures won\'t bother you as much.');
      await give('repel', 2); G.setFlag('lena_gift');
    },
    async oldFisher() {
      await say('Old Man: Ah, the pond is calm today.', 'Old Man: With a fishing rod you could hook all sorts of water creatures. A fisherman on Route 2 gives them away, I hear.');
    },

    // ---------------- intro / lab ----------------
    async stopLeaving() {
      const p = W().player;
      await say('???: {PLAYER}! Over here!');
      const kid = W().addNpc({ look: L.kid }, p.x, p.y + 3, 'up');
      await W().npcWalk(kid, 'uu', true);
      p.dir = 'down';
      await say('Neighbor Kid: Professor Wren is waiting for you at his lab! It\'s the big white building in the south of town.', 'Neighbor Kid: He told me to make sure you don\'t wander off without a partner creature!');
      await W().npcWalk(kid, 'dd', true); W().removeNpc(kid);
      await W().playerWalk('d');
    },
    async profTalk() {
      if (!G.hasFlag('starter')) {
        await say('Prof. Wren: Welcome, {PLAYER}! I\'m Professor Wren.', 'Prof. Wren: On this table are three young creatures, each sealed in a Bind Orb.', 'Prof. Wren: I\'d like you to choose one as your partner. Go on, take a look!');
        return;
      }
      if (!G.hasFlag('dex')) { await say('Prof. Wren: How about testing your new partner against {RIVAL}?'); return; }
      const ct = G.dexCount();
      if (ct.caught >= 40 && !G.hasItem('shinycharm')) {
        await say('Prof. Wren: Goodness! ' + ct.caught + ' creatures caught! You\'ve done wonderful work on the Dex.', 'Prof. Wren: Please, take this. It\'s a Shiny Charm. Shiny creatures will appear far more often while you carry it.');
        await give('shinycharm'); return;
      }
      await say('Prof. Wren: Let\'s see your Dex... You\'ve seen ' + ct.seen + ' creatures and caught ' + ct.caught + '!',
        ct.caught < 10 ? 'Prof. Wren: A fine start! Weaken wild creatures before throwing an orb, and put them to sleep if you can.' : ct.caught < 40 ? 'Prof. Wren: Splendid progress! Catch 40 and I\'ll have a reward for you.' : 'Prof. Wren: Truly remarkable. You\'re a natural!');
    },
    async starterTable(x) {
      const sp = STARTERS[x];
      if (G.hasFlag('starter')) {
        if (G.S.starter === sp) await say('This is where your partner\'s orb used to be.');
        else if (G.S.rivalStarter === sp) await say('{RIVAL} took this one.');
        else await say('It\'s the last orb. Prof. Wren will keep this creature safe.');
        return;
      }
      const s = G.SPECIES[sp];
      const panel = new MonPanel(sp); G.push(panel); G.audio.cry(sp);
      const desc = { sprigling: 'the Plant-type Sprigling', embercub: 'the Fire-type Embercub', drizzlet: 'the Water-type Drizzlet' }[sp];
      const yes = await G.ask('Prof. Wren: So, you\'d like ' + desc + '?');
      G.pop(panel);
      if (!yes) return;
      const mon = G.makeMon(sp, 5, { ot: G.S.name, otId: G.S.playerId, met: 'Wren Lab' });
      G.S.starter = sp; G.S.rivalStarter = COUNTER[sp];
      G.storeMon(mon); G.setFlag('starter'); G.setFlag('starter_x' + x);
      sfx('caught');
      await say('{PLAYER} received ' + s.name + ' from Professor Wren!');
      if (await G.ask('Give a nickname to ' + s.name + '?')) {
        const nn = await G.nameEntry('Nickname for ' + s.name + '?', s.name, 10, G.creatureSprite(sp));
        if (nn !== s.name) mon.nick = nn;
      }
      const r = W().npc('rival');
      if (r) {
        await say('{RIVAL}: Then I\'ll take this one! Heh, it has the type advantage.');
        const rx = { sprigling: 4, embercub: 5, drizzlet: 6 }[COUNTER[sp]];
        await W().npcWalk(r, 'r'.repeat(Math.max(0, rx - r.x)) + 'u', true);
        r.dir = 'up'; G.setFlag('starter_x' + rx);
        await say('{RIVAL} received ' + G.SPECIES[COUNTER[sp]].name + ' from Professor Wren!');
        await W().npcWalk(r, 'd', true);
        r.home = [r.x, r.y];
      }
    },
    async rivalLabTalk() {
      if (!G.hasFlag('starter')) await say('{RIVAL}: Hey, {PLAYER}! The professor said you get first pick. Hurry up already!');
      else await say('{RIVAL}: My creature is way cooler than yours!');
    },
    async rivalLabBattle() {
      const p = W().player; const r = W().npc('rival');
      p.dir = 'up';
      await say('{RIVAL}: Wait, {PLAYER}! Let\'s see whose creature is stronger!');
      if (r) {
        while (Math.abs(r.x - p.x) + Math.abs(r.y - p.y) > 1) {
          const d = r.x < p.x ? 'right' : r.x > p.x ? 'left' : r.y < p.y ? 'down' : 'up';
          if (!(await W().npcStep(r, d))) break;
        }
        W().facePlayer(r); p.dir = G.OPP[r.dir];
      }
      const line = rivalLine();
      const res = await W().doBattle({ trainer: { id: 'rival1', name: '{RIVAL}', look: L.rival, party: [[line[0], 5]], ivs: 2, base: 30, lose: 'Aw, no way! I picked the stronger one!' }, bg: 'indoor', noWhiteout: true });
      G.setFlag('rival1');
      if (res === 'lose') await say('{RIVAL}: Yes! I won! Guess I\'m just better at this.');
      else await say('{RIVAL}: Hmph. Beginner\'s luck!');
      await say('{RIVAL}: I\'m going to train until I\'m the strongest trainer in Verdania. Catch you later!');
      if (r) { await W().npcWalk(r, 'dddd', true); W().removeNpc(r); }
      G.healParty();
      const prof = W().npc('prof');
      await say('Prof. Wren: What a battle! Your creatures are already growing close to you.', 'Prof. Wren: {PLAYER}, I have a favor to ask. Will you help me record every creature in Verdania?', 'Prof. Wren: Take this Wildling Dex. It records any creature you see or catch.');
      sfx('item'); G.setFlag('dex'); await say('{PLAYER} received the Wildling Dex!');
      await say('Prof. Wren: And these, so you can catch creatures of your own.');
      await give('bindorb', 5);
      await say('Prof. Wren: Weaken a wild creature in battle, then throw an orb. The weaker it is, the easier it is to catch!', 'Prof. Wren: There are three Wardens in Verdania. Defeat them all to earn the right to challenge the Champion at the summit.', 'Prof. Wren: Your journey begins now. Brookvale City is north, past Route 1. Good luck!');
      if (prof) prof.dir = 'down';
    },
    async route1Helper() {
      if (G.hasFlag('r1_gift')) { await say('Tip: Hold Shift to run! And press Esc or M to open your menu.'); return; }
      await say('Hi there! New trainer? Here\'s a little something to help you out.');
      await give('potion', 2); G.setFlag('r1_gift');
      await say('Tip: Hold Shift to run! And press Esc or M to open your menu.');
    },

    // ---------------- havens ----------------
    async nurse(havenId) {
      const ok = await G.ask('Nurse: Hi there! This is the Haven. Want me to patch up your team?');
      if (!ok) { await say('Nurse: Take care out there!'); return; }
      await say('Nurse: Just a moment while I look after them.');
      const n = W().npc('nurse'); if (n) n.dir = 'up';
      await healJingle(); G.healParty();
      if (n) n.dir = 'down';
      G.S.heal = { map: havenId, x: 6, y: 3 };
      await say('Nurse: All done! Your team is good as new. Take care out there!');
    },
    async summitNurse() {
      const ok = await G.ask('Nurse: The final challenge awaits. Shall I heal your team?');
      if (!ok) return;
      await healJingle(); G.healParty();
      G.S.heal = { map: 'summit', x: 4, y: 11 };
      await say('Nurse: All better! Give it everything you have.');
    },

    // ---------------- helpers on the road ----------------
    async bikeGuy() {
      if (G.hasItem('bike')) { await say('Mechanic: How\'s the bike treating you? Use it from your bag, in the Key Items pocket.'); return; }
      if (!G.hasFlag('badge1')) { await say('Mechanic: I build folding bikes! Normally they cost a fortune...', 'Mechanic: But earn a Sigil from Warden Petra and I\'ll know you\'re a real trainer. Then I\'ll give you one for free!'); return; }
      await say('Mechanic: That\'s the Stone Sigil! A promise is a promise. This bike is yours!');
      await give('bike');
      await say('Mechanic: Ride it from the Key Items pocket in your bag. It\'s twice as fast as running!');
    },
    async oldRodGuy() {
      if (G.hasItem('oldrod') || G.hasItem('goodrod')) { await say('Fisherman: Face the water and press A to fish. Patience is the secret!'); return; }
      await say('Fisherman: Ah, a young trainer! Do you like fishing?', 'Fisherman: Well, you will! Here, take my old rod.');
      await give('oldrod');
      await say('Fisherman: Face any water and press A to cast. All sorts of creatures live below the surface!');
    },
    async goodRodGuy() {
      if (G.hasItem('goodrod')) { await say('Angler: The deep sea holds the rarest catches. Keep at it!'); return; }
      await say('Angler: That old rod won\'t catch anything big out here.', 'Angler: Take this Good Rod. It can hook the creatures living in deeper water!');
      await give('goodrod');
    },
    async shinyCollector() {
      if (G.hasFlag('shiny_reward')) { await say('Collector: Every sparkle is a little miracle. Keep your eyes open, dear!'); return; }
      const sh = G.S.party.find((m) => m.shiny);
      if (!sh) {
        await say('Collector: I collect shiny creatures! They have unusual colors and sparkle the moment they appear.', 'Collector: Only about one in five hundred wild creatures is shiny. If you ever catch one, show it to me. I\'ll make it worth your while!');
        return;
      }
      await say('Collector: Oh my... is that a shiny ' + G.SPECIES[sh.sp].name + '?! Simply beautiful!', 'Collector: As promised, here is my greatest treasure. It never fails to catch any creature.');
      await give('masterorb'); G.setFlag('shiny_reward');
    },

    // ---------------- wardens ----------------
    async warden(who) {
      const D = WARDENS[who];
      if (G.hasFlag(D.flag)) { await say(...D.after); return; }
      await say(...D.intro);
      const res = await W().doBattle({ trainer: Object.assign({ id: 'w_' + who, look: D.look, base: 100, boss: true, smart: true }, D.trainer), bg: 'hall' });
      if (res !== 'win') return;
      G.setFlag(D.flag); if (!G.S.badges.includes(D.badge)) G.S.badges.push(D.badge);
      await say(...D.win);
      sfx('badge'); await say('{PLAYER} received the ' + D.badgeName + ' from ' + D.trainer.name.replace('Warden ', '') + '!');
      await say(...D.badgeText);
      await give(D.disc, 1, D.trainer.name.replace('Warden ', ''));
      await say(...D.discText);
    },

    // ---------------- Syndicate ----------------
    async rookCave() {
      const r = W().npc('rook1'); const p = W().player;
      if (!r) return;
      W().facePlayer(r); p.dir = G.OPP[r.dir] || 'up';
      G.audio.play('hq');
      await say('Rook: Well, well. A brat wandering into Syndicate business.', 'Rook: I am Rook, Admin of the Hollow Syndicate. We\'re collecting Aether Shards, and you\'re in my way.', 'Rook: Let me teach you what happens to meddlers!');
      const res = await W().doBattle({ trainer: { id: 'rook1', name: 'Admin Rook', look: L.rook, party: [['slitherin', 13], ['duskwing', 14]], base: 60, boss: true, smart: true, items: ['potion'], lose: 'Grr... You got lucky, kid.' }, bg: 'cave' });
      if (res !== 'win') return;
      G.setFlag('rook1');
      await say('Rook: Tch. This shard is cracked anyway. Keep it, see if I care!');
      await give('shard');
      await say('Rook: The boss already has plenty. When Aurelis awakens, all of Verdania will bow to the Syndicate!', 'Rook: We\'ll meet again, brat.');
      await G.fadeOut(10); W().removeNpc(r); await G.fadeIn(10);
      G.audio.play('cave');
    },
    async rookHQ() {
      const r = W().npc('rook2'); if (!r) return; const p = W().player;
      W().facePlayer(r); p.dir = G.OPP[r.dir];
      await say('Rook: YOU again?! How did you get past my grunts?', 'Rook: This time there\'s no cave to hide in. Get ready to lose!');
      const res = await W().doBattle({ trainer: { id: 'rook2', name: 'Admin Rook', look: L.rook, party: [['cobrax', 26], ['gloomwing', 27], ['bouldrok', 26]], base: 60, boss: true, smart: true, items: ['superpotion'], lose: 'No... not again!' }, bg: 'hq' });
      if (res !== 'win') return;
      G.setFlag('rook2');
      await say('Rook: The boss... the boss will finish you. Boss Vex is right through there.');
      await G.fadeOut(10); W().removeNpc(r); await G.fadeIn(10);
    },
    async vex() {
      const v = W().npc('vex'); if (!v) return; const p = W().player;
      while (Math.abs(v.x - p.x) + Math.abs(v.y - p.y) > 1) { const d = v.y < p.y - 1 ? 'down' : v.x < p.x ? 'right' : v.x > p.x ? 'left' : 'down'; if (!(await W().npcStep(v, d))) break; }
      W().facePlayer(v); p.dir = G.OPP[v.dir];
      await say('Vex: So you\'re the child who keeps humiliating my Admin.', 'Vex: I am Vex, leader of the Hollow Syndicate. Do you know why we seized this tower?', 'Vex: Its generators channel enough power to resonate the Aether Shards. With them, I will awaken Aurelis, the summit guardian, and bind it to my will.', 'Vex: A creature that commands the dawn itself... and you would stand in my way? Very well. Kneel!');
      const res = await W().doBattle({ trainer: { id: 'vex', name: 'Boss Vex', look: L.vex, party: [['gnawbeast', 27], ['hauntwisp', 28], ['cobrax', 28], ['volcanor', 30]], base: 100, boss: true, smart: true, items: ['hyperpotion', 'hyperpotion'], lose: 'Impossible... beaten by a child?' }, bg: 'hq' });
      if (res !== 'win') return;
      await say('Vex: ...Hmph. The shards rejected me. Perhaps the guardian only answers to the strong of heart.', 'Vex: Fine. The Hollow Syndicate is finished... for now. Remember my name, child.');
      await G.fadeOut(14); W().removeNpc(v); G.setFlag('hq_clear'); await G.fadeIn(14);
      G.audio.play('town');
      await say('The Syndicate fled the tower! The power controls are back in the engineers\' hands.', 'Warden Volta\'s Hall in Stormcrest is open again!');
      await give('ultraorb', 3);
    },

    // ---------------- rival ----------------
    async rival2() {
      const p = W().player;
      G.audio.play('trainer');
      await say('{RIVAL}: Hey! {PLAYER}! Wait up!');
      const r = W().addNpc({ look: L.rival }, p.x, Math.max(0, p.y - 4), 'down');
      while (Math.abs(r.y - p.y) > 1) { if (!(await W().npcStep(r, 'down'))) break; }
      p.dir = 'up';
      await say('{RIVAL}: I heard you made it through Whisper Cave. Not bad!', '{RIVAL}: But I\'ve been training nonstop. Let\'s see who\'s really stronger!');
      const ln = rivalLine();
      const res = await W().doBattle({ trainer: { id: 'rival2', name: '{RIVAL}', look: L.rival, party: [['galeclaw', 18], ['zapkit', 17], [ln[1], 20]], base: 60, smart: true, items: ['superpotion'], lose: 'Argh! I can\'t believe I lost again!' }, bg: 'ash' });
      if (res !== 'win') { W().removeNpc(r); return; }
      G.setFlag('rival2');
      await say('{RIVAL}: Man... you\'re seriously strong.', '{RIVAL}: Emberfall\'s Warden is up ahead. I already beat him, by the way! See you around!');
      await W().npcWalk(r, 'uuuuuu', true); W().removeNpc(r);
      G.audio.play('route');
    },
    async rival3() {
      const r = W().npc('rival3'); const p = W().player; if (!r) return;
      while (Math.abs(r.x - p.x) + Math.abs(r.y - p.y) > 1) { const d = r.x < p.x ? 'right' : r.x > p.x ? 'left' : r.y < p.y ? 'down' : 'up'; if (!(await W().npcStep(r, d))) break; }
      W().facePlayer(r); p.dir = G.OPP[r.dir];
      G.audio.play('trainer');
      await say('{RIVAL}: There you are. I knew you\'d make it.', '{RIVAL}: Ever since we got our first creatures in the lab, I\'ve wanted to beat you. Really beat you.', '{RIVAL}: The Champion is through those doors. But first... one more battle. Our best against our best!');
      const ln = rivalLine();
      const res = await W().doBattle({ trainer: { id: 'rival3', name: '{RIVAL}', look: L.rival, party: [['skyraptor', 48], ['voltlynx', 47], ['reefhorn', 47], ['oracervus', 48], ['quakefang', 47], [ln[2], 51]], base: 80, boss: true, smart: true, items: ['hyperpotion', 'fullrestore'], lose: '...Yeah. You\'re the real deal.' }, bg: 'summit' });
      if (res !== 'win') return;
      G.setFlag('rival3');
      await say('{RIVAL}: Heh. I gave it everything, and you still won.', '{RIVAL}: Go on. Show the Champion what a trainer from Fernhollow can do. Win for both of us!');
      await W().npcWalk(r, 'dd', true); W().removeNpc(r);
      G.audio.play('summit');
    },
    async champion() {
      const s = W().npc('seraphine'); const p = W().player;
      if (G.hasFlag('champion')) {
        if (!(await G.ask('Seraphine: Champion {PLAYER}! Care for a rematch? I\'ve been training too.'.replace('{PLAYER}', G.S.name)))) { await say('Seraphine: Whenever you\'re ready.'); return; }
        const res = await W().doBattle({ trainer: { id: 'champ_re', name: 'Champion Seraphine', look: L.seraphine, party: [['hauntwisp', 64], ['glaciwolf', 64], ['cragtitan', 65], ['oracervus', 65], ['pyrewraith', 65], ['dracoryn', 68]], base: 150, boss: true, smart: true, ivs: 31, items: ['fullrestore', 'fullrestore', 'maxpotion'], lose: 'Magnificent, as always!' }, bg: 'shrine' });
        if (res === 'win') await say('Seraphine: You never cease to amaze me. Come back anytime!');
        return;
      }
      await say('Seraphine: Welcome to the summit, {PLAYER}. I am Seraphine, Champion of Verdania.', 'Seraphine: I watched you face the Wardens. I watched you drive the Syndicate from Stormcrest. You protect creatures and people alike.', 'Seraphine: But kindness alone does not make a Champion. Show me your strength, and the bond you share with your team!');
      const res = await W().doBattle({ trainer: { id: 'champion', name: 'Champion Seraphine', look: L.seraphine, party: [['hauntwisp', 52], ['glaciwolf', 52], ['cragtitan', 53], ['oracervus', 53], ['pyrewraith', 53], ['dracoryn', 56]], base: 150, boss: true, smart: true, ivs: 20, items: ['fullrestore', 'hyperpotion'], lose: 'Wonderful. Truly wonderful.' }, bg: 'shrine' });
      if (res !== 'win') return;
      await say('Seraphine: ...I have not lost a battle in seven years. And yet I feel nothing but joy.', 'Seraphine: {PLAYER}, you are the new Champion of Verdania!');
      G.setFlag('champion');
      await G.story.hallOfFame();
      await say('Seraphine: The Elder outside has opened the Shrine of Dawn for you. The guardian has been stirring...', 'Seraphine: Perhaps it has been waiting for someone like you.');
    },
    async hallOfFame() {
      await G.fadeOut(20, '255,255,255');
      await G.credits();
      W().load('champion', 5, 4, 'up');
      await G.fadeIn(20);
      await G.saveFlow();
    },
    async aurelis() {
      const p = W().player;
      G.audio.stop();
      await say('A radiant creature rests upon the altar, its wings shimmering with every color of dawn.');
      G.audio.cry('aurelis', 0.8);
      await say('Aurelis: ...Kyaaaaah!!');
      const mon = G.makeMon('aurelis', 50, { met: 'Shrine of Dawn' });
      const r = await W().doBattle({ wild: mon, bg: 'shrine', legend: true });
      if (r === 'caught') { G.setFlag('aurelis_done'); W().load('shrine', p.x, p.y, p.dir); await say('The shrine feels warm and peaceful.'); }
      else if (r === 'win') { W().removeNpc(W().npc('aurelis')); await say('Aurelis vanished in a burst of light...', 'Perhaps it will return if you come back later.'); }
      else if (r === 'run') { await say('Aurelis is still watching you from the altar.'); }
    },
  };

  // ---------------- warden data ----------------
  const WARDENS = {
    petra: {
      flag: 'badge1', badge: 'stone', badgeName: 'Stone Sigil', look: L.petra, disc: 'disc01',
      trainer: { name: 'Warden Petra', party: [['pebblin', 11], ['bouldrok', 13]], items: ['potion', 'potion'], lose: 'You chipped right through my defenses!' },
      intro: ['Petra: So, a new challenger. I\'m Petra, Warden of Brookvale Hall.', 'Petra: My creatures are as solid as the mountains. Let\'s see if you can crack them!'],
      win: ['Petra: Impressive. You and your team move like a single mind.'],
      badgeText: ['Petra: The Stone Sigil proves your strength. Wear it proudly.','Petra: Oh, and I hear Syndicate grunts are blocking the north road. I\'ll make sure they leave.'],
      discText: ['Petra: That disc teaches Rock Wall. It deals damage and slows the foe down. Discs never break, so use it as often as you like!'],
      after: ['Petra: The road north is clear now. Whisper Cave lies beyond Route 2. Keep your wits about you.'],
    },
    ignatius: {
      flag: 'badge2', badge: 'ember', badgeName: 'Ember Sigil', look: L.ignatius, disc: 'disc02',
      trainer: { name: 'Warden Ignatius', party: [['magmite', 18], ['blazefang', 19], ['volcanor', 21]], items: ['superpotion', 'superpotion'], lose: 'Ha! You\'ve got a fire in you that burns hotter than mine!' },
      intro: ['Ignatius: HAH! Another challenger brave enough to step into my furnace!', 'Ignatius: I am Ignatius, Warden of Emberfall! My passion burns brighter than the sun! Show me YOURS!'],
      win: ['Ignatius: Incredible! I haven\'t felt heat like that in years!'],
      badgeText: ['Ignatius: The Ember Sigil! With it, the rangers will let you take the coast road to Stormcrest.'],
      discText: ['Ignatius: And take Flame Torrent! A fiery classic for any team!'],
      after: ['Ignatius: Stormcrest is east along the coast. Word is, the Syndicate has taken over a tower there.'],
    },
    volta: {
      flag: 'badge3', badge: 'storm', badgeName: 'Storm Sigil', look: L.volta, disc: 'disc03',
      trainer: { name: 'Warden Volta', party: [['zapkit', 28], ['galeclaw', 29], ['lumimoth', 29], ['voltlynx', 32]], items: ['hyperpotion', 'hyperpotion'], lose: 'You totally overloaded my circuits!' },
      intro: ['Volta: You\'re the one who kicked the Syndicate out of my city! Thank you!', 'Volta: But this is still a Warden battle, and I don\'t hold back. Let\'s light this place up!'],
      win: ['Volta: Wow! Electrifying! You\'re ready for the summit.'],
      badgeText: ['Volta: The Storm Sigil! That makes three. The guards will let you through to the Route 6 marshlands now.'],
      discText: ['Volta: Here\'s Volt Lance too. Fast, strong, and it might paralyze!'],
      after: ['Volta: Route 6 runs north through the marsh to Mistmere. Warden Coralie is waiting there.'],
    },
  };

  // =====================================================================
  // EXPANSION SCRIPTS
  // =====================================================================
  Object.assign(WARDENS, {
    coralie: {
      flag: 'badge4', badge: 'tide', badgeName: 'Tide Sigil', look: L.coralie, disc: 'disc13',
      trainer: { name: 'Warden Coralie', party: [['reefhorn', 36], ['clawdron', 37], ['voltray', 37], ['bogroar', 39]], items: ['hyperpotion', 'hyperpotion'], lose: 'You rode the current perfectly!' },
      intro: ['Coralie: Welcome to Mistmere Hall! I\'m Coralie, and the lake is my training ground.', 'Coralie: Water flows around every obstacle. Let\'s see if you can hold back the tide!'],
      win: ['Coralie: Wow... you washed right over me. Beautiful battling!'],
      badgeText: ['Coralie: The Tide Sigil is yours. The forest rangers will guide you into Whisperwood now.'],
      discText: ['Coralie: That disc holds Hydro Cannon, the strongest Water move I know. Use it well!'],
      after: ['Coralie: Whisperwood is east of town. Frostvale lies on the far side. Bundle up!'],
    },
    halden: {
      flag: 'badge5', badge: 'frost', badgeName: 'Frost Sigil', look: L.halden, disc: 'disc14',
      trainer: { name: 'Warden Halden', party: [['shardling', 40], ['blizzowl', 42], ['glaciwolf', 42], ['glacierra', 44]], items: ['hyperpotion', 'fullrestore'], lose: 'Hmph. The ice... has cracked.' },
      intro: ['Halden: ...You made it through Whisperwood. Few do.', 'Halden: I am Halden. Ice teaches patience, and patience wins battles. Show me yours.'],
      win: ['Halden: Your fire burns hotter than my cold. I concede.'],
      badgeText: ['Halden: The Frost Sigil. That is five. The Summit Path is open to you.'],
      discText: ['Halden: Take Whiteout as well. A storm in a disc.'],
      after: ['Halden: The Champion waits at the summit. Climb with care. The path is long and cold.'],
    },
  });

  Object.assign(G.story, {
    async townMapGift() {
      if (G.hasItem('townmap')) { await say('Mrs. Hale: Use the Verdania Map from your bag or the menu to see where you are!'); return; }
      if (!G.hasFlag('dex')) { await say('Mrs. Hale: Oh, hello dear! Off to see Professor Wren? Come back once you have a partner.'); return; }
      await say('Mrs. Hale: So you\'re setting off on a journey! Every traveler needs a good map.', 'Mrs. Hale: I drew this one myself. It covers all of Verdania, from Fernhollow to the summit.');
      await give('townmap');
      await say('Mrs. Hale: You can open it from the menu too. Safe travels!');
    },
    async ottLore() {
      await say('Grandpa Ott: Sit, sit. Let me tell you an old Verdania legend.',
        'Grandpa Ott: Long ago, three guardians watched over this land. Aurelis, who brings the dawn. Glaciel, who keeps the northern ice.',
        'Grandpa Ott: And Umbrath, the shadow of the dawn, who was sealed beneath the eastern marsh when it tried to swallow the sun.',
        'Grandpa Ott: They say only a true Champion can face all three. Hmm, hmm. Just a story, of course...');
    },
    async juno(n) {
      const f = 'juno' + n;
      const lines = {
        1: ['Juno: Oh! A new trainer! I\'m Juno, editor, reporter, and delivery girl of the Brookvale Bulletin.', 'Juno: I\'m going to follow your journey and write all about it. Here, for my first interview subject!'],
        2: ['Juno: We meet again! I heard you beat Warden Petra. That\'s front-page news!', 'Juno: The Syndicate is digging in Whisper Cave. Something about "Aether Shards". Be careful, okay?'],
        3: ['Juno: You did it! You drove the Syndicate out of Stormcrest! My readers will go wild!', 'Juno: Rumor says the Syndicate wanted the guardian Aurelis... and maybe more than one guardian.'],
        4: ['Juno: The Tide Sigil! You\'re halfway to legend status.', 'Juno: The old tablets in the Sunken Ruins mention a sealed shadow guardian. Spooky stuff. Want to investigate after you become Champion?'],
      }[n];
      const gift = { 1: ['potion', 3], 2: ['superpotion', 2], 3: ['ultraorb', 2], 4: ['maxrevive', 1] }[n];
      await say(...lines);
      if (!G.hasFlag(f)) { await give(gift[0], gift[1]); G.setFlag(f); }
      else await say('Juno: Keep making headlines!');
    },
    async tobin() {
      if (G.hasItem('shareband')) { await say('Tobin: Switch the Share Band on or off from your bag. It\'s great for training weaker creatures!'); return; }
      await say('Tobin: Hi! I\'m Tobin, Professor Wren\'s aide. The professor asked me to find you.', 'Tobin: He heard you earned the Stone Sigil! He wanted you to have this. An engineer in Stormcrest designed it.');
      await give('shareband');
      G.S.shareOn = true;
      await say('Tobin: It\'s switched on already. Team members that don\'t battle still earn half the experience. You can turn it off from your bag.');
    },
    async nameRater() {
      await say('Name Rater: Ahh, welcome! I am the Name Rater, judge of names most noble!');
      const i = await G.openParty({ mode: 'pick', msg: 'Whose name shall I judge?' });
      if (i < 0) { await say('Name Rater: Come back any time!'); return; }
      const m = G.S.party[i];
      if (m.ot && m.ot !== G.S.name) { await say('Name Rater: ' + G.monName(m) + ' is a fine name, chosen by its original trainer. I dare not change it!'); return; }
      if (!(await G.ask('Name Rater: ' + G.monName(m) + '... a decent name. Shall I give it a new one?'))) { await say('Name Rater: As you wish.'); return; }
      const nn = await G.nameEntry('New nickname?', G.SPECIES[m.sp].name, 10, G.creatureSprite(m.sp, m.shiny));
      m.nick = nn === G.SPECIES[m.sp].name ? null : nn;
      await say('Name Rater: Splendid! From now on it shall be known as ' + G.monName(m) + '!');
    },
    async springs() {
      await say('Grandma Sel: Come in, come in! A soak in the hot spring will warm you right up.');
      await G.fadeOut(16); sfx('heal'); G.healParty(); await G.wait(60); await G.fadeIn(16);
      await say('Grandma Sel: There now. You and your creatures look refreshed!');
    },
    async beachHut() {
      if (!G.hasFlag('beach_gift')) {
        await say('Old Sailor: Ahoy, landlubber. In my day I sailed past the eastern marsh, where the old ruins sank into the mud.', 'Old Sailor: Strange lights glow there at night. Take these. They\'re best for catching creatures from the water.');
        await give('netorb', 3); G.setFlag('beach_gift'); return;
      }
      await say('Old Sailor: The Sunken Ruins are past Stormcrest, in the Route 6 marsh. Mind the shadows.');
    },
    async wingWhistle() {
      if (G.hasItem('wingwhistle')) { await say('Sky Keeper: Blow the Wing Whistle outdoors and my sky creatures will carry you to any town you\'ve visited.'); return; }
      if (!G.hasFlag('badge3')) { await say('Sky Keeper: My sky creatures only carry trainers who have proven themselves.', 'Sky Keeper: Earn the Storm Sigil from Volta and I\'ll trust you with my whistle.'); return; }
      await say('Sky Keeper: The Storm Sigil! You\'re a real trainer. Here, take my spare whistle.');
      await give('wingwhistle');
      await say('Sky Keeper: Use it from your bag while you\'re outdoors. Pick a town you\'ve been to, and off you go!');
    },
    async fortune() {
      await say('Madame Iris: Welcome, child. I can sense the hidden potential in any creature.');
      const i = await G.openParty({ mode: 'pick', msg: 'Whose fortune shall I read?' });
      if (i < 0) { await say('Madame Iris: The future will wait for you.'); return; }
      const m = G.S.party[i]; const iv = m.ivs; const tot = Object.values(iv).reduce((a, b) => a + b, 0);
      const best = Object.keys(iv).reduce((a, b) => (iv[b] > iv[a] ? b : a));
      const rank = tot >= 150 ? 'Its potential is truly extraordinary!' : tot >= 120 ? 'It has excellent potential.' : tot >= 90 ? 'It has above-average potential.' : 'Its potential is modest, but love can overcome anything.';
      await say('Madame Iris: I see... ' + G.monName(m) + '. ' + rank, 'Madame Iris: Its greatest strength lies in its ' + G.STAT_NAMES[best] + (iv[best] >= 30 ? '. It simply could not be better!' : '.'));
    },
    async daycare() {
      const d = G.S.daycare;
      if (d) {
        const m = d.mon, gained = m.lv - d.lv;
        await say('Daycare Lady: Ah, you\'re back for ' + G.monName(m) + '!' + (gained > 0 ? ' It grew by ' + gained + ' level' + (gained > 1 ? 's' : '') + '!' : ' It\'s been playing happily.'));
        const cost = 100 + gained * 100;
        if (!(await G.ask('Daycare Lady: That will be $' + cost + '. Would you like it back?'))) return;
        if (G.S.party.length >= 6) { await say('Daycare Lady: Your team is full! Make some room first.'); return; }
        if (G.S.money < cost) { await say('Daycare Lady: Oh dear, you don\'t have enough money.'); return; }
        G.S.money -= cost; G.S.party.push(m); G.S.daycare = null; G.takeItem('daycareslip');
        sfx('item'); await say(G.monName(m) + ' rejoined your team!');
        const to = G.lvEvo(m); if (to) await G.evolveScene(m, to, true);
        return;
      }
      await say('Daycare Lady: Welcome to the Marsh Daycare! We can look after one of your creatures.', 'Daycare Lady: It earns experience as you walk around. Shall I take one?');
      if (!(await G.ask('Leave a creature at the Daycare?'))) return;
      if (G.S.party.length < 2) { await say('Daycare Lady: You can\'t leave your only creature!'); return; }
      const i = await G.openParty({ mode: 'pick', msg: 'Leave which creature?' });
      if (i < 0) return;
      const m = G.S.party[i];
      if (G.S.party.filter((x) => x !== m && x.hp > 0).length === 0) { await say('Daycare Lady: You need at least one other creature that can battle!'); return; }
      G.S.party.splice(i, 1); G.healMon(m); G.S.daycare = { mon: m, lv: m.lv };
      G.giveItem('daycareslip');
      await say('Daycare Lady: We\'ll take good care of ' + G.monName(m) + '. Come back any time!');
    },
    async trade(where) {
      const T = {
        mist: { want: 'nibbit', give: 'frostpup', nick: 'Snowball', lv: 30, who: 'Trader Bo' },
        frost: { want: 'sporelet', give: 'sparkfin', nick: 'Zippy', lv: 36, who: 'Trader Pia' },
      }[where];
      G.S.trades = G.S.trades || {};
      if (G.S.trades[where]) { await say(T.who + ': How\'s ' + T.nick + ' doing? Treat it well!'); return; }
      const wn = G.SPECIES[T.want].name, gn = G.SPECIES[T.give].name;
      if (!(await G.ask(T.who + ': I\'m looking for a ' + wn + '. Would you trade one for my ' + gn + '?'))) { await say(T.who + ': Maybe next time.'); return; }
      const i = await G.openParty({ mode: 'pick', msg: 'Trade which ' + wn + '?' });
      if (i < 0) return;
      const m = G.S.party[i];
      if (m.sp !== T.want) { await say(T.who + ': Hmm, that\'s not a ' + wn + '. Come back when you have one!'); return; }
      if (G.S.party.length === 1) { await say(T.who + ': You can\'t trade away your only creature!'); return; }
      const mon = G.makeMon(T.give, T.lv, { ot: T.who.split(' ')[1], otId: 31337, met: 'Trade' });
      mon.nick = T.nick; G.S.party[i] = mon; G.S.trades[where] = 1; G.dexCatch(T.give);
      sfx('caught'); await say(G.S.name + ' traded ' + G.monName(m) + ' for ' + T.nick + '!');
      await say(T.who + ': Thanks so much! ' + T.nick + ' is all yours.');
    },
    async farmer() {
      const today = new Date().toDateString();
      if (G.S.farmDay === today) { await say('Farmer Ilse: That\'s all for today! The fruit needs time to grow back.'); return; }
      await say('Farmer Ilse: Fresh from the misty orchard! Take some, take some!');
      await give('berry', 3); G.S.farmDay = today;
      if (Math.random() < 0.2) { await say('Farmer Ilse: Oh, and I found this in the orchard. Here!'); await give(G.pick(['rarecandy', 'ultraorb', 'elixir'])); }
    },
    async sageLore() {
      await say('Sage Morrow: The Sunken Ruins in the marsh hold a sealed chamber.', 'Sage Morrow: The tablets say an Aether Shard and the strength of a Champion are needed to break the seal.', G.hasItem('shard') ? 'Sage Morrow: You carry a shard already? Then fate has chosen you.' : 'Sage Morrow: Few shards remain in this world...');
    },
    async tutor() {
      const LIST = [['skyslash', 2500], ['drakeclaw', 4000], ['bodyrush', 2000], ['heatwave', 3000], ['psycrush', 3000], ['quake', 5000]];
      await say('Tutor Varn: I teach techniques for a fee. Any creature that shares the move\'s type can learn it, and anyone can learn Normal moves.');
      const opts = LIST.map(([id, p]) => G.MOVES[id].name + '  $' + p).concat(['CANCEL']);
      const k = await G.askList('Which move shall I teach?', opts, { cancel: LIST.length, x: 120, y: 40 });
      if (k >= LIST.length) return;
      const [id, price] = LIST[k];
      if (G.S.money < price) { await say('Tutor Varn: You can\'t afford that one.'); return; }
      const i = await G.openParty({ mode: 'pick', msg: 'Teach ' + G.MOVES[id].name + ' to whom?' });
      if (i < 0) return;
      const m = G.S.party[i], mv = G.MOVES[id];
      if (!(G.SPECIES[m.sp].types.includes(mv.type) || mv.type === 'Normal')) { await say('Tutor Varn: ' + G.monName(m) + ' can\'t learn ' + mv.name + '.'); return; }
      if (m.moves.some((x) => x.id === id)) { await say('Tutor Varn: It already knows that move!'); return; }
      if (await G.learnMove(m, id)) { G.S.money -= price; await say('Tutor Varn: Excellent. Practice it daily!'); }
    },
    async rivalMist() {
      const p = W().player; let r = W().npc('rivalm');
      if (!r) return;
      while (Math.abs(r.x - p.x) + Math.abs(r.y - p.y) > 1) { const d = r.x < p.x ? 'right' : r.x > p.x ? 'left' : r.y < p.y ? 'down' : 'up'; if (!(await W().npcStep(r, d))) break; }
      W().facePlayer(r); p.dir = G.OPP[r.dir];
      G.audio.play('trainer');
      await say('{RIVAL}: Took you long enough! I\'ve been waiting by this lake for ages.', '{RIVAL}: I just beat Coralie. Well... almost. Okay, I lost. But I\'m about to beat YOU!');
      const ln = rivalLine();
      const res = await W().doBattle({ trainer: { id: 'rivalm', name: '{RIVAL}', look: L.rival, party: [['skyraptor', 36], ['voltlynx', 35], ['psyfawn', 34], [ln[2], 37]], base: 70, smart: true, items: ['hyperpotion'], lose: 'Not again! How do you keep doing that?!' }, bg: 'marsh' });
      if (res !== 'win') return;
      G.setFlag('rivalm');
      await say('{RIVAL}: Fine! You win this round. But I\'m heading to the summit first. See you up there!');
      await W().npcWalk(r, 'dddddddd', true); W().removeNpc(r);
      G.audio.play('haven');
    },
    async ruinsSeal() {
      await say('A stone tablet seals the passage. Ancient words are carved into it:', '"Here sleeps the shadow of dawn. Let only the Champion, bearing the shard of light, pass."');
      if (!G.hasFlag('champion') || !G.hasItem('shard')) { await say('The tablet does not budge.'); return; }
      await say('The Aether Shard begins to glow...');
      sfx('shiny'); G.flash(6); G.setFlag('ruins_open');
      const s = W().npc('seal'); if (s) W().removeNpc(s);
      await say('The tablet crumbled away! A passage leads down into the dark.');
    },
    async vexRuins() {
      const v = W().npc('vex2'); if (!v) return; const p = W().player;
      while (Math.abs(v.x - p.x) + Math.abs(v.y - p.y) > 1) { const d = v.y < p.y - 1 ? 'down' : v.x < p.x ? 'right' : v.x > p.x ? 'left' : 'down'; if (!(await W().npcStep(v, d))) break; }
      W().facePlayer(v); p.dir = G.OPP[v.dir];
      G.audio.play('hq');
      await say('Vex: So the new Champion opened the seal for me. How thoughtful.', 'Vex: Aurelis rejected me. But its shadow, Umbrath, craves a master who does not fear the dark.', 'Vex: Step aside, Champion. Or be swallowed by the night!');
      const res = await W().doBattle({ trainer: { id: 'vex2', name: 'Boss Vex', look: L.vex, party: [['cobrax', 55], ['pyrewraith', 56], ['hauntwisp', 56], ['volcanor', 57], ['gloomwing', 57], ['quakefang', 58]], base: 120, boss: true, smart: true, ivs: 25, items: ['fullrestore', 'fullrestore'], lose: 'The darkness... abandons me too?' }, bg: 'ruins' });
      if (res !== 'win') return;
      G.setFlag('vex2');
      await say('Vex: ...I see now. Power that must be taken can never truly be held.', 'Vex: The shadow is yours to face. I am done with guardians. Farewell, Champion.');
      await G.fadeOut(14); W().removeNpc(v);
      W().addNpc(G.MAPS.ruins2.npcs.find((n) => n.id === 'umbrath'), 10, 4, 'down');
      await G.fadeIn(14);
    },
    async umbrath() {
      const p = W().player;
      G.audio.stop();
      await say('A shadow uncoils from the altar. Two violet eyes open in the darkness.');
      G.audio.cry('umbrath', 0.7);
      const r = await W().doBattle({ wild: G.makeMon('umbrath', 60, { met: 'Ruins Sanctum' }), bg: 'ruins', legend: true, legendText: 'Umbrath rises from the shadows!' });
      if (r === 'caught') { G.setFlag('umbrath_done'); const u = W().npc('umbrath'); if (u) W().removeNpc(u); await say('The sanctum grows quiet. The shadow has found a friend.'); }
      else if (r === 'win') { const u = W().npc('umbrath'); if (u) W().removeNpc(u); await say('Umbrath melted back into the shadows...', 'It may return if you come back later.'); }
    },
    async glaciel() {
      G.audio.stop();
      await say('Snow swirls into the shape of a great crystal stag. The air freezes around you.');
      G.audio.cry('glaciel', 1.2);
      const r = await W().doBattle({ wild: G.makeMon('glaciel', 55, { met: 'Frost Hollow' }), bg: 'ice', legend: true, legendText: 'Glaciel descends in a storm of ice!' });
      if (r === 'caught') { G.setFlag('glaciel_done'); const g = W().npc('glaciel'); if (g) W().removeNpc(g); await say('The icy wind fades. Frost Hollow is calm.'); }
      else if (r === 'win') { const g = W().npc('glaciel'); if (g) W().removeNpc(g); await say('Glaciel scattered into snowflakes...', 'It may gather again if you return later.'); }
    },
  });
})();
