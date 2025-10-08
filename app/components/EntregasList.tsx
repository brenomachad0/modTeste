'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Package, Cog } from 'lucide-react';
import EntregaCard from './EntregaCard';

interface EntregaData {
  id: string;
  nome: string;
  briefing: string;
  projeto_id: string;
  icone: string;
  status: 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';
  deadline?: string;
  valor_unitario?: number;
  progresso_percentual?: number;
  created_at: string;
  updated_at: string;
  // Estatísticas dos serviços (da nova API)
  total_servicos: number;
  servicos_concluidos: number;
  servicos_andamento: number;
  servicos_pendentes: number;
}

interface EntregasListProps {
  projectId?: string;
  title?: string;
  showAddButton?: boolean;
  compact?: boolean;
  onEntregaClick?: (entrega: EntregaData) => void;
}

const EntregasList: React.FC<EntregasListProps> = ({
  projectId,
  title = "Entregas",
  showAddButton = true,
  compact = false,
  onEntregaClick
}) => {
  const [entregas, setEntregas] = useState<EntregaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nome' | 'deadline' | 'status' | 'progresso'>('nome');

  // Carregar entregas da API
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadEntregas = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`📦 Carregando entregas para projeto: ${projectId}`);
        
        // Usar a nova API de resumo que retorna contagem de serviços
        const response = await fetch(`http://localhost:3001/api/entregas/supabase/${projectId}/resumo`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao carregar entregas');
        }

        if (data.success && data.data) {
          console.log(`✅ ${data.data.length} entregas carregadas`);
          setEntregas(data.data);
        } else {
          console.warn('⚠️ Nenhuma entrega encontrada');
          setEntregas([]);
        }
      } catch (err) {
        console.error('❌ Erro ao carregar entregas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setEntregas([]);
      } finally {
        setLoading(false);
      }
    };

    loadEntregas();
  }, [projectId]);

  // Filtrar e ordenar entregas
  const filteredEntregas = entregas
    .filter(entrega => {
      const matchesSearch = entrega.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entrega.briefing?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || entrega.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'nome':
          return a.nome.localeCompare(b.nome);
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'progresso':
          return (b.progresso_percentual || 0) - (a.progresso_percentual || 0);
        default:
          return 0;
      }
    });

  // Handlers
  const handleEntregaClick = (entrega: EntregaData) => {
    if (onEntregaClick) {
      onEntregaClick(entrega);
    } else {
      console.log('Clique na entrega:', entrega.nome);
      // TODO: Navegar para detalhes da entrega
    }
  };

  const handleAddEntrega = () => {
    // TODO: Implementar modal de criação de entrega
    console.log('Adicionar nova entrega');
  };

  // Estatísticas
  const stats = {
    total: entregas.length,
    planejadas: entregas.filter(e => e.status === 'planejada').length,
    executando: entregas.filter(e => e.status === 'executando').length,
    concluidas: entregas.filter(e => e.status === 'concluida').length,
    totalServicos: entregas.reduce((sum, e) => sum + e.total_servicos, 0),
    servicosConcluidos: entregas.reduce((sum, e) => sum + e.servicos_concluidos, 0)
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Erro ao carregar entregas</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">
            {stats.total} entregas • {stats.totalServicos} serviços • {stats.servicosConcluidos} serviços concluídos
          </p>
        </div>
        
        {showAddButton && (
          <button
            onClick={handleAddEntrega}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Entrega
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800 text-sm font-medium">Planejadas</div>
          <div className="text-yellow-900 text-2xl font-bold">{stats.planejadas}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800 text-sm font-medium">Executando</div>
          <div className="text-blue-900 text-2xl font-bold">{stats.executando}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800 text-sm font-medium">Concluídas</div>
          <div className="text-green-900 text-2xl font-bold">{stats.concluidas}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-purple-800 text-sm font-medium">Total Serviços</div>
          <div className="text-purple-900 text-2xl font-bold">{stats.totalServicos}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar entregas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtro por status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos os status</option>
          <option value="planejada">Planejada</option>
          <option value="proxima">Próxima</option>
          <option value="executando">Executando</option>
          <option value="pausada">Pausada</option>
          <option value="atrasada">Atrasada</option>
          <option value="concluida">Concluída</option>
        </select>

        {/* Ordenação */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="nome">Ordenar por Nome</option>
          <option value="deadline">Ordenar por Prazo</option>
          <option value="status">Ordenar por Status</option>
          <option value="progresso">Ordenar por Progresso</option>
        </select>
      </div>

      {/* Lista de entregas */}
      {filteredEntregas.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma entrega encontrada
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Tente ajustar os filtros ou busca'
              : 'Ainda não há entregas cadastradas para este projeto'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntregas.map(entrega => (
            <div 
              key={entrega.id} 
              className="group cursor-pointer"
              onClick={() => handleEntregaClick(entrega)}
            >
              <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {entrega.nome}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {entrega.briefing}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    entrega.status === 'concluida' ? 'bg-green-100 text-green-800' :
                    entrega.status === 'executando' ? 'bg-blue-100 text-blue-800' :
                    entrega.status === 'pausada' ? 'bg-yellow-100 text-yellow-800' :
                    entrega.status === 'atrasada' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entrega.status.charAt(0).toUpperCase() + entrega.status.slice(1)}
                  </span>
                </div>

                {/* Progresso */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progresso</span>
                    <span className="text-sm text-gray-500">{entrega.progresso_percentual || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${entrega.progresso_percentual || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Serviços */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Cog className="w-4 h-4" />
                    <span>{entrega.total_servicos} serviços</span>
                  </div>
                  <div className="text-green-600 font-medium">
                    {entrega.servicos_concluidos}/{entrega.total_servicos} concluídos
                  </div>
                </div>

                {/* Deadline (se existir) */}
                {entrega.deadline && (
                  <div className="mt-3 text-xs text-gray-500">
                    Prazo: {new Date(entrega.deadline).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntregasList;