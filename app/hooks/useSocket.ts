'use client';

import { useEffect, useRef } from 'react';
import { useSocketContext } from '../../lib/websocket/SocketContext';

/**
 * Hook para trabalhar com WebSocket de forma simplificada
 */
export const useSocket = () => {
  const { socketManager, isConnected, socketId } = useSocketContext();
  const unsubscribeCallbacks = useRef<(() => void)[]>([]);

  /**
   * Inscreve-se em um evento do WebSocket
   */
  const on = <T = any>(event: string, callback: (data: T) => void) => {
    const unsubscribe = socketManager.on(event, callback);
    unsubscribeCallbacks.current.push(unsubscribe);
    return unsubscribe;
  };

  /**
   * Emite um evento para o servidor
   */
  const emit = (event: string, data?: any) => {
    socketManager.emit(event, data);
  };

  /**
   * Entra em uma sala (room)
   */
  const joinRoom = (room: string) => {
    socketManager.joinRoom(room);
  };

  /**
   * Sai de uma sala (room)
   */
  const leaveRoom = (room: string) => {
    socketManager.leaveRoom(room);
  };

  /**
   * Remove todas as inscrições ao desmontar
   */
  useEffect(() => {
    return () => {
      unsubscribeCallbacks.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeCallbacks.current = [];
    };
  }, []);

  return {
    on,
    emit,
    joinRoom,
    leaveRoom,
    isConnected,
    socketId,
  };
};
