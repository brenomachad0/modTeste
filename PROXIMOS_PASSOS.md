# 🚀 Próximos Passos - Implementação WebSocket

## ✅ O que já está pronto no Frontend

1. ✅ **Infraestrutura WebSocket completa**
   - `SocketManager.ts` - Gerenciador com auto-reconnect
   - `SocketContext.tsx` - Provider React
   - `useSocket.ts` - Hook básico
   - `useRealtimeData.ts` - Hooks especializados para cada página

2. ✅ **Integração no Layout**
   - `SocketProvider` envolvendo toda aplicação
   - Conexão automática ao servidor

3. ✅ **Configuração**
   - `.env.local` com URL do WebSocket server
   - Variável: `NEXT_PUBLIC_WS_URL=http://localhost:3001`

4. ✅ **Documentação Completa**
   - `BACKEND_WEBSOCKET_SPEC.md` - Guia para backend
   - `WEBSOCKET_EXAMPLES.tsx` - Exemplos de uso

---

## 🔧 O que VOCÊ precisa fazer

### 1️⃣ **Implementar o Backend WebSocket** 

Siga o guia em **`BACKEND_WEBSOCKET_SPEC.md`** que tem:
- ✅ Estrutura completa de pastas
- ✅ Código exemplo de cada arquivo
- ✅ Todos os eventos que o frontend espera
- ✅ Estrutura de salas (rooms)
- ✅ Autenticação JWT (opcional)
- ✅ Redis para escalar (opcional)

**Tempo estimado:** 1-2 dias

**Comando para iniciar:**
```bash
mkdir backend-mod-websocket
cd backend-mod-websocket
npm init -y
npm install socket.io express cors dotenv
npm install --save-dev typescript @types/node @types/express @types/socket.io ts-node nodemon
```

---

### 2️⃣ **Atualizar Componentes do Frontend**

Os componentes atuais usam **mock data** (`data/mockData.ts`). Você precisa trocar pelos **hooks de WebSocket**.

#### 📁 Arquivos para atualizar:

1. **`app/components/ProjectListView.tsx`** (Dashboard)
   ```tsx
   // ANTES (mock):
   import { mockProjetos } from '@/data/mockData';
   const [projetos] = useState(mockProjetos);
   
   // DEPOIS (WebSocket):
   import { useRealtimeProjetos, useRealtimeTarefas } from '@/app/hooks/useRealtimeData';
   const { projetos, loading, error, isConnected } = useRealtimeProjetos();
   const { tarefas } = useRealtimeTarefas();
   ```

2. **`app/components/ProjectDetail.tsx`** (Detalhe do Projeto)
   ```tsx
   // ANTES (mock):
   const projeto = mockProjetos.find(p => p.id === projetoId);
   
   // DEPOIS (WebSocket):
   import { useRealtimeProjeto } from '@/app/hooks/useRealtimeData';
   const { projeto, loading, error } = useRealtimeProjeto(projetoId);
   ```

3. **`app/projetos/[id]/entregas/[entregaId]/page.tsx`** (Detalhe da Entrega - CRÍTICO)
   ```tsx
   // ANTES (mock):
   const entrega = mockProjetos
     .flatMap(p => p.entregas)
     .find(e => e.id === entregaId);
   
   // DEPOIS (WebSocket):
   import { useRealtimeEntrega } from '@/app/hooks/useRealtimeData';
   const { entrega, loading, error } = useRealtimeEntrega(entregaId);
   ```

**Consulte:** `WEBSOCKET_EXAMPLES.tsx` para ver exemplos completos

**Tempo estimado:** 2-3 horas

---

### 3️⃣ **Testar Integração**

1. **Subir Backend WebSocket**
   ```bash
   cd backend-mod-websocket
   npm run dev  # porta 3001
   ```

2. **Subir Frontend**
   ```bash
   cd frontend-mod
   npm run dev  # porta 3000
   ```

3. **Verificar conexão no console:**
   ```
   ✅ WebSocket conectado: abc123xyz
   🟢 Conectado
   ```

4. **Testar cada página:**
   - Dashboard → deve carregar projetos e tarefas
   - Detalhe Projeto → deve carregar entregas
   - Detalhe Entrega → deve atualizar countdown em tempo real

---

### 4️⃣ **Remover Mock Data (quando estiver 100% funcionando)**

```bash
rm data/mockData.ts
```

E remover imports de `mockData` dos componentes.

---

## 🎯 Ordem Recomendada

1. ✅ Implementar backend básico (2-4 horas)
2. ✅ Testar conexão com frontend (30 min)
3. ✅ Conectar backend ao banco de dados real (2-4 horas)
4. ✅ Atualizar componente `ProjectListView` (1 hora)
5. ✅ Atualizar componente `ProjectDetail` (30 min)
6. ✅ Atualizar componente `EntregaDetail` (1 hora)
7. ✅ Testar tudo junto (1 hora)
8. ✅ Remover mock data (10 min)

**Total estimado:** 1-2 dias de desenvolvimento

---

## 📚 Referências Rápidas

### Eventos que o Frontend Envia:
- `join_room` - Entrar em sala
- `leave_room` - Sair de sala
- `get_projetos` - Buscar lista de projetos
- `get_tarefas` - Buscar lista de tarefas
- `get_projeto` - Buscar projeto específico
- `get_entrega` - Buscar entrega específica

### Eventos que o Backend Deve Enviar:
- `projetos_initial` - Dados iniciais de projetos
- `projeto_updated` - Projeto atualizado
- `projeto_created` - Novo projeto
- `projeto_deleted` - Projeto deletado
- `tarefas_initial` - Dados iniciais de tarefas
- `tarefa_updated` - Tarefa atualizada (CRÍTICO - a cada segundo)
- `entrega_initial` - Dados iniciais de entrega
- `entrega_updated` - Entrega atualizada
- `servico_updated` - Serviço atualizado
- `error` - Erro

### Salas (Rooms):
- `projetos` - Todos os projetos
- `tarefas` - Todas as tarefas
- `projeto:{id}` - Projeto específico
- `entrega:{id}` - Entrega específica

---

## 🆘 Se tiver dúvidas

1. Consulte `BACKEND_WEBSOCKET_SPEC.md` para especificação completa
2. Consulte `WEBSOCKET_EXAMPLES.tsx` para exemplos de código
3. Veja `app/hooks/useRealtimeData.ts` para entender os hooks
4. Veja `lib/websocket/SocketManager.ts` para entender a conexão

---

## 🎉 Quando Terminar

Você terá um sistema **100% em tempo real** com:
- ⏱️ Countdown de tarefas atualizando a cada segundo
- 👥 Múltiplos usuários sincronizados instantaneamente
- 📊 Progresso atualizado automaticamente
- 🔄 Reconexão automática
- 🚀 Performance otimizada (WebSocket > Polling)

**Bora fazer acontecer! 🚀💜**
