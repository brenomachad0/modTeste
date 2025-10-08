'use client';
import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { getIconByType, getIconByCategory, getAllKnownTypes, IconMappingResult } from '../utils/iconMapping';

interface IconSelectorProps {
  currentIcon?: string;
  currentTitle?: string;
  onIconSelect: (iconResult: IconMappingResult) => void;
  onClose: () => void;
  isOpen: boolean;
}

const IconSelector: React.FC<IconSelectorProps> = ({
  currentIcon,
  currentTitle,
  onIconSelect,
  onClose,
  isOpen
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  // Categorias disponíveis
  const categories = [
    { id: 'all', name: 'Todos', color: 'gray' },
    { id: 'animation', name: 'Animação', color: 'purple' },
    { id: 'video', name: 'Vídeo', color: 'blue' },
    { id: 'audio', name: 'Áudio', color: 'green' },
    { id: 'image', name: 'Imagem', color: 'yellow' },
    { id: 'design', name: 'Design', color: 'pink' },
    { id: 'tech', name: 'Tecnologia', color: 'indigo' },
    { id: 'other', name: 'Outros', color: 'gray' }
  ];

  // Ícones sugeridos baseados em tipos conhecidos
  const knownTypes = getAllKnownTypes();
  const suggestedIcons = knownTypes
    .filter(type => {
      if (selectedCategory === 'all') return true;
      const iconResult = getIconByType(type);
      return iconResult.category === selectedCategory;
    })
    .filter(type => 
      searchTerm === '' || 
      type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(type => getIconByType(type));

  // Ícones por categoria
  const categoryIcons = categories
    .filter(cat => cat.id !== 'all')
    .map(cat => getIconByCategory(cat.id));

  const allIcons = selectedCategory === 'all' 
    ? [...new Set([...suggestedIcons, ...categoryIcons])]
    : suggestedIcons;

  const handleIconClick = (iconResult: IconMappingResult) => {
    onIconSelect(iconResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Selecionar Ícone
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por tipo (ex: animação, vídeo, design...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? `bg-${category.color}-100 text-${category.color}-800 ring-2 ring-${category.color}-500`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Current Selection */}
        {currentIcon && (
          <div className="p-4 bg-gray-50 border-b">
            <p className="text-sm text-gray-600 mb-2">Ícone atual:</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                {React.createElement(getIconByType(currentIcon, currentTitle).icon, { size: 24 } as any)}
              </div>
              <span className="text-sm font-medium">
                {getIconByType(currentIcon, currentTitle).name}
              </span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                {Math.round(getIconByType(currentIcon, currentTitle).confidence * 100)}% confiança
              </span>
            </div>
          </div>
        )}

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {allIcons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum ícone encontrado</p>
              <p className="text-sm mt-1">Tente outro termo de busca</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {allIcons.map((iconResult, index) => {
                const IconComponent = iconResult.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleIconClick(iconResult)}
                    className={`
                      p-3 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md
                      flex flex-col items-center gap-1 min-h-[70px]
                      ${iconResult.category === 'animation' ? 'hover:border-purple-300 hover:bg-purple-50' :
                        iconResult.category === 'video' ? 'hover:border-blue-300 hover:bg-blue-50' :
                        iconResult.category === 'audio' ? 'hover:border-green-300 hover:bg-green-50' :
                        iconResult.category === 'image' ? 'hover:border-yellow-300 hover:bg-yellow-50' :
                        iconResult.category === 'design' ? 'hover:border-pink-300 hover:bg-pink-50' :
                        iconResult.category === 'tech' ? 'hover:border-indigo-300 hover:bg-indigo-50' :
                        'hover:border-gray-300 hover:bg-gray-50'}
                      border-gray-200
                    `}
                    title={`${iconResult.name} (${Math.round(iconResult.confidence * 100)}% confiança)`}
                  >
                    <IconComponent 
                      {...({ size: 24 } as any)}
                      className={`
                        ${iconResult.category === 'animation' ? 'text-purple-600' :
                          iconResult.category === 'video' ? 'text-blue-600' :
                          iconResult.category === 'audio' ? 'text-green-600' :
                          iconResult.category === 'image' ? 'text-yellow-600' :
                          iconResult.category === 'design' ? 'text-pink-600' :
                          iconResult.category === 'tech' ? 'text-indigo-600' :
                          'text-gray-600'}
                      `}
                    />
                    <span className="text-xs text-gray-600 text-center leading-tight">
                      {iconResult.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Clique em um ícone para selecioná-lo • {allIcons.length} ícones disponíveis
          </p>
        </div>
      </div>
    </div>
  );
};

export default IconSelector;