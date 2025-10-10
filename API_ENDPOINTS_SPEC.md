# 📡 Especificação dos Endpoints da API

Documentação completa dos dados necessários para as 4 páginas principais da aplicação.

---

## 📋 Índice
1. [GET /api/projetos](#1-get-apiprojetos) - Lista de Projetos
2. [GET /api/tarefas](#2-get-apitarefas) - Lista de Tarefas
3. [GET /api/projetos/:id](#3-get-apiprojetosid) - Detalhes do Projeto
4. [GET /api/entregas/:id](#4-get-apientregasid) - Detalhes da Entrega

---

## 1. GET /api/projetos
**Página:** Painel Principal (ProjectListView - abas Projetos e Tarefas)

### Endpoint
```
GET /api/projetos?status=ativo
```

### Query Parameters
- `status` (opcional): `ativo` | `concluido` | `todos`
  - **ativo**: Exclui projetos com status "concluida"
  - **concluido**: Apenas projetos concluídos
  - **todos**: Todos os projetos

### Response Structure

```json
{
  "success": true,
  "data": {
    "projetos": [
      {
        "id": "proj_1",
        "demanda_codigo": "2024-0045",
        "cliente_nome": "StartupTech Innovations",
        "motivo": "Campanha de Lançamento MVP",
        "status": "executando",
        "progresso_percentual": 45,
        "valor_total": 45000.00,
        "prazo_dias": 30,
        "prazo_data": "2025-11-14T21:00:00.000Z",
        
        "entregas": [
          {
            "id": "ent_1",
            "nome": "Campanha Digital Completa",
            "status": "executando",
            "progresso_percentual": 65,
            
            "servicos": [
              {
                "id": "serv_1",
                "nome": "Modelagem 3D",
                "status": "executando",
                "progresso_percentual": 75,
                
                "tarefas": [
                  {
                    "id": "task_1",
                    "nome": "Criar modelo base do logo",
                    "status": "executando",
                    "responsavel_nome": "João Silva",
                    "responsavel_setor": "Criação",
                    
                    "start_at": "2025-10-09T08:00:00.000Z",
                    "duration": 480,
                    "end_at": null,
                    
                    "prazo_horas": 8,
                    "data_inicio": "2025-10-09T08:00:00.000Z",
                    "data_conclusao": null
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    "estatisticas": {
      "total_projetos": 7,
      "projetos_ativos": 5,
      "projetos_concluidos": 2,
      "total_tarefas": 45,
      "tarefas_executando": 8,
      "tarefas_atrasadas": 3
    }
  },
  "timestamp": "2025-10-09T12:00:00.000Z"
}
```

### Campos Obrigatórios

#### Projeto (nível 1)
```json
{
  "id": "string (UUID)",
  "demanda_codigo": "string (ex: 2024-0045)",
  "cliente_nome": "string",
  "motivo": "string",
  "status": "aguardando | executando | pausada | atrasada | concluida | preparacao",
  "progresso_percentual": "number (0-100)",
  "valor_total": "number",
  "prazo_dias": "number",
  "prazo_data": "string (ISO 8601 date) | null",
  "entregas": "array (opcional, pode ser vazio)"
}
```

#### Entrega (nível 2 - dentro de projeto)
```json
{
  "id": "string (UUID)",
  "nome": "string",
  "status": "string",
  "progresso_percentual": "number (0-100)",
  "servicos": "array (opcional)"
}
```

#### Serviço (nível 3 - dentro de entrega)
```json
{
  "id": "string (UUID)",
  "nome": "string",
  "status": "string",
  "progresso_percentual": "number (0-100)",
  "tarefas": "array (opcional)"
}
```

#### Tarefa (nível 4 - dentro de serviço)
**✨ Nova Estrutura de Prazo:**
```json
{
  "id": "string (UUID)",
  "nome": "string",
  "status": "planejada | executando | pausada | atrasada | concluida",
  "responsavel_nome": "string | null",
  "responsavel_setor": "string",
  
  "start_at": "string (ISO 8601) | null",
  "duration": "number (minutos)",
  "end_at": "string (ISO 8601) | null",
  
  "prazo_horas": "number (compatibilidade - na verdade em minutos!)",
  "data_inicio": "string (ISO 8601) | null",
  "data_conclusao": "string (ISO 8601) | null"
}
```

### Notas Importantes

1. **Hierarquia Completa Necessária**
   - A API deve retornar `projetos → entregas → servicos → tarefas` completos
   - Frontend faz o enriquecimento de contexto (projeto_id, entrega_id, etc)

2. **Nova Estrutura de Prazo**
   - `start_at`: Quando a tarefa iniciou (timestamp ISO 8601)
   - `duration`: Duração prevista em **minutos**
   - `end_at`: Quando a tarefa finalizou (timestamp ISO 8601)
   - Se `start_at` e `end_at` existem: tarefa concluída
   - Se apenas `start_at`: tarefa em execução (calcula remanescente)
   - Se nenhum: tarefa não iniciada

3. **Campos Legados (compatibilidade)**
   - `prazo_horas`: ⚠️ **Na verdade em MINUTOS!** (manter para compatibilidade)
   - `data_inicio`: Use mesmo valor de `start_at`
   - `data_conclusao`: Use mesmo valor de `end_at`

4. **Ordenação**
   - Frontend ordena projetos por `prazo_data` ou `demanda_codigo`
   - Frontend ordena tarefas por prazo remanescente calculado

---

## 2. GET /api/tarefas
**Página:** Painel Principal (ProjectListView - aba Tarefas)

### Endpoint
```
GET /api/tarefas?status=ativas&enriquecer=true
```

### Query Parameters
- `status` (opcional): `ativas` | `todas`
- `enriquecer` (recomendado): `true` | `false`
  - Se `true`: retorna contexto completo (projeto, entrega, serviço)
  - Se `false`: apenas dados da tarefa (frontend precisa fazer joins)

### Response Structure (com enriquecimento)

```json
{
  "success": true,
  "data": {
    "tarefas": [
      {
        "id": "task_1",
        "nome": "Criar modelo base do logo",
        "status": "executando",
        "responsavel_nome": "João Silva",
        "responsavel_setor": "Criação",
        
        "start_at": "2025-10-09T08:00:00.000Z",
        "duration": 480,
        "end_at": null,
        
        "prazo_horas": 8,
        "data_inicio": "2025-10-09T08:00:00.000Z",
        "data_conclusao": null,
        
        "projeto": {
          "id": "proj_1",
          "codigo": "2024-0045",
          "cliente": "StartupTech Innovations"
        },
        "entrega": {
          "id": "ent_1",
          "nome": "Campanha Digital Completa"
        },
        "servico": {
          "id": "serv_1",
          "nome": "Modelagem 3D"
        }
      }
    ],
    "total": 45,
    "executando": 8,
    "atrasadas": 3
  },
  "timestamp": "2025-10-09T12:00:00.000Z"
}
```

### Campos Obrigatórios

```json
{
  "id": "string (UUID)",
  "nome": "string",
  "status": "planejada | executando | pausada | atrasada | concluida",
  "responsavel_nome": "string | null",
  "responsavel_setor": "string",
  
  "start_at": "string (ISO 8601) | null",
  "duration": "number (minutos)",
  "end_at": "string (ISO 8601) | null",
  
  "projeto": {
    "id": "string",
    "codigo": "string",
    "cliente": "string"
  },
  "entrega": {
    "id": "string",
    "nome": "string"
  },
  "servico": {
    "id": "string",
    "nome": "string"
  }
}
```

### Notas

1. **Contexto Enriquecido**
   - Facilita renderização no frontend
   - Evita múltiplas requisições
   - Dados são exibidos em card compacto

2. **Filtros**
   - Apenas tarefas **não concluídas** por padrão
   - Frontend calcula prazo remanescente em tempo real
   - Ordenação por urgência (mais atrasadas primeiro)

---

## 3. GET /api/projetos/:id
**Página:** Detalhes do Projeto (ProjectDetail)

### Endpoint
```
GET /api/projetos/proj_1
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "projeto": {
      "id": "proj_1",
      "demanda_codigo": "2024-0045",
      "titulo": "Campanha de Lançamento de Produto",
      "cliente_nome": "StartupTech Innovations",
      "anunciante_nome": "TechVision Ltda",
      "agencia_nome": "Agência Digital Criativa",
      "motivo": "Campanha de Lançamento MVP",
      "motivo_titulo": "Lançamento de Produto",
      "status": "executando",
      "progresso_percentual": 45,
      "valor_total": 45000.00,
      "valor_producao": 28000.00,
      "prazo_dias": 30,
      "prazo_data": "2025-11-14T21:00:00.000Z",
      "data_aprovacao_orcamento": "2025-10-07",
      "data_entrega_estimada": "2025-11-14",
      
      "solicitante_nome": "Carlos Silva",
      "demandante_nome": "Maria Santos",
      "emissor_nome": "João Paulo",
      "vendedor_nome": "Ana Costa",
      
      "demanda_tipo": "Lançamento",
      "demanda_status": "Em Produção",
      "motivo_tipo": "Marketing",
      
      "orcamento_aprovado_at": "2025-10-07T10:30:00.000Z",
      "orcamento_id_crm": "orc_123",
      "orcamento_codigo_crm": "ORC-2024-0045",
      
      "servicos_locais_crm": [],
      "servicos_remotos_crm": [],
      "total_servicos_crm": 0,
      
      "entregas": [
        {
          "id": "ent_1",
          "nome": "Campanha Digital Completa",
          "briefing": "Desenvolver campanha digital integrada...",
          "texto_apoio": "Material complementar...",
          "status": "executando",
          "progresso_percentual": 65,
          "valor_unitario": 15000.00,
          "quantidade_total": 3,
          "indice_atual": 1,
          
          "item_crm": {
            "icone": "🎬",
            "titulo": "Vídeo Motion",
            "nome": "Vídeo Promocional Animado",
            "descricao": "Vídeo de 60s com motion graphics",
            "tipo": "Motion",
            "categoria": "Audiovisual"
          },
          
          "servicos": [
            {
              "id": "serv_1",
              "nome": "Modelagem 3D",
              "descricao": "Criação de modelos 3D",
              "ordem": 1,
              "etapa": 1,
              "pode_executar_paralelo": false,
              "status": "executando",
              "progresso_percentual": 75,
              "valor_estimado": 5000.00,
              "prazo_dias": 7,
              
              "tarefas": [
                {
                  "id": "task_1",
                  "nome": "Criar modelo base do logo",
                  "instrucao": "Seguir especificações do briefing...",
                  "status": "executando",
                  "ordem": 1,
                  "setor": "Criação",
                  "responsavel_nome": "João Silva",
                  "responsavel_tipo": "interno",
                  "responsavel_usuario": "user_123",
                  
                  "start_at": "2025-10-09T08:00:00.000Z",
                  "duration": 480,
                  "end_at": null,
                  
                  "prazo_horas": 8,
                  "mandrill_coins": 100,
                  "duracao_segundos": 28800,
                  
                  "data_inicio": "2025-10-09T08:00:00.000Z",
                  "data_fim": null,
                  "tempo_execucao": 14400,
                  
                  "resultado": null,
                  "templates": []
                }
              ]
            }
          ]
        }
      ],
      
      "estatisticas": {
        "total_entregas": 3,
        "entregas_concluidas": 1,
        "total_servicos": 12,
        "servicos_concluidos": 4,
        "total_tarefas": 45,
        "tarefas_concluidas": 23,
        "progresso_real": 51.1
      }
    }
  },
  "timestamp": "2025-10-09T12:00:00.000Z"
}
```

### Campos Obrigatórios

#### Projeto
```json
{
  "id": "string (UUID)",
  "demanda_codigo": "string",
  "titulo": "string | null",
  "cliente_nome": "string",
  "motivo": "string",
  "status": "string",
  "progresso_percentual": "number (0-100)",
  "valor_total": "number",
  "prazo_dias": "number",
  "prazo_data": "string (ISO 8601) | null",
  "entregas": "array"
}
```

#### Entrega (detalhada)
```json
{
  "id": "string (UUID)",
  "nome": "string",
  "briefing": "string",
  "status": "string",
  "progresso_percentual": "number (0-100)",
  "item_crm": {
    "icone": "string (emoji) | null",
    "titulo": "string | null",
    "tipo": "string | null"
  },
  "servicos": "array"
}
```

#### Serviço (detalhado)
```json
{
  "id": "string (UUID)",
  "nome": "string",
  "descricao": "string | null",
  "ordem": "number",
  "etapa": "number | null",
  "pode_executar_paralelo": "boolean",
  "status": "string",
  "progresso_percentual": "number (0-100)",
  "tarefas": "array"
}
```

#### Tarefa (detalhada)
```json
{
  "id": "string (UUID)",
  "nome": "string",
  "instrucao": "string | null",
  "status": "string",
  "ordem": "number | null",
  "setor": "string",
  "responsavel_nome": "string | null",
  
  "start_at": "string (ISO 8601) | null",
  "duration": "number (minutos)",
  "end_at": "string (ISO 8601) | null",
  
  "prazo_horas": "number",
  "mandrill_coins": "number"
}
```

### Notas

1. **Hierarquia Completa**
   - Retornar TODAS as entregas com TODOS os serviços e TODAS as tarefas
   - Frontend usa para exibir cards de entregas e navegação

2. **Campos Opcionais mas Úteis**
   - `item_crm.icone`: Emoji para visualização (📹, 🎨, 📸, etc)
   - `servico.etapa`: Calculado via BFS (para React Flow)
   - `servico.pode_executar_paralelo`: Define dependências no fluxo

3. **Estatísticas**
   - Frontend pode calcular, mas melhor vir do backend
   - Usado para exibir progresso geral do projeto

---

## 4. GET /api/entregas/:id
**Página:** Detalhes da Entrega (EntregaDetalhePage)

### Endpoint
```
GET /api/entregas/ent_1?include_projeto=true
```

### Query Parameters
- `include_projeto` (opcional): `true` | `false`
  - Se `true`: inclui dados básicos do projeto pai

### Response Structure

```json
{
  "success": true,
  "data": {
    "entrega": {
      "id": "ent_1",
      "projeto_id": "proj_1",
      "nome": "Campanha Digital Completa",
      "briefing": "Desenvolver campanha digital integrada com vídeo promocional de 60 segundos, posts para redes sociais e landing page responsiva.",
      "texto_apoio": "Material de apoio adicional...",
      "status": "executando",
      "progresso_percentual": 65,
      "tipo": "Motion",
      
      "valor_unitario": 15000.00,
      "quantidade_total": 3,
      "indice_atual": 1,
      
      "item_crm": {
        "icone": "🎬",
        "titulo": "Vídeo Motion",
        "nome": "Vídeo Promocional Animado",
        "descricao": "Vídeo de 60 segundos com motion graphics e animações 3D",
        "tipo": "Motion",
        "categoria": "Audiovisual"
      },
      
      "uso": "Publicidade, Anúncio",
      "estilo": "Manifesto, Teaser",
      "objetivos": "Engajamento, Converter Lead",
      "tom": "Inspirador, Luxuoso",
      
      "tecnicas": {
        "fotografia": ["Portrait HDR", "Retrato"],
        "gravacao": ["Slow Motion"],
        "audio": ["Trilha Pesquisada", "Sound Design"],
        "ilustracao": [],
        "animacao": ["3D"],
        "motion": ["Infográfico", "3D"]
      },
      
      "estrategia": "Criar uma narrativa visual impactante que conecte emocionalmente com o público, utilizando recursos de motion graphics modernos combinados com fotografia de alta qualidade.",
      
      "referencias": [
        "https://www.behance.net/exemplo1",
        "https://vimeo.com/exemplo2"
      ],
      
      "territorio": "Nacional",
      "veiculos": ["Youtube", "Instagram", "TV"],
      "periodo_utilizacao": "6 meses",
      "duracao": "Exatamente 15 segundos",
      "idioma_original": "Português",
      
      "servicos": [
        {
          "id": "serv_1",
          "nome": "Modelagem 3D",
          "descricao": "Criação de modelos 3D para o vídeo",
          "ordem": 1,
          "etapa": 1,
          "pode_executar_paralelo": false,
          "dependencias": [],
          "status": "executando",
          "progresso_percentual": 75,
          "valor_estimado": 5000.00,
          "prazo_dias": 7,
          
          "tarefas": [
            {
              "id": "task_1",
              "nome": "Criar modelo base do logo",
              "instrucao": "Criar o modelo 3D base do logo seguindo as especificações do briefing. Atenção especial para proporções e detalhes.",
              "status": "executando",
              "ordem": 1,
              "setor": "Criação",
              "responsavel_nome": "João Silva",
              "responsavel_tipo": "interno",
              "responsavel_usuario": "user_123",
              
              "start_at": "2025-10-09T08:00:00.000Z",
              "duration": 480,
              "end_at": null,
              
              "prazo_horas": 8,
              "mandrill_coins": 100,
              "duracao_segundos": 28800,
              
              "data_inicio": "2025-10-09T08:00:00.000Z",
              "data_fim": null,
              "tempo_execucao": 14400,
              
              "resultado": null,
              "templates": []
            },
            {
              "id": "task_2",
              "nome": "Aplicar texturas e materiais",
              "instrucao": "Aplicar as texturas e materiais ao modelo 3D.",
              "status": "planejada",
              "ordem": 2,
              "setor": "Criação",
              "responsavel_nome": "João Silva",
              "responsavel_tipo": "interno",
              
              "start_at": null,
              "duration": 360,
              "end_at": null,
              
              "prazo_horas": 6,
              "mandrill_coins": 80,
              
              "data_inicio": null,
              "data_conclusao": null
            }
          ]
        },
        {
          "id": "serv_2",
          "nome": "Animação",
          "descricao": "Animação dos elementos 3D",
          "ordem": 2,
          "etapa": 2,
          "pode_executar_paralelo": false,
          "dependencias": ["serv_1"],
          "status": "planejada",
          "progresso_percentual": 0,
          "valor_estimado": 7000.00,
          "prazo_dias": 10,
          
          "tarefas": [
            {
              "id": "task_3",
              "nome": "Criar keyframes principais",
              "status": "planejada",
              "ordem": 1,
              "setor": "Criação",
              "responsavel_nome": "Maria Santos",
              
              "start_at": null,
              "duration": 720,
              "end_at": null,
              
              "prazo_horas": 12,
              "mandrill_coins": 150
            }
          ]
        }
      ],
      
      "projeto": {
        "id": "proj_1",
        "codigo": "2024-0045",
        "titulo": "Campanha de Lançamento de Produto",
        "cliente": "StartupTech Innovations"
      }
    },
    
    "estatisticas": {
      "total_servicos": 5,
      "servicos_concluidos": 1,
      "total_tarefas": 18,
      "tarefas_concluidas": 8,
      "tarefas_executando": 3,
      "tarefas_atrasadas": 1
    }
  },
  "timestamp": "2025-10-09T12:00:00.000Z"
}
```

### Campos Obrigatórios

#### Entrega
```json
{
  "id": "string (UUID)",
  "projeto_id": "string (UUID)",
  "nome": "string",
  "briefing": "string",
  "status": "string",
  "progresso_percentual": "number (0-100)",
  "tipo": "string | null",
  "servicos": "array"
}
```

#### Briefing (campos opcionais mas recomendados)
```json
{
  "uso": "string | null",
  "estilo": "string | null",
  "objetivos": "string | null",
  "tom": "string | null",
  "tecnicas": {
    "fotografia": "array",
    "gravacao": "array",
    "audio": "array",
    "ilustracao": "array",
    "animacao": "array",
    "motion": "array"
  },
  "estrategia": "string | null",
  "referencias": "array"
}
```

#### Janela de Exibição (campos opcionais)
```json
{
  "territorio": "string | null",
  "veiculos": "array",
  "periodo_utilizacao": "string | null",
  "duracao": "string | null",
  "idioma_original": "string | null"
}
```

#### Serviço
```json
{
  "id": "string (UUID)",
  "nome": "string",
  "descricao": "string | null",
  "ordem": "number",
  "etapa": "number | null",
  "pode_executar_paralelo": "boolean",
  "dependencias": "array (IDs de serviços)",
  "status": "string",
  "progresso_percentual": "number (0-100)",
  "tarefas": "array"
}
```

#### Tarefa
```json
{
  "id": "string (UUID)",
  "nome": "string",
  "instrucao": "string | null",
  "status": "string",
  "ordem": "number | null",
  "setor": "string",
  "responsavel_nome": "string | null",
  
  "start_at": "string (ISO 8601) | null",
  "duration": "number (minutos)",
  "end_at": "string (ISO 8601) | null",
  
  "prazo_horas": "number",
  "mandrill_coins": "number"
}
```

### Notas

1. **Dados de Briefing Completos**
   - Usado para exibir nas tabs "Briefing" e "Exibição"
   - Campos podem ser strings separadas por vírgula OU arrays
   - Frontend aceita ambos os formatos

2. **Técnicas**
   - Estrutura de objeto com arrays por categoria
   - Cada categoria pode estar vazia `[]`
   - Frontend exibe com emojis diferentes por categoria

3. **Serviços com Dependências**
   - `dependencias`: Array de IDs de serviços predecessores
   - `etapa`: Calculado via BFS no backend (recomendado)
   - `pode_executar_paralelo`: Define se pode executar junto com outros

4. **React Flow (ServiceFlowCanvas)**
   - Usa `servicos` para montar o grafo
   - Dependências viram edges (setas)
   - Etapas definem posicionamento vertical

5. **Countdown da Entrega**
   - Frontend calcula em tempo real somando prazos de tarefas não concluídas
   - Considera etapas (serviços paralelos não somam)
   - Exibido no header da página

---

## 📊 Resumo dos Dados Necessários

### Hierarquia de Dados
```
Projeto
└── Entregas[]
    └── Serviços[]
        └── Tarefas[]
```

### Campos Críticos para Funcionamento

#### ✅ TODOS os endpoints precisam incluir:

**Para Tarefas:**
- ✅ `start_at` (timestamp | null)
- ✅ `duration` (number em minutos)
- ✅ `end_at` (timestamp | null)
- ✅ `status` (para calcular se está atrasada)
- ✅ `responsavel_nome` (para exibir)
- ✅ `responsavel_setor` (para exibir)

**Para Projetos:**
- ✅ `demanda_codigo` (exibição e ordenação)
- ✅ `prazo_data` (ordenação por data)
- ✅ `progresso_percentual` (barra de progresso)
- ✅ `status` (filtros e cores)

**Para Entregas:**
- ✅ `nome` (exibição)
- ✅ `briefing` (tabs de briefing)
- ✅ `progresso_percentual` (barra de progresso)

**Para Serviços:**
- ✅ `nome` (exibição)
- ✅ `ordem` (ordenação)
- ✅ `pode_executar_paralelo` (React Flow)
- ✅ `dependencias` (React Flow - edges)
- ✅ `etapa` (React Flow - posicionamento)

---

## 🔄 Exemplo de Resposta Mínima (Teste)

### GET /api/projetos (mínimo)
```json
{
  "success": true,
  "data": {
    "projetos": [
      {
        "id": "proj_1",
        "demanda_codigo": "2024-0045",
        "cliente_nome": "Cliente Teste",
        "motivo": "Campanha Teste",
        "status": "executando",
        "progresso_percentual": 50,
        "valor_total": 10000,
        "prazo_dias": 30,
        "prazo_data": "2025-11-14T21:00:00.000Z",
        "entregas": []
      }
    ]
  }
}
```

### GET /api/tarefas (mínimo)
```json
{
  "success": true,
  "data": {
    "tarefas": [
      {
        "id": "task_1",
        "nome": "Tarefa Teste",
        "status": "executando",
        "responsavel_nome": "João Silva",
        "responsavel_setor": "Criação",
        "start_at": "2025-10-09T08:00:00.000Z",
        "duration": 480,
        "end_at": null,
        "prazo_horas": 8,
        "data_inicio": "2025-10-09T08:00:00.000Z",
        "projeto": {
          "id": "proj_1",
          "codigo": "2024-0045",
          "cliente": "Cliente Teste"
        },
        "entrega": {
          "id": "ent_1",
          "nome": "Entrega Teste"
        },
        "servico": {
          "id": "serv_1",
          "nome": "Serviço Teste"
        }
      }
    ]
  }
}
```

---

## 📝 Checklist de Implementação Backend

### Endpoint 1: GET /api/projetos
- [ ] Retornar hierarquia completa (projetos → entregas → servicos → tarefas)
- [ ] Incluir novos campos de prazo (`start_at`, `duration`, `end_at`)
- [ ] Manter campos legados (`prazo_horas`, `data_inicio`, `data_conclusao`)
- [ ] Calcular `progresso_percentual` baseado em tarefas concluídas
- [ ] Filtro por status (ativo/concluído)

### Endpoint 2: GET /api/tarefas
- [ ] Retornar tarefas com contexto enriquecido
- [ ] Incluir dados de projeto/entrega/serviço
- [ ] Novos campos de prazo implementados
- [ ] Filtro por status
- [ ] Apenas tarefas não concluídas por padrão

### Endpoint 3: GET /api/projetos/:id
- [ ] Retornar projeto completo com todas entregas
- [ ] Todas entregas com todos serviços
- [ ] Todos serviços com todas tarefas
- [ ] Campos adicionais do projeto (anunciante, vendedor, etc)
- [ ] Estatísticas calculadas

### Endpoint 4: GET /api/entregas/:id
- [ ] Retornar entrega completa
- [ ] Todos os dados de briefing (uso, estilo, objetivos, tom, etc)
- [ ] Técnicas como objeto estruturado
- [ ] Dados de janela de exibição
- [ ] Serviços com dependências e etapas
- [ ] Todas as tarefas de cada serviço
- [ ] Opcionalmente dados do projeto pai

---

## 🎯 Prioridades

### 🔥 Prioridade ALTA (para funcionamento básico)
1. Estrutura de prazo (`start_at`, `duration`, `end_at`)
2. Hierarquia completa (projeto → entrega → serviço → tarefa)
3. Status corretos das tarefas
4. Responsáveis das tarefas

### ⚡ Prioridade MÉDIA (para features completas)
5. Dados de briefing da entrega
6. Dependências entre serviços
7. Etapas calculadas (BFS)
8. Estatísticas pré-calculadas

### 💡 Prioridade BAIXA (pode vir depois)
9. Campos extras do projeto (vendedor, emissor, etc)
10. Item CRM da entrega
11. Referências e estratégia do briefing

---

**Documentação criada em:** 9 de outubro de 2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para implementação
