'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Layers, Plus, Clock, User, Building, 
  PlayCircle, PauseCircle, CheckCircle, AlertCircle, 
  Edit, Trash2, ChevronUp, ChevronDown 
} from 'lucide-react';

// Tipos específicos para esta página
interface Tarefa {
  id: string;
  nome: string;
  status: 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';
  setor: string;
  responsavel_nome?: string;
  responsavel_tipo?: string;
  prazo_horas: number;
  instrucao?: string;
}

interface Servico {
  id: string;
  nome: string;
  status: 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';
  progresso_percentual: number;
  tarefas: Tarefa[];
}

interface Entrega {
  id: string;
  nome: string;
  briefing: string;
  valor_unitario?: number;
  progresso_percentual: number;
  servicos: Servico[];
}

// Componente de Status Badge
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    planejada: { color: 'bg-gray-500', icon: Clock, label: 'Planejada' },
    proxima: { color: 'bg-orange-500', icon: ArrowLeft, label: 'Próxima' },
    executando: { color: 'bg-blue-500', icon: PlayCircle, label: 'Executando' },
    atrasada: { color: 'bg-red-500', icon: AlertCircle, label: 'Atrasada' },
    pausada: { color: 'bg-yellow-500', icon: PauseCircle, label: 'Pausada' },
    concluida: { color: 'bg-green-500', icon: CheckCircle, label: 'Concluída' }
  } as const;

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planejada;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
};

// Componente de Tarefa
const TaskItem: React.FC<{ 
  task: Tarefa; 
  onEdit: (task: Tarefa) => void;
  onDelete: (taskId: string) => void;
  onMoveUp: (taskId: string) => void;
  onMoveDown: (taskId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ task, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 mb-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="text-sm font-medium text-gray-200 mb-1">{task.nome}</h5>
          
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              <span>{task.responsavel_nome || 'Indefinido'}</span>
            </div>
            <div className="flex items-center">
              <Building className="w-3 h-3 mr-1" />
              <span>{task.responsavel_tipo || task.setor}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{task.prazo_horas}h</span>
            </div>
          </div>

          {task.instrucao && (
            <p className="text-xs text-gray-500 line-clamp-2">{task.instrucao}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onMoveUp(task.id)}
              disabled={isFirst}
              className={`p-1 rounded transition-colors ${
                isFirst ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
              title="Mover para cima"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onMoveDown(task.id)}
              disabled={isLast}
              className={`p-1 rounded transition-colors ${
                isLast ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
              title="Mover para baixo"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => onEdit(task)}
            className="p-1 hover:bg-blue-600 rounded transition-colors text-gray-400 hover:text-white"
            title="Editar tarefa"
          >
            <Edit className="w-3 h-3" />
          </button>
          
          <button
            onClick={() => {
              if (confirm(`Tem certeza que deseja excluir a tarefa "${task.nome}"?`)) {
                onDelete(task.id);
              }
            }}
            className="p-1 hover:bg-red-600 rounded transition-colors text-gray-400 hover:text-white"
            title="Excluir tarefa"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de Serviço
const ServiceItem: React.FC<{ 
  service: Servico;
  onEditService: (service: Servico) => void;
  onDeleteService: (serviceId: string) => void;
  onEditTask: (task: Tarefa) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, direction: 'up' | 'down') => void;
}> = ({ service, onEditService, onDeleteService, onEditTask, onDeleteTask, onMoveTask }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 mb-4">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-purple-500" />
            <div>
              <h4 className="text-lg font-semibold text-gray-200">{service.nome}</h4>
              <p className="text-xs text-gray-500">{service.tarefas.length} tarefas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500">Progresso</div>
              <div className="text-sm font-bold text-blue-400">{service.progresso_percentual.toFixed(0)}%</div>
            </div>
            
            <StatusBadge status={service.status} />
            
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditService(service);
                }}
                className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                title="Editar serviço"
              >
                <Edit className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Tem certeza que deseja excluir o serviço "${service.nome}"?`)) {
                    onDeleteService(service.id);
                  }
                }}
                className="p-2 hover:bg-red-600 rounded transition-colors text-gray-400 hover:text-white"
                title="Excluir serviço"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="ml-8">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Tarefas do Serviço
              </h5>
              <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                <Plus className="w-3 h-3" />
                Nova Tarefa
              </button>
            </div>
            
            {service.tarefas.length > 0 ? (
              <div className="space-y-2">
                {service.tarefas.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onMoveUp={(taskId) => onMoveTask(taskId, 'up')}
                    onMoveDown={(taskId) => onMoveTask(taskId, 'down')}
                    isFirst={index === 0}
                    isLast={index === service.tarefas.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                <p>Nenhuma tarefa cadastrada para este serviço</p>
                <button className="mt-2 text-blue-400 hover:text-blue-300 text-sm">
                  Adicionar primeira tarefa
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Página principal
export default function ServicosPage() {
  const router = useRouter();
  const params = useParams();
  const entregaId = params?.id as string;
  
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados da entrega e serviços
  useEffect(() => {
    const carregarDadosServico = async () => {
      try {
        setLoading(true);
        console.log(`🔍 Carregando dados do serviço: ${entregaId}`);
        
        // Buscar dados reais do backend
        const response = await fetch(`http://localhost:3001/api/servicos/${entregaId}`);
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Dados do serviço recebidos:', data);
        
        if (data.success && data.data) {
          setEntrega(data.data);
        } else {
          // Se não encontrar no backend, usar dados mock
          console.log('⚠️ Dados não encontrados no backend, usando mock data');
          usarDadosMock();
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados do serviço:', error);
        // Em caso de erro, usar dados mock
        usarDadosMock();
      } finally {
        setLoading(false);
      }
    };

    const usarDadosMock = () => {
      // Mock data - manter como fallback
      const mockEntrega: Entrega = {
        id: entregaId,
        nome: 'Vídeo Institucional Banco do Brasil',
        briefing: 'Criação de vídeo institucional para campanha de fim de ano do Banco do Brasil, incluindo roteiro, filmagem e pós-produção.',
        valor_unitario: 15000,
        progresso_percentual: 45,
        servicos: [
          {
            id: '1',
            nome: 'Pré-Produção',
            status: 'concluida',
            progresso_percentual: 100,
            tarefas: [
              {
                id: '1',
                nome: 'Desenvolvimento do Roteiro',
                status: 'concluida',
                setor: 'Criação',
                responsavel_nome: 'Maria Silva',
                responsavel_tipo: 'Criação',
                prazo_horas: 16,
                instrucao: 'Desenvolver roteiro baseado no briefing do cliente, incluindo narrativa, diálogos e indicações técnicas.'
              },
              {
                id: '2',
                nome: 'Storyboard',
                status: 'concluida',
                setor: 'Criação',
                responsavel_nome: 'João Santos',
                responsavel_tipo: 'Criação',
                prazo_horas: 12,
                instrucao: 'Criar storyboard visual baseado no roteiro aprovado.'
              }
            ]
          },
          {
            id: '2',
            nome: 'Produção',
            status: 'executando',
            progresso_percentual: 60,
            tarefas: [
              {
                id: '3',
                nome: 'Filmagem Principal',
                status: 'executando',
                setor: 'Produção',
                responsavel_nome: 'Carlos Lima',
                responsavel_tipo: 'Produção',
                prazo_horas: 24,
                instrucao: 'Realizar filmagem principal conforme storyboard e cronograma de produção.'
              },
              {
                id: '4',
                nome: 'Filmagem B-Roll',
                status: 'planejada',
                setor: 'Produção',
                responsavel_tipo: 'Produção',
                prazo_horas: 8,
                instrucao: 'Capturar imagens de apoio e detalhes para complementar a narrativa.'
              }
            ]
          },
          {
            id: '3',
            nome: 'Pós-Produção',
            status: 'planejada',
            progresso_percentual: 0,
            tarefas: [
              {
                id: '5',
                nome: 'Edição e Montagem',
                status: 'planejada',
                setor: 'Produção',
                responsavel_tipo: 'Produção',
                prazo_horas: 20,
                instrucao: 'Editar e montar o vídeo final conforme briefing e aprovações.'
              },
              {
                id: '6',
                nome: 'Trilha Sonora e Áudio',
                status: 'planejada',
                setor: 'Produção',
                responsavel_tipo: 'Produção',
                prazo_horas: 8,
                instrucao: 'Adicionar trilha sonora, efeitos sonoros e finalizar mixagem de áudio.'
              },
              {
                id: '7',
                nome: 'Correção de Cor',
                status: 'planejada',
                setor: 'Produção',
                responsavel_tipo: 'Produção',
                prazo_horas: 6,
                instrucao: 'Realizar correção de cor e finalização visual do vídeo.'
              }
            ]
          }
        ]
      };
      
      setEntrega(mockEntrega);
    };

    carregarDadosServico();
  }, [entregaId]);

  // Handlers
  const handleEditService = (service: Servico) => {
    console.log('Editar serviço:', service);
  };

  const handleDeleteService = (serviceId: string) => {
    console.log('Excluir serviço:', serviceId);
  };

  const handleEditTask = (task: Tarefa) => {
    console.log('Editar tarefa:', task);
  };

  const handleDeleteTask = (taskId: string) => {
    console.log('Excluir tarefa:', taskId);
  };

  const handleMoveTask = (taskId: string, direction: 'up' | 'down') => {
    console.log('Mover tarefa:', taskId, direction);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/3"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!entrega) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Entrega não encontrada</h1>
          <button
            onClick={() => router.back()}
            className="text-blue-400 hover:text-blue-300"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{entrega.nome}</h1>
              <p className="text-sm text-gray-400">Detalhes da Entrega</p>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-gray-300 mb-4 max-w-3xl">{entrega.briefing}</p>
            
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Valor: </span>
                <span className="text-green-400 font-bold">
                  {entrega.valor_unitario ? 
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entrega.valor_unitario)
                    : 'Não definido'
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-500">Progresso: </span>
                <span className="text-blue-400 font-bold">{entrega.progresso_percentual.toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-gray-500">Serviços: </span>
                <span className="text-purple-400 font-bold">{entrega.servicos.length}</span>
              </div>
            </div>
            
            {/* Barra de progresso */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Progresso Geral</span>
                <span className="text-xs font-bold text-blue-400">{entrega.progresso_percentual.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${entrega.progresso_percentual}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Novo Serviço
            </button>
          </div>
        </div>

        {/* Serviços */}
        <div className="space-y-4">
          {entrega.servicos.length > 0 ? (
            entrega.servicos.map(service => (
              <ServiceItem
                key={service.id}
                service={service}
                onEditService={handleEditService}
                onDeleteService={handleDeleteService}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onMoveTask={handleMoveTask}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
              <Layers className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum serviço configurado</h3>
              <p className="text-gray-400 mb-4">
                Configure os serviços necessários para esta entrega
              </p>
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Criar Primeiro Serviço
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}