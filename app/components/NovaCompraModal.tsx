/**
 * NovaCompraModal - Modal para cadastrar nova compra
 * Permite cadastrar beneficiário com PIX, selecionar forma de pagamento
 */

'use client';

import { useState } from 'react';
import { X, User, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';

interface Beneficiario {
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  pix_chave?: string;
  pix_tipo?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
}

interface NovaCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (compra: any) => void;
  beneficiariosExistentes?: Beneficiario[];
}

export default function NovaCompraModal({
  isOpen,
  onClose,
  onSubmit,
  beneficiariosExistentes = [],
}: NovaCompraModalProps) {
  // Dados do beneficiário
  const [beneficiarioNome, setBeneficiarioNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [pixChave, setPixChave] = useState('');
  const [pixTipo, setPixTipo] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf');
  const [beneficiarioSelecionado, setBeneficiarioSelecionado] = useState<Beneficiario | null>(null);
  const [isCadastrarNovo, setIsCadastrarNovo] = useState(false);

  // Dados da compra
  const [valor, setValor] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'pix_chave' | 'pix_copia_cola' | 'boleto'>('pix_chave');

  // Dados específicos da forma de pagamento
  const [pixCopiaCola, setPixCopiaCola] = useState('');
  const [boletoLinhaDigitavel, setBoletoLinhaDigitavel] = useState('');
  const [boletoVencimento, setBoletoVencimento] = useState('');

  // Dados específicos de pagamento (para substituir do beneficiário)
  const [pixChavePagamento, setPixChavePagamento] = useState('');
  const [pixTipoPagamento, setPixTipoPagamento] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf');

  if (!isOpen) return null;

  const handleBeneficiarioChange = (nome: string) => {
    const beneficiario = beneficiariosExistentes.find(b => b.nome === nome);
    if (beneficiario) {
      setBeneficiarioSelecionado(beneficiario);
      setBeneficiarioNome(beneficiario.nome);
      setCpfCnpj(beneficiario.cpf_cnpj || '');
      setEmail(beneficiario.email || '');
      setTelefone(beneficiario.telefone || '');
      setPixChave(beneficiario.pix_chave || '');
      setPixTipo(beneficiario.pix_tipo || 'cpf');
      // Inicializa campos de pagamento com dados do beneficiário
      setPixChavePagamento(beneficiario.pix_chave || '');
      setPixTipoPagamento(beneficiario.pix_tipo || 'cpf');
    } else {
      setBeneficiarioSelecionado(null);
      setBeneficiarioNome(nome);
      setCpfCnpj('');
      setEmail('');
      setTelefone('');
      setPixChave('');
      setPixTipo('cpf');
      setPixChavePagamento('');
      setPixTipoPagamento('cpf');
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

    const compra: any = {
      beneficiario_nome: beneficiarioNome.trim(),
      beneficiario_pix_chave: pixChave.trim() || undefined,
      beneficiario_pix_tipo: pixChave.trim() ? pixTipo : undefined,
      valor: parseFloat(valor),
      data_pagamento: dataPagamento,
      descricao: descricao.trim() || undefined,
      forma_pagamento: formaPagamento,
    };

    // Adicionar dados específicos da forma de pagamento
    if (formaPagamento === 'pix_chave') {
      compra.pix_chave = pixChavePagamento.trim();
      compra.pix_tipo = pixTipoPagamento;
    } else if (formaPagamento === 'pix_copia_cola') {
      compra.pix_copia_cola = pixCopiaCola.trim();
    } else if (formaPagamento === 'boleto') {
      compra.boleto_linha_digitavel = boletoLinhaDigitavel.trim();
      compra.boleto_vencimento = boletoVencimento;
    }

    onSubmit(compra);
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
    setBeneficiarioSelecionado(null);
    setIsCadastrarNovo(false);
    setValor('');
    setDataPagamento('');
    setDescricao('');
    setFormaPagamento('pix_chave');
    setPixCopiaCola('');
    setBoletoLinhaDigitavel('');
    setBoletoVencimento('');
    setPixChavePagamento('');
    setPixTipoPagamento('cpf');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-400" />
            Nova Compra
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
                      setPixChavePagamento('');
                      setPixTipoPagamento('cpf');
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

          {/* Seção: Dados da Compra */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Dados da Compra
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
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Descrição da compra"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Seção: Forma de Pagamento */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-400" />
              Forma de Pagamento
            </h3>

            <div className="space-y-3">
              {/* Seletor de Forma de Pagamento */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormaPagamento('pix_chave')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formaPagamento === 'pix_chave'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  PIX (Chave)
                </button>
                <button
                  type="button"
                  onClick={() => setFormaPagamento('pix_copia_cola')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formaPagamento === 'pix_copia_cola'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  PIX (Copia e Cola)
                </button>
                <button
                  type="button"
                  onClick={() => setFormaPagamento('boleto')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formaPagamento === 'boleto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Boleto
                </button>
              </div>

              {/* Campos específicos da forma de pagamento */}
              {formaPagamento === 'pix_chave' && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Chave PIX para Pagamento
                    </label>
                    <input
                      type="text"
                      value={pixChavePagamento}
                      onChange={(e) => setPixChavePagamento(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder={pixChave || 'Chave PIX'}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {pixChave ? 'Herdado do beneficiário. Pode substituir.' : 'Digite a chave PIX'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Tipo
                    </label>
                    <select
                      value={pixTipoPagamento}
                      onChange={(e) => setPixTipoPagamento(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="telefone">Telefone</option>
                      <option value="aleatoria">Aleatória</option>
                    </select>
                  </div>
                </div>
              )}

              {formaPagamento === 'pix_copia_cola' && (
                <div className="pt-2">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Código PIX Copia e Cola
                  </label>
                  <textarea
                    value={pixCopiaCola}
                    onChange={(e) => setPixCopiaCola(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                    placeholder="Cole o código PIX aqui"
                    rows={3}
                  />
                </div>
              )}

              {formaPagamento === 'boleto' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Linha Digitável
                    </label>
                    <input
                      type="text"
                      value={boletoLinhaDigitavel}
                      onChange={(e) => setBoletoLinhaDigitavel(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                      placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Data de Vencimento *
                      </label>
                      <input
                        type="date"
                        value={boletoVencimento}
                        onChange={(e) => setBoletoVencimento(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                        required
                      />
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
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Cadastrar Compra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
