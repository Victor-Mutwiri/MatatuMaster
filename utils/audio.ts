
import { useGameStore } from '../store/gameStore';

// Simple synth audio context singleton
let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    // @ts-ignore
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
        audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

export class EngineSynthesizer {
  private osc: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private isRunning: boolean = false;
  private baseFreq: number = 60;

  constructor() {}

  start() {
    const { isSoundOn, isEngineSoundOn } = useGameStore.getState();
    if (!isSoundOn || !isEngineSoundOn || this.isRunning) return;

    const ctx = getCtx();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    // 1. Engine Rumble (Sawtooth modulated by Sine LFO)
    this.osc = ctx.createOscillator();
    this.lfo = ctx.createOscillator();
    this.gain = ctx.createGain();
    this.filter = ctx.createBiquadFilter();

    this.osc.type = 'sawtooth';
    this.osc.frequency.value = this.baseFreq;

    this.lfo.type = 'sine';
    this.lfo.frequency.value = 10; // Slightly slower idle rumble

    // FM Synthesis for growl
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 5; // Reduced from 20 to stop "screeching" vibration
    
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.osc.frequency);
    
    // Low Pass Filter to smooth out harsh sawtooth edges
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 200; // Start muffled (idle)

    this.osc.connect(this.filter);
    this.filter.connect(this.gain);
    
    this.osc.start();
    this.lfo.start();
    
    this.gain.gain.value = 0.15;
    this.gain.connect(ctx.destination);

    // 2. Road/Wind Noise
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 400;

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0; // Starts silent

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(ctx.destination);
    
    this.noiseNode.start();

    this.isRunning = true;
  }

  setVehicleType(type: string) {
    if (type === '14-seater') this.baseFreq = 70; // High pitched van
    else if (type === '32-seater') this.baseFreq = 50; // Mid rumble
    else if (type === '52-seater') this.baseFreq = 40; // Deep bus diesel
    else if (type === 'boda') this.baseFreq = 120; // High pitch bike
    else if (type === 'tuktuk') this.baseFreq = 90; // Putt putt
    else if (type === 'personal-car') this.baseFreq = 65; // Quietish
    else this.baseFreq = 100; // Default Motorbike
  }

  setSpeed(speed: number) {
    if (!this.isRunning || !this.osc || !this.lfo || !this.gain || !this.noiseGain || !this.filter) return;

    // Normalize speed (0 - 120)
    const normalized = Math.min(speed, 120) / 120;

    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pitch rises with speed
    const targetFreq = this.baseFreq + (normalized * 100);
    this.osc.frequency.setTargetAtTime(targetFreq, now, 0.1);
    
    // Filter opens up (engine roars) - Simulate throttle opening
    const filterFreq = 200 + (normalized * 2000); 
    this.filter.frequency.setTargetAtTime(filterFreq, now, 0.1);

    // LFO rate increases (faster vibration)
    const targetLfo = 10 + (normalized * 30);
    this.lfo.frequency.setTargetAtTime(targetLfo, now, 0.1);

    // Road noise volume increases significantly with speed
    const noiseVol = normalized * 0.3;
    this.noiseGain.gain.setTargetAtTime(noiseVol, now, 0.2);
  }

  stop() {
    if (!this.isRunning) return;
    const ctx = getCtx();
    const now = ctx?.currentTime || 0;
    
    // Gentle fade out
    if (this.gain) this.gain.gain.setTargetAtTime(0, now, 0.2);
    if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(0, now, 0.2);
    
    setTimeout(() => {
        this.osc?.stop();
        this.lfo?.stop();
        this.noiseNode?.stop();
        this.osc?.disconnect();
        this.lfo?.disconnect();
        this.noiseNode?.disconnect();
        this.gain?.disconnect();
        this.filter?.disconnect();
        
        this.osc = null;
        this.lfo = null;
        this.gain = null;
        this.filter = null;
        this.noiseNode = null;
        this.noiseGain = null;
        this.isRunning = false;
    }, 250);
  }
}

export const playSfx = (type: 'COIN' | 'ENGINE' | 'HORN' | 'SIREN' | 'SWOOSH' | 'CRASH' | 'BEEP' | 'LEVEL_UP' | 'UNLOCK') => {
  const { isSoundOn } = useGameStore.getState();
  if (!isSoundOn) return;

  const ctx = getCtx();
  if (!ctx) return;

  // Resume context if suspended (browser policy)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  try {
    if (type === 'COIN') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.3);
    } 
    else if (type === 'SWOOSH') {
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.linearRampToValueAtTime(800, now + 0.3);
      
      noise.connect(filter);
      filter.connect(gain);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      noise.start(now);
      noise.stop(now + 0.5);
    }
    else if (type === 'HORN') {
      // Dual tone Matatu Horn
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.connect(gain);
      osc2.connect(gain);
      
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      
      osc1.frequency.setValueAtTime(300, now);
      osc2.frequency.setValueAtTime(370, now); // Major third ish
      
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    }
    else if (type === 'SIREN') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.4);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      
      osc.start(now);
      osc.stop(now + 0.4);
    }
    else if (type === 'BEEP') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
    else if (type === 'CRASH') {
        const bufferSize = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.connect(gain);
        
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        
        noise.start(now);
        noise.stop(now + 1.0);
    }
    else if (type === 'LEVEL_UP') {
      // Arpeggio C E G C
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.connect(gain);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.2, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.2);
      });
    }
    else if (type === 'UNLOCK') {
      // Major Chord Strike
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      
      osc1.connect(gain);
      osc2.connect(gain);
      osc3.connect(gain);
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc3.type = 'triangle'; // Add texture
      
      osc1.frequency.value = 440; // A
      osc2.frequency.value = 554.37; // C#
      osc3.frequency.value = 659.25; // E
      
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      
      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);
      osc3.stop(now + 1.5);
    }

  } catch (e) {
    console.warn("Audio Playback Error", e);
  }
};
