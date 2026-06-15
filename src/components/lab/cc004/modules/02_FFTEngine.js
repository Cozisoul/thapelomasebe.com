export const FFTEngine = (ctx, w, h, data) => {
  // Clear the canvas
  ctx.fillStyle = '#050505'; // very dark
  ctx.fillRect(0, 0, w, h);

  const { bass, lowMid, highMid, treble } = data;

  // The logic: Bass drives X-axis constraints, Treble drives Y-axis constraints.
  // We will draw a complex parametric shape that reacts to these constraints.

  const centerX = w / 2;
  const centerY = h / 2;

  // X radius driven by bass
  const radiusX = (w * 0.1) + (bass * w * 0.4);
  
  // Y radius driven by treble
  const radiusY = (h * 0.1) + (treble * h * 0.4);

  // We draw a series of interconnected rings
  const rings = 20;

  ctx.save();
  ctx.translate(centerX, centerY);

  // Draw the FFT constraints as boundary boxes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-radiusX, -radiusY, radiusX * 2, radiusY * 2);

  // Crosshairs based on LowMid and HighMid
  ctx.strokeStyle = 'rgba(0, 85, 255, 0.3)'; // agency-blue
  ctx.beginPath();
  const lmOffset = lowMid * w * 0.3;
  const hmOffset = highMid * h * 0.3;
  
  // Vertical crosshairs
  ctx.moveTo(-lmOffset, -h/2);
  ctx.lineTo(-lmOffset, h/2);
  ctx.moveTo(lmOffset, -h/2);
  ctx.lineTo(lmOffset, h/2);
  
  // Horizontal crosshairs
  ctx.moveTo(-w/2, -hmOffset);
  ctx.lineTo(w/2, -hmOffset);
  ctx.moveTo(-w/2, hmOffset);
  ctx.lineTo(w/2, hmOffset);
  ctx.stroke();

  // The main form: parameterized ellipse morphed by frequencies
  ctx.beginPath();
  for (let r = 0; r < rings; r++) {
    const angleOffset = r * (Math.PI * 2 / rings) + (bass * Math.PI);
    
    // Deform the rings slightly based on the mid frequencies
    const distortionX = Math.cos(angleOffset * 3) * (lowMid * 50);
    const distortionY = Math.sin(angleOffset * 4) * (highMid * 50);

    const x = Math.cos(angleOffset) * radiusX + distortionX;
    const y = Math.sin(angleOffset) * radiusY + distortionY;

    if (r === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + treble * 0.5})`;
  ctx.lineWidth = 2 + bass * 10;
  ctx.stroke();

  ctx.restore();
};
