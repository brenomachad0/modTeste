'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

type Status = 'nao-iniciado' | 'em-andamento' | 'concluido' | 'atrasado';

export interface Tarefa {
  id: string;
  nome: string;
  descricao?: string;
  status: Status;
  start_at?: string;
  duration?: number;
  end_at?: string;
  progresso_percentual: number;
  responsavel_nome?: string;
  setor: string;
  prioridade?: 'baixa' | 'media' | 'alta';
  created_at?: string;
  updated_at?: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  status: Status;
  progresso_percentual: number;
  ordem: number;
  tarefas?: Tarefa[];
  created_at?: string;
  updated_at?: string;
}

export interface Entrega {
  id: string;
  nome: string;
  descricao?: string;
  status: Status;
  progresso_percentual: number;
  prazo_data?: string;
  briefing?: string;
  briefing_data?: any;
  janela?: any;
  servicos?: Servico[];
  created_at?: string;
  updated_at?: string;
}

export interface Projeto {
  id: string;
  demanda_codigo: string;
  cliente_nome: string;
  descricao?: string;
  status: Status;
  progresso_percentual: number;
  prazo_data: string;
  created_at?: string;
  updated_at?: string;
  entregas?: Entrega[];
}

/**
 * Hook para trabalhar com dados em tempo real (Dashboard)
 */
export const useRealtimeProjetos = () => {
  const { on, emit, isConnected, joinRoom, leaveRoom } = useSocket();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    // Entra na sala de projetos
    joinRoom('projetos');

    // Solicita dados iniciais
    emit('get_projetos');

    // Listener para dados iniciais
    const unsubscribeInitial = on<Projeto[]>('projetos_initial', (data) => {
      setProjetos(data);
      setLoading(false);
    });

    // Listener para atualizações em tempo real
    const unsubscribeUpdate = on<Projeto>('projeto_updated', (updatedProjeto) => {
      setProjetos((prev) =>
        prev.map((p) => (p.id === updatedProjeto.id ? updatedProjeto : p))
      );
    });

    // Listener para novos projetos
    const unsubscribeNew = on<Projeto>('projeto_created', (newProjeto) => {
      setProjetos((prev) => [...prev, newProjeto]);
    });

    // Listener para projetos deletados
    const unsubscribeDeleted = on<{ id: string }>('projeto_deleted', ({ id }) => {
      setProjetos((prev) => prev.filter((p) => p.id !== id));
    });

    // Listener para erros
    const unsubscribeError = on<{ message: string }>('error', ({ message }) => {
      setError(message);
      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribeInitial();
      unsubscribeUpdate();
      unsubscribeNew();
      unsubscribeDeleted();
      unsubscribeError();
      leaveRoom('projetos');
    };
  }, [isConnected, on, emit, joinRoom, leaveRoom]);

  return { projetos, loading, error, isConnected };
};

/**
 * Hook para trabalhar com dados em tempo real de um projeto específico
 */
export const useRealtimeProjeto = (projetoId: string | null) => {
  const { on, emit, isConnected, joinRoom, leaveRoom } = useSocket();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !projetoId) return;

    // Entra na sala do projeto específico
    joinRoom(`projeto:${projetoId}`);

    // Solicita dados iniciais
    emit('get_projeto', { projetoId });

    // Listener para dados iniciais
    const unsubscribeInitial = on<Projeto>('projeto_initial', (data) => {
      setProjeto(data);
      setLoading(false);
    });

    // Listener para atualizações em tempo real
    const unsubscribeUpdate = on<Projeto>('projeto_updated', (updatedProjeto) => {
      if (updatedProjeto.id === projetoId) {
        setProjeto(updatedProjeto);
      }
    });

    // Listener para atualizações de entregas
    const unsubscribeEntregaUpdate = on<Entrega>('entrega_updated', (updatedEntrega) => {
      setProjeto((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entregas: prev.entregas?.map((e) =>
            e.id === updatedEntrega.id ? updatedEntrega : e
          ),
        };
      });
    });

    // Listener para erros
    const unsubscribeError = on<{ message: string }>('error', ({ message }) => {
      setError(message);
      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribeInitial();
      unsubscribeUpdate();
      unsubscribeEntregaUpdate();
      unsubscribeError();
      leaveRoom(`projeto:${projetoId}`);
    };
  }, [isConnected, projetoId, on, emit, joinRoom, leaveRoom]);

  return { projeto, loading, error, isConnected };
};

/**
 * Hook para trabalhar com dados em tempo real de uma entrega específica
 * CRÍTICO: Atualiza countdowns de tarefas a cada segundo
 */
export const useRealtimeEntrega = (entregaId: string | null) => {
  const { on, emit, isConnected, joinRoom, leaveRoom } = useSocket();
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !entregaId) return;

    // Entra na sala da entrega específica
    joinRoom(`entrega:${entregaId}`);

    // Solicita dados iniciais
    emit('get_entrega', { entregaId });

    // Listener para dados iniciais
    const unsubscribeInitial = on<Entrega>('entrega_initial', (data) => {
      setEntrega(data);
      setLoading(false);
    });

    // Listener para atualizações em tempo real
    const unsubscribeUpdate = on<Entrega>('entrega_updated', (updatedEntrega) => {
      if (updatedEntrega.id === entregaId) {
        setEntrega(updatedEntrega);
      }
    });

    // Listener para atualizações de serviços
    const unsubscribeServicoUpdate = on<Servico>('servico_updated', (updatedServico) => {
      setEntrega((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          servicos: prev.servicos?.map((s) =>
            s.id === updatedServico.id ? updatedServico : s
          ),
        };
      });
    });

    // Listener para atualizações de tarefas (tempo real - crítico)
    const unsubscribeTarefaUpdate = on<Tarefa>('tarefa_updated', (updatedTarefa) => {
      setEntrega((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          servicos: prev.servicos?.map((servico) => ({
            ...servico,
            tarefas: servico.tarefas?.map((t) =>
              t.id === updatedTarefa.id ? updatedTarefa : t
            ),
          })),
        };
      });
    });

    // Listener para criação de tarefas
    const unsubscribeTarefaCreated = on<{ servicoId: string; tarefa: Tarefa }>(
      'tarefa_created',
      ({ servicoId, tarefa }) => {
        setEntrega((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            servicos: prev.servicos?.map((servico) =>
              servico.id === servicoId
                ? { ...servico, tarefas: [...(servico.tarefas || []), tarefa] }
                : servico
            ),
          };
        });
      }
    );

    // Listener para deleção de tarefas
    const unsubscribeTarefaDeleted = on<{ tarefaId: string }>(
      'tarefa_deleted',
      ({ tarefaId }) => {
        setEntrega((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            servicos: prev.servicos?.map((servico) => ({
              ...servico,
              tarefas: servico.tarefas?.filter((t) => t.id !== tarefaId),
            })),
          };
        });
      }
    );

    // Listener para erros
    const unsubscribeError = on<{ message: string }>('error', ({ message }) => {
      setError(message);
      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribeInitial();
      unsubscribeUpdate();
      unsubscribeServicoUpdate();
      unsubscribeTarefaUpdate();
      unsubscribeTarefaCreated();
      unsubscribeTarefaDeleted();
      unsubscribeError();
      leaveRoom(`entrega:${entregaId}`);
    };
  }, [isConnected, entregaId, on, emit, joinRoom, leaveRoom]);

  return { entrega, loading, error, isConnected };
};

/**
 * Hook para trabalhar com todas as tarefas (aba "Tarefas" do dashboard)
 */
export const useRealtimeTarefas = () => {
  const { on, emit, isConnected, joinRoom, leaveRoom } = useSocket();
  const [tarefas, setTarefas] = useState<(Tarefa & { projeto?: Projeto; entrega?: Entrega })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    // Entra na sala de tarefas
    joinRoom('tarefas');

    // Solicita dados iniciais
    emit('get_tarefas');

    // Listener para dados iniciais
    const unsubscribeInitial = on<(Tarefa & { projeto?: Projeto; entrega?: Entrega })[]>(
      'tarefas_initial',
      (data) => {
        setTarefas(data);
        setLoading(false);
      }
    );

    // Listener para atualizações em tempo real
    const unsubscribeUpdate = on<Tarefa & { projeto?: Projeto; entrega?: Entrega }>(
      'tarefa_updated',
      (updatedTarefa) => {
        setTarefas((prev) =>
          prev.map((t) => (t.id === updatedTarefa.id ? updatedTarefa : t))
        );
      }
    );

    // Listener para novas tarefas
    const unsubscribeNew = on<Tarefa & { projeto?: Projeto; entrega?: Entrega }>(
      'tarefa_created',
      (newTarefa) => {
        setTarefas((prev) => [...prev, newTarefa]);
      }
    );

    // Listener para tarefas deletadas
    const unsubscribeDeleted = on<{ id: string }>('tarefa_deleted', ({ id }) => {
      setTarefas((prev) => prev.filter((t) => t.id !== id));
    });

    // Listener para erros
    const unsubscribeError = on<{ message: string }>('error', ({ message }) => {
      setError(message);
      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribeInitial();
      unsubscribeUpdate();
      unsubscribeNew();
      unsubscribeDeleted();
      unsubscribeError();
      leaveRoom('tarefas');
    };
  }, [isConnected, on, emit, joinRoom, leaveRoom]);

  return { tarefas, loading, error, isConnected };
};
