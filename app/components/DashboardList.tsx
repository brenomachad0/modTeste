'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, ChevronDown, ChevronUp, Plus, Trash2, Edit, Clock, User, 
  AlertCircle, CheckCircle, PlayCircle, PauseCircle, FileText, 
  Link2, Upload, DollarSign, TrendingUp, Package, Layers, GitBranch,
  Timer, Save, RefreshCw, X, Paperclip, Building, Bell, Check, ArrowRight, Database,
  Calendar, AlertTriangle, ArrowLeft, ShoppingCart, Lightbulb, Megaphone
} from 'lucide-react';
import LottieIcon from './LottieIcon';

// Tipos
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
  texto_apoio?: string;
  valor_unitario?: number;
  quantidade_total?: number;
  indice_atual?: number;
  item_crm?: {
    icone?: string;
    titulo?: string;
    nome?: string;
    descricao?: string;
    tipo?: string;
    categoria?: string;
  };
  servicos?: Servico[];
}

interface Projeto {
  id: string;
  demanda_codigo: number;
  titulo?: string;
  anunciante_nome?: string;
  agencia_nome?: string;
  motivo_titulo?: string;
  vendedor_nome?: string;
  emissor_nome?: string;
  solicitante_nome?: string;
  demandante_nome?: string;
  demanda_tipo?: string;
  demanda_status?: string;
  motivo_tipo?: string;
  data_entrega_estimada?: string;
  prazo_data?: string;
  cliente_nome: string;
  motivo: string;
  status: Status;
  progresso_percentual: number;
  valor_total: number;
  prazo_dias: number;
  entregas?: Entrega[];
}

interface DashboardProps {
  projetos: Projeto[];
  isLoading: boolean;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
  onProjectClick: (project: Projeto) => void;
  onRefresh?: () => Promise<void>;
}

// Componente de Countdown de Prazo
const CountdownTimer: React.FC<{ project: Projeto }> = ({ project }) => {
  const [timeLeft, setTimeLeft] = React.useState({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    isOverdue: false,
    isUndefined: false
  });

  const calculateTimeLeft = React.useCallback(() => {
    // Verificar se há deadline definido (mais robusta)
    const hasValidDeadline = project.data_entrega_estimada && project.data_entrega_estimada !== null && project.data_entrega_estimada !== '' ||
                             project.prazo_data && project.prazo_data !== null && project.prazo_data !== '';
    
    if (!hasValidDeadline) {
      return {
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0,
        isOverdue: false,
        isUndefined: true
      };
    }

    // Usar apenas deadline válida (já verificada acima)
    const deadlineStr = project.data_entrega_estimada || project.prazo_data;
    const dataEntrega = new Date(deadlineStr!); // usar ! pois já verificamos que existe
    const agora = new Date();
    const diferenca = dataEntrega.getTime() - agora.getTime();
    
    const isOverdue = diferenca < 0;
    const absdiferenca = Math.abs(diferenca);

    return {
      dias: Math.floor(absdiferenca / (1000 * 60 * 60 * 24)),
      horas: Math.floor((absdiferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutos: Math.floor((absdiferenca % (1000 * 60 * 60)) / (1000 * 60)),
      segundos: Math.floor((absdiferenca % (1000 * 60)) / 1000),
      isOverdue,
      isUndefined: false
    };
  }, [project.data_entrega_estimada, project.prazo_data]);

  React.useEffect(() => {
    const updateTimer = () => setTimeLeft(calculateTimeLeft());
    updateTimer();
    
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // Determinar a cor baseado no tempo restante
  const getTextColor = () => {
    if (timeLeft.isUndefined) {
      return 'text-gray-400'; // Cinza para indefinido
    } else if (timeLeft.isOverdue) {
      return 'text-red-400'; // Vermelho para atraso
    } else if (timeLeft.dias === 0) {
      return 'text-orange-400'; // Laranja para menos de 24h
    } else {
      return 'text-white'; // Branco para tempo normal
    }
  };

  // Classe de animação para quando está atrasado
  const getAnimationClass = () => {
    return timeLeft.isOverdue ? 'animate-pulse' : '';
  };

  return (
    <div className="flex items-center gap-1">
      <Clock className="w-3 h-3 text-red-400" />
      <span className={`text-xs font-bold ${getTextColor()} ${getAnimationClass()}`}>
        {timeLeft.isUndefined ? 'Indefinido' : (
          <>
            {timeLeft.dias > 0 ? `${timeLeft.dias}D ` : ''}
            {timeLeft.horas.toString().padStart(2, '0')}:
            {timeLeft.minutos.toString().padStart(2, '0')}:
            {timeLeft.segundos.toString().padStart(2, '0')}
          </>
        )}
      </span>
    </div>
  );
};

// Componente de Lista Reduzida de DPAs
const ProjectListItem: React.FC<{ 
  project: Projeto; 
  onClick: (project: Projeto) => void;
}> = ({ project, onClick }) => {
  // Calcular progresso geral do projeto
  const calcularProgressoGeral = () => {
    if (!project.entregas || project.entregas.length === 0) {
      return project.progresso_percentual || 0;
    }
    
    const totalEntregas = project.entregas.length;
    const progressoTotal = project.entregas.reduce((acc, entrega) => 
      acc + (entrega.progresso_percentual || 0), 0
    );
    
    return progressoTotal / totalEntregas;
  };

  const progresso = calcularProgressoGeral();

  return (
    <div 
      className="bg-gray-900 border border-gray-700 rounded-lg p-2 mb-1.5 hover:border-gray-600 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
      onClick={() => onClick(project)}
    >
      {/* Primeira linha: Código + Countdown no topo direito */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-bold text-white">
          {project.titulo || project.demanda_codigo}
        </h3>
        <CountdownTimer project={project} />
      </div>

      {/* Segunda linha: Agência + Anunciante */}
      <div className="flex items-center gap-1 mb-1">
        {/* Agência com ícone de lâmpada */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-400">
          <path d="M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 3C8.68629 3 6 5.68629 6 9C6 11.5 7.5 13.5 9 15V17H15V15C16.5 13.5 18 11.5 18 9C18 5.68629 15.3137 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs text-gray-500 font-medium">
          {project.agencia_nome || 'Agência não informada'}
        </span>
        <span className="text-xs text-gray-400">•</span>
        
        {/* Anunciante com ícone de prédio */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
          <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 21V7L13 2L21 7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 9V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M15 9V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="text-xs text-gray-300 font-medium">
          {project.anunciante_nome || project.cliente_nome}
        </span>
      </div>

      {/* Terceira linha: Motivo + Barra de Progresso com % */}
      <div className="flex items-center gap-1">
        {/* Motivo com ícone de bandeira */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-400">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 22V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="text-xs text-gray-400 flex-1 truncate">
          {project.motivo_titulo || project.motivo}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-1 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <span className="text-xs font-bold text-blue-400">
            {progresso.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Componente Principal do Dashboard
export default function DashboardList({ 
  projetos, 
  isLoading, 
  isSyncing = false,
  lastSyncTime,
  onProjectClick,
  onRefresh 
}: DashboardProps) {
  
  // Sempre mostrar todos os projetos
  const projetosFiltrados = projetos;
  
  console.log('🎯 DashboardList - Total de projetos recebidos:', projetos.length);
  console.log('🔍 DashboardList - Projetos filtrados para exibição:', projetosFiltrados.length);
  console.log('📊 DashboardList - Lista de projetos:', projetosFiltrados.map(p => ({ id: p.id, titulo: p.titulo || p.demanda_codigo })));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header com logo e filtros */}
      <div className="flex items-center justify-between mb-6 pt-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">MOD Dashboard</h1>
              <p className="text-sm text-gray-400">Sistema de Gerenciamento de Produção</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicador de sincronização */}
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <div className="flex items-center gap-2 text-blue-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs">Sincronizando...</span>
              </div>
            ) : lastSyncTime ? (
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-xs">
                  Últ. sync: {lastSyncTime.toLocaleTimeString()}
                </span>
              </div>
            ) : null}
            
            {/* Botão de refresh manual */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isSyncing}
                className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          
          <div className="text-sm text-gray-400">
            {projetosFiltrados.length} projeto{projetosFiltrados.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Lista de Projetos */}
      <div className="space-y-1.5 pt-2 pb-8">
        {projetosFiltrados.map(project => (
          <ProjectListItem
            key={project.id}
            project={project}
            onClick={onProjectClick}
          />
        ))}
        
        {projetosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Nenhum projeto encontrado</p>
            <p className="text-gray-500 text-sm">
              Tente ajustar os filtros ou aguarde o carregamento dos dados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}