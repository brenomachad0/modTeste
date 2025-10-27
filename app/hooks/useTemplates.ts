import { useState, useEffect } from 'react';
import { mandrillApi } from '@/lib/mandrill-api';

// Interface para template da API
export interface TemplateAPI {
  template_id: string;
  template_titulo: string;
  template_slug: string;
  template_coins: number;
  template_observacoes: string;
  template_deadline: number; // Duração em minutos
  template_warning: number;
  template_danger: number;
}

// Interface para template formatado (compatibilidade)
export interface TemplateWithTasks {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  prazo_minutos: number; // Mudou de prazo_padrao_dias para prazo_minutos
  setor?: string;
}

export interface TaskTemplate {
  id: string;
  nome: string;
  setor: string;
  responsavel_tipo: string;
  prazo_horas: number; // Em minutos (compatibilidade com sistema)
  mandrill_coins: number;
  instrucao: string;
  categoria: string;
  templates?: any[];
  tasks?: any[];
}

/**
 * Converte template da API para formato do componente
 */
export const convertApiTemplateToTaskTemplate = (template: TemplateAPI): TaskTemplate => {
  // Extrai categoria do slug (ex: "servico-video" -> "video")
  const categoria = template.template_slug.replace('servico-', '').split('-')[0] || 'geral';
  
  return {
    id: template.template_id,
    nome: template.template_titulo,
    setor: 'Produção',
    responsavel_tipo: 'Geral',
    prazo_horas: template.template_deadline, // Já vem em minutos da API
    mandrill_coins: template.template_coins,
    instrucao: template.template_observacoes || '',
    categoria: categoria,
    templates: [],
    tasks: []
  };
};

/**
 * Converte template da API para TemplateWithTasks
 */
export const convertApiToTemplateWithTasks = (template: TemplateAPI): TemplateWithTasks => {
  const categoria = template.template_slug.replace('servico-', '').split('-')[0] || 'geral';
  
  return {
    id: template.template_id,
    nome: template.template_titulo,
    descricao: template.template_observacoes || '',
    categoria: categoria,
    prazo_minutos: template.template_deadline,
    setor: 'Produção'
  };
};

/**
 * Hook para carregar templates de tarefas da API
 * Filtra apenas templates com slug começando em "servico-"
 */
export const useTemplates = () => {
  const [templates, setTemplates] = useState<TemplateWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        // Usa parâmetro tipo=servico para filtrar no backend
        const response = await mandrillApi.listarTemplatesTarefas('servico');
        
        // A API pode retornar { data: [...] } ou apenas [...]
        const data = response?.data || response;
        
        // Verifica se data é array
        if (!Array.isArray(data)) {
          console.error('Resposta da API não é um array:', data);
          setTemplates([]);
          setError('Formato de resposta inválido da API');
          return;
        }
        
        // Converte templates para formato do componente
        const templatesServico = data.map(convertApiToTemplateWithTasks);
        
        console.log(`✅ ${templatesServico.length} templates de serviço carregados`);
        setTemplates(templatesServico);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar templates:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar templates');
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return { templates, loading, error };
};

