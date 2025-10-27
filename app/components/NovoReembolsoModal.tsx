/**
 * NovoReembolsoModal - Modal para cadastrar novo reembolso
 * Requer beneficiário, valor, data, descrição e comprovante obrigatório
 */

'use client';

import { useState } from 'react';
import { X, User, DollarSign, Calendar, FileText, Upload } from 'lucide-react';

interface Beneficiario {
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  pix_chave?: string;
  pix_tipo?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
}

interface NovoReembolsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reembolso: any) => void;
  beneficiariosExistentes?: Beneficiario[];
}

export default function NovoReembolsoModal({
  isOpen,
  onClose,
  onSubmit,
  beneficiariosExistentes = [],
}: NovoReembolsoModalProps) {
  // Dados do beneficiário
  const [beneficiarioNome, setBeneficiarioNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [pixChave, setPixChave] = useState('');
  const [pixTipo, setPixTipo] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf');
  const [isCadastrarNovo, setIsCadastrarNovo] = useState(false);

  // Dados do reembolso
  const [valor, setValor] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [comprovantePreview, setComprovantePreview] = useState<string>('');

  if (!isOpen) return null;

  const handleBeneficiarioChange = (nome: string) => {
    const beneficiario = beneficiariosExistentes.find(b => b.nome === nome);
    if (beneficiario) {
      setBeneficiarioNome(beneficiario.nome);
      setCpfCnpj(beneficiario.cpf_cnpj || '');
      setEmail(beneficiario.email || '');
      setTelefone(beneficiario.telefone || '');
      setPixChave(beneficiario.pix_chave || '');
      setPixTipo(beneficiario.pix_tipo || 'cpf');
      setIsCadastrarNovo(false);
    } else {
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

  const handleSubmit = (e: React.FormEvent) => {
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

    const reembolso = {
      beneficiario_nome: beneficiarioNome.trim(),
      beneficiario_pix_chave: pixChave.trim() || undefined,
      beneficiario_pix_tipo: pixChave.trim() ? pixTipo : undefined,
      valor: parseFloat(valor),
      data_pagamento: dataPagamento,
      descricao: descricao.trim(),
      comprovante: comprovante,
      tipo: 'reembolso',
    };

    onSubmit(reembolso);
    handleClose();
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
                    <option key={idx} value={b.nome}>
                      {b.nome}
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
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Cadastrar Reembolso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
