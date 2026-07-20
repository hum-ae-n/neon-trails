# Neon Trails

> **Prompted, not programmed.** Every line of this — the shader maths, the
> physics, the palette engine — was specified in plain language and written by
> an AI. The source is here to read and the code copies in a click; conceiving
> it and knowing what to ask for is the part that doesn't.

**▶ See it live:** https://www.kaipability.com/x/neon-hero-7q2m/

SDF fragment-shader light streams — a self-running WebGL wallpaper. Clean-room
implementation, **zero dependencies, no build step**. The trails are rendered
per-pixel as a distance field (not geometry), so they stay perfectly smooth at
any resolution. Light/dark aware: additive glow on dark, subtractive ink on
light — same physics, opposite optics.

## Files

| File             | Purpose                                              | Ship to production?        |
|------------------|------------------------------------------------------|----------------------------|
| `neon-trails.js` | The engine — canvas, shader, physics, palette API    | Yes                        |
| `neon-panel.js`  | Live tuning panel (gear icon / press **P**)          | Optional — drop once tuned |
| `index.html`     | Minimal full-screen demo                             | Reference only             |
| `favicon.png`    | Icon                                                 | —                          |

## Quick start

```html
<canvas id="glCanvas"></canvas>
<script src="neon-trails.js"></script>
<script>
  NeonTrails.init(document.getElementById('glCanvas'));
</script>
```

Position the canvas behind your content (e.g. `position:absolute; inset:0;
z-index:0; pointer-events:none`) with your content layered above. The engine
sizes the drawing buffer to the **canvas's own box**, so it frames correctly in
any container — a full-screen background or a shorter hero band.

Gate `init()` behind `prefers-reduced-motion` yourself if you need that:

```js
if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
  NeonTrails.init(canvas);
```

## Tuning

Load `neon-panel.js` **after** init for the live panel (press **P**). Dial it
in, click **⧉ copy** to put a paste-ready block on your clipboard, then set it
at boot and drop the panel:

```js
NeonTrails.init(canvas);
Object.assign(window.NEON, { /* …copied params… */ });
window.NEON_setPalette([ /* …4 colours… */ ]);
```

## Parameters (`window.NEON`, all live)

| Key          | Range        | What it does                                             |
|--------------|--------------|---------------------------------------------------------|
| `width`      | 0.3–3        | Stroke thickness of each beam                           |
| `glow`       | 0–1.2        | Halo strength around the bright core                    |
| `bright`     | 0.2–2.5      | Overall output intensity                                |
| `colSpeed`   | 0–0.08       | How fast colours drift through the palette              |
| `tailFade`   | 0.2–0.95     | How quickly each beam's tail dims                       |
| `speckle`    | 0–0.8        | Brightness of the background dot field                  |
| `spkCount`   | 0.02–0.7     | Dot density                                             |
| `spkVar`     | 0–1          | Per-dot speed spread (0 = identical)                    |
| `spkDrift`   | 0–0.12       | Dot field movement speed                                |
| `spkTwinkle` | 0–4          | Dot pulse rate                                          |
| `spkSize`    | 0.003–0.04   | Dot radius                                              |
| `speed`      | 0.03–0.5     | Travel speed along the path                             |
| `follow`     | 0.05–0.6     | Trail follow rate (lower = longer, silkier)             |
| `snap`       | 0.08–0.7     | How sharply the head tracks its target                  |
| `spanX`      | 0.3–1.1      | Figure width                                            |
| `spanY`      | 0.6–3.5      | Figure height                                           |
| `spread`     | 0–5          | Spatial separation of the beam bundle                   |
| `numTrails`  | 1–6          | Number of beams                                         |
| `trailVar`   | 0–1          | Per-beam speed spread (above 0 they lap each other)     |
| `beamGap`    | 0–1.2        | Phase offset between successive beams along the path     |
| `shape`      | 0–3          | Path shape (see below)                                  |
| `centerX`    | -1–1         | Shift the whole figure left/right                       |
| `centerY`    | -1–1         | Shift the whole figure up/down                          |
| `bgDark`     | `[r,g,b]`    | Background for dark mode (0..1 floats)                  |
| `bgLight`    | `[r,g,b]`    | Background for light mode (0..1 floats)                 |

### Path shapes (`NEON.shape`)

| Value | Shape       | Description                                             |
|-------|-------------|--------------------------------------------------------|
| `0`   | infinity    | Lemniscate figure-eight (default)                      |
| `1`   | enso        | A round ring                                           |
| `2`   | S-curve     | A yin-yang divider / sinuous S                         |
| `3`   | logo        | Ring **and** S together (even beams ring, odd beams S) |

Shape `3` wants a few beams (`numTrails ≥ 2`) so both curves are populated.

## Palette

```js
window.NEON_getPalette();                                  // -> [[r,g,b] x4]
window.NEON_setPalette([[r,g,b],[r,g,b],[r,g,b],[r,g,b]]); // 0..1 floats
window.NEON_setColor(0, [0.55, 0.78, 0.91]);               // one slot
window.NEON_shufflePalette();                              // curated random
```

All palette changes cross-fade smoothly. Custom colours **persist** — there is
no click-to-shuffle. Press **B** to restore the built-in brand palette.

## Light / dark theme

```js
window.NEON_setTheme('light');   // or 'dark' — animates the swap
window.NEON_getTheme();          // -> 'light' | 'dark'
```

Match the engine's backgrounds to your surface:

```js
Object.assign(window.NEON, {
  bgDark:  [0.020, 0.020, 0.031],
  bgLight: [0.965, 0.960, 0.950],
});
```

If your app stores the theme in `data-theme` on `<html>`, one observer keeps the
engine in sync:

```js
new MutationObserver(() =>
  NEON_setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
```

## Device profiles

On init the engine picks sensible geometry per device and exposes
`window.NEON_profile` (`'desktop'` | `'mobile-portrait'` | `'mobile-landscape'`).
Override afterwards if you want to force your own geometry on a given profile.

## Tuning panel

`neon-panel.js` injects a gear button (top-right) and a panel (press **P**):

- Every parameter as a live slider, each with a **?** describing it
- Four colour swatches + **🎨** random, **B** brand, **◐** theme
- **shape** button cycles the path (∞ → ○ → ∿ → ◉)
- **🎲 random** randomises all sliders (palette stays)
- **⧉ copy** copies the whole config (params + shape + palette) as a
  paste-ready block
- **reset** restores the boot defaults

## Browser notes

Pure WebGL 1. Compiles under strict ANGLE (Chrome on Windows) — the pickiest
GLSL compiler in circulation — so if it runs there it runs everywhere.

## Runtime API summary

```
NeonTrails.init(canvas)         // start the engine on a <canvas>
window.NEON                     // all tunable parameters (live)
window.NEON_profile             // detected device profile
window.NEON_getPalette()        // current palette [[r,g,b] x4]
window.NEON_setPalette(p)       // set full palette (cross-fades)
window.NEON_setColor(i, rgb)    // set one palette slot
window.NEON_shufflePalette()    // curated random palette
window.NEON_setTheme('light'|'dark')
window.NEON_getTheme()
```

---

<p align="center">
  <a href="https://kaipability.com"><img src="favicon.png" width="20" alt=""></a><br>
  © Kaipability Ltd · <a href="https://kaipability.com">kaipability.com</a>
</p>
