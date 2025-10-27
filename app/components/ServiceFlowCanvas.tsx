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
  boardData?: any[]; // Dados do board com posições salvas
  onServicesUpdate?: (servicos: Servico[]) => void;
  onServiceClick?: (serviceId: string) => void;
  onServiceDelete?: (serviceId: string) => void;
  onAddService?: () => void;
  onSaveFlow?: (nodes: Node[], edges: Edge[]) => void;
  onCancelFlow?: () => void; // 🔥 NOVO: Cancelar alterações
  selectedServiceId?: string | null; // 🔥 NOVO: ID do serviço selecionado
  onServiceAddedRef?: React.RefObject<(() => void) | null>; // 🔥 NOVO: Ref para ativar hasChanges ao adicionar
  isSaving?: boolean; // ✅ 1. Estado de salvamento
}

// Componente customizado para os nodes (cards de serviço)
const ServiceNode = ({ data, selected }: any) => {
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

  const canDelete = ['planejada', 'proxima'].includes(data.status) && !data.isSystemNode;
  const isSystemNode = data.isSystemNode || data.boardType === 'orcamento' || data.boardType === 'entrega';
  
  // 🔥 NOVO: Verificar se está selecionado
  const isSelected = data.isSelected || selected;

  // 🔥 Renderização especial para nós de sistema (Orçamento e Entrega)
  if (isSystemNode) {
    // 🎨 Formato "C" para Início (circular à esquerda) e "D" para Fim (circular à direita)
    const isInicio = data.boardType === 'orcamento';
    const isFim = data.boardType === 'entrega';
    
    // ✅ 4. Outline baseado em conexão para nós de sistema
    let borderColor = 'border-purple-500';
    let ringColor = 'ring-purple-400/50';
    
    if (data.connectionStatus === 'system-connected') {
      borderColor = 'border-green-500';
      ringColor = 'ring-green-400/50';
    } else if (data.connectionStatus === 'system-disconnected') {
      borderColor = 'border-red-500';
      ringColor = 'ring-red-400/50';
    }
    
    return (
      <div 
        className={`bg-gray-800 border-2 p-4 min-w-[180px] max-w-[180px] shadow-xl transition-all relative ${
          isSelected ? `${borderColor} ring-4 ${ringColor}` : borderColor
        }`}
        style={{
          borderRadius: isInicio 
            ? '9999px 1rem 1rem 9999px' // C: circular esquerda, rounded direita
            : isFim 
            ? '1rem 9999px 9999px 1rem' // D: rounded esquerda, circular direita
            : '0.5rem'
        }}
      >
        {/* 🔥 SEMPRE adicionar AMBOS handles (para permitir conexões), mas só mostrar o necessário */}
        
        {/* Handle de Entrada (esquerda) - SEMPRE presente, visível apenas na Entrega */}
        <Handle
          type="target"
          position={Position.Left}
          className={`w-4 h-4 !bg-green-500 !border-2 !border-white ${data.boardType !== 'entrega' ? '!opacity-0 pointer-events-none' : ''}`}
          style={{ left: -8 }}
        />
        
        {/* Handle de Saída (direita) - SEMPRE presente, visível apenas no Orçamento */}
        <Handle
          type="source"
          position={Position.Right}
          className={`w-4 h-4 !bg-blue-500 !border-2 !border-white ${data.boardType !== 'orcamento' ? '!opacity-0 pointer-events-none' : ''}`}
          style={{ right: -8 }}
        />

        {/* Título Centralizado */}
        <div className="text-center">
          <h3 className="font-semibold text-white text-base">{data.nome}</h3>
        </div>
      </div>
    );
  }

  // ✅ 2. Outline amarelo se sem conexões
  let borderColor = 'border-gray-700';
  let ringColor = 'ring-purple-500/50';
  let hoverColor = 'hover:border-purple-500';
  
  if (data.connectionStatus === 'warning') {
    borderColor = 'border-yellow-500';
    ringColor = 'ring-yellow-500/50';
    hoverColor = 'hover:border-yellow-400';
  } else if (isSelected) {
    borderColor = 'border-purple-500';
  }

  return (
    <div 
      className={`bg-gray-800 border-2 rounded-lg p-4 min-w-[280px] shadow-xl transition-all cursor-pointer relative ${
        isSelected 
          ? `${borderColor} ring-4 ${ringColor} shadow-2xl shadow-purple-500/30` 
          : `${borderColor} ${hoverColor} hover:shadow-2xl`
      }`}
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

      {/* Header com título */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white text-lg flex-1">{data.nome}</h3>
      </div>

      {/* Stats das tarefas + Status na mesma linha */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {tarefasTotal} tarefas
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {tarefasConcluidas} OK
          </span>
        </div>
        
        {/* Tag de Status - Agora na mesma linha, à direita */}
        <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(data.status)}`}>
          {data.status === 'executando' ? 'Em Execução' : 
           data.status === 'concluida' ? 'Concluído' : 
           data.status === 'pausada' ? 'Pausado' : 
           data.status === 'proxima' ? 'Aguardando' : 'Planejado'}
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

// Componente interno que usa useReactFlow
function FlowContent({ 
  initialLoad 
}: { 
  initialLoad: boolean 
}) {
  const { fitView } = useReactFlow();
  
  // Chamar fitView apenas na primeira carga
  React.useEffect(() => {
    if (initialLoad) {
      // Dar tempo para os nodes renderizarem
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 100);
    }
  }, [initialLoad, fitView]);
  
  return null;
}

export default function ServiceFlowCanvas({
  servicos,
  boardData = [],
  onServicesUpdate,
  onServiceClick,
  onServiceDelete,
  onAddService,
  onSaveFlow,
  onCancelFlow,
  selectedServiceId = null,
  onServiceAddedRef,
  isSaving = false, // ✅ 1. Estado de salvamento
}: ServiceFlowCanvasProps) {
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [edgeToDelete, setEdgeToDelete] = useState<Edge | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // 🎯 SOLUÇÃO LIMPA: Guardar versão original dos dados quando componente monta
  const originalDataRef = React.useRef<{
    servicos: Servico[];
    boardData: any[];
  } | null>(null);
  
  // Inicializar referência na primeira montagem
  if (!originalDataRef.current) {
    originalDataRef.current = {
      servicos: [...servicos],
      boardData: [...boardData],
    };
  }
  
  // 🔥 Conectar ref para permitir que o pai ative hasChanges ao adicionar serviço
  React.useEffect(() => {
    if (onServiceAddedRef) {
      onServiceAddedRef.current = () => {
        console.log('🔔 Serviço adicionado - ativando modo edição');
        setHasChanges(true);
      };
    }
    
    return () => {
      if (onServiceAddedRef) {
        onServiceAddedRef.current = null;
      }
    };
  }, [onServiceAddedRef]);
  
  // 🔥 SOLUÇÃO LIMPA: Criar nodes apenas UMA VEZ na montagem ou quando cancelar
  const initialNodes = React.useMemo(() => {
    // Usar dados originais sempre (eles não mudam durante edição)
    const servicosParaUsar = servicos;
    const boardDataParaUsar = boardData;
    
    // Se não temos serviços ainda, retornar array vazio
    if (servicosParaUsar.length === 0) {
      return [];
    }
    
    // 🔍 LOG ANÁLISE: Criação de nodes
    console.group('🎨 [BOARD] Criando Nodes do ReactFlow');
    console.log('📊 Boards disponíveis:', boardDataParaUsar.length);
    console.log('🔧 Serviços a processar:', servicosParaUsar.length);
    
    // 🔥 NOVO: Calcular posição central do canvas para serviços novos sem board
    const canvasCenterX = 500;
    const canvasCenterY = 200;
    
    // 🔍 DEBUG: Verificar tipos de boards recebidos
    const boardTypes = boardDataParaUsar.reduce((acc: any, b: any) => {
      const tipo = b.board_tipo || b.board_entidade; // 🔥 Usar board_tipo como prioridade
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
    console.log('📋 Tipos de boards (por board_tipo):', boardTypes);
    console.table(boardDataParaUsar.map((b: any) => ({
      tipo: b.board_tipo || b.board_entidade,
      entidade: b.board_entidade,
      titulo: b.proj_servico_titulo || '(sem titulo)',
      entidade_id: b.board_entidade_id?.substring(0, 12) + '...',
      node_id: b.board_node_id?.substring(0, 12) + '...',
      pos_x: b.board_position_x,
      pos_y: b.board_position_y,
    })));
    
    // 🔥 Primeiro: Criar nodes para todos os boards existentes
    const allNodes: Node[] = boardDataParaUsar.map((board: any, index: number) => {
      const position = {
        x: Number(board.board_position_x) || (250 + index * 350), 
        y: Number(board.board_position_y) || 150
      };
      
      // 🔥 SOLUÇÃO: Garantir nodeId único e consistente
      // Para boards de sistema, usar tipo como ID se não houver board_node_id
      const boardTipo = board.board_tipo || board.board_entidade;
      let nodeId = board.board_node_id;
      
      if (!nodeId) {
        // Se não tem board_node_id, criar baseado no tipo
        if (boardTipo === 'orcamento') {
          nodeId = 'orcamento-inicio';
        } else if (boardTipo === 'entrega') {
          nodeId = 'entrega-fim';
        } else {
          // Para serviços, usar board_entidade_id ou fallback
          nodeId = board.board_entidade_id || `node-${index}`;
        }
        console.warn(`⚠️  Board sem node_id, usando: ${nodeId}`);
      }
      
      // Determinar os dados baseado no tipo de entidade
      let nodeData: any = {
        id: nodeId,
        boardType: boardTipo, // 🔥 CORRIGIDO: Usar board_tipo
        onServiceClick: () => {},
        onDelete: onServiceDelete,
      };
      
      if (boardTipo === 'servico') {
        // Buscar dados do serviço
        const servico = servicosParaUsar.find(s => s.id === board.board_entidade_id);
        if (servico) {
          nodeData = {
          ...nodeData,
          ...servico,
          onServiceClick,
          isSelected: false, // Será atualizado por useEffect
        };
          console.log(`✅ Serviço ${servico.nome}: node_id=${nodeId.substring(0,12)}... pos=(${position.x},${position.y})`);
        } else {
          console.warn(`⚠️  Serviço não encontrado para board_entidade_id: ${board.board_entidade_id}`);
        }
      } else if (boardTipo === 'orcamento') {
        nodeData = {
          ...nodeData,
          nome: 'Início',
          status: 'concluida',
          isSystemNode: true,
        };
        console.log(`✅ Início (Orçamento): node_id=${nodeId.substring(0,12)}... pos=(${position.x},${position.y})`);
      } else if (boardTipo === 'entrega') {
        nodeData = {
          ...nodeData,
          nome: 'Fim',
          status: 'planejada',
          isSystemNode: true,
        };
        console.log(`✅ Fim (Entrega): node_id=${nodeId.substring(0,12)}... pos=(${position.x},${position.y})`);
      }
      
      // Configurar handles baseado no tipo
      const nodeConfig: any = {
        id: nodeId,
        type: 'serviceNode',
        position,
        data: nodeData,
        // 🔥 TODOS os nodes têm ambas posições de handle (para conexões)
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
      
      return nodeConfig;
    });
    
    // 🔥 NOVO: Adicionar nodes para serviços sem board (temporários)
    // ✅ IMPORTANTE: Excluir boards de sistema (orcamento/entrega) - eles não são serviços!
    const servicosSemBoard = servicosParaUsar.filter(servico => 
      !boardDataParaUsar.some(board => 
        board.board_entidade_id === servico.id && 
        (board.board_tipo === 'servico' || board.board_entidade === 'servico')
      )
    );
    
    if (servicosSemBoard.length > 0) {
      console.log(`🆕 Criando nodes temporários para ${servicosSemBoard.length} serviço(s) sem board`);
      
      servicosSemBoard.forEach((servico, index) => {
        const tempNodeId = servico.id;
        
        // Validação: garantir que tempNodeId existe e é string
        if (!tempNodeId || typeof tempNodeId !== 'string') {
          console.warn('⚠️  Serviço sem ID válido, pulando...', servico);
          return;
        }
        
        // Posição: centro do canvas com offset vertical para cada novo
        const position = {
          x: canvasCenterX,
          y: canvasCenterY + (index * 120), // Espaçamento vertical
        };
        
        const nodeData = {
          ...servico,
          boardType: 'servico',
          onServiceClick,
          onDelete: onServiceDelete,
          isSelected: false, // Será atualizado por useEffect
        };
        
        allNodes.push({
          id: tempNodeId,
          type: 'serviceNode',
          position,
          data: nodeData,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        
        const displayId = tempNodeId.length > 12 ? tempNodeId.substring(0, 12) + '...' : tempNodeId;
        console.log(`✅ Node temporário criado: ${servico.nome} (${displayId})`);
      });
    }
    
    console.groupEnd();

    return allNodes;
  }, [servicos, boardData, onServiceClick, onServiceDelete]); // Recriar apenas quando dados externos mudarem (SEM selectedServiceId)
  
  // 🔥 SOLUÇÃO LIMPA: Criar edges apenas UMA VEZ na montagem
  const initialEdges = React.useMemo(() => {
    const boardDataParaUsar = boardData;
    
    console.group('🔗 [BOARD] Criando Edges (Conexões)');
    const edgesArray: Edge[] = [];
    
    boardDataParaUsar.forEach((board: any) => {
      if (!board.board_next || board.board_next.length === 0) {
        console.log(`⏭️  Board ${board.board_tipo} sem board_next, pulando...`);
        return;
      }
      
      const sourceId = board.board_node_id;
      
      if (!sourceId) {
        console.warn('⚠️  Board sem board_node_id:', board);
        return;
      }
      
      // 🔥 NOVO: board_next agora é um ARRAY (não mais CSV string!)
      const targetNodeIds = Array.isArray(board.board_next) 
        ? board.board_next 
        : [];
      
      console.log(`📍 Board ${board.board_tipo}: ${sourceId.substring(0, 12)}... → [${targetNodeIds.map((t: string) => t.substring(0, 12) + '...').join(', ')}]`);
      
      targetNodeIds.forEach((targetNodeId: string) => {
        edgesArray.push({
          id: `${sourceId}-${targetNodeId}`,
          source: sourceId,
          target: targetNodeId,
          type: 'default',
          animated: true, // ✅ 3. Edges animados
          style: { stroke: '#ffffff', strokeWidth: 3 }, // ✅ Branco
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#ffffff', // ✅ Branco
          },
        });
        
        console.log(`  ✅ Edge: ${sourceId.substring(0, 12)}... → ${targetNodeId.substring(0, 12)}...`);
      });
    });
    
    console.log(`\n✅ Total de edges criadas: ${edgesArray.length}`);
    console.groupEnd();
    
    return edgesArray;
  }, [boardData]); // Recriar apenas quando dados externos mudarem

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // 🔥 SOLUÇÃO LIMPA: Atualizar APENAS isSelected sem recriar nodes
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: selectedServiceId === node.data.id,
        },
      }))
    );
  }, [selectedServiceId, setNodes]);
  
  // ✅ 2 e 4: Atualizar status de conexões dos nodes
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const hasIncoming = edges.some(e => e.target === node.id);
        const hasOutgoing = edges.some(e => e.source === node.id);
        const isSystemNode = node.data.boardType === 'orcamento' || node.data.boardType === 'entrega';
        
        let connectionStatus = 'connected';
        
        if (isSystemNode) {
          // 4. Nós de sistema: verde se conectado, vermelho se não
          const isInicio = node.data.boardType === 'orcamento';
          const isFim = node.data.boardType === 'entrega';
          
          if (isInicio) {
            connectionStatus = hasOutgoing ? 'system-connected' : 'system-disconnected';
          } else if (isFim) {
            connectionStatus = hasIncoming ? 'system-connected' : 'system-disconnected';
          }
        } else {
          // 2. Nós regulares (serviços): amarelo se sem entrada OU sem saída
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

  // Marcar que não é mais carregamento inicial após primeiro render
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // ❌ REMOVIDO: useEffect que recriava nodes e perdia posições
  // Agora os nodes só são criados uma vez no initialNodes
  
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
        animated: true, // ✅ 3. Edges animados
        style: { stroke: '#ffffff', strokeWidth: 3 }, // ✅ Branco
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#ffffff', // ✅ Branco
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
      console.log('✅ Fluxo salvo');
    }
  }, [nodes, edges, onSaveFlow]);

  const handleCancelFlow = useCallback(() => {
    if (onCancelFlow) {
      onCancelFlow();
      
      // 🔥 Restaurar nodes e edges do estado original
      if (originalDataRef.current) {
        console.log('🔄 Restaurando dados originais');
        // Forçar recriação resetando para initialNodes/initialEdges
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
      
      setHasChanges(false);
      console.log('❌ Edição cancelada');
    }
  }, [onCancelFlow, initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-[600px] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden relative">
      {/* ✅ 1. Overlay de salvamento DENTRO do canvas */}
      {isSaving && (
        <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
            <h3 className="text-white text-lg font-semibold mb-2">Salvando fluxo</h3>
            <p className="text-gray-400 text-sm">Processando alterações...</p>
          </div>
        </div>
      )}
      
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
            onClick={handleCancelFlow}
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
