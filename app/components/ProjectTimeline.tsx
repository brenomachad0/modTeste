/**
 * ProjectTimeline - Informações do Projeto
 * Exibe APENAS informações do tipo "informacao" com layout simplificado
 */

'use client';

import React, { useState } from 'react';
import { ChatBubbleLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TimelineItem {
  id?: string;
  title: string; // assunto da informação
  content: string; // parágrafo da informação
  date?: string;
  author?: string;
  files?: Array<{ url: string; nome: string }>;
}

interface ProjectTimelineProps {
  timeline: TimelineItem[];
  onAddInfo?: () => void;
}

export default function ProjectTimeline({ timeline, onAddInfo }: ProjectTimelineProps) {
  const [selectedInfo, setSelectedInfo] = useState<TimelineItem | null>(null);
  // Ordenar timeline do mais recente para o mais antigo
  const sortedTimeline = [...timeline].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-8 text-center">
        <ChatBubbleLeftIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-4">Nenhuma informação registrada</p>
        {onAddInfo && (
          <button
            onClick={onAddInfo}
            className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
            title="Adicionar informação"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* Botão + no canto superior direito */}
        {onAddInfo && (
          <div className="flex justify-end -mt-2 mb-3">
            <button
              onClick={onAddInfo}
              className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg"
              title="Adicionar informação"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Lista de Informações */}
        <div className="space-y-2">
          {sortedTimeline.map((item) => (
            <div 
              key={item.id || item.title} 
              className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all cursor-pointer"
              onClick={() => setSelectedInfo(item)}
            >
              <div className="flex gap-3">
                {/* Avatar com letra (esquerda total) */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-base text-blue-400 font-semibold">
                      {item.author?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>

                {/* Conteúdo (título + parágrafo) */}
                <div className="flex-1 min-w-0">
                  {/* Título */}
                  <h4 className="text-sm font-semibold text-white mb-1 line-clamp-1">
                    {item.title}
                  </h4>

                  {/* Parágrafo (fonte menor, máx 2 linhas) */}
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {item.content}
                  </p>
                </div>

                {/* Data (justificada à direita) */}
                <div className="flex-shrink-0 text-right">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(item.date)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Informação Completa */}
      {selectedInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-base text-blue-400 font-semibold">
                    {selectedInfo.author?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {selectedInfo.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedInfo.author} • {formatDate(selectedInfo.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInfo(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {selectedInfo.content}
              </p>

              {/* Arquivos anexados (se houver) */}
              {selectedInfo.files && selectedInfo.files.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Arquivos Anexados</h4>
                  <div className="space-y-2">
                    {selectedInfo.files.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-gray-700/50 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors"
                      >
                        📎 {file.nome}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedInfo(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
