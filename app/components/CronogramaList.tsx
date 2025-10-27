'use client';

import { useState } from 'react';
import { Calendar, Plus, Eye, Download, FileText, Clock } from 'lucide-react';

// Tipos
interface Cronograma {
  id: string;
  nome: string;
  data_criacao: string;
  data_inicio: string;
  data_fim: string;
  prazo_aprovacao_cliente: number; // em dias
  prazo_aprovacao_supervisao: number; // em dias
  total_entregas: number;
  status: 'rascunho' | 'ativo' | 'concluido';
}

interface CronogramaListProps {
  cronogramas: Cronograma[];
  podeCriar: boolean; // Se todas as entregas estão planejadas
  onCriarCronograma: () => void;
  onVisualizarCronograma: (cronograma: Cronograma) => void;
  onExportarCronograma: (cronograma: Cronograma) => void;
}

export default function CronogramaList({
  cronogramas,
  podeCriar,
  onCriarCronograma,
  onVisualizarCronograma,
  onExportarCronograma,
}: CronogramaListProps) {
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

  const calcularDuracao = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diferencaHoras = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60));
    return diferencaHoras;
  };

  const formatarDuracao = (horas: number) => {
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    if (dias > 0) {
      return `${dias}d ${horasRestantes}h`;
    }
    return `${horasRestantes}h`;
  };

  if (cronogramas.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h4 className="text-white text-base font-medium mb-2">Nenhum cronograma criado</h4>
        <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
          {podeCriar 
            ? 'Crie um cronograma em formato Gantt para visualizar o fluxo completo de produção do projeto.'
            : 'Para criar um cronograma, você precisa planejar todas as entregas do projeto (definir serviços e tarefas).'}
        </p>
        <button
          onClick={onCriarCronograma}
          disabled={!podeCriar}
          className={`px-4 py-2 text-sm rounded-lg transition-all flex items-center gap-2 mx-auto ${
            podeCriar
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          Criar Primeiro Cronograma
        </button>
        {!podeCriar && (
          <p className="text-gray-500 text-xs mt-3">
            ⚠️ Planeje todas as entregas primeiro
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-white">Cronogramas Criados</h4>
          <p className="text-xs text-gray-400 mt-0.5">
            {cronogramas.length} cronograma{cronogramas.length !== 1 ? 's' : ''} disponível{cronogramas.length !== 1 ? 'eis' : ''}
          </p>
        </div>
        <button
          onClick={onCriarCronograma}
          disabled={!podeCriar}
          className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
            podeCriar
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Cronograma
        </button>
      </div>

      {/* Lista de cronogramas */}
      <div className="space-y-2">
        {cronogramas.map((cronograma) => {
          const duracao = calcularDuracao(cronograma.data_inicio, cronograma.data_fim);
          
          return (
            <div
              key={cronograma.id}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Nome e status */}
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <h5 className="text-sm font-medium text-white truncate">
                      {cronograma.nome}
                    </h5>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      cronograma.status === 'ativo'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : cronograma.status === 'concluido'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {cronograma.status === 'ativo' ? 'Ativo' : cronograma.status === 'concluido' ? 'Concluído' : 'Rascunho'}
                    </span>
                  </div>

                  {/* Informações do cronograma */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>Início: {formatarDataHora(cronograma.data_inicio)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>Fim: {formatarDataHora(cronograma.data_fim)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Duração: {formatarDuracao(duracao)} ({duracao}h)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      <span>{cronograma.total_entregas} entregas</span>
                    </div>
                  </div>

                  {/* Prazos de aprovação */}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                    <span>Aprovação Cliente: {cronograma.prazo_aprovacao_cliente}h</span>
                    <span>•</span>
                    <span>Aprovação Supervisão: {cronograma.prazo_aprovacao_supervisao}h</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onVisualizarCronograma(cronograma)}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    title="Visualizar cronograma"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onExportarCronograma(cronograma)}
                    className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    title="Exportar PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
