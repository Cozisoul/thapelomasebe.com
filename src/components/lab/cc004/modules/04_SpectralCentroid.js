export const SpectralCentroid = (ctx, w, h, data) => {
  const { bass, lowMid, highMid, treble } = data;

  // Calculate proxy for Spectral Centroid
  const weights = bass * 0.2 + lowMid * 0.4 + highMid * 0.7 + treble * 1.0;
  const sum = bass + lowMid + highMid + treble + 0.0001; // avoid div/0
  const centroid = Math.min(Math.max(weights / sum, 0), 1); // 0 to 1

  // Color System mapping based on Centroid
  // Low centroid (Dark, muffled): gallery-brown / system-black (#1a1a1a to #3e2723)
  // High centroid (Bright, metallic): agency-blue / system-white (#0055ff to #ffffff)
  
  // Interpolate RGB manually for background
  const lerp = (start, end, amt) => Math.round(start + (end - start) * amt);
  
  const r1 = 26, g1 = 26, b1 = 26; // system-black ish
  const r2 = 0, g2 = 85, b2 = 255; // agency-blue
  const r3 = 255, g3 = 255, b3 = 255; // system-white

  let bgR, bgG, bgB;
  let fgR, fgG, fgB;

  if (centroid < 0.5) {
    const t = centroid * 2;
    bgR = lerp(r1, r2, t);
    bgG = lerp(g1, g2, t);
    bgB = lerp(b1, b2, t);
    
    fgR = 255; fgG = 255; fgB = 255; // White lines
  } else {
    const t = (centroid - 0.5) * 2;
    bgR = lerp(r2, r3, t);
    bgG = lerp(g2, g3, t);
    bgB = lerp(b2, b3, t);

    fgR = 0; fgG = 0; fgB = 0; // Black lines on bright
  }

  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, w, h);

  // Draw visual architecture: a literal 'center of mass' pendulum
  ctx.strokeStyle = `rgba(${fgR}, ${fgG}, ${fgB}, 0.5)`;
  ctx.lineWidth = 2 + (data.rms * 10);
  
  const centerX = w / 2;
  const centerY = h / 2;

  // Draw the spectrum as a scale
  ctx.beginPath();
  ctx.moveTo(w * 0.1, centerY);
  ctx.lineTo(w * 0.9, centerY);
  ctx.stroke();

  // Draw the centroid position
  const centroidX = w * 0.1 + (centroid * w * 0.8);
  const nodeRadius = 10 + (data.rms * 100);

  ctx.fillStyle = `rgb(${fgR}, ${fgG}, ${fgB})`;
  ctx.beginPath();
  ctx.arc(centroidX, centerY, nodeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw connecting vertical architectural lines
  ctx.beginPath();
  ctx.moveTo(centroidX, 0);
  ctx.lineTo(centroidX, h);
  ctx.stroke();
  
  // Display data
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`CENTROID: ${centroid.toFixed(3)}`, centroidX, centerY - nodeRadius - 20);
  ctx.fillText('DARK // BASS', w * 0.1, centerY + 30);
  ctx.fillText('BRIGHT // TREBLE', w * 0.9, centerY + 30);
};
