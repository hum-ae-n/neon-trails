/*!
 * Kaipability Neon Trails — SDF fragment-shader light streams
 * © 2026 Kaipability Ltd · https://kaipability.com · All rights reserved.
 * Proprietary source. Copying, reuse, or redistribution in whole or in part,
 * without written permission from Kaipability Ltd, is prohibited.
 * Clean-room implementation. Zero dependencies.
 *
 * Usage:
 *   <canvas id="glCanvas"></canvas>
 *   <script src="neon-trails.js"></script>
 *   NeonTrails.init(document.getElementById('glCanvas'));
 *
 * Runtime API (after init):
 *   window.NEON                  — all tunable parameters (live)
 *   window.NEON_getPalette()     — current palette [[r,g,b] x4], 0..1 floats
 *   window.NEON_setPalette(p)    — set full palette (cross-fades)
 *   window.NEON_setColor(i, rgb) — set one slot
 *   window.NEON_shufflePalette() — curated random palette
 *
 * Built-in interactions:
 *   pointer move — streams follow cursor; idle 2.5s — back to infinity path
 *   click        — shuffle palette   |   B — restore brand palette
 */
(function (global) {
  'use strict';

  function init(canvas) {

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return;

  const TRAIL = 48;   // shader points — matches the reference architecture

  const vertSrc = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const fragSrc = `
    precision highp float;

    uniform vec2  uRes;
    uniform float uTime;
    uniform float uVel;
    uniform float uHover;
    uniform float uWidth;      // stroke width multiplier
    uniform float uGlow;       // halo strength
    uniform float uBright;     // overall intensity
    uniform float uColSpeed;   // colour cycle speed
    uniform float uTailFade;   // how fast tail fades
    uniform float uSpeckle;    // speckle intensity
    uniform float uSpkCount;   // dot count (fraction of cells, direct)
    uniform float uSpkDrift;   // field drift speed
    uniform float uSpkTwinkle; // twinkle speed
    uniform float uSpkSize;    // dot size
    uniform float uSpkVar;     // per-dot speed spread (0 = uniform, 1 = wild)
    uniform float uIntro;      // page-load zoom-in ramp 0->1
    uniform float uTheme;      // 0 = dark (additive glow), 1 = light (ink)
    uniform vec3  uBg;         // background colour
    uniform vec4  uPts4[${6 * TRAIL / 2}];  // 6 streams x TRAIL pts, 2 per vec4
    uniform float uNumTrails;
    uniform vec3  uCols[4];

    // ── distance from p to segment ab ──
    float sdSeg(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a, ba = b - a;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
      return length(pa - ba * h);
    }

    // ── 4-colour cyclic ribbon palette ──
    vec3 pal(float t) {
      t = fract(t) * 4.0;
      vec3 c = mix(uCols[0], uCols[1], clamp(t, 0.0, 1.0));
      c = mix(c, uCols[2], clamp(t - 1.0, 0.0, 1.0));
      c = mix(c, uCols[3], clamp(t - 2.0, 0.0, 1.0));
      c = mix(c, uCols[0], clamp(t - 3.0, 0.0, 1.0));
      return c;
    }

    // ── hash for speckles ──
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      float aspect = uRes.x / uRes.y;
      // scene space: y in [-1,1], x in [-aspect, aspect]
      vec2 p = (uv * 2.0 - 1.0) * vec2(aspect, 1.0);

      vec3 col = vec3(0.0);

      // ═══ N STREAMS — min-distance SDF, single glow pass each ═══
      for (int k = 0; k < 6; k++) {
        if (float(k) + 0.5 > uNumTrails) break;

        float dMin = 1e9; float fMin = 0.0;
        for (int i = 0; i < ${TRAIL - 1}; i++) {
          // TRAIL is even, so pair index = k*(TRAIL/2) + i/2 and
          // parity follows i alone. Index expressions must be inline
          // (loop symbols + constants only) for strict GLSL ES 1.0.
          vec2 a = (i - 2 * (i / 2) == 0)
            ? uPts4[k * ${TRAIL / 2} + i / 2].xy
            : uPts4[k * ${TRAIL / 2} + i / 2].zw;
          vec2 b = ((i + 1) - 2 * ((i + 1) / 2) == 0)
            ? uPts4[k * ${TRAIL / 2} + (i + 1) / 2].xy
            : uPts4[k * ${TRAIL / 2} + (i + 1) / 2].zw;
          vec2 pa = p - a, ba = b - a;
          float hh = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
          float d = length(pa - ba * hh);
          if (d < dMin) { dMin = d; fMin = (float(i) + hh) / float(${TRAIL - 1}); }
        }

        float w = mix(0.021, 0.0025, fMin) * uWidth * (1.0 + uVel * 3.0);
        float core = w * 0.35 / (dMin + w * 0.35); core = pow(core, 3.0);
        float halo = w * 1.8  / (dMin + w * 1.8);  halo = pow(halo, 2.0);
        float fade = 1.0 - fMin * uTailFade;
        // colour phase spreads streams evenly around the palette
        col += pal(fMin * 0.45 + uTime * uColSpeed + float(k) / max(uNumTrails, 1.0))
             * (core * 1.0 + halo * uGlow) * fade * uBright;
      }

      // ═══ SPECKLES — living starfield ═══
      // 3x3 neighbourhood sampling: each pixel evaluates dots in its own
      // cell AND the 8 surrounding cells, so glows cross cell boundaries
      // instead of clipping into visible grid rectangles.
      vec2 sp = p * 6.0 * mix(1.25, 1.0, uIntro)
              + vec2(uTime * uSpkDrift, uTime * uSpkDrift * 0.55);
      vec2 baseCell = floor(sp);
      for (int oy = -1; oy <= 1; oy++) {
        for (int ox = -1; ox <= 1; ox++) {
          vec2 cell = baseCell + vec2(float(ox), float(oy));
          float h = hash(cell);
          if (h > 1.0 - uSpkCount) {
            vec2 f = sp - cell;   // pixel relative to this cell's origin

            float hv = hash(cell + 7.7);
            vec2 dir = normalize(vec2(hash(cell + 3.1) - 0.5, hash(cell + 5.9) - 0.5) + 1e-4);
            float spd = uSpkDrift * 8.0 * mix(1.0, 0.2 + 1.8 * hv, uSpkVar);
            vec2 sPos = fract(vec2(hash(cell + 1.3), hash(cell + 2.7)) + dir * uTime * spd);
            float sd = length(f - sPos);

            float lp2 = fract(uTime * (0.05 + hv * 0.07) + h * 7.0);
            float zoomIn  = smoothstep(0.0, 0.12, lp2);
            float fadeOut = 1.0 - smoothstep(0.72, 1.0, lp2);
            float dotSize = uSpkSize * (0.25 + 0.75 * zoomIn);

            float tw = 0.6 + 0.4 * sin(uTime * uSpkTwinkle * (0.4 + h) + h * 40.0);
            float star = dotSize / (sd + dotSize);
            // compact support: glow reaches exactly zero within the
            // sampled ring, so nothing is ever clipped at an edge
            float win = 1.0 - smoothstep(0.0, 1.35, sd);
            col += pal(h + uTime * 0.01) * pow(star, 1.7) * win * tw
                 * zoomIn * fadeOut * uSpeckle * (0.35 + 0.65 * uIntro) * 1.8;
          }
        }
      }

      // ═══ BACKGROUND + gentle vignette ═══
      // vignette: darkens on dark theme, lightens-toward-edge kept subtle on light
      float vig = 1.0 - length(uv - 0.5) * mix(0.45, 0.12, uTheme);

      // DARK: additive — colour is light emitted over the background
      vec3 dark = uBg * vig + col;
      dark = dark / (1.0 + dark * 0.6);   // soft clip

      // LIGHT: subtractive — colour is ink drawn into the background.
      // intensity 'col' becomes pigment density; multiply toward the ink colour.
      float density = clamp(col.r + col.g + col.b, 0.0, 2.2);
      vec3 inkCol = col / max(density, 1e-4);          // normalised hue
      vec3 ink = mix(vec3(1.0), inkCol * 0.75, clamp(density * 0.85, 0.0, 1.0));
      vec3 light = uBg * vig * ink;

      col = mix(dark, light, uTheme);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Fullscreen triangle
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const uRes   = gl.getUniformLocation(prog, 'uRes');
  const uTime  = gl.getUniformLocation(prog, 'uTime');
  const uVel   = gl.getUniformLocation(prog, 'uVel');
  const uHover = gl.getUniformLocation(prog, 'uHover');
  const uPts4      = gl.getUniformLocation(prog, 'uPts4');
  const uNumTrails = gl.getUniformLocation(prog, 'uNumTrails');
  const uCols  = gl.getUniformLocation(prog, 'uCols');
  const uWidth   = gl.getUniformLocation(prog, 'uWidth');
  const uGlow    = gl.getUniformLocation(prog, 'uGlow');
  const uBright  = gl.getUniformLocation(prog, 'uBright');
  const uColSpeed= gl.getUniformLocation(prog, 'uColSpeed');
  const uTailFade= gl.getUniformLocation(prog, 'uTailFade');
  const uSpeckle = gl.getUniformLocation(prog, 'uSpeckle');
  const uSpkCount = gl.getUniformLocation(prog, 'uSpkCount');
  const uSpkVar   = gl.getUniformLocation(prog, 'uSpkVar');
  const uIntro    = gl.getUniformLocation(prog, 'uIntro');
  const uTheme    = gl.getUniformLocation(prog, 'uTheme');
  const uBg       = gl.getUniformLocation(prog, 'uBg');
  const uSpkDrift   = gl.getUniformLocation(prog, 'uSpkDrift');
  const uSpkTwinkle = gl.getUniformLocation(prog, 'uSpkTwinkle');
  const uSpkSize    = gl.getUniformLocation(prog, 'uSpkSize');

  // ── ADJUSTABLE PARAMETERS (driven by control panel) ──
  window.NEON = {
    width: 1.65,       // stroke width x
    glow: 0.94,        // halo strength
    bright: 1.45,      // overall brightness
    colSpeed: 0.019,   // colour cycle speed
    tailFade: 0.67,    // tail fade rate
    speckle: 0.58,     // speckle glow
    spkCount: 0.23,    // dot density
    spkVar: 0.28,      // per-dot speed spread
    spkDrift: 0.094,   // dot drift speed
    spkTwinkle: 1.5,   // twinkle speed
    spkSize: 0.023,    // dot size
    speed: 0.34,       // infinity travel speed
    follow: 0.25,      // stream length
    snap: 0.62,        // head responsiveness
    spanX: 1.04,       // infinity width
    spanY: 2.6,        // infinity height
    spread: 1.2,       // bundle separation
    numTrails: 4,      // light streams
    trailVar: 0.66,    // per-stream speed spread
    beamGap: 0.055,    // phase offset between successive streams
    shape: 0,          // path: 0 infinity · 1 enso · 2 S-curve · 3 logo
    centerX: 0.32,     // figure alignment x
    centerY: -0.88,    // figure alignment y
    theme: 0,
    bgDark:  [0.020, 0.020, 0.031],
    bgLight: [0.965, 0.960, 0.950],
  };
  const P = window.NEON;   // single binding for the whole engine scope

  // ── Palette state: Kaipability brand ribbon, click-shuffleable ──
  // DARK (glow): brand reds + a blush highlight so the trails read luminous
  const BRAND = [
    [0xC8/255, 0x10/255, 0x2E/255],   // crimson  #C8102E
    [0xF2/255, 0xC7/255, 0xD1/255],   // blush    #F2C7D1
    [0x8B/255, 0x1A/255, 0x1A/255],   // brand red #8B1A1A
    [0xE6/255, 0x39/255, 0x51/255],   // rose     #E63951
  ];
  // LIGHT (ink): deeper red pigment for the paper-white subtractive mode
  const BRAND_INK = [
    [0x8B/255, 0x1A/255, 0x1A/255],   // brand red #8B1A1A
    [0xB0/255, 0x28/255, 0x38/255],   // mid rose
    [0x5A/255, 0x0F/255, 0x12/255],   // oxblood
    [0xC8/255, 0x10/255, 0x2E/255],   // crimson  #C8102E
  ];
  // opening palette — our brand reds, so it loads on-brand out of the box
  const OPEN_PAL = BRAND.map(x => x.slice());
  let palCur = OPEN_PAL.map(x => x.slice());
  let palTgt = OPEN_PAL.map(x => x.slice());
  const palFlat = new Float32Array(12);

  // Random colour via HSL — random hue, healthy sat/lightness
  // (full-random hex produces muddy browns; this stays luminous)
  function hslToRgb(h, s, l) {
    const f = (n) => {
      const k = (n + h * 12) % 12;
      return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [f(0), f(8), f(4)];
  }
  function randomPalette() {
    const baseHue = Math.random();
    return [0, 1, 2, 3].map(i =>
      hslToRgb((baseHue + i * (0.18 + Math.random() * 0.12)) % 1,
               0.45 + Math.random() * 0.3,
               0.62 + Math.random() * 0.15)
    );
  }

  // Custom colours persist (no click-to-shuffle). Press B to restore brand;
  // deliberate shuffle is available via NEON_shufflePalette() / the panel.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'b' || e.key === 'B')
      palTgt = (themeTgt > 0.5 ? BRAND_INK : BRAND).map(x => x.slice());
  });

  // Hooks for the control panel
  window.NEON_getPalette = () => palTgt.map(x => x.slice());
  window.NEON_setPalette = (p) => { palTgt = p.map(x => x.slice()); };
  window.NEON_setColor = (i, rgb) => { palTgt[i] = rgb.slice(); };
  window.NEON_shufflePalette = () => { palTgt = randomPalette(); };

  // ── THEME API ──
  // NEON_setTheme('light'|'dark'): animates compositing AND swaps to the
  // matching brand palette (only if the current palette is still a brand one)
  let themeTgt = 0;
  window.NEON_setTheme = (name) => {
    const toLight = (name === 'light');
    themeTgt = toLight ? 1 : 0;
    const from = toLight ? BRAND : BRAND_INK;
    const to   = toLight ? BRAND_INK : BRAND;
    // swap palette only if user hasn't customised away from brand
    const isBrand = palTgt.every((col, i) =>
      from[i].every((v, j) => Math.abs(col[j] - v) < 0.02));
    if (isBrand) palTgt = to.map(x => x.slice());
  };
  window.NEON_getTheme = () => (themeTgt > 0.5 ? 'light' : 'dark');

  // ── DEVICE-AWARE DEFAULTS: impactful out of the box ──
  (function applyDeviceDefaults() {
    const portrait = window.innerHeight > window.innerWidth;
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    const mobile = coarse || small;

    // Geometry adapts per device. Aesthetic params keep the boot defaults.
    if (mobile && portrait) {
      window.NEON_profile = 'mobile-portrait';   // base IS the portrait tuning
    } else if (mobile) {
      Object.assign(window.NEON, { spanX: 0.95, spanY: 2.2, centerX: 0, centerY: 0 });
      window.NEON_profile = 'mobile-landscape';
    } else {
      Object.assign(window.NEON, { spanX: 0.92, spanY: 2.1, centerX: 0, centerY: 0 });
      window.NEON_profile = 'desktop';
    }
  })();

  // ── CPU-side trail state: independent threads ──
  let aspect = 1;
  const MAX_TRAILS = 6;
  const SPEED_MULS = [1.00, 0.93, 1.08, 0.86, 1.16, 0.79];  // per-stream relative speeds
  const trailsCPU = [];
  for (let k = 0; k < MAX_TRAILS; k++) {
    const a = (k / MAX_TRAILS) * Math.PI * 2;
    trailsCPU.push({
      pts: new Float32Array(TRAIL * 2),
      phase: k * 0.055,
      sclX: 0.92 + (k % 3 - 1) * 0.012,
      sclY: 2.05 + (k % 3 - 1) * 0.05,
      off: { x: Math.cos(a) * 0.02, y: Math.sin(a) * 0.02 },
      speedMul: SPEED_MULS[k]
    });
  }
  const packedPts = new Float32Array(MAX_TRAILS * TRAIL * 2);
  const target = { x: 0, y: 0 };
  let velocity = 0, hover = 0, lastInteraction = 0;
  let prevHeadX = 0, prevHeadY = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    // size to the canvas's own box so the figure frames correctly in any
    // container — full-screen preview or a shorter hero band
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  function setPointer(cx, cy) {
    // map within the canvas box; ignore movement outside it so the figure
    // only reacts over its own area and settles otherwise
    const r = canvas.getBoundingClientRect();
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return;
    target.x = (((cx - r.left) / r.width) * 2 - 1) * aspect;
    target.y = -(((cy - r.top) / r.height) * 2 - 1);
    lastInteraction = Date.now();
  }
  window.addEventListener('pointermove', e => setPointer(e.clientX, e.clientY));
  window.addEventListener('touchmove', e => {
    if (e.touches.length) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  // Lemniscate idle path
  function lemniscate(t, sclX, sclY) {
    const si = Math.sin(t), co = Math.cos(t), d = 1 + si * si;
    return { x: (co / d) * aspect * sclX, y: (si * co / d) * sclY };
  }

  // ── PATH SHAPES: the curve the beams trace ──
  // Enso ring and yin-yang S normalised so they read round / centred at the
  // infinity-tuned spans; the S sits inside the ring for the combined 'logo'.
  function circlePt(t, sclX, sclY) {
    return { x: Math.cos(t) * sclX * aspect * 0.6, y: Math.sin(t) * sclY * 0.32 };
  }
  function essPt(t, sclX, sclY) {
    // yin-yang divider: right-top lobe, left-bottom lobe
    return { x: Math.sin(2 * t) * sclX * aspect * 0.35, y: Math.cos(t) * sclY * 0.32 };
  }
  function pathPoint(t, sclX, sclY, k) {
    const shape = P.shape | 0;
    if (shape === 1) return circlePt(t, sclX, sclY);            // enso ring
    if (shape === 2) return essPt(t, sclX, sclY);               // S-curve
    if (shape === 3) return (k % 2 === 0)                       // logo: ring + S
      ? circlePt(t, sclX, sclY) : essPt(t, sclX, sclY);
    return lemniscate(t, sclX, sclY);                           // infinity
  }

  // ── TRAIL PHYSICS (shared by prewarm and the live loop) ──
  function updateTrails(t, hoverAmt) {
    for (let k = 0; k < MAX_TRAILS; k++) {
      const tr = trailsCPU[k];
      const sclXk = P.spanX + (tr.sclX - 0.92);
      const sclYk = P.spanY + (tr.sclY - 2.05);
      const spdK = P.speed * (1 + (tr.speedMul - 1) * P.trailVar * 3.0);
      // per-stream phase offset — live-tunable gap between successive beams
      const lp = pathPoint(t * spdK + k * P.beamGap, sclXk, sclYk, k);
      lp.x += P.centerX * aspect * 0.8;
      lp.y += P.centerY * 0.8;
      const ox = tr.off.x * P.spread, oy = tr.off.y * P.spread;
      const tx = lp.x * (1 - hoverAmt) + (target.x + ox) * hoverAmt;
      const ty = lp.y * (1 - hoverAmt) + (target.y + oy) * hoverAmt;

      tr.pts[0] += (tx - tr.pts[0]) * P.snap;
      tr.pts[1] += (ty - tr.pts[1]) * P.snap;

      for (let i = 1; i < TRAIL; i++) {
        tr.pts[i*2]   += (tr.pts[(i-1)*2]   - tr.pts[i*2])   * P.follow;
        tr.pts[i*2+1] += (tr.pts[(i-1)*2+1] - tr.pts[i*2+1]) * P.follow;
      }
      packedPts.set(tr.pts, k * TRAIL * 2);
    }
  }

  // ── PRE-WARM: simulate 10 seconds of physics before first paint ──
  // so the streams arrive fully formed, not as a dot sweeping in.
  for (let pw = -10; pw < 0; pw += 1 / 60) updateTrails(pw, 0);

  const t0 = performance.now();
  function frame() {
    requestAnimationFrame(frame);
    const t = (performance.now() - t0) / 1000;
    const idle = Date.now() - lastInteraction > 2500;

    hover += ((idle ? 0 : 1) - hover) * 0.03;

    updateTrails(t, hover);

    // Velocity from thread A's head, smoothed
    const dx = trailsCPU[0].pts[0] - prevHeadX, dy = trailsCPU[0].pts[1] - prevHeadY;
    velocity += (Math.min(Math.sqrt(dx*dx + dy*dy) * 6.0, 1.0) - velocity) * 0.1;
    prevHeadX = trailsCPU[0].pts[0]; prevHeadY = trailsCPU[0].pts[1];

    // Ease current palette toward target, upload
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        palCur[i][j] += (palTgt[i][j] - palCur[i][j]) * 0.04;
        palFlat[i*3 + j] = palCur[i][j];
      }
    }
    gl.uniform3fv(uCols, palFlat);

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uVel, velocity);
    gl.uniform1f(uHover, hover);
    gl.uniform1f(uWidth, P.width);
    gl.uniform1f(uGlow, P.glow);
    gl.uniform1f(uBright, P.bright);
    gl.uniform1f(uColSpeed, P.colSpeed);
    gl.uniform1f(uTailFade, P.tailFade);
    gl.uniform1f(uSpeckle, P.speckle);
    const introT = Math.min(t / 1.1, 1);
    gl.uniform1f(uIntro, introT * introT * (3 - 2 * introT));  // smoothstep ease
    // theme eases smoothly; background follows
    P.theme += (themeTgt - P.theme) * 0.05;
    gl.uniform1f(uTheme, P.theme);
    gl.uniform3f(uBg,
      P.bgDark[0] + (P.bgLight[0] - P.bgDark[0]) * P.theme,
      P.bgDark[1] + (P.bgLight[1] - P.bgDark[1]) * P.theme,
      P.bgDark[2] + (P.bgLight[2] - P.bgDark[2]) * P.theme);
    gl.uniform1f(uSpkCount, P.spkCount);
    gl.uniform1f(uSpkVar, P.spkVar);
    gl.uniform1f(uSpkDrift, P.spkDrift);
    gl.uniform1f(uSpkTwinkle, P.spkTwinkle);
    gl.uniform1f(uSpkSize, P.spkSize);
    gl.uniform4fv(uPts4, packedPts);
    gl.uniform1f(uNumTrails, P.numTrails);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  frame();

  }

  global.NeonTrails = { init: init };
})(window);
