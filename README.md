<div align="center">

```
    _   _ _____ ___  _   _   _____ ____      _    ___ _     ____
   | \ | | ____/ _ \| \ | | |_   _|  _ \    / \  |_ _| |   / ___|
   |  \| |  _|| | | |  \| |   | | | |_) |  / _ \  | || |   \___ \
   | |\  | |__| |_| | |\  |   | | |  _ <  / ___ \ | || |___ ___) |
   |_| \_|_____\___/|_| \_|   |_| |_| \_\/_/   \_\___|_____|____/
```

```
                         .::       ...::.
                   .::-=++++:          .:-==-:
                :-=+++++++++=              .:=*+-:
             :=++++++++++++++.                .-+#*=.
          .-+++++++++++++++++:                   :+##+:
        .-+++++++++++++++++++:                     -*##*-
       -+++++++++++++++++++++.                      .*###+.
     :=+++++++++++++++++++++-                        .*###*-
    :+++++++++++++++++++++++.                         :#####+
   :++++++++++++++++++++++=:                          .*#####+
  :++++++++++++++++++++++=. ...                     .::*######+
  ++++++++++++++++++++++-   ...                  ..:::-########-
 -+++++++++++++++++++++:     ...           ....:::::::*########*
 ++++++++++++++++++++-.      ........:::::::::::::::-*##########-
:++++++++++++++++++=.    ...:::::::::::::::::::::::=*###########+
:++++++++++++++++=:...:::::::::::::::::::::::::::=*#############*
:++++++++++++++=-::::::::::::::::::::::::::::::=*###############*.
:+++++++++++++-:::::::::::::::::::::......   :*#################+
.+++++++++++-:..:::::::::::... ....        :+###################=
 =+++++++++-:::::::::...        ....      =####################*.
 .++++++++=:::::...              ...    :*#####################=
  -+++++++::::.                  ....  -######################*.
   =++++++:..                     ....-######################*:
    =+++++-                       ...=######################*.
     -++++=.                      ..:*#####################+.
      .=+++=                       .+####################*-
        :=++=:                    ..*###################=.
         .:=++-.                   .*################*=:
            :-++-:                  *##############*-.
              .:-+=:.               =###########+-:
                  .:--:..           .*#####*+-:.
                       .:....        -=--:.
```

*the Kaipability mark, drawn as a density field — the same glow-falloff logic
the shader runs, one character at a time.*

### A living light installation for your website.

SDF fragment-shader light streams, rendered per-pixel so they stay razor-smooth
at any resolution — a self-running WebGL wallpaper that reacts to light and
dark mode with opposite optics: additive glow on dark, subtractive ink on light.

![Zero dependencies](https://img.shields.io/badge/dependencies-zero-9146ff?style=flat-square)
![No build step](https://img.shields.io/badge/build%20step-none-00c2ff?style=flat-square)
![WebGL 1.0](https://img.shields.io/badge/WebGL-1.0-ff3d68?style=flat-square)
![Light%2FDark aware](https://img.shields.io/badge/theme-light%20%2F%20dark-2ee6a6?style=flat-square)
![License](https://img.shields.io/badge/license-proprietary-lightgrey?style=flat-square)

## ▶ [**See it live**](https://www.kaipability.com/x/neon-hero-7q2m/)

Drop it behind your content. No canvas libraries, no bundler, no dependency
tree to audit — just a `<script>` tag and it runs.

</div>

---

## What you get

| File             | Purpose                                    |
|------------------|---------------------------------------------|
| `neon-trails.js` | The engine                                  |
| `neon-panel.js`  | Live tuning panel (optional, dev-time only) |
| `index.html`     | Minimal reference demo                      |
| `favicon.png`    | Icon                                        |

## Quick start

```html
<canvas id="glCanvas"></canvas>
<script src="neon-trails.js"></script>
<script>
  NeonTrails.init(document.getElementById('glCanvas'));
</script>
```

Position the canvas behind your content
(`position:absolute; inset:0; z-index:0; pointer-events:none`) with your
content layered above. It sizes itself to the canvas's own box, so it frames
correctly full-screen or in a shorter hero band.

Respect motion preferences if that matters to your audience:

```js
if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
  NeonTrails.init(canvas);
```

## Settings

Everything below lives on `window.NEON` and is live-editable at runtime.

| Key          | Range        | What it does                                             |
|--------------|--------------|-----------------------------------------------------------|
| `width`      | 0.3–3        | Stroke thickness of each beam                            |
| `glow`       | 0–1.2        | Halo strength around the bright core                     |
| `bright`     | 0.2–2.5      | Overall output intensity                                 |
| `colSpeed`   | 0–0.08       | How fast colours drift through the palette                |
| `tailFade`   | 0.2–0.95     | How quickly each beam's tail dims                         |
| `speckle`    | 0–0.8        | Brightness of the background dot field                    |
| `spkCount`   | 0.02–0.7     | Dot density                                                |
| `spkVar`     | 0–1          | Per-dot speed spread (0 = identical)                       |
| `spkDrift`   | 0–0.12       | Dot field movement speed                                   |
| `spkTwinkle` | 0–4          | Dot pulse rate                                              |
| `spkSize`    | 0.003–0.04   | Dot radius                                                  |
| `speed`      | 0.03–0.5     | Travel speed along the path                                 |
| `follow`     | 0.05–0.6     | Trail follow rate (lower = longer, silkier)                 |
| `snap`       | 0.08–0.7     | How sharply the head tracks its target                      |
| `spanX`      | 0.3–1.1      | Figure width                                                |
| `spanY`      | 0.6–3.5      | Figure height                                               |
| `spread`     | 0–5          | Spatial separation of the beam bundle                        |
| `numTrails`  | 1–6          | Number of beams                                              |
| `trailVar`   | 0–1          | Per-beam speed spread (above 0 they lap each other)           |
| `beamGap`    | 0–1.2        | Phase offset between successive beams along the path            |
| `shape`      | 0–3          | Path shape: `0` infinity · `1` ring · `2` S-curve · `3` both     |
| `centerX`    | -1–1         | Shift the whole figure left/right                            |
| `centerY`    | -1–1         | Shift the whole figure up/down                                |
| `bgDark`     | `[r,g,b]`    | Background for dark mode (0..1 floats)                         |
| `bgLight`    | `[r,g,b]`    | Background for light mode (0..1 floats)                         |

Set values directly, or tune live with `neon-panel.js` (press **P** after
`init()`), then **⧉ copy** for a paste-ready config block:

```js
NeonTrails.init(canvas);
Object.assign(window.NEON, { /* …copied params… */ });
window.NEON_setPalette([ /* …4 colours… */ ]);
```

### Palette

```js
window.NEON_getPalette();                                  // -> [[r,g,b] x4]
window.NEON_setPalette([[r,g,b],[r,g,b],[r,g,b],[r,g,b]]); // 0..1 floats
window.NEON_setColor(0, [0.55, 0.78, 0.91]);               // one slot
window.NEON_shufflePalette();                              // curated random
```

Custom colours persist — no click-to-shuffle. Press **B** to restore the
built-in brand palette.

### Light / dark theme

```js
window.NEON_setTheme('light');   // or 'dark' — animates the swap
window.NEON_getTheme();          // -> 'light' | 'dark'
```

Sync it to a `data-theme` attribute if that's how your app tracks theme:

```js
new MutationObserver(() =>
  NEON_setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
```

## Browser support

Pure WebGL 1. Compiles under strict ANGLE (Chrome on Windows) — the pickiest
GLSL compiler in circulation — so if it runs there it runs everywhere.

---

## Terms of use

**This is proprietary software, not open source.** © Kaipability Ltd. All
rights reserved.

- You may **view** this repository and the live demo.
- You may **not** copy, reproduce, modify, distribute, publish, sublicense,
  or create derivative works from this Software, in whole or in part,
  without Kaipability Ltd's prior written permission.
- The Software is provided "as is", without warranty of any kind.

See [`LICENSE`](LICENSE) for the full terms.

**Want to license Neon Trails for your own site?** Get in touch —
[kaipability.com](https://kaipability.com).

---

<p align="center">
  <a href="https://kaipability.com"><img src="favicon.png" width="20" alt=""></a><br>
  © Kaipability Ltd · <a href="https://kaipability.com">kaipability.com</a>
</p>
