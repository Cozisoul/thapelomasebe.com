import React, { useEffect, useRef, useState } from 'react';

const AcousticRegistry = () => {
  const containerRef = useRef();
  const exportTriggerRef = useRef(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let p5Instance = null;
    let mic = null;

    const initP5 = async () => {
      try {
        // Dynamically import p5 and p5.sound to avoid SSR issues in Astro
        const p5Module = await import('p5');
        const p5 = p5Module.default;
        
        window.p5 = p5; // Make p5 global so p5.sound can find it
        
        // p5.sound must be imported globally. Since p5 v1.9.0 it's no longer bundled.
        if (!window.p5.prototype.FFT) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/addons/p5.sound.min.js';
            script.integrity = 'sha384-Ozi5ax1b+B/XBCzskytbAcQlgO0fcBp6gBOgS1SNQgR55vMk33RdVPAAAvB/8kA6';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        const sketch = (p) => {
          let fft;

          p.setup = () => {
            const canvas = p.createCanvas(p.windowWidth * 0.6, 400);
            canvas.parent(containerRef.current);
            
            p.userStartAudio(); // Required by modern browsers
            mic = new p5.AudioIn();
            mic.start();
            fft = new p5.FFT(0.8, 256); 
            fft.setInput(mic);
          };

          p.draw = () => {
            p.background('#050505'); // Void Black
            p.stroke('#FFF8E7');     // Cosmic Latte
            p.noFill();
            p.strokeWeight(1);

            // Draw Grid Infrastructure
            p.stroke(255, 248, 231, 30);
            for (let i = 0; i < p.width; i += 40) p.line(i, 0, i, p.height);
            for (let j = 0; j < p.height; j += 40) p.line(0, j, p.width, j);

            // Analyze Signal
            if (fft) {
              let spectrum = fft.analyze();

              // The Systematic Path: Frequency Histogram
              p.beginShape();
              p.stroke('#0000FF'); // Blueprint Blue
              for (let i = 0; i < spectrum.length; i++) {
                let x = p.map(i, 0, spectrum.length, 0, p.width);
                let h = p.map(spectrum[i], 0, 255, p.height, 0);
                p.vertex(x, h);
                
                // The Poetic Path: Add 1-bit Dither artifacts to peaks
                if (spectrum[i] > 200) {
                  p.push();
                  p.stroke(255);
                  p.point(x + p.random(-5, 5), h + p.random(-5, 5));
                  p.pop();
                }
              }
              p.endShape();
            }

            // Telemetry: Crosshair Probing
            if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
              p.stroke(255, 0, 0, 150); // Error Red for crosshair
              p.line(p.mouseX, 0, p.mouseX, p.height);
              let freq = p.round(p.map(p.mouseX, 0, p.width, 20, 20000));
              
              p.noStroke();
              p.fill('#FFF8E7');
              p.textFont('monospace');
              p.textSize(10);
              p.text(`${freq}Hz`, p.mouseX + 10, p.mouseY - 10);
            }

            // The Freeze Frame Export Logic
            if (exportTriggerRef.current) {
              p.saveCanvas(`SPECTRAL_PROBE_${p.frameCount}`, 'png');
              exportTriggerRef.current = false;
            }
          };

          p.windowResized = () => {
            if (containerRef.current) {
              p.resizeCanvas(containerRef.current.clientWidth, 400);
            }
          };
        };

        p5Instance = new p5(sketch);
        setIsInitializing(false);

      } catch (err) {
        console.error("Failed to load p5 or p5.sound:", err);
        setError(err.message);
        setIsInitializing(false);
      }
    };

    initP5();

    return () => {
      if (mic) {
        mic.stop();
        mic.dispose();
      }
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  }, []);

  const handleFreezeFrame = () => {
    exportTriggerRef.current = true;
  };

  return (
    <div className="w-full lg:w-3/4 flex flex-col min-h-screen bg-system-black text-cosmic-latte p-6">
      <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full gap-4">
        
        {/* Viewport header */}
        <div className="border-b border-white/20 pb-2 mb-2">
          <h2 className="font-sans text-xl uppercase tracking-tighter">THE_SCOPE // VIEWPORT</h2>
        </div>

        {error ? (
          <div className="text-red-500 font-mono text-[10px] uppercase border border-red-500 p-4">
            RUNTIME_ERROR: {error}
          </div>
        ) : (
          <div className="relative">
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-system-black/80 z-10 border border-white/10">
                <span className="font-mono text-[10px] tracking-widest uppercase animate-pulse">INITIATING_SYSTEM...</span>
              </div>
            )}
            {/* The p5 Canvas Container */}
            <div ref={containerRef} className="border border-white/10 w-full bg-[#050505] cursor-crosshair min-h-[250px] md:min-h-[400px]" />
          </div>
        )}
        
        {/* Metadata and Controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mt-2">
          <div className="font-mono text-[10px] uppercase opacity-50 flex flex-col gap-1">
            <span>Source: Local_Input_Stream (Mic)</span>
            <span>Resolution: 256_Bins</span>
            <span>Status: Runtime_Active</span>
          </div>

          <button 
            onClick={handleFreezeFrame}
            className="py-3 px-6 font-mono text-[10px] tracking-widest uppercase border border-white/20 hover:bg-[#0000FF] hover:border-[#0000FF] hover:text-white transition-colors"
          >
            [ FREEZE_FRAME_EXPORT ]
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcousticRegistry;
