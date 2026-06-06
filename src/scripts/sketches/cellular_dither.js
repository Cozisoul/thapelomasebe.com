// =====================================================
//  CELLULAR_DITHER — Canvas API Game of Life
//  Ported from generative-art-suite/sketch-01.js
// =====================================================

const RULESETS = {
  standard:      { birth: [3],       survival: [2, 3],          name: 'Standard Conway' },
  highlife:      { birth: [3, 6],    survival: [2, 3],          name: 'HighLife' },
  'day-night':   { birth: [3, 6, 7, 8], survival: [3, 4, 6, 7, 8], name: 'Day & Night' },
  seeds:         { birth: [2],       survival: [],              name: 'Seeds' },
};

const PALETTES = {
  vibrant:    ['#D4483D', '#00A599', '#F2C249', '#3E5A97', '#FFFFFF'],
  warm:       ['#FFD700', '#FF8C00', '#FF0000'],
  monochrome: ['#222222', '#555555', '#888888', '#BBBBBB', '#EEEEEE'],
  neon:       ['#39ff14', '#fe019a', '#00f0ff', '#ff073a', '#cfff04'],
  earthy:     ['#4a442d', '#a39978', '#d7c38f', '#a15c38', '#592d22'],
};

export const RULESET_LIST = Object.keys(RULESETS);
export const PALETTE_LIST = Object.keys(PALETTES);

export class CellularDither {
  constructor(config = {}) {
    this.cols = config.cols || 30;
    this.rows = config.rows || 30;
    this.ruleset = config.ruleset || 'standard';
    this.palette = config.palette || 'vibrant';
    this.bgColor = config.bgColor || '#050505';
    this.margin = config.margin || 20;
    this.gap = config.gap || 2;
    this.density = config.density || 0.4;
    this.grid = [];
    this.animationId = null;
    this.lastUpdate = 0;
    this.speed = config.speed || 150; // ms between generations
    this._initGrid();
  }

  _initGrid() {
    this.grid = [];
    for (let i = 0; i < this.cols; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.rows; j++) {
        this.grid[i][j] = Math.random() < this.density ? 1 : 0;
      }
    }
  }

  reset() {
    this._initGrid();
  }

  setRuleset(name) {
    if (RULESETS[name]) this.ruleset = name;
  }

  setPalette(name) {
    if (PALETTES[name]) this.palette = name;
  }

  _updateGrid() {
    const { cols, rows, ruleset } = this;
    const rules = RULESETS[ruleset];
    const newGrid = [];
    for (let i = 0; i < cols; i++) {
      newGrid[i] = [];
      for (let j = 0; j < rows; j++) {
        let liveNeighbors = 0;
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            if (x === 0 && y === 0) continue;
            const ni = (i + x + cols) % cols;
            const nj = (j + y + rows) % rows;
            if (this.grid[ni] && this.grid[ni][nj] === 1) liveNeighbors++;
          }
        }
        const state = this.grid[i][j];
        if (state === 1) {
          newGrid[i][j] = rules.survival.includes(liveNeighbors) ? 1 : 0;
        } else {
          newGrid[i][j] = rules.birth.includes(liveNeighbors) ? 1 : 0;
        }
      }
    }
    this.grid = newGrid;
  }

  render(ctx, width, height, time = 0) {
    const { cols, rows, margin, gap, bgColor } = this;
    const colors = PALETTES[this.palette];

    // Update simulation
    if (time - this.lastUpdate > this.speed) {
      this._updateGrid();
      this.lastUpdate = time;
    }

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate cell size
    const availW = width - margin * 2;
    const availH = height - margin * 2;
    const cellW = availW / cols;
    const cellH = availH / rows;

    // Use a deterministic seed for consistent color assignment
    let seed = 42;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = margin + i * cellW;
        const y = margin + j * cellH;
        const isAlive = this.grid[i] && this.grid[i][j] === 1;

        // Deterministic color per cell
        seed = i * 1000 + j;
        const colorIdx = Math.floor(rand() * colors.length);

        if (isAlive) {
          ctx.fillStyle = colors[colorIdx];
          ctx.globalAlpha = 0.9;
        } else {
          ctx.fillStyle = '#1a1a1a';
          ctx.globalAlpha = 0.3;
        }

        const inset = gap / 2;
        ctx.fillRect(x + inset, y + inset, cellW - gap, cellH - gap);
        ctx.globalAlpha = 1;
      }
    }

    // Grid border
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(margin, margin, availW, availH);
  }

  start(canvas) {
    const ctx = canvas.getContext('2d');
    const loop = (time) => {
      this.render(ctx, canvas.width, canvas.height, time);
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
