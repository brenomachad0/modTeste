/**
 * CollaborativeChat - Chat em Tempo Real com Balões Flutuantes
 * 
 * Pressione "/" para digitar uma mensagem
 * A mensagem aparece como balão perto do seu cursor
 * Outros usuários veem a mensagem aparecer perto do cursor deles
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/app/hooks/useSocket';
import { useCollaborativeCursors } from '@/app/hooks/useCollaborativeCursors';

interface ChatMessage {
  user_id: string;
  user_name: string;
  message: string;
  color: string;
  position: { x: number; y: number };
  timestamp: number;
  fadeOut?: boolean; // Flag para iniciar fade out
}

export function CollaborativeChat() {
  const [isTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState('');
  const [myPosition, setMyPosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { emit, on } = useSocket();
  const { currentUser } = useCollaborativeCursors();

  // Só renderiza no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Captura posição do cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMyPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Detecta "/" para abrir chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se "/" for pressionado e não está digitando em input/textarea
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsTyping(true);
        setMessage('');
      }

      // ESC para cancelar
      if (e.key === 'Escape' && isTyping) {
        setIsTyping(false);
        setMessage('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping]);

  // Foca no input quando abre
  useEffect(() => {
    if (isTyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTyping]);

  // Envia mensagem
  const handleSend = () => {
    if (!message.trim() || !currentUser) return;

    const chatMessage: ChatMessage = {
      user_id: currentUser.user_id,
      user_name: currentUser.user_name,
      message: message.trim(),
      color: currentUser.color,
      position: myPosition,
      timestamp: Date.now(),
    };

    // Adiciona à lista local
    setMessages(prev => [...prev, chatMessage]);

    // Envia para outros usuários via WebSocket
    emit('chat:message', chatMessage);

    // Limpa input
    setMessage('');
    setIsTyping(false);

    // Inicia fade out após 4 segundos
    setTimeout(() => {
      setMessages(prev => 
        prev.map(m => m.timestamp === chatMessage.timestamp ? { ...m, fadeOut: true } : m)
      );
    }, 4000);

    // Remove mensagem após 6 segundos (1s a mais para completar animação)
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.timestamp !== chatMessage.timestamp));
    }, 6000);
  };

  // Recebe mensagens de outros usuários
  useEffect(() => {
    const unsubscribe = on('chat:message', (data: ChatMessage) => {
      // Não mostra sua própria mensagem de novo
      if (data.user_id === currentUser?.user_id) return;

      setMessages(prev => [...prev, data]);

      // Inicia fade out após 4 segundos
      setTimeout(() => {
        setMessages(prev => 
          prev.map(m => m.timestamp === data.timestamp ? { ...m, fadeOut: true } : m)
        );
      }, 4000);

      // Remove após 6 segundos
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.timestamp !== data.timestamp));
      }, 6000);
    });

    // Também escuta eventos da demo simulada
    const handleDemoMessage = (e: CustomEvent) => {
      const data = e.detail as ChatMessage;
      if (data.user_id === currentUser?.user_id) return;

      setMessages(prev => [...prev, data]);

      // Inicia fade out após 4 segundos
      setTimeout(() => {
        setMessages(prev => 
          prev.map(m => m.timestamp === data.timestamp ? { ...m, fadeOut: true } : m)
        );
      }, 4000);

      // Remove após 6 segundos
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.timestamp !== data.timestamp));
      }, 6000);
    };

    window.addEventListener('demo:chat-message', handleDemoMessage as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('demo:chat-message', handleDemoMessage as EventListener);
    };
  }, [on, currentUser]);

  if (!mounted) return null;

  return (
    <>
      {/* Balão de input flutuante (estilo "Say something") */}
      {isTyping && (
        <div
          className="fixed z-[9999] pointer-events-auto"
          style={{
            left: `${myPosition.x + 20}px`,
            top: `${myPosition.y - 20}px`,
          }}
        >
          <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Balão rosa/roxo estilo Figma */}
            <div
              className="px-4 py-2 rounded-full shadow-xl flex items-center gap-2 min-w-[200px]"
              style={{
                backgroundColor: currentUser?.color || '#EC4899',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                  if (e.key === 'Escape') {
                    setIsTyping(false);
                    setMessage('');
                  }
                }}
                placeholder="Say something..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/70 text-sm font-medium"
                maxLength={100}
              />
              
              {message.trim() && (
                <button
                  onClick={handleSend}
                  className="text-white hover:scale-110 transition-transform"
                  title="Enviar (Enter)"
                >
                  ↵
                </button>
              )}
            </div>

            {/* Setinha apontando para o cursor */}
            <div
              className="absolute w-3 h-3 rotate-45"
              style={{
                backgroundColor: currentUser?.color || '#EC4899',
                bottom: '-4px',
                left: '10px',
              }}
            />
          </div>
        </div>
      )}

      {/* Mensagens de outros usuários (balões flutuantes) */}
      {messages.map((msg) => (
        <div
          key={msg.timestamp}
          className={`fixed z-[9998] pointer-events-none transition-all duration-1000 ${
            msg.fadeOut 
              ? 'opacity-0 scale-95' 
              : 'opacity-100 scale-100 animate-in fade-in slide-in-from-bottom-2'
          }`}
          style={{
            left: `${msg.position.x + 20}px`,
            top: `${msg.position.y - 20}px`,
          }}
        >
          <div className="relative">
            {/* Balão da mensagem */}
            <div
              className="px-4 py-2 rounded-2xl shadow-xl max-w-xs"
              style={{
                backgroundColor: msg.color,
              }}
            >
              <div className="text-[10px] font-semibold text-white/80 mb-0.5">
                {msg.user_name}
              </div>
              <div className="text-sm font-medium text-white break-words">
                {msg.message}
              </div>
            </div>

            {/* Setinha apontando para o cursor */}
            <div
              className="absolute w-3 h-3 rotate-45"
              style={{
                backgroundColor: msg.color,
                bottom: '-4px',
                left: '10px',
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}
