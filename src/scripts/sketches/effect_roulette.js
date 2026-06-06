// =====================================================
//  EFFECT_ROULETTE — Canvas API Image Decomposition
//  Ported from generative-art-suite/image-manip-generator.js
// =====================================================

/**
 * All effect renderers as standalone functions.
 * Each takes (ctx, width, height, imageData, settings).
 */

function getAverage(imageData, x, y, w, h) {
  const data = imageData.data;
  const width = imageData.width;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = x; i < x + w; i++) {
    for (let j = y; j < y + h; j++) {
      if (i >= 0 && i < width && j >= 0 && j < imageData.height) {
        const index = (j * width + i) * 4;
        r += data[index]; g += data[index + 1]; b += data[index + 2];
        count++;
      }
    }
  }
  if (count === 0) return { r: 0, g: 0, b: 0, brightness: 0 };
  return { r: r / count, g: g / count, b: b / count, brightness: (r / count + g / count + b / count) / 3 };
}

export function renderPixelate(ctx, width, height, imageData, settings) {
  const size = settings.pixelSize || 20;
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const avg = getAverage(imageData, x, y, size, size);
      ctx.fillStyle = `rgb(${avg.r}, ${avg.g}, ${avg.b})`;
      ctx.fillRect(x, y, size, size);
    }
  }
}

export function renderVoxelize(ctx, width, height, imageData, settings) {
  const size = settings.pixelSize || 20;
  const depth = settings.voxelDepth || 5;
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const avg = getAverage(imageData, x, y, size, size);
      ctx.fillStyle = `rgb(${avg.r * 0.8}, ${avg.g * 0.8}, ${avg.b * 0.8})`;
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = `rgb(${avg.r}, ${avg.g}, ${avg.b})`;
      ctx.fillRect(x - depth, y - depth, size, size);
    }
  }
}

export function renderBitmap(ctx, width, height, imageData, settings) {
  const d = imageData.data;
  const threshold = settings.bitmapThreshold || 128;
  const gs = new Float32Array(width * height);
  for (let i = 0; i < d.length; i += 4) {
    gs[i / 4] = (d[i] * 0.299) + (d[i + 1] * 0.587) + (d[i + 2] * 0.114);
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const oldPixel = gs[i];
      const newPixel = oldPixel < threshold ? 0 : 255;
      const quantError = oldPixel - newPixel;
      gs[i] = newPixel;
      if (x + 1 < width) gs[i + 1] += quantError * 7 / 16;
      if (x - 1 >= 0 && y + 1 < height) gs[i - 1 + width] += quantError * 3 / 16;
      if (y + 1 < height) gs[i + width] += quantError * 5 / 16;
      if (x + 1 < width && y + 1 < height) gs[i + 1 + width] += quantError * 1 / 16;
    }
  }
  const outImageData = ctx.createImageData(width, height);
  const outData = outImageData.data;
  for (let i = 0; i < gs.length; i++) {
    outData[i * 4] = gs[i]; outData[i * 4 + 1] = gs[i]; outData[i * 4 + 2] = gs[i]; outData[i * 4 + 3] = 255;
  }
  ctx.putImageData(outImageData, 0, 0);
}

export function renderHalftone(ctx, width, height, imageData, settings) {
  const size = settings.pixelSize || 20;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const avg = getAverage(imageData, x, y, size, size);
      const radius = (1 - avg.brightness / 255) * (size / 2) * 1.2;
      if (radius > 0) {
        ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, radius, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

export function renderAscii(ctx, width, height, imageData, settings) {
  const size = settings.pixelSize || 20;
  const chars = settings.asciiChars || ' .:-=+*#%@';
  if (!chars) return;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
  ctx.font = `${size * 1.2}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const avg = getAverage(imageData, x, y, size, size);
      const charIndex = Math.round(avg.brightness / 255 * (chars.length - 1));
      ctx.fillStyle = `rgb(${avg.r}, ${avg.g}, ${avg.b})`;
      ctx.fillText(chars[charIndex], x + size / 2, y + size / 2);
    }
  }
}

export function renderAnaglyph(ctx, width, height, imageData, settings) {
  const shift = settings.anaglyphShift || 10;
  const srcData = imageData.data;
  const outImageData = ctx.createImageData(width, height);
  const outData = outImageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const redX = Math.max(0, x - shift);
      const redIndex = (y * width + redX) * 4;
      outData[i] = srcData[redIndex]; outData[i+1] = srcData[i + 1]; outData[i+2] = srcData[i + 2]; outData[i+3] = 255;
    }
  }
  ctx.putImageData(outImageData, 0, 0);
}

export function renderGlitch(ctx, width, height, imageData, settings) {
  const { glitchSliceCount = 20, glitchColorShift = 10 } = settings;
  ctx.putImageData(imageData, 0, 0);
  for (let i = 0; i < glitchSliceCount; i++) {
    const y = Math.random() * height;
    const h = Math.random() * (height / 10);
    const sliceData = ctx.getImageData(0, y, width, h);
    const shift = (Math.random() - 0.5) * (glitchSliceCount / 2);
    ctx.putImageData(sliceData, shift, y);
  }
  const shiftedImageData = ctx.getImageData(0, 0, width, height);
  const shiftedData = shiftedImageData.data;
  const outImageData = ctx.createImageData(width, height);
  const outData = outImageData.data;
  for (let i = 0; i < shiftedData.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    const redX = Math.max(0, x - glitchColorShift);
    const blueX = Math.min(width - 1, x + glitchColorShift);
    outData[i] = shiftedData[(y * width + redX) * 4];
    outData[i + 1] = shiftedData[i + 1];
    outData[i + 2] = shiftedData[(y * width + blueX) * 4 + 2];
    outData[i + 3] = shiftedData[i + 3];
  }
  ctx.putImageData(outImageData, 0, 0);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 2);
}

export const EFFECTS = {
  pixelate: renderPixelate,
  voxelize: renderVoxelize,
  bitmap: renderBitmap,
  halftone: renderHalftone,
  ascii: renderAscii,
  anaglyph: renderAnaglyph,
  glitch: renderGlitch,
};

export const EFFECT_LIST = Object.keys(EFFECTS);

export const DEFAULT_SETTINGS = {
  effect: 'pixelate',
  pixelSize: 20,
  bitmapThreshold: 128,
  asciiChars: ' .:-=+*#%@',
  anaglyphShift: 10,
  glitchSliceCount: 20,
  glitchColorShift: 10,
  voxelDepth: 5,
};
