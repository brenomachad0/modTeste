'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SocketManager, getSocketManager } from './SocketManager';

interface SocketContextValue {
  socketManager: SocketManager;
  isConnected: boolean;
  socketId: string | undefined;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socketManager] = useState(() => getSocketManager());
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();

  useEffect(() => {
    // Conecta ao servidor WebSocket
    socketManager.connect().catch((error) => {
      console.error('❌ Falha ao conectar WebSocket:', error);
    });

    // Listener para mudanças no status de conexão
    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socketManager.socketId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(undefined);
    };

    socketManager.on('connect', handleConnect);
    socketManager.on('disconnect', handleDisconnect);

    // Cleanup na desmontagem
    return () => {
      socketManager.off('connect', handleConnect);
      socketManager.off('disconnect', handleDisconnect);
    };
  }, [socketManager]);

  return (
    <SocketContext.Provider value={{ socketManager, isConnected, socketId }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = (): SocketContextValue | null => {
  const context = useContext(SocketContext);
  return context;
};
