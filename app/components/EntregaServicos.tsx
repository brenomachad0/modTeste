'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, CheckCircle, PlayCircle, PauseCircle, Clock, User, 
  Layers, Package, Timer, Edit, FileText, Building, ChevronDown, ChevronUp, Plus,
  Save, X, Trash2, DollarSign, GitBranch, RefreshCw, Paperclip, Upload,
  AlertCircle, TrendingUp, Link2, Check, ArrowRight, Bell, Play, Pause
} from 'lucide-react';
import PresetSelectionModal from './PresetSelectionModal';
import { useTemplates } from '../hooks/useTemplates';

type Status = 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';

interface Template {
  id: string;
  nome: string;
  arquivo: File;
  url?: string;
}

interface TaskTemplate {
  id: string;
  nome: string;
  setor: string;
  responsavel_tipo: string;
  prazo_horas: number;
  mandrill_coins: number;
  instrucao: string;
  templates?: Template[];
  categoria: string;
}

interface Tarefa {
  id: string;
  nome: string;
  status: Status;
  ordem?: number;
  setor: string;
  responsavel_usuario?: string | null;
  responsavel_nome?: string | null;
  responsavel_tipo?: string;
  prazo_horas: number;
  duracao_segundos?: number;
  mandrill_coins: number;
  instrucao?: string;
  templates?: Template[];
  data_inicio?: string;
  data_fim?: string;
  data_conclusao?: string;
  tempo_execucao?: number;
  resultado?: {
    descricao: string;
    paragrafo?: string;
    anexos?: {
      nome: string;
      tipo: string;
      tamanho: number;
    }[];
  };
}

interface Servico {
  id: string;
  nome: string;
  status: Status;
  progresso_percentual: number;
  tarefas?: Tarefa[];
}

interface Entrega {
  id: string;
  nome: string;
  status: Status;
  progresso_percentual: number;
  briefing: string;
  tipo?: string;
  projeto_id?: string;
  servicos?: Servico[];
}

interface EntregaServicosProps {
  delivery: Entrega;
  onBackToProject: () => void;
  onViewTask: (task: Tarefa) => void;
  onCompleteTask: (task: Tarefa) => void;
  editingServiceId: string | null;
  onStartEditing: (serviceId: string) => void;
  onStopEditing: () => void;
}

// Funções de formatação de tempo
const formatarTempo = (segundos: number): string => {
  if (segundos < 60) {
    return `${segundos}s`;
  } else if (segundos < 3600) {
    const minutos = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${minutos}:${seg.toString().padStart(2, '0')}`;
  } else if (segundos < 86400) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const seg = segundos % 60;
    return `${horas}:${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  } else {
    const dias = Math.floor(segundos / 86400);
    const horas = Math.floor((segundos % 86400) / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const seg = segundos % 60;
    return `${dias}D ${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  }
};

const formatarTempoExecucao = (tempo: number): string => {
  const horas = Math.floor(tempo / 3600);
  const minutos = Math.floor((tempo % 3600) / 60);
  return `${horas}h ${minutos}min`;
};

export default function EntregaServicos({
  delivery,
  onBackToProject,
  onViewTask,
  onCompleteTask,
  editingServiceId,
  onStartEditing,
  onStopEditing
}: EntregaServicosProps) {
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para edição de entrega
  const [editingEntrega, setEditingEntrega] = useState(false);
  const [entregaForm, setEntregaForm] = useState({
    nome: '',
    briefing: ''
  });
  
  // Estados para edição de tarefas
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [novaTask, setNovaTask] = useState<string | null>(null);
  
  // Estados do sistema avançado
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [tempoAtual, setTempoAtual] = useState<number>(0);
  const [tarefaExecutando, setTarefaExecutando] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [newTaskData, setNewTaskData] = useState<Partial<Tarefa>>({});
  const [editMode, setEditMode] = useState<'tarefas' | 'preset' | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  useEffect(() => {
    // Usar diretamente os dados passados via prop
    setEntrega(delivery);
    setEntregaForm({
      nome: delivery.nome || '',
      briefing: delivery.briefing || ''
    });
    setLoading(false);
  }, [delivery]);

  // Timer para tarefas em execução
  useEffect(() => {
    if (entrega?.servicos) {
      const tarefaAtiva = entrega.servicos
        .flatMap(servico => servico.tarefas || [])
        .find(tarefa => tarefa?.status === 'executando');
      
      if (tarefaAtiva) {
        setTarefaExecutando(tarefaAtiva.id);
        
        const iniciarTimer = () => {
          const agora = new Date().getTime();
          const inicioExecucao = tarefaAtiva.data_inicio ? new Date(tarefaAtiva.data_inicio).getTime() : agora;
          const tempoDecorrido = Math.floor((agora - inicioExecucao) / 1000);
          setTempoAtual(tempoDecorrido);
        };

        iniciarTimer();
        const interval = setInterval(iniciarTimer, 1000);
        setTimerInterval(interval);

        return () => {
          if (interval) clearInterval(interval);
        };
      } else {
        setTarefaExecutando(null);
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
      }
    }
  }, [entrega, timerInterval]);

  const handleEditTask = (task: Tarefa) => {
    console.log('Editando tarefa:', task);
    setEditingTask(task.id);
    setNovaTask(null);
  };

  // Handlers para edição de entrega
  const handleSaveEntrega = async () => {
    try {
      console.log('Salvando entrega:', entregaForm);
      // Aqui implementar a chamada à API
      if (entrega) {
        setEntrega({ ...entrega, ...entregaForm });
      }
      setEditingEntrega(false);
      alert('Entrega salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar entrega:', error);
      alert('Erro ao salvar entrega');
    }
  };

  // Handlers para tarefas
  const handleAddTask = async (serviceId: string, taskData: any) => {
    try {
      const novaTarefa = {
        ...taskData,
        id: `task_${Date.now()}`,
        setor: taskData.responsavel_tipo || 'Criação',
        ordem: (entrega?.servicos?.find(s => s.id === serviceId)?.tarefas?.length || 0) + 1
      };
      
      console.log('Adicionando nova tarefa:', novaTarefa);
      
      if (entrega) {
        const novosServicos = entrega.servicos?.map(s => 
          s.id === serviceId 
            ? { ...s, tarefas: [...(s.tarefas || []), novaTarefa] }
            : s
        ) || [];
        
        setEntrega({ ...entrega, servicos: novosServicos });
      }
      
      setNovaTask(null);
      alert('Tarefa criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      alert('Erro ao criar tarefa');
    }
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      console.log('Salvando tarefa:', taskData);
      
      if (entrega) {
        const novosServicos = entrega.servicos?.map(s => ({
          ...s,
          tarefas: s.tarefas?.map(t => 
            t.id === taskData.id ? { ...t, ...taskData } : t
          ) || []
        })) || [];
        
        setEntrega({ ...entrega, servicos: novosServicos });
      }
      
      setEditingTask(null);
      alert('Tarefa salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      alert('Erro ao salvar tarefa');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        console.log('Deletando tarefa:', taskId);
        
        if (entrega) {
          const novosServicos = entrega.servicos?.map(s => ({
            ...s,
            tarefas: s.tarefas?.filter(t => t.id !== taskId) || []
          })) || [];
          
          setEntrega({ ...entrega, servicos: novosServicos });
        }
        
        setEditingTask(null);
        alert('Tarefa deletada com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        alert('Erro ao deletar tarefa');
      }
    }
  };

  const handleCancelTaskEdit = () => {
    setEditingTask(null);
    setNovaTask(null);
  };

  // Funções de controle de status como no sistema antigo
  const iniciarTarefa = async (tarefaId: string) => {
    try {
      console.log('🚀 Iniciando tarefa:', tarefaId);
      
      // Parar qualquer tarefa em execução
      if (entrega?.servicos) {
        for (const servico of entrega.servicos) {
          if (servico.tarefas) {
            for (const tarefa of servico.tarefas) {
              if (tarefa.status === 'executando' && tarefa.id !== tarefaId) {
                await pausarTarefa(tarefa.id);
              }
            }
          }
        }
      }

      const agora = new Date().toISOString();
      
      if (entrega) {
        const novosServicos = entrega.servicos?.map(s => ({
          ...s,
          tarefas: s.tarefas?.map(t => 
            t.id === tarefaId 
              ? { ...t, status: 'executando' as Status, data_inicio: agora }
              : t
          ) || []
        })) || [];
        
        setEntrega({ ...entrega, servicos: novosServicos });
      }
      
      console.log('✅ Tarefa iniciada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao iniciar tarefa:', error);
    }
  };

  const pausarTarefa = async (tarefaId: string) => {
    try {
      console.log('⏸️ Pausando tarefa:', tarefaId);
      
      if (entrega) {
        const novosServicos = entrega.servicos?.map(s => ({
          ...s,
          tarefas: s.tarefas?.map(t => 
            t.id === tarefaId 
              ? { ...t, status: 'pausada' as Status }
              : t
          ) || []
        })) || [];
        
        setEntrega({ ...entrega, servicos: novosServicos });
      }
      
      console.log('✅ Tarefa pausada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao pausar tarefa:', error);
    }
  };

  const concluirTarefa = async (tarefaId: string) => {
    try {
      console.log('✅ Concluindo tarefa:', tarefaId);
      
      const agora = new Date().toISOString();
      
      if (entrega) {
        const novosServicos = entrega.servicos?.map(s => ({
          ...s,
          tarefas: s.tarefas?.map(t => 
            t.id === tarefaId 
              ? { 
                  ...t, 
                  status: 'concluida' as Status, 
                  data_conclusao: agora,
                  data_fim: agora 
                }
              : t
          ) || []
        })) || [];
        
        setEntrega({ ...entrega, servicos: novosServicos });
        
        // Sequenciamento automático - avançar para próxima tarefa
        setTimeout(() => {
          iniciarProximaTarefa();
        }, 1000);
      }
      
      console.log('✅ Tarefa concluída com sucesso');
    } catch (error) {
      console.error('❌ Erro ao concluir tarefa:', error);
    }
  };

  const iniciarProximaTarefa = () => {
    if (!entrega?.servicos) return;

    const todasTarefas = entrega.servicos
      .flatMap(servico => servico.tarefas || [])
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    const proximaTarefa = todasTarefas.find(tarefa => 
      tarefa.status === 'planejada' || tarefa.status === 'proxima'
    );

    if (proximaTarefa) {
      console.log('🔄 Iniciando próxima tarefa automaticamente:', proximaTarefa.nome);
      iniciarTarefa(proximaTarefa.id);
    }
  };

  const moverTarefa = (tarefaId: string, direcao: 'up' | 'down') => {
    if (!entrega?.servicos) return;

    const servicoComTarefa = entrega.servicos.find(s => 
      s.tarefas?.some(t => t.id === tarefaId)
    );
    
    if (!servicoComTarefa?.tarefas) return;

    const tarefas = [...servicoComTarefa.tarefas];
    const index = tarefas.findIndex(t => t.id === tarefaId);
    
    if (index === -1) return;
    
    const newIndex = direcao === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= tarefas.length) return;

    // Trocar posições
    [tarefas[index], tarefas[newIndex]] = [tarefas[newIndex], tarefas[index]];
    
    // Atualizar ordens
    tarefas.forEach((tarefa, idx) => {
      tarefa.ordem = idx + 1;
    });

    const novosServicos = entrega.servicos.map(s => 
      s.id === servicoComTarefa.id 
        ? { ...s, tarefas }
        : s
    );
    
    setEntrega({ ...entrega, servicos: novosServicos });
    setHasUnsavedChanges(true);
  };

  // Componente para edição de tarefas
  const TaskEditForm: React.FC<{ 
    task?: Tarefa; 
    onSave: (taskData: any) => void; 
    onCancel: () => void;
    isNew?: boolean;
  }> = ({ task, onSave, onCancel, isNew = false }) => {
    const [formData, setFormData] = useState({
      nome: task?.nome || '',
      instrucao: task?.instrucao || '',
      responsavel_nome: task?.responsavel_nome || '',
      responsavel_tipo: task?.responsavel_tipo || 'Criação',
      prazo_horas: task?.prazo_horas || 1,
      mandrill_coins: task?.mandrill_coins || 0,
      status: task?.status || 'planejada',
      setor: task?.setor || 'Criação'
    });

    const handleSubmit = (e: React.FormEvent) => {
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
                Setor
              </label>
              <select
                value={formData.responsavel_tipo}
                onChange={(e) => setFormData({...formData, responsavel_tipo: e.target.value, setor: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="Criação">Criação</option>
                <option value="Motion">Motion</option>
                <option value="Edição">Edição</option>
                <option value="Formatação">Formatação</option>
                <option value="Revisão">Revisão</option>
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
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as Status})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="planejada">Planejada</option>
                <option value="proxima">Próxima</option>
                <option value="executando">Executando</option>
                <option value="pausada">Pausada</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
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

  const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
    const statusConfig = {
      planejada: { color: 'bg-gray-500', label: 'Planejada' },
      proxima: { color: 'bg-orange-500', label: 'Próxima' },
      executando: { color: 'bg-blue-500', label: 'Executando' },
      atrasada: { color: 'bg-red-500', label: 'Atrasada' },
      pausada: { color: 'bg-yellow-500', label: 'Pausada' },
      concluida: { color: 'bg-green-500', label: 'Concluída' }
    };

    const config = statusConfig[status] || statusConfig.planejada;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color} text-white`}>
        {config.label}
      </span>
    );
  };

  // TaskItem simplificado com cronômetro de countdown
  const TaskItem: React.FC<{ task: Tarefa; isEditing: boolean }> = ({ task, isEditing }) => {
    const [tempoAtual, setTempoAtual] = useState(Date.now());
    
    // Se está em modo de edição, renderizar o formulário
    if (editingTask === task.id) {
      return (
        <TaskEditForm 
          task={task}
          onSave={handleSaveTask}
          onCancel={handleCancelTaskEdit}
          isNew={false}
        />
      );
    }

    const isExecutando = task.status === 'executando';
    const isConcluida = task.status === 'concluida';
    const isPlanejada = task.status === 'planejada' || task.status === 'proxima';
    const isPausada = task.status === 'pausada';
    const isAtrasada = task.status === 'atrasada';

    // Cronômetro de countdown
    const [countdown, setCountdown] = useState<number>(0);
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
      const updateCountdown = () => {
        if (!task.data_inicio) {
          // Se não iniciou, mostrar prazo total
          setCountdown(task.prazo_horas * 3600);
          setIsOverdue(false);
          return;
        }

        const inicio = new Date(task.data_inicio).getTime();
        const prazoMs = task.prazo_horas * 3600 * 1000;
        const deadline = inicio + prazoMs;
        const agora = Date.now();
        const diff = deadline - agora;

        if (diff > 0) {
          // Ainda dentro do prazo
          setCountdown(Math.floor(diff / 1000));
          setIsOverdue(false);
        } else {
          // Passou do prazo
          setCountdown(Math.floor(Math.abs(diff) / 1000));
          setIsOverdue(true);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }, [task.data_inicio, task.prazo_horas, isExecutando, isConcluida]);

    // Formatar countdown
    const formatCountdown = (segundos: number): string => {
      const dias = Math.floor(segundos / 86400);
      const horas = Math.floor((segundos % 86400) / 3600);
      const minutos = Math.floor((segundos % 3600) / 60);
      const segs = segundos % 60;
      
      if (dias > 0) {
        return `${dias}D ${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
      }
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    };

    const getStatusBadge = () => {
      if (isConcluida) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">Concluído</span>;
      if (isExecutando) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white animate-pulse">Executando</span>;
      if (isPausada) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500 text-white">Pausada</span>;
      if (isAtrasada) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">Atrasada</span>;
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-200">Planejada</span>;
    };

    const canComplete = isExecutando || isPausada;

    return (
      <div 
        className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-purple-500 transition-all cursor-pointer"
        onClick={() => onViewTask?.(task)}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Lado esquerdo - Informações principais */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Título */}
            <h4 className="text-sm font-medium text-white">
              {task.nome}
            </h4>

            {/* Responsável e Setor */}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {task.responsavel_nome || 'Não atribuído'}
              </span>
              <span className="flex items-center gap-1">
                <Building className="w-3 h-3" />
                {task.setor}
              </span>
            </div>
          </div>

          {/* Lado direito - Status e Cronômetro */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Tag de Status */}
            {getStatusBadge()}

            {/* Cronômetro de Countdown */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span 
                className={`font-medium text-sm ${
                  isOverdue 
                    ? 'text-red-500 animate-pulse' 
                    : isConcluida 
                    ? 'text-green-400' 
                    : 'text-white'
                }`}
              >
                {isOverdue && '+ '}{formatCountdown(countdown)}
              </span>
            </div>

            {/* Botão de Conclusão (apenas se estiver executando) */}
            {canComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompleteTask?.(task);
                }}
                className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium mt-1"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ServiceSection: React.FC<{ service: Servico }> = ({ service }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const isEditing = editingServiceId === service.id;

    const calcularProgresso = () => {
      if (!service.tarefas || service.tarefas.length === 0) return 0;
      const concluidas = service.tarefas.filter(t => t.status === 'concluida').length;
      return (concluidas / service.tarefas.length) * 100;
    };

    const progresso = calcularProgresso();
    const orderedTasks = service.tarefas?.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) || [];

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Layers className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">{service.nome}</h3>
                <p className="text-sm text-gray-400">
                  {service.tarefas?.length || 0} tarefas • {progresso.toFixed(0)}% concluído
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <StatusBadge status={service.status} />
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-2 bg-purple-500 transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <span className="text-sm font-bold text-purple-400 w-10">
                {progresso.toFixed(0)}%
              </span>
              
              <button
                onClick={() => isEditing ? onStopEditing() : onStartEditing(service.id)}
                className={`p-2 rounded transition-colors ${
                  isEditing 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                title={isEditing ? "Sair do modo edição" : "Entrar no modo edição"}
              >
                <Edit className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-700">
            {/* Botão Nova Tarefa */}
            {isEditing && (
              <div className="mt-3 mb-3">
                <button
                  onClick={() => {
                    setNovaTask(service.id);
                    setEditingTask(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nova Tarefa
                </button>
              </div>
            )}

            {/* Formulário de Nova Tarefa */}
            {novaTask === service.id && (
              <div className="mt-3 mb-3">
                <TaskEditForm 
                  onSave={(taskData) => handleAddTask(service.id, taskData)}
                  onCancel={handleCancelTaskEdit}
                  isNew={true}
                />
              </div>
            )}

            {/* Lista de Tarefas */}
            {service.tarefas && service.tarefas.length > 0 && (
              <div className="space-y-3 mt-3">
                {orderedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isEditing={isEditing}
                  />
                ))}
              </div>
            )}

            {/* Mensagem quando não há tarefas */}
            {(!service.tarefas || service.tarefas.length === 0) && !novaTask && (
              <div className="text-center py-8 mt-3">
                {isEditing ? (
                  <div className="text-gray-500 text-sm mb-4">
                    Clique em "Nova Tarefa" para adicionar a primeira tarefa
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onStartEditing(service.id);
                      setShowNewTaskModal(true);
                    }}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Criar primeira tarefa
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getIconeDoTipo = (tipo?: string) => {
    const iconMap = {
      'Motion': '🎬',
      'Edição': '✂️',
      'Formatação': '📝'
    };
    return iconMap[tipo as keyof typeof iconMap] || '📋';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Carregando serviços e tarefas...</p>
        </div>
      </div>
    );
  }

  if (!entrega) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Entrega não encontrada</h2>
          <p className="text-gray-400 mb-4">Não foi possível carregar os dados desta entrega.</p>
          <button
            onClick={onBackToProject}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Calcular estatísticas
  const totalTarefas = entrega.servicos?.reduce((acc, s) => acc + (s.tarefas?.length || 0), 0) || 0;
  const tarefasConcluidas = entrega.servicos?.reduce((acc, s) => 
    acc + (s.tarefas?.filter(t => t.status === 'concluida').length || 0), 0) || 0;
  
  const tempoTotalGasto = entrega.servicos?.reduce((acc, s) => {
    return acc + (s.tarefas?.reduce((taskAcc, t) => {
      if (t.status === 'concluida' && t.tempo_execucao) {
        return taskAcc + t.tempo_execucao;
      }
      if (t.status === 'executando' && t.data_inicio) {
        const inicio = new Date(t.data_inicio).getTime();
        const agora = Date.now();
        return taskAcc + Math.floor((agora - inicio) / 1000);
      }
      return taskAcc;
    }, 0) || 0);
  }, 0) || 0;

  const formatarTempoTotal = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    return `${horas}h ${minutos}m`;
  };

  return (
    <div className="bg-gray-950">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Tarefas do Serviço
          </h2>
        </div>

        <div className="space-y-4">

          {entrega.servicos && entrega.servicos.length > 0 ? (
            <div className="space-y-4">
              {entrega.servicos.map(service => (
                <ServiceSection
                  key={service.id}
                  service={service}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
              <Layers className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum serviço configurado</h3>
              <p className="text-gray-400 mb-4">Configure os serviços necessários para esta entrega</p>
              <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                Criar Primeiro Serviço
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
