/**
 * NovoReembolsoModal - Modal para cadastrar novo reembolso
 * Requer beneficiário, valor, data, descrição e comprovante obrigatório
 */

'use client';

import { useState, useEffect } from 'react';
import { X, User, DollarSign, Calendar, FileText, Upload, Loader2 } from 'lucide-react';
import { mandrillApi } from '@/lib/mandrill-api';

interface Beneficiario {
  beneficiario_id: string;
  beneficiario_nome: string;
  pix_default?: {
    pix_chave: string;
    pix_tipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  } | null;
}

interface NovoReembolsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  demandaId: string;
}

export default function NovoReembolsoModal({
  isOpen,
  onClose,
  onSuccess,
  demandaId,
}: NovoReembolsoModalProps) {
  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [beneficiariosExistentes, setBeneficiariosExistentes] = useState<Beneficiario[]>([]);

  // Dados do beneficiário
  const [beneficiarioNome, setBeneficiarioNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [pixChave, setPixChave] = useState('');
  const [pixTipo, setPixTipo] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf');
  const [beneficiarioSelecionado, setBeneficiarioSelecionado] = useState<Beneficiario | null>(null);
  const [isCadastrarNovo, setIsCadastrarNovo] = useState(false);

  // Dados do reembolso
  const [valor, setValor] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [comprovantePreview, setComprovantePreview] = useState<string>('');

  // Carregar beneficiários ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      loadBeneficiarios();
    }
  }, [isOpen]);

  const loadBeneficiarios = async () => {
    setIsLoading(true);
    try {
      const response = await mandrillApi.getBeneficiarios();
      const beneficiarios = response.results || response.data || response;
      setBeneficiariosExistentes(beneficiarios);
    } catch (error) {
      console.error('Erro ao carregar beneficiários:', error);
      setBeneficiariosExistentes([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBeneficiarioChange = (nome: string) => {
    const beneficiario = beneficiariosExistentes.find(b => b.beneficiario_nome === nome);
    if (beneficiario) {
      setBeneficiarioSelecionado(beneficiario);
      setBeneficiarioNome(beneficiario.beneficiario_nome);
      
      // Limpa campos que não vêm da API
      setCpfCnpj('');
      setEmail('');
      setTelefone('');
      
      // PIX default do beneficiário
      if (beneficiario.pix_default) {
        setPixChave(beneficiario.pix_default.pix_chave);
        setPixTipo(beneficiario.pix_default.pix_tipo);
      } else {
        setPixChave('');
        setPixTipo('cpf');
      }
      setIsCadastrarNovo(false);
    } else {
      setBeneficiarioSelecionado(null);
      setBeneficiarioNome(nome);
      setCpfCnpj('');
      setEmail('');
      setTelefone('');
      setPixChave('');
      setPixTipo('cpf');
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!beneficiarioNome.trim()) {
      alert('Nome do beneficiário é obrigatório');
      return;
    }

    if (!valor || parseFloat(valor) <= 0) {
      alert('Valor é obrigatório e deve ser maior que zero');
      return;
    }

    if (!dataPagamento) {
      alert('Data de pagamento é obrigatória');
      return;
    }

    if (!descricao.trim()) {
      alert('Descrição é obrigatória');
      return;
    }

    if (!comprovante) {
      alert('Comprovante é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      const reembolsoData: any = {
        compra_tipo: 'reembolso',
        compra_descricao: descricao.trim(),
        compra_valor: parseFloat(valor),
        compra_meio_pagamento: 'pix', // Reembolso sempre PIX
        compra_status: 'criado',
        compra_cupom_file: comprovante,
      };

      // Data de pagamento
      if (dataPagamento) {
        reembolsoData.compra_data_pagamento = dataPagamento;
      }

      // Beneficiário existente
      if (beneficiarioSelecionado && beneficiarioSelecionado.beneficiario_id) {
        reembolsoData.compra_beneficiario = beneficiarioSelecionado.beneficiario_id;
        
        // Usar PIX default do beneficiário se disponível
        if (beneficiarioSelecionado.pix_default) {
          reembolsoData.compra_pix_chave = beneficiarioSelecionado.pix_default.pix_chave;
          reembolsoData.compra_pix_tipo = beneficiarioSelecionado.pix_default.pix_tipo;
        }
      } 
      // Novo beneficiário
      else if (isCadastrarNovo) {
        reembolsoData.beneficiario_add = {
          beneficiario_nome: beneficiarioNome.trim(),
          beneficiario_documento: cpfCnpj.trim(),
          beneficiario_email: email.trim(),
          beneficiario_telefone: telefone.trim(),
          beneficiario_pix_chave: pixChave.trim() || undefined,
          beneficiario_pix_tipo: pixChave.trim() ? pixTipo : undefined,
        };
        
        // PIX do novo beneficiário
        if (pixChave.trim()) {
          reembolsoData.compra_pix_chave = pixChave.trim();
          reembolsoData.compra_pix_tipo = pixTipo;
        }
      }

      await mandrillApi.createCompra(demandaId, reembolsoData);
      
      alert('Reembolso cadastrado com sucesso!');
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao cadastrar reembolso:', error);
      alert(error.response?.data?.message || 'Erro ao cadastrar reembolso. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Limpar todos os campos
    setBeneficiarioNome('');
    setCpfCnpj('');
    setEmail('');
    setTelefone('');
    setPixChave('');
    setPixTipo('cpf');
    setValor('');
    setDataPagamento('');
    setDescricao('');
    setComprovante(null);
    setComprovantePreview('');
    setIsCadastrarNovo(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-400" />
            Novo Reembolso
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Beneficiário */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Beneficiário
            </h3>

            <div className="space-y-3">
              {/* Dropdown de Beneficiário */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Beneficiário * <span className="text-gray-500">(obrigatório)</span>
                </label>
                <select
                  value={isCadastrarNovo ? 'novo' : beneficiarioNome}
                  onChange={(e) => {
                    const valor = e.target.value;
                    if (valor === 'novo') {
                      setIsCadastrarNovo(true);
                      setBeneficiarioNome('');
                      setCpfCnpj('');
                      setEmail('');
                      setTelefone('');
                      setPixChave('');
                      setPixTipo('cpf');
                      setBeneficiarioSelecionado(null);
                    } else if (valor === '') {
                      // Placeholder selecionado, não fazer nada
                    } else {
                      setIsCadastrarNovo(false);
                      handleBeneficiarioChange(valor);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Selecione um beneficiário</option>
                  <option value="novo" className="font-semibold text-green-400">+ Novo Beneficiário</option>
                  <option disabled>──────────</option>
                  {beneficiariosExistentes.map((b, idx) => (
                    <option key={idx} value={b.beneficiario_nome}>
                      {b.beneficiario_nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campos de cadastro - mostrar apenas se "Novo Beneficiário" ou beneficiário selecionado */}
              {(isCadastrarNovo || beneficiarioNome) && (
                <>
                  {/* Nome - editável apenas se for novo */}
                  {isCadastrarNovo && (
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Nome * <span className="text-gray-500">(obrigatório)</span>
                      </label>
                      <input
                        type="text"
                        value={beneficiarioNome}
                        onChange={(e) => setBeneficiarioNome(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Nome do beneficiário"
                        required
                      />
                    </div>
                  )}

                  {/* CPF/CNPJ */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      CPF/CNPJ
                    </label>
                    <input
                      type="text"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      disabled={!isCadastrarNovo}
                    />
                  </div>

                  {/* Email e Telefone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="email@exemplo.com"
                        disabled={!isCadastrarNovo}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="(00) 00000-0000"
                        disabled={!isCadastrarNovo}
                      />
                    </div>
                  </div>

                  {/* Chave PIX do Beneficiário */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Chave PIX
                      </label>
                      <input
                        type="text"
                        value={pixChave}
                        onChange={(e) => setPixChave(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Chave PIX do beneficiário"
                        disabled={!isCadastrarNovo}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Tipo
                      </label>
                      <select
                        value={pixTipo}
                        onChange={(e) => setPixTipo(e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        disabled={!isCadastrarNovo}
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="telefone">Telefone</option>
                        <option value="aleatoria">Aleatória</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Seção: Dados do Reembolso */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Dados do Reembolso
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Valor */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Valor * <span className="text-gray-500">(R$)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="0,00"
                    required
                  />
                </div>

                {/* Data de Pagamento */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Data de Pagamento *
                  </label>
                  <input
                    type="date"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Descrição * <span className="text-gray-500">(obrigatória)</span>
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Descrição do reembolso"
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>

          {/* Seção: Comprovante */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-green-400" />
              Comprovante * <span className="text-xs font-normal text-gray-400">(obrigatório)</span>
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
                  required
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
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Reembolso'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
