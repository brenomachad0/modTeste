'use client';

// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Edit3, Save, X, Plus, Trash2, GripVertical, 
  Eye, EyeOff, Clock, DollarSign, AlertCircle, 
  CheckCircle, PlayCircle, PauseCircle, 
  GitBranch, Users
} from 'lucide-react';

// Tipos para a estrutura de dados
interface TarefaTemplate {
  id: string;
  nome: string;
  descricao: string;
  prazo_horas_estimado: number;
  valor_mandrill_coins: number;
  responsavel_tipo: string;
  pode_executar_paralelo: boolean;
}

interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  valor_estimado: number;
  ordem: number;
  status: 'planejado' | 'em_execucao' | 'pausado' | 'concluido' | 'cancelado';
  pode_executar_paralelo: boolean;
  prazo_dias?: number;
  tarefas_templates?: TarefaTemplate[];
  created_at?: string;
  updated_at?: string;
}

interface EntregaInfo {
  id: string;
  nome: string;
  briefing?: string;
  tipo: string;
  categoria?: string;
  valor_total?: number;
  prazo_dias?: number;
  observacoes?: string;
}

interface EntregaEditorProps {
  entrega: EntregaInfo;
  servicos: Servico[];
  onSaveEntrega: (entrega: EntregaInfo) => Promise<boolean>;
  onSaveServicos: (servicos: Servico[]) => Promise<boolean>;
  onAddServico: (servico: Omit<Servico, 'id'>) => Promise<boolean>;
  onDeleteServico: (servicoId: string) => Promise<boolean>;
  modoEdicao?: boolean;
  onToggleModoEdicao?: () => void;
}

// Componente para item de serviço arrastável
function SortableServicoItem({ servico, onEdit, onDelete, onToggleParalelo, isEditing, canDelete }: {
  servico: Servico;
  onEdit: (servico: Servico) => void;
  onDelete: (id: string) => void;
  onToggleParalelo: (id: string) => void;
  isEditing: boolean;
  canDelete: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: servico.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejado': return 'bg-gray-100 text-gray-800';
      case 'em_execucao': return 'bg-blue-100 text-blue-800';
      case 'pausado': return 'bg-yellow-100 text-yellow-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planejado': return <Clock className="w-4 h-4" />;
      case 'em_execucao': return <PlayCircle className="w-4 h-4" />;
      case 'pausado': return <PauseCircle className="w-4 h-4" />;
      case 'concluido': return <CheckCircle className="w-4 h-4" />;
      case 'cancelado': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${
        isDragging ? 'shadow-lg border-blue-300' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        {isEditing && (
          <button
            {...attributes}
            {...listeners}
            className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* Número da ordem */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {servico.ordem}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                {servico.nome}
              </h4>
              
              {servico.descricao && (
                <p className="text-sm text-gray-600 mb-2">
                  {servico.descricao}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {/* Status */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-medium ${getStatusColor(servico.status)}`}>
                  {getStatusIcon(servico.status)}
                  {servico.status.replace('_', ' ')}
                </span>

                {/* Valor */}
                {servico.valor_estimado > 0 && (
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(servico.valor_estimado)}
                  </span>
                )}

                {/* Prazo */}
                {servico.prazo_dias && (
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    {servico.prazo_dias} dias
                  </span>
                )}

                {/* Execução paralela */}
                <div className="flex items-center gap-1">
                  {servico.pode_executar_paralelo ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <GitBranch className="w-4 h-4" />
                      Paralelo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Users className="w-4 h-4" />
                      Sequencial
                    </span>
                  )}
                  
                  {isEditing && (
                    <button
                      onClick={() => onToggleParalelo(servico.id)}
                      className="ml-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      {servico.pode_executar_paralelo ? 'Tornar sequencial' : 'Permitir paralelo'}
                    </button>
                  )}
                </div>
              </div>

              {/* Templates de tarefas */}
              {servico.tarefas_templates && servico.tarefas_templates.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    Tarefas Planejadas ({servico.tarefas_templates.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {servico.tarefas_templates.map((tarefa, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tarefa.nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ações */}
            {isEditing && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onEdit(servico)}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                  title="Editar serviço"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                
                {canDelete && (
                  <button
                    onClick={() => onDelete(servico.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Excluir serviço"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal do editor
export default function EntregaEditor({
  entrega,
  servicos: servicosIniciais,
  onSaveEntrega,
  onSaveServicos,
  onAddServico,
  onDeleteServico,
  modoEdicao = false,
  onToggleModoEdicao
}: EntregaEditorProps) {
  const [servicos, setServicos] = useState<Servico[]>(servicosIniciais);
  const [entregaEditavel, setEntregaEditavel] = useState<EntregaInfo>(entrega);
  const [editandoEntrega, setEditandoEntrega] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<Servico | null>(null);
  const [novoServico, setNovoServico] = useState<Partial<Servico>>({});
  const [mostrandoFormNovoServico, setMostrandoFormNovoServico] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Atualizar servicos quando props mudarem
  useEffect(() => {
    setServicos(servicosIniciais);
  }, [servicosIniciais]);

  // Handler para reordenação via drag and drop
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setServicos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Atualizar ordem dos itens
        const updatedItems = reorderedItems.map((item, index) => ({
          ...item,
          ordem: index + 1
        }));

        // Salvar automaticamente a nova ordem
        onSaveServicos(updatedItems);
        
        return updatedItems;
      });
    }
  }

  // Salvar alterações na entrega
  const salvarEntrega = async () => {
    setSalvando(true);
    try {
      const sucesso = await onSaveEntrega(entregaEditavel);
      if (sucesso) {
        setEditandoEntrega(false);
      }
    } finally {
      setSalvando(false);
    }
  };

  // Cancelar edição da entrega
  const cancelarEdicaoEntrega = () => {
    setEntregaEditavel(entrega);
    setEditandoEntrega(false);
  };

  // Toggle execução paralela de um serviço
  const toggleParaleloServico = async (servicoId: string) => {
    const servicosAtualizados = servicos.map(s => 
      s.id === servicoId ? { ...s, pode_executar_paralelo: !s.pode_executar_paralelo } : s
    );
    setServicos(servicosAtualizados);
    await onSaveServicos(servicosAtualizados);
  };

  // Editar serviço
  const editarServico = (servico: Servico) => {
    setServicoEditando({ ...servico });
  };

  // Salvar edição de serviço
  const salvarEdicaoServico = async () => {
    if (!servicoEditando) return;
    
    const servicosAtualizados = servicos.map(s => 
      s.id === servicoEditando.id ? servicoEditando : s
    );
    setServicos(servicosAtualizados);
    await onSaveServicos(servicosAtualizados);
    setServicoEditando(null);
  };

  // Adicionar novo serviço
  const adicionarServico = async () => {
    if (!novoServico.nome) return;

    const servicoCompleto: Omit<Servico, 'id'> = {
      nome: novoServico.nome || '',
      descricao: novoServico.descricao || '',
      valor_estimado: novoServico.valor_estimado || 0,
      ordem: servicos.length + 1,
      status: 'planejado',
      pode_executar_paralelo: novoServico.pode_executar_paralelo || false,
      prazo_dias: novoServico.prazo_dias,
      tarefas_templates: []
    };

    const sucesso = await onAddServico(servicoCompleto);
    if (sucesso) {
      setNovoServico({});
      setMostrandoFormNovoServico(false);
    }
  };

  // Excluir serviço
  const excluirServico = async (servicoId: string) => {
    const servico = servicos.find(s => s.id === servicoId);
    if (!servico) return;

    const podeExcluir = servico.status === 'planejado' || servico.status === 'cancelado';
    if (!podeExcluir) {
      alert('Não é possível excluir serviços em execução ou concluídos');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o serviço "${servico.nome}"?`)) {
      const sucesso = await onDeleteServico(servicoId);
      if (sucesso) {
        setServicos(servicos.filter(s => s.id !== servicoId));
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Cabeçalho da Entrega */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Informações da Entrega
            </h2>
            {onToggleModoEdicao && (
              <button
                onClick={onToggleModoEdicao}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  modoEdicao
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {modoEdicao ? (
                  <>
                    <Eye className="w-4 h-4 inline mr-2" />
                    Modo Visualização
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 inline mr-2" />
                    Modo Edição
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {editandoEntrega ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Entrega
                  </label>
                  <input
                    type="text"
                    value={entregaEditavel.nome}
                    onChange={(e) => setEntregaEditavel({ ...entregaEditavel, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo/Categoria
                  </label>
                  <input
                    type="text"
                    value={entregaEditavel.tipo}
                    onChange={(e) => setEntregaEditavel({ ...entregaEditavel, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Total Estimado
                  </label>
                  <input
                    type="number"
                    value={entregaEditavel.valor_total || ''}
                    onChange={(e) => setEntregaEditavel({ ...entregaEditavel, valor_total: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo (dias)
                  </label>
                  <input
                    type="number"
                    value={entregaEditavel.prazo_dias || ''}
                    onChange={(e) => setEntregaEditavel({ ...entregaEditavel, prazo_dias: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Briefing
                </label>
                <textarea
                  rows={3}
                  value={entregaEditavel.briefing || ''}
                  onChange={(e) => setEntregaEditavel({ ...entregaEditavel, briefing: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva o briefing da entrega..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={entregaEditavel.observacoes || ''}
                  onChange={(e) => setEntregaEditavel({ ...entregaEditavel, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observações adicionais..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={salvarEntrega}
                  disabled={salvando}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  onClick={cancelarEdicaoEntrega}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{entrega.nome}</h3>
                  <p className="text-sm text-gray-600">{entrega.tipo}</p>
                </div>
                {entrega.valor_total && (
                  <div>
                    <p className="text-sm text-gray-600">Valor Total</p>
                    <p className="text-lg font-semibold text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(entrega.valor_total)}
                    </p>
                  </div>
                )}
                {entrega.prazo_dias && (
                  <div>
                    <p className="text-sm text-gray-600">Prazo</p>
                    <p className="text-lg font-semibold text-blue-600">{entrega.prazo_dias} dias</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Serviços</p>
                  <p className="text-lg font-semibold text-purple-600">{servicos.length}</p>
                </div>
              </div>

              {entrega.briefing && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Briefing</h4>
                  <p className="text-gray-900">{entrega.briefing}</p>
                </div>
              )}

              {modoEdicao && (
                <div className="pt-4">
                  <button
                    onClick={() => setEditandoEntrega(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit3 className="w-4 h-4 inline mr-2" />
                    Editar Informações
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lista de Serviços */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Serviços da Entrega ({servicos.length})
            </h2>
            {modoEdicao && (
              <button
                onClick={() => setMostrandoFormNovoServico(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Adicionar Serviço
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Formulário para novo serviço */}
          {mostrandoFormNovoServico && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Novo Serviço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    value={novoServico.nome || ''}
                    onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ex: Edição de vídeo, Design gráfico..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Estimado
                  </label>
                  <input
                    type="number"
                    value={novoServico.valor_estimado || ''}
                    onChange={(e) => setNovoServico({ ...novoServico, valor_estimado: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo (dias)
                  </label>
                  <input
                    type="number"
                    value={novoServico.prazo_dias || ''}
                    onChange={(e) => setNovoServico({ ...novoServico, prazo_dias: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={novoServico.pode_executar_paralelo || false}
                      onChange={(e) => setNovoServico({ ...novoServico, pode_executar_paralelo: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Pode executar em paralelo</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={novoServico.descricao || ''}
                  onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Descreva o que será realizado neste serviço..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={adicionarServico}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Salvar Serviço
                </button>
                <button
                  onClick={() => {
                    setMostrandoFormNovoServico(false);
                    setNovoServico({});
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de serviços com drag and drop */}
          {servicos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Clock className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 text-lg mb-2">Nenhum serviço cadastrado</p>
              <p className="text-gray-400 text-sm">
                {modoEdicao 
                  ? 'Clique em "Adicionar Serviço" para criar o primeiro serviço'
                  : 'Entre no modo edição para adicionar serviços'
                }
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={servicos.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {servicos.map((servico) => (
                    <SortableServicoItem
                      key={servico.id}
                      servico={servico}
                      onEdit={editarServico}
                      onDelete={excluirServico}
                      onToggleParalelo={toggleParaleloServico}
                      isEditing={modoEdicao}
                      canDelete={servico.status === 'planejado' || servico.status === 'cancelado'}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Modal de edição de serviço */}
      {servicoEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Editando: {servicoEditando.nome}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Serviço
                  </label>
                  <input
                    type="text"
                    value={servicoEditando.nome}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Estimado
                  </label>
                  <input
                    type="number"
                    value={servicoEditando.valor_estimado}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, valor_estimado: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo (dias)
                  </label>
                  <input
                    type="number"
                    value={servicoEditando.prazo_dias || ''}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, prazo_dias: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={servicoEditando.pode_executar_paralelo}
                      onChange={(e) => setServicoEditando({ ...servicoEditando, pode_executar_paralelo: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Pode executar em paralelo</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={servicoEditando.descricao || ''}
                  onChange={(e) => setServicoEditando({ ...servicoEditando, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={salvarEdicaoServico}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Salvar Alterações
              </button>
              <button
                onClick={() => setServicoEditando(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <X className="w-4 h-4 inline mr-2" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}