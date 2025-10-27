'use client';

import { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, User, AlertCircle, FileText } from 'lucide-react';
import SaveTaskModal from './SaveTaskModal';
import DurationInput from './DurationInput';
import { mandrillApi } from '@/lib/mandrill-api';

type Status = 'planejada' | 'proxima' | 'executando' | 'pausada' | 'atrasada' | 'concluida';

interface Setor {
  setor_id: string;
  setor_nome: string;
  setor_slug: string;
  setor_parent?: string;
  setor_pai?: Setor;
  setores_filhos?: Setor[];
}

interface Tarefa {
  id: string;
  nome: string;
  status: Status;
  ordem?: number;
  setor: string;
  setor_id?: string;
  responsavel_usuario?: string | null;
  responsavel_nome?: string | null;
  responsavel_tipo?: string;
  prazo_horas: number;
  duracao_segundos?: number;
  mandrill_coins: number;
  instrucao?: string;
  descricao?: string;
  observacao?: string;
  templates?: any[];
  data_inicio?: string;
  data_fim?: string;
  tempo_execucao?: number;
  resultado?: any;
  execucao_template_id?: string; // ID do template associado
}

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tarefa: Tarefa) => void;
  onDelete?: (tarefaId: string) => void;
  onSaveAsTemplate?: (tarefa: Tarefa) => Promise<void>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  tarefa: Tarefa;
  servicoId?: string;
  demandaId?: string;
}

// Funções para converter prazo entre horas e formato DD HH:mm:ss
const formatPrazoToString = (horas: number): string => {
  const dias = Math.floor(horas / 24);
  const horasRestantes = Math.floor(horas % 24);
  const minutos = Math.floor((horas * 60) % 60);
  const segundos = Math.floor((horas * 3600) % 60);
  
  return `${dias.toString().padStart(2, '0')} ${horasRestantes.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
};

const parsePrazoString = (str: string): number => {
  // Remove espaços extras
  const cleaned = str.trim();
  
  // Tenta fazer parse do formato "DD HH:mm:ss"
  const match = cleaned.match(/^(\d+)\s+(\d+):(\d+):(\d+)$/);
  
  if (match) {
    const dias = parseInt(match[1]);
    const horas = parseInt(match[2]);
    const minutos = parseInt(match[3]);
    const segundos = parseInt(match[4]);
    
    // Converte tudo para horas
    return dias * 24 + horas + minutos / 60 + segundos / 3600;
  }
  
  // Se não conseguir fazer parse, retorna o valor original
  return 0;
};

export default function TaskEditModal({ isOpen, onClose, onSave, onDelete, onSaveAsTemplate, onSuccess, onError, tarefa, servicoId, demandaId }: TaskEditModalProps) {
  const [editedTask, setEditedTask] = useState<Tarefa>(tarefa);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Verificar se a tarefa tem template associado
  const hasTemplate = !!editedTask.execucao_template_id;

  useEffect(() => {
    setEditedTask(tarefa);
  }, [tarefa]);

  // Carregar setores quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      carregarSetores();
    }
  }, [isOpen]);

  const carregarSetores = async () => {
    try {
      setLoadingSetores(true);
      const data = await mandrillApi.listarSetores();
      setSetores(data);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    } finally {
      setLoadingSetores(false);
    }
  };

  // Renderizar hierarquia de setores
  const renderSetorOption = (setor: Setor, level: number = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    const prefix = '  '.repeat(level);
    
    options.push(
      <option key={setor.setor_id} value={setor.setor_id}>
        {prefix}{setor.setor_nome}
      </option>
    );

    if (setor.setores_filhos && setor.setores_filhos.length > 0) {
      setor.setores_filhos.forEach(filho => {
        options.push(...renderSetorOption(filho, level + 1));
      });
    }

    return options;
  };

  if (!isOpen) return null;

  const handleSaveClick = () => {
    // Validação básica
    if (!editedTask.nome.trim()) {
      alert('O título da tarefa é obrigatório!');
      return;
    }
    if (editedTask.prazo_horas <= 0) {
      alert('O prazo deve ser maior que zero!');
      return;
    }
    setShowSaveModal(true);
  };

  const handleSaveOnly = async () => {
    try {
      setSaving(true);
      
      // APENAS atualiza o estado local via callback
      // NÃO faz requisição à API (isso será feito ao finalizar edição)
      onSave(editedTask);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      alert('Erro ao salvar tarefa. Verifique o console para mais detalhes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    try {
      setSaving(true);
      
      // Se tem callback customizado de template, usa ele
      if (onSaveAsTemplate) {
        await onSaveAsTemplate(editedTask);
        onClose();
        return;
      }
      
      // Cria APENAS o template (não cria a tarefa)
      const prazoMinutos = editedTask.prazo_horas;
      const prazoWarning = Math.floor(prazoMinutos / 2);
      const prazoDanger = Math.floor(prazoMinutos / 4);

      const payloadTemplate = {
        template_titulo: editedTask.nome,
        template_observacoes: editedTask.descricao || editedTask.observacao || '',
        template_deadline: prazoMinutos,
        template_warning: prazoWarning,
        template_danger: prazoDanger,
        template_coins: editedTask.mandrill_coins || 1,
      };

      const resultado = await mandrillApi.criarTemplate(payloadTemplate);
      console.log('✅ Template criado:', resultado);
      
      // Atualiza o estado local (tarefa continua no cache)
      onSave(editedTask);
      
      // Notifica sucesso
      if (onSuccess) {
        onSuccess('Template criado com sucesso! A tarefa foi mantida na lista para ser salva ao finalizar a edição.');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao criar template:', error);
      if (onError) {
        onError('Erro ao criar template. Verifique o console para mais detalhes.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      setSaving(true);
      
      const prazoMinutos = editedTask.prazo_horas;
      const prazoWarning = Math.floor(prazoMinutos / 2);
      const prazoDanger = Math.floor(prazoMinutos / 4);

      const payloadTemplate = {
        template_titulo: editedTask.nome,
        template_observacoes: editedTask.descricao || editedTask.observacao || '',
        template_deadline: prazoMinutos,
        template_warning: prazoWarning,
        template_danger: prazoDanger,
        template_coins: editedTask.mandrill_coins || 1,
      };

      const templateId = parseInt(editedTask.execucao_template_id || '0');
      await mandrillApi.atualizarTemplate(templateId, payloadTemplate);
      console.log('✅ Template atualizado');
      
      // Atualiza a tarefa também
      onSave(editedTask);
      
      // Notifica sucesso
      if (onSuccess) {
        onSuccess('Template atualizado com sucesso!');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      if (onError) {
        onError('Erro ao atualizar template. Verifique o console para mais detalhes.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) {
      alert('Função de deletar não disponível');
      return;
    }

    try {
      setDeleting(true);
      
      // Se não é uma tarefa nova (ID começa com 'task-'), chama a API
      if (!editedTask.id.startsWith('task-')) {
        await mandrillApi.deletarTarefa(editedTask.id); // ID pode ser número ou UUID
        console.log('✅ Tarefa deletada da API');
      }
      
      // Notifica o componente pai para remover do cache
      onDelete(editedTask.id);
      
      // Notifica sucesso
      if (onSuccess) {
        onSuccess('Tarefa excluída com sucesso!');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      if (onError) {
        onError('Erro ao deletar tarefa. Verifique o console para mais detalhes.');
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const statusOptions = [
    { value: 'planejada', label: 'Planejada', color: 'text-blue-400' },
    { value: 'proxima', label: 'Próxima', color: 'text-cyan-400' },
    { value: 'executando', label: 'Executando', color: 'text-yellow-400' },
    { value: 'pausada', label: 'Pausada', color: 'text-orange-400' },
    { value: 'atrasada', label: 'Atrasada', color: 'text-red-400' },
    { value: 'concluida', label: 'Concluída', color: 'text-green-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Editar Tarefa
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Título da Tarefa */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título da Tarefa *
            </label>
            <input
              type="text"
              value={editedTask.nome}
              onChange={(e) => setEditedTask({ ...editedTask, nome: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Título da tarefa"
            />
          </div>

          {/* Instrução */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={editedTask.descricao || ''}
              onChange={(e) => setEditedTask({ ...editedTask, descricao: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
              placeholder="Detalhes sobre a tarefa..."
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              value={editedTask.observacao || ''}
              onChange={(e) => setEditedTask({ ...editedTask, observacao: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
              placeholder="Observações adicionais..."
            />
          </div>
          
          {/* Setor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Setor Responsável *
            </label>
            {loadingSetores ? (
              <div className="text-gray-500 text-sm py-2">Carregando setores...</div>
            ) : (
              <select
                value={editedTask.setor_id || ''}
                onChange={(e) => {
                  const setorId = e.target.value;
                  const setorSelecionado = setores.flatMap(s => [s, ...(s.setores_filhos || [])]).find(s => s.setor_id === setorId);
                  setEditedTask({ 
                    ...editedTask, 
                    setor_id: setorId,
                    setor: setorSelecionado?.setor_nome || editedTask.setor 
                  });
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Selecione um setor</option>
                {setores.map(setor => renderSetorOption(setor))}
              </select>
            )}
            {editedTask.setor && !editedTask.setor_id && (
              <p className="text-xs text-gray-500 mt-1">Setor atual: {editedTask.setor}</p>
            )}
          </div>

          {/* Prazo/Duração */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duração (DD HH:mm:ss) *
            </label>
            <DurationInput
              value={editedTask.prazo_horas}
              onChange={(minutes) => setEditedTask({ ...editedTask, prazo_horas: minutes })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total: {Math.floor(editedTask.prazo_horas / 60)}h {Math.round(editedTask.prazo_horas % 60)}min
              {editedTask.prazo_horas >= 1440 && ` (${Math.floor(editedTask.prazo_horas / 1440)} dias)`}
            </p>
          </div>

          {/* Aviso */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300">
              As alterações serão aplicadas quando você salvar o modo de edição.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-between gap-3">
          {/* Botão de deletar à esquerda */}
          {onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          )}
          
          {/* Botões de salvar/cancelar à direita */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveClick}
              disabled={!editedTask.nome.trim() || saving || deleting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de salvamento */}
      <SaveTaskModal
        isOpen={showSaveModal}
        onClose={() => !saving && setShowSaveModal(false)}
        onSaveOnly={handleSaveOnly}
        onSaveAsTemplate={hasTemplate ? undefined : handleSaveAsTemplate}
        onUpdateTemplate={hasTemplate ? handleUpdateTemplate : undefined}
        hasTemplate={hasTemplate}
      />

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-gray-900 border border-red-500/50 rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-red-900/20 border-b border-red-500/50 px-6 py-4">
              <h2 className="text-lg font-bold text-red-400">Confirmar Exclusão</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                Tem certeza que deseja excluir a tarefa <strong className="text-white">"{editedTask.nome}"</strong>?
              </p>
              <p className="text-sm text-gray-400">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
