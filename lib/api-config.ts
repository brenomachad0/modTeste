// Configuração da API do backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-aee6f2.up.railway.app';

// WebSocket URL
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'https://web-production-aee6f2.up.railway.app';

export const API_ENDPOINTS = {
  // Templates MOD
  templates: {
    getAll: () => `${API_BASE_URL}/api/templates/mod`,
    getById: (id: string) => `${API_BASE_URL}/api/templates/mod/${id}`,
    getTasks: (id: string) => `${API_BASE_URL}/api/templates/mod/${id}/tasks`,
    getByCategory: (categoria: string) => `${API_BASE_URL}/api/templates/mod/categoria/${categoria}`,
  },
  
  // Projetos Supabase
  projetos: {
    getAll: () => `${API_BASE_URL}/api/supabase/projetos`,
    getById: (id: string) => `${API_BASE_URL}/api/supabase/projetos/${id}`,
    getResumo: (id: string) => `${API_BASE_URL}/api/supabase/projetos/${id}/resumo`,
    create: () => `${API_BASE_URL}/api/supabase/projetos`,
    update: (id: string) => `${API_BASE_URL}/api/supabase/projetos/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/supabase/projetos/${id}`,
  },
  
  // Entregas Supabase
  entregas: {
    getById: (id: string) => `${API_BASE_URL}/api/supabase/entregas/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/supabase/entregas/${id}`,
    recalcularProgresso: (id: string) => `${API_BASE_URL}/api/supabase/entregas/${id}/progresso`,
    getPipeline: (id: string) => `${API_BASE_URL}/api/supabase/entregas/${id}/pipeline`,
    configurarPipeline: (id: string) => `${API_BASE_URL}/api/supabase/entregas/${id}/pipeline/configurar`,
  },
  
  // Serviços Supabase
  servicos: {
    getById: (id: string) => `${API_BASE_URL}/api/supabase/servicos/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/supabase/servicos/${id}`,
    iniciar: (id: string) => `${API_BASE_URL}/api/supabase/servicos/${id}/iniciar`,
    concluir: (id: string) => `${API_BASE_URL}/api/supabase/servicos/${id}/concluir`,
  },
  
  // Tarefas Supabase
  tarefas: {
    getById: (id: string) => `${API_BASE_URL}/api/supabase/tarefas/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/supabase/tarefas/${id}`,
    iniciar: (id: string) => `${API_BASE_URL}/api/supabase/tarefas/${id}/iniciar`,
    concluir: (id: string) => `${API_BASE_URL}/api/supabase/tarefas/${id}/concluir`,
    reordenar: (servicoId: string) => `${API_BASE_URL}/api/supabase/servicos/${servicoId}/tarefas/reordenar`,
  },
  
  // Webhooks
  webhooks: {
    orcamentoAprovado: () => `${API_BASE_URL}/api/webhook/orcamento-aprovado`,
    teste: () => `${API_BASE_URL}/api/webhook/teste`,
  },
  
  // CRM (Read-only)
  crm: {
    projetos: () => `${API_BASE_URL}/api/projetos`,
    preview: (demandaId: string) => `${API_BASE_URL}/api/projetos/${demandaId}/preview`,
    estrutura: (demandaId: string) => `${API_BASE_URL}/api/projetos/${demandaId}/estrutura-limpa`,
    carrousel: () => `${API_BASE_URL}/api/demandas/carrousel`,
    orcamentos: () => `${API_BASE_URL}/api/orcamentos/aprovados`,
  },
  
  // Health
  health: () => `${API_BASE_URL}/health`,
};

// Utilitários para fazer requisições
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    console.log('🌐 API Request:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      mode: 'cors', // Explicitamente habilita CORS
      ...options,
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Response data:', data);
    return data;
  } catch (error: any) {
    console.error('❌ API request failed:', {
      url,
      error: error.message,
      stack: error.stack,
    });
    
    // Mensagem de erro mais detalhada
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Erro de conexão: Não foi possível conectar ao servidor. Verifique se o backend está online e acessível. URL: ${url}`);
    }
    
    throw error;
  }
};

// Serviços específicos para templates
export const templateService = {
  async getAllTemplates() {
    return apiRequest(API_ENDPOINTS.templates.getAll());
  },

  async getTemplate(id: string) {
    return apiRequest(API_ENDPOINTS.templates.getById(id));
  },

  async getTemplateTasks(id: string) {
    return apiRequest(API_ENDPOINTS.templates.getTasks(id));
  },

  async getTemplatesByCategory(categoria: string) {
    return apiRequest(API_ENDPOINTS.templates.getByCategory(categoria));
  },

  // Buscar template com suas tarefas
  async getTemplateWithTasks(id: string) {
    const [template, tasks] = await Promise.all([
      this.getTemplate(id),
      this.getTemplateTasks(id)
    ]);
    
    return {
      ...template,
      tasks: tasks
    };
  }
};