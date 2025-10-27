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

// Componente customizado para os nodes de entrega (MINIMALISTA)
const EntregaNode = ({ data, selected }: any) => {
  const progresso = data.progresso_percentual || 0;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'concluida':
        return { 
          color: 'bg-green-500', 
          icon: CheckCircle,
          borderColor: 'border-green-500'
        };
      case 'executando':
        return { 
          color: 'bg-cyan-500', 
          icon: Play,
          borderColor: 'border-cyan-500'
        };
      case 'atrasada':
        return { 
          color: 'bg-red-500', 
          icon: AlertTriangle,
          borderColor: 'border-red-500'
        };
      case 'pausada':
        return { 
          color: 'bg-yellow-500', 
          icon: Clock,
          borderColor: 'border-yellow-500'
        };
      case 'proxima':
        return { 
          color: 'bg-blue-500', 
          icon: Clock,
          borderColor: 'border-blue-500'
        };
      default: // planejamento ou planejada
        return { 
          color: 'bg-purple-500', 
          icon: Clock,
          borderColor: 'border-purple-500'
        };
    }
  };

  const statusInfo = getStatusInfo(data.status);
  const StatusIcon = statusInfo.icon;
  const isSelected = data.isSelected || selected;
  
  // 🔥 Verificar se é nó de sistema (Orçamento Aprovado ou Job Aprovado)
  const isSystemNode = data.isSystemNode;
  const isInicio = data.boardType === 'orcamento_aprovado';
  const isFim = data.boardType === 'job_aprovado';

  // Estilo de warning se não tiver conexões
  let borderStyle = 'border-gray-700';
  let systemBorderColor = 'border-purple-500';
  
  if (isSystemNode) {
    // Nós de sistema: verde se conectado, vermelho se não
    if (data.connectionStatus === 'system-connected') {
      systemBorderColor = 'border-green-500';
    } else if (data.connectionStatus === 'system-disconnected') {
      systemBorderColor = 'border-red-500';
    }
  } else {
    // Nós normais
    if (data.connectionStatus === 'warning') {
      borderStyle = 'border-yellow-500';
    } else if (isSelected) {
      borderStyle = 'border-purple-500';
    }
  }

  // 🎨 Renderização para nós de sistema (formato "C" e "D")
  if (isSystemNode) {
    return (
      <div className="flex flex-col items-center">
        <div 
          className={`relative bg-gray-800 border-2 w-[90px] h-[90px] shadow-lg transition-all ${systemBorderColor}`}
          style={{
            borderRadius: isInicio 
              ? '45px 12px 12px 45px' // C: circular esquerda, rounded direita
              : isFim 
              ? '12px 45px 45px 12px' // D: rounded esquerda, circular direita
              : '12px'
          }}
        >
          {/* Handle de Entrada - Apenas para Job Aprovado (fim) */}
          {isFim && (
            <Handle
              type="target"
              position={Position.Left}
              className="w-2 h-2 !bg-pink-500 !border-2 !border-white opacity-0"
              style={{ left: -4 }}
            />
          )}
          
          {/* Handle de Saída - Apenas para Orçamento Aprovado (início) */}
          {isInicio && (
            <Handle
              type="source"
              position={Position.Right}
              className="w-2 h-2 !bg-purple-500 !border-2 !border-white"
              style={{ right: -4 }}
            />
          )}

          {/* Ícone centralizado */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isInicio ? (
              <CheckCircle className="w-12 h-12 text-green-400" />
            ) : (
              <CheckCircle className="w-12 h-12 text-blue-400" />
            )}
          </div>
        </div>

        {/* Título externo */}
        <div className="mt-2 text-center max-w-[110px]">
          <p className="text-xs font-bold text-white">
            {data.nome}
          </p>
        </div>
      </div>
    );
  }

  // 🎨 Renderização normal para entregas
  return (
    <div className="flex flex-col items-center">
      {/* Card do Node */}
      <div 
        className={`relative bg-gray-800 border-2 rounded-xl w-[90px] h-[90px] shadow-lg transition-all cursor-pointer ${borderStyle} hover:border-purple-400 hover:shadow-xl hover:scale-105`}
        onClick={() => data.onEntregaClick?.(data.id)}
      >
        {/* Selo de Status - Canto superior direito */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusInfo.color} border-2 border-gray-900`} 
             title={data.status} />

        {/* Handle de Entrada (esquerda) - Invisível, mas aparece no hover quando conectando */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 !bg-pink-500 !border-2 !border-white opacity-0"
          style={{ left: -4 }}
        />
        
        {/* Handle de Saída (direita) - Visível para puxar conexões */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 !bg-purple-500 !border-2 !border-white"
          style={{ right: -4 }}
        />

        {/* Ícone da Entrega - Centralizado */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="w-12 h-12 text-purple-400" />
        </div>

        {/* Barra de Progresso - Parte inferior */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </div>

      {/* Título - Abaixo do card */}
      <div className="mt-2 text-center max-w-[110px]">
        <p className="text-xs font-medium text-white line-clamp-2">
          {data.nome}
        </p>
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
    
    const canvasCenterX = 300;
    const canvasCenterY = 150;
    const horizontalSpacing = 180; // Menor espaçamento para cards compactos
    
    const allNodes: Node[] = [];
    
    // 🔥 1. CRIAR NÓ DE INÍCIO: "Orçamento Aprovado"
    const boardInicio = boardData.find(
      (b: any) => b.board_tipo === 'orcamento_aprovado' || b.board_entidade === 'orcamento_aprovado'
    );
    
    const posicaoInicio = boardInicio
      ? { x: Number(boardInicio.board_position_x), y: Number(boardInicio.board_position_y) }
      : { x: 100, y: canvasCenterY };
    
    allNodes.push({
      id: 'orcamento-aprovado-inicio',
      type: 'entregaNode',
      position: posicaoInicio,
      data: {
        id: 'orcamento-aprovado-inicio',
        nome: 'Orçamento Aprovado',
        status: 'concluida',
        progresso_percentual: 100,
        isSystemNode: true,
        boardType: 'orcamento_aprovado',
        connectionStatus: 'system-disconnected',
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    
    console.log(`✅ Nó de Início: Orçamento Aprovado pos=(${posicaoInicio.x},${posicaoInicio.y})`);
    
    // 🔥 2. CRIAR NODES DAS ENTREGAS
    entregas.forEach((entrega, index) => {
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
        isSystemNode: false,
      };
      
      console.log(`✅ Entrega ${entrega.nome}: pos=(${position.x},${position.y})`);
      
      allNodes.push({
        id: entrega.id,
        type: 'entregaNode',
        position,
        data: nodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });
    
    // 🔥 3. CRIAR NÓ DE FIM: "Job Aprovado"
    const boardFim = boardData.find(
      (b: any) => b.board_tipo === 'job_aprovado' || b.board_entidade === 'job_aprovado'
    );
    
    const posicaoFim = boardFim
      ? { x: Number(boardFim.board_position_x), y: Number(boardFim.board_position_y) }
      : { x: canvasCenterX + (entregas.length * horizontalSpacing) + 100, y: canvasCenterY };
    
    allNodes.push({
      id: 'job-aprovado-fim',
      type: 'entregaNode',
      position: posicaoFim,
      data: {
        id: 'job-aprovado-fim',
        nome: 'Job Aprovado',
        status: 'planejada',
        progresso_percentual: 0,
        isSystemNode: true,
        boardType: 'job_aprovado',
        connectionStatus: 'system-disconnected',
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    
    console.log(`✅ Nó de Fim: Job Aprovado pos=(${posicaoFim.x},${posicaoFim.y})`);
    console.log(`✅ Total de nodes criados: ${allNodes.length}`);
    console.groupEnd();
    
    return allNodes;
  }, [entregas, boardData, onEntregaClick]);
  
  // Criar edges baseado em board_next
  const initialEdges = React.useMemo(() => {
    console.group('🔗 [ENTREGA FLOW] Criando Edges');
    const edgesArray: Edge[] = [];
    
    boardData.forEach((board: any) => {
      if (!board.board_next || board.board_next.length === 0) {
        console.log(`⏭️  Board ${board.board_tipo || board.board_entidade} sem board_next, pulando...`);
        return;
      }
      
      // Determinar o sourceId baseado no tipo de board
      let sourceId: string;
      
      if (board.board_tipo === 'orcamento_aprovado' || board.board_entidade === 'orcamento_aprovado') {
        sourceId = 'orcamento-aprovado-inicio';
      } else if (board.board_tipo === 'job_aprovado' || board.board_entidade === 'job_aprovado') {
        sourceId = 'job-aprovado-fim';
      } else {
        sourceId = board.board_entidade_id || board.board_node_id;
      }
      
      if (!sourceId) {
        console.warn('⚠️  Board sem ID válido:', board);
        return;
      }
      
      const targetNodeIds = Array.isArray(board.board_next) ? board.board_next : [];
      
      console.log(`📍 Board ${board.board_tipo || board.board_entidade}: ${sourceId.substring(0, 20)}... → [${targetNodeIds.map((t: string) => t.substring(0, 12) + '...').join(', ')}]`);
      
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
        
        console.log(`  ✅ Edge: ${sourceId.substring(0, 20)}... → ${targetNodeId.substring(0, 12)}...`);
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
        const isSystemNode = node.data.isSystemNode;
        
        let connectionStatus = 'connected';
        
        if (isSystemNode) {
          // Nós de sistema: verde se conectado, vermelho se não
          const isInicio = node.data.boardType === 'orcamento_aprovado';
          const isFim = node.data.boardType === 'job_aprovado';
          
          if (isInicio) {
            connectionStatus = hasOutgoing ? 'system-connected' : 'system-disconnected';
          } else if (isFim) {
            connectionStatus = hasIncoming ? 'system-connected' : 'system-disconnected';
          }
        } else {
          // Nós regulares (entregas): amarelo se sem entrada OU sem saída
          if (!hasIncoming || !hasOutgoing) {
            connectionStatus = 'warning';
          }
        }
        
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
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
        }

        /* Handle de saída sempre visível */
        .react-flow__handle-right {
          opacity: 1 !important;
        }

        /* Handle de entrada invisível por padrão */
        .react-flow__handle-left {
          opacity: 0 !important;
        }

        /* Quando estiver conectando, mostrar os handles de destino */
        .react-flow__handle-connecting {
          opacity: 1 !important;
          transform: scale(1.5) !important;
          background: #a855f7 !important;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.8) !important;
        }

        /* Quando a conexão for válida, handle fica verde */
        .react-flow__handle-valid {
          opacity: 1 !important;
          transform: scale(2) !important;
          background: #22c55e !important;
          box-shadow: 0 0 12px rgba(34, 197, 94, 1) !important;
        }

        /* Hover no handle de saída */
        .react-flow__handle-right:hover {
          transform: scale(1.5) !important;
          box-shadow: 0 0 8px rgba(168, 85, 247, 0.8) !important;
        }
      `}</style>
    </div>
  );
}
