const COLS = 20;
const ROWS = 20;

let nodes = [];
let initialized = false;
let previousTreble = 0;

function initGrid(w, h) {
  nodes = [];
  const cellW = w / COLS;
  const cellH = h / ROWS;

  for (let c = 0; c <= COLS; c++) {
    for (let r = 0; r <= ROWS; r++) {
      const baseX = c * cellW;
      const baseY = r * cellH;
      nodes.push({
        baseX, baseY,
        x: baseX, y: baseY,
        vx: 0, vy: 0,
        mass: 1.0 + (Math.random() * 0.5)
      });
    }
  }
  initialized = true;
}

export const KineticGridTension = (ctx, w, h, data) => {
  if (!initialized || nodes.length === 0 || nodes[0].baseX !== 0) {
    initGrid(w, h);
  }

  const { bass, treble } = data;

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  // High-end transients cause snap-back
  const isSnap = (treble - previousTreble > 0.05);
  previousTreble = treble;

  // Bass creates a gravity well in the center
  const centerX = w / 2;
  const centerY = h / 2;
  const gravityForce = bass * 150; 
  
  const tension = isSnap ? 0.8 : 0.05; // Snap back instantly on high-end hit
  const dampening = isSnap ? 0.5 : 0.9;

  // Update node physics
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    // Gravity well pull
    const dx = centerX - node.x;
    const dy = centerY - node.y;
    const distSq = dx*dx + dy*dy;
    
    // Applying gravity if close enough
    if (distSq > 0 && distSq < (w*w)) {
      const force = gravityForce / Math.sqrt(distSq);
      node.vx += dx * force;
      node.vy += dy * force;
    }

    // Spring tension back to base position
    node.vx += (node.baseX - node.x) * tension;
    node.vy += (node.baseY - node.y) * tension;

    node.vx *= dampening;
    node.vy *= dampening;

    node.x += node.vx;
    node.y += node.vy;
  }

  // Draw brutalist 1px grid lines
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.beginPath();

  // Vertical lines
  for (let c = 0; c <= COLS; c++) {
    ctx.moveTo(nodes[c * (ROWS + 1)].x, nodes[c * (ROWS + 1)].y);
    for (let r = 1; r <= ROWS; r++) {
      ctx.lineTo(nodes[c * (ROWS + 1) + r].x, nodes[c * (ROWS + 1) + r].y);
    }
  }

  // Horizontal lines
  for (let r = 0; r <= ROWS; r++) {
    ctx.moveTo(nodes[r].x, nodes[r].y);
    for (let c = 1; c <= COLS; c++) {
      ctx.lineTo(nodes[c * (ROWS + 1) + r].x, nodes[c * (ROWS + 1) + r].y);
    }
  }
  
  ctx.stroke();

  // Draw solid industrial nodes
  ctx.fillStyle = '#0055FF'; // Agency Blue nodes
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    // Only draw nodes that are stressed (far from base)
    const stress = Math.abs(node.x - node.baseX) + Math.abs(node.y - node.baseY);
    if (stress > 2 || isSnap) {
      ctx.fillRect(node.x - 2, node.y - 2, 4, 4);
    }
  }
};
