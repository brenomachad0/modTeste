/**
 * ProjectTabs - Abas para organizar informações do projeto
 * Informações | Equipe | Compras | Insumos
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ChatBubbleLeftIcon,
  UsersIcon,
  ShoppingCartIcon,
  FolderIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import ProjectTimeline from './ProjectTimeline';
import ComprasList from './ComprasList';
import InsumosList from './InsumosList';
import CronogramaList from './CronogramaList';
import CriarCronogramaModal, { CronogramaFormData } from './CriarCronogramaModal';
import VisualizarCronogramaModal from './VisualizarCronogramaModal';
import { mandrillApi } from '@/lib/mandrill-api';

interface ProjectTabsProps {
  project: any;
  onAddInfo: () => void;
  onAddTeam?: () => void;
  onAddPurchase?: () => void;
  onAddFile?: () => void;
}

type TabType = 'informacoes' | 'equipe' | 'compras' | 'insumos' | 'cronograma';

export default function ProjectTabs({
  project,
  onAddInfo,
  onAddTeam,
  onAddPurchase,
  onAddFile,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('informacoes');
  const [expanded, setExpanded] = useState(true);
  const [compras, setCompras] = useState<any[]>([]);
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [loadingArquivos, setLoadingArquivos] = useState(false);
  
  // 🔥 Estados para Cronogramas (mock por enquanto)
  const [cronogramas, setCronogramas] = useState<any[]>([]);
  const [showCriarCronogramaModal, setShowCriarCronogramaModal] = useState(false);
  const [showVisualizarCronogramaModal, setShowVisualizarCronogramaModal] = useState(false);
  const [cronogramaSelecionado, setCronogramaSelecionado] = useState<any>(null);

  // Verificar se pode criar cronograma (todas as entregas planejadas)
  const podeCriarCronograma = () => {
    // TODO: Implementar lógica real verificando se todas as entregas têm serviços e tarefas planejadas
    return project.entregas && project.entregas.length > 0;
  };

  // Buscar compras quando a aba estiver ativa
  useEffect(() => {
    if (activeTab === 'compras' && project.id) {
      buscarCompras();
    }
  }, [activeTab, project.id]);

  // Buscar arquivos quando a aba estiver ativa
  useEffect(() => {
    if (activeTab === 'insumos' && project.id) {
      buscarArquivos();
    }
  }, [activeTab, project.id]);

  const buscarCompras = async () => {
    try {
      setLoadingCompras(true);
      const comprasData = await mandrillApi.getCompras(project.id);
      setCompras(comprasData);
    } catch (error) {
      console.error('❌ Erro ao buscar compras:', error);
      setCompras([]);
    } finally {
      setLoadingCompras(false);
    }
  };

  const buscarArquivos = async () => {
    try {
      setLoadingArquivos(true);
      const arquivosData = await mandrillApi.getArquivosDemanda(project.id);
      setArquivos(arquivosData);
    } catch (error) {
      console.error('❌ Erro ao buscar arquivos:', error);
      setArquivos([]);
    } finally {
      setLoadingArquivos(false);
    }
  };

  const handleCriarCronograma = (dados: CronogramaFormData) => {
    const novoCronograma = {
      id: `cronograma-${Date.now()}`,
      nome: dados.nome,
      data_criacao: new Date().toISOString(),
      data_inicio: `${dados.data_inicio}T${dados.hora_inicio}:00`,
      data_fim: `${dados.data_fim}T${dados.hora_fim}:00`,
      prazo_aprovacao_cliente: dados.prazo_aprovacao_cliente,
      prazo_aprovacao_supervisao: dados.prazo_aprovacao_supervisao,
      total_entregas: project.entregas?.length || 0,
      status: 'ativo' as const,
    };

    setCronogramas([...cronogramas, novoCronograma]);
    setShowCriarCronogramaModal(false);
    
    // TODO: Salvar no backend
    console.log('Cronograma criado:', novoCronograma);
  };
  
  // Filtrar informações da timeline
  const informacoes = (project.timeline || []).filter((item: any) => item.type === 'informacao' && item.visible);

  const tabs = [
    {
      id: 'informacoes' as TabType,
      label: 'Informações',
      icon: ChatBubbleLeftIcon,
      count: informacoes.length,
    },
    {
      id: 'equipe' as TabType,
      label: 'Equipe',
      icon: UsersIcon,
      count: 0,
    },
    {
      id: 'compras' as TabType,
      label: 'Compras',
      icon: ShoppingCartIcon,
      count: compras.length,
    },
    {
      id: 'insumos' as TabType,
      label: 'Insumos',
      icon: FolderIcon,
      count: arquivos.length,
    },
    {
      id: 'cronograma' as TabType,
      label: 'Cronograma',
      icon: CalendarIcon,
      count: 0, // TODO: contar cronogramas criados
    },
  ];

  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden">
      {/* Header com abas compactas + botão recolher */}
      <div className="border-b border-gray-700">
        <div className="flex items-center justify-between">
          {/* Abas */}
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-all ${
                    isActive
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Botão Recolher/Expandir */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            {expanded ? (
              <>
                <ChevronUpIcon className="w-4 h-4" />
                <span>Recolher</span>
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-4 h-4" />
                <span>Expandir</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo das abas */}
      {expanded && (
        <div className="p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
          {activeTab === 'informacoes' && (
            <ProjectTimeline
              timeline={project.timeline || []}
              onAddInfo={onAddInfo}
            />
          )}

          {activeTab === 'equipe' && (
            <div className="text-center py-8">
              <UsersIcon className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <h4 className="text-white text-sm font-medium mb-1">Equipe do Projeto</h4>
              <p className="text-gray-400 text-xs mb-3">
                Gerencie a equipe contratada
              </p>
              {onAddTeam && (
                <button
                  onClick={onAddTeam}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                >
                  Contratar Equipe
                </button>
              )}
            </div>
          )}

          {activeTab === 'compras' && (
            <div>
              {loadingCompras ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-xs">Carregando compras...</p>
                </div>
              ) : (
                <ComprasList
                  compras={compras}
                  onAddCompra={() => {
                    if (onAddPurchase) {
                      onAddPurchase();
                      // Recarregar compras após fechar modal (delay para dar tempo de salvar)
                      setTimeout(() => buscarCompras(), 1000);
                    }
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'insumos' && (
            <div>
              {loadingArquivos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-xs">Carregando arquivos...</p>
                </div>
              ) : (
                <InsumosList
                  insumos={arquivos}
                  onAddInsumo={() => {
                    if (onAddFile) {
                      onAddFile();
                      // Recarregar arquivos após fechar modal
                      setTimeout(() => buscarArquivos(), 1000);
                    }
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'cronograma' && (
            <CronogramaList
              cronogramas={cronogramas}
              podeCriar={podeCriarCronograma()}
              onCriarCronograma={() => setShowCriarCronogramaModal(true)}
              onVisualizarCronograma={(cronograma) => {
                setCronogramaSelecionado(cronograma);
                setShowVisualizarCronogramaModal(true);
              }}
              onExportarCronograma={(cronograma) => {
                // TODO: Implementar exportação PDF
                console.log('Exportar cronograma:', cronograma);
                alert('Exportação de PDF será implementada em breve!');
              }}
            />
          )}
        </div>
      )}

      {/* Modais de Cronograma */}
      <CriarCronogramaModal
        isOpen={showCriarCronogramaModal}
        onClose={() => setShowCriarCronogramaModal(false)}
        onCriar={handleCriarCronograma}
        totalEntregas={project.entregas?.length || 0}
      />

      <VisualizarCronogramaModal
        isOpen={showVisualizarCronogramaModal}
        onClose={() => {
          setShowVisualizarCronogramaModal(false);
          setCronogramaSelecionado(null);
        }}
        cronograma={cronogramaSelecionado}
        onExportar={() => {
          if (cronogramaSelecionado) {
            // TODO: Implementar exportação PDF
            console.log('Exportar cronograma:', cronogramaSelecionado);
            alert('Exportação de PDF será implementada em breve!');
          }
        }}
      />
      
      {/* Estilos customizados para scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        
        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937;
        }
      `}</style>
    </div>
  );
}
