# 🚀 GUIA PRÁTICO - Implementação Backend WebSocket

## 📋 Checklist de Implementação

### ✅ Fase 1: Setup Inicial (30 minutos)

- [ ] Criar projeto Node.js + TypeScript
- [ ] Instalar dependências (socket.io, express, cors)
- [ ] Configurar variáveis de ambiente
- [ ] Criar estrutura de pastas

### ✅ Fase 2: WebSocket Básico (1 hora)

- [ ] Implementar servidor Socket.IO
- [ ] Configurar CORS
- [ ] Implementar autenticação JWT
- [ ] Testar conexão com frontend

### ✅ Fase 3: Sistema de Presença (2 horas)

- [ ] Implementar eventos de presença
- [ ] Store de presença (Map ou Redis)
- [ ] Gerenciamento de salas (rooms)
- [ ] Broadcast de eventos

### ✅ Fase 4: Sistema de Chat (1 hora)

- [ ] Implementar evento `chat:message`
- [ ] Validação e sanitização
- [ ] Rate limiting
- [ ] Broadcast para sala

### ✅ Fase 5: Dados em Tempo Real (3 horas)

- [ ] Implementar eventos de Projetos
- [ ] Implementar eventos de Entregas
- [ ] Implementar eventos de Tarefas
- [ ] Countdown de tarefas a cada segundo

### ✅ Fase 6: Testes e Otimização (2 horas)

- [ ] Testes de conexão
- [ ] Testes de performance
- [ ] Configurar Redis (opcional)
- [ ] Deploy

---

## 📁 Estrutura de Pastas

```
backend-websocket/
├── src/
│   ├── server.ts                 # Servidor principal
│   ├── config/
│   │   ├── database.ts           # Conexão com DB
│   │   └── redis.ts              # Conexão com Redis (opcional)
│   ├── socket/
│   │   ├── index.ts              # Setup do Socket.IO
│   │   ├── presence.ts           # Handlers de presença
│   │   ├── chat.ts               # Handlers de chat
│   │   ├── projetos.ts           # Handlers de projetos
│   │   ├── entregas.ts           # Handlers de entregas
│   │   └── tarefas.ts            # Handlers de tarefas
│   ├── middleware/
│   │   ├── auth.ts               # Autenticação JWT
│   │   └── rateLimit.ts          # Rate limiting
│   ├── services/
│   │   ├── countdownService.ts   # Job de countdown
│   │   └── presenceStore.ts      # Store de presença
│   └── types/
│       └── index.ts              # Interfaces TypeScript
├── .env
├── package.json
└── tsconfig.json
```

---

## 🛠️ Implementação Passo a Passo

### Passo 1: Criar Projeto

```bash
# Criar diretório
mkdir backend-websocket
cd backend-websocket

# Inicializar projeto
npm init -y

# Instalar dependências
npm install socket.io express cors dotenv jsonwebtoken
npm install --save-dev typescript @types/node @types/express @types/socket.io @types/jsonwebtoken ts-node nodemon

# Inicializar TypeScript
npx tsc --init
```

### Passo 2: Configurar `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Passo 3: Configurar `package.json` (scripts)

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### Passo 4: Criar `.env`

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=seu_secret_super_seguro_aqui_mude_isso
DATABASE_URL=postgresql://user:password@localhost:5432/mod_db
REDIS_URL=redis://localhost:6379
```

### Passo 5: Criar `src/server.ts`

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configurar CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Socket.IO com CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connections: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

// Importar handlers
import { setupPresenceHandlers } from './socket/presence';
import { setupChatHandlers } from './socket/chat';

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);

  // Setup handlers
  setupPresenceHandlers(io, socket);
  setupChatHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket rodando na porta ${PORT}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
});
```

### Passo 6: Criar `src/socket/presence.ts`

```typescript
import { Server, Socket } from 'socket.io';

interface UserPresence {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  color: string;
  page: string;
  page_id?: string;
  cursor: { x: number; y: number; viewport_width: number; viewport_height: number };
  is_editing?: string;
  is_idle: boolean;
  last_seen: string;
}

// Store de presença (em produção use Redis)
const presenceStore = new Map<string, UserPresence>();

export function setupPresenceHandlers(io: Server, socket: Socket) {
  
  // Usuário entra na página
  socket.on('presence:join', async (data: any) => {
    const { user_id, user_name, user_avatar, page, page_id, cursor } = data;
    
    const roomName = page_id ? `page:${page}:${page_id}` : `page:${page}`;
    
    // Salva presença
    const presence: UserPresence = {
      user_id,
      user_name,
      user_avatar,
      color: generateColor(user_id),
      page,
      page_id,
      cursor,
      is_editing: undefined,
      is_idle: false,
      last_seen: new Date().toISOString(),
    };
    
    presenceStore.set(user_id, presence);
    
    // Entra na sala
    socket.join(roomName);
    
    // Envia lista atual de usuários para o novo usuário
    const usersInRoom = getUsersInRoom(roomName);
    socket.emit('presence:users_list', { users: usersInRoom });
    
    // Avisa a sala que alguém entrou
    socket.to(roomName).emit('presence:user_joined', presence);
    
    console.log(`👤 ${user_name} entrou em ${roomName}`);
  });
  
  // Usuário sai da página
  socket.on('presence:leave', (data: any) => {
    const { user_id, page, page_id } = data;
    const roomName = page_id ? `page:${page}:${page_id}` : `page:${page}`;
    
    presenceStore.delete(user_id);
    socket.leave(roomName);
    socket.to(roomName).emit('presence:user_left', { user_id });
    
    console.log(`👋 Usuário ${user_id} saiu de ${roomName}`);
  });
  
  // Cursor moveu (throttled no frontend a cada 50ms)
  socket.on('presence:cursor_move', (data: any) => {
    const { user_id, page, page_id, x, y, viewport_width, viewport_height } = data;
    const roomName = page_id ? `page:${page}:${page_id}` : `page:${page}`;
    
    const presence = presenceStore.get(user_id);
    if (presence) {
      presence.cursor = { x, y, viewport_width, viewport_height };
      presence.last_seen = new Date().toISOString();
      presence.is_idle = false;
    }
    
    // Broadcast para todos na sala (exceto quem enviou)
    socket.to(roomName).emit('presence:cursor_moved', {
      user_id,
      cursor: { x, y, viewport_width, viewport_height },
      last_seen: new Date().toISOString(),
    });
  });
  
  // Começou/parou de editar
  socket.on('presence:editing', (data: any) => {
    const { user_id, page, page_id, item_id, is_editing } = data;
    const roomName = page_id ? `page:${page}:${page_id}` : `page:${page}`;
    
    const presence = presenceStore.get(user_id);
    if (presence) {
      presence.is_editing = is_editing ? item_id : undefined;
      presence.last_seen = new Date().toISOString();
    }
    
    socket.to(roomName).emit('presence:editing_changed', {
      user_id,
      item_id,
      is_editing,
    });
  });
  
  // Mudou de página
  socket.on('presence:page_change', (data: any) => {
    const { user_id, page, page_id } = data;
    
    // Remove da sala anterior
    const oldPresence = presenceStore.get(user_id);
    if (oldPresence) {
      const oldRoom = oldPresence.page_id 
        ? `page:${oldPresence.page}:${oldPresence.page_id}` 
        : `page:${oldPresence.page}`;
      socket.leave(oldRoom);
      socket.to(oldRoom).emit('presence:user_left', { user_id });
    }
    
    // Entra na nova sala
    const newRoom = page_id ? `page:${page}:${page_id}` : `page:${page}`;
    socket.join(newRoom);
    
    const presence = presenceStore.get(user_id);
    if (presence) {
      presence.page = page;
      presence.page_id = page_id;
      socket.to(newRoom).emit('presence:user_joined', presence);
    }
  });
  
  // Ao desconectar, remove presença
  socket.on('disconnect', () => {
    for (const [user_id, presence] of presenceStore.entries()) {
      const roomName = presence.page_id 
        ? `page:${presence.page}:${presence.page_id}` 
        : `page:${presence.page}`;
      socket.to(roomName).emit('presence:user_left', { user_id });
      presenceStore.delete(user_id);
    }
  });
}

// Helper: gera cor única
function generateColor(userId: string): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Helper: pega usuários em uma sala
function getUsersInRoom(roomName: string): UserPresence[] {
  const users: UserPresence[] = [];
  for (const presence of presenceStore.values()) {
    const room = presence.page_id 
      ? `page:${presence.page}:${presence.page_id}` 
      : `page:${presence.page}`;
    if (room === roomName) {
      users.push(presence);
    }
  }
  return users;
}
```

### Passo 7: Criar `src/socket/chat.ts`

```typescript
import { Server, Socket } from 'socket.io';

interface ChatMessage {
  user_id: string;
  user_name: string;
  message: string;
  color: string;
  position: { x: number; y: number };
  timestamp: number;
}

export function setupChatHandlers(io: Server, socket: Socket) {
  
  socket.on('chat:message', (data: ChatMessage) => {
    const { user_id, user_name, message, color, position, timestamp } = data;
    
    // Validações
    if (!message || message.length > 100) {
      socket.emit('chat:error', { error: 'Mensagem inválida' });
      return;
    }
    
    // Sanitiza HTML
    const sanitizedMessage = message.replace(/<[^>]*>/g, '');
    
    // TODO: Implementar rate limiting (Redis)
    
    // Broadcast para a sala (exceto quem enviou)
    // Note: você precisa saber qual sala o usuário está
    // Pode pegar do presenceStore ou do socket.rooms
    
    // Para simplificar, broadcast para todos conectados
    socket.broadcast.emit('chat:message', {
      user_id,
      user_name,
      message: sanitizedMessage,
      color,
      position,
      timestamp,
    });
    
    console.log(`💬 ${user_name}: ${sanitizedMessage}`);
  });
}
```

### Passo 8: Testar

```bash
# Iniciar backend
npm run dev

# Em outro terminal, iniciar frontend
cd ../frontend-mod
npm run dev -- -p 3000

# Acessar: http://localhost:3000/demo-presence
```

---

## 🎯 Próximos Passos

### Fase 2: Dados em Tempo Real

Depois que o sistema de presença estiver funcionando, implementar:

1. **Projetos**: `get_projetos`, `projeto_updated`, `projeto_created`, `projeto_deleted`
2. **Entregas**: `get_entrega`, `entrega_updated`, `servicos_updated`
3. **Tarefas**: `get_tarefas`, `tarefa_updated`, countdown a cada segundo
4. **React Flow**: `dnd_operation` (create, update, delete, dependencies)

Veja `BACKEND_WEBSOCKET_SPEC.md` para especificação completa de cada evento.

---

## 📚 Recursos

- **Socket.IO Docs**: https://socket.io/docs/v4/
- **Especificação Completa**: `BACKEND_WEBSOCKET_SPEC.md`
- **Exemplos de Uso**: `WEBSOCKET_EXAMPLES.tsx`
- **Demo Frontend**: http://localhost:3000/demo-presence

---

## ⚠️ Checklist de Segurança

- [ ] Autenticação JWT em todas as conexões
- [ ] Validar permissões (usuário pode acessar esta sala?)
- [ ] Rate limiting para chat (5 mensagens/minuto)
- [ ] Sanitizar todas as mensagens de chat
- [ ] Implementar timeout para presença (5 min de inatividade)
- [ ] Validar todos os dados de entrada
- [ ] Não expor dados sensíveis nos eventos

---

## 🚀 Deploy

### Variáveis de Ambiente (Produção)

```env
PORT=3001
FRONTEND_URL=https://seu-dominio.com
JWT_SECRET=seu_secret_super_seguro_aqui_use_pwgen
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://host:6379
NODE_ENV=production
```

### Comandos de Deploy

```bash
# Build
npm run build

# Iniciar
npm start

# Com PM2 (recomendado)
pm2 start dist/server.js --name websocket-backend
pm2 save
pm2 startup
```

---

**Dúvidas?** Consulte `BACKEND_WEBSOCKET_SPEC.md` para documentação completa! 🎉
