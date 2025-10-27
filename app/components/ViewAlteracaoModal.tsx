'use client';

import { X, Calendar, Package, Building, Paperclip } from 'lucide-react';

interface Alteracao {
  id: string;
  titulo: string;
  descricao: string;
  arquivo?: string;
  data: string;
  escopo: 'entrega' | 'servico';
  servico_id?: string;
  servico_nome?: string;
}

interface ViewAlteracaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  alteracao: Alteracao | null;
}

export default function ViewAlteracaoModal({ isOpen, onClose, alteracao }: ViewAlteracaoModalProps) {
  if (!isOpen || !alteracao) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-semibold text-white">Detalhes da Alteração</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Título */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">{alteracao.titulo}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(alteracao.data)}
              </span>
              {alteracao.escopo === 'entrega' ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                  <Building className="w-3 h-3" />
                  Entrega Completa
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                  <Package className="w-3 h-3" />
                  {alteracao.servico_nome || 'Serviço Específico'}
                </span>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Descrição</h4>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <p className="text-gray-300 whitespace-pre-wrap">{alteracao.descricao}</p>
            </div>
          </div>

          {/* Anexo */}
          {alteracao.arquivo && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Anexo</h4>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Paperclip className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-white font-medium">
                      {alteracao.arquivo.split('/').pop() || 'Arquivo anexado'}
                    </p>
                    <p className="text-xs text-gray-500">Clique para visualizar</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  Baixar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700 sticky bottom-0 bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
