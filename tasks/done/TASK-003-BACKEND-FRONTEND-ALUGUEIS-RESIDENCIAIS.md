# 📋 TASK-003: Backend e Frontend de Aluguéis Residenciais

**ID da Task:** TASK-003  
**Título:** Implementar Sistema Completo de Aluguéis de Residências (Backend + Frontend)  
**Fase:** 3  
**Módulo:** Financeiro  
**Arquivo(s):** 
- `backend-api/database/migrations/YYYY-MM-DD_create_residencias.sql`
- `backend-api/database/migrations/YYYY-MM-DD_create_alugueis_residencias.sql`
- `backend-api/database/migrations/YYYY-MM-DD_create_pagamentos_aluguel.sql`
- `backend-api/src/routes/alugueis-residencias.js`
- `backend-api/src/server.js`
- `lib/api-alugueis-residencias.ts`
- `app/dashboard/financeiro/alugueis/page.tsx`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🔴 CRÍTICA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Implementar sistema completo de gerenciamento de aluguéis de residências para funcionários, incluindo:
1. **Backend:** Criar 3 migrations (residencias, alugueis_residencias, pagamentos_aluguel), implementar rotas CRUD completas e rotas de pagamentos
2. **Frontend:** Remover todos os mocks de `lib/api-alugueis-residencias.ts` e integrar com a API real

Atualmente, o frontend está completamente mockado e precisa ser substituído por integração real.

---

## 🎯 Objetivos

- [ ] Criar 3 migrations para as tabelas necessárias
- [ ] Implementar rotas CRUD completas de aluguéis
- [ ] Implementar rotas de pagamentos de aluguéis
- [ ] Implementar JOINs com residências e funcionários para evitar múltiplas queries
- [ ] Registrar rotas no `server.js`
- [ ] Remover todos os mocks do frontend
- [ ] Implementar cliente HTTP real no frontend
- [ ] Integrar CRUD completo na UI
- [ ] Implementar relação funcionário ↔ residência
- [ ] Implementar histórico de pagamentos
- [ ] Testar integração completa

---

## 📋 Situação Atual

### Dados Mockados

O arquivo `lib/api-alugueis-residencias.ts` está **completamente mockado**:
- `AlugueisAPI` - Todas as funções usam dados mockados (linhas 235-372)
- `ResidenciasAPI` - Todas as funções usam dados mockados (linhas 375-438)
- Arrays mockados: `residenciasMock` (linhas 62-119), `aluguelResMock` (linhas 121-229)

### Integrações Existentes

- ✅ Interfaces TypeScript já definidas (`AluguelResidencia`, `Residencia`)
- ✅ Página de aluguéis (`app/dashboard/financeiro/alugueis/page.tsx`) já usa as APIs mockadas
- ❌ Backend não possui tabelas de aluguéis
- ❌ Backend não possui rotas de aluguéis
- ❌ Frontend completamente dependente de mocks

---

## 🔧 Ações Necessárias

### Backend

- [ ] Criar migration `YYYY-MM-DD_create_residencias.sql`:
  ```sql
  CREATE TABLE residencias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome varchar(255) NOT NULL,
    endereco varchar(500) NOT NULL,
    cidade varchar(100) NOT NULL,
    estado char(2) NOT NULL,
    cep varchar(10),
    quartos int DEFAULT 0,
    banheiros int DEFAULT 0,
    area decimal(10,2),
    mobiliada boolean DEFAULT false,
    valor_base decimal(10,2) NOT NULL,
    disponivel boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  );
  ```
- [ ] Criar migration `YYYY-MM-DD_create_alugueis_residencias.sql`:
  ```sql
  CREATE TABLE alugueis_residencias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    residencia_id uuid NOT NULL REFERENCES residencias(id),
    funcionario_id uuid NOT NULL REFERENCES funcionarios(id),
    data_inicio date NOT NULL,
    data_fim date,
    valor_mensal decimal(10,2) NOT NULL,
    desconto_folha boolean DEFAULT false,
    porcentagem_desconto decimal(5,2) DEFAULT 0,
    status varchar(50) DEFAULT 'ativo',
    observacoes text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  );
  ```
- [ ] Criar migration `YYYY-MM-DD_create_pagamentos_aluguel.sql`:
  ```sql
  CREATE TABLE pagamentos_aluguel (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluguel_id uuid NOT NULL REFERENCES alugueis_residencias(id),
    mes varchar(7) NOT NULL, -- YYYY-MM
    valor_pago decimal(10,2) NOT NULL,
    data_pagamento date NOT NULL,
    status varchar(50) DEFAULT 'pendente',
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  );
  ```
- [ ] Criar índices:
  ```sql
  CREATE INDEX idx_alugueis_funcionario_id ON alugueis_residencias(funcionario_id);
  CREATE INDEX idx_alugueis_residencia_id ON alugueis_residencias(residencia_id);
  CREATE INDEX idx_alugueis_status ON alugueis_residencias(status);
  CREATE INDEX idx_pagamentos_aluguel_id ON pagamentos_aluguel(aluguel_id);
  CREATE INDEX idx_pagamentos_mes ON pagamentos_aluguel(mes);
  ```
- [ ] Criar arquivo `backend-api/src/routes/alugueis-residencias.js` com rotas:
  - `GET /api/alugueis-residencias` - Listar aluguéis (com JOINs)
  - `GET /api/alugueis-residencias/:id` - Buscar aluguel por ID
  - `POST /api/alugueis-residencias` - Criar novo aluguel
  - `PUT /api/alugueis-residencias/:id` - Atualizar aluguel
  - `DELETE /api/alugueis-residencias/:id` - Excluir aluguel (soft delete)
  - `GET /api/alugueis-residencias/:id/pagamentos` - Listar pagamentos
  - `POST /api/alugueis-residencias/:id/pagamentos` - Registrar pagamento
- [ ] Implementar JOINs com residências e funcionários nas rotas de listagem
- [ ] Implementar validações (Joi/Zod) para todas as rotas POST/PUT
- [ ] Validar disponibilidade de residência ao criar aluguel
- [ ] Atualizar status de disponibilidade da residência ao criar/encerrar aluguel
- [ ] Registrar rotas no `backend-api/src/server.js`:
  ```javascript
  const alugueisResidenciasRoutes = require('./routes/alugueis-residencias')
  app.use('/api/alugueis-residencias', authenticate, alugueisResidenciasRoutes)
  ```

### Frontend

- [ ] Remover todos os mocks de `lib/api-alugueis-residencias.ts`:
  - Remover arrays `residenciasMock` e `aluguelResMock`
  - Remover variáveis `alugueis` e `residencias` que simulam estado
- [ ] Implementar cliente HTTP real usando `fetch` ou cliente HTTP existente
- [ ] Reimplementar `AlugueisAPI` com chamadas reais:
  - `listar()` → `GET /api/alugueis-residencias`
  - `listarAtivos()` → `GET /api/alugueis-residencias?status=ativo`
  - `buscarPorId(id)` → `GET /api/alugueis-residencias/:id`
  - `criar(aluguel)` → `POST /api/alugueis-residencias`
  - `atualizar(id, dados)` → `PUT /api/alugueis-residencias/:id`
  - `encerrar(id, dataFim)` → `PUT /api/alugueis-residencias/:id` (com data_fim)
  - `adicionarPagamento(aluguelId, pagamento)` → `POST /api/alugueis-residencias/:id/pagamentos`
  - `deletar(id)` → `DELETE /api/alugueis-residencias/:id`
- [ ] Reimplementar `ResidenciasAPI` com chamadas reais:
  - `listar()` → `GET /api/residencias` (criar endpoint se necessário)
  - `listarDisponiveis()` → `GET /api/residencias?disponivel=true`
  - `criar(residencia)` → `POST /api/residencias`
  - `atualizar(id, dados)` → `PUT /api/residencias/:id`
  - `deletar(id)` → `DELETE /api/residencias/:id`
- [ ] Ajustar interfaces TypeScript conforme resposta real da API
- [ ] Atualizar `app/dashboard/financeiro/alugueis/page.tsx` para usar APIs reais
- [ ] Implementar seleção de funcionário e residência na UI
- [ ] Implementar validação de disponibilidade na UI
- [ ] Implementar histórico de pagamentos na UI
- [ ] Adicionar tratamento de erros
- [ ] Adicionar loading states

### Banco de Dados

- [ ] Executar migration `create_residencias.sql`
- [ ] Executar migration `create_alugueis_residencias.sql`
- [ ] Executar migration `create_pagamentos_aluguel.sql`
- [ ] Verificar foreign keys e constraints
- [ ] Criar índices necessários

---

## 🔌 Endpoints Necessários

### GET
```
GET /api/alugueis-residencias?funcionario_id={id}&residencia_id={id}&status={status}
GET /api/alugueis-residencias/:id
GET /api/alugueis-residencias/:id/pagamentos
GET /api/residencias?disponivel={true|false}
GET /api/residencias/:id
```

### POST
```
POST /api/alugueis-residencias
POST /api/alugueis-residencias/:id/pagamentos
POST /api/residencias
```

### PUT/PATCH
```
PUT /api/alugueis-residencias/:id
PUT /api/residencias/:id
```

### DELETE
```
DELETE /api/alugueis-residencias/:id
DELETE /api/residencias/:id
```

---

## 🗂️ Estrutura de Dados

### Request - Criar Aluguel
```typescript
interface CreateAluguelRequest {
  residencia_id: string;
  funcionario_id: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim?: string; // YYYY-MM-DD
  valor_mensal: number;
  desconto_folha?: boolean;
  porcentagem_desconto?: number;
  observacoes?: string;
}
```

### Response - Aluguel Completo (com JOINs)
```typescript
interface AluguelCompletoResponse {
  id: string;
  residencia: {
    id: string;
    nome: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
    quartos: number;
    banheiros: number;
    area: number;
    mobiliada: boolean;
  };
  funcionario: {
    id: string;
    nome: string;
    cargo: string;
    cpf: string;
  };
  data_inicio: string;
  data_fim?: string;
  valor_mensal: number;
  desconto_folha: boolean;
  porcentagem_desconto: number;
  status: 'ativo' | 'encerrado' | 'pendente' | 'cancelado';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}
```

### Request - Criar Residência
```typescript
interface CreateResidenciaRequest {
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep?: string;
  quartos?: number;
  banheiros?: number;
  area?: number;
  mobiliada?: boolean;
  valor_base: number;
}
```

### Response - Residência
```typescript
interface ResidenciaResponse {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep?: string;
  quartos: number;
  banheiros: number;
  area?: number;
  mobiliada: boolean;
  valor_base: number;
  disponivel: boolean;
  created_at: string;
  updated_at: string;
}
```

### Request - Registrar Pagamento
```typescript
interface CreatePagamentoRequest {
  mes: string; // YYYY-MM
  valor_pago: number;
  data_pagamento: string; // YYYY-MM-DD
  status?: 'pago' | 'pendente' | 'atrasado';
}
```

### Response - Pagamento
```typescript
interface PagamentoAluguelResponse {
  id: string;
  aluguel_id: string;
  mes: string;
  valor_pago: number;
  data_pagamento: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

---

## ✅ Critérios de Aceitação

- [ ] 3 migrations criadas e executadas com sucesso
- [ ] Todas as rotas CRUD de aluguéis implementadas
- [ ] Rotas de pagamentos implementadas
- [ ] JOINs com residências e funcionários funcionando
- [ ] Validação de disponibilidade de residência implementada
- [ ] Rotas registradas no `server.js`
- [ ] Todos os mocks removidos do frontend
- [ ] Cliente HTTP real implementado
- [ ] CRUD completo funcionando na UI
- [ ] Seleção de funcionário e residência funcionando
- [ ] Histórico de pagamentos exibindo corretamente
- [ ] Tratamento de erros implementado
- [ ] Loading states funcionando
- [ ] Testes de integração passando

---

## 🧪 Casos de Teste

### Teste 1: Criar Aluguel
**Dado:** Uma residência disponível e um funcionário  
**Quando:** Criar novo aluguel  
**Então:** O aluguel deve ser criado, residência marcada como indisponível

### Teste 2: Listar Aluguéis com JOINs
**Dado:** Aluguéis cadastrados no sistema  
**Quando:** Listar aluguéis  
**Então:** Deve retornar aluguéis com dados completos de residência e funcionário (sem múltiplas queries)

### Teste 3: Validar Disponibilidade
**Dado:** Uma residência já alugada  
**Quando:** Tentar criar novo aluguel para a mesma residência  
**Então:** Deve retornar erro de validação

### Teste 4: Encerrar Aluguel
**Dado:** Um aluguel ativo  
**Quando:** Encerrar o aluguel (definir data_fim)  
**Então:** Status deve mudar para 'encerrado' e residência deve ficar disponível

### Teste 5: Registrar Pagamento
**Dado:** Um aluguel existente  
**Quando:** Registrar pagamento  
**Então:** O pagamento deve ser criado e vinculado ao aluguel

### Teste 6: Listar Pagamentos
**Dado:** Um aluguel com pagamentos  
**Quando:** Listar pagamentos do aluguel  
**Então:** Deve retornar todos os pagamentos daquele aluguel

### Teste 7: Criar Residência
**Dado:** Dados válidos de residência  
**Quando:** Criar nova residência  
**Então:** A residência deve ser criada com `disponivel = true`

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada em paralelo com outras tasks)

### Bloqueia:
- [ ] TASK-006 - Testes e Validação Final (depende desta task)

### Relacionada com:
- [ ] TASK-005 - Ajustes Gerais Backend (registrar rotas no server.js, criar índices)

---

## 📚 Referências

- `RELATORIO-DIVISAO-DEMANDAS-FRONTEND-BACKEND.md` - Seção "🔴 3. Backend de Aluguéis Residenciais"
- `RELATORIO-INTEGRACAO-FRONTEND-BACKEND-2025-02-02.md` - Seção "6️⃣ MÓDULO: FINANCEIRO"
- `lib/api-alugueis-residencias.ts` - Arquivo com mocks a serem removidos

---

## 💡 Notas Técnicas

1. **JOINs:** Ao listar aluguéis, sempre fazer JOIN com residências e funcionários para evitar N+1 queries:
   ```sql
   SELECT a.*, r.*, f.*
   FROM alugueis_residencias a
   JOIN residencias r ON a.residencia_id = r.id
   JOIN funcionarios f ON a.funcionario_id = f.id
   ```

2. **Disponibilidade:** Ao criar aluguel, verificar se residência está disponível e atualizar status. Ao encerrar, liberar residência.

3. **Soft Delete:** Considerar soft delete para aluguéis para manter histórico.

4. **Pagamentos:** O campo `mes` deve seguir formato YYYY-MM para facilitar consultas e ordenação.

5. **Validações:** Validar que:
   - `data_inicio` < `data_fim` (se data_fim fornecida)
   - `valor_mensal` > 0
   - `porcentagem_desconto` entre 0 e 100
   - Residência existe e está disponível
   - Funcionário existe

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Conflito ao criar aluguel para residência já alugada (race condition)
  - **Mitigação:** Usar transações e locks no banco de dados

- **Risco 2:** Inconsistência entre status de disponibilidade da residência e aluguéis ativos
  - **Mitigação:** Implementar validação e possível job de sincronização

- **Risco 3:** Performance com muitos aluguéis e pagamentos
  - **Mitigação:** Criar índices adequados, implementar paginação

- **Risco 4:** Cálculo de valores com desconto pode ser complexo
  - **Mitigação:** Documentar regras de negócio claramente

---

## 📊 Estimativas

**Tempo Estimado:** 2-3 dias (backend) + 2-3 dias (frontend)  
**Complexidade:** Alta  
**Esforço:** Grande

**Breakdown:**
- 3 migrations: 2-3 horas
- Rotas CRUD backend: 6-8 horas
- Rotas de pagamentos: 3-4 horas
- JOINs e otimizações: 2-3 horas
- Remover mocks e implementar cliente HTTP: 4-6 horas
- Integração UI completa: 6-8 horas
- Testes: 4-6 horas

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada |

---

## ✅ Checklist Final

- [ ] Código implementado
- [ ] Testes passando
- [ ] Code review realizado
- [ ] Documentação atualizada
- [ ] Deploy em dev
- [ ] Testes em dev
- [ ] Deploy em homologação
- [ ] Testes em homologação
- [ ] Aprovação do PO
- [ ] Deploy em produção
- [ ] Verificação em produção
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

