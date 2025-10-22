/**
 * ProjetoEntregasList - Lista de entregas do projeto
 * Exibe entregas com briefing e serviços
 */

'use client';

import { useState } from 'react';
import { Package, Plus, Clock, FileText, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { Entrega } from '@/lib/types/entregas';

interface ProjetoEntregasListProps {
  entregas: Entrega[];
  onAddEntrega?: () => void;
  onEditEntrega?: (entrega: Entrega) => void;
  onDeleteEntrega?: (entregaId: string) => void;
}

export default function ProjetoEntregasList({ 
  entregas, 
  onAddEntrega,
  onEditEntrega,
  onDeleteEntrega 
}: ProjetoEntregasListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return '';
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getTipoProducao = (resposta: any) => {
    return resposta?.tipoProducao || 'Não especificado';
  };

  const getDuracao = (resposta: any) => {
    const duracao = resposta?.duracaoFilme;
    if (!duracao || !duracao.quantidade) return '';
    
    const unidade = duracao.unidade === 'segundos' ? 's' : 
                    duracao.unidade === 'minutos' ? 'min' : duracao.unidade;
    return `${duracao.quantidade}${unidade}`;
  };

  const getVeiculos = (resposta: any) => {
    const veiculos = resposta?.veiculosDivulgacao;
    if (!veiculos) return [];
    
    return Object.entries(veiculos)
      .filter(([_, ativo]) => ativo)
      .map(([nome]) => nome);
  };

  if (entregas.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-10 h-10 text-gray-600 mx-auto mb-2" />
        <h4 className="text-white text-sm font-medium mb-1">Nenhuma entrega cadastrada</h4>
        <p className="text-gray-400 text-xs mb-3">
          Adicione entregas ao projeto para organizar o trabalho
        </p>
        {onAddEntrega && (
          <button
            onClick={onAddEntrega}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
          >
            Adicionar Entrega
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Entregas ({entregas.length})
        </h4>
        {onAddEntrega && (
          <button
            onClick={onAddEntrega}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Nova Entrega
          </button>
        )}
      </div>

      {/* Lista de entregas */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {entregas.map((entrega) => {
          const isExpanded = expandedId === entrega.entrega_id;
          const tipoProducao = getTipoProducao(entrega.entrega_resposta);
          const duracao = getDuracao(entrega.entrega_resposta);
          const veiculos = getVeiculos(entrega.entrega_resposta);
          
          return (
            <div
              key={entrega.entrega_id}
              className="bg-gray-700/30 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              {/* Header da entrega */}
              <div
                className="p-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : entrega.entrega_id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded font-mono text-xs font-bold">
                      {entrega.entrega_letra}
                    </span>
                    <h5 className="text-sm font-medium text-white">
                      {entrega.entrega_titulo}
                    </h5>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onEditEntrega && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEntrega(entrega);
                        }}
                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                        title="Editar entrega"
                      >
                        <FileText className="w-3 h-3 text-gray-400 hover:text-white" />
                      </button>
                    )}
                    {onDeleteEntrega && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Tem certeza que deseja excluir esta entrega?')) {
                            onDeleteEntrega(entrega.entrega_id);
                          }
                        }}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        title="Excluir entrega"
                      >
                        <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Info rápida */}
                <div className="flex items-center gap-3 text-xs text-gray-400 ml-6">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    <span>{tipoProducao}</span>
                  </div>
                  {duracao && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{duracao}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalhes expandidos */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-600 mt-2 space-y-3">
                  {/* Descrição */}
                  {entrega.entrega_resposta?.description && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1 font-medium">Descrição:</p>
                      <p className="text-xs text-gray-300">
                        {entrega.entrega_resposta.description}
                      </p>
                    </div>
                  )}

                  {/* Veículos de divulgação */}
                  {veiculos.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1 font-medium">Veículos:</p>
                      <div className="flex flex-wrap gap-1">
                        {veiculos.map((veiculo) => (
                          <span
                            key={veiculo}
                            className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px]"
                          >
                            {veiculo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tom e Estilo */}
                  {(entrega.entrega_resposta?.tom || entrega.entrega_resposta?.estilo) && (
                    <div className="grid grid-cols-2 gap-2">
                      {entrega.entrega_resposta?.tom && entrega.entrega_resposta.tom.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 font-medium">Tom:</p>
                          <div className="flex flex-wrap gap-1">
                            {entrega.entrega_resposta.tom.map((t: string) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {entrega.entrega_resposta?.estilo && entrega.entrega_resposta.estilo.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 font-medium">Estilo:</p>
                          <div className="flex flex-wrap gap-1">
                            {entrega.entrega_resposta.estilo.map((e: string) => (
                              <span
                                key={e}
                                className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-[10px]"
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Idioma e Território */}
                  {(entrega.entrega_resposta?.idioma || entrega.entrega_resposta?.territorio) && (
                    <div className="grid grid-cols-2 gap-2">
                      {entrega.entrega_resposta?.idioma && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 font-medium">Idioma:</p>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px]">
                            {entrega.entrega_resposta.idioma}
                          </span>
                        </div>
                      )}
                      {entrega.entrega_resposta?.territorio && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 font-medium">Território:</p>
                          <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[10px]">
                            {entrega.entrega_resposta.territorio}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Datas */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
                    {entrega.entrega_created_at && (
                      <span>Criado: {formatarData(entrega.entrega_created_at)}</span>
                    )}
                    {entrega.entrega_updated_at && (
                      <span>Atualizado: {formatarData(entrega.entrega_updated_at)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total na parte inferior */}
      <div className="mt-4 pt-3 border-t border-gray-600">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Total de entregas</span>
          <span className="font-bold text-blue-400">{entregas.length}</span>
        </div>
      </div>
    </div>
  );
}
