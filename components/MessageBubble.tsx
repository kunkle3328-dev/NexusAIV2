
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { User, Cpu, Loader2, Copy, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast }) => {
  const isUser = message.role === 'user';
  const isSystem = message.isSystem;
  
  // State for code block copy
  const [codeCopied, setCodeCopied] = React.useState(false);
  // State for full message copy
  const [messageCopied, setMessageCopied] = React.useState(false);

  const handleCodeCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleMessageCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setMessageCopied(true);
    setTimeout(() => setMessageCopied(false), 2000);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4 opacity-50">
        <span className="text-xs font-mono text-nexus-highlight px-2 py-1 bg-nexus-highlight/10 rounded border border-nexus-highlight/20 uppercase tracking-widest">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border ${
          isUser 
            ? 'bg-nexus-700 border-nexus-600' 
            : 'bg-white/5 border-white/10'
        }`}>
          {isUser ? <User size={16} className="text-nexus-dim" /> : <Cpu size={16} className="text-white" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          <div className="flex items-center gap-2 mb-1 opacity-50">
            <span className="text-[10px] font-mono uppercase tracking-wider">
              {isUser ? 'User' : 'Nexus Core'}
            </span>
            <span className="text-[10px]">{new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            
            {/* Message Copy Button */}
            {!message.isThinking && (
              <button 
                onClick={handleMessageCopy}
                className="ml-1 p-1 hover:text-white hover:bg-white/10 rounded transition-all text-nexus-dim"
                title="Copy message content"
              >
                {messageCopied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
              </button>
            )}
          </div>
          
          <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm border overflow-hidden ${
            isUser 
              ? 'bg-nexus-700 border-nexus-600 text-white rounded-tr-sm' 
              : 'bg-nexus-800 border-nexus-700 text-nexus-accent rounded-tl-sm'
          }`}>
            {message.isThinking ? (
               <div className="flex items-center gap-2 text-nexus-dim py-1">
                 <Loader2 size={14} className="animate-spin" />
                 <span className="font-mono text-xs animate-pulse">REFLECTION_PASS_ACTIVE...</span>
               </div>
            ) : (
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                        code({node, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            const isInline = !match && !String(children).includes('\n');
                            
                            if (isInline) {
                                return (
                                    <code className="bg-white/10 text-nexus-accent px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                                        {children}
                                    </code>
                                )
                            }

                            return (
                                <div className="relative group my-3 rounded-lg overflow-hidden border border-white/10 bg-[#0d0d0d]">
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5 text-xs text-nexus-dim font-mono">
                                        <span>{match?.[1] || 'code'}</span>
                                        <button 
                                            onClick={() => handleCodeCopy(String(children))}
                                            className="hover:text-white transition-colors"
                                            title="Copy code block"
                                        >
                                            {codeCopied ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                    <div className="p-3 overflow-x-auto">
                                        <code className="font-mono text-xs text-gray-300" {...props}>
                                            {children}
                                        </code>
                                    </div>
                                </div>
                            )
                        },
                        ul: ({children}) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                        h1: ({children}) => <h1 className="text-lg font-bold my-3 pb-1 border-b border-white/10">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-semibold my-2 text-white">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-semibold my-2 text-white">{children}</h3>,
                        p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
