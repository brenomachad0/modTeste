'use client';

import React, { useState, useEffect } from 'react';
import { mockProjetos, calcularEstatisticas, type Projeto, type Entrega, type Tarefa } from '../../data/mockData';
import { 
  ChevronRight, RefreshCw, TrendingUp, AlertCircle, CheckCircle, Clock, 
  DollarSign, Package, Users, Briefcase, Calendar, ArrowRight
} from 'lucide-react';

// Componente de Card de Estatística
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="text-blue-500 opacity-75">
        {icon}
      </div>
    </div>
  </div>
);

// Componente de Card de Projeto
const ProjectCard: React.FC<{
  project: Projeto;
  onClick: (project: Projeto) => void;
}> = ({ project, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'executando': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'atrasada': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'pausada': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'preparacao': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluida': return 'Concluída';
      case 'executando': return 'Executando';
      case 'atrasada': return 'Atrasada';
      case 'pausada': return 'Pausada';
      case 'preparacao': return 'Preparação';
      case 'aguardando': return 'Aguardando';
      default: return 'Indefinido';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div 
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 hover:bg-gray-750 transition-all cursor-pointer group"
      onClick={() => onClick(project)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
              {project.demanda_codigo}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded border ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {project.motivo}
          </h3>
          <p className="text-gray-400 text-sm mt-1">{project.cliente_nome}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
      </div>

      {/* Progresso */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">Progresso</span>
          <span className="text-sm font-medium text-white">{project.progresso_percentual}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${project.progresso_percentual}%` }}
          />
        </div>
      </div>

      {/* Informações extras */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <DollarSign className="w-4 h-4" />
          <span>{formatCurrency(project.valor_total)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(project.prazo_data)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Package className="w-4 h-4" />
          <span>{project.entregas?.length || 0} entregas</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{project.prazo_dias} dias</span>
        </div>
      </div>
    </div>
  );
};

// Componente principal do Dashboard Mockado
const MockDashboard: React.FC = () => {
  const [projetos] = useState<Projeto[]>(mockProjetos);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedProject, setSelectedProject] = useState<Projeto | null>(null);

  // Simular carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setLastSync(new Date());
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Calcular estatísticas
  const stats = calcularEstatisticas(projetos);

  const handleProjectClick = (project: Projeto) => {
    setSelectedProject(project);
    console.log('Projeto selecionado:', project);
    // Aqui você pode navegar para a página de detalhes ou abrir um modal
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastSync(new Date());
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="container mx-auto">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="h-8 bg-gray-700 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-48"></div>
              </div>
              <div className="h-10 bg-gray-700 rounded w-32"></div>
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                </div>
              ))}
            </div>

            {/* Projects skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex gap-2 mb-2">
                        <div className="h-5 bg-gray-700 rounded w-16"></div>
                        <div className="h-5 bg-gray-700 rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-32"></div>
                    </div>
                    <div className="h-5 w-5 bg-gray-700 rounded"></div>
                  </div>
                  <div className="mb-4">
                    <div className="h-2 bg-gray-700 rounded w-full"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="h-4 bg-gray-700 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Dashboard de Projetos
            </h1>
            <p className="text-gray-400">
              Dados de demonstração • {lastSync && `Última atualização: ${lastSync.toLocaleTimeString('pt-BR')}`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Projetos"
            value={stats.total}
            icon={<Briefcase className="w-6 h-6" />}
            color="hover:border-blue-500/50"
          />
          <StatCard
            title="Em Execução"
            value={stats.executando}
            icon={<TrendingUp className="w-6 h-6" />}
            color="hover:border-blue-500/50"
            subtitle={`${Math.round((stats.executando / stats.total) * 100)}% do total`}
          />
          <StatCard
            title="Concluídos"
            value={stats.concluidos}
            icon={<CheckCircle className="w-6 h-6" />}
            color="hover:border-green-500/50"
            subtitle={`${stats.percentualConclusao}% de conclusão`}
          />
          <StatCard
            title="Valor Total"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(stats.valorTotal)}
            icon={<DollarSign className="w-6 h-6" />}
            color="hover:border-purple-500/50"
            subtitle={`${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(stats.valorConcluido)} concluído`}
          />
        </div>

        {/* Alerta de demonstração */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-blue-400 font-medium">Dados de Demonstração</h3>
              <p className="text-blue-300/80 text-sm">
                Estes são dados mockados para demonstração do sistema. Inclui projetos, entregas, serviços e tarefas com diferentes status e cronômetros em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Projetos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projetos.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleProjectClick}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Sistema de Gestão de Projetos • Dados Mockados para Demonstração</p>
          <p className="mt-2">
            {stats.total} projetos • {stats.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em valor total
          </p>
        </div>
      </div>
    </div>
  );
};

export default MockDashboard;