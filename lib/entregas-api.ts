const API_BASE_URL = 'http://localhost:3001/api';

export interface Entrega {
  id: number;
  nome: string;
  briefing?: string;
  projeto_id: string;
  icone: string;
  status: string;
  deadline?: string;
  valor_unitario?: number;
  progresso_percentual: number;
  created_at: string;
  updated_at: string;
  // Campos calculados que podem vir do backend
  quantidade_servicos?: number;
  valor_total?: number;
  // Relacionamentos
  servicos_mod?: any[];
  projeto?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  total?: number;
}

class EntregasApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        data: {} as T,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async buscarEntrega(id: string): Promise<ApiResponse<Entrega>> {
    return this.request<Entrega>(`/entregas/${id}`);
  }

  async listarEntregas(params?: {
    projeto_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Entrega[]>> {
    const searchParams = new URLSearchParams();
    
    if (params?.projeto_id) searchParams.append('projeto_id', params.projeto_id);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/entregas?${queryString}` : '/entregas';
    
    return this.request<Entrega[]>(endpoint);
  }

  async atualizarStatus(id: number, status: string): Promise<ApiResponse<Entrega>> {
    return this.request<Entrega>(`/entregas/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async atualizarProgresso(id: number, progresso: number): Promise<ApiResponse<Entrega>> {
    return this.request<Entrega>(`/entregas/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ progresso_percentual: progresso }),
    });
  }
}

export const entregasApi = new EntregasApiService();