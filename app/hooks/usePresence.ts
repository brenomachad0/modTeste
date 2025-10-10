/**
 * usePresence - Hook de Presença Colaborativa
 * 
 * Gerencia a presença do usuário atual e sincroniza com o WebSocket
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { presenceManager, UserPresence } from '@/lib/websocket/PresenceManager';

interface UsePresenceOptions {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  page: UserPresence['page'];
  page_id?: string;
  enabled?: boolean; // Permite desabilitar temporariamente
}

export function usePresence(options: UsePresenceOptions) {
  const { emit, on, isConnected } = useSocket();
  const { user_id, user_name, user_avatar, page, page_id, enabled = true } = options;
  const mouseMoveRef = useRef<NodeJS.Timeout>();
  const lastEmitRef = useRef<number>(0);
  
  const EMIT_THROTTLE_MS = 50; // Envia posição do cursor a cada 50ms

  /**
   * Envia presença inicial ao servidor
   */
  const joinPresence = useCallback(() => {
    if (!isConnected || !enabled) return;

    presenceManager.setCurrentUser({
      user_id,
      user_name,
      user_avatar,
      page,
      page_id,
    });

    emit('presence:join', {
      user_id,
      user_name,
      user_avatar,
      page,
      page_id,
      cursor: {
        x: 0,
        y: 0,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      },
    });
  }, [isConnected, enabled, user_id, user_name, user_avatar, page, page_id, emit]);

  /**
   * Remove presença ao sair
   */
  const leavePresence = useCallback(() => {
    if (!isConnected || !enabled) return;

    emit('presence:leave', {
      user_id,
      page,
      page_id,
    });
  }, [isConnected, enabled, user_id, page, page_id, emit]);

  /**
   * Atualiza posição do cursor (com throttle)
   */
  const updateCursor = useCallback((x: number, y: number) => {
    if (!isConnected || !enabled) return;

    const now = Date.now();
    if (now - lastEmitRef.current < EMIT_THROTTLE_MS) {
      return; // Throttle
    }

    lastEmitRef.current = now;
    presenceManager.updateCursor(user_id, x, y);

    emit('presence:cursor_move', {
      user_id,
      page,
      page_id,
      x,
      y,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    });
  }, [isConnected, enabled, user_id, page, page_id, emit]);

  /**
   * Marca que começou a editar algo
   */
  const startEditing = useCallback((itemId: string) => {
    if (!isConnected || !enabled) return;

    presenceManager.startEditing(user_id, itemId);

    emit('presence:editing', {
      user_id,
      page,
      page_id,
      item_id: itemId,
      is_editing: true,
    });
  }, [isConnected, enabled, user_id, page, page_id, emit]);

  /**
   * Marca que parou de editar
   */
  const stopEditing = useCallback(() => {
    if (!isConnected || !enabled) return;

    const currentUser = presenceManager.getCurrentUser();
    if (currentUser?.is_editing) {
      presenceManager.stopEditing(user_id);

      emit('presence:editing', {
        user_id,
        page,
        page_id,
        item_id: currentUser.is_editing,
        is_editing: false,
      });
    }
  }, [isConnected, enabled, user_id, page, page_id, emit]);

  /**
   * Atualiza a página atual
   */
  const updatePage = useCallback((newPage: UserPresence['page'], newPageId?: string) => {
    if (!isConnected || !enabled) return;

    presenceManager.updatePage(user_id, newPage, newPageId);

    emit('presence:page_change', {
      user_id,
      page: newPage,
      page_id: newPageId,
    });
  }, [isConnected, enabled, user_id, emit]);

  /**
   * Handler de movimento do mouse
   */
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateCursor(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [updateCursor, enabled]);

  /**
   * Setup inicial: entra na presença
   */
  useEffect(() => {
    if (!enabled) return;

    joinPresence();

    // Cleanup: sai da presença
    return () => {
      leavePresence();
    };
  }, [joinPresence, leavePresence, enabled]);

  /**
   * Listeners de eventos do servidor
   */
  useEffect(() => {
    if (!isConnected || !enabled) return;

    // Usuário entrou
    const unsubJoined = on('presence:user_joined', (data: UserPresence) => {
      presenceManager.setUser(data);
    });

    // Usuário saiu
    const unsubLeft = on('presence:user_left', (data: { user_id: string }) => {
      presenceManager.removeUser(data.user_id);
    });

    // Cursor moveu
    const unsubCursor = on('presence:cursor_moved', (data: UserPresence) => {
      presenceManager.updateCursor(data.user_id, data.cursor.x, data.cursor.y);
    });

    // Alguém começou/parou de editar
    const unsubEditing = on('presence:editing_changed', (data: { user_id: string; item_id?: string; is_editing: boolean }) => {
      if (data.is_editing && data.item_id) {
        presenceManager.startEditing(data.user_id, data.item_id);
      } else {
        presenceManager.stopEditing(data.user_id);
      }
    });

    // Lista inicial de usuários na sala
    const unsubUsersList = on('presence:users_list', (data: { users: UserPresence[] }) => {
      data.users.forEach(user => {
        if (user.user_id !== user_id) { // Não adiciona você mesmo novamente
          presenceManager.setUser(user);
        }
      });
    });

    return () => {
      unsubJoined();
      unsubLeft();
      unsubCursor();
      unsubEditing();
      unsubUsersList();
    };
  }, [isConnected, enabled, on, user_id]);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      if (mouseMoveRef.current) {
        clearTimeout(mouseMoveRef.current);
      }
    };
  }, []);

  return {
    startEditing,
    stopEditing,
    updatePage,
    isConnected,
  };
}
