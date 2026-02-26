
import React from 'react';
import { X, Clock, Trash2, MessageSquare, ChevronRight, Calendar } from 'lucide-react';
import { ChatSession } from '../types';

interface HistoryModalProps {
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
  onClose, 
  sessions, 
  currentSessionId, 
  onLoadSession, 
  onDeleteSession 
}) => {
  // Sort sessions by timestamp descending
  const sortedSessions = [...sessions].sort((a, b) => b.timestamp - a.timestamp);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-nexus-800 border border-nexus-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-nexus-700 shrink-0 bg-nexus-800/80 backdrop-blur-md">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Clock size={18} />
            Chat History
          </h2>
          <button onClick={onClose} className="text-nexus-dim hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-nexus-dim space-y-4">
              <Calendar size={48} className="opacity-20" />
              <p className="text-sm">No saved sessions yet.</p>
            </div>
          ) : (
            sortedSessions.map((session) => (
              <div 
                key={session.id} 
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  session.id === currentSessionId 
                    ? 'bg-nexus-700/50 border-nexus-highlight/30 shadow-[0_0_15px_-5px_rgba(59,130,246,0.3)]' 
                    : 'bg-nexus-900/50 border-white/5 hover:bg-nexus-700/30 hover:border-white/10'
                }`}
                onClick={() => onLoadSession(session)}
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium truncate ${session.id === currentSessionId ? 'text-nexus-highlight' : 'text-gray-200'}`}>
                      {session.title || 'Untitled Session'}
                    </span>
                    {session.id === currentSessionId && (
                      <span className="text-[10px] bg-nexus-highlight/10 text-nexus-highlight px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-nexus-dim">
                    <span className="flex items-center gap-1">
                      <MessageSquare size={10} />
                      {session.messages.length - 1} msgs
                    </span>
                    <span>•</span>
                    <span>{formatTime(session.timestamp)}</span>
                  </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="p-2 text-nexus-dim hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete Session"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
