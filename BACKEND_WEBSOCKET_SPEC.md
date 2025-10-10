# 🔌 BACKEND WEBSOCKET - Especificação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Instalação e Configuração](#instalação-e-configuração)
4. [Estrutura de Dados](#estrutura-de-dados)
5. [Eventos WebSocket](#eventos-websocket)
6. [Salas (Rooms)](#salas-rooms)
7. [Autenticação](#autenticação)
8. [Implementação Backend](#implementação-backend)
9. [Escalabilidade (Redis)](#escalabilidade-redis)
10. [Testes](#testes)

---

## 🎯 Visão Geral

O frontend MOD está preparado para receber dados em **tempo real** via **WebSocket** usando **Socket.IO**.

### Por que WebSocket?
- ✅ **Atualização em tempo real** (countdowns de tarefas a cada segundo)
- ✅ **Múltiplos usuários simultâneos** com sincronização instantânea
- ✅ **Menos overhead** que polling (conexão persistente)
- ✅ **Comunicação bidirecional** (cliente ↔ servidor)

### Requisitos Críticos
- ⏱️ **Countdown de tarefas**: Atualiza a cada segundo na página de Entrega
- 👥 **Múltiplos usuários**: Sincronização instantânea entre todos os clientes
- 📊 **4 páginas principais**:
  1. Dashboard (lista de projetos + lista de tarefas)
  2. Detalhe do Projeto (entregas e serviços)
  3. Detalhe da Entrega (serviços, tarefas, countdown)
  4. (Futuro) Outras páginas

---

## 🏗️ Arquitetura

```
┌─────────────┐
│   Frontend  │ (Next.js + Socket.IO Client)
│   (porta    │
│    3000)    │
└──────┬──────┘
       │ WebSocket
       │ (Socket.IO)
       ↓
┌──────────────┐
│   Backend    │ (Node.js + Socket.IO Server)
│   WebSocket  │
│   (porta     │
│    3001)     │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   Database   │ (PostgreSQL/MySQL/Supabase)
│              │
└──────────────┘

┌──────────────┐
│    Redis     │ (Opcional - Para escalar)
│   (pub/sub)  │
└──────────────┘
```

### Fluxo de Dados

1. **Cliente conecta** → Servidor autentica e registra
2. **Cliente entra em salas** → `projeto:123`, `entrega:456`, etc.
3. **Servidor envia dados iniciais** → Carga inicial de dados
4. **Updates acontecem no backend** → Servidor emite eventos para salas específicas
5. **Todos os clientes na sala recebem** → UI atualiza automaticamente

---

## 🛠️ Instalação e Configuração

### Backend (Node.js + TypeScript)

```bash
# Criar projeto
mkdir backend-mod-websocket
cd backend-mod-websocket
npm init -y

# Instalar dependências
npm install socket.io express cors dotenv
npm install --save-dev typescript @types/node @types/express @types/socket.io ts-node nodemon

# Inicializar TypeScript
npx tsc --init
```

### `tsconfig.json`
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
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### `package.json` (scripts)
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### `.env`
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/mod_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=seu_secret_super_seguro_aqui
CORS_ORIGIN=http://localhost:3000
```

---

## 📊 Estrutura de Dados

### Interfaces TypeScript (Backend)

```typescript
// src/types/index.ts

type Status = 'nao-iniciado' | 'em-andamento' | 'concluido' | 'atrasado';

export interface Tarefa {
  id: string;
  nome: string;
  descricao?: string;
  status: Status;
  start_at?: string;          // ISO 8601
  duration?: number;           // minutos
  end_at?: string;             // ISO 8601
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
  prazo_data?: string;         // ISO 8601
  briefing?: string;
  briefing_data?: any;         // JSON livre
  janela?: any;                // JSON livre (dados da "janela")
  servicos?: Servico[];
  created_at?: string;
  updated_at?: string;
}

export interface Projeto {
  id: string;
  demanda_codigo: string;      // Ex: "DEM-2024-001"
  cliente_nome: string;
  descricao?: string;
  status: Status;
  progresso_percentual: number;
  prazo_data: string;          // ISO 8601
  created_at?: string;
  updated_at?: string;
  entregas?: Entrega[];
}

// Para a aba "Tarefas" do dashboard
export interface TarefaEnriquecida extends Tarefa {
  projeto?: Projeto;
  entrega?: Entrega;
}
```

---

## 🔌 Eventos WebSocket

### 📥 Eventos que o FRONTEND envia (cliente → servidor)

#### 1. **Dashboard - Projetos**
```typescript
// Cliente entra na sala de projetos
socket.emit('join_room', { room: 'projetos' });

// Solicita lista de projetos
socket.emit('get_projetos');
```

#### 2. **Dashboard - Tarefas**
```typescript
// Cliente entra na sala de tarefas
socket.emit('join_room', { room: 'tarefas' });

// Solicita lista de tarefas (com projeto e entrega)
socket.emit('get_tarefas');
```

#### 3. **Detalhe do Projeto**
```typescript
// Cliente entra na sala do projeto específico
socket.emit('join_room', { room: 'projeto:123' });

// Solicita dados do projeto
socket.emit('get_projeto', { projetoId: '123' });
```

#### 4. **Detalhe da Entrega (CRÍTICO)**
```typescript
// Cliente entra na sala da entrega específica
socket.emit('join_room', { room: 'entrega:456' });

// Solicita dados da entrega
socket.emit('get_entrega', { entregaId: '456' });
```

#### 5. **Sair de uma sala**
```typescript
socket.emit('leave_room', { room: 'projeto:123' });
```

#### 6. **React Flow - Manipulação de Serviços**

**Criar novo serviço (adicionar nó no canvas)**
```typescript
socket.emit('create_servico', {
  entregaId: '456',
  servico: {
    nome: 'Novo Serviço',
    descricao: 'Descrição do serviço',
    ordem: 3,
    pode_executar_paralelo: false,
    dependencias: ['serv_1'], // IDs dos serviços predecessores
    status: 'nao-iniciado',
    progresso_percentual: 0
  }
});
```

**Atualizar serviço (mover nó, editar, conectar)**
```typescript
socket.emit('update_servico', {
  entregaId: '456',
  servico: {
    id: 's1',
    dependencias: ['serv_0'], // ← nova conexão criada
    etapa: 2, // ← recalculado pelo backend após mudança
  }
});
```

**Deletar serviço (remover nó do canvas)**
```typescript
socket.emit('delete_servico', {
  entregaId: '456',
  servicoId: 's2'
});
```

**Recalcular etapas (após mudanças na estrutura)**
```typescript
socket.emit('recalcular_etapas', { entregaId: '456' });
```

**Salvar layout completo (após reorganizar vários nós)**
```typescript
socket.emit('update_servicos_bulk', {
  entregaId: '456',
  servicos: [
    { id: 's1', ordem: 1, etapa: 1 },
    { id: 's2', ordem: 2, etapa: 2 },
    { id: 's3', ordem: 3, etapa: 2 }, // paralelo com s2
  ]
});
```

---

### 📤 Eventos que o BACKEND envia (servidor → cliente)

#### 1. **Dashboard - Projetos**

**Dados Iniciais**
```typescript
// Servidor envia para o cliente que solicitou
socket.emit('projetos_initial', [
  {
    id: '1',
    demanda_codigo: 'DEM-2024-001',
    cliente_nome: 'Cliente XYZ',
    status: 'em-andamento',
    progresso_percentual: 65,
    prazo_data: '2024-03-15T23:59:59Z',
    entregas: [...]  // opcional: pode incluir entregas resumidas
  },
  // ... mais projetos
]);
```

**Atualização em Tempo Real**
```typescript
// Servidor envia para TODOS na sala "projetos"
io.to('projetos').emit('projeto_updated', {
  id: '1',
  demanda_codigo: 'DEM-2024-001',
  cliente_nome: 'Cliente XYZ',
  status: 'em-andamento',
  progresso_percentual: 70,  // ← mudou!
  prazo_data: '2024-03-15T23:59:59Z',
  // ... resto dos dados
});
```

**Novo Projeto Criado**
```typescript
io.to('projetos').emit('projeto_created', {
  id: '2',
  demanda_codigo: 'DEM-2024-002',
  cliente_nome: 'Cliente ABC',
  status: 'nao-iniciado',
  progresso_percentual: 0,
  prazo_data: '2024-04-20T23:59:59Z',
});
```

**Projeto Deletado**
```typescript
io.to('projetos').emit('projeto_deleted', { id: '1' });
```

#### 2. **Dashboard - Tarefas**

**Dados Iniciais**
```typescript
socket.emit('tarefas_initial', [
  {
    id: 't1',
    nome: 'Criar layout',
    status: 'em-andamento',
    start_at: '2024-01-15T14:00:00Z',
    duration: 120,  // 120 minutos
    end_at: '2024-01-15T16:00:00Z',
    progresso_percentual: 50,
    responsavel_nome: 'João Silva',
    setor: 'Design',
    // Dados enriquecidos:
    projeto: {
      id: 'p1',
      demanda_codigo: 'DEM-2024-001',
      cliente_nome: 'Cliente XYZ',
      status: 'em-andamento',
      progresso_percentual: 65,
      prazo_data: '2024-03-15T23:59:59Z',
    },
    entrega: {
      id: 'e1',
      nome: 'Homepage',
      status: 'em-andamento',
      progresso_percentual: 45,
    }
  },
  // ... mais tarefas
]);
```

**Atualização de Tarefa**
```typescript
io.to('tarefas').emit('tarefa_updated', {
  id: 't1',
  nome: 'Criar layout',
  status: 'concluido',  // ← mudou!
  progresso_percentual: 100,  // ← mudou!
  // ... resto dos dados + projeto + entrega
});
```

#### 3. **Detalhe do Projeto**

**Dados Iniciais**
```typescript
socket.emit('projeto_initial', {
  id: '1',
  demanda_codigo: 'DEM-2024-001',
  cliente_nome: 'Cliente XYZ',
  descricao: 'Projeto completo de website',
  status: 'em-andamento',
  progresso_percentual: 65,
  prazo_data: '2024-03-15T23:59:59Z',
  entregas: [
    {
      id: 'e1',
      nome: 'Homepage',
      status: 'em-andamento',
      progresso_percentual: 45,
      prazo_data: '2024-02-01T23:59:59Z',
      servicos: [
        {
          id: 's1',
          nome: 'Design',
          status: 'em-andamento',
          progresso_percentual: 60,
          ordem: 1,
        },
        // ... mais serviços (resumidos, sem tarefas)
      ]
    },
    // ... mais entregas
  ]
});
```

**Atualização do Projeto**
```typescript
io.to('projeto:1').emit('projeto_updated', {
  // dados completos atualizados do projeto
});
```

**Atualização de uma Entrega (dentro do projeto)**
```typescript
io.to('projeto:1').emit('entrega_updated', {
  id: 'e1',
  nome: 'Homepage',
  status: 'em-andamento',
  progresso_percentual: 50,  // ← mudou!
  // ... resto dos dados da entrega
});
```

#### 4. **Detalhe da Entrega (CRÍTICO - Tempo Real)**

**Dados Iniciais**
```typescript
socket.emit('entrega_initial', {
  id: 'e1',
  nome: 'Homepage',
  descricao: 'Desenvolvimento da homepage',
  status: 'em-andamento',
  progresso_percentual: 45,
  prazo_data: '2024-02-01T23:59:59Z',
  briefing: 'Briefing em texto livre...',
  briefing_data: {
    objetivo: 'Criar homepage moderna',
    publico_alvo: 'Jovens 18-35 anos',
    // ... outros campos JSON livre
  },
  janela: {
    etapas: ['Briefing', 'Design', 'Desenvolvimento', 'Aprovação'],
    // ... outros campos JSON livre
  },
  servicos: [
    {
      id: 's1',
      nome: 'Design',
      status: 'concluido',
      progresso_percentual: 100,
      ordem: 1,
      tarefas: [
        {
          id: 't1',
          nome: 'Criar wireframe',
          status: 'concluido',
          start_at: '2024-01-10T09:00:00Z',
          duration: 60,
          end_at: '2024-01-10T10:00:00Z',
          progresso_percentual: 100,
          responsavel_nome: 'João Silva',
          setor: 'Design',
        },
        {
          id: 't2',
          nome: 'Criar layout final',
          status: 'em-andamento',
          start_at: '2024-01-15T14:00:00Z',
          duration: 120,
          end_at: '2024-01-15T16:00:00Z',  // ← COUNTDOWN!
          progresso_percentual: 50,
          responsavel_nome: 'Maria Santos',
          setor: 'Design',
        }
      ]
    },
    {
      id: 's2',
      nome: 'Desenvolvimento',
      status: 'em-andamento',
      progresso_percentual: 30,
      ordem: 2,
      tarefas: [
        {
          id: 't3',
          nome: 'Implementar HTML/CSS',
          status: 'em-andamento',
          start_at: '2024-01-16T09:00:00Z',
          duration: 240,
          end_at: '2024-01-16T13:00:00Z',  // ← COUNTDOWN!
          progresso_percentual: 30,
          responsavel_nome: 'Pedro Lima',
          setor: 'Desenvolvimento',
        }
      ]
    }
  ]
});
```

**Atualização da Entrega**
```typescript
io.to('entrega:e1').emit('entrega_updated', {
  // dados completos atualizados da entrega
});
```

**Atualização de Serviço (dentro da entrega)**
```typescript
io.to('entrega:e1').emit('servico_updated', {
  id: 's1',
  nome: 'Design',
  status: 'concluido',  // ← mudou!
  progresso_percentual: 100,
  // ... resto dos dados
});
```

**Atualização de Tarefa (CRÍTICO - A CADA SEGUNDO)**
```typescript
// ⚠️ IMPORTANTE: Isso pode acontecer a cada segundo se houver countdown!
io.to('entrega:e1').emit('tarefa_updated', {
  id: 't2',
  nome: 'Criar layout final',
  status: 'em-andamento',
  start_at: '2024-01-15T14:00:00Z',
  duration: 120,
  end_at: '2024-01-15T16:00:00Z',
  progresso_percentual: 52,  // ← pode mudar frequentemente
  responsavel_nome: 'Maria Santos',
  setor: 'Design',
});
```

**Nova Tarefa Criada**
```typescript
io.to('entrega:e1').emit('tarefa_created', {
  servicoId: 's1',
  tarefa: {
    id: 't4',
    nome: 'Nova tarefa',
    status: 'nao-iniciado',
    progresso_percentual: 0,
    setor: 'Design',
  }
});
```

**Tarefa Deletada**
```typescript
io.to('entrega:e1').emit('tarefa_deleted', { tarefaId: 't2' });
```

**Novo Serviço Criado (React Flow - novo nó)**
```typescript
io.to('entrega:e1').emit('servico_created', {
  id: 's3',
  nome: 'Novo Serviço',
  status: 'nao-iniciado',
  progresso_percentual: 0,
  ordem: 3,
  etapa: null,
  pode_executar_paralelo: false,
  dependencias: [],
  tarefas: []
});
```

**Serviço Deletado (React Flow - remover nó)**
```typescript
io.to('entrega:e1').emit('servico_deleted', { servicoId: 's2' });
```

#### 5. **Eventos Globais**

**Erro**
```typescript
socket.emit('error', { message: 'Erro ao buscar projeto' });
```

**Ping/Pong (Heartbeat)**
```typescript
// Servidor → Cliente
socket.emit('ping');

// Cliente → Servidor (já implementado no SocketManager)
socket.emit('pong');
```

---

## 🏠 Salas (Rooms)

### Conceito
Salas (rooms) permitem agrupar clientes e enviar eventos apenas para um grupo específico.

### Estrutura de Salas

```typescript
// Sala global de projetos
'projetos'                // Todos os clientes vendo a lista de projetos

// Sala global de tarefas
'tarefas'                 // Todos os clientes vendo a lista de tarefas

// Sala de um projeto específico
'projeto:123'             // Apenas clientes vendo o projeto 123

// Sala de uma entrega específica
'entrega:456'             // Apenas clientes vendo a entrega 456

// Sala de um usuário específico (notificações)
'user:789'                // Apenas o usuário 789
```

### Quando usar cada sala?

| Página                  | Sala(s)                          |
|-------------------------|----------------------------------|
| Dashboard (Projetos)    | `projetos`                       |
| Dashboard (Tarefas)     | `tarefas`                        |
| Detalhe Projeto         | `projeto:{id}`                   |
| Detalhe Entrega         | `entrega:{id}`                   |

---

## 🔐 Autenticação

### Implementação JWT

```typescript
// src/middleware/auth.ts
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

export const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Token não fornecido'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    socket.data.user = decoded;
    next();
  } catch (error) {
    return next(new Error('Token inválido'));
  }
};
```

### Uso no Frontend (modificar SocketManager.ts)

```typescript
// Frontend envia token na conexão
this.socket = io(this.url, {
  auth: {
    token: localStorage.getItem('jwt_token')  // ou de onde vier o token
  },
  transports: ['websocket', 'polling'],
  // ...
});
```

---

## 💻 Implementação Backend

### Estrutura de Pastas

```
backend-mod-websocket/
├── src/
│   ├── server.ts               # Servidor principal
│   ├── socket/
│   │   ├── index.ts            # Socket.IO setup
│   │   ├── handlers/
│   │   │   ├── projetos.ts     # Handlers de projetos
│   │   │   ├── tarefas.ts      # Handlers de tarefas
│   │   │   ├── entregas.ts     # Handlers de entregas
│   │   │   └── rooms.ts        # Handlers de rooms
│   ├── database/
│   │   ├── connection.ts       # Conexão com DB
│   │   └── queries.ts          # Queries SQL
│   ├── services/
│   │   ├── ProjetoService.ts
│   │   ├── TarefaService.ts
│   │   └── EntregaService.ts
│   ├── middleware/
│   │   └── auth.ts             # Autenticação JWT
│   └── types/
│       └── index.ts            # Interfaces TypeScript
├── .env
├── package.json
└── tsconfig.json
```

### `src/server.ts`

```typescript
import express from 'express';
import { createServer } from 'http';
import { setupSocketIO } from './socket';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Setup Socket.IO
setupSocketIO(httpServer);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🔌 WebSocket disponível em ws://localhost:${PORT}`);
});
```

### `src/socket/index.ts`

```typescript
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { authenticateSocket } from '../middleware/auth';
import { setupProjetosHandlers } from './handlers/projetos';
import { setupTarefasHandlers } from './handlers/tarefas';
import { setupEntregasHandlers } from './handlers/entregas';
import { setupRoomsHandlers } from './handlers/rooms';

export const setupSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Autenticação (opcional - comentar se não usar JWT ainda)
  // io.use(authenticateSocket);

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Cliente conectado: ${socket.id}`);
    // console.log(`👤 Usuário: ${socket.data.user?.username}`);

    // Setup de handlers
    setupRoomsHandlers(io, socket);
    setupProjetosHandlers(io, socket);
    setupTarefasHandlers(io, socket);
    setupEntregasHandlers(io, socket);

    // Heartbeat
    socket.on('pong', () => {
      console.log(`💓 Pong recebido de ${socket.id}`);
    });

    // Desconexão
    socket.on('disconnect', (reason) => {
      console.log(`❌ Cliente desconectado: ${socket.id} - Razão: ${reason}`);
    });
  });

  // Heartbeat a cada 30 segundos
  setInterval(() => {
    io.emit('ping');
  }, 30000);

  return io;
};
```

### `src/socket/handlers/rooms.ts`

```typescript
import { Server as SocketIOServer, Socket } from 'socket.io';

export const setupRoomsHandlers = (io: SocketIOServer, socket: Socket) => {
  // Entrar em uma sala
  socket.on('join_room', ({ room }: { room: string }) => {
    socket.join(room);
    console.log(`🚪 Cliente ${socket.id} entrou na sala: ${room}`);
  });

  // Sair de uma sala
  socket.on('leave_room', ({ room }: { room: string }) => {
    socket.leave(room);
    console.log(`🚪 Cliente ${socket.id} saiu da sala: ${room}`);
  });
};
```

### `src/socket/handlers/projetos.ts`

```typescript
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ProjetoService } from '../../services/ProjetoService';

const projetoService = new ProjetoService();

export const setupProjetosHandlers = (io: SocketIOServer, socket: Socket) => {
  // Cliente solicita lista de projetos
  socket.on('get_projetos', async () => {
    try {
      const projetos = await projetoService.getAll();
      socket.emit('projetos_initial', projetos);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      socket.emit('error', { message: 'Erro ao buscar projetos' });
    }
  });

  // Cliente solicita um projeto específico
  socket.on('get_projeto', async ({ projetoId }: { projetoId: string }) => {
    try {
      const projeto = await projetoService.getById(projetoId);
      socket.emit('projeto_initial', projeto);
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      socket.emit('error', { message: 'Erro ao buscar projeto' });
    }
  });
};

// Função auxiliar para emitir atualização de projeto (chamada quando DB muda)
export const emitProjetoUpdated = (io: SocketIOServer, projeto: any) => {
  io.to('projetos').emit('projeto_updated', projeto);
  io.to(`projeto:${projeto.id}`).emit('projeto_updated', projeto);
};
```

### `src/socket/handlers/entregas.ts`

```typescript
import { Server as SocketIOServer, Socket } from 'socket.io';
import { EntregaService } from '../../services/EntregaService';

const entregaService = new EntregaService();

export const setupEntregasHandlers = (io: SocketIOServer, socket: Socket) => {
  // Cliente solicita uma entrega específica
  socket.on('get_entrega', async ({ entregaId }: { entregaId: string }) => {
    try {
      const entrega = await entregaService.getByIdWithServicosAndTarefas(entregaId);
      socket.emit('entrega_initial', entrega);
    } catch (error) {
      console.error('Erro ao buscar entrega:', error);
      socket.emit('error', { message: 'Erro ao buscar entrega' });
    }
  });
};

// Função auxiliar para emitir atualização de tarefa
export const emitTarefaUpdated = (io: SocketIOServer, tarefaId: string, entregaId: string) => {
  // Busca tarefa atualizada do DB
  // tarefaService.getById(tarefaId).then(tarefa => {
  //   io.to(`entrega:${entregaId}`).emit('tarefa_updated', tarefa);
  //   io.to('tarefas').emit('tarefa_updated', tarefa);  // se estiver na aba tarefas
  // });
};
```

### `src/services/ProjetoService.ts`

```typescript
import { Projeto } from '../types';
// import { db } from '../database/connection';  // Sua conexão com DB

export class ProjetoService {
  async getAll(): Promise<Projeto[]> {
    // TODO: Buscar do banco de dados
    // const result = await db.query('SELECT * FROM projetos');
    // return result.rows;
    
    // Mock temporário
    return [
      {
        id: '1',
        demanda_codigo: 'DEM-2024-001',
        cliente_nome: 'Cliente XYZ',
        status: 'em-andamento',
        progresso_percentual: 65,
        prazo_data: '2024-03-15T23:59:59Z',
      }
    ];
  }

  async getById(id: string): Promise<Projeto | null> {
    // TODO: Buscar do banco de dados com entregas
    // const result = await db.query('SELECT * FROM projetos WHERE id = $1', [id]);
    // return result.rows[0] || null;
    
    return {
      id,
      demanda_codigo: 'DEM-2024-001',
      cliente_nome: 'Cliente XYZ',
      status: 'em-andamento',
      progresso_percentual: 65,
      prazo_data: '2024-03-15T23:59:59Z',
      entregas: []
    };
  }

  async update(id: string, data: Partial<Projeto>): Promise<Projeto> {
    // TODO: Atualizar no banco de dados
    // await db.query('UPDATE projetos SET ... WHERE id = $1', [id]);
    // Buscar atualizado
    return this.getById(id) as any;
  }
}
```

---

## 🔥 Escalabilidade com Redis

### Por que Redis?

Quando você tem **múltiplos servidores** WebSocket (para escalar horizontalmente), você precisa de um **pub/sub** para sincronizar eventos entre servidores.

### Instalação

```bash
npm install redis @socket.io/redis-adapter
```

### Configuração

```typescript
// src/socket/index.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export const setupSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Setup Redis Adapter
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter conectado');
  });

  // ... resto do código
};
```

### Quando usar Redis?

- ✅ Produção com múltiplos servidores
- ✅ Load balancer na frente dos servidores WebSocket
- ❌ Desenvolvimento local (não precisa)
- ❌ Servidor único em produção (não precisa)

---

## 🧪 Testes

### Testar Conexão

```bash
# Frontend
npm run dev  # porta 3000

# Backend
npm run dev  # porta 3001
```

Abra o console do navegador e veja:
```
✅ WebSocket conectado: abc123xyz
🚪 Entrando na sala: projetos
```

### Testar com `wscat`

```bash
# Instalar
npm install -g wscat

# Conectar
wscat -c ws://localhost:3001

# Enviar evento
> {"event": "get_projetos"}
```

### Teste de Carga (opcional)

```bash
npm install -g artillery

# criar arquivo artillery.yml
artillery run artillery.yml
```

---

## 📝 Checklist de Implementação

### Backend

- [ ] Instalar dependências (`socket.io`, `express`, etc.)
- [ ] Criar estrutura de pastas
- [ ] Implementar `server.ts`
- [ ] Implementar `socket/index.ts`
- [ ] Implementar handlers:
  - [ ] `rooms.ts` (entrar/sair de salas)
  - [ ] `projetos.ts` (get_projetos, get_projeto)
  - [ ] `tarefas.ts` (get_tarefas)
  - [ ] `entregas.ts` (get_entrega)
- [ ] Implementar services:
  - [ ] `ProjetoService.ts` (getAll, getById, update)
  - [ ] `TarefaService.ts` (getAll, getById, update)
  - [ ] `EntregaService.ts` (getById, update)
- [ ] Conectar ao banco de dados
- [ ] Implementar autenticação JWT (opcional)
- [ ] Testar conexão com frontend
- [ ] Implementar lógica de emissão de eventos quando dados mudam
- [ ] (Opcional) Configurar Redis para escalabilidade

### Lógica de Negócio Crítica

- [ ] **Countdown de Tarefas**: Criar job que atualiza `end_at` das tarefas a cada segundo
  - Opção 1: `setInterval` que emite `tarefa_updated` a cada segundo
  - Opção 2: Frontend calcula countdown localmente (melhor performance)
  
- [ ] **Cálculo de Progresso**: Quando uma tarefa muda, recalcular:
  - Progresso do serviço
  - Progresso da entrega
  - Progresso do projeto
  
- [ ] **Notificações**: Quando uma tarefa está próxima do fim, notificar responsável

---

## 🎯 Próximos Passos

1. **Implementar backend básico** com mock data
2. **Testar conexão** com frontend MOD
3. **Conectar ao banco de dados** real
4. **Implementar lógica de atualização** automática
5. **Deploy** em servidor de produção
6. **Monitoramento** (logs, métricas, erros)
7. **Documentação** da API completa

---

## 🆘 Suporte

Se tiver dúvidas sobre a estrutura esperada pelo frontend, consulte:
- `WEBSOCKET_EXAMPLES.tsx` - Exemplos de uso nos componentes
- `app/hooks/useRealtimeData.ts` - Hooks de integração
- `lib/websocket/SocketManager.ts` - Gerenciador de conexão

---

**Feito com 💜 pelo time MOD**
