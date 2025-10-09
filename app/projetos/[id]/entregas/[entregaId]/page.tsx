'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, DollarSign, Calendar, Layers, Target, CheckCircle, Clock, LayoutGrid, GitBranch, User, Building, Timer, X, ChevronUp, ChevronDown, Edit2, Plus, Save } from 'lucide-react';
import PresetSelectionModal from '../../../../components/PresetSelectionModal';
import TaskViewModal from '../../../../components/TaskViewModal';
import TaskCompletionModal from '../../../../components/TaskCompletionModal';
import TaskEditModal from '../../../../components/TaskEditModal';
import SaveTaskChangesModal from '../../../../components/SaveTaskChangesModal';
import ServiceFlowCanvas from '../../../../components/ServiceFlowCanvas';
import AddServiceModal from '../../../../components/AddServiceModal';

type Status = 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';

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
  templates?: any[];
  data_inicio?: string;
  data_fim?: string;
  tempo_execucao?: number;
  resultado?: any;
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
  // Dados de Briefing
  uso?: string;
  estilo?: string;
  objetivos?: string;
  tom?: string;
  tecnicas?: {
    fotografia?: string[];
    gravacao?: string[];
    audio?: string[];
    ilustracao?: string[];
    animacao?: string[];
    motion?: string[];
  };
  estrategia?: string;
  referencias?: string[];
  // Dados de Janela
  territorio?: string;
  veiculos?: string[];
  periodo_utilizacao?: string;
  duracao?: string;
  idioma_original?: string;
}

// Componente TaskItem com cronômetro
const TaskItem: React.FC<{ 
  task: Tarefa; 
  onView: (task: Tarefa) => void;
  onComplete: (task: Tarefa) => void;
  isEditMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onEdit?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  canEdit?: boolean;
}> = ({ task, onView, onComplete, isEditMode, onMoveUp, onMoveDown, onEdit, canMoveUp, canMoveDown, canEdit }) => {
  const [countdown, setCountdown] = useState<number>(0);
  const [isOverdue, setIsOverdue] = useState(false);

  const isExecutando = task.status === 'executando';
  const isConcluida = task.status === 'concluida';
  const isPausada = task.status === 'pausada';
  const isAtrasada = task.status === 'atrasada';

  // Cronômetro de countdown
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
  }, [task.data_inicio, task.prazo_horas]);

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
  
  // Verificar se responsável é indefinido e precisa piscar
  const isResponsavelIndefinido = !task.responsavel_nome || task.responsavel_nome.trim() === '';
  const shouldBlinkRed = isResponsavelIndefinido && (task.status === 'planejada' || task.status === 'executando' || task.status === 'atrasada');

  return (
    <div 
      className={`bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-purple-500 transition-all ${!isEditMode ? 'cursor-pointer' : ''}`}
      onClick={!isEditMode ? () => onView(task) : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Botões de ordenação (modo edição) */}
        {isEditMode && (
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              disabled={!canMoveUp}
              className={`p-1 rounded ${
                canMoveUp 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
              title="Mover para cima"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              disabled={!canMoveDown}
              className={`p-1 rounded ${
                canMoveDown 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
              title="Mover para baixo"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Lado esquerdo - Informações principais */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Título */}
          <h4 className="text-sm font-medium text-white">
            {task.nome}
          </h4>

          {/* Responsável e Setor */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className={`flex items-center gap-1 ${shouldBlinkRed ? 'text-red-500 animate-pulse font-semibold' : ''}`}>
              <User className="w-3 h-3" />
              {isResponsavelIndefinido ? 'Indefinido' : task.responsavel_nome}
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              {task.setor}
            </span>
          </div>
        </div>

        {/* Lado direito - Status e Cronômetro/Botões */}
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

          {/* Botões */}
          {isEditMode ? (
            /* Botão de Editar (modo edição) */
            canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium mt-1 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Editar
              </button>
            )
          ) : (
            /* Botão de Conclusão (modo normal) */
            canComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(task);
                }}
                className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium mt-1"
              >
                Concluir
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default function EntregaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const projetoId = params.id as string;
  const entregaId = params.entregaId as string;
  
  const [viewMode, setViewMode] = useState<'cards' | 'flow'>('cards');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);
  const [isEditingEntrega, setIsEditingEntrega] = useState(false);
  const [entregaNome, setEntregaNome] = useState('Campanha Digital Completa');
  const [entregaBriefing, setEntregaBriefing] = useState('Desenvolver campanha digital integrada com vídeo promocional.');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'briefing' | 'exibicao'>('briefing');
  const [showDndFlow, setShowDndFlow] = useState(true);
  
  // Estados do modo de edição de tarefas
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTasksServiceId, setEditingTasksServiceId] = useState<string | null>(null);
  const [editedTasks, setEditedTasks] = useState<Tarefa[]>([]);
  const [taskToEdit, setTaskToEdit] = useState<Tarefa | null>(null);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);
  const [showSaveChangesModal, setShowSaveChangesModal] = useState(false);

  const entrega: Entrega = {
    id: entregaId,
    nome: entregaNome,
    briefing: entregaBriefing,
    status: 'executando',
    progresso_percentual: 65,
    tipo: 'Motion',
    projeto_id: projetoId,
    // Dados de Briefing (mock) - agora com arrays
    uso: 'Publicidade, Anúncio',
    estilo: 'Manifesto, Teaser',
    objetivos: 'Engajamento, Converter Lead',
    tom: 'Inspirador, Luxuoso',
    tecnicas: {
      fotografia: ['Portrait HDR', 'Retrato'],
      gravacao: ['Slow Motion'],
      audio: ['Trilha Pesquisada', 'Sound Design'],
      animacao: ['3D'],
      motion: ['Infográfico', '3D']
    },
    estrategia: 'Criar uma narrativa visual impactante que conecte emocionalmente com o público, utilizando recursos de motion graphics modernos combinados com fotografia de alta qualidade.',
    referencias: [
      'https://www.behance.net/exemplo1',
      'https://vimeo.com/exemplo2'
    ],
    // Dados de Janela (mock)
    territorio: 'Nacional',
    veiculos: ['Youtube', 'Instagram', 'TV'],
    periodo_utilizacao: '6 meses',
    duracao: 'Exatamente 15 segundos',
    idioma_original: 'Português',
    servicos: [{
      id: 'serv_1',
      nome: 'Modelagem 3D',
      status: 'executando',
      progresso_percentual: 75,
      tarefas: [{
        id: '1',
        nome: 'Criar modelo base do logo',
        status: 'concluida',
        prazo_horas: 8,
        responsavel_nome: 'João Silva',
        responsavel_tipo: 'Criação',
        setor: 'Criação',
        mandrill_coins: 100,
        instrucao: 'Criar o modelo 3D base do logo seguindo as especificações.',
        resultado: {
          descricao: 'Modelo 3D criado com sucesso.',
          anexos: []
        },
        data_inicio: '2025-10-06T08:00:00.000Z',
        data_fim: '2025-10-06T15:30:00.000Z',
        tempo_execucao: 27000
      }, {
        id: '2',
        nome: 'Aplicar texturas e materiais',
        status: 'executando',
        prazo_horas: 6,
        responsavel_nome: 'João Silva',
        responsavel_tipo: 'Criação',
        setor: 'Criação',
        mandrill_coins: 80,
        instrucao: 'Aplicar as texturas e materiais.',
        data_inicio: '2025-10-06T09:15:00.000Z',
        duracao_segundos: 8400
      }, {
        id: '3',
        nome: 'Configurar iluminação',
        status: 'planejada',
        prazo_horas: 4,
        responsavel_nome: 'João Silva',
        responsavel_tipo: 'Criação',
        setor: 'Criação',
        mandrill_coins: 60,
        instrucao: 'Configurar a iluminação para realçar os detalhes do modelo.'
      }]
    }, {
      id: 'serv_2',
      nome: 'Animação',
      status: 'planejada',
      progresso_percentual: 0,
      tarefas: [{
        id: '4',
        nome: 'Criar keyframes principais',
        status: 'planejada',
        prazo_horas: 12,
        responsavel_nome: 'Maria Santos',
        responsavel_tipo: 'Criação',
        setor: 'Criação',
        mandrill_coins: 150,
        instrucao: 'Criar os keyframes principais da animação com 15 segundos de duração.'
      }, {
        id: '5',
        nome: 'Aplicar easing e timing',
        status: 'planejada',
        prazo_horas: 8,
        responsavel_nome: 'Maria Santos',
        responsavel_tipo: 'Criação',
        setor: 'Criação',
        mandrill_coins: 100,
        instrucao: 'Ajustar o timing e easing para tornar a animação mais fluida.'
      }]
    }]
  };

  const handleBackToProject = () => {
    const url = `/projetos/${projetoId}`;
    console.log('🔙 Voltando para projeto:', projetoId);
    console.log('🔗 URL destino:', url);
    console.log('📍 URL atual:', window.location.pathname);
    router.push(url);
  };
  
  const handleViewTask = (task: Tarefa) => { setSelectedTask(task); setShowTaskViewModal(true); };
  const handleCompleteTask = (task: Tarefa) => { setSelectedTask(task); setShowTaskCompletionModal(true); };
  const handleStartEditing = (serviceId: string) => setEditingServiceId(serviceId);
  const handleStopEditing = () => setEditingServiceId(null);
  
  // Funções do modo de edição de tarefas
  const handleToggleEditMode = (serviceId: string) => {
    if (isEditMode && editingTasksServiceId === serviceId) {
      // Sair do modo de edição - descartar
      setIsEditMode(false);
      setEditingTasksServiceId(null);
      setEditedTasks([]);
    } else {
      // Entrar no modo de edição
      const servico = allServices.find(s => s.id === serviceId);
      if (servico) {
        setIsEditMode(true);
        setEditingTasksServiceId(serviceId);
        setEditedTasks([...(servico.tarefas || [])]);
      }
    }
  };

  const handleMoveTaskUp = (taskId: string) => {
    const taskIndex = editedTasks.findIndex(t => t.id === taskId);
    if (taskIndex > 0) {
      const newTasks = [...editedTasks];
      [newTasks[taskIndex - 1], newTasks[taskIndex]] = [newTasks[taskIndex], newTasks[taskIndex - 1]];
      setEditedTasks(newTasks);
    }
  };

  const handleMoveTaskDown = (taskId: string) => {
    const taskIndex = editedTasks.findIndex(t => t.id === taskId);
    if (taskIndex < editedTasks.length - 1) {
      const newTasks = [...editedTasks];
      [newTasks[taskIndex], newTasks[taskIndex + 1]] = [newTasks[taskIndex + 1], newTasks[taskIndex]];
      setEditedTasks(newTasks);
    }
  };

  const handleEditTask = (task: Tarefa) => {
    setTaskToEdit(task);
    setShowTaskEditModal(true);
  };

  const handleSaveTaskEdit = (editedTask: Tarefa) => {
    const taskIndex = editedTasks.findIndex(t => t.id === editedTask.id);
    if (taskIndex !== -1) {
      const newTasks = [...editedTasks];
      newTasks[taskIndex] = editedTask;
      setEditedTasks(newTasks);
    }
  };

  const handleAddNewTask = (newTask: Tarefa) => {
    setEditedTasks([...editedTasks, newTask]);
  };

  const handleSaveChanges = () => {
    setShowSaveChangesModal(true);
  };

  const handleSaveCurrentService = () => {
    console.log('Salvando alterações apenas neste serviço:', editingTasksServiceId, editedTasks);
    // Aqui você implementaria a lógica de salvar apenas neste serviço
    setIsEditMode(false);
    setEditingTasksServiceId(null);
    setEditedTasks([]);
  };

  const handleSaveAsDefault = () => {
    console.log('Salvando como padrão para futuras entregas:', editingTasksServiceId, editedTasks);
    // Aqui você implementaria a lógica de salvar como padrão
    setIsEditMode(false);
    setEditingTasksServiceId(null);
    setEditedTasks([]);
  };

  const handleDiscardChanges = () => {
    if (confirm('Tem certeza que deseja descartar todas as alterações?')) {
      setIsEditMode(false);
      setEditingTasksServiceId(null);
      setEditedTasks([]);
    }
  };

  const canEditTask = (status: string) => {
    return status === 'aguardando' || status === 'planejada';
  };

  const canMoveTaskUp = (taskIndex: number, tasks: Tarefa[]) => {
    if (taskIndex === 0) return false;
    
    // Verificar se a tarefa atual pode ser editada
    const currentTask = tasks[taskIndex];
    if (!canEditTask(currentTask.status)) return false;
    
    // Verificar se a tarefa de cima está "congelada" (executando, atrasada ou concluída)
    const taskAbove = tasks[taskIndex - 1];
    const isFrozen = ['executando', 'atrasada', 'concluida'].includes(taskAbove.status);
    
    return !isFrozen;
  };
  
  const handleServiceClick = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    // Scroll para a seção de tarefas
    setTimeout(() => {
      const element = document.getElementById('servicos-tarefas');
      element?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      console.log('Excluir serviço:', serviceId);
      // Aqui você implementaria a lógica de exclusão
    }
  };

  // Estado para gerenciar serviços adicionados dinamicamente
  const [dynamicServices, setDynamicServices] = useState<Servico[]>([]);

  const handleAddService = () => {
    setShowAddServiceModal(true);
  };

  const handleAddExistingService = (serviceId: string) => {
    console.log('Adicionando serviço existente:', serviceId);
    
    // Encontrar o serviço nos dados disponíveis
    const service = availableServices.find(s => s.id === serviceId);
    if (!service) return;

    // Criar novo serviço
    const newService: Servico = {
      id: `service-${Date.now()}`,
      nome: service.nome,
      status: 'planejada',
      progresso_percentual: 0,
      tarefas: []
    };

    // Adicionar aos serviços dinâmicos
    setDynamicServices(prev => [...prev, newService]);
    
    setShowAddServiceModal(false);
  };

  const handleCreateNewService = (serviceName: string) => {
    console.log('Criando novo serviço:', serviceName);
    
    // Criar novo serviço com tarefa padrão
    const newService: Servico = {
      id: `service-${Date.now()}`,
      nome: serviceName,
      status: 'planejada',
      progresso_percentual: 0,
      tarefas: [{
        id: `task-${Date.now()}`,
        nome: 'Criar tarefas do serviço',
        status: 'planejada',
        prazo_horas: 168, // 7 dias
        responsavel_nome: 'A definir',
        responsavel_tipo: 'Criação',
        setor: 'Criação',
        mandrill_coins: 50,
        instrucao: 'Definir e criar as tarefas necessárias para este serviço.'
      }]
    };

    // Adicionar aos serviços dinâmicos
    setDynamicServices(prev => [...prev, newService]);
    
    setShowAddServiceModal(false);
  };

  // Combinar serviços estáticos com dinâmicos
  const allServices = [...(entrega.servicos || []), ...dynamicServices];

  const handleSaveFlow = (nodes: any[], edges: any[]) => {
    console.log('Salvar fluxo:', { nodes, edges });
    // Aqui você implementaria a lógica de salvar as posições e conexões
  };

  const handleSaveEntrega = () => {
    console.log('Salvar entrega:', { nome: entregaNome, briefing: entregaBriefing });
    setIsEditingEntrega(false);
    // Aqui você implementaria a lógica de salvar
  };

  // Serviços disponíveis para adicionar (mock - virá da API)
  const availableServices = [
    { id: 'srv_template_1', nome: 'Edição de Vídeo' },
    { id: 'srv_template_2', nome: 'Motion Graphics' },
    { id: 'srv_template_3', nome: 'Colorização' },
    { id: 'srv_template_4', nome: 'Sound Design' },
  ];

  // Calcular estatísticas
  const totalTarefas = entrega.servicos?.reduce((acc, s) => acc + (s.tarefas?.length || 0), 0) || 0;
  const tarefasConcluidas = entrega.servicos?.reduce((acc, s) => 
    acc + (s.tarefas?.filter(t => t.status === 'concluida').length || 0), 0) || 0;

  // Countdown da estimativa da entrega em tempo real
  const [totalCountdown, setTotalCountdown] = useState<number>(0);
  const [isTotalOverdue, setIsTotalOverdue] = useState(false);

  useEffect(() => {
    const updateTotalCountdown = () => {
      const agora = Date.now();

      // Calcular prazo remanescente de cada serviço
      const servicosComPrazo = allServices.map(servico => {
        let prazoRemanescente = 0;
        
        for (const tarefa of servico.tarefas || []) {
          // Tarefas atrasadas e concluídas entram como 0
          if (tarefa.status === 'atrasada' || tarefa.status === 'concluida') {
            continue;
          }

          // Calcular prazo remanescente da tarefa
          if (tarefa.data_inicio) {
            const dataInicio = new Date(tarefa.data_inicio);
            const prazoMs = tarefa.prazo_horas * 3600 * 1000;
            const deadline = dataInicio.getTime() + prazoMs;
            const remanescente = Math.max(0, deadline - agora);
            prazoRemanescente += remanescente;
          } else {
            // Se não iniciou, usar o prazo total
            prazoRemanescente += tarefa.prazo_horas * 3600 * 1000;
          }
        }

        return {
          servicoId: servico.id,
          prazoRemanescente
        };
      });

      // TODO: Implementar lógica de serviços simultâneos (etapas)
      // Por enquanto, somar todos os prazos
      const totalMs = servicosComPrazo.reduce((acc, s) => acc + s.prazoRemanescente, 0);
      const totalSegundos = Math.floor(totalMs / 1000);

      setTotalCountdown(totalSegundos);
      setIsTotalOverdue(false);
    };

    updateTotalCountdown();
    const interval = setInterval(updateTotalCountdown, 1000);
    return () => clearInterval(interval);
  }, [allServices]);

  // Formatar countdown total
  const formatTotalCountdown = (segundos: number): string => {
    const dias = Math.floor(segundos / 86400);
    const horas = Math.floor((segundos % 86400) / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (dias > 0) {
      return `${dias}D ${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header com informações da entrega */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Breadcrumb e botões de ação */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBackToProject}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Projeto</span>
            </button>

            <button
              onClick={() => setIsEditingEntrega(!isEditingEntrega)}
              className="p-2 bg-gray-800 hover:bg-purple-600 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700 hover:border-purple-500"
              title={isEditingEntrega ? 'Cancelar edição' : 'Editar entrega'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>

          {/* Título e ícone da entrega */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              {entrega.tipo === 'Motion' ? (
                <Package className="w-8 h-8 text-white" />
              ) : (
                <Package className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              {isEditingEntrega ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={entregaNome}
                    onChange={(e) => setEntregaNome(e.target.value)}
                    className="w-full text-xl font-semibold text-white bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                    placeholder="Nome da entrega"
                  />
                  <textarea
                    value={entregaBriefing}
                    onChange={(e) => setEntregaBriefing(e.target.value)}
                    rows={2}
                    className="w-full text-sm text-gray-300 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 resize-none"
                    placeholder="Briefing da entrega"
                  />
                  <button
                    onClick={handleSaveEntrega}
                    className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Salvar Alterações
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-xl font-semibold text-white mb-1">{entrega.nome}</h1>
                      <p className="text-sm text-gray-400">{entrega.briefing}</p>
                    </div>
                    {/* Cronômetro de estimativa da entrega */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 flex items-center gap-2">
                      <Timer className={`w-5 h-5 ${isTotalOverdue ? 'text-red-400' : 'text-purple-400'}`} />
                      <div>
                        <div className="text-xs text-gray-400">Estimativa da Entrega</div>
                        <div className={`text-sm font-semibold font-mono ${
                          isTotalOverdue 
                            ? 'text-red-500 animate-pulse' 
                            : 'text-white'
                        }`}>
                          {isTotalOverdue && '+ '}{formatTotalCountdown(totalCountdown)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs: Briefing e Janela - Compacto */}
          <div className="mb-3">
            <div className="flex gap-1 mb-2 border-b border-gray-700">
              <button
                onClick={() => setActiveTab('briefing')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === 'briefing'
                    ? 'text-purple-400 border-purple-400'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                Briefing
              </button>
              <button
                onClick={() => setActiveTab('exibicao')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === 'exibicao'
                    ? 'text-purple-400 border-purple-400'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                Exibição
              </button>
            </div>

            {/* Conteúdo das Tabs - Compacto */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
              {activeTab === 'briefing' ? (
                <div className="space-y-2.5">
                  {/* Informações Básicas - Grid compacto */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 block mb-0.5">Uso</span>
                      <div className="flex flex-wrap gap-1">
                        {(entrega.uso || '').split(',').map((item, i) => (
                          <span key={i} className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-xs">
                            {item.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Estilo</span>
                      <div className="flex flex-wrap gap-1">
                        {(entrega.estilo || '').split(',').map((item, i) => (
                          <span key={i} className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-xs">
                            {item.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Objetivos</span>
                      <div className="flex flex-wrap gap-1">
                        {(entrega.objetivos || '').split(',').map((item, i) => (
                          <span key={i} className="bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded text-xs">
                            {item.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Tom</span>
                      <div className="flex flex-wrap gap-1">
                        {(entrega.tom || '').split(',').map((item, i) => (
                          <span key={i} className="bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded text-xs">
                            {item.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Técnicas - Compacto em linha */}
                  {entrega.tecnicas && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 block">Técnicas</span>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {entrega.tecnicas.fotografia && entrega.tecnicas.fotografia.length > 0 && (
                          <>
                            {entrega.tecnicas.fotografia.map((tec, i) => (
                              <span key={i} className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                                📷 {tec}
                              </span>
                            ))}
                          </>
                        )}
                        {entrega.tecnicas.gravacao && entrega.tecnicas.gravacao.length > 0 && (
                          <>
                            {entrega.tecnicas.gravacao.map((tec, i) => (
                              <span key={i} className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                                🎥 {tec}
                              </span>
                            ))}
                          </>
                        )}
                        {entrega.tecnicas.audio && entrega.tecnicas.audio.length > 0 && (
                          <>
                            {entrega.tecnicas.audio.map((tec, i) => (
                              <span key={i} className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded border border-green-500/30">
                                🎵 {tec}
                              </span>
                            ))}
                          </>
                        )}
                        {entrega.tecnicas.ilustracao && entrega.tecnicas.ilustracao.length > 0 && (
                          <>
                            {entrega.tecnicas.ilustracao.map((tec, i) => (
                              <span key={i} className="bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded border border-pink-500/30">
                                🎨 {tec}
                              </span>
                            ))}
                          </>
                        )}
                        {entrega.tecnicas.animacao && entrega.tecnicas.animacao.length > 0 && (
                          <>
                            {entrega.tecnicas.animacao.map((tec, i) => (
                              <span key={i} className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/30">
                                ✨ {tec}
                              </span>
                            ))}
                          </>
                        )}
                        {entrega.tecnicas.motion && entrega.tecnicas.motion.length > 0 && (
                          <>
                            {entrega.tecnicas.motion.map((tec, i) => (
                              <span key={i} className="bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30">
                                🎬 {tec}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Estratégia - Compacto */}
                  {entrega.estrategia && (
                    <div className="pt-1 border-t border-gray-700/50">
                      <span className="text-xs text-gray-500 block mb-1">Estratégia</span>
                      <p className="text-xs text-gray-300 leading-snug">{entrega.estrategia}</p>
                    </div>
                  )}

                  {/* Referências - Compacto */}
                  {entrega.referencias && entrega.referencias.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-gray-500">Refs:</span>
                      {entrega.referencias.map((ref, i) => (
                        <a
                          key={i}
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          🔗 Link {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 block mb-0.5">Território</span>
                      <span className="text-white font-medium">{entrega.territorio || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Período</span>
                      <span className="text-white font-medium">{entrega.periodo_utilizacao || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Duração</span>
                      <span className="text-white font-medium">{entrega.duracao || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Idioma</span>
                      <span className="text-white font-medium">{entrega.idioma_original || '-'}</span>
                    </div>
                  </div>

                  {/* Veículos - Compacto */}
                  {entrega.veiculos && entrega.veiculos.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center text-xs">
                      <span className="text-gray-500">Veículos:</span>
                      {entrega.veiculos.map((veiculo, i) => (
                        <span
                          key={i}
                          className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30"
                        >
                          {veiculo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Barra de progresso e tarefas - Compacto */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-white font-semibold">{tarefasConcluidas}/{totalTarefas}</span> tarefas
                </span>
                <span className="text-white font-semibold">{entrega.progresso_percentual}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${entrega.progresso_percentual}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Serviços / Fluxo DND */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            Serviços da Entrega
          </h2>
          <button
            onClick={() => setShowDndFlow(!showDndFlow)}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition-colors flex items-center gap-2 border border-gray-700"
          >
            {showDndFlow ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Ocultar Fluxo
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Exibir Fluxo
              </>
            )}
          </button>
        </div>
        
        {/* Mobile: apenas cards */}
        <div className="md:hidden mb-8">
          <div className="grid grid-cols-1 gap-4">
          {allServices.map((servico) => {
            const tarefasDoServico = servico.tarefas?.length || 0;
            const tarefasConcluidasServico = servico.tarefas?.filter(t => t.status === 'concluida').length || 0;
            const progressoServico = tarefasDoServico > 0 ? Math.round((tarefasConcluidasServico / tarefasDoServico) * 100) : 0;
            const canDelete = ['planejada', 'proxima'].includes(servico.status);

            return (
              <div
                key={servico.id}
                className={`bg-gray-800 border-2 rounded-lg p-4 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer ${
                  selectedServiceId === servico.id ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-gray-700'
                }`}
                onClick={() => handleServiceClick(servico.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white text-lg flex-1">{servico.nome}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      servico.status === 'concluida' ? 'bg-green-500 text-white' :
                      servico.status === 'executando' ? 'bg-blue-500 text-white' :
                      servico.status === 'proxima' ? 'bg-yellow-500 text-white' :
                      'bg-gray-600 text-gray-200'
                    }`}>
                      {servico.status === 'executando' ? 'Em Execução' : 
                       servico.status === 'concluida' ? 'Concluído' : 
                       servico.status === 'proxima' ? 'Aguardando' : 'Planejado'}
                    </span>
                    {canDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteService(servico.id);
                        }}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                        title="Excluir serviço"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {tarefasDoServico} tarefas
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {tarefasConcluidasServico} concluídas
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Progresso</span>
                    <span className="text-white font-bold">{progressoServico}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        progressoServico === 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressoServico}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Desktop/Tablet: apenas DND */}
        {showDndFlow && (
          <div className="hidden md:block mb-8">
            <ServiceFlowCanvas 
              servicos={allServices} 
              onServicesUpdate={(updatedServicos) => {
                console.log('Serviços atualizados:', updatedServicos);
              }}
              onServiceClick={handleServiceClick}
              onServiceDelete={handleDeleteService}
              onAddService={handleAddService}
              onSaveFlow={handleSaveFlow}
            />
          </div>
        )}
      </div>

      {/* Modal de Adicionar Serviço */}
      <AddServiceModal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onAddExisting={handleAddExistingService}
        onCreateNew={handleCreateNewService}
        availableServices={availableServices}
      />

      {/* Seção de Tarefas - Mostra apenas se um serviço estiver selecionado */}
      {selectedServiceId && (
        <div id="servicos-tarefas" className="border-t-4 border-purple-500 bg-gray-950">
          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Tarefas do Serviço
              </h2>
              
              {/* Botões de controle */}
              {isEditMode && editingTasksServiceId === selectedServiceId ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPresetModal(true)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg transition-colors border border-blue-500"
                    title="Adicionar Tarefa"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-lg transition-colors border border-green-500"
                    title="Salvar Alterações"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDiscardChanges}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-red-400 rounded-lg transition-colors border border-red-500"
                    title="Descartar Alterações"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleToggleEditMode(selectedServiceId)}
                  className="p-2 bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700"
                  title="Modo Edição"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>

            {(() => {
              const servicoSelecionado = allServices.find(s => s.id === selectedServiceId);
              if (!servicoSelecionado) return null;

              const tarefas = isEditMode && editingTasksServiceId === selectedServiceId 
                ? editedTasks 
                : (servicoSelecionado.tarefas || []);
              
              return (
                <div className="space-y-3">
                  {tarefas.length > 0 ? (
                    tarefas.map((tarefa, index) => (
                      <TaskItem
                        key={tarefa.id}
                        task={tarefa}
                        onView={handleViewTask}
                        onComplete={handleCompleteTask}
                        isEditMode={isEditMode && editingTasksServiceId === selectedServiceId}
                        onMoveUp={() => handleMoveTaskUp(tarefa.id)}
                        onMoveDown={() => handleMoveTaskDown(tarefa.id)}
                        onEdit={() => handleEditTask(tarefa)}
                        canMoveUp={canMoveTaskUp(index, tarefas)}
                        canMoveDown={index < tarefas.length - 1 && canEditTask(tarefa.status)}
                        canEdit={canEditTask(tarefa.status)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                      <Clock className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <h3 className="text-xl font-semibold text-white mb-2">Nenhuma tarefa cadastrada</h3>
                      <p className="text-gray-400 mb-4">Este serviço ainda não possui tarefas</p>
                      <button 
                        onClick={() => setShowPresetModal(true)}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <Clock className="w-5 h-5" />
                        Criar primeira tarefa
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modais */}
      <TaskViewModal
        isOpen={showTaskViewModal}
        onClose={() => setShowTaskViewModal(false)}
        task={selectedTask}
      />
      <TaskCompletionModal
        isOpen={showTaskCompletionModal}
        onClose={() => setShowTaskCompletionModal(false)}
        task={selectedTask}
      />
      <TaskEditModal
        isOpen={showTaskEditModal}
        onClose={() => setShowTaskEditModal(false)}
        onSave={handleSaveTaskEdit}
        tarefa={taskToEdit || {
          id: '',
          nome: '',
          status: 'planejada',
          prazo_horas: 0,
          setor: 'Criação',
          mandrill_coins: 50
        }}
      />
      <SaveTaskChangesModal
        isOpen={showSaveChangesModal}
        onClose={() => setShowSaveChangesModal(false)}
        onSaveCurrentService={handleSaveCurrentService}
        onSaveAsDefault={handleSaveAsDefault}
      />
      <PresetSelectionModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        onTemplateSelect={(template) => { 
          console.log('Template selecionado:', template); 
          // Aqui você pode adicionar a lógica para criar a tarefa com base no template
          const newTask: Tarefa = {
            id: `task-${Date.now()}`,
            nome: template.nome || 'Nova Tarefa',
            status: 'planejada',
            prazo_horas: template.prazo_horas || 24,
            instrucao: template.descricao,
            responsavel_nome: '',
            setor: template.setor || 'Criação',
            mandrill_coins: template.mandrill_coins || 50
          };
          handleAddNewTask(newTask);
          setShowPresetModal(false);
        }}
        onCustomTask={() => { 
          console.log('Criar tarefa personalizada');
          // Abrir o modal de edição com uma tarefa vazia
          const newTask: Tarefa = {
            id: `task-${Date.now()}`,
            nome: '',
            status: 'planejada',
            prazo_horas: 24,
            setor: 'Criação',
            mandrill_coins: 50
          };
          setEditedTasks([...editedTasks, newTask]);
          setTaskToEdit(newTask);
          setShowTaskEditModal(true);
          setShowPresetModal(false);
        }}
      />
    </div>
  );
}
