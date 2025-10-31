/**
 * NovaCompraModal - Modal para cadastrar nova compra
 * Permite cadastrar beneficiário com PIX, selecionar forma de pagamento
 */

'use client';

import { useState, useEffect } from 'react';
import { X, User, DollarSign, Calendar, CreditCard, FileText, Loader2 } from 'lucide-react';
import { mandrillApi } from '@/lib/mandrill-api';

interface Beneficiario {
  beneficiario_id: string;
  beneficiario_nome: string;
  pix_default?: {
    pix_chave: string;
    pix_tipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  } | null;
}

interface NovaCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback após sucesso
  demandaId: string; // ID do projeto/demanda
}

export default function NovaCompraModal({
  isOpen,
  onClose,
  onSuccess,
  demandaId,
}: NovaCompraModalProps) {
  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingBeneficiario, setIsUpdatingBeneficiario] = useState(false);
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
  
  // Rastrear mudanças no beneficiário
  const [beneficiarioOriginal, setBeneficiarioOriginal] = useState<any>(null);
  const [beneficiarioModificado, setBeneficiarioModificado] = useState(false);

  // Dados da compra
  const [valor, setValor] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'PIX Chave' | 'Copia/Cola' | 'Boleto'>('PIX Chave');

  // Dados específicos da forma de pagamento
  const [pixCopiaCola, setPixCopiaCola] = useState('');
  const [boletoLinhaDigitavel, setBoletoLinhaDigitavel] = useState('');
  const [boletoVencimento, setBoletoVencimento] = useState('');

  // Dados específicos de pagamento (para substituir do beneficiário)
  const [pixChavePagamento, setPixChavePagamento] = useState('');
  const [pixTipoPagamento, setPixTipoPagamento] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf');

  // Carregar beneficiários ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      loadBeneficiarios();
    }
  }, [isOpen]);

  const loadBeneficiarios = async () => {
    setIsLoading(true);
    try {
      const beneficiarios = await mandrillApi.getBeneficiarios();
      setBeneficiariosExistentes(Array.isArray(beneficiarios) ? beneficiarios : []);
    } catch (error) {
      console.error('Erro ao carregar beneficiários:', error);
      setBeneficiariosExistentes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Detectar mudanças nos campos do beneficiário
  useEffect(() => {
    if (beneficiarioSelecionado && beneficiarioOriginal) {
      // Valores originais da API
      const nomeOriginal = beneficiarioOriginal.beneficiario_nome || '';
      
      // CPF/CNPJ original
      let cpfCnpjOriginal = '';
      if (beneficiarioOriginal.tipo === 'pf' && beneficiarioOriginal.pessoa_detalhe?.pessoa_fisica_cpf) {
        cpfCnpjOriginal = beneficiarioOriginal.pessoa_detalhe.pessoa_fisica_cpf;
      } else if (beneficiarioOriginal.tipo === 'pj' && beneficiarioOriginal.pessoa_detalhe?.pessoa_juridica_cnpj) {
        cpfCnpjOriginal = beneficiarioOriginal.pessoa_detalhe.pessoa_juridica_cnpj;
      }
      
      const emailOriginal = beneficiarioOriginal.pessoa?.pessoa_emailTelefone || '';
      const telefoneOriginal = ''; // Backend não retorna campo específico ainda
      const pixChaveOriginal = beneficiarioOriginal.pix?.pix_chave || '';
      const pixTipoOriginal = beneficiarioOriginal.pix?.pix_tipo || 'cpf';
      
      // Compara valores atuais com originais
      const mudou = 
        beneficiarioNome !== nomeOriginal ||
        cpfCnpj !== cpfCnpjOriginal ||
        email !== emailOriginal ||
        telefone !== telefoneOriginal ||
        pixChave !== pixChaveOriginal ||
        pixTipo !== pixTipoOriginal;
      
      setBeneficiarioModificado(mudou);
    }
  }, [beneficiarioNome, cpfCnpj, email, telefone, pixChave, pixTipo, beneficiarioSelecionado, beneficiarioOriginal]);

  const handleUpdateBeneficiario = async () => {
    if (!beneficiarioSelecionado) return;

    setIsUpdatingBeneficiario(true);
    try {
      const payload: any = {};

      // Adiciona apenas campos que têm valor
      if (beneficiarioNome.trim()) {
        payload.beneficiario_nome = beneficiarioNome.trim();
      }
      if (cpfCnpj.trim()) {
        payload.beneficiario_documento = cpfCnpj.trim();
      }
      if (email.trim()) {
        payload.beneficiario_email = email.trim();
      }
      if (telefone.trim()) {
        payload.beneficiario_telefone = telefone.trim();
      }
      if (pixChave.trim()) {
        payload.beneficiario_pix_chave = pixChave.trim();
        payload.beneficiario_pix_tipo = pixTipo;
      }

      console.log('🔄 Payload de atualização:', payload);

      await mandrillApi.updateBeneficiario(beneficiarioSelecionado.beneficiario_id, payload);

      alert('Beneficiário atualizado com sucesso!');
      setBeneficiarioModificado(false);
      
      // Recarregar lista de beneficiários
      await loadBeneficiarios();
    } catch (error: any) {
      console.error('Erro ao atualizar beneficiário:', error);
      alert(error.response?.data?.message || 'Erro ao atualizar beneficiário. Tente novamente.');
    } finally {
      setIsUpdatingBeneficiario(false);
    }
  };

  if (!isOpen) return null;

  const handleBeneficiarioChange = async (nome: string) => {
    const beneficiario = beneficiariosExistentes.find(b => b.beneficiario_nome === nome);
    if (beneficiario) {
      setBeneficiarioSelecionado(beneficiario);
      setBeneficiarioNome(beneficiario.beneficiario_nome);
      
      // Carregar detalhes completos do beneficiário via GET /pessoa-beneficiario/{id}
      try {
        console.log('🔍 Carregando detalhes do beneficiário:', beneficiario.beneficiario_id);
        const detalhes = await mandrillApi.getBeneficiario(beneficiario.beneficiario_id);
        console.log('📦 Detalhes recebidos:', detalhes);
        
        setBeneficiarioOriginal(detalhes);
        
        // Mapear campos da resposta da API
        // Nome já está definido
        setBeneficiarioNome(detalhes.beneficiario_nome || '');
        
        // CPF/CNPJ - pessoa física ou jurídica
        if (detalhes.tipo === 'pf' && detalhes.pessoa_detalhe?.pessoa_fisica_cpf) {
          setCpfCnpj(detalhes.pessoa_detalhe.pessoa_fisica_cpf);
        } else if (detalhes.tipo === 'pj' && detalhes.pessoa_detalhe?.pessoa_juridica_cnpj) {
          setCpfCnpj(detalhes.pessoa_detalhe.pessoa_juridica_cnpj);
        } else {
          setCpfCnpj('');
        }
        
        // Email - vem de pessoa.pessoa_emailTelefone
        setEmail(detalhes.pessoa?.pessoa_emailTelefone || '');
        
        // Telefone - também pode vir de pessoa_emailTelefone (verificar se é telefone)
        // Por enquanto deixa vazio, backend precisa fornecer campo específico
        setTelefone('');
        
        // PIX - vem do objeto pix
        if (detalhes.pix) {
          setPixChave(detalhes.pix.pix_chave || '');
          setPixTipo(detalhes.pix.pix_tipo || 'cpf');
          setPixChavePagamento(detalhes.pix.pix_chave || '');
          setPixTipoPagamento(detalhes.pix.pix_tipo || 'cpf');
        } else {
          setPixChave('');
          setPixTipo('cpf');
          setPixChavePagamento('');
          setPixTipoPagamento('cpf');
        }
        
        setBeneficiarioModificado(false);
      } catch (error) {
        console.error('❌ Erro ao carregar detalhes do beneficiário:', error);
        // Se falhar, limpa os campos
        setCpfCnpj('');
        setEmail('');
        setTelefone('');
        setPixChave('');
        setPixTipo('cpf');
      }
    } else {
      setBeneficiarioSelecionado(null);
      setBeneficiarioOriginal(null);
      setBeneficiarioNome(nome);
      setCpfCnpj('');
      setEmail('');
      setTelefone('');
      setPixChave('');
      setPixTipo('cpf');
      setPixChavePagamento('');
      setPixTipoPagamento('cpf');
      setBeneficiarioModificado(false);
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

    if (!descricao.trim()) {
      alert('Descrição é obrigatória');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mapear forma de pagamento para o formato da API
      const meiosPagamento: Record<string, string> = {
        'PIX Chave': 'pix',
        'Copia/Cola': 'pix',
        'Boleto': 'boleto',
      };

      const compraData: any = {
        compra_tipo: 'compra',
        compra_descricao: descricao.trim(),
        compra_valor: parseFloat(valor),
        compra_meio_pagamento: meiosPagamento[formaPagamento] || 'pix',
        compra_status: 'criado',
      };

      // Data de pagamento (se informada)
      if (dataPagamento) {
        compraData.compra_data_pagamento = dataPagamento;
      }

      // Beneficiário existente
      if (beneficiarioSelecionado && beneficiarioSelecionado.beneficiario_id) {
        compraData.compra_beneficiario = beneficiarioSelecionado.beneficiario_id;
      } 
      // Novo beneficiário
      else if (isCadastrarNovo) {
        compraData.beneficiario_add = {
          beneficiario_nome: beneficiarioNome.trim(),
          beneficiario_documento: cpfCnpj.trim(),
          beneficiario_email: email.trim(),
          beneficiario_telefone: telefone.trim(),
          beneficiario_pix_chave: pixChave.trim() || undefined,
          beneficiario_pix_tipo: pixChave.trim() ? pixTipo : undefined,
        };
      }

      // Dados específicos por forma de pagamento
      if (formaPagamento === 'PIX Chave') {
        const chaveUsada = pixChavePagamento || pixChave;
        const tipoUsado = pixTipoPagamento || pixTipo;
        
        if (chaveUsada) {
          compraData.compra_pix_chave = chaveUsada;
          compraData.compra_pix_tipo = tipoUsado;
        }
      } else if (formaPagamento === 'Copia/Cola') {
        if (pixCopiaCola.trim()) {
          compraData.compra_pix_chave = pixCopiaCola.trim();
          compraData.compra_pix_tipo = 'copia_cola';
        }
      } else if (formaPagamento === 'Boleto') {
        if (boletoLinhaDigitavel.trim()) {
          compraData.compra_boleto_linha_digitavel = boletoLinhaDigitavel.trim();
        }
        if (boletoVencimento) {
          compraData.compra_boleto_vencimento = boletoVencimento;
        }
      }

      console.log('🚀 NovaCompraModal - Enviando compra:');
      console.log('   demandaId:', demandaId);
      console.log('   compraData:', JSON.stringify(compraData, null, 2));

      await mandrillApi.createCompra(demandaId, compraData);
      
      alert('Compra cadastrada com sucesso!');
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao cadastrar compra:', error);
      alert(error.response?.data?.message || 'Erro ao cadastrar compra. Tente novamente.');
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
    setBeneficiarioSelecionado(null);
    setIsCadastrarNovo(false);
    setValor('');
    setDataPagamento('');
    setDescricao('');
    setFormaPagamento('PIX Chave');
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
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}
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
                    <option key={idx} value={b.beneficiario_nome}>
                      {b.beneficiario_nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campos de cadastro - mostrar apenas se "Novo Beneficiário" ou beneficiário selecionado */}
              {(isCadastrarNovo || beneficiarioNome) && (
                <>
                  {/* Nome - sempre editável */}
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
                      readOnly={!isCadastrarNovo && !beneficiarioSelecionado}
                    />
                  </div>

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
                      readOnly={!isCadastrarNovo && !beneficiarioSelecionado}
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
                        readOnly={!isCadastrarNovo && !beneficiarioSelecionado}
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
                        readOnly={!isCadastrarNovo && !beneficiarioSelecionado}
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
                        readOnly={!isCadastrarNovo && !beneficiarioSelecionado}
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
                        disabled={!isCadastrarNovo && !beneficiarioSelecionado}
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="telefone">Telefone</option>
                        <option value="aleatoria">Aleatória</option>
                      </select>
                    </div>
                  </div>

                  {/* Botão de Atualizar Beneficiário - apenas para beneficiário existente modificado */}
                  {beneficiarioSelecionado && beneficiarioModificado && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleUpdateBeneficiario}
                        disabled={isUpdatingBeneficiario}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isUpdatingBeneficiario ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Atualizando...
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4" />
                            Atualizar Cadastro do Beneficiário
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-400 mt-1 text-center">
                        Salve as alterações do beneficiário antes de criar a compra
                      </p>
                    </div>
                  )}
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
                  onClick={() => setFormaPagamento('PIX Chave')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formaPagamento === 'PIX Chave'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  PIX (Chave)
                </button>
                <button
                  type="button"
                  onClick={() => setFormaPagamento('Copia/Cola')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formaPagamento === 'Copia/Cola'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  PIX (Copia e Cola)
                </button>
                <button
                  type="button"
                  onClick={() => setFormaPagamento('Boleto')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formaPagamento === 'Boleto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Boleto
                </button>
              </div>

              {/* Campos específicos da forma de pagamento */}
              {formaPagamento === 'PIX Chave' && (
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

              {formaPagamento === 'Copia/Cola' && (
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

              {formaPagamento === 'Boleto' && (
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
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Compra'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
