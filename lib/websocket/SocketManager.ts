import { io, Socket } from 'socket.io-client';

type EventCallback = (data: any) => void;

export class SocketManager {
  private socket: Socket | null = null;
  private url: string;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  constructor(url?: string) {
    this.url = url || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
  }

  /**
   * Conecta ao servidor WebSocket
   */
  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        const checkInterval = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkInterval);
            resolve(this.socket);
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket conectado:', this.socket?.id);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.resubscribeAllListeners();
        if (this.socket) resolve(this.socket);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket desconectado:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erro de conexão WebSocket:', error.message);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.isConnecting = false;
          reject(new Error('Máximo de tentativas de reconexão atingido'));
        }
      });

      this.socket.on('error', (error) => {
        console.error('❌ Erro no WebSocket:', error);
      });

      // Heartbeat para manter conexão ativa
      this.socket.on('ping', () => {
        this.socket?.emit('pong');
      });
    });
  }

  /**
   * Desconecta do servidor WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Inscreve-se em um evento
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Registra o listener no socket se já estiver conectado
    if (this.socket?.connected) {
      this.socket.on(event, callback);
    }

    // Retorna função para remover o listener
    return () => this.off(event, callback);
  }

  /**
   * Remove listener de um evento
   */
  off(event: string, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emite um evento para o servidor
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket não conectado. Tentando conectar...');
      this.connect().then(() => {
        this.socket?.emit(event, data);
      });
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Entra em uma sala (room)
   */
  joinRoom(room: string): void {
    this.emit('join_room', { room });
    console.log(`🚪 Entrando na sala: ${room}`);
  }

  /**
   * Sai de uma sala (room)
   */
  leaveRoom(room: string): void {
    this.emit('leave_room', { room });
    console.log(`🚪 Saindo da sala: ${room}`);
  }

  /**
   * Re-inscreve todos os listeners após reconexão
   */
  private resubscribeAllListeners(): void {
    if (!this.socket) return;

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket!.on(event, callback);
      });
    });
  }

  /**
   * Retorna o status da conexão
   */
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Retorna o ID do socket
   */
  get socketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Retorna a instância do socket (use com cuidado)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
let socketManagerInstance: SocketManager | null = null;

export const getSocketManager = (): SocketManager => {
  if (!socketManagerInstance) {
    socketManagerInstance = new SocketManager();
  }
  return socketManagerInstance;
};
