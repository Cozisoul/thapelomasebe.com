// =====================================================
//  SYS_DEGRADE — p5.js Instance Mode Port
//  Sobel Edge Detection + ASCII Luminance Mapping
//  Ported from ascii-expiriments/sketch.js for Astro island
// =====================================================

/**
 * Factory function that returns a p5 instance-mode sketch.
 * @param {Object} config - { scene: number, theme: string, cellSize: number, mirror: boolean }
 * @returns {Function} p5 instance-mode sketch function
 */
export function createSysDegradeSketch(config = {}) {
  const initialScene = config.scene || 0;
  const initialTheme = config.theme || 'matrix';
  const initialCellSize = config.cellSize || 6;
  const initialMirror = config.mirror !== undefined ? config.mirror : true;

  return function sketch(p) {
    let cam, manager;

    // ---------- THEMES ----------
    const THEMES = {
      matrix:    { fg: '#00ff66', bg: '#000000', accent: '#00ff66', chars: ' .:-=+*#%@' },
      newspaper: { fg: '#000000', bg: '#f5f1e8', accent: '#000000', chars: ' .░▒▓█' },
      vaporwave: { fg: '#ff66cc', bg: '#1a0033', accent: '#66ffff', chars: ' .:-=+*#%@' },
      risograph: { fg: '#ff4d3d', bg: '#fef6e4', accent: '#3d5aff', chars: ' .░▒▓█' },
      solarized: { fg: '#b58900', bg: '#002b36', accent: '#268bd2', chars: ' .,:;i1tfLCG08@' },
      amber:     { fg: '#ffb000', bg: '#1a0f00', accent: '#ffb000', chars: ' .:-=+*#%@' },
    };

    const settings = {
      charSet:     ' .:-=+*#%@',
      fgColor:     '#00ff66',
      bgColor:     '#000000',
      accentColor: '#00ff66',
      cellSize:    initialCellSize,
      mirror:      initialMirror,
    };

    const fg     = () => p.color(settings.fgColor);
    const bg     = () => p.color(settings.bgColor);
    const accent = () => p.color(settings.accentColor);
    const chrs   = () => settings.charSet || ' .:-=+*#%@';
    const cs     = () => settings.cellSize;

    function brightnessAt(px, x, y, w) {
      const i = (x + y * w) * 4;
      return (px[i] + px[i+1] + px[i+2]) / 3;
    }

    function clipRect(x, y, w, h) {
      p.drawingContext.beginPath();
      p.drawingContext.rect(x, y, w, h);
      p.drawingContext.clip();
    }

    function frameRect() {
      const pad = p.width * 0.06;
      return { x: pad, y: pad * 1.5, w: p.width - 2*pad, h: p.height - 3*pad };
    }

    function sobelGrid(px, w, h) {
      const out = new Float32Array(w * h * 2);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = (x + y * w) * 4;
          const tl=px[i-4-w*4], t=px[i-w*4], tr=px[i+4-w*4];
          const l =px[i-4],                   r =px[i+4];
          const bl=px[i-4+w*4], b=px[i+w*4],  br=px[i+4+w*4];
          const k = (x + y * w) * 2;
          out[k]   = -tl - 2*l - bl + tr + 2*r + br;
          out[k+1] = -tl - 2*t - tr + bl + 2*b + br;
        }
      }
      return out;
    }

    function applyTheme(name) {
      const t = THEMES[name]; if (!t) return;
      settings.fgColor = t.fg;
      settings.bgColor = t.bg;
      settings.accentColor = t.accent;
      settings.charSet = t.chars;
    }

    // ---------- SCENE BASE ----------
    class Scene {
      constructor(name) { this.name = name; }
      setup() {} draw() {} cleanup() {} keyPressed() {} mousePressed() {}
    }

    // ========== 1. RANDOM ASCII ==========
    class RandomAsciiScene extends Scene {
      constructor() { super("Random ASCII"); this.useCamera = false; }
      setup() { p.frameRate(5); }
      cleanup() { p.frameRate(60); }
      keyPressed() {
        if (p.key && p.key.toLowerCase() === 'c') this.useCamera = !this.useCamera;
      }
      draw() {
        p.background(bg());
        const f = frameRect();
        p.noFill(); p.stroke(accent()); p.strokeWeight(2);
        p.rect(f.x, f.y, f.w, f.h);
        p.drawingContext.save(); clipRect(f.x, f.y, f.w, f.h);
        p.fill(fg()); p.noStroke();
        p.textFont('monospace'); p.textSize(cs() * 1.5); p.textAlign(p.LEFT, p.TOP);
        const s = chrs();

        if (this.useCamera) {
          cam.loadPixels();
          if (cam.pixels && cam.pixels.length) {
            const stepX = cs() * 1.2;
            const stepY = cs() * 1.6;
            const cols = p.floor((f.w - 8) / stepX);
            const rows = p.floor((f.h - 8) / stepY);
            const csx = cam.width / cols, csy = cam.height / rows;
            for (let y = 0; y < rows; y++) {
              for (let x = 0; x < cols; x++) {
                const cx = settings.mirror ? cols - 1 - x : x;
                const px = p.floor(cx * csx), py = p.floor(y * csy);
                const b = brightnessAt(cam.pixels, px, py, cam.width);
                if (b > 60) {
                  const dx = f.x + 4 + x * stepX;
                  const dy = f.y + 4 + y * stepY;
                  p.text(s.charAt(p.floor(p.random(s.length))), dx, dy);
                }
              }
            }
          }
        } else {
          for (let y = f.y + 4; y < f.y + f.h - 4; y += cs() * 1.6)
            for (let x = f.x + 4; x < f.x + f.w - 4; x += cs() * 1.2)
              p.text(s.charAt(p.floor(p.random(s.length))), x, y);
        }
        p.drawingContext.restore();
        
        p.fill(accent()); p.textSize(12); p.textAlign(p.RIGHT, p.BOTTOM); p.textFont('sans-serif'); p.noStroke();
        p.text("Press 'C' to toggle camera", f.x + f.w - 10, f.y + f.h - 10);
      }
    }

    // ========== 2. MATRIX SCROLL ==========
    class MatrixScrollScene extends Scene {
      constructor() { super("Matrix Camera Scroll"); this.offset = 0; }
      setup() { this.offset = 0; }
      draw() {
        p.background(bg());
        cam.loadPixels(); if (!cam.pixels.length) return;
        const f = frameRect();
        p.drawingContext.save(); clipRect(f.x, f.y, f.w, f.h);
        p.fill(fg()); p.noStroke();
        p.textFont('monospace'); p.textSize(cs() * 1.4); p.textAlign(p.LEFT, p.TOP);
        const s = chrs();
        const cell = cs();
        const cols = p.floor(f.w / cell), rows = p.floor(f.h / cell);
        const csx = cam.width / cols, csy = cam.height / rows;
        const shift = p.floor(this.offset / cell);
        const sub = this.offset % cell;
        for (let y = -1; y <= rows; y++) {
          for (let x = 0; x < cols; x++) {
            const cy = ((y - shift) % rows + rows) % rows;
            const cx = settings.mirror ? cols - 1 - x : x;
            const b = brightnessAt(cam.pixels, p.floor(cx*csx), p.floor(cy*csy), cam.width);
            const ci = p.constrain(p.floor(p.map(b, 0, 255, s.length-1, 0)), 0, s.length-1);
            p.text(s[ci], f.x + x*cell, f.y + y*cell + sub);
          }
        }
        p.drawingContext.restore();
        p.noFill(); p.stroke(accent()); p.strokeWeight(2); p.rect(f.x, f.y, f.w, f.h);
        this.offset += 2;
      }
    }

    // ========== 3. EDGE FLOW ==========
    class EdgeFlowScene extends Scene {
      constructor() { super("Edge Flow"); this.offset = 0; }
      setup() { this.offset = 0; }
      draw() {
        p.background(bg());
        cam.loadPixels(); if (!cam.pixels.length) return;
        const edges = sobelGrid(cam.pixels, cam.width, cam.height);
        const f = frameRect();
        p.drawingContext.save(); clipRect(f.x, f.y, f.w, f.h);
        p.textFont('monospace'); p.textSize(cs() * 1.2); p.textAlign(p.LEFT, p.TOP); p.noStroke();
        const s = chrs();
        const cell = cs();
        const cols = p.floor(f.w / cell), rows = p.floor(f.h / cell);
        const csx = cam.width / cols, csy = cam.height / rows;
        const colFG = fg();
        const colAccent = accent();
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const cx = settings.mirror ? cols - 1 - x : x;
            const px = p.floor(cx*csx), py = p.floor(y*csy);
            const ei = (px + py * cam.width) * 2;
            const mag = p.sqrt(edges[ei]**2 + edges[ei+1]**2);
            const b = brightnessAt(cam.pixels, px, py, cam.width);
            if (mag > 80) { p.fill(colAccent); p.text('#', f.x + x*cell, f.y + y*cell); continue; }
            const yOff = b < 128 ? this.offset : -this.offset;
            p.fill(colFG);
            const ci = p.constrain(p.floor(p.map(b, 0, 255, s.length-1, 0)), 0, s.length-1);
            p.text(s[ci], f.x + x*cell, f.y + ((y*cell + yOff) % f.h + f.h) % f.h);
          }
        }
        p.drawingContext.restore();
        p.noFill(); p.stroke(accent()); p.strokeWeight(2); p.rect(f.x, f.y, f.w, f.h);
        this.offset += 1.5;
      }
    }

    // ========== 4. DUAL RECT ==========
    class DualRectScene extends Scene {
      constructor() { super("Dual Rect: Noise + Camera"); }
      setup() { p.frameRate(15); }
      cleanup() { p.frameRate(60); }
      draw() {
        p.background(bg());
        cam.loadPixels(); if (!cam.pixels.length) return;
        const f = frameRect();
        const gap = f.h * 0.05;
        const rh = (f.h - gap) / 2;

        this.drawRect(f.x, f.y, f.w, rh, () => {
          p.fill(fg()); p.textSize(cs() * 1.5);
          const s = chrs();
          for (let yy = 4; yy < rh - 4; yy += cs() * 1.6)
            for (let xx = 4; xx < f.w - 4; xx += cs() * 1.2)
              p.text(s.charAt(p.floor(p.random(s.length))), f.x + xx, f.y + yy);
        });

        const by = f.y + rh + gap;
        this.drawRect(f.x, by, f.w, rh, () => {
          p.fill(fg()); p.textSize(cs() * 1.4);
          const s = chrs();
          const cols = p.floor(f.w / cs()), rows = p.floor(rh / cs());
          const csx = cam.width / cols, csy = cam.height / rows;
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              const cx = settings.mirror ? cols - 1 - x : x;
              const b = brightnessAt(cam.pixels, p.floor(cx * csx), p.floor(y * csy), cam.width);
              const ci = p.constrain(p.floor(p.map(b, 0, 255, s.length - 1, 0)), 0, s.length - 1);
              p.text(s[ci], f.x + x * cs(), by + y * cs());
            }
          }
        });
      }

      drawRect(x, y, w, h, drawFn) {
        p.noFill(); p.stroke(accent()); p.strokeWeight(2); p.rect(x, y, w, h);
        p.drawingContext.save(); clipRect(x, y, w, h);
        p.noStroke(); p.textFont('monospace'); p.textAlign(p.LEFT, p.TOP);
        drawFn();
        p.drawingContext.restore();
      }
    }

    // ========== 5. HALFTONE COLOR-QUANTIZED ==========
    class HalftoneScene extends Scene {
      constructor() { super("Halftone Quantized"); }
      draw() {
        p.background(bg());
        cam.loadPixels(); if (!cam.pixels.length) return;
        const f = frameRect();
        const cell = cs();
        const cols = p.floor(f.w / cell), rows = p.floor(f.h / cell);
        const csx = cam.width / cols, csy = cam.height / rows;
        const fgc = p.color(settings.fgColor), acc = p.color(settings.accentColor), bgc = p.color(settings.bgColor);
        const palette = [
          [p.red(fgc), p.green(fgc), p.blue(fgc)],
          [p.red(acc), p.green(acc), p.blue(acc)],
          [p.red(bgc), p.green(bgc), p.blue(bgc)].map(v => 255 - v),
          [20, 20, 20],
        ];
        const s = chrs();
        p.noStroke(); p.textFont('sans-serif'); p.textAlign(p.CENTER, p.CENTER);
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const cx = settings.mirror ? cols - 1 - x : x;
            const px = p.floor(cx * csx), py = p.floor(y * csy);
            const i = (px + py * cam.width) * 4;
            const r = cam.pixels[i], g = cam.pixels[i + 1], b = cam.pixels[i + 2];
            const br = (r + g + b) / 3;
            const sz = p.map(br, 0, 255, cell * 1.5, 1);
            const ci = p.constrain(p.floor(p.map(br, 0, 255, s.length - 1, 0)), 0, s.length - 1);
            let best = palette[0], bd = Infinity;
            for (const p_c of palette) {
              const d = (r - p_c[0]) ** 2 + (g - p_c[1]) ** 2 + (b - p_c[2]) ** 2;
              if (d < bd) { bd = d; best = p_c; }
            }
            p.fill(best[0], best[1], best[2]);
            p.textSize(sz);
            p.text(s[ci], f.x + x * cell + cell / 2, f.y + y * cell + cell / 2);
          }
        }
        p.noFill(); p.stroke(accent()); p.strokeWeight(3); p.rect(f.x, f.y, f.w, f.h);
      }
    }

    // ========== 6. RISING ASCII BUBBLES ==========
    class BubblesScene extends Scene {
      constructor() { super("Rising ASCII Bubbles"); this.bubbles = []; }
      setup() {
        this.bubbles = [];
        for (let i = 0; i < 8; i++) this.bubbles.push(this.makeBubble(p.random(p.height, p.height * 2)));
      }
      makeBubble(startY) {
        const r = p.random(p.width * 0.05, p.width * 0.15);
        return {
          x: p.random(60, p.width - 60), y: startY, r,
          speed: p.map(r, p.width * 0.05, p.width * 0.15, 1.5, 0.4),
          wAmp: p.random(8, 22), wSpd: p.random(0.015, 0.04), wPh: p.random(p.TWO_PI),
          popping: false, popFrame: 0
        };
      }
      draw() {
        p.background(bg());
        cam.loadPixels(); if (!cam.pixels.length) return;
        p.noStroke(); p.textFont('monospace'); p.textSize(cs() * 0.7); p.textAlign(p.CENTER, p.CENTER);
        const s = chrs();
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
          const b = this.bubbles[i];
          if (b.popping) {
            const t = b.popFrame / 12;
            const fgc = fg();
            p.noFill(); p.stroke(p.red(fgc), p.green(fgc), p.blue(fgc), (1 - t) * 255); p.strokeWeight(2);
            p.ellipse(b.x, b.y, (b.r + t * 30) * 2);
            b.popFrame++;
            if (b.popFrame > 12) this.bubbles[i] = this.makeBubble(p.height + p.random(20, 200));
            continue;
          }
          const wob = p.sin(p.frameCount * b.wSpd + b.wPh) * b.wAmp;
          const cx = b.x + wob, cy = b.y;
          p.drawingContext.save();
          p.drawingContext.beginPath();
          p.drawingContext.arc(cx, cy, b.r, 0, p.TWO_PI);
          p.drawingContext.clip();
          p.fill(fg()); p.noStroke();
          const cell = p.max(3, cs() * 0.6);
          const cols = p.floor(b.r * 2 / cell), rows = p.floor(b.r * 2 / cell);
          const csx = cam.width / cols, csy = cam.height / rows;
          for (let yy = 0; yy < rows; yy++) {
            for (let xx = 0; xx < cols; xx++) {
              const mx = settings.mirror ? cols - 1 - xx : xx;
              const br = brightnessAt(cam.pixels, p.floor(mx * csx), p.floor(yy * csy), cam.width);
              const ci = p.constrain(p.floor(p.map(br, 0, 255, s.length - 1, 0)), 0, s.length - 1);
              p.text(s[ci], cx - b.r + xx * cell + cell / 2, cy - b.r + yy * cell + cell / 2);
            }
          }
          p.drawingContext.restore();
          p.noFill(); p.stroke(accent()); p.strokeWeight(1); p.ellipse(cx, cy, b.r * 2);
          b.y -= b.speed;
          if (b.y + b.r < 0) this.bubbles[i] = this.makeBubble(p.height + p.random(20, 200));
        }
      }
      mousePressed() {
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
          const b = this.bubbles[i];
          if (b.popping) continue;
          const wob = p.sin(p.frameCount * b.wSpd + b.wPh) * b.wAmp;
          if (p.dist(p.mouseX, p.mouseY, b.x + wob, b.y) < b.r) { b.popping = true; b.popFrame = 0; break; }
        }
      }
    }

    // ========== 7. EDGE-ONLY DIRECTIONAL ==========
    class EdgeOnlyScene extends Scene {
      constructor() { super("Edge-Only Directional"); }
      draw() {
        p.background(bg());
        cam.loadPixels(); if (!cam.pixels.length) return;
        const edges = sobelGrid(cam.pixels, cam.width, cam.height);
        const f = frameRect();
        const cell = cs();
        const cols = p.floor(f.w / cell), rows = p.floor(f.h / cell);
        const csx = cam.width/cols, csy = cam.height/rows;
        const ec = ['/','\\','|','—','+','x','*','#'];
        p.drawingContext.save(); clipRect(f.x, f.y, f.w, f.h);
        p.fill(fg()); p.noStroke(); p.textFont('monospace'); p.textSize(cell*1.3); p.textAlign(p.CENTER, p.CENTER);
        for (let y = 1; y < rows-1; y++) {
          for (let x = 1; x < cols-1; x++) {
            const cx = settings.mirror ? cols-1-x : x;
            const px = p.floor(cx*csx), py = p.floor(y*csy);
            const ei = (px + py*cam.width) * 2;
            let dx = edges[ei];
            let dy = edges[ei+1];
            if (settings.mirror) dx = -dx;
            const mag = p.sqrt(dx**2 + dy**2);
            if (mag < 50) continue;
            const ang = p.atan2(-dy, dx), a = p.abs(ang);
            let ci;
            if (mag < 120) {
              if (a < p.PI/8 || a > 7*p.PI/8) ci = 3;
              else if (a > 3*p.PI/8 && a < 5*p.PI/8) ci = 2;
              else ci = ang > 0 ? 0 : 1;
            } else ci = p.constrain(p.floor(p.map(mag, 120, 400, 4, 7)), 4, 7);
            p.text(ec[ci], f.x + x*cell + cell/2, f.y + y*cell + cell/2);
          }
        }
        p.drawingContext.restore();
        p.noFill(); p.stroke(accent()); p.strokeWeight(2); p.rect(f.x, f.y, f.w, f.h);
      }
    }

    // ========== 8. EDGE + COLORED SHAPES ==========
    class EdgeShapesScene extends Scene {
      constructor() { super("Edge ASCII + Colored Shapes"); }
      draw() {
        p.background(bg());
        cam.loadPixels(); if (!cam.pixels.length) return;
        const edges = sobelGrid(cam.pixels, cam.width, cam.height);
        const f = frameRect();
        const cell = cs();
        const cols = p.floor(f.w / cell), rows = p.floor(f.h / cell);
        const csx = cam.width / cols, csy = cam.height / rows;

        const ccx = p.constrain(p.mouseX || p.width / 2, f.x, f.x + f.w);
        const ccy = p.constrain(p.mouseY || p.height / 2, f.y, f.y + f.h);
        const cR = f.w * 0.15;
        const sX = f.x + f.w / 2 - (f.w * 0.15) + p.cos(p.frameCount * 0.018) * (f.w * 0.1);
        const sY = f.y + f.h / 2 + (f.h * 0.1) + p.sin(p.frameCount * 0.022) * (f.h * 0.1);
        const sS = f.w * 0.25;

        p.drawingContext.save(); clipRect(f.x, f.y, f.w, f.h);
        p.noStroke(); p.textFont('monospace'); p.textSize(cell * 1.3); p.textAlign(p.CENTER, p.CENTER);
        for (let y = 1; y < rows - 1; y++) {
          for (let x = 1; x < cols - 1; x++) {
            const cx = settings.mirror ? cols - 1 - x : x;
            const px = p.floor(cx * csx), py = p.floor(y * csy);
            const ei = (px + py * cam.width) * 2;
            const mag = p.sqrt(edges[ei] ** 2 + edges[ei + 1] ** 2);
            if (mag < 50) continue;
            const ang = p.atan2(-edges[ei + 1], edges[ei]), a = p.abs(ang);
            let ch = '+';
            if (a < p.PI / 8 || a > 7 * p.PI / 8) ch = '—';
            else if (a > 3 * p.PI / 8 && a < 5 * p.PI / 8) ch = '|';
            else ch = ang > 0 ? '/' : '\\';

            const dx = f.x + x * cell + cell / 2, dy = f.y + y * cell + cell / 2;
            const inC = p.dist(dx, dy, ccx, ccy) < cR;
            const inS = dx > sX && dx < sX + sS && dy > sY && dy < sY + sS;

            if (inC) p.fill(255, 80, 80); else if (inS) p.fill(80, 80, 255); else p.fill(fg());
            p.text(ch, dx, dy);
          }
        }
        p.drawingContext.restore();
        p.noFill(); p.strokeWeight(3);
        p.stroke(255, 80, 80); p.ellipse(ccx, ccy, cR * 2);
        p.stroke(80, 80, 255); p.rect(sX, sY, sS, sS);
        p.stroke(accent()); p.strokeWeight(2); p.rect(f.x, f.y, f.w, f.h);
      }
    }

    // ---------- SCENE MANAGER ----------
    class SceneManager {
      constructor() { this.scenes = []; this.index = 0; }
      add(s) { this.scenes.push(s); return this; }
      get current() { return this.scenes[this.index]; }
      get count() { return this.scenes.length; }
      switchTo(i) {
        this.current?.cleanup?.();
        this.index = ((i % this.scenes.length) + this.scenes.length) % this.scenes.length;
        this.current?.setup?.();
      }
      next() { this.switchTo(this.index + 1); }
      prev() { this.switchTo(this.index - 1); }
    }

    // ---------- P5 LIFECYCLE ----------
    p.setup = function() {
      const parent = p.canvas?.parentElement;
      const w = parent ? parent.offsetWidth : 800;
      const h = parent ? parent.offsetHeight : 600;
      p.createCanvas(w, h);
      cam = p.createCapture(p.VIDEO);
      cam.size(160, 160);
      cam.hide();

      manager = new SceneManager();
      manager
        .add(new RandomAsciiScene())
        .add(new MatrixScrollScene())
        .add(new EdgeFlowScene())
        .add(new DualRectScene())
        .add(new HalftoneScene())
        .add(new BubblesScene())
        .add(new EdgeOnlyScene())
        .add(new EdgeShapesScene());

      applyTheme(initialTheme);
      manager.switchTo(initialScene);
    };

    p.windowResized = function() {
      const parent = p.canvas?.parentElement;
      if (parent) p.resizeCanvas(parent.offsetWidth, parent.offsetHeight);
    };

    p.draw = function() {
      if (manager) manager.current.draw();
    };

    p.keyPressed = function() {
      if (p.keyCode === p.LEFT_ARROW) { manager.prev(); return; }
      if (p.keyCode === p.RIGHT_ARROW) { manager.next(); return; }
      if (p.key >= '1' && p.key <= '8') { manager.switchTo(parseInt(p.key) - 1); return; }
      if (manager.current && manager.current.keyPressed) manager.current.keyPressed();
    };

    p.mousePressed = function() {
      if (manager.current && manager.current.mousePressed) manager.current.mousePressed();
    };

    // Expose controls for React component
    p.getManager = () => manager;
    p.getSettings = () => settings;
    p.applyTheme = applyTheme;
  };
}
