# 📋 TASK-001: Backend e Frontend de Sinaleiros

**ID da Task:** TASK-001  
**Título:** Implementar Backend Completo de Sinaleiros e Integrar no Frontend  
**Fase:** 1  
**Módulo:** Obras  
**Arquivo(s):** 
- `backend-api/database/migrations/YYYY-MM-DD_create_sinaleiros.sql`
- `backend-api/src/routes/sinaleiros.js`
- `backend-api/src/server.js`
- `lib/api-sinaleiros.ts`
- `app/dashboard/obras/[id]/page.tsx`
- `app/dashboard/obras/nova/page.tsx`

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🔴 CRÍTICA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Implementar o sistema completo de sinaleiros, incluindo:
1. **Backend:** Criar migration da tabela `sinaleiros`, implementar rotas CRUD completas e registrar no servidor
2. **Frontend:** Remover qualquer mock existente e garantir que as páginas de obras usem a API real de sinaleiros

Atualmente, o frontend já está preparado para usar a API real (`lib/api-sinaleiros.ts`), mas o backend não possui as rotas necessárias.

---

## 🎯 Objetivos

- [ ] Criar migration da tabela `sinaleiros` no banco de dados
- [ ] Implementar rotas CRUD completas no backend (`/api/sinaleiros`)
- [ ] Registrar rotas no `server.js`
- [ ] Implementar validações (Joi/Zod) para todas as rotas
- [ ] Verificar e ajustar integração no frontend (`lib/api-sinaleiros.ts`)
- [ ] Testar integração completa entre frontend e backend
- [ ] Garantir que páginas de obras (`[id]/page.tsx` e `nova/page.tsx`) funcionem corretamente

---

## 📋 Situação Atual

### Dados Mockados

O arquivo `lib/api-sinaleiros.ts` **não possui mocks**, mas está tentando chamar endpoints que não existem no backend:
- `GET /api/obras/:obraId/sinaleiros` - Não existe
- `POST /api/obras/:obraId/sinaleiros` - Não existe
- `GET /api/obras/sinaleiros/:sinaleiroId/documentos` - Não existe
- `POST /api/obras/sinaleiros/:sinaleiroId/documentos` - Não existe
- `PUT /api/obras/documentos-sinaleiro/:documentoId/aprovar` - Não existe

### Integrações Existentes

- ✅ Frontend API client já está estruturado em `lib/api-sinaleiros.ts`
- ✅ Interfaces TypeScript já definidas (`SinaleiroBackend`, `DocumentoSinaleiroBackend`, etc.)
- ✅ Páginas de obras já usam `sinaleirosApi` do arquivo acima
- ❌ Backend não possui rotas de sinaleiros
- ❌ Tabela `sinaleiros` não existe no banco de dados

---

## 🔧 Ações Necessárias

### Backend

- [ ] Criar migration `YYYY-MM-DD_create_sinaleiros.sql` com a estrutura da tabela:
  - `id` (uuid, PRIMARY KEY)
  - `obra_id` (uuid, FOREIGN KEY → obras(id), NOT NULL)
  - `nome` (varchar(255), NOT NULL)
  - `telefone` (varchar(20))
  - `documentos` (jsonb)
  - `certificados` (jsonb)
  - `status` (varchar(50), DEFAULT 'ativo')
  - `created_at` (timestamp, DEFAULT now())
  - `updated_at` (timestamp, DEFAULT now())
- [ ] Criar migration para tabela `documentos_sinaleiro` (se necessário):
  - `id` (uuid, PRIMARY KEY)
  - `sinaleiro_id` (uuid, FOREIGN KEY → sinaleiros(id))
  - `tipo` (varchar(100))
  - `arquivo` (varchar(500))
  - `data_validade` (date)
  - `status` (varchar(50), DEFAULT 'pendente')
  - `aprovado_por` (uuid, FOREIGN KEY → usuarios(id))
  - `aprovado_em` (timestamp)
  - `alerta_enviado` (boolean, DEFAULT false)
  - `created_at` (timestamp, DEFAULT now())
- [ ] Criar arquivo `backend-api/src/routes/sinaleiros.js` com rotas:
  - `GET /api/sinaleiros?obra_id={id}` - Listar sinaleiros (com filtro opcional)
  - `GET /api/sinaleiros/:id` - Buscar sinaleiro por ID
  - `POST /api/sinaleiros` - Criar novo sinaleiro
  - `PUT /api/sinaleiros/:id` - Atualizar sinaleiro
  - `DELETE /api/sinaleiros/:id` - Excluir sinaleiro (soft delete recomendado)
  - `GET /api/sinaleiros/:id/documentos` - Listar documentos de um sinaleiro
  - `POST /api/sinaleiros/:id/documentos` - Criar documento de um sinaleiro
  - `PUT /api/documentos-sinaleiro/:id/aprovar` - Aprovar/rejeitar documento
- [ ] Registrar rotas no `backend-api/src/server.js`:
  ```javascript
  const sinaleirosRoutes = require('./routes/sinaleiros')
  app.use('/api/sinaleiros', authenticate, sinaleirosRoutes)
  app.use('/api/obras', authenticate, obrasRoutes) // Ajustar se necessário
  ```
- [ ] Implementar validações com Joi ou Zod para todas as rotas POST/PUT
- [ ] Criar índices para melhorar performance:
  ```sql
  CREATE INDEX idx_sinaleiros_obra_id ON sinaleiros(obra_id);
  CREATE INDEX idx_documentos_sinaleiro_id ON documentos_sinaleiro(sinaleiro_id);
  ```

### Frontend

- [ ] Verificar se `lib/api-sinaleiros.ts` está correto (já parece estar estruturado)
- [ ] Ajustar endpoints se necessário para corresponder ao backend implementado
- [ ] Testar integração em `app/dashboard/obras/[id]/page.tsx`
- [ ] Testar integração em `app/dashboard/obras/nova/page.tsx`
- [ ] Adicionar tratamento de erros adequado
- [ ] Adicionar loading states se necessário
- [ ] Verificar se há algum mock escondido em outros arquivos

### Banco de Dados

- [ ] Executar migration `create_sinaleiros.sql`
- [ ] Executar migration `create_documentos_sinaleiro.sql` (se criada)
- [ ] Verificar foreign keys e constraints
- [ ] Criar índices necessários

---

## 🔌 Endpoints Necessários

### GET
```
GET /api/sinaleiros?obra_id={id}
GET /api/sinaleiros/:id
GET /api/sinaleiros/:id/documentos
```

### POST
```
POST /api/sinaleiros
POST /api/sinaleiros/:id/documentos
```

### PUT/PATCH
```
PUT /api/sinaleiros/:id
PUT /api/documentos-sinaleiro/:id/aprovar
```

### DELETE
```
DELETE /api/sinaleiros/:id
```

**Nota:** O frontend atual usa rotas aninhadas como `/api/obras/:obraId/sinaleiros`. Pode ser necessário ajustar para `/api/sinaleiros?obra_id={id}` ou manter as rotas aninhadas conforme preferência arquitetural.

---

## 🗂️ Estrutura de Dados

### Request - Criar Sinaleiro
```typescript
interface CreateSinaleiroRequest {
  obra_id: string;
  nome: string;
  telefone?: string;
  documentos?: Record<string, any>;
  certificados?: Record<string, any>;
  status?: string;
}
```

### Response - Sinaleiro
```typescript
interface SinaleiroResponse {
  id: string;
  obra_id: string;
  nome: string;
  telefone?: string;
  documentos?: Record<string, any>;
  certificados?: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
}
```

### Request - Criar Documento
```typescript
interface CreateDocumentoSinaleiroRequest {
  tipo: string;
  arquivo: string;
  data_validade?: string;
}
```

### Response - Documento Sinaleiro
```typescript
interface DocumentoSinaleiroResponse {
  id: string;
  sinaleiro_id: string;
  tipo: string;
  arquivo: string;
  data_validade?: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'vencido';
  aprovado_por?: string;
  aprovado_em?: string;
  alerta_enviado: boolean;
  created_at: string;
}
```

---

## ✅ Critérios de Aceitação

- [ ] Migration da tabela `sinaleiros` criada e executada com sucesso
- [ ] Todas as rotas CRUD de sinaleiros implementadas e funcionando
- [ ] Rotas de documentos de sinaleiros implementadas
- [ ] Rotas registradas no `server.js`
- [ ] Validações implementadas para todas as rotas POST/PUT
- [ ] Frontend integrado e funcionando sem mocks
- [ ] Página de detalhes da obra (`[id]/page.tsx`) exibe sinaleiros corretamente
- [ ] Página de nova obra (`nova/page.tsx`) permite criar/editar sinaleiros
- [ ] Tratamento de erros implementado no frontend
- [ ] Loading states funcionando
- [ ] Testes de integração passando
- [ ] Documentação atualizada

---

## 🧪 Casos de Teste

### Teste 1: Criar Sinaleiro
**Dado:** Uma obra existente no sistema  
**Quando:** Criar um novo sinaleiro via API  
**Então:** O sinaleiro deve ser criado com sucesso e retornado com ID

### Teste 2: Listar Sinaleiros por Obra
**Dado:** Uma obra com sinaleiros cadastrados  
**Quando:** Buscar sinaleiros filtrando por `obra_id`  
**Então:** Deve retornar apenas os sinaleiros daquela obra

### Teste 3: Atualizar Sinaleiro
**Dado:** Um sinaleiro existente  
**Quando:** Atualizar informações do sinaleiro  
**Então:** As informações devem ser atualizadas e `updated_at` deve ser modificado

### Teste 4: Excluir Sinaleiro
**Dado:** Um sinaleiro existente  
**Quando:** Excluir o sinaleiro  
**Então:** O sinaleiro deve ser marcado como excluído (soft delete) ou removido do banco

### Teste 5: Criar Documento de Sinaleiro
**Dado:** Um sinaleiro existente  
**Quando:** Criar um documento para o sinaleiro  
**Então:** O documento deve ser criado e vinculado ao sinaleiro

### Teste 6: Aprovar Documento
**Dado:** Um documento pendente de aprovação  
**Quando:** Aprovar o documento via API  
**Então:** O status deve mudar para 'aprovado' e `aprovado_por` e `aprovado_em` devem ser preenchidos

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser a primeira task a ser executada)

### Bloqueia:
- [ ] TASK-002 - Performance de Gruas (pode ser executada em paralelo)
- [ ] TASK-003 - Aluguéis Residenciais (pode ser executada em paralelo)
- [ ] TASK-006 - Testes e Validação Final (depende desta task)

### Relacionada com:
- [ ] TASK-005 - Ajustes Gerais Backend (registrar rotas no server.js)

---

## 📚 Referências

- `RELATORIO-DIVISAO-DEMANDAS-FRONTEND-BACKEND.md` - Seção "🔴 1. Construir Backend Completo de Sinaleiros"
- `RELATORIO-INTEGRACAO-FRONTEND-BACKEND-2025-02-02.md` - Seção "2️⃣ MÓDULO: OBRAS"
- `lib/api-sinaleiros.ts` - API client existente no frontend

---

## 💡 Notas Técnicas

1. **Estrutura de Rotas:** O frontend atual usa rotas aninhadas (`/api/obras/:obraId/sinaleiros`). Pode ser necessário decidir entre:
   - Manter rotas aninhadas: `/api/obras/:obraId/sinaleiros`
   - Usar rotas diretas: `/api/sinaleiros?obra_id={id}`
   
   A segunda opção é mais RESTful e flexível.

2. **Soft Delete:** Recomenda-se implementar soft delete para sinaleiros, mantendo histórico.

3. **Documentos:** A tabela de documentos pode ser criada separadamente ou como JSONB na tabela principal. Avaliar qual abordagem é melhor para o caso de uso.

4. **Validações:** Usar Joi ou Zod para validação. Verificar qual biblioteca já está sendo usada no projeto.

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Incompatibilidade entre estrutura de rotas do frontend e backend
  - **Mitigação:** Revisar `lib/api-sinaleiros.ts` antes de implementar backend e ajustar conforme necessário

- **Risco 2:** Performance em consultas com muitos sinaleiros
  - **Mitigação:** Criar índices adequados e implementar paginação se necessário

- **Risco 3:** Validação de foreign keys (obra_id deve existir)
  - **Mitigação:** Implementar validação no backend antes de inserir

---

## 📊 Estimativas

**Tempo Estimado:** 1-2 dias (backend) + 4-6 horas (frontend)  
**Complexidade:** Média  
**Esforço:** Médio

**Breakdown:**
- Migration e estrutura de banco: 2-3 horas
- Rotas CRUD backend: 4-6 horas
- Rotas de documentos: 2-3 horas
- Validações: 2 horas
- Integração frontend: 4-6 horas
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

