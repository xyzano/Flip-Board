let audioCtx: AudioContext | null = null;

export function createAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
}

let soundPool = 0;
const MAX_CONCURRENT_SOUNDS = 12;

let masterGain: GainNode | null = null;
let currentVolume = 0.5;

export function setMasterVolume(v: number) {
  currentVolume = v;
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(v, audioCtx.currentTime);
  }
}

let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer() {
  if (!audioCtx) return null;
  if (!noiseBuffer) {
    const bufferSize = audioCtx.sampleRate * 0.1; // 100ms
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

// Ultra-realistic plastic click using noise bursts
export function playFlapSound() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (!masterGain) {
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = currentVolume;
  }

  if (soundPool >= MAX_CONCURRENT_SOUNDS) return;
  soundPool++;

  const delay = Math.random() * 0.015;
  const startTime = audioCtx.currentTime + delay;

  // Plastic slap noise
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = getNoiseBuffer();

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(1500 + Math.random() * 500, startTime);
  noiseFilter.Q.value = 0.5;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0, startTime);
  noiseGain.gain.linearRampToValueAtTime(0.3, startTime + 0.002);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  // Deep drum thump
  const osc = audioCtx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, startTime);
  osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.05);

  const oscGain = audioCtx.createGain();
  oscGain.gain.setValueAtTime(0, startTime);
  oscGain.gain.linearRampToValueAtTime(0.1, startTime + 0.002);
  oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

  osc.connect(oscGain);
  oscGain.connect(masterGain);

  noiseSource.start(startTime);
  osc.start(startTime);
  
  noiseSource.stop(startTime + 0.05);
  osc.stop(startTime + 0.05);

  setTimeout(() => {
    soundPool--;
  }, 30 + delay * 1000);
}
