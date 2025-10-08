// @ts-nocheck
'use client';

import { useState } from 'react';
import EntregaEditorSimple from '../../components/EntregaEditorSimple';
import TarefaManager from '../../components/TarefaManager';

// Mock simplificado para teste direto
const mockEntrega = {
  id: '1',
  projeto_id: '1',
  nome: 'Campanha Digital Completa - Teste',
  briefing: 'Desenvolver campanha digital integrada com vídeo promocional de 60 segundos, posts para redes sociais e landing page responsiva.',
  icone: '🎬',
  status: 'executando',
  progresso_percentual: 45,
  created_at: '2025-01-01T09:00:00Z',
  updated_at: '2025-01-06T14:30:00Z',
  quantidade_servicos: 5,
  valor_total: 45000,
  tipo: 'principal'
};

const mockProjeto = {
  id: '1',
  crm_demanda_id: 'test-123',
  codigo: 'A2024',
  titulo: 'TechStart Brasil - Lançamento Q1 2025',
  motivo: 'Lançamento de nova linha de produtos - Campanha Q1 2025',
  anunciante: 'TechStart Brasil',
  agencia: 'Agência Digital',
  status: 'executando',
  progresso_percentual: 35,
  valor_total: 45000,
  prioridade: 1,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-06T14:30:00Z',
  entregas_mod: [],
  estatisticas: {
    total_entregas: 1,
    entregas_concluidas: 0,
    progresso_real: 35
  }
};

const mockServicos = [
  {
    id: 'serv_1',
    nome: 'Briefing e Estratégia',
    descricao: 'Reunião inicial, desenvolvimento de estratégia e conceitos criativos',
    valor_estimado: 3500,
    ordem: 1,
    status: 'concluido' as const,
    pode_executar_paralelo: false,
    prazo_dias: 3,
    tarefas_templates: [],
    created_at: '2025-01-01T00:00:00Z',
    tarefas: [
      {
        id: 'task_1',
        nome: 'Reunião de Briefing',
        instrucao: 'Alinhar objetivos e expectativas com o cliente',
        responsavel_nome: 'João Silva',
        responsavel_tipo: 'interno',
        prazo_horas: 2,
        mandrill_coins: 100,
        status: 'concluida',
        ordem: 1,
        servico_id: 'serv_1'
      },
      {
        id: 'task_2',
        nome: 'Pesquisa de Mercado',
        instrucao: 'Análise da concorrência e tendências do setor',
        responsavel_nome: 'Maria Santos',
        responsavel_tipo: 'interno',
        prazo_horas: 4,
        mandrill_coins: 200,
        status: 'concluida',
        ordem: 2,
        servico_id: 'serv_1'
      }
    ]
  },
  {
    id: 'serv_2', 
    nome: 'Criação de Conteúdo Visual',
    descricao: 'Design de posts, stories e materiais gráficos para redes sociais',
    valor_estimado: 8500,
    ordem: 2,
    status: 'em_execucao' as const,
    pode_executar_paralelo: true,
    prazo_dias: 7,
    tarefas_templates: [],
    created_at: '2025-01-02T00:00:00Z',
    tarefas: [
      {
        id: 'task_3',
        nome: 'Criação de Posts Instagram',
        instrucao: 'Desenvolver 10 artes para feed do Instagram',
        responsavel_nome: 'Pedro Designer',
        responsavel_tipo: 'freelancer',
        prazo_horas: 8,
        mandrill_coins: 400,
        status: 'executando',
        ordem: 1,
        servico_id: 'serv_2'
      },
      {
        id: 'task_4',
        nome: 'Stories Animados',
        instrucao: 'Criar 5 stories com animações simples',
        responsavel_nome: 'Ana Motion',
        responsavel_tipo: 'freelancer',
        prazo_horas: 6,
        mandrill_coins: 300,
        status: 'planejada',
        ordem: 2,
        servico_id: 'serv_2'
      }
    ]
  },
  {
    id: 'serv_3',
    nome: 'Produção de Vídeo',
    descricao: 'Roteirização, filmagem e edição do vídeo promocional de 60 segundos',
    valor_estimado: 15000,
    ordem: 3,
    status: 'em_execucao' as const,
    pode_executar_paralelo: true,
    prazo_dias: 10,
    tarefas_templates: [],
    created_at: '2025-01-03T00:00:00Z',
    tarefas: [
      {
        id: 'task_5',
        nome: 'Roteiro do Vídeo',
        instrucao: 'Desenvolver roteiro técnico e narrativo para vídeo de 60s',
        responsavel_nome: 'Carlos Roteirista',
        responsavel_tipo: 'terceirizado',
        prazo_horas: 4,
        mandrill_coins: 250,
        status: 'executando',
        ordem: 1,
        servico_id: 'serv_3'
      }
    ]
  },
  {
    id: 'serv_4',
    nome: 'Desenvolvimento Web',
    descricao: 'Criação da landing page responsiva com formulários integrados',
    valor_estimado: 12000,
    ordem: 4,
    status: 'planejado' as const,
    pode_executar_paralelo: false,
    prazo_dias: 12,
    tarefas_templates: [],
    created_at: '2025-01-04T00:00:00Z'
  },
  {
    id: 'serv_5',
    nome: 'Testes e Entrega Final',
    descricao: 'Controle de qualidade, testes e apresentação final ao cliente',
    valor_estimado: 6000,
    ordem: 5,
    status: 'planejado' as const,
    pode_executar_paralelo: false,
    prazo_dias: 5,
    tarefas_templates: [],
    created_at: '2025-01-05T00:00:00Z'
  }
];

const mockTemplates = [
  {
    id: 'template_1',
    nome: 'Briefing com cliente',
    descricao: 'Reunião inicial para alinhamento de expectativas',
    prazo_horas_estimado: 2,
    valor_mandrill_coins: 50,
    responsavel_tipo: 'atendimento' as const,
    pode_executar_paralelo: false,
    categoria: 'planejamento',
    ativo: true
  },
  {
    id: 'template_2',
    nome: 'Desenvolvimento de roteiro',
    descricao: 'Criação do roteiro baseado no briefing',
    prazo_horas_estimado: 8,
    valor_mandrill_coins: 200,
    responsavel_tipo: 'produtor' as const,
    pode_executar_paralelo: false,
    categoria: 'producao',
    ativo: true
  },
  {
    id: 'template_3',
    nome: 'Revisão técnica',
    descricao: 'Análise técnica do material produzido',
    prazo_horas_estimado: 3,
    valor_mandrill_coins: 75,
    responsavel_tipo: 'qa' as const,
    pode_executar_paralelo: true,
    categoria: 'qualidade',
    ativo: true
  }
];

const mockInstancias = [
  {
    id: 'inst_1',
    template_id: 'template_1',
    servico_id: 'serv_1',
    nome: 'Briefing com cliente - Campanha TechStart',
    descricao: 'Reunião inicial para alinhamento de expectativas',
    status: 'concluida',
    prazo_horas: 2,
    horas_trabalhadas: 2,
    valor_mandrill_coins: 50,
    responsavel_nome: 'Ana Paula',
    responsavel_tipo: 'atendimento',
    pode_executar_paralelo: false,
    ordem: 1,
    data_inicio: '2025-01-01T09:00:00Z',
    data_conclusao: '2025-01-01T11:00:00Z',
    observacoes: 'Cliente aprovou o conceito inicial'
  },
  {
    id: 'inst_2',
    template_id: 'template_2',
    servico_id: 'serv_2',
    nome: 'Roteiro do vídeo principal',
    descricao: 'Desenvolvimento do roteiro para vídeo de 60 segundos',
    status: 'executando',
    prazo_horas: 8,
    horas_trabalhadas: 4,
    valor_mandrill_coins: 200,
    responsavel_nome: 'Paulo Rodrigues',
    responsavel_tipo: 'produtor',
    pode_executar_paralelo: false,
    ordem: 2,
    data_inicio: '2025-01-01T14:00:00Z'
  }
];

export default function TestEntregaPage() {
  const [servicos, setServicos] = useState(mockServicos);
  const [templates, setTemplates] = useState(mockTemplates);
  const [instancias, setInstancias] = useState(mockInstancias);

  // Handlers para o EntregaEditor
  const handleSaveEntrega = async (entregaEditada: any) => {
    console.log('Entrega salva:', entregaEditada);
    alert('Entrega salva com sucesso!');
    return true;
  };

  const handleSaveServico = async (servicoEditado: any) => {
    console.log('Serviço salvo:', servicoEditado);
    setServicos(prevServicos => 
      prevServicos.map(s => 
        s.id === servicoEditado.id ? { ...s, ...servicoEditado } : s
      )
    );
    alert('Serviço salvo com sucesso!');
    return true;
  };

  const handleDeleteServico = async (servicoId: string) => {
    console.log('Serviço deletado:', servicoId);
    setServicos(prevServicos => 
      prevServicos.filter(s => s.id !== servicoId)
    );
    alert('Serviço deletado com sucesso!');
    return true;
  };

  const handleReorderServicos = (novosServicos: any[]) => {
    console.log('Serviços reordenados:', novosServicos);
    setServicos(novosServicos);
  };

  const handleCreateServico = (novoServico: any) => {
    const servicoComId = {
      ...novoServico,
      id: `serv_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    console.log('Novo serviço criado:', servicoComId);
    setServicos(prevServicos => [...prevServicos, servicoComId]);
    alert('Novo serviço criado com sucesso!');
  };

  // Handlers para o TarefaManager
  const handleSaveTemplate = (template: any) => {
    console.log('Template salvo:', template);
    if (templates.find(t => t.id === template.id)) {
      setTemplates(prevTemplates => 
        prevTemplates.map(t => 
          t.id === template.id ? { ...t, ...template } : t
        )
      );
    } else {
      setTemplates(prevTemplates => [...prevTemplates, template]);
    }
    alert('Template salvo com sucesso!');
  };

  const handleDeleteTemplate = (templateId: string) => {
    console.log('Template deletado:', templateId);
    setTemplates(prevTemplates => 
      prevTemplates.filter(t => t.id !== templateId)
    );
    alert('Template deletado com sucesso!');
  };

  const handleSaveInstancia = (instancia: any) => {
    console.log('Instância salva:', instancia);
    if (instancias.find(i => i.id === instancia.id)) {
      setInstancias(prevInstancias => 
        prevInstancias.map(i => 
          i.id === instancia.id ? { ...i, ...instancia } : i
        )
      );
    } else {
      setInstancias(prevInstancias => [...prevInstancias, instancia]);
    }
    alert('Instância salva com sucesso!');
  };

  const handleDeleteInstancia = (instanciaId: string) => {
    console.log('Instância deletada:', instanciaId);
    setInstancias(prevInstancias => 
      prevInstancias.filter(i => i.id !== instanciaId)
    );
    alert('Instância deletada com sucesso!');
  };

  // Handlers para Tarefas
  const handleAddTask = async (serviceId: string, taskData: any) => {
    const novaTarefa = {
      ...taskData,
      id: `task_${Date.now()}`,
      servico_id: serviceId,
      created_at: new Date().toISOString()
    };
    
    console.log('Nova tarefa criada:', novaTarefa);
    
    // Adicionar tarefa ao serviço correspondente
    setServicos(prevServicos => 
      prevServicos.map(s => 
        s.id === serviceId 
          ? { ...s, tarefas: [...(s.tarefas || []), novaTarefa] }
          : s
      )
    );
    alert('Nova tarefa criada com sucesso!');
  };

  const handleSaveTask = async (taskData: any) => {
    console.log('Tarefa salva:', taskData);
    
    setServicos(prevServicos => 
      prevServicos.map(s => ({
        ...s,
        tarefas: s.tarefas?.map(t => 
          t.id === taskData.id ? { ...t, ...taskData } : t
        ) || []
      }))
    );
    alert('Tarefa salva com sucesso!');
  };

  const handleDeleteTask = async (taskId: string) => {
    console.log('Tarefa deletada:', taskId);
    
    setServicos(prevServicos => 
      prevServicos.map(s => ({
        ...s,
        tarefas: s.tarefas?.filter(t => t.id !== taskId) || []
      }))
    );
    alert('Tarefa deletada com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Teste do Sistema de Edição de Entregas
              </h1>
              <p className="mt-2 text-gray-600">
                Esta é uma página de teste para demonstrar todas as funcionalidades implementadas
              </p>
            </div>
          </div>
        </div>

        {/* Info do Projeto */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mockProjeto.titulo}
              </h2>
              <p className="text-gray-600">{mockProjeto.anunciante} • {mockProjeto.agencia}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Progresso do projeto</div>
              <div className="text-2xl font-bold text-blue-600">{mockProjeto.progresso_percentual}%</div>
            </div>
          </div>
        </div>

        {/* Sistema de Edição de Entregas */}
        <div className="space-y-8">
          {/* Editor de Entrega */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Editor de Entrega
              </h3>
              <p className="text-sm text-gray-500">
                Edite as informações da entrega e gerencie os serviços
              </p>
            </div>
            <div className="p-6">
              <EntregaEditorSimple
                entrega={mockEntrega}
                projeto={mockProjeto}
                servicos={servicos}
                onSaveEntrega={handleSaveEntrega}
                onSaveServico={handleSaveServico}
                onDeleteServico={handleDeleteServico}
                onCreateServico={handleCreateServico}
                onAddTask={handleAddTask}
                onSaveTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>
          </div>

          {/* Gerenciador de Templates e Instâncias */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Gerenciador de Templates e Tarefas
              </h3>
              <p className="text-sm text-gray-500">
                Crie e gerencie templates reutilizáveis e instâncias de tarefas específicas
              </p>
            </div>
            <div className="p-6">
              <TarefaManager
                templates={templates}
                instancias={instancias}
                servicos={servicos}
                onSaveTemplate={handleSaveTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onSaveInstancia={handleSaveInstancia}
                onDeleteInstancia={handleDeleteInstancia}
              />
            </div>
          </div>
        </div>

        {/* Instruções de Teste */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            🧪 Como testar as funcionalidades na página atual:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Editor de Entrega:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Clique em "Editar Entrega" para modificar nome e briefing</li>
                <li>• Modo de edição colapsa a lista de serviços</li>
                <li>• Adicione novos serviços com "Adicionar Serviço"</li>
                <li>• Edite serviços existentes individualmente</li>
                <li>• Delete serviços com confirmação</li>
                <li>• Configure execução paralela e ordens</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Gerenciamento de Tarefas:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Clique nas setas para expandir/colapsar serviços</li>
                <li>• Use "Nova Tarefa" para adicionar tarefas aos serviços</li>
                <li>• Clique em "EDITAR TESTE" para editar tarefas existentes</li>
                <li>• Configure responsável, prazo, coins e status</li>
                <li>• Delete tarefas com o ícone da lixeira</li>
                <li>• Reordene tarefas usando o campo "Ordem"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Templates e Instâncias:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Crie novos templates reutilizáveis</li>
                <li>• Edite templates existentes</li>
                <li>• Gere instâncias de tarefas a partir de templates</li>
                <li>• Associe tarefas aos serviços</li>
                <li>• Gerencie status das tarefas</li>
                <li>• Monitore progresso em tempo real</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 Dados de exemplo inclusos:</h4>
            <p className="text-blue-700 text-sm">
              A página já contém dados de exemplo com <strong>4 serviços</strong> e <strong>5 tarefas</strong> distribuídas. 
              Teste expandindo os serviços para ver as tarefas, editando-as ou criando novas. 
              Todas as ações mostrarão alertas de confirmação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}