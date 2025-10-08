import { useState, useEffect } from 'react';

export interface Projeto {
  id: string;
  crm_demanda_id: string;
  codigo: string;
  titulo: string;
  motivo?: string;
  anunciante?: string;
  agencia?: string;
  emissor?: string;
  nome_customizado?: string;
  descricao_customizada?: string;
  observacoes?: string;
  status: string;
  progresso_percentual: number;
  deadline?: string;
  data_inicio?: string;
  data_conclusao?: string;
  data_aprovacao_orcamento?: string;
  valor_total?: number;
  prioridade: number;
  created_at: string;
  updated_at: string;
  entregas_mod: Entrega[];
  estatisticas: {
    total_entregas: number;
    entregas_concluidas: number;
    progresso_real: number;
  };
}

export interface Entrega {
  id: number;
  nome: string;
  status: string;
  deadline?: string;
  progresso_percentual: number;
  valor_total?: number;
  quantidade_servicos?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const projetosApi = {
  // Listar todos os projetos
  async listarProjetos(params?: { limit?: number; status?: string }): Promise<ApiResponse<Projeto[]>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    
    const url = `${API_BASE_URL}/projetos${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao buscar projetos: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Buscar projeto por ID
  async buscarProjeto(id: string): Promise<ApiResponse<Projeto>> {
    const response = await fetch(`${API_BASE_URL}/projetos/${id}`);
    if (!response.ok) {
      throw new Error(`Erro ao buscar projeto: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Atualizar projeto completo
  async atualizarProjeto(id: string, dados: Partial<Projeto>): Promise<ApiResponse<Projeto>> {
    const response = await fetch(`${API_BASE_URL}/projetos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar projeto: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Atualizar apenas status do projeto
  async atualizarStatus(id: string, status: string): Promise<ApiResponse<Projeto>> {
    const response = await fetch(`${API_BASE_URL}/projetos/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar status: ${response.statusText}`);
    }
    
    return response.json();
  }
};

// Hook para gerenciar projetos
export function useProjetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarProjetos = async (params?: { limit?: number; status?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await projetosApi.listarProjetos(params);
      if (response.success) {
        setProjetos(response.data);
      } else {
        setError(response.error || 'Erro ao carregar projetos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id: string, status: string) => {
    try {
      const response = await projetosApi.atualizarStatus(id, status);
      if (response.success) {
        // Atualizar o projeto na lista local
        setProjetos(prev => prev.map(projeto => 
          projeto.id === id ? { ...projeto, status, updated_at: new Date().toISOString() } : projeto
        ));
        return response.data;
      } else {
        throw new Error(response.error || 'Erro ao atualizar status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  };

  return {
    projetos,
    loading,
    error,
    carregarProjetos,
    atualizarStatus
  };
}