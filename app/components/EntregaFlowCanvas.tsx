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
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Package, CheckCircle, Clock, AlertTriangle, Play } from 'lucide-react';

interface Entrega {
  id: string;
  nome: string;
  status: 'planejada' | 'proxima' | 'planejamento' | 'executando' | 'pausada' | 'atrasada' | 'concluida';
  progresso_percentual: number;
  briefing?: string;
  valor_unitario?: number;
  quantidade_total?: number;
}

interface EntregaFlowCanvasProps {
  entregas: Entrega[];
  boardData?: any[];
  onEntregaClick?: (entregaId: string) => void;
  onSaveFlow?: (nodes: Node[], edges: Edge[]) => void;
  onCancelFlow?: () => void;
  selectedEntregaId?: string | null;
  isSaving?: boolean;
  projetoId: string;
}

// Componente customizado para os nodes de entrega (HEXAGONAL)
const EntregaNode = ({ data, selected }: any) => {
  const progresso = data.progresso_percentual || 0;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'concluida':
        return { 
          color: 'from-green-600 to-green-400', 
          icon: CheckCircle, 
          label: 'Concluída',
          borderColor: 'border-green-500'
        };
      case 'executando':
        return { 
          color: 'from-cyan-600 to-cyan-400', 
          icon: Play, 
          label: 'Em Execução',
          borderColor: 'border-cyan-500'
        };
      case 'atrasada':
        return { 
          color: 'from-red-600 to-red-400', 
          icon: AlertTriangle, 
          label: 'Atrasada',
          borderColor: 'border-red-500'
        };
      case 'pausada':
        return { 
          color: 'from-yellow-600 to-yellow-400', 
          icon: Clock, 
          label: 'Pausada',
          borderColor: 'border-yellow-500'
        };
      case 'proxima':
        return { 
          color: 'from-blue-600 to-blue-400', 
          icon: Clock, 
          label: 'Próxima',
          borderColor: 'border-blue-500'
        };
      default: // planejamento ou planejada
        return { 
          color: 'from-purple-600 to-pink-500', 
          icon: Clock, 
          label: 'Planejamento',
          borderColor: 'border-purple-500'
        };
    }
  };

  const statusInfo = getStatusInfo(data.status);
  const StatusIcon = statusInfo.icon;
  const isSelected = data.isSelected || selected;

  // Estilo de warning se não tiver conexões
  let borderStyle = statusInfo.borderColor;
  let ringStyle = 'ring-purple-400/50';
  
  if (data.connectionStatus === 'warning') {
    borderStyle = 'border-yellow-500';
    ringStyle = 'ring-yellow-500/50';
  } else if (isSelected) {
    ringStyle = `${statusInfo.borderColor.replace('border-', 'ring-')}/50`;
  }

  return (
    <div 
      className={`relative bg-gray-800 border-3 p-5 min-w-[260px] max-w-[260px] shadow-2xl transition-all cursor-pointer ${
        isSelected 
          ? `${borderStyle} ring-4 ${ringStyle} shadow-2xl shadow-purple-500/30` 
          : `${borderStyle} hover:${borderStyle} hover:shadow-2xl hover:scale-105`
      }`}
      style={{
        clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)', // Hexágono
        transition: 'all 0.3s ease',
      }}
      onClick={() => data.onEntregaClick?.(data.id)}
    >
      {/* Overlay gradiente de fundo */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${statusInfo.color} opacity-10`}
        style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
        }}
      />

      {/* Handle de Entrada (esquerda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-pink-500 !border-2 !border-white"
        style={{ left: -8 }}
      />
      
      {/* Handle de Saída (direita) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-purple-500 !border-2 !border-white"
        style={{ right: -8 }}
      />

      {/* Conteúdo interno */}
      <div className="relative z-10 text-center space-y-3">
        {/* Ícone + Status */}
        <div className="flex flex-col items-center gap-2">
          <div className={`p-2 rounded-full bg-gradient-to-br ${statusInfo.color}`}>
            <StatusIcon className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${statusInfo.color} text-white`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Nome da Entrega */}
        <h3 className="font-bold text-white text-base px-2 line-clamp-2">
          {data.nome}
        </h3>

        {/* Progress Bar Circular */}
        <div className="flex items-center justify-center">
          <div className="relative w-16 h-16">
            {/* Background circle */}
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="url(#gradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progresso / 100)}`}
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className="text-purple-500" stopColor="currentColor" />
                  <stop offset="100%" className="text-pink-500" stopColor="currentColor" />
                </linearGradient>
              </defs>
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{progresso}%</span>
            </div>
          </div>
        </div>

        {/* Valores (se disponível) */}
        {data.quantidade_total && (
          <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
            <Package className="w-3 h-3" />
            <span>{data.quantidade_total} {data.quantidade_total > 1 ? 'itens' : 'item'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  entregaNode: EntregaNode,
};

// Componente interno que usa useReactFlow
function FlowContent({ initialLoad }: { initialLoad: boolean }) {
  const { fitView } = useReactFlow();
  
  React.useEffect(() => {
    if (initialLoad) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 100);
    }
  }, [initialLoad, fitView]);
  
  return null;
}

export default function EntregaFlowCanvas({
  entregas,
  boardData = [],
  onEntregaClick,
  onSaveFlow,
  onCancelFlow,
  selectedEntregaId = null,
  isSaving = false,
  projetoId,
}: EntregaFlowCanvasProps) {
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [edgeToDelete, setEdgeToDelete] = useState<Edge | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const originalDataRef = React.useRef<{
    entregas: Entrega[];
    boardData: any[];
  } | null>(null);
  
  if (!originalDataRef.current) {
    originalDataRef.current = {
      entregas: [...entregas],
      boardData: [...boardData],
    };
  }
  
  // Criar nodes para entregas
  const initialNodes = React.useMemo(() => {
    if (entregas.length === 0) {
      return [];
    }
    
    console.group('🎨 [ENTREGA FLOW] Criando Nodes');
    console.log('📊 Boards disponíveis:', boardData.length);
    console.log('🔧 Entregas a processar:', entregas.length);
    
    const canvasCenterX = 400;
    const canvasCenterY = 200;
    const horizontalSpacing = 350;
    
    const allNodes: Node[] = entregas.map((entrega, index) => {
      // Buscar posição salva do board
      const board = boardData.find(
        (b: any) => b.board_entidade === 'entrega' && b.board_entidade_id === entrega.id
      );
      
      const position = board
        ? { x: Number(board.board_position_x), y: Number(board.board_position_y) }
        : { x: canvasCenterX + (index * horizontalSpacing), y: canvasCenterY };
      
      const nodeData = {
        ...entrega,
        onEntregaClick,
        isSelected: false,
      };
      
      console.log(`✅ Entrega ${entrega.nome}: pos=(${position.x},${position.y})`);
      
      return {
        id: entrega.id,
        type: 'entregaNode',
        position,
        data: nodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });
    
    console.log(`✅ Total de nodes criados: ${allNodes.length}`);
    console.groupEnd();
    
    return allNodes;
  }, [entregas, boardData, onEntregaClick]);
  
  // Criar edges baseado em board_next
  const initialEdges = React.useMemo(() => {
    console.group('🔗 [ENTREGA FLOW] Criando Edges');
    const edgesArray: Edge[] = [];
    
    boardData.forEach((board: any) => {
      if (board.board_entidade !== 'entrega') return;
      if (!board.board_next || board.board_next.length === 0) return;
      
      const sourceId = board.board_entidade_id;
      if (!sourceId) return;
      
      const targetNodeIds = Array.isArray(board.board_next) ? board.board_next : [];
      
      targetNodeIds.forEach((targetNodeId: string) => {
        edgesArray.push({
          id: `${sourceId}-${targetNodeId}`,
          source: sourceId,
          target: targetNodeId,
          type: 'default',
          animated: true,
          style: { stroke: '#ec4899', strokeWidth: 3 }, // Rosa
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#ec4899',
          },
        });
        
        console.log(`  ✅ Edge: ${sourceId.substring(0, 12)}... → ${targetNodeId.substring(0, 12)}...`);
      });
    });
    
    console.log(`✅ Total de edges criadas: ${edgesArray.length}`);
    console.groupEnd();
    
    return edgesArray;
  }, [boardData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Atualizar isSelected
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: selectedEntregaId === node.data.id,
        },
      }))
    );
  }, [selectedEntregaId, setNodes]);
  
  // Atualizar status de conexões
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const hasIncoming = edges.some(e => e.target === node.id);
        const hasOutgoing = edges.some(e => e.source === node.id);
        
        const connectionStatus = (!hasIncoming || !hasOutgoing) ? 'warning' : 'connected';
        
        return {
          ...node,
          data: {
            ...node.data,
            connectionStatus,
          },
        };
      })
    );
  }, [edges, setNodes]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    const hasPositionChange = changes.some((change: any) => 
      change.type === 'position' && change.dragging === false
    );
    if (hasPositionChange) {
      setHasChanges(true);
    }
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    const hasRemoval = changes.some((change: any) => change.type === 'remove');
    if (hasRemoval) {
      setHasChanges(true);
    }
  }, [onEdgesChange]);

  const handleMoveStart = useCallback(() => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    setShowMiniMap(true);
  }, [hideTimeout]);

  const handleMoveEnd = useCallback(() => {
    const timeout = setTimeout(() => {
      setShowMiniMap(false);
    }, 2000);
    setHideTimeout(timeout);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'default',
        animated: true,
        style: { stroke: '#ec4899', strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ec4899',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setHasChanges(true);
    },
    [setEdges]
  );

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
      console.log('✅ Fluxo de entregas salvo');
    }
  }, [nodes, edges, onSaveFlow]);

  const handleCancelFlow = useCallback(() => {
    if (onCancelFlow) {
      onCancelFlow();
      
      if (originalDataRef.current) {
        console.log('🔄 Restaurando dados originais');
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
      
      setHasChanges(false);
      console.log('❌ Edição cancelada');
    }
  }, [onCancelFlow, initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-[600px] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden relative">
      {/* Overlay de salvamento */}
      {isSaving && (
        <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
            <h3 className="text-white text-lg font-semibold mb-2">Salvando fluxo de entregas</h3>
            <p className="text-gray-400 text-sm">Processando alterações...</p>
          </div>
        </div>
      )}
      
      {/* Modal de Confirmação de Exclusão de Conexão */}
      {edgeToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Remover Conexão</h3>
            <p className="text-gray-300 mb-6">Deseja remover esta conexão entre as entregas?</p>
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
        {/* Botão Cancelar */}
        {hasChanges && (
          <button
            onClick={handleCancelFlow}
            className="flex items-center justify-center w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-all hover:scale-105"
            title="Cancelar alterações"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Botão Salvar */}
        {hasChanges && onSaveFlow && (
          <button
            onClick={handleSaveFlow}
            className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg transition-all hover:scale-105 animate-pulse"
            title="Salvar alterações do fluxo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
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
        className="bg-gray-900 react-flow-dark"
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
        edgesUpdatable={true}
        edgesFocusable={true}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <FlowContent initialLoad={isInitialLoad} />
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
              if (node.data.status === 'executando') return '#06b6d4';
              if (node.data.status === 'atrasada') return '#ef4444';
              return '#a855f7';
            }}
          />
        )}
      </ReactFlow>
      
      {/* Estilos customizados */}
      <style jsx global>{`
        .react-flow__edge-path {
          cursor: pointer !important;
          stroke-width: 3 !important;
        }

        .react-flow__edge-path:hover {
          stroke: #f472b6 !important;
          stroke-width: 4 !important;
        }

        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #f472b6 !important;
          stroke-width: 4 !important;
        }

        .react-flow__handle {
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
        }

        .react-flow__handle:hover {
          transform: scale(1.3) !important;
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.5) !important;
        }

        .react-flow__handle-connecting {
          background: #ec4899 !important;
        }

        .react-flow__handle-valid {
          background: #22c55e !important;
        }
      `}</style>
    </div>
  );
}
