'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjetos, type Projeto } from '../hooks/useProjetos';
import { 
  RefreshCw, Clock, Building, Flag, Calendar, 
  TrendingUp, AlertCircle, CheckCircle, Package, Users,
  ArrowUpDown, ArrowUp, ArrowDown, CalendarClock, SortAsc, Layers
} from 'lucide-react';
import ProjectDetail from './ProjectDetail';
import TaskViewModal from './TaskViewModal';

// Componente de Card de Projeto no estilo da imagem
const ProjectCard: React.FC<{
  project: Projeto;
  onClick: (project: Projeto) => void;
}> = ({ project, onClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar tempo a cada segundo para o countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Função para calcular e formatar o countdown
  const formatCountdown = () => {
    // Verifica se existe prazo_data
    if (!project.prazo_data) {
      return null;
    }

    // Tenta parsear a data - pode vir como ISO ou apenas data (YYYY-MM-DD)
    let prazo: Date;
    try {
      // Se é apenas data, adiciona horário para evitar problemas de timezone
      if (project.prazo_data.includes('T')) {
        prazo = new Date(project.prazo_data);
      } else {
        // Adiciona T23:59:59 para considerar fim do dia
        prazo = new Date(`${project.prazo_data}T23:59:59`);
      }
      
      // Verifica se é data válida
      if (isNaN(prazo.getTime())) {
        console.warn('Data inválida:', project.prazo_data);
        return null;
      }
    } catch (e) {
      console.warn('Erro ao parsear prazo_data:', project.prazo_data, e);
      return null;
    }

    const diffMs = prazo.getTime() - currentTime.getTime();
    
    // Se o prazo já passou
    if (diffMs <= 0) {
      const absDiffMs = Math.abs(diffMs);
      const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((absDiffMs % (1000 * 60)) / 1000);
      
      return {
        display: `${days.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        color: 'text-red-500',
        label: 'ATRASADO'
      };
    }

    // Countdown normal
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    // Cores baseadas no tempo restante
    let color = 'text-green-400'; // > 7 dias
    if (days < 7 && days >= 3) {
      color = 'text-yellow-400'; // 3-7 dias
    } else if (days < 3) {
      color = 'text-orange-400'; // < 3 dias
    }

    return {
      display: `${days.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      color,
      label: 'PRAZO'
    };
  };

  const countdown = formatCountdown();
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'concluida': 
        return { 
          label: 'Concluída', 
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: <CheckCircle className="w-3 h-3" />
        };
      case 'executando': 
        return { 
          label: 'Executando', 
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: <TrendingUp className="w-3 h-3" />
        };
      case 'atrasada': 
        return { 
          label: 'Atrasada', 
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: <AlertCircle className="w-3 h-3" />
        };
      case 'pausada': 
        return { 
          label: 'Pausada', 
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: <Clock className="w-3 h-3" />
        };
      case 'preparacao': 
        return { 
          label: 'Preparação', 
          color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          icon: <Clock className="w-3 h-3" />
        };
      default: 
        return { 
          label: 'Planejada', 
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: <Clock className="w-3 h-3" />
        };
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'executando':
        return 'bg-gradient-to-r from-purple-500 to-blue-500'; // Gradiente roxo para azul
      case 'atrasada':
        return 'bg-gradient-to-r from-red-500 to-red-600'; // Gradiente vermelho
      case 'pausada':
      case 'preparacao':
      default:
        return 'bg-gradient-to-r from-purple-500 to-blue-500'; // Gradiente padrão roxo/azul
    }
  };



  return (
    <div 
      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-2 hover:border-gray-600/50 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer group"
      onClick={() => onClick(project)}
    >
      {/* Header com código e data */}
      <div className="flex items-start justify-between gap-4 mb-0.5">
        {/* Conteúdo principal (esquerda) */}
        <div className="flex-1 min-w-0">
          {/* Header simples com apenas código */}
          <div className="mb-0.5">
            <div className="text-base font-bold text-white">
              {project.demanda_codigo}
            </div>
          </div>

          {/* Cliente e campanha com fonte mais cinza e espaçamento mínimo */}
          <div className="flex items-center gap-0.5 text-gray-500">
            <div className="flex items-center gap-1">
              <Building className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="text-xs truncate">{project.cliente_nome}</span>
            </div>
            <span className="text-gray-600">•</span>
            <div className="flex items-center gap-0.5">
              <Flag className="w-3 h-3 text-orange-400 flex-shrink-0" />
              <span className="text-xs truncate">{project.motivo}</span>
            </div>
          </div>
        </div>

        {/* Countdown de prazo (direita) */}
        {countdown && (
          <div className="flex flex-col items-end justify-center flex-shrink-0">
            <div className={`text-xs font-bold ${countdown.color} leading-tight mb-0.5`}>
              {countdown.label}
            </div>
            <div className={`text-base font-mono font-bold ${countdown.color} leading-tight tracking-tight`}>
              {countdown.display}
            </div>
          </div>
        )}
      </div>

      {/* Barra de progresso sempre com gradiente - ocupa toda a largura */}
      <div className="flex items-center gap-2 mt-1.5">
        <div className="flex-1 bg-gray-700/50 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBarColor(project.status)}`}
            style={{ width: `${project.progresso_percentual}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium min-w-[35px] text-right">{project.progresso_percentual}%</span>
      </div>
    </div>
  );
};

// Componente de abas com controles de ordenação integrados
const TabSelector: React.FC<{
  activeTab: 'projetos' | 'tarefas';
  onTabChange: (tab: 'projetos' | 'tarefas') => void;
  // Props para ordenação de projetos
  projectSortBy: 'prazo_entrega' | 'codigo';
  projectSortOrder: 'asc' | 'desc';
  onProjectSortByChange: (sortBy: 'prazo_entrega' | 'codigo') => void;
  onProjectSortOrderChange: (order: 'asc' | 'desc') => void;
  // Props para ordenação de tarefas
  taskSortBy: 'prazo' | 'alfabeto';
  taskSortOrder: 'asc' | 'desc';
  onTaskSortByChange: (sortBy: 'prazo' | 'alfabeto') => void;
  onTaskSortOrderChange: (order: 'asc' | 'desc') => void;
}> = ({ 
  activeTab, 
  onTabChange,
  projectSortBy,
  projectSortOrder,
  onProjectSortByChange,
  onProjectSortOrderChange,
  taskSortBy,
  taskSortOrder,
  onTaskSortByChange,
  onTaskSortOrderChange
}) => {
  
  const handleProjectSortToggle = (newSortBy: 'prazo_entrega' | 'codigo') => {
    if (projectSortBy === newSortBy) {
      onProjectSortOrderChange(projectSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onProjectSortByChange(newSortBy);
      onProjectSortOrderChange('asc');
    }
  };

  const handleTaskSortToggle = (newSortBy: 'prazo' | 'alfabeto') => {
    if (taskSortBy === newSortBy) {
      onTaskSortOrderChange(taskSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onTaskSortByChange(newSortBy);
      onTaskSortOrderChange('desc');
    }
  };

  return (
    <div className="flex items-center justify-between bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-1 mb-6">
      {/* Abas de seleção */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onTabChange('projetos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'projetos'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
          }`}
        >
          <Package className="w-4 h-4" />
          Projetos
        </button>
        <button
          onClick={() => onTabChange('tarefas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'tarefas'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Tarefas
        </button>
      </div>

      {/* Controles de ordenação - aparecem de acordo com a aba ativa */}
      <div className="flex items-center gap-1">
        {activeTab === 'projetos' ? (
          <>
            {/* Ordenação por prazo de entrega */}
            <button
              onClick={() => handleProjectSortToggle('prazo_entrega')}
              className={`p-2 rounded-lg transition-all relative ${
                projectSortBy === 'prazo_entrega'
                  ? 'text-blue-400 bg-blue-500/20'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
              title={projectSortBy === 'prazo_entrega' 
                ? (projectSortOrder === 'asc' ? 'Prazos mais próximos primeiro' : 'Prazos mais distantes primeiro')
                : 'Ordenar por prazo de entrega'
              }
            >
              <Calendar className="w-4 h-4" />
              {projectSortBy === 'prazo_entrega' && (
                <div className="absolute -top-1 -right-1">
                  {projectSortOrder === 'asc' ? (
                    <ArrowUp className="w-2 h-2 text-blue-400" />
                  ) : (
                    <ArrowDown className="w-2 h-2 text-blue-400" />
                  )}
                </div>
              )}
            </button>

            {/* Ordenação por código */}
            <button
              onClick={() => handleProjectSortToggle('codigo')}
              className={`p-2 rounded-lg transition-all relative ${
                projectSortBy === 'codigo'
                  ? 'text-blue-400 bg-blue-500/20'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
              title={projectSortBy === 'codigo'
                ? (projectSortOrder === 'asc' ? 'Ordem numérica crescente' : 'Ordem numérica decrescente')
                : 'Ordenar por código numérico'
              }
            >
              <SortAsc className="w-4 h-4" />
              {projectSortBy === 'codigo' && (
                <div className="absolute -top-1 -right-1">
                  {projectSortOrder === 'asc' ? (
                    <ArrowUp className="w-2 h-2 text-blue-400" />
                  ) : (
                    <ArrowDown className="w-2 h-2 text-blue-400" />
                  )}
                </div>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Ordenação por prazo de tarefa */}
            <button
              onClick={() => handleTaskSortToggle('prazo')}
              className={`p-2 rounded-lg transition-all relative ${
                taskSortBy === 'prazo'
                  ? 'text-blue-400 bg-blue-500/20'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
              title={taskSortBy === 'prazo' 
                ? (taskSortOrder === 'asc' ? 'Prazos mais apertados primeiro' : 'Prazos mais folgados primeiro')
                : 'Ordenar por prazo mais apertado'
              }
            >
              <CalendarClock className="w-4 h-4" />
              {taskSortBy === 'prazo' && (
                <div className="absolute -top-1 -right-1">
                  {taskSortOrder === 'asc' ? (
                    <ArrowUp className="w-2 h-2 text-blue-400" />
                  ) : (
                    <ArrowDown className="w-2 h-2 text-blue-400" />
                  )}
                </div>
              )}
            </button>

            {/* Ordenação alfabética */}
            <button
              onClick={() => handleTaskSortToggle('alfabeto')}
              className={`p-2 rounded-lg transition-all relative ${
                taskSortBy === 'alfabeto'
                  ? 'text-blue-400 bg-blue-500/20'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
              title={taskSortBy === 'alfabeto'
                ? (taskSortOrder === 'asc' ? 'Alfabética A → Z' : 'Alfabética Z → A')
                : 'Ordenar alfabeticamente'
              }
            >
              <SortAsc className="w-4 h-4" />
              {taskSortBy === 'alfabeto' && (
                <div className="absolute -top-1 -right-1">
                  {taskSortOrder === 'asc' ? (
                    <ArrowUp className="w-2 h-2 text-blue-400" />
                  ) : (
                    <ArrowDown className="w-2 h-2 text-blue-400" />
                  )}
                </div>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Componente de card de tarefa simplificado
const TaskCard: React.FC<{
  task: any;
  onClick: (task: any) => void;
  onProjectClick?: (projectId: string) => void;
  onEntregaClick?: (projectId: string, entregaId: string) => void;
}> = ({ task, onClick, onProjectClick, onEntregaClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar tempo a cada segundo para o countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCountdown = () => {
    // Usar nova estrutura quando disponível, senão fallback para antiga
    const startAt = task.start_at || task.data_inicio;
    const endAt = task.end_at || task.data_conclusao;
    const duration = task.duration || task.prazo_horas; // em minutos

    // Função auxiliar para formatar tempo com dias
    const formatTime = (totalMinutes: number, prefix = '') => {
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const mins = Math.floor(totalMinutes % 60);
      const secs = Math.floor((totalMinutes % 1) * 60);
      
      if (days > 0) {
        return `${prefix}${days}D ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else {
        return `${prefix}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    };

    if (task.status === 'concluida') {
      // Para tarefas concluídas, mostrar tempo total gasto
      let tempoReal = duration;
      if (startAt && endAt) {
        const inicio = new Date(startAt);
        const conclusao = new Date(endAt);
        const tempoRealMs = conclusao.getTime() - inicio.getTime();
        tempoReal = tempoRealMs / (1000 * 60);
      } else if (task.tempo_execucao) {
        tempoReal = task.tempo_execucao;
      }
      
      return {
        display: formatTime(tempoReal),
        color: 'text-green-400',
        label: 'Concluída'
      };
    }

    if ((task.status === 'executando' || task.status === 'atrasada') && startAt) {
      // Para tarefas em execução, mostrar countdown
      const inicio = new Date(startAt);
      const tempoDecorridoMs = currentTime.getTime() - inicio.getTime();
      const tempoDecorridoMinutos = tempoDecorridoMs / (1000 * 60);
      const tempoRestante = duration - tempoDecorridoMinutos;
      
      if (tempoRestante <= 0) {
        // Tarefa atrasada - mostrar tempo em excesso
        const atraso = Math.abs(tempoRestante);
        
        return {
          display: formatTime(atraso, '+'),
          color: 'text-red-500 animate-pulse',
          label: 'Atrasada'
        };
      } else {
        // Contagem regressiva normal
        return {
          display: formatTime(tempoRestante),
          color: 'text-blue-400',
          label: 'Executando'
        };
      }
    }

    // Para outros status, mostrar duração planejada
    return {
      display: formatTime(duration),
      color: 'text-gray-400',
      label: task.status === 'preparacao' ? 'Próxima' : 'Aguardando'
    };
  };

  const countdown = formatCountdown();

  // Função para o badge de status
  const getStatusBadge = () => {
    const statusConfig: { [key: string]: { label: string; color: string } } = {
      executando: { label: 'Em execução', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      concluida: { label: 'Concluída', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      preparacao: { label: 'Preparação', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      pendente: { label: 'Pendente', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      atrasada: { label: 'Atrasada', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
    };

    const status = task.status || 'pendente';
    const config = statusConfig[status] || statusConfig.pendente;

    return (
      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div 
      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-2 hover:border-gray-600/50 hover:bg-gray-800/70 transition-all duration-200 group"
    >
      {/* Primeira linha: Nome + Responsável + Setor + Cronômetro */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => onClick(task)}
      >
        {/* Lado esquerdo: Nome + Responsável + Setor (responsivo) */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {/* Nome da tarefa */}
          <div className="text-sm font-medium text-white truncate flex-shrink-0">
            {task.nome}
          </div>
          
          {/* Responsável - visível apenas em desktop (lg+) */}
          <div className="hidden lg:flex items-center gap-1 text-gray-400 flex-shrink-0">
            <Users className="w-3 h-3 text-green-400" />
            <span className="text-xs truncate max-w-24">{task.responsavel_nome || 'N/A'}</span>
          </div>
          
          {/* Setor - visível em tablet+ (md+), oculto em mobile */}
          <div className="hidden md:flex items-center gap-1 text-gray-400 flex-shrink-0">
            <Building className="w-3 h-3 text-blue-400" />
            <span className="text-xs truncate max-w-20">{task.setor || task.responsavel_tipo}</span>
          </div>
        </div>
        
        {/* Lado direito: Cronômetro - sempre visível */}
        <div className={`text-sm font-bold ${countdown.color} ml-2 flex-shrink-0`} title={countdown.label}>
          {countdown.display}
        </div>
      </div>

      {/* Segunda linha: Demanda > Entrega > Serviço */}
      {(task.projeto_codigo || task.entrega_nome || task.servico_nome) && (
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
          {/* Demanda (sem ícone) */}
          {task.projeto_codigo && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectClick?.(task.projeto_id);
                }}
                className="hover:text-blue-400 transition-colors"
                title={`Ver projeto: ${task.projeto_codigo}`}
              >
                <span className="truncate max-w-[100px]">{task.projeto_codigo}</span>
              </button>
              
              {(task.entrega_nome || task.servico_nome) && <span className="text-gray-600">→</span>}
            </>
          )}
          
          {/* Entrega (com ícone de cubo) */}
          {task.entrega_nome && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEntregaClick?.(task.projeto_id, task.entrega_id);
                }}
                className="flex items-center gap-1 hover:text-purple-400 transition-colors"
                title={`Ver entrega: ${task.entrega_nome}`}
              >
                <Package className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{task.entrega_nome}</span>
              </button>
              
              {task.servico_nome && <span className="text-gray-600">→</span>}
            </>
          )}
          
          {/* Serviço (com ícone de layers) */}
          {task.servico_nome && (
            <div className="flex items-center gap-1" title={`Serviço: ${task.servico_nome}`}>
              <Layers className="w-3 h-3 text-blue-400" />
              <span className="truncate max-w-[120px]">{task.servico_nome}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente principal da lista de projetos
const ProjectListView: React.FC = () => {
  const router = useRouter();
  
  // Busca projetos da API com WebSocket em tempo real
  const { projetos, isLoading, error, refetch, lastSync } = useProjetos();
  const [selectedProject, setSelectedProject] = useState<Projeto | null>(null);
  const [activeTab, setActiveTab] = useState<'projetos' | 'tarefas'>('projetos');
  const [sortBy, setSortBy] = useState<'prazo' | 'alfabeto'>('prazo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [projectSortBy, setProjectSortBy] = useState<'prazo_entrega' | 'codigo'>('codigo');
  const [projectSortOrder, setProjectSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);

  // 🔥 Navega para página de detalhes quando projeto é selecionado
  useEffect(() => {
    if (showProjectDetail && selectedProject) {
      router.push(`/projetos/${selectedProject.id}`);
      setShowProjectDetail(false);
      setSelectedProject(null);
    }
  }, [showProjectDetail, selectedProject, router]);

  // Extrair todas as tarefas de todos os projetos, enriquecendo com info de projeto e entrega
  const allTasks = projetos.flatMap(projeto => 
    projeto.entregas?.flatMap(entrega => 
      entrega.servicos?.flatMap((servico: any) => 
        (servico.tarefas || []).map((tarefa: any) => ({
          ...tarefa,
          // Enriquecer com informações de contexto
          projeto_id: projeto.id,
          projeto_codigo: projeto.demanda_codigo,
          projeto_cliente: projeto.cliente_nome,
          entrega_id: entrega.id,
          entrega_nome: entrega.nome,
          servico_id: servico.id,
          servico_nome: servico.nome
        }))
      ) || []
    ) || []
  );

  // Função para ordenar tarefas
  const sortTasks = (tasks: any[]) => {
    const sorted = [...tasks].sort((a, b) => {
      const currentTime = Date.now();
      
      // Calcular prazo remanescente para cada tarefa (em milissegundos)
      const calcularPrazoRemanescente = (tarefa: any) => {
        // Estrutura de dados:
        // start_at: data que começou (ISO string ou timestamp)
        // duration: prazo inicial da tarefa (em minutos)
        // end_at: data que encerrou (ISO string ou timestamp)
        
        const startAt = tarefa.start_at || tarefa.data_inicio;
        const endAt = tarefa.end_at || tarefa.data_conclusao;
        const duration = tarefa.duration || tarefa.prazo_horas; // em minutos
        
        // Se tem start && end = tarefa concluída (não entra na lista ou vai pro final)
        if (startAt && endAt) {
          return Infinity; // Concluídas vão sempre pro final
        }
        
        // Se tem start = duration - (agora - start)
        if (startAt) {
          const start = new Date(startAt).getTime();
          const durationMs = duration * 60 * 1000; // converter minutos para ms
          const elapsed = currentTime - start;
          const remaining = durationMs - elapsed;
          
          // Retorna o remanescente (pode ser negativo se atrasado)
          // NEGATIVO = atrasado (mais negativo = mais atrasado = mais apertado)
          // POSITIVO = no prazo (menor valor = mais apertado)
          return remaining;
        }
        
        // Não tem start = duration (prazo total em ms)
        // Tarefas não iniciadas sempre vão pro final
        return Infinity;
      };
      
      if (sortBy === 'prazo') {
        const aPrazo = calcularPrazoRemanescente(a);
        const bPrazo = calcularPrazoRemanescente(b);
        
        // ASC = Prazos mais apertados primeiro (menor valor primeiro)
        //   1. Mais atrasados primeiro (-2D vem antes de -1D)
        //   2. Menos tempo restante (1:45 vem antes de 7:30)
        //   3. Tarefas concluídas e não iniciadas por último (Infinity)
        // DESC = Prazos mais folgados primeiro (maior valor primeiro)
        const comparison = aPrazo - bPrazo;
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        // Ordenação alfabética por nome da tarefa
        const aName = (a.nome || '').toLowerCase().trim();
        const bName = (b.nome || '').toLowerCase().trim();
        
        const comparison = aName.localeCompare(bName);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });
    return sorted;
  };

  const sortedTasks = sortTasks(allTasks);

  // Função de ordenação de projetos
  const sortProjects = (projects: Projeto[]) => {
    const filtered = projects.filter(p => p.status !== 'concluida');
    
    return [...filtered].sort((a, b) => {
      if (projectSortBy === 'prazo_entrega') {
        // Ordenação por prazo de entrega
        const dateA = a.prazo_data ? new Date(a.prazo_data).getTime() : Infinity;
        const dateB = b.prazo_data ? new Date(b.prazo_data).getTime() : Infinity;
        return projectSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        // Ordenação por código numérico (extrai o ano e número do código)
        const extractNumber = (codigo: string | null | undefined) => {
          // Validar se codigo é string válida
          if (!codigo || typeof codigo !== 'string') {
            return 0;
          }
          
          // Tentar diferentes formatos: A2015, 2024-123, etc
          const match = codigo.match(/(\d{4})-?(\d+)/) || codigo.match(/[A-Z](\d+)/);
          if (match) {
            if (match.length === 3) {
              // Formato: 2024-123
              const year = parseInt(match[1]);
              const num = parseInt(match[2]);
              return year * 100000 + num;
            } else {
              // Formato: A2015
              const num = parseInt(match[1]);
              return num;
            }
          }
          return 0;
        };
        
        const numA = extractNumber(a.demanda_codigo);
        const numB = extractNumber(b.demanda_codigo);
        return projectSortOrder === 'asc' ? numA - numB : numB - numA;
      }
    });
  };

  const sortedProjects = sortProjects(projetos);

  const handleProjectClick = (project: Projeto) => {
    setSelectedProject(project);
    setShowProjectDetail(true);
    console.log('Projeto selecionado:', project);
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowTaskViewModal(true);
  };

  const handleProjectClickFromTask = (projectId: string) => {
    const project = projetos.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setShowProjectDetail(true);
    }
  };

  const handleEntregaClickFromTask = (projectId: string, entregaId: string) => {
    console.log('Navegando para entrega:', { projectId, entregaId });
    router.push(`/projetos/${projectId}/entregas/${entregaId}`);
  };

  const handleTabChange = (tab: 'projetos' | 'tarefas') => {
    setActiveTab(tab);
  };

  const handleBackToList = () => {
    setShowProjectDetail(false);
    setSelectedProject(null);
  };

  const handleDeliveryClick = (delivery: any) => {
    console.log('Navegando para entrega:', delivery);
    // Navegar para a página de detalhes da entrega
    if (selectedProject) {
      router.push(`/projetos/${selectedProject.id}/entregas/${delivery.id}`);
    }
  };

  const handleStartEditing = (serviceId: string) => {
    setEditingServiceId(serviceId);
  };

  const handleStopEditing = () => {
    setEditingServiceId(null);
  };

  const handleRefresh = () => {
    refetch(); // Usa a função refetch do hook
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton compacto */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gray-700/50 rounded w-48"></div>
              <div className="flex items-center gap-3">
                <div className="h-3 bg-gray-700/50 rounded w-32"></div>
                <div className="h-7 bg-gray-700/50 rounded w-20"></div>
              </div>
            </div>

            {/* Abas skeleton */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-1 mb-6">
              <div className="flex gap-1">
                <div className="h-8 bg-gray-700/50 rounded w-24"></div>
                <div className="h-8 bg-gray-700/50 rounded w-24"></div>
              </div>
            </div>

            {/* Projects/Tasks skeleton - compacto */}
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <div className="h-4 bg-gray-700/50 rounded w-32"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-16"></div>
                  </div>
                  <div className="h-3 bg-gray-700/50 rounded w-3/4 mb-2"></div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-700/50 rounded"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-8"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Fabricação Mandrill
          </h1>
        </div>

        {/* Seletor de abas com controles de ordenação integrados */}
        <TabSelector 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          projectSortBy={projectSortBy}
          projectSortOrder={projectSortOrder}
          onProjectSortByChange={setProjectSortBy}
          onProjectSortOrderChange={setProjectSortOrder}
          taskSortBy={sortBy}
          taskSortOrder={sortOrder}
          onTaskSortByChange={setSortBy}
          onTaskSortOrderChange={setSortOrder}
        />

        {/* Lista condicional baseada na aba ativa */}
        {activeTab === 'projetos' ? (
          <div className="space-y-1">
            {sortedProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={handleProjectClick}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {sortedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={handleTaskClick}
                onProjectClick={handleProjectClickFromTask}
                onEntregaClick={handleEntregaClickFromTask}
              />
            ))}
          </div>
        )}

        {/* Footer contextual */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          {activeTab === 'projetos' ? (
            <p>{projetos.filter(p => p.status !== 'concluida').length} projetos ativos</p>
          ) : (
            <p>{sortedTasks.length} tarefas • {sortedTasks.filter(t => t.status === 'executando').length} em execução</p>
          )}
        </div>
      </div>

      {/* Modal de detalhes da tarefa */}
      <TaskViewModal
        isOpen={showTaskViewModal}
        onClose={() => setShowTaskViewModal(false)}
        task={selectedTask}
      />
    </div>
  );
};

export default ProjectListView;