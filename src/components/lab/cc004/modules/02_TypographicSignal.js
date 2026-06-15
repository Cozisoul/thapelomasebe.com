export const TypographicSignal = (ctx, w, h, data) => {
  ctx.fillStyle = '#0F0E0E'; // gallery-brown dark base
  ctx.fillRect(0, 0, w, h);

  const { fft, rms } = data;
  
  // We'll map the 12 bands to 12 lines of text
  const bands = new Array(12).fill(0);
  const binsPerBand = Math.floor((fft.length * 0.4) / 12); 
  
  for (let i = 0; i < 12; i++) {
    let sum = 0;
    for (let j = 0; j < binsPerBand; j++) {
      sum += fft[i * binsPerBand + j];
    }
    bands[i] = (sum / binsPerBand) / 255.0; // 0 to 1
  }

  // The Kinetic Typography Settings
  const words = [
    "THE", "SOURCE", "RESHAPES", "THE", "OFFICE",
    "STRUCTURAL", "STRESS", "BECOMES", "VISIBLE",
    "ACOUSTIC", "MATERIAL", "HONESTY"
  ];

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = h / 14;
  const centerY = h / 2;
  const startY = centerY - (lineHeight * 5.5);

  for (let i = 0; i < 12; i++) {
    const val = bands[i];
    
    // Amplitude (RMS) + Band Value drives Weight
    const combinedWeight = Math.min(Math.max(100 + ((val * 0.8 + rms * 1.5) * 800), 100), 900);
    const weight = Math.floor(combinedWeight / 100) * 100; // Snap to hundreds

    // Frequency drives the Width/Stretch
    const stretches = [
      "ultra-condensed", "extra-condensed", "condensed", "semi-condensed", 
      "normal", "semi-expanded", "expanded", "extra-expanded", "ultra-expanded"
    ];
    // Lower bins = condensed, Higher bins = expanded, modulated by their energy
    const stretchIndex = Math.min(Math.floor((i / 12 + val) * (stretches.length / 2)), stretches.length - 1);
    const stretch = stretches[stretchIndex];

    const fontSize = lineHeight * (0.8 + (rms * 0.5));
    
    ctx.save();
    
    // Slant driven by high-frequencies (the treble bands)
    const slant = (i > 8 ? bands[i] : 0) * Math.PI * 0.15;
    const yPos = startY + (i * lineHeight);
    
    ctx.translate(w / 2, yPos);
    
    // Apply slant (skewX)
    ctx.transform(1, 0, Math.tan(-slant), 1, 0, 0);

    ctx.font = `${weight} ${stretch} ${fontSize}px "JetBrains Mono", "Satoshi", system-ui, monospace`;
    
    // Add jitter if clipping
    const isClipping = val > 0.8;
    const jx = isClipping ? (Math.random() - 0.5) * 10 : 0;
    const jy = isClipping ? (Math.random() - 0.5) * 10 : 0;
    
    if (isClipping) {
      ctx.fillStyle = '#FF3333'; // Error Red
    } else {
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#888888';
    }

    ctx.fillText(words[i], jx, jy);
    
    ctx.restore();
  }
};
