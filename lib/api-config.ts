// Configuração da API do backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Templates MOD
  templates: {
    getAll: () => `${API_BASE_URL}/api/templates/mod`,
    getById: (id: string) => `${API_BASE_URL}/api/templates/mod/${id}`,
    getTasks: (id: string) => `${API_BASE_URL}/api/templates/mod/${id}/tasks`,
    getByCategory: (categoria: string) => `${API_BASE_URL}/api/templates/mod/categoria/${categoria}`,
  },
  
  // Projetos (para futuro)
  projetos: {
    getAll: () => `${API_BASE_URL}/api/projetos`,
    getById: (id: string) => `${API_BASE_URL}/api/projetos/${id}`,
    create: () => `${API_BASE_URL}/api/projetos`,
    update: (id: string) => `${API_BASE_URL}/api/projetos/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/projetos/${id}`,
  },
  
  // Serviços (para futuro)
  servicos: {
    getAll: () => `${API_BASE_URL}/api/servicos`,
    getById: (id: string) => `${API_BASE_URL}/api/servicos/${id}`,
    getByProjeto: (projetoId: string) => `${API_BASE_URL}/api/servicos?projeto_id=${projetoId}`,
  },
  
  // Tarefas (para futuro)
  tarefas: {
    getAll: () => `${API_BASE_URL}/api/tarefas`,
    getById: (id: string) => `${API_BASE_URL}/api/tarefas/${id}`,
    getByServico: (servicoId: string) => `${API_BASE_URL}/api/tarefas?servico_id=${servicoId}`,
    update: (id: string) => `${API_BASE_URL}/api/tarefas/${id}`,
  }
};

// Utilitários para fazer requisições
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
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