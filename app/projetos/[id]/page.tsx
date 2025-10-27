'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ProjectDetail from '../../components/ProjectDetail';
import { useProjetos, useProjetoDetalhes } from '@/app/hooks/useProjetos';
import { mandrillApi } from '@/lib/mandrill-api';

export default function ProjetoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  // 🚀 Busca projetos (com cache do top 5)
  const { projetos, isLoading: loadingLista } = useProjetos();
  const { buscarDetalhes, isLoading: isLoadingPorId, hasCache } = useProjetoDetalhes();
  
  // Estado do projeto detalhado
  const [projetoDetalhado, setProjetoDetalhado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Busca detalhes quando página carrega
  useEffect(() => {
    const projetoId = params.id as string;
    
    console.log('🔍 [PAGE] Iniciando busca de detalhes para:', projetoId);
    console.log('📊 [PAGE] Estado:', {
      totalProjetos: projetos.length,
      loadingLista,
      hasCache: hasCache(projetoId),
    });
    
    // Busca projeto base da lista
    const projetoBase = projetos.find(p => p.id === projetoId);
    
    if (!projetoBase) {
      if (!loadingLista) {
        console.warn('⚠️ [PAGE] Projeto não encontrado na lista');
        setError('Projeto não encontrado');
      } else {
        console.log('⏳ [PAGE] Aguardando lista carregar...');
      }
      return;
    }

    console.log('✅ [PAGE] Projeto base encontrado:', {
      id: projetoBase.id,
      codigo: projetoBase.demanda_codigo,
      cliente: projetoBase.cliente_nome,
    });

    // Se já tem cache, usa imediatamente
    if (hasCache(projetoId)) {
      console.log('⚡ [PAGE] Usando projeto do cache');
      buscarDetalhes(projetoBase)
        .then(projeto => {
          console.log('✅ [PAGE] Projeto do cache carregado:', projeto);
          setProjetoDetalhado(projeto);
        })
        .catch(err => {
          console.error('❌ [PAGE] Erro ao buscar do cache:', err);
          setError(err.message);
        });
      return;
    }

    // Busca detalhes da API
    console.log('🔍 [PAGE] Buscando detalhes da API para:', projetoId);
    buscarDetalhes(projetoBase)
      .then(projeto => {
        console.log('✅ [PAGE] Projeto detalhado recebido:', {
          id: projeto.id,
          valor_producao: projeto.valor_producao,
          prazo_dias: projeto.prazo_dias,
          data_aprovacao: projeto.data_aprovacao,
          total_entregas: projeto.total_entregas,
        });
        setProjetoDetalhado(projeto);
      })
      .catch(err => {
        console.error('❌ [PAGE] Erro ao buscar detalhes:', err);
        setError(err.message || 'Erro ao carregar projeto');
      });
  }, [params.id, projetos, loadingLista, buscarDetalhes, hasCache]);

  const handleBackToList = () => {
    router.push('/projetos');
  };

  const handleDeliveryClick = (delivery: any) => {
    router.push(`/projetos/${params.id}/entregas/${delivery.id}`);
  };

  // Loading state
  if (loadingLista || isLoadingPorId(params.id as string) || !projetoDetalhado) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {hasCache(params.id as string) ? 'Carregando do cache...' : 'Carregando detalhes do projeto...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button 
            onClick={handleBackToList}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    console.log('🔄 Recarregando projeto após adicionar informação...');
    const projetoId = params.id as string;
    const projetoBase = projetos.find(p => p.id === projetoId);
    if (projetoBase) {
      // Limpa o estado atual IMEDIATAMENTE para mostrar loading
      setProjetoDetalhado(null);
      
      try {
        // Força recarregar da API, sem usar cache
        const dadosCompletos = await mandrillApi.getDemandaCompletaParaMOD(projetoId);
        
        // Enriquece e atualiza o projeto
        const { enriquecerProjetoComOrcamento } = await import('@/lib/adapters/mandrill-adapter');
        const projetoAtualizado = enriquecerProjetoComOrcamento(projetoBase, dadosCompletos);
        
        console.log('✅ Projeto atualizado com nova informação:', projetoAtualizado);
        setProjetoDetalhado(projetoAtualizado);
      } catch (err: any) {
        console.error('❌ Erro ao recarregar:', err);
        setError('Erro ao recarregar projeto');
      }
    }
  };

  return (
    <ProjectDetail 
      project={projetoDetalhado}
      router={router}
      editingServiceId={editingServiceId}
      onStartEditing={(serviceId) => setEditingServiceId(serviceId)}
      onStopEditing={() => setEditingServiceId(null)}
      onBackToList={handleBackToList}
      onDeliveryClick={handleDeliveryClick}
      onRefresh={handleRefresh}
    />
  );
}
