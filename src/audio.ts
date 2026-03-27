let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let buffers: AudioBuffer[] = [];

// Throttle configuration to avoid jet engine noise
const MAX_CONCURRENT = 5;
const MIN_INTERVAL_MS = 20;
const PLAY_PROBABILITY = 0.7; // ~70% chance to click per flap frame 
let activeCount = 0;
let lastPlayTime = 0;

export function createAudioContext() {
  if (audioCtx) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.50; // default 50%
    masterGain.connect(audioCtx.destination);

    // Generate 4 variations of clack sounds
    const generateClack = (duration: number, frequency: number, intensity: number) => {
      const sampleRate = audioCtx!.sampleRate;
      const length = Math.floor(sampleRate * duration);
      const buffer = audioCtx!.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 200) * intensity;
        const noise = (Math.random() * 2 - 1) * 0.7;
        const click = Math.sin(2 * Math.PI * frequency * t) * 0.15;
        const hp = Math.sin(2 * Math.PI * (frequency * 2.5) * t) * 0.1;
        data[i] = (noise + click + hp) * envelope;
      }
      return buffer;
    };

    buffers = [
      generateClack(0.025, 1200, 0.6),  // Very short sharp tick
      generateClack(0.030, 900, 0.5),   // Slightly longer tick
      generateClack(0.020, 1500, 0.55), // Quick snap
      generateClack(0.035, 700, 0.4),   // Softer settle click
    ];
  } catch (e) {
    console.warn("Audio Context failed", e);
  }
}

export function playFlapSound() {
  if (!audioCtx || !masterGain || buffers.length === 0) return;

  const now = performance.now();
  if (now - lastPlayTime < MIN_INTERVAL_MS) return;
  if (activeCount >= MAX_CONCURRENT) return;
  if (Math.random() > PLAY_PROBABILITY) return;

  try {
    const source = audioCtx.createBufferSource();
    source.buffer = buffers[Math.floor(Math.random() * buffers.length)];
    source.playbackRate.value = 0.85 + Math.random() * 0.3; // organic pitch variation
    source.connect(masterGain);
    source.start(audioCtx.currentTime);

    activeCount++;
    lastPlayTime = now;

    source.onended = () => {
      activeCount = Math.max(0, activeCount - 1);
    };
  } catch (e) {
    // ignore
  }
}

export function setMasterVolume(v: number) {
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), audioCtx.currentTime, 0.01);
  }
}
