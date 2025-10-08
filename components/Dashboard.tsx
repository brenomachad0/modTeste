'use client';

// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronDown, Plus, Trash2, Edit, Clock, User, 
  AlertCircle, CheckCircle, PlayCircle, PauseCircle, FileText, 
  Link2, Upload, DollarSign, TrendingUp, Package, Layers, GitBranch,
  RefreshCw, PenTool
} from 'lucide-react';

// Tipos TypeScript
type Status = 'aguardando' | 'em_progresso' | 'em_revisao' | 'em_alteracao' | 'concluida' | 'pausado';

interface Tarefa {
  id: string;
  nome: string;
  status: Status;
  responsavel_nome?: string | null;
  responsavel_tipo?: string;
  prazo_horas: number;
  mandrill_coins: number;
  instrucao?: string;
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
  servicos?: Servico[];
}

interface Projeto {
  id: string;
  demanda_codigo: string;
  cliente_nome: string;
  motivo: string;
  status: Status;
  progresso_percentual: number;
  valor_total: number;
  prazo_dias: number;
  prazo_data: string;
  entregas?: Entrega[];
}

// Simulação de dados
const mockProjetos: Projeto[] = [
  {
    id: '1',
    demanda_codigo: 'A2004',
    cliente_nome: 'Cliente Exemplo',
    motivo: 'Campanha de Verão 2025',
    status: 'em_progresso',
    progresso_percentual: 45,
    valor_total: 25000.00,
    prazo_dias: 30,
    prazo_data: '2025-10-23',
    entregas: [
      {
        id: 'e1',
        nome: 'Vídeo Institucional 30s',
        status: 'em_progresso',
        progresso_percentual: 60,
        briefing: 'Vídeo promocional para redes sociais',
        servicos: [
          {
            id: 's1',
            nome: 'Roteirização',
            status: 'concluida',
            progresso_percentual: 100,
            tarefas: [
              {
                id: 't1',
                nome: 'Briefing com cliente',
                status: 'concluida',
                responsavel_nome: 'João Silva',
                responsavel_tipo: 'atendimento',
                prazo_horas: 2,
                mandrill_coins: 50
              },
              {
                id: 't2',
                nome: 'Desenvolvimento do roteiro',
                status: 'concluida',
                responsavel_nome: 'Maria Santos',
                responsavel_tipo: 'produtor',
                prazo_horas: 8,
                mandrill_coins: 200
              }
            ]
          },
          {
            id: 's2',
            nome: 'Produção',
            status: 'em_progresso',
            progresso_percentual: 30,
            tarefas: [
              {
                id: 't3',
                nome: 'Seleção de locação',
                status: 'em_progresso',
                responsavel_nome: 'Pedro Costa',
                responsavel_tipo: 'produtor',
                prazo_horas: 4,
                mandrill_coins: 100
              },
              {
                id: 't4',
                nome: 'Contratação de equipe',
                status: 'aguardando',
                responsavel_nome: null,
                responsavel_tipo: undefined,
                prazo_horas: 6,
                mandrill_coins: 150
              }
            ]
          }
        ]
      }
    ]
  }
];

// Componente de Status Badge
const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const statusConfig = {
    aguardando: { color: 'bg-gray-500', icon: Clock, label: 'Aguardando' },
    em_progresso: { color: 'bg-blue-500', icon: PlayCircle, label: 'Em Progresso' },
    em_revisao: { color: 'bg-yellow-500', icon: AlertCircle, label: 'Em Revisão' },
    em_alteracao: { color: 'bg-orange-500', icon: Edit, label: 'Em Alteração' },
    concluida: { color: 'bg-green-500', icon: CheckCircle, label: 'Concluída' },
    pausado: { color: 'bg-gray-600', icon: PauseCircle, label: 'Pausado' }
  };

  const config = statusConfig[status] || statusConfig.aguardando;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
};

// Componente de Barra de Progresso
const ProgressBar: React.FC<{ percentage: number; showLabel?: boolean }> = ({ percentage, showLabel = true }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className="text-xs text-gray-400">Progresso</span>
        )}
        <span className="text-xs font-semibold text-gray-300">{percentage.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Componente de Tarefa
const TaskItem: React.FC<{ 
  task: Tarefa; 
  onStatusChange: (task: Tarefa) => void; 
  onEdit: (task: Tarefa) => void;
}> = ({ task, onStatusChange, onEdit }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-2 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="text-sm font-medium text-gray-200 mb-1">{task.nome}</h5>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {task.responsavel_nome && (
              <span className="flex items-center">
                <User className="w-3 h-3 mr-1" />
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
            onClick={() => onEdit(task)}
            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-200"
          >
            <PenTool className="w-3 h-3" />
            <span className="text-xs font-bold text-red-500">EDITAR TESTE</span>
          </button>
        </div>
      </div>
      {task.instrucao && (
        <p className="text-xs text-gray-500 mt-2">{task.instrucao}</p>
      )}
    </div>
  );
};

// Componente de Serviço
const ServiceItem: React.FC<{ 
  service: Servico; 
  expanded?: boolean; 
  onToggle?: () => void;
}> = ({ service }) => {
  const [localExpanded, setLocalExpanded] = useState(false);

  return (
    <div className="bg-gray-850 rounded-lg border border-gray-700 mb-3">
      <div
        className="p-4 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setLocalExpanded(!localExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {localExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
            <Layers className="w-5 h-5 text-purple-500" />
            <div>
              <h4 className="text-sm font-semibold text-gray-200">{service.nome}</h4>
              <p className="text-xs text-gray-500">
                {service.tarefas?.length || 0} tarefas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ProgressBar percentage={service.progresso_percentual} showLabel={false} />
            <StatusBadge status={service.status} />
          </div>
        </div>
      </div>
      
      {localExpanded && (
        <div className="px-4 pb-4">
          <div className="ml-8 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tarefas</h5>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                  <FileText className="w-3 h-3" />
                  Salvar Edição
                </button>
                <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition-colors">
                  <Plus className="w-3 h-3" />
                  Nova Tarefa
                </button>
              </div>
            </div>
            {service.tarefas?.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onStatusChange={() => {}}
                onEdit={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Entrega
const DeliveryItem: React.FC<{ 
  delivery: Entrega; 
  expanded?: boolean; 
  onToggle?: () => void;
}> = ({ delivery }) => {
  const [localExpanded, setLocalExpanded] = useState(false);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 mb-4">
      <div
        className="p-4 cursor-pointer hover:bg-gray-850 transition-colors"
        onClick={() => setLocalExpanded(!localExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {localExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
            <Package className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="text-md font-semibold text-gray-100">{delivery.nome}</h3>
              <p className="text-xs text-gray-500">
                {delivery.servicos?.length || 0} serviços • {delivery.briefing}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ProgressBar percentage={delivery.progresso_percentual} showLabel={false} />
            <StatusBadge status={delivery.status} />
            <button className="p-2 hover:bg-gray-700 rounded transition-colors">
              <GitBranch className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      
      {localExpanded && (
        <div className="px-4 pb-4">
          <div className="ml-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pipeline de Serviços</h4>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                  <FileText className="w-3 h-3" />
                  Salvar Pipeline
                </button>
                <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition-colors">
                  <Plus className="w-3 h-3" />
                  Novo Serviço
                </button>
                <button className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-400 transition-colors">
                  <GitBranch className="w-3 h-3" />
                  Configurar Pipeline
                </button>
              </div>
            </div>
            {delivery.servicos?.map(service => (
              <ServiceItem
                key={service.id}
                service={service}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Projeto
const ProjectItem: React.FC<{ project: Projeto }> = ({ project }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-850 rounded-xl border border-gray-700 shadow-xl mb-6">
      <div
        className="p-6 cursor-pointer hover:bg-gray-800/50 transition-colors rounded-t-xl"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {expanded ? (
              <ChevronDown className="w-6 h-6 text-gray-400 mt-1" />
            ) : (
              <ChevronRight className="w-6 h-6 text-gray-400 mt-1" />
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-white">{project.demanda_codigo}</h2>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-sm text-gray-400 mb-1">{project.cliente_nome}</p>
              <p className="text-xs text-gray-500">{project.motivo}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Valor Total</div>
            <div className="text-lg font-bold text-green-400">
              R$ {project.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 mt-2">Prazo: {project.prazo_dias} dias</div>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar percentage={project.progresso_percentual} />
        </div>
      </div>
      
      {expanded && (
        <div className="p-6 pt-0">
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">Entregas</div>
                <div className="text-xl font-bold text-white">{project.entregas?.length || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Serviços Ativos</div>
                <div className="text-xl font-bold text-blue-400">
                  {project.entregas?.reduce((acc, e) => acc + (e.servicos?.length || 0), 0) || 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Tarefas Pendentes</div>
                <div className="text-xl font-bold text-yellow-400">12</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Dias Restantes</div>
                <div className="text-xl font-bold text-purple-400">{project.prazo_dias}</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Entregas do Projeto</h3>
            <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Nova Entrega
            </button>
          </div>
          
          {project.entregas?.map(delivery => (
            <DeliveryItem
              key={delivery.id}
              delivery={delivery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente Principal - Atualizado
export default function Dashboard() {
  const [projetos, setProjetos] = useState<Projeto[]>(mockProjetos);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(false);

  async function fetchProjetos() {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/projetos');
      const data = await response.json();
      setProjetos(data);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProjetos();
  }, []);

  const projetosFiltrados = filtroStatus === 'todos' 
    ? projetos 
    : projetos.filter(p => p.status === filtroStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Motor Operacional Dinâmico</h1>
                <p className="text-xs text-gray-500">Gerenciamento de Projetos Mandrill</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchProjetos}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros e Stats */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Projetos Ativos</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white">12</div>
            <div className="text-xs text-green-500">+3 esta semana</div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Tarefas Pendentes</span>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-white">47</div>
            <div className="text-xs text-yellow-500">8 atrasadas</div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Valor em Produção</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-white">R$ 285k</div>
            <div className="text-xs text-blue-500">15 entregas</div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Mandrill Coins</span>
              <DollarSign className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-white">12.5k MC</div>
            <div className="text-xs text-purple-500">A distribuir</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === 'todos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroStatus('em_progresso')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === 'em_progresso'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Em Progresso
          </button>
          <button
            onClick={() => setFiltroStatus('aguardando')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === 'aguardando'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Aguardando
          </button>
          <button
            onClick={() => setFiltroStatus('concluida')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === 'concluida'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Concluídos
          </button>
        </div>

        {/* Lista de Projetos */}
        <div className="space-y-4">
          {projetosFiltrados.map(project => (
            <ProjectItem key={project.id} project={project} />
          ))}
        </div>
      </div>


    </div>
  );
}