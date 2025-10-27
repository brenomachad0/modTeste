'use client';

import { useState } from 'react';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react';

interface CriarCronogramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCriar: (dados: CronogramaFormData) => void;
  totalEntregas: number;
}

export interface CronogramaFormData {
  nome: string;
  data_inicio: string;
  hora_inicio: string;
  data_fim: string;
  hora_fim: string;
  prazo_aprovacao_cliente: number; // em horas
  prazo_aprovacao_supervisao: number; // em horas
}

export default function CriarCronogramaModal({
  isOpen,
  onClose,
  onCriar,
  totalEntregas,
}: CriarCronogramaModalProps) {
  const [formData, setFormData] = useState<CronogramaFormData>({
    nome: '',
    data_inicio: '',
    hora_inicio: '09:00',
    data_fim: '',
    hora_fim: '18:00',
    prazo_aprovacao_cliente: 72, // 3 dias em horas
    prazo_aprovacao_supervisao: 24, // 1 dia em horas
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.data_inicio) {
      newErrors.data_inicio = 'Data de início é obrigatória';
    }
    
    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'Hora de início é obrigatória';
    }
    
    if (!formData.data_fim) {
      newErrors.data_fim = 'Data final é obrigatória';
    }
    
    if (!formData.hora_fim) {
      newErrors.hora_fim = 'Hora final é obrigatória';
    }
    
    if (formData.data_inicio && formData.hora_inicio && formData.data_fim && formData.hora_fim) {
      const inicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}`);
      const fim = new Date(`${formData.data_fim}T${formData.hora_fim}`);
      
      if (fim <= inicio) {
        newErrors.data_fim = 'Data/hora final deve ser posterior à data/hora de início';
      }
    }
    
    if (formData.prazo_aprovacao_cliente < 0) {
      newErrors.prazo_aprovacao_cliente = 'Prazo não pode ser negativo';
    }
    
    if (formData.prazo_aprovacao_supervisao < 0) {
      newErrors.prazo_aprovacao_supervisao = 'Prazo não pode ser negativo';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onCriar(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      nome: '',
      data_inicio: '',
      hora_inicio: '09:00',
      data_fim: '',
      hora_fim: '18:00',
      prazo_aprovacao_cliente: 72,
      prazo_aprovacao_supervisao: 24,
    });
    setErrors({});
    onClose();
  };

  const calcularDuracao = () => {
    if (!formData.data_inicio || !formData.hora_inicio || !formData.data_fim || !formData.hora_fim) return null;
    
    const inicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}`);
    const fim = new Date(`${formData.data_fim}T${formData.hora_fim}`);
    const diferencaHoras = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60));
    
    return diferencaHoras > 0 ? diferencaHoras : null;
  };

  const duracao = calcularDuracao();
  const duracaoDias = duracao ? Math.floor(duracao / 24) : 0;
  const duracaoHorasRestantes = duracao ? duracao % 24 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Criar Novo Cronograma
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure os parâmetros para gerar o cronograma Gantt
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Info do projeto */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-400">
              ℹ️ Este cronograma será baseado em <strong>{totalEntregas} entrega{totalEntregas !== 1 ? 's' : ''}</strong> planejada{totalEntregas !== 1 ? 's' : ''} no projeto
            </p>
          </div>

          {/* Nome do cronograma */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nome do Cronograma *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Cronograma Completo v1"
              className={`w-full px-3 py-2 bg-gray-800 border ${
                errors.nome ? 'border-red-500' : 'border-gray-600'
              } rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors`}
            />
            {errors.nome && (
              <p className="text-xs text-red-400 mt-1">{errors.nome}</p>
            )}
          </div>

          {/* Datas e Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Data de Início *
              </label>
              <input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.data_inicio ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
              {errors.data_inicio && (
                <p className="text-xs text-red-400 mt-1">{errors.data_inicio}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Hora de Início *
              </label>
              <input
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.hora_inicio ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
              {errors.hora_inicio && (
                <p className="text-xs text-red-400 mt-1">{errors.hora_inicio}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Data Final *
              </label>
              <input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.data_fim ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
              {errors.data_fim && (
                <p className="text-xs text-red-400 mt-1">{errors.data_fim}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Hora Final *
              </label>
              <input
                type="time"
                value={formData.hora_fim}
                onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.hora_fim ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
              {errors.hora_fim && (
                <p className="text-xs text-red-400 mt-1">{errors.hora_fim}</p>
              )}
            </div>
          </div>

          {/* Duração calculada */}
          {duracao !== null && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">
                Duração total: <strong className="text-white">
                  {duracaoDias > 0 && `${duracaoDias}d `}
                  {duracaoHorasRestantes}h
                </strong> ({duracao} horas)
              </span>
            </div>
          )}

          {/* Prazos de aprovação em horas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Prazo Aprovação Cliente (horas) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.prazo_aprovacao_cliente}
                onChange={(e) => setFormData({ ...formData, prazo_aprovacao_cliente: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.prazo_aprovacao_cliente ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
              {errors.prazo_aprovacao_cliente && (
                <p className="text-xs text-red-400 mt-1">{errors.prazo_aprovacao_cliente}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.prazo_aprovacao_cliente > 0 && 
                  `≈ ${Math.floor(formData.prazo_aprovacao_cliente / 24)}d ${formData.prazo_aprovacao_cliente % 24}h`
                } - Tempo para cliente revisar cada entrega
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Prazo Aprovação Supervisão (horas) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.prazo_aprovacao_supervisao}
                onChange={(e) => setFormData({ ...formData, prazo_aprovacao_supervisao: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 bg-gray-800 border ${
                  errors.prazo_aprovacao_supervisao ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
              {errors.prazo_aprovacao_supervisao && (
                <p className="text-xs text-red-400 mt-1">{errors.prazo_aprovacao_supervisao}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.prazo_aprovacao_supervisao > 0 && 
                  `≈ ${Math.floor(formData.prazo_aprovacao_supervisao / 24)}d ${formData.prazo_aprovacao_supervisao % 24}h`
                } - Tempo para supervisão revisar
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Gerar Cronograma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
