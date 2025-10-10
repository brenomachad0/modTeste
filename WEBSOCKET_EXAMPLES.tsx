/**
 * EXEMPLO DE USO DOS HOOKS WEBSOCKET
 * 
 * Este arquivo mostra como integrar os hooks de WebSocket nos componentes existentes
 */

// ============================================
// EXEMPLO 1: Dashboard (ProjectListView.tsx)
// ============================================

'use client';

import { useRealtimeProjetos, useRealtimeTarefas } from '@/app/hooks/useRealtimeData';

export default function ProjectListView() {
  const { projetos, loading, error, isConnected } = useRealtimeProjetos();
  const { tarefas, loading: loadingTarefas } = useRealtimeTarefas();

  if (!isConnected) {
    return <div>Conectando ao servidor...</div>;
  }

  if (loading) {
    return <div>Carregando projetos...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <div>
      <h1>Projetos ({projetos.length})</h1>
      {/* Status de conexão */}
      <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
      </div>

      {/* Aba de Projetos */}
      <div className="projetos">
        {projetos.map((projeto) => (
          <ProjectCard key={projeto.id} projeto={projeto} />
        ))}
      </div>

      {/* Aba de Tarefas */}
      <div className="tarefas">
        {tarefas.map((tarefa) => (
          <TaskCard 
            key={tarefa.id} 
            tarefa={tarefa}
            projeto={tarefa.projeto}
            entrega={tarefa.entrega}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 2: Project Detail (ProjectDetail.tsx)
// ============================================

'use client';

import { useRealtimeProjeto } from '@/app/hooks/useRealtimeData';

export default function ProjectDetail({ projetoId }: { projetoId: string }) {
  const { projeto, loading, error, isConnected } = useRealtimeProjeto(projetoId);

  if (!isConnected) {
    return <div>Conectando ao servidor...</div>;
  }

  if (loading) {
    return <div>Carregando projeto...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  if (!projeto) {
    return <div>Projeto não encontrado</div>;
  }

  return (
    <div>
      <h1>{projeto.cliente_nome}</h1>
      <p>Código: {projeto.demanda_codigo}</p>
      <p>Status: {projeto.status}</p>
      <p>Progresso: {projeto.progresso_percentual}%</p>

      {/* Lista de entregas */}
      <div className="entregas">
        <h2>Entregas</h2>
        {projeto.entregas?.map((entrega) => (
          <EntregaCard key={entrega.id} entrega={entrega} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 3: Entrega Detail (CRÍTICO - Tempo Real)
// ============================================

'use client';

import { useRealtimeEntrega } from '@/app/hooks/useRealtimeData';
import { useEffect, useState } from 'react';

export default function EntregaDetail({ entregaId }: { entregaId: string }) {
  const { entrega, loading, error, isConnected } = useRealtimeEntrega(entregaId);

  if (!isConnected) {
    return <div>Conectando ao servidor...</div>;
  }

  if (loading) {
    return <div>Carregando entrega...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  if (!entrega) {
    return <div>Entrega não encontrada</div>;
  }

  return (
    <div>
      <h1>{entrega.nome}</h1>
      <p>Status: {entrega.status}</p>
      <p>Progresso: {entrega.progresso_percentual}%</p>

      {/* Lista de serviços com tarefas */}
      <div className="servicos">
        {entrega.servicos?.map((servico) => (
          <div key={servico.id} className="servico-card">
            <h3>{servico.nome}</h3>
            <p>Progresso: {servico.progresso_percentual}%</p>

            {/* Tarefas com countdown em tempo real */}
            <div className="tarefas">
              {servico.tarefas?.map((tarefa) => (
                <TaskItemWithCountdown key={tarefa.id} tarefa={tarefa} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO 4: Task com Countdown em Tempo Real
// ============================================

function TaskItemWithCountdown({ tarefa }: { tarefa: any }) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    // Atualiza o countdown a cada segundo
    const interval = setInterval(() => {
      if (tarefa.end_at) {
        const now = new Date();
        const endTime = new Date(tarefa.end_at);
        const diff = endTime.getTime() - now.getTime();

        if (diff <= 0) {
          setCountdown('⏰ Tempo esgotado!');
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tarefa.end_at]);

  return (
    <div className="task-item">
      <h4>{tarefa.nome}</h4>
      <p>Status: {tarefa.status}</p>
      {tarefa.end_at && (
        <p className="countdown">{countdown}</p>
      )}
      <p>Responsável: {tarefa.responsavel_nome}</p>
    </div>
  );
}

// ============================================
// EXEMPLO 5: Hook useSocket para eventos customizados
// ============================================

'use client';

import { useSocket } from '@/app/hooks/useSocket';
import { useEffect } from 'react';

export function CustomComponent() {
  const { on, emit, isConnected } = useSocket();

  useEffect(() => {
    // Listener para evento customizado
    const unsubscribe = on('custom_event', (data) => {
      console.log('Evento recebido:', data);
    });

    // Cleanup
    return () => unsubscribe();
  }, [on]);

  const handleClick = () => {
    // Emite evento para o servidor
    emit('custom_action', { some: 'data' });
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Conectado' : 'Desconectado'}</p>
      <button onClick={handleClick}>Enviar ação</button>
    </div>
  );
}

// ============================================
// EXEMPLO 6: Entrar/Sair de salas (rooms)
// ============================================

'use client';

import { useSocket } from '@/app/hooks/useSocket';
import { useEffect } from 'react';

export function RoomComponent({ roomId }: { roomId: string }) {
  const { joinRoom, leaveRoom, on } = useSocket();

  useEffect(() => {
    // Entra na sala
    joinRoom(roomId);

    // Listener para mensagens da sala
    const unsubscribe = on(`room:${roomId}:message`, (data) => {
      console.log('Mensagem da sala:', data);
    });

    // Cleanup: sai da sala e remove listener
    return () => {
      unsubscribe();
      leaveRoom(roomId);
    };
  }, [roomId, joinRoom, leaveRoom, on]);

  return <div>Conectado à sala: {roomId}</div>;
}

// ============================================
// EXEMPLO 7: Sistema de Presença - Cursores Colaborativos
// ============================================

'use client';

import { usePresence } from '@/app/hooks/usePresence';
import { CollaborativeCursors } from '@/app/components/CollaborativeCursors';
import { ActiveUsersPanel, ActiveUsersAvatars } from '@/app/components/ActiveUsersPanel';

export function ProjetoPageWithPresence({ projetoId }: { projetoId: string }) {
  // Inicializa presença (automático - rastreia cursor, entra/sai da página)
  const { startEditing, stopEditing, isConnected } = usePresence({
    user_id: 'user_123',
    user_name: 'João Silva',
    user_avatar: 'https://example.com/avatar.jpg',
    page: 'projeto',
    page_id: projetoId,
    enabled: true,
  });

  const handleEditTask = (taskId: string) => {
    // Marca que está editando (trava para outros usuários)
    startEditing(taskId);
    
    // ... abrir modal de edição
  };

  const handleCloseModal = () => {
    // Para de editar
    stopEditing();
  };

  return (
    <div className="flex h-screen">
      {/* Cursores de outros usuários (overlay global) */}
      <CollaborativeCursors />

      {/* Conteúdo principal */}
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Projeto #{projetoId.slice(-6)}</h1>
          
          {/* Avatares compactos no header */}
          <ActiveUsersAvatars maxVisible={5} />
        </div>

        {/* Seu conteúdo aqui */}
        <div>...</div>
      </main>

      {/* Painel lateral com usuários ativos */}
      <aside className="w-80 border-l p-4">
        <ActiveUsersPanel
          title="👥 Quem está aqui"
          showCurrentUser={true}
          maxVisible={10}
        />
      </aside>
    </div>
  );
}

// ============================================
// EXEMPLO 8: React Flow - Manipulação de Serviços
// ============================================

'use client';

import { useRealtimeFlow } from '@/app/hooks/useRealtimeFlow';
import { useRealtimeEntrega } from '@/app/hooks/useRealtimeData';
import ReactFlow, { 
  Node, 
  Edge, 
  Connection, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import { useEffect } from 'react';

export function ServiceFlowCanvas({ entregaId }: { entregaId: string }) {
  const { entrega, loading } = useRealtimeEntrega(entregaId);
  const { 
    updateServico, 
    createServico, 
    deleteServico, 
    updateDependencias,
    recalcularEtapas,
    isConnected 
  } = useRealtimeFlow(entregaId);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Converte serviços para nodes/edges do React Flow
  useEffect(() => {
    if (!entrega?.servicos) return;

    const newNodes: Node[] = entrega.servicos.map((servico) => ({
      id: servico.id,
      position: { x: servico.ordem * 250, y: (servico.etapa || 0) * 150 },
      data: { 
        label: servico.nome,
        servico 
      },
      type: 'default',
    }));

    const newEdges: Edge[] = entrega.servicos.flatMap((servico) =>
      (servico.dependencias || []).map((depId) => ({
        id: `${depId}-${servico.id}`,
        source: depId,
        target: servico.id,
        type: 'smoothstep',
      }))
    );

    setNodes(newNodes);
    setEdges(newEdges);
  }, [entrega, setNodes, setEdges]);

  // Quando um nó é arrastado
  const onNodeDragStop = (_event: any, node: Node) => {
    const servico = entrega?.servicos?.find((s) => s.id === node.id);
    if (!servico) return;

    // Atualiza posição no backend
    updateServico({
      id: node.id,
      ordem: Math.round(node.position.x / 250),
    });
  };

  // Quando uma conexão é criada (nova edge)
  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const targetServico = entrega?.servicos?.find((s) => s.id === connection.target);
    if (!targetServico) return;

    const newDependencias = [...(targetServico.dependencias || []), connection.source];
    
    // Atualiza dependências no backend
    updateDependencias(connection.target, newDependencias);
    
    // Recalcula etapas (BFS)
    recalcularEtapas();
  };

  // Quando uma edge é deletada
  const onEdgesDelete = (edgesToDelete: Edge[]) => {
    edgesToDelete.forEach((edge) => {
      const targetServico = entrega?.servicos?.find((s) => s.id === edge.target);
      if (!targetServico) return;

      const newDependencias = targetServico.dependencias?.filter((id) => id !== edge.source);
      updateDependencias(edge.target, newDependencias || []);
    });

    recalcularEtapas();
  };

  // Quando um nó é deletado
  const onNodesDelete = (nodesToDelete: Node[]) => {
    nodesToDelete.forEach((node) => {
      deleteServico(node.id);
    });
  };

  // Adicionar novo serviço
  const handleAddService = () => {
    createServico({
      nome: 'Novo Serviço',
      descricao: '',
      ordem: (entrega?.servicos?.length || 0) + 1,
      etapa: 1,
      pode_executar_paralelo: false,
      dependencias: [],
      status: 'nao-iniciado',
      progresso_percentual: 0,
      tarefas: [],
    });
  };

  if (loading) return <div>Carregando canvas...</div>;

  return (
    <div style={{ height: '600px', width: '100%' }}>
      {/* Indicador de conexão */}
      <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Sincronizado' : '🔴 Offline'}
      </div>

      <button onClick={handleAddService}>➕ Adicionar Serviço</button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodesDelete={onNodesDelete}
        fitView
      >
        {/* Adicione controles, minimap, etc */}
      </ReactFlow>
    </div>
  );
}
