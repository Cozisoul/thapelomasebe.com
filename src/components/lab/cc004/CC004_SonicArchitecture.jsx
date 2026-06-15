import React, { useEffect, useRef, useState } from 'react';
import { Pane } from 'tweakpane';
import { AudioEngine } from './AudioEngine';

// Module placeholders
import { AmplitudeMatrix } from './modules/01_AmplitudeMatrix';
import { TypographicSignal } from './modules/02_TypographicSignal';
import { IterativeGlyphEngine } from './modules/03_IterativeGlyphEngine';
import { SpectralCentroid } from './modules/04_SpectralCentroid';
import { AudioReactiveASCII } from './modules/05_AudioReactiveASCII';
import { VariableTypography } from './modules/06_VariableTypography';
import { DitherModulator } from './modules/07_DitherModulator';
import { ElasticGrid } from './modules/08_ElasticGrid';
import { KineticGridTension } from './modules/09_KineticGridTension';
import { ComponentStressAudit } from './modules/10_ComponentStressAudit';
import { LissajousOrbiters } from './modules/11_LissajousOrbiters';
import { MasterSequencer } from './modules/12_MasterSequencer';

const CC004_SonicArchitecture = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const paneRef = useRef(null);
  const engineRef = useRef(null);
  const reqRef = useRef(null);
  
  // Interpolated audio data state
  const audioDataRef = useRef({
    rms: 0,
    bass: 0,
    lowMid: 0,
    highMid: 0,
    treble: 0,
    fft: new Uint8Array(512),
    timeData: new Float32Array(1024)
  });

  const [activeModule, setActiveModule] = useState(1);
  const activeModuleRef = useRef(1); // For requestAnimationFrame access
  const [hasStarted, setHasStarted] = useState(false);
  const audioSourceRef = useRef('Microphone');
  const previousAudioUrlRef = useRef(null);

  useEffect(() => {
    // Setup Audio Engine
    engineRef.current = new AudioEngine();

    // Setup Tweakpane
    const pane = new Pane({
      title: 'SONIC_ARCHITECTURE',
      container: document.createElement('div'), // We will style this later or let it float
    });
    paneRef.current = pane;
    
    // Position tweakpane absolute top right
    pane.element.style.position = 'absolute';
    pane.element.style.top = '16px';
    pane.element.style.right = '16px';
    pane.element.style.zIndex = '50';
    containerRef.current.appendChild(pane.element);

    const PARAMS = {
      source: 'Microphone',
      file: null,
      module: 1,
      smoothing: 0.15 // Lerp factor
    };

    const audioFolder = pane.addFolder({ title: 'Audio Source' });
    
    audioFolder.addBinding(PARAMS, 'source', {
      options: {
        Microphone: 'Microphone',
        SystemAudio: 'SystemAudio',
        FileUpload: 'FileUpload'
      }
    }).on('change', (ev) => {
      audioSourceRef.current = ev.value;
      if (window.gtmPush) window.gtmPush('lab_engine_init', { project_id: 'CC_004', input_type: ev.value });
      if (ev.value === 'Microphone') {
        if (engineRef.current && hasStarted) {
          engineRef.current.initMic();
        }
      } else if (ev.value === 'SystemAudio') {
        if (engineRef.current && hasStarted) {
          engineRef.current.initSystemAudio();
        }
      } else {
        engineRef.current.stop();
        // Here we could trigger a file input click, but for simplicity
        // let's create a hidden input.
      }
    });

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => {
      if (e.target.files[0]) {
        if (previousAudioUrlRef.current) URL.revokeObjectURL(previousAudioUrlRef.current);
        const url = URL.createObjectURL(e.target.files[0]);
        previousAudioUrlRef.current = url;
        engineRef.current.initFile(url);
        setHasStarted(true);
      }
    };
    document.body.appendChild(fileInput);

    audioFolder.addButton({ title: 'Select File' }).on('click', () => {
      if (PARAMS.source !== 'FileUpload') {
        alert('Please switch source to FileUpload first');
        return;
      }
      fileInput.click();
    });

    const moduleFolder = pane.addFolder({ title: 'Master Sequencer' });
    moduleFolder.addBinding(PARAMS, 'module', {
      min: 1, max: 12, step: 1
    }).on('change', (ev) => {
      setActiveModule(ev.value);
      activeModuleRef.current = ev.value;
      if (window.gtmPush) window.gtmPush('lab_parameter_tweak', { project_id: 'CC_004', parameter_name: `module_${ev.value}` });
    });

    moduleFolder.addBinding(PARAMS, 'smoothing', {
      min: 0.01, max: 1.0, step: 0.01
    });

    // Main Render Loop
    const ctx = canvasRef.current.getContext('2d');
    
    const resize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Lerp helper
    const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

    const renderLoop = () => {
      const engine = engineRef.current;
      const data = audioDataRef.current;
      
      // Get raw targets
      const targetRMS = engine.getRMS();
      const targetBands = engine.getBands();
      
      // Interpolate for smooth visual data
      const smooth = PARAMS.smoothing;
      data.rms = lerp(data.rms, targetRMS, smooth);
      data.bass = lerp(data.bass, targetBands.bass, smooth);
      data.lowMid = lerp(data.lowMid, targetBands.lowMid, smooth);
      data.highMid = lerp(data.highMid, targetBands.highMid, smooth);
      data.treble = lerp(data.treble, targetBands.treble, smooth);
      data.fft = engine.getFFT(); // raw un-lerped fft for exact band mapping
      data.timeData = engine.getTimeDomain();

      // Clear canvas (modules can override this if they want to build up)
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      
      // Route to active module
      const modIdx = activeModuleRef.current;
      
      if (modIdx === 1) {
        AmplitudeMatrix(ctx, w, h, data);
      } else if (modIdx === 2) {
        TypographicSignal(ctx, w, h, data);
      } else if (modIdx === 3) {
        IterativeGlyphEngine(ctx, w, h, data);
      } else if (modIdx === 4) {
        SpectralCentroid(ctx, w, h, data);
      } else if (modIdx === 5) {
        AudioReactiveASCII(ctx, w, h, data);
      } else if (modIdx === 6) {
        VariableTypography(ctx, w, h, data);
      } else if (modIdx === 7) {
        DitherModulator(ctx, w, h, data);
      } else if (modIdx === 8) {
        ElasticGrid(ctx, w, h, data);
      } else if (modIdx === 9) {
        KineticGridTension(ctx, w, h, data);
      } else if (modIdx === 10) {
        ComponentStressAudit(ctx, w, h, data);
      } else if (modIdx === 11) {
        LissajousOrbiters(ctx, w, h, data);
      } else if (modIdx === 12) {
        MasterSequencer(ctx, w, h, data);
      } else {
        // Fallback or not implemented
        ctx.fillStyle = '#1A1A1A'; // gallery-brown dark theme fallback
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Module ${modIdx} Pending`, w/2, h/2);
      }

      reqRef.current = requestAnimationFrame(renderLoop);
    };

    reqRef.current = requestAnimationFrame(renderLoop);

    return () => {
      engineRef.current.stop();
      cancelAnimationFrame(reqRef.current);
      pane.dispose();
      window.removeEventListener('resize', resize);
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput);
      }
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        if (previousAudioUrlRef.current) URL.revokeObjectURL(previousAudioUrlRef.current);
        const url = URL.createObjectURL(file);
        previousAudioUrlRef.current = url;
        
        // Auto-switch Tweakpane UI
        audioSourceRef.current = 'FileUpload';
        if (paneRef.current) {
          const inputs = paneRef.current.children[0].children; // hacky way to find the binding
          // We don't strictly need to update Tweakpane visually if it's hard, 
          // but we can just initialize the engine.
        }
        
        engineRef.current.initFile(url);
        setHasStarted(true);
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen bg-system-black overflow-hidden flex-1"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* UI overlay if needed, but Tweakpane handles controls */}
      <div className="absolute bottom-6 left-6 font-mono text-[10px] text-system-white opacity-50 uppercase tracking-widest pointer-events-none">
        [AUDIO_REGISTRY_12] // MODULE_{String(activeModule).padStart(2, '0')}
      </div>
      
      {/* DECODER LEGEND OVERLAY (Only visible for Module 03) */}
      {activeModule === 3 && (
        <div className="absolute top-0 right-0 h-full w-64 bg-system-black/90 border-l border-white/20 p-6 flex flex-col font-mono text-[10px] text-white z-40 overflow-y-auto">
          <div className="mb-8 tracking-[0.2em] opacity-50 uppercase">
            // DECODER_LEGEND
            <br/>[ITERATIVE_GLYPH_ENGINE]
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_01 [SUB_BASS]</span><span>●</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_02 [BASS]</span><span>○</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_03 [KICK]</span><span>■</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_04 [LOW_MID]</span><span>□</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_05 [MID_1]</span><span>▲</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_06 [MID_2]</span><span>△</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_07 [HIGH_MID]</span><span>/</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_08 [PRESENCE]</span><span>\</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_09 [TREBLE_1]</span><span>|</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_10 [TREBLE_2]</span><span>-</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_11 [AIR]</span><span>+</span></div>
            <div className="flex justify-between border-b border-white/10 pb-2"><span>BIN_12 [NOISE]</span><span>×</span></div>
          </div>
          <div className="mt-8 opacity-40 leading-relaxed">
            SYSTEM_LOG: Each transient dictates a new line. The highest frequency bin energy within the transient selects the architectural primitive.
          </div>
        </div>
      )}

      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex flex-col gap-4 items-center justify-center bg-system-black/80 backdrop-blur-sm cursor-pointer"
          onClick={() => {
            if (audioSourceRef.current === 'Microphone') {
              engineRef.current.initMic();
            } else if (audioSourceRef.current === 'SystemAudio') {
              engineRef.current.initSystemAudio();
            }
            setHasStarted(true);
          }}
        >
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase border border-white/20 text-white px-8 py-4 hover:bg-white hover:text-black transition-colors">
            [ INITIALIZE_AUDIO_ENGINE ]
          </div>
          <div className="font-mono text-[10px] text-white/50 uppercase tracking-widest mt-4">
            OR DRAG AND DROP AN AUDIO FILE HERE
          </div>
        </div>
      )}
    </div>
  );
};

export default CC004_SonicArchitecture;
