export const ComponentStressAudit = (ctx, w, h, data) => {
  const { rms, timeData } = data;
  
  // Track peak for failure analysis
  let maxAmplitude = 0;
  for (let i = 0; i < timeData.length; i++) {
    const abs = Math.abs(timeData[i]);
    if (abs > maxAmplitude) maxAmplitude = abs;
  }

  // Define failure threshold
  const FAILURE_THRESHOLD = 0.85;
  const isFailing = maxAmplitude > FAILURE_THRESHOLD;

  // Background
  ctx.fillStyle = isFailing ? '#FF3333' : '#0F0E0E'; // Flash Error Red if failing
  ctx.fillRect(0, 0, w, h);

  const centerX = w / 2;
  const centerY = h / 2;

  ctx.save();
  ctx.translate(centerX, centerY);

  // Draw Structural Component Schematic (a rigid geometric block)
  ctx.strokeStyle = isFailing ? '#000000' : '#FFFFFF';
  ctx.lineWidth = 2;
  
  const compWidth = w * 0.4;
  const compHeight = h * 0.5;

  // If failing, apply glitch/shear offsets to the drawing context
  if (isFailing) {
    const shear = (Math.random() - 0.5) * 0.5;
    ctx.transform(1, 0, shear, 1, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50);
  }

  // Draw the component blueprint
  ctx.strokeRect(-compWidth/2, -compHeight/2, compWidth, compHeight);
  
  // Cross bracing
  ctx.beginPath();
  ctx.moveTo(-compWidth/2, -compHeight/2);
  ctx.lineTo(compWidth/2, compHeight/2);
  ctx.moveTo(compWidth/2, -compHeight/2);
  ctx.lineTo(-compWidth/2, compHeight/2);
  ctx.stroke();

  // Draw inner stress ring
  const stressRadius = Math.min(compWidth, compHeight) * 0.4 * maxAmplitude;
  ctx.beginPath();
  ctx.arc(0, 0, stressRadius, 0, Math.PI * 2);
  if (isFailing) {
    ctx.fillStyle = '#000000';
    ctx.fill();
  } else {
    ctx.strokeStyle = '#0055FF'; // Agency Blue
    ctx.stroke();
  }

  ctx.restore();

  // Erasure effect: draw random dark rectangular blocks across the screen if stressed
  if (rms > 0.4 && !isFailing) {
    ctx.fillStyle = '#050505';
    for (let i = 0; i < rms * 20; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const rw = Math.random() * w * 0.5;
      const rh = 10 + Math.random() * 20;
      ctx.fillRect(rx, ry, rw, rh);
    }
  }

  // HUD / Diagnostic Text
  ctx.fillStyle = isFailing ? '#000000' : '#FFFFFF';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const textX = w * 0.05;
  const textY = h * 0.1;

  ctx.fillText('MECHANICAL_AUDIT // SIGNAL_INTEGRITY', textX, textY);
  ctx.fillText(`CURRENT_STRESS : ${(maxAmplitude * 100).toFixed(1)}%`, textX, textY + 30);
  ctx.fillText(`FAIL_THRESHOLD : ${(FAILURE_THRESHOLD * 100).toFixed(1)}%`, textX, textY + 50);

  if (isFailing) {
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText('CRITICAL_FAILURE', w / 2, h / 2);
  }
};
