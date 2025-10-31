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
  boardData?: any; // Estrutura: { demanda_id, demanda_status, total_entregas, entregas: [] }
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
  let systemBorderColor = 'border-gray-700'; // Padrão: cinza claro como entregas
  
  if (isSystemNode) {
    // Nós de sistema: cinza claro se conectado, vermelho se desconectado
    if (data.connectionStatus === 'system-disconnected') {
      systemBorderColor = 'border-red-500'; // Só fica vermelho se NÃO conectado
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
      <div className="flex flex-col items-center group">
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
              className="w-4 h-4 !bg-white !border-2 !border-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: -8 }}
            />
          )}
          
          {/* Handle de Saída - Apenas para Orçamento Aprovado (início) */}
          {isInicio && (
            <Handle
              type="source"
              position={Position.Right}
              className="w-4 h-4 !bg-white !border-2 !border-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ right: -8 }}
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
    <div className="flex flex-col items-center group">
      {/* Card do Node */}
      <div 
        className={`relative bg-gray-800 border-2 rounded-xl w-[90px] h-[90px] shadow-lg transition-all cursor-pointer ${borderStyle} hover:border-purple-400 hover:shadow-xl hover:scale-105`}
      >
        {/* Selo de Status - Canto superior direito */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusInfo.color} border-2 border-gray-900`} 
             title={data.status} />

        {/* Handle de Entrada (esquerda) - Invisível, aparece no hover do nó ou quando conectando */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-white !border-2 !border-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: -8 }}
        />
        
        {/* Handle de Saída (direita) - Invisível, aparece apenas no hover do nó */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-white !border-2 !border-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ right: -8 }}
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
    boardData: any;
  } | null>(null);
  
  if (!originalDataRef.current) {
    originalDataRef.current = {
      entregas: [...entregas],
      boardData: boardData, // Não fazer spread, é um objeto
    };
  }
  
  // Criar nodes para entregas
  const initialNodes = React.useMemo(() => {
    // 🔥 Extrair array de entregas do boardData (igual ServiceFlowCanvas faz com boardData)
    const entregasBoard = boardData?.entregas || [];
    
    if (entregasBoard.length === 0) {
      console.warn('⚠️ boardData.entregas está vazio!');
      return [];
    }
    
    console.group('🎨 [BOARD] Criando Nodes de Entregas');
    console.log('📊 Items no boardData.entregas:', entregasBoard.length);
    console.log('🎯 Entregas no props:', entregas.length);
    
    // Verificar tipos de boards
    const boardTypes = entregasBoard.reduce((acc: any, item: any) => {
      const board = item.board || item.boards;
      const tipo = board?.board_tipo || 'unknown';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
    console.log('📋 Tipos de boards:', boardTypes);
    
    // 🔥 ESTRATÉGIA CORRETA: Mapear CADA ITEM do boardData.entregas para um node (igual ServiceFlowCanvas)
    const allNodes: Node[] = entregasBoard.map((item: any, index: number) => {
      const board = item.board || item.boards;
      
      if (!board) {
        console.warn(`⚠️ Item ${index} sem board:`, item);
        return null;
      }
      
      const boardTipo = board.board_tipo;
      const nodeId = board.board_node_id;
      
      if (!nodeId) {
        console.warn(`⚠️ Board sem node_id:`, board);
        return null;
      }
      
      const position = {
        x: Number(board.board_position_x) || (100 + index * 200),
        y: Number(board.board_position_y) || 150
      };
      
      // 🔥 Criar nodeData baseado no tipo
      let nodeData: any = {
        id: nodeId, // ID único do board
        boardType: boardTipo,
        onEntregaClick,
      };
      
      // 🔥 TIPO 1: Nó de INÍCIO
      if (boardTipo === 'entrega-inicio') {
        nodeData = {
          ...nodeData,
          nome: item.entrega_titulo || 'Inicio',
          status: 'concluida',
          progresso_percentual: 100,
          isSystemNode: true,
          entrega_id: null,
        };
        console.log(`✅ Nó INÍCIO: ${nodeId.substring(0,12)}... pos=(${position.x},${position.y})`);
      }
      // 🔥 TIPO 2: Nó de FIM
      else if (boardTipo === 'entrega-fim') {
        nodeData = {
          ...nodeData,
          nome: item.entrega_titulo || 'Fim',
          status: 'planejada',
          progresso_percentual: 0,
          isSystemNode: true,
          entrega_id: null,
        };
        console.log(`✅ Nó FIM: ${nodeId.substring(0,12)}... pos=(${position.x},${position.y})`);
      }
      // 🔥 TIPO 3: Entrega NORMAL
      else if (boardTipo === 'entrega') {
        const entrega = entregas.find(e => e.id === item.entrega_id);
        
        if (entrega) {
          nodeData = {
            ...nodeData,
            ...entrega, // Spread todos os dados da entrega
            id: nodeId, // Manter nodeId como ID principal
            entrega_id: entrega.id, // Guardar ID real da entrega
            isSystemNode: false,
            isSelected: false,
          };
          console.log(`✅ Entrega "${entrega.nome}": ${nodeId.substring(0,12)}... pos=(${position.x},${position.y})`);
        } else {
          console.warn(`⚠️ Entrega não encontrada para entrega_id: ${item.entrega_id}`);
        }
      }
      
      return {
        id: nodeId,
        type: 'entregaNode',
        position,
        data: nodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    }).filter(Boolean) as Node[]; // Remove nulls
    
        
    // � DEBUG: Tabela de nodes criados
    
    // 🔥 2. CRIAR NODES DAS ENTREGAS (tipo 'entrega')
    console.log(`\n🔧 Processando ${entregas.length} entregas do props...`);
    entregas.forEach((entrega, index) => {
      console.log(`  [${index + 1}/${entregas.length}] Buscando board para entrega: ${entrega.id.substring(0,8)}... "${entrega.nome}"`);
      
      // Buscar board da entrega na resposta da API
      const entregaBoard = entregasBoard.find(
        (e: any) => e.entrega_id === entrega.id && e.board?.board_tipo === 'entrega'
      );
      
      if (!entregaBoard) {
        console.warn(`    ❌ Não encontrado no boardData`);
        return;
      }
      
      const board = entregaBoard?.board;
      
      // Se não tiver board, pula (não cria node sem board_node_id)
      if (!board || !board.board_node_id) {
        console.warn(`    ⚠️ Entrega sem board ou sem board_node_id:`, entrega.id, entrega.nome);
        return;
      }
      
      console.log(`    ✅ Board encontrado: ${board.board_node_id.substring(0,8)}...`);
      
      const position = {
        x: Number(board.board_position_x) || (canvasCenterX + (index * horizontalSpacing)),
        y: Number(board.board_position_y) || canvasCenterY
      };
      
      const nodeData = {
        ...entrega,
        onEntregaClick,
        isSelected: false,
        isSystemNode: false,
        boardNodeId: board.board_node_id, // ID do board para referência
      };
      
      allNodes.push({
        id: board.board_node_id, // 🔥 USAR board_node_id como ID do ReactFlow
        type: 'entregaNode',
        position,
        data: nodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });
    
    // 🔥 3. CRIAR NÓ DE FIM (entrega-fim)
    const nodeFim = entregasBoard.find((e: any) => {
      const board = e.boards || e.board;
      return board?.board_tipo === 'entrega-fim';
    });
    
    if (nodeFim) {
      const board = nodeFim.boards || nodeFim.board;
      
      if (board && board.board_node_id) {
        allNodes.push({
          id: board.board_node_id,
          type: 'entregaNode',
          position: { 
            x: Number(board.board_position_x) || 800, 
            y: Number(board.board_position_y) || 0
          },
          data: {
            id: board.board_node_id, // 🔥 Usar board_node_id como identificador
            nome: nodeFim.entrega_titulo || 'Fim',
            status: 'planejada',
            progresso_percentual: 0,
            isSystemNode: true,
            boardType: 'entrega-fim',
            connectionStatus: 'system-disconnected',
            entrega_id: null, // Nó de sistema não tem entrega real
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        console.log(`✅ Nó FIM criado: ${board.board_node_id.substring(0,12)}...`);
      } else {
        console.warn('⚠️ Nó FIM sem board_node_id:', nodeFim);
      }
    } else {
      console.warn('⚠️ Nó FIM não encontrado no boardData');
    }
    
    }).filter(Boolean) as Node[]; // Remove nulls
    
    // 🔍 DEBUG: Tabela de nodes criados
    console.log('✅ Total de nodes criados:', allNodes.length);
    console.log('📊 Resumo:');
    console.log('  - Nós de sistema (início/fim):', allNodes.filter(n => n.data.isSystemNode).length);
    console.log('  - Entregas normais:', allNodes.filter(n => !n.data.isSystemNode).length);
    console.log('  - Esperado: 7 nodes (2 sistema + 5 entregas)');
    
    if (allNodes.length > 0) {
      console.table(allNodes.map(n => ({
        id: n.id?.substring(0, 12) + '...',
        tipo: n.data.boardType || 'entrega',
        titulo: n.data.nome || '(sem nome)',
        isSystem: n.data.isSystemNode ? 'Sim' : 'Não',
        entrega_id: n.data.entrega_id ? n.data.entrega_id.substring(0, 12) + '...' : 'null',
        pos_x: n.position.x.toFixed(2),
        pos_y: n.position.y.toFixed(2),
      })));
    } else {
      console.warn('⚠️ NENHUM NODE FOI CRIADO!');
    }
    
    console.groupEnd();
    
    return allNodes;
  }, [entregas, boardData, onEntregaClick]);
  
  // Criar edges baseado em board_next
  const initialEdges = React.useMemo(() => {
    const edgesArray: Edge[] = [];
    const entregasBoard = boardData?.entregas || [];
    
    console.group('🔗 [BOARD] Criando Edges (Conexões)');
    console.log('📊 Total de items com boards:', entregasBoard.length);
    
    // Processar cada entrega para criar edges
    entregasBoard.forEach((item: any, index: number) => {
      const board = item.board || item.boards;
      
      if (!board || !board.board_next || board.board_next.length === 0) {
        return;
      }
      
      // sourceId é o board_node_id
      const sourceId = board.board_node_id;
      
      if (!sourceId) {
        console.warn('⚠️ Board sem board_node_id:', board);
        return;
      }
      
      const targetNodeIds = Array.isArray(board.board_next) ? board.board_next : [];
      
      targetNodeIds.forEach((targetNodeId: string) => {
        const edge = {
          id: `${sourceId}-${targetNodeId}`,
          source: sourceId,
          target: targetNodeId,
          type: 'default',
          animated: true,
          style: { stroke: '#ffffff', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#ffffff',
          },
        };
        edgesArray.push(edge);
        console.log(`  ↪️  Edge: ${sourceId.substring(0,8)}... → ${targetNodeId.substring(0,8)}...`);
      });
    });
    
    console.log('✅ Total de edges criados:', edgesArray.length);
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
          const isInicio = node.data.boardType === 'entrega-inicio';
          const isFim = node.data.boardType === 'entrega-fim';
          
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
        style: { stroke: '#ffffff', strokeWidth: 2 }, // Branco - 2px
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ffffff', // Seta branca
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

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Não fazer nada se for um nó de sistema
    if (node.data.isSystemNode) {
      return;
    }
    
    // Chamar callback de clique duplo na entrega
    // Para entregas normais, node.data.id é o ID real da entrega
    // Para nós de sistema, seria o board_node_id (mas já bloqueamos acima)
    if (onEntregaClick && node.data.id) {
      onEntregaClick(node.data.id);
    }
  }, [onEntregaClick]);

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

  const handleCancelFlow = useCallback(() => {
    if (onCancelFlow) {
      onCancelFlow();
      
      if (originalDataRef.current) {
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
      
      setHasChanges(false);
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
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        className="bg-gray-900 react-flow-dark"
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
        edgesUpdatable={true}
        edgesFocusable={true}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        connectOnClick={true}
        connectionRadius={50}
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
      
      /* Estilos customizados */
      <style jsx global>{`
        .react-flow__edge-path {
          cursor: pointer !important;
          stroke-width: 2 !important;
          stroke: #ffffff !important;
        }

        .react-flow__edge-path:hover {
          stroke: #a855f7 !important;
          stroke-width: 2.5 !important;
        }

        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #a855f7 !important;
          stroke-width: 2.5 !important;
        }

        /* Setas (markers) brancas */
        .react-flow__arrowhead,
        .react-flow__edge marker path {
          fill: #ffffff !important;
          stroke: #ffffff !important;
        }

        /* Setas roxas no hover */
        .react-flow__edge:hover marker path,
        .react-flow__edge.selected marker path {
          fill: #a855f7 !important;
          stroke: #a855f7 !important;
        }

        .react-flow__handle {
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
          transition: opacity 0.2s ease !important;
          background: #ffffff !important;
          border: 2px solid #111827 !important;
        }

        /* Fix: Forçar centralização do transform em todos os handles */
        .react-flow__handle-left,
        .react-flow__handle-right,
        .react-flow__handle-top,
        .react-flow__handle-bottom {
          opacity: 0 !important;
        }

        /* Quando estiver conectando, mostrar TODOS os handles de destino */
        .react-flow__handle-connecting {
          opacity: 1 !important;
          background: #ffffff !important;
          border-color: #a855f7 !important;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.9) !important;
          z-index: 10 !important;
        }

        /* Quando a conexão for válida, handle fica VERDE */
        .react-flow__handle-valid {
          opacity: 1 !important;
          background: #22c55e !important;
          border-color: #ffffff !important;
          box-shadow: 0 0 16px rgba(34, 197, 94, 1) !important;
          z-index: 10 !important;
        }

        /* Mostrar handles no hover do grupo (nó) */
        .group:hover .react-flow__handle {
          opacity: 1 !important;
        }

        /* Sem hover scale - apenas aparece */
        .react-flow__handle:hover {
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.8) !important;
        }
      `}</style>
    </div>
  );
}
