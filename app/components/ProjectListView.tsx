'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockProjetos, calcularEstatisticas, type Projeto } from '../../data/mockData';
import { 
  RefreshCw, Clock, Building, Flag, Calendar, 
  TrendingUp, AlertCircle, CheckCircle, Package, Users,
  ArrowUpDown, ArrowUp, ArrowDown, CalendarClock, SortAsc
} from 'lucide-react';
import ProjectDetail from './ProjectDetail';

// Componente de Card de Projeto no estilo da imagem
const ProjectCard: React.FC<{
  project: Projeto;
  onClick: (project: Projeto) => void;
}> = ({ project, onClick }) => {
  
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
      {/* Header simples com apenas código */}
      <div className="mb-0.5">
        <div className="text-base font-bold text-white">
          {project.demanda_codigo}
        </div>
      </div>

      {/* Cliente e campanha com fonte mais cinza e espaçamento mínimo */}
      <div className="flex items-center gap-0.5 text-gray-500 mb-0.5">
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

      {/* Barra de progresso sempre com gradiente */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-700/50 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBarColor(project.status)}`}
            style={{ width: `${project.progresso_percentual}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium min-w-[35px]">{project.progresso_percentual}%</span>
      </div>
    </div>
  );
};

// Componente de abas
const TabSelector: React.FC<{
  activeTab: 'projetos' | 'tarefas';
  onTabChange: (tab: 'projetos' | 'tarefas') => void;
}> = ({ activeTab, onTabChange }) => (
  <div className="flex items-center bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-1 mb-6">
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
);

// Componente de card de tarefa simplificado
const TaskCard: React.FC<{
  task: any;
  onClick: (task: any) => void;
}> = ({ task, onClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar tempo a cada segundo para o countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCountdown = () => {
    const duracaoPlanejada = task.prazo_horas;

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
      let tempoReal = duracaoPlanejada;
      if (task.data_inicio && task.data_conclusao) {
        const inicio = new Date(task.data_inicio);
        const conclusao = new Date(task.data_conclusao);
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

    if (task.status === 'executando' && task.data_inicio) {
      // Para tarefas em execução, mostrar countdown
      const inicio = new Date(task.data_inicio);
      const tempoDecorridoMs = currentTime.getTime() - inicio.getTime();
      const tempoDecorridoMinutos = tempoDecorridoMs / (1000 * 60);
      const tempoRestante = duracaoPlanejada - tempoDecorridoMinutos;
      
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
      display: formatTime(duracaoPlanejada),
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
      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-2 hover:border-gray-600/50 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer group"
      onClick={() => onClick(task)}
    >
      {/* Layout responsivo em uma linha */}
      <div className="flex items-center justify-between">
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
    </div>
  );
};

// Componente de controles de ordenação
const SortControls: React.FC<{
  sortBy: 'prazo' | 'alfabeto';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: 'prazo' | 'alfabeto') => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}> = ({ sortBy, sortOrder, onSortByChange, onSortOrderChange }) => {
  
  const handleSortToggle = (newSortBy: 'prazo' | 'alfabeto') => {
    if (sortBy === newSortBy) {
      // Se é o mesmo critério, alterna a direção
      onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é critério diferente, muda o critério e começa com decrescente
      onSortByChange(newSortBy);
      onSortOrderChange('desc');
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Botão de ordenação por prazo */}
      <button
        onClick={() => handleSortToggle('prazo')}
        className={`p-2 rounded-lg transition-all relative ${
          sortBy === 'prazo'
            ? 'text-blue-400 bg-blue-500/20'
            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
        }`}
        title={`Ordenar por prazo ${sortBy === 'prazo' ? (sortOrder === 'asc' ? '(crescente)' : '(decrescente)') : ''}`}
      >
        <CalendarClock className="w-4 h-4" />
        {sortBy === 'prazo' && (
          <div className="absolute -top-1 -right-1">
            {sortOrder === 'asc' ? (
              <ArrowUp className="w-2 h-2 text-blue-400" />
            ) : (
              <ArrowDown className="w-2 h-2 text-blue-400" />
            )}
          </div>
        )}
      </button>

      {/* Botão de ordenação alfabética */}
      <button
        onClick={() => handleSortToggle('alfabeto')}
        className={`p-2 rounded-lg transition-all relative ${
          sortBy === 'alfabeto'
            ? 'text-blue-400 bg-blue-500/20'
            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
        }`}
        title={`Ordenar por nome ${sortBy === 'alfabeto' ? (sortOrder === 'asc' ? '(crescente)' : '(decrescente)') : ''}`}
      >
        <SortAsc className="w-4 h-4" />
        {sortBy === 'alfabeto' && (
          <div className="absolute -top-1 -right-1">
            {sortOrder === 'asc' ? (
              <ArrowUp className="w-2 h-2 text-blue-400" />
            ) : (
              <ArrowDown className="w-2 h-2 text-blue-400" />
            )}
          </div>
        )}
      </button>
    </div>
  );
};

// Componente principal da lista de projetos
const ProjectListView: React.FC = () => {
  const router = useRouter();
  const [projetos] = useState<Projeto[]>(mockProjetos);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedProject, setSelectedProject] = useState<Projeto | null>(null);
  const [activeTab, setActiveTab] = useState<'projetos' | 'tarefas'>('projetos');
  const [sortBy, setSortBy] = useState<'prazo' | 'alfabeto'>('prazo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Extrair todas as tarefas de todos os projetos
  const allTasks = projetos.flatMap(projeto => 
    projeto.entregas?.flatMap(entrega => 
      entrega.servicos?.flatMap(servico => 
        servico.tarefas || []
      ) || []
    ) || []
  );

  // Função para ordenar tarefas
  const sortTasks = (tasks: any[]) => {
    const sorted = [...tasks].sort((a, b) => {
      // Primeira prioridade: tarefas atrasadas sempre primeiro
      const currentTime = new Date();
      
      const aIsLate = a.status === 'executando' && a.data_inicio && 
        (currentTime.getTime() - new Date(a.data_inicio).getTime()) / (1000 * 60) > a.prazo_horas;
      const bIsLate = b.status === 'executando' && b.data_inicio && 
        (currentTime.getTime() - new Date(b.data_inicio).getTime()) / (1000 * 60) > b.prazo_horas;
      
      if (aIsLate && !bIsLate) return -1;
      if (!aIsLate && bIsLate) return 1;
      
      // Se ambas atrasadas ou nenhuma atrasada, usar critério secundário
      if (sortBy === 'prazo') {
        const aDate = new Date(a.data_inicio || a.data_prevista || '2099-12-31');
        const bDate = new Date(b.data_inicio || b.data_prevista || '2099-12-31');
        const comparison = aDate.getTime() - bDate.getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        // Ordenação alfabética simples - título da tarefa
        const aName = (a.nome || '').toLowerCase();
        const bName = (b.nome || '').toLowerCase();
        
        // Comparação letra a letra
        if (aName < bName) {
          return sortOrder === 'asc' ? -1 : 1;
        }
        if (aName > bName) {
          return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
      }
    });
    return sorted;
  };

  const sortedTasks = sortTasks(allTasks);

  // Simular carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setLastSync(new Date());
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Calcular estatísticas
  const stats = calcularEstatisticas(projetos);

  const handleProjectClick = (project: Projeto) => {
    setSelectedProject(project);
    setShowProjectDetail(true);
    console.log('Projeto selecionado:', project);
  };

  const handleTaskClick = (task: any) => {
    console.log('Tarefa selecionada:', task);
    // Aqui você pode abrir modal ou navegar para detalhes da tarefa
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
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastSync(new Date());
    }, 800);
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

  // Se está mostrando detalhes do projeto, renderizar o ProjectDetail
  if (showProjectDetail && selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject as any}
        router={null}
        editingServiceId={editingServiceId}
        onStartEditing={handleStartEditing}
        onStopEditing={handleStopEditing}
        onBackToList={handleBackToList}
        onDeliveryClick={handleDeliveryClick}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header atualizado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Fabricação Mandrill
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {lastSync && (
              <span className="text-gray-400 text-sm">
                Última sincronização: {lastSync.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg transition-all duration-200 backdrop-blur-sm text-sm"
            >
              <RefreshCw className="w-3 h-3" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Seletor de abas */}
        <TabSelector activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Lista condicional baseada na aba ativa */}
        {activeTab === 'projetos' ? (
          <div className="space-y-1">
            {projetos
              .filter(project => project.status !== 'concluida')
              .map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={handleProjectClick}
                />
              ))}
          </div>
        ) : (
          <div>
            {/* Controles de ordenação para tarefas - alinhados à direita */}
            <div className="flex justify-end mb-3">
              <SortControls
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
              />
            </div>
            
            <div className="space-y-1">
              {sortedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={handleTaskClick}
                />
              ))}
            </div>
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
    </div>
  );
};

export default ProjectListView;