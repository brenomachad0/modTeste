/**
 * 🎭 DEMO - Sistema de Presença Colaborativa
 * 
 * Página de demonstração com usuários simulados
 * Para testar visualmente os cursores e painel de usuários
 */

'use client';

import { useEffect, useState } from 'react';
import { presenceManager, UserPresence } from '@/lib/websocket/PresenceManager';
import { CollaborativeCursors } from '@/app/components/CollaborativeCursors';
import { PresenceIndicator } from '@/app/components/PresenceIndicator';
import { CollaborativeChat } from '@/app/components/CollaborativeChat';

// Usuários simulados
const MOCK_USERS = [
  {
    user_id: 'user_maria',
    user_name: 'Maria Silva',
    page: 'projeto' as const,
    page_id: 'proj_123',
  },
  {
    user_id: 'user_pedro',
    user_name: 'Pedro Santos',
    page: 'entrega' as const,
    page_id: 'ent_456',
  },
  {
    user_id: 'user_ana',
    user_name: 'Ana Costa',
    page: 'dashboard' as const,
  },
  {
    user_id: 'user_carlos',
    user_name: 'Carlos Oliveira',
    page: 'projeto' as const,
    page_id: 'proj_123',
  },
];

export default function DemoPresencePage() {
  const [mounted, setMounted] = useState(false);
  const [demoActive, setDemoActive] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 1x, 2x, 3x
  const [showCursors, setShowCursors] = useState(true);
  const [userCount, setUserCount] = useState(2);

  // Previne hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!demoActive) return;

    // Define o usuário atual (você)
    presenceManager.setCurrentUser({
      user_id: 'user_you',
      user_name: 'Você',
      page: 'dashboard',
    });

    // Adiciona usuários simulados
    const activeUsers = MOCK_USERS.slice(0, userCount);
    activeUsers.forEach(user => {
      presenceManager.setUser({
        ...user,
        cursor: {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
        },
      });
    });

    // Simula movimento de cursores
    const intervals: NodeJS.Timeout[] = [];
    
    activeUsers.forEach(user => {
      const interval = setInterval(() => {
        const currentUser = presenceManager.getUser(user.user_id);
        if (currentUser) {
          // Movimento suave e realista
          const newX = Math.max(0, Math.min(window.innerWidth, 
            currentUser.cursor.x + (Math.random() - 0.5) * 100 * simulationSpeed
          ));
          const newY = Math.max(0, Math.min(window.innerHeight,
            currentUser.cursor.y + (Math.random() - 0.5) * 100 * simulationSpeed
          ));
          
          presenceManager.updateCursor(user.user_id, newX, newY);
        }
      }, 200 / simulationSpeed); // Mais rápido = mais velocidade
      
      intervals.push(interval);
    });

    // Simula edição aleatória
    const editInterval = setInterval(() => {
      const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      const isCurrentlyEditing = presenceManager.getUser(randomUser.user_id)?.is_editing;
      
      if (isCurrentlyEditing) {
        presenceManager.stopEditing(randomUser.user_id);
      } else if (Math.random() > 0.5) {
        presenceManager.startEditing(randomUser.user_id, `task_${Math.floor(Math.random() * 10)}`);
      }
    }, 5000 / simulationSpeed);

    intervals.push(editInterval);

    // Simula idle (ausente)
    const idleInterval = setInterval(() => {
      const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      const current = presenceManager.getUser(randomUser.user_id);
      if (current) {
        presenceManager.setIdle(randomUser.user_id, !current.is_idle);
      }
    }, 8000 / simulationSpeed);

    intervals.push(idleInterval);

    // Simula mensagens aleatórias
    const messagesPool = [
      'Olá! 👋',
      'Está funcionando!',
      'Muito legal! 🎉',
      'Adorei o design',
      'Perfeito! ✨',
      'Show de bola! 🚀',
    ];

    const messageInterval = setInterval(() => {
      const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      const current = presenceManager.getUser(randomUser.user_id);
      if (current && Math.random() > 0.7) {
        const randomMessage = messagesPool[Math.floor(Math.random() * messagesPool.length)];
        
        // Dispara evento customizado para simular mensagem
        window.dispatchEvent(new CustomEvent('demo:chat-message', {
          detail: {
            user_id: randomUser.user_id,
            user_name: randomUser.user_name,
            message: randomMessage,
            color: current.color,
            position: { x: current.cursor.x, y: current.cursor.y },
            timestamp: Date.now(),
          }
        }));
      }
    }, 10000 / simulationSpeed);

    intervals.push(messageInterval);

    // Cleanup
    return () => {
      intervals.forEach(interval => clearInterval(interval));
      presenceManager.clear();
    };
  }, [demoActive, simulationSpeed, userCount]);

  const startDemo = () => {
    setDemoActive(true);
  };

  const stopDemo = () => {
    setDemoActive(false);
    presenceManager.clear();
  };

  // Renderiza loading enquanto não montar no cliente
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎭</div>
          <p className="text-gray-600 dark:text-gray-400">Carregando demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cursores colaborativos */}
      {demoActive && showCursors && <CollaborativeCursors />}

      {/* Indicador flutuante (estilo Figma) */}
      {demoActive && <PresenceIndicator />}

      {/* Chat colaborativo com balões flutuantes */}
      {demoActive && <CollaborativeChat />}

      <div className="flex h-screen">
        {/* Área principal */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Header com controles */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  🎭 Demo - Presença Colaborativa
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Sistema de cursores em tempo real estilo Figma/Google Docs
                </p>
                <p className="text-sm text-pink-600 dark:text-pink-400 mt-2">
                  � <strong>Pressione "/"</strong> para enviar uma mensagem flutuante!
                </p>
              </div>

              {/* Controles */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex gap-4 flex-wrap">
                  {!demoActive ? (
                    <button
                      onClick={startDemo}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      ▶️ Iniciar Demonstração
                    </button>
                  ) : (
                    <button
                      onClick={stopDemo}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      ⏹️ Parar Demonstração
                    </button>
                  )}

                  <button
                    onClick={() => setShowCursors(!showCursors)}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      showCursors
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                    disabled={!demoActive}
                  >
                    {showCursors ? '👁️ Cursores Visíveis' : '🙈 Cursores Ocultos'}
                  </button>
                </div>

                {/* Configurações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Velocidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ⚡ Velocidade: {simulationSpeed}x
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={simulationSpeed}
                      onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                      className="w-full"
                      disabled={!demoActive}
                    />
                  </div>

                  {/* Número de usuários */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      👥 Usuários Simulados: {userCount}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="1"
                      value={userCount}
                      onChange={(e) => setUserCount(Number(e.target.value))}
                      className="w-full"
                      disabled={demoActive} // Só muda antes de iniciar
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Área de conteúdo simulado */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                📊 Dashboard de Projetos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Projeto #{2024000 + i}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      15 entregas • 45 tarefas
                    </p>
                    <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${Math.random() * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explicação */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                💡 O que você está vendo:
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li>✅ <strong>Setas/Flechas coloridas</strong> igual Figma representam usuários</li>
                <li>✅ <strong>Nome ao lado da seta</strong> identifica quem é</li>
                <li>✅ <strong>Movimento suave</strong> em tempo real (throttled a 50ms)</li>
                <li>✅ <strong>Avatares flutuantes</strong> no topo direito (discretos)</li>
                <li>✅ <strong>Clique nos avatares</strong> para ver lista completa</li>
                <li>✅ <strong>Pressione "/"</strong> para enviar mensagem flutuante</li>
                <li>✅ <strong>Balão rosa "Say something"</strong> aparece perto do cursor</li>
                <li>✅ <strong>Mensagens aparecem</strong> por 5 segundos e somem</li>
              </ul>
            </div>
          </div>
        </main>


      </div>
    </div>
  );
}
