/**
 * useProjetoDetalhes - Hook para buscar detalhes completos de projetos
 * 
 * 🚀 Sistema de cache otimizado:
 * - Pré-carrega top 5 projetos em background
 * - Cache em memória para evitar requests duplicados
 * - Busca sob demanda para demais projetos
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { mandrillApi } from '@/lib/mandrill-api';
import { enriquecerProjetoComOrcamento, type ProjetoMOD } from '@/lib/adapters/mandrill-adapter';

interface ProjetoDetalhado extends ProjetoMOD {
  // Campos adicionais do detalhamento
  entregas_detalhadas?: any[];
  servicos_detalhados?: any[];
}

interface CacheEntry {
  data: ProjetoDetalhado;
  timestamp: number;
}

interface UseProjetoDetalhesReturn {
  buscarDetalhes: (projetoBase: ProjetoMOD) => Promise<ProjetoDetalhado>;
  isLoading: (projetoId: string) => boolean;
  hasCache: (projetoId: string) => boolean;
  precarregarTop5: (projetos: ProjetoMOD[]) => void;
  clearCache: () => void;
  cacheStats: {
    total: number;
    hits: number;
    misses: number;
  };
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function useProjetoDetalhes(): UseProjetoDetalhesReturn {
  // Cache de projetos detalhados
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  
  // Controle de loading por projeto
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());
  
  // Estatísticas de cache
  const statsRef = useRef({ hits: 0, misses: 0 });

  /**
   * Verifica se existe cache válido para um projeto
   */
  const hasValidCache = useCallback((projetoId: string): boolean => {
    const cached = cacheRef.current.get(projetoId);
    if (!cached) return false;

    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL) {
      // Cache expirado, remove
      cacheRef.current.delete(projetoId);
      return false;
    }

    return true;
  }, []);

  /**
   * 🔥 Busca detalhes completos de um projeto (com cache)
   */
  const buscarDetalhes = useCallback(async (projetoBase: ProjetoMOD): Promise<ProjetoDetalhado> => {
    const projetoId = projetoBase.id;

    // Verifica cache
    if (hasValidCache(projetoId)) {
      statsRef.current.hits++;
      return cacheRef.current.get(projetoId)!.data;
    }

    statsRef.current.misses++;

    // Marca como loading
    setLoadingSet(prev => new Set(prev).add(projetoId));

    try {
      // Busca dados completos da API
      const dadosCompletos = await mandrillApi.getDemandaCompletaParaMOD(projetoId);

      // Enriquece projeto com orçamento e detalhes
      const projetoDetalhado = enriquecerProjetoComOrcamento(projetoBase, dadosCompletos);

      // Salva no cache
      cacheRef.current.set(projetoId, {
        data: projetoDetalhado,
        timestamp: Date.now(),
      });

      return projetoDetalhado;
    } catch (error) {
      console.error(`❌ Erro ao buscar detalhes do projeto ${projetoId}:`, error);
      throw error;
    } finally {
      // Remove do loading
      setLoadingSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(projetoId);
        return newSet;
      });
    }
  }, [hasValidCache]);

  /**
   * 🚀 Pré-carrega detalhes dos top 5 projetos em background
   */
  const precarregarTop5 = useCallback((projetos: ProjetoMOD[]) => {
    if (projetos.length === 0) return;

    // Pega os 5 primeiros que não estão em cache
    const projetosParaPrecarregar = projetos
      .filter(p => !hasValidCache(p.id))
      .slice(0, 5);

    if (projetosParaPrecarregar.length === 0) return;

    // Busca em paralelo (sem await, roda em background)
    Promise.all(
      projetosParaPrecarregar.map(projeto => 
        buscarDetalhes(projeto).catch(() => {})
      )
    );
  }, [hasValidCache, buscarDetalhes]);

  /**
   * Verifica se um projeto está sendo carregado
   */
  const isLoading = useCallback((projetoId: string): boolean => {
    return loadingSet.has(projetoId);
  }, [loadingSet]);

  /**
   * Verifica se um projeto tem cache
   */
  const hasCache = useCallback((projetoId: string): boolean => {
    return hasValidCache(projetoId);
  }, [hasValidCache]);

  /**
   * Limpa todo o cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  /**
   * Estatísticas do cache
   */
  const cacheStats = {
    total: cacheRef.current.size,
    hits: statsRef.current.hits,
    misses: statsRef.current.misses,
  };

  return {
    buscarDetalhes,
    isLoading,
    hasCache,
    precarregarTop5,
    clearCache,
    cacheStats,
  };
}
