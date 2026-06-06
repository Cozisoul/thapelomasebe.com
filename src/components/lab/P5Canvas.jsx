import React, { useEffect, useRef, useState } from 'react';

/**
 * P5Canvas — React wrapper for p5.js sketches in Astro.
 * Uses dynamic import so p5 only loads when this component mounts.
 * Must be rendered with client:only="react" in Astro.
 */
const P5Canvas = ({ sketchFactory, config = {}, className = '', onReady }) => {
  const wrapperRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const p5Module = await import('p5');
        const p5 = p5Module.default;
        if (cancelled || !wrapperRef.current) return;

        const sketchFn = sketchFactory(config);
        p5InstanceRef.current = new p5(sketchFn, wrapperRef.current);
        if (onReady) onReady(p5InstanceRef.current);
        setIsLoading(false);
      } catch (err) {
        console.error('[P5Canvas] Failed to initialize:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
      {/* Crosshair corner markers */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/20 pointer-events-none z-10" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/20 pointer-events-none z-10" />
      <div className="absolute bottom-8 left-2 w-4 h-4 border-b border-l border-white/20 pointer-events-none z-10" />
      <div className="absolute bottom-8 right-2 w-4 h-4 border-b border-r border-white/20 pointer-events-none z-10" />

      {/* Canvas container */}
      <div ref={wrapperRef} className="w-full h-full [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:!display-block" />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <div className="font-mono text-[10px] text-white/50 uppercase tracking-widest animate-pulse">
            INITIALIZING_RUNTIME...
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <div className="font-mono text-[10px] text-red-500 uppercase tracking-widest text-center px-4">
            RUNTIME_ERROR<br/>{error}
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/80 border-t border-white/10 flex items-center justify-between px-3 z-10">
        <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
          LIVE_INFERENCE_ACTIVE // SYSTEM_0723
        </span>
        <span className="font-mono text-[9px] text-green-500/60 uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          STREAMING
        </span>
      </div>
    </div>
  );
};

export default P5Canvas;
