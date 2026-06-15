const cols = 12;
const rows = 12;

// Initialize grid physics nodes
let nodes = [];
let initialized = false;

function initNodes(w, h) {
  nodes = [];
  const cellW = w / (cols + 1);
  const cellH = h / (rows + 1);

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const baseX = (c + 1) * cellW;
      const baseY = (r + 1) * cellH;
      nodes.push({
        baseX, baseY,
        x: baseX, y: baseY,
        vx: 0, vy: 0
      });
    }
  }
  initialized = true;
}

export const ElasticGrid = (ctx, w, h, data) => {
  if (!initialized || nodes.length === 0 || nodes[0].baseX !== (w / (cols + 1))) {
    initNodes(w, h);
  }

  const { fft, rms } = data;

  ctx.fillStyle = '#0F0E0E';
  ctx.fillRect(0, 0, w, h);

  // Map FFT into 12 bands.
  // We take the lower end of the FFT where most musical notes reside.
  const bands = new Array(12).fill(0);
  const binsPerBand = Math.floor((fft.length * 0.25) / 12); 
  
  for (let i = 0; i < 12; i++) {
    let sum = 0;
    for (let j = 0; j < binsPerBand; j++) {
      sum += fft[i * binsPerBand + j];
    }
    bands[i] = (sum / binsPerBand) / 255.0; // 0 to 1
  }

  const tension = 0.1;
  const dampening = 0.8;

  // Update physics
  for (let c = 0; c < cols; c++) {
    const forceY = bands[c] * (h * 0.2); // Column specific bulging
    
    for (let r = 0; r < rows; r++) {
      const idx = c * rows + r;
      const node = nodes[idx];

      // Target position
      const targetX = node.baseX;
      // Center rows bulge more than outer rows
      const rowInfluence = Math.sin((r / (rows - 1)) * Math.PI); 
      const targetY = node.baseY - (forceY * rowInfluence);

      // Spring physics
      node.vx += (targetX - node.x) * tension;
      node.vy += (targetY - node.y) * tension;
      
      node.vx *= dampening;
      node.vy *= dampening;

      node.x += node.vx;
      node.y += node.vy;
    }
  }

  // Draw Grid Lines
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + rms * 0.5})`;
  ctx.lineWidth = 1 + (rms * 5);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  
  // Vertical lines
  for (let c = 0; c < cols; c++) {
    ctx.moveTo(nodes[c * rows].x, nodes[c * rows].y);
    for (let r = 1; r < rows; r++) {
      ctx.lineTo(nodes[c * rows + r].x, nodes[c * rows + r].y);
    }
  }

  // Horizontal lines
  for (let r = 0; r < rows; r++) {
    ctx.moveTo(nodes[r].x, nodes[r].y);
    for (let c = 1; c < cols; c++) {
      ctx.lineTo(nodes[c * rows + r].x, nodes[c * rows + r].y);
    }
  }
  
  ctx.stroke();

  // Draw Nodes
  ctx.fillStyle = '#0055FF'; // Agency Blue
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeRadius = 2 + (Math.abs(node.baseY - node.y) * 0.1);
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
  }
};
