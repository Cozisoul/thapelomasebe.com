// dither.js
class DitherEffect {
  constructor() {
    this.palette = [[0,0,0],[255,255,255]];
    this.invertColors = false;
  }

setPalette(fgRgb, bgRgb, invert=false) {
  if (invert) {
    this.palette = [bgRgb.slice(), fgRgb.slice()];
  } else {
    this.palette = [fgRgb.slice(), bgRgb.slice()];
  }
}

setInvert(invert) {
  this.invertColors = invert;
}


  // find index of closest color in palette (0 or 1)
  findClosestIndex(r,g,b) {
    let bestIdx = 0, best = Infinity;
    for (let i=0;i<this.palette.length;i++){
      const col = this.palette[i];
      const d = Math.hypot(r - col[0], g - col[1], b - col[2]);
      if (d < best) { best = d; bestIdx = i; }
    }
    return bestIdx;
  }

  // apply to p5.Image (src must be downscaled before calling if needed)
  // returns { image: p5.Image, binary: Uint8Array, width, height }
  apply(src) {
    src.loadPixels();
    const w = src.width, h = src.height;
    const dst = createImage(w, h);
    dst.loadPixels();

  const len = src.pixels.length;
  const buf = new Float32Array(len);
  for (let i=0;i<len;i++) {
    let v = src.pixels[i];
    if (this.invertColors && (i % 4 !== 3)) { // don't invert alpha
      v = 255 - v;
    }
    buf[i] = v;
  }

    const binary = new Uint8Array(w * h);

    for (let y=0;y<h;y++){
      for (let x=0;x<w;x++){
        const i = (x + y * w) * 4;
        const r = clamp(Math.round(buf[i]));
        const g = clamp(Math.round(buf[i+1]));
        const b = clamp(Math.round(buf[i+2]));

        const idx = this.findClosestIndex(r,g,b);
        const col = this.palette[idx];

        dst.pixels[i]   = col[0];
        dst.pixels[i+1] = col[1];
        dst.pixels[i+2] = col[2];
        dst.pixels[i+3] = 255;

        // record binary: palette index 0 is "alive"
        binary[x + y * w] = (idx === 0) ? 1 : 0;

        // error
        const er = r - col[0];
        const eg = g - col[1];
        const eb = b - col[2];

        this._spread(buf, w, h, x + 1, y    , er, eg, eb, 7/16);
        this._spread(buf, w, h, x - 1, y + 1, er, eg, eb, 3/16);
        this._spread(buf, w, h, x    , y + 1, er, eg, eb, 5/16);
        this._spread(buf, w, h, x + 1, y + 1, er, eg, eb, 1/16);
      }
    }

    dst.updatePixels();
    return { image: dst, binary, width: w, height: h };
  }

  _spread(buf, w, h, x, y, er, eg, eb, fac) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const ii = (x + y * w) * 4;
    buf[ii]   = buf[ii]   + er * fac;
    buf[ii+1] = buf[ii+1] + eg * fac;
    buf[ii+2] = buf[ii+2] + eb * fac;
  }
}

function clamp(v) {
  if (v < 0) return 0;
  if (v > 255) return 255;
  return v;
}
