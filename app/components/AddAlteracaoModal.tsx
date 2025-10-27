'use client';

import { useState, useRef } from 'react';
import { X, AlertCircle, FileText } from 'lucide-react';

interface Servico {
  id: string;
  nome: string;
}

interface AddAlteracaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (alteracao: {
    titulo: string;
    descricao: string;
    arquivo?: File;
    escopo: 'entrega' | 'servico';
    servico_id?: string;
    servico_nome?: string;
  }) => void;
  servicos: Servico[];
}

export default function AddAlteracaoModal({ isOpen, onClose, onAdd, servicos }: AddAlteracaoModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [escopo, setEscopo] = useState<'entrega' | 'servico'>('entrega');
  const [servicoId, setServicoId] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!titulo.trim()) {
      alert('Por favor, informe o título da alteração');
      return;
    }
    if (!descricao.trim()) {
      alert('Por favor, descreva a alteração');
      return;
    }
    if (escopo === 'servico' && !servicoId) {
      alert('Por favor, selecione o serviço');
      return;
    }

    const servicoSelecionado = servicos.find(s => s.id === servicoId);

    onAdd({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      arquivo: arquivo || undefined,
      escopo,
      servico_id: escopo === 'servico' ? servicoId : undefined,
      servico_nome: escopo === 'servico' ? servicoSelecionado?.nome : undefined,
    });

    // Reset form
    setTitulo('');
    setDescricao('');
    setEscopo('entrega');
    setServicoId('');
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
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            Nova Alteração Solicitada
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
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título da Alteração *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Ajuste na paleta de cores"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Escopo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Escopo da Alteração *
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="entrega"
                  checked={escopo === 'entrega'}
                  onChange={(e) => {
                    setEscopo(e.target.value as 'entrega');
                    setServicoId('');
                  }}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-300">Entrega Completa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="servico"
                  checked={escopo === 'servico'}
                  onChange={(e) => setEscopo(e.target.value as 'servico')}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-300">Serviço Específico</span>
              </label>
            </div>
          </div>

          {/* Seleção de Serviço (se escopo = servico) */}
          {escopo === 'servico' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selecione o Serviço *
              </label>
              <select
                value={servicoId}
                onChange={(e) => setServicoId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="">Selecione um serviço...</option>
                {servicos.map(servico => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição da Alteração *
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva detalhadamente a alteração solicitada pelo cliente..."
              rows={5}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
            />
          </div>

          {/* Anexo (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Anexo (opcional)
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="alteracao-file-upload"
              />
              <label
                htmlFor="alteracao-file-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-gray-800/50 transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {arquivo ? arquivo.name : 'Clique para anexar arquivo (opcional)'}
                </span>
              </label>
            </div>
            {arquivo && (
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>Tamanho: {(arquivo.size / 1024).toFixed(2)} KB</span>
                <button
                  onClick={() => {
                    setArquivo(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700 sticky bottom-0 bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
          >
            Registrar Alteração
          </button>
        </div>
      </div>
    </div>
  );
}
