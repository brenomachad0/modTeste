'use client';

// @ts-nocheck
import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Layers, FileText, Plus, Edit3, 
  Save, X, Trash2, DollarSign, Clock, PlayCircle, 
  CheckCircle, AlertCircle, Users, GitBranch
} from 'lucide-react';

// Componente de Badge de Status
const StatusBadge = ({ status }) => {
  const statusConfig = {
    planejado: { bg: 'bg-gray-600', text: 'text-gray-100', label: 'Planejado' },
    em_execucao: { bg: 'bg-blue-600', text: 'text-blue-100', label: 'Em Execução' },
    pausado: { bg: 'bg-yellow-600', text: 'text-yellow-100', label: 'Pausado' },
    concluido: { bg: 'bg-green-600', text: 'text-green-100', label: 'Concluído' },
    cancelado: { bg: 'bg-red-600', text: 'text-red-100', label: 'Cancelado' }
  };

  const config = statusConfig[status] || statusConfig.planejado;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Componente de Barra de Progresso
const ProgressBar = ({ percentage, showLabel = true }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-400 min-w-[3rem]">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

// Componente de Tarefa (seguindo padrão do Dashboard)
// Componente TaskItem seguindo padrão do Dashboard
const TaskItem = ({ task, onEdit, isEditing, onSave, onCancel, onDelete }) => {
  if (isEditing) {
    return (
      <TaskEditForm 
        task={task}
        onSave={onSave}
        onCancel={onCancel}
        isNew={false}
      />
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3 mb-2 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h6 className="text-sm font-medium text-gray-200 mb-1">{task.nome}</h6>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {task.responsavel_nome && (
              <span className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {task.responsavel_nome} {task.responsavel_tipo && `(${task.responsavel_tipo})`}
              </span>
            )}
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {task.prazo_horas}h
            </span>
            <span className="flex items-center text-yellow-500">
              <DollarSign className="w-3 h-3 mr-1" />
              {task.mandrill_coins} MC
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          <button
            onClick={() => onEdit(task.id)}
            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-200"
          >
            <Edit3 className="w-3 h-3" />
            <span className="text-xs font-bold text-red-500">EDITAR TESTE</span>
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {task.instrucao && (
        <p className="text-xs text-gray-500 mt-2">{task.instrucao}</p>
      )}
    </div>
  );
};

// Componente de Serviço
const ServiceItem = ({ 
  service, 
  editingService, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  onAddTask,
  onEditTask,
  editingTask,
  novaTask,
  onSaveTask,
  onDeleteTask,
  onCancelTaskEdit
}) => {
  const [expanded, setExpanded] = useState(false);
  const isEditing = editingService === service.id;

  if (isEditing) {
    return (
      <ServiceEditForm 
        service={service}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="bg-gray-850 rounded-lg border border-gray-700 mb-3">
      <div
        className="p-4 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
            <Layers className="w-5 h-5 text-purple-500" />
            <div>
              <h4 className="text-sm font-semibold text-gray-200">{service.nome}</h4>
              <p className="text-xs text-gray-500">
                {service.tarefas?.length || 0} tarefas • Ordem: {service.ordem}
              </p>
              {service.descricao && (
                <p className="text-xs text-gray-400 mt-1">{service.descricao}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {service.pode_executar_paralelo && (
                <GitBranch className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-xs text-gray-400">
                R$ {service.valor_estimado?.toLocaleString('pt-BR')}
              </span>
            </div>
            <ProgressBar percentage={service.progresso_percentual || 0} showLabel={false} />
            <StatusBadge status={service.status} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(service.id);
              }}
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-200"
            >
              <Edit3 className="w-3 h-3" />
              <span className="text-xs">Editar</span>
            </button>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4">
          <div className="ml-8 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tarefas</h5>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                  <FileText className="w-3 h-3" />
                  Salvar Edição
                </button>
                <button 
                  onClick={() => onAddTask(service.id)}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Nova Tarefa
                </button>
              </div>
            </div>
            {service.tarefas?.length > 0 ? (
              service.tarefas.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={() => {}}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-xs">
                Nenhuma tarefa criada para este serviço
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Formulário de Edição de Serviço
const ServiceEditForm = ({ service, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    nome: service.nome,
    descricao: service.descricao || '',
    valor_estimado: service.valor_estimado,
    ordem: service.ordem,
    status: service.status,
    pode_executar_paralelo: service.pode_executar_paralelo,
    prazo_dias: service.prazo_dias || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...service, ...formData });
  };

  return (
    <div className="bg-gray-850 rounded-lg border border-blue-500 mb-3">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-500" />
            Editando Serviço
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(service.id)}
              className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Deletar
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Nome do Serviço
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                value={formData.valor_estimado}
                onChange={(e) => setFormData({ ...formData, valor_estimado: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Ordem de Execução
              </label>
              <input
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="planejado">Planejado</option>
                <option value="em_execucao">Em Execução</option>
                <option value="pausado">Pausado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Prazo (dias)
              </label>
              <input
                type="number"
                value={formData.prazo_dias}
                onChange={(e) => setFormData({ ...formData, prazo_dias: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-blue-500"
                min="0"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="execucao_paralela"
                checked={formData.pode_executar_paralelo}
                onChange={(e) => setFormData({ ...formData, pode_executar_paralelo: e.target.checked })}
                className="mr-2 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="execucao_paralela" className="text-xs text-gray-400">
                Permite execução paralela
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-blue-500"
              rows={3}
              placeholder="Descreva os detalhes deste serviço..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente de Formulário para Editar/Criar Tarefa
const TaskEditForm = ({ task = {}, onSave, onCancel, isNew = false }) => {
  const [formData, setFormData] = useState({
    nome: (task as any)?.nome || '',
    instrucao: (task as any)?.instrucao || '',
    responsavel_nome: (task as any)?.responsavel_nome || '',
    responsavel_tipo: (task as any)?.responsavel_tipo || 'interno',
    prazo_horas: (task as any)?.prazo_horas || 1,
    mandrill_coins: (task as any)?.mandrill_coins || 0,
    status: (task as any)?.status || 'planejada',
    ordem: (task as any)?.ordem || 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...task, ...formData });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-2 border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h6 className="text-sm font-medium text-gray-200">
          {isNew ? 'Nova Tarefa' : 'Editar Tarefa'}
        </h6>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Nome da Tarefa
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Instruções
          </label>
          <textarea
            value={formData.instrucao}
            onChange={(e) => setFormData({...formData, instrucao: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Responsável
            </label>
            <input
              type="text"
              value={formData.responsavel_nome}
              onChange={(e) => setFormData({...formData, responsavel_nome: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Tipo
            </label>
            <select
              value={formData.responsavel_tipo}
              onChange={(e) => setFormData({...formData, responsavel_tipo: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="interno">Interno</option>
              <option value="freelancer">Freelancer</option>
              <option value="terceirizado">Terceirizado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Prazo (horas)
            </label>
            <input
              type="number"
              min="1"
              value={formData.prazo_horas}
              onChange={(e) => setFormData({...formData, prazo_horas: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Mandrill Coins
            </label>
            <input
              type="number"
              min="0"
              value={formData.mandrill_coins}
              onChange={(e) => setFormData({...formData, mandrill_coins: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Ordem
            </label>
            <input
              type="number"
              min="1"
              value={formData.ordem}
              onChange={(e) => setFormData({...formData, ordem: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="planejada">Planejada</option>
            <option value="proxima">Próxima</option>
            <option value="executando">Executando</option>
            <option value="pausada">Pausada</option>
            <option value="concluida">Concluída</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            <Save className="w-4 h-4" />
            {isNew ? 'Criar Tarefa' : 'Salvar Alterações'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

// Componente Principal do Editor de Entrega
const EntregaEditorSimple = ({ 
  entrega, 
  projeto, 
  servicos, 
  onSaveEntrega, 
  onSaveServico, 
  onDeleteServico, 
  onCreateServico,
  onAddTask,
  onSaveTask,
  onDeleteTask
}) => {
  const [editingService, setEditingService] = useState(null);
  const [editingEntrega, setEditingEntrega] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [novaTask, setNovaTask] = useState(null);
  const [entregaForm, setEntregaForm] = useState({
    nome: entrega?.nome || '',
    briefing: entrega?.briefing || ''
  });

  const handleEditService = (serviceId) => {
    setEditingService(serviceId);
  };

  const handleSaveService = async (serviceData) => {
    const success = await onSaveServico(serviceData);
    if (success) {
      setEditingService(null);
    }
  };

  const handleCancelServiceEdit = () => {
    setEditingService(null);
  };

  const handleDeleteService = async (serviceId) => {
    if (confirm('Tem certeza que deseja deletar este serviço?')) {
      const success = await onDeleteServico(serviceId);
      if (success) {
        setEditingService(null);
      }
    }
  };

  // Handlers para Tarefas
  const handleEditTask = (taskId) => {
    setEditingTask(taskId);
    setNovaTask(null);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (novaTask) {
        // Criar nova tarefa
        await onAddTask(novaTask, taskData);
        setNovaTask(null);
      } else {
        // Editar tarefa existente
        await onSaveTask(taskData);
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      await onDeleteTask(taskId);
      setEditingTask(null);
    }
  };

  const handleAddTask = (serviceId) => {
    setNovaTask(serviceId);
    setEditingTask(null);
  };

  const handleCancelTaskEdit = () => {
    setEditingTask(null);
    setNovaTask(null);
  };

  const handleSaveEntrega = async () => {
    const success = await onSaveEntrega({ ...entrega, ...entregaForm });
    if (success) {
      setEditingEntrega(false);
    }
  };

  const handleAddNewService = () => {
    const newService = {
      nome: 'Novo Serviço',
      descricao: '',
      valor_estimado: 0,
      ordem: (servicos?.length || 0) + 1,
      status: 'planejado',
      pode_executar_paralelo: false,
      prazo_dias: 1,
      tarefas: []
    };
    onCreateServico(newService);
  };

  return (
    <div className="space-y-6">
      {/* Header da Entrega */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-200">
                {editingEntrega ? 'Editando Entrega' : entrega?.nome}
              </h2>
              <p className="text-sm text-gray-400">
                Projeto: {projeto?.titulo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!editingEntrega ? (
              <button
                onClick={() => setEditingEntrega(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Editar Entrega
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEntrega}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
                <button
                  onClick={() => setEditingEntrega(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {editingEntrega ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nome da Entrega
              </label>
              <input
                type="text"
                value={entregaForm.nome}
                onChange={(e) => setEntregaForm({ ...entregaForm, nome: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Briefing
              </label>
              <textarea
                value={entregaForm.briefing}
                onChange={(e) => setEntregaForm({ ...entregaForm, briefing: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-blue-500"
                rows="4"
                placeholder="Descreva o briefing desta entrega..."
              />
            </div>
          </div>
        ) : (
          <div>
            {entrega?.briefing && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Briefing:</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{entrega.briefing}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de Serviços */}
      {!editingEntrega && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-200">
              Serviços ({servicos?.length || 0})
            </h3>
            <button
              onClick={handleAddNewService}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Serviço
            </button>
          </div>

          {servicos?.length > 0 ? (
            <div className="space-y-3">
              {servicos
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .map(service => (
                  <ServiceItem
                    key={service.id}
                    service={service}
                    editingService={editingService}
                    onEdit={handleEditService}
                    onSave={handleSaveService}
                    onCancel={handleCancelServiceEdit}
                    onDelete={handleDeleteService}
                    onAddTask={handleAddTask}
                    onEditTask={handleEditTask}
                    editingTask={editingTask}
                    novaTask={novaTask}
                    onSaveTask={handleSaveTask}
                    onDeleteTask={handleDeleteTask}
                    onCancelTaskEdit={handleCancelTaskEdit}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Layers className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-medium mb-2">Nenhum serviço criado</p>
              <p className="text-sm mb-4">Adicione serviços para estruturar esta entrega</p>
              <button
                onClick={handleAddNewService}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Serviço
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EntregaEditorSimple;