'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, DollarSign, Calendar, Layers, Target, CheckCircle, Clock, LayoutGrid, GitBranch, User, Building, Timer, X, ChevronUp, ChevronDown, Edit2, Plus, Save, Trash2, Upload, FileText, Download, Paperclip, AlertCircle, Play, FileCheck, Link, XCircle, Eye } from 'lucide-react';
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
import AddInsumoModal from '../../../../components/AddInsumoModal';
import AddAlteracaoModal from '../../../../components/AddAlteracaoModal';
import ViewAlteracaoModal from '../../../../components/ViewAlteracaoModal';
import EditBriefingModal from '../../../../components/EditBriefingModal';
import EditExibicaoModal from '../../../../components/EditExibicaoModal';
import { mandrillApi } from '@/lib/mandrill-api';

type Status = 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';

interface Tarefa {
  id: string; // execucao_id
  nome: string; // template.template_titulo
  status: Status; // Mapear execucao_status
  ordem?: number; // execucao_ordem
  setor: string; // execucao_setor_id (nome do setor)
  setor_id?: string; // ID do setor
  responsavel_usuario?: string | null;
  responsavel_nome?: string | null;
  responsavel_tipo?: string; // execucao_pessoa_tipo
  prazo_horas: number; // execucao_prazo_deadline (em minutos!)
  duracao_segundos?: number; // execucao_tempo_minutos (converter para segundos)
  mandrill_coins: number; // execucao_coins
  instrucao?: string; // execucao_observacao
  descricao?: string; // execucao_descricao
  observacao?: string; // execucao_observacao
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
  status: 'planejamento' | 'executando' | 'atrasada' | 'concluida'; // Status da entrega (diferente de Status das tarefas)
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

interface Insumo {
  id: string;
  nome: string;
  tipo: string;
  arquivo: string; // URL ou path do arquivo
  data_upload: string;
}

interface Alteracao {
  id: string;
  titulo: string;
  descricao: string;
  arquivo?: string; // URL ou path do arquivo (opcional)
  data: string;
  escopo: 'entrega' | 'servico'; // Se é para toda entrega ou serviço específico
  servico_id?: string; // ID do serviço (se escopo = 'servico')
  servico_nome?: string; // Nome do serviço para exibição
}

type EntregavelStatus = 
  | 'revisao_supervisao' 
  | 'revisao_cliente' 
  | 'reprovado_supervisao' 
  | 'reprovado_cliente' 
  | 'aprovado_supervisao' 
  | 'aprovado_cliente' 
  | 'aguardo' 
  | 'concluido';

interface Entregavel {
  id: string;
  titulo: string;
  status: EntregavelStatus;
  data_enviada: string;
  servico_id: string;
  servico_nome: string;
  nome_arquivo: string;
  extensao: string;
  arquivo_url?: string; // URL para download
  alteracao_id?: string; // ID da alteração relacionada (se status reprovado)
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
  onDelete?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  canEdit?: boolean;
}> = ({ task, onView, onComplete, isEditMode, onMoveUp, onMoveDown, onEdit, onDelete, canMoveUp, canMoveDown, canEdit }) => {
  const [countdown, setCountdown] = useState<number>(0);
  const [isOverdue, setIsOverdue] = useState(false);

  const isExecutando = task.status === 'executando';
  const isConcluida = task.status === 'concluida';
  const isPausada = task.status === 'pausada';
  const isAtrasada = task.status === 'atrasada';
  
  // Verificar se pode deletar (apenas status: criada, iniciada, pausada, planejamento, preparacao)
  const canDelete = ['criada', 'iniciada', 'pausada', 'planejamento', 'preparacao', 'planejada', 'proxima'].includes(task.status);

  // Cronômetro de countdown
  useEffect(() => {
    const updateCountdown = () => {
      if (!task.data_inicio) {
        // Se não iniciou, mostrar prazo total em segundos
        // task.prazo_horas está em MINUTOS (apesar do nome), então * 60
        setCountdown(task.prazo_horas * 60);
        setIsOverdue(false);
        return;
      }

      const inicio = new Date(task.data_inicio).getTime();
      // Converter MINUTOS para milissegundos: minutos * 60 * 1000
      const prazoMs = task.prazo_horas * 60 * 1000;
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
            /* Botões de Editar e Excluir (modo edição) */
            <div className="flex items-center gap-2 mt-1">
              {canEdit && onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-1"
                  title="Excluir tarefa"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
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

// ⏱️ Função para formatar duração total da entrega (em segundos) no formato DD HH:mm:ss
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
  const [activeTab, setActiveTab] = useState<'briefing' | 'exibicao' | 'insumos' | 'alteracoes' | 'entregaveis'>('briefing');
  const [showDndFlow, setShowDndFlow] = useState(true);
  const [filtroEntregavel, setFiltroEntregavel] = useState<EntregavelStatus | 'todos'>('aprovado_cliente');
  
  // 🔥 Estados para Insumos e Alterações
  const [insumos, setInsumos] = useState<Insumo[]>([
    {
      id: 'insumo-mock-1',
      nome: 'Logo_Principal_2024.ai',
      tipo: 'Logo',
      arquivo: '/mock/logo.ai',
      data_upload: new Date('2024-10-15T10:30:00').toISOString(),
    },
    {
      id: 'insumo-mock-2',
      nome: 'Paleta_Cores_Aprovada.pdf',
      tipo: 'Referência',
      arquivo: '/mock/paleta.pdf',
      data_upload: new Date('2024-10-18T14:20:00').toISOString(),
    },
  ]);
  const [alteracoes, setAlteracoes] = useState<Alteracao[]>([
    {
      id: 'alteracao-mock-1',
      titulo: 'Ajustar tom de voz do narrador',
      descricao: 'Cliente solicitou que o tom seja mais jovem e descontraído, fugindo do formato corporativo tradicional. A locução deve transmitir energia e proximidade com o público-alvo.',
      data: new Date('2024-10-20T09:15:00').toISOString(),
      escopo: 'entrega',
    },
    {
      id: 'alteracao-mock-2',
      titulo: 'Mudança na paleta de cores',
      descricao: 'Alteração solicitada após apresentação: substituir azul #0066CC por verde #00AA66 para melhor alinhamento com a identidade visual da campanha de sustentabilidade.',
      arquivo: '/mock/nova-paleta.jpg',
      data: new Date('2024-10-21T16:45:00').toISOString(),
      escopo: 'servico',
      servico_id: 'servico-1',
      servico_nome: 'Motion Design',
    },
  ]);
  const [showAddInsumoModal, setShowAddInsumoModal] = useState(false);
  const [showAddAlteracaoModal, setShowAddAlteracaoModal] = useState(false);
  const [showViewAlteracaoModal, setShowViewAlteracaoModal] = useState(false);
  const [selectedAlteracao, setSelectedAlteracao] = useState<Alteracao | null>(null);
  const [showEditBriefingModal, setShowEditBriefingModal] = useState(false);
  const [showEditExibicaoModal, setShowEditExibicaoModal] = useState(false);
  
  // 🔥 Mock de Entregáveis (arquivos gerados dos serviços aprovados)
  const [entregaveis, setEntregaveis] = useState<Entregavel[]>([
    {
      id: 'entregavel-1',
      titulo: 'Vídeo Final - Motion Institucional',
      status: 'aprovado_cliente',
      data_enviada: new Date('2024-10-22T14:30:00').toISOString(),
      servico_id: 'servico-1',
      servico_nome: 'Motion Design',
      nome_arquivo: 'video_institucional_v3_final.mp4',
      extensao: 'mp4',
      arquivo_url: '/mock/video_final.mp4',
    },
    {
      id: 'entregavel-2',
      titulo: 'Apresentação de Arte - Conceito Visual',
      status: 'revisao_cliente',
      data_enviada: new Date('2024-10-23T10:15:00').toISOString(),
      servico_id: 'servico-2',
      servico_nome: 'Design Gráfico',
      nome_arquivo: 'apresentacao_arte_conceito.pdf',
      extensao: 'pdf',
      arquivo_url: '/mock/apresentacao.pdf',
    },
    {
      id: 'entregavel-3',
      titulo: 'Roteiro Aprovado - Versão Cliente',
      status: 'concluido',
      data_enviada: new Date('2024-10-20T16:45:00').toISOString(),
      servico_id: 'servico-1',
      servico_nome: 'Motion Design',
      nome_arquivo: 'roteiro_v2_aprovado.docx',
      extensao: 'docx',
      arquivo_url: '/mock/roteiro.docx',
    },
    {
      id: 'entregavel-4',
      titulo: 'Storyboard - Cenas Principais',
      status: 'reprovado_cliente',
      data_enviada: new Date('2024-10-21T11:20:00').toISOString(),
      servico_id: 'servico-1',
      servico_nome: 'Motion Design',
      nome_arquivo: 'storyboard_v1.pdf',
      extensao: 'pdf',
      arquivo_url: '/mock/storyboard.pdf',
      alteracao_id: 'alteracao-mock-1',
    },
    {
      id: 'entregavel-5',
      titulo: 'Pacote de Assets - Ícones e Elementos',
      status: 'aprovado_supervisao',
      data_enviada: new Date('2024-10-23T09:00:00').toISOString(),
      servico_id: 'servico-2',
      servico_nome: 'Design Gráfico',
      nome_arquivo: 'assets_pack_v1.zip',
      extensao: 'zip',
      arquivo_url: '/mock/assets.zip',
    },
    {
      id: 'entregavel-6',
      titulo: 'Logo Animado - Versão Horizontal',
      status: 'aprovado_cliente',
      data_enviada: new Date('2024-10-22T11:30:45').toISOString(),
      servico_id: 'servico-1',
      servico_nome: 'Motion Design',
      nome_arquivo: 'logo_animado_horizontal.mp4',
      extensao: 'mp4',
      arquivo_url: '/mock/logo_animado.mp4',
    },
    {
      id: 'entregavel-7',
      titulo: 'Manual de Identidade Visual',
      status: 'revisao_supervisao',
      data_enviada: new Date('2024-10-23T15:20:10').toISOString(),
      servico_id: 'servico-2',
      servico_nome: 'Design Gráfico',
      nome_arquivo: 'manual_identidade_v1.pdf',
      extensao: 'pdf',
      arquivo_url: '/mock/manual.pdf',
    },
    {
      id: 'entregavel-8',
      titulo: 'Trilha Sonora Original',
      status: 'reprovado_supervisao',
      data_enviada: new Date('2024-10-21T08:45:30').toISOString(),
      servico_id: 'servico-3',
      servico_nome: 'Produção de Áudio',
      nome_arquivo: 'trilha_original_v1.mp3',
      extensao: 'mp3',
      arquivo_url: '/mock/trilha.mp3',
      alteracao_id: 'alteracao-mock-2',
    },
    {
      id: 'entregavel-9',
      titulo: 'Mockups de Aplicação - Redes Sociais',
      status: 'aguardo',
      data_enviada: new Date('2024-10-23T13:10:25').toISOString(),
      servico_id: 'servico-2',
      servico_nome: 'Design Gráfico',
      nome_arquivo: 'mockups_redes_sociais.psd',
      extensao: 'psd',
      arquivo_url: '/mock/mockups.psd',
    },
    {
      id: 'entregavel-10',
      titulo: 'Banner para Website - Home',
      status: 'aprovado_cliente',
      data_enviada: new Date('2024-10-22T16:55:12').toISOString(),
      servico_id: 'servico-2',
      servico_nome: 'Design Gráfico',
      nome_arquivo: 'banner_home_website.jpg',
      extensao: 'jpg',
      arquivo_url: '/mock/banner.jpg',
    },
  ]);
  
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
      prazo_horas: tarefaAPI.execucao_prazo_deadline || 0, // Manter em minutos para formatação DD HH:mm:ss
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

  // 🔥 Função para calcular duração total de um serviço (soma de todas as tarefas em MINUTOS)
  const calcularDuracaoServico = (tarefas: Tarefa[]): number => {
    if (!tarefas || tarefas.length === 0) return 0;
    // prazo_horas já está em MINUTOS (apesar do nome)
    return tarefas.reduce((total, tarefa) => total + (tarefa.prazo_horas || 0), 0);
  };

  /**
   * 🌳 ALGORITMO DE DETECÇÃO DE ETAPAS DO FLUXO
   * 
   * Identifica etapas "invisíveis" baseado nas conexões entre nós (board_next).
   * Serviços conectados em paralelo estão na mesma etapa.
   * 
   * Exemplo de fluxo:
   *   A → B → D
   *   A → C → D
   * 
   * Etapas detectadas:
   *   Etapa 1: [A]
   *   Etapa 2: [B, C]  (paralelos)
   *   Etapa 3: [D]
   * 
   * @param boardData Dados dos boards (conexões)
   * @param servicos Lista de serviços
   * @returns Array de etapas, cada etapa contém array de serviços
   */
  const detectarEtapasFluxo = (boardData: any[], servicos: Servico[]): Servico[][] => {
    // Filtrar apenas boards de serviços
    const boardsServicos = boardData.filter(b => b.board_entidade === 'servico');
    
    if (boardsServicos.length === 0) {
      // Se não há fluxo, cada serviço é uma etapa
      return servicos.map(s => [s]);
    }

    // Mapear conexões: nodeId → [próximos nodeIds]
    const conexoes = new Map<string, string[]>();
    boardsServicos.forEach(board => {
      const nodeId = board.board_node_id;
      const proximos = Array.isArray(board.board_next) ? board.board_next : [];
      conexoes.set(nodeId, proximos);
    });

    // Mapear nodeId → servicoId
    const nodeParaServico = new Map<string, string>();
    boardsServicos.forEach(board => {
      nodeParaServico.set(board.board_node_id, board.board_entidade_id);
    });

    // Encontrar nó inicial (não é destino de nenhum)
    const todosDestinos = new Set<string>();
    conexoes.forEach(proximos => proximos.forEach(p => todosDestinos.add(p)));
    const nosIniciais = Array.from(conexoes.keys()).filter(nodeId => !todosDestinos.has(nodeId));

    if (nosIniciais.length === 0) {
      console.warn('⚠️ Nenhum nó inicial detectado no fluxo');
      return servicos.map(s => [s]);
    }

    // BFS para agrupar serviços por nível (etapa)
    const etapas: Servico[][] = [];
    const visitados = new Set<string>();
    let filaAtual = nosIniciais;

    while (filaAtual.length > 0) {
      const servicosEtapaAtual: Servico[] = [];
      const proximaFila = new Set<string>();

      // Processar todos os nós da etapa atual
      filaAtual.forEach(nodeId => {
        if (visitados.has(nodeId)) return;
        visitados.add(nodeId);

        const servicoId = nodeParaServico.get(nodeId);
        if (servicoId) {
          const servico = servicos.find(s => s.id === servicoId);
          if (servico) {
            servicosEtapaAtual.push(servico);
          }
        }

        // Adicionar próximos nós à próxima fila
        const proximos = conexoes.get(nodeId) || [];
        proximos.forEach(p => proximaFila.add(p));
      });

      if (servicosEtapaAtual.length > 0) {
        etapas.push(servicosEtapaAtual);
      }

      filaAtual = Array.from(proximaFila);
    }

    console.log('🌳 Etapas detectadas:', etapas.map((e, i) => ({
      etapa: i + 1,
      servicos: e.map(s => s.nome),
      quantidade: e.length
    })));

    return etapas;
  };

  /**
   * ⏱️ CÁLCULO DE DURAÇÃO TOTAL DA ENTREGA
   * 
   * Calcula a duração considerando serviços paralelos.
   * Para cada etapa, pega a MAIOR duração (gargalo).
   * Soma as durações de todas as etapas.
   * 
   * @param boardData Dados dos boards
   * @param servicos Lista de serviços
   * @returns Duração total em MINUTOS
   */
  const calcularDuracaoTotalEntrega = (boardData: any[], servicos: Servico[]): number => {
    const etapas = detectarEtapasFluxo(boardData, servicos);
    
    let duracaoTotal = 0;
    
    etapas.forEach((servicosEtapa, index) => {
      // Para cada etapa, calcular duração de cada serviço
      const duracoesEtapa = servicosEtapa.map(servico => {
        const duracao = calcularDuracaoServico(servico.tarefas || []);
        return { nome: servico.nome, duracao };
      });

      // Pegar a MAIOR duração (gargalo da etapa)
      const maiorDuracao = Math.max(...duracoesEtapa.map(d => d.duracao), 0);
      duracaoTotal += maiorDuracao;

      console.log(`📊 Etapa ${index + 1}:`, {
        servicos: duracoesEtapa,
        gargalo: maiorDuracao,
        acumulado: duracaoTotal
      });
    });

    console.log(`⏱️ Duração total da entrega: ${duracaoTotal} minutos (${Math.floor(duracaoTotal / 60)}h ${duracaoTotal % 60}min)`);
    
    return duracaoTotal;
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
          status: 'planejamento', // 🔥 TEMPORÁRIO: Forçar planejamento para testar botão
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

        // 🔥 Calcular duração total da entrega baseado no fluxo
        if (servicosValidos.length > 0) {
          console.log('\n📊 ===== ANÁLISE DE DURAÇÃO DA ENTREGA =====');
          const duracaoTotal = calcularDuracaoTotalEntrega(boardsFromAPI, servicosValidos);
          console.log(`\n✅ DURAÇÃO TOTAL: ${duracaoTotal} minutos`);
          console.log(`   📅 ${Math.floor(duracaoTotal / 1440)} dias, ${Math.floor((duracaoTotal % 1440) / 60)}h ${duracaoTotal % 60}min`);
          console.log('==========================================\n');
        }
        
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
  
  // 🔥 Funções para Insumos
  const handleAddInsumo = (insumoData: { nome: string; tipo: string; arquivo: File }) => {
    const novoInsumo: Insumo = {
      id: `insumo-${Date.now()}`,
      nome: insumoData.nome,
      tipo: insumoData.tipo,
      arquivo: URL.createObjectURL(insumoData.arquivo), // Simular URL do arquivo
      data_upload: new Date().toISOString(),
    };
    setInsumos([...insumos, novoInsumo]);
    setShowAddInsumoModal(false);
    console.log('📎 Insumo adicionado:', novoInsumo);
  };

  // 🔥 Funções para Alterações
  const handleAddAlteracao = (alteracaoData: {
    titulo: string;
    descricao: string;
    arquivo?: File;
    escopo: 'entrega' | 'servico';
    servico_id?: string;
    servico_nome?: string;
  }) => {
    const novaAlteracao: Alteracao = {
      id: `alteracao-${Date.now()}`,
      titulo: alteracaoData.titulo,
      descricao: alteracaoData.descricao,
      arquivo: alteracaoData.arquivo ? URL.createObjectURL(alteracaoData.arquivo) : undefined,
      data: new Date().toISOString(),
      escopo: alteracaoData.escopo,
      servico_id: alteracaoData.servico_id,
      servico_nome: alteracaoData.servico_nome,
    };
    setAlteracoes([...alteracoes, novaAlteracao]);
    setShowAddAlteracaoModal(false);
    console.log('⚠️ Alteração registrada:', novaAlteracao);
  };

  const handleViewAlteracao = (alteracao: Alteracao) => {
    setSelectedAlteracao(alteracao);
    setShowViewAlteracaoModal(true);
  };

  // 🔥 Funções para Edição de Briefing e Exibição
  const handleSaveBriefing = async (briefingData: any) => {
    try {
      setIsSaving(true);
      
      // Mapear para formato da API
      const apiData = {
        entrega_resposta: {
          ...briefingData,
        }
      };
      
      // Atualizar entrega via API
      const response = await mandrillApi.atualizarEntrega(entregaId, apiData);
      
      // Atualizar estado local
      if (entrega) {
        setEntrega({
          ...entrega,
          ...briefingData,
        });
      }
      
      setShowEditBriefingModal(false);
      
      setAlertModal({
        isOpen: true,
        title: 'Sucesso',
        message: 'Briefing atualizado com sucesso!',
        type: 'success',
      });
      
      console.log('✅ Briefing atualizado:', briefingData);
    } catch (error) {
      console.error('❌ Erro ao atualizar briefing:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao atualizar briefing. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveExibicao = async (exibicaoData: any) => {
    try {
      setIsSaving(true);
      
      // Mapear para formato da API
      const apiData = {
        entrega_resposta: {
          ...exibicaoData,
        }
      };
      
      // Atualizar entrega via API
      const response = await mandrillApi.atualizarEntrega(entregaId, apiData);
      
      // Atualizar estado local
      if (entrega) {
        setEntrega({
          ...entrega,
          ...exibicaoData,
        });
      }
      
      setShowEditExibicaoModal(false);
      
      setAlertModal({
        isOpen: true,
        title: 'Sucesso',
        message: 'Dados de exibição atualizados com sucesso!',
        type: 'success',
      });
      
      console.log('✅ Exibição atualizada:', exibicaoData);
    } catch (error) {
      console.error('❌ Erro ao atualizar exibição:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao atualizar dados de exibição. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
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

  const handleAddNewTask = (newTask: Tarefa) => {
    setEditedTasks([...editedTasks, newTask]);
  };

  // Salva edição de tarefa APENAS NO CACHE LOCAL (não chama API)
  const handleSaveTaskEdit = (tarefaEditada: Tarefa) => {
    // Se a tarefa já existe na lista, atualiza
    const index = editedTasks.findIndex(t => t.id === tarefaEditada.id);
    
    if (index !== -1) {
      // Atualizar tarefa existente
      const novasTarefas = [...editedTasks];
      novasTarefas[index] = tarefaEditada;
      setEditedTasks(novasTarefas);
    } else {
      // Adicionar nova tarefa
      setEditedTasks([...editedTasks, tarefaEditada]);
    }
    
    setShowTaskEditModal(false);
    setTaskToEdit(null);
  };

  const handleDeleteTask = (tarefaId: string) => {
    // Buscar nome da tarefa para exibir na confirmação
    const tarefa = editedTasks.find(t => t.id === tarefaId);
    const nomeTarefa = tarefa?.nome || 'esta tarefa';
    
    // Modal de confirmação
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Tarefa',
      message: `Tem certeza que deseja excluir a tarefa "${nomeTarefa}"?\n\nSalvando as alterações, essa ação não poderá ser desfeita.`,
      type: 'danger',
      onConfirm: () => {
        // Remove da lista editedTasks (será deletada na API ao salvar o modo de edição)
        setEditedTasks(editedTasks.filter(t => t.id !== tarefaId));
        console.log(`🗑️ Tarefa ${tarefaId} marcada para exclusão (será deletada ao salvar)`);
      },
    });
  };

  const handleSaveChanges = () => {
    setShowSaveChangesModal(true);
  };

  const handleSaveCurrentService = async () => {
    try {
      setIsSaving(true);
      
      if (!editingTasksServiceId) {
        console.error('Nenhum serviço em edição');
        return;
      }

      if (!entrega) {
        console.error('Entrega não carregada');
        return;
      }

      // Encontrar o serviço atual
      const servico = entrega.servicos?.find(s => s.id === editingTasksServiceId);
      if (!servico) {
        console.error('Serviço não encontrado');
        return;
      }

      // Separar tarefas novas (ID começa com 'task-') das existentes
      const tarefasNovas = editedTasks.filter(t => t.id.startsWith('task-'));
      const tarefasExistentes = editedTasks.filter(t => !t.id.startsWith('task-'));

      // Detectar tarefas deletadas (estavam no serviço original mas não estão mais em editedTasks)
      const tarefasOriginais = servico.tarefas || [];
      const tarefasDeletadas = tarefasOriginais.filter(
        original => !original.id.startsWith('task-') && !editedTasks.some(edited => edited.id === original.id)
      );

      console.log('📊 Análise de tarefas:');
      console.log('  - Tarefas originais:', tarefasOriginais.map(t => ({ id: t.id, nome: t.nome })));
      console.log('  - Tarefas editadas:', editedTasks.map(t => ({ id: t.id, nome: t.nome })));
      console.log('  - Tarefas para deletar:', tarefasDeletadas.map(t => ({ id: t.id, nome: t.nome })));
      console.log(`💾 Salvando tarefas: ${tarefasNovas.length} novas, ${tarefasExistentes.length} para atualizar, ${tarefasDeletadas.length} para deletar`);

      // 1. DELETAR tarefas removidas
      for (const tarefa of tarefasDeletadas) {
        try {
          console.log(`🗑️ Deletando tarefa ID: ${tarefa.id} (${tarefa.nome})`);
          
          // ID pode ser número ou UUID, não fazer parseInt
          await mandrillApi.deletarTarefa(tarefa.id);
          console.log(`✅ Tarefa deletada: ${tarefa.nome}`);
        } catch (error: any) {
          console.error(`❌ Erro ao deletar tarefa ${tarefa.id}:`, error);
          console.error('Detalhes do erro:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          // Continua com as outras operações mesmo se uma falhar
        }
      }

      // 2. CRIAR tarefas novas
      for (const tarefa of tarefasNovas) {
        const prazoMinutos = tarefa.prazo_horas;
        const prazoWarning = Math.floor(prazoMinutos / 2);
        const prazoDanger = Math.floor(prazoMinutos / 4);

        const payload = {
          execucao_demanda_id: entrega.projeto_id || projetoId,
          execucao_setor_id: tarefa.setor_id || undefined,
          execucao_titulo: tarefa.nome,
          execucao_observacao: tarefa.observacao || tarefa.instrucao || '',
          execucao_descricao: tarefa.descricao || '',
          execucao_tipo: 'servico',
          execucao_tipo_id: editingTasksServiceId,
          execucao_url: '',
          execucao_coins: tarefa.mandrill_coins || 1,
          execucao_ordem: tarefa.ordem || editedTasks.indexOf(tarefa) + 1,
          execucao_prazo_deadline: prazoMinutos,
          execucao_prazo_warning: prazoWarning,
          execucao_prazo_danger: prazoDanger,
        };

        await mandrillApi.criarTarefa(payload);
        console.log(`✅ Tarefa criada: ${tarefa.nome}`);
      }

      // 3. ATUALIZAR tarefas existentes (ordem + dados)
      for (const tarefa of tarefasExistentes) {
        const prazoMinutos = tarefa.prazo_horas;
        const prazoWarning = Math.floor(prazoMinutos / 2);
        const prazoDanger = Math.floor(prazoMinutos / 4);

        await mandrillApi.atualizarTarefa(tarefa.id, {
          execucao_titulo: tarefa.nome,
          execucao_descricao: tarefa.descricao || '',
          execucao_observacao: tarefa.observacao || tarefa.instrucao || '',
          execucao_setor_id: tarefa.setor_id || undefined,
          execucao_ordem: tarefa.ordem || editedTasks.indexOf(tarefa) + 1,
          execucao_prazo_deadline: prazoMinutos,
          execucao_prazo_warning: prazoWarning,
          execucao_prazo_danger: prazoDanger,
        });
        console.log(`✅ Tarefa atualizada: ${tarefa.nome}`);
      }

      // 4. Aguardar o backend processar (delay de 1.5s)
      console.log('⏳ Aguardando backend processar...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 5. Recarregar dados da entrega
      console.log('🔄 Recarregando dados da entrega...');
      const resposta = await mandrillApi.getEntregaDetalhada(entregaId);
      const dados = resposta.data;
      
      // Recarregar tarefas do serviço
      const tarefasResponse = await mandrillApi.getTarefasServico(editingTasksServiceId);
      const tarefasAtualizadas = (tarefasResponse.data || []).map(mapearTarefa);
      
      // Atualizar estado da entrega
      if (entrega && entrega.servicos) {
        const servicosAtualizados = entrega.servicos.map(s => 
          s.id === editingTasksServiceId 
            ? { ...s, tarefas: tarefasAtualizadas, progresso_percentual: calcularProgressoServico(tarefasAtualizadas) }
            : s
        );
        setEntrega({ ...entrega, servicos: servicosAtualizados });
      }

      // 6. Sair do modo de edição
      setIsEditMode(false);
      setEditingTasksServiceId(null);
      setEditedTasks([]);
      
      console.log('✅ Todas as tarefas salvas com sucesso!');
      
      // Notificar sucesso com resumo das operações
      const totalOperacoes = tarefasNovas.length + tarefasExistentes.length + tarefasDeletadas.length;
      const mensagens = [];
      if (tarefasNovas.length > 0) mensagens.push(`${tarefasNovas.length} criada(s)`);
      if (tarefasExistentes.length > 0) mensagens.push(`${tarefasExistentes.length} atualizada(s)`);
      if (tarefasDeletadas.length > 0) mensagens.push(`${tarefasDeletadas.length} excluída(s)`);
      
      setAlertModal({
        isOpen: true,
        title: 'Sucesso',
        message: `✅ Tarefas salvas com sucesso!\n\n${mensagens.join(', ')}`,
        type: 'success',
      });
    } catch (error) {
      console.error('❌ Erro ao salvar tarefas:', error);
      
      // Notificar erro
      setAlertModal({
        isOpen: true,
        title: 'Erro ao salvar',
        message: 'Erro ao salvar tarefas. Verifique o console para mais detalhes.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
      setShowSaveChangesModal(false);
    }
  };

  const handleSaveAsDefault = () => {
    // Aqui você implementaria a lógica de salvar como padrão
    setIsEditMode(false);
    setEditingTasksServiceId(null);
    setEditedTasks([]);
  };

  const handleDiscardChanges = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Descartar Alterações',
      message: 'Tem certeza que deseja descartar todas as alterações?\n\nTodas as modificações não salvas serão perdidas.',
      type: 'warning',
      onConfirm: () => {
        setIsEditMode(false);
        setEditingTasksServiceId(null);
        setEditedTasks([]);
        console.log('⚠️ Alterações descartadas pelo usuário');
      },
    });
  };

  // 🚫 Status que NÃO permitem edição/deleção/reordenação
  // Backend: criada┃iniciada┃pausada┃finalizada┃cancelada┃planejamento┃preparacao┃execucao┃atrasado┃concluido
  const statusBloqueados = ['executando', 'atrasada', 'concluida', 'pausada'];
  
  const canEditTask = (status: string) => {
    // Bloquear edição para: execucao, atrasado, concluido, pausada
    // Permitir: planejada, proxima (e outros)
    return !statusBloqueados.includes(status);
  };

  const canDeleteTask = (status: string) => {
    // Mesma regra que edição
    return !statusBloqueados.includes(status);
  };

  const canMoveTaskUp = (taskIndex: number, tasks: Tarefa[]) => {
    if (taskIndex === 0) return false;
    
    // Verificar se a tarefa atual pode ser reordenada
    const currentTask = tasks[taskIndex];
    if (statusBloqueados.includes(currentTask.status)) return false;
    
    // Verificar se a tarefa de cima está bloqueada
    const taskAbove = tasks[taskIndex - 1];
    if (statusBloqueados.includes(taskAbove.status)) return false;
    
    return true;
  };
  
  const handleIniciarEntrega = async () => {
    try {
      console.log('🚀 Iniciando entrega:', entregaId);
      
      // TODO: Quando o backend estiver pronto, implementar a chamada da API
      // await mandrillApi.iniciarEntrega(entregaId);
      
      // Por enquanto, apenas atualizar o estado local
      if (entrega) {
        entrega.status = 'executando';
        setAlertModal({
          isOpen: true,
          title: 'Entrega Iniciada',
          message: `${entregaNome || 'Entrega'} em execução! Tarefas iniciadas.`,
          type: 'success',
        });
      }
      
      // TODO: Quando backend estiver pronto, também deve:
      // 1. Atualizar status da entrega para 'executando'
      // 2. Iniciar as tarefas do primeiro serviço no fluxo
      
    } catch (error) {
      console.error('❌ Erro ao iniciar entrega:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro ao Iniciar',
        message: 'Não foi possível iniciar a entrega. Tente novamente.',
        type: 'error',
      });
    }
  };
  
  // Helper para formatar status de entregável
  const formatarStatusEntregavel = (status: EntregavelStatus) => {
    const statusMap: Record<EntregavelStatus, { label: string; color: string; icon: any }> = {
      'revisao_supervisao': { 
        label: 'Revisão de Supervisão', 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: Eye
      },
      'revisao_cliente': { 
        label: 'Revisão de Cliente', 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Eye
      },
      'reprovado_supervisao': { 
        label: 'Reprovado pela Supervisão', 
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: XCircle
      },
      'reprovado_cliente': { 
        label: 'Reprovado pelo Cliente', 
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: XCircle
      },
      'aprovado_supervisao': { 
        label: 'Aprovado pela Supervisão', 
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: CheckCircle
      },
      'aprovado_cliente': { 
        label: 'Aprovado pelo Cliente', 
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: CheckCircle
      },
      'aguardo': { 
        label: 'Aguardando', 
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: Clock
      },
      'concluido': { 
        label: 'Concluído', 
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        icon: CheckCircle
      },
    };
    return statusMap[status];
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

  // ⏱️ useEffect do countdown - Calcula duração total baseado em ETAPAS (fluxo paralelo)
  useEffect(() => {
    if (!entrega || allServices.length === 0) return;
    
    const updateTotalCountdown = () => {
      // 🌳 Calcular duração total considerando etapas (serviços paralelos)
      const duracaoTotalMinutos = calcularDuracaoTotalEntrega(boardData, allServices);
      
      // Converter para segundos para exibição no countdown
      const totalSegundos = duracaoTotalMinutos * 60;
      
      setTotalCountdown(totalSegundos);
      setIsTotalOverdue(false); // TODO: Implementar lógica de atraso baseado em data_inicio
    };

    updateTotalCountdown();
    // Atualizar a cada minuto (não precisa ser a cada segundo, pois trabalhamos com minutos)
    const interval = setInterval(updateTotalCountdown, 60000);
    return () => clearInterval(interval);
  }, [allServices, entrega, boardData]);

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
        
        // 🔥 NOVO: Identificar tipo do node pelos dados do node (mais confiável)
        const nodeData = node.data;
        let board_tipo = 'servico';
        
        // Se for node de sistema, usar boardType do node
        if (nodeData.boardType === 'orcamento' || nodeData.boardType === 'entrega') {
          board_tipo = nodeData.boardType;
          console.log(`  🎯 Node de sistema identificado: ${board_tipo} (ID: ${nodeId})`);
        }
        
        // Buscar board no boardData para validar
        const boardExistente = boardData.find((b: any) => {
          // Tentar match por node_id
          if (b.board_node_id === nodeId || b.board_node_id === node.id) {
            return true;
          }
          
          // Para boards de sistema, também tentar match por tipo
          if (board_tipo === 'orcamento' || board_tipo === 'entrega') {
            const bTipo = b.board_tipo || b.board_entidade;
            return bTipo === board_tipo;
          }
          
          return false;
        });
        
        // Se encontrou board existente, usar seu tipo
        if (boardExistente) {
          board_tipo = boardExistente.board_tipo || boardExistente.board_entidade || board_tipo;
          console.log(`  📋 Board existente encontrado: tipo=${board_tipo}, board_id=${boardExistente.board_id}`);
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
        
        // 🔥 NOVO: Se board já existe, incluir board_id para UPDATE ao invés de INSERT
        const boardPayload: any = {
          board_node_id: nodeId,
          board_position_x: Math.round(position.x),
          board_position_y: Math.round(position.y),
          board_next: board_next_ids.length > 0 ? board_next_ids : null,
          board_tipo: board_tipo,
        };
        
        // Se encontrou board existente, adicionar board_id (backend fará UPDATE)
        if (boardExistente && boardExistente.board_id) {
          boardPayload.board_id = boardExistente.board_id;
          console.log(`  🔄 Board será atualizado (board_id: ${boardExistente.board_id})`);
        } else {
          console.log(`  🆕 Board será criado (novo)`);
        }
        
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
        const operacao = boardPayload.board_id ? 'ATUALIZAR' : 'CRIAR';
        console.log(`  → ${operacao} sistema ${boardPayload.board_tipo} (${boardPayload.board_node_id}): entidade=entrega, entidadeId=${entregaId}, board_id=${boardPayload.board_id || 'novo'}`);
        
        try {
          const resposta = await mandrillApi.salvarBoard('entrega', entregaId, boardPayload);
          console.log(`    ✅ Sistema ${operacao === 'ATUALIZAR' ? 'atualizado' : 'criado'}`);
          resultados.push(resposta);
        } catch (error: any) {
          console.error(`    ❌ Erro ao ${operacao.toLowerCase()} sistema:`, error.message);
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
        status: 'planejamento',
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
      
      // ✅ Removido alerta de sucesso - salvamento silencioso
      
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
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl font-semibold text-white">{entregaNome || 'Sem título'}</h1>
                        {/* Status Tag */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entrega.status === 'planejamento' 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : entrega.status === 'executando'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : entrega.status === 'atrasada'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {entrega.status === 'planejamento' 
                            ? 'Planejamento'
                            : entrega.status === 'executando'
                            ? 'Execução'
                            : entrega.status === 'atrasada'
                            ? 'Atrasada'
                            : 'Concluída'
                          }
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{entregaBriefing || 'Sem descrição'}</p>
                    </div>
                    
                    {/* Cronômetro de estimativa da entrega OU botão Iniciar */}
                    {entrega.status === 'planejamento' ? (
                      <button
                        onClick={handleIniciarEntrega}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg px-5 py-3 flex items-center gap-2 transition-all shadow-lg hover:shadow-green-500/30 font-medium"
                      >
                        <Play className="w-5 h-5" />
                        <div>
                          <div className="text-xs opacity-80">Iniciar</div>
                          <div className="text-sm font-semibold">Entrega</div>
                        </div>
                      </button>
                    ) : (
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
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs: Briefing, Exibição, Insumos e Alterações */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2 border-b border-gray-700">
              <div className="flex gap-1">
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
                <button
                  onClick={() => setActiveTab('insumos')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                    activeTab === 'insumos'
                      ? 'text-purple-400 border-purple-400'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  Insumos
                </button>
                <button
                  onClick={() => setActiveTab('alteracoes')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                    activeTab === 'alteracoes'
                      ? 'text-purple-400 border-purple-400'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  Alterações
                </button>
                <button
                  onClick={() => setActiveTab('entregaveis')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                    activeTab === 'entregaveis'
                      ? 'text-purple-400 border-purple-400'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  Entregáveis
                </button>
              </div>
              
              {/* Botões de edição inline - aparecem apenas nas abas briefing e exibicao */}
              <div className="flex items-center gap-2 pb-1.5">
                {activeTab === 'briefing' && (
                  <button
                    onClick={() => setShowEditBriefingModal(true)}
                    className="p-1.5 rounded border border-gray-600 hover:border-purple-400 text-gray-400 hover:text-purple-400 transition-colors bg-gray-800/50 hover:bg-gray-700/50"
                    title="Editar Briefing"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {activeTab === 'exibicao' && (
                  <button
                    onClick={() => setShowEditExibicaoModal(true)}
                    className="p-1.5 rounded border border-gray-600 hover:border-purple-400 text-gray-400 hover:text-purple-400 transition-colors bg-gray-800/50 hover:bg-gray-700/50"
                    title="Editar Exibição"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
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
              ) : activeTab === 'exibicao' ? (
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
              ) : activeTab === 'insumos' ? (
                <div className="space-y-3">
                  {/* Header com botão de adicionar */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Arquivos e materiais exclusivos desta entrega
                    </p>
                    <button
                      onClick={() => setShowAddInsumoModal(true)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Adicionar Insumo
                    </button>
                  </div>

                  {/* Lista de Insumos */}
                  {insumos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum insumo adicionado ainda</p>
                      <p className="text-xs mt-1">Clique em "Adicionar Insumo" para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {insumos.map((insumo) => (
                        <div
                          key={insumo.id}
                          className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-purple-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {insumo.nome}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                  {insumo.tipo}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(insumo.data_upload).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            Baixar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'alteracoes' ? (
                <div className="space-y-3">
                  {/* Header com botão de adicionar */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Registro de alterações solicitadas pelo cliente
                    </p>
                    <button
                      onClick={() => setShowAddAlteracaoModal(true)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Nova Alteração
                    </button>
                  </div>

                  {/* Lista de Alterações */}
                  {alteracoes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma alteração registrada</p>
                      <p className="text-xs mt-1">Clique em "Nova Alteração" para adicionar</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {alteracoes.map((alteracao) => (
                        <button
                          key={alteracao.id}
                          onClick={() => handleViewAlteracao(alteracao)}
                          className="w-full flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-orange-500/50 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-orange-300 transition-colors">
                                {alteracao.titulo}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(alteracao.data).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </span>
                                {alteracao.arquivo && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-purple-400">
                                      <Paperclip className="w-3 h-3" />
                                      Anexo
                                    </span>
                                  </>
                                )}
                                {alteracao.escopo === 'servico' && alteracao.servico_nome && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-400">
                                      {alteracao.servico_nome}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'entregaveis' ? (
                <div className="space-y-3">
                  {/* Header com filtro de status */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">
                      Resultados gerados dos serviços
                    </p>
                    
                    {/* Filtro de Status */}
                    <select
                      value={filtroEntregavel}
                      onChange={(e) => setFiltroEntregavel(e.target.value as EntregavelStatus | 'todos')}
                      className="px-3 py-1.5 bg-gray-800 border border-gray-600 text-white text-xs rounded-lg focus:outline-none focus:border-purple-500 hover:border-gray-500 transition-colors"
                    >
                      <option value="todos">Todos os Status</option>
                      <option value="aprovado_cliente">Aprovado pelo Cliente</option>
                      <option value="aprovado_supervisao">Aprovado pela Supervisão</option>
                      <option value="revisao_cliente">Revisão de Cliente</option>
                      <option value="revisao_supervisao">Revisão de Supervisão</option>
                      <option value="reprovado_cliente">Reprovado pelo Cliente</option>
                      <option value="reprovado_supervisao">Reprovado pela Supervisão</option>
                      <option value="aguardo">Aguardando</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </div>

                  {/* Lista de Entregáveis */}
                  {(() => {
                    const entregaveisFiltrados = filtroEntregavel === 'todos' 
                      ? entregaveis 
                      : entregaveis.filter(e => e.status === filtroEntregavel);
                    
                    return entregaveisFiltrados.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum entregável encontrado</p>
                        <p className="text-xs mt-1">
                          {filtroEntregavel === 'todos' 
                            ? 'Entregáveis aprovados dos serviços aparecerão aqui'
                            : `Nenhum entregável com status "${formatarStatusEntregavel(filtroEntregavel as EntregavelStatus).label}"`
                          }
                        </p>
                      </div>
                    ) : (
                    <div className="space-y-1.5">
                      {entregaveisFiltrados.map((entregavel) => {
                        const statusInfo = formatarStatusEntregavel(entregavel.status);
                        const StatusIcon = statusInfo.icon;
                        const isReprovado = entregavel.status === 'reprovado_cliente' || entregavel.status === 'reprovado_supervisao';
                        
                        return (
                          <div
                            key={entregavel.id}
                            className="p-2.5 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            {/* Linha 1: Título e Status */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-xs font-medium text-white truncate flex-1">
                                {entregavel.titulo}
                              </p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border flex items-center gap-0.5 ${statusInfo.color}`}>
                                  <StatusIcon className="w-2.5 h-2.5" />
                                  {statusInfo.label}
                                </span>
                                {isReprovado && entregavel.alteracao_id && (
                                  <button 
                                    onClick={() => {
                                      const alteracao = alteracoes.find(a => a.id === entregavel.alteracao_id);
                                      if (alteracao) {
                                        handleViewAlteracao(alteracao);
                                      }
                                    }}
                                    className="px-1.5 py-0.5 text-[10px] bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors flex items-center gap-0.5"
                                    title="Ver alteração solicitada"
                                  >
                                    <Link className="w-2.5 h-2.5" />
                                    Alteração
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Linha 2: Serviço, Arquivo (clicável) e Data - tudo na mesma linha */}
                            <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <Layers className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <span className="text-blue-400 flex-shrink-0">{entregavel.servico_nome}</span>
                                <span className="flex-shrink-0">•</span>
                                <Link className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <button 
                                  onClick={() => {/* Download */}}
                                  className="font-mono hover:text-purple-400 transition-colors truncate flex items-center gap-0.5"
                                  title={`Baixar: ${entregavel.nome_arquivo}`}
                                >
                                  <span className="truncate">{entregavel.nome_arquivo}</span>
                                  <span className="text-purple-400 font-semibold uppercase flex-shrink-0">.{entregavel.extensao}</span>
                                </button>
                              </div>
                              <span className="text-[10px] text-gray-500 flex-shrink-0">
                                {new Date(entregavel.data_enviada).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })} {new Date(entregavel.data_enviada).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    );
                  })()}
                </div>
              ) : null}
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
        {showDndFlow && (
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
              isSaving={isSaving}
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
                          onDelete={canDeleteTask(tarefa.status) ? () => handleDeleteTask(tarefa.id) : undefined}
                          canMoveUp={canMoveTaskUp(index, tarefas)}
                          canMoveDown={index < tarefas.length - 1 && !statusBloqueados.includes(tarefa.status)}
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
        onDelete={handleDeleteTask}
        onSuccess={(message) => {
          setAlertModal({
            isOpen: true,
            title: 'Sucesso',
            message,
            type: 'success',
          });
        }}
        onError={(message) => {
          setAlertModal({
            isOpen: true,
            title: 'Erro',
            message,
            type: 'error',
          });
        }}
        servicoId={editingTasksServiceId || undefined}
        demandaId={entrega?.projeto_id || projetoId}
        tarefa={taskToEdit || {
          id: '',
          nome: '',
          status: 'planejada',
          prazo_horas: 0,
          setor: 'Criação',
          mandrill_coins: 1
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

      {/* 🔥 Modal de Adicionar Insumo */}
      <AddInsumoModal
        isOpen={showAddInsumoModal}
        onClose={() => setShowAddInsumoModal(false)}
        onAdd={handleAddInsumo}
      />

      {/* 🔥 Modal de Adicionar Alteração */}
      <AddAlteracaoModal
        isOpen={showAddAlteracaoModal}
        onClose={() => setShowAddAlteracaoModal(false)}
        onAdd={handleAddAlteracao}
        servicos={allServices}
      />

      {/* 🔥 Modal de Visualizar Alteração */}
      <ViewAlteracaoModal
        isOpen={showViewAlteracaoModal}
        onClose={() => setShowViewAlteracaoModal(false)}
        alteracao={selectedAlteracao}
      />

      {/* 🔥 Modal de Editar Briefing */}
      <EditBriefingModal
        isOpen={showEditBriefingModal}
        onClose={() => setShowEditBriefingModal(false)}
        onSave={handleSaveBriefing}
        initialData={{
          uso: entrega?.uso,
          estilo: entrega?.estilo,
          objetivos: entrega?.objetivos,
          tom: entrega?.tom,
          tecnicas: entrega?.tecnicas,
          estrategia: entrega?.estrategia,
          referencias: entrega?.referencias,
        }}
      />

      {/* 🔥 Modal de Editar Exibição */}
      <EditExibicaoModal
        isOpen={showEditExibicaoModal}
        onClose={() => setShowEditExibicaoModal(false)}
        onSave={handleSaveExibicao}
        initialData={{
          territorio: entrega?.territorio,
          veiculos: entrega?.veiculos,
          periodo_utilizacao: entrega?.periodo_utilizacao,
          duracao: entrega?.duracao,
          idioma_original: entrega?.idioma_original,
        }}
      />
    </div>
  );
}
