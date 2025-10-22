/**
 * Adapter para normalizar dados do backend para o formato esperado pelo frontend
 */

import type { Projeto } from '@/app/hooks/useProjetos';

/**
 * Interface dos dados brutos vindos do backend
 */
interface BackendProjeto {
  id: string;
  demanda_id?: string;
  codigo?: string;
  demanda_codigo?: string;
  tipo?: string;
  
  // Cliente
  cliente_nome?: string;
  anunciante_nome?: string;
  
  // Pessoas
  solicitante_nome?: string | null;
  demandante_nome?: string | null;
  emissor_nome?: string | null;
  
  // Descrição
  motivo?: string;
  motivo_titulo?: string;
  motivo_descricao?: string;
  
  // Status
  status?: string;
  status_mod?: string;
  
  // Progresso
  progresso_percentual?: number;
  
  // Valores (alguns vêm divididos por 100)
  valor_total?: number;
  valor_total_orcamento?: number;
  valor_producao?: number;
  
  // Prazos
  prazo_data?: string | null;
  prazo_dias?: number | null;
  data_aprovacao_orcamento?: string;
  data_estimada_entrega?: string;
  data_criacao_demanda?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  
  // Outros
  agencia_nome?: string;
  entregas?: any[];
  [key: string]: any; // Para campos extras que vêm do backend
}

/**
 * Normaliza o status para o enum esperado pelo frontend
 */
function normalizarStatus(
  status?: string
): 'aguardando' | 'executando' | 'pausada' | 'atrasada' | 'concluida' | 'preparacao' {
  const statusLower = (status || '').toLowerCase();
  
  const mapeamento: Record<string, Projeto['status']> = {
    'aguardando': 'aguardando',
    'executando': 'executando',
    'em_andamento': 'executando',
    'em_execucao': 'executando',
    'pausada': 'pausada',
    'pausado': 'pausada',
    'atrasada': 'atrasada',
    'atrasado': 'atrasada',
    'concluida': 'concluida',
    'concluido': 'concluida',
    'finalizada': 'concluida',
    'finalizado': 'concluida',
    'preparacao': 'preparacao',
    'planejamento': 'preparacao',
    'planejado': 'preparacao',
  };
  
  return mapeamento[statusLower] || 'aguardando';
}

/**
 * Adapter principal: converte dados do backend para o formato do frontend
 */
export function adaptarProjeto(backendData: BackendProjeto): Projeto {
  // Usa demanda_codigo, se não tiver usa codigo
  const demanda_codigo = backendData.demanda_codigo || backendData.codigo || '';
  
  // Usa cliente_nome, se não tiver usa anunciante_nome
  const cliente_nome = backendData.cliente_nome || backendData.anunciante_nome || 'Cliente não informado';
  
  // Usa motivo, se não tiver usa motivo_descricao ou motivo_titulo
  const motivo = backendData.motivo || backendData.motivo_descricao || backendData.motivo_titulo || '';
  
  // Status: usa status, se não tiver usa status_mod
  const status = normalizarStatus(backendData.status || backendData.status_mod);
  
  // Progresso
  const progresso_percentual = backendData.progresso_percentual ?? 0;
  
  // Valor: Prioridade: valor_total_orcamento > valor_producao > valor_total
  // Alguns valores no backend vêm divididos por 100, então usar o maior
  let valor_total = 0;
  if (backendData.valor_total_orcamento && backendData.valor_total_orcamento > 0) {
    valor_total = backendData.valor_total_orcamento;
  } else if (backendData.valor_producao && backendData.valor_producao > 0) {
    valor_total = backendData.valor_producao;
  } else if (backendData.valor_total && backendData.valor_total > 0) {
    // Se valor_total é muito pequeno comparado aos outros, pode estar dividido por 100
    // Vamos usar o que vier
    valor_total = backendData.valor_total;
  }
  
  // Prazo em dias
  let prazo_dias = backendData.prazo_dias ?? 0;
  
  // Se prazo_dias é 0 ou null, tentar calcular
  if (!prazo_dias && backendData.data_aprovacao_orcamento && backendData.data_estimada_entrega) {
    const dataAprovacao = new Date(backendData.data_aprovacao_orcamento);
    const dataEstimada = new Date(backendData.data_estimada_entrega);
    prazo_dias = Math.ceil((dataEstimada.getTime() - dataAprovacao.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Se ainda é 0, usar padrão de 30 dias
  if (!prazo_dias || prazo_dias === 0) {
    prazo_dias = 30;
  }
  
  // Data do prazo
  let prazo_data = backendData.prazo_data || null;
  
  // Se prazo_data é string vazia, converter para null
  if (prazo_data === '') {
    prazo_data = null;
  }
  
  // Se não tem prazo_data, tentar calcular
  if (!prazo_data && backendData.data_aprovacao_orcamento) {
    const dataAprovacao = new Date(backendData.data_aprovacao_orcamento);
    dataAprovacao.setDate(dataAprovacao.getDate() + prazo_dias);
    prazo_data = dataAprovacao.toISOString().split('T')[0];
  }
  
  // Se ainda não tem, usar data estimada
  if (!prazo_data && backendData.data_estimada_entrega) {
    prazo_data = backendData.data_estimada_entrega.split('T')[0];
  }
  
  // Se ainda não tem, calcular baseado em created_at + prazo_dias
  if (!prazo_data && backendData.created_at) {
    const dataCriacao = new Date(backendData.created_at);
    dataCriacao.setDate(dataCriacao.getDate() + prazo_dias);
    prazo_data = dataCriacao.toISOString().split('T')[0];
  }
  
  // Se ainda não tem, usar hoje + prazo_dias
  if (!prazo_data) {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + prazo_dias);
    prazo_data = hoje.toISOString().split('T')[0];
  }
  
  // Função auxiliar para extrair string de JSONB array ou string normal
  const extrairNome = (valor: any, arrayFallback?: any): string | undefined => {
    // Se tem valor direto, usar
    if (valor) {
      // Se for array JSONB ["nome"], pegar o primeiro elemento
      if (Array.isArray(valor) && valor.length > 0) {
        return String(valor[0]);
      }
      
      // Se for string normal, retornar
      if (typeof valor === 'string') {
        return valor;
      }
    }
    
    // Se não tem valor mas tem fallback (campo no plural), tentar usar
    if (arrayFallback && Array.isArray(arrayFallback) && arrayFallback.length > 0) {
      return String(arrayFallback[0]);
    }
    
    return undefined;
  };
  
  // Criar objeto normalizado com spread do backend primeiro
  const projetoNormalizado = {
    ...backendData, // Todos os campos extras do backend
    
    // Sobrescrever com valores normalizados
    id: backendData.id,
    demanda_codigo,
    cliente_nome,
    motivo,
    status,
    progresso_percentual,
    valor_total,
    prazo_dias,
    prazo_data,
    entregas: backendData.entregas || [],
    
    // Garantir que esses campos existam (tratar JSONB array)
    // Se solicitante_nome é null, buscar de solicitantes (plural)
    solicitante_nome: extrairNome(backendData.solicitante_nome, backendData.solicitantes),
    demandante_nome: extrairNome(backendData.demandante_nome, backendData.demandantes),
    emissor_nome: extrairNome(backendData.emissor_nome),
  };
  
  return projetoNormalizado as Projeto;
}

/**
 * Adapter para array de projetos
 */
export function adaptarProjetos(backendData: BackendProjeto[]): Projeto[] {
  return backendData.map(adaptarProjeto);
}

/**
 * Valida se os dados têm os campos mínimos necessários
 */
export function validarProjeto(projeto: any): boolean {
  return !!(
    projeto &&
    typeof projeto === 'object' &&
    projeto.id &&
    (projeto.demanda_codigo || projeto.codigo)
  );
}
