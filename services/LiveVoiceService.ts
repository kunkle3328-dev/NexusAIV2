
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { createPcmBlob, decodeAudio, decodeAudioData } from './AudioUtils';
import { SYSTEM_INSTRUCTION } from '../constants';
import { NEXUS_PERSONALITY, NEXUS_VOICE_PROFILES } from '../config/nexus_configs';

// 🎚️ Audio Architecture Constants
const INITIAL_VAD_THRESHOLD = 0.005; // Slightly lower start for sensitivity
const SAMPLE_RATE = 24000;
const SPEECH_HOLD_MS = 700; // Keep mic open to catch word endings

// Voice Personality Map
const VOICE_PERSONALITIES: Record<string, string> = {
    'Zephyr': 'Voice Style: CALM. Pitch: Steady. Pace: Moderate. Tone: Helpful, patient, balanced.',
    'Puck': 'Voice Style: ENERGETIC. Pitch: Dynamic/High. Pace: Fast/Snappy. Tone: Enthusiastic, witty, quick.',
    'Charon': 'Voice Style: DEEP. Pitch: Low/Resonant. Pace: Slow/Deliberate. Tone: Authoritative, serious, gravitas.',
    'Kore': 'Voice Style: SOFT. Pitch: Soft/Gentle. Pace: Relaxed. Tone: Soothing, empathetic, warm.',
    'Fenrir': 'Voice Style: INTENSE. Pitch: Sharp. Pace: Fast. Tone: Focused, direct, commanding.'
};

/**
 * 🔊 AudioStreamPlayer: Specialized for Drift Correction and Artifact-Free Barge-in
 */
class AudioStreamPlayer {
  private context: AudioContext;
  private compressor: DynamicsCompressorNode;
  private gainNode: GainNode;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  public isPlaying: boolean = false;
  private activeSourceCount: number = 0;

  constructor(context: AudioContext) {
    this.context = context;

    // Dynamics Processing Chain
    this.compressor = context.createDynamicsCompressor();
    this.compressor.threshold.value = NEXUS_VOICE_PROFILES.normalization.target_lufs;
    this.compressor.knee.value = 20;
    this.compressor.ratio.value = 8;
    this.compressor.attack.value = 0.002;
    this.compressor.release.value = 0.15;

    this.gainNode = context.createGain();
    
    this.compressor.connect(this.gainNode);
    this.gainNode.connect(context.destination);
  }

  async scheduleChunk(buffer: AudioBuffer) {
    const currentTime = this.context.currentTime;
    
    // 🕐 DRIFT CORRECTION
    if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.005; // Tighten gap
    } 

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.compressor);

    source.start(this.nextStartTime);
    this.sources.add(source);
    this.activeSourceCount++;
    this.isPlaying = true;

    source.onended = () => {
      this.sources.delete(source);
      this.activeSourceCount--;
      if (this.activeSourceCount === 0) {
        this.isPlaying = false;
        // Reset timing if stream dries up
        if (this.context.currentTime > this.nextStartTime + 0.1) {
            this.nextStartTime = 0;
        }
      }
    };

    this.nextStartTime += buffer.duration;
  }

  stop() {
    // 🛑 SEAMLESS BARGE-IN
    const currentTime = this.context.currentTime;
    
    this.gainNode.gain.cancelScheduledValues(currentTime);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + 0.05);

    this.sources.forEach(s => {
        try { s.stop(currentTime + 0.06); } catch (e) {}
    });
    
    this.sources.clear();
    this.nextStartTime = 0;
    this.isPlaying = false;
    this.activeSourceCount = 0;

    setTimeout(() => {
        this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
        this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
    }, 100);
  }

  reset() {
    this.stop();
  }
}

export class LiveVoiceService {
  private ai: any;
  private session: any;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private player: AudioStreamPlayer | null = null;
  private vadCooldownTimestamp: number = 0;
  
  // VAD State
  private noiseFloor = 0.002;
  private vadThreshold = INITIAL_VAD_THRESHOLD;
  private speechHoldTimer = 0;

  constructor() {
    const apiKey = process.env.API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  async start(callbacks: {
    onMessage?: (text: string) => void;
    onInterrupted?: () => void;
    onError?: (error: any) => void;
    onClose?: () => void;
    onVolume?: (level: number) => void;
  }, voiceName: string = 'Zephyr') {
    if (!process.env.API_KEY) {
      throw new Error("API Key missing");
    }

    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
    this.player = new AudioStreamPlayer(this.outputAudioContext);

    try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000
            } 
        });
    } catch (e) {
        throw new Error("Microphone access denied. Please check permissions.");
    }

    // 🗣️ DYNAMIC PERSONALITY INJECTION
    const selectedStyle = VOICE_PERSONALITIES[voiceName] || VOICE_PERSONALITIES['Zephyr'];
    
    const humanSystemPrompt = SYSTEM_INSTRUCTION + 
    `\n\n[VOICE_MODE_ACTIVE]
    CRITICAL: You are speaking, not reading.
    1. ${selectedStyle}
    2. Vary pitch and speed to match this persona.
    3. Keep answers concise and conversational.
    4. If interrupted, stop immediately.`;

    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          if (!this.inputAudioContext || !this.stream) return;
          const source = this.inputAudioContext.createMediaStreamSource(this.stream);
          // 512 samples = 32ms latency
          this.scriptProcessor = this.inputAudioContext.createScriptProcessor(512, 1, 1);
          
          this.scriptProcessor.onaudioprocess = (e) => {
            if (!this.session) return; 
            
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Calculate RMS
            let sumSq = 0;
            for (let i = 0; i < inputData.length; i++) {
                sumSq += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sumSq / inputData.length);
            
            // 🧠 SMART NOISE FLOOR
            // Only adapt floor when signal is low (silence) to avoid learning speech as noise
            if (rms < this.noiseFloor * 3) {
                this.noiseFloor = (this.noiseFloor * 0.995) + (rms * 0.005);
            }
            
            // Dynamic Threshold: 3x noise floor, but clamped to a min
            this.vadThreshold = Math.max(INITIAL_VAD_THRESHOLD, this.noiseFloor * 3.0);
            
            callbacks.onVolume?.(rms);

            // 🛑 BARGE-IN LOGIC
            const isAiSpeaking = this.player?.isPlaying || false;
            // Need louder voice to interrupt to prevent self-echo false triggers
            const interruptThreshold = isAiSpeaking ? (this.vadThreshold * 4.0) : this.vadThreshold; 

            if (rms > interruptThreshold) {
                if (Date.now() - this.vadCooldownTimestamp > 500) {
                    if (isAiSpeaking) {
                        this.player?.stop();
                        this.vadCooldownTimestamp = Date.now();
                        callbacks.onInterrupted?.();
                    }
                }
            }

            // 🎤 TRANSMISSION GATE (with Hysteresis)
            const isSpeech = rms > this.vadThreshold;
            
            if (isSpeech) {
                this.speechHoldTimer = Date.now();
            }

            // Keep sending if we are speaking OR if we just stopped speaking (Hold Time)
            // This prevents "choppy" audio where quiet syllables get cut
            const shouldSend = isSpeech || (Date.now() - this.speechHoldTimer < SPEECH_HOLD_MS);

            if (shouldSend) { 
                 const pcmBlob = createPcmBlob(inputData);
                 sessionPromise.then((session: any) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                 });
            }
          };

          source.connect(this.scriptProcessor);
          this.scriptProcessor.connect(this.inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.interrupted) {
             this.player?.stop();
             callbacks.onInterrupted?.();
             return;
          }

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && this.outputAudioContext && this.player) {
            const audioBuffer = await decodeAudioData(
              decodeAudio(base64Audio),
              this.outputAudioContext,
              SAMPLE_RATE,
              1
            );
            
            // Fake Volume for AI Visualizer
            let sum = 0;
            const data = audioBuffer.getChannelData(0);
            for(let i=0; i<data.length; i+=50) sum += data[i]*data[i];
            const aiRms = Math.sqrt(sum / (data.length/50));
            callbacks.onVolume?.(aiRms * 1.5); 

            await this.player.scheduleChunk(audioBuffer);
          }

          if (message.serverContent?.outputTranscription) {
            callbacks.onMessage?.(message.serverContent.outputTranscription.text);
          }
        },
        onerror: (e: any) => callbacks.onError?.(e),
        onclose: () => callbacks.onClose?.(),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
        },
        systemInstruction: humanSystemPrompt,
        outputAudioTranscription: {},
      },
    });

    this.session = await sessionPromise;
  }

  async stop() {
    this.player?.reset();
    if (this.session) {
      try { this.session.close(); } catch(e) {}
    }
    this.scriptProcessor?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    await this.inputAudioContext?.close();
    await this.outputAudioContext?.close();
  }
}
