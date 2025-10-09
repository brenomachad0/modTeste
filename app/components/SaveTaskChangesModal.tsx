'use client';

import { Save, Copy, X } from 'lucide-react';

interface SaveTaskChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCurrentService: () => void;
  onSaveAsDefault: () => void;
}

export default function SaveTaskChangesModal({ 
  isOpen, 
  onClose, 
  onSaveCurrentService, 
  onSaveAsDefault 
}: SaveTaskChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Salvar Alterações</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300 text-sm">
            Você realizou alterações nas tarefas deste serviço. Como deseja salvar?
          </p>

          {/* Opções */}
          <div className="space-y-3">
            {/* Salvar apenas neste serviço */}
            <button
              onClick={() => {
                onSaveCurrentService();
                onClose();
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 transition-colors flex items-center gap-3 text-left"
            >
              <Save className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Salvar apenas neste serviço</div>
                <div className="text-xs text-green-200">As alterações serão aplicadas somente a este serviço</div>
              </div>
            </button>

            {/* Salvar como padrão */}
            <button
              onClick={() => {
                onSaveAsDefault();
                onClose();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 transition-colors flex items-center gap-3 text-left"
            >
              <Copy className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Salvar como padrão</div>
                <div className="text-xs text-blue-200">Aplicar para todas as próximas entregas com este serviço</div>
              </div>
            </button>

            {/* Cancelar */}
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-3 transition-colors flex items-center gap-3 text-left"
            >
              <X className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Cancelar</div>
                <div className="text-xs text-gray-300">Não salvar as alterações</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
