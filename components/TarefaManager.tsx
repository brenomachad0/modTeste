// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit3, Save, X, Copy, 
  Clock, DollarSign, User, Settings,
  Target, CheckCircle, AlertCircle,
  Layers, GitBranch
} from 'lucide-react';

// Tipos para templates e instâncias de tarefas
interface TarefaTemplate {
  id: string;
  nome: string;
  descricao: string;
  prazo_horas_estimado: number;
  valor_mandrill_coins: number;
  responsavel_tipo: 'atendimento' | 'produtor' | 'editor' | 'designer' | 'dev' | 'qa';
  pode_executar_paralelo: boolean;
  instrucoes?: string;
  tags?: string[];
  categoria: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TarefaInstancia {
  id: string;
  template_id: string;
  servico_id: string;
  nome: string;
  descricao: string;
  status: 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';
  prazo_horas: number;
  horas_trabalhadas: number;
  valor_mandrill_coins: number;
  responsavel_nome?: string;
  responsavel_tipo: string;
  pode_executar_paralelo: boolean;
  ordem: number;
  data_inicio?: string;
  data_conclusao?: string;
  instrucoes?: string;
  observacoes?: string;
  anexos?: any[];
  created_at?: string;
  updated_at?: string;
}

interface TarefaManagerProps {
  servicoId: string;
  templates: TarefaTemplate[];
  instancias: TarefaInstancia[];
  onSaveTemplates: (templates: TarefaTemplate[]) => Promise<boolean>;
  onSaveInstancias: (instancias: TarefaInstancia[]) => Promise<boolean>;
  onCreateInstanciaFromTemplate: (templateId: string, servicoId: string) => Promise<TarefaInstancia | null>;
  modoEdicao?: boolean;
}

const RESPONSAVEL_TIPOS = {
  'atendimento': { label: 'Atendimento', color: 'bg-blue-100 text-blue-800' },
  'produtor': { label: 'Produtor', color: 'bg-purple-100 text-purple-800' },
  'editor': { label: 'Editor', color: 'bg-green-100 text-green-800' },
  'designer': { label: 'Designer', color: 'bg-pink-100 text-pink-800' },
  'dev': { label: 'Desenvolvedor', color: 'bg-orange-100 text-orange-800' },
  'qa': { label: 'QA/Revisor', color: 'bg-gray-100 text-gray-800' }
};

const STATUS_TAREFAS = {
  'planejada': { label: 'Planejada', color: 'bg-gray-100 text-gray-800', icon: <Target className="w-4 h-4" /> },
  'proxima': { label: 'Próxima', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
  'executando': { label: 'Executando', color: 'bg-blue-100 text-blue-800', icon: <Settings className="w-4 h-4 animate-spin" /> },
  'pausada': { label: 'Pausada', color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="w-4 h-4" /> },
  'atrasada': { label: 'Atrasada', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-4 h-4" /> },
  'concluida': { label: 'Concluída', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> }
};

// Componente para gerenciar templates
function TemplateManager({ 
  templates, 
  onSave, 
  onCreateInstancia, 
  servicoId 
}: {
  templates: TarefaTemplate[];
  onSave: (templates: TarefaTemplate[]) => Promise<boolean>;
  onCreateInstancia: (templateId: string) => void;
  servicoId: string;
}) {
  const [templatesLocal, setTemplatesLocal] = useState<TarefaTemplate[]>(templates);
  const [editando, setEditando] = useState<string | null>(null);
  const [novoTemplate, setNovoTemplate] = useState<Partial<TarefaTemplate>>({});
  const [mostrandoForm, setMostrandoForm] = useState(false);

  useEffect(() => {
    setTemplatesLocal(templates);
  }, [templates]);

  const salvarTemplate = async (template: TarefaTemplate) => {
    const templatesAtualizados = templatesLocal.map(t => 
      t.id === template.id ? template : t
    );
    setTemplatesLocal(templatesAtualizados);
    await onSave(templatesAtualizados);
    setEditando(null);
  };

  const adicionarTemplate = async () => {
    if (!novoTemplate.nome) return;

    const template: TarefaTemplate = {
      id: `template_${Date.now()}`,
      nome: novoTemplate.nome || '',
      descricao: novoTemplate.descricao || '',
      prazo_horas_estimado: novoTemplate.prazo_horas_estimado || 1,
      valor_mandrill_coins: novoTemplate.valor_mandrill_coins || 0,
      responsavel_tipo: novoTemplate.responsavel_tipo || 'produtor',
      pode_executar_paralelo: novoTemplate.pode_executar_paralelo || false,
      instrucoes: novoTemplate.instrucoes || '',
      tags: novoTemplate.tags || [],
      categoria: novoTemplate.categoria || 'geral',
      ativo: true,
      created_at: new Date().toISOString()
    };

    const novosTemplates = [...templatesLocal, template];
    setTemplatesLocal(novosTemplates);
    await onSave(novosTemplates);
    setNovoTemplate({});
    setMostrandoForm(false);
  };

  const excluirTemplate = async (templateId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      const templatesAtualizados = templatesLocal.filter(t => t.id !== templateId);
      setTemplatesLocal(templatesAtualizados);
      await onSave(templatesAtualizados);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Templates de Tarefas ({templatesLocal.filter(t => t.ativo).length})
        </h3>
        <button
          onClick={() => setMostrandoForm(true)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4 inline mr-1" />
          Novo Template
        </button>
      </div>

      {/* Formulário para novo template */}
      {mostrandoForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Criar Novo Template</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Nome da tarefa"
              value={novoTemplate.nome || ''}
              onChange={(e) => setNovoTemplate({ ...novoTemplate, nome: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={novoTemplate.responsavel_tipo || 'produtor'}
              onChange={(e) => setNovoTemplate({ ...novoTemplate, responsavel_tipo: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {Object.entries(RESPONSAVEL_TIPOS).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Horas estimadas"
              value={novoTemplate.prazo_horas_estimado || ''}
              onChange={(e) => setNovoTemplate({ ...novoTemplate, prazo_horas_estimado: parseInt(e.target.value) || 1 })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Mandrill Coins"
              value={novoTemplate.valor_mandrill_coins || ''}
              onChange={(e) => setNovoTemplate({ ...novoTemplate, valor_mandrill_coins: parseInt(e.target.value) || 0 })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <textarea
            placeholder="Descrição da tarefa"
            rows={2}
            value={novoTemplate.descricao || ''}
            onChange={(e) => setNovoTemplate({ ...novoTemplate, descricao: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
          />
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={novoTemplate.pode_executar_paralelo || false}
                onChange={(e) => setNovoTemplate({ ...novoTemplate, pode_executar_paralelo: e.target.checked })}
                className="mr-2"
              />
              Pode executar em paralelo
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={adicionarTemplate}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Salvar Template
            </button>
            <button
              onClick={() => {
                setMostrandoForm(false);
                setNovoTemplate({});
              }}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templatesLocal.filter(t => t.ativo).map(template => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm">{template.nome}</h4>
              <div className="flex gap-1">
                <button
                  onClick={() => onCreateInstancia(template.id)}
                  className="p-1 text-green-600 hover:text-green-800"
                  title="Criar instância"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditando(template.id)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="Editar"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => excluirTemplate(template.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {template.descricao && (
              <p className="text-xs text-gray-600 mb-2">{template.descricao}</p>
            )}
            
            <div className="flex flex-wrap gap-1 text-xs">
              <span className={`px-2 py-1 rounded-full ${RESPONSAVEL_TIPOS[template.responsavel_tipo].color}`}>
                {RESPONSAVEL_TIPOS[template.responsavel_tipo].label}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                {template.prazo_horas_estimado}h
              </span>
              {template.valor_mandrill_coins > 0 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  {template.valor_mandrill_coins} coins
                </span>
              )}
              {template.pode_executar_paralelo && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  <GitBranch className="w-3 h-3 inline mr-1" />
                  Paralelo
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente para gerenciar instâncias de tarefas
function InstanciaManager({ 
  instancias, 
  templates,
  onSave 
}: {
  instancias: TarefaInstancia[];
  templates: TarefaTemplate[];
  onSave: (instancias: TarefaInstancia[]) => Promise<boolean>;
}) {
  const [instanciasLocal, setInstanciasLocal] = useState<TarefaInstancia[]>(instancias);
  const [editando, setEditando] = useState<string | null>(null);

  useEffect(() => {
    setInstanciasLocal(instancias);
  }, [instancias]);

  const atualizarInstancia = async (instancia: TarefaInstancia) => {
    const instanciasAtualizadas = instanciasLocal.map(i => 
      i.id === instancia.id ? instancia : i
    );
    setInstanciasLocal(instanciasAtualizadas);
    await onSave(instanciasAtualizadas);
    setEditando(null);
  };

  const excluirInstancia = async (instanciaId: string) => {
    const instancia = instanciasLocal.find(i => i.id === instanciaId);
    if (!instancia) return;

    // Só permite excluir se não estiver em execução
    if (instancia.status === 'executando') {
      alert('Não é possível excluir tarefas em execução');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      const instanciasAtualizadas = instanciasLocal.filter(i => i.id !== instanciaId);
      setInstanciasLocal(instanciasAtualizadas);
      await onSave(instanciasAtualizadas);
    }
  };

  const getTemplate = (templateId: string) => {
    return templates.find(t => t.id === templateId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Tarefas do Serviço ({instanciasLocal.length})
      </h3>

      {instanciasLocal.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma tarefa criada ainda</p>
          <p className="text-sm">Use os templates acima para criar tarefas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {instanciasLocal
            .sort((a, b) => a.ordem - b.ordem)
            .map(instancia => {
              const template = getTemplate(instancia.template_id);
              const statusInfo = STATUS_TAREFAS[instancia.status];

              return (
                <div key={instancia.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  {editando === instancia.id ? (
                    // Modo de edição
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={instancia.nome}
                        onChange={(e) => {
                          const updated = { ...instancia, nome: e.target.value };
                          setInstanciasLocal(instanciasLocal.map(i => 
                            i.id === instancia.id ? updated : i
                          ));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          value={instancia.status}
                          onChange={(e) => {
                            const updated = { ...instancia, status: e.target.value as any };
                            setInstanciasLocal(instanciasLocal.map(i => 
                              i.id === instancia.id ? updated : i
                            ));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {Object.entries(STATUS_TAREFAS).map(([key, value]) => (
                            <option key={key} value={key}>{value.label}</option>
                          ))}
                        </select>
                        
                        <input
                          type="number"
                          placeholder="Horas trabalhadas"
                          value={instancia.horas_trabalhadas}
                          onChange={(e) => {
                            const updated = { ...instancia, horas_trabalhadas: parseInt(e.target.value) || 0 };
                            setInstanciasLocal(instanciasLocal.map(i => 
                              i.id === instancia.id ? updated : i
                            ));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        
                        <input
                          type="text"
                          placeholder="Responsável"
                          value={instancia.responsavel_nome || ''}
                          onChange={(e) => {
                            const updated = { ...instancia, responsavel_nome: e.target.value };
                            setInstanciasLocal(instanciasLocal.map(i => 
                              i.id === instancia.id ? updated : i
                            ));
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      
                      <textarea
                        placeholder="Observações"
                        rows={2}
                        value={instancia.observacoes || ''}
                        onChange={(e) => {
                          const updated = { ...instancia, observacoes: e.target.value };
                          setInstanciasLocal(instanciasLocal.map(i => 
                            i.id === instancia.id ? updated : i
                          ));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => atualizarInstancia(instancia)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          <Save className="w-4 h-4 inline mr-1" />
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditando(null)}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                        >
                          <X className="w-4 h-4 inline mr-1" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo de visualização
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {instancia.ordem}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{instancia.nome}</h4>
                            {template && (
                              <p className="text-sm text-gray-500">Template: {template.nome}</p>
                            )}
                            {instancia.responsavel_nome && (
                              <p className="text-sm text-gray-600">
                                <User className="w-4 h-4 inline mr-1" />
                                {instancia.responsavel_nome}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${statusInfo?.color}`}>
                            {statusInfo?.icon}
                            {statusInfo?.label}
                          </span>
                          
                          <button
                            onClick={() => setEditando(instancia.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          {instancia.status !== 'executando' && (
                            <button
                              onClick={() => excluirInstancia(instancia.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {instancia.horas_trabalhadas}/{instancia.prazo_horas}h
                        </span>
                        
                        {instancia.valor_mandrill_coins > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {instancia.valor_mandrill_coins} coins
                          </span>
                        )}
                        
                        {instancia.pode_executar_paralelo && (
                          <span className="flex items-center gap-1 text-green-600">
                            <GitBranch className="w-4 h-4" />
                            Paralelo
                          </span>
                        )}
                      </div>
                      
                      {instancia.observacoes && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-700">{instancia.observacoes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// Componente principal do gerenciador de tarefas
export default function TarefaManager({
  servicoId,
  templates,
  instancias,
  onSaveTemplates,
  onSaveInstancias,
  onCreateInstanciaFromTemplate,
  modoEdicao = false
}: TarefaManagerProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'instancias'>('instancias');

  const criarInstanciaDeTemplate = async (templateId: string) => {
    const instancia = await onCreateInstanciaFromTemplate(templateId, servicoId);
    if (instancia) {
      // A instância será adicionada automaticamente quando o componente pai recarregar os dados
      console.log('✅ Instância criada com sucesso:', instancia.nome);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('instancias')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'instancias'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4 inline mr-2" />
            Tarefas ({instancias.length})
          </button>
          
          {modoEdicao && (
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Templates ({templates.filter(t => t.ativo).length})
            </button>
          )}
        </nav>
      </div>
      
      <div className="p-6">
        {activeTab === 'instancias' ? (
          <InstanciaManager
            instancias={instancias}
            templates={templates}
            onSave={onSaveInstancias}
          />
        ) : (
          <TemplateManager
            templates={templates}
            onSave={onSaveTemplates}
            onCreateInstancia={criarInstanciaDeTemplate}
            servicoId={servicoId}
          />
        )}
      </div>
    </div>
  );
}