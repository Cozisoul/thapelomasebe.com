import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * CanvasIsland — React wrapper for vanilla Canvas API sketches.
 * Handles requestAnimationFrame loop and cleanup.
 * Must be rendered with client:only="react" in Astro.
 */
const CanvasIsland = ({ renderClass, config = {}, className = '' }) => {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;

    // Instantiate the render class (e.g., CellularDither)
    if (renderClass) {
      const RenderClass = renderClass;
      instanceRef.current = new RenderClass(config);
      instanceRef.current.start(canvas);
    }

    const handleResize = () => {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
      if (instanceRef.current) {
        instanceRef.current.stop();
        instanceRef.current = null;
      }
    };
  }, [renderClass, config]);

  const handlePause = useCallback(() => {
    if (!instanceRef.current) return;
    if (isRunning) {
      instanceRef.current.stop();
    } else {
      instanceRef.current.start(canvasRef.current);
    }
    setIsRunning(!isRunning);
  }, [isRunning]);

  const handleReset = useCallback(() => {
    if (!instanceRef.current) return;
    instanceRef.current.reset();
  }, []);

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
      {/* Crosshair corner markers */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/20 pointer-events-none z-10" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/20 pointer-events-none z-10" />
      <div className="absolute bottom-8 left-2 w-4 h-4 border-b border-l border-white/20 pointer-events-none z-10" />
      <div className="absolute bottom-8 right-2 w-4 h-4 border-b border-r border-white/20 pointer-events-none z-10" />

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/80 border-t border-white/10 flex items-center justify-between px-3 z-10">
        <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
          CANVAS_RUNTIME // AUTONOMOUS
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePause}
            className="font-mono text-[9px] text-white/50 hover:text-white uppercase tracking-widest transition-colors"
          >
            [{isRunning ? 'PAUSE' : 'RESUME'}]
          </button>
          <button
            onClick={handleReset}
            className="font-mono text-[9px] text-white/50 hover:text-white uppercase tracking-widest transition-colors"
          >
            [RESET]
          </button>
          <span className={`font-mono text-[9px] uppercase flex items-center gap-1.5 ${isRunning ? 'text-green-500/60' : 'text-yellow-500/60'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            {isRunning ? 'RUNNING' : 'PAUSED'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CanvasIsland;
