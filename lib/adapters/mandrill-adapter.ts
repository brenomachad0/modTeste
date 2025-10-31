/**
 * Adapter Mandrill CRM → Frontend MOD
 * Converte dados da API Mandrill para o formato esperado pelo frontend
 */

export interface ProjetoMOD {
  // Identificação
  id: string; // demandaId do CRM
  demanda_codigo: string; // Código da demanda (ex: A2015)
  tipo: string; // A = Anunciante, I = Interno
  
  // Cliente e Agência
  cliente_nome: string; // anuncianteNome (cliente final)
  agencia_nome: string | null; // agenciaNome (agência intermediária)
  
  // Motivo/Projeto
  motivo_titulo: string; // motivoTitulo (ex: "Saúde CAIXA")
  motivo_tipo: string; // motivoTipo (campanha, evento, etc)
  motivo_descricao: string; // pedidoTexto
  
  // Pessoas
  solicitante_nome: string | null;
  demandante_nome: string | null;
  emissor_nome: string | null;
  representante_nome: string | null;
  
  // Valores
  valor_total: number; // valor_total_orcamento
  valor_producao: number;
  valor_financiamento: number;
  valor_taxa_solicitante: number;
  valor_taxa_agencia: number;
  valor_lucro: number;
  
  // Prazos
  prazo_data: string | null; // demandaDeadline ou calculado
  prazo_dias: number;
  data_aprovacao: string | null;
  data_criacao: string;
  
  // Status MOD (não vem do CRM)
  status: 'aguardando' | 'executando' | 'pausada' | 'atrasada' | 'concluida' | 'preparacao';
  progresso_percentual: number;
  
  // Entregas
  total_entregas: number;
  entregas?: any[];
  
  // Board Data (posições no ReactFlow, nós de início/fim, etc)
  boardData?: any;
  
  // Timeline/Histórico - APENAS INFORMAÇÕES
  timeline?: Array<{
    id: string;
    type: 'informacao';
    action: string;
    title: string; // Assunto
    content: string; // Informação
    created_at: string;
    created_ago?: string;
    created_pessoa?: {
      pessoa_id: string;
      pessoa_nome: string;
      pessoa_avatar?: string | null;
      pessoa_tipo: string;
    };
    visible: boolean;
    has_mention?: boolean;
    files?: any[];
  }>;
}

/**
 * Extrai nome de uma pessoa (string ou array JSONB)
 */
const extrairNome = (valor: any, arrayFallback?: any): string | null => {
  // Tenta valor direto
  if (valor) {
    if (Array.isArray(valor) && valor.length > 0) return String(valor[0]);
    if (typeof valor === 'string') return valor;
  }
  
  // Fallback para array (solicitantes[], demandantes[])
  if (arrayFallback && Array.isArray(arrayFallback) && arrayFallback.length > 0) {
    return String(arrayFallback[0]);
  }
  
  return null;
};

/**
 * Calcula prazo_data a partir de múltiplas fontes
 */
const calcularPrazoData = (demanda: any): string | null => {
  // 1. Deadline da demanda
  if (demanda.demandaDeadline) {
    return demanda.demandaDeadline;
  }
  
  // 2. Data de aprovação + prazo em dias
  if (demanda.data_aprovacao && demanda.prazo_dias) {
    const dataAprovacao = new Date(demanda.data_aprovacao);
    dataAprovacao.setDate(dataAprovacao.getDate() + demanda.prazo_dias);
    return dataAprovacao.toISOString().split('T')[0];
  }
  
  return null;
};

/**
 * Normaliza status do CRM para status MOD
 */
const normalizarStatus = (statusCRM: string): ProjetoMOD['status'] => {
  // Por padrão, demandas aprovadas começam em preparação
  return 'preparacao';
};

/**
 * 🎯 Adapta dados do carrousel da Mandrill para formato MOD
 */
export function adaptarProjetoMandrill(demandaCarrousel: any): ProjetoMOD {
  // Extrair pessoas (arrays JSONB) - filtrar nulls
  const extrairNomeLocal = (arr: any[]): string | null => {
    const filtrado = (arr || []).filter(x => x !== null && x !== undefined && x !== '');
    return filtrado.length > 0 ? String(filtrado[0]).trim() : null;
  };
  
  const solicitante_nome = extrairNomeLocal(demandaCarrousel.solicitantes);
  const demandante_nome = extrairNomeLocal(demandaCarrousel.demandantes);
  const emissor_nome = demandaCarrousel.emissorNome || null;
  
  // 🔥 Montar código: tipo + demandaCodigo (ex: A4032, I2302)
  const tipo = demandaCarrousel.demandaTipo || demandaCarrousel.tipo || 'A';
  const codigo = demandaCarrousel.demandaCodigo || '0000';
  const demanda_codigo = `${tipo}${codigo}`;
  
  // 🔥 Motivo SEMPRE é motivoTitulo, fallback "Indefinido"
  const motivo_titulo = demandaCarrousel.motivoTitulo || 'Indefinido';
  
  return {
    // Identificação
    id: demandaCarrousel.demandaId,
    demanda_codigo, // 🔥 Código montado: A4032, I2302, etc
    tipo,
    
    // 🔥 Cliente SEMPRE é anuncianteNome
    cliente_nome: demandaCarrousel.anuncianteNome || 'Não informado',
    agencia_nome: demandaCarrousel.agenciaNome || null,
    
    // 🔥 Motivo SEMPRE é motivoTitulo (ou "Indefinido")
    motivo_titulo,
    motivo_tipo: demandaCarrousel.motivoTipo || 'outro',
    motivo_descricao: demandaCarrousel.pedidoTexto || '',
    
    // Pessoas
    solicitante_nome,
    demandante_nome,
    emissor_nome,
    representante_nome: null,
    
    // Valores (serão atualizados com orçamento)
    valor_total: 0,
    valor_producao: 0, // 🔥 Virá de orcamento_valor_producao (string)
    valor_financiamento: 0,
    valor_taxa_solicitante: 0,
    valor_taxa_agencia: 0,
    valor_lucro: 0,
    
    // Prazos (serão atualizados com orçamento)
    prazo_data: null, // 🔥 demandaDeadline
    prazo_dias: 0, // 🔥 orcamento_prazo_dias
    data_aprovacao: null, // 🔥 orcamento_aprovado_at
    data_criacao: demandaCarrousel.createdAt || new Date().toISOString(),
    
    // 🔥 Sem etiqueta de status (mantém por compatibilidade)
    status: 'preparacao',
    progresso_percentual: 0, // 🔥 Será calculado: (now - aprovacao) / (entrega - aprovacao) * 100
    
    // Entregas
    total_entregas: 0,
    entregas: [],
  };
}

/**
 * 🎯 Adapta array de demandas do carrousel
 */
export function adaptarProjetosMandrill(demandasCarrousel: any[]): ProjetoMOD[] {
  return demandasCarrousel.map(adaptarProjetoMandrill);
}

/**
 * 🎯 Enriquece projeto com dados do orçamento e demanda detalhados
 */
export function enriquecerProjetoComOrcamento(
  projetoBase: ProjetoMOD,
  dadosCompletos: {
    demanda: any;
    orcamento: any;
    composicoes: any[];
    servicos: any[];
    entregas?: any[];
    boardData?: any;
    thread?: any[];
  }
): ProjetoMOD {
  const { demanda, orcamento, composicoes, entregas = [], boardData, thread = [] } = dadosCompletos;
  
  // 🔍 DEBUG: Log dos dados recebidos
  console.log('🔍 [ADAPTER] Enriquecendo projeto:', projetoBase.id);
  console.log('📦 [ADAPTER] Entregas recebidas:', {
    total: entregas.length,
    entregas: entregas.map((e: any) => ({ 
      id: e.entrega_id, 
      titulo: e.entrega_titulo, 
      servicos: e.servicos?.length || 0 
    })),
  });
  console.log('📦 [ADAPTER] dadosCompletos.entregas existe?', !!dadosCompletos.entregas);
  console.log('📦 [ADAPTER] typeof entregas:', typeof entregas, Array.isArray(entregas));
  console.log('📦 Orçamento recebido:', {
    orcamento_valor_producao: orcamento.orcamento_valor_producao,
    orcamento_prazo_dias: orcamento.orcamento_prazo_dias,
    orcamento_aprovado_at: orcamento.orcamento_aprovado_at,
    orcamento_valor_total: orcamento.orcamento_valor_total,
    keys: Object.keys(orcamento).slice(0, 10),
  });
  console.log('📅 Demanda:', {
    demandaDeadline: demanda.demandaDeadline,
    keys: Object.keys(demanda).slice(0, 10),
  });
  
  // �🔥 Orçamento de Produção SEMPRE de orcamento_valor_producao (converter string)
  const valor_producao = parseFloat(orcamento.orcamento_valor_producao || '0');
  
  // 🔥 Prazo de Pagamento SEMPRE de orcamento_prazo_dias
  const prazo_dias = orcamento.orcamento_prazo_dias || 0;
  
  // 🔥 Aprovação Orçamento SEMPRE de orcamento_aprovado_at
  const data_aprovacao = orcamento.orcamento_aprovado_at || null;
  
  // 🔥 Entrega Estimada SEMPRE de demandaDeadline (pode ser null = "Não informado")
  const prazo_data = demanda.demandaDeadline || null;
  
  // 🔥 Calcular progresso: (now - aprovacao) / (entrega - aprovacao) * 100
  let progresso_percentual = 0;
  if (data_aprovacao && prazo_data) {
    const now = new Date().getTime();
    const aprovacao = new Date(data_aprovacao).getTime();
    const entrega = new Date(prazo_data).getTime();
    
    if (entrega > aprovacao) {
      const progressoCalculado = ((now - aprovacao) / (entrega - aprovacao)) * 100;
      progresso_percentual = Math.max(0, Math.min(100, progressoCalculado)); // Entre 0 e 100
    }
  }
  // Se não tiver entrega estimada, progresso fica 0
  
  return {
    ...projetoBase,
    
    // 🔥 Valores detalhados
    valor_total: parseFloat(orcamento.orcamento_valor_total) || 0,
    valor_producao, // 🔥 SEMPRE orcamento_valor_producao (convertido)
    valor_financiamento: parseFloat(orcamento.orcamento_valor_financiamento || '0'),
    valor_taxa_solicitante: parseFloat(orcamento.orcamento_valor_taxa_solicitante || '0'),
    valor_taxa_agencia: parseFloat(orcamento.orcamento_valor_taxa_agencia || '0'),
    valor_lucro: parseFloat(orcamento.orcamento_valor_lucro || '0'),
    
    // 🔥 Prazos
    prazo_dias, // 🔥 SEMPRE orcamento_prazo_dias
    prazo_data, // 🔥 SEMPRE demandaDeadline (null = "Não informado")
    data_aprovacao, // 🔥 SEMPRE orcamento_aprovado_at
    
    // 🔥 Progresso calculado (0% = aprovação, 100% = entrega)
    progresso_percentual,
    
    // Entregas (baseado nas composições)
    total_entregas: composicoes.reduce((acc: number, comp: any) => {
      return acc + (comp.quantidade || 1);
    }, 0),
    
    // 🔥 Entregas do projeto (da API projeto-entrega)
    entregas: (() => {
      const entregasMapeadas = (entregas || []).map((entrega: any) => ({
        id: entrega.entrega_id,
        nome: entrega.entrega_titulo,
        letra: entrega.entrega_letra,
        briefing: entrega.entrega_resposta?.description || '',
        texto_apoio: entrega.entrega_resposta?.estrategia || '',
        tipo_producao: entrega.entrega_resposta?.tipoProducao || '',
        duracao: entrega.entrega_resposta?.duracaoFilme || {},
        veiculos: entrega.entrega_resposta?.veiculosDivulgacao || {},
        status: 'planejada' as const,
        progresso_percentual: 0,
        servicos: (entrega.servicos || []).map((servico: any) => ({
          id: servico.proj_servico_id,
          nome: servico.proj_servico_titulo,
          prazo_dias: servico.proj_servico_prazo || 0,
          status: 'planejada' as const,
          progresso_percentual: 0,
        })),
      }));
      console.log('✅ Entregas mapeadas:', entregasMapeadas.length, entregasMapeadas);
      return entregasMapeadas;
    })(),
    
    // 🔥 Dados do board para ReactFlow (posições, conexões, etc)
    boardData: boardData || {},
    
    // 🔥 Timeline/Histórico do projeto - APENAS INFORMAÇÕES
    timeline: thread
      .filter((item: any) => item.type === 'informacao' && item.visible)
      .map((item: any) => {
        // Processar texto para remover tags HTML de mention e converter para @usuario
        let textoProcessado = item.log?.texto || item.informacao?.informacao || '';
        
        // Regex para capturar <mention id='...'>@Usuario</mention> e converter para @Usuario
        textoProcessado = textoProcessado.replace(
          /<mention[^>]*>@?([^<]+)<\/mention>/gi,
          '@$1'
        );
        
        return {
          id: item._id,
          type: item.type,
          action: item.action,
          title: item.log?.title || item.title || '', // Título da informação
          content: textoProcessado, // Conteúdo com mentions processadas
          date: item.created_at, // Data ISO
          author: item.created_pessoa?.pessoa_nome || 'Sistema', // Autor
          created_at: item.created_at,
          created_ago: item.created_ago,
          created_pessoa: item.created_pessoa,
          visible: item.visible,
          has_mention: item.has_mention,
          files: item.informacao?.files || [], // Arquivos anexados
        };
      }),
  };
}

/**
 * 🔥 Calcula tempo restante para entrega (para countdown)
 * Retorna: { dias, horas, minutos, segundos, atrasado }
 */
export function calcularTempoRestante(prazo_data: string | null) {
  if (!prazo_data) {
    return { indefinido: true, dias: 0, horas: 0, minutos: 0, segundos: 0, atrasado: false };
  }
  
  const now = new Date().getTime();
  const entrega = new Date(prazo_data).getTime();
  const diferenca = entrega - now;
  
  if (diferenca < 0) {
    // Atrasado
    const diferencaAbs = Math.abs(diferenca);
    return {
      indefinido: false,
      dias: Math.floor(diferencaAbs / (1000 * 60 * 60 * 24)),
      horas: Math.floor((diferencaAbs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutos: Math.floor((diferencaAbs % (1000 * 60 * 60)) / (1000 * 60)),
      segundos: Math.floor((diferencaAbs % (1000 * 60)) / 1000),
      atrasado: true,
    };
  }
  
  // No prazo
  return {
    indefinido: false,
    dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
    segundos: Math.floor((diferenca % (1000 * 60)) / 1000),
    atrasado: false,
  };
}
