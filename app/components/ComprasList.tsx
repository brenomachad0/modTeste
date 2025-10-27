/**
 * ComprasList - Lista de compras do projeto
 * Exibe todas as compras com total na parte inferior
 */

'use client';

import { DollarSign, Calendar, User, FileText, CheckCircle, Clock, Upload, AlertCircle, RefreshCw } from 'lucide-react';

interface Compra {
  compra_id: string;
  compra_beneficiario_nome: string;
  compra_data_pagamento: string;
  compra_valor: number;
  compra_meio_pagamento: {
    meio_pagamento_id: string;
    meio_pagamento_nome: string;
    meio_pagamento_tpag: number;
    meio_pagamento_status: any;
  };
  compra_pix?: string;
  compra_pix_chave?: string;
  compra_pix_tipo?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  compra_descricao: string;
  compra_centro_custo?: {
    centro_custo_id: string;
    centro_custo_nome: string;
    centro_custo_tipo: 'fixo' | 'variavel';
    centro_custo_created_at: string;
    centro_custo_created_pessoa: string;
  };
  compra_status: 'criado' | 'pago' | 'cancelado';
  compra_demanda_id: string;
  compra_demanda_tipo: string;
  compra_demanda_codigo: string;
  compra_created_at: string;
  compra_created_pessoa: string;
  compra_comprovante?: string; // URL do comprovante
  compra_tem_comprovante?: boolean; // Flag se já foi enviado
  compra_tipo?: 'compra' | 'reembolso'; // Tipo da compra
}

interface ComprasListProps {
  compras: Compra[];
  onAddCompra: () => void;
  onAddReembolso: () => void;
  onCompraClick?: (compra: Compra) => void;
}

export default function ComprasList({ compras, onAddCompra, onAddReembolso, onCompraClick }: ComprasListProps) {
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

  const calcularTotal = () => {
    return compras.reduce((acc, compra) => acc + compra.compra_valor, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'text-green-400 bg-green-500/10';
      case 'cancelado':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-yellow-400 bg-yellow-500/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago':
        return 'Pago';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Aguardando';
    }
  };

  if (compras.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="w-10 h-10 text-gray-600 mx-auto mb-2" />
        <h4 className="text-white text-sm font-medium mb-1">Nenhuma compra registrada</h4>
        <p className="text-gray-400 text-xs mb-4">
          Registre as compras e reembolsos relacionados a este projeto
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onAddCompra}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
          >
            <DollarSign className="w-3 h-3" />
            Nova Compra
          </button>
          <button
            onClick={onAddReembolso}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Novo Reembolso
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header com botões de adicionar */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Compras Registradas ({compras.length})
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddCompra}
            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center gap-1"
          >
            <DollarSign className="w-3 h-3" />
            Nova Compra
          </button>
          <button
            onClick={onAddReembolso}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Reembolso
          </button>
        </div>
      </div>

      {/* Lista de compras */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {compras.map((compra) => (
          <div
            key={compra.compra_id}
            onClick={() => onCompraClick?.(compra)}
            className="bg-gray-700/30 border border-gray-600 rounded-lg p-3 hover:bg-gray-700/50 transition-colors cursor-pointer"
          >
            {/* Linha 1: Descrição e Badge de Reembolso */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-white font-medium line-clamp-1">
                  {compra.compra_descricao || 'Sem descrição'}
                </p>
                {compra.compra_tipo === 'reembolso' && (
                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-medium flex-shrink-0">
                    REEMBOLSO
                  </span>
                )}
              </div>
            </div>

            {/* Linha 2: Beneficiário, Data | Status, Valor */}
            <div className="flex items-center justify-between">
              {/* Esquerda: Beneficiário e Data */}
              <div className="flex items-center gap-3 text-xs text-gray-300">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-400" />
                  <span className="font-medium">{compra.compra_beneficiario_nome}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatarData(compra.compra_data_pagamento)}</span>
                </div>
              </div>

              {/* Direita: Status de Comprovante, Status de Pagamento e Valor */}
              <div className="flex items-center gap-2">
                {/* Status de comprovante */}
                {compra.compra_tem_comprovante ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                )}
                
                {/* Status de pagamento */}
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(compra.compra_status)}`}>
                  {getStatusLabel(compra.compra_status)}
                </span>

                {/* Valor */}
                <span className="text-sm font-bold text-green-400 ml-1">
                  {formatarValor(compra.compra_valor)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total na parte inferior */}
      <div className="mt-4 pt-3 border-t border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Total de Compras</span>
          <span className="text-lg font-bold text-green-400">
            {formatarValor(calcularTotal())}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
          <span>{compras.filter(c => c.compra_status === 'pago').length} pagas</span>
          <span>{compras.filter(c => c.compra_status === 'criado').length} pendentes</span>
          <span>{compras.filter(c => c.compra_status === 'cancelado').length} canceladas</span>
        </div>
      </div>
    </div>
  );
}
