let offscreenCanvas = null;
let offCtx = null;

export const DitherModulator = (ctx, w, h, data) => {
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 128; // scale down for performance
    offscreenCanvas.height = 128;
    offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  const { treble, rms, bass } = data;
  const ow = offscreenCanvas.width;
  const oh = offscreenCanvas.height;

  // Draw some basic geometry on the offscreen canvas to be dithered
  offCtx.fillStyle = '#1A1A1A';
  offCtx.fillRect(0, 0, ow, oh);
  
  // A gradient sphere
  const cx = ow / 2 + Math.cos(Date.now() * 0.001) * ow * 0.2;
  const cy = oh / 2 + Math.sin(Date.now() * 0.001) * oh * 0.2;
  const rad = ow * 0.3 + bass * ow * 0.2;
  
  const grad = offCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(1, '#000000');
  
  offCtx.fillStyle = grad;
  offCtx.beginPath();
  offCtx.arc(cx, cy, rad, 0, Math.PI * 2);
  offCtx.fill();

  // Draw an architectural frame
  offCtx.strokeStyle = '#888888';
  offCtx.lineWidth = 2;
  offCtx.strokeRect(ow * 0.1, oh * 0.1, ow * 0.8, oh * 0.8);

  // Get pixel data
  const imgData = offCtx.getImageData(0, 0, ow, oh);
  const px = imgData.data;

  // The Dither logic: High-frequency noise controls the threshold
  // Base threshold is 128. Treble pushes it to extremes (0 to 255) causing corruption.
  const baseThreshold = 128;
  const thresholdDistortion = (treble * 255) * (Math.random() > 0.5 ? 1 : -1);
  const threshold = Math.max(0, Math.min(255, baseThreshold + thresholdDistortion));

  // Floyd-Steinberg error diffusion
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const i = (y * ow + x) * 4;
      
      const oldR = px[i];
      const newR = oldR < threshold ? 0 : 255;
      const err = oldR - newR;
      
      // We only do grayscale so set R=G=B
      px[i] = newR;
      px[i+1] = newR;
      px[i+2] = newR;
      // keep alpha

      // Propagate error
      if (x + 1 < ow) {
        px[i + 4] += err * (7/16);
      }
      if (y + 1 < oh) {
        if (x - 1 >= 0) px[i + ow*4 - 4] += err * (3/16);
        px[i + ow*4] += err * (5/16);
        if (x + 1 < ow) px[i + ow*4 + 4] += err * (1/16);
      }
    }
  }

  offCtx.putImageData(imgData, 0, 0);

  // Render to main canvas, scaling it up to create pixelated aesthetic
  ctx.imageSmoothingEnabled = false;
  
  // Fill background
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  // Center the pixelated dither block
  const scale = Math.min(w / ow, h / oh) * 0.8;
  const dw = ow * scale;
  const dh = oh * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  ctx.drawImage(offscreenCanvas, dx, dy, dw, dh);
};
