'use client';

import { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, User, AlertCircle, FileText } from 'lucide-react';
import SaveTaskModal from './SaveTaskModal';

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

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tarefa: Tarefa) => void;
  onSaveAsTemplate?: (tarefa: Tarefa) => void;
  tarefa: Tarefa;
}

// Funções para converter prazo entre horas e formato DD HH:mm:ss
const formatPrazoToString = (horas: number): string => {
  const dias = Math.floor(horas / 24);
  const horasRestantes = Math.floor(horas % 24);
  const minutos = Math.floor((horas * 60) % 60);
  const segundos = Math.floor((horas * 3600) % 60);
  
  return `${dias.toString().padStart(2, '0')} ${horasRestantes.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
};

const parsePrazoString = (str: string): number => {
  // Remove espaços extras
  const cleaned = str.trim();
  
  // Tenta fazer parse do formato "DD HH:mm:ss"
  const match = cleaned.match(/^(\d+)\s+(\d+):(\d+):(\d+)$/);
  
  if (match) {
    const dias = parseInt(match[1]);
    const horas = parseInt(match[2]);
    const minutos = parseInt(match[3]);
    const segundos = parseInt(match[4]);
    
    // Converte tudo para horas
    return dias * 24 + horas + minutos / 60 + segundos / 3600;
  }
  
  // Se não conseguir fazer parse, retorna o valor original
  return 0;
};

export default function TaskEditModal({ isOpen, onClose, onSave, onSaveAsTemplate, tarefa }: TaskEditModalProps) {
  const [editedTask, setEditedTask] = useState<Tarefa>(tarefa);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    setEditedTask(tarefa);
  }, [tarefa]);

  if (!isOpen) return null;

  const handleSaveClick = () => {
    // Validação básica
    if (!editedTask.nome.trim() || !editedTask.setor.trim() || editedTask.prazo_horas <= 0) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    setShowSaveModal(true);
  };

  const handleSaveOnly = () => {
    onSave(editedTask);
    onClose();
  };

  const handleSaveAsTemplate = () => {
    if (onSaveAsTemplate) {
      onSaveAsTemplate(editedTask);
    } else {
      onSave(editedTask);
    }
    onClose();
  };

  const statusOptions = [
    { value: 'planejada', label: 'Planejada', color: 'text-blue-400' },
    { value: 'proxima', label: 'Próxima', color: 'text-cyan-400' },
    { value: 'executando', label: 'Executando', color: 'text-yellow-400' },
    { value: 'pausada', label: 'Pausada', color: 'text-orange-400' },
    { value: 'atrasada', label: 'Atrasada', color: 'text-red-400' },
    { value: 'concluida', label: 'Concluída', color: 'text-green-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Editar Tarefa
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Título da Tarefa */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título da Tarefa *
            </label>
            <input
              type="text"
              value={editedTask.nome}
              onChange={(e) => setEditedTask({ ...editedTask, nome: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Título da tarefa"
            />
          </div>

          {/* Instrução */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instrução
            </label>
            <textarea
              value={editedTask.instrucao || ''}
              onChange={(e) => setEditedTask({ ...editedTask, instrucao: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
              placeholder="Instruções detalhadas da tarefa"
            />
          </div>
          
          {/* Setor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Setor *
            </label>
            <input
              type="text"
              value={editedTask.setor}
              onChange={(e) => setEditedTask({ ...editedTask, setor: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Setor responsável"
            />
          </div>

          {/* Prazo - Dias e Horas:Minutos separados */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Prazo *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Dias</label>
                <input
                  type="number"
                  value={Math.floor(editedTask.prazo_horas / 24)}
                  onChange={(e) => {
                    const dias = parseInt(e.target.value) || 0;
                    const horasRestantes = editedTask.prazo_horas % 24;
                    setEditedTask({ ...editedTask, prazo_horas: dias * 24 + horasRestantes });
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Horas:Minutos</label>
                <input
                  type="text"
                  value={(() => {
                    const totalMinutes = Math.round((editedTask.prazo_horas % 24) * 60);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                  })()}
                  onChange={(e) => {
                    let value = e.target.value;
                    
                    // Remove tudo que não é dígito
                    const numbers = value.replace(/\D/g, '');
                    
                    // Formata com os dois pontos automaticamente
                    let formatted = '';
                    if (numbers.length > 0) {
                      formatted = numbers.substring(0, 2);
                      if (numbers.length > 2) {
                        formatted += ':' + numbers.substring(2, 4);
                      }
                    }
                    
                    // Parse para calcular
                    const parts = formatted.split(':');
                    const hours = parts[0] ? Math.min(parseInt(parts[0]) || 0, 23) : 0;
                    const minutes = parts[1] ? Math.min(parseInt(parts[1]) || 0, 59) : 0;
                    
                    const dias = Math.floor(editedTask.prazo_horas / 24);
                    const horasDecimal = hours + minutes / 60;
                    setEditedTask({ ...editedTask, prazo_horas: dias * 24 + horasDecimal });
                  }}
                  onKeyDown={(e) => {
                    // Permite navegação e edição
                    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
                      return;
                    }
                    // Permite apenas números
                    if (!/^\d$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  placeholder="00:00"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total: {Math.floor(editedTask.prazo_horas)}h {Math.round((editedTask.prazo_horas % 1) * 60)}min
              ({Math.floor(editedTask.prazo_horas / 24)}d {Math.floor(editedTask.prazo_horas % 24)}h {Math.round((editedTask.prazo_horas % 1) * 60)}min)
            </p>
          </div>

          {/* Aviso */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300">
              As alterações serão aplicadas quando você salvar o modo de edição.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!editedTask.nome.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Modal de confirmação de salvamento */}
      <SaveTaskModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaveOnly={handleSaveOnly}
        onSaveAsTemplate={handleSaveAsTemplate}
      />
    </div>
  );
}
