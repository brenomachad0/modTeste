/**
 * ActiveUsersPanel - Painel de Usuários Ativos
 * 
 * Mostra lista de usuários online com localização e status
 * Pode ser usado como sidebar ou popover
 */

'use client';

import { useCollaborativeCursors } from '@/app/hooks/useCollaborativeCursors';
import { UserPresence } from '@/lib/websocket/PresenceManager';

interface ActiveUsersPanelProps {
  /**
   * Título do painel
   */
  title?: string;
  
  /**
   * Se true, mostra o usuário atual também
   */
  showCurrentUser?: boolean;
  
  /**
   * Máximo de usuários a exibir (restante será "e mais X")
   */
  maxVisible?: number;
  
  /**
   * Classe CSS adicional
   */
  className?: string;
}

function UserAvatar({ user }: { user: UserPresence }) {
  const initials = user.user_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: user.color }}
      title={user.user_name}
    >
      {user.user_avatar ? (
        <img src={user.user_avatar} alt={user.user_name} className="w-full h-full rounded-full" />
      ) : (
        initials
      )}
    </div>
  );
}

function getPageLabel(page: UserPresence['page'], pageId?: string): string {
  switch (page) {
    case 'dashboard':
      return '📊 Dashboard';
    case 'projeto':
      return `📁 Projeto${pageId ? ` #${pageId.slice(-6)}` : ''}`;
    case 'entrega':
      return `📦 Entrega${pageId ? ` #${pageId.slice(-6)}` : ''}`;
    case 'servico':
      return `⚙️ Serviço${pageId ? ` #${pageId.slice(-6)}` : ''}`;
    default:
      return '📄 Navegando';
  }
}

function UserItem({ user, isCurrent }: { user: UserPresence; isCurrent: boolean }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="relative">
        <UserAvatar user={user} />
        
        {/* Indicador de status */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
            user.is_idle ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          title={user.is_idle ? 'Ausente' : 'Ativo'}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {user.user_name}
          </span>
          {isCurrent && (
            <span className="text-xs text-gray-500 dark:text-gray-400">(você)</span>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {getPageLabel(user.page, user.page_id)}
        </div>

        {user.is_editing && (
          <div className="text-xs text-blue-600 dark:text-blue-400 truncate mt-0.5">
            ✏️ Editando...
          </div>
        )}
      </div>
    </div>
  );
}

export function ActiveUsersPanel({
  title = '👥 Usuários Ativos',
  showCurrentUser = true,
  maxVisible,
  className = '',
}: ActiveUsersPanelProps) {
  const { otherUsers, currentUser, allUsers } = useCollaborativeCursors();

  const displayUsers = showCurrentUser ? allUsers : otherUsers;
  const visibleUsers = maxVisible ? displayUsers.slice(0, maxVisible) : displayUsers;
  const hiddenCount = displayUsers.length - visibleUsers.length;

  if (displayUsers.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Nenhum usuário online no momento
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title} ({displayUsers.length})
        </h3>
      </div>

      <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
        {visibleUsers.map((user) => (
          <UserItem
            key={user.user_id}
            user={user}
            isCurrent={user.user_id === currentUser?.user_id}
          />
        ))}

        {hiddenCount > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
            e mais {hiddenCount} usuário{hiddenCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Versão compacta - apenas avatares empilhados
 */
export function ActiveUsersAvatars({ maxVisible = 5 }: { maxVisible?: number }) {
  const { allUsers } = useCollaborativeCursors();

  const visibleUsers = allUsers.slice(0, maxVisible);
  const hiddenCount = allUsers.length - visibleUsers.length;

  if (allUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <div key={user.user_id} className="relative">
            <UserAvatar user={user} />
          </div>
        ))}
      </div>

      {hiddenCount > 0 && (
        <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
          +{hiddenCount}
        </div>
      )}
    </div>
  );
}
