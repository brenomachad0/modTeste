'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

interface BriefingData {
  uso?: string;
  estilo?: string;
  objetivos?: string;
  tom?: string;
  tecnicas?: {
    fotografia?: string[];
    gravacao?: string[];
    audio?: string[];
    ilustracao?: string[];
    animacao?: string[];
    motion?: string[];
  };
  estrategia?: string;
  referencias?: string[];
}

interface EditBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BriefingData) => void;
  initialData: BriefingData;
}

const USO_OPTIONS = ['Anuncio', 'Apresentação', 'Aula', 'Banner', 'Cartaz', 'Conteudo Digital', 'Plot', 'Propaganda', 'Publicidade', 'Varejo', 'Vinheta', 'Vlog'];
const ESTILO_OPTIONS = ['After Movie', 'ASMR', 'Case', 'Depoimento', 'Entrevista', 'Institucional', 'Manifesto', 'Motivacional', 'Oferta', 'Podcast', 'Pronunciamento', 'Save the Date', 'SlideShow', 'Teaser', 'Tutorial', 'WhiteBoard'];
const OBJETIVO_OPTIONS = ['Venda', 'Utilidade pública', 'Solução', 'Geração de leads', 'Converter lead', 'Esquentar lead', 'Educação', 'Engajamento', 'Gestão', 'Marca'];
const TOM_OPTIONS = ['Inspirador', 'Confortante', 'Energético', 'Luxuoso', 'Divertido', 'Informativo', 'Sedutor', 'Autêntico', 'Provocativo', 'Nostálgico'];

const TECNICAS_OPTIONS = {
  fotografia: ['Retrato / Portrait', 'Longa Exposição', 'Rua', 'Aérea', 'Produto', 'HDR (High Dynamic Range)', 'Preto e Branco', 'Panorama'],
  gravacao: ['Hyperlapse', 'Time-Lapse', 'Slow Motion', 'Steadicam', 'Drone Shot', 'POV (Point of View)', 'Crane Shot', 'Handheld'],
  audio: ['Spot', 'Jingle', 'Locução', 'Foley', 'Sound Design', 'ADR', 'Ambient Sound', 'Trilha Pesquisada', 'Trilha Original', 'Mixagem', 'Limpeza de Áudio', 'Locução Especial', 'Mixagem de Áudio Especial 3D'],
  ilustracao: ['Desenho à Mão Livre', 'Arte Vetorial', 'Pintura Digital', 'Gravura', 'Colagem', 'Aquarela', 'Arte 3D', 'Pixel Art', 'Ilustração Flat', 'Art Brush', 'Fotomanipulação', 'Low Poly', 'Isométrico', 'Digital Inking'],
  animacao: ['2D Tradicional', '3D', '2.5D', 'Stop-Motion', 'Rotoscopia', 'PaperCraft', 'Areia'],
  motion: ['All-Type (Kinetic Typography)', '3D', 'Colagem', 'Infográfico', 'Vetorial', 'Letreiro', 'Simulação de Fluidos', 'Crowd Simulation', 'Procedural Animation'],
};

export default function EditBriefingModal({ isOpen, onClose, onSave, initialData }: EditBriefingModalProps) {
  const [uso, setUso] = useState<string[]>([]);
  const [estilo, setEstilo] = useState<string[]>([]);
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [tom, setTom] = useState<string[]>([]);
  const [tecnicas, setTecnicas] = useState<{
    fotografia: string[];
    gravacao: string[];
    audio: string[];
    ilustracao: string[];
    animacao: string[];
    motion: string[];
  }>({
    fotografia: [],
    gravacao: [],
    audio: [],
    ilustracao: [],
    animacao: [],
    motion: [],
  });
  const [tecnicasDescricao, setTecnicasDescricao] = useState<{
    fotografia: string;
    gravacao: string;
    audio: string;
    ilustracao: string;
    animacao: string;
    motion: string;
  }>({
    fotografia: '',
    gravacao: '',
    audio: '',
    ilustracao: '',
    animacao: '',
    motion: '',
  });
  const [estrategia, setEstrategia] = useState('');
  const [referencias, setReferencias] = useState<string[]>([]);
  const [novaReferencia, setNovaReferencia] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      // Helper para converter string ou array em array
      const toArray = (value: any): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').map(s => s.trim());
        return [];
      };

      setUso(toArray(initialData.uso));
      setEstilo(toArray(initialData.estilo));
      setObjetivos(toArray(initialData.objetivos));
      setTom(toArray(initialData.tom));
      setTecnicas({
        fotografia: initialData.tecnicas?.fotografia || [],
        gravacao: initialData.tecnicas?.gravacao || [],
        audio: initialData.tecnicas?.audio || [],
        ilustracao: initialData.tecnicas?.ilustracao || [],
        animacao: initialData.tecnicas?.animacao || [],
        motion: initialData.tecnicas?.motion || [],
      });
      setEstrategia(initialData.estrategia || '');
      setReferencias(initialData.referencias || []);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const toggleTecnica = (categoria: keyof typeof tecnicas, item: string) => {
    const current = tecnicas[categoria];
    if (current.includes(item)) {
      setTecnicas({ ...tecnicas, [categoria]: current.filter(i => i !== item) });
    } else {
      setTecnicas({ ...tecnicas, [categoria]: [...current, item] });
    }
  };

  const handleAddReferencia = () => {
    if (novaReferencia.trim()) {
      setReferencias([...referencias, novaReferencia.trim()]);
      setNovaReferencia('');
    }
  };

  const handleRemoveReferencia = (index: number) => {
    setReferencias(referencias.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      uso: uso.join(', '),
      estilo: estilo.join(', '),
      objetivos: objetivos.join(', '),
      tom: tom.join(', '),
      tecnicas,
      estrategia,
      referencias,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-semibold text-white">Editar Briefing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Uso */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Uso</label>
            <div className="flex flex-wrap gap-2">
              {USO_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => toggleItem(uso, setUso, option)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    uso.includes(option)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Estilo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Estilo</label>
            <div className="flex flex-wrap gap-2">
              {ESTILO_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => toggleItem(estilo, setEstilo, option)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    estilo.includes(option)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Objetivos */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Objetivos</label>
            <div className="flex flex-wrap gap-2">
              {OBJETIVO_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => toggleItem(objetivos, setObjetivos, option)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    objetivos.includes(option)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Tom */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tom</label>
            <div className="flex flex-wrap gap-2">
              {TOM_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => toggleItem(tom, setTom, option)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    tom.includes(option)
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Técnicas */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-white">Técnicas</h3>
            
            {/* Fotografia */}
            {Object.entries(TECNICAS_OPTIONS).map(([categoria, options]) => (
              <div key={categoria} className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-300 capitalize">{categoria}</h4>
                <div className="flex flex-wrap gap-2">
                  {options.map(option => (
                    <button
                      key={option}
                      onClick={() => toggleTecnica(categoria as keyof typeof tecnicas, option)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        tecnicas[categoria as keyof typeof tecnicas].includes(option)
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {tecnicas[categoria as keyof typeof tecnicas].length > 0 && (
                  <textarea
                    value={tecnicasDescricao[categoria as keyof typeof tecnicasDescricao]}
                    onChange={(e) => setTecnicasDescricao({ ...tecnicasDescricao, [categoria]: e.target.value })}
                    placeholder={`Como a técnica de ${categoria} será usada?`}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Estratégia */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Estratégia</label>
            <textarea
              value={estrategia}
              onChange={(e) => setEstrategia(e.target.value)}
              placeholder="Descreva a estratégia..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Referências */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Referências (URLs)</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={novaReferencia}
                  onChange={(e) => setNovaReferencia(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddReferencia()}
                  placeholder="https://exemplo.com"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAddReferencia}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {referencias.length > 0 && (
                <div className="space-y-1">
                  {referencias.map((ref, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-800/50 rounded px-3 py-2">
                      <a href={ref} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-blue-400 hover:underline truncate">
                        {ref}
                      </a>
                      <button
                        onClick={() => handleRemoveReferencia(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            Salvar Briefing
          </button>
        </div>
      </div>
    </div>
  );
}
