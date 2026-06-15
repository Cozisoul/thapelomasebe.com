const historySize = 60; // How many rows in the waterfall
const terrainWidth = 64; // How many columns per row
let history = []; // stores arrays of waveform data

export const TopographicWaterfall = (ctx, w, h, data) => {
  const { fft } = data; // use raw fft

  // Downsample FFT for the terrain row
  const row = new Float32Array(terrainWidth);
  const step = Math.floor(fft.length / terrainWidth);
  for (let i = 0; i < terrainWidth; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) {
      sum += fft[i * step + j] || 0;
    }
    row[i] = sum / step / 255.0; // 0 to 1
  }

  // Push to history
  history.unshift(row);
  if (history.length > historySize) {
    history.pop();
  }

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  // Pseudo-3D Isometric/Perspective projection
  // Camera is positioned looking down an angled grid
  
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';

  const rowSpacing = h * 0.015;
  const colSpacing = w * 0.02;

  ctx.save();
  // Move to bottom center
  ctx.translate(w / 2, h * 0.8);

  for (let z = 0; z < history.length - 1; z++) {
    const currentRow = history[z];
    const nextRow = history[z + 1];
    
    // Fade out as it goes further back
    const opacity = 1.0 - (z / historySize);
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    
    // Draw horizontal lines connecting columns
    ctx.beginPath();
    for (let x = 0; x < terrainWidth; x++) {
      // Perspective math
      const scale = 1.0 / (1.0 + (z * 0.05)); // objects shrink as z increases
      
      const px = (x - terrainWidth / 2) * colSpacing * scale;
      const pz = -z * rowSpacing * scale * 20; // push back in Y visually
      
      // The height is driven by the FFT value
      const py = pz - (currentRow[x] * 150 * scale);

      if (x === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Draw vertical connection lines to the next row (grid effect)
    ctx.beginPath();
    for (let x = 0; x < terrainWidth; x += 4) { // only connect every 4th to avoid clutter
      const scale1 = 1.0 / (1.0 + (z * 0.05));
      const px1 = (x - terrainWidth / 2) * colSpacing * scale1;
      const py1 = (-z * rowSpacing * scale1 * 20) - (currentRow[x] * 150 * scale1);

      const scale2 = 1.0 / (1.0 + ((z + 1) * 0.05));
      const px2 = (x - terrainWidth / 2) * colSpacing * scale2;
      const py2 = (-(z + 1) * rowSpacing * scale2 * 20) - (nextRow[x] * 150 * scale2);

      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
    }
    ctx.stroke();
  }

  ctx.restore();
};
