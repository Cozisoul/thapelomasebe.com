let previousRMS = 0;
let markHistory = [];
const MAX_MARKS = 200;

const PRIMITIVES = [
  { char: '●', name: 'SUB_BASS' },
  { char: '○', name: 'BASS' },
  { char: '■', name: 'KICK' },
  { char: '□', name: 'LOW_MID' },
  { char: '▲', name: 'MID_1' },
  { char: '△', name: 'MID_2' },
  { char: '/', name: 'HIGH_MID' },
  { char: '\\', name: 'PRESENCE' },
  { char: '|', name: 'TREBLE_1' },
  { char: '-', name: 'TREBLE_2' },
  { char: '+', name: 'AIR' },
  { char: '×', name: 'NOISE' }
];

export const IterativeGlyphEngine = (ctx, w, h, data) => {
  ctx.fillStyle = '#050505'; // Void black
  ctx.fillRect(0, 0, w, h);

  const { rms, fft } = data;

  // Map FFT into 12 bands
  const bands = new Array(12).fill(0);
  const binsPerBand = Math.floor((fft.length * 0.5) / 12); 
  
  for (let i = 0; i < 12; i++) {
    let sum = 0;
    for (let j = 0; j < binsPerBand; j++) {
      sum += fft[i * binsPerBand + j];
    }
    bands[i] = (sum / binsPerBand) / 255.0; // 0 to 1
  }

  // Detect transient
  const isTransient = (rms - previousRMS > 0.04) && rms > 0.1;
  previousRMS = rms;

  if (isTransient) {
    // Find the dominant frequency band in this transient
    let maxBandValue = -1;
    let dominantIndex = 0;
    for (let i = 0; i < 12; i++) {
      if (bands[i] > maxBandValue) {
        maxBandValue = bands[i];
        dominantIndex = i;
      }
    }

    const primitive = PRIMITIVES[dominantIndex].char;
    // Highlight colors for specific dominant regions
    let color = '#FFFFFF';
    if (dominantIndex < 3) color = '#0055FF'; // Agency Blue for bass
    if (dominantIndex > 8) color = '#FF3333'; // Error Red for treble

    markHistory.push({
      char: primitive,
      color: color,
      scale: 1 + maxBandValue * 2,
      time: Date.now()
    });

    if (markHistory.length > MAX_MARKS) {
      markHistory.shift();
    }
  }

  // Draw the iterative receipt
  const columns = Math.floor(w / 40) - 8; // Leave right margin for UI legend
  const startX = 40;
  const startY = 40;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < markHistory.length; i++) {
    const mark = markHistory[i];
    
    // Calculate grid position
    // We scroll upwards by anchoring the newest marks at the bottom, or just fill left-to-right, top-to-bottom
    const col = i % columns;
    const row = Math.floor(i / columns);
    
    // We want the newest items to be at the bottom, shifting old items up
    // To do this, calculate total rows and offset
    const totalRows = Math.floor(markHistory.length / columns);
    const maxRowsAllowed = Math.floor((h - 80) / 40);
    const rowOffset = Math.max(0, totalRows - maxRowsAllowed + 1);

    const actualRow = row - rowOffset;
    
    if (actualRow >= 0) {
      const x = startX + (col * 40);
      const y = startY + (actualRow * 40);

      ctx.save();
      ctx.translate(x, y);
      
      // Slight breathing effect on recent marks
      const age = Date.now() - mark.time;
      const breathe = age < 200 ? 1.5 : 1.0;
      
      ctx.scale(mark.scale * breathe, mark.scale * breathe);
      
      ctx.fillStyle = mark.color;
      ctx.font = '20px monospace';
      ctx.fillText(mark.char, 0, 0);
      
      ctx.restore();
    }
  }

  // Draw receipt grid structural lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = startX - 20; x < startX + columns * 40; x += 40) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  ctx.stroke();
};
