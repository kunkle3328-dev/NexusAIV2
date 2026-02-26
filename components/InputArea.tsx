import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, X } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  isDisabled: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isDisabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isDisabled) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  return (
    <div className="bg-nexus-800/90 backdrop-blur-xl border border-nexus-700 rounded-3xl p-2 shadow-2xl relative group focus-within:border-nexus-500 transition-colors duration-300">
      <div className="flex items-end gap-2">
        <button 
          className="p-3 text-nexus-dim hover:text-white hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
          disabled={isDisabled}
        >
          <Paperclip size={20} />
        </button>
        
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Nexus..."
          disabled={isDisabled}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-nexus-dim/50 resize-none py-3 max-h-[120px] focus:outline-none text-sm font-medium leading-relaxed"
        />

        {input.trim() ? (
          <button 
            onClick={handleSubmit}
            disabled={isDisabled}
            className={`p-3 rounded-full mb-0.5 transition-all duration-200 ${
                isDisabled ? 'bg-nexus-700 text-nexus-dim' : 'bg-white text-nexus-900 hover:scale-105'
            }`}
          >
            <Send size={18} fill="currentColor" />
          </button>
        ) : (
          <button 
            disabled={isDisabled}
            className="p-3 text-nexus-dim hover:text-white hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
          >
            <Mic size={20} />
          </button>
        )}
      </div>
    </div>
  );
};