
import React, { useState, useEffect } from 'react';
import { Activity, Database, Mic, Cpu, X, Zap } from 'lucide-react';
import { NEXUS_VOICE_PROFILES } from '../config/nexus_configs';

export const DevOverlay: React.FC = () => {
  const [activePanel, setActivePanel] = useState<'tokens' | 'memory' | 'voice' | 'performance'>('performance');
  const [metrics, setMetrics] = useState({
    tokensPerSec: 0,
    npuUsage: 0,
    temp: 34,
    power: 0.8
  });

  // Simulate real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        tokensPerSec: 18 + Math.random() * 4,
        npuUsage: 40 + Math.random() * 20,
        temp: 34 + Math.random() * 2,
        power: 0.8 + Math.random() * 0.4
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-black/80 backdrop-blur-xl border border-nexus-700 rounded-lg shadow-2xl text-xs font-mono overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-nexus-700 bg-nexus-800/50">
        <div className="flex items-center gap-2 text-nexus-highlight">
          <Activity size={14} />
          <span className="font-bold">NEXUS DEV OVERLAY</span>
        </div>
        <div className="flex gap-1">
            <div className={`h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse`} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-nexus-700">
        {[
            { id: 'tokens', icon: Zap },
            { id: 'memory', icon: Database },
            { id: 'voice', icon: Mic },
            { id: 'performance', icon: Cpu }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id as any)}
                className={`flex-1 p-2 flex justify-center hover:bg-white/5 transition-colors ${activePanel === tab.id ? 'text-white border-b-2 border-nexus-highlight' : 'text-nexus-dim'}`}
            >
                <tab.icon size={14} />
            </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 h-48 overflow-y-auto">
        
        {activePanel === 'performance' && (
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-nexus-dim">Throughput</span>
                    <span className="text-emerald-400 font-bold">{metrics.tokensPerSec.toFixed(1)} t/s</span>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-nexus-dim">NPU Usage</span>
                        <span className="text-white">{metrics.npuUsage.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-nexus-700 rounded-full overflow-hidden">
                        <div className="h-full bg-nexus-highlight transition-all duration-500" style={{ width: `${metrics.npuUsage}%` }} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-white/5 p-2 rounded">
                        <div className="text-nexus-dim text-[10px]">THERMAL</div>
                        <div className="text-white">{metrics.temp.toFixed(1)}°C</div>
                    </div>
                    <div className="bg-white/5 p-2 rounded">
                        <div className="text-nexus-dim text-[10px]">POWER</div>
                        <div className="text-white">{metrics.power.toFixed(2)}W</div>
                    </div>
                </div>
            </div>
        )}

        {activePanel === 'voice' && (
            <div className="space-y-3">
                <div className="space-y-1">
                    <div className="text-nexus-dim uppercase tracking-wider text-[10px]">Active Profile</div>
                    <div className="text-emerald-400 font-bold">Default (Human-Level)</div>
                </div>
                <div className="space-y-1">
                    <div className="text-nexus-dim uppercase tracking-wider text-[10px]">Pipeline Stats</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-nexus-dim">
                        <span>Chunk Size:</span> <span className="text-white text-right">Adaptive</span>
                        <span>Vocoder:</span> <span className="text-white text-right">{NEXUS_VOICE_PROFILES.vocoder.model}</span>
                        <span>Latency:</span> <span className="text-white text-right">180ms</span>
                        <span>Pitch Base:</span> <span className="text-white text-right">1.0</span>
                    </div>
                </div>
                 <div className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    Confidence Weighted Prosody Active
                </div>
            </div>
        )}

        {activePanel === 'tokens' && (
            <div className="font-mono text-[10px] space-y-2">
                <div className="flex gap-2 text-nexus-dim">
                   <span className="text-emerald-500">ACCEPTED</span>
                   <span>REJECTED (DRAFT)</span>
                </div>
                <div className="break-all leading-relaxed">
                    <span className="text-emerald-500">The_</span>
                    <span className="text-emerald-500">speculative_</span>
                    <span className="text-red-500 line-through opacity-50">output_</span>
                    <span className="text-emerald-500">decoding_</span>
                    <span className="text-emerald-500">algorithm_</span>
                    <span className="text-emerald-500">improves_</span>
                    <span className="text-emerald-500">latency_</span>
                    <span className="text-red-500 line-through opacity-50">by_20%_</span>
                    <span className="text-emerald-500">significantly.</span>
                </div>
            </div>
        )}
        
        {activePanel === 'memory' && (
             <div className="space-y-2">
                <div className="text-nexus-dim uppercase tracking-wider text-[10px]">Active Anchors</div>
                <div className="flex flex-wrap gap-1">
                    {['user_goals', 'instructions', 'react_context'].map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-nexus-highlight/20 text-nexus-highlight rounded border border-nexus-highlight/30">
                            {tag}
                        </span>
                    ))}
                </div>
                <div className="mt-2 text-nexus-dim uppercase tracking-wider text-[10px]">Decay Rate</div>
                <div className="text-white">Logarithmic (Slow)</div>
             </div>
        )}

      </div>
    </div>
  );
};
