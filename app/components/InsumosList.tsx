/**
 * InsumosList - Lista de insumos/arquivos do projeto
 * Usa endpoint GET /venda-arquivos/demanda/{demandaId}
 */

'use client';

import { 
  Paperclip, 
  Calendar, 
  User, 
  Download,
  FileText,
  Image,
  Video,
  Music,
  FileSpreadsheet,
  Archive,
  File
} from 'lucide-react';

interface VendaArquivo {
  venda_arquivo_id: string;
  venda_arquivo_origem: string;
  venda_arquivo_origem_id: string;
  venda_arquivo_tipo: string;
  venda_arquivo_tipo_custom: string | null;
  file: {
    id: string;
    filename: string;
    url: string;
    mimetype: string;
    size: number;
    createdAt: string;
    createdPessoa: {
      pessoa_id: string;
      pessoa_emailTelefone: string;
      pessoa_nome: string;
      pessoa_tipo: string;
      pessoa_created_at: string;
      pessoa_imagem: string | null;
    };
  };
}

interface InsumosListProps {
  insumos: VendaArquivo[];
  onAddInsumo: () => void;
}

export default function InsumosList({ insumos, onAddInsumo }: InsumosListProps) {
  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dataStr;
    }
  };

  const formatarTamanho = (bytes: number) => {
    if (!bytes) return '';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTipoArquivo = (mimetype: string) => {
    if (!mimetype) return { label: 'FILE', color: 'bg-gray-500/10 text-gray-400', Icon: File };
    
    if (mimetype.includes('pdf')) return { label: 'PDF', color: 'bg-red-500/10 text-red-400', Icon: FileText };
    if (mimetype.includes('image')) return { label: 'IMG', color: 'bg-purple-500/10 text-purple-400', Icon: Image };
    if (mimetype.includes('video')) return { label: 'VID', color: 'bg-pink-500/10 text-pink-400', Icon: Video };
    if (mimetype.includes('audio')) return { label: 'AUD', color: 'bg-yellow-500/10 text-yellow-400', Icon: Music };
    if (mimetype.includes('word') || mimetype.includes('document')) return { label: 'DOC', color: 'bg-blue-500/10 text-blue-400', Icon: FileText };
    if (mimetype.includes('excel') || mimetype.includes('sheet')) return { label: 'XLS', color: 'bg-green-500/10 text-green-400', Icon: FileSpreadsheet };
    if (mimetype.includes('zip') || mimetype.includes('rar')) return { label: 'ZIP', color: 'bg-gray-500/10 text-gray-400', Icon: Archive };
    
    return { label: 'FILE', color: 'bg-gray-500/10 text-gray-400', Icon: File };
  };

  const getTipoLabel = (tipo: string, tipoCustom: string | null) => {
    if (tipoCustom) return tipoCustom;
    
    const tipos: Record<string, string> = {
      roteiro: 'Roteiro',
      arte: 'Arte',
      storyboard: 'Storyboard',
      audio: 'Áudio',
      video: 'Vídeo',
      legenda: 'Legenda',
      thumbnail: 'Thumbnail',
      locucao: 'Locução',
      edicao: 'Edição',
      finalizacao: 'Finalização',
      aprovacao: 'Aprovação',
      referencia: 'Referência',
      outros: 'Outros',
    };
    
    return tipos[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
  };

  if (insumos.length === 0) {
    return (
      <div className="text-center py-8">
        <Paperclip className="w-10 h-10 text-gray-600 mx-auto mb-2" />
        <h4 className="text-white text-sm font-medium mb-1">Nenhum insumo enviado</h4>
        <p className="text-gray-400 text-xs mb-3">
          Faça upload de arquivos relacionados ao projeto
        </p>
        <button
          onClick={onAddInsumo}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
        >
          Upload de Arquivo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Arquivos Enviados ({insumos.length})
        </h4>
        <button
          onClick={onAddInsumo}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
        >
          + Upload
        </button>
      </div>

      {/* Lista de insumos */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {insumos.map((insumo) => {
          const tipoArquivo = getTipoArquivo(insumo.file.mimetype);
          const tipoLabel = getTipoLabel(insumo.venda_arquivo_tipo, insumo.venda_arquivo_tipo_custom);
          const IconComponent = tipoArquivo.Icon;
          
          return (
            <div
              key={insumo.venda_arquivo_id}
              className="bg-gray-700/30 border border-gray-600 rounded-lg p-3 hover:bg-gray-700/50 transition-colors"
            >
              {/* Linha 1: Tipo do insumo */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <IconComponent className={`w-4 h-4 ${tipoArquivo.color.split(' ')[1]}`} />
                  <span className="text-sm font-medium text-white">
                    {tipoLabel}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${tipoArquivo.color}`}>
                    {tipoArquivo.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatarData(insumo.file.createdAt)}</span>
                </div>
              </div>

              {/* Linha 2: Enviado por */}
              <div className="flex items-center gap-2 mb-2">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-300">
                  {insumo.file.createdPessoa.pessoa_nome}
                </span>
              </div>

              {/* Arquivo para download */}
              <a
                href={insumo.file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 bg-gray-800 rounded hover:bg-gray-750 transition-colors group mt-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Paperclip className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-xs text-gray-300 truncate">
                    {insumo.file.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatarTamanho(insumo.file.size)}
                  </span>
                  <Download className="w-3 h-3 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </a>
            </div>
          );
        })}
      </div>

      {/* Total na parte inferior */}
      <div className="mt-4 pt-3 border-t border-gray-600">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Total de arquivos</span>
          <span className="font-bold text-purple-400">{insumos.length}</span>
        </div>
      </div>
    </div>
  );
}
