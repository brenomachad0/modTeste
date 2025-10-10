/**
 * CollaborativeCursors - Componente de Cursores Colaborativos
 * 
 * Renderiza cursores de outros usuários em tempo real
 * Inspirado no Figma/Miro
 */

'use client';

import { useState, useEffect } from 'react';
import { useCollaborativeCursors } from '@/app/hooks/useCollaborativeCursors';
import { UserPresence } from '@/lib/websocket/PresenceManager';

interface CursorProps {
  user: UserPresence;
}

function Cursor({ user }: CursorProps) {
  const { cursor, user_name, color, is_idle } = user;

  return (
    <div
      className="pointer-events-none fixed z-[9999] transition-all duration-75 ease-out"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        opacity: is_idle ? 0.3 : 1,
      }}
    >
      {/* Seta/Flecha estilo Figma */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
        }}
      >
        {/* Outline branco */}
        <path
          d="M3 3L3 16.5L7.5 12L11 17L13 16L9.5 11L15 11L3 3Z"
          fill="white"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Seta colorida */}
        <path
          d="M3 3L3 16.5L7.5 12L11 17L13 16L9.5 11L15 11L3 3Z"
          fill={color}
          strokeLinejoin="round"
        />
      </svg>

      {/* Nome do usuário (badge) */}
      <div
        className="mt-0.5 ml-4 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap"
        style={{
          backgroundColor: color,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        {user_name}
        {is_idle && ' 💤'}
      </div>
    </div>
  );
}

interface CollaborativeCursorsProps {
  /**
   * Se true, esconde cursores temporariamente
   */
  hidden?: boolean;
}

export function CollaborativeCursors({ hidden = false }: CollaborativeCursorsProps) {
  const { otherUsers } = useCollaborativeCursors();
  const [mounted, setMounted] = useState(false);

  // Só renderiza no cliente para evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || hidden || otherUsers.length === 0) {
    return null;
  }

  return (
    <>
      {otherUsers.map((user) => (
        <Cursor key={user.user_id} user={user} />
      ))}
    </>
  );
}
