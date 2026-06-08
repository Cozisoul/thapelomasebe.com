import React, { useRef, useState, useEffect, useCallback } from 'react';

const ASCII_PRESETS = {
  'simple': '`.-',
  'medium': '`.-:+=*#%@',
  'detailed': '`.-_:,;il!I><~+?][}{1)(|\\/tfjrxnuvczXYUJCQ0OZmwqpdbkhao*#MW&8%B@$',
  'blocks': ' ░▒▓█',
  'custom': '',
};

export default function CC002_EffectRoulette() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [sourceImage, setSourceImage] = useState(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  
  const [settings, setSettings] = useState({
    effect: 'pixelate',
    pixelSize: 20,
    bitmapThreshold: 128,
    asciiPreset: 'medium',
    asciiChars: '`.-:+=*#%@',
    halftoneShape: 'circle',
    anaglyphShift: 10,
    glitchSliceCount: 20,
    glitchColorShift: 10,
    brightness: 0,
    contrast: 0,
    voxelDepth: 5,
  });

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'asciiPreset' && value !== 'custom') {
        next.asciiChars = ASCII_PRESETS[value];
      }
      if (key === 'asciiChars') {
        next.asciiPreset = 'custom';
      }
      return next;
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
        if (useWebcam) setUseWebcam(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const getAverage = (imageData, x, y, w, h) => {
    const data = imageData.data;
    const width = imageData.width;
    let r = 0, g = 0, b = 0, count = 0;

    for (let i = x; i < x + w; i++) {
      for (let j = y; j < y + h; j++) {
        if (i >= 0 && i < width && j >= 0 && j < imageData.height) {
          const index = (j * width + i) * 4;
          r += data[index];
          g += data[index + 1];
          b += data[index + 2];
          count++;
        }
      }
    }
    if (count === 0) return { r: 0, g: 0, b: 0, brightness: 0 };
    return { r: r / count, g: g / count, b: b / count, brightness: (r / count + g / count + b / count) / 3 };
  };

  const applyBrightnessContrast = (data, brightness, contrast) => {
    brightness = (brightness / 100) * 255;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] + brightness;
      let g = data[i + 1] + brightness;
      let b = data[i + 2] + brightness;
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  };

  const renderEffect = useCallback((mediaSource) => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!mediaSource) {
      canvas.width = 500;
      canvas.height = 300;
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, 500, 300);
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.font = '14px monospace';
      ctx.fillText('PLEASE UPLOAD AN IMAGE OR TURN WEBCAM ON', 250, 150);
      return;
    }

    const targetWidth = mediaSource.videoWidth || mediaSource.width;
    const targetHeight = mediaSource.videoHeight || mediaSource.height;
    
    if (targetWidth === 0 || targetHeight === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const aspectRatio = targetWidth / targetHeight;
    let previewWidth = Math.min(rect.width * 0.9, targetWidth);
    let previewHeight = previewWidth / aspectRatio;

    if (previewHeight > rect.height * 0.9) {
      previewHeight = rect.height * 0.9;
      previewWidth = previewHeight * aspectRatio;
    }

    canvas.width = previewWidth;
    canvas.height = previewHeight;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = targetWidth;
    offscreenCanvas.height = targetHeight;
    const offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

    offCtx.fillStyle = '#000';
    offCtx.fillRect(0, 0, targetWidth, targetHeight);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Invert horizontal if it's webcam so it acts like a mirror
    if (mediaSource.videoWidth) {
      tempCtx.translate(targetWidth, 0);
      tempCtx.scale(-1, 1);
    }
    tempCtx.drawImage(mediaSource, 0, 0, targetWidth, targetHeight);
    
    const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
    const currSettings = settingsRef.current;
    
    applyBrightnessContrast(imageData.data, currSettings.brightness, currSettings.contrast);

    const { effect, pixelSize, voxelDepth, bitmapThreshold, halftoneShape, asciiChars, anaglyphShift, glitchSliceCount, glitchColorShift } = currSettings;

    if (effect === 'pixelate') {
      const size = pixelSize;
      for (let y = 0; y < targetHeight; y += size) {
        for (let x = 0; x < targetWidth; x += size) {
          const avg = getAverage(imageData, x, y, size, size);
          offCtx.fillStyle = `rgb(${avg.r}, ${avg.g}, ${avg.b})`;
          offCtx.fillRect(x, y, size, size);
        }
      }
    } else if (effect === 'voxelize') {
      const size = pixelSize;
      const depth = voxelDepth;
      for (let y = 0; y < targetHeight; y += size) {
        for (let x = 0; x < targetWidth; x += size) {
          const avg = getAverage(imageData, x, y, size, size);
          offCtx.fillStyle = `rgb(${avg.r * 0.8}, ${avg.g * 0.8}, ${avg.b * 0.8})`;
          offCtx.fillRect(x, y, size, size);
          offCtx.fillStyle = `rgb(${avg.r}, ${avg.g}, ${avg.b})`;
          offCtx.fillRect(x - depth, y - depth, size, size);
        }
      }
    } else if (effect === 'bitmap') {
      const d = imageData.data;
      const gs = new Uint8ClampedArray(targetWidth * targetHeight);
      for (let i = 0; i < d.length; i += 4) {
        gs[i / 4] = (d[i] * 0.299) + (d[i + 1] * 0.587) + (d[i + 2] * 0.114);
      }
      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
          const i = y * targetWidth + x;
          const oldPixel = gs[i];
          const newPixel = oldPixel < bitmapThreshold ? 0 : 255;
          const quantError = oldPixel - newPixel;
          gs[i] = newPixel;
          if (x + 1 < targetWidth) gs[i + 1] += quantError * 7 / 16;
          if (x - 1 >= 0 && y + 1 < targetHeight) gs[i - 1 + targetWidth] += quantError * 3 / 16;
          if (y + 1 < targetHeight) gs[i + targetWidth] += quantError * 5 / 16;
          if (x + 1 < targetWidth && y + 1 < targetHeight) gs[i + 1 + targetWidth] += quantError * 1 / 16;
        }
      }
      const outImageData = offCtx.createImageData(targetWidth, targetHeight);
      const outData = outImageData.data;
      for (let i = 0; i < gs.length; i++) {
        const val = gs[i];
        outData[i * 4] = val;
        outData[i * 4 + 1] = val;
        outData[i * 4 + 2] = val;
        outData[i * 4 + 3] = 255;
      }
      offCtx.putImageData(outImageData, 0, 0);
    } else if (effect === 'halftone') {
      const size = pixelSize;
      offCtx.fillStyle = '#fff';
      offCtx.fillRect(0, 0, targetWidth, targetHeight);
      offCtx.fillStyle = '#000';
      for (let y = 0; y < targetHeight; y += size) {
        for (let x = 0; x < targetWidth; x += size) {
          const avg = getAverage(imageData, x, y, size, size);
          const radius = (1 - avg.brightness / 255) * (size / 2) * 1.2;
          if (radius > 0) {
            if (halftoneShape === 'circle') {
              offCtx.beginPath();
              offCtx.arc(x + size / 2, y + size / 2, radius, 0, Math.PI * 2);
              offCtx.fill();
            } else {
              offCtx.fillRect(x + size / 2 - radius, y + size / 2 - radius, radius * 2, radius * 2);
            }
          }
        }
      }
    } else if (effect === 'ascii') {
      const size = pixelSize;
      const chars = asciiChars;
      if (chars) {
        offCtx.font = `${size * 1.2}px monospace`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        for (let y = 0; y < targetHeight; y += size) {
          for (let x = 0; x < targetWidth; x += size) {
            const avg = getAverage(imageData, x, y, size, size);
            const charIndex = Math.round(avg.brightness / 255 * (chars.length - 1));
            const char = chars[charIndex];
            offCtx.fillStyle = `rgb(${avg.r}, ${avg.g}, ${avg.b})`;
            offCtx.fillText(char, x + size / 2, y + size / 2);
          }
        }
      }
    } else if (effect === 'anaglyph') {
      const shift = anaglyphShift;
      const srcData = imageData.data;
      const outImageData = offCtx.createImageData(targetWidth, targetHeight);
      const outData = outImageData.data;
      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
          const i = (y * targetWidth + x) * 4;
          const redX = Math.max(0, x - shift);
          const redIndex = (y * targetWidth + redX) * 4;
          outData[i] = srcData[redIndex];
          outData[i + 1] = srcData[i + 1];
          outData[i + 2] = srcData[i + 2];
          outData[i + 3] = 255;
        }
      }
      offCtx.putImageData(outImageData, 0, 0);
    } else if (effect === 'glitch') {
      offCtx.putImageData(imageData, 0, 0);
      for (let i = 0; i < glitchSliceCount; i++) {
        const y = Math.random() * targetHeight;
        const h = Math.random() * (targetHeight / 10);
        const sliceData = offCtx.getImageData(0, y, targetWidth, h);
        const shift = (Math.random() - 0.5) * (glitchSliceCount / 2);
        offCtx.putImageData(sliceData, shift, y);
      }
      const shiftedImageData = offCtx.getImageData(0, 0, targetWidth, targetHeight);
      const shiftedData = shiftedImageData.data;
      const outImageData = offCtx.createImageData(targetWidth, targetHeight);
      const outData = outImageData.data;
      for (let i = 0; i < shiftedData.length; i += 4) {
        const x = (i / 4) % targetWidth;
        const y = Math.floor((i / 4) / targetWidth);
        const redX = Math.max(0, x - glitchColorShift);
        const redIndex = (y * targetWidth + redX) * 4;
        const blueX = Math.min(targetWidth - 1, x + glitchColorShift);
        const blueIndex = (y * targetWidth + blueX) * 4;
        outData[i] = shiftedData[redIndex];
        outData[i + 1] = shiftedData[i + 1];
        outData[i + 2] = shiftedData[blueIndex + 2];
        outData[i + 3] = shiftedData[i + 3];
      }
      offCtx.putImageData(outImageData, 0, 0);
      offCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let y = 0; y < targetHeight; y += 4) {
        offCtx.fillRect(0, y, targetWidth, 2);
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreenCanvas, 0, 0, targetWidth, targetHeight, 0, 0, previewWidth, previewHeight);

  }, []); // removed dependencies since it uses settingsRef

  useEffect(() => {
    if (useWebcam) {
      if (!videoRef.current) {
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        videoRef.current = video;
      }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(err => console.error("Webcam error:", err));
      
      const loop = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          renderEffect(videoRef.current);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderEffect(sourceImage);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [useWebcam, sourceImage, renderEffect]);

  useEffect(() => {
    if (!useWebcam) {
      renderEffect(sourceImage);
    }
  }, [settings, useWebcam, sourceImage, renderEffect]);

  const exportPng = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `effect_roulette_${settings.effect}_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <section className="w-full lg:w-1/2 bg-system-black relative min-h-[60vh] lg:min-h-screen flex items-center justify-center p-8">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
          <canvas ref={canvasRef} className="bg-[#111] shadow-2xl" />
        </div>
      </section>

      <aside 
        data-lenis-prevent="true" 
        className="overscroll-contain w-full lg:w-1/4 lg:h-screen lg:sticky lg:top-0 bg-[#1a1a1a] text-white border-t lg:border-t-0 lg:border-l border-system-black/20 overflow-y-auto p-6 font-sans" 
        style={{ color: '#eee' }}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <h3 className="font-mono text-lg mb-6 tracking-wider">EFFECT ROULETTE</h3>

        <div className="mb-6">
          <button 
            onClick={() => setUseWebcam(!useWebcam)}
            className={`w-full uppercase text-[10px] font-bold py-3 mb-2 rounded-sm border transition-colors ${useWebcam ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/30 hover:bg-white/10'}`}
          >
            {useWebcam ? '📹 WEBCAM ACTIVE (CLICK TO DISABLE)' : '📹 ENABLE WEBCAM'}
          </button>
          
          {!useWebcam && (
            <div>
              <label className="block mb-2 mt-4 text-xs uppercase tracking-wider opacity-70">Source Image</label>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="w-full text-xs font-mono text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-mono file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer" />
            </div>
          )}
        </div>

        <div className="mb-6 space-y-4">
          <h4 className="font-mono text-xs uppercase opacity-50 border-b border-white/10 pb-1">Adjustments</h4>
          <div>
            <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">Brightness: {settings.brightness}</label>
            <input type="range" className="w-full" min="-100" max="100" value={settings.brightness} onChange={(e) => updateSetting('brightness', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">Contrast: {settings.contrast}</label>
            <input type="range" className="w-full" min="-100" max="100" value={settings.contrast} onChange={(e) => updateSetting('contrast', parseInt(e.target.value))} />
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <h4 className="font-mono text-xs uppercase opacity-50 border-b border-white/10 pb-1">Effect</h4>
          <select className="w-full p-2 bg-white/5 border border-white/10 text-white font-mono text-xs" value={settings.effect} onChange={(e) => updateSetting('effect', e.target.value)}>
            {['pixelate', 'voxelize', 'bitmap', 'halftone', 'ascii', 'anaglyph', 'glitch'].map(eff => (
              <option key={eff} value={eff}>{eff}</option>
            ))}
          </select>

          {['pixelate', 'halftone', 'ascii', 'voxelize'].includes(settings.effect) && (
            <div>
              <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">Size / Density: {settings.pixelSize}</label>
              <input type="range" className="w-full" min="2" max="100" value={settings.pixelSize} onChange={(e) => updateSetting('pixelSize', parseInt(e.target.value))} />
            </div>
          )}

          {settings.effect === 'voxelize' && (
            <div>
              <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">Voxel Depth: {settings.voxelDepth}</label>
              <input type="range" className="w-full" min="0" max="20" value={settings.voxelDepth} onChange={(e) => updateSetting('voxelDepth', parseInt(e.target.value))} />
            </div>
          )}

          {settings.effect === 'bitmap' && (
            <div>
              <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">Bitmap Threshold: {settings.bitmapThreshold}</label>
              <input type="range" className="w-full" min="1" max="254" value={settings.bitmapThreshold} onChange={(e) => updateSetting('bitmapThreshold', parseInt(e.target.value))} />
            </div>
          )}

          {settings.effect === 'anaglyph' && (
            <div>
              <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">3D Shift: {settings.anaglyphShift}</label>
              <input type="range" className="w-full" min="-50" max="50" value={settings.anaglyphShift} onChange={(e) => updateSetting('anaglyphShift', parseInt(e.target.value))} />
            </div>
          )}

          {settings.effect === 'glitch' && (
            <>
              <div>
                <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">Glitch Slices: {settings.glitchSliceCount}</label>
                <input type="range" className="w-full" min="0" max="100" value={settings.glitchSliceCount} onChange={(e) => updateSetting('glitchSliceCount', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">Color Shift: {settings.glitchColorShift}</label>
                <input type="range" className="w-full" min="0" max="50" value={settings.glitchColorShift} onChange={(e) => updateSetting('glitchColorShift', parseInt(e.target.value))} />
              </div>
            </>
          )}

          {settings.effect === 'halftone' && (
            <div>
              <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">Shape</label>
              <select className="w-full p-2 bg-white/5 border border-white/10 text-white font-mono text-xs" value={settings.halftoneShape} onChange={(e) => updateSetting('halftoneShape', e.target.value)}>
                <option value="circle">Circle</option>
                <option value="square">Square</option>
              </select>
            </div>
          )}

          {settings.effect === 'ascii' && (
            <>
              <div>
                <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">ASCII Preset</label>
                <select className="w-full p-2 bg-white/5 border border-white/10 text-white font-mono text-xs" value={settings.asciiPreset} onChange={(e) => updateSetting('asciiPreset', e.target.value)}>
                  {Object.keys(ASCII_PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-xs uppercase tracking-wider opacity-70">Characters</label>
                <input type="text" className="w-full p-2 bg-white/5 border border-white/10 text-white font-mono text-xs" value={settings.asciiChars} onChange={(e) => updateSetting('asciiChars', e.target.value)} />
              </div>
            </>
          )}
        </div>

        <button onClick={exportPng} className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors">
          Export PNG
        </button>
      </aside>
    </>
  );
}
