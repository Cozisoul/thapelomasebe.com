let previousRMS = 0;
let flashOpacity = 0;
let rotationAngle = 0;
let palettes = [
  ['#050505', '#FFFFFF', '#0055FF', '#FF3300'],
  ['#1A1A1A', '#FFF8E7', '#333333', '#FF0055'],
  ['#000000', '#00FF00', '#003300', '#FFFFFF']
];
let currentPaletteIndex = 0;

export const TransientDetector = (ctx, w, h, data) => {
  const { rms } = data;

  // Detect transient (sudden spike)
  const isTransient = (rms - previousRMS > 0.05);
  
  if (isTransient) {
    flashOpacity = 1.0;
    rotationAngle += Math.PI / 2; // Rotate 90 degrees
    currentPaletteIndex = (currentPaletteIndex + 1) % palettes.length;
  }

  // Decay
  flashOpacity *= 0.9;
  previousRMS = rms;

  const palette = palettes[currentPaletteIndex];

  // Background
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, w, h);

  // Flash layer
  ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity * 0.3})`;
  ctx.fillRect(0, 0, w, h);

  // Draw some Truchet-like tiles that rotate on transient
  const tileSize = w / 8;
  const cols = Math.ceil(w / tileSize);
  const rows = Math.ceil(h / tileSize);

  ctx.strokeStyle = palette[1];
  ctx.lineWidth = 4 + (flashOpacity * 10);
  ctx.lineCap = 'round';

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * tileSize;
      const y = r * tileSize;

      ctx.save();
      ctx.translate(x + tileSize / 2, y + tileSize / 2);
      
      // Every tile has a slight random rotation based on position but globally influenced
      const localRot = ((c + r) % 2 === 0) ? rotationAngle : -rotationAngle;
      ctx.rotate(localRot);

      ctx.beginPath();
      // Draw an arc from top-left to bottom-right
      ctx.arc(-tileSize/2, -tileSize/2, tileSize/2, 0, Math.PI / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(tileSize/2, tileSize/2, tileSize/2, Math.PI, Math.PI * 1.5);
      ctx.stroke();

      ctx.restore();
    }
  }
};
