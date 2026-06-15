export const LissajousOrbiters = (ctx, w, h, data) => {
  // Trail effect instead of clear
  ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
  ctx.fillRect(0, 0, w, h);

  const { timeData, rms } = data;

  const centerX = w / 2;
  const centerY = h / 2;
  
  const scale = Math.min(w, h) * 0.4;
  const phaseOffset = Math.floor(timeData.length * 0.25); // 90 degree phase shift for pseudo-stereo

  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Rotate slowly over time
  ctx.rotate(Date.now() * 0.0005);

  ctx.beginPath();
  
  // We draw a continuous line mapping x(t) to X-axis and x(t + offset) to Y-axis
  // This creates a Lissajous curve representing the phase correlation of the signal
  for (let i = 0; i < timeData.length - phaseOffset; i += 2) {
    // timeData values are roughly between -1.0 and +1.0
    const x = timeData[i] * scale;
    const y = timeData[i + phaseOffset] * scale;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  // Aesthetically style it based on rms
  ctx.strokeStyle = `rgba(0, 85, 255, ${0.5 + rms})`; // agency-blue
  ctx.lineWidth = 1 + (rms * 10);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw orbiting planetary bodies based on extreme peaks
  ctx.fillStyle = '#FFFFFF'; // system-white
  for (let i = 0; i < timeData.length - phaseOffset; i += 64) {
    if (Math.abs(timeData[i]) > 0.5) {
      const x = timeData[i] * scale;
      const y = timeData[i + phaseOffset] * scale;
      ctx.beginPath();
      ctx.arc(x, y, 3 + (Math.abs(timeData[i]) * 10), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
};
