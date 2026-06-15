import React, { useState, useRef, useEffect, useCallback } from 'react';
/**
 * LabRegistry — The System Registry table with live canvas preview on hover.
 * Renders a high-density project table; hovering a row shows a live mini-canvas.
 */
const LabRegistry = ({ projects }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const previewCanvasRef = useRef(null);
  const previewInstanceRef = useRef(null);
  const containerRef = useRef(null);

  // Track mouse position for the floating preview
  const handleMouseMove = useCallback((e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  // Start/stop preview canvas when hover changes
  useEffect(() => {
    if (!hoveredId || !previewCanvasRef.current) {
      if (previewInstanceRef.current) {
        previewInstanceRef.current.stop();
        previewInstanceRef.current = null;
      }
      return;
    }

    const canvas = previewCanvasRef.current;
    canvas.width = 320;
    canvas.height = 240;

    const project = projects.find(p => p.id === hoveredId);
    if (!project) return;

    const ctx = canvas.getContext('2d');
    let frameId;
    let timeoutId;

    if (project.id === 'CC_003') {
      // Cellular Dither (Game of Life preview)
      const cols = 40; const rows = 30;
      let grid = Array(cols).fill(0).map(() => Array(rows).fill(0).map(() => Math.random() > 0.8 ? 1 : 0));
      
      const draw = () => {
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 320, 240);
        ctx.fillStyle = '#FFF8e7';
        const cellW = 320/cols; const cellH = 240/rows;
        let next = Array(cols).fill(0).map(() => Array(rows).fill(0));
        
        for(let x=0;x<cols;x++) {
          for(let y=0;y<rows;y++) {
            let n = 0;
            for(let ox=-1;ox<=1;ox++) for(let oy=-1;oy<=1;oy++) {
              if(ox===0&&oy===0) continue;
              if(x+ox>=0&&x+ox<cols&&y+oy>=0&&y+oy<rows) n+=grid[x+ox][y+oy];
            }
            if(grid[x][y]) next[x][y] = (n===2||n===3)?1:0;
            else next[x][y] = (n===3)?1:0;
            if(grid[x][y]) ctx.fillRect(x*cellW, y*cellH, cellW-1, cellH-1);
          }
        }
        grid = next;
        
        // Random sparks to keep it alive
        if (Math.random() < 0.1) grid[Math.floor(Math.random()*cols)][Math.floor(Math.random()*rows)] = 1;
        
        timeoutId = setTimeout(() => { frameId = requestAnimationFrame(draw); }, 50);
      };
      draw();
      
    } else if (project.id === 'CC_001') {
      // Systematic Degradation (Matrix/Glitch ASCII preview)
      let offset = 0;
      const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$*';
      
      const draw = () => {
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; 
        ctx.fillRect(0,0,320,240);
        ctx.fillStyle = '#00ff66';
        ctx.font = '10px monospace';
        
        for(let i=0; i<30; i++) {
          const x = Math.floor(Math.random() * 32) * 10;
          const y = ((offset + Math.random()*240) % 240);
          ctx.fillText(chars[Math.floor(Math.random()*chars.length)], x, y);
        }
        
        // Scanline
        ctx.fillStyle = 'rgba(0, 255, 102, 0.1)';
        ctx.fillRect(0, (offset * 2) % 240, 320, 4);
        
        offset += 1;
        frameId = requestAnimationFrame(draw);
      };
      draw();
      
    } else if (project.id === 'CC_002') {
      // Effect Roulette (Pixelate / Halftone Preview)
      let t = 0;
      
      const draw = () => {
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,320,240);
        const cx = 160 + Math.sin(t*0.05)*60;
        const cy = 120 + Math.cos(t*0.04)*40;
        
        ctx.fillStyle = '#ff4d3d';
        const size = 12;
        
        for(let x=0; x<320; x+=size) {
          for(let y=0; y<240; y+=size) {
            const d = Math.hypot(x+size/2 - cx, y+size/2 - cy);
            if(d < 80) {
              const r = (80 - d) / 80;
              // Pixelated fading circle
              ctx.globalAlpha = r;
              ctx.fillRect(x, y, size-2, size-2);
            }
          }
        }
        ctx.globalAlpha = 1;
        t++;
        frameId = requestAnimationFrame(draw);
      };
      draw();
    }

    previewInstanceRef.current = {
      stop: () => {
        if (frameId) cancelAnimationFrame(frameId);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
  }, [hoveredId, projects]);

  return (
    <div ref={containerRef} className="relative" onMouseMove={handleMouseMove}>
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 font-mono text-[10px] opacity-40 uppercase tracking-widest mb-4 px-4 text-system-black">
        <div className="col-span-1">ID</div>
        <div className="col-span-3">PROJECT_NAME</div>
        <div className="col-span-3">ALGORITHM</div>
        <div className="col-span-2">ENGINE</div>
        <div className="col-span-2">INPUT</div>
        <div className="col-span-1 text-right">STATUS</div>
      </div>

      {/* Table Body */}
      <div className="flex flex-col border-t border-system-black/20">
        {projects.map((project, idx) => {
          const isActive = project.status === 'ACTIVE';
          const Wrapper = isActive ? 'a' : 'div';
          return (
          <Wrapper
            key={project.id}
            href={isActive ? `/lab/${project.id}` : undefined}
            className={`flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-4 border-b border-system-black/20 transition-colors group relative ${isActive ? 'hover:bg-system-black hover:text-cosmic-latte cursor-crosshair' : 'opacity-60 cursor-not-allowed bg-system-black/5'}`}
            onMouseEnter={() => {
              if (isActive) {
                setHoveredId(project.id);
                if (window.gtmPush) window.gtmPush('lab_preview_hover', { project_id: project.id, project_name: project.name });
              }
            }}
            onMouseLeave={() => isActive ? setHoveredId(null) : null}
          >
            <div className="flex justify-between md:contents">
              <div className="font-mono text-xs opacity-50 group-hover:opacity-100 md:col-span-1">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div className="md:hidden">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
                  <span className={`w-2 h-2 rounded-full ${project.status === 'ACTIVE' ? 'bg-accent-blue animate-pulse' : 'bg-accent-red'}`} />
                  <span className="uppercase">{project.status}</span>
                </span>
              </div>
            </div>
            <div className="font-bold uppercase tracking-tight md:col-span-3">
              {project.name}
            </div>
            <div className="font-mono text-[10px] uppercase opacity-80 md:col-span-3">
              {project.algorithmShort}
            </div>
            <div className="hidden md:block font-mono text-[10px] uppercase opacity-60 md:col-span-2">
              {project.engine}
            </div>
            <div className="hidden md:block font-mono text-[10px] uppercase opacity-60 md:col-span-2">
              {project.inputType === 'webcam' ? '📹 WEBCAM' : project.inputType === 'image-upload' ? '📁 IMAGE' : '⚡ AUTO'}
            </div>
            <div className="hidden md:block text-right md:col-span-1">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
                <span className={`w-2 h-2 rounded-full ${project.status === 'ACTIVE' ? 'bg-accent-blue animate-pulse' : 'bg-accent-red'}`} />
                <span className="uppercase">{project.status}</span>
              </span>
            </div>
          </Wrapper>
          );
        })}
      </div>

      {/* Floating Live Preview Canvas */}
      {hoveredId && (
        <div
          className="absolute z-50 pointer-events-none hidden md:block"
          style={{
            left: `${Math.min(mousePos.x + 20, (containerRef.current?.offsetWidth || 800) - 340)}px`,
            top: `${mousePos.y - 130}px`,
          }}
        >
          <div className="border border-system-black/30 shadow-2xl bg-black">
            <div className="flex justify-between items-center px-2 py-1 border-b border-white/10 font-mono text-[8px] text-white/40 uppercase tracking-widest">
              <span>PREVIEW_BUFFER</span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                LIVE
              </span>
            </div>
            <canvas
              ref={previewCanvasRef}
              width={320}
              height={240}
              className="block"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LabRegistry;
