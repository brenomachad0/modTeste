'use client';

import React, { useState } from 'react';
import { X, Check, Upload, FileText } from 'lucide-react';

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

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Tarefa | null;
}

export default function TaskCompletionModal({ isOpen, onClose, task }: TaskCompletionModalProps) {
  const [resultado, setResultado] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simular envio
      console.log('Completando tarefa:', {
        taskId: task.id,
        resultado,
        arquivos: arquivos.map(f => f.name)
      });
      
      // Aqui seria feita a chamada real para a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onClose();
      setResultado('');
      setArquivos([]);
    } catch (error) {
      console.error('Erro ao completar tarefa:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArquivos(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Completar Tarefa</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Informações da tarefa */}
          <div className="bg-gray-750 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">{task.nome}</h3>
            <p className="text-gray-300 text-sm">Setor: {task.setor}</p>
            <p className="text-gray-300 text-sm">Prazo: {task.prazo_horas}h</p>
            <p className="text-gray-300 text-sm">Valor: {task.mandrill_coins} MC</p>
          </div>

          {/* Instruções */}
          {task.instrucao && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Instruções da Tarefa
              </label>
              <div className="bg-gray-700 rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                <p className="text-gray-300 whitespace-pre-wrap">{task.instrucao}</p>
              </div>
            </div>
          )}

          {/* Resultado */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Resultado da Execução *
            </label>
            <textarea
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              placeholder="Descreva o que foi realizado, resultados obtidos, observações..."
              className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-vertical"
              required
            />
          </div>

          {/* Upload de arquivos */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              Arquivos de Entrega
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-gray-400">
                  Clique para selecionar arquivos ou arraste aqui
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, Imagens, Documentos, Planilhas, Apresentações, Arquivos compactados
                </span>
              </label>
            </div>

            {/* Lista de arquivos selecionados */}
            {arquivos.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Arquivos Selecionados ({arquivos.length})
                </h4>
                <div className="space-y-2">
                  {arquivos.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-700 p-2 rounded"
                    >
                      <span className="text-white text-sm truncate">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-2">Lembrete Importante</h4>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>• Certifique-se de que todos os deliverables foram concluídos</li>
              <li>• Descreva detalhadamente o resultado no campo acima</li>
              <li>• Anexe todos os arquivos necessários</li>
              <li>• Esta ação não pode ser desfeita</li>
            </ul>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!resultado.trim() || isSubmitting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Completando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Completar Tarefa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}