/**
 * SlashCommandPanel - Painel de Comandos Rápidos (Estilo Figma)
 * 
 * Pressione "/" para abrir
 * Mostra comandos rápidos e chat (futuro)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useCollaborativeCursors } from '@/app/hooks/useCollaborativeCursors';

interface Command {
  id: string;
  icon: string;
  label: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'presence' | 'tools';
}

export function SlashCommandPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { allUsers } = useCollaborativeCursors();

  // Comandos disponíveis
  const commands: Command[] = [
    {
      id: 'dashboard',
      icon: '📊',
      label: 'Ir para Dashboard',
      description: 'Ver todos os projetos',
      category: 'navigation',
      action: () => window.location.href = '/',
    },
    {
      id: 'users',
      icon: '👥',
      label: `Ver Usuários Online (${allUsers.length})`,
      description: 'Ver quem está ativo no momento',
      category: 'presence',
      action: () => alert('Abrir painel de usuários'),
    },
    {
      id: 'demo',
      icon: '🎭',
      label: 'Abrir Demo de Cursores',
      description: 'Ver demonstração do sistema de presença',
      category: 'tools',
      action: () => window.location.href = '/demo-presence',
    },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  // Detecta tecla "/" para abrir
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se "/" for pressionado e não está digitando em input/textarea
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsOpen(true);
      }

      // ESC para fechar
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearch('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Foca no input quando abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
        onClick={() => {
          setIsOpen(false);
          setSearch('');
        }}
      />

      {/* Painel de Comandos */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[201] w-full max-w-2xl px-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Input de busca */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Digite para buscar comandos..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg"
              />
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                ESC
              </kbd>
            </div>
          </div>

          {/* Lista de comandos */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">🤷‍♂️</p>
                <p>Nenhum comando encontrado</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                  >
                    <div className="text-3xl">{cmd.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {cmd.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {cmd.description}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer com dicas */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded font-mono">↑↓</kbd> Navegar
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded font-mono">Enter</kbd> Selecionar
                </span>
              </div>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded font-mono">ESC</kbd> Fechar
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
