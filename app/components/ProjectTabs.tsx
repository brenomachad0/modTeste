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
} from '@heroicons/react/24/outline';
import ProjectTimeline from './ProjectTimeline';
import ComprasList from './ComprasList';
import InsumosList from './InsumosList';
import { mandrillApi } from '@/lib/mandrill-api';

interface ProjectTabsProps {
  project: any;
  onAddInfo: () => void;
  onAddTeam?: () => void;
  onAddPurchase?: () => void;
  onAddFile?: () => void;
}

type TabType = 'informacoes' | 'equipe' | 'compras' | 'insumos';

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
                  {tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
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
        <div className="p-4">
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
        </div>
      )}
    </div>
  );
}
