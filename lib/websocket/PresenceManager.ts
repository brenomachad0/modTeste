/**
 * PresenceManager - Sistema de Presença Colaborativa
 * 
 * Gerencia a presença de usuários em tempo real, incluindo:
 * - Posição do cursor
 * - Página atual
 * - Estado de edição
 * - Cores únicas por usuário
 * 
 * Inspirado no Figma/Google Docs
 */

export interface UserPresence {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  color: string;
  
  // Localização
  page: 'dashboard' | 'projeto' | 'entrega' | 'servico';
  page_id?: string;
  
  // Posição do cursor (relativa à viewport)
  cursor: {
    x: number;
    y: number;
    viewport_width: number;
    viewport_height: number;
  };
  
  // Estado
  is_editing?: string; // ID do item sendo editado
  is_idle: boolean;
  last_seen: string;
}

export type PresenceEvent = 'user_joined' | 'user_left' | 'cursor_moved' | 'editing_started' | 'editing_stopped' | 'user_idle';

export class PresenceManager {
  private static instance: PresenceManager;
  private users: Map<string, UserPresence> = new Map();
  private listeners: Map<PresenceEvent, Set<(data: any) => void>> = new Map();
  private cursorThrottle: Map<string, number> = new Map();
  private idleTimer?: NodeJS.Timeout;
  private currentUser?: UserPresence;
  
  private readonly THROTTLE_MS = 50; // 50ms entre updates de cursor
  private readonly IDLE_TIMEOUT_MS = 30000; // 30s sem movimento = idle

  private constructor() {
    // Initialize event listeners
    this.listeners.set('user_joined', new Set());
    this.listeners.set('user_left', new Set());
    this.listeners.set('cursor_moved', new Set());
    this.listeners.set('editing_started', new Set());
    this.listeners.set('editing_stopped', new Set());
    this.listeners.set('user_idle', new Set());
  }

  public static getInstance(): PresenceManager {
    if (!PresenceManager.instance) {
      PresenceManager.instance = new PresenceManager();
    }
    return PresenceManager.instance;
  }

  /**
   * Gera uma cor única baseada no user_id
   */
  private generateColor(userId: string): string {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#14B8A6', // teal
      '#F97316', // orange
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];
    
    // Hash simples do user_id
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Adiciona ou atualiza um usuário
   */
  public setUser(user: Partial<UserPresence> & { user_id: string; user_name: string }): void {
    const existing = this.users.get(user.user_id);
    
    const presence: UserPresence = {
      user_id: user.user_id,
      user_name: user.user_name,
      user_avatar: user.user_avatar,
      color: existing?.color || this.generateColor(user.user_id),
      page: user.page || existing?.page || 'dashboard',
      page_id: user.page_id || existing?.page_id,
      cursor: user.cursor || existing?.cursor || { x: 0, y: 0, viewport_width: 1920, viewport_height: 1080 },
      is_editing: user.is_editing || existing?.is_editing,
      is_idle: user.is_idle !== undefined ? user.is_idle : false,
      last_seen: new Date().toISOString(),
    };

    const isNew = !this.users.has(user.user_id);
    this.users.set(user.user_id, presence);

    if (isNew) {
      this.emit('user_joined', presence);
    }
  }

  /**
   * Define o usuário atual (você)
   */
  public setCurrentUser(user: Partial<UserPresence> & { user_id: string; user_name: string }): void {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    
    this.currentUser = {
      user_id: user.user_id,
      user_name: user.user_name,
      user_avatar: user.user_avatar,
      color: this.generateColor(user.user_id),
      page: user.page || 'dashboard',
      page_id: user.page_id,
      cursor: { x: 0, y: 0, viewport_width: viewportWidth, viewport_height: viewportHeight },
      is_editing: undefined,
      is_idle: false,
      last_seen: new Date().toISOString(),
    };
    
    this.setUser(this.currentUser);
    this.startIdleTimer();
  }

  /**
   * Remove um usuário
   */
  public removeUser(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      this.users.delete(userId);
      this.emit('user_left', user);
    }
  }

  /**
   * Atualiza a posição do cursor (com throttle)
   */
  public updateCursor(userId: string, x: number, y: number): void {
    const now = Date.now();
    const lastUpdate = this.cursorThrottle.get(userId) || 0;
    
    // Throttle: só atualiza a cada THROTTLE_MS
    if (now - lastUpdate < this.THROTTLE_MS) {
      return;
    }
    
    this.cursorThrottle.set(userId, now);
    
    const user = this.users.get(userId);
    if (user) {
      user.cursor.x = x;
      user.cursor.y = y;
      user.cursor.viewport_width = typeof window !== 'undefined' ? window.innerWidth : 1920;
      user.cursor.viewport_height = typeof window !== 'undefined' ? window.innerHeight : 1080;
      user.last_seen = new Date().toISOString();
      user.is_idle = false;
      
      this.emit('cursor_moved', user);
    }
    
    // Reset idle timer para o usuário atual
    if (userId === this.currentUser?.user_id) {
      this.startIdleTimer();
    }
  }

  /**
   * Atualiza a página atual do usuário
   */
  public updatePage(userId: string, page: UserPresence['page'], pageId?: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.page = page;
      user.page_id = pageId;
      user.last_seen = new Date().toISOString();
    }
  }

  /**
   * Marca que um usuário começou a editar algo
   */
  public startEditing(userId: string, itemId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.is_editing = itemId;
      user.last_seen = new Date().toISOString();
      this.emit('editing_started', { user, itemId });
    }
  }

  /**
   * Marca que um usuário parou de editar
   */
  public stopEditing(userId: string): void {
    const user = this.users.get(userId);
    if (user && user.is_editing) {
      const itemId = user.is_editing;
      user.is_editing = undefined;
      user.last_seen = new Date().toISOString();
      this.emit('editing_stopped', { user, itemId });
    }
  }

  /**
   * Marca usuário como idle (inativo)
   */
  public setIdle(userId: string, idle: boolean): void {
    const user = this.users.get(userId);
    if (user) {
      user.is_idle = idle;
      if (idle) {
        this.emit('user_idle', user);
      }
    }
  }

  /**
   * Timer de inatividade (30s sem mover cursor)
   */
  private startIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    
    this.idleTimer = setTimeout(() => {
      if (this.currentUser) {
        this.setIdle(this.currentUser.user_id, true);
      }
    }, this.IDLE_TIMEOUT_MS);
  }

  /**
   * Retorna todos os usuários (exceto o atual)
   */
  public getOtherUsers(): UserPresence[] {
    const currentUserId = this.currentUser?.user_id;
    return Array.from(this.users.values()).filter(u => u.user_id !== currentUserId);
  }

  /**
   * Retorna todos os usuários (incluindo o atual)
   */
  public getAllUsers(): UserPresence[] {
    return Array.from(this.users.values());
  }

  /**
   * Retorna um usuário específico
   */
  public getUser(userId: string): UserPresence | undefined {
    return this.users.get(userId);
  }

  /**
   * Retorna o usuário atual
   */
  public getCurrentUser(): UserPresence | undefined {
    return this.currentUser;
  }

  /**
   * Verifica se alguém está editando um item
   */
  public isItemBeingEdited(itemId: string): UserPresence | undefined {
    return Array.from(this.users.values()).find(u => u.is_editing === itemId);
  }

  /**
   * Adiciona um listener para eventos de presença
   */
  public on(event: PresenceEvent, callback: (data: any) => void): () => void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
    
    // Retorna função de cleanup
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Emite um evento
   */
  private emit(event: PresenceEvent, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Limpa todos os dados (usado ao desconectar)
   */
  public clear(): void {
    this.users.clear();
    this.cursorThrottle.clear();
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
  }
}

export const presenceManager = PresenceManager.getInstance();
