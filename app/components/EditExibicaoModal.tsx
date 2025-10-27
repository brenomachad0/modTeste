'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface ExibicaoData {
  territorio?: string;
  veiculos?: string[];
  periodo_utilizacao?: string;
  duracao?: string;
  idioma_original?: string;
}

interface EditExibicaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExibicaoData) => void;
  initialData: ExibicaoData;
}

const TERRITORIO_OPTIONS = ['Fechado', 'Regional', 'Nacional', 'Internacional'];
const VEICULOS_OPTIONS = ['Cinema', 'Concorrência', 'Evento', 'Internet', 'Intranet', 'Redes Sociais', 'Youtube', 'Live', 'TV'];
const PERIODO_MEDIDA_OPTIONS = ['dias', 'semanas', 'meses', 'anos'];
const DURACAO_TIPO_OPTIONS = ['Exatamente', 'Até', 'Aproximadamente'];
const DURACAO_MEDIDA_OPTIONS = ['segundos', 'minutos'];

export default function EditExibicaoModal({ isOpen, onClose, onSave, initialData }: EditExibicaoModalProps) {
  const [territorio, setTerritorio] = useState('');
  const [veiculos, setVeiculos] = useState<string[]>([]);
  const [periodoQuantidade, setPeriodoQuantidade] = useState('');
  const [periodoMedida, setPeriodoMedida] = useState('dias');
  const [duracaoTipo, setDuracaoTipo] = useState('Exatamente');
  const [duracaoQuantidade, setDuracaoQuantidade] = useState('');
  const [duracaoMedida, setDuracaoMedida] = useState('segundos');
  const [idioma, setIdioma] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setTerritorio(initialData.territorio || '');
      
      // Converter veiculos se vier como string
      if (initialData.veiculos) {
        if (Array.isArray(initialData.veiculos)) {
          setVeiculos(initialData.veiculos);
        } else if (typeof initialData.veiculos === 'string') {
          setVeiculos((initialData.veiculos as string).split(',').map((s: string) => s.trim()));
        } else {
          setVeiculos([]);
        }
      } else {
        setVeiculos([]);
      }
      
      setIdioma(initialData.idioma_original || '');

      // Parse período_utilizacao (formato: "10 dias")
      if (initialData.periodo_utilizacao) {
        const match = initialData.periodo_utilizacao.match(/^(\d+)\s+(.+)$/);
        if (match) {
          setPeriodoQuantidade(match[1]);
          setPeriodoMedida(match[2]);
        }
      }

      // Parse duracao (formato: "Exatamente 30 segundos")
      if (initialData.duracao) {
        const match = initialData.duracao.match(/^(.+?)\s+(\d+)\s+(.+)$/);
        if (match) {
          setDuracaoTipo(match[1]);
          setDuracaoQuantidade(match[2]);
          setDuracaoMedida(match[3]);
        }
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const toggleVeiculo = (veiculo: string) => {
    if (veiculos.includes(veiculo)) {
      setVeiculos(veiculos.filter(v => v !== veiculo));
    } else {
      setVeiculos([...veiculos, veiculo]);
    }
  };

  const handleSave = () => {
    const periodo = periodoQuantidade && periodoMedida 
      ? `${periodoQuantidade} ${periodoMedida}` 
      : '';
    
    const duracao = duracaoQuantidade && duracaoMedida 
      ? `${duracaoTipo} ${duracaoQuantidade} ${duracaoMedida}` 
      : '';

    onSave({
      territorio,
      veiculos,
      periodo_utilizacao: periodo,
      duracao,
      idioma_original: idioma,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-semibold text-white">Editar Exibição</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Território */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Território</label>
            <select
              value={territorio}
              onChange={(e) => setTerritorio(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Selecione...</option>
              {TERRITORIO_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Veículos de Divulgação */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Veículos de Divulgação</label>
            <div className="flex flex-wrap gap-2">
              {VEICULOS_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => toggleVeiculo(option)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    veiculos.includes(option)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Período de Utilização */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Período de Utilização</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="1"
                value={periodoQuantidade}
                onChange={(e) => setPeriodoQuantidade(e.target.value)}
                placeholder="Quantidade"
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <select
                value={periodoMedida}
                onChange={(e) => setPeriodoMedida(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                {PERIODO_MEDIDA_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duração */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duração</label>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={duracaoTipo}
                onChange={(e) => setDuracaoTipo(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                {DURACAO_TIPO_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={duracaoQuantidade}
                onChange={(e) => setDuracaoQuantidade(e.target.value)}
                placeholder="Qtd"
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <select
                value={duracaoMedida}
                onChange={(e) => setDuracaoMedida(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                {DURACAO_MEDIDA_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Idioma Original */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Idioma Original</label>
            <input
              type="text"
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              placeholder="Ex: Português, Inglês, Espanhol..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
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
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Exibição
          </button>
        </div>
      </div>
    </div>
  );
}
