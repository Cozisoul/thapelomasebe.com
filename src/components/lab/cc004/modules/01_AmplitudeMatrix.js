export const AmplitudeMatrix = (ctx, w, h, data) => {
  // Clear the canvas with a deep gallery-brown / system-black
  ctx.fillStyle = '#0F0E0E'; 
  ctx.fillRect(0, 0, w, h);

  const { rms } = data; // ranges roughly 0 to 1, but usually much lower (0 to 0.3)
  const normalizedRms = Math.min(rms * 4, 1); // Boost and clamp for visual impact

  // Draw an architectural grid that breathes with the RMS
  const cols = 12; // Law of 12 columns
  const rows = 12;
  
  const cellW = w / cols;
  const cellH = h / rows;

  const maxThickness = 20;
  const thickness = 1 + (normalizedRms * maxThickness);

  ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + normalizedRms * 0.9})`; // system-white breathing opacity
  ctx.lineWidth = thickness;

  ctx.beginPath();
  
  // Vertical lines
  for (let i = 0; i <= cols; i++) {
    const x = i * cellW;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }

  // Horizontal lines
  for (let j = 0; j <= rows; j++) {
    const y = j * cellH;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }

  ctx.stroke();

  // Draw nodes at intersections that expand
  ctx.fillStyle = '#0055FF'; // agency-blue
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      const x = i * cellW;
      const y = j * cellH;
      const radius = 2 + (normalizedRms * 15);
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw a central massive geometric form that scales heavily
  const centerX = w / 2;
  const centerY = h / 2;
  const baseSize = Math.min(w, h) * 0.2;
  const dynamicSize = baseSize + (normalizedRms * baseSize * 1.5);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(normalizedRms * Math.PI * 0.25); // slight breathing rotation
  
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2 + normalizedRms * 5;
  ctx.strokeRect(-dynamicSize/2, -dynamicSize/2, dynamicSize, dynamicSize);
  
  ctx.restore();
};
