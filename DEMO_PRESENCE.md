# 🎭 Demo - Sistema de Presença Colaborativa (Estilo Figma)

## 🚀 Como Testar

### Passo 1: Inicie o servidor de desenvolvimento

```bash
npm run dev -- -p 3003
```

### Passo 2: Acesse a demo

Você tem **2 opções**:

#### Opção A: Botão flutuante na Home
1. Vá para `http://localhost:3003`
2. Clique no botão **"🎭 Ver Demo de Cursores"** no canto inferior direito

#### Opção B: Acesso direto
1. Vá direto para `http://localhost:3003/demo-presence`

---

## 🎮 O que a Demo Faz

### ✨ Funcionalidades Visuais

1. **Setas/Flechas Coloridas em Tempo Real** (igual Figma!)
   - Cada usuário simulado tem uma seta/flecha com cor única
   - Nome do usuário aparece ao lado da seta
   - Movimento suave e realista
   - 💤 Emoji quando usuário fica ausente

2. **Chat com Balões Flutuantes** ("Say something" style)
   - Pressione "/" para digitar mensagem
   - Balão rosa/colorido aparece perto do cursor
   - Mensagens aparecem por 5 segundos e somem
   - Outros usuários veem suas mensagens

3. **Avatares Flutuantes no Topo Direito** (discretos)
   - Avatares empilhados de todos os usuários
   - Status: 🟢 Ativo / 🟡 Ausente
   - Clique para expandir lista completa
   - Contagem de usuários extras

### 🎛️ Controles da Demo

- **▶️ Iniciar/⏹️ Parar** - Liga/desliga a simulação
- **👁️ Cursores Visíveis/Ocultos** - Mostra/esconde os cursores
- **⚡ Velocidade** (1x a 5x) - Controla velocidade do movimento
- **👥 Usuários Simulados** (1 a 4) - Quantos usuários aparecem

---

## 👥 Usuários Simulados

A demo cria 4 usuários fictícios:

1. **Maria Silva** (🟢 azul) - Navegando em Projeto #123
2. **Pedro Santos** (🟢 verde) - Navegando em Entrega #456
3. **Ana Costa** (🟠 laranja) - No Dashboard
4. **Carlos Oliveira** (🟣 roxo) - Navegando em Projeto #123

### Comportamentos Automáticos

- ✅ **Cursores se movem aleatoriamente** (movimento realista)
- ✅ **Aleatoriamente começam a editar** algo (✏️ Editando...)
- ✅ **Ficam ausentes aleatoriamente** ((ausente))
- ✅ **Cores únicas** geradas por hash do user_id

---

## 🎨 O Que Você Vai Ver

### Na Tela Principal:
```
┌─────────────────────────────────────────────────┐
│  Dashboard de Projetos          👥 4 usuários   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Projeto 1]  [Projeto 2]  [Projeto 3]         │
│       ↑                                         │
│     🔵 Maria Silva                              │
│                                                 │
│  [Projeto 4]  [Projeto 5]  [Projeto 6]         │
│                     ↑                           │
│                   🟢 Pedro Santos               │
│                                                 │
└─────────────────────────────────────────────────┘
```

### No Painel Lateral:
```
┌──────────────────────────────┐
│ 👥 Usuários Ativos (4)       │
├──────────────────────────────┤
│ 🔵 Você                      │
│ 📊 Dashboard                 │
│                              │
│ 🟢 Maria Silva              │
│ 📁 Projeto #123             │
│ ✏️ Editando...              │
│                              │
│ 🟠 Pedro Santos             │
│ 📦 Entrega #456             │
│                              │
│ 🟡 Ana Costa (ausente)      │
│ 📊 Dashboard                │
└──────────────────────────────┘
```

---

## 🔧 Testando Interatividade

### Experimente:

1. **Mude a velocidade** para 5x e veja os cursores voando! 🚀
2. **Aumente o número de usuários** para ver mais cursores
3. **Esconda os cursores** para ver só o painel lateral
4. **Mova SEU cursor** - você NÃO verá seu próprio cursor (correto!)
5. **Observe as cores únicas** - cada usuário tem uma cor consistente

---

## 🎯 Casos de Uso Real

Quando o backend estiver pronto, isso funcionará:

### 1. **No Dashboard**
```tsx
import { usePresence } from '@/app/hooks/usePresence';
import { CollaborativeCursors } from '@/app/components/CollaborativeCursors';

function Dashboard() {
  usePresence({
    user_id: currentUser.id,
    user_name: currentUser.name,
    page: 'dashboard',
  });

  return (
    <>
      <CollaborativeCursors />
      {/* Seu conteúdo */}
    </>
  );
}
```

### 2. **Na Página de Projeto**
```tsx
function ProjetoPage({ id }: { id: string }) {
  const { startEditing, stopEditing } = usePresence({
    user_id: currentUser.id,
    user_name: currentUser.name,
    page: 'projeto',
    page_id: id,
  });

  const handleEdit = (taskId: string) => {
    startEditing(taskId); // Trava para outros
    // ... abrir modal
  };

  return (
    <>
      <CollaborativeCursors />
      <ActiveUsersPanel />
      {/* Seu conteúdo */}
    </>
  );
}
```

### 3. **No React Flow (DnD)**
```tsx
function ServiceCanvas({ entregaId }: { entregaId: string }) {
  usePresence({
    user_id: currentUser.id,
    user_name: currentUser.name,
    page: 'entrega',
    page_id: entregaId,
  });

  return (
    <>
      <CollaborativeCursors />
      <ReactFlow>
        {/* Seu canvas */}
      </ReactFlow>
    </>
  );
}
```

---

## 📊 Performance

### Otimizações Implementadas

✅ **Throttle de 50ms** no movimento do cursor
✅ **Cleanup automático** ao desmontar componentes
✅ **Idle detection** (30s sem movimento)
✅ **Apenas memória** (não salva no banco)
✅ **Broadcast eficiente** (só para quem está na mesma sala)

### Métricas Esperadas

- 📡 **~20 eventos/segundo** por usuário (movimento de cursor)
- 💾 **~500 bytes** por evento
- 🚀 **Latência < 100ms** entre usuários
- ⚡ **CPU < 5%** com 10 usuários simultâneos

---

## 🐛 Troubleshooting

### Cursores não aparecem?
- ✅ Verifique se clicou em "▶️ Iniciar Demonstração"
- ✅ Verifique se "👁️ Cursores Visíveis" está ativado
- ✅ Olhe no console do navegador para erros

### Movimento muito lento/rápido?
- ✅ Ajuste o slider de velocidade (1x a 5x)

### Painel lateral não aparece?
- ✅ Certifique-se que a demo está ativa
- ✅ Largura da tela deve ser > 1024px

---

## 🎨 Customização

### Mudar Cores dos Cursores

Edite `lib/websocket/PresenceManager.ts`:

```typescript
private generateColor(userId: string): string {
  const colors = [
    '#FF6B6B', // vermelho
    '#4ECDC4', // ciano
    '#45B7D1', // azul claro
    '#FFA07A', // salmão
    // ... adicione suas cores
  ];
  // ...
}
```

### Mudar Timeout de Idle

Edite `lib/websocket/PresenceManager.ts`:

```typescript
private readonly IDLE_TIMEOUT_MS = 30000; // 30s → mude aqui
```

---

## 🚀 Próximos Passos

1. ✅ **Testar visualmente** - Você está aqui!
2. ⏳ **Ajustar design** baseado no seu feedback
3. ⏳ **Implementar backend** (Socket.IO server)
4. ⏳ **Integrar nas páginas reais** (Dashboard, Projetos, etc)
5. ⏳ **Deploy e teste com usuários reais**

---

## 💬 Feedback

**O que você acha?**

- Cores estão boas?
- Tamanho do cursor está ok?
- Painel lateral está funcional?
- Faltou alguma coisa?

**Me avise e eu ajusto! 💜**

---

Feito com 💜 pelo time MOD
