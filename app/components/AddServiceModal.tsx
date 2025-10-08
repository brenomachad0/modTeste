'use client';

import { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExisting: (serviceId: string) => void;
  onCreateNew: (serviceName: string) => void;
  availableServices?: Array<{ id: string; nome: string }>;
}

export default function AddServiceModal({
  isOpen,
  onClose,
  onAddExisting,
  onCreateNew,
  availableServices = []
}: AddServiceModalProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [newServiceName, setNewServiceName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (mode === 'select' && selectedServiceId) {
      onAddExisting(selectedServiceId);
      onClose();
    } else if (mode === 'create' && newServiceName.trim()) {
      onCreateNew(newServiceName.trim());
      onClose();
    }
  };

  const handleClose = () => {
    setMode('select');
    setSelectedServiceId('');
    setNewServiceName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Adicionar Serviço</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Toggle Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('select')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'select'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Selecionar Existente
            </button>
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'create'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Criar Novo
            </button>
          </div>

          {/* Select Mode */}
          {mode === 'select' && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Selecione o serviço:</label>
              <div className="relative">
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 appearance-none pr-10"
                >
                  <option value="">Selecione um serviço</option>
                  {availableServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {availableServices.length === 0 && (
                <p className="text-xs text-gray-500">Nenhum serviço disponível. Crie um novo serviço.</p>
              )}
            </div>
          )}

          {/* Create Mode */}
          {mode === 'create' && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Nome do serviço:</label>
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Ex: Edição de Vídeo, Motion Graphics..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                autoFocus
              />
              <p className="text-xs text-gray-500">
                Um serviço será criado com a tarefa padrão: "Criar tarefas do serviço"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              (mode === 'select' && !selectedServiceId) ||
              (mode === 'create' && !newServiceName.trim())
            }
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
