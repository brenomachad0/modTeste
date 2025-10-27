'use client';

import { X, Calendar, Clock, FileText, Download, Edit } from 'lucide-react';

interface VisualizarCronogramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cronograma: any;
  onExportar: () => void;
}

export default function VisualizarCronogramaModal({
  isOpen,
  onClose,
  cronograma,
  onExportar,
}: VisualizarCronogramaModalProps) {
  if (!isOpen || !cronograma) return null;

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calcularDuracao = () => {
    const inicio = new Date(cronograma.data_inicio);
    const fim = new Date(cronograma.data_fim);
    const diferencaHoras = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60));
    return diferencaHoras;
  };

  const duracao = calcularDuracao();
  const duracaoDias = Math.floor(duracao / 24);
  const duracaoHorasRestantes = duracao % 24;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              {cronograma.nome}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                cronograma.status === 'ativo'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : cronograma.status === 'concluido'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {cronograma.status === 'ativo' ? 'Ativo' : cronograma.status === 'concluido' ? 'Concluído' : 'Rascunho'}
              </span>
              <span className="text-xs text-gray-500">
                Criado em {formatarData(cronograma.data_criacao)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors ml-4"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Resumo do Período */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Período do Cronograma
            </h4>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Data/Hora de Início</p>
                  <p className="text-sm font-medium text-white">{formatarDataHora(cronograma.data_inicio)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Data/Hora Final</p>
                  <p className="text-sm font-medium text-white">{formatarDataHora(cronograma.data_fim)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Duração Total</p>
                  <p className="text-sm font-medium text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    {duracaoDias > 0 && `${duracaoDias}d `}
                    {duracaoHorasRestantes}h
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">({duracao} horas)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Parâmetros de Aprovação */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Parâmetros de Aprovação
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Prazo Aprovação Cliente</p>
                <p className="text-lg font-semibold text-white">
                  {cronograma.prazo_aprovacao_cliente} horas
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ≈ {Math.floor(cronograma.prazo_aprovacao_cliente / 24)}d {cronograma.prazo_aprovacao_cliente % 24}h por revisão
                </p>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Prazo Aprovação Supervisão</p>
                <p className="text-lg font-semibold text-white">
                  {cronograma.prazo_aprovacao_supervisao} horas
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ≈ {Math.floor(cronograma.prazo_aprovacao_supervisao / 24)}d {cronograma.prazo_aprovacao_supervisao % 24}h por revisão
                </p>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Informações do Projeto</h4>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Total de Entregas</p>
                  <p className="text-sm font-medium text-white">{cronograma.total_entregas} entregas planejadas</p>
                </div>
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Nota sobre o formato Gantt */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-xs text-blue-400">
              📊 <strong>Visualização Gantt:</strong> O diagrama completo com todas as entregas, serviços e dependências será gerado no documento PDF exportável, considerando os prazos de aprovação configurados e o cascateamento da produção.
            </p>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800/30">
          <button
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed"
            disabled
            title="Em breve"
          >
            <Edit className="w-4 h-4" />
            Editar Parâmetros
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={onExportar}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
