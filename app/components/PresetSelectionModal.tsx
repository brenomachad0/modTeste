import React, { useState } from 'react';
import { useTemplates, convertApiTemplateToTaskTemplate, TemplateWithTasks } from '../hooks/useTemplates';

interface PresetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (template: any) => void;
  onCustomTask: () => void;
}

const PresetSelectionModal: React.FC<PresetSelectionModalProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
  onCustomTask
}) => {
  const { templates, loading, error } = useTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Filtrar templates baseado na busca e categoria
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'todos' || template.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Categorias baseadas nos dados reais
  const categories = [
    { value: 'todos', label: 'Todos' },
    { value: 'video', label: 'Vídeo' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'design', label: 'Design' },
    { value: 'desenvolvimento', label: 'Desenvolvimento' }
  ];

  const handleTemplateSelect = async (template: any) => {
    try {
      // Converter para o formato esperado pelo modal
      const convertedTemplate = convertApiTemplateToTaskTemplate(template);
      onTemplateSelect(convertedTemplate);
      onClose();
    } catch (err) {
      console.error('Erro ao processar template:', err);
      // Em caso de erro, enviar o template básico
      onTemplateSelect({
        id: `template_${template.id}`,
        nome: template.nome,
        setor: 'Produção',
        responsavel_tipo: 'Geral',
        prazo_horas: template.prazo_padrao_dias * 24,
        mandrill_coins: Math.round(template.valor_estimado / 100),
        instrucao: template.descricao || '',
        categoria: template.categoria,
        templates: [],
        tasks: []
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-hidden flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4">Criar Nova Tarefa</h3>
        
        {/* Opção de tarefa personalizada */}
        <div className="mb-6">
          <button
            onClick={onCustomTask}
            className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-2 border-blue-500 transition-colors"
          >
            <div className="text-center">
              <div className="text-lg font-semibold">➕ Criar Tarefa Personalizada</div>
              <div className="text-sm text-blue-200">Criar uma nova tarefa do zero</div>
            </div>
          </button>
        </div>

        <div className="h-px bg-gray-600 mb-4"></div>

        <h4 className="text-md font-semibold text-white mb-3">Ou escolher um template:</h4>

        {/* Filtros */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Lista de templates */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Carregando templates...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-400">Erro: {error}</div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              {searchTerm || selectedCategory !== 'todos' 
                ? 'Nenhum template encontrado com os filtros aplicados.' 
                : 'Nenhum template disponível.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-left rounded border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-white">{template.nome}</div>
                      <div className="text-sm text-gray-300 mt-1">{template.descricao}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="bg-gray-600 px-2 py-1 rounded capitalize">
                          {template.categoria}
                        </span>
                        <span>{template.prazo_padrao_dias} dias</span>
                        <span>R$ {template.valor_estimado.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresetSelectionModal;