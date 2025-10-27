'use client';

import React from 'react';
import { X, Clock, User, DollarSign, FileText } from 'lucide-react';

// Tipos
type Status = 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';

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

interface TaskViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Tarefa | null;
}

export default function TaskViewModal({ isOpen, onClose, task }: TaskViewModalProps) {
  if (!isOpen || !task) return null;

  // Função para formatar minutos no formato DD HH:mm:ss
  const formatarDuracao = (minutos: number): string => {
    const totalSegundos = Math.floor(minutos * 60);
    
    const dias = Math.floor(totalSegundos / 86400);
    const horas = Math.floor((totalSegundos % 86400) / 3600);
    const mins = Math.floor((totalSegundos % 3600) / 60);
    const segs = totalSegundos % 60;
    
    // Formato: DD HH:mm:ss
    return `${String(dias).padStart(2, '0')} ${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
  };

  const statusConfig = {
    planejada: { color: 'bg-gray-500', label: 'Planejada' },
    proxima: { color: 'bg-orange-500', label: 'Próxima' },
    executando: { color: 'bg-blue-500', label: 'Executando' },
    atrasada: { color: 'bg-red-500', label: 'Atrasada' },
    pausada: { color: 'bg-yellow-500', label: 'Pausada' },
    concluida: { color: 'bg-green-500', label: 'Concluída' }
  };

  const statusInfo = statusConfig[task.status] || statusConfig.planejada;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Detalhes da Tarefa</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Nome e Status */}
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white flex-1">{task.nome}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusInfo.color} text-white`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-400">Setor</span>
              </div>
              <p className="text-white">{task.setor}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-gray-400">Prazo</span>
              </div>
              <p className="text-white font-mono">{formatarDuracao(task.prazo_horas)}</p>
              <p className="text-gray-500 text-xs mt-0.5">(dias HH:mm:ss)</p>
            </div>
          </div>

          {/* Responsável */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-400">Responsável</span>
            </div>
            <p className="text-white">
              {task.responsavel_nome || 'Não atribuído'}
              {task.responsavel_tipo && (
                <span className="text-gray-400 text-sm ml-2">({task.responsavel_tipo})</span>
              )}
            </p>
          </div>

          {/* Valor */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-400">Mandrill Coins</span>
            </div>
            <p className="text-white">{task.mandrill_coins}</p>
          </div>

          {/* Instruções */}
          {task.instrucao && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-gray-400">Instruções</span>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
                <p className="text-gray-300 whitespace-pre-wrap">{task.instrucao}</p>
              </div>
            </div>
          )}

          {/* Tempos de execução */}
          {(task.data_inicio || task.data_fim || task.tempo_execucao) && (
            <div className="bg-gray-750 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Execução</h4>
              <div className="grid grid-cols-2 gap-4">
                {task.data_inicio && (
                  <div>
                    <span className="text-xs text-gray-400">Início</span>
                    <p className="text-white text-sm">
                      {new Date(task.data_inicio).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                {task.data_fim && (
                  <div>
                    <span className="text-xs text-gray-400">Fim</span>
                    <p className="text-white text-sm">
                      {new Date(task.data_fim).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                {task.tempo_execucao && (
                  <div>
                    <span className="text-xs text-gray-400">Tempo Executado</span>
                    <p className="text-white text-sm font-mono">
                      {formatarDuracao(task.tempo_execucao)}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      (dias HH:mm:ss)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resultado */}
          {task.resultado && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-gray-400">Resultado</span>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-gray-300 mb-4 whitespace-pre-wrap min-h-[200px] max-h-[400px] overflow-y-auto bg-gray-800 p-4 rounded">
                  {typeof task.resultado === 'string' ? task.resultado : JSON.stringify(task.resultado, null, 2)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}