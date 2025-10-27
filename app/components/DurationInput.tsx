'use client';

import { useState, useRef, useEffect } from 'react';

interface DurationInputProps {
  value: number; // Valor em minutos
  onChange: (minutes: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Input de duração com formato DD HH:mm:ss
 * Máscara automática que formata enquanto digita
 */
export default function DurationInput({ value, onChange, className = '', disabled = false }: DurationInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Converter minutos para string formatada DD HH:mm:ss
  const minutesToString = (totalMinutos: number): string => {
    if (!totalMinutos || totalMinutos === 0) return '';
    
    const totalSegundos = Math.floor(totalMinutos * 60);
    const dias = Math.floor(totalSegundos / 86400);
    const horas = Math.floor((totalSegundos % 86400) / 3600);
    const mins = Math.floor((totalSegundos % 3600) / 60);
    const segs = totalSegundos % 60;
    
    return `${String(dias).padStart(2, '0')} ${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
  };

  // Converter string formatada para minutos
  const stringToMinutes = (str: string): number => {
    if (!str) return 0;
    
    // Tenta parsear o formato "DD HH:mm:ss"
    const match = str.match(/^(\d+)\s+(\d+):(\d+):(\d+)$/);
    
    if (match) {
      const dias = parseInt(match[1]) || 0;
      const horas = parseInt(match[2]) || 0;
      const mins = parseInt(match[3]) || 0;
      const segs = parseInt(match[4]) || 0;
      
      // Converte tudo para minutos
      return dias * 1440 + horas * 60 + mins + Math.floor(segs / 60);
    }
    
    return 0;
  };

  // Aplicar máscara enquanto digita
  const applyMask = (input: string): string => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    
    // Formata progressivamente: DD HH:mm:ss
    let formatted = '';
    const len = numbers.length;
    
    // Dias (primeiros 2 dígitos)
    if (len >= 1) {
      formatted = numbers.substring(0, Math.min(2, len));
    }
    
    // Espaço + Horas
    if (len > 2) {
      formatted += ' ' + numbers.substring(2, Math.min(4, len));
    }
    
    // :Minutos
    if (len > 4) {
      formatted += ':' + numbers.substring(4, Math.min(6, len));
    }
    
    // :Segundos
    if (len > 6) {
      formatted += ':' + numbers.substring(6, 8);
    }
    
    return formatted;
  };

  // Sincronizar com valor externo quando não estiver focado
  useEffect(() => {
    if (!isFocused) {
      // Só mostra valor se for maior que 0, caso contrário deixa vazio
      const formatted = value > 0 ? minutesToString(value) : '';
      setDisplayValue(formatted);
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Se o valor é 0 ou vazio, limpa para começar do zero
    if (!value || value === 0) {
      setDisplayValue('');
    }
    // Seleciona todo o texto para facilitar substituição
    setTimeout(() => {
      e.target.select();
    }, 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Converte o valor digitado para minutos
    const minutes = stringToMinutes(displayValue);
    
    // Notifica a mudança
    if (minutes !== value) {
      onChange(minutes);
    }
    
    // Formata o valor final
    setDisplayValue(minutesToString(minutes));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const masked = applyMask(newValue);
    setDisplayValue(masked);
    
    // Atualiza onChange em tempo real durante digitação
    const minutes = stringToMinutes(masked);
    if (masked.length >= 8 || masked.split(':').length === 3) {
      // Só notifica se tiver formato completo ou quase completo
      onChange(minutes);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite teclas de controle
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End'];
    const isArrow = e.key.startsWith('Arrow');
    
    if (controlKeys.includes(e.key) || isArrow) {
      return;
    }
    
    // Permite apenas números
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    
    // Limita a 8 dígitos (DD HH mm ss)
    const numbers = displayValue.replace(/\D/g, '');
    if (numbers.length >= 8) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="00 00:00:00"
        className={`w-full font-mono text-center placeholder:text-gray-600 placeholder:opacity-40 ${className}`}
        autoComplete="off"
      />
    </div>
  );
}
