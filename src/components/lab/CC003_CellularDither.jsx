import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
if (typeof window !== 'undefined') window.p5 = p5;

const THEMES = [
  { id: 'cosmic-light', bg: '#FFF8e7', text: '#000000', accent: '#D32F2F', accentText: '#FFF8e7', dFg: [0,0,0], dBg: [255,248,231] },
  { id: 'cosmic-dark', bg: '#000000', text: '#FFF8e7', accent: '#D32F2F', accentText: '#FFF8e7', dFg: [255,248,231], dBg: [0,0,0] },
  { id: 'systematic-light', bg: '#001f3f', text: '#FFF8e7', accent: '#FFF8e7', accentText: '#D32F2F', dFg: [211,47,47], dBg: [0,31,63] },
  { id: 'systematic-dark', bg: '#D32F2F', text: '#FFF8e7', accent: '#FFF8e7', accentText: '#001f3f', dFg: [0,31,63], dBg: [211,47,47] },
  { id: 'cyan-dark', bg: '#0000FF', text: '#00FFFF', accent: '#00FFFF', accentText: '#0000FF', dFg: [0,255,255], dBg: [0,0,255] },
  { id: 'cyan-light', bg: '#00FFFF', text: '#0000FF', accent: '#0000FF', accentText: '#00FFFF', dFg: [0,0,255], dBg: [0,255,255] }
];

export default function CC003_CellularDither() {
  const wrapperRef = useRef();
  const p5Instance = useRef(null);

  const [settings, setSettings] = useState({
    themeIndex: 3,
    golRunning: false,
    golMode: 'continuous',
    detail: 0.5,
    pixelSize: 10,
    golSpeed: 5,
  });

  const t = THEMES[settings.themeIndex];

  const styles = {
    primaryBtn: { background: t.accent, color: t.accentText, border: `1px solid ${t.accent}` },
    secondaryBtn: { background: 'transparent', color: t.text, border: `1px solid ${t.text}` },
    inputRange: { accentColor: t.accent },
    section: { backgroundColor: t.bg },
    sidebar: { backgroundColor: t.bg, color: t.text, borderLeft: `1px solid ${t.text}33` }
  };

  const updateSetting = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!wrapperRef.current) return;

    const sketch = (p) => {
      let capture;
      let ditherEffect;
      let GOL = { cols: 0, rows: 0, grid: [], next: [] };
      let lockedSeedImage = null;
      let s = { ...settings };
      let currentTheme = THEMES[s.themeIndex];

      p._updateSettings = (ns) => {
        const prevTheme = s.themeIndex;
        const prevPixelSize = s.pixelSize;
        const prevDetail = s.detail;
        const prevGolRunning = s.golRunning;
        
        s = ns;
        
        if (prevTheme !== s.themeIndex) {
          currentTheme = THEMES[s.themeIndex];
          if (ditherEffect) ditherEffect.setPalette(currentTheme.dFg, currentTheme.dBg);
        }
        if (prevPixelSize !== s.pixelSize && s.golRunning) {
          initGolGrid();
          lockedSeedImage = null;
        }
        if (prevDetail !== s.detail && s.golRunning && s.golMode === 'lock') {
          lockedSeedImage = null;
        }
        if (prevGolRunning !== s.golRunning) {
          if (s.golRunning) initGolGrid();
          else { GOL.grid = []; GOL.next = []; lockedSeedImage = null; }
        }
      };

      p._exportPng = () => {
        const canvasElement = wrapperRef.current ? wrapperRef.current.querySelector('canvas') : null;
        if (canvasElement) {
          try {
            const link = document.createElement('a');
            link.download = `cellular-dither-${Date.now()}.png`;
            link.href = canvasElement.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
          } catch (e) {
            console.error("DOM export failed, using fallback", e);
          }
        }
        
        try {
          p.saveCanvas('cellular-dither', 'png');
        } catch (e) {
          console.error("p5 saveCanvas failed", e);
        }
      };

      class DitherEffect {
        constructor() { this.palette = [[0,0,0],[255,255,255]]; }
        setPalette(f,b) { this.palette = [f.slice(), b.slice()]; }
        apply(src) {
          src.loadPixels();
          const w = src.width, h = src.height;
          const dst = p.createImage(w, h);
          dst.loadPixels();
          const buf = new Float32Array(src.pixels.length);
          for(let i=0;i<src.pixels.length;i++) buf[i] = src.pixels[i];
          const binary = new Uint8Array(w*h);
          
          for (let y=0;y<h;y++){
            for (let x=0;x<w;x++){
              const i = (x+y*w)*4;
              const oldGray = (buf[i] + buf[i+1] + buf[i+2]) / 3;
              const newGray = oldGray < 128 ? 0 : 255;
              const idx = newGray === 0 ? 0 : 1;
              const col = this.palette[idx];
              
              dst.pixels[i] = col[0]; dst.pixels[i+1] = col[1]; dst.pixels[i+2] = col[2]; dst.pixels[i+3] = 255;
              binary[x+y*w] = idx === 0 ? 1 : 0;
              
              const err = oldGray - newGray;
              const spread = (dx,dy,fac) => {
                const nx = x+dx, ny = y+dy;
                if(nx>=0 && nx<w && ny>=0 && ny<h) {
                  const ni = (nx+ny*w)*4;
                  buf[ni] += err*fac; buf[ni+1] += err*fac; buf[ni+2] += err*fac;
                }
              };
              spread(1,0,7/16); spread(-1,1,3/16); spread(0,1,5/16); spread(1,1,1/16);
            }
          }
          dst.updatePixels();
          return { image: dst, binary, width: w, height: h };
        }
      }

      function initGolGrid() {
        const cs = Math.max(2, s.pixelSize);
        GOL.cols = Math.ceil(p.width / cs);
        GOL.rows = Math.ceil(p.height / cs);
        GOL.grid = new Array(GOL.cols).fill(0).map(()=>new Array(GOL.rows).fill(0));
        GOL.next = new Array(GOL.cols).fill(0).map(()=>new Array(GOL.rows).fill(0));
      }

      function seedGol(binary, bw, bh) {
        if (!GOL.grid.length || GOL.grid.length !== GOL.cols) initGolGrid();
        for(let x=0;x<GOL.cols;x++){
          for(let y=0;y<GOL.rows;y++){
            let sx = Math.floor((x / GOL.cols) * bw);
            let sy = Math.floor((y / GOL.rows) * bh);
            sx = Math.max(0, Math.min(sx, bw - 1));
            sy = Math.max(0, Math.min(sy, bh - 1));
            GOL.grid[x][y] = binary[sx + sy * bw];
          }
        }
      }

      function stepGol() {
        if (!GOL.grid.length) return;
        for(let x=0;x<GOL.cols;x++){
          for(let y=0;y<GOL.rows;y++){
            let n = 0;
            for(let ox=-1;ox<=1;ox++) for(let oy=-1;oy<=1;oy++){
              if(ox===0 && oy===0) continue;
              const nx=x+ox, ny=y+oy;
              if(nx>=0 && nx<GOL.cols && ny>=0 && ny<GOL.rows) n+=GOL.grid[nx][ny];
            }
            if(GOL.grid[x][y]===1) GOL.next[x][y] = (n===2 || n===3)?1:0;
            else GOL.next[x][y] = (n===3)?1:0;
          }
        }
        const temp = GOL.grid; GOL.grid = GOL.next; GOL.next = temp;
      }

      p.setup = () => {
        const w = wrapperRef.current.offsetWidth || window.innerWidth / 2;
        const h = wrapperRef.current.offsetHeight || window.innerHeight;
        p.createCanvas(w, h).parent(wrapperRef.current);
        p.noSmooth();
        
        capture = p.createCapture({
          video: { facingMode: 'user' },
          audio: false
        });
        capture.hide();
        
        ditherEffect = new DitherEffect();
        ditherEffect.setPalette(currentTheme.dFg, currentTheme.dBg);
        
        initGolGrid();
        
        const ro = new ResizeObserver(() => {
          if (wrapperRef.current) {
            p.resizeCanvas(wrapperRef.current.offsetWidth, wrapperRef.current.offsetHeight);
            if (s.golRunning || !GOL.grid.length) initGolGrid();
          }
        });
        ro.observe(wrapperRef.current);
      };

      p.draw = () => {
        const speedMap = [60, 30, 15, 10, 6, 4, 3, 2, 1, 1];
        const skip = speedMap[s.golSpeed - 1] || 1;
        
        p.background(currentTheme.dBg[0], currentTheme.dBg[1], currentTheme.dBg[2]);

        if (!capture || !capture.loadedmetadata || capture.width === 0) return;

        const camAspect = capture.width / capture.height;
        const canvasAspect = p.width / p.height;
        let drawW, drawH;
        if (canvasAspect > camAspect) {
          drawW = p.width;
          drawH = p.width / camAspect;
        } else {
          drawH = p.height;
          drawW = p.height * camAspect;
        }
        
        const detailSteps = p.map(s.detail, 0, 1, 8, 1);
        const pixelStep = Math.max(1, Math.round(detailSteps));
        
        let src = capture.get();
        const cropX = (src.width - src.width * (p.width / drawW)) / 2;
        const cropY = (src.height - src.height * (p.height / drawH)) / 2;
        const cropW = src.width * (p.width / drawW);
        const cropH = src.height * (p.height / drawH);
        
        if (cropW > 0 && cropH > 0) {
          let cropped = p.createImage(Math.floor(cropW), Math.floor(cropH));
          cropped.copy(src, Math.floor(cropX), Math.floor(cropY), Math.floor(cropW), Math.floor(cropH), 0, 0, Math.floor(cropW), Math.floor(cropH));
          src = cropped;
        }

        const tempW = Math.max(2, Math.floor(p.width / pixelStep));
        const tempH = Math.max(2, Math.floor(p.height / pixelStep));
        src.resize(tempW, tempH);
        
        const dithered = ditherEffect.apply(src);

        if (s.golRunning) {
          if (p.frameCount % skip === 0) {
            if (s.golMode === 'continuous') seedGol(dithered.binary, dithered.width, dithered.height);
            else { if (!lockedSeedImage) { lockedSeedImage = dithered; seedGol(dithered.binary, dithered.width, dithered.height); } }
            stepGol();
          }
          p.noStroke(); p.fill(currentTheme.dFg[0], currentTheme.dFg[1], currentTheme.dFg[2]);
          const cs = Math.max(2, s.pixelSize);
          if (GOL.grid.length && GOL.cols > 0) {
            for(let x=0;x<GOL.cols;x++)
              for(let y=0;y<GOL.rows;y++)
                if(GOL.grid[x][y]) p.rect(x*cs, y*cs, cs, cs);
          }
        } else {
          p.image(dithered.image, 0, 0, p.width, p.height);
        }
      };
    };
    p5Instance.current = new p5(sketch);
    return () => { p5Instance.current.remove(); };
  }, []);

  useEffect(() => {
    if (p5Instance.current && p5Instance.current._updateSettings) {
      p5Instance.current._updateSettings(settings);
    }
  }, [settings]);

  return (
    <>
      <section style={styles.section} className="order-2 lg:order-2 sticky lg:relative top-[70px] lg:top-auto z-20 lg:z-auto w-full lg:w-1/2 h-[45vh] min-h-[300px] md:h-auto md:min-h-[60vh] lg:min-h-screen flex items-center justify-center p-4 md:p-8 shrink-0 transition-colors duration-300">
        <div id="canvas-wrapper" ref={wrapperRef} className="w-full h-full flex items-center justify-center overflow-hidden"></div>
      </section>

      <aside 
        data-lenis-prevent="true"
        style={styles.sidebar} 
        className="order-3 lg:order-3 w-full lg:w-1/4 lg:h-screen lg:max-h-[100vh] lg:sticky lg:top-0 border-t lg:border-t-0 lg:border-l overflow-y-visible lg:overflow-y-auto p-6 font-sans transition-colors duration-300"
      >
        <h3 className="font-mono text-lg mb-6 tracking-wider">CELLULAR DITHER</h3>

        {/* Theme Dropdown matches original "one button" style */}
        <div className="mb-6">
          <select 
            style={styles.secondaryBtn}
            value={settings.themeIndex}
            onChange={(e) => updateSetting('themeIndex', parseInt(e.target.value))}
            className="w-full uppercase text-[10px] font-bold p-2 rounded-sm outline-none cursor-pointer"
          >
            {THEMES.map((th, i) => <option key={i} value={i}>{th.id}</option>)}
          </select>
        </div>

        <div className="mb-6 space-y-4">
          <h4 className="font-mono text-[10px] uppercase opacity-50 border-b pb-1" style={{ borderColor: `${t.text}33` }}>Adjustments</h4>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] uppercase font-bold opacity-60">Detail</span>
              <span style={{color: t.accent}} className="text-[10px] font-bold">{settings.detail.toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={settings.detail} onChange={e => updateSetting('detail', parseFloat(e.target.value))} style={styles.inputRange} className="w-full" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] uppercase font-bold opacity-60">Pixel Size</span>
              <span style={{color: t.accent}} className="text-[10px] font-bold">{settings.pixelSize}px</span>
            </div>
            <input type="range" min="2" max="40" step="1" value={settings.pixelSize} onChange={e => updateSetting('pixelSize', parseInt(e.target.value))} style={styles.inputRange} className="w-full" />
          </div>
        </div>

        {/* GAME OF LIFE TOGGLE */}
        <div className="mb-6 border p-4 rounded-sm" style={{ borderColor: `${t.text}33` }}>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={settings.golRunning} onChange={(e) => updateSetting('golRunning', e.target.checked)} className="hidden" />
            <div className="w-10 h-5 rounded-full relative transition-colors" style={{ backgroundColor: settings.golRunning ? t.accent : t.text }}>
              <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-transform ${settings.golRunning ? 'translate-x-5' : 'translate-x-0'}`} style={{ backgroundColor: t.bg }}></div>
            </div>
            <span className="text-sm font-bold uppercase">Game of Life</span>
          </label>

          {settings.golRunning && (
            <div className="flex flex-col gap-4">
              <select 
                style={styles.secondaryBtn}
                value={settings.golMode}
                onChange={(e) => updateSetting('golMode', e.target.value)}
                className="w-full uppercase text-[10px] font-bold p-2 rounded-sm outline-none cursor-pointer"
              >
                <option value="continuous">Reseed (Continuous)</option>
                <option value="lock">Evolve (Lock Frame)</option>
              </select>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold opacity-60">Sim Speed</span>
                  <span style={{color: t.accent}} className="text-[10px] font-bold">{settings.golSpeed}</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={settings.golSpeed} onChange={e => updateSetting('golSpeed', parseInt(e.target.value))} style={styles.inputRange} className="w-full" />
              </div>
            </div>
          )}
        </div>

        <button 
          style={styles.secondaryBtn}
          onClick={() => p5Instance.current && p5Instance.current._exportPng && p5Instance.current._exportPng()}
          className="w-full mt-4 uppercase text-[10px] font-bold py-3 rounded-sm hover:opacity-80 transition-opacity"
        >
          Export PNG
        </button>
      </aside>
    </>
  );
}
