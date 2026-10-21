'use strict';
// Title screen, new-game intro, credits, and boot.
(function () {
  const sfx = (n) => G.audio.sfx(n);

  class Title {
    constructor() { this.t = 0; this.i = 0; this.save = G.loadGame(); this.showcase = ['sprigling', 'embercub', 'drizzlet', 'aurelis']; }
    opts() { return this.save ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME']; }
    update() {
      this.t++;
      const n = this.opts().length;
      if (G.input.rep('up')) { this.i = (this.i + n - 1) % n; sfx('move'); }
      if (G.input.rep('down')) { this.i = (this.i + 1) % n; sfx('move'); }
      if (G.input.pressed('a') && !this.busy) { sfx('select'); this.busy = true; this.choose(this.opts()[this.i]).finally(() => { this.busy = false; }); }
    }
    async choose(o) {
      if (o === 'CONTINUE') {
        const s = this.save; migrate(s); G.S = s;
        await G.fadeOut(20); G.pop(this); startWorld(); await G.fadeIn(20);
        return;
      }
      if (this.save && !(await G.ask('Start a new game? Your old save will be replaced when you next save.'))) return;
      await G.fadeOut(20); G.pop(this); G.fade = 0;
      await G.intro();
    }
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, '#1c2c5c'); g.addColorStop(0.6, '#4c6cb8'); g.addColorStop(1, '#f0b878');
      c.fillStyle = g; c.fillRect(0, 0, 320, 240);
      // stars
      for (let i = 0; i < 40; i++) { const x = (i * 73) % 320, y = (i * 37) % 120; c.fillStyle = (i + Math.floor(this.t / 20)) % 5 ? 'rgba(255,255,255,0.5)' : '#fff'; c.fillRect(x, y, 1, 1); }
      // mountains
      c.fillStyle = '#2c3c6c'; c.beginPath(); c.moveTo(0, 200); c.lineTo(50, 150); c.lineTo(90, 175); c.lineTo(160, 110); c.lineTo(230, 170); c.lineTo(270, 145); c.lineTo(320, 180); c.lineTo(320, 240); c.lineTo(0, 240); c.fill();
      c.fillStyle = '#e8ecf8'; c.beginPath(); c.moveTo(146, 124); c.lineTo(160, 110); c.lineTo(176, 126); c.lineTo(166, 122); c.lineTo(158, 128); c.fill();
      c.fillStyle = '#1c2848'; c.fillRect(0, 214, 320, 26);
      // guardian
      const a = G.creatureSprite('aurelis');
      c.globalAlpha = 0.9; c.drawImage(a, 128, 56 + Math.sin(this.t / 30) * 3); c.globalAlpha = 1;
      // logo
      const lx = 160, ly = 16;
      G.text('WILDBOUND', lx + 2, ly + 2, '#101830', { size: 24, align: 'center', shadow: false });
      G.text('WILDBOUND', lx, ly, '#f8d050', { size: 24, align: 'center', shadowCol: '#c06020' });
      G.text('A Verdania Adventure', lx, ly + 30, '#e0e8ff', { size: 8, align: 'center', shadowCol: 'rgba(0,0,0,0.5)' });
      // starters parade
      ['sprigling', 'embercub', 'drizzlet'].forEach((id, k) => { const s = G.creatureSprite(id); c.drawImage(s, 40 + k * 96, 150 + Math.sin(this.t / 16 + k) * 2, 48, 48); });
      // menu
      const opts = this.opts();
      G.box(110, 124, 100, 14 + opts.length * 16);
      opts.forEach((o, k) => G.text(o, 130, 132 + k * 16));
      G.cursor(120, 132 + this.i * 16);
      if (this.save) {
        const s = this.save; const t = Math.floor(s.time || 0);
        G.text(s.name + '  Sigils:' + (s.badges || []).length + '  ' + Math.floor(t / 3600) + 'h' + String(Math.floor(t / 60) % 60).padStart(2, '0') + 'm', 160, 222, '#c8d4f0', { align: 'center', size: 7, shadow: false });
      } else G.text('Press Z or Enter', 160, 222, (this.t >> 5) % 2 ? '#c8d4f0' : '#8090b8', { align: 'center', size: 7, shadow: false });
    }
  }

  function migrate(s) {
    s.options = Object.assign({ textSpeed: 1, anims: true, music: true, sound: true }, s.options || {});
    if (!s.look) s.look = Object.assign({}, G.PLAYER_LOOK);
    if (!s.boxes) s.boxes = Array.from({ length: 8 }, () => []);
    if (!s.dex) s.dex = { seen: {}, caught: {} };
    if (!s.badges) s.badges = [];
    if (!s.heal) s.heal = { map: 'home', x: 4, y: 5 };
    if (!s.visited) s.visited = { fernhollow: 1 };
    if (!s.trades) s.trades = {};
    if (s.daycare === undefined) s.daycare = null;
    // the world got bigger: if the saved spot is no longer walkable, move to the last resting place
    const ok = (id, x, y) => { const m = G.MAPS[id]; if (!m) return false; G.buildMap(m); const t = m.grid[y] && m.grid[y][x]; return t && G.TILEDEF[t] && !G.TILEDEF[t].solid && !m.bmask[y][x]; };
    if (!ok(s.heal.map, s.heal.x, s.heal.y)) s.heal = { map: 'home', x: 4, y: 5 };
    if (!ok(s.map, s.x, s.y)) { s.map = s.heal.map; s.x = s.heal.x; s.y = s.heal.y; }
  }
  function startWorld() {
    G.audio.applyOptions();
    G.world = new G.World();
    G.scenes.length = 0;
    G.push(G.world);
    G.world.load(G.S.map, G.S.x, G.S.y, G.S.dir);
  }
  G.startWorld = startWorld;

  // ---------------- intro ----------------
  class IntroScene {
    constructor() { this.t = 0; this.show = 'prof'; this.alpha = 0; }
    update() { this.t++; }
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, '#203050'); g.addColorStop(1, '#486898');
      c.fillStyle = g; c.fillRect(0, 0, 320, 240);
      c.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 8; i++) c.fillRect(0, i * 30 + ((this.t / 2) % 30), 320, 12);
      c.globalAlpha = this.alpha;
      if (this.show === 'prof') c.drawImage(G.portrait(G.LOOKS.prof, 5), 120, 50);
      else if (this.show === 'mon') { c.drawImage(G.creatureSprite('puffkin'), 128, 70); c.drawImage(G.portrait(G.LOOKS.prof, 5), 30, 50); }
      else if (this.show === 'player') c.drawImage(G.portrait(G.PLAYER_LOOK, 5), 120, 50);
      else if (this.show === 'rival') c.drawImage(G.portrait(G.LOOKS.rival, 5), 120, 50);
      c.globalAlpha = 1;
    }
  }
  G.intro = async () => {
    G.S = G.newState('Rowan', 'Kai'); G.S.look = Object.assign({}, G.PLAYER_LOOK);
    const sc = new IntroScene(); G.push(sc);
    G.audio.play('town');
    await G.tween(20, (t) => (sc.alpha = t));
    const say = (...a) => G.sayAll(a.map((s) => G.fmt(s)));
    await say('Ah, there you are! I\'m Professor Wren, and I\'ve been looking forward to meeting you.');
    sc.show = 'mon'; G.audio.cry('puffkin');
    await say('All across Verdania live wild creatures we call Wildlings. They nest in the meadows, swim the rivers, and nap in the old caves.', 'Trainers travel with them as partners, and the two grow stronger together.', 'My life\'s work is learning how people and Wildlings can thrive side by side.');
    sc.show = 'player'; sc.alpha = 0; await G.tween(16, (t) => (sc.alpha = t));
    await say('But enough about me. What should I call you?');
    let name = await G.nameEntry('What is your name?', 'Rowan', 10, G.portrait(G.PLAYER_LOOK, 4));
    G.S.name = name;
    await say(name + '... a fine name for a trainer!');
    sc.show = 'rival'; sc.alpha = 0; await G.tween(16, (t) => (sc.alpha = t));
    await say('Your neighbor stopped by the lab yesterday. You know, the one who always races you to everything.', 'Remind me, what\'s his name?');
    const rv = await G.nameEntry('Your neighbor\'s name?', 'Kai', 10, G.portrait(G.LOOKS.rival, 4));
    G.S.rival = rv;
    await say('Of course, ' + rv + '! He\'ll be thrilled to hear you\'re starting out today too.');
    sc.show = 'player'; sc.alpha = 0; await G.tween(16, (t) => (sc.alpha = t));
    await say('Come find me at my lab in Fernhollow when you\'re ready, ' + name + '.', 'Verdania is waiting for you!');
    await G.fadeOut(24);
    G.pop(sc);
    G.S.map = 'home'; G.S.x = 7; G.S.y = 2; G.S.dir = 'down';
    startWorld();
    await G.fadeIn(24);
  };

  // ---------------- credits ----------------
  class Credits {
    constructor() { this.t = 0; this.lines = [
      'WILDBOUND', '', 'Hall of Fame', '', '', ...G.S.party.map((m) => G.monName(m) + '  Lv' + m.lv + (m.shiny ? ' *' : '')), '', '', 'Champion: ' + G.S.name, '', '',
      'Thank you for playing!', '', 'Design, code, art and music', 'made procedurally for this game', '', 'Creatures of Verdania', '', ...G.DEX_ORDER.filter((id) => !G.LEGENDS.includes(id)).map((id) => G.SPECIES[id].name), '', '', 'Your journey continues...', '', 'THE END'];
    }
    update() { this.t++; if (this.t > 60 && (G.input.pressed('a') || G.input.pressed('start')) && this.t > 400) G.pop(this); if (this.t > 2400) G.pop(this); }
    draw(c) {
      c.fillStyle = '#0c1020'; c.fillRect(0, 0, 320, 240);
      for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.2 + (i % 5) / 8) + ')'; c.fillRect((i * 97) % 320, (i * 53 + this.t * 0.2 * (1 + i % 3)) % 240, 1, 1); }
      const y0 = 250 - this.t * 0.45;
      this.lines.forEach((l, k) => { const y = y0 + k * 18; if (y > -20 && y < 250) G.text(l, 160, y, k === 0 ? '#f8d050' : '#e0e8ff', { align: 'center', size: k === 0 ? 16 : 8, shadow: false }); });
      const party = G.S.party; const k = Math.floor(this.t / 120) % Math.max(1, party.length);
      if (party[k] && this.t < 900) { c.globalAlpha = 0.85; c.drawImage(G.creatureSprite(party[k].sp, party[k].shiny), 248, 168); c.globalAlpha = 1; }
    }
  }
  G.credits = async () => {
    G.audio.play('credits');
    const sc = new Credits(); const p = G.push(sc); G.fade = 0;
    await p;
    await G.fadeOut(20);
  };

  // ---------------- boot ----------------
  async function boot() {
    try { await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { }
    G.start();
    G.push(new Title());
    G.audio.play('title');
  }
  G.Title = Title;
  G.debug.boot = boot;
  boot();
})();
