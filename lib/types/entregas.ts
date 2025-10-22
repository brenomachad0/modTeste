/**
 * Tipos para Entregas e Serviços do Projeto
 */

// ============================================
// PROJETO
// ============================================

export interface Projeto {
  projeto_id: string;
  projeto_data_entrega: string;
  projeto_demanda: string;
  projeto_orcamento: string;
  projeto_created_at: string;
  projeto_created_pessoa: string;
  projeto_status: 'criado' | 'em_andamento' | 'concluido' | 'cancelado';
  projeto_finalizado_at: string | null;
}

// ============================================
// ENTREGA
// ============================================

export interface EntregaResposta {
  // Campos do briefing
  title?: string;
  description?: string;
  tipoProducao?: string;
  duracaoFilme?: {
    tipo: string;
    unidade: string;
    quantidade: string;
  };
  idioma?: string;
  tom?: string[];
  estilo?: string[];
  objetivos?: string[];
  territorio?: string;
  estrategia?: string;
  uso?: string[];
  veiculosDivulgacao?: Record<string, boolean>;
  periodo?: {
    unidade: string;
    quantidade: string;
  };
  tecnica?: Record<string, string[]>;
  tecnicaObservacoes?: Record<string, any>;
  referencias?: any[];
  externalReference?: string;
  referenciaDemanda?: string;
  
  // Campos de produção
  data?: string;
  horario?: string;
  local?: string;
  endereco?: string;
  locacao?: string;
  pessoa?: string;
  elemento?: string;
  
  // Campos customizados podem ser adicionados
  [key: string]: any;
}

export interface Entrega {
  entrega_id: string;
  entrega_projeto: string;
  entrega_demanda_item: string;
  entrega_titulo: string;
  entrega_letra: string;
  entrega_resposta: EntregaResposta;
  entrega_created_at: string | null;
  entrega_updated_at: string | null;
  projeto?: Projeto;
}

export interface EntregaDetalhada extends Entrega {
  // Campos adicionais que vêm do endpoint /detalhado
  servicos?: Servico[];
  board?: BoardCard[];
}

// ============================================
// SERVIÇO
// ============================================

export interface Servico {
  proj_servico_id: string;
  proj_entrega: string;
  proj_servico_prazo: number;
  proj_servico_titulo: string;
  entrega?: Entrega;
}

// ============================================
// BOARD (DRAG & DROP)
// ============================================

export interface BoardCard {
  servicos_board_id: string;
  proj_servico: string;
  board_position_x: number;
  board_position_y: number;
  board_in: string | null;
  board_out: string | null;
  board_tipo: string;
  board_created_at: string;
  board_updated_at: string;
  servico?: Servico;
}

// ============================================
// PAYLOADS PARA CRIAÇÃO/ATUALIZAÇÃO
// ============================================

export interface CriarEntregaPayload {
  entrega_projeto: string;
  entrega_demanda_item: string;
  entrega_titulo: string;
  entrega_letra: string;
  entrega_resposta: EntregaResposta;
}

export interface AtualizarEntregaPayload {
  entrega_projeto?: string;
  entrega_demanda_item?: string;
  entrega_titulo?: string;
  entrega_letra?: string;
  entrega_resposta?: EntregaResposta;
}

export interface CriarServicoPayload {
  proj_entrega: string;
  proj_servico_prazo: number;
  proj_servico_titulo: string;
}

export interface CriarBoardCardPayload {
  proj_servico: string;
  board_position_x: number;
  board_position_y: number;
  board_in?: string;
  board_out?: string;
  board_tipo: string;
}

export interface AtualizarBoardCardPayload {
  proj_servico?: string;
  board_position_x?: number;
  board_position_y?: number;
  board_in?: string;
  board_out?: string;
  board_tipo?: string;
}
