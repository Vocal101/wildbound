'use strict';
// Web Audio chiptune: a small step sequencer for music + synthesized SFX and creature cries.
(function () {
  const A = G.audio = { ac: null, music: null, curName: null, musicOn: true, sfxOn: true };
  let master, musicGain, sfxGain, noiseBuf, waves = {};

  A.unlock = () => {
    if (A.ac) { if (A.ac.state === 'suspended') A.ac.resume(); return; }
    try {
      A.ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    const ac = A.ac;
    master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
    musicGain = ac.createGain(); musicGain.gain.value = 0.5; musicGain.connect(master);
    sfxGain = ac.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const pulse = (duty) => {
      const n = 48, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
      return ac.createPeriodicWave(re, im);
    };
    waves.p25 = pulse(0.25); waves.p12 = pulse(0.125); waves.p50 = pulse(0.5);
    A.applyOptions();
    if (A.pending) { const p = A.pending; A.pending = null; A.play(p, true); }
  };
  A.applyOptions = () => {
    const o = (G.S && G.S.options) || {};
    A.musicOn = o.music !== false; A.sfxOn = o.sound !== false;
    if (musicGain) musicGain.gain.value = A.musicOn ? 0.5 : 0;
  };

  // ---------- note parsing ----------
  const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function freq(tok) {
    const m = /^([a-g])(#|b)?(\d)$/.exec(tok); if (!m) return 0;
    let n = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3]) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }
  function parseChannel(str) {
    const toks = str.split(/\s+/).filter((t) => t && t !== '|');
    const ev = [];
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i]; if (t === '-' || t === '.') continue;
      let len = 1; while (toks[i + len] === '-') len++;
      ev[i] = { tok: t, f: freq(t), len };
    }
    return { len: toks.length, ev };
  }

  // ---------- voices ----------
  function tone(time, f, dur, wave, vol, dest, opts = {}) {
    const ac = A.ac; const o = ac.createOscillator(); const g = ac.createGain();
    if (waves[wave]) o.setPeriodicWave(waves[wave]); else o.type = wave;
    o.frequency.setValueAtTime(f, time);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), time + dur);
    if (opts.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(time + 0.12); l.stop(time + dur + 0.05); }
    const rel = Math.min(0.05, dur * 0.3);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.006);
    g.gain.setValueAtTime(vol * (opts.sus || 0.75), time + Math.min(dur * 0.4, 0.08));
    g.gain.setValueAtTime(vol * (opts.sus || 0.75), time + dur - rel);
    g.gain.linearRampToValueAtTime(0.0001, time + dur);
    o.connect(g); g.connect(dest); o.start(time); o.stop(time + dur + 0.02);
  }
  function noise(time, dur, vol, dest, hp = 1000, lp = 12000) {
    const ac = A.ac; const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f1 = ac.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = hp;
    const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, time); g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    s.connect(f1); f1.connect(f2); f2.connect(g); g.connect(dest); s.start(time, Math.random() * 0.5); s.stop(time + dur + 0.02);
  }
  function drum(time, kind, dest, vol = 1) {
    const ac = A.ac;
    if (kind === 'k') {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(150, time); o.frequency.exponentialRampToValueAtTime(40, time + 0.12);
      g.gain.setValueAtTime(0.55 * vol, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
      o.connect(g); g.connect(dest); o.start(time); o.stop(time + 0.2);
    } else if (kind === 's') noise(time, 0.12, 0.28 * vol, dest, 1200, 8000);
    else if (kind === 'h') noise(time, 0.035, 0.12 * vol, dest, 6000, 14000);
  }

  // ---------- songs ----------
  const B = (...bars) => bars.join(' ');
  const SONGS = A.SONGS = {
    title: { bpm: 120, spb: 2, ch: [
      { w: 'p25', v: 0.13, vib: 1, n: B('c5 - - g4 c5 - e5 -', 'd5 - - b4 g4 - - -', 'a4 - c5 - e5 - a5 -', 'g5 - f5 - e5 - c5 -', 'e5 - - d5 e5 - g5 -', 'g5 - f5 - d5 - b4 -', 'c5 - f5 - a5 - c6 -', 'b5 - - - d6 - - -') },
      { w: 'p12', v: 0.06, n: B('e4 g4 c5 g4 e4 g4 c5 g4', 'd4 g4 b4 g4 d4 g4 b4 g4', 'c4 e4 a4 e4 c4 e4 a4 e4', 'c4 f4 a4 f4 c4 f4 a4 f4', 'e4 g4 c5 g4 e4 g4 c5 g4', 'd4 g4 b4 g4 d4 g4 b4 g4', 'c4 f4 a4 f4 c4 f4 a4 f4', 'd4 g4 b4 g4 d4 g4 b4 g4') },
      { w: 'triangle', v: 0.22, n: B('c3 - c3 - g2 - c3 -', 'g2 - g2 - d3 - g2 -', 'a2 - a2 - e3 - a2 -', 'f2 - f2 - c3 - f2 -', 'c3 - c3 - g2 - c3 -', 'g2 - g2 - d3 - g2 -', 'f2 - f2 - c3 - f2 -', 'g2 - g2 - d3 - g2 -') },
      { w: 'drum', v: 0.8, n: 'k . h . s . h . k . h k s . h h' },
    ] },
    town: { bpm: 100, spb: 2, ch: [
      { w: 'p25', v: 0.12, vib: 1, n: B('e5 - d5 c5 d5 - e5 g5', 'a5 - g5 - e5 - . .', 'f5 - e5 d5 c5 - d5 e5', 'd5 - - - g4 - . .', 'e5 - d5 c5 d5 - e5 g5', 'a5 - c6 - b5 - a5 g5', 'f5 - a5 - g5 - e5 d5', 'd5 - e5 - c5 - - -') },
      { w: 'triangle', v: 0.22, n: B('c3 - g3 - c4 - g3 -', 'a2 - e3 - a3 - e3 -', 'f2 - c3 - f3 - c3 -', 'g2 - d3 - g3 - d3 -') },
      { w: 'p12', v: 0.045, n: B('. c4 e4 g4 . c4 e4 g4', '. c4 e4 a4 . c4 e4 a4', '. c4 f4 a4 . c4 f4 a4', '. d4 g4 b4 . d4 g4 b4') },
      { w: 'drum', v: 0.5, n: 'k . h . s . h . k . h . s . h h' },
    ] },
    route: { bpm: 122, spb: 2, ch: [
      { w: 'p25', v: 0.12, vib: 1, n: B('b4 - d5 - g5 - f#5 g5', 'a5 - f#5 - d5 - . a4', 'b4 - e5 - g5 - a5 b5', 'c6 - b5 a5 g5 - e5 -', 'd5 - g5 - b5 - a5 g5', 'f#5 - a5 - d6 - c6 b5', 'c6 - b5 - a5 - g5 e5', 'f#5 - - - d5 - . .') },
      { w: 'triangle', v: 0.22, n: B('g2 . g3 . d3 . g3 .', 'd3 . d4 . a2 . d3 .', 'e2 . e3 . b2 . e3 .', 'c3 . c4 . g2 . c3 .', 'g2 . g3 . d3 . g3 .', 'd3 . d4 . a2 . d3 .', 'c3 . c4 . g2 . c3 .', 'd3 . d4 . a2 . d3 .') },
      { w: 'p12', v: 0.045, n: B('d4 g4 b4 g4 d4 g4 b4 g4', 'd4 f#4 a4 f#4 d4 f#4 a4 f#4', 'e4 g4 b4 g4 e4 g4 b4 g4', 'e4 g4 c5 g4 e4 g4 c5 g4', 'd4 g4 b4 g4 d4 g4 b4 g4', 'd4 f#4 a4 f#4 d4 f#4 a4 f#4', 'e4 g4 c5 g4 e4 g4 c5 g4', 'd4 f#4 a4 f#4 d4 f#4 a4 f#4') },
      { w: 'drum', v: 0.6, n: 'k . h . s . h h k . h k s . h h' },
    ] },
    cave: { bpm: 84, spb: 2, ch: [
      { w: 'p25', v: 0.1, vib: 1, n: B('a4 - - - c5 - b4 -', 'a4 - - - . . e4 -', 'f4 - - - a4 - g4 -', 'g#4 - - - - - . .', 'e5 - - - d5 - c5 -', 'c5 - a4 - - - . .', 'd5 - f5 - e5 - d5 -', 'b4 - - - g#4 - - -') },
      { w: 'p12', v: 0.045, n: B('a3 c4 e4 c4 a3 c4 e4 c4', 'f3 a3 c4 a3 f3 a3 c4 a3', 'd3 f3 a3 f3 d3 f3 a3 f3', 'e3 g#3 b3 g#3 e3 g#3 b3 g#3') },
      { w: 'triangle', v: 0.24, n: B('a2 - - - a2 - - -', 'f2 - - - f2 - - -', 'd2 - - - d2 - - -', 'e2 - - - e2 - - -') },
      { w: 'drum', v: 0.35, n: 'k . . . h . . . k . . . h . h .' },
    ] },
    haven: { bpm: 96, spb: 2, ch: [
      { w: 'p25', v: 0.11, vib: 1, n: B('a4 - c5 - f5 - e5 -', 'g5 - e5 - c5 - - -', 'd5 - f5 - bb5 - a5 -', 'g5 - - - . . . .', 'a5 - g5 - f5 - c5 -', 'e5 - d5 - c5 - e5 -', 'd5 - c5 - bb4 - d5 -', 'c5 - e5 - f5 - - -') },
      { w: 'triangle', v: 0.2, n: B('f2 - c3 - a3 - c3 -', 'c3 - g3 - e3 - g3 -', 'bb2 - f3 - d3 - f3 -', 'c3 - g3 - e3 - g3 -', 'f2 - c3 - a3 - c3 -', 'c3 - g3 - e3 - g3 -', 'bb2 - f3 - d3 - f3 -', 'c3 - g3 - f2 - - -') },
      { w: 'drum', v: 0.3, n: 'k . h . h . h . k . h . h . h .' },
    ] },
    battle: { bpm: 160, spb: 2, ch: [
      { w: 'p25', v: 0.12, n: B('e5 - b4 - e5 f#5 g5 -', 'g5 - e5 - c5 - e5 -', 'f#5 - d5 - a5 - f#5 d5', 'd#5 - - - b4 - f#5 -', 'g5 - f#5 - e5 - b5 -', 'a5 - g5 - e5 - c6 -', 'b5 - a5 f#5 d5 - a5 -', 'b5 - a5 - g5 - f#5 d#5') },
      { w: 'p12', v: 0.05, n: B('b4 g4 e4 g4 b4 g4 e4 g4', 'c5 g4 e4 g4 c5 g4 e4 g4', 'd5 a4 f#4 a4 d5 a4 f#4 a4', 'd#5 b4 f#4 b4 d#5 b4 f#4 b4') },
      { w: 'triangle', v: 0.25, n: B('e2 e3 e2 e3 e2 e3 e2 e3', 'c3 c4 c3 c4 c3 c4 c3 c4', 'd3 d4 d3 d4 d3 d4 d3 d4', 'b2 b3 b2 b3 b2 b3 b2 b3') },
      { w: 'drum', v: 0.8, n: 'k h s h k k s h' },
    ] },
    trainer: { bpm: 156, spb: 2, ch: [
      { w: 'p25', v: 0.12, n: B('d5 - f5 - a5 - g5 f5', 'f5 - d5 - bb4 - d5 -', 'e5 - g5 - c6 - bb5 a5', 'a5 - - - c#5 - e5 -', 'f5 - e5 - d5 - a5 -', 'bb5 - a5 - g5 - f5 -', 'g5 - e5 c5 g5 - c6 -', 'a5 - g5 - e5 - c#5 -') },
      { w: 'p12', v: 0.05, n: B('a4 f4 d4 f4 a4 f4 d4 f4', 'bb4 f4 d4 f4 bb4 f4 d4 f4', 'c5 g4 e4 g4 c5 g4 e4 g4', 'c#5 a4 e4 a4 c#5 a4 e4 a4') },
      { w: 'triangle', v: 0.25, n: B('d2 d3 d2 d3 d2 d3 d2 d3', 'bb1 bb2 bb1 bb2 bb1 bb2 bb1 bb2', 'c2 c3 c2 c3 c2 c3 c2 c3', 'a1 a2 a1 a2 a1 a2 a1 a2') },
      { w: 'drum', v: 0.8, n: 'k h s h k h s s' },
    ] },
    boss: { bpm: 168, spb: 2, ch: [
      { w: 'p25', v: 0.12, n: B('c5 - eb5 - g5 - c6 -', 'c6 - bb5 - ab5 - g5 -', 'f5 - bb5 - d6 - c6 bb5', 'b5 - - - g5 - d5 -', 'eb5 - d5 - c5 - g5 -', 'ab5 - g5 - f5 - eb5 -', 'd5 - f5 - bb5 - ab5 g5', 'g5 - f5 - eb5 - d5 b4') },
      { w: 'p12', v: 0.05, n: B('g4 eb4 c4 eb4 g4 eb4 c4 eb4', 'ab4 eb4 c4 eb4 ab4 eb4 c4 eb4', 'bb4 f4 d4 f4 bb4 f4 d4 f4', 'b4 g4 d4 g4 b4 g4 d4 g4') },
      { w: 'triangle', v: 0.26, n: B('c2 c3 c2 c3 g1 g2 c2 c3', 'ab1 ab2 ab1 ab2 eb2 eb3 ab1 ab2', 'bb1 bb2 bb1 bb2 f2 f3 bb1 bb2', 'g1 g2 g1 g2 d2 d3 g1 g2') },
      { w: 'drum', v: 0.85, n: 'k h s h k k s h k h s h k s s s' },
    ] },
    victory: { bpm: 132, spb: 2, ch: [
      { w: 'p25', v: 0.12, vib: 1, n: B('c5 e5 g5 c6 - - g5 -', 'a5 - f5 - a5 c6 - -', 'g5 - e5 - g5 - c6 -', 'b5 - - - d6 - - -', 'c6 - g5 - e5 - g5 -', 'f5 - a5 - c6 - a5 -', 'g5 - b5 - d6 - b5 -', 'c6 - - - - - . .') },
      { w: 'triangle', v: 0.22, n: B('c3 - g3 - c3 - g3 -', 'f2 - c3 - f2 - c3 -', 'c3 - g3 - c3 - g3 -', 'g2 - d3 - g2 - d3 -', 'c3 - g3 - c3 - g3 -', 'f2 - c3 - f2 - c3 -', 'g2 - d3 - g2 - d3 -', 'c3 - g3 - c3 - - -') },
      { w: 'drum', v: 0.5, n: 'k . h . s . h .' },
    ] },
    hq: { bpm: 116, spb: 2, ch: [
      { w: 'p25', v: 0.11, n: B('e5 - . e5 f5 - e5 -', 'b4 - . b4 c5 - b4 -', 'c5 - e5 - g5 - f#5 -', 'd#5 - - - b4 - - -', 'e5 - g5 - f#5 - e5 -', 'd#5 - e5 - f#5 - g5 -', 'a5 - g5 - e5 - c5 -', 'b4 - - - d#5 - - -') },
      { w: 'triangle', v: 0.26, n: B('e2 . e2 e3 . e2 f2 .', 'e2 . e2 e3 . e2 d#2 .', 'c3 . c3 c4 . c3 b2 .', 'b2 . b2 b3 . b2 a#2 .') },
      { w: 'drum', v: 0.7, n: 'k . k s . k s h' },
    ] },
    summit: { bpm: 108, spb: 2, ch: [
      { w: 'p25', v: 0.12, vib: 1, n: B('f#5 - - - a5 - d6 -', 'c#6 - b5 - f#5 - - -', 'g5 - b5 - d6 - e6 -', 'c#6 - - - a5 - - -', 'd6 - c#6 - a5 - f#5 -', 'b5 - a5 - f#5 - d5 -', 'e5 - g5 - b5 - d6 -', 'c#6 - - - e6 - - -') },
      { w: 'p12', v: 0.045, n: B('d4 f#4 a4 f#4 d4 f#4 a4 f#4', 'd4 f#4 b4 f#4 d4 f#4 b4 f#4', 'd4 g4 b4 g4 d4 g4 b4 g4', 'c#4 e4 a4 e4 c#4 e4 a4 e4') },
      { w: 'triangle', v: 0.24, n: B('d2 - a2 - d3 - a2 -', 'b1 - f#2 - b2 - f#2 -', 'g1 - d2 - g2 - d2 -', 'a1 - e2 - a2 - e2 -') },
      { w: 'drum', v: 0.55, n: 'k . h . s . h . k . h k s . h .' },
    ] },
    evolve: { bpm: 110, spb: 2, ch: [
      { w: 'p25', v: 0.1, vib: 1, n: B('c5 e5 g5 e5 d5 f5 a5 f5', 'e5 g5 b5 g5 f5 a5 c6 a5') },
      { w: 'triangle', v: 0.2, n: B('c3 - - - d3 - - -', 'e3 - - - f3 - - -') },
    ] },
  };
  for (const k in SONGS) SONGS[k].ch.forEach((c) => (c.p = parseChannel(c.n)));
  A.SONGS.credits = SONGS.title;

  let timer = null;
  A.play = (name, force) => {
    if (!SONGS[name]) return;
    if (!A.ac) { A.pending = name; return; }
    if (A.curName === name && !force) return;
    A.stop();
    const song = SONGS[name]; A.curName = name;
    const out = A.ac.createGain(); out.gain.value = 1; out.connect(musicGain);
    const st = { song, out, step: 0, next: A.ac.currentTime + 0.08, dt: 60 / song.bpm / song.spb };
    A.music = st;
    timer = setInterval(() => schedule(st), 25); schedule(st);
  };
  A.stop = (fade = 0.15) => {
    if (timer) clearInterval(timer); timer = null;
    if (A.music && A.ac) { const o = A.music.out; o.gain.setTargetAtTime(0, A.ac.currentTime, fade / 3); setTimeout(() => o.disconnect(), 600); }
    A.music = null; A.curName = null;
  };
  function schedule(st) {
    if (A.music !== st) return;
    const ac = A.ac;
    if (st.next < ac.currentTime - 0.3) st.next = ac.currentTime + 0.05; // tab was throttled
    while (st.next < ac.currentTime + 0.15) {
      for (const ch of st.song.ch) {
        const e = ch.p.ev[st.step % ch.p.len]; if (!e) continue;
        if (ch.w === 'drum') drum(st.next, e.tok, st.out, ch.v);
        else if (e.f) tone(st.next, e.f, e.len * st.dt * 0.95, ch.w, ch.v, st.out, { vib: ch.vib && e.len > 2 });
      }
      st.step++; st.next += st.dt;
    }
  }
  A.musicVolume = (v) => { if (musicGain) musicGain.gain.setTargetAtTime(A.musicOn ? 0.5 * v : 0, A.ac.currentTime, 0.1); };

  // ---------- SFX ----------
  const seq = (notes, dt, wave = 'p25', vol = 0.15) => {
    const t = A.ac.currentTime + 0.01;
    notes.forEach((n, i) => { if (n) tone(t + i * dt, typeof n === 'number' ? n : freq(n), dt * 0.95, wave, vol, sfxGain); });
  };
  const FX = {
    blip: () => tone(A.ac.currentTime, 1046, 0.035, 'p25', 0.08, sfxGain),
    move: () => tone(A.ac.currentTime, 784, 0.03, 'p25', 0.06, sfxGain),
    select: () => seq(['a5', 'e6'], 0.04, 'p25', 0.09),
    back: () => seq(['e5', 'a4'], 0.04, 'p25', 0.08),
    bump: () => tone(A.ac.currentTime, 110, 0.08, 'p50', 0.12, sfxGain, { slide: 70 }),
    door: () => { noise(A.ac.currentTime, 0.12, 0.25, sfxGain, 200, 1500); tone(A.ac.currentTime, 180, 0.1, 'triangle', 0.2, sfxGain, { slide: 90 }); },
    ledge: () => tone(A.ac.currentTime, 300, 0.15, 'p25', 0.1, sfxGain, { slide: 700 }),
    hit: () => { const t = A.ac.currentTime; noise(t, 0.14, 0.4, sfxGain, 300, 6000); tone(t, 260, 0.12, 'p50', 0.12, sfxGain, { slide: 60 }); },
    hitSuper: () => { const t = A.ac.currentTime; noise(t, 0.22, 0.5, sfxGain, 200, 9000); tone(t, 400, 0.2, 'p50', 0.15, sfxGain, { slide: 50 }); noise(t + 0.1, 0.15, 0.35, sfxGain, 500, 9000); },
    hitWeak: () => { const t = A.ac.currentTime; noise(t, 0.08, 0.2, sfxGain, 1500, 5000); },
    faint: () => tone(A.ac.currentTime, 700, 0.6, 'p25', 0.13, sfxGain, { slide: 80 }),
    throw: () => tone(A.ac.currentTime, 300, 0.35, 'p12', 0.08, sfxGain, { slide: 1400 }),
    shake: () => { const t = A.ac.currentTime; tone(t, 220, 0.05, 'p50', 0.12, sfxGain); tone(t + 0.07, 160, 0.06, 'p50', 0.12, sfxGain); },
    pop: () => { const t = A.ac.currentTime; noise(t, 0.08, 0.3, sfxGain, 2000, 9000); tone(t, 900, 0.1, 'p25', 0.1, sfxGain, { slide: 300 }); },
    caught: () => seq(['c5', 'e5', 'g5', 'c6', 0, 'g5', 'c6'], 0.09, 'p25', 0.12),
    levelup: () => seq(['c5', 'e5', 'g5', 'c6', 'e6', 'g6'], 0.06, 'p25', 0.11),
    heal: () => seq(['c5', 'e5', 'g5', 'e5', 'c6', 0, 'c6'], 0.13, 'p25', 0.11),
    item: () => seq(['g5', 'g5', 'g5', 'c6', 0, 'b5', 'c6'], 0.08, 'p25', 0.11),
    badge: () => seq(['c5', 'c5', 'c5', 'g5', 0, 'e5', 'g5', 'c6', 0, 'c6'], 0.1, 'p25', 0.12),
    save: () => seq(['c6', 'g5', 'e6'], 0.08, 'p25', 0.1),
    shiny: () => seq(['c7', 'g6', 'e7', 0, 'c7', 'g7'], 0.05, 'p12', 0.08),
    run: () => seq(['g5', 'e5', 'c5'], 0.06, 'p25', 0.09),
    alert: () => seq(['e6', 'e6', 0, 'b6'], 0.05, 'p25', 0.1),
    statup: () => tone(A.ac.currentTime, 300, 0.3, 'p25', 0.1, sfxGain, { slide: 1200 }),
    statdown: () => tone(A.ac.currentTime, 1200, 0.3, 'p25', 0.1, sfxGain, { slide: 300 }),
    status: () => { const t = A.ac.currentTime; for (let i = 0; i < 4; i++) tone(t + i * 0.06, 500 + (i % 2) * 300, 0.05, 'p12', 0.08, sfxGain); },
    evolve: () => seq(['c5', 'd5', 'e5', 'f5', 'g5', 'a5', 'b5', 'c6'], 0.07, 'p25', 0.1),
    buy: () => seq(['e6', 'c7'], 0.06, 'p25', 0.09),
    whoosh: () => noise(A.ac.currentTime, 0.3, 0.2, sfxGain, 400, 3000),
    encounter: () => { const t = A.ac.currentTime; for (let i = 0; i < 6; i++) tone(t + i * 0.05, 880 - i * 60, 0.05, 'p25', 0.08, sfxGain); },
  };
  A.sfx = (name) => { if (!A.ac || !A.sfxOn || !FX[name]) return; try { FX[name](); } catch (e) { } };

  // creature cry: deterministic per species
  A.cry = (spId, pitch = 1) => {
    if (!A.ac || !A.sfxOn) return;
    let h = 0; for (const ch of spId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const t = A.ac.currentTime + 0.01;
    const base = (180 + (h % 500)) * pitch;
    const wave = ['p25', 'p12', 'p50', 'sawtooth'][h % 4];
    const parts = 2 + (h >> 3) % 3;
    let tt = t;
    for (let i = 0; i < parts; i++) {
      const d = 0.08 + ((h >> (i * 2)) % 4) * 0.04;
      const f1 = base * (1 + ((h >> (i + 5)) % 5) * 0.18);
      const f2 = f1 * (((h >> (i + 9)) % 2) ? 1.6 : 0.6);
      tone(tt, f1, d, wave, 0.1, sfxGain, { slide: f2, sus: 0.9 });
      tt += d * 0.85;
    }
    noise(t, 0.05, 0.08, sfxGain, 2000, 6000);
  };
})();
