// Sistema de mapeamento inteligente de ícones para entregas MOD
// Utiliza react-icons para máxima compatibilidade e variedade

import {
  // Material Design Icons
  MdAnimation,
  MdMovie,
  MdMic,
  MdImage,
  MdEdit,
  MdPhoto,
  MdPerson,
  MdComputer,
  MdFormatPaint,
  MdAdd,
  MdRefresh,
  MdCompress,
  MdCameraAlt,
  MdPhotoCamera,
  Md360,
  MdVideocam,
  MdMusicNote,
  MdBrush,
  MdCode,
  MdDesignServices,
  MdColorLens,
  
  // Fallback
  MdWork
} from 'react-icons/md';

import {
  // Feather Icons para complementar
  FiVideo,
  FiCamera,
  FiMic,
  FiImage,
  FiEdit3,
  FiUser,
  FiMonitor,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiMinimize2,
  FiPackage
} from 'react-icons/fi';

import {
  // Font Awesome para ícones específicos
  FaVideo,
  FaCamera,
  FaMicrophone,
  FaImage,
  FaPaintBrush,
  FaUser,
  FaLaptop,
  FaLayerGroup,
  FaPlus,
  FaRedo,
  FaCompress,
  FaPhotoVideo,
  FaVrCardboard,
  FaPalette,
  FaCode,
  FaTools
} from 'react-icons/fa';

export interface IconMappingResult {
  icon: React.ComponentType;
  name: string;
  category: 'animation' | 'video' | 'audio' | 'image' | 'design' | 'tech' | 'other';
  confidence: number; // 0-1, quão certeza estamos do mapeamento
}

// Mapeamento direto por tipo exato
const EXACT_TYPE_MAPPING: Record<string, IconMappingResult> = {
  // Animação
  'animacao': { icon: MdAnimation, name: 'Animation', category: 'animation', confidence: 1.0 },
  'animation': { icon: MdAnimation, name: 'Animation', category: 'animation', confidence: 1.0 },
  
  // Motion/Vídeo
  'motion': { icon: FiVideo, name: 'Motion Graphics', category: 'video', confidence: 1.0 },
  'video': { icon: MdMovie, name: 'Video', category: 'video', confidence: 1.0 },
  'edicao': { icon: MdEdit, name: 'Edição', category: 'video', confidence: 1.0 },
  'edicao_video': { icon: MdEdit, name: 'Edição de Vídeo', category: 'video', confidence: 1.0 },
  
  // Áudio
  'gravacao': { icon: FaMicrophone, name: 'Gravação', category: 'audio', confidence: 1.0 },
  'audio': { icon: MdMic, name: 'Áudio', category: 'audio', confidence: 1.0 },
  'som': { icon: MdMusicNote, name: 'Som', category: 'audio', confidence: 1.0 },
  
  // Fotografia
  'fotografia': { icon: FaCamera, name: 'Fotografia', category: 'image', confidence: 1.0 },
  'foto': { icon: MdPhotoCamera, name: 'Foto', category: 'image', confidence: 1.0 },
  '360': { icon: Md360, name: '360°', category: 'image', confidence: 1.0 },
  'camera': { icon: MdCameraAlt, name: 'Câmera', category: 'image', confidence: 1.0 },
  
  // Design/Ilustração
  'ilustracao': { icon: MdColorLens, name: 'Ilustração', category: 'design', confidence: 1.0 },
  'design': { icon: MdDesignServices, name: 'Design', category: 'design', confidence: 1.0 },
  'arte': { icon: FaPaintBrush, name: 'Arte', category: 'design', confidence: 1.0 },
  'pintura': { icon: MdBrush, name: 'Pintura', category: 'design', confidence: 1.0 },
  
  // Personagem
  'personagem': { icon: FaUser, name: 'Personagem', category: 'design', confidence: 1.0 },
  'character': { icon: MdPerson, name: 'Character', category: 'design', confidence: 1.0 },
  
  // Tecnologia
  'tecnologia': { icon: FaLaptop, name: 'Tecnologia', category: 'tech', confidence: 1.0 },
  'tech': { icon: MdComputer, name: 'Tech', category: 'tech', confidence: 1.0 },
  'codigo': { icon: FaCode, name: 'Código', category: 'tech', confidence: 1.0 },
  'desenvolvimento': { icon: MdCode, name: 'Desenvolvimento', category: 'tech', confidence: 1.0 },
  
  // Formatação/Operações
  'formatacao': { icon: MdFormatPaint, name: 'Formatação', category: 'other', confidence: 1.0 },
  'insercao': { icon: FaPlus, name: 'Inserção', category: 'other', confidence: 1.0 },
  'alteracao': { icon: FaRedo, name: 'Alteração', category: 'other', confidence: 1.0 },
  'reducao': { icon: FaCompress, name: 'Redução', category: 'other', confidence: 1.0 },
  'cobertura': { icon: FaLayerGroup, name: 'Cobertura', category: 'other', confidence: 1.0 },
};

// Palavras-chave para mapeamento semântico
const SEMANTIC_KEYWORDS: Record<string, IconMappingResult> = {
  // Animação & Motion
  'anim': { icon: MdAnimation, name: 'Animation', category: 'animation', confidence: 0.8 },
  'move': { icon: FiVideo, name: 'Movement', category: 'video', confidence: 0.7 },
  'motion': { icon: FaVideo, name: 'Motion', category: 'video', confidence: 0.9 },
  
  // Vídeo & Edição
  'edit': { icon: MdEdit, name: 'Edit', category: 'video', confidence: 0.8 },
  'corte': { icon: MdEdit, name: 'Corte', category: 'video', confidence: 0.8 },
  'montagem': { icon: FiLayers, name: 'Montagem', category: 'video', confidence: 0.8 },
  'cinema': { icon: MdMovie, name: 'Cinema', category: 'video', confidence: 0.7 },
  
  // Áudio
  'mic': { icon: FiMic, name: 'Microphone', category: 'audio', confidence: 0.8 },
  'record': { icon: FaMicrophone, name: 'Record', category: 'audio', confidence: 0.8 },
  'music': { icon: MdMusicNote, name: 'Music', category: 'audio', confidence: 0.7 },
  
  // Imagem & Foto
  'pic': { icon: FiImage, name: 'Picture', category: 'image', confidence: 0.8 },
  'imag': { icon: MdImage, name: 'Image', category: 'image', confidence: 0.8 },
  'shoot': { icon: FaPhotoVideo, name: 'Shoot', category: 'image', confidence: 0.7 },
  
  // Design
  'paint': { icon: FaPalette, name: 'Paint', category: 'design', confidence: 0.8 },
  'draw': { icon: MdBrush, name: 'Draw', category: 'design', confidence: 0.8 },
  'color': { icon: MdColorLens, name: 'Color', category: 'design', confidence: 0.7 },
  
  // Tech
  'dev': { icon: MdCode, name: 'Development', category: 'tech', confidence: 0.8 },
  'program': { icon: FaCode, name: 'Programming', category: 'tech', confidence: 0.8 },
  'system': { icon: MdComputer, name: 'System', category: 'tech', confidence: 0.7 },
};

// Função para normalizar texto
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .trim();
}

// Função principal para obter ícone por tipo
export function getIconByType(tipo: string | undefined | null, titulo?: string): IconMappingResult {
  if (!tipo && !titulo) {
    return { icon: FiPackage, name: 'Default', category: 'other', confidence: 0.1 };
  }
  
  // Combina tipo e título para análise
  const searchText = `${tipo || ''} ${titulo || ''}`;
  const normalized = normalizeText(searchText);
  
  // 1. Procura por mapeamento exato do tipo
  if (tipo) {
    const normalizedType = normalizeText(tipo);
    const exactMatch = EXACT_TYPE_MAPPING[normalizedType];
    if (exactMatch) {
      return exactMatch;
    }
  }
  
  // 2. Procura por palavras-chave no texto combinado
  const keywords = Object.keys(SEMANTIC_KEYWORDS);
  let bestMatch: IconMappingResult | null = null;
  let highestConfidence = 0;
  
  for (const keyword of keywords) {
    if (normalized.includes(keyword)) {
      const match = SEMANTIC_KEYWORDS[keyword];
      if (match.confidence > highestConfidence) {
        highestConfidence = match.confidence;
        bestMatch = match;
      }
    }
  }
  
  if (bestMatch) {
    return bestMatch;
  }
  
  // 3. Análise por categoria baseada em patterns
  if (normalized.includes('video') || normalized.includes('film') || normalized.includes('cinema')) {
    return { icon: MdMovie, name: 'Video Content', category: 'video', confidence: 0.6 };
  }
  
  if (normalized.includes('audio') || normalized.includes('sound') || normalized.includes('music')) {
    return { icon: MdMusicNote, name: 'Audio Content', category: 'audio', confidence: 0.6 };
  }
  
  if (normalized.includes('image') || normalized.includes('photo') || normalized.includes('picture')) {
    return { icon: MdImage, name: 'Image Content', category: 'image', confidence: 0.6 };
  }
  
  if (normalized.includes('design') || normalized.includes('art') || normalized.includes('visual')) {
    return { icon: MdDesignServices, name: 'Design Content', category: 'design', confidence: 0.6 };
  }
  
  if (normalized.includes('tech') || normalized.includes('code') || normalized.includes('system')) {
    return { icon: MdComputer, name: 'Tech Content', category: 'tech', confidence: 0.6 };
  }
  
  // 4. Fallback: ícone genérico
  return { icon: FaTools, name: 'Generic Work', category: 'other', confidence: 0.3 };
}

// Função para obter ícone por categoria
export function getIconByCategory(category: string): IconMappingResult {
  const categoryMap: Record<string, IconMappingResult> = {
    'animation': { icon: MdAnimation, name: 'Animation', category: 'animation', confidence: 1.0 },
    'video': { icon: MdMovie, name: 'Video', category: 'video', confidence: 1.0 },
    'audio': { icon: MdMusicNote, name: 'Audio', category: 'audio', confidence: 1.0 },
    'image': { icon: MdImage, name: 'Image', category: 'image', confidence: 1.0 },
    'design': { icon: MdDesignServices, name: 'Design', category: 'design', confidence: 1.0 },
    'tech': { icon: MdComputer, name: 'Technology', category: 'tech', confidence: 1.0 },
    'other': { icon: FaTools, name: 'Other', category: 'other', confidence: 1.0 },
  };
  
  return categoryMap[category] || categoryMap['other'];
}

// Função para listar todos os tipos conhecidos (útil para debug)
export function getAllKnownTypes(): string[] {
  return Object.keys(EXACT_TYPE_MAPPING);
}

// Função para análise de confiança
export function analyzeIconConfidence(tipo: string | undefined, titulo?: string): {
  result: IconMappingResult;
  analysis: string;
} {
  const result = getIconByType(tipo, titulo);
  
  let analysis = '';
  if (result.confidence >= 0.9) {
    analysis = 'Mapeamento exato encontrado';
  } else if (result.confidence >= 0.7) {
    analysis = 'Mapeamento semântico de alta confiança';
  } else if (result.confidence >= 0.5) {
    analysis = 'Mapeamento semântico moderado';
  } else if (result.confidence >= 0.3) {
    analysis = 'Mapeamento por categoria inferida';
  } else {
    analysis = 'Ícone padrão - sem correspondência encontrada';
  }
  
  return { result, analysis };
}