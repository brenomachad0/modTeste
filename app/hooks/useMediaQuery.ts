'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para detectar tamanho da tela
 * Retorna true se a tela é maior ou igual ao breakpoint especificado
 * 
 * @param query - Media query (ex: '(min-width: 768px)')
 * @returns boolean indicando se a query é verdadeira
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener
    media.addEventListener('change', listener);

    // Cleanup
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  // Durante SSR ou antes da montagem, retornar false por padrão
  return mounted ? matches : false;
}

/**
 * Hook específico para desktop (>= 768px)
 * Mobile e tablets pequenos: false
 * iPad e desktop: true
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

/**
 * Hook específico para mobile (< 768px)
 */
export function useIsMobile(): boolean {
  const isDesktop = useIsDesktop();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? !isDesktop : false;
}
