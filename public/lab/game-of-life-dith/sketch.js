/* ---------- sketch.js (fixed Game of Life seeding) ---------- */

/* Globals */
let capture;
let ditherEffect;
let detailSliderEl, pixelSizeSliderEl, golToggleEl, golModeEl;
let isInitialized = false;
let themes = [
  'theme-cosmic-light',
  'theme-cosmic-dark',
  'theme-systematic-light', 
  'theme-systematic-dark',
  'theme-cyan-light',
  'theme-cyan-dark'
];
let currentThemeIndex = 3;

// GOL
let golCols = 0, golRows = 0;
let golGrid = [];
let golNext = [];
let golCellSize = 10;
let golRunning = false;
let seedMode = 'continuous';
let lockedSeedImage = null;

// Playground mode
let playgroundMode = false;
let webcamAvailable = false;

// GOL Auto features
let autoRandom = false;
let autoClear = false;
let autoRandomInterval = null;
let autoClearInterval = null;
let golSpeed = 5;

// Playground features
let playgroundDensity = 0.1;
let evolutionStep = 0;
let mutationRate = 0.05;

// Recording
let mediaRecorder = null;
let recordedChunks = [];
let recording = false;

// Use the DitherEffect from dither.js instead of local implementation

/* p5 lifecycle */
function setup(){
  const container = document.getElementById('canvas-container');
  const w = container.offsetWidth; const h = container.offsetHeight;
  
  const canvas = createCanvas(w,h);
  canvas.parent(container);
  noSmooth();

  // Request camera permission and create capture
  requestCameraPermission();

  ditherEffect = new DitherEffect();
}

function windowResized(){
  const container = document.getElementById('canvas-container');
  const w = container.offsetWidth; const h = container.offsetHeight;
  
  resizeCanvas(w,h);
  if (golRunning) initGolGrid();
}

/* DOM bindings */
function initDomBindings(){
  detailSliderEl = document.getElementById('detail-slider');
  pixelSizeSliderEl = document.getElementById('pixel-size-slider');
  golToggleEl = document.getElementById('gol-toggle');
  golModeEl = document.getElementById('gol-mode');

  document.getElementById('toggle-theme-btn').addEventListener('click', () => {
    document.body.classList.remove(themes[currentThemeIndex]);
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    document.body.classList.add(themes[currentThemeIndex]);
    applyTheme();
  });

  document.getElementById('capture-btn').addEventListener('click', () => {
    const overlay = document.getElementById('countdown-overlay');
    overlay.textContent = '3'; overlay.classList.add('visible');
    setTimeout(()=> overlay.textContent='2',600);
    setTimeout(()=> overlay.textContent='1',900);
    setTimeout(()=> { overlay.classList.remove('visible'); saveCanvas('tmm-os-dither-capture','png'); }, 1200);
  });

  document.getElementById('record-btn').addEventListener('click', toggleRecording);

  // Playground controls
  document.getElementById('clear-btn').addEventListener('click', clearPlayground);
  document.getElementById('random-btn').addEventListener('click', randomizePlayground);
  document.getElementById('pattern-btn').addEventListener('click', addPattern);
  document.getElementById('chaos-btn').addEventListener('click', createChaos);
  document.getElementById('spiral-btn').addEventListener('click', createSpiral);
  document.getElementById('maze-btn').addEventListener('click', createMaze);
  document.getElementById('fractal-btn').addEventListener('click', createFractal);
  document.getElementById('pulse-btn').addEventListener('click', createPulse);
  
  // Advanced playground controls
  document.getElementById('evolve-btn').addEventListener('click', evolvePattern);
  document.getElementById('mutate-btn').addEventListener('click', mutatePattern);
  document.getElementById('breed-btn').addEventListener('click', breedPatterns);
  document.getElementById('explode-btn').addEventListener('click', explodePattern);
  
  // Mode switch button
  document.getElementById('mode-switch-btn').addEventListener('click', toggleMode);
  
  // Slider value displays
  const detailSlider = document.getElementById('detail-slider');
  const detailValue = document.getElementById('detail-value');
  const pixelSizeSlider = document.getElementById('pixel-size-slider');
  const pixelSizeValue = document.getElementById('pixel-size-value');
  
  detailSlider.addEventListener('input', () => {
    detailValue.textContent = detailSlider.value;
  });
  
  pixelSizeSlider.addEventListener('input', () => {
    const newPixelSize = parseInt(pixelSizeSlider.value);
    pixelSizeValue.textContent = newPixelSize;
    
    // Update GOL cell size based on pixel size
    golCellSize = Math.max(2, newPixelSize);
    if (golRunning) {
      initGolGrid();
    }
  });
  
  // GOL Speed control
  const golSpeedSlider = document.getElementById('gol-speed-slider');
  const golSpeedValue = document.getElementById('gol-speed-value');
  
  golSpeedSlider.addEventListener('input', () => {
    golSpeed = parseInt(golSpeedSlider.value);
    golSpeedValue.textContent = golSpeed;
    
    // Restart auto intervals with new speed
    if (autoRandom && autoRandomInterval) {
      clearInterval(autoRandomInterval);
      autoRandomInterval = setInterval(() => {
        if (golRunning) {
          randomizePlayground();
        }
      }, 2000 / golSpeed);
    }
    if (autoClear && autoClearInterval) {
      clearInterval(autoClearInterval);
      autoClearInterval = setInterval(() => {
        if (golRunning) {
          clearPlayground();
        }
      }, 5000 / golSpeed);
    }
  });
  
  // Density slider for playground
  const densitySlider = document.getElementById('density-slider');
  const densityValue = document.getElementById('density-value');
  
  densitySlider.addEventListener('input', () => {
    playgroundDensity = parseFloat(densitySlider.value);
    densityValue.textContent = playgroundDensity.toFixed(2);
  });
  
  // GOL Pattern buttons
  document.getElementById('gol-glider-btn').addEventListener('click', () => addGliderPattern());
  document.getElementById('gol-pulsar-btn').addEventListener('click', () => addPulsarPattern());
  document.getElementById('gol-gun-btn').addEventListener('click', () => addGunPattern());
  
  // GOL Auto controls
  document.getElementById('gol-auto-random-btn').addEventListener('click', () => toggleAutoRandom());
  document.getElementById('gol-auto-clear-btn').addEventListener('click', () => toggleAutoClear());

  // Info modal functionality
  const modal = document.getElementById('info-modal');
  const infoBtn = document.getElementById('info-btn');
  const closeBtn = document.getElementsByClassName('close')[0];

  // Show modal immediately
  modal.style.display = 'block';
  
  // Also show on page load as backup
  window.addEventListener('load', () => {
    modal.style.display = 'block';
  });

  infoBtn.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  golToggleEl.addEventListener('change', () => {
    golRunning = golToggleEl.checked;
    seedMode = golModeEl.value;
    if (golRunning) {
      golCellSize = Math.max(2, parseInt(pixelSizeSliderEl.value,10));
      initGolGrid();
      // Don't seed immediately - let the draw loop handle it
    } else {
      golGrid = []; golNext = [];
      lockedSeedImage = null;
    }
  });


  golModeEl.addEventListener('change', () => {
    seedMode = golModeEl.value;
    if (seedMode === 'lock' && golRunning) {
      // Reset locked seed - will be captured in next draw cycle
      lockedSeedImage = null;
    } else if (seedMode === 'continuous' && golRunning) {
      // Clear locked seed for continuous mode
      lockedSeedImage = null;
    }
  });

  applyTheme();
  
  // Initialize UI state
  updateUIMode();
  updateModeButton();
  
  // Ensure proper initial visibility
  const webcamControls = document.querySelectorAll('.webcam-control');
  const playgroundControls = document.querySelectorAll('.playground-control');
  
  // Set initial state
  webcamControls.forEach(control => {
    control.style.display = 'flex';
    control.classList.add('show');
  });
  playgroundControls.forEach(control => {
    control.style.display = 'none';
    control.classList.remove('show');
  });
  
  // If webcam is not available, show controls and seed GOL immediately
  if (!webcamAvailable && playgroundMode) {
    setTimeout(() => {
      if (golGrid && golGrid.length > 0) {
        randomizePlayground();
      }
    }, 100);
  }
}

function toggleMode() {
  playgroundMode = !playgroundMode;
  updateUIMode();
  updateModeButton();
  
  if (playgroundMode) {
    // Initialize GOL for playground with pixel size control
    golCellSize = parseInt(document.getElementById('pixel-size-slider').value);
    initGolGrid();
    golRunning = true;
    document.getElementById('gol-toggle').checked = true;
    
    // Show controls and seed GOL immediately
    updateUIMode();
  } else {
    // Reset GOL for webcam mode
    golRunning = false;
    document.getElementById('gol-toggle').checked = false;
    updateUIMode();
  }
}

function updateModeButton() {
  const modeBtn = document.getElementById('mode-switch-btn');
  const modeIcon = modeBtn.querySelector('.mode-icon');
  const modeText = modeBtn.querySelector('.mode-text');
  
  if (playgroundMode) {
    modeIcon.textContent = '🎮';
    modeText.textContent = 'PLAYGROUND';
    modeBtn.classList.add('playground');
  } else {
    modeIcon.textContent = '📹';
    modeText.textContent = 'WEBCAM';
    modeBtn.classList.remove('playground');
  }
}

function updateUIMode() {
  const webcamControls = document.querySelectorAll('.webcam-control');
  const playgroundControls = document.querySelectorAll('.playground-control');
  
  if (playgroundMode) {
    // Hide webcam controls, show playground controls
    webcamControls.forEach(control => {
      control.style.display = 'none';
      control.classList.remove('show');
    });
    playgroundControls.forEach(control => {
      control.style.display = 'flex';
      control.classList.add('show');
    });
    
    // Enable GOL by default in playground and seed immediately
    document.getElementById('gol-toggle').checked = true;
    golRunning = true;
    
    // Seed GOL immediately when webcam is off
    if (golGrid && golGrid.length > 0) {
      randomizePlayground();
    }
  } else {
    // Show webcam controls, hide playground controls
    webcamControls.forEach(control => {
      control.style.display = 'flex';
      control.classList.add('show');
    });
    playgroundControls.forEach(control => {
      control.style.display = 'none';
      control.classList.remove('show');
    });
    
    // Disable GOL by default in webcam mode
    document.getElementById('gol-toggle').checked = false;
    golRunning = false;
  }
}

/* Main draw */
function draw(){
  if (!isInitialized) {
    if (!document.getElementById('detail-slider')) return;
    initDomBindings();
    isInitialized = true;
  }

  const loadingOverlay = document.getElementById('loading-overlay');
  
  if (playgroundMode) {
    // Playground mode - no webcam needed
    if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) loadingOverlay.classList.add('hidden');
    drawPlayground();
    return;
  }
  
  if (!capture || !capture.loadedmetadata) {
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    return;
  } else {
    if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) loadingOverlay.classList.add('hidden');
  }

  const detailVal = parseFloat(detailSliderEl.value);
  const detailSteps = map(detailVal, 0, 1, 8, 1);
  const pixelStep = Math.max(1, Math.round(detailSteps));

  let src = capture.get();

  const tempW = Math.max(2, Math.floor(width / pixelStep));
  const tempH = Math.max(2, Math.floor(height / pixelStep));
  src.resize(tempW, tempH);

  const dithered = ditherEffect.apply(src);

  if (golRunning) {
    if (seedMode === 'continuous') {
      // Continuous mode - seed from current frame every time
      seedGolFromDither(dithered);
    } else {
      // Lock mode - seed only once, then let it evolve
      if (!lockedSeedImage) {
        lockedSeedImage = dithered;
        seedGolFromDither(lockedSeedImage);
      }
      // Don't re-seed in lock mode - just let it evolve
    }
    stepGol();
    drawGolToCanvas();
  } else {
    background( getCurrentThemeBgColor()[0], getCurrentThemeBgColor()[1], getCurrentThemeBgColor()[2] );
    image(dithered.image, 0, 0, width, height);
  }
}

/* THEME logic */
function applyTheme(){
  const cs = getComputedStyle(document.body);
  const fg = parseRgb(cs.getPropertyValue('--dither-fg').trim());
  const bg = parseRgb(cs.getPropertyValue('--dither-bg').trim());
  const current = themes[currentThemeIndex];
  
  // Set invert flag based on whether theme is dark or light
  let shouldInvert = current.includes('-dark');
  ditherEffect.setInvert(shouldInvert);
  
  // Set palette based on theme using YOUR original colors
  if (current === 'theme-cosmic-light') {
    ditherEffect.setPalette([0,0,0], [255,248,231], false); // black on cream cosmic latte
  } else if (current === 'theme-cosmic-dark') {
    ditherEffect.setPalette([255,248,231], [0,0,0], false); // cream cosmic latte on black (flipped)
  } else if (current === 'theme-systematic-light') {
    ditherEffect.setPalette([211,47,47], [0,31,63], false); // red on blue #001f3f
  } else if (current === 'theme-systematic-dark') {
    ditherEffect.setPalette([0,31,63], [211,47,47], false); // blue on red (flipped)
  } else if (current === 'theme-cyan-light') {
    ditherEffect.setPalette([0,0,255], [0,255,255], false); // blue on cyan
  } else if (current === 'theme-cyan-dark') {
    ditherEffect.setPalette([0,255,255], [0,0,255], false); // cyan on blue
  } else {
    ditherEffect.setPalette(fg, bg, false);
  }
  document.body.style.backgroundColor = getCurrentThemeBgColorString();
}

/* parse helpers */
function parseRgb(str){
  if (!str) return [0,0,0];
  const nums = str.match(/(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/);
  if (nums) return [parseInt(nums[1],10),parseInt(nums[2],10),parseInt(nums[3],10)];
  const hex = str.trim().match(/^#([a-fA-F0-9]{6})$/);
  if (hex) {
    const h = hex[1];
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  }
  return [0,0,0];
}
function getCurrentThemeFgColor(){ return parseRgb(getComputedStyle(document.body).getPropertyValue('--dither-fg').trim()); }
function getCurrentThemeBgColor(){ return parseRgb(getComputedStyle(document.body).getPropertyValue('--dither-bg').trim()); }
function getCurrentThemeBgColorString(){ const b = getCurrentThemeBgColor(); return `rgb(${b[0]},${b[1]},${b[2]})`; }

/* GOL helpers */
function initGolGrid(){
  golCellSize = Math.max(2, parseInt(pixelSizeSliderEl.value,10) || 10);
  golCols = Math.ceil(width / golCellSize);
  golRows = Math.ceil(height / golCellSize);
  golGrid = new Array(golCols);
  golNext = new Array(golCols);
  for (let i=0;i<golCols;i++){
    golGrid[i] = new Array(golRows).fill(0);
    golNext[i] = new Array(golRows).fill(0);
  }
}

function seedGolFromDither(ditherResult){
  if (!golGrid || golGrid.length === 0) initGolGrid();
  if (!ditherResult || !ditherResult.binary) return;
  
  // Use the binary data directly from the dithering result
  const w = ditherResult.width, h = ditherResult.height;
  for (let gx=0; gx<golCols; gx++){
    for (let gy=0; gy<golRows; gy++){
      const sx = Math.floor(map(gx + 0.5, 0, golCols, 0, w - 1));
      const sy = Math.floor(map(gy + 0.5, 0, golRows, 0, h - 1));
      const si = sx + sy * w;
      golGrid[gx][gy] = ditherResult.binary[si];
    }
  }
}

function stepGol(){
  if (!golGrid || golGrid.length === 0 || !golNext) return;
  for (let x=0;x<golCols;x++){
    for (let y=0;y<golRows;y++){
      const alive = golGrid[x][y];
      let neighbors = 0;
      for (let ox=-1; ox<=1; ox++){
        for (let oy=-1; oy<=1; oy++){
          if (ox===0 && oy===0) continue;
          const nx = x + ox, ny = y + oy;
          if (nx>=0 && nx<golCols && ny>=0 && ny<golRows) neighbors += golGrid[nx][ny];
        }
      }
      if (alive===1) golNext[x][y] = (neighbors===2 || neighbors===3) ? 1 : 0;
      else golNext[x][y] = (neighbors===3) ? 1 : 0;
    }
  }
  const t = golGrid; golGrid = golNext; golNext = t;
}

function drawGolToCanvas(){
  if (!golGrid || golGrid.length === 0) return;
  
  // Use the same palette as dithering for consistency
  const palette = ditherEffect.palette;
  const bg = palette[1]; // background color
  const fg = palette[0]; // foreground color
  
  background(bg[0], bg[1], bg[2]);
  noStroke();
  fill(fg[0], fg[1], fg[2]);
  for (let x=0;x<golCols;x++){
    for (let y=0;y<golRows;y++){
      if (golGrid[x][y]===1) rect(x * golCellSize, y * golCellSize, golCellSize, golCellSize);
    }
  }
}

/* Playground mode */
function drawPlayground() {
  if (golRunning) {
    stepGol();
    drawGolToCanvas();
  } else {
    // Draw empty playground with grid
    const bg = getCurrentThemeBgColor();
    background(bg[0], bg[1], bg[2]);
    
    // Draw grid lines
    const fg = getCurrentThemeFgColor();
    stroke(fg[0], fg[1], fg[2], 30);
    strokeWeight(0.5);
    
    for (let x = 0; x <= golCols; x++) {
      line(x * golCellSize, 0, x * golCellSize, height);
    }
    for (let y = 0; y <= golRows; y++) {
      line(0, y * golCellSize, width, y * golCellSize);
    }
    
    // Draw cells
    noStroke();
    fill(fg[0], fg[1], fg[2]);
    for (let x = 0; x < golCols; x++) {
      for (let y = 0; y < golRows; y++) {
        if (golGrid[x][y] === 1) {
          rect(x * golCellSize, y * golCellSize, golCellSize, golCellSize);
        }
      }
    }
  }
}

/* Snapshot helper */
function captureDitherSnapshot(){
  const detailVal = parseFloat(detailSliderEl.value);
  const detailSteps = map(detailVal, 0, 1, 8, 1);
  const pixelStep = Math.max(1, Math.round(detailSteps));
  let src = capture.get();
  const tempW = Math.max(2, Math.floor(width / pixelStep));
  const tempH = Math.max(2, Math.floor(height / pixelStep));
  src.resize(tempW, tempH);
  return ditherEffect.apply(src);
}

/* Camera permission handling */
async function requestCameraPermission() {
  try {
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // If successful, create p5 capture
    capture = createCapture(VIDEO, () => {
      webcamAvailable = true;
      console.log('Webcam available');
    });
    capture.size(width, height);
    capture.hide();
    
    // Hide the permission dialog if it exists
    const permissionDialog = document.getElementById('camera-permission');
    if (permissionDialog) {
      permissionDialog.style.display = 'none';
    }
    
  } catch (error) {
    console.log('Camera access denied or not available:', error);
    webcamAvailable = false;
    playgroundMode = true;
    golCellSize = parseInt(document.getElementById('pixel-size-slider').value);
    initGolGrid();
    // Start GOL automatically in playground mode
    golRunning = true;
    document.getElementById('gol-toggle').checked = true;
    
    // Update UI to show controls and seed GOL immediately
    updateUIMode();
    
    // Show permission dialog
    showCameraPermissionDialog();
  }
}

function showCameraPermissionDialog() {
  // Create permission dialog if it doesn't exist
  let dialog = document.getElementById('camera-permission');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'camera-permission';
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(10px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      font-family: 'Courier New', monospace;
    `;
    
    dialog.innerHTML = `
      <div style="
        background: var(--page-bg);
        border: 2px solid var(--page-text);
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        max-width: 400px;
        color: var(--page-text);
      ">
        <h2 style="margin: 0 0 1rem 0; color: var(--accent);">Camera Access Required</h2>
        <p style="margin: 0 0 1.5rem 0; line-height: 1.4;">
          This app needs camera access for real-time dithering.<br>
          Click "Allow" when prompted, or choose playground mode.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="retry-camera" style="
            background: var(--accent);
            color: var(--page-bg);
            border: none;
            padding: 0.7rem 1.5rem;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            cursor: pointer;
          ">Try Camera Again</button>
          <button id="use-playground" style="
            background: transparent;
            color: var(--page-text);
            border: 2px solid var(--page-text);
            padding: 0.7rem 1.5rem;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            cursor: pointer;
          ">Use Playground Mode</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners
    document.getElementById('retry-camera').addEventListener('click', () => {
      dialog.style.display = 'none';
      requestCameraPermission();
    });
    
    document.getElementById('use-playground').addEventListener('click', () => {
      dialog.style.display = 'none';
      playgroundMode = true;
      webcamAvailable = false;
      golCellSize = 8;
      initGolGrid();
      updateUIMode();
      updateModeButton();
    });
  } else {
    dialog.style.display = 'flex';
  }
}

/* Playground control functions */
function clearPlayground() {
  if (!golGrid || golGrid.length === 0) return;
  for (let x = 0; x < golCols; x++) {
    for (let y = 0; y < golRows; y++) {
      golGrid[x][y] = 0;
    }
  }
}

function randomizePlayground() {
  if (!golGrid || golGrid.length === 0) return;
  for (let x = 0; x < golCols; x++) {
    for (let y = 0; y < golRows; y++) {
      golGrid[x][y] = Math.random() < 0.3 ? 1 : 0;
    }
  }
}

function addPattern() {
  addGliderPattern();
}

function addGliderPattern() {
  if (!golGrid || golGrid.length === 0) return;
  
  const centerX = Math.floor(golCols / 2);
  const centerY = Math.floor(golRows / 2);
  
  // Clear first
  clearPlayground();
  
  // Add glider
  if (centerX > 1 && centerY > 1 && centerX < golCols - 2 && centerY < golRows - 2) {
    golGrid[centerX][centerY + 1] = 1;
    golGrid[centerX + 1][centerY + 2] = 1;
    golGrid[centerX - 1][centerY] = 1;
    golGrid[centerX][centerY] = 1;
    golGrid[centerX + 1][centerY] = 1;
  }
}

function addPulsarPattern() {
  if (!golGrid || golGrid.length === 0) return;
  
  const centerX = Math.floor(golCols / 2);
  const centerY = Math.floor(golRows / 2);
  
  clearPlayground();
  
  // Add pulsar pattern
  if (centerX > 6 && centerY > 6 && centerX < golCols - 6 && centerY < golRows - 6) {
    // Pulsar pattern
    const pattern = [
      [0,0,1,1,1,0,0,0,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [0,0,1,1,1,0,0,0,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,1,1,1,0,0,0,1,1,1,0,0],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [1,0,0,0,0,1,0,1,0,0,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,1,1,1,0,0,0,1,1,1,0,0]
    ];
    
    for (let x = 0; x < pattern.length; x++) {
      for (let y = 0; y < pattern[x].length; y++) {
        const gridX = centerX - 6 + x;
        const gridY = centerY - 6 + y;
        if (gridX >= 0 && gridX < golCols && gridY >= 0 && gridY < golRows) {
          golGrid[gridX][gridY] = pattern[x][y];
        }
      }
    }
  }
}

function addGunPattern() {
  if (!golGrid || golGrid.length === 0) return;
  
  const centerX = Math.floor(golCols / 2);
  const centerY = Math.floor(golRows / 2);
  
  clearPlayground();
  
  // Add Gosper Glider Gun pattern
  if (centerX > 15 && centerY > 15 && centerX < golCols - 15 && centerY < golRows - 15) {
    const gunPattern = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
      [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];
    
    for (let x = 0; x < gunPattern.length; x++) {
      for (let y = 0; y < gunPattern[x].length; y++) {
        const gridX = centerX - 18 + x;
        const gridY = centerY - 18 + y;
        if (gridX >= 0 && gridX < golCols && gridY >= 0 && gridY < golRows) {
          golGrid[gridX][gridY] = gunPattern[x][y];
        }
      }
    }
  }
}

function toggleAutoRandom() {
  autoRandom = !autoRandom;
  const btn = document.getElementById('gol-auto-random-btn');
  
  if (autoRandom) {
    btn.classList.add('active');
    autoRandomInterval = setInterval(() => {
      if (golRunning) {
        randomizePlayground();
      }
    }, 2000 / golSpeed);
  } else {
    btn.classList.remove('active');
    if (autoRandomInterval) {
      clearInterval(autoRandomInterval);
      autoRandomInterval = null;
    }
  }
}

function toggleAutoClear() {
  autoClear = !autoClear;
  const btn = document.getElementById('gol-auto-clear-btn');
  
  if (autoClear) {
    btn.classList.add('active');
    autoClearInterval = setInterval(() => {
      if (golRunning) {
        clearPlayground();
      }
    }, 5000 / golSpeed);
  } else {
    btn.classList.remove('active');
    if (autoClearInterval) {
      clearInterval(autoClearInterval);
      autoClearInterval = null;
    }
  }
}

/* Recording */
function toggleRecording(){
  const btn = document.getElementById('record-btn');
  if (!recording){
    recordedChunks = [];
    const stream = document.querySelector('canvas').captureStream(30);
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    } catch (e) {
      try { mediaRecorder = new MediaRecorder(stream); } catch (err) { alert('Recording not supported in this browser'); return; }
    }
    mediaRecorder.ondataavailable = (e) => { if (e.data.size>0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.style.display='none'; a.href = url; a.download = 'tmm-os-dither.webm';
      document.body.appendChild(a); a.click();
      setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 150);
    };
    mediaRecorder.start();
    recording = true;
    btn.textContent = 'STOP';
  } else {
    mediaRecorder.stop();
    recording = false;
    btn.textContent = 'RECORD';
  }
}

/* Advanced Playground Functions */

// Create chaotic patterns
function createChaos() {
  if (!playgroundMode) return;
  clearPlayground();
  
  for (let x = 0; x < golCols; x++) {
    for (let y = 0; y < golRows; y++) {
      if (Math.random() < playgroundDensity * 2) {
        golGrid[x][y] = 1;
      }
    }
  }
}

// Create spiral patterns
function createSpiral() {
  if (!playgroundMode) return;
  clearPlayground();
  
  const centerX = Math.floor(golCols / 2);
  const centerY = Math.floor(golRows / 2);
  const maxRadius = Math.min(centerX, centerY);
  
  for (let r = 0; r < maxRadius; r += 3) {
    for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
      const x = Math.floor(centerX + r * Math.cos(angle));
      const y = Math.floor(centerY + r * Math.sin(angle));
      if (x >= 0 && x < golCols && y >= 0 && y < golRows) {
        golGrid[x][y] = 1;
      }
    }
  }
}

// Create maze-like patterns
function createMaze() {
  if (!playgroundMode) return;
  clearPlayground();
  
  // Create walls
  for (let x = 0; x < golCols; x += 4) {
    for (let y = 0; y < golRows; y++) {
      if (Math.random() < 0.3) golGrid[x][y] = 1;
    }
  }
  for (let y = 0; y < golRows; y += 4) {
    for (let x = 0; x < golCols; x++) {
      if (Math.random() < 0.3) golGrid[x][y] = 1;
    }
  }
}

// Create fractal patterns
function createFractal() {
  if (!playgroundMode) return;
  clearPlayground();
  
  // Sierpinski triangle-like pattern
  const size = Math.min(golCols, golRows);
  const iterations = 4;
  
  for (let i = 0; i < iterations; i++) {
    const step = size / Math.pow(2, i);
    for (let x = 0; x < golCols; x += step) {
      for (let y = 0; y < golRows; y += step) {
        if ((x + y) % (step * 2) < step && Math.random() < 0.5) {
          golGrid[Math.floor(x)][Math.floor(y)] = 1;
        }
      }
    }
  }
}

// Create pulsing patterns
function createPulse() {
  if (!playgroundMode) return;
  clearPlayground();
  
  const centerX = Math.floor(golCols / 2);
  const centerY = Math.floor(golRows / 2);
  
  // Create concentric circles
  for (let r = 0; r < Math.min(centerX, centerY); r += 2) {
    for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
      const x = Math.floor(centerX + r * Math.cos(angle));
      const y = Math.floor(centerY + r * Math.sin(angle));
      if (x >= 0 && x < golCols && y >= 0 && y < golRows) {
        golGrid[x][y] = 1;
      }
    }
  }
}

// Evolve patterns over time
function evolvePattern() {
  if (!playgroundMode) return;
  
  evolutionStep++;
  if (evolutionStep % 10 === 0) {
    // Add new random elements
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(Math.random() * golCols);
      const y = Math.floor(Math.random() * golRows);
      if (Math.random() < playgroundDensity) {
        golGrid[x][y] = 1;
      }
    }
  }
}

// Mutate existing patterns
function mutatePattern() {
  if (!playgroundMode) return;
  
  for (let x = 0; x < golCols; x++) {
    for (let y = 0; y < golRows; y++) {
      if (golGrid[x][y] === 1 && Math.random() < mutationRate) {
        // Flip some cells
        golGrid[x][y] = 0;
      } else if (golGrid[x][y] === 0 && Math.random() < mutationRate * 0.5) {
        golGrid[x][y] = 1;
      }
    }
  }
}

// Breed two patterns together
function breedPatterns() {
  if (!playgroundMode) return;
  
  // Create a temporary pattern
  const tempGrid = [];
  for (let x = 0; x < golCols; x++) {
    tempGrid[x] = [];
    for (let y = 0; y < golRows; y++) {
      tempGrid[x][y] = Math.random() < playgroundDensity ? 1 : 0;
    }
  }
  
  // Mix with current pattern
  for (let x = 0; x < golCols; x++) {
    for (let y = 0; y < golRows; y++) {
      if (Math.random() < 0.5) {
        golGrid[x][y] = tempGrid[x][y];
      }
    }
  }
}

// Explode pattern outward
function explodePattern() {
  if (!playgroundMode) return;
  
  const centerX = Math.floor(golCols / 2);
  const centerY = Math.floor(golRows / 2);
  
  // Create explosion effect
  for (let x = 0; x < golCols; x++) {
    for (let y = 0; y < golRows; y++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance < 20 && Math.random() < playgroundDensity * 3) {
        golGrid[x][y] = 1;
      }
    }
  }
}
