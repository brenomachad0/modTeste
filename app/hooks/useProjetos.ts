/**
 * useProjetos - Hook para buscar e sincronizar projetos em tempo real
 * 
 * 🔥 NOVA VERSÃO: Busca direto da API Mandrill CRM (oficial)
 * Mantém sincronização via WebSocket para updates em tempo real
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSocketManager } from '@/lib/websocket/SocketManager';
import { mandrillApi } from '@/lib/mandrill-api';
import { adaptarProjetosMandrill, type ProjetoMOD } from '@/lib/adapters/mandrill-adapter';
import { useProjetoDetalhes } from './useProjetoDetalhes';

export interface Projeto extends ProjetoMOD {
  // Alias para compatibilidade com código antigo
  motivo?: string; // Alias para motivo_titulo
}

interface UseProjetosReturn {
  projetos: Projeto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastSync: Date | null;
}

// Re-exporta hook de detalhes para facilitar imports
export { useProjetoDetalhes } from './useProjetoDetalhes';

export function useProjetos(): UseProjetosReturn {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // � Hook de cache e pré-carregamento
  const { precarregarTop5 } = useProjetoDetalhes();

  // �🔥 NOVA VERSÃO: Busca projetos direto da API Mandrill CRM
  const fetchProjetos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Buscando projetos da API Mandrill CRM...');

      // Buscar demandas aprovadas do carrousel (dados completos)
      const demandasAprovadas = await mandrillApi.getDemandasComOrcamentoAprovado();
      
      // Adaptar para formato MOD
      const projetosAdaptados = adaptarProjetosMandrill(demandasAprovadas);
      
      // Adicionar alias para compatibilidade
      const projetosComAlias = projetosAdaptados.map(p => ({
        ...p,
        motivo: p.motivo_titulo, // Alias para compatibilidade
      }));
      
      setProjetos(projetosComAlias);
      setLastSync(new Date());
      
      console.log(`✅ ${projetosComAlias.length} projetos carregados da API Mandrill`);
      
      // 🚀 Pré-carrega detalhes dos top 5 em background
      if (projetosComAlias.length > 0) {
        setTimeout(() => precarregarTop5(projetosComAlias), 100);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar projetos da Mandrill:', err);
      setError(err instanceof Error ? err.message : 'Erro ao conectar com Mandrill CRM');
      setProjetos([]);
    } finally {
      setIsLoading(false);
    }
  }, [precarregarTop5]);

  // Busca inicial
  useEffect(() => {
    fetchProjetos();
  }, [fetchProjetos]);

  // Conecta WebSocket para updates em tempo real
  useEffect(() => {
    const socketManager = getSocketManager();
    socketManager.connect();

    console.log('🔌 Conectando WebSocket para updates de projetos...');

    // Quando um novo projeto é criado
    const handleProjetoCriado = (data: any) => {
      console.log('🎉 Novo projeto criado:', data);
      
      if (data.projeto) {
        setProjetos(prev => {
          // Verifica se já existe para evitar duplicatas
          const exists = prev.some(p => p.id === data.projeto.id);
          if (exists) return prev;
          
          return [data.projeto, ...prev];
        });
        setLastSync(new Date());
      }
    };

    // Quando um projeto é atualizado
    const handleProjetoAtualizado = (data: any) => {
      console.log('🔄 Projeto atualizado:', data);
      
      if (data.projeto) {
        setProjetos(prev => 
          prev.map(p => p.id === data.projeto.id ? { ...p, ...data.projeto } : p)
        );
        setLastSync(new Date());
      }
    };

    // Quando uma entrega é criada (atualiza o projeto pai)
    const handleEntregaCriada = (data: any) => {
      console.log('📦 Nova entrega criada:', data);
      
      // Refetch para pegar estrutura completa
      fetchProjetos();
    };

    // Quando projeto está completo (webhook finalizou)
    const handleProjetoCompleto = (data: any) => {
      console.log('🎊 Projeto completo:', data);
      
      // Refetch para pegar estrutura completa com entregas/serviços/tarefas
      fetchProjetos();
    };

    // Registra listeners
    socketManager.on('projeto:created', handleProjetoCriado);
    socketManager.on('projeto:atualizado', handleProjetoAtualizado);
    socketManager.on('entrega:created', handleEntregaCriada);
    socketManager.on('projeto:completo', handleProjetoCompleto);

    // Cleanup
    return () => {
      socketManager.off('projeto:created', handleProjetoCriado);
      socketManager.off('projeto:atualizado', handleProjetoAtualizado);
      socketManager.off('entrega:created', handleEntregaCriada);
      socketManager.off('projeto:completo', handleProjetoCompleto);
    };
  }, [fetchProjetos]);

  return {
    projetos,
    isLoading,
    error,
    refetch: fetchProjetos,
    lastSync,
  };
}
