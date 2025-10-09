# 📋 Especificações Backend - Sistema de Fluxo de Entregas

**Data:** 09/10/2025  
**Versão:** 1.0  
**Propósito:** Documentação técnica para implementação do backend do sistema de fluxo visual (React Flow)

---

## 📌 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Modelagem do Banco de Dados](#modelagem-do-banco-de-dados)
4. [Endpoints da API](#endpoints-da-api)
5. [Algoritmo de Cálculo de Etapas](#algoritmo-de-cálculo-de-etapas)
6. [Regras de Negócio](#regras-de-negócio)
7. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

O sistema utiliza **React Flow** no frontend para criar um fluxo visual de serviços de uma entrega. Os serviços são representados como **nós (nodes)** conectados por **linhas (edges)**, permitindo:

- Visualização do pipeline de produção
- Identificação de serviços que rodam em **paralelo** (mesma etapa)
- Identificação de serviços que rodam em **sequência** (etapas diferentes)
- Cálculo automático da **estimativa de conclusão** da entrega

---

## 📊 Estrutura de Dados

### 1. **Node (Nó/Card)**

Representa um serviço ou ponto especial no fluxo.

```typescript
interface Node {
  id: string;                           // ID único do nó (ex: "serv_1", "orcamento-aprovado")
  type: string;                         // Tipo do nó ("serviceNode", "start", "end")
  position: {
    x: number;                          // Posição X no canvas (pixels)
    y: number;                          // Posição Y no canvas (pixels)
  };
  data: {
    servico?: {
      id: string;
      nome: string;
      status: Status;
      progresso_percentual: number;
      tarefas?: Tarefa[];
    };
    label?: string;                     // Para nós especiais (start/end)
  };
}
```

**Exemplo:**
```json
{
  "id": "serv_1",
  "type": "serviceNode",
  "position": { "x": 400, "y": 200 },
  "data": {
    "servico": {
      "id": "serv_1",
      "nome": "Modelagem 3D",
      "status": "executando",
      "progresso_percentual": 75,
      "tarefas": [...]
    }
  }
}
```

---

### 2. **Edge (Conexão/Linha)**

Representa a conexão entre dois serviços (dependência).

```typescript
interface Edge {
  id: string;           // ID único da conexão (ex: "e-orcamento-serv1")
  source: string;       // ID do nó de origem
  target: string;       // ID do nó de destino
  type?: string;        // Tipo de linha ("smoothstep", "default", "step")
  animated?: boolean;   // Animação da linha (opcional)
}
```

**Exemplo:**
```json
{
  "id": "e-orcamento-serv1",
  "source": "orcamento-aprovado",
  "target": "serv_1",
  "type": "smoothstep",
  "animated": false
}
```

---

## 🗄️ Modelagem do Banco de Dados

### **Opção 1: Tabela Única com JSONB** ✅ **(RECOMENDADO)**

Mais simples e flexível para começar.

```sql
CREATE TABLE entregas_fluxo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id UUID NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  versao INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(entrega_id)
);

-- Índices para performance
CREATE INDEX idx_entregas_fluxo_entrega_id ON entregas_fluxo(entrega_id);
CREATE INDEX idx_entregas_fluxo_nodes ON entregas_fluxo USING GIN(nodes);
CREATE INDEX idx_entregas_fluxo_edges ON entregas_fluxo USING GIN(edges);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_entregas_fluxo_updated_at
BEFORE UPDATE ON entregas_fluxo
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Vantagens:**
- ✅ Implementação rápida
- ✅ Flexível para mudanças futuras
- ✅ Fácil versionamento
- ✅ Menos JOINs necessários

---

### **Opção 2: Tabelas Normalizadas** (Para queries complexas futuras)

```sql
-- Tabela de Nós
CREATE TABLE entregas_fluxo_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id UUID NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES servicos(id) ON DELETE CASCADE,  -- NULL para nós especiais
  node_type VARCHAR(50) NOT NULL,           -- 'service', 'start', 'end'
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  nivel INTEGER,                            -- Nível calculado (etapa)
  data JSONB,                               -- Dados adicionais do nó
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Conexões
CREATE TABLE entregas_fluxo_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id UUID NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES entregas_fluxo_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES entregas_fluxo_nodes(id) ON DELETE CASCADE,
  edge_type VARCHAR(50) DEFAULT 'smoothstep',
  animated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(source_node_id, target_node_id),   -- Evita conexões duplicadas
  CHECK (source_node_id != target_node_id)  -- Evita self-loop
);

-- Índices
CREATE INDEX idx_nodes_entrega ON entregas_fluxo_nodes(entrega_id);
CREATE INDEX idx_nodes_servico ON entregas_fluxo_nodes(servico_id);
CREATE INDEX idx_edges_entrega ON entregas_fluxo_edges(entrega_id);
CREATE INDEX idx_edges_source ON entregas_fluxo_edges(source_node_id);
CREATE INDEX idx_edges_target ON entregas_fluxo_edges(target_node_id);
```

**Vantagens:**
- ✅ Queries mais otimizadas para análises
- ✅ Constraints no banco (integridade referencial)
- ✅ Fácil calcular estatísticas

**Desvantagens:**
- ❌ Mais complexo de implementar
- ❌ Mais JOINs necessários

---

## 🔌 Endpoints da API

### 1. **Salvar/Atualizar Fluxo**

```http
POST /api/entregas/:entregaId/fluxo
PUT  /api/entregas/:entregaId/fluxo
```

**Request Body:**
```json
{
  "nodes": [
    {
      "id": "orcamento-aprovado",
      "type": "serviceNode",
      "position": { "x": 100, "y": 200 },
      "data": { "label": "Orçamento Aprovado" }
    },
    {
      "id": "serv_1",
      "type": "serviceNode",
      "position": { "x": 400, "y": 200 },
      "data": {
        "servico": {
          "id": "serv_1",
          "nome": "Modelagem 3D"
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e-orcamento-serv1",
      "source": "orcamento-aprovado",
      "target": "serv_1"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "fluxo_123",
    "entrega_id": "ent_6",
    "nodes": [...],
    "edges": [...],
    "versao": 2,
    "updated_at": "2025-10-09T14:30:00Z"
  }
}
```

---

### 2. **Buscar Fluxo**

```http
GET /api/entregas/:entregaId/fluxo
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "fluxo_123",
    "entrega_id": "ent_6",
    "nodes": [...],
    "edges": [...],
    "etapas": [
      {
        "nivel": 0,
        "servicos": ["orcamento-aprovado"],
        "tipo": "sequencial"
      },
      {
        "nivel": 1,
        "servicos": ["serv_1", "serv_2"],
        "tipo": "paralelo"
      }
    ],
    "versao": 2,
    "created_at": "2025-10-01T10:00:00Z",
    "updated_at": "2025-10-09T14:30:00Z"
  }
}
```

---

### 3. **Calcular Ordem de Execução**

```http
GET /api/entregas/:entregaId/fluxo/ordem-execucao
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entrega_id": "ent_6",
    "etapas": [
      {
        "nivel": 0,
        "tipo": "sequencial",
        "servicos": [
          {
            "id": "orcamento-aprovado",
            "nome": "Orçamento Aprovado",
            "status": "concluida",
            "prazo_total_horas": 0
          }
        ]
      },
      {
        "nivel": 1,
        "tipo": "paralelo",
        "servicos": [
          {
            "id": "serv_1",
            "nome": "Modelagem 3D",
            "status": "executando",
            "prazo_total_horas": 168,
            "prazo_remanescente_horas": 120
          },
          {
            "id": "serv_2",
            "nome": "Texturização",
            "status": "planejada",
            "prazo_total_horas": 120,
            "prazo_remanescente_horas": 120
          }
        ],
        "prazo_etapa_horas": 168
      }
    ],
    "estimativa_total_horas": 336
  }
}
```

---

### 4. **Deletar Fluxo**

```http
DELETE /api/entregas/:entregaId/fluxo
```

**Response:**
```json
{
  "success": true,
  "message": "Fluxo deletado com sucesso"
}
```

---

### 5. **Validar Fluxo**

```http
POST /api/entregas/:entregaId/fluxo/validar
```

**Request Body:**
```json
{
  "nodes": [...],
  "edges": [...]
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": [
    "Serviço 'serv_3' não está conectado ao fluxo"
  ]
}
```

**Possíveis erros:**
- Ciclo detectado no fluxo (loop infinito)
- Nó sem predecessor ou sucessor
- Conexão inválida (nó não existe)
- Múltiplos pontos de início

---

## 🧮 Algoritmo de Cálculo de Etapas

### **Objetivo**

Identificar quais serviços rodam em **paralelo** (mesma etapa) e quais rodam em **sequência** (etapas diferentes).

### **Algoritmo BFS (Breadth-First Search)**

```typescript
interface Etapa {
  nivel: number;
  servicos: string[];
  tipo: 'sequencial' | 'paralelo';
}

function calcularEtapas(nodes: Node[], edges: Edge[]): Etapa[] {
  // 1. Encontrar nó inicial (sem predecessores)
  const inicio = nodes.find(node => 
    !edges.some(edge => edge.target === node.id)
  );
  
  if (!inicio) {
    throw new Error('Nenhum nó inicial encontrado');
  }
  
  // 2. BFS para calcular níveis
  const niveis = new Map<string, number>();
  const fila: { nodeId: string; nivel: number }[] = [];
  const visitados = new Set<string>();
  
  fila.push({ nodeId: inicio.id, nivel: 0 });
  visitados.add(inicio.id);
  
  while (fila.length > 0) {
    const { nodeId, nivel } = fila.shift()!;
    niveis.set(nodeId, nivel);
    
    // Encontrar sucessores (nós que dependem deste)
    const sucessores = edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
    
    for (const sucessorId of sucessores) {
      if (!visitados.has(sucessorId)) {
        fila.push({ nodeId: sucessorId, nivel: nivel + 1 });
        visitados.add(sucessorId);
      }
    }
  }
  
  // 3. Agrupar serviços por nível (etapa)
  const etapas: Etapa[] = [];
  const niveisUnicos = [...new Set(niveis.values())].sort((a, b) => a - b);
  
  for (const nivel of niveisUnicos) {
    const servicosNoNivel = [...niveis.entries()]
      .filter(([_, n]) => n === nivel)
      .map(([nodeId]) => nodeId);
    
    etapas.push({
      nivel,
      servicos: servicosNoNivel,
      tipo: servicosNoNivel.length > 1 ? 'paralelo' : 'sequencial'
    });
  }
  
  return etapas;
}
```

### **Exemplo Visual**

```
Fluxo:
  [Orçamento] → [Modelagem] → [Renderização] → [Entrega]
                     ↓
               [Texturização] ↗

Resultado:
[
  { nivel: 0, servicos: ['Orçamento'],              tipo: 'sequencial' },
  { nivel: 1, servicos: ['Modelagem'],              tipo: 'sequencial' },
  { nivel: 2, servicos: ['Texturização', 'Renderização'], tipo: 'paralelo' },
  { nivel: 3, servicos: ['Entrega'],                tipo: 'sequencial' }
]
```

---

## 📏 Regras de Negócio

### 1. **Cálculo da Estimativa da Entrega**

A estimativa total é calculada somando as etapas, onde:

- **Etapa Sequencial**: Soma o prazo remanescente de todos os serviços
- **Etapa Paralela**: Pega o prazo do serviço **mais longo**

#### **Regras de Cálculo do Prazo Remanescente de um Serviço:**

```typescript
function calcularPrazoRemanescenteServico(servico: Servico): number {
  let prazoRemanescente = 0;
  
  for (const tarefa of servico.tarefas) {
    // Tarefas atrasadas e concluídas entram como 0
    if (tarefa.status === 'atrasada' || tarefa.status === 'concluida') {
      continue;
    }
    
    // Calcular prazo remanescente da tarefa
    if (tarefa.data_inicio) {
      const agora = Date.now();
      const dataInicio = new Date(tarefa.data_inicio);
      const prazoMs = tarefa.prazo_horas * 3600 * 1000;
      const deadline = dataInicio.getTime() + prazoMs;
      const remanescente = Math.max(0, deadline - agora);
      prazoRemanescente += remanescente;
    } else {
      // Se não iniciou, usar o prazo total
      prazoRemanescente += tarefa.prazo_horas * 3600 * 1000;
    }
  }
  
  return prazoRemanescente / 3600000; // Converter para horas
}
```

#### **Cálculo Total da Entrega:**

```typescript
function calcularEstimativaEntrega(etapas: Etapa[], servicos: Servico[]): number {
  let estimativaTotal = 0;
  
  for (const etapa of etapas) {
    if (etapa.tipo === 'sequencial') {
      // Soma todos os serviços da etapa
      for (const servicoId of etapa.servicos) {
        const servico = servicos.find(s => s.id === servicoId);
        if (servico) {
          estimativaTotal += calcularPrazoRemanescenteServico(servico);
        }
      }
    } else if (etapa.tipo === 'paralelo') {
      // Pega o serviço mais longo da etapa
      const prazos = etapa.servicos.map(servicoId => {
        const servico = servicos.find(s => s.id === servicoId);
        return servico ? calcularPrazoRemanescenteServico(servico) : 0;
      });
      estimativaTotal += Math.max(...prazos);
    }
  }
  
  return estimativaTotal;
}
```

---

### 2. **Pausa Automática do Cronômetro**

O cronômetro da estimativa **pausa automaticamente** quando:

- O serviço **mais longo** de uma **etapa paralela** tem tarefa **atrasada**
- Isso acontece porque:
  - O serviço atrasado contribui com **0** para a soma
  - Os demais serviços da etapa não iniciaram (estão aguardando)
  - Como nada está reduzindo, o cronômetro fica **congelado**

**Não é necessário implementar lógica explícita de pausa** - o comportamento é natural do cálculo.

---

### 3. **Validações Importantes**

- ✅ **Não permitir ciclos** (loops) no fluxo
- ✅ **Garantir que todos os serviços estejam conectados** ao fluxo
- ✅ **Um único ponto de início** (nó sem predecessores)
- ✅ **Um único ponto de fim** (nó sem sucessores)
- ✅ **Não permitir conexão de um nó para ele mesmo**

---

## 💡 Exemplos Práticos

### **Exemplo 1: Fluxo Simples**

```
[Orçamento] → [Modelagem] → [Renderização] → [Entrega]
```

**Dados:**
```json
{
  "nodes": [
    { "id": "orcamento", "type": "serviceNode", "position": { "x": 100, "y": 200 } },
    { "id": "modelagem", "type": "serviceNode", "position": { "x": 400, "y": 200 } },
    { "id": "renderizacao", "type": "serviceNode", "position": { "x": 700, "y": 200 } },
    { "id": "entrega", "type": "serviceNode", "position": { "x": 1000, "y": 200 } }
  ],
  "edges": [
    { "id": "e1", "source": "orcamento", "target": "modelagem" },
    { "id": "e2", "source": "modelagem", "target": "renderizacao" },
    { "id": "e3", "source": "renderizacao", "target": "entrega" }
  ]
}
```

**Etapas Calculadas:**
```json
[
  { "nivel": 0, "servicos": ["orcamento"], "tipo": "sequencial" },
  { "nivel": 1, "servicos": ["modelagem"], "tipo": "sequencial" },
  { "nivel": 2, "servicos": ["renderizacao"], "tipo": "sequencial" },
  { "nivel": 3, "servicos": ["entrega"], "tipo": "sequencial" }
]
```

**Estimativa:** Soma de todos os prazos remanescentes

---

### **Exemplo 2: Fluxo com Paralelos**

```
                    ┌→ [Modelagem 3D] ──┐
[Orçamento] → [Conceito]                  ┌→ [Renderização] → [Entrega]
                    └→ [Storyboard] ──┘
```

**Etapas Calculadas:**
```json
[
  { "nivel": 0, "servicos": ["orcamento"], "tipo": "sequencial" },
  { "nivel": 1, "servicos": ["conceito"], "tipo": "sequencial" },
  { "nivel": 2, "servicos": ["modelagem-3d", "storyboard"], "tipo": "paralelo" },
  { "nivel": 3, "servicos": ["renderizacao"], "tipo": "sequencial" },
  { "nivel": 4, "servicos": ["entrega"], "tipo": "sequencial" }
]
```

**Estimativa Nível 2 (paralelo):**
- Modelagem 3D: 168h remanescentes
- Storyboard: 80h remanescentes
- **Prazo da etapa**: 168h (o maior)

---

### **Exemplo 3: Fluxo Complexo**

```
                    ┌→ [Modelagem] ──┐
[Orçamento] → [Conceito]              ├→ [Composição] → [Entrega]
                    └→ [Animação] ───┤
                                     │
                    ┌→ [Sound Design] ┘
                    │
                 [Trilha]
```

**Etapas Calculadas:**
```json
[
  { "nivel": 0, "servicos": ["orcamento"], "tipo": "sequencial" },
  { "nivel": 1, "servicos": ["conceito", "trilha"], "tipo": "paralelo" },
  { "nivel": 2, "servicos": ["modelagem", "animacao", "sound-design"], "tipo": "paralelo" },
  { "nivel": 3, "servicos": ["composicao"], "tipo": "sequencial" },
  { "nivel": 4, "servicos": ["entrega"], "tipo": "sequencial" }
]
```

---

## 🚀 Implementação Recomendada

### **Fase 1: MVP**
1. ✅ Criar tabela `entregas_fluxo` com JSONB
2. ✅ Endpoint POST/PUT para salvar fluxo
3. ✅ Endpoint GET para buscar fluxo
4. ✅ Implementar algoritmo BFS para calcular etapas

### **Fase 2: Validações**
5. ✅ Endpoint de validação de fluxo
6. ✅ Detectar ciclos (algoritmo DFS)
7. ✅ Validar conectividade

### **Fase 3: Otimizações**
8. ✅ Cache de etapas calculadas
9. ✅ Webhook para recalcular quando serviço muda status
10. ✅ Histórico de versões do fluxo

---

## 📞 Contato

Para dúvidas ou esclarecimentos sobre esta especificação:
- **Frontend Dev:** [Seu Nome]
- **Repositório:** [Link do GitHub]
- **Data de Entrega:** [Data prevista]

---

**Última atualização:** 09 de outubro de 2025
