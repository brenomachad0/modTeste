'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronDown, ChevronUp, Plus, Trash2, Edit, Clock, User, 
  AlertCircle, CheckCircle, PlayCircle, PauseCircle, FileText, 
  Link2, Upload, DollarSign, TrendingUp, Package, Layers, GitBranch,
  Timer, Save, RefreshCw, X, Paperclip, Building, Bell, Check, ArrowRight, Database,
  Calendar, AlertTriangle, ArrowLeft, ShoppingCart, Lightbulb, Megaphone, Globe, Target
} from 'lucide-react';
import LottieIcon from './LottieIcon';

// Tipos
type Status = 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';

interface Tarefa {
  id: string;
  nome: string;
  status: Status;
  ordem?: number;
  // Campos corretos da estrutura do banco
  responsavel_nome?: string | null;
  responsavel_tipo?: string; // Este é o setor
  prazo_horas: number;
  duracao_segundos?: number;
  mandrill_coins?: number;
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
  // Novos campos específicos da entrega
  tipo?: 'Motion' | 'Edição' | 'Formatação' | 'Redução' | 'Gravação' | 'Ilustração' | 'Alteração' | 'Inserção' | 'Personagem' | 'Fotografia' | 'Animação';
  descricao?: string;
  estrategia?: string;
  referencias?: string;
  veiculacao?: 'Cinema' | 'Concorrencia' | 'Evento' | string;
  duracao?: string;
  idioma?: string;
  uso?: string;
  estilo?: string;
  objetivos?: string;
  tecnicas?: string;
  observacoes?: string;
  // Campos de orçamento
  orcamento_producao?: number;
  valor_consumido?: number;
  valor_unitario?: number;
  data_entrega_estimada?: string;
  prazo_data?: string;
  prazo_dias?: number;
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

interface DeliveryDetailProps {
  delivery: Entrega;
  projectId: string;
  router: any;
  editingServiceId: string | null;
  onStartEditing: (serviceId: string) => void;
  onStopEditing: () => void;
  onViewTask?: (task: Tarefa) => void;
  onCompleteTask?: (task: Tarefa) => void;
  onBackToProject: () => void;
}

// Componente de Badge de Status
const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const statusConfig = {
    planejada: { color: 'bg-gray-500', label: 'Planejada', textColor: 'text-gray-100' },
    proxima: { color: 'bg-orange-500', label: 'Próxima', textColor: 'text-orange-100' },
    executando: { color: 'bg-blue-500', label: 'Executando', textColor: 'text-blue-100' },
    atrasada: { color: 'bg-red-500', label: 'Atrasada', textColor: 'text-red-100' },
    pausada: { color: 'bg-yellow-500', label: 'Pausada', textColor: 'text-yellow-100' },
    concluida: { color: 'bg-green-500', label: 'Concluída', textColor: 'text-green-100' }
  };

  const config = statusConfig[status] || statusConfig.planejada;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color} ${config.textColor}`}>
      {config.label}
    </span>
  );
};

// Componente de Item de Serviço expandido
const ServiceListItem: React.FC<{ 
  service: Servico; 
  onClick: (service: Servico) => void;
}> = ({ service, onClick }) => {
  const [expanded, setExpanded] = useState(false);
  
  const calcularProgresso = () => {
    if (!service.tarefas || service.tarefas.length === 0) {
      return service.progresso_percentual || 0;
    }
    
    const totalTarefas = service.tarefas.length;
    const tarefasConcluidas = service.tarefas.filter(t => t.status === 'concluida').length;
    
    return totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;
  };

  const progresso = calcularProgresso();

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleTaskClick = (tarefa: Tarefa, e: React.MouseEvent) => {
    e.stopPropagation();
    // Aqui você pode implementar ação específica para tarefa se necessário
    console.log('Tarefa clicada:', tarefa);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-all duration-200">
      {/* Cabeçalho do Serviço */}
      <div 
        className="p-3 cursor-pointer hover:bg-gray-750"
        onClick={() => onClick(service)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-purple-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">{service.nome}</h4>
              <p className="text-xs text-gray-400">
                {service.tarefas?.length || 0} tarefas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-2 bg-purple-500 transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <span className="text-xs font-bold text-purple-400 w-8">
              {progresso.toFixed(0)}%
            </span>
            
            {/* Botão para expandir tarefas */}
            <button
              onClick={handleExpandClick}
              className="p-1 hover:bg-gray-600 rounded transition-colors"
              title={expanded ? "Ocultar tarefas" : "Mostrar tarefas"}
            >
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Lista de Tarefas (quando expandido) */}
      {expanded && service.tarefas && service.tarefas.length > 0 && (
        <div className="px-3 pb-3 border-t border-gray-700">
          <div className="ml-8 space-y-2 mt-2">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tarefas ({service.tarefas.length})
            </h5>
            {service.tarefas.map(tarefa => (
              <div 
                key={tarefa.id}
                className="bg-gray-900 border border-gray-600 rounded-lg p-2 hover:border-gray-500 hover:bg-gray-850 transition-all duration-200 cursor-pointer"
                onClick={(e) => handleTaskClick(tarefa, e)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-blue-400" />
                    <span className="text-xs font-medium text-white">{tarefa.nome}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <StatusBadge status={tarefa.status} />
                    <span className="text-xs text-gray-400">
                      {tarefa.prazo_horas}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function DeliveryDetail({
  delivery,
  projectId,
  router,
  editingServiceId,
  onStartEditing,
  onStopEditing,
  onViewTask,
  onCompleteTask,
  onBackToProject
}: DeliveryDetailProps) {
  const [expanded, setExpanded] = useState(true);
  const [entregaCompleta, setEntregaCompleta] = useState<Entrega>(delivery);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    isUndefined: false
  });

  // Estados para redimensionamento da seção Status
  const [statusHeight, setStatusHeight] = useState(100);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(100);

  // Carregar dados completos da entrega quando o componente montar
  useEffect(() => {
    const carregarDadosCompletos = async () => {
      try {
        setLoading(true);
        console.log(`🔍 Carregando dados completos da entrega: ${delivery.id}`);
        
        // SEMPRE usar dados do CRM primeiro (fallback imediato)
        setEntregaCompleta(delivery);
        
        // Tentar buscar dados do Supabase como enhancement
        try {
          const response = await fetch(`http://localhost:3001/api/entregas/${delivery.id}/detalhes`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📦 Dados completos da entrega recebidos do Supabase:', data);
            
            if (data.success && data.data) {
              // Merge dos dados do Supabase com os do CRM
              setEntregaCompleta({
                ...delivery,
                ...data.data,
                // Manter alguns campos importantes do CRM caso estejam vazios no Supabase
                nome: data.data.nome || delivery.nome,
                briefing: data.data.briefing || delivery.briefing,
                item_crm: delivery.item_crm // Sempre manter dados do CRM
              });
            }
          } else {
            console.warn(`⚠️ API retornou ${response.status} para entrega ${delivery.id}, mantendo dados do CRM`);
          }
        } catch (apiError) {
          console.warn('⚠️ Erro na API do Supabase, mantendo dados do CRM:', apiError);
        }
        
      } catch (error) {
        console.error('❌ Erro crítico ao carregar entrega:', error);
        // Garantir que sempre temos dados para mostrar
        setEntregaCompleta(delivery);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosCompletos();
  }, [delivery.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(statusHeight);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = e.clientY - startY;
    const newHeight = Math.max(100, Math.min(400, startHeight + deltaY));
    setStatusHeight(newHeight);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, startY, startHeight]);

  // Countdown timer
  const calculateTimeLeft = () => {
    const hasValidDeadline = entregaCompleta.data_entrega_estimada && entregaCompleta.data_entrega_estimada !== null && entregaCompleta.data_entrega_estimada !== '' ||
                             entregaCompleta.prazo_data && entregaCompleta.prazo_data !== null && entregaCompleta.prazo_data !== '';
    
    if (!hasValidDeadline) {
      return {
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0,
        isUndefined: true
      };
    }

    const deadlineValida = entregaCompleta.data_entrega_estimada || entregaCompleta.prazo_data;
    if (!deadlineValida) {
      return {
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0,
        isUndefined: true
      };
    }

    const dataEntrega = new Date(deadlineValida);
    const agora = new Date();
    const diferenca = dataEntrega.getTime() - agora.getTime();

    if (diferenca > 0) {
      return {
        dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((diferenca % (1000 * 60)) / 1000),
        isUndefined: false
      };
    }

    return { dias: 0, horas: 0, minutos: 0, segundos: 0, isUndefined: false };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [entregaCompleta.data_entrega_estimada, entregaCompleta.prazo_data]);

  // Funções de cálculo similares ao ProjectDetail
  const calcularProgressoTarefas = () => {
    let totalTarefas = 0;
    let tarefasConcluidas = 0;
    
    entregaCompleta.servicos?.forEach(servico => {
      totalTarefas += servico.tarefas?.length || 0;
      tarefasConcluidas += servico.tarefas?.filter(t => t.status === 'concluida').length || 0;
    });
    
    return totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;
  };

  const calcularConsumoOrcamento = () => {
    return entregaCompleta.progresso_percentual * 0.8;
  };

  const calcularConsumoPrazo = () => {
    const deadlineValida = entregaCompleta.data_entrega_estimada || entregaCompleta.prazo_data;
    if (!deadlineValida) return 0;
    
    const dataAtual = new Date();
    const dataEntrega = new Date(deadlineValida);
    
    const dataInicio = new Date(dataEntrega);
    dataInicio.setDate(dataInicio.getDate() - (entregaCompleta.prazo_dias || 30));
    
    const tempoTotal = dataEntrega.getTime() - dataInicio.getTime();
    const tempoDecorrido = dataAtual.getTime() - dataInicio.getTime();
    
    if (tempoDecorrido <= 0) return 0;
    if (tempoDecorrido >= tempoTotal) return 100;
    
    return (tempoDecorrido / tempoTotal) * 100;
  };

  const formatarData = (dataStr: string) => {
    const dataEntrega = new Date(dataStr);
    return dataEntrega.toLocaleDateString('pt-BR');
  };

  const progressoTarefas = calcularProgressoTarefas();
  const consumoOrcamento = calcularConsumoOrcamento();
  const consumoPrazo = calcularConsumoPrazo();

  // Cálculos para os indicadores numéricos
  const calcularTotalTarefas = () => {
    let totalTarefas = 0;
    let tarefasConcluidas = 0;
    
    entregaCompleta.servicos?.forEach(servico => {
      totalTarefas += servico.tarefas?.length || 0;
      tarefasConcluidas += servico.tarefas?.filter(t => t.status === 'concluida').length || 0;
    });
    
    return { concluidas: tarefasConcluidas, total: totalTarefas };
  };

  const calcularCustoConsumido = () => {
    const valor = entregaCompleta.valor_unitario || 0;
    const custoConsumido = (valor * consumoOrcamento) / 100;
    return { consumido: custoConsumido, total: valor };
  };

  const calcularHorasConsumidas = () => {
    const totalHoras = (entregaCompleta.prazo_dias || 30) * 8;
    const horasConsumidas = (totalHoras * consumoPrazo) / 100;
    return { consumidas: Math.round(horasConsumidas), total: totalHoras };
  };

  const tarefasInfo = calcularTotalTarefas();
  const custoInfo = calcularCustoConsumido();
  const horasInfo = calcularHorasConsumidas();

  // Função para obter ícone do tipo de entrega
  const getIconeDoTipo = (tipo?: string) => {
    const iconMap = {
      'Motion': '🎬',
      'Edição': '✂️',
      'Formatação': '📝',
      'Redução': '📏',
      'Gravação': '🎥',
      'Ilustração': '🎨',
      'Alteração': '🔧',
      'Inserção': '➕',
      'Personagem': '👤',
      'Fotografia': '📸',
      'Animação': '🎭'
    };
    return iconMap[tipo as keyof typeof iconMap] || '📋';
  };

  // Handler para voltar ao projeto
  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBackToProject();
  };

  // Handler para navegação para serviços
  const handleServiceClick = (service: Servico) => {
    // Navegar para a página de detalhes do serviço
    router.push(`/servicos/${service.id}`);
  };

  return (
    <div className="min-h-full p-6">
      <div className="bg-gradient-to-br from-gray-900 to-gray-850 rounded-xl border border-gray-700 shadow-xl mb-6">
        <div className="p-4 transition-colors rounded-t-xl">
        {/* Cabeçalho Principal */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={handleBackClick}
              className="p-1 hover:bg-gray-700 rounded transition-colors mt-1"
              title="Voltar ao projeto"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {/* Título da Entrega */}
                <LottieIcon 
                  tipo={entregaCompleta.item_crm?.tipo}
                  className="text-green-500" 
                  size={24} 
                />
                <h2 className="text-xl font-bold text-white">
                  {entregaCompleta.nome}
                </h2>
              </div>
              
              {/* Linha 1: Tipo, Status, Veiculação */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getIconeDoTipo(entregaCompleta.tipo || 'Motion')}</span>
                    <span className="text-xs font-medium text-gray-400">Tipo</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {entregaCompleta.tipo || 'Motion'}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-medium text-gray-400">Status</span>
                  </div>
                  <StatusBadge status={entregaCompleta.status} />
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Megaphone className="w-3 h-3 text-orange-400" />
                    <span className="text-xs font-medium text-gray-400">Veiculação</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {entregaCompleta.veiculacao || 'Cinema'}
                  </p>
                </div>
              </div>

              {/* Linha 2: Duração, Idioma, Uso */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span className="text-xs font-medium text-gray-400">Duração</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {entregaCompleta.duracao || 'Exatamente 15 segundos'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span className="text-xs font-medium text-gray-400">Idioma</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {entregaCompleta.idioma || 'Português'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Package className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-medium text-gray-400">Uso</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {entregaCompleta.uso || 'Comercial'}
                  </p>
                </div>
              </div>

              {/* Linha 3: Estilo, Objetivos, Técnicas */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Lightbulb className="w-3 h-3 text-purple-400" />
                    <span className="text-xs font-medium text-gray-400">Estilo</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {entregaCompleta.estilo || 'Moderno'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3 text-red-400" />
                    <span className="text-xs font-medium text-gray-400">Objetivos</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {entregaCompleta.objetivos || 'Engajamento'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    <span className="text-xs font-medium text-gray-400">Técnicas</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {entregaCompleta.tecnicas || 'Motion Graphics'}
                  </p>
                </div>
              </div>

              {/* Campos de texto maiores: Descrição, Estratégia, Referências */}
              <div className="space-y-3 mb-3">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-medium text-gray-400">Descrição</span>
                  </div>
                  <div className="bg-gray-800 p-2 rounded border">
                    <p className="text-sm text-gray-300">
                      {entregaCompleta.descricao || entregaCompleta.briefing || 'Item-Formatação'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-medium text-gray-400">Estratégia</span>
                  </div>
                  <div className="bg-gray-800 p-2 rounded border">
                    <p className="text-sm text-gray-300">
                      {entregaCompleta.estrategia || 'Estratégia de comunicação e abordagem para esta entrega.'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Link2 className="w-3 h-3 text-blue-400" />
                    <span className="text-xs font-medium text-gray-400">Referências</span>
                  </div>
                  <div className="bg-gray-800 p-2 rounded border">
                    {entregaCompleta.referencias ? (
                      <a href={entregaCompleta.referencias} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 underline">
                        {entregaCompleta.referencias}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">Não informado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Campo de Observações */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-medium text-gray-400">Observações</span>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1">
                    <Edit className="w-3 h-3" />
                    Editar
                  </button>
                </div>
                <div className="bg-gray-800 p-3 rounded border min-h-[60px]">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {entregaCompleta.observacoes || 'Adicione observações importantes sobre esta entrega, requisitos especiais, considerações técnicas ou qualquer informação relevante para a execução do projeto.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Orçamento de Produção</div>
            <div className="text-lg font-bold text-green-400 mb-2">
              R$ {(entregaCompleta.orcamento_producao || entregaCompleta.valor_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-400">Consumido: R$ {(entregaCompleta.valor_consumido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {/* Seção Compacta de Pendências e Prazo */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            {/* Lado Esquerdo: Pendências */}
            <div className="flex items-center gap-6">
              <h4 className="text-sm font-medium text-gray-400">Pendências</h4>
              <div className="flex items-center gap-4">
                {/* Serviços Pendentes */}
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span className="text-sm font-bold text-white">
                    {entregaCompleta.servicos?.filter(s => s.status !== 'concluida').length || 0}
                  </span>
                  <span className="text-xs text-gray-500">serviços</span>
                </div>
                
                {/* Tarefas Pendentes */}
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-yellow-400" />
                  <span className="text-sm font-bold text-white">
                    {entregaCompleta.servicos?.reduce((acc, s) => 
                      acc + (s.tarefas?.filter(t => t.status !== 'concluida').length || 0), 0) || 0}
                  </span>
                  <span className="text-xs text-gray-500">tarefas</span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Prazo Restante */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className={`text-lg font-bold ${timeLeft.isUndefined ? 'text-gray-400' : 'text-white'}`}>
                {timeLeft.isUndefined ? 'Indefinido' : (
                  `${timeLeft.dias}D ${timeLeft.horas.toString().padStart(2, '0')}:${timeLeft.minutos.toString().padStart(2, '0')}:${timeLeft.segundos.toString().padStart(2, '0')}`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Barras de Progresso - REMOVIDAS */}
        {/* As barras foram removidas conforme solicitado */}
      </div>
      
      {expanded && (
        <div className="p-6 pt-0">
          {/* Linha exclusiva para o botão de insumo */}
          <div className="flex justify-center mb-6">
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
              Insumo
            </button>
          </div>

          {/* Seção Serviços da Entrega */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Serviços da Entrega</h3>
          </div>
          
          {/* Lista de Serviços */}
          <div className="max-h-[600px] overflow-y-auto">
            <div className="space-y-2">
              {entregaCompleta.servicos && entregaCompleta.servicos.length > 0 ? (
                entregaCompleta.servicos.map(service => (
                  <ServiceListItem
                    key={service.id}
                    service={service}
                    onClick={handleServiceClick}
                  />
                ))
              ) : (
                <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
                  <Layers className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhum serviço configurado</h3>
                  <p className="text-gray-400 mb-4">
                    Configure os serviços necessários para esta entrega
                  </p>
                  <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                    Criar Primeiro Serviço
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}