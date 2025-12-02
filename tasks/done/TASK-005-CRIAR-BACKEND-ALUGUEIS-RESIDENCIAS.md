# 📋 TASK-005: Criar Backend Completo de Aluguéis de Residências

**ID da Task:** TASK-005  
**Título:** Implementar Backend Completo para Aluguéis de Residências  
**Fase:** 1  
**Módulo:** RH - Aluguéis  
**Arquivo(s):** 
- `backend-api/database/migrations/YYYY-MM-DD_create_residencias.sql`
- `backend-api/database/migrations/YYYY-MM-DD_create_alugueis_residencias.sql`
- `backend-api/database/migrations/YYYY-MM-DD_create_pagamentos_aluguel.sql`
- `backend-api/src/routes/alugueis-residencias.js`
- `backend-api/src/server.js`
- `lib/api-alugueis-residencias.ts` (substituir mock)

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🔴 ALTA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Criar backend completo para o módulo de aluguéis de residências, incluindo:
1. **Tabelas no banco:** `residencias`, `alugueis_residencias`, `pagamentos_aluguel`
2. **Endpoints CRUD completos** para todas as entidades
3. **Integração com módulo de RH** (funcionários)
4. **Substituir mock** em `lib/api-alugueis-residencias.ts` por chamadas reais

Atualmente, todo o módulo funciona com dados mockados, impedindo que dados reais sejam gerenciados.

---

## 🎯 Objetivos

- [ ] Criar migrations para as 3 tabelas principais
- [ ] Implementar rotas CRUD para residências
- [ ] Implementar rotas CRUD para aluguéis
- [ ] Implementar rotas CRUD para pagamentos
- [ ] Implementar validações com Joi
- [ ] Adicionar relacionamentos com funcionários
- [ ] Implementar filtros e busca
- [ ] Integrar frontend com endpoints reais
- [ ] Remover mock após confirmação
- [ ] Adicionar testes

---

## 📋 Situação Atual

### Dados Mockados

O arquivo `lib/api-alugueis-residencias.ts` (linhas 1-469) contém:
- Interfaces TypeScript: `Residencia`, `AluguelResidencia`, `StatusAluguel`
- Arrays mockados: `residenciasMock`, `aluguelResMock`
- Objeto `AlugueisAPI` com métodos mockados:
  - `listar()`, `listarAtivos()`, `buscarPorId()`
  - `criar()`, `atualizar()`, `encerrar()`
  - `listarResidencias()`, `buscarResidencia()`, `criarResidencia()`, etc.
  - `listarPagamentos()`, `registrarPagamento()`, etc.

### Integrações Existentes

- ❌ Tabelas não existem no banco de dados
- ❌ Endpoints backend não existem
- ✅ Estrutura de dados bem definida nas interfaces TypeScript
- ✅ Frontend já está preparado para usar API (estrutura pronta)
- ✅ Módulo de funcionários existe (para relacionamento)

---

## 🔧 Ações Necessárias

### Banco de Dados

- [ ] Criar migration `YYYY-MM-DD_create_residencias.sql`:
  ```sql
  CREATE TABLE residencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    endereco VARCHAR(500) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    quartos INTEGER NOT NULL,
    banheiros INTEGER NOT NULL,
    area DECIMAL(10,2) NOT NULL, -- m²
    mobiliada BOOLEAN DEFAULT false,
    valor_base DECIMAL(10,2) NOT NULL,
    disponivel BOOLEAN DEFAULT true,
    fotos TEXT[], -- array de URLs
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id)
  );

  CREATE INDEX idx_residencias_cidade ON residencias(cidade);
  CREATE INDEX idx_residencias_disponivel ON residencias(disponivel);
  ```

- [ ] Criar migration `YYYY-MM-DD_create_alugueis_residencias.sql`:
  ```sql
  CREATE TABLE alugueis_residencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    residencia_id UUID NOT NULL REFERENCES residencias(id),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    valor_mensal DECIMAL(10,2) NOT NULL,
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    desconto_folha BOOLEAN DEFAULT false,
    porcentagem_desconto DECIMAL(5,2) CHECK (porcentagem_desconto BETWEEN 0 AND 100),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'pendente', 'cancelado')),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id)
  );

  CREATE INDEX idx_alugueis_residencia ON alugueis_residencias(residencia_id);
  CREATE INDEX idx_alugueis_funcionario ON alugueis_residencias(funcionario_id);
  CREATE INDEX idx_alugueis_status ON alugueis_residencias(status);
  ```

- [ ] Criar migration `YYYY-MM-DD_create_pagamentos_aluguel.sql`:
  ```sql
  CREATE TABLE pagamentos_aluguel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluguel_id UUID NOT NULL REFERENCES alugueis_residencias(id),
    mes VARCHAR(7) NOT NULL, -- formato YYYY-MM
    valor_pago DECIMAL(10,2) NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'atrasado')),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id)
  );

  CREATE INDEX idx_pagamentos_aluguel ON pagamentos_aluguel(aluguel_id);
  CREATE INDEX idx_pagamentos_mes ON pagamentos_aluguel(mes);
  CREATE INDEX idx_pagamentos_status ON pagamentos_aluguel(status);
  ```

### Backend

- [ ] Criar `backend-api/src/routes/alugueis-residencias.js` com rotas:

  **Residências:**
  - `GET /api/alugueis-residencias/residencias` - Listar residências
  - `GET /api/alugueis-residencias/residencias/:id` - Buscar residência
  - `POST /api/alugueis-residencias/residencias` - Criar residência
  - `PUT /api/alugueis-residencias/residencias/:id` - Atualizar residência
  - `DELETE /api/alugueis-residencias/residencias/:id` - Excluir residência

  **Aluguéis:**
  - `GET /api/alugueis-residencias` - Listar aluguéis
  - `GET /api/alugueis-residencias/ativos` - Listar apenas ativos
  - `GET /api/alugueis-residencias/:id` - Buscar aluguel
  - `POST /api/alugueis-residencias` - Criar aluguel
  - `PUT /api/alugueis-residencias/:id` - Atualizar aluguel
  - `PUT /api/alugueis-residencias/:id/encerrar` - Encerrar aluguel
  - `GET /api/alugueis-residencias/funcionario/:funcionarioId` - Aluguéis por funcionário

  **Pagamentos:**
  - `GET /api/alugueis-residencias/:aluguelId/pagamentos` - Listar pagamentos
  - `POST /api/alugueis-residencias/:aluguelId/pagamentos` - Registrar pagamento
  - `PUT /api/alugueis-residencias/pagamentos/:id` - Atualizar pagamento

- [ ] Implementar validações com Joi:
  - Schema para criar/atualizar residência
  - Schema para criar/atualizar aluguel
  - Schema para criar/atualizar pagamento

- [ ] Adicionar filtros e busca:
  - Filtrar residências por cidade, disponibilidade
  - Filtrar aluguéis por status, funcionário
  - Buscar por nome, endereço, etc.

- [ ] Registrar rotas no `backend-api/src/server.js`:
  ```javascript
  const alugueisResidenciasRoutes = require('./routes/alugueis-residencias')
  app.use('/api/alugueis-residencias', authenticate, alugueisResidenciasRoutes)
  ```

- [ ] Adicionar tratamento de erros
- [ ] Adicionar logs

### Frontend

- [ ] Atualizar `lib/api-alugueis-residencias.ts`:
  - Remover arrays mockados
  - Substituir métodos mockados por chamadas reais à API
  - Manter interfaces TypeScript existentes
  - Adicionar tratamento de erros
  - Ajustar tipos se necessário

- [ ] Testar integração completa:
  - Listar residências
  - Criar/editar residência
  - Listar aluguéis
  - Criar/editar aluguel
  - Registrar pagamentos
  - Encerrar aluguel

---

## 🔌 Endpoints Necessários

### Residências

#### GET
```
GET /api/alugueis-residencias/residencias?cidade=xxx&disponivel=true&page=1&limit=50
GET /api/alugueis-residencias/residencias/:id
```

#### POST
```
POST /api/alugueis-residencias/residencias
```

#### PUT
```
PUT /api/alugueis-residencias/residencias/:id
```

#### DELETE
```
DELETE /api/alugueis-residencias/residencias/:id
```

### Aluguéis

#### GET
```
GET /api/alugueis-residencias?status=ativo&funcionario_id=xxx&page=1&limit=50
GET /api/alugueis-residencias/ativos
GET /api/alugueis-residencias/:id
GET /api/alugueis-residencias/funcionario/:funcionarioId
```

#### POST
```
POST /api/alugueis-residencias
```

#### PUT
```
PUT /api/alugueis-residencias/:id
PUT /api/alugueis-residencias/:id/encerrar
```

### Pagamentos

#### GET
```
GET /api/alugueis-residencias/:aluguelId/pagamentos
```

#### POST
```
POST /api/alugueis-residencias/:aluguelId/pagamentos
```

#### PUT
```
PUT /api/alugueis-residencias/pagamentos/:id
```

---

## 🗂️ Estrutura de Dados

### Request - Criar Residência
```typescript
interface CreateResidenciaRequest {
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  quartos: number;
  banheiros: number;
  area: number;
  mobiliada: boolean;
  valor_base: number;
  disponivel: boolean;
  fotos?: string[];
  observacoes?: string;
}
```

### Request - Criar Aluguel
```typescript
interface CreateAluguelRequest {
  residencia_id: string;
  funcionario_id: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim?: string; // YYYY-MM-DD
  valor_mensal: number;
  dia_vencimento: number; // 1-31
  desconto_folha: boolean;
  porcentagem_desconto?: number; // 0-100
  observacoes?: string;
}
```

### Request - Registrar Pagamento
```typescript
interface CreatePagamentoRequest {
  mes: string; // YYYY-MM
  valor_pago: number;
  data_pagamento?: string; // YYYY-MM-DD
  observacoes?: string;
}
```

### Response - Aluguel Residência
```typescript
interface AluguelResidenciaResponse {
  id: string;
  residencia: ResidenciaResponse;
  funcionario: {
    id: string;
    nome: string;
    cargo: string;
    cpf: string;
  };
  contrato: {
    data_inicio: string;
    data_fim?: string;
    valor_mensal: number;
    dia_vencimento: number;
    desconto_folha: boolean;
    porcentagem_desconto?: number;
  };
  pagamentos: PagamentoResponse[];
  status: 'ativo' | 'encerrado' | 'pendente' | 'cancelado';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}
```

---

## ✅ Critérios de Aceitação

- [ ] Migrations criadas e executadas com sucesso
- [ ] Todas as rotas CRUD implementadas
- [ ] Validações com Joi implementadas
- [ ] Relacionamentos com funcionários funcionando
- [ ] Filtros e busca funcionando
- [ ] Paginação implementada
- [ ] Frontend integrado e funcionando
- [ ] Mock removido após confirmação
- [ ] Tratamento de erros implementado
- [ ] Testes de integração passando
- [ ] Documentação atualizada

---

## 🧪 Casos de Teste

### Teste 1: Criar Residência
**Dado:** Dados válidos de residência  
**Quando:** Criar nova residência via API  
**Então:** Deve ser criada no banco e retornada com ID

### Teste 2: Listar Residências Disponíveis
**Dado:** Residências no banco com diferentes status  
**Quando:** Listar residências disponíveis  
**Então:** Deve retornar apenas residências com `disponivel = true`

### Teste 3: Criar Aluguel
**Dado:** Residência e funcionário existentes  
**Quando:** Criar novo aluguel  
**Então:** Deve ser criado e vinculado corretamente

### Teste 4: Encerrar Aluguel
**Dado:** Aluguel ativo  
**Quando:** Encerrar aluguel  
**Então:** Status deve mudar para 'encerrado' e `data_fim` deve ser preenchida

### Teste 5: Registrar Pagamento
**Dado:** Aluguel ativo  
**Quando:** Registrar pagamento de um mês  
**Então:** Pagamento deve ser criado e status atualizado

### Teste 6: Listar Aluguéis por Funcionário
**Dado:** Funcionário com múltiplos aluguéis  
**Quando:** Buscar aluguéis do funcionário  
**Então:** Deve retornar todos os aluguéis do funcionário

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada independentemente)

### Bloqueia:
- Nenhuma (pode ser executada em paralelo)

### Relacionada com:
- Módulo de funcionários (para relacionamento)
- TASK-006 - Remover fallbacks (pode haver fallbacks relacionados)

---

## 📚 Referências

- `RELATORIO-AUDITORIA-COMPLETA-2025-02-02.md` - Seção "1.1 Mocks Críticos - Aluguéis de Residências"
- `lib/api-alugueis-residencias.ts` - Estrutura de dados esperada
- `backend-api/src/routes/` - Exemplos de outras rotas

---

## 💡 Notas Técnicas

1. **Relacionamento com Funcionários:** Verificar se tabela `funcionarios` existe e qual é a estrutura. Pode ser necessário ajustar foreign key.

2. **Desconto na Folha:** Se `desconto_folha = true`, pode ser necessário integrar com módulo de folha de pagamento para desconto automático.

3. **Pagamentos Atrasados:** Considerar criar job/trigger para marcar pagamentos como atrasados automaticamente.

4. **Fotos:** Armazenar URLs no array `fotos`. Considerar integração com Supabase Storage para upload.

5. **Validações:**
   - `dia_vencimento` deve estar entre 1 e 31
   - `porcentagem_desconto` deve estar entre 0 e 100
   - `data_fim` deve ser maior que `data_inicio`
   - `valor_pago` não pode ser maior que `valor_mensal`

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Estrutura de funcionários pode ser diferente
  - **Mitigação:** Verificar estrutura antes de criar foreign key

- **Risco 2:** Integração com folha de pagamento pode ser necessária
  - **Mitigação:** Implementar backend primeiro, integração depois se necessário

- **Risco 3:** Muitos dados podem impactar performance
  - **Mitigação:** Adicionar índices, implementar paginação

---

## 📊 Estimativas

**Tempo Estimado:** 4-6 dias  
**Complexidade:** Alta  
**Esforço:** Grande

**Breakdown:**
- Análise e design: 4 horas
- Migrations: 4 horas
- Rotas de residências: 6 horas
- Rotas de aluguéis: 8 horas
- Rotas de pagamentos: 4 horas
- Validações: 3 horas
- Integração frontend: 4 horas
- Testes e correções: 6-8 horas

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

