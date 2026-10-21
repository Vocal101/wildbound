'use strict';
// Text rendering, boxes, dialog, choice lists, number picker, name entry.
(function () {
  const FONT = '"Press Start 2P", monospace';
  G.FONT = FONT;
  const ctx = () => G.ctx;

  G.setFont = (size = 8) => { G.ctx.font = `${size}px ${FONT}`; G.ctx.textBaseline = 'top'; };
  G.textW = (s, size = 8) => { G.setFont(size); return G.ctx.measureText(s).width; };
  G.text = (s, x, y, col = '#383838', o = {}) => {
    const c = ctx(); G.setFont(o.size || 8);
    c.textAlign = o.align || 'left';
    s = String(s);
    if (o.shadow !== false) { c.fillStyle = o.shadowCol || 'rgba(160,160,168,0.55)'; c.fillText(s, x + 1, y + 1); }
    c.fillStyle = col; c.fillText(s, x, y);
    c.textAlign = 'left';
  };

  // pixel-rounded rect
  G.rrect = (x, y, w, h, col) => {
    const c = ctx(); c.fillStyle = col;
    c.fillRect(x + 2, y, w - 4, h); c.fillRect(x, y + 2, w, h - 4); c.fillRect(x + 1, y + 1, w - 2, h - 2);
  };
  const STYLES = {
    white: ['#3a4a68', '#f8f8f8', '#c8d4e4'],
    battle: ['#28303c', '#f8f8f0', '#d8b860'],
    dark: ['#101820', '#2c3848', '#5c7088'],
    red: ['#682838', '#f8f0f0', '#e0a0a8'],
  };
  G.box = (x, y, w, h, style = 'white') => {
    const [o, f, l] = STYLES[style] || STYLES.white;
    G.rrect(x, y, w, h, o);
    G.rrect(x + 2, y + 2, w - 4, h - 4, l);
    G.rrect(x + 3, y + 3, w - 6, h - 6, f);
  };
  G.cursor = (x, y, col = '#383838') => {
    const c = ctx(); c.fillStyle = col;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 5, y + 4); c.lineTo(x, y + 8); c.closePath(); c.fill();
  };
  G.bar = (x, y, w, h, frac, col, back = '#506058') => {
    const c = ctx(); c.fillStyle = '#283028'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
    c.fillStyle = back; c.fillRect(x, y, w, h);
    c.fillStyle = col; c.fillRect(x, y, Math.round(w * G.clamp(frac, 0, 1)), h);
  };
  G.hpColor = (f) => (f > 0.5 ? '#48d068' : f > 0.2 ? '#f0c030' : '#f05038');

  // word wrap to pixel width
  G.wrap = (text, width, size = 8) => {
    G.setFont(size);
    const out = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(' '); let line = '';
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (G.ctx.measureText(t).width > width && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  };

  // ---------- Dialog ----------
  // opts: keep (resolve when done but stay visible), style, auto (frames before auto-advance), lines (per page)
  class Dialog {
    constructor(text, opts = {}) {
      this.overlay = true; this.opts = opts;
      this.x = 4; this.y = 178; this.w = 312; this.h = 58;
      const lines = G.wrap(G.fmt(text), this.w - 24);
      const per = opts.lines || 2;
      this.pages = [];
      // a line beginning with \f forces a new page
      let cur = [];
      for (const l of lines) {
        if (l.startsWith('\f')) { if (cur.length) this.pages.push(cur); cur = [l.slice(1)]; continue; }
        cur.push(l); if (cur.length === per) { this.pages.push(cur); cur = []; }
      }
      if (cur.length) this.pages.push(cur);
      if (!this.pages.length) this.pages.push(['']);
      this.page = 0; this.chars = 0; this.t = 0; this.done = false;
    }
    pageLen() { return this.pages[this.page].join('').length; }
    speed() { const s = G.S && G.S.options ? G.S.options.textSpeed : 1; return [0.6, 1.4, 3, 99][s] || 1.4; }
    update() {
      const I = G.input; this.t++;
      if (this.done) return;
      const len = this.pageLen();
      if (this.chars < len) {
        this.chars += this.speed();
        if (I.pressed('a') || I.pressed('b')) this.chars = len;
        return;
      }
      const last = this.page >= this.pages.length - 1;
      if (last && this.opts.keep) { this.done = true; G.resolve(this); return; }
      if (this.opts.auto) { this.autoT = (this.autoT || 0) + 1; if (this.autoT < this.opts.auto) return; this.autoT = 0; }
      else if (!(I.pressed('a') || I.pressed('b'))) return;
      if (!last) { this.page++; this.chars = 0; if (G.audio) G.audio.sfx('blip'); }
      else { this.done = true; if (!this.opts.auto && G.audio) G.audio.sfx('blip'); G.pop(this); }
    }
    draw() {
      G.box(this.x, this.y, this.w, this.h, this.opts.style || 'white');
      let n = Math.floor(this.chars);
      const lines = this.pages[this.page];
      const col = this.opts.style === 'dark' ? '#f0f0f0' : '#383838';
      for (let i = 0; i < lines.length; i++) {
        const s = lines[i].slice(0, Math.max(0, n)); n -= lines[i].length;
        G.text(s, this.x + 12, this.y + 14 + i * 18, col);
      }
      if (!this.done && this.chars >= this.pageLen() && !this.opts.keep && !this.opts.auto && (this.t >> 4) % 2 === 0) {
        const c = G.ctx; c.fillStyle = '#e05040';
        const ax = this.x + this.w - 18, ay = this.y + this.h - 14;
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + 8, ay); c.lineTo(ax + 4, ay + 5); c.closePath(); c.fill();
      }
    }
  }
  G.Dialog = Dialog;
  G.say = (text, opts) => G.push(new Dialog(text, opts));
  // several lines in sequence
  G.sayAll = async (arr, opts) => { for (const t of arr) await G.say(t, opts); };

  // ---------- Choice list ----------
  class Choice {
    constructor(options, cfg = {}) {
      this.overlay = true; this.opts = options; this.cfg = cfg; this.i = cfg.start || 0;
      const size = 8;
      const tw = Math.max(...options.map((o) => G.textW(typeof o === 'string' ? o : o.label, size)));
      this.w = cfg.w || Math.ceil(tw) + 30;
      this.h = options.length * 16 + 14;
      this.x = cfg.x != null ? cfg.x : G.W - this.w - 4;
      this.y = cfg.y != null ? cfg.y : 176 - this.h - 2;
    }
    update() {
      const I = G.input, n = this.opts.length;
      if (I.rep('up')) { this.i = (this.i + n - 1) % n; G.audio.sfx('move'); if (this.cfg.onMove) this.cfg.onMove(this.i); }
      if (I.rep('down')) { this.i = (this.i + 1) % n; G.audio.sfx('move'); if (this.cfg.onMove) this.cfg.onMove(this.i); }
      if (I.pressed('a')) {
        const o = this.opts[this.i];
        if (o && o.disabled) { G.audio.sfx('bump'); return; }
        G.audio.sfx('select'); G.pop(this, this.i);
      } else if ((I.pressed('b') || I.pressed('start')) && this.cfg.cancel != null) { G.audio.sfx('back'); G.pop(this, this.cfg.cancel); }
    }
    draw() {
      G.box(this.x, this.y, this.w, this.h);
      this.opts.forEach((o, k) => {
        const label = typeof o === 'string' ? o : o.label;
        G.text(label, this.x + 18, this.y + 9 + k * 16, o.disabled ? '#a0a0a0' : '#383838');
      });
      G.cursor(this.x + 8, this.y + 9 + this.i * 16);
      if (this.cfg.drawExtra) this.cfg.drawExtra(this.i);
    }
  }
  G.Choice = Choice;
  G.choose = (options, cfg) => G.push(new Choice(options, cfg));
  G.ask = async (text, cfg = {}) => {
    const d = new Dialog(text, { keep: true });
    await G.push(d);
    const r = await G.choose(['YES', 'NO'], Object.assign({ cancel: 1 }, cfg));
    G.pop(d);
    return r === 0;
  };
  // show text, keep it visible, then present a list
  G.askList = async (text, options, cfg = {}) => {
    const d = new Dialog(text, { keep: true });
    await G.push(d);
    const r = await G.choose(options, cfg);
    G.pop(d);
    return r;
  };

  // ---------- Number picker ----------
  class NumberPick {
    constructor(max, cfg = {}) { this.overlay = true; this.max = Math.max(1, max); this.n = 1; this.cfg = cfg; }
    update() {
      const I = G.input;
      if (I.rep('up')) { this.n = this.n >= this.max ? 1 : this.n + 1; G.audio.sfx('move'); }
      if (I.rep('down')) { this.n = this.n <= 1 ? this.max : this.n - 1; G.audio.sfx('move'); }
      if (I.rep('right')) { this.n = Math.min(this.max, this.n + 10); G.audio.sfx('move'); }
      if (I.rep('left')) { this.n = Math.max(1, this.n - 10); G.audio.sfx('move'); }
      if (I.pressed('a')) { G.audio.sfx('select'); G.pop(this, this.n); }
      else if (I.pressed('b')) { G.audio.sfx('back'); G.pop(this, 0); }
    }
    draw() {
      const w = this.cfg.price ? 130 : 64, x = G.W - w - 4, y = 140;
      G.box(x, y, w, 34);
      G.text('x' + String(this.n).padStart(2, '0'), x + 12, y + 13);
      if (this.cfg.price) G.text('$' + this.n * this.cfg.price, x + w - 12, y + 13, '#383838', { align: 'right' });
      const c = G.ctx; c.fillStyle = '#e05040';
      c.fillRect(x + 22, y + 5, 6, 2); c.fillRect(x + 22, y + 27, 6, 2);
    }
  }
  G.pickNumber = (max, cfg) => G.push(new NumberPick(max, cfg));

  // ---------- Name entry ----------
  class NameEntry {
    constructor(prompt, def, max, art) {
      this.prompt = prompt; this.def = def; this.max = max || 10; this.val = ''; this.t = 0; this.art = art;
    }
    enter() {
      G.textHandler = (e) => {
        if (e.key === 'Enter') { this.finish(); return true; }
        if (e.key === 'Backspace') { this.val = this.val.slice(0, -1); G.audio.sfx('back'); return true; }
        if (e.key === 'Escape') { this.val = ''; return true; }
        if (e.key.length === 1 && /[A-Za-z0-9 .\-']/.test(e.key) && this.val.length < this.max) {
          this.val += this.val.length === 0 ? e.key.toUpperCase() : e.key; G.audio.sfx('move'); return true;
        }
        return e.key.length === 1;
      };
    }
    finish() {
      G.textHandler = null; G.audio.sfx('select');
      const v = this.val.trim() || this.def;
      G.pop(this, v);
    }
    update() { this.t++; }
    draw(c) {
      c.fillStyle = '#e8eef8'; c.fillRect(0, 0, G.W, G.H);
      c.fillStyle = '#c8d4e8'; for (let y = 0; y < G.H; y += 16) for (let x = (y / 16) % 2 * 16; x < G.W; x += 32) c.fillRect(x, y, 16, 16);
      G.box(20, 20, 280, 40);
      G.text(this.prompt, 32, 36);
      if (this.art) c.drawImage(this.art, 128, 66);
      G.box(60, 140, 200, 40);
      const s = this.val + ((this.t >> 4) % 2 ? '_' : ' ');
      G.text(s, 74, 156, '#203060');
      G.text('Type a name, then press Enter.', 160, 196, '#506078', { align: 'center' });
      G.text('(Enter on blank = ' + this.def + ')', 160, 212, '#8090a8', { align: 'center' });
    }
  }
  G.nameEntry = (prompt, def, max, art) => G.push(new NameEntry(prompt, def, max, art));

  // ---------- generic full-screen menu backdrop ----------
  G.drawPattern = (c, a = '#d8e4f0', b = '#c8d8ea') => {
    c.fillStyle = a; c.fillRect(0, 0, G.W, G.H);
    c.fillStyle = b;
    for (let y = 0; y < G.H; y += 8) for (let x = ((y / 8) % 2) * 8; x < G.W; x += 16) c.fillRect(x, y, 8, 8);
  };
  G.typeBadge = (type, x, y) => {
    const t = G.TYPES[type]; const c = G.ctx;
    G.rrect(x, y, 44, 12, t.dark); G.rrect(x + 1, y + 1, 42, 10, t.color);
    G.text(t.short, x + 22, y + 2, '#fff', { align: 'center', shadowCol: 'rgba(0,0,0,0.35)' });
  };
})();
