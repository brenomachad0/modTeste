'use client';
import React, { useState } from 'react';
import { Calendar, Edit2, DollarSign, Clock, MoreVertical, Check, X, Save, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LottieIcon from './LottieIcon';
import IconSelectorModal from './IconSelectorModal';
import { IconMappingResult } from '../utils/iconMapping';

interface EntregaData {
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
  item_crm?: {
    tipo?: string;
    categoria?: string;
    valor?: number;
  };
}

interface EntregaCardProps {
  entrega: EntregaData;
  onUpdateEntrega?: (id: string, updates: Partial<EntregaData>) => void;
  onDeleteEntrega?: (id: string) => void;
  showActions?: boolean;
  compact?: boolean;
  enableNavigation?: boolean;
}

const EntregaCard: React.FC<EntregaCardProps> = ({
  entrega,
  onUpdateEntrega,
  onDeleteEntrega,
  showActions = true,
  compact = false,
  enableNavigation = true
}) => {
  const router = useRouter();
  // Estados para edição
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(entrega.titulo);
  const [tempDeadline, setTempDeadline] = useState(entrega.deadline || '');
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'em_andamento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'concluida': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_andamento': return 'Em Andamento';
      case 'concluida': return 'Concluída';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  // Handlers
  const handleSaveTitle = () => {
    if (tempTitle.trim() && onUpdateEntrega) {
      onUpdateEntrega(entrega.id, { titulo: tempTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTempTitle(entrega.titulo);
    setIsEditingTitle(false);
  };

  const handleSaveDeadline = () => {
    if (onUpdateEntrega) {
      onUpdateEntrega(entrega.id, { deadline: tempDeadline });
    }
    setIsEditingDeadline(false);
  };

  const handleCancelDeadline = () => {
    setTempDeadline(entrega.deadline || '');
    setIsEditingDeadline(false);
  };

  const handleIconSelect = (iconResult: IconMappingResult) => {
    if (onUpdateEntrega) {
      onUpdateEntrega(entrega.id, { 
        tipo: iconResult.name.toLowerCase(),
        categoria: iconResult.category 
      });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onUpdateEntrega) {
      onUpdateEntrega(entrega.id, { status: newStatus as any });
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Só navegar se não estiver clicando em elementos de edição
    if (
      enableNavigation && 
      !isEditingTitle && 
      !isEditingDeadline && 
      !showActionsMenu &&
      !(e.target as HTMLElement).closest('.action-element')
    ) {
      router.push(`/entregas/${entrega.id}`);
    }
  };

  // Calcular valores de orçamento
  const valorTotal = entrega.valor_total || entrega.item_crm?.valor || 0;
  const progressoValor = valorTotal * ((entrega.progresso_percentual || 0) / 100);
  const valorRestante = valorTotal - progressoValor;

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatador de data
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Verificar se deadline está próxima
  const isDeadlineNear = () => {
    if (!entrega.deadline) return false;
    const deadline = new Date(entrega.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isOverdue = () => {
    if (!entrega.deadline) return false;
    const deadline = new Date(entrega.deadline);
    const today = new Date();
    return deadline < today;
  };

  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200
        ${compact ? 'p-4' : 'p-6'}
        ${isOverdue() ? 'border-red-300 bg-red-50' : ''}
        ${isDeadlineNear() ? 'border-yellow-300 bg-yellow-50' : ''}
        ${enableNavigation ? 'cursor-pointer hover:border-blue-300' : ''}
      `}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Ícone da entrega */}
          <div 
            className="cursor-pointer hover:scale-110 transition-transform action-element"
            onClick={() => showActions && setIsIconSelectorOpen(true)}
            title={showActions ? "Clique para alterar o ícone" : undefined}
          >
            <LottieIcon 
              tipo={entrega.tipo}
              titulo={entrega.titulo}
              size={compact ? 20 : 24}
              showTooltip={true}
            />
          </div>

          {/* Título editável */}
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 action-element">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent action-element"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelTitle();
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 text-green-600 hover:bg-green-100 rounded action-element"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancelTitle}
                  className="p-1 text-red-600 hover:bg-red-100 rounded action-element"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
                  {entrega.titulo}
                </h3>
                {showActions && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity action-element"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(entrega.status)}`}>
            {getStatusText(entrega.status)}
          </span>
          
          {enableNavigation && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          
          {showActions && (
            <div className="relative action-element">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded action-element"
              >
                <MoreVertical size={16} />
              </button>
              
              {showActionsMenu && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px] action-element">
                  <button
                    onClick={() => handleStatusChange('pendente')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 action-element"
                  >
                    Pendente
                  </button>
                  <button
                    onClick={() => handleStatusChange('em_andamento')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 action-element"
                  >
                    Em Andamento
                  </button>
                  <button
                    onClick={() => handleStatusChange('concluida')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 action-element"
                  >
                    Concluída
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelada')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 action-element"
                  >
                    Cancelada
                  </button>
                  {onDeleteEntrega && (
                    <>
                      <hr className="my-1" />
                      <button
                        onClick={() => onDeleteEntrega(entrega.id)}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="space-y-4">
        {/* Descrição */}
        {entrega.descricao && (
          <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
            {entrega.descricao}
          </p>
        )}

        {/* Deadline */}
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          {isEditingDeadline ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={tempDeadline}
                onChange={(e) => setTempDeadline(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSaveDeadline}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleCancelDeadline}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-sm ${
                isOverdue() ? 'text-red-600 font-medium' :
                isDeadlineNear() ? 'text-yellow-600 font-medium' :
                'text-gray-600'
              }`}>
                {entrega.deadline ? formatDate(entrega.deadline) : 'Sem prazo definido'}
              </span>
              {showActions && (
                <button
                  onClick={() => setIsEditingDeadline(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Orçamento */}
        {valorTotal > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">Orçamento</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(valorTotal)}
              </span>
            </div>
            
            {/* Progress bar */}
            {entrega.progresso_percentual !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Executado: {formatCurrency(progressoValor)}</span>
                  <span>Restante: {formatCurrency(valorRestante)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${entrega.progresso_percentual}%` }}
                  />
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">
                    {entrega.progresso_percentual}% concluído
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Observações */}
        {entrega.observacoes && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <strong>Obs:</strong> {entrega.observacoes}
          </div>
        )}
      </div>

      {/* Modal de seleção de ícone */}
      <IconSelectorModal
        isOpen={isIconSelectorOpen}
        currentIcon={entrega.tipo}
        currentTitle={entrega.titulo}
        onIconSelect={handleIconSelect}
        onClose={() => setIsIconSelectorOpen(false)}
      />
    </div>
  );
};

export default EntregaCard;