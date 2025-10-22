/**
 * Cliente da API Mandrill CRM
 * Busca dados direto da API oficial do CRM
 */

import axios, { AxiosInstance } from 'axios';

class MandrillApiClient {
  private api: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_MANDRILL_CRM_URL || process.env.MANDRILL_CRM_URL;
    const token = process.env.NEXT_PUBLIC_MANDRILL_CRM_TOKEN || process.env.MANDRILL_CRM_TOKEN;

    console.log('🔧 [MANDRILL API] Configuração:', {
      baseURL,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'MISSING'
    });

    if (!baseURL || !token) {
      console.warn('⚠️ Mandrill API não configurada. Defina MANDRILL_CRM_URL e MANDRILL_CRM_TOKEN no .env.local');
    }

    this.api = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 segundos
    });

    // Interceptor para log de erros
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Tentar parsear payload apenas se for JSON
        let payload = null;
        try {
          if (error.config?.data && typeof error.config.data === 'string') {
            payload = JSON.parse(error.config.data);
          } else if (error.config?.data instanceof FormData) {
            payload = '[FormData]';
          } else {
            payload = error.config?.data;
          }
        } catch (e) {
          payload = '[Não foi possível parsear]';
        }

        console.error('❌ Erro na Mandrill API:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          payload,
        });
        throw error;
      }
    );
  }

  // ============================================
  // VENDA DEMANDA - Projetos
  // ============================================

  /**
   * Busca demandas com orçamento aprovado (projetos no MOD)
   * Usa o endpoint carrousel que traz dados completos incluindo agencia, anunciante, emissor
   */
  async getDemandasComOrcamentoAprovado() {
    try {
      console.log('🔍 Buscando demandas aprovadas no carrousel...');
      
      // Buscar do carrousel (tem mais dados que o endpoint normal)
      const response = await this.api.get('/venda-demanda/carrousel', {
        params: { limit: 500 }, // Aumentado para pegar todas
      });
      
      const demandas = response.data?.data || response.data;
      
      // Filtrar apenas as aprovadas
      const demandasAprovadas = demandas.filter(
        (d: any) => d.demandaStatus === 'orcamento_aprovado'
      );
      
      console.log(`✅ ${demandasAprovadas.length} demandas aprovadas encontradas`);
      
      return demandasAprovadas;
    } catch (error) {
      console.error('❌ Erro ao buscar demandas aprovadas:', error);
      throw error;
    }
  }

  /**
   * Busca demanda por ID
   */
  async getDemandaById(id: string) {
    const response = await this.api.get(`/venda-demanda/${id}`);
    return response.data;
  }

  // ============================================
  // VENDA ORÇAMENTO
  // ============================================

  /**
   * Busca orçamentos de uma demanda
   */
  async getOrcamentos(demandaId?: string) {
    const params = demandaId ? { demanda_id: demandaId } : {};
    const response = await this.api.get('/venda-orcamento', { params });
    return response.data?.data || response.data;
  }

  /**
   * Busca orçamento detalhado com composição e precificação
   */
  async getOrcamentoDetalhado(orcamentoId: string) {
    const response = await this.api.get(`/venda-orcamento/${orcamentoId}/detalhado`);
    return response.data;
  }

  // ============================================
  // VENDA DEMANDA ITEM - Briefing das entregas
  // ============================================

  /**
   * Busca itens (briefing) de uma demanda
   */
  async getDemandaItens(demandaId: string) {
    const response = await this.api.get(`/venda-demanda-item/demanda/${demandaId}`);
    return response.data?.data || response.data;
  }

  // ============================================
  // THREAD - Histórico/Timeline do projeto
  // ============================================

  /**
   * 🔥 Busca timeline completa do projeto (logs, arquivos, mensagens)
   */
  async getThreadByDemandaId(demandaId: string) {
    try {
      const response = await this.api.get(`/thread/${demandaId}`);
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Erro ao buscar thread da demanda:', error);
      return []; // Retorna array vazio se não houver thread
    }
  }

  /**
   * 🔥 Adiciona informação ao projeto
   */
  async addInformacao(demandaId: string, data: { assunto: string; informacao: string }) {
    try {
      const response = await this.api.post(`/thread/${demandaId}/informacao`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar informação:', error);
      throw error;
    }
  }

  // ============================================
  // MÉTODO PRINCIPAL - Busca completa para MOD
  // ============================================

  /**
   * 🎯 Busca TODOS os dados necessários para exibir projeto no MOD
   * Retorna: demanda + orçamento + composições + briefing
   */
  async getDemandaCompletaParaMOD(demandaId: string) {
    try {
      console.log(`🔍 Buscando dados completos para demanda ${demandaId}...`);
      
      // 1. Buscar demanda básica
      const demanda = await this.getDemandaById(demandaId);
      
      // 2. Buscar orçamento aprovado
      const orcamentos = await this.getOrcamentos(demandaId);
      const orcamentoAprovado = orcamentos.find((o: any) => o.orcamento_aprovado === true);
      
      if (!orcamentoAprovado) {
        throw new Error('Demanda não possui orçamento aprovado');
      }
      
      // 3. Buscar orçamento detalhado (composição + precificação)
      const orcamentoDetalhado = await this.getOrcamentoDetalhado(orcamentoAprovado.orcamento_id);
      
      // 4. Buscar itens da demanda (briefing)
      const itens = await this.getDemandaItens(demandaId);
      
      // 5. Buscar timeline/histórico do projeto
      const thread = await this.getThreadByDemandaId(demandaId);
      
      // 6. Buscar entregas do projeto
      console.log(`🔍 [ENTREGAS] Buscando entregas para demandaId: "${demandaId}"`);
      const entregasDoProjeto = await this.getEntregasPorDemanda(demandaId);
      console.log(`✅ [ENTREGAS] ${entregasDoProjeto.length} entregas encontradas`);
      
      // 7. Buscar serviços de cada entrega
      const todosServicos = await this.getServicos();
      console.log(`🔧 [SERVICOS] Total de serviços na API: ${todosServicos.length}`);
      
      const entregasComServicos = entregasDoProjeto.map((entrega: any) => {
        const servicosDaEntrega = todosServicos.filter((s: any) => s.proj_entrega === entrega.entrega_id);
        console.log(`📦 [SERVICOS] Entrega "${entrega.entrega_titulo}": ${servicosDaEntrega.length} serviços`);
        return {
          ...entrega,
          servicos: servicosDaEntrega,
        };
      });
      
      // 8. Enriquecer composição com briefing
      const composicoesEnriquecidas = orcamentoDetalhado.composicao.map((comp: any) => {
        const itemBriefing = itens.find((i: any) => i.demandaItemId === comp.demanda_item);
        return {
          ...comp,
          briefing: itemBriefing?.demandaItemResposta || {},
        };
      });
      
      console.log(`✅ Demanda ${demandaId} carregada:`, {
        entregas: entregasComServicos.length,
        composicoes: composicoesEnriquecidas.length,
        timeline: thread.length,
      });
      
      return {
        demanda,
        orcamento: {
          ...orcamentoAprovado,
          ...orcamentoDetalhado,
        },
        composicoes: composicoesEnriquecidas,
        servicos: orcamentoDetalhado.precificacao?.servicos?.servicos_detalhados || [],
        entregas: entregasComServicos, // 🔥 Entregas do projeto com serviços
        thread, // 🔥 Timeline do projeto
      };
    } catch (error) {
      console.error('❌ Erro ao buscar demanda completa:', error);
      throw error;
    }
  }

  /**
   * 🎯 Busca dados completos do carrousel (agencia, anunciante, emissor, etc)
   */
  async getDemandasCarrousel(limit: number = 500) {
    const response = await this.api.get('/venda-demanda/carrousel', {
      params: { limit },
    });
    return response.data?.data || response.data;
  }

  // ============================================
  // ENTREGAS - PROJETO ENTREGA
  // ============================================

  /**
   * @deprecated Endpoint descontinuado
   * Use getEntregasPorDemanda(demandaId) em vez disso
   * 
   * O único endpoint disponível para entregas é:
   * GET /projeto-entrega/demanda/:demandaId
   */
  async getEntregas() {
    console.warn('⚠️ getEntregas() está deprecated - use getEntregasPorDemanda(demandaId)');
    throw new Error('Endpoint /projeto-entrega foi descontinuado. Use /projeto-entrega/demanda/:demandaId');
  }

  /**
   * Lista entregas de uma demanda específica
   * 
   * ⚠️ ESTRUTURA ATUALIZADA (15/10/2025):
   * - Removida tabela financeiro_projeto
   * - Campo correto: entrega_demanda (não entrega_projeto!)
   * - entrega_demanda referencia direto venda_demanda.demandaId
   * - Endpoint: GET /projeto-entrega/demanda/:demandaId
   */
  async getEntregasPorDemanda(demandaId: string) {
    try {
      const endpoint = `/projeto-entrega/demanda/${demandaId}`;
      console.log('🔍 [ENTREGAS] Requisição:', {
        endpoint,
        baseURL: this.api.defaults.baseURL,
        fullURL: `${this.api.defaults.baseURL}${endpoint}`
      });
      
      const response = await this.api.get(endpoint);
      
      // 🔥 Backend retorna: { data: { entregas: [...] } }
      const entregas = response.data?.data?.entregas || response.data?.entregas || [];
      
      console.log(`✅ ${entregas.length} entrega(s) encontrada(s) para demanda ${demandaId}`);
      return entregas;
    } catch (error: any) {
      const status = error.response?.status;
      
      console.error('❌ [ENTREGAS] Falha na requisição:', {
        requestedURL: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.request?.responseURL || 'N/A',
        status,
        method: error.config?.method
      });
      
      if (status === 500) {
        console.error('❌ ERRO 500 no backend ao buscar entregas da demanda:', demandaId);
        console.error('� O endpoint /projeto-entrega/demanda/:id precisa ser corrigido no backend');
        console.error('🔍 Detalhes do erro:', error.response?.data);
      } else if (status === 404) {
        console.log('ℹ️ Nenhuma entrega encontrada para demanda:', demandaId);
      } else {
        console.error('❌ Erro ao buscar entregas:', error.message);
      }
      
      // Retorna array vazio em qualquer erro (não trava a aplicação)
      return [];
    }
  }

  /**
   * Busca entrega detalhada por ID
   * Endpoint: GET /projeto-entrega/:id/detalhado
   */
  async getEntregaDetalhada(entregaId: string, bustCache = false) {
    try {
      const url = bustCache 
        ? `/projeto-entrega/${entregaId}/detalhado?_t=${Date.now()}`
        : `/projeto-entrega/${entregaId}/detalhado`;
      
      const response = await this.api.get(url);
      console.log(`✅ Entrega ${entregaId} carregada${bustCache ? ' (cache busted)' : ''}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar entrega:', error.message);
      throw error;
    }
  }

  /**
   * Cria nova entrega
   */
  /**
   * Cria nova entrega
   * ⚠️ Campo correto: entrega_demanda (não entrega_projeto)
   */
  async criarEntrega(data: {
    entrega_demanda: string; // ⚠️ Campo correto
    entrega_demanda_item: string;
    entrega_titulo: string;
    entrega_letra: string;
    entrega_resposta: any;
  }) {
    try {
      const response = await this.api.post('/projeto-entrega', data);
      console.log('✅ Entrega criada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar entrega:', error);
      throw error;
    }
  }

  /**
   * Atualiza entrega existente
   * ⚠️ Campo correto: entrega_demanda (não entrega_projeto)
   */
  async atualizarEntrega(id: string, data: {
    entrega_demanda?: string; // ⚠️ Campo correto
    entrega_demanda_item?: string;
    entrega_titulo?: string;
    entrega_letra?: string;
    entrega_resposta?: any;
  }) {
    try {
      const response = await this.api.patch(`/projeto-entrega/${id}`, data);
      console.log('✅ Entrega atualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar entrega:', error);
      throw error;
    }
  }

  /**
   * Exclui entrega
   */
  async excluirEntrega(id: string) {
    try {
      await this.api.delete(`/projeto-entrega/${id}`);
      console.log('✅ Entrega excluída');
    } catch (error) {
      console.error('❌ Erro ao excluir entrega:', error);
      throw error;
    }
  }

  // ============================================
  // SERVIÇOS - PROJETO SERVICOS
  // ============================================

  /**
   * Lista todos os serviços
   */
  async getServicos() {
    try {
      const response = await this.api.get('/projeto-servicos');
      console.log(`✅ ${response.data?.length || 0} serviços encontrados`);
      return response.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar serviços:', error);
      throw error;
    }
  }

  /**
   * Busca serviços de uma entrega específica
   */
  async getServicosPorEntrega(entregaId: string) {
    try {
      const todosServicos = await this.getServicos();
      const servicosDaEntrega = todosServicos.filter((s: any) => s.proj_entrega === entregaId);
      console.log(`✅ ${servicosDaEntrega.length} serviços encontrados para entrega ${entregaId}`);
      return servicosDaEntrega;
    } catch (error) {
      console.error('❌ Erro ao buscar serviços da entrega:', error);
      throw error;
    }
  }

  /**
   * Busca serviço por ID
   */
  async getServico(id: string) {
    try {
      const response = await this.api.get(`/projeto-servicos/${id}`);
      console.log(`✅ Serviço ${id} carregado`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar serviço:', error);
      throw error;
    }
  }

  /**
   * Cria novo serviço
   */
  async criarServico(data: {
    proj_entrega: string;
    proj_servico_prazo: number;
    proj_servico_titulo: string;
  }) {
    try {
      const response = await this.api.post('/projeto-servicos', data);
      console.log('✅ Serviço criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar serviço:', error);
      throw error;
    }
  }

  /**
   * Exclui serviço
   */
  async excluirServico(id: string) {
    try {
      await this.api.delete(`/projeto-servicos/${id}`);
      console.log('✅ Serviço excluído');
    } catch (error) {
      console.error('❌ Erro ao excluir serviço:', error);
      throw error;
    }
  }

  /**
   * Lista tarefas de um serviço
   */
  async getTarefasServico(servicoId: string) {
    try {
      const response = await this.api.get(`/projeto-servicos/${servicoId}/tarefas`);
      return response.data || { data: [], meta: { total: 0 } };
    } catch (error) {
      console.error(`❌ Erro ao buscar tarefas do serviço ${servicoId}:`, error);
      return { data: [], meta: { total: 0 } };
    }
  }

  // ============================================
  // BOARD - PROJETO SERVICOS BOARD
  // ============================================

  /**
   * Lista todos os cards do board
   */
  async getBoardCards() {
    try {
      const response = await this.api.get('/projeto-servicos-board');
      console.log(`✅ ${response.data?.length || 0} cards do board encontrados`);
      return response.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar cards do board:', error);
      throw error;
    }
  }

  /**
   * Busca card do board por ID
   */
  async getBoardCard(id: string) {
    try {
      const response = await this.api.get(`/projeto-servicos-board/${id}`);
      console.log(`✅ Card do board ${id} carregado`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar card do board:', error);
      throw error;
    }
  }

  /**
   * Cria novo card no board
   */
  async criarBoardCard(data: {
    proj_servico: string;
    board_position_x: number;
    board_position_y: number;
    board_in?: string;
    board_out?: string;
    board_tipo: string;
  }) {
    try {
      const response = await this.api.post('/projeto-servicos-board', data);
      console.log('✅ Card do board criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar card do board:', error);
      throw error;
    }
  }

  /**
   * Atualiza card do board (posição, conexões, etc)
   */
  async atualizarBoardCard(id: string, data: {
    proj_servico?: string;
    board_position_x?: number;
    board_position_y?: number;
    board_in?: string;
    board_out?: string;
    board_tipo?: string;
  }) {
    try {
      const response = await this.api.patch(`/projeto-servicos-board/${id}`, data);
      console.log('✅ Card do board atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar card do board:', error);
      throw error;
    }
  }

  /**
   * Exclui card do board
   */
  async excluirBoardCard(id: string) {
    try {
      await this.api.delete(`/projeto-servicos-board/${id}`);
      console.log('✅ Card do board excluído');
    } catch (error) {
      console.error('❌ Erro ao excluir card do board:', error);
      throw error;
    }
  }

  /**
   * 🔥 ATUALIZADO: Salva board para qualquer entidade (cria ou atualiza)
   * Endpoint universal: /projeto-board/{entidade}/{entidadeId}/save
   * 
   * ⚠️ board_next agora é um ARRAY de board_node_ids (não mais CSV string!)
   */
  async salvarBoard(entidade: string, entidadeId: string, data: {
    board_node_id: string;
    board_position_x: number;
    board_position_y: number;
    board_next: string[] | null;   // ✅ Array de board_node_ids (mudou de string para array!)
    board_tipo: string;
  }) {
    try {
      const url = `/projeto-board/${entidade}/${entidadeId}/save`;
      console.log(`📤 Enviando para API: POST ${url}`);
      console.log(`📋 Payload:`, JSON.stringify(data, null, 2));
      
      const response = await this.api.post(url, data);
      
      console.log(`✅ Board salvo para ${entidade} ${entidadeId}:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao salvar board para ${entidade}:`, error);
      console.error(`❌ Detalhes do erro:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Deletar um board pelo ID
   */
  async deletarBoard(boardId: string) {
    try {
      const url = `/projeto-board/${boardId}`;
      console.log(`🗑️  Deletando board: DELETE ${url}`);
      
      const response = await this.api.delete(url);
      
      console.log(`✅ Board ${boardId} deletado com sucesso`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao deletar board ${boardId}:`, error);
      console.error(`❌ Detalhes do erro:`, error.response?.data || error.message);
      throw error;
    }
  }

  // ============================================
  // UPLOAD - INSUMOS/ARQUIVOS
  // ============================================

  /**
   * Busca todos os arquivos de uma demanda
   */
  async getArquivosDemanda(demandaId: string) {
    try {
      const response = await this.api.get(`/venda-arquivos/demanda/${demandaId}`);
      console.log(`✅ ${response.data?.length || 0} arquivos encontrados para demanda ${demandaId}`);
      return response.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar arquivos:', error);
      throw error;
    }
  }

  /**
   * Faz upload de arquivo (insumo) para o projeto
   */
  async uploadArquivo(data: {
    arquivo: File;
    venda_arquivo_origem: 'projeto' | 'entrega';
    venda_arquivo_tipo?: string;
    venda_arquivo_tipo_custom?: string;
    demanda_id: string;
    entrega_id?: string;
  }) {
    try {
      // Validações básicas
      if (!data.demanda_id) {
        throw new Error('demanda_id é obrigatório para upload');
      }
      if (!data.arquivo) {
        throw new Error('Arquivo é obrigatório');
      }

      // Criar FormData para upload
      const formData = new FormData();
      
      // Campos obrigatórios
      formData.append('file', data.arquivo);
      formData.append('venda_arquivo_origem', data.venda_arquivo_origem);
      
      // Se tem entrega selecionada, origem é "item" e ID é da entrega
      // Senão, origem é "demanda" e ID é da demanda
      if (data.entrega_id) {
        formData.append('venda_arquivo_origem_id', data.entrega_id);
      } else {
        formData.append('venda_arquivo_origem_id', data.demanda_id);
      }
      
      // Tipo do arquivo (enum ou custom)
      if (data.venda_arquivo_tipo && data.venda_arquivo_tipo !== 'outros') {
        formData.append('venda_arquivo_tipo', data.venda_arquivo_tipo);
      } else if (data.venda_arquivo_tipo_custom) {
        formData.append('venda_arquivo_tipo_custom', data.venda_arquivo_tipo_custom);
      }

      // Log do que está sendo enviado
      console.log('📤 Fazendo upload de arquivo:', {
        nome: data.arquivo.name,
        tamanho: `${(data.arquivo.size / 1024).toFixed(2)} KB`,
        tipo: data.venda_arquivo_tipo || data.venda_arquivo_tipo_custom,
        origem: data.venda_arquivo_origem,
        origem_id: data.entrega_id || data.demanda_id,
        vinculo: data.entrega_id ? 'Entrega (item)' : 'Projeto (demanda)',
      });

      // Log do FormData (para debug)
      console.log('📦 FormData fields:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      const response = await this.api.post('/upload/venda-arquivo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Arquivo enviado com sucesso:', response.data);

      return response.data;
    } catch (error: any) {
      const errorDetails = {
        message: error?.message || 'Erro desconhecido',
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        config: {
          url: error?.config?.url,
          method: error?.config?.method,
        },
      };
      
      console.error('❌ Erro ao fazer upload:', errorDetails);
      console.error('❌ Error completo:', error);
      
      throw error;
    }
  }

  // ============================================
  // FINANCEIRO - COMPRAS
  // ============================================

  /**
   * Busca todas as compras (pode filtrar por demandaId)
   */
  async getCompras(demandaId?: string) {
    try {
      const response = await this.api.get('/financeiro-compra');
      const compras = response.data || [];
      
      // Filtrar por demanda se especificado
      if (demandaId) {
        return compras.filter((c: any) => c.compra_demanda_id === demandaId);
      }
      
      return compras;
    } catch (error) {
      console.error('❌ Erro ao buscar compras:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova compra
   */
  async criarCompra(data: {
    compra_status?: string;
    compra_beneficiario_nome: string;
    compra_data_pagamento: string;
    compra_valor: number;
    compra_meio_pagamento: string;
    compra_pix?: string;
    compra_pix_chave?: string;
    compra_pix_tipo?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
    compra_descricao: string;
    compra_centro_custo_id?: string;
    compra_demanda_id: string;
    compra_demanda_tipo?: string;
    compra_demanda_codigo?: string;
  }) {
    try {
      // Validações básicas
      if (!data.compra_beneficiario_nome?.trim()) {
        throw new Error('Nome do beneficiário é obrigatório');
      }
      if (!data.compra_valor || data.compra_valor <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }
      if (!data.compra_data_pagamento) {
        throw new Error('Data de pagamento é obrigatória');
      }
      if (!data.compra_descricao?.trim()) {
        throw new Error('Descrição é obrigatória');
      }

      const payload = {
        compra_status: data.compra_status || 'criado',
        compra_beneficiario_nome: data.compra_beneficiario_nome.trim(),
        compra_data_pagamento: data.compra_data_pagamento,
        compra_valor: data.compra_valor,
        compra_meio_pagamento: data.compra_meio_pagamento,
        compra_pix: data.compra_pix || '',
        compra_pix_chave: data.compra_pix_chave || '',
        compra_pix_tipo: data.compra_pix_tipo || 'cpf',
        compra_descricao: data.compra_descricao.trim(),
        compra_centro_custo_id: data.compra_centro_custo_id || '',
        compra_demanda_id: data.compra_demanda_id,
        compra_demanda_tipo: data.compra_demanda_tipo || '',
        compra_demanda_codigo: data.compra_demanda_codigo || '',
      };
      
      console.log('📤 Criando compra:', {
        ...payload,
        compra_valor: `R$ ${payload.compra_valor.toFixed(2)}`,
      });
      
      const response = await this.api.post('/financeiro-compra', payload);
      
      console.log('✅ Compra criada com sucesso:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar compra:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  // ============================================
  // USERS
  // ============================================

  async getUsers() {
    const response = await this.api.get('/users');
    return response.data;
  }

  async getUserById(id: string) {
    const response = await this.api.get(`/users/${id}`);
    return response.data;
  }

  // ============================================
  // PESSOA
  // ============================================

  async getPessoaById(id: string) {
    const response = await this.api.get(`/pessoa/${id}`);
    return response.data;
  }

  async findPessoaByName(name: string, limit: number = 10) {
    const response = await this.api.get('/pessoa/find-by-name', {
      params: { name, limit },
    });
    return response.data;
  }
}

// Exporta instância única (singleton)
export const mandrillApi = new MandrillApiClient();
export default mandrillApi;
