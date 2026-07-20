/*!
 * Kaipability Neon Trails — optional live control panel
 * © 2026 Kaipability Ltd · https://kaipability.com · All rights reserved.
 * Proprietary source. Copying, reuse, or redistribution in whole or in part,
 * without written permission from Kaipability Ltd, is prohibited.
 * Load AFTER neon-trails.js and after NeonTrails.init().
 * Injects its own HTML + CSS. Press P or click the gear.
 * Drop this file from production once you've dialled in your values.
 */
(function () {
  'use strict';

  const css = `
  /* ─── ADJUSTER PANEL ─── */
  #panelToggle{position:fixed;top:clamp(1rem,3vw,1.5rem);right:clamp(1rem,3vw,1.5rem);z-index:300;width:38px;height:38px;border-radius:6px;background:rgba(10,10,18,.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);color:#9a9a9a;font-size:1rem;cursor:pointer;transition:color .2s,border-color .2s}
  #panelToggle:hover{color:#e8e4df;border-color:rgba(255,255,255,.25)}
  #panel{position:fixed;top:clamp(3.5rem,8vw,4.5rem);right:clamp(1rem,3vw,1.5rem);z-index:300;width:min(300px,calc(100vw - 2rem));background:rgba(8,8,14,.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:1rem;display:none;max-height:calc(100vh - 8rem);overflow-y:auto}
  #panel.open{display:block}
  .panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem;font-family:'JetBrains Mono',monospace;font-size:.65rem;letter-spacing:.12em;color:#7a7a7a}
  #panelReset{background:none;border:1px solid rgba(255,255,255,.12);color:#7a7a7a;border-radius:4px;padding:.2rem .5rem;font-family:'JetBrains Mono',monospace;font-size:.6rem;cursor:pointer;transition:color .2s,border-color .2s}
  #panelReset:hover{color:#e8e4df;border-color:rgba(255,255,255,.3)}
  .ctl{display:grid;grid-template-columns:1fr;gap:.15rem;margin-bottom:.65rem}
  .ctl label{font-family:'JetBrains Mono',monospace;font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:#8a8a8a;display:flex;justify-content:space-between}
  .ctl span{font-family:'JetBrains Mono',monospace;font-size:.62rem;color:#c8c8d0;float:right}
  .ctl{position:relative}
  .ctl span{position:absolute;right:0;top:0}
  .ctl input[type=range]{width:100%;height:4px;appearance:none;-webkit-appearance:none;background:rgba(255,255,255,.1);border-radius:2px;outline:none;margin-top:.3rem}
  .ctl input[type=range]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:linear-gradient(135deg,#E63951,#8B1A1A);cursor:pointer;border:none}
  .ctl input[type=range]::-moz-range-thumb{width:13px;height:13px;border-radius:50%;background:linear-gradient(135deg,#E63951,#8B1A1A);cursor:pointer;border:none}
  .panel-note{margin-top:.6rem;font-family:'JetBrains Mono',monospace;font-size:.58rem;color:#5a5a5a;line-height:1.5}
  .panel-btns{display:flex;gap:.4rem;flex-wrap:wrap;justify-content:flex-end}
  #panelTheme,#panelColours,#panelRandom,#panelShape,#panelCopy{background:none;border:1px solid rgba(200,16,46,.35);color:#E63951;border-radius:4px;padding:.2rem .5rem;font-family:'JetBrains Mono',monospace;font-size:.6rem;cursor:pointer;transition:color .2s,border-color .2s}
  #panelTheme:hover,#panelColours:hover,#panelRandom:hover,#panelShape:hover,#panelCopy:hover{color:#e8e4df;border-color:rgba(200,16,46,.7)}
  .pal-row{display:flex;align-items:center;gap:.45rem;margin-bottom:.85rem;padding-bottom:.7rem;border-bottom:1px solid rgba(255,255,255,.06)}
  .pal-row label{font-family:'JetBrains Mono',monospace;font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:#8a8a8a;margin-right:.2rem}
  .pal-swatch{width:30px;height:30px;border:1px solid rgba(255,255,255,.15);border-radius:6px;background:none;padding:0;cursor:pointer}
  .pal-swatch::-webkit-color-swatch-wrapper{padding:2px}
  .pal-swatch::-webkit-color-swatch{border:none;border-radius:4px}
  .pal-swatch::-moz-color-swatch{border:none;border-radius:4px}
  .rng{font-style:normal;color:#55555f;font-size:.55rem;letter-spacing:.05em;margin-left:.4rem}
  .help-btn{background:none;border:none;color:#6a6a78;font-family:'JetBrains Mono',monospace;font-size:.6rem;cursor:pointer;padding:0 .2rem;margin-left:auto}
  .help-btn:hover{color:#c8c8d0}
  .help-txt{display:none;font-family:system-ui,sans-serif;font-size:.62rem;color:#9a96a8;line-height:1.45;margin:.15rem 0 .1rem;padding-left:.1rem}
  .help-txt.open{display:block}
`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const wrap = document.createElement('div');
  wrap.innerHTML = `
<!-- ─── ADJUSTER PANEL ─── -->
<button id="panelToggle" title="Adjust effect (P)">&#9881;</button>
<div id="panel">
  <div class="panel-head">
    <span>EFFECT CONTROLS</span>
    <div class="panel-btns">
      <button id="panelTheme" title="Toggle light/dark theme">&#9680;</button>
      <button id="panelColours" title="Randomise colours">&#127912;</button>
      <button id="panelShape" title="Cycle path shape">&#8734; infinity</button>
      <button id="panelRandom" title="Randomise all sliders">&#127922; random</button>
      <button id="panelReset">reset</button>
      <button id="panelCopy" title="Copy every setting + palette to the clipboard">&#10697; copy</button>
    </div>
  </div>
  <div class="pal-row">
    <label>Palette</label>
    <input type="color" class="pal-swatch" data-i="0" value="#c8102e" title="Colour 1">
    <input type="color" class="pal-swatch" data-i="1" value="#f2c7d1" title="Colour 2">
    <input type="color" class="pal-swatch" data-i="2" value="#8b1a1a" title="Colour 3">
    <input type="color" class="pal-swatch" data-i="3" value="#e63951" title="Colour 4">
  </div>
  <div class="ctl"><label>Stroke width<em class="rng">0.3–3</em></label><input type="range" data-p="width" min="0.3" max="3" step="0.05" value="1"><span>1.00</span></div>
  <div class="ctl"><label>Glow halo<em class="rng">0–1.2</em></label><input type="range" data-p="glow" min="0" max="1.2" step="0.02" value="0.30"><span>0.30</span></div>
  <div class="ctl"><label>Brightness<em class="rng">0.2–2.5</em></label><input type="range" data-p="bright" min="0.2" max="2.5" step="0.05" value="1"><span>1.00</span></div>
  <div class="ctl"><label>Colour cycle<em class="rng">0–0.08</em></label><input type="range" data-p="colSpeed" min="0" max="0.08" step="0.001" value="0.015"><span>0.015</span></div>
  <div class="ctl"><label>Tail fade<em class="rng">0.2–0.95</em></label><input type="range" data-p="tailFade" min="0.2" max="0.95" step="0.01" value="0.62"><span>0.62</span></div>
  <div class="ctl"><label>Speckle glow<em class="rng">0–0.8</em></label><input type="range" data-p="speckle" min="0" max="0.8" step="0.02" value="0.35"><span>0.35</span></div>
  <div class="ctl"><label>Dot count<em class="rng">0.02–0.7</em></label><input type="range" data-p="spkCount" min="0.02" max="0.7" step="0.01" value="0.25"><span>0.25</span></div>
  <div class="ctl"><label>Dot speed spread<em class="rng">0–1</em></label><input type="range" data-p="spkVar" min="0" max="1" step="0.02" value="0.6"><span>0.60</span></div>
  <div class="ctl"><label>Dot drift speed<em class="rng">0–0.12</em></label><input type="range" data-p="spkDrift" min="0" max="0.12" step="0.002" value="0.015"><span>0.015</span></div>
  <div class="ctl"><label>Twinkle speed<em class="rng">0–4</em></label><input type="range" data-p="spkTwinkle" min="0" max="4" step="0.1" value="1.0"><span>1.00</span></div>
  <div class="ctl"><label>Dot size<em class="rng">0.003–0.04</em></label><input type="range" data-p="spkSize" min="0.003" max="0.04" step="0.001" value="0.016"><span>0.016</span></div>
  <div class="ctl"><label>Travel speed<em class="rng">0.03–0.5</em></label><input type="range" data-p="speed" min="0.03" max="0.5" step="0.01" value="0.14"><span>0.14</span></div>
  <div class="ctl"><label>Stream length<em class="rng">0.05–0.6</em></label><input type="range" data-p="follow" min="0.05" max="0.6" step="0.01" value="0.16" data-invert="1"><span>0.16</span></div>
  <div class="ctl"><label>Head snap<em class="rng">0.08–0.7</em></label><input type="range" data-p="snap" min="0.08" max="0.7" step="0.01" value="0.32"><span>0.32</span></div>
  <div class="ctl"><label>Span width<em class="rng">0.3–1.1</em></label><input type="range" data-p="spanX" min="0.3" max="1.1" step="0.01" value="0.92"><span>0.92</span></div>
  <div class="ctl"><label>Span height<em class="rng">0.6–3.5</em></label><input type="range" data-p="spanY" min="0.6" max="3.5" step="0.05" value="2.05"><span>2.05</span></div>
  <div class="ctl"><label>Bundle spread<em class="rng">0–5</em></label><input type="range" data-p="spread" min="0" max="5" step="0.1" value="1"><span>1.0</span></div>
  <div class="ctl"><label>Light streams<em class="rng">1–6</em></label><input type="range" data-p="numTrails" min="1" max="6" step="1" value="3"><span>3</span></div>
  <div class="ctl"><label>Stream speed spread<em class="rng">0–1</em></label><input type="range" data-p="trailVar" min="0" max="1" step="0.02" value="0.30"><span>0.30</span></div>
  <div class="ctl"><label>Beam offset<em class="rng">0–1.2</em></label><input type="range" data-p="beamGap" min="0" max="1.2" step="0.01" value="0.055"><span>0.06</span></div>
  <div class="ctl"><label>Align X<em class="rng">-1–1</em></label><input type="range" data-p="centerX" min="-1" max="1" step="0.02" value="0"><span>0.00</span></div>
  <div class="ctl"><label>Align Y<em class="rng">-1–1</em></label><input type="range" data-p="centerY" min="-1" max="1" step="0.02" value="0"><span>0.00</span></div>
  <div class="panel-note">shape: cycle path &middot; B: brand palette &middot; P: toggle panel &middot; &#127922; randomises sliders only (palette stays)</div>
</div>
`;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

(function boot(){
  // panel needs the engine — wait for NEON if we loaded before init()
  if (!window.NEON) { return setTimeout(boot, 30); }

  const panel=document.getElementById('panel');
  const toggle=document.getElementById('panelToggle');
  const defaults=Object.assign({},window.NEON);

  toggle.addEventListener('click',e=>{e.stopPropagation();panel.classList.toggle('open')});
  document.addEventListener('keydown',e=>{if(e.key==='p'||e.key==='P')panel.classList.toggle('open')});
  // clicks inside panel must not shuffle colours
  panel.addEventListener('click',e=>e.stopPropagation());

  // ── PATH SHAPE CYCLE (infinity → enso → S-curve → logo) ──
  const SHAPES=['∞ infinity','○ enso','∿ S-curve','◉ logo'];
  const shapeBtn=document.getElementById('panelShape');
  function setShapeLabel(){shapeBtn.textContent=SHAPES[(window.NEON.shape|0)%SHAPES.length];}
  setShapeLabel();
  shapeBtn.addEventListener('click',e=>{
    e.stopPropagation();
    window.NEON.shape=((window.NEON.shape|0)+1)%SHAPES.length;
    setShapeLabel();
  });

  // ── PER-SETTING HELP (tap ? to show/hide what it does) ──
  const HELP={
    width:'Thickness of each stream stroke.',
    glow:'Strength of the soft halo around the bright core.',
    bright:'Overall output intensity of the streams.',
    colSpeed:'How fast the colours drift through the palette.',
    tailFade:'How quickly the tail end of each stream dims out.',
    speckle:'Brightness of the background dots.',
    spkCount:'How many dots populate the field.',
    spkVar:'How differently individual dots move. 0 = all identical.',
    spkDrift:'Overall movement speed of the dot field.',
    spkTwinkle:'How fast each dot pulses in brightness.',
    spkSize:'Radius of each dot.',
    speed:'How fast the streams travel around the infinity path.',
    follow:'Trail follow rate. Lower = longer, silkier streams.',
    snap:'How sharply the stream head tracks its target.',
    spanX:'Width of the infinity figure across the screen.',
    spanY:'Height of the infinity figure.',
    spread:'Spatial separation of the stream bundle around the path.',
    numTrails:'How many streams render, 1 to 6.',
    trailVar:'Speed difference between streams — above 0 they lap each other.',
    beamGap:'Phase gap between successive streams along the path. Higher = they trail each other further apart.',
    centerX:'Shift the whole figure left or right. Useful on mobile.',
    centerY:'Shift the whole figure up or down. Useful on mobile.'
  };
  panel.querySelectorAll('.ctl').forEach(ctl=>{
    const inp=ctl.querySelector('input[type=range]');
    if(!inp)return;
    const key=inp.dataset.p, txt=HELP[key];
    if(!txt)return;
    const lbl=ctl.querySelector('label');
    const btn=document.createElement('button');
    btn.className='help-btn';btn.type='button';btn.textContent='?';
    btn.setAttribute('aria-label','What does this do');
    const desc=document.createElement('div');
    desc.className='help-txt';desc.textContent=txt;
    lbl.appendChild(btn);
    lbl.insertAdjacentElement('afterend',desc);
    btn.addEventListener('click',e=>{e.stopPropagation();desc.classList.toggle('open')});
  });

  const sliders=panel.querySelectorAll('input[type=range]');
  // sync slider positions to the live (device-adjusted) values
  sliders.forEach(s=>{
    const key=s.dataset.p;
    if(window.NEON && window.NEON[key]!==undefined){
      s.value=window.NEON[key];
      const dp=(key==='numTrails')?0:(key==='colSpeed'||key==='spkDrift'||key==='spkSize')?3:2;
      const out=s.parentElement.querySelector('span');
      if(out)out.textContent=parseFloat(s.value).toFixed(dp);
    }
  });
  sliders.forEach(s=>{
    const key=s.dataset.p, out=s.parentElement.querySelector('span');
    s.addEventListener('input',()=>{
      window.NEON[key]=parseFloat(s.value);
      const dp=(key==='numTrails')?0:(key==='colSpeed'||key==='spkDrift'||key==='spkSize')?3:2;
      out.textContent=parseFloat(s.value).toFixed(dp);
    });
  });

  document.getElementById('panelReset').addEventListener('click',()=>{
    Object.assign(window.NEON,defaults);
    setShapeLabel();
    sliders.forEach(s=>{
      const key=s.dataset.p;
      s.value=defaults[key];
      const dp=(key==='numTrails')?0:(key==='colSpeed'||key==='spkDrift'||key==='spkSize')?3:2;
      s.parentElement.querySelector('span').textContent=parseFloat(defaults[key]).toFixed(dp);
    });
    if(window.NEON_setPalette)window.NEON_setPalette([[0xC8/255,0x10/255,0x2E/255],[0xF2/255,0xC7/255,0xD1/255],[0x8B/255,0x1A/255,0x1A/255],[0xE6/255,0x39/255,0x51/255]]);
    syncSwatches();
  });

  // ── COPY SETTINGS (export the whole config as a paste-ready block) ──
  function buildExport(){
    const parts=[...sliders].map(s=>{
      const k=s.dataset.p;
      const dp=(k==='numTrails')?0:(k==='colSpeed'||k==='spkDrift'||k==='spkSize')?3:2;
      return k+': '+parseFloat(window.NEON[k]).toFixed(dp);
    });
    parts.push('shape: '+(window.NEON.shape|0));
    const pal=(window.NEON_getPalette?window.NEON_getPalette():[])
      .map(c=>'['+c.map(v=>parseFloat(v.toFixed(3))).join(', ')+']');
    return 'Object.assign(window.NEON, { '+parts.join(', ')+' });\n'
         + 'window.NEON_setPalette([ '+pal.join(', ')+' ]);';
  }
  function copyText(txt){
    if(navigator.clipboard&&navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');}catch(e){}
    document.body.removeChild(ta);return Promise.resolve();
  }
  const copyBtn=document.getElementById('panelCopy');
  copyBtn.addEventListener('click',e=>{
    e.stopPropagation();
    copyText(buildExport()).then(()=>{
      const o=copyBtn.innerHTML;copyBtn.textContent='copied ✓';
      setTimeout(()=>{copyBtn.innerHTML=o;},1400);
    });
  });

  // ── COLOUR SWATCHES ──
  const swatches=panel.querySelectorAll('.pal-swatch');
  function hexToRgb01(hex){
    return [parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255];
  }
  function rgb01ToHex(c){
    return '#'+c.map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
  }
  function syncSwatches(){
    if(!window.NEON_getPalette)return;
    const pal=window.NEON_getPalette();
    swatches.forEach((s,i)=>{s.value=rgb01ToHex(pal[i])});
  }
  swatches.forEach(s=>{
    s.addEventListener('input',()=>{
      if(!window.NEON_setColor)return;
      window.NEON_setColor(parseInt(s.dataset.i),hexToRgb01(s.value));
    });
    s.addEventListener('click',e=>e.stopPropagation());
  });
  // keep swatches in sync when canvas click shuffles the palette
  document.body.addEventListener('click',()=>{setTimeout(syncSwatches,50)});
  document.addEventListener('keydown',e=>{if(e.key==='b'||e.key==='B')setTimeout(syncSwatches,50)});
  syncSwatches();

  // show which device profile applied
  const noteEl=panel.querySelector('.panel-note');
  if(noteEl&&window.NEON_profile)noteEl.textContent+=' · profile: '+window.NEON_profile;

  // ── THEME TOGGLE ──
  document.getElementById('panelTheme').addEventListener('click',()=>{
    if(!window.NEON_setTheme)return;
    window.NEON_setTheme(window.NEON_getTheme()==='dark'?'light':'dark');
    setTimeout(syncSwatches,600);
  });

  // ── RANDOMISE COLOURS ──
  document.getElementById('panelColours').addEventListener('click',()=>{
    if(window.NEON_shufflePalette){window.NEON_shufflePalette();setTimeout(syncSwatches,50);}
  });

  // ── RANDOMISE ALL SLIDERS ──
  document.getElementById('panelRandom').addEventListener('click',()=>{
    sliders.forEach(s=>{
      const key=s.dataset.p;
      const mn=parseFloat(s.min),mx=parseFloat(s.max),st=parseFloat(s.step);
      let v=mn+Math.random()*(mx-mn);
      v=Math.round(v/st)*st;
      s.value=v;
      window.NEON[key]=v;
      const dp=(key==='numTrails')?0:(key==='colSpeed'||key==='spkDrift'||key==='spkSize')?3:2;
      s.parentElement.querySelector('span').textContent=v.toFixed(dp);
    });
  });
})();
})();
