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
    
    // Busca projeto base da lista
    const projetoBase = projetos.find(p => p.id === projetoId);
    
    if (!projetoBase) {
      if (!loadingLista) {
        setError('Projeto não encontrado');
      }
      return;
    }

    // Se já tem cache, usa imediatamente
    if (hasCache(projetoId)) {
      buscarDetalhes(projetoBase)
        .then(projeto => {
          setProjetoDetalhado(projeto);
        })
        .catch(err => {
          console.error('❌ Erro ao buscar projeto do cache:', err);
          setError(err.message);
        });
      return;
    }

    // Busca detalhes da API
    buscarDetalhes(projetoBase)
      .then(projeto => {
        setProjetoDetalhado(projeto);
      })
      .catch(err => {
        console.error('❌ Erro ao buscar detalhes do projeto:', err);
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
    const projetoId = params.id as string;
    const projetoBase = projetos.find(p => p.id === projetoId);
    if (projetoBase) {
      setProjetoDetalhado(null);
      
      try {
        const dadosCompletos = await mandrillApi.getDemandaCompletaParaMOD(projetoId);
        const { enriquecerProjetoComOrcamento } = await import('@/lib/adapters/mandrill-adapter');
        const projetoAtualizado = enriquecerProjetoComOrcamento(projetoBase, dadosCompletos);
        
        setProjetoDetalhado(projetoAtualizado);
      } catch (err: any) {
        console.error('❌ Erro ao recarregar projeto:', err);
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
