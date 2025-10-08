'use client';

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CheckCircle, Target, Clock } from 'lucide-react';

interface Servico {
  id: string;
  nome: string;
  status: 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';
  progresso_percentual: number;
  tarefas?: any[];
}

interface ServiceFlowCanvasProps {
  servicos: Servico[];
  onServicesUpdate?: (servicos: Servico[]) => void;
  onServiceClick?: (serviceId: string) => void;
  onServiceDelete?: (serviceId: string) => void;
  onAddService?: () => void;
  onSaveFlow?: (nodes: Node[], edges: Edge[]) => void;
}

// Componente customizado para os nodes (cards de serviço)
const ServiceNode = ({ data }: any) => {
  const tarefasTotal = data.tarefas?.length || 0;
  const tarefasConcluidas = data.tarefas?.filter((t: any) => t.status === 'concluida').length || 0;
  const progresso = tarefasTotal > 0 ? Math.round((tarefasConcluidas / tarefasTotal) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-green-500';
      case 'executando': return 'bg-blue-500';
      case 'pausada': return 'bg-yellow-500';
      case 'atrasada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const canDelete = ['planejada', 'proxima'].includes(data.status) && !data.isStartNode && !data.isEndNode;
  const isSpecialNode = data.isStartNode || data.isEndNode;

  // Renderização especial para nós OA e JA (sem stats nem progresso)
  if (isSpecialNode) {
    return (
      <div 
        className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 min-w-[280px] shadow-xl transition-all relative"
      >
        {/* Handle de Entrada (esquerda) - apenas no JA */}
        {data.isEndNode && (
          <Handle
            type="target"
            position={Position.Left}
            className="w-4 h-4 !bg-green-500 !border-2 !border-white"
            style={{ left: -8 }}
          />
        )}
        
        {/* Handle de Saída (direita) - apenas no OA */}
        {data.isStartNode && (
          <Handle
            type="source"
            position={Position.Right}
            className="w-4 h-4 !bg-blue-500 !border-2 !border-white"
            style={{ right: -8 }}
          />
        )}

        {/* Título Centralizado sem tag */}
        <div className="text-center">
          <h3 className="font-semibold text-white text-lg">{data.nome}</h3>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-gray-800 border-2 border-gray-700 rounded-lg p-4 min-w-[280px] shadow-xl hover:shadow-2xl transition-all hover:border-purple-500 cursor-pointer relative"
      onClick={() => data.onServiceClick?.(data.id)}
    >
      {/* Handle de Entrada (esquerda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-green-500 !border-2 !border-white"
        style={{ left: -8 }}
      />
      
      {/* Handle de Saída (direita) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-blue-500 !border-2 !border-white"
        style={{ right: -8 }}
      />

      {/* Header com botão de excluir */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white text-lg flex-1">{data.nome}</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(data.status)}`}>
            {data.status === 'executando' ? 'Em Execução' : 
             data.status === 'concluida' ? 'Concluído' : 
             data.status === 'pausada' ? 'Pausado' : 
             data.status === 'proxima' ? 'Aguardando' : 'Planejado'}
          </span>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete?.(data.id);
              }}
              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
              title="Excluir serviço"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
        <span className="flex items-center gap-1">
          <Target className="w-4 h-4" />
          {tarefasTotal} tarefas
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          {tarefasConcluidas} OK
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Progresso</span>
          <span className="text-white font-bold">{progresso}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${progresso === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  serviceNode: ServiceNode,
};

export default function ServiceFlowCanvas({
  servicos,
  onServicesUpdate,
  onServiceClick,
  onServiceDelete,
  onAddService,
  onSaveFlow
}: ServiceFlowCanvasProps) {
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [edgeToDelete, setEdgeToDelete] = useState<Edge | null>(null);  // Converter serviços para nodes do React Flow com START e FIM
  const serviceNodes: Node[] = servicos.map((servico, index) => ({
    id: servico.id,
    type: 'serviceNode',
    position: { x: 250 + index * 350, y: 100 + (index % 2) * 200 },
    data: {
      ...servico,
      onServiceClick,
      onDelete: onServiceDelete,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));

  // Adicionar nó Orçamento Aprovado (início)
  const startNode: Node = {
    id: 'start-node',
    type: 'serviceNode',
    position: { x: 50, y: 150 },
    data: {
      id: 'start-node',
      nome: 'Orçamento Aprovado',
      status: 'concluida',
      progresso_percentual: 100,
      tarefas: [],
      isStartNode: true,
      onServiceClick: () => {},
      onDelete: () => {},
    },
    sourcePosition: Position.Right,
  };

  // Adicionar nó Job Aprovado (fim)
  const endNode: Node = {
    id: 'end-node',
    type: 'serviceNode',
    position: { x: 250 + servicos.length * 350, y: 150 },
    data: {
      id: 'end-node',
      nome: 'Job Aprovado',
      status: 'planejada',
      progresso_percentual: 0,
      tarefas: [],
      isEndNode: true,
      onServiceClick: () => {},
      onDelete: () => {},
    },
    targetPosition: Position.Left,
  };

  const initialNodes: Node[] = [startNode, ...serviceNodes, endNode];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Atualizar nodes quando servicos mudar
  React.useEffect(() => {
    const serviceNodes: Node[] = servicos.map((servico, index) => ({
      id: servico.id,
      type: 'serviceNode',
      position: { x: 250 + index * 350, y: 100 + (index % 2) * 200 },
      data: {
        ...servico,
        onServiceClick,
        onDelete: onServiceDelete,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }));

    const startNode: Node = {
      id: 'start-node',
      type: 'serviceNode',
      position: { x: 50, y: 150 },
      data: {
        id: 'start-node',
        nome: 'Orçamento Aprovado',
        status: 'concluida',
        progresso_percentual: 100,
        tarefas: [],
        isStartNode: true,
        onServiceClick: () => {},
        onDelete: () => {},
      },
      sourcePosition: Position.Right,
    };

    const endNode: Node = {
      id: 'end-node',
      type: 'serviceNode',
      position: { x: 250 + servicos.length * 350, y: 150 },
      data: {
        id: 'end-node',
        nome: 'Job Aprovado',
        status: 'planejada',
        progresso_percentual: 0,
        tarefas: [],
        isEndNode: true,
        onServiceClick: () => {},
        onDelete: () => {},
      },
      targetPosition: Position.Left,
    };

    setNodes([startNode, ...serviceNodes, endNode]);
  }, [servicos, onServiceClick, onServiceDelete, setNodes]);

  // Detectar mudanças nos nodes (posições)
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    // Marcar como alterado apenas se for uma mudança de posição
    const hasPositionChange = changes.some((change: any) => 
      change.type === 'position' && change.dragging === false
    );
    if (hasPositionChange) {
      setHasChanges(true);
    }
  }, [onNodesChange]);

  // Detectar mudanças nas edges
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    // Marcar como alterado se edges foram removidas
    const hasRemoval = changes.some((change: any) => change.type === 'remove');
    if (hasRemoval) {
      setHasChanges(true);
    }
  }, [onEdgesChange]);

  // Mostrar MiniMap durante movimento
  const handleMoveStart = useCallback(() => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    setShowMiniMap(true);
  }, [hideTimeout]);

  const handleMoveEnd = useCallback(() => {
    const timeout = setTimeout(() => {
      setShowMiniMap(false);
    }, 2000); // Ocultar após 2 segundos de inatividade
    setHideTimeout(timeout);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'default', // Tipo default usa curvas bezier
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#a855f7',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setHasChanges(true);
    },
    [setEdges]
  );

  // Deletar edge ao clicar nela (com modal customizado)
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setEdgeToDelete(edge);
  }, []);

  const confirmDeleteEdge = useCallback(() => {
    if (edgeToDelete) {
      setEdges((eds) => eds.filter((e) => e.id !== edgeToDelete.id));
      setHasChanges(true);
      setEdgeToDelete(null);
    }
  }, [edgeToDelete, setEdges]);

  const cancelDeleteEdge = useCallback(() => {
    setEdgeToDelete(null);
  }, []);

  const handleSaveFlow = useCallback(() => {
    if (onSaveFlow) {
      onSaveFlow(nodes, edges);
      setHasChanges(false);
    }
  }, [nodes, edges, onSaveFlow]);

  return (
    <div className="w-full h-[600px] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden relative">
      {/* Modal de Confirmação de Exclusão de Conexão */}
      {edgeToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Remover Conexão</h3>
            <p className="text-gray-300 mb-6">Deseja remover esta conexão entre os serviços?</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cancelDeleteEdge}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteEdge}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação - Topo Direito */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Botão Cancelar Mudanças */}
        {hasChanges && (
          <button
            onClick={() => setHasChanges(false)}
            className="flex items-center justify-center w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-all hover:scale-105"
            title="Cancelar alterações"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Botão Salvar (apenas ícone) */}
        {hasChanges && onSaveFlow && (
          <button
            onClick={handleSaveFlow}
            className="flex items-center justify-center w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-all hover:scale-105 animate-pulse"
            title="Salvar alterações do fluxo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
        )}

        {/* Botão Adicionar Serviço */}
        {onAddService && (
          <button
            onClick={onAddService}
            className="flex items-center justify-center w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-all hover:scale-105"
            title="Adicionar serviço"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-900 react-flow-dark"
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
        edgesUpdatable={true}
        edgesFocusable={true}
      >
        <Background color="#374151" gap={16} />
        <Controls />
        {showMiniMap && (
          <MiniMap 
            style={{
              backgroundColor: '#1f2937',
              transition: 'opacity 0.3s ease-in-out',
            }}
            maskColor="rgba(17, 24, 39, 0.8)"
            nodeColor={(node) => {
              if (node.data.status === 'concluida') return '#22c55e';
              if (node.data.status === 'executando') return '#3b82f6';
              return '#6b7280';
            }}
          />
        )}
      </ReactFlow>
      
      {/* Estilos customizados para ReactFlow */}
      <style jsx global>{`
        .react-flow-dark .react-flow__controls {
          background: #1f2937 !important;
          border: 1px solid #374151 !important;
        }
        
        .react-flow-dark .react-flow__controls-button {
          background: #1f2937 !important;
          border-bottom: 1px solid #374151 !important;
          color: #9ca3af !important;
        }

        /* Tornar edges clicáveis e destacar ao hover */
        .react-flow__edge-path {
          cursor: pointer !important;
          stroke-width: 3 !important;
        }

        .react-flow__edge-path:hover {
          stroke: #c084fc !important;
          stroke-width: 4 !important;
        }

        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #c084fc !important;
          stroke-width: 4 !important;
        }
        
        .react-flow-dark .react-flow__controls-button:hover {
          background: #374151 !important;
          color: #fff !important;
        }
        
        .react-flow-dark .react-flow__controls-button path {
          fill: #9ca3af !important;
        }
        
        .react-flow-dark .react-flow__controls-button:hover path {
          fill: #fff !important;
        }
        
        .react-flow__minimap {
          background: #1f2937 !important;
          border: 1px solid #374151 !important;
        }
        
        .react-flow__minimap-mask {
          fill: rgba(17, 24, 39, 0.8) !important;
        }

        /* Estilos para os handles de conexão */
        .react-flow__handle {
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
        }

        .react-flow__handle:hover {
          transform: scale(1.3) !important;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5) !important;
        }

        .react-flow__handle-connecting {
          background: #a855f7 !important;
        }

        .react-flow__handle-valid {
          background: #22c55e !important;
        }
      `}</style>
    </div>
  );
}
