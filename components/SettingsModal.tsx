
import React, { useState, useEffect } from 'react';
import { X, Cpu, FileJson, Activity, Terminal, UserCog, Plus, Trash2, Check, Save, Mic } from 'lucide-react';
import { AppState, Preset } from '../types';
import { LOCKED_FILES, NEXUS_LLM_CORE } from '../config/nexus_configs';

interface SettingsModalProps {
  onClose: () => void;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  presets: Preset[];
  activePresetId: string;
  onAddPreset: (preset: Preset) => void;
  onDeletePreset: (id: string) => void;
  onSetActivePreset: (id: string) => void;
}

const VOICE_OPTIONS = [
    { id: 'Zephyr', name: 'Zephyr (Calm)', desc: 'Balanced, calm, helpful.' },
    { id: 'Puck', name: 'Puck (Energetic)', desc: 'Energetic, fast-paced.' },
    { id: 'Charon', name: 'Charon (Deep)', desc: 'Deep, authoritative.' },
    { id: 'Kore', name: 'Kore (Soft)', desc: 'Soft, soothing.' },
    { id: 'Fenrir', name: 'Fenrir (Intense)', desc: 'Intense, focused.' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  appState, 
  setAppState,
  presets,
  activePresetId,
  onAddPreset,
  onDeletePreset,
  onSetActivePreset
}) => {
  const [activeTab, setActiveTab] = useState<'system' | 'personas'>('personas');
  const [clickCount, setClickCount] = useState(0);
  
  // New Preset Form State
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetPrompt, setNewPresetPrompt] = useState('');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (clickCount > 0) {
      timer = setTimeout(() => setClickCount(0), 1000);
    }
    return () => clearTimeout(timer);
  }, [clickCount]);

  const handleVersionClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 === 3) {
      setAppState(prev => ({ ...prev, devMode: !prev.devMode }));
      setClickCount(0);
    }
  };

  const handleAddPreset = () => {
    if (!newPresetName.trim() || !newPresetPrompt.trim()) return;
    onAddPreset({
      id: Date.now().toString(),
      name: newPresetName,
      description: 'Custom User Persona',
      systemPrompt: newPresetPrompt
    });
    setNewPresetName('');
    setNewPresetPrompt('');
    setIsAddingPreset(false);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-nexus-800 border border-nexus-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-nexus-700 shrink-0">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Cpu size={18} />
            Configuration
          </h2>
          <button onClick={onClose} className="text-nexus-dim hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-2 gap-2 border-b border-nexus-700 bg-nexus-900/50">
           <button 
             onClick={() => setActiveTab('personas')}
             className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'personas' ? 'bg-nexus-700 text-white shadow-sm' : 'text-nexus-dim hover:bg-white/5'}`}
           >
             <UserCog size={16} />
             Personas
           </button>
           <button 
             onClick={() => setActiveTab('system')}
             className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'system' ? 'bg-nexus-700 text-white shadow-sm' : 'text-nexus-dim hover:bg-white/5'}`}
           >
             <Activity size={16} />
             System
           </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto flex-1">
            
          {activeTab === 'personas' && (
            <div className="space-y-6">
               
               {/* Voice Personality Selector */}
               <div className="space-y-3">
                  <label className="text-xs font-mono text-nexus-dim uppercase tracking-wider flex items-center gap-2">
                      <Mic size={12} /> Voice Personality
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                      {VOICE_OPTIONS.map(voice => (
                          <button
                             key={voice.id}
                             onClick={() => setAppState(prev => ({...prev, activeVoiceId: voice.id}))}
                             className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                 appState.activeVoiceId === voice.id 
                                 ? 'bg-nexus-highlight/10 border-nexus-highlight text-white' 
                                 : 'bg-nexus-900 border-nexus-700 text-nexus-dim hover:bg-nexus-800'
                             }`}
                          >
                             <div>
                                 <div className="text-sm font-medium">{voice.name}</div>
                                 <div className="text-xs opacity-70">{voice.desc}</div>
                             </div>
                             {appState.activeVoiceId === voice.id && <Check size={16} className="text-nexus-highlight" />}
                          </button>
                      ))}
                  </div>
               </div>

               <div className="h-px bg-nexus-700/50 w-full" />

               {/* Preset List */}
               <div className="space-y-3">
                 <label className="text-xs font-mono text-nexus-dim uppercase tracking-wider flex items-center gap-2">
                      <UserCog size={12} /> System Persona
                  </label>
                 {presets.map(preset => (
                   <div 
                     key={preset.id}
                     onClick={() => onSetActivePreset(preset.id)}
                     className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                       activePresetId === preset.id 
                       ? 'bg-nexus-highlight/10 border-nexus-highlight/40 shadow-[0_0_15px_-5px_rgba(59,130,246,0.3)]' 
                       : 'bg-nexus-900 border-nexus-700 hover:border-nexus-500'
                     }`}
                   >
                     <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-sm text-white flex items-center gap-2">
                            {preset.name}
                            {activePresetId === preset.id && <Check size={14} className="text-nexus-highlight" />}
                        </div>
                        {preset.id !== 'default' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeletePreset(preset.id); }}
                                className="text-nexus-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                     </div>
                     <p className="text-xs text-nexus-dim line-clamp-2">{preset.systemPrompt}</p>
                   </div>
                 ))}
               </div>

               {/* Add New Preset */}
               {isAddingPreset ? (
                 <div className="bg-nexus-900 border border-nexus-700 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center text-xs text-nexus-dim uppercase font-bold tracking-wider">
                        New Persona
                        <button onClick={() => setIsAddingPreset(false)}><X size={14} /></button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Persona Name (e.g., Coding Assistant)" 
                      className="w-full bg-nexus-800 border border-nexus-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-nexus-highlight"
                      value={newPresetName}
                      onChange={e => setNewPresetName(e.target.value)}
                    />
                    <textarea 
                      placeholder="System Instructions..." 
                      className="w-full bg-nexus-800 border border-nexus-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-nexus-highlight h-24 resize-none"
                      value={newPresetPrompt}
                      onChange={e => setNewPresetPrompt(e.target.value)}
                    />
                    <button 
                        onClick={handleAddPreset}
                        className="w-full py-2 bg-nexus-highlight text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Save Persona
                    </button>
                 </div>
               ) : (
                 <button 
                   onClick={() => setIsAddingPreset(true)}
                   className="w-full py-3 border border-dashed border-nexus-600 rounded-xl text-nexus-dim hover:text-white hover:bg-white/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
                 >
                    <Plus size={16} />
                    Create New Persona
                 </button>
               )}
            </div>
          )}

          {activeTab === 'system' && (
            <>
              {/* Engine Status */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-nexus-dim uppercase tracking-wider">Primary Model (Locked)</label>
                <div className="bg-nexus-900 rounded-lg p-3 border border-nexus-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <div>
                            <div className="text-sm font-medium text-white">{NEXUS_LLM_CORE.model.primary}</div>
                            <div className="text-xs text-nexus-dim">Galaxy S25 Optimized • Q5_K_M</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-nexus-dim">
                        <div className="bg-white/5 p-1 rounded">CTX: {NEXUS_LLM_CORE.model.context_length}</div>
                        <div className="bg-white/5 p-1 rounded">TEMP: {NEXUS_LLM_CORE.generation.temperature}</div>
                    </div>
                </div>
              </div>

              {/* Locked Configs Viewer */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-nexus-dim uppercase tracking-wider flex items-center gap-2">
                    <FileJson size={12} />
                    Locked Configuration Files
                </label>
                <div className="space-y-2">
                    {LOCKED_FILES.map(file => (
                        <div key={file.name} className="bg-nexus-900 border border-nexus-700 rounded-lg overflow-hidden">
                            <div className="px-3 py-1.5 bg-white/5 border-b border-white/5 text-[10px] font-mono text-nexus-dim">
                                {file.name}
                            </div>
                            <div className="p-2 text-[10px] font-mono text-gray-500 whitespace-pre overflow-x-auto">
                                {file.content}
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              {/* Diagnostics Link */}
              <button 
                onClick={() => {
                    setAppState(prev => ({...prev, view: 'diagnostics'}));
                    onClose();
                }}
                className="w-full py-3 bg-nexus-700 hover:bg-nexus-600 rounded-lg border border-nexus-600 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
              >
                <Activity size={16} />
                Open Regression Diagnostics
              </button>
              
              {appState.devMode && (
                <div className="p-3 bg-nexus-highlight/10 border border-nexus-highlight/30 rounded-lg flex items-center gap-3 text-nexus-highlight">
                    <Terminal size={18} />
                    <div className="text-xs font-medium">Developer Mode Active. Overlay enabled.</div>
                </div>
              )}
            </>
          )}

        </div>
        
        <div className="p-4 bg-nexus-900 border-t border-nexus-700 text-center shrink-0">
            <span 
              onClick={handleVersionClick}
              className={`text-[10px] text-nexus-dim font-mono cursor-pointer select-none transition-colors ${clickCount > 0 ? 'text-white' : ''}`}
            >
              NEXUS AI v2.2 • BUILD 2025.04.15 {clickCount > 0 && `(${3 - clickCount})`}
            </span>
        </div>
      </div>
    </div>
  );
};
