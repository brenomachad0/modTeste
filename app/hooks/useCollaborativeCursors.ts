/**
 * useCollaborativeCursors - Hook para cursores colaborativos
 * 
 * Rastreia e renderiza cursores de outros usuários em tempo real
 */

'use client';

import { useState, useEffect } from 'react';
import { presenceManager, UserPresence } from '@/lib/websocket/PresenceManager';

export function useCollaborativeCursors() {
  const [otherUsers, setOtherUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    // Atualiza lista quando alguém entra
    const unsubJoined = presenceManager.on('user_joined', () => {
      setOtherUsers(presenceManager.getOtherUsers());
    });

    // Atualiza lista quando alguém sai
    const unsubLeft = presenceManager.on('user_left', () => {
      setOtherUsers(presenceManager.getOtherUsers());
    });

    // Atualiza quando cursor move
    const unsubCursor = presenceManager.on('cursor_moved', () => {
      setOtherUsers(presenceManager.getOtherUsers());
    });

    // Atualiza quando alguém começa/para de editar
    const unsubEditStart = presenceManager.on('editing_started', () => {
      setOtherUsers(presenceManager.getOtherUsers());
    });

    const unsubEditStop = presenceManager.on('editing_stopped', () => {
      setOtherUsers(presenceManager.getOtherUsers());
    });

    // Atualiza quando alguém fica idle
    const unsubIdle = presenceManager.on('user_idle', () => {
      setOtherUsers(presenceManager.getOtherUsers());
    });

    // Estado inicial
    setOtherUsers(presenceManager.getOtherUsers());

    return () => {
      unsubJoined();
      unsubLeft();
      unsubCursor();
      unsubEditStart();
      unsubEditStop();
      unsubIdle();
    };
  }, []);

  return {
    otherUsers,
    currentUser: presenceManager.getCurrentUser(),
    allUsers: presenceManager.getAllUsers(),
    isItemBeingEdited: (itemId: string) => presenceManager.isItemBeingEdited(itemId),
  };
}
