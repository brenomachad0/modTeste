// Dados mockados para demonstração do sistema
// Este arquivo contém dados de exemplo para projetos, entregas, serviços e tarefas

export interface Template {
  id: string;
  nome: string;
  arquivo: File;
  url?: string;
}

export interface Tarefa {
  id: string;
  nome: string;
  status: 'aguardando' | 'executando' | 'pausada' | 'atrasada' | 'concluida' | 'preparacao';
  ordem?: number;
  setor: string;
  responsavel_usuario?: string | null;
  responsavel_nome?: string | null;
  responsavel_tipo?: string;
  prazo_horas: number;
  mandrill_coins: number;
  instrucao?: string;
  templates?: Template[];
  data_inicio?: string;
  data_conclusao?: string;
  tempo_execucao?: number;
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

export interface Servico {
  id: string;
  nome: string;
  status: 'aguardando' | 'executando' | 'pausada' | 'atrasada' | 'concluida' | 'preparacao';
  progresso_percentual: number;
  tarefas?: Tarefa[];
}

export interface Entrega {
  id: string;
  nome: string;
  status: 'aguardando' | 'executando' | 'pausada' | 'atrasada' | 'concluida' | 'preparacao';
  progresso_percentual: number;
  briefing: string;
  icone: string;
  deadline?: string;
  valor_unitario?: number;
  servicos?: Servico[];
  // Para compatibilidade com EntregasList
  projeto_id: string;
  created_at: string;
  updated_at: string;
  total_servicos: number;
  servicos_concluidos: number;
  servicos_andamento: number;
  servicos_pendentes: number;
}

export interface Projeto {
  id: string;
  demanda_codigo: string;
  cliente_nome: string;
  motivo: string;
  status: 'aguardando' | 'executando' | 'pausada' | 'atrasada' | 'concluida' | 'preparacao';
  progresso_percentual: number;
  valor_total: number;
  prazo_dias: number;
  prazo_data: string;
  entregas?: Entrega[];
}

// Pessoas por setor para atribuição de responsáveis
export const pessoasPorSetor = {
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
  ],
  'Atendimento': [
    { id: '19', nome: 'Bruno Atendimento', avatar: '📞' },
    { id: '20', nome: 'Laura Consultora', avatar: '💬' },
    { id: '21', nome: 'Diego Suporte', avatar: '🎧' }
  ]
};

// Templates mockados para tarefas
export const mockTemplates: Template[] = [
  {
    id: 'tpl_briefing',
    nome: 'Checklist_Briefing.pdf',
    arquivo: {} as File,
    url: '/templates/briefing.pdf'
  },
  {
    id: 'tpl_roteiro',
    nome: 'Template_Roteiro.docx',
    arquivo: {} as File,
    url: '/templates/roteiro.docx'
  },
  {
    id: 'tpl_design',
    nome: 'Briefing_Design.pdf',
    arquivo: {} as File,
    url: '/templates/design_brief.pdf'
  },
  {
    id: 'tpl_entrega',
    nome: 'Checklist_Entrega.pdf',
    arquivo: {} as File,
    url: '/templates/entrega.pdf'
  }
];

// Dados mockados de projetos
export const mockProjetos: Projeto[] = [
  {
    id: 'proj_1',
    demanda_codigo: 'A2024',
    cliente_nome: 'TechnoVision Ltda',
    motivo: 'Campanha de Lançamento de Produto',
    status: 'executando',
    progresso_percentual: 65,
    valor_total: 45000.00,
    prazo_dias: 30,
    prazo_data: '2025-11-15',
    entregas: [
      {
        id: 'ent_1',
        nome: 'Vídeo Institucional 60s',
        status: 'executando',
        progresso_percentual: 80,
        briefing: 'Vídeo promocional para lançamento do novo produto no mercado B2B',
        icone: '🎬',
        deadline: '2025-10-25',
        valor_unitario: 15000,
        projeto_id: 'proj_1',
        created_at: '2025-09-15T10:00:00Z',
        updated_at: '2025-10-08T14:30:00Z',
        total_servicos: 3,
        servicos_concluidos: 2,
        servicos_andamento: 1,
        servicos_pendentes: 0,
        servicos: [
          {
            id: 'serv_1',
            nome: 'Pré-produção',
            status: 'concluida',
            progresso_percentual: 100,
            tarefas: [
              {
                id: 'tar_1',
                nome: 'Briefing com cliente',
                status: 'concluida',
                ordem: 1,
                setor: 'Atendimento',
                responsavel_nome: 'Bruno Atendimento',
                responsavel_tipo: 'Atendimento',
                prazo_horas: 120, // 2 horas
                mandrill_coins: 50,
                data_inicio: '2025-09-15T10:00:00Z',
                data_conclusao: '2025-09-15T11:45:00Z',
                tempo_execucao: 105, // 1h45min
                instrucao: 'Realizar reunião detalhada com cliente para compreender objetivos, público-alvo e expectativas do vídeo institucional.',
                templates: [mockTemplates[0]],
                resultado: {
                  descricao: 'Briefing aprovado com todas as especificações',
                  paragrafo: 'Reunião muito produtiva com o cliente. Definimos:\n\n• Objetivo: Apresentar o novo produto para mercado B2B\n• Público-alvo: Gestores de TI de empresas médias/grandes\n• Tom: Profissional, inovador e confiável\n• Duração: 60 segundos\n• Locação: Escritório moderno + estúdio\n• Orçamento aprovado: R$ 15.000\n\nCliente demonstrou muita satisfação com nossa proposta e processo.',
                  anexos: [
                    { nome: 'Briefing_TechnoVision_2024.pdf', tipo: 'application/pdf', tamanho: 2048000 },
                    { nome: 'Referencias_Visuais.zip', tipo: 'application/zip', tamanho: 15360000 },
                    { nome: 'Cronograma_Aprovado.xlsx', tipo: 'application/vnd.ms-excel', tamanho: 512000 }
                  ]
                }
              },
              {
                id: 'tar_2',
                nome: 'Desenvolvimento do roteiro',
                status: 'concluida',
                ordem: 2,
                setor: 'Criação',
                responsavel_nome: 'Maria Silva',
                responsavel_tipo: 'Criação',
                prazo_horas: 480, // 8 horas
                mandrill_coins: 200,
                data_inicio: '2025-09-16T09:00:00Z',
                data_conclusao: '2025-09-16T16:30:00Z',
                tempo_execucao: 450, // 7h30min
                instrucao: 'Criar roteiro completo baseado no briefing, incluindo texto, indicações técnicas e storyboard.',
                templates: [mockTemplates[1]],
                resultado: {
                  descricao: 'Roteiro finalizado e aprovado pelo cliente',
                  paragrafo: 'Roteiro desenvolvido seguindo estrutura narrativa adaptada para 60 segundos:\n\n• Abertura impactante (0-10s): Apresentação do problema\n• Desenvolvimento (10-45s): Solução oferecida pelo produto\n• Fechamento (45-60s): Call-to-action e marca\n\nIncluído storyboard com 12 cenas detalhadas. Cliente aprovou sem alterações.',
                  anexos: [
                    { nome: 'Roteiro_Final_v2.docx', tipo: 'application/msword', tamanho: 356000 },
                    { nome: 'Storyboard_TechnoVision.pdf', tipo: 'application/pdf', tamanho: 8192000 },
                    { nome: 'Referencias_Tecnicas.zip', tipo: 'application/zip', tamanho: 25600000 }
                  ]
                }
              },
              {
                id: 'tar_3',
                nome: 'Planejamento de produção',
                status: 'concluida',
                ordem: 3,
                setor: 'Produção',
                responsavel_nome: 'Gabriel Santos',
                responsavel_tipo: 'Produção',
                prazo_horas: 360, // 6 horas
                mandrill_coins: 150,
                data_inicio: '2025-09-17T08:00:00Z',
                data_conclusao: '2025-09-17T13:45:00Z',
                tempo_execucao: 345, // 5h45min
                instrucao: 'Organizar cronograma de gravação, reservar equipamentos e contratar equipe técnica.',
                resultado: {
                  descricao: 'Produção planejada e equipe contratada',
                  paragrafo: 'Cronograma de produção estabelecido:\n\n• Gravação principal: 22/09 (escritório cliente)\n• Gravação estúdio: 23/09 (nosso estúdio)\n• Equipe contratada: Diretor, cinegrafista, assistente\n• Equipamentos reservados: Câmera 4K, iluminação LED, áudio\n\nTudo confirmado e contratos assinados.',
                  anexos: [
                    { nome: 'Cronograma_Producao.pdf', tipo: 'application/pdf', tamanho: 1024000 },
                    { nome: 'Contratos_Equipe.zip', tipo: 'application/zip', tamanho: 5120000 }
                  ]
                }
              }
            ]
          },
          {
            id: 'serv_2',
            nome: 'Produção/Gravação',
            status: 'concluida',
            progresso_percentual: 100,
            tarefas: [
              {
                id: 'tar_4',
                nome: 'Gravação em escritório',
                status: 'concluida',
                ordem: 4,
                setor: 'Produção',
                responsavel_nome: 'Gabriel Santos',
                responsavel_tipo: 'Produção',
                prazo_horas: 480, // 8 horas
                mandrill_coins: 250,
                data_inicio: '2025-09-22T08:00:00Z',
                data_conclusao: '2025-09-22T15:30:00Z',
                tempo_execucao: 450, // 7h30min
                instrucao: 'Executar gravação conforme roteiro nas dependências do cliente.',
                resultado: {
                  descricao: 'Gravação realizada com sucesso',
                  paragrafo: 'Gravação no escritório do cliente transcorreu perfeitamente:\n\n• Todas as cenas do roteiro capturadas\n• Qualidade de imagem e áudio excelentes\n• Cliente muito satisfeito com o resultado\n• Material adicional (B-roll) também capturado\n• Backup imediato realizado\n\nEquipe trabalhou com grande profissionalismo.',
                  anexos: [
                    { nome: 'Material_Bruto_Escritorio.zip', tipo: 'application/zip', tamanho: 5368709120 }, // 5GB
                    { nome: 'Relatorio_Gravacao.pdf', tipo: 'application/pdf', tamanho: 2048000 }
                  ]
                }
              },
              {
                id: 'tar_5',
                nome: 'Gravação em estúdio',
                status: 'concluida',
                ordem: 5,
                setor: 'Produção',
                responsavel_nome: 'Gabriel Santos',
                responsavel_tipo: 'Produção',
                prazo_horas: 360, // 6 horas
                mandrill_coins: 200,
                data_inicio: '2025-09-23T09:00:00Z',
                data_conclusao: '2025-09-23T14:15:00Z',
                tempo_execucao: 315, // 5h15min
                instrucao: 'Gravação das cenas de estúdio com fundo neutro e iluminação controlada.',
                resultado: {
                  descricao: 'Gravação de estúdio finalizada',
                  paragrafo: 'Gravação em estúdio com excelente qualidade:\n\n• Iluminação perfeita\n• Áudio cristalino\n• Múltiplas variações de takes\n• Cenas adicionais para backup\n\nTodo material organizado e catalogado para edição.',
                  anexos: [
                    { nome: 'Material_Bruto_Studio.zip', tipo: 'application/zip', tamanho: 3221225472 }, // 3GB
                    { nome: 'Catalogacao_Clips.xlsx', tipo: 'application/vnd.ms-excel', tamanho: 256000 }
                  ]
                }
              }
            ]
          },
          {
            id: 'serv_3',
            nome: 'Pós-produção',
            status: 'executando',
            progresso_percentual: 40,
            tarefas: [
              {
                id: 'tar_6',
                nome: 'Edição e montagem',
                status: 'executando',
                ordem: 6,
                setor: 'Criação',
                responsavel_nome: 'Ana Costa',
                responsavel_tipo: 'Criação',
                prazo_horas: 720, // 12 horas
                mandrill_coins: 300,
                data_inicio: '2025-10-07T09:00:00Z',
                instrucao: 'Realizar edição completa do vídeo, incluindo cortes, transições, correção de cor e sincronização de áudio.',
                templates: [mockTemplates[1]]
              },
              {
                id: 'tar_7',
                nome: 'Trilha sonora e efeitos',
                status: 'preparacao',
                ordem: 7,
                setor: 'Criação',
                responsavel_nome: 'João Santos',
                responsavel_tipo: 'Criação',
                prazo_horas: 240, // 4 horas
                mandrill_coins: 120,
                instrucao: 'Adicionar trilha sonora, efeitos sonoros e ajustes finais de áudio.'
              },
              {
                id: 'tar_8',
                nome: 'Finalização e entrega',
                status: 'aguardando',
                ordem: 8,
                setor: 'Produção',
                responsavel_nome: 'Gabriel Santos',
                responsavel_tipo: 'Produção',
                prazo_horas: 120, // 2 horas
                mandrill_coins: 80,
                instrucao: 'Renderizar vídeo final em múltiplos formatos e realizar entrega ao cliente.',
                templates: [mockTemplates[3]]
              }
            ]
          }
        ]
      },
      {
        id: 'ent_2',
        nome: 'Material Gráfico',
        status: 'aguardando',
        progresso_percentual: 15,
        briefing: 'Criação de materiais gráficos para campanha digital e impressa',
        icone: '🎨',
        deadline: '2025-11-05',
        valor_unitario: 12000,
        projeto_id: 'proj_1',
        created_at: '2025-09-20T14:00:00Z',
        updated_at: '2025-10-01T09:15:00Z',
        total_servicos: 4,
        servicos_concluidos: 0,
        servicos_andamento: 1,
        servicos_pendentes: 3,
        servicos: [
          {
            id: 'serv_4',
            nome: 'Briefing Criativo',
            status: 'executando',
            progresso_percentual: 60,
            tarefas: [
              {
                id: 'tar_9',
                nome: 'Reunião de alinhamento criativo',
                status: 'executando',
                ordem: 1,
                setor: 'Atendimento',
                responsavel_nome: 'Laura Consultora',
                responsavel_tipo: 'Atendimento',
                prazo_horas: 90, // 1h30min
                mandrill_coins: 45,
                data_inicio: '2025-10-08T14:00:00Z',
                instrucao: 'Alinhar diretrizes criativas com cliente para materiais gráficos.'
              }
            ]
          },
          {
            id: 'serv_5',
            nome: 'Design de Identidade',
            status: 'aguardando',
            progresso_percentual: 0,
            tarefas: [
              {
                id: 'tar_10',
                nome: 'Criação de logotipo',
                status: 'aguardando',
                ordem: 2,
                setor: 'Criação',
                responsavel_nome: null,
                responsavel_tipo: 'Criação',
                prazo_horas: 480, // 8 horas
                mandrill_coins: 200,
                instrucao: 'Desenvolver logotipo seguindo briefing aprovado.'
              }
            ]
          }
        ]
      },
      {
        id: 'ent_3',
        nome: 'Website Institucional',
        status: 'aguardando',
        progresso_percentual: 5,
        briefing: 'Desenvolvimento de website responsivo para apresentação da empresa',
        icone: '💻',
        deadline: '2025-11-20',
        valor_unitario: 18000,
        projeto_id: 'proj_1',
        created_at: '2025-09-25T11:00:00Z',
        updated_at: '2025-09-25T11:00:00Z',
        total_servicos: 5,
        servicos_concluidos: 0,
        servicos_andamento: 0,
        servicos_pendentes: 5,
        servicos: [
          {
            id: 'serv_6',
            nome: 'Análise e Planejamento',
            status: 'aguardando',
            progresso_percentual: 20,
            tarefas: [
              {
                id: 'tar_11',
                nome: 'Levantamento de requisitos',
                status: 'aguardando',
                ordem: 1,
                setor: 'Tecnologia',
                responsavel_nome: null,
                responsavel_tipo: 'Tecnologia',
                prazo_horas: 360, // 6 horas
                mandrill_coins: 150,
                instrucao: 'Mapear funcionalidades e requisitos técnicos do website.'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'proj_2',
    demanda_codigo: 'B2024',
    cliente_nome: 'Inovação Digital SA',
    motivo: 'Rebranding Completo',
    status: 'concluida',
    progresso_percentual: 100,
    valor_total: 35000.00,
    prazo_dias: 45,
    prazo_data: '2025-09-30',
    entregas: [
      {
        id: 'ent_4',
        nome: 'Nova Identidade Visual',
        status: 'concluida',
        progresso_percentual: 100,
        briefing: 'Criação de nova identidade visual completa da empresa',
        icone: '🎯',
        deadline: '2025-09-15',
        valor_unitario: 20000,
        projeto_id: 'proj_2',
        created_at: '2025-08-01T09:00:00Z',
        updated_at: '2025-09-15T17:30:00Z',
        total_servicos: 3,
        servicos_concluidos: 3,
        servicos_andamento: 0,
        servicos_pendentes: 0,
        servicos: [
          {
            id: 'serv_7',
            nome: 'Pesquisa e Conceito',
            status: 'concluida',
            progresso_percentual: 100,
            tarefas: [
              {
                id: 'tar_12',
                nome: 'Pesquisa de mercado',
                status: 'concluida',
                ordem: 1,
                setor: 'Marketing',
                responsavel_nome: 'Isabella Pereira',
                responsavel_tipo: 'Marketing',
                prazo_horas: 600, // 10 horas
                mandrill_coins: 250,
                data_inicio: '2025-08-01T09:00:00Z',
                data_conclusao: '2025-08-02T17:00:00Z',
                tempo_execucao: 570, // 9h30min
                instrucao: 'Realizar pesquisa completa do mercado e concorrência.',
                resultado: {
                  descricao: 'Pesquisa de mercado finalizada com insights valiosos',
                  paragrafo: 'Pesquisa abrangente realizada incluindo:\n\n• Análise de 15 concorrentes diretos\n• Estudo de tendências do setor\n• Pesquisa com público-alvo (500 entrevistados)\n• Mapeamento de oportunidades de diferenciação\n\nIdentificamos 3 direções criativas promissoras para o rebranding.',
                  anexos: [
                    { nome: 'Pesquisa_Mercado_Completa.pdf', tipo: 'application/pdf', tamanho: 15728640 },
                    { nome: 'Dados_Pesquisa.xlsx', tipo: 'application/vnd.ms-excel', tamanho: 2097152 }
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        id: 'ent_5',
        nome: 'Manual de Marca',
        status: 'concluida',
        progresso_percentual: 100,
        briefing: 'Desenvolvimento de manual completo de aplicação da marca',
        icone: '📖',
        deadline: '2025-09-30',
        valor_unitario: 15000,
        projeto_id: 'proj_2',
        created_at: '2025-08-15T10:00:00Z',
        updated_at: '2025-09-30T16:00:00Z',
        total_servicos: 2,
        servicos_concluidos: 2,
        servicos_andamento: 0,
        servicos_pendentes: 0,
        servicos: []
      }
    ]
  },
  {
    id: 'proj_3',
    demanda_codigo: 'C2024',
    cliente_nome: 'StartupTech Innovations',
    motivo: 'Campanha de Lançamento MVP',
    status: 'preparacao',
    progresso_percentual: 10,
    valor_total: 28000.00,
    prazo_dias: 20,
    prazo_data: '2025-10-28',
    entregas: [
      {
        id: 'ent_6',
        nome: 'Vídeo Explicativo Animado',
        status: 'preparacao',
        progresso_percentual: 10,
        briefing: 'Vídeo animado explicando funcionamento do produto MVP',
        icone: '🎞️',
        deadline: '2025-10-20',
        valor_unitario: 16000,
        projeto_id: 'proj_3',
        created_at: '2025-10-08T08:00:00Z',
        updated_at: '2025-10-08T08:00:00Z',
        total_servicos: 4,
        servicos_concluidos: 0,
        servicos_andamento: 0,
        servicos_pendentes: 4,
        servicos: [
          {
            id: 'serv_8',
            nome: 'Briefing Inicial',
            status: 'preparacao',
            progresso_percentual: 40,
            tarefas: [
              {
                id: 'tar_13',
                nome: 'Reunião de kickoff',
                status: 'preparacao',
                ordem: 1,
                setor: 'Atendimento',
                responsavel_nome: 'Diego Suporte',
                responsavel_tipo: 'Atendimento',
                prazo_horas: 120, // 2 horas
                mandrill_coins: 60,
                instrucao: 'Primeira reunião com cliente para entender o produto e objetivos da animação.'
              }
            ]
          }
        ]
      },
      {
        id: 'ent_7',
        nome: 'Landing Page',
        status: 'aguardando',
        progresso_percentual: 0,
        briefing: 'Página de captura para pré-lançamento do produto',
        icone: '🚀',
        deadline: '2025-10-25',
        valor_unitario: 12000,
        projeto_id: 'proj_3',
        created_at: '2025-10-08T08:00:00Z',
        updated_at: '2025-10-08T08:00:00Z',
        total_servicos: 3,
        servicos_concluidos: 0,
        servicos_andamento: 0,
        servicos_pendentes: 3,
        servicos: []
      }
    ]
  },
  {
    id: 'proj_4',
    demanda_codigo: 'D2024',
    cliente_nome: 'EcoGreen Solutions',
    motivo: 'Campanha Sustentabilidade 2025',
    status: 'atrasada',
    progresso_percentual: 30,
    valor_total: 22000.00,
    prazo_dias: 25,
    prazo_data: '2025-10-05', // Já passou do prazo
    entregas: [
      {
        id: 'ent_8',
        nome: 'Série de Posts Redes Sociais',
        status: 'atrasada',
        progresso_percentual: 45,
        briefing: 'Criação de 20 posts para Instagram e LinkedIn sobre sustentabilidade',
        icone: '📱',
        deadline: '2025-10-01',
        valor_unitario: 8000,
        projeto_id: 'proj_4',
        created_at: '2025-09-10T09:00:00Z',
        updated_at: '2025-10-08T15:45:00Z',
        total_servicos: 2,
        servicos_concluidos: 0,
        servicos_andamento: 1,
        servicos_pendentes: 1,
        servicos: [
          {
            id: 'serv_9',
            nome: 'Criação de Conteúdo',
            status: 'atrasada',
            progresso_percentual: 60,
            tarefas: [
              {
                id: 'tar_14',
                nome: 'Desenvolvimento de copy',
                status: 'atrasada',
                ordem: 1,
                setor: 'Marketing',
                responsavel_nome: 'Mateus Silva',
                responsavel_tipo: 'Marketing',
                prazo_horas: 480, // 8 horas
                mandrill_coins: 200,
                data_inicio: '2025-09-25T09:00:00Z', // Iniciou há muito tempo
                instrucao: 'Criar textos engajantes para 20 posts sobre sustentabilidade.'
              }
            ]
          }
        ]
      },
      {
        id: 'ent_9',
        nome: 'Infográfico Sustentabilidade',
        status: 'pausada',
        progresso_percentual: 15,
        briefing: 'Infográfico detalhado sobre práticas sustentáveis da empresa',
        icone: '📊',
        deadline: '2025-10-10',
        valor_unitario: 14000,
        projeto_id: 'proj_4',
        created_at: '2025-09-15T10:30:00Z',
        updated_at: '2025-10-01T11:20:00Z',
        total_servicos: 3,
        servicos_concluidos: 0,
        servicos_andamento: 0,
        servicos_pendentes: 3,
        servicos: [
          {
            id: 'serv_10',
            nome: 'Pesquisa de Dados',
            status: 'pausada',
            progresso_percentual: 50,
            tarefas: [
              {
                id: 'tar_15',
                nome: 'Coleta de informações sustentabilidade',
                status: 'pausada',
                ordem: 1,
                setor: 'Marketing',
                responsavel_nome: 'Camila Rodrigues',
                responsavel_tipo: 'Marketing',
                prazo_horas: 360, // 6 horas
                mandrill_coins: 150,
                data_inicio: '2025-09-28T14:00:00Z',
                instrucao: 'Coletar dados e estatísticas sobre sustentabilidade da empresa.'
              }
            ]
          }
        ]
      }
    ]
  }
];

// Função para calcular estatísticas dos projetos
export const calcularEstatisticas = (projetos: Projeto[]) => {
  const total = projetos.length;
  const concluidos = projetos.filter(p => p.status === 'concluida').length;
  const executando = projetos.filter(p => p.status === 'executando').length;
  const atrasados = projetos.filter(p => p.status === 'atrasada').length;
  const aguardando = projetos.filter(p => p.status === 'aguardando' || p.status === 'preparacao').length;
  
  const valorTotal = projetos.reduce((sum, p) => sum + p.valor_total, 0);
  const valorConcluido = projetos
    .filter(p => p.status === 'concluida')
    .reduce((sum, p) => sum + p.valor_total, 0);
  
  return {
    total,
    concluidos,
    executando,
    atrasados,
    aguardando,
    valorTotal,
    valorConcluido,
    percentualConclusao: total > 0 ? Math.round((concluidos / total) * 100) : 0
  };
};

// Função para obter projeto por ID
export const obterProjetoPorId = (id: string): Projeto | undefined => {
  return mockProjetos.find(projeto => projeto.id === id);
};

// Função para obter entregas por projeto
export const obterEntregasPorProjeto = (projetoId: string): Entrega[] => {
  const projeto = obterProjetoPorId(projetoId);
  return projeto?.entregas || [];
};

// Função para obter entrega por ID
export const obterEntregaPorId = (entregaId: string): Entrega | undefined => {
  for (const projeto of mockProjetos) {
    const entrega = projeto.entregas?.find(e => e.id === entregaId);
    if (entrega) return entrega;
  }
  return undefined;
};

// Interface e dados dos fornecedores
export interface Fornecedor {
  id: string;
  nome: string;
  empresa?: string;
  especialidades: string[];
  email: string;
  telefone: string;
  ativo: boolean;
}

export const mockFornecedores: Fornecedor[] = [
  {
    id: 'forn-001',
    nome: 'João Silva',
    empresa: 'JS Design Studio',
    especialidades: ['Design Gráfico', 'Identidade Visual', 'Web Design'],
    email: 'joao@jsdesign.com',
    telefone: '(11) 99999-1111',
    ativo: true
  },
  {
    id: 'forn-002',
    nome: 'Maria Santos',
    empresa: 'MS Fotografia',
    especialidades: ['Fotografia', 'Edição de Imagem', 'Sessão de Fotos'],
    email: 'maria@msfoto.com',
    telefone: '(11) 99999-2222',
    ativo: true
  },
  {
    id: 'forn-003',
    nome: 'Carlos Oliveira',
    empresa: 'CO Desenvolvimento',
    especialidades: ['Desenvolvimento Web', 'App Mobile', 'Sistema CRM'],
    email: 'carlos@codev.com',
    telefone: '(11) 99999-3333',
    ativo: true
  },
  {
    id: 'forn-004',
    nome: 'Ana Costa',
    empresa: 'AC Criações',
    especialidades: ['Redação Publicitária', 'Social Media', 'Conteúdo Digital'],
    email: 'ana@accricoes.com',
    telefone: '(11) 99999-4444',
    ativo: true
  },
  {
    id: 'forn-005',
    nome: 'Pedro Lima',
    empresa: 'PL Vídeos',
    especialidades: ['Produção de Vídeo', 'Edição', 'Motion Graphics'],
    email: 'pedro@plvideos.com',
    telefone: '(11) 99999-5555',
    ativo: true
  },
  {
    id: 'forn-006',
    nome: 'Fernanda Rocha',
    empresa: 'FR Consultoria',
    especialidades: ['Consultoria Digital', 'SEO', 'Google Ads'],
    email: 'fernanda@frconsult.com',
    telefone: '(11) 99999-6666',
    ativo: true
  },
  {
    id: 'forn-007',
    nome: 'Ricardo Mendes',
    empresa: 'RM Impressões',
    especialidades: ['Impressão Gráfica', 'Material POP', 'Sinalização'],
    email: 'ricardo@rmimpressoes.com',
    telefone: '(11) 99999-7777',
    ativo: true
  },
  {
    id: 'forn-008',
    nome: 'Luciana Ferreira',
    empresa: 'LF Eventos',
    especialidades: ['Organização de Eventos', 'Cerimonial', 'Decoração'],
    email: 'luciana@lfeventos.com',
    telefone: '(11) 99999-8888',
    ativo: true
  }
];

// Interface e dados dos beneficiários
export interface Beneficiario {
  id: string;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  chavePix?: string;
  tipoChavePix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  ativo: boolean;
}

export const mockBeneficiarios: Beneficiario[] = [
  {
    id: 'ben-001',
    nome: 'João Silva Santos',
    cpfCnpj: '123.456.789-00',
    email: 'joao.santos@email.com',
    telefone: '(11) 98765-4321',
    banco: 'Banco do Brasil',
    agencia: '1234-5',
    conta: '56789-0',
    chavePix: '123.456.789-00',
    tipoChavePix: 'cpf',
    ativo: true
  },
  {
    id: 'ben-002',
    nome: 'Maria Oliveira Ltda',
    cpfCnpj: '12.345.678/0001-90',
    email: 'contato@mariaoliveira.com.br',
    telefone: '(11) 97654-3210',
    banco: 'Itaú',
    agencia: '5678',
    conta: '12345-6',
    chavePix: 'contato@mariaoliveira.com.br',
    tipoChavePix: 'email',
    ativo: true
  },
  {
    id: 'ben-003',
    nome: 'Carlos Eduardo Tech',
    cpfCnpj: '987.654.321-00',
    email: 'carlos@tech.com',
    telefone: '(11) 96543-2109',
    banco: 'Bradesco',
    agencia: '9876',
    conta: '54321-8',
    chavePix: '(11) 96543-2109',
    tipoChavePix: 'telefone',
    ativo: true
  },
  {
    id: 'ben-004',
    nome: 'Ana Costa Design',
    cpfCnpj: '456.789.123-00',
    email: 'ana@costadesign.com',
    telefone: '(11) 95432-1098',
    banco: 'Santander',
    agencia: '4567',
    conta: '89012-3',
    chavePix: 'ana@costadesign.com',
    tipoChavePix: 'email',
    ativo: true
  },
  {
    id: 'ben-005',
    nome: 'Tech Solutions EIRELI',
    cpfCnpj: '98.765.432/0001-10',
    email: 'financeiro@techsolutions.com.br',
    telefone: '(11) 94321-0987',
    banco: 'Caixa Econômica Federal',
    agencia: '8765',
    conta: '43210-9',
    chavePix: '12345678-1234-1234-1234-123456789012',
    tipoChavePix: 'aleatoria',
    ativo: true
  }
];

// Função para simular atraso em tempo real
export const simularAtrasosTempoReal = () => {
  setInterval(() => {
    const agora = new Date();
    
    mockProjetos.forEach(projeto => {
      projeto.entregas?.forEach(entrega => {
        entrega.servicos?.forEach(servico => {
          servico.tarefas?.forEach(tarefa => {
            // Verificar se tarefa executando passou do prazo
            if (tarefa.status === 'executando' && tarefa.data_inicio) {
              const inicio = new Date(tarefa.data_inicio);
              const tempoDecorrido = Math.floor((agora.getTime() - inicio.getTime()) / (1000 * 60));
              
              if (tempoDecorrido > tarefa.prazo_horas) {
                tarefa.status = 'atrasada';
                console.log(`⏰ Tarefa "${tarefa.nome}" marcada como atrasada`);
              }
            }
          });
        });
      });
    });
  }, 60000); // Verificar a cada minuto
};

export default mockProjetos;