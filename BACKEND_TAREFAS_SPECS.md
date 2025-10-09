# 📋 Especificações Backend - Estrutura de Dados de Tarefas

**Data:** 09/10/2025  
**Versão:** 2.0  
**Propósito:** Padronização da estrutura de dados de tarefas para cálculos de prazo e ordenação

---

## 🎯 Nova Estrutura de Dados

### **Campos Principais da Tarefa**

```typescript
interface Tarefa {
  id: string;
  nome: string;
  status: 'planejada' | 'aguardando' | 'preparacao' | 'executando' | 'pausada' | 'atrasada' | 'concluida';
  
  // ✅ NOVA ESTRUTURA DE PRAZO
  start_at: string | null;          // Data/hora que começou (ISO 8601: "2025-10-09T10:30:00Z")
  duration: number;                  // Prazo inicial em MINUTOS (ex: 360 = 6 horas)
  end_at: string | null;             // Data/hora que encerrou (ISO 8601)
  
  // Campos adicionais
  setor: string;                     // Setor responsável
  responsavel_usuario?: string;      // ID do usuário
  responsavel_nome?: string;         // Nome do responsável
  responsavel_tipo?: string;         // Tipo do setor
  mandrill_coins: number;            // Recompensa
  instrucao?: string;                // Instruções da tarefa
  templates?: Template[];            // Anexos/templates
  ordem?: number;                    // Ordem na sequência
  
  // Resultado (apenas para concluídas)
  resultado?: {
    descricao: string;
    paragrafo?: string;
    anexos?: any[];
  };
}
```

---

## 📐 Regras de Cálculo de Prazo

### **Fórmula do Prazo Remanescente**

```typescript
function calcularPrazoRemanescente(tarefa: Tarefa): number {
  const agora = Date.now();
  
  // Caso 1: Tarefa CONCLUÍDA (tem start_at && end_at)
  if (tarefa.start_at && tarefa.end_at) {
    // Não entra em listagens de tarefas ativas
    // OU retorna Infinity para ir pro final da lista
    return Infinity;
  }
  
  // Caso 2: Tarefa INICIADA (tem start_at, mas não tem end_at)
  if (tarefa.start_at && !tarefa.end_at) {
    const start = new Date(tarefa.start_at).getTime();
    const durationMs = tarefa.duration * 60 * 1000; // converter minutos para ms
    const elapsed = agora - start;                  // tempo decorrido
    const remaining = durationMs - elapsed;         // tempo restante
    
    // Retorna em milissegundos:
    // POSITIVO = ainda tem tempo (ex: +3600000 ms = 1h restante)
    // NEGATIVO = já passou do prazo (ex: -7200000 ms = 2h atrasado)
    return remaining;
  }
  
  // Caso 3: Tarefa NÃO INICIADA (sem start_at)
  if (!tarefa.start_at) {
    // Retorna o prazo total (ou Infinity para ir pro final)
    return Infinity; // OU: tarefa.duration * 60 * 1000
  }
}
```

---

## 📊 Ordenação por Prazo

### **ASC (Prazos mais apertados primeiro):**

```typescript
// Ordem crescente do prazo remanescente:
[
  { prazo_remanescente: -172800000 },  // -2 dias (muito atrasado) ← PRIMEIRO
  { prazo_remanescente: -86400000 },   // -1 dia (atrasado)
  { prazo_remanescente: -18000000 },   // -5 horas (atrasado)
  { prazo_remanescente: 6300000 },     // +1h45min (no prazo, apertado)
  { prazo_remanescente: 18900000 },    // +5h15min (no prazo)
  { prazo_remanescente: 27000000 },    // +7h30min (no prazo, folgado)
  { prazo_remanescente: Infinity },    // Não iniciada ← ÚLTIMO
  { prazo_remanescente: Infinity }     // Concluída ← ÚLTIMO
]
```

### **DESC (Prazos mais folgados primeiro):**
Ordem inversa da acima.

---

## 🔄 Transições de Status

### **Fluxo de Status:**

```
planejada → aguardando → preparacao → executando → concluida
                                    ↓
                                 pausada → executando
                                    ↓
                                 atrasada → executando → concluida
```

### **Quando cada campo é preenchido:**

| Status | start_at | end_at | Descrição |
|--------|----------|--------|-----------|
| `planejada` | `null` | `null` | Tarefa criada, não iniciada |
| `aguardando` | `null` | `null` | Aguardando dependências |
| `preparacao` | `null` | `null` | Próxima na fila |
| `executando` | ✅ **SET** | `null` | Iniciou execução |
| `pausada` | ✅ existe | `null` | Pausada temporariamente |
| `atrasada` | ✅ existe | `null` | Passou do prazo (`duration`) |
| `concluida` | ✅ existe | ✅ **SET** | Finalizada |

---

## 🎨 Visualização no Frontend

### **Cores do Cronômetro:**

```typescript
// Tarefa ATRASADA (prazo_remanescente < 0)
display: "+1D 05:31:29"
color: "text-red-500 animate-pulse"

// Tarefa EXECUTANDO (prazo_remanescente > 0)
display: "01:45:00"
color: "text-blue-400"

// Tarefa CONCLUÍDA
display: "01:45:00" (tempo real gasto)
color: "text-green-400"

// Tarefa NÃO INICIADA
display: "06:00:00" (prazo total)
color: "text-gray-400"
```

---

## 📝 Exemplos Práticos

### **Exemplo 1: Tarefa Atrasada**

```json
{
  "id": "task_1",
  "nome": "Revisar roteiro",
  "status": "atrasada",
  "start_at": "2025-10-07T10:00:00Z",
  "duration": 360,
  "end_at": null,
  "setor": "Criação"
}
```

**Cálculo (assumindo agora = 2025-10-09T15:30:00Z):**
```javascript
const start = new Date("2025-10-07T10:00:00Z").getTime();
const now = new Date("2025-10-09T15:30:00Z").getTime();
const durationMs = 360 * 60 * 1000; // 6 horas em ms

const elapsed = now - start;          // 2 dias + 5h30min
const remaining = durationMs - elapsed; // -83400000 ms (negativo = atrasado)

// Display: +1D 05:30:00 (vermelho pulsante)
```

---

### **Exemplo 2: Tarefa em Execução**

```json
{
  "id": "task_2",
  "nome": "Modelar objeto 3D",
  "status": "executando",
  "start_at": "2025-10-09T14:00:00Z",
  "duration": 480,
  "end_at": null,
  "setor": "3D"
}
```

**Cálculo (assumindo agora = 2025-10-09T15:45:00Z):**
```javascript
const start = new Date("2025-10-09T14:00:00Z").getTime();
const now = new Date("2025-10-09T15:45:00Z").getTime();
const durationMs = 480 * 60 * 1000; // 8 horas em ms

const elapsed = now - start;          // 1h45min
const remaining = durationMs - elapsed; // 22500000 ms (6h15min restante)

// Display: 06:15:00 (azul)
```

---

### **Exemplo 3: Tarefa Não Iniciada**

```json
{
  "id": "task_3",
  "nome": "Renderizar cena",
  "status": "aguardando",
  "start_at": null,
  "duration": 720,
  "end_at": null,
  "setor": "3D"
}
```

**Cálculo:**
```javascript
// Sem start_at, mostra o prazo total
const durationMs = 720 * 60 * 1000; // 12 horas em ms

// Display: 12:00:00 (cinza)
// Na ordenação: vai pro final da lista (Infinity)
```

---

### **Exemplo 4: Tarefa Concluída**

```json
{
  "id": "task_4",
  "nome": "Aprovar concept",
  "status": "concluida",
  "start_at": "2025-10-09T10:00:00Z",
  "duration": 120,
  "end_at": "2025-10-09T11:30:00Z",
  "setor": "Criação"
}
```

**Cálculo:**
```javascript
const start = new Date("2025-10-09T10:00:00Z").getTime();
const end = new Date("2025-10-09T11:30:00Z").getTime();

const tempoReal = end - start; // 5400000 ms (1h30min)

// Display: 01:30:00 (verde)
// Na ordenação: vai pro final da lista (Infinity)
```

---

## 🔌 Endpoints da API

### **1. Iniciar Tarefa**

```http
POST /api/tarefas/:id/iniciar
```

**Request:**
```json
{
  "responsavel_usuario": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task_1",
    "status": "executando",
    "start_at": "2025-10-09T15:30:00.000Z",
    "responsavel_nome": "João Silva"
  }
}
```

**Lógica Backend:**
```typescript
tarefa.status = 'executando';
tarefa.start_at = new Date().toISOString();
tarefa.responsavel_usuario = userId;
```

---

### **2. Concluir Tarefa**

```http
POST /api/tarefas/:id/concluir
```

**Request:**
```json
{
  "resultado": {
    "descricao": "Roteiro aprovado pelo cliente",
    "paragrafo": "O roteiro foi revisado e aprovado...",
    "anexos": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task_1",
    "status": "concluida",
    "start_at": "2025-10-09T10:00:00.000Z",
    "end_at": "2025-10-09T11:45:00.000Z",
    "tempo_real_minutos": 105
  }
}
```

**Lógica Backend:**
```typescript
tarefa.status = 'concluida';
tarefa.end_at = new Date().toISOString();
tarefa.resultado = resultado;

// Calcular tempo real
const tempoReal = (new Date(tarefa.end_at) - new Date(tarefa.start_at)) / (1000 * 60);
```

---

### **3. Listar Tarefas Ativas (com prazo calculado)**

```http
GET /api/tarefas/ativas?ordenar=prazo&ordem=asc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_1",
      "nome": "Tarefa atrasada",
      "status": "atrasada",
      "start_at": "2025-10-07T10:00:00Z",
      "duration": 360,
      "end_at": null,
      "prazo_remanescente_ms": -83400000,
      "prazo_remanescente_formatted": "+1D 05:30:00"
    },
    {
      "id": "task_2",
      "nome": "Tarefa apertada",
      "status": "executando",
      "start_at": "2025-10-09T14:00:00Z",
      "duration": 120,
      "end_at": null,
      "prazo_remanescente_ms": 1800000,
      "prazo_remanescente_formatted": "00:30:00"
    }
  ]
}
```

---

## ⚠️ Validações Importantes

### **Backend deve validar:**

1. ✅ `start_at` só pode ser definido uma vez (quando status muda para `executando`)
2. ✅ `end_at` só pode ser definido se `start_at` existe
3. ✅ `end_at` deve ser maior que `start_at`
4. ✅ `duration` deve ser positivo e maior que 0
5. ✅ Status `atrasada` é automaticamente detectado quando:
   ```typescript
   (Date.now() - new Date(start_at).getTime()) > (duration * 60 * 1000)
   ```

### **Constraints no Banco:**

```sql
ALTER TABLE tarefas 
ADD CONSTRAINT check_end_after_start 
CHECK (end_at IS NULL OR end_at > start_at);

ALTER TABLE tarefas 
ADD CONSTRAINT check_duration_positive 
CHECK (duration > 0);
```

---

## 🚀 Migração de Dados Existentes

### **Script de Migração:**

```sql
-- Renomear campos antigos
ALTER TABLE tarefas RENAME COLUMN data_inicio TO start_at;
ALTER TABLE tarefas RENAME COLUMN data_conclusao TO end_at;
ALTER TABLE tarefas RENAME COLUMN prazo_horas TO duration;

-- OU criar novos campos e migrar
ALTER TABLE tarefas ADD COLUMN start_at TIMESTAMP;
ALTER TABLE tarefas ADD COLUMN end_at TIMESTAMP;
ALTER TABLE tarefas ADD COLUMN duration INTEGER NOT NULL DEFAULT 60;

UPDATE tarefas 
SET start_at = data_inicio,
    end_at = data_conclusao,
    duration = prazo_horas; -- assumindo que prazo_horas já está em minutos
```

---

## 📞 Resumo

### **Campos Essenciais:**
- `start_at`: Quando iniciou (null se não iniciou)
- `duration`: Prazo em minutos
- `end_at`: Quando terminou (null se não terminou)

### **Cálculo de Prazo:**
- **Concluída**: `start_at && end_at` → Não lista / Infinity
- **Iniciada**: `duration - (agora - start_at)` → Valor real (pode ser negativo)
- **Não iniciada**: `!start_at` → Infinity

### **Ordenação:**
- **Menor valor** = mais apertado (negativos vêm primeiro)
- **Maior valor** = mais folgado
- **Infinity** = concluídas e não iniciadas (final da lista)

---

**Última atualização:** 09 de outubro de 2025
