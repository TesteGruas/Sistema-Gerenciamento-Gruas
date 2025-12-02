# 📋 TASK-005: Ajustes Gerais Backend

**ID da Task:** TASK-005  
**Título:** Ajustes Gerais e Padronizações no Backend  
**Fase:** 4  
**Módulo:** Backend Geral  
**Arquivo(s):** 
- `backend-api/src/server.js`
- Todas as rotas criadas nas tasks anteriores
- `backend-api/database/migrations/` (índices)

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟡 IMPORTANTE  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Realizar ajustes gerais no backend para garantir:
1. Todas as novas rotas registradas no `server.js`
2. Índices criados para melhorar performance de consultas
3. Validações padronizadas em todas as rotas
4. Foreign keys corretas e validadas
5. Documentação das rotas

Esta task deve ser executada após as tasks de implementação (TASK-001, TASK-002, TASK-003) para garantir consistência e qualidade.

---

## 🎯 Objetivos

- [ ] Registrar todas as novas rotas no `server.js`
- [ ] Criar índices para consultas de relatórios e filtros
- [ ] Padronizar validações (Joi/Zod) em todas as rotas POST/PUT
- [ ] Garantir foreign keys corretas em todas as migrations
- [ ] Verificar e corrigir constraints no banco de dados
- [ ] Documentar todas as rotas criadas
- [ ] Implementar logs estruturados se necessário

---

## 📋 Situação Atual

### Rotas a Registrar

Baseado nas tasks anteriores, as seguintes rotas precisam ser registradas:
- `/api/sinaleiros` (TASK-001)
- `/api/relatorios/performance-gruas` (TASK-002)
- `/api/alugueis-residencias` (TASK-003)
- `/api/residencias` (TASK-003 - se criada separadamente)

### Índices Necessários

- `idx_sinaleiros_obra_id` (TASK-001)
- `idx_documentos_sinaleiro_id` (TASK-001)
- `idx_medicoes_data` (TASK-002)
- `idx_locacoes_data` (TASK-002)
- `idx_custos_mes` (TASK-002)
- `idx_alugueis_funcionario_id` (TASK-003)
- `idx_alugueis_residencia_id` (TASK-003)
- `idx_pagamentos_aluguel_id` (TASK-003)
- `idx_pagamentos_mes` (TASK-003)

### Validações

Verificar se todas as rotas POST/PUT possuem validações padronizadas.

---

## 🔧 Ações Necessárias

### Backend

- [ ] Registrar rotas no `backend-api/src/server.js`:
  ```javascript
  // Após outras rotas existentes
  const sinaleirosRoutes = require('./routes/sinaleiros')
  const relatoriosPerformanceRoutes = require('./routes/relatorios-performance-gruas')
  const alugueisResidenciasRoutes = require('./routes/alugueis-residencias')
  
  app.use('/api/sinaleiros', authenticate, sinaleirosRoutes)
  app.use('/api/relatorios/performance-gruas', authenticate, relatoriosPerformanceRoutes)
  app.use('/api/alugueis-residencias', authenticate, alugueisResidenciasRoutes)
  ```
- [ ] Criar migration ou script SQL para índices:
  ```sql
  -- Sinaleiros (TASK-001)
  CREATE INDEX IF NOT EXISTS idx_sinaleiros_obra_id ON sinaleiros(obra_id);
  CREATE INDEX IF NOT EXISTS idx_documentos_sinaleiro_id ON documentos_sinaleiro(sinaleiro_id);
  
  -- Performance Gruas (TASK-002)
  CREATE INDEX IF NOT EXISTS idx_medicoes_data ON medicoes_mensais(data_medicao);
  CREATE INDEX IF NOT EXISTS idx_locacoes_data ON locacoes(data_inicio, data_fim);
  CREATE INDEX IF NOT EXISTS idx_custos_mes ON custos_mensais(mes);
  
  -- Aluguéis (TASK-003)
  CREATE INDEX IF NOT EXISTS idx_alugueis_funcionario_id ON alugueis_residencias(funcionario_id);
  CREATE INDEX IF NOT EXISTS idx_alugueis_residencia_id ON alugueis_residencias(residencia_id);
  CREATE INDEX IF NOT EXISTS idx_alugueis_status ON alugueis_residencias(status);
  CREATE INDEX IF NOT EXISTS idx_pagamentos_aluguel_id ON pagamentos_aluguel(aluguel_id);
  CREATE INDEX IF NOT EXISTS idx_pagamentos_mes ON pagamentos_aluguel(mes);
  ```
- [ ] Verificar validações em todas as rotas criadas:
  - `backend-api/src/routes/sinaleiros.js` - Validar POST/PUT
  - `backend-api/src/routes/relatorios-performance-gruas.js` - Validar query params
  - `backend-api/src/routes/alugueis-residencias.js` - Validar POST/PUT
- [ ] Padronizar formato de validação (usar Joi ou Zod consistentemente)
- [ ] Garantir que todas as validações retornam erros padronizados:
  ```json
  {
    "error": "Validation error",
    "message": "Campo obrigatório faltando",
    "details": {
      "campo": "nome",
      "erro": "é obrigatório"
    }
  }
  ```
- [ ] Verificar foreign keys em todas as migrations:
  - `sinaleiros.obra_id` → `obras(id)`
  - `documentos_sinaleiro.sinaleiro_id` → `sinaleiros(id)`
  - `alugueis_residencias.residencia_id` → `residencias(id)`
  - `alugueis_residencias.funcionario_id` → `funcionarios(id)`
  - `pagamentos_aluguel.aluguel_id` → `alugueis_residencias(id)`
- [ ] Validar que foreign keys têm `ON DELETE` e `ON UPDATE` apropriados
- [ ] Criar documentação das rotas (README ou Swagger):
  - Endpoints disponíveis
  - Parâmetros de entrada
  - Formato de resposta
  - Códigos de erro possíveis
  - Exemplos de request/response

### Banco de Dados

- [ ] Executar migration de índices
- [ ] Verificar constraints existentes:
  ```sql
  SELECT conname, contype, pg_get_constraintdef(oid) 
  FROM pg_constraint 
  WHERE conrelid IN (
    'sinaleiros'::regclass,
    'documentos_sinaleiro'::regclass,
    'residencias'::regclass,
    'alugueis_residencias'::regclass,
    'pagamentos_aluguel'::regclass
  );
  ```
- [ ] Verificar índices criados:
  ```sql
  SELECT indexname, indexdef 
  FROM pg_indexes 
  WHERE tablename IN ('sinaleiros', 'documentos_sinaleiro', 'residencias', 'alugueis_residencias', 'pagamentos_aluguel');
  ```

---

## 🔌 Endpoints a Registrar

```
POST /api/sinaleiros
GET /api/sinaleiros
GET /api/sinaleiros/:id
PUT /api/sinaleiros/:id
DELETE /api/sinaleiros/:id

GET /api/relatorios/performance-gruas

GET /api/alugueis-residencias
POST /api/alugueis-residencias
GET /api/alugueis-residencias/:id
PUT /api/alugueis-residencias/:id
DELETE /api/alugueis-residencias/:id
GET /api/alugueis-residencias/:id/pagamentos
POST /api/alugueis-residencias/:id/pagamentos
```

---

## ✅ Critérios de Aceitação

- [ ] Todas as novas rotas registradas no `server.js`
- [ ] Todos os índices criados e funcionando
- [ ] Validações padronizadas em todas as rotas POST/PUT
- [ ] Foreign keys corretas e validadas
- [ ] Constraints verificadas no banco de dados
- [ ] Documentação das rotas criada
- [ ] Erros padronizados em todas as rotas
- [ ] Logs estruturados implementados (se necessário)

---

## 🧪 Casos de Teste

### Teste 1: Rotas Registradas
**Dado:** Servidor iniciado  
**Quando:** Verificar rotas disponíveis  
**Então:** Todas as rotas devem estar acessíveis e autenticadas

### Teste 2: Índices Criados
**Dado:** Banco de dados  
**Quando:** Verificar índices  
**Então:** Todos os índices devem existir e melhorar performance

### Teste 3: Validações Padronizadas
**Dado:** Uma rota POST com dados inválidos  
**Quando:** Fazer requisição  
**Então:** Deve retornar erro padronizado com formato consistente

### Teste 4: Foreign Keys
**Dado:** Tentativa de criar registro com foreign key inválida  
**Quando:** Fazer requisição  
**Então:** Deve retornar erro de foreign key constraint

---

## 🔗 Dependências

### Bloqueada por:
- [ ] TASK-001 - Backend Sinaleiros (precisa das rotas criadas)
- [ ] TASK-002 - Performance Gruas (precisa das rotas criadas)
- [ ] TASK-003 - Aluguéis Residenciais (precisa das rotas criadas)

### Bloqueia:
- [ ] TASK-006 - Testes e Validação Final (depende desta task)

### Relacionada com:
- Todas as tasks de implementação (001, 002, 003)

---

## 📚 Referências

- `RELATORIO-DIVISAO-DEMANDAS-FRONTEND-BACKEND.md` - Seção "🟠 4. Ajustes Gerais Backend"
- `backend-api/src/server.js` - Arquivo principal do servidor

---

## 💡 Notas Técnicas

1. **Ordem de Execução:** Esta task deve ser executada após TASK-001, TASK-002 e TASK-003, pois depende das rotas criadas nessas tasks.

2. **Validações:** Verificar qual biblioteca de validação já está sendo usada no projeto (Joi, Zod, express-validator, etc.) e usar a mesma.

3. **Índices:** Criar índices apenas onde realmente melhoram performance. Não criar índices desnecessários que podem atrasar INSERTs.

4. **Foreign Keys:** Usar `ON DELETE CASCADE` ou `ON DELETE RESTRICT` conforme regra de negócio. Para histórico, considerar soft delete ao invés de CASCADE.

5. **Documentação:** Pode usar Swagger/OpenAPI se já estiver configurado no projeto, ou criar README simples.

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Índices podem afetar performance de INSERTs
  - **Mitigação:** Criar índices apenas onde necessário, monitorar performance

- **Risco 2:** Validações inconsistentes entre rotas
  - **Mitigação:** Criar schemas reutilizáveis e padronizar formato de erro

- **Risco 3:** Foreign keys podem causar problemas em migrations
  - **Mitigação:** Executar migrations na ordem correta, testar em ambiente de dev primeiro

---

## 📊 Estimativas

**Tempo Estimado:** 1-2 dias  
**Complexidade:** Média  
**Esforço:** Médio

**Breakdown:**
- Registrar rotas: 1 hora
- Criar índices: 2-3 horas
- Padronizar validações: 4-6 horas
- Verificar foreign keys: 2-3 horas
- Documentação: 2-3 horas
- Testes: 2-3 horas

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

