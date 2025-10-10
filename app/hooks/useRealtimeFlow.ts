'use client';

import { useSocket } from './useSocket';
import { Servico } from './useRealtimeData';

/**
 * Hook especializado para operações do React Flow
 * Use este hook nos componentes que manipulam o canvas (DnD, conexões, etc)
 */
export const useRealtimeFlow = (entregaId: string) => {
  const { emit, isConnected } = useSocket();

  /**
   * Atualiza um serviço (posição, dependências, etc)
   * Chamado quando:
   * - Arrasta um nó
   * - Cria/remove uma conexão (edge)
   * - Edita propriedades do serviço
   */
  const updateServico = (servico: Partial<Servico> & { id: string }) => {
    if (!isConnected) {
      console.warn('⚠️ WebSocket não conectado. Mudanças não serão salvas.');
      return;
    }
    emit('update_servico', { entregaId, servico });
  };

  /**
   * Cria um novo serviço
   * Chamado quando adiciona um nó no canvas
   */
  const createServico = (servico: Omit<Servico, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isConnected) {
      console.warn('⚠️ WebSocket não conectado. Serviço não será criado.');
      return;
    }
    emit('create_servico', { entregaId, servico });
  };

  /**
   * Deleta um serviço
   * Chamado quando remove um nó do canvas
   */
  const deleteServico = (servicoId: string) => {
    if (!isConnected) {
      console.warn('⚠️ WebSocket não conectado. Serviço não será deletado.');
      return;
    }
    emit('delete_servico', { entregaId, servicoId });
  };

  /**
   * Atualiza as dependências de um serviço
   * Chamado quando cria/remove conexões (edges)
   */
  const updateDependencias = (servicoId: string, dependencias: string[]) => {
    if (!isConnected) {
      console.warn('⚠️ WebSocket não conectado. Dependências não serão salvas.');
      return;
    }
    emit('update_servico', {
      entregaId,
      servico: { id: servicoId, dependencias },
    });
  };

  /**
   * Recalcula as etapas (BFS) após mudanças na estrutura
   * Chamado após criar/remover dependências
   */
  const recalcularEtapas = () => {
    if (!isConnected) {
      console.warn('⚠️ WebSocket não conectado. Etapas não serão recalculadas.');
      return;
    }
    emit('recalcular_etapas', { entregaId });
  };

  /**
   * Salva o layout completo do canvas
   * Chamado quando termina de reorganizar vários nós
   */
  const saveLayout = (servicos: Partial<Servico>[]) => {
    if (!isConnected) {
      console.warn('⚠️ WebSocket não conectado. Layout não será salvo.');
      return;
    }
    emit('update_servicos_bulk', { entregaId, servicos });
  };

  return {
    updateServico,
    createServico,
    deleteServico,
    updateDependencias,
    recalcularEtapas,
    saveLayout,
    isConnected,
  };
};
