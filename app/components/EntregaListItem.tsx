'use client';
import React, { useState } from 'react';
import { 
  ChevronRight, ChevronDown, Edit, Trash2, Calendar, 
  DollarSign, Clock, AlertTriangle, CheckCircle,
  TrendingUp, Target, User, Building
} from 'lucide-react';
import IconSelector from './IconSelector';
import { getIconByType } from '../utils/iconMapping';

interface EntregaListItemProps {
  entrega: {
    id: string;
    titulo: string;
    tipo: string;
    categoria?: string;
    status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
    deadline?: string;
    valor_total?: number;
    valor_unitario?: number;
    progresso_percentual?: number;
    descricao?: string;
    observacoes?: string;
    responsavel_nome?: string;
    responsavel_tipo?: string;
    item_crm?: {
      tipo?: string;
      categoria?: string;
      valor?: number;
    };
  };
  onUpdateEntrega: (id: string, updates: any) => void;
  onDeleteEntrega: (id: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const EntregaListItem: React.FC<EntregaListItemProps> = ({
  entrega,
  onUpdateEntrega,
  onDeleteEntrega,
  showActions = true,
  compact = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(entrega.titulo);
  const [editedDeadline, setEditedDeadline] = useState(entrega.deadline || '');
  const [editedStatus, setEditedStatus] = useState(entrega.status);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Função para salvar alterações
  const handleSave = () => {
    onUpdateEntrega(entrega.id, {
      titulo: editedTitle,
      deadline: editedDeadline,
      status: editedStatus
    });
    setIsEditing(false);
  };

  // Função para cancelar alterações
  const handleCancel = () => {
    setEditedTitle(entrega.titulo);
    setEditedDeadline(entrega.deadline || '');
    setEditedStatus(entrega.status);
    setIsEditing(false);
  };

  // Função para atualizar ícone
  const handleIconUpdate = (iconResult: any) => {
    onUpdateEntrega(entrega.id, {
      tipo: iconResult.type,
      categoria: iconResult.category
    });
    setShowIconSelector(false);
  };

  // Função para verificar se deadline está próximo ou vencido
  const getDeadlineStatus = () => {
    if (!entrega.deadline) return null;
    
    const today = new Date();
    const deadline = new Date(entrega.deadline);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { type: 'overdue', message: `${Math.abs(diffDays)} dias em atraso`, color: 'text-red-500' };
    } else if (diffDays <= 3) {
      return { type: 'near', message: `${diffDays} dias restantes`, color: 'text-yellow-500' };
    } else {
      return { type: 'ok', message: `${diffDays} dias restantes`, color: 'text-green-500' };
    }
  };

  // Configuração do status
  const statusConfig = {
    pendente: { color: 'bg-yellow-500', label: 'Pendente', textColor: 'text-yellow-700' },
    em_andamento: { color: 'bg-blue-500', label: 'Em Andamento', textColor: 'text-blue-700' },
    concluida: { color: 'bg-green-500', label: 'Concluída', textColor: 'text-green-700' },
    cancelada: { color: 'bg-red-500', label: 'Cancelada', textColor: 'text-red-700' }
  };

  const statusInfo = statusConfig[entrega.status];
  const deadlineStatus = getDeadlineStatus();
  const iconResult = getIconByType(entrega.tipo, entrega.titulo);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 mb-3 hover:border-gray-600 transition-colors">
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Lado Esquerdo: Ícone + Info */}
          <div className="flex items-center gap-3 flex-1">
            {/* Ícone da entrega */}
            <div 
              className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => showActions && setShowIconSelector(true)}
              title="Clique para alterar ícone"
            >
              {React.createElement(iconResult.icon, {
                ...({ size: 20 } as any),
                className: `${
                  entrega.categoria === 'animation' ? 'text-purple-500' :
                  entrega.categoria === 'video' ? 'text-blue-500' :
                  entrega.categoria === 'audio' ? 'text-green-500' :
                  entrega.categoria === 'image' ? 'text-yellow-500' :
                  entrega.categoria === 'design' ? 'text-pink-500' :
                  entrega.categoria === 'tech' ? 'text-indigo-500' :
                  'text-gray-400'
                }`
              })}
            </div>

            {/* Informações da entrega */}
            <div className="flex-1">
              {/* Título editável */}
              {isEditing ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <h4 
                  className="text-sm font-semibold text-gray-200 mb-1 cursor-pointer hover:text-white transition-colors"
                  onClick={() => showActions && setIsEditing(true)}
                  title="Clique para editar"
                >
                  {entrega.titulo}
                </h4>
              )}

              {/* Informações secundárias */}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {/* Responsável */}
                {entrega.responsavel_nome && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{entrega.responsavel_nome}</span>
                  </div>
                )}
                
                {/* Setor */}
                {entrega.responsavel_tipo && (
                  <div className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    <span>{entrega.responsavel_tipo}</span>
                  </div>
                )}
                
                {/* Deadline */}
                {entrega.deadline && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className={deadlineStatus?.color || 'text-gray-400'}>
                      {new Date(entrega.deadline).toLocaleDateString('pt-BR')}
                    </span>
                    {deadlineStatus && (
                      <span className={`${deadlineStatus.color} font-medium`}>
                        ({deadlineStatus.message})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito: Status, Valor e Ações */}
          <div className="flex items-center gap-4">
            {/* Valor */}
            {entrega.valor_total && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Valor</div>
                <div className="text-sm font-bold text-green-400">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(entrega.valor_total)}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {entrega.progresso_percentual !== undefined && (
              <div className="w-20">
                <div className="text-xs text-gray-400 text-center mb-1">
                  {entrega.progresso_percentual.toFixed(0)}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${entrega.progresso_percentual}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status */}
            {isEditing ? (
              <select
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value as any)}
                className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            )}

            {/* Ações */}
            {showActions && !isEditing && (
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                {showActionsMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowActionsMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg"
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </button>
                    
                    <button
                      onClick={() => {
                        setEditedDeadline(new Date().toISOString().split('T')[0]);
                        setShowActionsMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      <Calendar className="w-3 h-3" />
                      Definir Prazo
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowIconSelector(true);
                        setShowActionsMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      <Target className="w-3 h-3" />
                      Alterar Ícone
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta entrega?')) {
                          onDeleteEntrega(entrega.id);
                        }
                        setShowActionsMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-b-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deadline editor (quando editando) */}
        {isEditing && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <label className="text-xs text-gray-400">Deadline:</label>
              <input
                type="date"
                value={editedDeadline}
                onChange={(e) => setEditedDeadline(e.target.value)}
                className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Alertas visuais */}
        {deadlineStatus?.type === 'overdue' && entrega.status !== 'concluida' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-700/50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-red-400 text-xs font-medium">
              Entrega em atraso! {deadlineStatus.message}
            </span>
          </div>
        )}

        {deadlineStatus?.type === 'near' && entrega.status !== 'concluida' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-400 text-xs font-medium">
              Deadline próximo! {deadlineStatus.message}
            </span>
          </div>
        )}
      </div>

      {/* Modal de seleção de ícones */}
      <IconSelector
        isOpen={showIconSelector}
        currentIcon={entrega.tipo}
        currentTitle={entrega.titulo}
        onIconSelect={handleIconUpdate}
        onClose={() => setShowIconSelector(false)}
      />
    </div>
  );
};

export default EntregaListItem;