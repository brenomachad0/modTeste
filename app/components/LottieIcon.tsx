'use client';
import React from 'react';
import { getIconByType, IconMappingResult } from '../utils/iconMapping';

interface LottieIconProps {
  tipo?: string;
  titulo?: string;
  className?: string;
  size?: number;
  showTooltip?: boolean;
}

const LottieIcon: React.FC<LottieIconProps> = ({ 
  tipo, 
  titulo, 
  className = '',
  size = 24,
  showTooltip = false
}) => {
  const iconMapping: IconMappingResult = getIconByType(tipo, titulo);
  const IconComponent = iconMapping.icon;
  
  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      title={showTooltip ? `${iconMapping.name} (${Math.round(iconMapping.confidence * 100)}% confiança)` : undefined}
    >
      <IconComponent 
        {...({ size } as any)}
        className={`text-current ${iconMapping.category === 'animation' ? 'text-purple-500' :
          iconMapping.category === 'video' ? 'text-blue-500' :
          iconMapping.category === 'audio' ? 'text-green-500' :
          iconMapping.category === 'image' ? 'text-yellow-500' :
          iconMapping.category === 'design' ? 'text-pink-500' :
          iconMapping.category === 'tech' ? 'text-indigo-500' :
          'text-gray-500'}`}
      />
    </div>
  );
};

export default LottieIcon;