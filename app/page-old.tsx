'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardList from './components/DashboardList';
import ProjectDetail from './components/ProjectDetail';
import EntregaServicos from './components/EntregaServicos';
import PresetSelectionModal from './components/PresetSelectionModal';
import TaskViewModal from './components/TaskViewModal';
import TaskCompletionModal from './components/TaskCompletionModal';
// Importar dados mockados
import { mockProjetos, calcularEstatisticas, type Projeto as MockProjeto } from '../data/mockData';

// Tipos compartilhados - expandindo para incluir os novos status
type Status = 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida' | 'aguardando' | 'preparacao';

interface Tarefa {
  id: string;
  nome: string;
  status: Status;
  ordem?: number;
  setor: string;
  responsavel_usuario?: string | null;
  responsavel_nome?: string | null;
  responsavel_tipo?: string;
  prazo_horas: number;
  duracao_segundos?: number;
  mandrill_coins: number;
  instrucao?: string;
  templates?: any[];
  data_inicio?: string;
  data_fim?: string;
  tempo_execucao?: number;
  resultado?: any;
}

interface Servico {
  id: string;
  nome: string;
  status: Status;
  progresso_percentual: number;
  tarefas?: Tarefa[];
}

interface Entrega {
  id: string;
  nome: string;
  status: Status;
  progresso_percentual: number;
  briefing: string;
  texto_apoio?: string;
  valor_unitario?: number;
  quantidade_total?: number;
  indice_atual?: number;
  item_crm?: {
    icone?: string;
    titulo?: string;
    nome?: string;
    descricao?: string;
    tipo?: string;
    categoria?: string;
  };
  servicos?: Servico[];
}

interface Projeto {
  id: string;
  demanda_codigo: number;
  titulo?: string;
  anunciante_nome?: string;
  agencia_nome?: string;
  motivo_titulo?: string;
  vendedor_nome?: string;
  emissor_nome?: string;
  solicitante_nome?: string;
  demandante_nome?: string;
  demanda_tipo?: string;
  demanda_status?: string;
  motivo_tipo?: string;
  data_entrega_estimada?: string;
  prazo_data?: string;
  cliente_nome: string;
  motivo: string;
  status: Status;
  progresso_percentual: number;
  valor_total: number;
  prazo_dias: number;
  entregas?: Entrega[];
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados principais
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  // Estados dos modais
  const [showTaskViewModal, setShowTaskViewModal] = useState(false);
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);
  
  // Estados de navegação com proteção contra dupla navegação
  const [viewMode, setViewMode] = useState<'dashboard' | 'project' | 'delivery'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Projeto | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Entrega | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false); // Proteção contra dupla navegação

  // Funções de navegação com proteção contra dupla navegação
  const handleProjectClick = (project: Projeto) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    setSelectedProject(project);
    setIsSliding(true);
    setTimeout(() => {
      setViewMode('project');
      setIsNavigating(false);
    }, 50);
  };

  const handleBackToDashboard = () => {
    if (isNavigating) {
      console.log('🚫 Navegação já em andamento, ignorando chamada dupla (dashboard)');
      return;
    }
    
    console.log('🏠 Iniciando navegação de volta ao dashboard');
    setIsNavigating(true);
    setIsSliding(false);
    setTimeout(() => {
      console.log('✅ Finalizando navegação para dashboard');
      setViewMode('dashboard');
      setSelectedProject(null);
      setSelectedDelivery(null);
      setIsNavigating(false);
    }, 300);
  };

  const handleBackToProject = () => {
    if (isNavigating) {
      console.log('🚫 Navegação já em andamento, ignorando chamada dupla (project)');
      return;
    }
    
    console.log('📋 Iniciando navegação de volta ao projeto');
    setIsNavigating(true);
    setIsSliding(true);
    setTimeout(() => {
      console.log('✅ Finalizando navegação para projeto');
      setViewMode('project');
      setSelectedDelivery(null);
      setIsNavigating(false);
    }, 300);
  };

  const handleDeliveryClick = (delivery: Entrega) => {
    if (isNavigating) return;
    
    console.log(`📦 Navegando para entrega: ${delivery.nome}`);
    setIsNavigating(true);
    setSelectedDelivery(delivery);
    setIsSliding(true);
    setTimeout(() => {
      setViewMode('delivery');
      setIsNavigating(false);
    }, 50);
  };

  // Funções de tarefas
  const handleViewTask = (task: Tarefa) => {
    setSelectedTask(task);
    setShowTaskViewModal(true);
  };

  const handleCompleteTask = (task: Tarefa) => {
    setSelectedTask(task);
    setShowTaskCompletionModal(true);
  };

  // Carregamento de dados - usar dados mockados
  async function fetchProjetos() {
    try {
      setIsLoading(true);
      console.log('🎯 Carregando dados mockados para demonstração...');
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Usar dados mockados
      console.log('📦 Dados mockados carregados:', mockProjetos);
      console.log(`� Total de projetos mockados: ${mockProjetos.length}`);
      
      // Mapear dados mockados para formato esperado pelo frontend
      const projetosTransformados = mockProjetos.map((projeto) => ({
        id: projeto.id,
        demanda_codigo: parseInt(projeto.demanda_codigo.replace(/[A-Z]/g, '')), // Remove letras para ter só números
        titulo: projeto.motivo,
        anunciante_nome: projeto.cliente_nome,
        agencia_nome: 'Agência Digital',
        produto_nome: 'Produto',
        cliente_nome: projeto.cliente_nome,
        motivo: projeto.motivo,
        motivo_titulo: projeto.motivo,
        vendedor_nome: 'Vendedor Demo',
        emissor_nome: 'Emissor Demo',
        solicitante_nome: 'Solicitante Demo',
        demandante_nome: projeto.cliente_nome,
        demanda_tipo: 'Digital',
        demanda_status: projeto.status,
        motivo_tipo: 'Campanha',
        data_aprovacao_orcamento: '2025-09-01',
        orcamento_aprovado_at: '2025-09-01',
        valor_producao: projeto.valor_total * 0.8,
        valor_total_orcamento: projeto.valor_total,
        orcamento_id_crm: Math.random().toString(),
        orcamento_codigo_crm: `ORC${Math.floor(Math.random() * 1000)}`,
        servicos_locais_crm: [],
        servicos_remotos_crm: [],
        total_servicos_crm: projeto.entregas?.reduce((total, e) => total + (e.servicos?.length || 0), 0) || 0,
        status: projeto.status,
        progresso_percentual: projeto.progresso_percentual,
        valor_total: projeto.valor_total,
        prazo_dias: projeto.prazo_dias,
        prazo_data: projeto.prazo_data,
        data_entrega_estimada: projeto.prazo_data,
        entregas: projeto.entregas || []
      }));
      
      console.log('� Projetos transformados para frontend:', projetosTransformados);
      setProjetos(projetosTransformados);
      setLastSyncTime(new Date());
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados mockados:', error);
      setProjetos([]);
    } finally {
      console.log('🏁 Finalizando carregamento dos dados mockados...');
      setIsLoading(false);
      setIsSyncing(false);
    }
  }

  // Função para recarregar dados (chamada manual)
  const handleRefresh = async () => {
    setIsSyncing(true);
    await fetchProjetos();
  };

  useEffect(() => {
    fetchProjetos();
  }, []);

  // Detectar projeto via query parameter e selecioná-lo automaticamente
  useEffect(() => {
    const projetoId = searchParams.get('projeto');
    
    if (projetoId && projetos.length > 0 && !selectedProject) {
      console.log(`🔍 Detectado projeto na URL: ${projetoId}`);
      
      const projeto = projetos.find(p => p.id === projetoId);
      if (projeto) {
        console.log(`✅ Projeto encontrado, selecionando automaticamente:`, projeto.titulo);
        setSelectedProject(projeto);
        setViewMode('project');
        setIsSliding(true);
        
        // Limpar o query parameter da URL sem recarregar a página
        window.history.replaceState({}, '', '/');
      } else {
        console.warn(`⚠️ Projeto ${projetoId} não encontrado na lista`);
      }
    }
  }, [projetos, searchParams, selectedProject]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className={`container mx-auto px-6 ${viewMode === 'project' ? 'py-6' : ''}`}>
        {/* Container principal com overflow hidden para animação */}
        <div className="relative overflow-hidden min-h-screen">
          {/* Vista do Dashboard */}
          <div 
            className={`absolute top-0 left-0 w-full h-screen overflow-y-auto transition-transform duration-300 ease-in-out ${
              viewMode === 'project' || viewMode === 'delivery' ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            <DashboardList
              projetos={projetos}
              isLoading={isLoading}
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
              onProjectClick={handleProjectClick}
              onRefresh={handleRefresh}
            />
          </div>

          {/* Painel de Detalhes do Projeto */}
          {selectedProject && (
            <div 
              className={`absolute top-0 left-0 w-full h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-y-auto transition-transform duration-300 ease-in-out ${
                viewMode === 'project' && isSliding ? 'translate-x-0' : 
                viewMode === 'delivery' ? '-translate-x-full' : 'translate-x-full'
              }`}
            >
              <ProjectDetail
                project={selectedProject}
                router={router}
                editingServiceId={editingServiceId}
                onStartEditing={setEditingServiceId}
                onStopEditing={() => setEditingServiceId(null)}
                onViewTask={handleViewTask}
                onCompleteTask={handleCompleteTask}
                onBackToList={handleBackToDashboard}
                onDeliveryClick={handleDeliveryClick}
              />
            </div>
          )}

          {/* Painel de Serviços e Tarefas da Entrega */}
          {selectedDelivery && (
            <div 
              className={`absolute top-0 left-0 w-full h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-y-auto transition-transform duration-300 ease-in-out ${
                viewMode === 'delivery' && isSliding ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <EntregaServicos
                delivery={selectedDelivery}
                onBackToProject={handleBackToProject}
                onViewTask={handleViewTask}
                onCompleteTask={handleCompleteTask}
                editingServiceId={editingServiceId}
                onStartEditing={setEditingServiceId}
                onStopEditing={() => setEditingServiceId(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <TaskViewModal
        isOpen={showTaskViewModal}
        onClose={() => setShowTaskViewModal(false)}
        task={selectedTask}
      />

      <TaskCompletionModal
        isOpen={showTaskCompletionModal}
        onClose={() => setShowTaskCompletionModal(false)}
        task={selectedTask}
      />
    </div>
  );
}