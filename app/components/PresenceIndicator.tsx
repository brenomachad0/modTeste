/**
 * PresenceIndicator - Indicador Flutuante de Presença (Estilo Figma)
 * 
 * Mostra avatares dos usuários ativos de forma discreta no topo direito
 * Clique para expandir detalhes
 */

'use client';

import { useState, useEffect } from 'react';
import { useCollaborativeCursors } from '@/app/hooks/useCollaborativeCursors';
import { UserPresence } from '@/lib/websocket/PresenceManager';

interface UserAvatarProps {
  user: UserPresence;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

function UserAvatar({ user, size = 'md', showTooltip = true, onClick }: UserAvatarProps & { onClick?: () => void }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  const initials = user.user_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative group">
      <div
        onClick={onClick}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white shadow-md transition-transform hover:scale-110 cursor-pointer`}
        style={{ backgroundColor: user.color }}
        title={showTooltip ? user.user_name : undefined}
      >
        {user.user_avatar ? (
          <img 
            src={user.user_avatar} 
            alt={user.user_name} 
            className="w-full h-full rounded-full object-cover" 
          />
        ) : (
          initials
        )}
      </div>

      {/* Status indicator */}
      <div
        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
          user.is_idle ? 'bg-yellow-400' : 'bg-green-500'
        }`}
        title={user.is_idle ? 'Ausente' : 'Ativo'}
      />

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {user.user_name}
            {user.is_editing && ' • Editando'}
          </div>
        </div>
      )}
    </div>
  );
}

function getPageLabel(page: UserPresence['page']): string {
  const labels = {
    dashboard: '📊 Dashboard',
    projeto: '📁 Projeto',
    entrega: '📦 Entrega',
    servico: '⚙️ Serviço',
  };
  return labels[page] || '📄 Navegando';
}

export function PresenceIndicator() {
  const { otherUsers, currentUser, allUsers } = useCollaborativeCursors();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Só renderiza no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Função para "teleportar" até o cursor do usuário
  const teleportToUser = (user: UserPresence) => {
    // Scroll suave até a posição do cursor
    const targetX = user.cursor.x - window.innerWidth / 2;
    const targetY = user.cursor.y - window.innerHeight / 2;

    window.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: 'smooth',
    });

    // Flash visual no cursor (opcional - adiciona destaque)
    const flash = document.createElement('div');
    flash.className = 'fixed z-[10000] pointer-events-none';
    flash.style.left = `${user.cursor.x}px`;
    flash.style.top = `${user.cursor.y}px`;
    flash.innerHTML = `
      <div class="relative">
        <div class="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 animate-ping" style="border-color: ${user.color}"></div>
        <div class="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2" style="border-color: ${user.color}"></div>
      </div>
    `;
    document.body.appendChild(flash);

    // Remove o flash após a animação
    setTimeout(() => {
      document.body.removeChild(flash);
    }, 1000);
  };

  if (!mounted || allUsers.length === 0) return null;

  const visibleUsers = otherUsers.slice(0, 3);
  const hiddenCount = otherUsers.length - visibleUsers.length;

  return (
    <>
      {/* Indicador Flutuante Compacto (Estilo Figma) */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
        {/* Avatares empilhados */}
        <div 
          className="flex items-center -space-x-2 hover:space-x-1 transition-all"
        >
          {visibleUsers.map((user: UserPresence) => (
            <div 
              key={user.user_id}
              onClick={(e) => {
                e.stopPropagation();
                teleportToUser(user);
              }}
            >
              <UserAvatar user={user} size="md" showTooltip={!isExpanded} />
            </div>
          ))}

          {hiddenCount > 0 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 ring-2 ring-white shadow-md">
              +{hiddenCount}
            </div>
          )}
        </div>

        {/* Botão de expandir/recolher */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={isExpanded ? 'Recolher' : 'Ver todos'}
        >
          {isExpanded ? '✕' : '👥'}
        </button>
      </div>

      {/* Painel Expandido (Dropdown) */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => setIsExpanded(false)}
          />

          {/* Painel */}
          <div className="fixed top-16 right-4 z-[100] w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  👥 Usuários Online ({allUsers.length})
                </h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lista de usuários */}
            <div className="max-h-96 overflow-y-auto">
              {/* Você */}
              {currentUser && (
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={currentUser} size="md" showTooltip={false} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {currentUser.user_name} <span className="text-xs text-gray-500">(você)</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getPageLabel(currentUser.page)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Outros usuários */}
              {otherUsers.map((user: UserPresence) => (
                <div
                  key={user.user_id}
                  onClick={() => {
                    teleportToUser(user);
                    setIsExpanded(false);
                  }}
                  className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} size="md" showTooltip={false} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.user_name}
                        <span className="ml-2 text-xs text-gray-400">👁️ Ver cursor</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {getPageLabel(user.page)}
                      </div>
                      {user.is_editing && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                          ✏️ Editando...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer com dica */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Pressione <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">/</kbd> para abrir comandos
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
