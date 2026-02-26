
import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2, Activity, Loader2, AlertCircle, BarChart3, Radio } from 'lucide-react';
import { NEXUS_PERSONALITY } from '../config/nexus_configs';
import { LiveVoiceService } from '../services/LiveVoiceService';

interface VoiceModeProps {
    activeVoiceId: string;
}

export const VoiceMode: React.FC<VoiceModeProps> = ({ activeVoiceId }) => {
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Transcription State
  const [aiText, setAiText] = useState('');
  
  // Real-time Visualizer State
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [bars, setBars] = useState<number[]>(new Array(40).fill(5));
  
  // Simulated Metrics for Pitch/Rate/Confidence
  const [metrics, setMetrics] = useState({
      pitch: 1.0,
      rate: 1.0,
      confidence: 1.0
  });

  const voiceService = useRef<LiveVoiceService | null>(null);

  // Animation Loop for Visualizer
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      if (isActive) {
        setBars(prev => prev.map((h, i) => {
            // Physics-based decay with sine wave modulation for organic look
            const decay = 0.85; // Faster decay for snappier feel
            const noise = Math.random() * 5;
            const wave = Math.sin(i * 0.2 + Date.now() / 150) * 10;
            const target = 5 + (volumeLevel * 120) + wave + noise;
            
            // Clamp target
            const clampedTarget = Math.max(5, Math.min(100, target));
            
            return Math.max(5, h * decay + clampedTarget * (1 - decay));
        }));

        // Dynamically update metrics based on "activity"
        setMetrics(prev => ({
            pitch: 1.0 + (volumeLevel * 0.15) + (Math.sin(Date.now() / 500) * 0.05),
            rate: 1.0 + (volumeLevel > 0.05 ? 0.1 : 0),
            // Confidence jumps up when speaking, slowly decays
            confidence: Math.min(0.99, prev.confidence * 0.98 + (volumeLevel > 0.05 ? 0.1 : 0))
        }));
      } else {
        setBars(prev => prev.map(h => Math.max(5, h * 0.9)));
        setVolumeLevel(0);
        setMetrics({ pitch: 1.0, rate: 1.0, confidence: 1.0 });
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [isActive, volumeLevel]);

  const startSession = async () => {
    setIsInitializing(true);
    setError(null);
    setAiText('');
    try {
      voiceService.current = new LiveVoiceService();
      await voiceService.current.start({
        onMessage: (text) => {
            setAiText(prev => {
                const combined = prev + text;
                return combined.length > 300 ? combined.slice(-300) : combined;
            });
        },
        onInterrupted: () => {
             setAiText(prev => prev + " --");
        },
        onError: (err) => {
          console.error("Voice Error:", err);
          setError("Connection failed. Check API key.");
          setIsActive(false);
        },
        onClose: () => setIsActive(false),
        onVolume: (level) => {
            // Instant response for visualizer
            setVolumeLevel(level);
        }
      }, activeVoiceId);
      setIsActive(true);
    } catch (err: any) {
      setError(err.message || "Failed to start microphone session");
    } finally {
      setIsInitializing(false);
    }
  };

  const stopSession = async () => {
    setIsActive(false);
    if (voiceService.current) {
      await voiceService.current.stop();
      voiceService.current = null;
    }
  };

  const toggleMic = () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-between bg-nexus-900 relative overflow-hidden pb-8">
      
      {/* Background Pulse */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-nexus-highlight/5 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      {/* Top Status Bar */}
      <div className="w-full pt-8 px-6 flex justify-between items-start z-10">
         <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-nexus-600'}`} />
            <span className="text-[10px] font-mono text-nexus-dim uppercase tracking-widest">
                {isActive ? 'LIVE AUDIO' : 'STANDBY'}
            </span>
         </div>
         
         <div className="flex flex-col items-end gap-1">
             <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-full border border-white/5">
                <Volume2 size={10} className="text-nexus-dim" />
                <span className="text-[10px] text-white font-mono uppercase">{activeVoiceId}</span>
             </div>
             {isActive && (
                 <span className="text-[9px] text-nexus-dim font-mono animate-in fade-in">VAD: HYSTERESIS ACTIVE</span>
             )}
         </div>
      </div>

      {/* Center Visualizer & Metrics */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg gap-8 z-10">
          
          {/* Visualizer */}
          <div className="flex items-center justify-center gap-1 h-32 w-full px-8">
            {bars.map((height, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all duration-[50ms] ease-linear shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                style={{ 
                  height: `${height}%`,
                  backgroundColor: isActive ? (height > 45 ? '#3b82f6' : '#ffffff') : '#333333',
                  opacity: isActive ? 0.9 : 0.2,
                }}
              />
            ))}
          </div>

          {/* Metrics Row */}
          <div className={`flex gap-6 transition-all duration-700 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="text-center">
                  <div className="text-[10px] text-nexus-dim font-mono uppercase mb-1">Pitch</div>
                  <div className="text-sm font-semibold text-white">{metrics.pitch.toFixed(2)}x</div>
                  <div className="h-1 w-12 bg-nexus-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(metrics.pitch - 0.5) * 100}%` }} />
                  </div>
              </div>
              <div className="w-px bg-white/10 h-8" />
              <div className="text-center">
                  <div className="text-[10px] text-nexus-dim font-mono uppercase mb-1">Rate</div>
                  <div className="text-sm font-semibold text-white">{metrics.rate.toFixed(2)}x</div>
                   <div className="h-1 w-12 bg-nexus-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${(metrics.rate - 0.5) * 100}%` }} />
                  </div>
              </div>
               <div className="w-px bg-white/10 h-8" />
              <div className="text-center">
                  <div className="text-[10px] text-nexus-dim font-mono uppercase mb-1">Conf</div>
                  <div className="text-sm font-semibold text-emerald-400">{(metrics.confidence * 100).toFixed(0)}%</div>
                   <div className="h-1 w-12 bg-nexus-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${metrics.confidence * 100}%` }} />
                  </div>
              </div>
          </div>
      </div>

      {/* Transcription & Controls Area */}
      <div className="w-full flex flex-col items-center gap-6 z-20 px-4">
        
        {/* Professional Caption Box */}
        <div className={`w-full max-w-xl min-h-[120px] bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-end transition-all duration-500 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-50'}`}>
            {aiText ? (
                <div className="space-y-2">
                    <p className="text-lg font-light text-white leading-relaxed tracking-wide drop-shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        {aiText}
                    </p>
                </div>
            ) : (
                <div className="text-center text-nexus-dim text-sm italic py-4">
                    {isActive ? "Listening..." : "Ready to start session"}
                </div>
            )}
        </div>
        
        {/* Error Toast */}
        {error && (
            <div className="flex items-center gap-2 text-red-300 bg-red-950/80 px-4 py-2 rounded-full border border-red-500/20 text-xs font-mono animate-in zoom-in">
                <AlertCircle size={14} />
                {error}
            </div>
        )}

        {/* Main Action Button */}
        <button
          onClick={toggleMic}
          disabled={isInitializing}
          className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            isActive 
              ? 'bg-nexus-highlight text-white ring-4 ring-nexus-highlight/20 scale-105' 
              : 'bg-white/10 text-white hover:bg-white/20 border-2 border-white/10'
          } ${isInitializing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isInitializing ? <Loader2 size={28} className="animate-spin" /> : isActive ? <MicOff size={28} /> : <Mic size={32} />}
        </button>

      </div>
    </div>
  );
};
