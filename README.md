# 🎯 MOD Dashboard - Sistema de Gestão de Projetos e Entregas

Sistema completo de gerenciamento de projetos, entregas, serviços e tarefas com interface moderna e responsiva.

## 📁 Estrutura do Projeto

```
frontend-mod/
├── app/                          # Next.js App Router
│   ├── components/              # Componentes principais da aplicação
│   │   ├── ProjectListView.tsx # ⭐ Componente principal - Lista de projetos e tarefas
│   │   ├── ProjectDetail.tsx   # Detalhes e edição de projetos
│   │   ├── EntregasList.tsx    # Lista de entregas
│   │   ├── EntregaServicos.tsx # Serviços dentro de entregas
│   │   ├── ServiceFlowCanvas.tsx # Canvas React Flow para pipeline de serviços
│   │   ├── TaskViewModal.tsx   # Modal de visualização de tarefa
│   │   ├── TaskEditModal.tsx   # Modal de edição de tarefa
│   │   ├── TaskCompletionModal.tsx # Modal de conclusão de tarefa
│   │   ├── IconSelectorModal.tsx # Seletor de ícones para entregas
│   │   ├── PresetSelectionModal.tsx # Seletor de presets de serviços
│   │   └── ...                 # Outros componentes auxiliares
│   │
│   ├── projetos/               # Rotas de projetos
│   │   ├── [id]/              # Detalhes do projeto
│   │   │   └── entregas/      # Rotas de entregas
│   │   │       └── [entregaId]/ # Detalhes da entrega
│   │   │           └── page.tsx # Página de edição de entrega
│   │   └── page.tsx           # Lista de projetos
│   │
│   ├── hooks/                  # Custom React Hooks
│   │   └── useTemplates.ts    # Hook para gerenciar templates
│   │
│   ├── utils/                  # Utilitários
│   │   ├── iconMapping.ts     # Mapeamento de ícones
│   │   └── navigation.ts      # Helpers de navegação
│   │
│   ├── layout.tsx             # Layout principal
│   ├── page.tsx               # Página inicial (redireciona para projetos)
│   └── globals.css            # Estilos globais
│
├── components/                 # ⚠️ Componentes legados (para teste)
│   ├── EntregaEditorSimple.tsx
│   ├── TarefaManager.tsx
│   └── ...
│
├── config/
│   └── supabase.ts            # Configuração do Supabase
│
├── lib/
│   ├── api-config.ts          # Configurações de API
│   ├── entregas-api.ts        # API de entregas
│   └── projetos-api.ts        # API de projetos
│
├── data/
│   └── mockData.ts            # 🗄️ Dados mockados para desenvolvimento
│
├── public/                    # Arquivos estáticos
│
├── BACKEND_FLUXO_SPECS.md     # 📋 Especificações do fluxo React Flow
├── BACKEND_TAREFAS_SPECS.md   # 📋 Especificações da estrutura de tarefas
├── REFACTORING.md             # 📋 Histórico de refatoração
│
├── next.config.ts             # Configuração Next.js
├── tailwind.config.js         # Configuração Tailwind CSS
├── tsconfig.json              # Configuração TypeScript
└── package.json               # Dependências

```

## 🎨 Componentes Principais

### 📊 ProjectListView (`app/components/ProjectListView.tsx`)
**Componente principal da aplicação** - Gerencia visualização de projetos e tarefas

**Funcionalidades:**
- ✅ Visualização em abas (Projetos / Tarefas)
- ✅ Ordenação de projetos (por prazo de entrega / código numérico)
- ✅ Ordenação de tarefas (por prazo remanescente / alfabética)
- ✅ Cards de projeto com:
  - Código da demanda
  - Cliente e motivo
  - Barra de progresso
  - Data e hora estimada de entrega
- ✅ Cards de tarefa com:
  - Nome e responsável
  - Countdown em tempo real
  - Contexto (Demanda → Entrega → Serviço)
  - Badge de status
- ✅ Navegação para detalhes de projetos e entregas
- ✅ Modal de visualização de tarefas

**Sub-componentes:**
- `ProjectCard` - Card de projeto
- `TaskCard` - Card de tarefa com countdown
- `TabSelector` - Seletor de abas
- `ProjectSortControls` - Controles de ordenação de projetos
- `SortControls` - Controles de ordenação de tarefas

### 📦 ProjectDetail (`app/components/ProjectDetail.tsx`)
Visualização detalhada de um projeto específico

**Funcionalidades:**
- Informações do projeto
- Lista de entregas
- Estatísticas e progresso
- Navegação para detalhes de entregas

### 🎯 EntregaServicos (`app/components/EntregaServicos.tsx`)
Gerenciamento de serviços dentro de uma entrega

**Funcionalidades:**
- Canvas React Flow para visualização de pipeline
- Cálculo automático de etapas (BFS)
- Gerenciamento de serviços paralelos e sequenciais
- Adição e edição de serviços
- Gerenciamento de tarefas por serviço

### 🔄 ServiceFlowCanvas (`app/components/ServiceFlowCanvas.tsx`)
Canvas interativo com React Flow para visualizar pipeline de serviços

**Funcionalidades:**
- Visualização de dependências
- Drag and drop de serviços
- Cálculo de etapas de execução
- Indicação de serviços paralelos
- Zoom e pan

### 📝 Modais de Tarefas
- **TaskViewModal** - Visualização de detalhes
- **TaskEditModal** - Edição de tarefa
- **TaskCompletionModal** - Conclusão de tarefa com feedback

## 🗄️ Estrutura de Dados

### Projeto
```typescript
interface Projeto {
  id: string;
  demanda_codigo: string;        // Ex: "2024-0045"
  cliente_nome: string;
  motivo: string;
  status: 'aguardando' | 'executando' | 'pausada' | 'atrasada' | 'concluida' | 'preparacao';
  progresso_percentual: number;  // 0-100
  valor_total: number;
  prazo_dias: number;
  prazo_data: string;            // ISO 8601 date
  entregas?: Entrega[];
}
```

### Entrega
```typescript
interface Entrega {
  id: string;
  projeto_id: string;
  nome: string;
  briefing?: string;
  icone?: string;               // Emoji
  status: string;
  progresso_percentual: number;
  servicos?: Servico[];
  deadline?: string;
}
```

### Serviço
```typescript
interface Servico {
  id: string;
  entrega_id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  etapa?: number;               // Calculado via BFS
  pode_executar_paralelo: boolean;
  dependencias?: string[];      // IDs de serviços predecessores
  tarefas?: Tarefa[];
}
```

### Tarefa (Nova Estrutura)
```typescript
interface Tarefa {
  id: string;
  servico_id: string;
  nome: string;
  instrucao?: string;
  responsavel_nome?: string;
  responsavel_setor?: string;
  status: 'planejada' | 'executando' | 'pausada' | 'atrasada' | 'concluida';
  
  // ✅ Nova estrutura de prazo
  start_at?: string | null;     // ISO 8601 - quando iniciou
  duration?: number;             // Duração em minutos
  end_at?: string | null;        // ISO 8601 - quando finalizou
  
  // ⚠️ Campos legados (compatibilidade)
  prazo_horas: number;          // ⚠️ Na verdade em MINUTOS!
  data_inicio?: string;
  data_conclusao?: string;
  
  // Contexto (enriquecido em runtime)
  projeto_id?: string;
  projeto_codigo?: string;
  entrega_id?: string;
  entrega_nome?: string;
  servico_id?: string;
  servico_nome?: string;
}
```

## ⏱️ Sistema de Prazo de Tarefas

### Cálculo do Prazo Remanescente
```typescript
// Fórmula:
// - Completadas: Infinity (não aparecem na ordenação)
// - Em execução: (duration * 60 * 1000) - (now - start_at)
//   * Negativo = atrasada (mais negativo = mais urgente)
//   * Positivo = no prazo (menor valor = mais urgente)
// - Não iniciadas: Infinity

if (start_at && end_at) {
  return Infinity; // Completada
}

if (start_at) {
  const elapsed = now - new Date(start_at).getTime();
  const remaining = (duration * 60 * 1000) - elapsed;
  return remaining; // Pode ser negativo!
}

return Infinity; // Não iniciada
```

### Visual de Countdown
- **Verde** 🟢: Mais de 25% do tempo restante
- **Amarelo** 🟡: 10-25% do tempo restante
- **Laranja** 🟠: 0-10% do tempo restante
- **Vermelho** 🔴: Atrasada (tempo negativo)

## 🎯 Ordenação

### Projetos
1. **Por Prazo de Entrega** 📅
   - ASC: Prazos mais próximos primeiro
   - DESC: Prazos mais distantes primeiro
   - Sem data: aparecem no final

2. **Por Código Numérico** 🔢
   - Extrai ano e número do código (ex: "2024-0045")
   - ASC: 2024 antes de 2025, números menores primeiro
   - DESC: Ordem inversa

### Tarefas
1. **Por Prazo Remanescente** ⏱️
   - ASC: Mais urgentes primeiro (atrasadas → apertadas → folgadas)
   - DESC: Menos urgentes primeiro

2. **Por Ordem Alfabética** 🔤
   - ASC: A→Z
   - DESC: Z→A

## 🔧 Tecnologias

- **Next.js 15.5.4** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **React Flow** - Visualização de grafos/fluxos
- **Supabase** - Backend (configurado, não implementado)

## 🚀 Scripts

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint
```

## 📋 Páginas de Teste

### `/app/test-entrega`
Página de teste com componentes legados para edição de entregas.

**⚠️ Nota:** Esta pasta usa componentes da pasta raiz `/components` que são legados.
Considere migrar para os novos componentes de `/app/components`.

## 🗂️ Arquivos de Especificação

### BACKEND_FLUXO_SPECS.md
Especificações completas do sistema React Flow:
- Estrutura de nodes e edges
- Algoritmo BFS para cálculo de etapas
- Exemplos de payloads
- Casos de uso

### BACKEND_TAREFAS_SPECS.md
Especificações da nova estrutura de tarefas:
- Campos `start_at`, `duration`, `end_at`
- Regras de cálculo de prazo
- Exemplos de API
- Script de migração

## 🎨 Temas e Estilos

- **Dark Theme** - Interface escura por padrão
- **Gradientes** - Barras de progresso com gradientes coloridos
- **Glassmorphism** - Efeitos de backdrop blur
- **Compact Design** - Espaçamento otimizado para visualizar mais informação

## 📝 Dados Mockados

O arquivo `/data/mockData.ts` contém dados completos de exemplo:
- 7 projetos
- Múltiplas entregas por projeto
- Serviços com dependências
- Tarefas com prazos variados (atrasadas, apertadas, folgadas, concluídas)

**Tarefas de teste incluídas:**
- `tar_test_1`: -2 dias (muito atrasada)
- `tar_test_2`: -1 dia (atrasada)
- `tar_test_3`: 1h45 restantes (apertada)
- `tar_test_4`: 7h30 restantes (folgada)
- `tar_test_5-6`: Não iniciadas
- `tar_test_7`: Concluída

## 🔄 Próximos Passos

1. **Backend Integration**
   - Conectar com APIs reais do Supabase
   - Implementar mutações (criar, editar, deletar)
   - WebSockets para atualizações em tempo real

2. **Features**
   - Notificações de prazos
   - Filtros avançados
   - Exportação de relatórios
   - Drag and drop de tarefas entre serviços

3. **Otimizações**
   - Lazy loading de componentes pesados
   - Virtual scrolling para listas grandes
   - Cache de dados com React Query

## 👥 Autores

- **Frontend**: GitHub Copilot
- **Data**: 9 de outubro de 2025

## 📄 Licença

Propriedade privada - Todos os direitos reservados.
