'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronDown, ChevronUp, Plus, Trash2, Edit, Clock, User, 
  AlertCircle, CheckCircle, PlayCircle, PauseCircle, FileText, 
  Link2, Upload, DollarSign, TrendingUp, Package, Layers, GitBranch,
  Timer, Save, RefreshCw, X, Paperclip, Building, Bell, Check, ArrowRight, Database,
  Calendar, AlertTriangle, ArrowLeft, ShoppingCart, Lightbulb, Megaphone
} from 'lucide-react';
import LottieIcon from './LottieIcon';
import { mockFornecedores, mockBeneficiarios, type Fornecedor, type Beneficiario } from '../../data/mockData';

// Tipos
type Status = 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';

interface Tarefa {
  id: string;
  nome: string;
  status: Status;
  ordem?: number;
  setor: string;
  responsavel_usuario?: string | null;
  responsavel_nome?: string | null;
  responsavel_tipo?: string;
  prazo_horas: number;
  duracao_segundos?: number;
  mandrill_coins: number;
  instrucao?: string;
  templates?: any[];
  data_inicio?: string;
  data_fim?: string;
  tempo_execucao?: number;
  resultado?: any;
}

interface Servico {
  id: string;
  nome: string;
  status: Status;
  progresso_percentual: number;
  tarefas?: Tarefa[];
}

interface Entrega {
  id: string;
  nome: string;
  status: Status;
  progresso_percentual: number;
  briefing: string;
  texto_apoio?: string;
  valor_unitario?: number;
  quantidade_total?: number;
  indice_atual?: number;
  item_crm?: {
    icone?: string;
    titulo?: string;
    nome?: string;
    descricao?: string;
    tipo?: string;
    categoria?: string;
  };
  servicos?: Servico[];
}

interface Projeto {
  id: string;
  demanda_codigo: number;
  titulo?: string;
  anunciante_nome?: string;
  agencia_nome?: string;
  motivo_titulo?: string;
  vendedor_nome?: string;
  emissor_nome?: string;
  solicitante_nome?: string;
  demandante_nome?: string;
  demanda_tipo?: string;
  demanda_status?: string;
  motivo_tipo?: string;
  data_entrega_estimada?: string;
  prazo_data?: string;
  // Novos campos de orçamento
  data_aprovacao_orcamento?: string;
  orcamento_aprovado_at?: string;
  valor_producao?: number;
  valor_total_orcamento?: number;
  orcamento_id_crm?: string;
  orcamento_codigo_crm?: string;
  // Novos campos de serviços
  servicos_locais_crm?: any[];
  servicos_remotos_crm?: any[];
  total_servicos_crm?: number;
  cliente_nome: string;
  motivo: string;
  status: Status;
  progresso_percentual: number;
  valor_total: number;
  prazo_dias: number;
  entregas?: Entrega[];
}

interface ProjectDetailProps {
  project: Projeto;
  router: any;
  editingServiceId: string | null;
  onStartEditing: (serviceId: string) => void;
  onStopEditing: () => void;
  onViewTask?: (task: Tarefa) => void;
  onCompleteTask?: (task: Tarefa) => void;
  onBackToList: () => void;
  onDeliveryClick: (delivery: Entrega) => void;
}

// Componente de Item de Entrega Expandido com Serviços
const DeliveryListItem: React.FC<{ 
  delivery: Entrega; 
  onClick: (delivery: Entrega) => void;
}> = ({ delivery, onClick }) => {
  const [expanded, setExpanded] = useState(false);
  
  const calcularProgresso = () => {
    if (!delivery.servicos || delivery.servicos.length === 0) {
      return delivery.progresso_percentual || 0;
    }
    
    const totalServicos = delivery.servicos.length;
    const progressoTotal = delivery.servicos.reduce((acc, servico) => 
      acc + (servico.progresso_percentual || 0), 0
    );
    
    return progressoTotal / totalServicos;
  };

  const progresso = calcularProgresso();

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleServiceClick = (servico: Servico, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navegar para a página de detalhes do serviço
    window.location.href = `/servicos/${servico.id}`;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-all duration-200">
      {/* Cabeçalho da Entrega */}
      <div 
        className="p-3 cursor-pointer hover:bg-gray-750"
        onClick={() => onClick(delivery)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LottieIcon 
              tipo={delivery.item_crm?.tipo}
              className="text-green-500" 
              size={20} 
            />
            <div>
              <h4 className="text-sm font-semibold text-white">{delivery.nome}</h4>
              <p className="text-xs text-gray-400">
                {delivery.servicos?.length || 0} serviços
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-2 bg-green-500 transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <span className="text-xs font-bold text-green-400 w-8">
              {progresso.toFixed(0)}%
            </span>
            
            {/* Botão para expandir serviços */}
            <button
              onClick={handleExpandClick}
              className="p-1 hover:bg-gray-600 rounded transition-colors"
              title={expanded ? "Ocultar serviços" : "Mostrar serviços"}
            >
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Lista de Serviços (quando expandido) */}
      {expanded && delivery.servicos && delivery.servicos.length > 0 && (
        <div className="px-3 pb-3 border-t border-gray-700">
          <div className="ml-8 space-y-2 mt-2">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Serviços ({delivery.servicos.length})
            </h5>
            {delivery.servicos.map(servico => (
              <div 
                key={servico.id}
                className="bg-gray-900 border border-gray-600 rounded-lg p-2 hover:border-gray-500 hover:bg-gray-850 transition-all duration-200 cursor-pointer"
                onClick={(e) => handleServiceClick(servico, e)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3 h-3 text-purple-400" />
                    <span className="text-xs font-medium text-white">{servico.nome}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {servico.tarefas?.filter(t => t.status === 'concluida').length || 0}/{servico.tarefas?.length || 0} tarefas
                    </span>
                    <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${servico.progresso_percentual || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-purple-400 w-6">
                      {(servico.progresso_percentual || 0).toFixed(0)}%
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Modal de Contratação
const ContratingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  project: Projeto;
}> = ({ isOpen, onClose, project }) => {
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>('');
  const [selectedEntregas, setSelectedEntregas] = useState<{ [entregaId: string]: string[] }>({});
  const [valor, setValor] = useState<string>('');
  const [dataPagamento, setDataPagamento] = useState<string>('');
  const [tipoCupom, setTipoCupom] = useState<'recibo' | 'nota_fiscal'>('recibo');

  const handleEntregaToggle = (entregaId: string) => {
    setSelectedEntregas(prev => {
      const newState = { ...prev };
      if (newState[entregaId]) {
        delete newState[entregaId];
      } else {
        newState[entregaId] = [];
      }
      return newState;
    });
  };

  const handleServicoToggle = (entregaId: string, servicoId: string) => {
    setSelectedEntregas(prev => {
      const entregaServicos = prev[entregaId] || [];
      const newServicos = entregaServicos.includes(servicoId)
        ? entregaServicos.filter(id => id !== servicoId)
        : [...entregaServicos, servicoId];
      
      return {
        ...prev,
        [entregaId]: newServicos
      };
    });
  };

  const handleSubmit = () => {
    const contratoData = {
      fornecedor: selectedFornecedor,
      entregas: selectedEntregas,
      valor: parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')),
      dataPagamento,
      tipoCupom
    };
    
    console.log('Dados do contrato:', contratoData);
    // Aqui você pode enviar os dados para a API
    onClose();
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(parseInt(numericValue) / 100);
    return formattedValue;
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValor(formatted);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-green-400" />
            Fazer Proposta para Fornecedor
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Seleção do Fornecedor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fornecedor
            </label>
            <select
              value={selectedFornecedor}
              onChange={(e) => setSelectedFornecedor(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um fornecedor...</option>
              {mockFornecedores.filter(f => f.ativo).map(fornecedor => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome} {fornecedor.empresa && `(${fornecedor.empresa})`}
                </option>
              ))}
            </select>
            {selectedFornecedor && (
              <div className="mt-2 text-xs text-gray-400">
                Especialidades: {mockFornecedores.find(f => f.id === selectedFornecedor)?.especialidades.join(', ')}
              </div>
            )}
          </div>

          {/* Seleção de Entregas e Serviços */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Entregas e Serviços
            </label>
            <div className="space-y-3">
              {project.entregas?.map(entrega => (
                <div key={entrega.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  {/* Checkbox da Entrega */}
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id={`entrega-${entrega.id}`}
                      checked={!!selectedEntregas[entrega.id]}
                      onChange={() => handleEntregaToggle(entrega.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`entrega-${entrega.id}`} className="text-white font-medium">
                      {entrega.nome}
                    </label>
                  </div>

                  {/* Serviços da Entrega (quando entrega selecionada) */}
                  {selectedEntregas[entrega.id] && entrega.servicos && (
                    <div className="ml-7 space-y-2">
                      {entrega.servicos.map(servico => (
                        <div key={servico.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`servico-${servico.id}`}
                            checked={selectedEntregas[entrega.id]?.includes(servico.id) || false}
                            onChange={() => handleServicoToggle(entrega.id, servico.id)}
                            className="w-3 h-3 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                          />
                          <label htmlFor={`servico-${servico.id}`} className="text-sm text-gray-300">
                            {servico.nome}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Campos Financeiros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valor
              </label>
              <input
                type="text"
                value={valor}
                onChange={handleValorChange}
                placeholder="R$ 0,00"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Data de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Pagamento
              </label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tipo de Cupom */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Cupom
              </label>
              <select
                value={tipoCupom}
                onChange={(e) => setTipoCupom(e.target.value as 'recibo' | 'nota_fiscal')}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="recibo">Recibo</option>
                <option value="nota_fiscal">Nota Fiscal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFornecedor || Object.keys(selectedEntregas).length === 0}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Fazer Proposta
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de Compra
const PurchaseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  project: Projeto;
}> = ({ isOpen, onClose, project }) => {
  const [selectedBeneficiario, setSelectedBeneficiario] = useState<string>('');
  const [novoBeneficiario, setNovoBeneficiario] = useState({
    nome: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    banco: '',
    agencia: '',
    conta: '',
    chavePix: '',
    tipoChavePix: 'cpf' as 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'
  });
  const [isNewBeneficiario, setIsNewBeneficiario] = useState(false);
  const [valor, setValor] = useState<string>('');
  const [dataPagamento, setDataPagamento] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<'pix_copia_cola' | 'pix_chave' | 'boleto'>('pix_chave');
  const [pixCopiaCola, setPixCopiaCola] = useState<string>('');
  const [linhaDigitavel, setLinhaDigitavel] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [tipoComprovante, setTipoComprovante] = useState<'nota_fiscal' | 'cupom_fiscal'>('nota_fiscal');
  const [chavePix, setChavePix] = useState<string>('');
  const [tipoChavePix, setTipoChavePix] = useState<'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cpf');

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(parseInt(numericValue) / 100);
    return formattedValue;
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValor(formatted);
  };

  const handleComprovanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setComprovante(file);
  };

  const handleSubmit = () => {
    const compraData = {
      beneficiario: isNewBeneficiario ? novoBeneficiario : selectedBeneficiario,
      valor: parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')),
      dataPagamento,
      formaPagamento,
      pixCopiaCola: formaPagamento === 'pix_copia_cola' ? pixCopiaCola : undefined,
      chavePix: formaPagamento === 'pix_chave' ? (isNewBeneficiario ? novoBeneficiario.chavePix : selectedBeneficiarioData?.chavePix || chavePix) : undefined,
      tipoChavePix: formaPagamento === 'pix_chave' ? (isNewBeneficiario ? novoBeneficiario.tipoChavePix : selectedBeneficiarioData?.tipoChavePix || tipoChavePix) : undefined,
      linhaDigitavel: formaPagamento === 'boleto' ? linhaDigitavel : undefined,
      descricao,
      comprovante: comprovante?.name,
      tipoComprovante
    };
    
    console.log('Dados da compra:', compraData);
    // Aqui você pode enviar os dados para a API
    onClose();
  };

  const resetNovoBeneficiario = () => {
    setNovoBeneficiario({
      nome: '',
      cpfCnpj: '',
      email: '',
      telefone: '',
      banco: '',
      agencia: '',
      conta: '',
      chavePix: '',
      tipoChavePix: 'cpf'
    });
  };

  const resetPixFields = () => {
    setChavePix('');
    setTipoChavePix('cpf');
  };

  const handleNewBeneficiarioToggle = (isNew: boolean) => {
    setIsNewBeneficiario(isNew);
    if (!isNew) {
      resetNovoBeneficiario();
    } else {
      resetPixFields();
    }
    setSelectedBeneficiario('');
  };

  if (!isOpen) return null;

  const selectedBeneficiarioData = mockBeneficiarios.find(b => b.id === selectedBeneficiario);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            Realizar Compra
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Seleção/Cadastro de Beneficiário */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Beneficiário
            </label>
            
            {/* Toggle para novo beneficiário */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => handleNewBeneficiarioToggle(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !isNewBeneficiario 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Selecionar Existente
              </button>
              <button
                onClick={() => handleNewBeneficiarioToggle(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isNewBeneficiario 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Cadastrar Novo
              </button>
            </div>

            {/* Seleção de beneficiário existente */}
            {!isNewBeneficiario && (
              <select
                value={selectedBeneficiario}
                onChange={(e) => setSelectedBeneficiario(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um beneficiário...</option>
                {mockBeneficiarios.filter(b => b.ativo).map(beneficiario => (
                  <option key={beneficiario.id} value={beneficiario.id}>
                    {beneficiario.nome} - {beneficiario.cpfCnpj}
                  </option>
                ))}
              </select>
            )}

            {/* Formulário para novo beneficiário */}
            {isNewBeneficiario && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-700/50 p-4 rounded-lg">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={novoBeneficiario.nome}
                  onChange={(e) => setNovoBeneficiario(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="CPF/CNPJ"
                  value={novoBeneficiario.cpfCnpj}
                  onChange={(e) => setNovoBeneficiario(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={novoBeneficiario.email}
                  onChange={(e) => setNovoBeneficiario(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={novoBeneficiario.telefone}
                  onChange={(e) => setNovoBeneficiario(prev => ({ ...prev, telefone: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Mostrar dados do beneficiário selecionado */}
            {selectedBeneficiarioData && (
              <div className="mt-3 p-3 bg-gray-700/30 rounded-lg">
                <div className="text-sm text-gray-400 grid grid-cols-2 gap-2">
                  <span>Email: {selectedBeneficiarioData.email}</span>
                  <span>Telefone: {selectedBeneficiarioData.telefone}</span>
                  {selectedBeneficiarioData.chavePix && (
                    <span className="col-span-2">
                      PIX: {selectedBeneficiarioData.chavePix} ({selectedBeneficiarioData.tipoChavePix})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Campos de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valor
              </label>
              <input
                type="text"
                value={valor}
                onChange={handleValorChange}
                placeholder="R$ 0,00"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Pagamento
              </label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => setFormaPagamento('pix_chave')}
                className={`p-3 rounded-lg border transition-colors ${
                  formaPagamento === 'pix_chave' 
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                PIX (Chave)
              </button>
              <button
                onClick={() => setFormaPagamento('pix_copia_cola')}
                className={`p-3 rounded-lg border transition-colors ${
                  formaPagamento === 'pix_copia_cola' 
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                PIX (Copia e Cola)
              </button>
              <button
                onClick={() => setFormaPagamento('boleto')}
                className={`p-3 rounded-lg border transition-colors ${
                  formaPagamento === 'boleto' 
                    ? 'bg-orange-600/20 border-orange-500 text-orange-400' 
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Boleto
              </button>
            </div>

            {/* Campos específicos por forma de pagamento */}
            {formaPagamento === 'pix_chave' && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      value={
                        isNewBeneficiario 
                          ? novoBeneficiario.chavePix 
                          : selectedBeneficiarioData?.chavePix || chavePix
                      }
                      onChange={(e) => {
                        if (isNewBeneficiario) {
                          setNovoBeneficiario(prev => ({ ...prev, chavePix: e.target.value }))
                        } else if (!selectedBeneficiario) {
                          setChavePix(e.target.value)
                        }
                      }}
                      placeholder="Digite a chave PIX"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      readOnly={!!(selectedBeneficiario && !isNewBeneficiario)}
                    />
                    {selectedBeneficiario && !isNewBeneficiario && (
                      <p className="text-xs text-gray-400 mt-1">Chave do beneficiário selecionado</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo da Chave
                    </label>
                    <select
                      value={
                        isNewBeneficiario 
                          ? novoBeneficiario.tipoChavePix 
                          : selectedBeneficiarioData?.tipoChavePix || tipoChavePix
                      }
                      onChange={(e) => {
                        const newType = e.target.value as 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
                        if (isNewBeneficiario) {
                          setNovoBeneficiario(prev => ({ 
                            ...prev, 
                            tipoChavePix: newType
                          }))
                        } else if (!selectedBeneficiario) {
                          setTipoChavePix(newType)
                        }
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!!(selectedBeneficiario && !isNewBeneficiario)}
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">Email</option>
                      <option value="telefone">Telefone</option>
                      <option value="aleatoria">Chave Aleatória</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {formaPagamento === 'pix_copia_cola' && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  PIX Copia e Cola
                </label>
                <textarea
                  value={pixCopiaCola}
                  onChange={(e) => setPixCopiaCola(e.target.value)}
                  placeholder="Cole aqui o código PIX copia e cola..."
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            {formaPagamento === 'boleto' && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Linha Digitável do Boleto
                </label>
                <input
                  type="text"
                  value={linhaDigitavel}
                  onChange={(e) => setLinhaDigitavel(e.target.value)}
                  placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                />
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o motivo da compra..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Upload de Comprovante */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Comprovante
            </label>
            
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tipoComprovante"
                  value="nota_fiscal"
                  checked={tipoComprovante === 'nota_fiscal'}
                  onChange={(e) => setTipoComprovante(e.target.value as 'nota_fiscal' | 'cupom_fiscal')}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-300">Nota Fiscal</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tipoComprovante"
                  value="cupom_fiscal"
                  checked={tipoComprovante === 'cupom_fiscal'}
                  onChange={(e) => setTipoComprovante(e.target.value as 'nota_fiscal' | 'cupom_fiscal')}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-300">Cupom Fiscal</span>
              </label>
            </div>

            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
              <input
                type="file"
                onChange={handleComprovanteChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="comprovante-upload"
              />
              <label htmlFor="comprovante-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {comprovante ? comprovante.name : 'Clique para fazer upload do comprovante'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG até 5MB
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              (!selectedBeneficiario && !isNewBeneficiario) || 
              !valor || 
              !dataPagamento ||
              (isNewBeneficiario && (!novoBeneficiario.nome || !novoBeneficiario.cpfCnpj))
            }
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Realizar Compra
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de Insumo
const InsumoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  project: Projeto;
}> = ({ isOpen, onClose, project }) => {
  const [tipoInsumo, setTipoInsumo] = useState<'roteiro' | 'arte' | 'storyboard' | 'locucao' | 'audio' | 'trilha' | 'outros'>('roteiro');
  const [nomePersonalizado, setNomePersonalizado] = useState<string>('');
  const [entregaSelecionada, setEntregaSelecionada] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [arquivo, setArquivo] = useState<File | null>(null);

  const tiposInsumo = [
    { value: 'roteiro', label: 'Roteiro' },
    { value: 'arte', label: 'Arte' },
    { value: 'storyboard', label: 'Storyboard' },
    { value: 'locucao', label: 'Locução' },
    { value: 'audio', label: 'Áudio' },
    { value: 'trilha', label: 'Trilha' },
    { value: 'outros', label: 'Outros' }
  ];

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setArquivo(file);
  };

  const handleSubmit = () => {
    const insumoData = {
      tipo: tipoInsumo === 'outros' ? nomePersonalizado : tipoInsumo,
      entrega: entregaSelecionada,
      observacoes,
      arquivo: arquivo?.name,
      dataEnvio: new Date().toISOString(),
      projeto: project.id
    };
    
    console.log('Dados do insumo:', insumoData);
    // Aqui você pode enviar os dados para a API
    onClose();
  };

  const resetForm = () => {
    setTipoInsumo('roteiro');
    setNomePersonalizado('');
    setEntregaSelecionada('');
    setObservacoes('');
    setArquivo(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" />
            Enviar Insumo
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Tipo de Insumo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tipo de Insumo
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tiposInsumo.map((tipo) => (
                <button
                  key={tipo.value}
                  onClick={() => setTipoInsumo(tipo.value as any)}
                  className={`p-3 rounded-lg border transition-colors text-sm ${
                    tipoInsumo === tipo.value 
                      ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>

            {/* Campo personalizado para "Outros" */}
            {tipoInsumo === 'outros' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Insumo
                </label>
                <input
                  type="text"
                  value={nomePersonalizado}
                  onChange={(e) => setNomePersonalizado(e.target.value)}
                  placeholder="Digite o nome do insumo..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Seleção de Entrega */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Entrega Relacionada
            </label>
            <select
              value={entregaSelecionada}
              onChange={(e) => setEntregaSelecionada(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecione uma entrega...</option>
              {project.entregas?.map((entrega) => (
                <option key={entrega.id} value={entrega.id}>
                  {entrega.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre o insumo..."
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Upload de Arquivo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Arquivo do Insumo
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
              <input
                type="file"
                onChange={handleArquivoChange}
                accept="*"
                className="hidden"
                id="insumo-upload"
              />
              <label htmlFor="insumo-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {arquivo ? arquivo.name : 'Clique para fazer upload do arquivo'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Todos os formatos aceitos
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !entregaSelecionada || 
              (tipoInsumo === 'outros' && !nomePersonalizado.trim()) ||
              !arquivo
            }
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Enviar Insumo
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de Informações com Histórico
const InformacoesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  project: Projeto;
}> = ({ isOpen, onClose, project }) => {
  const [novaInformacao, setNovaInformacao] = useState<string>('');
  const [responsavel, setResponsavel] = useState<string>('');

  // Mock do histórico de informações (em uma aplicação real, viria da API)
  const [historicoInformacoes] = useState([
    {
      id: '1',
      data: '2024-10-01T09:00:00',
      responsavel: 'Ana Silva',
      informacao: 'Projeto iniciado conforme cronograma estabelecido. Cliente aprovou o briefing inicial e todos os requisitos foram documentados.'
    },
    {
      id: '2',
      data: '2024-10-03T14:30:00',
      responsavel: 'Carlos Santos',
      informacao: 'Reunião de alinhamento realizada. Pequenos ajustes solicitados pelo cliente na abordagem criativa. Prazo mantido.'
    },
    {
      id: '3',
      data: '2024-10-05T11:15:00',
      responsavel: 'Maria Costa',
      informacao: 'Primeira entrega apresentada e aprovada. Cliente muito satisfeito com a direção do projeto. Próximas etapas definidas.'
    }
  ]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleSubmit = () => {
    if (!novaInformacao.trim()) return;

    const novaEntrada = {
      id: Date.now().toString(),
      data: new Date().toISOString(),
      responsavel: responsavel || 'Usuário Atual',
      informacao: novaInformacao.trim()
    };
    
    console.log('Nova informação adicionada:', novaEntrada);
    
    // Aqui você adicionaria a informação na API
    onClose();
  };

  const resetForm = () => {
    setNovaInformacao('');
    setResponsavel('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-400" />
            Informações do Projeto
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-140px)]">
          {/* Formulário de Nova Informação - Lado Esquerdo */}
          <div className="w-1/2 p-6 border-r border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Adicionar Informação</h3>
            
            {/* Responsável */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Responsável
              </label>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Seu nome (deixe vazio para usar padrão)"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Nova Informação */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Informação
              </label>
              <textarea
                value={novaInformacao}
                onChange={(e) => setNovaInformacao(e.target.value)}
                placeholder="Adicione informações sobre o projeto, atualizações, observações importantes..."
                rows={8}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {novaInformacao.length} caracteres
                </span>
                <span className="text-xs text-gray-400">
                  {novaInformacao.trim().split(/\s+/).filter(word => word.length > 0).length} palavras
                </span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!novaInformacao.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Adicionar Informação
              </button>
            </div>
          </div>

          {/* Histórico de Informações - Lado Direito */}
          <div className="w-1/2 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Histórico de Informações</h3>
            
            <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-280px)]">
              {historicoInformacoes.reverse().map((entrada, index) => {
                const isRecent = index === 0;
                
                return (
                  <div 
                    key={entrada.id}
                    className={`relative pl-6 pb-4 ${
                      index !== historicoInformacoes.length - 1 ? 'border-l-2 border-gray-600' : ''
                    }`}
                  >
                    {/* Marcador da Timeline */}
                    <div 
                      className={`absolute left-[-5px] top-2 w-3 h-3 rounded-full border-2 border-gray-800 bg-blue-500 ${
                        isRecent ? 'animate-pulse' : ''
                      }`}
                    />
                    
                    {/* Conteúdo da Entrada */}
                    <div className={`bg-gray-700/50 rounded-lg p-4 ${
                      isRecent ? 'ring-1 ring-blue-500/50' : ''
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-white">
                            Nova Informação
                          </span>
                          {isRecent && (
                            <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full">
                              Recente
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(entrada.data)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                        {entrada.informacao}
                      </p>
                      
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {entrada.responsavel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProjectDetail({
  project,
  router,
  editingServiceId,
  onStartEditing,
  onStopEditing,
  onViewTask,
  onCompleteTask,
  onBackToList,
  onDeliveryClick
}: ProjectDetailProps) {
  const [expanded, setExpanded] = useState(true);
  const [showContractingModal, setShowContractingModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showInsumoModal, setShowInsumoModal] = useState(false);
  const [showInformacoesModal, setShowInformacoesModal] = useState(false);

  // Mock do histórico de informações para exibir na timeline
  const historicoInformacoes = [
    {
      id: '1',
      data: '2024-10-01T09:00:00',
      responsavel: 'Ana Silva',
      informacao: 'Projeto iniciado conforme cronograma estabelecido. Cliente aprovou o briefing inicial e todos os requisitos foram documentados.'
    },
    {
      id: '2',
      data: '2024-10-03T14:30:00',
      responsavel: 'Carlos Santos',
      informacao: 'Reunião de alinhamento realizada. Pequenos ajustes solicitados pelo cliente na abordagem criativa. Prazo mantido.'
    },
    {
      id: '3',
      data: '2024-10-05T11:15:00',
      responsavel: 'Maria Costa',
      informacao: 'Primeira entrega apresentada e aprovada. Cliente muito satisfeito com a direção do projeto. Próximas etapas definidas.'
    }
  ];

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const [timeLeft, setTimeLeft] = useState({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    isUndefined: false
  });

  // Countdown timer
  const calculateTimeLeft = () => {
    // Verificar se há deadline definido (mais robusta)
    const hasValidDeadline = project.data_entrega_estimada && project.data_entrega_estimada !== null && project.data_entrega_estimada !== '' ||
                             project.prazo_data && project.prazo_data !== null && project.prazo_data !== '';
    
    if (!hasValidDeadline) {
      return {
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0,
        isUndefined: true
      };
    }

    // Usar deadline válida ou retornar undefined
    const deadlineValida = project.data_entrega_estimada || project.prazo_data;
    if (!deadlineValida) {
      return {
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0,
        isUndefined: true
      };
    }

    const dataEntrega = new Date(deadlineValida);
    const agora = new Date();
    const diferenca = dataEntrega.getTime() - agora.getTime();

    if (diferenca > 0) {
      return {
        dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((diferenca % (1000 * 60)) / 1000),
        isUndefined: false
      };
    }

    return { dias: 0, horas: 0, minutos: 0, segundos: 0, isUndefined: false };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [project.data_entrega_estimada, project.prazo_data]);

  // Funções de cálculo
  const calcularProgressoTarefas = () => {
    let totalTarefas = 0;
    let tarefasConcluidas = 0;
    
    project.entregas?.forEach(entrega => {
      entrega.servicos?.forEach(servico => {
        totalTarefas += servico.tarefas?.length || 0;
        tarefasConcluidas += servico.tarefas?.filter(t => t.status === 'concluida').length || 0;
      });
    });
    
    return totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;
  };

  const calcularConsumoOrcamento = () => {
    return project.progresso_percentual * 0.8;
  };

  const calcularConsumoPrazo = () => {
    const deadlineValida = project.data_entrega_estimada || project.prazo_data;
    if (!deadlineValida) return 0; // Sem deadline, não há consumo de prazo
    
    const dataAtual = new Date();
    const dataEntrega = new Date(deadlineValida);
    
    const dataInicio = new Date(dataEntrega);
    dataInicio.setDate(dataInicio.getDate() - project.prazo_dias);
    
    const tempoTotal = dataEntrega.getTime() - dataInicio.getTime();
    const tempoDecorrido = dataAtual.getTime() - dataInicio.getTime();
    
    if (tempoDecorrido <= 0) return 0;
    if (tempoDecorrido >= tempoTotal) return 100;
    
    return (tempoDecorrido / tempoTotal) * 100;
  };

  const formatarData = (dataStr: string) => {
    const dataEntrega = new Date(dataStr);
    return dataEntrega.toLocaleDateString('pt-BR');
  };

  const calcularDataAprovacao = () => {
    // Usar data real de aprovação do orçamento se disponível
    if (project.orcamento_aprovado_at) {
      try {
        const dataAprovacao = new Date(project.orcamento_aprovado_at);
        // Formato: dd/mm/yyyy HH:mm:ss
        const dia = dataAprovacao.getDate().toString().padStart(2, '0');
        const mes = (dataAprovacao.getMonth() + 1).toString().padStart(2, '0');
        const ano = dataAprovacao.getFullYear();
        const horas = dataAprovacao.getHours().toString().padStart(2, '0');
        const minutos = dataAprovacao.getMinutes().toString().padStart(2, '0');
        const segundos = dataAprovacao.getSeconds().toString().padStart(2, '0');
        
        return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
      } catch (error) {
        console.warn('Erro ao formatar orcamento_aprovado_at:', error);
      }
    }
    
    // Fallback para cálculo estimado baseado no deadline
    const deadlineValida = project.data_entrega_estimada || project.prazo_data;
    if (!deadlineValida) return 'N/A'; // Sem deadline, não há data de aprovação
    
    const dataEntrega = new Date(deadlineValida);
    dataEntrega.setDate(dataEntrega.getDate() - (project.prazo_dias || 30));
    return dataEntrega.toLocaleDateString('pt-BR');
  };

  const progressoTarefas = calcularProgressoTarefas();
  const consumoOrcamento = calcularConsumoOrcamento();
  const consumoPrazo = calcularConsumoPrazo();

  // Cálculos para os indicadores numéricos
  const calcularTotalTarefas = () => {
    let totalTarefas = 0;
    let tarefasConcluidas = 0;
    
    project.entregas?.forEach(entrega => {
      entrega.servicos?.forEach(servico => {
        totalTarefas += servico.tarefas?.length || 0;
        tarefasConcluidas += servico.tarefas?.filter(t => t.status === 'concluida').length || 0;
      });
    });
    
    return { concluidas: tarefasConcluidas, total: totalTarefas };
  };

  const calcularCustoConsumido = () => {
    const custoConsumido = (project.valor_total * consumoOrcamento) / 100;
    return { consumido: custoConsumido, total: project.valor_total };
  };

  const calcularHorasConsumidas = () => {
    const totalHoras = project.prazo_dias * 8;
    const horasConsumidas = (totalHoras * consumoPrazo) / 100;
    return { consumidas: Math.round(horasConsumidas), total: totalHoras };
  };

  // Handler para voltar ao dashboard
  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBackToList();
  };

  const tarefasInfo = calcularTotalTarefas();
  const custoInfo = calcularCustoConsumido();
  const horasInfo = calcularHorasConsumidas();

  return (
    <div className="min-h-full p-6">
      <div className="bg-gradient-to-br from-gray-900 to-gray-850 rounded-xl border border-gray-700 shadow-xl mb-6">
        <div className="p-4 transition-colors rounded-t-xl">
        {/* Cabeçalho Principal */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={handleBackClick}
              className="p-1 hover:bg-gray-700 rounded transition-colors mt-1"
              title="Voltar ao dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {/* Título do Projeto */}
                <h2 className="text-xl font-bold text-white">
                  {project.titulo || project.demanda_codigo}
                </h2>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Building className="w-3 h-3 text-blue-400" />
                    <span className="text-xs font-medium text-gray-400">Anunciante</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {project.anunciante_nome || project.cliente_nome}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Lightbulb className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-medium text-gray-400">Agência</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {project.agencia_nome || 'Agência não informada'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Megaphone className="w-3 h-3 text-orange-400" />
                    <span className="text-xs font-medium text-gray-400">Motivo</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {project.motivo_titulo || project.motivo}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <User className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-medium text-gray-400">Solicitante</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {project.solicitante_nome || 'Não informado'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <User className="w-3 h-3 text-cyan-400" />
                    <span className="text-xs font-medium text-gray-400">Demandante</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {project.demandante_nome || 'Não informado'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Building className="w-3 h-3 text-orange-400" />
                    <span className="text-xs font-medium text-gray-400">Emissor</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {project.emissor_nome || 'Não informado'}
                  </p>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-blue-400" />
                    <span className="text-xs font-medium text-gray-400">Aprovação Orçamento</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {calcularDataAprovacao()}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-medium text-gray-400">Entrega Estimada</span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {project.data_entrega_estimada ? formatarData(project.data_entrega_estimada) : (project.prazo_data ? formatarData(project.prazo_data) : 'Não informado')}
                  </p>
                </div>

                <div>
                  {/* Espaço vazio para manter alinhamento */}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Orçamento de Produção</div>
            <div className="text-lg font-bold text-green-400 mb-2">
              R$ {project.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-400">Prazo de Pagamento: {project.prazo_dias} dias</div>
          </div>
        </div>

        {/* Seção Compacta de Pendências e Prazo - Uma linha - Margem mínima */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            {/* Lado Esquerdo: Pendências */}
            <div className="flex items-center gap-6">
              <h4 className="text-sm font-medium text-gray-400">Pendências</h4>
              <div className="flex items-center gap-4">
                {/* Entregas Pendentes */}
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3 text-blue-400" />
                  <span className="text-sm font-bold text-white">
                    {project.entregas?.filter(e => e.status !== 'concluida').length || 0}
                  </span>
                  <span className="text-xs text-gray-500">entregas</span>
                </div>
                
                {/* Serviços Pendentes */}
                <div className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-green-400" />
                  <span className="text-sm font-bold text-white">
                    {project.entregas?.reduce((acc, e) => 
                      acc + (e.servicos?.filter(s => s.status !== 'concluida').length || 0), 0) || 0}
                  </span>
                  <span className="text-xs text-gray-500">serviços</span>
                </div>
                
                {/* Tarefas Pendentes */}
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-yellow-400" />
                  <span className="text-sm font-bold text-white">
                    {project.entregas?.reduce((acc, e) => 
                      acc + (e.servicos?.reduce((sAcc, s) => 
                        sAcc + (s.tarefas?.filter(t => t.status !== 'concluida').length || 0), 0) || 0), 0) || 0}
                  </span>
                  <span className="text-xs text-gray-500">tarefas</span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Prazo Restante */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className={`text-lg font-bold ${timeLeft.isUndefined ? 'text-gray-400' : 'text-white'}`}>
                {timeLeft.isUndefined ? 'Indefinido' : (
                  `${timeLeft.dias}D ${timeLeft.horas.toString().padStart(2, '0')}:${timeLeft.minutos.toString().padStart(2, '0')}:${timeLeft.segundos.toString().padStart(2, '0')}`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Três Barras de Progresso - Uma sobre a outra - Margem mínima */}
        <div className="space-y-4 mt-4">
          {/* Progresso em Tarefas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Progresso Tarefas</span>
              </div>
              <span className="text-sm">
                <span className="text-xs text-gray-400">{tarefasInfo.concluidas}/{tarefasInfo.total}</span> • <span className="font-bold text-blue-400">{progressoTarefas.toFixed(0)}%</span>
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-2.5 rounded-full transition-all duration-300 relative"
                style={{ width: `${progressoTarefas}%` }}
              >
                <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Custo de Produção Consumido */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-gray-300">Custo Consumido</span>
              </div>
              <span className="text-sm">
                <span className="text-xs text-gray-400">R$ {(custoInfo.consumido/1000).toFixed(0)}k/{(custoInfo.total/1000).toFixed(0)}k</span> • <span className="font-bold text-green-400">{consumoOrcamento.toFixed(0)}%</span>
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-400 h-2.5 rounded-full transition-all duration-300 relative"
                style={{ width: `${consumoOrcamento}%` }}
              >
                <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Prazo Consumido */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-gray-300">Prazo Consumido</span>
              </div>
              <span className="text-sm">
                <span className="text-xs text-gray-400">{horasInfo.consumidas}/{horasInfo.total} H</span> • <span className="font-bold text-orange-400">{consumoPrazo.toFixed(0)}%</span>
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all duration-300 relative ${
                  consumoPrazo > 90 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                  consumoPrazo > 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                  'bg-gradient-to-r from-orange-500 to-orange-400'
                }`}
                style={{ width: `${Math.min(consumoPrazo, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="p-6 pt-0">
          {/* Linha exclusiva para os botões */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowContractingModal(true)}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Fazer Proposta
              </button>
              <button 
                onClick={() => setShowPurchaseModal(true)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Comprar
              </button>
              <button 
                onClick={() => setShowInsumoModal(true)}
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Insumo
              </button>
            </div>
          </div>

          {/* Timeline de Informações */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Informações do Projeto
              </h3>
              <button 
                onClick={() => setShowInformacoesModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            {/* Timeline Livre */}
            <div className="space-y-4">
              {historicoInformacoes.slice().reverse().map((entrada, index) => {
                const isRecent = index === 0;
                
                return (
                  <div 
                    key={entrada.id}
                    className={`relative pl-6 ${
                      index !== historicoInformacoes.length - 1 ? 'pb-4' : 'pb-2'
                    }`}
                  >
                    {/* Linha conectora */}
                    {index !== historicoInformacoes.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-gray-600" />
                    )}
                    
                    {/* Marcador da Timeline */}
                    <div 
                      className={`absolute left-[6px] top-2 w-3 h-3 rounded-full border-2 border-gray-900 bg-blue-500 shadow-lg ${
                        isRecent ? 'animate-pulse ring-2 ring-blue-400/30' : ''
                      }`}
                    />
                    
                    {/* Card da Entrada */}
                    <div className={`bg-gray-800 border rounded-lg p-4 shadow-lg transition-all hover:shadow-xl ${
                      isRecent 
                        ? 'border-blue-500/50 bg-gradient-to-r from-blue-900/20 to-gray-800' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-white">
                            {entrada.responsavel}
                          </span>
                          {isRecent && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                              Mais Recente
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
                          {formatDateShort(entrada.data)}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 leading-relaxed">
                        {entrada.informacao}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {/* Estado vazio */}
              {historicoInformacoes.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="text-white font-medium mb-2">Nenhuma informação ainda</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Comece adicionando informações importantes sobre este projeto
                  </p>
                  <button 
                    onClick={() => setShowInformacoesModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Primeira Informação
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Seção Entregas do Projeto */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Entregas do Projeto</h3>
          </div>
          
          {/* Lista de Entregas - versão reduzida ou completa - Margem mínima */}
          <div className="max-h-[600px] overflow-y-auto">
            {/* Versão reduzida para lista de entregas */}
            <div className="space-y-2">
              {project.entregas?.map(delivery => (
                <DeliveryListItem
                  key={delivery.id}
                  delivery={delivery}
                  onClick={onDeliveryClick}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contratação */}
      <ContratingModal
        isOpen={showContractingModal}
        onClose={() => setShowContractingModal(false)}
        project={project}
      />

      {/* Modal de Compra */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        project={project}
      />

      {/* Modal de Insumo */}
      <InsumoModal
        isOpen={showInsumoModal}
        onClose={() => setShowInsumoModal(false)}
        project={project}
      />

      {/* Modal de Informações */}
      <InformacoesModal
        isOpen={showInformacoesModal}
        onClose={() => setShowInformacoesModal(false)}
        project={project}
      />
    </div>
    </div>
  );
}