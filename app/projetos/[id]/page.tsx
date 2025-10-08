'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import ProjectDetail from '../../components/ProjectDetail';

export default function ProjetoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Mock project data
  const mockProject = {
    id: params.id as string,
    demanda_codigo: 'A2024' as any,
    codigo: 'C2024',
    titulo: 'Campanha de Lançamento de Produto',
    cliente_nome: 'StartupTech Innovations',
    anunciante_nome: 'TechVision Ltda',
    agencia_nome: 'Agência não informada',
    solicitante_nome: 'Não informado',
    demandante_nome: 'Não informado',
    emissor_nome: 'Não informado',
    motivo: 'Campanha de Lançamento MVP',
    motivo_titulo: 'Campanha de Lançamento de Produto',
    status: 'executando' as const,
    progresso_percentual: 45,
    valor_total: 45000,
    valor_producao: 28000,
    prazo_dias: 30,
    data_aprovacao_orcamento: '07/10/2025',
    prazo_data: '14/11/2025',
    data_entrega_estimada: '14/11/2025',
    entregas: [] // será preenchido pelo componente
  };

  const handleBackToList = () => {
    router.push('/projetos');
  };

  const handleDeliveryClick = (delivery: any) => {
    router.push(`/projetos/${params.id}/entregas/${delivery.id}`);
  };

  return (
    <ProjectDetail 
      project={mockProject}
      router={router}
      editingServiceId={editingServiceId}
      onStartEditing={(serviceId) => setEditingServiceId(serviceId)}
      onStopEditing={() => setEditingServiceId(null)}
      onBackToList={handleBackToList}
      onDeliveryClick={handleDeliveryClick}
    />
  );
}
