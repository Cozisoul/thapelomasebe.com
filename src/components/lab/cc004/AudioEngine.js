export class AudioEngine {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 1024; // gives 512 frequency bins
    this.analyser.smoothingTimeConstant = 0.8;

    this.source = null;
    this.audioElement = null;

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeArray = new Float32Array(this.analyser.fftSize);

    this.isPlaying = false;
  }

  async initMic() {
    this.stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      // don't connect to destination to avoid feedback loop
      this.isPlaying = true;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (err) {
      console.error('Microphone access denied or error:', err);
    }
  }

  async initSystemAudio() {
    this.stop();
    try {
      // Browsers often require 'video: true' to capture system/tab audio
      const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      // Don't connect to destination to avoid echo
      this.isPlaying = true;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (err) {
      console.error('System audio access denied or error:', err);
    }
  }

  initFile(fileUrl) {
    this.stop();
    this.audioElement = new Audio(fileUrl);
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.loop = true;
    
    this.source = this.audioCtx.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    
    this.audioElement.play();
    this.isPlaying = true;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }
    this.isPlaying = false;
  }

  // Returns current FFT data
  getFFT() {
    if (!this.isPlaying) return this.dataArray.fill(0);
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  // Returns Time Domain data
  getTimeDomain() {
    if (!this.isPlaying) return this.timeArray.fill(0);
    this.analyser.getFloatTimeDomainData(this.timeArray);
    return this.timeArray;
  }

  // Utility to get RMS (volume)
  getRMS() {
    const timeData = this.getTimeDomain();
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      sum += timeData[i] * timeData[i];
    }
    return Math.sqrt(sum / timeData.length);
  }

  // Utility to get frequency band energy (averages the bins in the range)
  getBandEnergy(minFreq, maxFreq) {
    const fft = this.getFFT();
    const nyquist = this.audioCtx.sampleRate / 2;
    const minIndex = Math.floor((minFreq / nyquist) * fft.length);
    const maxIndex = Math.floor((maxFreq / nyquist) * fft.length);

    let sum = 0;
    for (let i = minIndex; i <= maxIndex; i++) {
      sum += fft[i];
    }
    const range = maxIndex - minIndex + 1;
    if (range <= 0) return 0;
    return sum / range / 255.0; // Normalized 0-1
  }

  // Gets generic bands
  getBands() {
    return {
      bass: this.getBandEnergy(20, 250),
      lowMid: this.getBandEnergy(250, 500),
      highMid: this.getBandEnergy(500, 2000),
      treble: this.getBandEnergy(2000, 20000)
    };
  }
}
