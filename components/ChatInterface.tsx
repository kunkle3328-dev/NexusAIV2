import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { streamInference } from '../services/InferenceEngine';
import { ArrowDown } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, setMessages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isNearBottom || isStreaming) {
            scrollToBottom(isStreaming ? 'auto' : 'smooth');
        }
    }
  }, [messages, isStreaming]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollBottom(!isNearBottom);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now() + 1,
      isThinking: true,
      thinkingContent: "Reflecting..."
    };

    setMessages(prev => [...prev, modelMessage]);

    try {
      const stream = streamInference(messages, text, false); 
      let accumulatedText = '';
      let isFirstToken = true;

      for await (const packet of stream) {
        if (isFirstToken) {
            setMessages(prev => prev.map(m => 
                m.id === modelMessageId 
                ? { ...m, isThinking: false, thinkingContent: undefined } 
                : m
            ));
            isFirstToken = false;
        }

        if (packet.text) {
          accumulatedText += packet.text;
          
          setMessages(prev => prev.map(m => 
            m.id === modelMessageId 
            ? { ...m, content: accumulatedText } 
            : m
          ));

          // 🦀 Voice Bridge Simulation
          if (packet.isSentenceEnd && packet.prosody) {
             // In a real app, this sends data to the Audio Engine.
             // console.log(`[Voice Bridge] Enqueue: "${packet.text}" | Pitch: ${packet.prosody.pitch.toFixed(2)} | Rate: ${packet.prosody.rate.toFixed(2)}`);
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.map(m => m.id === modelMessageId ? {...m, isThinking: false, content: "Inference Error"} : m));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-32"
      >
        {messages.map((msg, index) => (
          <MessageBubble key={msg.id} message={msg} isLast={index === messages.length - 1} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showScrollBottom && (
          <button 
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-6 bg-nexus-700 p-2 rounded-full shadow-lg border border-nexus-600 hover:bg-nexus-600 transition-colors z-20 text-nexus-dim"
          >
              <ArrowDown size={20} />
          </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-nexus-900 via-nexus-900 to-transparent">
        <InputArea onSendMessage={handleSendMessage} isDisabled={isStreaming} />
      </div>
    </div>
  );
};