'use client';

// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PresetSelectionModal from './PresetSelectionModal';
import { useTemplates } from '../hooks/useTemplates';
import { 
  ChevronRight, ChevronDown, ChevronUp, Plus, Trash2, Edit, Clock, User, 
  AlertCircle, CheckCircle, PlayCircle, PauseCircle, FileText, 
  Link2, Upload, DollarSign, TrendingUp, Package, Layers, GitBranch,
  Timer, Save, RefreshCw, PenTool, X, Paperclip, Building, Bell, Check
} from 'lucide-react';

// Tipos TypeScript
type Status = 'aguardando' | 'executando' | 'pausada' | 'atrasada' | 'concluida' | 'preparacao';

interface Template {
  id: string;
  nome: string;
  arquivo: File;
  url?: string; // Para download/preview
}

interface Tarefa {
  id: string;
  nome: string;
  status: Status;
  ordem?: number; // Ordem/índice da tarefa na sequência (importante para banco de dados)
  setor: string; // Setor responsável (Atendimento, Produção, etc.)
  responsavel_usuario?: string | null; // Usuário que assumiu a tarefa
  responsavel_nome?: string | null; // Nome do usuário responsável
  responsavel_tipo?: string;
  prazo_horas: number; // Duração em minutos
  mandrill_coins: number;
  instrucao?: string;
  templates?: Template[];
  data_inicio?: string; // Data de início da execução
  data_conclusao?: string; // Data de conclusão
  tempo_execucao?: number; // Tempo real de execução em minutos
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

// Templates de Tarefas (dados mockados)
interface TaskTemplate {
  id: string;
  nome: string;
  setor: string;
  responsavel_tipo: string;
  prazo_horas: number;
  mandrill_coins: number;
  instrucao: string;
  templates?: Template[];
  categoria: string; // Para filtrar por tipo de serviço
}

// Dados mockados de pessoas por setor
const pessoasPorSetor = {
  'Criação': [
    { id: '1', nome: 'Maria Silva', avatar: '👩‍🎨' },
    { id: '2', nome: 'João Santos', avatar: '👨‍🎨' },
    { id: '3', nome: 'Ana Costa', avatar: '👩‍💻' }
  ],
  'Comercial': [
    { id: '4', nome: 'Carlos Oliveira', avatar: '👨‍💼' },
    { id: '5', nome: 'Sofia Lima', avatar: '👩‍💼' },
    { id: '6', nome: 'Rafael Pereira', avatar: '👨‍💼' }
  ],
  'Tecnologia': [
    { id: '7', nome: 'Pedro Rodrigues', avatar: '👨‍💻' },
    { id: '8', nome: 'Julia Fernandes', avatar: '👩‍💻' },
    { id: '9', nome: 'Lucas Almeida', avatar: '👨‍🔧' }
  ],
  'Administração': [
    { id: '10', nome: 'Carla Mendes', avatar: '👩‍💼' },
    { id: '11', nome: 'Roberto Silva', avatar: '👨‍💼' },
    { id: '12', nome: 'Fernanda Costa', avatar: '👩‍💼' }
  ],
  'Produção': [
    { id: '13', nome: 'Gabriel Santos', avatar: '👨‍🏭' },
    { id: '14', nome: 'Beatriz Lima', avatar: '👩‍🏭' },
    { id: '15', nome: 'Thiago Oliveira', avatar: '👨‍🔧' }
  ],
  'Marketing': [
    { id: '16', nome: 'Isabella Pereira', avatar: '👩‍💻' },
    { id: '17', nome: 'Mateus Silva', avatar: '👨‍💻' },
    { id: '18', nome: 'Camila Rodrigues', avatar: '👩‍🎨' }
  ]
};

const mockTaskTemplates: TaskTemplate[] = [
  {
    id: 'tpl_1',
    nome: 'Briefing com cliente',
    setor: 'Atendimento',
    responsavel_tipo: 'Atendimento',
    prazo_horas: 120,
    mandrill_coins: 50,
    instrucao: 'Reunião inicial para entender necessidades e expectativas do cliente',
    categoria: 'geral',
    templates: [
      { id: 'att1', nome: 'Checklist_Briefing.pdf', arquivo: {} as File, url: '/templates/briefing.pdf' }
    ]
  },
  {
    id: 'tpl_2',
    nome: 'Desenvolvimento de roteiro',
    setor: 'Produção',
    responsavel_tipo: 'Produção',
    prazo_horas: 480,
    mandrill_coins: 200,
    instrucao: 'Criação de roteiro baseado no briefing aprovado',
    categoria: 'video',
    templates: [
      { id: 'att2', nome: 'Template_Roteiro.docx', arquivo: {} as File, url: '/templates/roteiro.docx' }
    ]
  },
  {
    id: 'tpl_3',
    nome: 'Aprovação financeira',
    setor: 'Financeiro',
    responsavel_tipo: 'Financeiro',
    prazo_horas: 240,
    mandrill_coins: 80,
    instrucao: 'Análise e aprovação do orçamento do projeto',
    categoria: 'geral'
  },
  {
    id: 'tpl_4',
    nome: 'Seleção de locação',
    setor: 'Produção',
    responsavel_tipo: 'Produção',
    prazo_horas: 360,
    mandrill_coins: 150,
    instrucao: 'Pesquisa e seleção de locais para gravação',
    categoria: 'video'
  },
  {
    id: 'tpl_5',
    nome: 'Design de identidade visual',
    setor: 'Produção',
    responsavel_tipo: 'Produção',
    prazo_horas: 600,
    mandrill_coins: 300,
    instrucao: 'Criação de logotipo e manual de identidade visual',
    categoria: 'design',
    templates: [
      { id: 'att3', nome: 'Briefing_Design.pdf', arquivo: {} as File, url: '/templates/design_brief.pdf' }
    ]
  },
  {
    id: 'tpl_6',
    nome: 'Entrega e backup final',
    setor: 'Produção',
    responsavel_tipo: 'Produção',
    prazo_horas: 120,
    mandrill_coins: 60,
    instrucao: 'Preparação dos arquivos finais e backup para entrega',
    categoria: 'geral',
    templates: [
      { id: 'att4', nome: 'Checklist_Entrega.pdf', arquivo: {} as File, url: '/templates/entrega.pdf' }
    ]
  }
];

// Simulação de dados
const mockProjetos: Projeto[] = [
  {
    id: '1',
    demanda_codigo: 'A2004',
    cliente_nome: 'Cliente Exemplo',
    motivo: 'Campanha de Verão 2025',
    status: 'executando',
    progresso_percentual: 45,
    valor_total: 25000.00,
    prazo_dias: 30,
    prazo_data: '2025-10-23',
    entregas: [
      {
        id: 'e1',
        nome: 'Vídeo Institucional 30s',
        status: 'executando',
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
                ordem: 1,
                setor: 'Atendimento',
                responsavel_nome: 'João Silva',
                responsavel_tipo: 'atendimento',
                prazo_horas: 120,
                mandrill_coins: 50,
                data_conclusao: '2025-09-28T14:30:00Z',
                tempo_execucao: 110,
                instrucao: 'Realizar briefing detalhado com o cliente para entender todas as necessidades do projeto, incluindo objetivos, público-alvo, tom de voz desejado e referências visuais.',
                resultado: {
                  descricao: 'Briefing concluído com sucesso',
                  paragrafo: 'Reunião realizada com o cliente durante 1h50min. Foram coletadas todas as informações necessárias sobre o projeto, incluindo:\n\n- Objetivos principais: Aumentar vendas em 30% no Q4\n- Público-alvo: Jovens de 18-35 anos, classe B/C\n- Tom de voz: Descontraído e inovador\n- Referências: Campanhas da Nike e Adidas\n- Budget aprovado: R$ 25.000\n- Prazo final: 23/10/2025\n\nCliente demonstrou grande satisfação com a proposta apresentada.',
                  anexos: [
                    { nome: 'Briefing_Cliente_2025.pdf', tipo: 'application/pdf', tamanho: 2048000 },
                    { nome: 'Referencias_Visuais.zip', tipo: 'application/zip', tamanho: 15360000 }
                  ]
                }
              },
              {
                id: 't2',
                nome: 'Desenvolvimento do roteiro',
                status: 'concluida',
                ordem: 2,
                setor: 'Produção',
                responsavel_nome: 'Maria Santos',
                responsavel_tipo: 'produtor',
                prazo_horas: 480,
                mandrill_coins: 200,
                data_conclusao: '2025-09-29T16:45:00Z',
                tempo_execucao: 465,
                templates: [
                  { id: 'tpl1', nome: 'Template_Roteiro_Base.docx', arquivo: {} as File, url: '/templates/roteiro_base.docx' },
                  { id: 'tpl2', nome: 'Referencias_Visuais.pdf', arquivo: {} as File, url: '/templates/referencias.pdf' }
                ],
                instrucao: 'Desenvolver roteiro completo para vídeo institucional de 30 segundos, considerando o briefing do cliente e as melhores práticas de storytelling para redes sociais.',
                resultado: {
                  descricao: 'Roteiro aprovado pelo cliente',
                  paragrafo: 'Roteiro desenvolvido seguindo estrutura narrativa de 3 atos adaptada para 30 segundos:\n\n1. ABERTURA (0-5s): Hook visual com produto em destaque\n2. DESENVOLVIMENTO (5-20s): Apresentação dos benefícios principais\n3. FECHAMENTO (20-30s): Call-to-action e logo da marca\n\nO roteiro passou por 2 revisões internas antes da apresentação ao cliente. Cliente aprovou na primeira apresentação sem solicitações de mudança.',
                  anexos: [
                    { nome: 'Roteiro_Final_v3.docx', tipo: 'application/msword', tamanho: 256000 },
                    { nome: 'Storyboard_Ilustrado.pdf', tipo: 'application/pdf', tamanho: 5120000 },
                    { nome: 'Aprovacao_Cliente.pdf', tipo: 'application/pdf', tamanho: 1024000 }
                  ]
                }
              }
            ]
          },
          {
            id: 's2',
            nome: 'Produção',
            status: 'executando',
            progresso_percentual: 45,
            tarefas: [
              {
                id: 't3',
                nome: 'Seleção de locação',
                status: 'executando' as Status, // ✅ ÚNICA tarefa executando
                ordem: 3,
                setor: 'Produção',
                responsavel_usuario: 'pedro.costa',
                responsavel_nome: 'Pedro Costa',
                responsavel_tipo: 'Produção',
                prazo_horas: 240, // 4 horas
                mandrill_coins: 100,
                data_inicio: '2025-09-30T14:30:00Z' // Iniciado há ~30 minutos
              },
              {
                id: 't4',
                nome: 'Contratação de equipe',
                status: 'preparacao' as Status, // ✅ Próxima na fila
                ordem: 4,
                setor: 'Produção',
                responsavel_nome: 'Ana Lima',
                responsavel_tipo: 'Produção',
                prazo_horas: 360, // 6 horas
                mandrill_coins: 120,
                instrucao: 'Contratar cinegrafista e assistente de produção'
              },
              {
                id: 't5',
                nome: 'Agendamento com cliente',
                status: 'aguardando' as Status, // ✅ Aguardando na sequência
                ordem: 5,
                setor: 'Atendimento',
                responsavel_nome: null, // ✅ Indefinido (ficará vermelho)
                responsavel_tipo: 'Atendimento',
                prazo_horas: 60, // 1 hora
                mandrill_coins: 30,
                instrucao: 'Confirmar data e horário para gravação'
              },
              {
                id: 't6',
                nome: 'Gravação do material',
                status: 'aguardando' as Status, // ✅ Aguardando
                ordem: 6,
                setor: 'Produção',
                responsavel_nome: 'Carlos Cinegrafista',
                responsavel_tipo: 'Produção',
                prazo_horas: 480, // 8 horas (dia inteiro)
                mandrill_coins: 200,
                instrucao: 'Gravação completa do material promocional conforme briefing'
              },
              {
                id: 't7',
                nome: 'Edição e pós-produção',
                status: 'aguardando' as Status, // ✅ Aguardando
                ordem: 7,
                setor: 'Produção',
                responsavel_nome: 'Ana Editor',
                responsavel_tipo: 'Produção',
                prazo_horas: 720, // 12 horas (1.5 dia)
                mandrill_coins: 300,
                instrucao: 'Edição completa, correção de cor, trilha sonora e finalização'
              },
              {
                id: 't8',
                nome: 'Revisão e aprovação cliente',
                status: 'aguardando' as Status, // ✅ Aguardando
                ordem: 8,
                setor: 'Atendimento',
                responsavel_nome: 'João Silva',
                responsavel_tipo: 'Atendimento',
                prazo_horas: 120, // 2 horas
                mandrill_coins: 50,
                instrucao: 'Enviar para cliente e aguardar feedback/aprovação'
              },
              {
                id: 't9',
                nome: 'Backup e entrega final',
                status: 'aguardando' as Status, // ✅ Aguardando
                ordem: 9,
                setor: 'Produção',
                responsavel_nome: 'Carlos Tech',
                responsavel_tipo: 'Produção',
                prazo_horas: 60, // 1 hora
                mandrill_coins: 40,
                instrucao: 'Backup dos arquivos e entrega final ao cliente',
                templates: [
                  { id: 'tpl3', nome: 'Checklist_Entrega.pdf', arquivo: {} as File, url: '/templates/checklist.pdf' }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

// Modal de Nova/Editar Tarefa
const NewTaskModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Tarefa>) => void;
  editingTask?: Tarefa | null;
  selectedTemplate?: TaskTemplate | null;
}> = ({ isOpen, onClose, onSave, editingTask = null, selectedTemplate = null }) => {
  const [currentTemplate, setCurrentTemplate] = useState<TaskTemplate | null>(null);
  const [showSaveTemplateConfirm, setShowSaveTemplateConfirm] = useState(false);
  const [taskData, setTaskData] = useState({
    nome: '',
    setor: '',
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    instrucao: '',
    anexos: [] as Template[]
  });

  // Hook para buscar templates existentes e verificar nomes duplicados
  const { templates: existingTemplates } = useTemplates();

  // Inicializar dados se estiver editando ou usando template
  useEffect(() => {
    if (editingTask) {
      // Converter de minutos total para dias/horas/minutos/segundos
      const totalMinutos = editingTask.prazo_horas || 0;
      const dias = Math.floor(totalMinutos / (24 * 60));
      const horas = Math.floor((totalMinutos % (24 * 60)) / 60);
      const minutos = totalMinutos % 60;
      
      setTaskData({
        nome: editingTask.nome || '',
        setor: editingTask.responsavel_tipo || '',
        dias: dias,
        horas: horas,
        minutos: minutos,
        segundos: 0,
        instrucao: editingTask.instrucao || '',
        anexos: editingTask.templates || []
      });
      setCurrentTemplate(null);
    } else if (selectedTemplate) {
      // Converter template para o novo formato
      const totalMinutos = selectedTemplate.prazo_horas || 0;
      const dias = Math.floor(totalMinutos / (24 * 60));
      const horas = Math.floor((totalMinutos % (24 * 60)) / 60);
      const minutos = totalMinutos % 60;
      
      setTaskData({
        nome: selectedTemplate.nome,
        setor: selectedTemplate.responsavel_tipo,
        dias: dias,
        horas: horas,
        minutos: minutos,
        segundos: 0,
        instrucao: selectedTemplate.instrucao,
        anexos: selectedTemplate.templates || []
      });
      setCurrentTemplate(selectedTemplate);
    } else {
      setTaskData({
        nome: '',
        setor: '',
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0,
        instrucao: '',
        anexos: []
      });
      setCurrentTemplate(null);
    }
    setShowSaveTemplateConfirm(false);
  }, [editingTask, selectedTemplate, isOpen]);

  // Opções de setor
  const setorOptions = [
    { value: '', label: 'Selecione o setor' },
    { value: 'Criação', label: 'Criação' },
    { value: 'Comercial', label: 'Comercial' },
    { value: 'Tecnologia', label: 'Tecnologia' },
    { value: 'Administração', label: 'Administração' },
    { value: 'Produção', label: 'Produção' },
    { value: 'Marketing', label: 'Marketing' }
  ];

  // Função para verificar se o nome já existe
  const checkTaskNameExists = (nome: string): boolean => {
    if (!nome.trim()) return false;
    return existingTemplates.some((template: any) => 
      template.nome.toLowerCase() === nome.toLowerCase().trim()
    );
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newAnexos: Template[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      nome: file.name,
      arquivo: file
    }));

    setTaskData(prev => ({
      ...prev,
      anexos: [...prev.anexos, ...newAnexos]
    }));
  };

  const updateAnexoName = (anexoId: string, newName: string) => {
    setTaskData(prev => ({
      ...prev,
      anexos: prev.anexos.map(anexo =>
        anexo.id === anexoId ? { ...anexo, nome: newName } : anexo
      )
    }));
  };

  const removeAnexo = (anexoId: string) => {
    setTaskData(prev => ({
      ...prev,
      anexos: prev.anexos.filter(anexo => anexo.id !== anexoId)
    }));
  };

  const validateForm = (): string | null => {
    if (!taskData.nome.trim()) {
      return 'Por favor, digite o nome da tarefa.';
    }
    
    if (!taskData.setor) {
      return 'Por favor, selecione um setor.';
    }

    // Verificar se o nome já existe (apenas para tarefas novas)
    if (!editingTask && checkTaskNameExists(taskData.nome)) {
      return 'Já existe um template com este nome. Por favor, escolha outro nome.';
    }

    return null;
  };

  const calculateTotalMinutes = (): number => {
    return (taskData.dias * 24 * 60) + (taskData.horas * 60) + taskData.minutos + Math.round(taskData.segundos / 60);
  };

  const handleSave = () => {
    const validation = validateForm();
    if (validation) {
      alert(validation);
      return;
    }

    const totalMinutos = calculateTotalMinutes();
    
    const taskToSave = {
      nome: taskData.nome.trim(),
      responsavel_tipo: taskData.setor,
      responsavel_nome: taskData.setor,
      prazo_horas: totalMinutos,
      mandrill_coins: 1, // Sempre 1 conforme especificado
      instrucao: taskData.instrucao,
      templates: taskData.anexos,
      id: editingTask?.id // Manter ID se estiver editando
    };

    // Se não estiver editando, mostrar confirmação para salvar como template
    if (!editingTask) {
      setShowSaveTemplateConfirm(true);
      return;
    }

    // Se estiver editando, salvar diretamente
    onSave(taskToSave);
    onClose();
  };

  const handleConfirmSave = (saveAsTemplate: boolean) => {
    const totalMinutos = calculateTotalMinutes();
    
    const taskToSave = {
      nome: taskData.nome.trim(),
      responsavel_tipo: taskData.setor,
      responsavel_nome: taskData.setor,
      prazo_horas: totalMinutos,
      mandrill_coins: 1, // Sempre 1 conforme especificado
      instrucao: taskData.instrucao,
      templates: taskData.anexos,
      saveAsTemplate: saveAsTemplate // Flag para indicar se deve salvar como template
    };

    onSave(taskToSave);
    setShowSaveTemplateConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  // Modal de confirmação para salvar como template
  if (showSaveTemplateConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Salvar como novo padrão?</h3>
          <p className="text-gray-300 mb-6">
            Deseja salvar essa tarefa como um padrão para se reutilizar no futuro?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowSaveTemplateConfirm(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleConfirmSave(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Não
            </button>
            <button
              onClick={() => handleConfirmSave(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Sim
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nameExists = !editingTask && checkTaskNameExists(taskData.nome);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">
          {editingTask ? 'Editar Tarefa' : 
           currentTemplate ? `Nova Tarefa: ${currentTemplate.nome}` : 
           'Nova Tarefa'}
        </h3>
        
        <div className="space-y-4">
          {/* Nome da Tarefa */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Nome da Tarefa *</label>
            <input
              type="text"
              value={taskData.nome}
              onChange={(e) => setTaskData({...taskData, nome: e.target.value})}
              className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none ${
                nameExists 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-600 focus:border-blue-500'
              }`}
              placeholder="Digite o nome da tarefa"
            />
            {nameExists && (
              <p className="text-red-400 text-xs mt-1">
                ⚠️ Este nome já existe em um template
              </p>
            )}
          </div>
          
          {/* Setor */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Setor *</label>
            <select
              value={taskData.setor}
              onChange={(e) => setTaskData({...taskData, setor: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
            >
              {setorOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Duração */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Duração</label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Dias</label>
                <input
                  type="number"
                  value={taskData.dias}
                  onChange={(e) => setTaskData({...taskData, dias: Math.max(0, Number(e.target.value))})}
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Horas</label>
                <input
                  type="number"
                  value={taskData.horas}
                  onChange={(e) => setTaskData({...taskData, horas: Math.max(0, Math.min(23, Number(e.target.value)))})}
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                  min="0"
                  max="23"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Min</label>
                <input
                  type="number"
                  value={taskData.minutos}
                  onChange={(e) => setTaskData({...taskData, minutos: Math.max(0, Math.min(59, Number(e.target.value)))})}
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                  min="0"
                  max="59"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Seg</label>
                <input
                  type="number"
                  value={taskData.segundos}
                  onChange={(e) => setTaskData({...taskData, segundos: Math.max(0, Math.min(59, Number(e.target.value)))})}
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                  min="0"
                  max="59"
                  placeholder="0"
                />
              </div>
            </div>
            {/* Mostrar total */}
            <div className="text-xs text-gray-400 mt-1">
              Total: {calculateTotalMinutes()} minutos
            </div>
          </div>
          
          {/* Instruções */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Instruções (opcional)</label>
            <textarea
              value={taskData.instrucao}
              onChange={(e) => setTaskData({...taskData, instrucao: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-20 resize-none focus:border-blue-500 focus:outline-none"
              placeholder="Instruções detalhadas da tarefa"
            />
          </div>
          
          {/* Anexos */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Anexos (opcional)</label>
            <div className="space-y-2">
              {/* Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <div className="flex items-center justify-center w-full h-16 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-500 transition-colors">
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Clique ou arraste arquivos aqui</p>
                  </div>
                </div>
              </div>
              
              {/* Lista de Anexos */}
              {taskData.anexos.map((anexo) => (
                <div key={anexo.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                  <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={anexo.nome}
                    onChange={(e) => updateAnexoName(anexo.id, e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Nome do anexo"
                  />
                  <button
                    onClick={() => removeAnexo(anexo.id)}
                    className="p-1 hover:bg-red-600 rounded transition-colors text-gray-400 hover:text-white"
                    title="Remover anexo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={nameExists}
            className={`px-4 py-2 rounded transition-colors ${
              nameExists
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de Cabeçalho das Tarefas com Estados de Visualização/Edição
const TasksHeader: React.FC<{ 
  serviceId: string;
  isEditing: boolean;
  canEdit: boolean;
  onEnterEdit: () => void;
  onSaveChanges: () => void;
  onCancelEdit: () => void;
  onNewTask: (taskData: Partial<Tarefa>) => void;
  hasUnsavedChanges: boolean;
}> = ({ serviceId, isEditing, canEdit, onEnterEdit, onSaveChanges, onCancelEdit, onNewTask, hasUnsavedChanges }) => {
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);

  const handleNewTask = (taskData: Partial<Tarefa>) => {
    console.log('Nova tarefa para serviço', serviceId, ':', taskData);
    onNewTask(taskData);
  };

  const handleSelectTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setShowPresetModal(false);
    setShowNewTaskModal(true);
  };

  const handleCreateCustom = () => {
    setSelectedTemplate(null);
    setShowPresetModal(false);
    setShowNewTaskModal(true);
  };

  if (isEditing) {
    // Estado de Edição
    return (
      <>
        <div className="flex items-center gap-2">
          <button 
            onClick={onCancelEdit}
            className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowPresetModal(true)}
            className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            title="Nova Tarefa"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={onSaveChanges}
            className={`flex items-center justify-center w-8 h-8 text-white rounded transition-colors ${
              hasUnsavedChanges 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title={hasUnsavedChanges ? 'Salvar Mudanças' : 'Salvar Edição'}
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
        <PresetSelectionModal
          isOpen={showPresetModal}
          onClose={() => setShowPresetModal(false)}
          onTemplateSelect={handleSelectTemplate}
          onCustomTask={handleCreateCustom}
        />
        <NewTaskModal
          isOpen={showNewTaskModal}
          onClose={() => {
            setShowNewTaskModal(false);
            setSelectedTemplate(null);
          }}
          onSave={handleNewTask}
          selectedTemplate={selectedTemplate}
        />
      </>
    );
  }

  // Estado de Visualização
  return (
    <button 
      onClick={onEnterEdit}
      disabled={!canEdit}
      className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
        canEdit 
          ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
          : 'text-gray-600 cursor-not-allowed opacity-50'
      }`}
      title={canEdit ? 'Editar tarefas' : 'Outro serviço está sendo editado'}
    >
      <PenTool className="w-3 h-3" />
      <span className="text-xs">{canEdit ? 'Editar' : 'Bloqueado'}</span>
    </button>
  );
};

// Componente para Templates com Preview/Download
const TemplateItem: React.FC<{ template: Template }> = ({ template }) => {
  const handleTemplateClick = () => {
    if (template.url) {
      // Verificar se é um arquivo que pode ser visualizado no navegador
      const previewableTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
      const fileExtension = template.nome.toLowerCase().substring(template.nome.lastIndexOf('.'));
      
      if (previewableTypes.includes(fileExtension)) {
        // Abrir em nova aba para preview
        window.open(template.url, '_blank');
      } else {
        // Download direto
        const link = document.createElement('a');
        link.href = template.url;
        link.download = template.nome;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      console.log('Template sem URL:', template.nome);
    }
  };

  return (
    <span
      onClick={handleTemplateClick}
      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded cursor-pointer hover:bg-gray-600 transition-colors"
      title={template.url ? "Clique para visualizar/baixar" : "Template sem URL"}
    >
      <FileText className="w-3 h-3" />
      {template.nome}
    </span>
  );
};

// Componente de Cronômetro da Tarefa
const TaskTimer: React.FC<{ task: Tarefa }> = ({ task }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Atualizar a cada segundo

    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalMinutes: number, showSeconds: boolean = true) => { // ✅ Sempre mostrar segundos por padrão
    const isNegative = totalMinutes < 0;
    const absMinutes = Math.abs(totalMinutes);
    
    const days = Math.floor(absMinutes / (24 * 60));
    const hours = Math.floor((absMinutes % (24 * 60)) / 60);
    const mins = Math.floor(absMinutes % 60);
    const secs = Math.floor((absMinutes % 1) * 60);
    const sign = isNegative ? '-' : '';
    
    // Se tem dias, mostrar formato: 4D 12:20:30
    if (days > 0) {
      if (showSeconds) {
        return `${sign}${days}D ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else {
        return `${sign}${days}D ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      }
    }
    
    // Formato normal para menos de 24h
    if (showSeconds) {
      return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
  };

  const getTimerInfo = () => {
    const duracaoPlanejada = task.prazo_horas;

    switch (task.status) {
      case 'aguardando':
        return {
          display: formatTime(duracaoPlanejada),
          color: 'text-gray-400',
          label: 'Duração planejada'
        };

      case 'executando':
        if (task.data_inicio) {
          const inicio = new Date(task.data_inicio);
          const tempoDecorridoMs = currentTime.getTime() - inicio.getTime();
          const tempoDecorridoMinutos = tempoDecorridoMs / (1000 * 60);
          const tempoRestante = duracaoPlanejada - tempoDecorridoMinutos;
          
          if (tempoRestante <= 0) {
            // Tarefa está atrasada
            return {
              display: formatTime(Math.abs(tempoRestante), true), // ✅ Mostrar valor absoluto do atraso
              color: 'text-red-500 font-bold animate-pulse',
              label: 'Atrasada'
            };
          } else {
            return {
              display: formatTime(tempoRestante, true),
              color: 'text-blue-500 font-medium',
              label: 'Tempo restante'
            };
          }
        }
        return {
          display: formatTime(duracaoPlanejada),
          color: 'text-blue-500',
          label: 'Duração planejada'
        };

      case 'atrasada':
        if (task.data_inicio) {
          const inicio = new Date(task.data_inicio);
          const tempoDecorridoMs = currentTime.getTime() - inicio.getTime();
          const tempoDecorridoMinutos = tempoDecorridoMs / (1000 * 60);
          const atraso = tempoDecorridoMinutos - duracaoPlanejada;
          return {
            display: formatTime(Math.abs(atraso), true), // ✅ Mostrar valor absoluto do atraso
            color: 'text-red-500 font-bold animate-pulse',
            label: 'Atrasada'
          };
        }
        return {
          display: '00:00:00',
          color: 'text-red-500',
          label: 'Atrasada'
        };

      case 'pausada':
        return {
          display: formatTime(duracaoPlanejada),
          color: 'text-yellow-500',
          label: 'Pausada'
        };

      case 'concluida':
        // Calcular tempo real baseado em data_inicio e data_conclusao
        let tempoReal = duracaoPlanejada; // fallback
        
        if (task.data_inicio && task.data_conclusao) {
          const inicio = new Date(task.data_inicio);
          const conclusao = new Date(task.data_conclusao);
          const tempoRealMs = conclusao.getTime() - inicio.getTime();
          tempoReal = tempoRealMs / (1000 * 60); // converter para minutos
        } else if (task.tempo_execucao) {
          tempoReal = task.tempo_execucao;
        }
        
        return {
          display: formatTime(tempoReal), // ✅ Sempre com segundos agora
          color: 'text-green-500',
          label: 'Tempo total'
        };

      case 'preparacao':
        return {
          display: formatTime(duracaoPlanejada),
          color: 'text-purple-500',
          label: 'Próxima na fila'
        };

      default:
        return {
          display: formatTime(duracaoPlanejada),
          color: 'text-gray-400',
          label: 'Duração'
        };
    }
  };

  const timerInfo = getTimerInfo();

  return (
    <div className="flex items-center gap-1">
      <Clock className="w-3 h-3" />
      <span className={`text-xs ${timerInfo.color}`} title={timerInfo.label}>
        {timerInfo.display}
      </span>
    </div>
  );
};

// Componente de Status Badge
const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const statusConfig = {
    aguardando: { color: 'bg-gray-500', icon: Clock, label: 'Aguardando' },
    executando: { color: 'bg-blue-500', icon: PlayCircle, label: 'Executando' },
    atrasada: { color: 'bg-red-500', icon: AlertCircle, label: 'Atrasada' },
    pausada: { color: 'bg-yellow-500', icon: PauseCircle, label: 'Pausada' },
    concluida: { color: 'bg-green-500', icon: CheckCircle, label: 'Concluída' },
    preparacao: { color: 'bg-purple-500', icon: Timer, label: 'Preparação' }
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
  onDelete: (taskId: string) => void;
  onEdit: (task: Tarefa) => void;
  onMoveUp: (taskId: string) => void;
  onMoveDown: (taskId: string) => void;
  onView?: (task: Tarefa) => void;
  onComplete?: (task: Tarefa) => void;
  onUpdate?: (task: Tarefa) => void;
  onSequenceUpdate?: (completedTaskId: string) => void;
  isEditing?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}> = ({ task, onStatusChange, onDelete, onEdit, onMoveUp, onMoveDown, onView, onComplete, onUpdate, onSequenceUpdate, isEditing = false, isFirst = false, isLast = false }) => {
  
  // Estado para atualização em tempo real do cronômetro
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estados para os modais
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);

  // Estado para animação de mudança de status
  const [statusAnimation, setStatusAnimation] = useState<string | null>(null);
  const [previousStatus, setPreviousStatus] = useState<Status>(task.status);

  // Funções dos modais
  const handleViewTask = () => {
    console.log('Abrindo modal para tarefa:', task.nome, 'Status:', task.status, 'Resultado:', task.resultado);
    setShowTaskViewModal(true);
  };

  const handleCompleteTask = () => {
    setShowTaskCompletionModal(true);
  };

  const handleTaskCompletion = (resultado: any) => {
    const agora = new Date();
    
    // Calcular tempo real de execução
    let tempoExecucaoMinutos = task.prazo_horas; // fallback
    
    if (task.data_inicio) {
      const inicio = new Date(task.data_inicio);
      const tempoExecucaoMs = agora.getTime() - inicio.getTime();
      tempoExecucaoMinutos = tempoExecucaoMs / (1000 * 60); // converter para minutos
    }
    
    // Atualizar a tarefa com o resultado e status concluída
    const updatedTask = {
      ...task,
      status: 'concluida' as Status,
      resultado: resultado,
      data_conclusao: agora.toISOString(), // ✅ Definir data de conclusão
      tempo_execucao: tempoExecucaoMinutos // ✅ Tempo real em minutos
    };
    
    console.log('Tarefa concluída:', task.nome, {
      inicio: task.data_inicio,
      conclusao: agora.toISOString(),
      tempoReal: `${Math.floor(tempoExecucaoMinutos / 60)}h ${Math.floor(tempoExecucaoMinutos % 60)}m`,
      resultado
    });
    
    // Chamar função de callback para atualizar a lista de tarefas
    if (onUpdate) {
      onUpdate(updatedTask);
    }
    
    // Chamar função para atualizar a sequência de tarefas
    if (onSequenceUpdate) {
      onSequenceUpdate(task.id);
    }
    
    setShowTaskCompletionModal(false);
  };

  const handleNotifySetor = () => {
    alert(`Setor ${task.setor || task.responsavel_tipo} foi notificado sobre a tarefa: ${task.nome}`);
  };

  const handleResponsavelChange = (novoResponsavel: string) => {
    console.log('Responsável alterado:', task.nome, '→', novoResponsavel);
    // Implementar lógica de atualização do responsável
  };

  // Detectar mudanças de status e aplicar animação
  useEffect(() => {
    if (previousStatus !== task.status) {
      // Mapear cores para cada status
      const statusColors = {
        'aguardando': 'animate-pulse-blue',
        'preparacao': 'animate-pulse-purple', 
        'executando': 'animate-pulse-blue', // ✅ Azul para executando
        'atrasada': 'animate-pulse-red',
        'concluida': 'animate-pulse-green-bright'
      };
      
      const animationClass = statusColors[task.status as keyof typeof statusColors];
      setStatusAnimation(animationClass);
      setPreviousStatus(task.status);
      
      // Remover animação após 3 segundos
      setTimeout(() => {
        setStatusAnimation(null);
      }, 3000);
    }
  }, [task.status, previousStatus]);

  // Atualizar o tempo atual a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Verifica se a tarefa pode ser editada/movida (apenas aguardando e preparacao)
  const canBeEdited = task.status === 'aguardando' || task.status === 'preparacao';
  const isFrozen = !canBeEdited; // executando, atrasada, concluida ficam congeladas

  const formatTime = (totalMinutes: number, showSeconds: boolean = true) => { // ✅ Sempre mostrar segundos por padrão
    const isNegative = totalMinutes < 0;
    const absMinutes = Math.abs(totalMinutes);
    
    const days = Math.floor(absMinutes / (24 * 60));
    const hours = Math.floor((absMinutes % (24 * 60)) / 60);
    const mins = Math.floor(absMinutes % 60);
    const secs = Math.floor((absMinutes % 1) * 60);
    const sign = isNegative ? '-' : '';
    
    // Se tem dias, mostrar formato: 4D 12:20:30
    if (days > 0) {
      if (showSeconds) {
        return `${sign}${days}D ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else {
        return `${sign}${days}D ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      }
    }
    
    // Formato normal para menos de 24h
    if (showSeconds) {
      return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
  };

  const getTimerInfo = () => {
    const duracaoPlanejada = task.prazo_horas;

    switch (task.status) {
      case 'aguardando':
        return {
          display: formatTime(duracaoPlanejada),
          color: 'text-gray-400',
          label: 'Duração planejada'
        };

      case 'executando':
        if (task.data_inicio) {
          const inicio = new Date(task.data_inicio);
          const tempoDecorridoMs = currentTime.getTime() - inicio.getTime();
          const tempoDecorridoMinutos = tempoDecorridoMs / (1000 * 60);
          const tempoRestante = duracaoPlanejada - tempoDecorridoMinutos;
          
          if (tempoRestante <= 0) {
            return {
              display: formatTime(Math.abs(tempoRestante), true), // ✅ Mostrar valor absoluto do atraso
              color: 'text-red-500 font-bold animate-pulse',
              label: 'Atrasada'
            };
          } else {
            return {
              display: formatTime(tempoRestante, true),
              color: 'text-blue-500 font-medium',
              label: 'Tempo restante'
            };
          }
        }
        return {
          display: formatTime(duracaoPlanejada),
          color: 'text-blue-500',
          label: 'Duração planejada'
        };

      case 'atrasada':
        if (task.data_inicio) {
          const inicio = new Date(task.data_inicio);
          const tempoDecorridoMs = currentTime.getTime() - inicio.getTime();
          const tempoDecorridoMinutos = tempoDecorridoMs / (1000 * 60);
          const atraso = tempoDecorridoMinutos - duracaoPlanejada;
          return {
            display: formatTime(Math.abs(atraso), true), // ✅ Mostrar valor absoluto do atraso
            color: 'text-red-500 font-bold animate-pulse',
            label: 'Atrasada'
          };
        }
        return {
          display: '00:00:00',
          color: 'text-red-500',
          label: 'Atrasada'
        };

      case 'pausada':
        return {
          display: formatTime(duracaoPlanejada),
          color: 'text-yellow-500',
          label: 'Pausada'
        };

      case 'concluida':
        // Calcular tempo real baseado em data_inicio e data_conclusao
        let tempoReal = duracaoPlanejada; // fallback
        
        if (task.data_inicio && task.data_conclusao) {
          const inicio = new Date(task.data_inicio);
          const conclusao = new Date(task.data_conclusao);
          const tempoRealMs = conclusao.getTime() - inicio.getTime();
          tempoReal = tempoRealMs / (1000 * 60); // converter para minutos
        } else if (task.tempo_execucao) {
          tempoReal = task.tempo_execucao;
        }
        
        return {
          display: formatTime(tempoReal), // ✅ Sempre com segundos agora
          color: 'text-green-500',
          label: 'Tempo total'
        };

      case 'preparacao':
        return {
          display: formatTime(duracaoPlanejada),
          color: 'text-purple-500',
          label: 'Próxima na fila'
        };

      default:
        return {
          display: formatTime(duracaoPlanejada),
          color: 'text-gray-400',
          label: 'Duração'
        };
    }
  };

  const timerInfo = getTimerInfo();

  return (
    <>
      <div className={`rounded-lg px-3 py-2 mb-1 border transition-colors ${
        isEditing && isFrozen 
          ? 'bg-gray-800/50 border-gray-700/50 opacity-75' 
          : 'bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer'
      } ${statusAnimation || ''}`}
      onClick={() => !isEditing && handleViewTask()} // Modal de visualização real
      >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          {isEditing && canBeEdited && (
            <div className="flex flex-col gap-0.5 mt-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(task.id);
                }}
                disabled={isFirst}
                className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${
                  isFirst
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
                title="Mover para cima"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(task.id);
                }}
                disabled={isLast}
                className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${
                  isLast
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
                title="Mover para baixo"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex-1">
            <h5 className="text-sm font-medium text-gray-200 mb-1">{task.nome}</h5>
            
            {/* Segunda linha: Responsável e Setor lado a lado */}
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-1">
              {/* Responsável */}
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                <span className={`${
                  !task.responsavel_nome && task.status !== 'aguardando' && task.status !== 'concluida'
                    ? 'text-red-400 font-semibold' 
                    : 'text-gray-300'
                }`}>
                  {task.responsavel_nome || 'Indefinido'}
                </span>
              </div>
              
              {/* Setor */}
              <div className="flex items-center">
                <Building className="w-3 h-3 mr-1" />
                <span className="text-gray-300">{task.responsavel_tipo || task.setor}</span>
              </div>
            </div>
            
            {/* Terceira linha: Anexos (apenas se tiver) */}
            {task.templates && task.templates.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Paperclip className="w-3 h-3" />
                <span className="text-gray-300">
                  {task.templates.length} anexo{task.templates.length > 1 ? 's' : ''}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Visualizar anexos da tarefa: ${task.nome}`);
                  }}
                  className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Visualizar
                </button>
              </div>
            )}
            
            {/* Botões de edição (apenas no modo edição) */}
            {isEditing && canBeEdited && (
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-blue-600 hover:text-white text-gray-400"
                  title="Editar tarefa"
                >
                  <PenTool className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const confirmDelete = window.confirm(
                      `Tem certeza que deseja excluir a tarefa "${task.nome}"?\n\nEsta ação não pode ser desfeita.`
                    );
                    
                    if (confirmDelete) {
                      onDelete(task.id);
                    }
                  }}
                  className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-red-600 hover:text-white text-gray-400"
                  title="Excluir tarefa"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                
                {/* Botão de teste para animações - TEMPORÁRIO */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const statuses: Status[] = ['aguardando', 'preparacao', 'executando', 'atrasada', 'concluida'];
                    const currentIndex = statuses.indexOf(task.status);
                    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                    
                    // Simular mudança de status para demonstrar animação
                    setPreviousStatus(task.status);
                    // Aqui você chamaria a função real de atualização de status
                    console.log(`Mudando status de ${task.status} para ${nextStatus}`);
                  }}
                  className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-purple-600 hover:text-white text-gray-400"
                  title="Testar animação (TEMPORÁRIO)"
                >
                  ✨
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Lateral direita: Status, Cronômetro e Botão */}
        <div className="flex items-stretch gap-2 h-full min-h-[60px]">
          {/* Status e Cronômetro */}
          <div className="flex flex-col items-end justify-center gap-0.5">
            <StatusBadge status={task.status} />
            <h1 className={`text-xl font-bold ${timerInfo.color}`} title={timerInfo.label}>
              {timerInfo.display}
            </h1>
          </div>

          {/* Botão Concluir (altura total) */}
          {!isEditing && (task.status === 'executando' || task.status === 'atrasada') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCompleteTask();
              }}
              className="flex items-center justify-center w-10 border-2 border-gray-600 text-gray-400 hover:bg-green-600 hover:text-white hover:border-green-600 rounded-lg font-medium text-xs transition-all self-stretch"
              title="Concluir tarefa"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      </div>
      
      {/* Modais do TaskItem */}
      <TaskViewModal
        isOpen={showTaskViewModal}
        onClose={() => setShowTaskViewModal(false)}
        task={task}
      />

      <TaskCompletionModal
        isOpen={showTaskCompletionModal}
        onClose={() => setShowTaskCompletionModal(false)}
        task={task}
        onComplete={handleTaskCompletion}
      />
    </>
  );
};

// Modal de Visualização de Tarefa
const TaskViewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  task: Tarefa | null;
}> = ({ isOpen, onClose, task }) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{task.nome}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações principais */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Responsável</label>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className={`${
                !task.responsavel_nome && task.status !== 'aguardando' && task.status !== 'concluida'
                  ? 'text-red-400 font-semibold' 
                  : 'text-gray-300'
              }`}>{task.responsavel_nome || 'Indefinido'}</span>
              
              {/* Botão alertar setor - apenas quando responsável indefinido e status aguardando/preparação */}
              {!task.responsavel_nome && (task.status === 'aguardando' || task.status === 'preparacao') && (
                <button
                  onClick={() => alert(`Setor ${task.responsavel_tipo || task.setor} foi alertado sobre a tarefa: ${task.nome}`)}
                  className="flex items-center justify-center w-4 h-4 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
                  title="Alertar setor"
                >
                  <Bell className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* Setor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Setor</label>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{task.responsavel_tipo}</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <StatusBadge status={task.status} />
          </div>

          {/* Duração */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duração</label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{Math.floor(task.prazo_horas / 60)}h {task.prazo_horas % 60}min</span>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Instruções</label>
          <div className="bg-gray-700 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
            <p className="text-gray-300 whitespace-pre-wrap">
              {task.instrucao || 'Nenhuma instrução fornecida.'}
            </p>
            
            {/* Anexos como botões no final das instruções */}
            {task.templates && task.templates.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-600">
                <div className="flex flex-wrap gap-2">
                  {task.templates.map(template => (
                    <button 
                      key={template.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
                      onClick={() => alert(`Visualizar: ${template.nome}`)}
                    >
                      <Paperclip className="w-3 h-3" />
                      {template.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resultado (apenas para tarefas concluídas) */}
        {task && task.status === 'concluida' && task.resultado && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Resultado</label>
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">{task.resultado.descricao}</h4>
              {task.resultado.paragrafo && (
                <div className="text-gray-300 mb-4 whitespace-pre-wrap min-h-[200px] max-h-[400px] overflow-y-auto bg-gray-800 p-4 rounded">
                  {task.resultado.paragrafo}
                </div>
              )}
              
              {/* Anexos do resultado como botões */}
              {task.resultado.anexos && task.resultado.anexos.length > 0 && (
                <div className="border-t border-gray-600 pt-3">
                  <span className="text-sm text-gray-400 block mb-2">Arquivos resultado:</span>
                  <div className="flex flex-wrap gap-2">
                    {task.resultado.anexos.map((anexo, index) => (
                      <button 
                        key={index}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                        title={`${(anexo.tamanho / 1024 / 1024).toFixed(1)} MB`}
                      >
                        <Paperclip className="w-3 h-3" />
                        {anexo.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de Conclusão de Tarefa
const TaskCompletionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  task: Tarefa | null;
  onComplete: (resultado: any) => void;
}> = ({ isOpen, onClose, task, onComplete }) => {
  const [descricao, setDescricao] = useState('');
  const [paragrafo, setParagrafo] = useState('');
  const [anexos, setAnexos] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAnexos(prev => [...prev, ...files]);
  };

  const removeAnexo = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!descricao.trim()) {
      alert('A descrição é obrigatória!');
      return;
    }

    const resultado = {
      descricao: descricao.trim(),
      paragrafo: paragrafo.trim(),
      anexos: anexos.map(file => ({
        nome: file.name,
        tipo: file.type,
        tamanho: file.size
      }))
    };

    onComplete(resultado);
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Concluir: {task.nome}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Descrição (obrigatória) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descrição do resultado <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Breve descrição do que foi realizado..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Parágrafo (opcional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Detalhes adicionais (opcional)
          </label>
          <textarea
            value={paragrafo}
            onChange={(e) => setParagrafo(e.target.value)}
            placeholder="Informações detalhadas, observações, dificuldades encontradas..."
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none resize-vertical"
          />
        </div>

        {/* Anexos */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Arquivos resultado
          </label>
          <div className="space-y-2">
            {/* Input de upload */}
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-gray-300"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm">Clique para adicionar arquivos</span>
              </label>
            </div>

            {/* Lista de arquivos */}
            {anexos.length > 0 && (
              <div className="space-y-1">
                {anexos.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 flex-1">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <button
                      onClick={() => removeAnexo(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!descricao.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Concluir Tarefa
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de Serviço
const ServiceItem: React.FC<{ 
  service: Servico; 
  expanded?: boolean; 
  onToggle?: () => void;
  editingServiceId: string | null;
  onStartEditing: (serviceId: string) => void;
  onStopEditing: () => void;
  onViewTask?: (task: Tarefa) => void;
  onCompleteTask?: (task: Tarefa) => void;
}> = ({ service, editingServiceId, onStartEditing, onStopEditing, onViewTask, onCompleteTask }) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [orderedTasks, setOrderedTasks] = useState<Tarefa[]>(service.tarefas || []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Verifica se este serviço pode entrar em modo edição
  const canEdit = editingServiceId === null || editingServiceId === service.id;
  const isThisServiceEditing = editingServiceId === service.id;

  // Atualizar a ordem local quando as tarefas do serviço mudarem
  useEffect(() => {
    setOrderedTasks(service.tarefas || []);
  }, [service.tarefas]);

  // Hook para detectar e atualizar tarefas atrasadas
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setOrderedTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.status === 'executando' && task.data_inicio && !task.data_conclusao) {
            const inicio = new Date(task.data_inicio);
            const tempoDecorrido = Math.floor((now.getTime() - inicio.getTime()) / (1000 * 60));
            
            if (tempoDecorrido > task.prazo_horas) {
              return { ...task, status: 'atrasada' as Status };
            }
          }
          return task;
        })
      );
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, []);

  // Nova função de recálculo de status conforme especificado
  const recalculateTaskStatus = (tasks: Tarefa[]) => {
    return tasks.map((task, index) => {
      // Tarefas concluídas nunca mudam
      if (task.status === 'concluida') {
        return task;
      }

      // Tarefas executando, atrasada mantém o status
      if (task.status === 'executando' || task.status === 'atrasada') {
        return task;
      }

      // Para aguardando e preparacao, aplicar nova lógica:
      if (task.status === 'aguardando' || task.status === 'preparacao') {
        // Primeira tarefa ou após uma concluída: Executando
        if (index === 0) {
          return { 
            ...task, 
            status: 'executando' as Status,
            data_inicio: task.data_inicio || new Date().toISOString()
          };
        }

        const previousTask = tasks[index - 1];
        if (previousTask && previousTask.status === 'concluida') {
          return { 
            ...task, 
            status: 'executando' as Status,
            data_inicio: task.data_inicio || new Date().toISOString()
          };
        }

        // Primeira tarefa após uma Executando, concluída ou Atrasada: Preparação
        if (previousTask && (
          previousTask.status === 'executando' || 
          previousTask.status === 'concluida' || 
          previousTask.status === 'atrasada'
        )) {
          return { ...task, status: 'preparacao' as Status };
        }

        // As demais: Aguardando
        return { ...task, status: 'aguardando' as Status };
      }

      return task;
    });
  };

  const handleMoveUp = (taskId: string) => {
    const currentIndex = orderedTasks.findIndex(task => task.id === taskId);
    const currentTask = orderedTasks[currentIndex];
    
    // Só permite mover tarefas editáveis (aguardando e preparacao)
    if (currentTask.status !== 'aguardando' && currentTask.status !== 'preparacao') {
      return;
    }
    
    if (currentIndex > 0) {
      const newTasks = [...orderedTasks];
      [newTasks[currentIndex - 1], newTasks[currentIndex]] = [newTasks[currentIndex], newTasks[currentIndex - 1]];
      setOrderedTasks(newTasks);
      setHasUnsavedChanges(true);
    }
  };

  const handleMoveDown = (taskId: string) => {
    const currentIndex = orderedTasks.findIndex(task => task.id === taskId);
    const currentTask = orderedTasks[currentIndex];
    
    // Só permite mover tarefas editáveis (aguardando e preparacao)
    if (currentTask.status !== 'aguardando' && currentTask.status !== 'preparacao') {
      return;
    }
    
    if (currentIndex < orderedTasks.length - 1) {
      const newTasks = [...orderedTasks];
      [newTasks[currentIndex], newTasks[currentIndex + 1]] = [newTasks[currentIndex + 1], newTasks[currentIndex]];
      setOrderedTasks(newTasks);
      setHasUnsavedChanges(true);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const newTasks = orderedTasks.filter(task => task.id !== taskId);
    setOrderedTasks(newTasks);
    setHasUnsavedChanges(true);
  };

  const handleEditTask = (task: Tarefa) => {
    setEditingTask(task);
    setShowEditTaskModal(true);
  };

  const handleUpdateTask = (taskData: Partial<Tarefa>) => {
    if (taskData.id) {
      setOrderedTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskData.id 
            ? { 
                ...task, 
                ...taskData,
                setor: taskData.responsavel_tipo || task.setor // Atualizar setor baseado no responsável
              }
            : task
        )
      );
      setHasUnsavedChanges(true);
    }
    setEditingTask(null);
    setShowEditTaskModal(false);
  };

  const handleSequenceUpdate = (completedTaskId: string) => {
    setOrderedTasks(prevTasks => {
      // Ordenar tarefas por ordem (se disponível) ou manter ordem atual
      const sortedTasks = [...prevTasks].sort((a, b) => {
        if (a.ordem !== undefined && b.ordem !== undefined) {
          return a.ordem - b.ordem;
        }
        return 0; // Manter ordem atual se não há propriedade ordem
      });
      
      const completedIndex = sortedTasks.findIndex(task => task.id === completedTaskId);
      
      if (completedIndex === -1) return prevTasks;
      
      console.log('🏁 Iniciando atualização de sequência para tarefa:', sortedTasks[completedIndex].nome);
      
      // Marcar a tarefa como concluída
      sortedTasks[completedIndex] = {
        ...sortedTasks[completedIndex],
        status: 'concluida' as Status
      };
      
      // LÓGICA CORRETA:
      // 1. Primeiro: Tarefa em "Preparação" → "Executando"
      const preparacaoIndex = sortedTasks.findIndex(task => task.status === 'preparacao');
      if (preparacaoIndex !== -1) {
        console.log('🚀 Movendo de Preparação → Executando:', sortedTasks[preparacaoIndex].nome);
        sortedTasks[preparacaoIndex] = {
          ...sortedTasks[preparacaoIndex],
          status: 'executando' as Status,
          data_inicio: new Date().toISOString() // ✅ Definir data de início
        };
        
        // 2. Depois: Próxima "Aguardando" (por ordem) → "Preparação"
        const nextAguardandoIndex = sortedTasks.findIndex((task, index) => {
          // Se tem propriedade ordem, usar a lógica baseada em ordem
          if (task.ordem !== undefined && sortedTasks[preparacaoIndex].ordem !== undefined) {
            return task.status === 'aguardando' && task.ordem > sortedTasks[preparacaoIndex].ordem;
          }
          // Senão, usar índice do array
          return index > preparacaoIndex && task.status === 'aguardando';
        });
        
        if (nextAguardandoIndex !== -1) {
          console.log('⏰ Colocando em Preparação:', sortedTasks[nextAguardandoIndex].nome);
          sortedTasks[nextAguardandoIndex] = {
            ...sortedTasks[nextAguardandoIndex],
            status: 'preparacao' as Status
          };
        }
      } else {
        // Caso não haja tarefa em preparação, pegar primeira aguardando
        const nextAguardandoIndex = sortedTasks.findIndex(task => task.status === 'aguardando');
        if (nextAguardandoIndex !== -1) {
          console.log('🚀 Iniciando próxima tarefa (sem preparação):', sortedTasks[nextAguardandoIndex].nome);
          sortedTasks[nextAguardandoIndex] = {
            ...sortedTasks[nextAguardandoIndex],
            status: 'executando' as Status,
            data_inicio: new Date().toISOString() // ✅ Definir data de início
          };
          
          // Colocar a seguinte em preparação (baseado em ordem ou índice)
          const nextPreparacaoIndex = sortedTasks.findIndex((task, index) => {
            if (task.ordem !== undefined && sortedTasks[nextAguardandoIndex].ordem !== undefined) {
              return task.status === 'aguardando' && task.ordem > sortedTasks[nextAguardandoIndex].ordem;
            }
            return index > nextAguardandoIndex && task.status === 'aguardando';
          });
          
          if (nextPreparacaoIndex !== -1) {
            console.log('⏰ Colocando em Preparação:', sortedTasks[nextPreparacaoIndex].nome);
            sortedTasks[nextPreparacaoIndex] = {
              ...sortedTasks[nextPreparacaoIndex],
              status: 'preparacao' as Status
            };
          }
        }
      }
      
      console.log('✅ Sequência atualizada:', {
        concluida: sortedTasks[completedIndex]?.nome,
        executando: sortedTasks.find(t => t.status === 'executando')?.nome,
        preparacao: sortedTasks.find(t => t.status === 'preparacao')?.nome,
        aguardando: sortedTasks.filter(t => t.status === 'aguardando').length + ' tarefas'
      });
      
      return sortedTasks;
    });
    
    setHasUnsavedChanges(true);
  };

  const handleAddNewTask = (taskData: Partial<Tarefa>) => {
    const newTask: Tarefa = {
      id: Math.random().toString(36).substr(2, 9),
      nome: taskData.nome || '',
      status: 'aguardando' as Status,
      setor: taskData.responsavel_tipo || '', // Setor vem do responsável_tipo
      responsavel_nome: taskData.responsavel_tipo,
      responsavel_tipo: taskData.responsavel_tipo,
      prazo_horas: taskData.prazo_horas || 0,
      mandrill_coins: taskData.mandrill_coins || 0,
      instrucao: taskData.instrucao,
      templates: taskData.templates || []
    };

    setOrderedTasks(prev => [...prev, newTask]);
    setHasUnsavedChanges(true);
  };

  // Função para entrar no modo edição
  const handleEnterEditMode = () => {
    if (!canEdit) {
      alert('Outro serviço já está sendo editado. Finalize a edição anterior antes de continuar.');
      return;
    }

    setIsEditing(true);
    onStartEditing(service.id);
  };

  // Função para sair do modo edição (salvar)
  const handleSaveChanges = () => {
    // Aplica nova lógica de recálculo
    setOrderedTasks(prevTasks => recalculateTaskStatus(prevTasks));
    
    setIsEditing(false);
    setHasUnsavedChanges(false);
    onStopEditing();
    
    // TODO: Aqui seria onde perguntaríamos se quer salvar como preset
    if (hasUnsavedChanges) {
      console.log('Mudanças detectadas - opção de salvar como preset');
    }
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    // Confirmação se há mudanças não salvas
    if (hasUnsavedChanges) {
      const confirmCancel = window.confirm(
        'Há mudanças não salvas que serão perdidas. Tem certeza que deseja cancelar?'
      );
      
      if (!confirmCancel) return;
    }

    // Restaura o estado original das tarefas
    setOrderedTasks(service.tarefas || []);
    
    setIsEditing(false);
    setHasUnsavedChanges(false);
    onStopEditing();
  };

  // Detecta mudanças para marcar como não salvo
  useEffect(() => {
    if (isEditing) {
      const hasChanged = JSON.stringify(orderedTasks) !== JSON.stringify(service.tarefas || []);
      setHasUnsavedChanges(hasChanged);
    }
  }, [orderedTasks, isEditing, service.tarefas]);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 mb-3">
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
                {orderedTasks.length} tarefas
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
              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Tarefas {isEditing && <span className="text-yellow-400">(Modo Edição - Apenas aguardando/preparação podem ser editadas)</span>}
              </h5>
              <TasksHeader 
                serviceId={service.id} 
                isEditing={isEditing}
                canEdit={canEdit}
                onEnterEdit={handleEnterEditMode}
                onSaveChanges={handleSaveChanges}
                onCancelEdit={handleCancelEdit}
                onNewTask={handleAddNewTask}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            </div>
            {orderedTasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                onStatusChange={() => {}}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onUpdate={handleUpdateTask}
                onSequenceUpdate={handleSequenceUpdate}
                isEditing={isEditing}
                isFirst={index === 0}
                isLast={index === orderedTasks.length - 1}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Modal de edição de tarefa */}
      <NewTaskModal
        isOpen={showEditTaskModal}
        onClose={() => {
          setShowEditTaskModal(false);
          setEditingTask(null);
        }}
        onSave={handleUpdateTask}
        editingTask={editingTask}
      />
    </div>
  );
};

// Componente de Entrega
const DeliveryItem: React.FC<{ 
  delivery: Entrega; 
  expanded?: boolean; 
  onToggle?: () => void;
  router: any;
  editingServiceId: string | null;
  onStartEditing: (serviceId: string) => void;
  onStopEditing: () => void;
}> = ({ delivery, router, editingServiceId, onStartEditing, onStopEditing }) => {
  const [localExpanded, setLocalExpanded] = useState(false);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 mb-4">
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
                <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition-colors">
                  <Plus className="w-3 h-3" />
                  Adicionar Serviço
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/pipeline/${delivery.id}`);
                  }}
                  className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-400 transition-colors"
                >
                  <GitBranch className="w-3 h-3" />
                  Configurar Pipeline
                </button>
              </div>
            </div>
            {delivery.servicos && delivery.servicos.length > 0 ? (
              delivery.servicos.map(service => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  editingServiceId={editingServiceId}
                  onStartEditing={onStartEditing}
                  onStopEditing={onStopEditing}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhum serviço cadastrado para esta entrega
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Projeto
const ProjectItem: React.FC<{ 
  project: Projeto; 
  router: any;
  editingServiceId: string | null;
  onStartEditing: (serviceId: string) => void;
  onStopEditing: () => void;
  onViewTask?: (task: Tarefa) => void;
  onCompleteTask?: (task: Tarefa) => void;
}> = ({ project, router, editingServiceId, onStartEditing, onStopEditing, onViewTask, onCompleteTask }) => {
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
              router={router}
              editingServiceId={editingServiceId}
              onStartEditing={onStartEditing}
              onStopEditing={onStopEditing}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente Principal
export default function Dashboard() {
  const router = useRouter();
  const [projetos, setProjetos] = useState<Projeto[]>(mockProjetos);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  // Estados dos novos modais
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);

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

  // Funções de controle dos modais
  const handleViewTask = (task: Tarefa) => {
    setSelectedTask(task);
    setShowTaskViewModal(true);
  };

  const handleCompleteTask = (task: Tarefa) => {
    setSelectedTask(task);
    setShowTaskCompletionModal(true);
  };

  const handleTaskCompletion = (resultado: any) => {
    if (!selectedTask) return;
    
    const agora = new Date();
    
    // Calcular tempo real de execução
    let tempoExecucaoMinutos = selectedTask.prazo_horas; // fallback
    
    if (selectedTask.data_inicio) {
      const inicio = new Date(selectedTask.data_inicio);
      const tempoExecucaoMs = agora.getTime() - inicio.getTime();
      tempoExecucaoMinutos = tempoExecucaoMs / (1000 * 60); // converter para minutos
    }
    
    // Atualizar a tarefa com o resultado
    const updatedTask = {
      ...selectedTask,
      status: 'concluida' as Status,
      resultado: resultado,
      data_conclusao: agora.toISOString(), // ✅ Definir data de conclusão
      tempo_execucao: tempoExecucaoMinutos // ✅ Tempo real em minutos
    };
    
    console.log('Tarefa concluída (Dashboard):', selectedTask.nome, {
      inicio: selectedTask.data_inicio,
      conclusao: agora.toISOString(),
      tempoReal: `${Math.floor(tempoExecucaoMinutos / 60)}h ${Math.floor(tempoExecucaoMinutos % 60)}m`,
      resultado
    });
    
    // Atualizar nos projetos
    setProjetos(prevProjetos => 
      prevProjetos.map(projeto => ({
        ...projeto,
        entregas: projeto.entregas?.map(entrega => ({
          ...entrega,
          servicos: entrega.servicos?.map(servico => ({
            ...servico,
            tarefas: servico.tarefas?.map(tarefa => 
              tarefa.id === selectedTask.id ? updatedTask : tarefa
            )
          }))
        })) || []
      }))
    );
    
    setShowTaskCompletionModal(false);
    setSelectedTask(null);
    console.log('Tarefa concluída:', updatedTask);
  };

  const handleNotifySetor = (task: Tarefa) => {
    console.log('Avisar setor sobre tarefa:', task);
    // Implementar lógica de notificação
    alert(`Setor ${task.setor} foi notificado sobre a tarefa: ${task.nome}`);
  };

  const handleResponsavelChange = (task: Tarefa, novoResponsavel: string) => {
    // Atualizar o responsável da tarefa
    setProjetos(prevProjetos => 
      prevProjetos.map(projeto => ({
        ...projeto,
        entregas: projeto.entregas?.map(entrega => ({
          ...entrega,
          servicos: entrega.servicos?.map(servico => ({
            ...servico,
            tarefas: servico.tarefas?.map(tarefa => 
              tarefa.id === task.id 
                ? { ...tarefa, responsavel_nome: novoResponsavel }
                : tarefa
            )
          }))
        })) || []
      }))
    );
    console.log('Responsável alterado:', task.nome, '→', novoResponsavel);
  };

  useEffect(() => {
    // fetchProjetos(); // Comentado temporariamente para usar dados mock
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
              <span className="text-xs text-gray-500">Taxa de Conclusão</span>
              <CheckCircle className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-white">87%</div>
            <div className="text-xs text-purple-500">Média mensal</div>
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
            <ProjectItem 
              key={project.id} 
              project={project} 
              router={router}
              editingServiceId={editingServiceId}
              onStartEditing={setEditingServiceId}
              onStopEditing={() => setEditingServiceId(null)}
              onViewTask={handleViewTask}
              onCompleteTask={handleCompleteTask}
            />
          ))}
        </div>
      </div>

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
        onComplete={handleTaskCompletion}
      />
    </div>
  );
}