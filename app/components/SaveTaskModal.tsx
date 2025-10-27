'use client';

import { Save, Copy, Edit, X } from 'lucide-react';

interface SaveTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOnly: () => void;
  onSaveAsTemplate?: () => void;
  onUpdateTemplate?: () => void;
  hasTemplate?: boolean; // Se a tarefa já tem um template associado
}

export default function SaveTaskModal({ 
  isOpen, 
  onClose, 
  onSaveOnly, 
  onSaveAsTemplate,
  onUpdateTemplate,
  hasTemplate = false
}: SaveTaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Salvar Tarefa</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300 text-sm">
            Como deseja salvar esta tarefa?
          </p>

          {/* Opções */}
          <div className="space-y-3">
            {/* Salvar apenas a tarefa */}
            <button
              onClick={() => {
                onSaveOnly();
                onClose();
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 transition-colors flex items-center gap-3 text-left"
            >
              <Save className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Salvar apenas a tarefa</div>
                <div className="text-xs text-green-200">Atualizar apenas esta tarefa específica</div>
              </div>
            </button>

            {/* Atualizar template OU criar novo */}
            {hasTemplate && onUpdateTemplate ? (
              <button
                onClick={() => {
                  onUpdateTemplate();
                  onClose();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 transition-colors flex items-center gap-3 text-left"
              >
                <Edit className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Atualizar template</div>
                  <div className="text-xs text-blue-200">Atualizar o template associado a esta tarefa</div>
                </div>
              </button>
            ) : (
              onSaveAsTemplate && (
                <button
                  onClick={() => {
                    onSaveAsTemplate();
                    onClose();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 transition-colors flex items-center gap-3 text-left"
                >
                  <Copy className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Criar novo template</div>
                    <div className="text-xs text-blue-200">Salvar como template para reutilizar depois</div>
                  </div>
                </button>
              )
            )}

            {/* Cancelar */}
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-3 transition-colors flex items-center gap-3 text-left"
            >
              <X className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Cancelar</div>
                <div className="text-xs text-gray-300">Voltar para edição</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
