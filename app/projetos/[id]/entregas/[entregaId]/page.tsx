'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, DollarSign, Calendar, Layers, Target, CheckCircle, Clock, LayoutGrid, GitBranch, User, Building, Timer, X, ChevronUp, ChevronDown, Edit2, Plus, Save } from 'lucide-react';
import PresetSelectionModal from '../../../../components/PresetSelectionModal';
import TaskViewModal from '../../../../components/TaskViewModal';
import TaskCompletionModal from '../../../../components/TaskCompletionModal';
import TaskEditModal from '../../../../components/TaskEditModal';
import SaveTaskChangesModal from '../../../../components/SaveTaskChangesModal';
import ServiceFlowCanvas from '../../../../components/ServiceFlowCanvas';
import AddServiceModal from '../../../../components/AddServiceModal';
import ConfirmModal from '../../../../components/ConfirmModal';
import AlertModal from '../../../../components/AlertModal';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { mandrillApi } from '@/lib/mandrill-api';

type Status = 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';

interface Tarefa {
  id: string; // execucao_id
  nome: string; // template.template_titulo
  status: Status; // Mapear execucao_status
  ordem?: number; // execucao_ordem
  setor: string; // execucao_setor_id
  responsavel_usuario?: string | null;
  responsavel_nome?: string | null;
  responsavel_tipo?: string; // execucao_pessoa_tipo
  prazo_horas: number; // execucao_prazo_deadline (converter minutos para horas se necessário)
  duracao_segundos?: number; // execucao_tempo_minutos (converter para segundos)
  mandrill_coins: number; // execucao_coins
  instrucao?: string; // execucao_observacao
  templates?: any[];
  data_inicio?: string; // execucao_start_at
  data_fim?: string; // execucao_finish_at
  tempo_execucao?: number; // execucao_tempo_minutos
  resultado?: any; // execucao_sucesso
  // Campos originais da API
  execucao_demanda_id?: string;
  execucao_template_id?: string;
  execucao_tipo?: string;
  execucao_tipo_id?: string;
  template?: any; // Dados do template
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
  
  // 🔥 Estados para dados da API
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'cards' | 'flow'>('cards');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);
  const [isEditingEntrega, setIsEditingEntrega] = useState(false);
  const [entregaNome, setEntregaNome] = useState('');
  const [entregaBriefing, setEntregaBriefing] = useState('');
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

  // 🔥 Estado para guardar posições e conexões do board
  const [boardData, setBoardData] = useState<any[]>([]);
  
  // 🔥 NOVO: Ref para callback que notifica mudanças ao adicionar serviço
  const onServiceAddedRef = useRef<(() => void) | null>(null);
  
  // Estados dos modais customizados
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'success' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'success' | 'info' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });
  
  // 🔥 Função para mapear status da API para nosso formato
  const mapearStatusTarefa = (execucaoStatus: string): Status => {
    const statusMap: Record<string, Status> = {
      'planejamento': 'planejada',
      'aguardando': 'proxima',
      'executando': 'executando',
      'pausada': 'pausada',
      'atrasada': 'atrasada',
      'concluida': 'concluida',
      'concluído': 'concluida',
    };
    return statusMap[execucaoStatus?.toLowerCase()] || 'planejada';
  };

  // Função para mapear tarefa da API para nossa interface
  const mapearTarefa = (tarefaAPI: any): Tarefa => {
    // Extrair nome do responsável
    const responsavelNome = tarefaAPI.pessoa?.pessoa_nome || tarefaAPI.pessoa?.nome || '';
    
    // Extrair nome do setor
    const setorNome = tarefaAPI.execucao_setor?.setor_nome || tarefaAPI.setor_nome || '';
    
    return {
      id: tarefaAPI.execucao_id,
      nome: tarefaAPI.template?.template_titulo || tarefaAPI.execucao_titulo || 'Tarefa sem nome',
      status: mapearStatusTarefa(tarefaAPI.execucao_status),
      ordem: tarefaAPI.execucao_ordem,
      setor: setorNome,
      responsavel_nome: responsavelNome,
      responsavel_tipo: tarefaAPI.execucao_pessoa_tipo,
      responsavel_usuario: tarefaAPI.execucao_pessoa_tipo_id,
      prazo_horas: (tarefaAPI.execucao_prazo_deadline || 0) / 60, // Converter minutos para horas
      duracao_segundos: (tarefaAPI.execucao_tempo_minutos || 0) * 60, // Converter minutos para segundos
      mandrill_coins: tarefaAPI.execucao_coins || 0,
      instrucao: tarefaAPI.execucao_observacao || tarefaAPI.template?.template_observacoes,
      data_inicio: tarefaAPI.execucao_start_at,
      data_fim: tarefaAPI.execucao_finish_at,
      tempo_execucao: tarefaAPI.execucao_tempo_minutos,
      resultado: tarefaAPI.execucao_sucesso,
      execucao_demanda_id: tarefaAPI.execucao_demanda_id,
      execucao_template_id: tarefaAPI.execucao_template_id,
      execucao_tipo: tarefaAPI.execucao_tipo,
      execucao_tipo_id: tarefaAPI.execucao_tipo_id,
      template: tarefaAPI.template,
    };
  };

  // 🔥 Função para calcular progresso de um serviço baseado nas tarefas
  const calcularProgressoServico = (tarefas: Tarefa[]): number => {
    if (!tarefas || tarefas.length === 0) return 0;
    const concluidas = tarefas.filter(t => t.status === 'concluida').length;
    return Math.round((concluidas / tarefas.length) * 100);
  };

  // 🔥 Buscar dados da entrega quando componente montar
  useEffect(() => {
    async function carregarEntrega() {
      try {
        setIsLoading(true);
        setError(null);
        
        const resposta = await mandrillApi.getEntregaDetalhada(entregaId);
        const dados = resposta.data;
        
        const servicos = dados.servicos || [];
        
        // Extrair boards dos serviços E da entrega (sistema: orcamento/entrega)
        const boardsFromAPI: any[] = [];
        
        // 1. Boards da própria entrega (Início/Fim - sistema)
        if (dados.boards && Array.isArray(dados.boards)) {
          dados.boards.forEach((board: any) => {
            boardsFromAPI.push(board);
          });
        }
        
        // 2. Boards dos serviços
        servicos.forEach((servico: any) => {
          // Suportar tanto 'board' (singular) quanto 'boards' (plural)
          const boardsList = servico.boards 
            ? (Array.isArray(servico.boards) ? servico.boards : [servico.boards])
            : (servico.board ? [servico.board] : []);
          
          boardsList.forEach((board: any) => {
            boardsFromAPI.push({
              ...board,
              _servico_id: servico.proj_servico_id,
              _servico_titulo: servico.proj_servico_titulo,
            });
          });
        });
        
        console.log(`Entrega carregada: ${servicos.length} serviços, ${boardsFromAPI.length} boards`);
        
        setBoardData(boardsFromAPI);
        
        // Mapear dados da API para o formato do componente
        const respostaData = dados.entrega_resposta?.data || dados.entrega_resposta || {};
        const titulo = dados.entrega_titulo || dados.titulo || dados.nome || dados.entrega_nome || 'Sem título';
        const descricao = respostaData.description || dados.entrega_descricao || dados.descricao || dados.briefing || '';
        
        const entregaMapeada: Entrega = {
          id: dados.entrega_id || entregaId,
          nome: titulo,
          briefing: descricao,
          status: 'planejada', // TODO: definir status real
          progresso_percentual: 0, // TODO: calcular progresso
          tipo: respostaData.tipoProducao || dados.tipo || '',
          projeto_id: projetoId,
          
          // Dados de Briefing
          uso: respostaData.uso || '',
          estilo: respostaData.estilo || '',
          objetivos: respostaData.objetivos || '',
          tom: respostaData.tom || '',
          tecnicas: respostaData.tecnica || respostaData.tecnicas || {},
          estrategia: respostaData.estrategia || '',
          referencias: respostaData.referencias || [],
          
          // Dados de Janela
          territorio: respostaData.territorio || '',
          veiculos: respostaData.veiculosDivulgacao || [],
          periodo_utilizacao: respostaData.periodo?.quantidade || '',
          duracao: respostaData.duracaoFilme?.quantidade 
            ? `${respostaData.duracaoFilme.quantidade} ${respostaData.duracaoFilme.unidade}`
            : '',
          idioma_original: respostaData.idioma || '',
          
          // 🔥 Serviços da API mapeados - buscar tarefas em paralelo
          servicos: [], // Será preenchido abaixo
        };
        
        // Buscar tarefas de todos os serviços em paralelo
        console.log('📋 Buscando tarefas dos serviços...');
        const servicosComTarefas = await Promise.all(
          servicos.map(async (s: any) => {
            // Validar se serviço tem ID
            if (!s.proj_servico_id) {
              console.warn('⚠️  Serviço da API sem proj_servico_id, pulando:', s);
              return null; // Retornar null para filtrar depois
            }
            
            try {
              const tarefasResponse = await mandrillApi.getTarefasServico(s.proj_servico_id);
              const tarefasMapeadas = (tarefasResponse.data || []).map(mapearTarefa);
              
              return {
                id: s.proj_servico_id,
                nome: s.proj_servico_titulo || 'Serviço sem título',
                status: 'planejada' as Status,
                progresso_percentual: calcularProgressoServico(tarefasMapeadas),
                tarefas: tarefasMapeadas,
              };
            } catch (error) {
              return {
                id: s.proj_servico_id,
                nome: s.proj_servico_titulo || 'Serviço sem título',
                status: 'planejada' as Status,
                progresso_percentual: 0,
                tarefas: [],
              };
            }
          })
        );
        
        // Filtrar nulls (serviços sem ID)
        const servicosValidos = servicosComTarefas.filter(s => s !== null);
        
        // Adicionar serviços com tarefas à entrega
        entregaMapeada.servicos = servicosValidos;
        
        const totalTarefas = servicosValidos.reduce((acc, s) => acc + (s.tarefas?.length || 0), 0);
        console.log(`✅ ${totalTarefas} tarefas carregadas de ${servicosValidos.length} serviços`);
        
        setEntrega(entregaMapeada);
        setEntregaNome(entregaMapeada.nome);
        setEntregaBriefing(entregaMapeada.briefing);
        
      } catch (err: any) {
        console.error('❌ Erro ao carregar entrega:', err);
        setError(err.message || 'Erro ao carregar entrega');
      } finally {
        setIsLoading(false);
      }
    }
    
    carregarEntrega();
  }, [entregaId, projetoId]);

  const handleBackToProject = () => {
    router.push(`/projetos/${projetoId}`);
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
    // Aqui você implementaria a lógica de salvar apenas neste serviço
    setIsEditMode(false);
    setEditingTasksServiceId(null);
    setEditedTasks([]);
  };

  const handleSaveAsDefault = () => {
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

  const handleDeleteService = async (nodeId: string) => {
    // 🔍 LOG: Iniciando exclusão
    console.group('🗑️  [BOARD] Deletando Node do Board');
    console.log('📦 Node ID:', nodeId);
    console.log('📊 Boards disponíveis:', boardData);
    
    // Buscar o board correspondente ao node - aceita QUALQUER tipo (servico, orcamento, entrega)
    const boardToDelete = boardData.find((b: any) => 
      b.board_node_id === nodeId || b.board_entidade_id === nodeId
    );
    
    if (!boardToDelete) {
      console.warn('⚠️  Board não encontrado para este node');
      console.groupEnd();
      setAlertModal({
        isOpen: true,
        title: 'Board não encontrado',
        message: 'Não foi possível encontrar o board deste item.',
        type: 'warning',
      });
      return;
    }
    
    console.log('🎯 Board encontrado:', {
      board_id: boardToDelete.board_id,
      board_entidade: boardToDelete.board_entidade,
      board_entidade_id: boardToDelete.board_entidade_id,
      board_node_id: boardToDelete.board_node_id,
    });
    
    if (!boardToDelete.board_id) {
      console.warn('⚠️  Board não possui board_id, não foi salvo ainda');
      console.groupEnd();
      setAlertModal({
        isOpen: true,
        title: 'Item não salvo',
        message: 'Este item ainda não foi salvo no board.',
        type: 'warning',
      });
      return;
    }
    
    // Buscar o nome do item para mostrar na confirmação
    let itemNome = 'este item';
    if (boardToDelete.board_entidade === 'servico') {
      const servico = allServices.find(s => s.id === boardToDelete.board_entidade_id);
      itemNome = servico?.nome || 'este serviço';
    } else if (boardToDelete.board_entidade === 'orcamento') {
      itemNome = 'Orçamento Aprovado';
    } else if (boardToDelete.board_entidade === 'entrega') {
      itemNome = 'Entrega Final';
    }
    
    // Modal de confirmação
    setConfirmModal({
      isOpen: true,
      title: 'Remover do Board',
      message: `Tem certeza que deseja remover "${itemNome}" do board?\n\n⚠️  Isso apenas remove do fluxo visual, não deleta o item em si.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          console.log(`🗑️  Deletando board_id: ${boardToDelete.board_id}`);
          
          setIsSaving(true); // Ativar spinner
          
          // Deletar no backend
          await mandrillApi.deletarBoard(boardToDelete.board_id);
          
          // Remover do boardData local
          const boardsAtualizados = boardData.filter((b: any) => b.board_id !== boardToDelete.board_id);
          setBoardData(boardsAtualizados);
          
          console.log('✅ Board deletado com sucesso!');
          console.log(`📊 Boards restantes: ${boardsAtualizados.length}`);
          console.groupEnd();
          
          setIsSaving(false);
          
          setAlertModal({
            isOpen: true,
            title: 'Sucesso!',
            message: 'Item removido do board com sucesso!',
            type: 'success',
          });
          
        } catch (error: any) {
          console.error('❌ Erro ao deletar board:', error);
          console.error('Stack trace:', error.stack);
          console.groupEnd();
          
          setIsSaving(false);
          
          const mensagemErro = error.response?.data?.message 
            || error.message 
            || 'Erro desconhecido ao deletar board';
          
          setAlertModal({
            isOpen: true,
            title: 'Erro ao deletar',
            message: `Erro ao deletar item do board:\n\n${mensagemErro}`,
            type: 'error',
          });
        }
      },
    });
  };

  // Estado para gerenciar serviços adicionados dinamicamente
  const [dynamicServices, setDynamicServices] = useState<Servico[]>([]);

  // 🔥 TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER RETURN CONDICIONAL
  // Countdown da estimativa da entrega em tempo real
  const [totalCountdown, setTotalCountdown] = useState<number>(0);
  const [isTotalOverdue, setIsTotalOverdue] = useState(false);

  // Combinar serviços estáticos com dinâmicos (sempre executar, mesmo se entrega for null)
  // Filtrar serviços sem ID válido (pode acontecer se API retornar sem proj_servico_id)
  const allServices = [...(entrega?.servicos || []), ...dynamicServices].filter(s => s.id && s.id !== 'undefined');

  // useEffect do countdown
  useEffect(() => {
    if (!entrega) return; // early return dentro de useEffect é permitido
    
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
  }, [allServices, entrega]);

  // 🔥 AGORA SIM, DEPOIS DE TODOS OS HOOKS, PODEMOS TER EARLY RETURNS
  
  // Loading state
  if (isLoading || !entrega) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando entrega...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <p className="text-red-500 mb-4">❌ {error}</p>
          <button
            onClick={() => router.push(`/projetos/${projetoId}`)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Voltar ao Projeto
          </button>
        </div>
      </div>
    );
  }

  // Handlers
  const handleAddService = () => {
    setShowAddServiceModal(true);
  };

  const handleAddExistingService = (serviceId: string) => {
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
    // Validação: nome obrigatório
    if (!serviceName.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Nome obrigatório',
        message: 'O serviço precisa ter um título.',
        type: 'warning',
      });
      return;
    }

    // 🔥 Criar UUID temporário único (será substituído no backend)
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar novo serviço temporário (só frontend)
    const newService: Servico = {
      id: tempId,
      nome: serviceName,
      status: 'planejada',
      progresso_percentual: 0,
      tarefas: [], // Sem tarefas iniciais
    };

    // Adicionar aos serviços dinâmicos (só visual)
    setDynamicServices(prev => [...prev, newService]);
    
    console.log('✅ Serviço temporário criado:', {
      id: tempId,
      nome: serviceName,
      nota: 'Será salvo no backend ao clicar em Salvar Fluxo'
    });
    
    // 🔥 NOVO: Notificar ServiceFlowCanvas que há mudanças pendentes
    // Isso será feito passando um callback que ativa hasChanges
    if (onServiceAddedRef.current) {
      onServiceAddedRef.current();
    }
    
    setShowAddServiceModal(false);
  };

  const handleCancelFlow = () => {
    setDynamicServices([]);
    setAlertModal({
      isOpen: true,
      title: 'Alterações descartadas',
      message: 'Os serviços não salvos foram removidos.',
      type: 'info',
    });
  };

  const handleSaveFlow = async (nodes: any[], edges: any[]) => {
    try {
      console.log(`💾 Salvando fluxo: ${nodes.length} nodes, ${edges.length} edges`);
      
      // ✅ Validação: Verificar se há nodes para salvar
      if (nodes.length === 0) {
        setAlertModal({
          isOpen: true,
          title: 'Nada para salvar',
          message: 'Não há serviços no board para salvar.',
          type: 'warning',
        });
        return;
      }
      
      setIsSaving(true);
      
      // 🔥 ETAPA 1: Criar serviços novos (temporários) no backend
      const servicosNovos: any[] = [];
      const servicosTemporarios = new Map<string, any>();
      
      for (const node of nodes) {
        if (node.id.startsWith('temp-')) {
          const servico = allServices.find(s => s.id === node.id);
          if (servico) {
            servicosNovos.push({
              tempId: node.id,
              nome: servico.nome,
              position: node.position,
            });
          }
        }
      }
      
      // Criar serviços novos no backend
      if (servicosNovos.length > 0) {
        console.log(`📝 Criando ${servicosNovos.length} novo(s) serviço(s)...`);
        
        for (const novoServico of servicosNovos) {
          const servicoCriado = await mandrillApi.criarServico({
            proj_entrega: entregaId,
            proj_servico_prazo: 0,
            proj_servico_titulo: novoServico.nome,
          });
          
          servicosTemporarios.set(novoServico.tempId, {
            ...servicoCriado,
            position: novoServico.position,
          });
        }
        
        console.log(`✅ Serviços criados com sucesso`);
      }
      
      const boardsToSave: any[] = [];
      
      // ETAPA 2: Processar todos os nodes do canvas atual
      for (const node of nodes) {
        let nodeId = node.id;
        const { position } = node;
        
        if (!nodeId || !position) continue;
        
        // Se for node temporário, trocar pelo ID real do backend
        if (nodeId.startsWith('temp-')) {
          const servicoReal = servicosTemporarios.get(nodeId);
          if (!servicoReal) continue;
          nodeId = servicoReal.proj_servico_id;
        }
        
        // Buscar board no boardData para pegar tipo/entidade
        const boardExistente = boardData.find((b: any) => 
          b.board_node_id === nodeId || b.board_node_id === node.id
        );
        
        // Determinar tipo do board
        let board_tipo = 'servico';
        if (boardExistente) {
          board_tipo = boardExistente.board_tipo || boardExistente.board_entidade || 'servico';
        }
        
        // Encontrar conexões de saída
        const outgoingEdges = edges.filter((edge: any) => edge.source === node.id);
        const board_next_ids = outgoingEdges.map((e: any) => {
          let targetId = e.target;
          if (targetId.startsWith('temp-')) {
            const targetReal = servicosTemporarios.get(targetId);
            if (targetReal) targetId = targetReal.proj_servico_id;
          }
          return targetId;
        }).filter(Boolean);
        
        // Criar payload do board
        const boardPayload: any = {
          board_node_id: nodeId,
          board_position_x: Math.round(position.x),
          board_position_y: Math.round(position.y),
          board_next: board_next_ids.length > 0 ? board_next_ids : null,
          board_tipo: board_tipo,
        };
        
        boardsToSave.push(boardPayload);
      }
      
      // Validação: verificar se há boards para salvar
      if (boardsToSave.length === 0) {
        setIsSaving(false);
        setAlertModal({
          isOpen: true,
          title: 'Nada para salvar',
          message: 'Nenhum board válido encontrado para salvar.',
          type: 'warning',
        });
        return;
      }
      
      console.log(`💾 Salvando ${boardsToSave.length} boards:`, boardsToSave.map(b => ({
        node_id: b.board_node_id,
        tipo: b.board_tipo,
        pos: `(${b.board_position_x},${b.board_position_y})`
      })));
      
      // Separar boards de sistema (orcamento/entrega) dos boards de serviço
      const boardsServico = boardsToSave.filter(b => b.board_tipo === 'servico');
      const boardsSistema = boardsToSave.filter(b => b.board_tipo === 'orcamento' || b.board_tipo === 'entrega');
      
      console.log(`  📊 ${boardsServico.length} serviços, ${boardsSistema.length} sistema`);
      
      // Salvar cada board individualmente
      const resultados = [];
      
      // 1. PRIMEIRO: Salvar boards de serviços (para garantir que existam quando os de sistema referenciarem)
      for (const boardPayload of boardsServico) {
        const boardOriginal = boardData.find((b: any) => b.board_node_id === boardPayload.board_node_id);
        const entidadeId = boardOriginal?.board_entidade_id || boardPayload.board_node_id;
        
        console.log(`  → Salvando serviço (${boardPayload.board_node_id}): entidade=servico, entidadeId=${entidadeId}`);
        
        try {
          const resposta = await mandrillApi.salvarBoard('servico', entidadeId, boardPayload);
          console.log(`    ✅ Serviço salvo`);
          resultados.push(resposta);
        } catch (error: any) {
          console.error(`    ❌ Erro ao salvar serviço:`, error.message);
          throw error;
        }
      }
      
      // 2. DEPOIS: Salvar boards de sistema (orcamento/entrega)
      for (const boardPayload of boardsSistema) {
        console.log(`  → Salvando sistema ${boardPayload.board_tipo} (${boardPayload.board_node_id}): entidade=entrega, entidadeId=${entregaId}`);
        
        try {
          const resposta = await mandrillApi.salvarBoard('entrega', entregaId, boardPayload);
          console.log(`    ✅ Sistema salvo`);
          resultados.push(resposta);
        } catch (error: any) {
          console.error(`    ❌ Erro ao salvar sistema:`, error.message);
          throw error;
        }
      }
      
      console.log(`✅ Todos os boards salvos`);
      
      // Aguardar backend processar e persistir no banco
      console.log('⏳ Aguardando backend processar (2 segundos)...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Recarregar dados do backend (com cache-busting para garantir dados frescos)
      console.log('🔄 Recarregando dados do backend...');
      const respostaAtualizada = await mandrillApi.getEntregaDetalhada(entregaId, true);
      const dadosAtualizados = respostaAtualizada.data;
      
      console.log('🔍 DADOS BRUTOS DO BACKEND:', {
        tem_boards: !!dadosAtualizados.boards,
        boards_tipo: dadosAtualizados.boards ? typeof dadosAtualizados.boards : 'undefined',
        boards_array: Array.isArray(dadosAtualizados.boards),
        boards_length: dadosAtualizados.boards?.length,
        boards_completo: dadosAtualizados.boards,
        servicos_count: dadosAtualizados.servicos?.length || 0,
      });
      
      const servicos = dadosAtualizados.servicos || [];
      
      // Extrair boards (da entrega + serviços)
      const boardsFromAPI: any[] = [];
      
      // 1. Boards da própria entrega (Início/Fim - sistema)
      if (dadosAtualizados.boards && Array.isArray(dadosAtualizados.boards)) {
        console.log(`  📦 Boards da entrega: ${dadosAtualizados.boards.length}`);
        dadosAtualizados.boards.forEach((board: any) => {
          boardsFromAPI.push(board);
          console.log(`    - ${board.board_tipo}: node_id=${board.board_node_id}`);
        });
      } else {
        console.log(`  ⚠️ Nenhum board na entrega (dadosAtualizados.boards)`);
        console.log(`     Tipo recebido: ${typeof dadosAtualizados.boards}`);
        console.log(`     Valor: ${JSON.stringify(dadosAtualizados.boards)}`);
      }
      
      // 2. Boards dos serviços
      console.log(`  📦 Processando boards de ${servicos.length} serviços...`);
      servicos.forEach((servico: any) => {
        if (servico.boards && Array.isArray(servico.boards)) {
          servico.boards.forEach((board: any) => {
            boardsFromAPI.push({
              ...board,
              _servico_titulo: servico.proj_servico_titulo,
            });
            console.log(`    - servico: node_id=${board.board_node_id}`);
          });
        } else if (servico.board) {
          // Suportar board singular também
          boardsFromAPI.push({
            ...servico.board,
            _servico_titulo: servico.proj_servico_titulo,
          });
          console.log(`    - servico (singular): node_id=${servico.board.board_node_id}`);
        }
      });
      
      // Proteger contra perda de dados
      if (boardsFromAPI.length === 0) {
        console.warn('⚠️ Backend não retornou boards - mantendo estado atual');
      } else {
        console.log(`✅ ${boardsFromAPI.length} boards recuperados do backend`);
        setBoardData(boardsFromAPI);
      }
      
      // IMPORTANTE: Atualizar a entrega com os novos serviços
      const respostaData = dadosAtualizados.entrega_resposta?.data || dadosAtualizados.entrega_resposta || {};
      const titulo = dadosAtualizados.entrega_titulo || dadosAtualizados.titulo || dadosAtualizados.nome || dadosAtualizados.entrega_nome || 'Sem título';
      const descricao = respostaData.description || dadosAtualizados.entrega_descricao || dadosAtualizados.descricao || dadosAtualizados.briefing || '';
      
      // Buscar tarefas dos serviços atualizados
      console.log('📋 Recarregando tarefas dos serviços...');
      const servicosComTarefas = await Promise.all(
        servicos.map(async (s: any) => {
          if (!s.proj_servico_id) return null;
          
          try {
            const tarefasResponse = await mandrillApi.getTarefasServico(s.proj_servico_id);
            const tarefasMapeadas = (tarefasResponse.data || []).map(mapearTarefa);
            
            return {
              id: s.proj_servico_id,
              nome: s.proj_servico_titulo || 'Serviço sem título',
              status: 'planejada' as Status,
              progresso_percentual: calcularProgressoServico(tarefasMapeadas),
              tarefas: tarefasMapeadas,
            };
          } catch (error) {
            return {
              id: s.proj_servico_id,
              nome: s.proj_servico_titulo || 'Serviço sem título',
              status: 'planejada' as Status,
              progresso_percentual: 0,
              tarefas: [],
            };
          }
        })
      );
      
      const servicosValidos = servicosComTarefas.filter(s => s !== null);
      
      const entregaMapeada: Entrega = {
        id: dadosAtualizados.entrega_id || entregaId,
        nome: titulo,
        briefing: descricao,
        status: 'planejada',
        progresso_percentual: 0,
        tipo: respostaData.tipoProducao || dadosAtualizados.tipo || '',
        projeto_id: projetoId,
        
        // Dados de Briefing
        uso: respostaData.uso || '',
        estilo: respostaData.estilo || '',
        objetivos: respostaData.objetivos || '',
        tom: respostaData.tom || '',
        tecnicas: respostaData.tecnica || respostaData.tecnicas || {},
        estrategia: respostaData.estrategia || '',
        referencias: respostaData.referencias || [],
        
        // Dados de Janela
        territorio: respostaData.territorio || '',
        veiculos: respostaData.veiculosDivulgacao || [],
        periodo_utilizacao: respostaData.periodo?.quantidade || '',
        duracao: respostaData.duracaoFilme?.quantidade 
          ? `${respostaData.duracaoFilme.quantidade} ${respostaData.duracaoFilme.unidade}`
          : '',
        idioma_original: respostaData.idioma || '',
        
        // Serviços com tarefas atualizadas
        servicos: servicosValidos,
      };
      
      setEntrega(entregaMapeada);
      
      // Limpar serviços dinâmicos (temporários)
      setDynamicServices([]);
      
      console.log('✅ Fluxo salvo com sucesso!');
      
      setIsSaving(false);
      
      setAlertModal({
        isOpen: true,
        title: 'Sucesso!',
        message: 'Fluxo salvo com sucesso!',
        type: 'success',
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar fluxo:', error.message);
      
      setIsSaving(false);
      
      const mensagemErro = error.response?.data?.message 
        || error.message 
        || 'Erro desconhecido ao salvar fluxo';
      
      setAlertModal({
        isOpen: true,
        title: 'Erro ao salvar',
        message: `Erro ao salvar fluxo:\n\n${mensagemErro}`,
        type: 'error',
      });
    }
  };

  const handleSaveEntrega = () => {
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

  // 🔥 Helper: Normalizar dados que podem vir como string ou array
  const toArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  // 🔥 Verificar loading e entrega
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando entrega...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ Erro</div>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!entrega) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Entrega não encontrada</p>
        </div>
      </div>
    );
  }

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
                      <h1 className="text-xl font-semibold text-white mb-1">{entregaNome || 'Sem título'}</h1>
                      <p className="text-sm text-gray-400">{entregaBriefing || 'Sem descrição'}</p>
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
                        {toArray(entrega.uso).map((item, i) => (
                          <span key={i} className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Estilo</span>
                      <div className="flex flex-wrap gap-1">
                        {toArray(entrega.estilo).map((item, i) => (
                          <span key={i} className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Objetivos</span>
                      <div className="flex flex-wrap gap-1">
                        {toArray(entrega.objetivos).map((item, i) => (
                          <span key={i} className="bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Tom</span>
                      <div className="flex flex-wrap gap-1">
                        {toArray(entrega.tom).map((item, i) => (
                          <span key={i} className="bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded text-xs">
                            {item}
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
          {allServices.map((servico, index) => {
            const tarefasDoServico = servico.tarefas?.length || 0;
            const tarefasConcluidasServico = servico.tarefas?.filter(t => t.status === 'concluida').length || 0;
            const progressoServico = tarefasDoServico > 0 ? Math.round((tarefasConcluidasServico / tarefasDoServico) * 100) : 0;
            const canDelete = ['planejada', 'proxima'].includes(servico.status);
            
            const statusLabel = servico.status === 'executando' ? 'Em Execução' : 
                               servico.status === 'concluida' ? 'Concluído' : 
                               servico.status === 'proxima' ? 'Aguardando' : 'Planejado';
            
            const statusColor = servico.status === 'concluida' ? 'bg-green-500 text-white' :
                               servico.status === 'executando' ? 'bg-blue-500 text-white' :
                               servico.status === 'proxima' ? 'bg-yellow-500 text-white' :
                               'bg-gray-600 text-gray-200';

            return (
              <div
                key={servico.id || `servico-${index}`}
                className={`bg-gray-800 border-2 rounded-lg p-4 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer ${
                  selectedServiceId === servico.id ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-gray-700'
                }`}
                onClick={() => handleServiceClick(servico.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white text-lg flex-1">{servico.nome}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                      {statusLabel}
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
        {showDndFlow && !isSaving && (
          <div className="hidden md:block mb-8">
            <ServiceFlowCanvas 
              servicos={allServices}
              boardData={boardData}
              onServicesUpdate={(updatedServicos) => {
              }}
              onServiceClick={handleServiceClick}
              onServiceDelete={handleDeleteService}
              onAddService={handleAddService}
              onSaveFlow={handleSaveFlow}
              onCancelFlow={handleCancelFlow}
              selectedServiceId={selectedServiceId}
              onServiceAddedRef={onServiceAddedRef}
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
      {selectedServiceId && (() => {
        const servicoSelecionado = allServices.find(s => s.id === selectedServiceId);
        const nomeServico = servicoSelecionado?.nome || 'Serviço';
        
        return (
          <div id="servicos-tarefas" className="border-t-4 border-purple-500 bg-gray-950">
            <div className="max-w-7xl mx-auto p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Tarefas {nomeServico}
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
                if (!servicoSelecionado) return null;

                const tarefas = isEditMode && editingTasksServiceId === selectedServiceId 
                  ? editedTasks 
                  : (servicoSelecionado.tarefas || []);
                
                return (
                  <div className="space-y-3">
                    {tarefas.length > 0 ? (
                      tarefas.map((tarefa, index) => (
                        <TaskItem
                          key={tarefa.id || `tarefa-${index}`}
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
        );
      })()}

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Modal de Alerta */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

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

      {/* Overlay de salvamento - Tela toda com desfoque */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-700 max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-6"></div>
              <h3 className="text-white text-xl font-semibold mb-2">Salvando fluxo</h3>
              <p className="text-gray-400 text-sm">Aguarde enquanto processamos suas alterações...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
