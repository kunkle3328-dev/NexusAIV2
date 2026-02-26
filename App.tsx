
import React, { useState, useEffect, useCallback } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { VoiceMode } from './components/VoiceMode';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { RegressionTests } from './components/RegressionTests';
import { DevOverlay } from './components/DevOverlay';
import { AppState, Message, Preset, ChatSession } from './types';
import { Brain, Settings, Mic, MessageSquare, Activity, Plus, Clock } from 'lucide-react';
import { SYSTEM_INSTRUCTION } from './constants';

const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'default',
    name: 'Nexus Core',
    description: 'Default assistant personality',
    systemPrompt: SYSTEM_INSTRUCTION
  },
  {
    id: 'coder',
    name: 'Senior Architect',
    description: 'Expert in software design and coding',
    systemPrompt: "You are a Senior Software Architect. You provide robust, scalable, and secure code solutions. You prefer TypeScript and Rust. You always explain the 'why' behind architectural decisions."
  },
  {
    id: 'concise',
    name: 'Concise Bot',
    description: 'Short, direct answers',
    systemPrompt: "You are a concise assistant. Answer efficiently. Do not use fluff. Get straight to the point."
  }
];

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    view: 'chat',
    isSettingsOpen: false,
    isHistoryOpen: false,
    isOfflineMode: true,
    devMode: false,
    activeVoiceId: 'Zephyr'
  });

  // --- Persistence & State ---
  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('nexus_presets');
    return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
  });

  const [activePresetId, setActivePresetId] = useState<string>(() => {
    return localStorage.getItem('nexus_active_preset') || 'default';
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('nexus_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Messages state - initialized dynamically based on active preset if no session loaded
  const [messages, setMessages] = useState<Message[]>([]);

  // --- Effects ---

  // Save Presets
  useEffect(() => {
    localStorage.setItem('nexus_presets', JSON.stringify(presets));
  }, [presets]);

  // Save Active Preset
  useEffect(() => {
    localStorage.setItem('nexus_active_preset', activePresetId);
  }, [activePresetId]);

  // Save Sessions
  useEffect(() => {
    localStorage.setItem('nexus_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Save Active Voice
  useEffect(() => {
    localStorage.setItem('nexus_active_voice', appState.activeVoiceId);
  }, [appState.activeVoiceId]);

  // Load Voice Preference
  useEffect(() => {
      const savedVoice = localStorage.getItem('nexus_active_voice');
      if (savedVoice) {
          setAppState(prev => ({...prev, activeVoiceId: savedVoice}));
      }
  }, []);

  // Auto-save current session when messages change
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      setSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === currentSessionId);
        
        // Determine title from first user message
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg ? (firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')) : 'New Conversation';

        const updatedSession: ChatSession = {
          id: currentSessionId,
          title: title,
          timestamp: Date.now(),
          messages: messages,
          presetId: activePresetId
        };

        if (existingIndex >= 0) {
          const newSessions = [...prev];
          newSessions[existingIndex] = updatedSession;
          return newSessions;
        } else {
          return [updatedSession, ...prev];
        }
      });
    }
  }, [messages, currentSessionId, activePresetId]);

  // Initialize Chat on Mount if empty
  useEffect(() => {
    if (messages.length === 0 && !currentSessionId) {
       startNewChat();
    }
  }, []); // Run once on mount

  // --- Handlers ---

  const getActivePreset = () => presets.find(p => p.id === activePresetId) || presets[0];

  const startNewChat = () => {
    const newSessionId = Date.now().toString();
    const preset = getActivePreset();
    
    const initialMessages: Message[] = [
      {
        id: 'init-1',
        role: 'system',
        content: preset.systemPrompt,
        timestamp: Date.now(),
        isSystem: true
      },
      {
        id: 'init-2',
        role: 'model',
        content: `Nexus System Ready. Persona: ${preset.name}.`,
        timestamp: Date.now(),
      }
    ];

    setCurrentSessionId(newSessionId);
    setMessages(initialMessages);
    setAppState(prev => ({ ...prev, view: 'chat' }));
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setActivePresetId(session.presetId || 'default');
    setAppState(prev => ({ ...prev, isHistoryOpen: false, view: 'chat' }));
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      startNewChat();
    }
  };

  const handleAddPreset = (newPreset: Preset) => {
    setPresets(prev => [...prev, newPreset]);
  };

  const handleDeletePreset = (id: string) => {
    if (id === 'default') return; // Protect default
    setPresets(prev => prev.filter(p => p.id !== id));
    if (activePresetId === id) {
      setActivePresetId('default');
    }
  };

  const toggleView = (view: AppState['view']) => {
    setAppState(prev => ({ ...prev, view }));
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-nexus-900 text-white font-sans selection:bg-nexus-700 relative">
      {/* Dev Overlay Injection */}
      {appState.devMode && <DevOverlay />}

      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-nexus-800 px-4 shrink-0 z-10 bg-nexus-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
            <Brain size={18} className="text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-sm font-semibold tracking-wide">NEXUS AI</h1>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${appState.isOfflineMode ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
              <span className="text-[10px] font-medium text-nexus-dim uppercase tracking-wider">
                {appState.isOfflineMode ? 'Llama 3.1 8B' : 'Cloud Link'}
              </span>
            </div>
          </div>
          
          {/* Mobile-ish New Chat Shortcut */}
          <button 
             onClick={startNewChat}
             className="md:hidden ml-2 p-1.5 bg-nexus-800 rounded-lg border border-nexus-700 text-nexus-dim hover:text-white"
          >
             <Plus size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Primary Nav */}
          <div className="flex items-center bg-nexus-800/50 rounded-lg p-0.5 border border-white/5">
            <button 
                onClick={() => toggleView('chat')}
                className={`p-2 rounded-md transition-all ${appState.view === 'chat' ? 'bg-nexus-700 text-white shadow-sm' : 'text-nexus-dim hover:text-white hover:bg-white/5'}`}
                title="Chat Interface"
            >
                <MessageSquare size={18} />
            </button>
            <button 
                onClick={() => toggleView('voice')}
                className={`p-2 rounded-md transition-all ${appState.view === 'voice' ? 'bg-nexus-700 text-white shadow-sm' : 'text-nexus-dim hover:text-white hover:bg-white/5'}`}
                title="Voice Mode"
            >
                <Mic size={18} />
            </button>
            <button 
                onClick={() => toggleView('diagnostics')}
                className={`p-2 rounded-md transition-all ${appState.view === 'diagnostics' ? 'bg-nexus-700 text-white shadow-sm' : 'text-nexus-dim hover:text-white hover:bg-white/5'}`}
                title="Diagnostics"
            >
                <Activity size={18} />
            </button>
          </div>

          <div className="h-6 w-px bg-nexus-800 mx-1"></div>

          {/* Action Tools */}
           <button 
            onClick={startNewChat}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus size={14} />
            New Chat
          </button>

          <button 
            onClick={() => setAppState(prev => ({ ...prev, isHistoryOpen: true }))}
            className="p-2 text-nexus-dim hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Chat History"
          >
            <Clock size={20} />
          </button>

          <button 
            onClick={() => setAppState(prev => ({ ...prev, isSettingsOpen: true }))}
            className="p-2 text-nexus-dim hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Configuration"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {appState.view === 'chat' && (
          <ChatInterface messages={messages} setMessages={setMessages} />
        )}
        {appState.view === 'voice' && (
          <VoiceMode activeVoiceId={appState.activeVoiceId} />
        )}
        {appState.view === 'diagnostics' && (
          <RegressionTests />
        )}

        {appState.isSettingsOpen && (
          <SettingsModal 
            onClose={() => setAppState(prev => ({ ...prev, isSettingsOpen: false }))} 
            appState={appState}
            setAppState={setAppState}
            presets={presets}
            activePresetId={activePresetId}
            onAddPreset={handleAddPreset}
            onDeletePreset={handleDeletePreset}
            onSetActivePreset={setActivePresetId}
          />
        )}

        {appState.isHistoryOpen && (
          <HistoryModal 
             onClose={() => setAppState(prev => ({ ...prev, isHistoryOpen: false }))}
             sessions={sessions}
             currentSessionId={currentSessionId}
             onLoadSession={loadSession}
             onDeleteSession={deleteSession}
          />
        )}
      </main>
    </div>
  );
}
