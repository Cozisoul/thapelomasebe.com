const density = "    .-*+=%@#";

export const AudioReactiveASCII = (ctx, w, h, data) => {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  const { rms, fft } = data;
  
  // Use a monospace font
  const fontSize = 16;
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Gallery Brown text color variant
  ctx.fillStyle = '#D2B48C'; // Cosmic Latte / Tan

  const cols = Math.floor(w / fontSize);
  const rows = Math.floor(h / fontSize);

  // We map the FFT bins to the grid to create localized density, 
  // scaled overall by the RMS
  const fftLength = fft.length;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Map 2D grid position to 1D FFT array index
      const normalizedX = x / cols;
      const normalizedY = y / rows;
      
      // Let's make an interesting mapping where radius from center maps to frequency
      const dx = normalizedX - 0.5;
      const dy = normalizedY - 0.5;
      const dist = Math.sqrt(dx*dx + dy*dy) * 2.0; // 0 at center, ~1.4 at corners
      
      const fftIndex = Math.floor(Math.min(dist, 1.0) * (fftLength * 0.5));
      const freqVal = fft[fftIndex] / 255.0;

      // Combine local frequency power with global RMS power
      let combined = freqVal * 0.7 + rms * 2.0;
      
      // Add some noise based on position
      const noise = (Math.sin(x * 0.5) * Math.cos(y * 0.5)) * 0.1;
      combined += noise;
      
      combined = Math.max(0, Math.min(1, combined));

      const charIndex = Math.floor(combined * (density.length - 1));
      const char = density[charIndex];

      if (char !== ' ') {
        ctx.fillText(char, x * fontSize + fontSize/2, y * fontSize + fontSize/2);
      }
    }
  }
};
