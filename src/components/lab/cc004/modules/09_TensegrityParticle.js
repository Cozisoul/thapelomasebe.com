let particles = [];
let initialized = false;
let previousRMS = 0;

function initParticles(w, h) {
  particles = [];
  const numParticles = 150;
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: w / 2 + (Math.random() - 0.5) * 100,
      y: h / 2 + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
      radius: Math.random() * 2 + 1,
      mass: Math.random() * 0.8 + 0.2
    });
  }
  initialized = true;
}

export const TensegrityParticle = (ctx, w, h, data) => {
  if (!initialized || (particles.length > 0 && isNaN(particles[0].x))) {
    initParticles(w, h);
  }

  const { rms } = data;
  
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  // Detect explosion (kick drum proxy)
  const isKick = (rms - previousRMS > 0.08);
  previousRMS = rms;

  const centerX = w / 2;
  const centerY = h / 2;
  
  // Physics parameters
  const centerAttraction = 0.005; // Pull back together during silence
  const friction = 0.92;
  const connectionDistance = 80 + (rms * 200);

  // Update physics
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    if (isKick) {
      // Explosive force from center
      const angle = Math.atan2(p.y - centerY, p.x - centerX);
      const force = (Math.random() * 50 + 20) * rms * p.mass;
      p.vx += Math.cos(angle) * force;
      p.vy += Math.sin(angle) * force;
    }

    // Gentle pull to center
    p.vx += (centerX - p.x) * centerAttraction * p.mass;
    p.vy += (centerY - p.y) * centerAttraction * p.mass;

    // Apply wind/drift based on rms
    p.vx += Math.sin(Date.now() * 0.001 + p.y * 0.01) * rms * 5;
    
    p.vx *= friction;
    p.vy *= friction;
    p.x += p.vx;
    p.y += p.vy;

    // Bounds check
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;
  }

  // Render Connections (Tensegrity springs)
  ctx.lineWidth = 0.5;
  
  for (let i = 0; i < particles.length; i++) {
    const p1 = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distSq = dx*dx + dy*dy;
      
      if (distSq < connectionDistance * connectionDistance) {
        const dist = Math.sqrt(distSq);
        const opacity = 1.0 - (dist / connectionDistance);
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  // Render Particles
  ctx.fillStyle = '#0055FF'; // agency-blue
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + (rms * 5), 0, Math.PI * 2);
    ctx.fill();
  }
};
