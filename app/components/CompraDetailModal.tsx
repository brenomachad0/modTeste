/**
 * CompraDetailModal - Modal para visualizar detalhes da compra e adicionar comprovante
 */

'use client';

import { X, User, DollarSign, Calendar, FileText, Upload, CheckCircle, Download } from 'lucide-react';
import { useState } from 'react';

interface Compra {
  compra_id: string;
  compra_beneficiario_nome: string;
  compra_data_pagamento: string;
  compra_valor: number;
  compra_descricao: string;
  compra_status: 'criado' | 'pago' | 'cancelado';
  compra_tipo?: 'compra' | 'reembolso';
  compra_tem_comprovante?: boolean;
  compra_comprovante?: string;
  compra_pix_chave?: string;
  compra_pix_tipo?: string;
  compra_meio_pagamento?: {
    meio_pagamento_nome: string;
  };
}

interface CompraDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  compra: Compra | null;
  onUploadComprovante?: (compraId: string, file: File) => void;
}

export default function CompraDetailModal({
  isOpen,
  onClose,
  compra,
  onUploadComprovante,
}: CompraDetailModalProps) {
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [comprovantePreview, setComprovantePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  if (!isOpen || !compra) return null;

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const handleComprovanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprovante(file);
      
      // Criar preview se for imagem
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setComprovantePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setComprovantePreview('');
      }
    }
  };

  const handleUpload = async () => {
    if (!comprovante || !onUploadComprovante) return;

    setUploading(true);
    try {
      await onUploadComprovante(compra.compra_id, comprovante);
      alert('Comprovante enviado com sucesso!');
      handleClose();
    } catch (error) {
      console.error('Erro ao enviar comprovante:', error);
      alert('Erro ao enviar comprovante');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setComprovante(null);
    setComprovantePreview('');
    setUploading(false);
    onClose();
  };

  const temComprovante = compra.compra_tem_comprovante || !!compra.compra_comprovante;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              Detalhes da {compra.compra_tipo === 'reembolso' ? 'Reembolso' : 'Compra'}
            </h2>
            {temComprovante && (
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Comprovante já enviado
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Informações da Compra */}
        <div className="space-y-4">
          {/* Beneficiário */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
            <h3 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
              <User className="w-3 h-3" />
              BENEFICIÁRIO
            </h3>
            <p className="text-white font-medium">{compra.compra_beneficiario_nome}</p>
            {compra.compra_pix_chave && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-300">
                <span className="font-medium">PIX:</span>
                <span className="font-mono">{compra.compra_pix_chave}</span>
                <span className="px-1 py-0.5 bg-gray-600 rounded text-[9px]">
                  {compra.compra_pix_tipo}
                </span>
              </div>
            )}
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                VALOR
              </h3>
              <p className="text-xl font-bold text-green-400">{formatarValor(compra.compra_valor)}</p>
            </div>
            <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                DATA DE PAGAMENTO
              </h3>
              <p className="text-white font-medium">{formatarData(compra.compra_data_pagamento)}</p>
            </div>
          </div>

          {/* Descrição */}
          {compra.compra_descricao && (
            <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                DESCRIÇÃO
              </h3>
              <p className="text-white text-sm">{compra.compra_descricao}</p>
            </div>
          )}

          {/* Forma de Pagamento */}
          {compra.compra_meio_pagamento && (
            <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-2">
                FORMA DE PAGAMENTO
              </h3>
              <p className="text-white font-medium">{compra.compra_meio_pagamento.meio_pagamento_nome}</p>
            </div>
          )}

          {/* Status */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
            <h3 className="text-xs font-medium text-gray-400 mb-2">
              STATUS
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                compra.compra_status === 'pago' ? 'bg-green-500/10 text-green-400' :
                compra.compra_status === 'cancelado' ? 'bg-red-500/10 text-red-400' :
                'bg-yellow-500/10 text-yellow-400'
              }`}>
                {compra.compra_status === 'pago' ? 'Pago' :
                 compra.compra_status === 'cancelado' ? 'Cancelado' :
                 'Aguardando'}
              </span>
            </div>
          </div>

          {/* Seção de Comprovante */}
          {!temComprovante && (
            <div className="bg-gray-700/30 border-2 border-dashed border-gray-600 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-yellow-400" />
                Adicionar Comprovante
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">
                    Anexar cupom fiscal ou nota fiscal
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleComprovanteChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
                  </p>
                </div>

                {/* Preview do comprovante */}
                {comprovantePreview && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-300 mb-2">Preview:</p>
                    <img
                      src={comprovantePreview}
                      alt="Preview do comprovante"
                      className="max-w-full h-auto max-h-64 rounded-lg border border-gray-600"
                    />
                  </div>
                )}

                {comprovante && !comprovantePreview && (
                  <div className="mt-3 p-3 bg-gray-700 border border-gray-600 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-white font-medium">{comprovante.name}</p>
                        <p className="text-xs text-gray-400">
                          {(comprovante.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {comprovante && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Enviar Comprovante
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Visualizar comprovante existente */}
          {temComprovante && compra.compra_comprovante && (
            <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Comprovante Anexado
              </h3>
              <a
                href={compra.compra_comprovante}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-fit"
              >
                <Download className="w-4 h-4" />
                Baixar Comprovante
              </a>
            </div>
          )}
        </div>

        {/* Botão de Fechar */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-600">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
