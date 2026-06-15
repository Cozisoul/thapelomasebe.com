export const VariableTypography = (ctx, w, h, data) => {
  ctx.fillStyle = '#0F0E0E'; // gallery-brown dark
  ctx.fillRect(0, 0, w, h);

  const { lowMid, highMid, rms } = data;

  // Map mid frequencies to font weight (100 to 900)
  // lowMid usually between 0 and 0.5 roughly
  const weight = Math.min(Math.max(100 + (lowMid * 1600), 100), 900);
  
  // Map highMid to stretching visually
  // Since Canvas API support for font-stretch is spotty, we will simulate
  // dynamic layout and letter spacing, and vertical scaling
  
  const scaleX = 1.0 + (highMid * 2.0);
  const scaleY = 1.0 + (rms * 1.5);

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = "SONIC ARCHITECTURE";
  const lines = [
    "SOUND", "IS", "INVISIBLE", "STRUCTURE"
  ];

  ctx.save();
  ctx.translate(w / 2, h / 2);
  
  // Apply scaling matrix for pseudo-font-stretch
  ctx.scale(scaleX, scaleY);
  
  // We apply the variable weight if supported by the OS font
  // system-ui often supports variable weights
  ctx.font = `${Math.floor(weight)} 8vw system-ui, sans-serif`;
  
  // A screaming or whispering effect based on RMS
  const jitter = rms * 10;

  for (let i = 0; i < lines.length; i++) {
    const yOffset = (i - 1.5) * (h * 0.15) * (1 / scaleY);
    const jx = (Math.random() - 0.5) * jitter;
    const jy = (Math.random() - 0.5) * jitter;
    
    ctx.fillText(lines[i], jx, yOffset + jy);
  }

  ctx.restore();
  
  // Overlay some noise/grain based on highMid
  if (highMid > 0.1) {
    ctx.fillStyle = `rgba(255, 255, 255, ${highMid * 0.1})`;
    for(let i=0; i<100; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }
};
