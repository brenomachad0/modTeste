'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';

interface AddInsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (insumo: { nome: string; tipo: string; arquivo: File }) => void;
}

export default function AddInsumoModal({ isOpen, onClose, onAdd }: AddInsumoModalProps) {
  const [tipo, setTipo] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!tipo.trim()) {
      alert('Por favor, especifique o tipo de arquivo');
      return;
    }
    if (!arquivo) {
      alert('Por favor, selecione um arquivo');
      return;
    }

    onAdd({
      nome: arquivo.name,
      tipo: tipo.trim(),
      arquivo,
    });

    // Reset form
    setTipo('');
    setArquivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" />
            Adicionar Insumo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tipo de Arquivo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Arquivo *
            </label>
            <input
              type="text"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ex: Imagem de referência, Logo, Briefing, etc."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Upload de Arquivo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Arquivo *
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-gray-800/50 transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {arquivo ? arquivo.name : 'Clique para selecionar arquivo'}
                </span>
              </label>
            </div>
            {arquivo && (
              <div className="mt-2 text-xs text-gray-400">
                Tamanho: {(arquivo.size / 1024).toFixed(2)} KB
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            Adicionar Insumo
          </button>
        </div>
      </div>
    </div>
  );
}
