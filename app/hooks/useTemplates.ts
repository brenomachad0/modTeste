import { useState, useEffect } from 'react';

export interface TemplateWithTasks {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  prazo_padrao_dias: number;
  valor_estimado: number;
}

export interface TaskTemplate {
  id: string;
  nome: string;
  setor: string;
  responsavel_tipo: string;
  prazo_horas: number;
  mandrill_coins: number;
  instrucao: string;
  categoria: string;
  templates?: any[];
  tasks?: any[];
}

export const convertApiTemplateToTaskTemplate = (template: TemplateWithTasks): TaskTemplate => {
  return {
    id: `template_${template.id}`,
    nome: template.nome,
    setor: 'Produção',
    responsavel_tipo: 'Geral',
    prazo_horas: template.prazo_padrao_dias * 24,
    mandrill_coins: Math.round(template.valor_estimado / 100),
    instrucao: template.descricao || '',
    categoria: template.categoria,
    templates: [],
    tasks: []
  };
};

// Mock templates
const MOCK_TEMPLATES: TemplateWithTasks[] = [
  {
    id: 1,
    nome: 'Video Promocional',
    descricao: 'Criação de vídeo promocional de produto',
    categoria: 'video',
    prazo_padrao_dias: 5,
    valor_estimado: 2000
  },
  {
    id: 2,
    nome: 'Campanha Marketing Digital',
    descricao: 'Estratégia completa de marketing digital',
    categoria: 'marketing',
    prazo_padrao_dias: 10,
    valor_estimado: 5000
  },
  {
    id: 3,
    nome: 'Modelagem 3D',
    descricao: 'Criação de modelo 3D de produto',
    categoria: '3d',
    prazo_padrao_dias: 7,
    valor_estimado: 3000
  },
  {
    id: 4,
    nome: 'Animação Motion Graphics',
    descricao: 'Animação com motion graphics',
    categoria: 'motion',
    prazo_padrao_dias: 8,
    valor_estimado: 4000
  },
  {
    id: 5,
    nome: 'Design de Interface',
    descricao: 'Design de interface de aplicativo',
    categoria: 'design',
    prazo_padrao_dias: 6,
    valor_estimado: 2500
  }
];

export const useTemplates = () => {
  const [templates, setTemplates] = useState<TemplateWithTasks[]>(MOCK_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comentado para evitar erro de fetch
  // Se quiser conectar com API real, descomente e configure o endpoint
  /*
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/mod/templates');
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar templates: ${response.status}`);
        }
        
        const data = await response.json();
        setTemplates(data || MOCK_TEMPLATES);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar templates:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setTemplates(MOCK_TEMPLATES);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);
  */

  return { templates, loading, error };
};
