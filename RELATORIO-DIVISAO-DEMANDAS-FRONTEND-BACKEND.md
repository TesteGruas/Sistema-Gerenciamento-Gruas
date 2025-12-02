# 🧩 RELATÓRIO DE DIVISÃO DE DEMANDAS
## Frontend × Backend + Banco de Dados

**Data:** 02/02/2025  
**Foco:** Divisão de responsabilidades e demandas técnicas  
**Objetivo:** Mapear e organizar tarefas entre equipes Frontend e Backend

---

## 📋 SUMÁRIO EXECUTIVO

### Visão Geral
- **Total de Demandas Frontend:** 6 tarefas principais
- **Total de Demandas Backend:** 5 tarefas principais
- **Prioridade Crítica:** 3 endpoints faltantes (Sinaleiros, Performance Gruas, Aluguéis)
- **Estimativa Total:** 4-6 semanas de trabalho coordenado

### Status Atual
- **Frontend:** ~85% integrado, mocks ainda presentes em 3 módulos
- **Backend:** ~90% funcional, 3 endpoints críticos faltando
- **Banco de Dados:** Estrutura base presente, requer 3 novas tabelas

### Priorização
- 🔴 **CRÍTICO:** Endpoints faltantes, mocks em produção
- 🟡 **IMPORTANTE:** Ajustes de integração, validações
- 🟢 **OPCIONAL:** Otimizações, refatorações

---

## 💻 FRONTEND — Demandas

### 🟣 1. Remover Mocks e Integrar APIs Reais

**Status:** ⚠️ **PENDENTE**

**Arquivos Afetados:**
- `lib/api-sinaleiros.ts`
- `lib/api-relatorios-performance.ts`
- `lib/api-alugueis-residencias.ts`

**Ações Necessárias:**

1. **Substituir chamadas mock por requests reais**
   - Remover imports de `lib/mocks/*`
   - Implementar chamadas HTTP reais usando `fetch` ou cliente HTTP
   - Atualizar tratamento de erros

2. **Atualizar interfaces/types conforme contratos retornados pelo backend**
   - Validar tipos TypeScript/Interfaces
   - Ajustar DTOs conforme resposta real da API
   - Garantir compatibilidade de tipos

**Dependências:**
- ⚠️ Aguardar endpoints backend correspondentes

**Estimativa:** 1-2 dias por API (3 APIs = 3-6 dias)

---

### 🟣 2. Ajustar Página de Obras (Sinaleiros)

**Status:** ⚠️ **PENDENTE**

**Arquivos Afetados:**
- `app/dashboard/obras/[id]/page.tsx`
- `app/dashboard/obras/nova/page.tsx`

**Ações Necessárias:**

1. **Integrar com nova rota real de sinaleiros**
   - Substituir `sinaleirosApi.*` mockado por chamadas reais
   - Implementar handlers de sucesso/erro
   - Adicionar loading states

2. **Remover referência a lib/mocks/sinaleiros-mocks.ts**
   - Remover imports
   - Limpar código morto
   - Atualizar testes se existirem

3. **Criar handlers de filtro por obra_id/grua_id se necessário**
   - Implementar filtros na listagem
   - Adicionar parâmetros de query string
   - Validar filtros no frontend

**Dependências:**
- ⚠️ Aguardar endpoint `/api/sinaleiros?obra_id={id}` no backend

**Estimativa:** 4-6 horas

---

### 🟣 3. Remover Mock de Complementos

**Status:** ⚠️ **PENDENTE**

**Arquivos Afetados:**
- `components/grua-complementos-manager.tsx`

**Ações Necessárias:**

1. **Criar função loadComplementos(...)**
   ```typescript
   const loadComplementos = async (obraId?: string, gruaId?: string) => {
     try {
       const params = new URLSearchParams()
       if (obraId) params.append('obra_id', obraId)
       if (gruaId) params.append('grua_id', gruaId)
       
       const response = await fetch(`/api/complementos?${params}`)
       const data = await response.json()
       setComplementos(data)
     } catch (error) {
       // Tratar erro
     }
   }
   ```

2. **Buscar complementos via API real (com filtros por obra/grua quando aplicável)**
   - Usar endpoint existente `/api/complementos`
   - Implementar filtros dinâmicos
   - Adicionar cache se necessário

3. **Remover todo trecho mockado do useEffect**
   - Localizar linhas 151-204 do componente
   - Remover array mockado
   - Substituir por chamada real

**Dependências:**
- ✅ Endpoint `/api/complementos` já existe no backend

**Estimativa:** 2-4 horas

---

### 🟣 4. Integrar Performance de Gruas

**Status:** ⚠️ **PENDENTE**

**Arquivos Afetados:**
- `app/dashboard/relatorios/page.tsx`
- `lib/api-relatorios-performance.ts`

**Ações Necessárias:**

1. **Integrar endpoint real de performance**
   - Substituir `performanceGruasApi.*` mockado
   - Implementar chamada para `/api/relatorios/performance-gruas`

2. **Validar parâmetros de período, obra e grua**
   - Implementar validação de datas
   - Validar IDs de obra e grua
   - Adicionar feedback de erro para parâmetros inválidos

3. **Exibir cálculos reais de:**
   - Horas trabalhadas
   - Custos
   - Receitas
   - ROI
   - Comparativos

**Dependências:**
- ⚠️ Aguardar endpoint `/api/relatorios/performance-gruas` no backend

**Estimativa:** 1-2 dias

---

### 🟣 5. Integrar Aluguéis Residenciais

**Status:** ⚠️ **PENDENTE**

**Arquivos Afetados:**
- `app/dashboard/financeiro/alugueis/page.tsx`
- `lib/api-alugueis-residencias.ts`

**Ações Necessárias:**

1. **Substituir AlugueisAPI.* mockado pela API real**
   - Remover todos os mocks de `lib/api-alugueis-residencias.ts`
   - Implementar cliente HTTP real

2. **Implementar CRUD completo:**
   - **Listagem:** `GET /api/alugueis-residencias`
   - **Criação:** `POST /api/alugueis-residencias`
   - **Edição:** `PUT /api/alugueis-residencias/:id`
   - **Exclusão:** `DELETE /api/alugueis-residencias/:id`

3. **Relação funcionário ↔ residência**
   - Implementar seleção de funcionário
   - Implementar seleção de residência
   - Validar disponibilidade

4. **Histórico de pagamentos**
   - Listar pagamentos por aluguel
   - Exibir status de pagamento
   - Filtrar por período

5. **Validar campos retornados pelo backend**
   - Ajustar interfaces conforme resposta real
   - Mapear campos se necessário
   - Tratar campos opcionais

**Dependências:**
- ⚠️ Aguardar backend completo de aluguéis (tabelas + rotas)

**Estimativa:** 2-3 dias

---

### 🟣 6. Testes e Ajustes de Tipagem

**Status:** ⚠️ **PENDENTE**

**Ações Necessárias:**

1. **Validar respostas de cada novo endpoint**
   - Testar cada endpoint integrado
   - Validar estrutura de resposta
   - Verificar casos de erro

2. **Ajustar DTOs/interfaces**
   - Atualizar tipos TypeScript
   - Corrigir incompatibilidades
   - Adicionar tipos para novos campos

3. **Criar Toaster de feedback para erros reais**
   - Implementar notificações de erro
   - Mensagens amigáveis ao usuário
   - Logs para desenvolvimento

**Estimativa:** 1 dia

---

## 🗄️ BACKEND + BANCO — Demandas

### 🔴 1. Construir Backend Completo de Sinaleiros

**Status:** ❌ **NÃO INICIADO**

**Itens Necessários:**

#### 1.1 Migration da Tabela `sinaleiros`

**Campos Sugeridos:**

| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `obra_id` | uuid | Referência à obra | FOREIGN KEY → obras(id), NOT NULL |
| `nome` | varchar(255) | Nome do sinaleiro | NOT NULL |
| `telefone` | varchar(20) | Telefone de contato | |
| `documentos` | jsonb | Documentos do sinaleiro | |
| `certificados` | jsonb | Certificados e habilitações | |
| `status` | varchar(50) | Status (ativo, inativo, etc.) | DEFAULT 'ativo' |
| `created_at` | timestamp | Data de criação | DEFAULT now() |
| `updated_at` | timestamp | Data de atualização | DEFAULT now() |

**Arquivo:** `backend-api/database/migrations/YYYY-MM-DD_create_sinaleiros.sql`

#### 1.2 Criar Rota CRUD

**Arquivo:** `backend-api/src/routes/sinaleiros.js`

**Contratos de API:**

**GET /api/sinaleiros?obra_id={id}**
```javascript
// Listar sinaleiros (com filtro opcional por obra)
// Query params: obra_id (opcional)
// Response: { data: Sinaleiro[], total: number }
```

**GET /api/sinaleiros/:id**
```javascript
// Buscar sinaleiro por ID
// Response: { data: Sinaleiro }
```

**POST /api/sinaleiros**
```javascript
// Criar novo sinaleiro
// Body: { obra_id, nome, telefone, documentos?, certificados?, status? }
// Response: { data: Sinaleiro }
```

**PUT /api/sinaleiros/:id**
```javascript
// Atualizar sinaleiro
// Body: { nome?, telefone?, documentos?, certificados?, status? }
// Response: { data: Sinaleiro }
```

**DELETE /api/sinaleiros/:id**
```javascript
// Excluir sinaleiro (soft delete recomendado)
// Response: { message: "Sinaleiro excluído com sucesso" }
```

#### 1.3 Registrar no server.js

```javascript
// backend-api/src/server.js
const sinaleirosRoutes = require('./routes/sinaleiros')
app.use('/api/sinaleiros', authenticate, sinaleirosRoutes)
```

**Estimativa:** 1-2 dias

---

### 🔴 2. Endpoint de Performance de Gruas

**Status:** ❌ **NÃO INICIADO**

**Objetivo:** Relatórios gerenciais com métricas de performance

**Rota Sugerida:**
```
GET /api/relatorios/performance-gruas
```

**Query Parameters:**
- `data_inicio` (obrigatório): Data inicial do período
- `data_fim` (obrigatório): Data final do período
- `obra_id` (opcional): Filtrar por obra específica
- `grua_id` (opcional): Filtrar por grua específica

**Queries Necessárias:**

1. **Horas trabalhadas por grua**
   ```sql
   -- Agregar horas de medições por grua no período
   SELECT grua_id, SUM(horas_trabalhadas) as total_horas
   FROM medicoes_mensais
   WHERE data_medicao BETWEEN :data_inicio AND :data_fim
   GROUP BY grua_id
   ```

2. **Receitas acumuladas**
   ```sql
   -- Calcular receitas por grua (locações + aditivos)
   SELECT grua_id, SUM(valor_total) as total_receitas
   FROM locacoes l
   JOIN obra_gruas og ON l.obra_id = og.obra_id
   WHERE l.data_inicio <= :data_fim AND l.data_fim >= :data_inicio
   GROUP BY grua_id
   ```

3. **Custos operacionais**
   ```sql
   -- Agregar custos por grua
   SELECT grua_id, SUM(valor) as total_custos
   FROM custos_mensais
   WHERE mes BETWEEN :data_inicio AND :data_fim
   GROUP BY grua_id
   ```

4. **ROI (Return on Investment)**
   ```sql
   -- Calcular ROI: (Receitas - Custos) / Custos * 100
   -- Combinar queries acima
   ```

5. **Histórico mensal comparativo**
   ```sql
   -- Comparar período atual com período anterior
   -- Agrupar por mês e calcular variações
   ```

**Demandas Técnicas:**

- **JOINs necessários sobre:**
  - `medicoes` / `medicoes_mensais`
  - `custos` / `custos_mensais`
  - `receitas`
  - `locações`
  - `obra` / `grua` / `obra_gruas`

**Arquivo:** `backend-api/src/routes/relatorios-performance-gruas.js`

**Estrutura de Resposta Sugerida:**
```json
{
  "data": [
    {
      "grua_id": "uuid",
      "grua_nome": "string",
      "periodo": {
        "inicio": "YYYY-MM-DD",
        "fim": "YYYY-MM-DD"
      },
      "metricas": {
        "horas_trabalhadas": 0,
        "receitas": 0,
        "custos": 0,
        "lucro": 0,
        "roi": 0
      },
      "comparativo": {
        "periodo_anterior": {
          "horas_trabalhadas": 0,
          "receitas": 0,
          "custos": 0,
          "lucro": 0,
          "roi": 0
        },
        "variacao_percentual": {
          "horas_trabalhadas": 0,
          "receitas": 0,
          "custos": 0,
          "lucro": 0,
          "roi": 0
        }
      }
    }
  ],
  "total": 0,
  "periodo": {
    "inicio": "YYYY-MM-DD",
    "fim": "YYYY-MM-DD"
  }
}
```

**Estimativa:** 2-3 dias

---

### 🔴 3. Backend de Aluguéis Residenciais

**Status:** ❌ **NÃO INICIADO**

#### 3.1 Tabelas (Banco de Dados)

**Tabela: `residencias`**

| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `nome` | varchar(255) | Nome/identificação da residência | NOT NULL |
| `endereco` | varchar(500) | Endereço completo | NOT NULL |
| `cidade` | varchar(100) | Cidade | NOT NULL |
| `estado` | char(2) | Estado (UF) | NOT NULL |
| `cep` | varchar(10) | CEP | |
| `quartos` | int | Número de quartos | DEFAULT 0 |
| `banheiros` | int | Número de banheiros | DEFAULT 0 |
| `area` | decimal(10,2) | Área em m² | |
| `mobiliada` | boolean | Se está mobiliada | DEFAULT false |
| `valor_base` | decimal(10,2) | Valor base do aluguel | NOT NULL |
| `disponivel` | boolean | Se está disponível | DEFAULT true |
| `created_at` | timestamp | Data de criação | DEFAULT now() |
| `updated_at` | timestamp | Data de atualização | DEFAULT now() |

**Tabela: `alugueis_residencias`**

| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `residencia_id` | uuid | Referência à residência | FOREIGN KEY → residencias(id), NOT NULL |
| `funcionario_id` | uuid | Referência ao funcionário | FOREIGN KEY → funcionarios(id), NOT NULL |
| `data_inicio` | date | Data de início do aluguel | NOT NULL |
| `data_fim` | date | Data de término (null = ativo) | |
| `valor_mensal` | decimal(10,2) | Valor mensal do aluguel | NOT NULL |
| `desconto_folha` | boolean | Se desconta na folha | DEFAULT false |
| `porcentagem_desconto` | decimal(5,2) | % de desconto na folha | DEFAULT 0 |
| `status` | varchar(50) | Status (ativo, encerrado, etc.) | DEFAULT 'ativo' |
| `observacoes` | text | Observações gerais | |
| `created_at` | timestamp | Data de criação | DEFAULT now() |
| `updated_at` | timestamp | Data de atualização | DEFAULT now() |

**Tabela: `pagamentos_aluguel`**

| Campo | Tipo | Descrição | Constraints |
|-------|------|-----------|-------------|
| `id` | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `aluguel_id` | uuid | Referência ao aluguel | FOREIGN KEY → alugueis_residencias(id), NOT NULL |
| `mes` | varchar(7) | Mês de referência (YYYY-MM) | NOT NULL |
| `valor_pago` | decimal(10,2) | Valor pago | NOT NULL |
| `data_pagamento` | date | Data do pagamento | NOT NULL |
| `status` | varchar(50) | Status (pago, pendente, atrasado) | DEFAULT 'pendente' |
| `created_at` | timestamp | Data de criação | DEFAULT now() |
| `updated_at` | timestamp | Data de atualização | DEFAULT now() |

**Arquivos de Migration:**
- `backend-api/database/migrations/YYYY-MM-DD_create_residencias.sql`
- `backend-api/database/migrations/YYYY-MM-DD_create_alugueis_residencias.sql`
- `backend-api/database/migrations/YYYY-MM-DD_create_pagamentos_aluguel.sql`

#### 3.2 Rotas (Backend)

**Arquivo:** `backend-api/src/routes/alugueis-residencias.js`

**GET /api/alugueis-residencias**
```javascript
// Listar aluguéis (com JOINs com residências e funcionários)
// Query params: funcionario_id?, residencia_id?, status?
// Response: { data: AluguelCompleto[], total: number }
```

**GET /api/alugueis-residencias/:id**
```javascript
// Buscar aluguel por ID (com JOINs)
// Response: { data: AluguelCompleto }
```

**POST /api/alugueis-residencias**
```javascript
// Criar novo aluguel
// Body: { residencia_id, funcionario_id, data_inicio, data_fim?, valor_mensal, desconto_folha?, porcentagem_desconto?, observacoes? }
// Response: { data: AluguelCompleto }
```

**PUT /api/alugueis-residencias/:id**
```javascript
// Atualizar aluguel
// Body: { data_fim?, valor_mensal?, desconto_folha?, porcentagem_desconto?, status?, observacoes? }
// Response: { data: AluguelCompleto }
```

**DELETE /api/alugueis-residencias/:id**
```javascript
// Excluir aluguel (soft delete recomendado)
// Response: { message: "Aluguel excluído com sucesso" }
```

**GET /api/alugueis-residencias/:id/pagamentos**
```javascript
// Listar pagamentos de um aluguel
// Response: { data: PagamentoAluguel[], total: number }
```

**POST /api/alugueis-residencias/:id/pagamentos**
```javascript
// Registrar pagamento
// Body: { mes, valor_pago, data_pagamento, status? }
// Response: { data: PagamentoAluguel }
```

**📌 Observação:**
Ao listar aluguéis, trazer JOIN com residências e funcionários para evitar múltiplas queries.

**Estimativa:** 2-3 dias

---

### 🟠 4. Ajustes Gerais Backend

**Status:** ⚠️ **PENDENTE**

**Ações Necessárias:**

1. **Registrar todas as rotas novas no server.js**
   ```javascript
   // backend-api/src/server.js
   const sinaleirosRoutes = require('./routes/sinaleiros')
   const relatoriosPerformanceRoutes = require('./routes/relatorios-performance-gruas')
   const alugueisResidenciasRoutes = require('./routes/alugueis-residencias')
   
   app.use('/api/sinaleiros', authenticate, sinaleirosRoutes)
   app.use('/api/relatorios/performance-gruas', authenticate, relatoriosPerformanceRoutes)
   app.use('/api/alugueis-residencias', authenticate, alugueisResidenciasRoutes)
   ```

2. **Criar migrations e seeds para dados iniciais**
   - Executar migrations na ordem correta
   - Criar seeds opcionais para dados de teste
   - Documentar ordem de execução

3. **Padronizar validações (Joi/Zod) com campos obrigatórios**
   - Implementar schemas de validação para todas as rotas POST/PUT
   - Validar tipos e formatos
   - Retornar erros padronizados

4. **Garantir foreign keys corretas**
   - Verificar constraints no banco
   - Validar referências antes de inserir
   - Tratar erros de FK adequadamente

5. **Criar índices para consultas de relatórios**
   ```sql
   -- Exemplo de índices necessários
   CREATE INDEX idx_sinaleiros_obra_id ON sinaleiros(obra_id);
   CREATE INDEX idx_alugueis_funcionario_id ON alugueis_residencias(funcionario_id);
   CREATE INDEX idx_alugueis_residencia_id ON alugueis_residencias(residencia_id);
   CREATE INDEX idx_pagamentos_aluguel_id ON pagamentos_aluguel(aluguel_id);
   CREATE INDEX idx_pagamentos_mes ON pagamentos_aluguel(mes);
   CREATE INDEX idx_medicoes_data ON medicoes_mensais(data_medicao);
   ```

**Estimativa:** 1-2 dias

---

### 🧪 5. Testes na API

**Status:** ⚠️ **PENDENTE**

**Ações Necessárias:**

1. **Testar CRUD de sinaleiros**
   - Criar sinaleiro
   - Listar sinaleiros (com e sem filtro)
   - Atualizar sinaleiro
   - Excluir sinaleiro
   - Validar erros (obra não existe, etc.)

2. **Testar relatórios reais**
   - Testar endpoint de performance com diferentes períodos
   - Validar cálculos de ROI
   - Testar filtros por obra/grua
   - Validar comparação com período anterior

3. **Testar CRUD de aluguéis**
   - Criar aluguel
   - Listar aluguéis (com JOINs)
   - Atualizar aluguel
   - Excluir aluguel
   - Registrar pagamento
   - Listar pagamentos

4. **Garantir logs claros em erros**
   - Implementar logging estruturado
   - Logs de erro com contexto
   - Logs de auditoria para ações sensíveis

**Estimativa:** 1-2 dias

---

## ✔️ EXTRA: Validação Final entre Times

### Frontend Deve:

1. **Validar payloads reais de cada endpoint**
   - Testar com dados reais do backend
   - Validar estrutura de resposta
   - Tratar casos edge

2. **Criar interfaces e modelos**
   - Definir tipos TypeScript para todas as respostas
   - Criar DTOs de request/response
   - Documentar interfaces

3. **Tratar erros com UI/UX**
   - Mensagens amigáveis ao usuário
   - Loading states adequados
   - Feedback visual de sucesso/erro

### Backend Deve:

1. **Documentar rotas no README/Swagger**
   - Documentar todos os endpoints
   - Exemplos de request/response
   - Códigos de erro possíveis

2. **Garantir retornos consistentes**
   - Padronizar formato de resposta
   - Sempre retornar `{ data: ... }` ou `{ error: ... }`
   - Códigos HTTP corretos

3. **Expor filtros por obra/grua/período**
   - Implementar query params consistentes
   - Validar parâmetros
   - Documentar filtros disponíveis

---

## 🧭 RECOMENDAÇÃO DE ORDEM DE EXECUÇÃO

### Fase 1: Backend Sinaleiros (Semana 1)
1. ✅ Criar migration da tabela `sinaleiros`
2. ✅ Criar rota CRUD completa
3. ✅ Registrar no server.js
4. ✅ Testar endpoints
5. ✅ Documentar

### Fase 2: Frontend substitui mock de sinaleiros (Semana 1)
1. ✅ Atualizar `lib/api-sinaleiros.ts`
2. ✅ Integrar em `app/dashboard/obras/[id]/page.tsx`
3. ✅ Integrar em `app/dashboard/obras/nova/page.tsx`
4. ✅ Testar integração completa

### Fase 3: Backend Performance de Gruas (Semana 2)
1. ✅ Criar queries SQL complexas
2. ✅ Criar rota de relatórios
3. ✅ Implementar cálculos (ROI, comparativos)
4. ✅ Testar com dados reais
5. ✅ Documentar

### Fase 4: Frontend integra performance (Semana 2)
1. ✅ Atualizar `lib/api-relatorios-performance.ts`
2. ✅ Integrar em `app/dashboard/relatorios/page.tsx`
3. ✅ Validar parâmetros e exibir dados reais
4. ✅ Testar relatórios

### Fase 5: Backend Aluguéis (Semana 3)
1. ✅ Criar migrations (3 tabelas)
2. ✅ Criar rotas CRUD completas
3. ✅ Implementar JOINs com residências e funcionários
4. ✅ Criar rotas de pagamentos
5. ✅ Testar CRUD completo

### Fase 6: Frontend integra Aluguéis (Semana 3)
1. ✅ Atualizar `lib/api-alugueis-residencias.ts`
2. ✅ Integrar em `app/dashboard/financeiro/alugueis/page.tsx`
3. ✅ Implementar CRUD completo na UI
4. ✅ Testar integração

### Fase 7: Remover mock de Complementos (Semana 4)
1. ✅ Atualizar `components/grua-complementos-manager.tsx`
2. ✅ Implementar `loadComplementos()`
3. ✅ Remover mock do useEffect
4. ✅ Testar componente

### Fase 8: Rodada final de testes (Semana 4)
1. ✅ Testes de integração end-to-end
2. ✅ Validação de tipos e interfaces
3. ✅ Ajustes finais de UI/UX
4. ✅ Documentação final

---

## 📊 RESUMO DE ESTIMATIVAS

| Fase | Tarefa | Estimativa | Prioridade |
|------|--------|------------|------------|
| 1 | Backend Sinaleiros | 1-2 dias | 🔴 Crítica |
| 2 | Frontend Sinaleiros | 4-6 horas | 🔴 Crítica |
| 3 | Backend Performance | 2-3 dias | 🔴 Crítica |
| 4 | Frontend Performance | 1-2 dias | 🔴 Crítica |
| 5 | Backend Aluguéis | 2-3 dias | 🔴 Crítica |
| 6 | Frontend Aluguéis | 2-3 dias | 🔴 Crítica |
| 7 | Remover Mock Complementos | 2-4 horas | 🟡 Importante |
| 8 | Testes e Ajustes | 1-2 dias | 🟡 Importante |
| 9 | Ajustes Gerais Backend | 1-2 dias | 🟡 Importante |
| 10 | Validação Final | 1 dia | 🟡 Importante |

**Total Estimado:** 4-6 semanas

---

## 📋 CHECKLIST DE FINALIZAÇÃO

### Backend

#### Sinaleiros
- [ ] Criar migration da tabela `sinaleiros`
- [ ] Criar rota `GET /api/sinaleiros?obra_id={id}`
- [ ] Criar rota `GET /api/sinaleiros/:id`
- [ ] Criar rota `POST /api/sinaleiros`
- [ ] Criar rota `PUT /api/sinaleiros/:id`
- [ ] Criar rota `DELETE /api/sinaleiros/:id`
- [ ] Registrar rotas no `server.js`
- [ ] Implementar validações (Joi/Zod)
- [ ] Testar CRUD completo

#### Performance de Gruas
- [ ] Criar rota `GET /api/relatorios/performance-gruas`
- [ ] Implementar query de horas trabalhadas
- [ ] Implementar query de receitas
- [ ] Implementar query de custos
- [ ] Implementar cálculo de ROI
- [ ] Implementar comparativo período anterior
- [ ] Registrar rota no `server.js`
- [ ] Testar com dados reais

#### Aluguéis Residenciais
- [ ] Criar migration `residencias`
- [ ] Criar migration `alugueis_residencias`
- [ ] Criar migration `pagamentos_aluguel`
- [ ] Criar rotas CRUD de aluguéis
- [ ] Criar rotas de pagamentos
- [ ] Implementar JOINs com residências e funcionários
- [ ] Registrar rotas no `server.js`
- [ ] Implementar validações
- [ ] Testar CRUD completo

#### Ajustes Gerais
- [ ] Criar índices para consultas de relatórios
- [ ] Padronizar validações em todas as rotas
- [ ] Garantir foreign keys corretas
- [ ] Documentar todas as rotas
- [ ] Implementar logs estruturados

### Frontend

#### Sinaleiros
- [ ] Atualizar `lib/api-sinaleiros.ts` (remover mock)
- [ ] Integrar em `app/dashboard/obras/[id]/page.tsx`
- [ ] Integrar em `app/dashboard/obras/nova/page.tsx`
- [ ] Implementar handlers de filtro
- [ ] Testar integração

#### Performance de Gruas
- [ ] Atualizar `lib/api-relatorios-performance.ts` (remover mock)
- [ ] Integrar em `app/dashboard/relatorios/page.tsx`
- [ ] Validar parâmetros de período/obra/grua
- [ ] Exibir cálculos reais
- [ ] Testar relatórios

#### Aluguéis Residenciais
- [ ] Atualizar `lib/api-alugueis-residencias.ts` (remover mock)
- [ ] Integrar em `app/dashboard/financeiro/alugueis/page.tsx`
- [ ] Implementar CRUD completo na UI
- [ ] Implementar relação funcionário ↔ residência
- [ ] Implementar histórico de pagamentos
- [ ] Testar integração

#### Complementos
- [ ] Criar função `loadComplementos()` em `components/grua-complementos-manager.tsx`
- [ ] Remover mock do useEffect (linhas 151-204)
- [ ] Testar componente

#### Testes e Tipagem
- [ ] Validar respostas de todos os endpoints
- [ ] Ajustar DTOs/interfaces
- [ ] Criar Toaster de feedback para erros
- [ ] Testes de integração end-to-end

---

## 🎯 PLANO DE EXECUÇÃO DETALHADO

### Semana 1: Sinaleiros
**Objetivo:** Finalizar integração completa de sinaleiros

**Backend (Dias 1-2):**
- Dia 1: Criar migration e estrutura base
- Dia 2: Implementar rotas CRUD e testes

**Frontend (Dia 2-3):**
- Dia 2: Atualizar API e integrar em páginas
- Dia 3: Testes e ajustes finais

**Entregável:** Sinaleiros totalmente integrados

---

### Semana 2: Performance de Gruas
**Objetivo:** Implementar relatórios de performance com dados reais

**Backend (Dias 1-3):**
- Dia 1: Criar queries SQL complexas
- Dia 2: Implementar cálculos e comparativos
- Dia 3: Testes e otimizações

**Frontend (Dias 2-3):**
- Dia 2: Integrar endpoint real
- Dia 3: Validar e exibir dados reais

**Entregável:** Relatórios de performance funcionais

---

### Semana 3: Aluguéis Residenciais
**Objetivo:** Sistema completo de aluguéis de residências

**Backend (Dias 1-3):**
- Dia 1: Criar migrations (3 tabelas)
- Dia 2: Implementar rotas CRUD e pagamentos
- Dia 3: Testes e JOINs

**Frontend (Dias 2-3):**
- Dia 2: Integrar API real
- Dia 3: Implementar UI completa e testes

**Entregável:** Módulo de aluguéis totalmente funcional

---

### Semana 4: Finalização
**Objetivo:** Remover mocks restantes e validação final

**Tarefas:**
- Remover mock de complementos (2-4 horas)
- Ajustes gerais backend (1-2 dias)
- Testes finais e validação (1 dia)
- Documentação (1 dia)

**Entregável:** Sistema 100% integrado, sem mocks

---

## ✅ CONCLUSÃO

Este relatório mapeia todas as demandas técnicas necessárias para finalizar a integração entre Frontend e Backend, removendo todos os mocks e implementando funcionalidades faltantes.

### Principais Descobertas:
- **3 endpoints críticos faltando** (Sinaleiros, Performance Gruas, Aluguéis)
- **3 módulos frontend usando mocks** que precisam ser substituídos
- **1 componente com mock** que pode ser facilmente corrigido
- **Estrutura base sólida** que facilita a implementação

### Próximos Passos:
1. **Priorizar implementação de sinaleiros** (mais simples e mais usado)
2. **Coordenar trabalho entre equipes** Frontend e Backend
3. **Seguir ordem recomendada** de execução
4. **Testar cada fase** antes de avançar para a próxima

### Estimativa Total:
**4-6 semanas** de trabalho coordenado entre as equipes.

---

**Relatório gerado em:** 02/02/2025  
**Próxima revisão:** Após conclusão da Fase 1 (Sinaleiros)

