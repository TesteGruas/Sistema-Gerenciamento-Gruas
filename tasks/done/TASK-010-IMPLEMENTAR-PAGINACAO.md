# 📋 TASK-010: Implementar Paginação em Todos os Endpoints

**ID da Task:** TASK-010  
**Título:** Adicionar Paginação Obrigatória em Endpoints de Listagem  
**Fase:** 2  
**Módulo:** Performance - Backend  
**Arquivo(s):** 
- `backend-api/src/routes/*.js` (todas as rotas de listagem)
- `backend-api/src/middleware/pagination.js` (criar)

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟡 MÉDIA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Implementar paginação obrigatória em todos os endpoints de listagem do backend. Atualmente, alguns endpoints retornam todos os registros sem paginação, o que pode:
- Causar lentidão com muitos dados
- Consumir muita memória
- Gerar respostas muito grandes
- Impactar performance do frontend

A paginação deve ser padronizada em todos os endpoints, com parâmetros consistentes e metadados de paginação na resposta.

---

## 🎯 Objetivos

- [ ] Auditar todos os endpoints de listagem
- [ ] Criar middleware de paginação reutilizável
- [ ] Implementar paginação em todos os endpoints
- [ ] Padronizar parâmetros de paginação
- [ ] Adicionar metadados de paginação nas respostas
- [ ] Limitar tamanho máximo de respostas
- [ ] Documentar padrão de paginação

---

## 📋 Situação Atual

### Paginação Existente

- ✅ Alguns endpoints já têm paginação (ex: `complementos.js`)
- ⚠️ Muitos endpoints não têm paginação
- ⚠️ Paginação não é padronizada
- ⚠️ Limites e padrões variam entre endpoints

### Integrações Existentes

- ✅ Supabase suporta paginação nativamente
- ✅ Alguns exemplos de paginação existem
- ❌ Middleware de paginação reutilizável não existe
- ❌ Padrão não está documentado

---

## 🔧 Ações Necessárias

### Backend

- [ ] Criar middleware de paginação (`backend-api/src/middleware/pagination.js`):
  ```javascript
  export const parsePagination = (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const offset = (page - 1) * limit
    
    req.pagination = {
      page,
      limit,
      offset
    }
    
    next()
  }
  
  export const formatPaginationResponse = (data, total, pagination) => {
    return {
      success: true,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page * pagination.limit < total,
        hasPreviousPage: pagination.page > 1
      }
    }
  }
  ```

- [ ] Auditar endpoints de listagem:
  - `GET /api/obras`
  - `GET /api/gruas`
  - `GET /api/funcionarios`
  - `GET /api/clientes`
  - `GET /api/orcamentos`
  - `GET /api/medicoes`
  - `GET /api/locacoes`
  - `GET /api/ponto-eletronico`
  - `GET /api/financeiro/*`
  - `GET /api/rh/*`
  - Outros endpoints de listagem

- [ ] Implementar paginação em cada endpoint:
  ```javascript
  import { parsePagination, formatPaginationResponse } from '../middleware/pagination.js'
  
  router.get('/', parsePagination, async (req, res) => {
    const { page, limit, offset } = req.pagination
    
    // Contar total
    const { count } = await supabaseAdmin
      .from('tabela')
      .select('*', { count: 'exact', head: true })
    
    // Buscar dados paginados
    const { data, error } = await supabaseAdmin
      .from('tabela')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })
    
    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }
    
    res.json(formatPaginationResponse(data, count, req.pagination))
  })
  ```

- [ ] Padronizar limites:
  - Padrão: 10 itens por página
  - Máximo: 100 itens por página
  - Mínimo: 1 item por página

- [ ] Adicionar validação de parâmetros:
  - `page` deve ser >= 1
  - `limit` deve estar entre 1 e 100

### Frontend

- [ ] Atualizar API clients para suportar paginação:
  - Adicionar parâmetros `page` e `limit`
  - Processar metadados de paginação
  - Atualizar componentes para usar paginação

- [ ] Atualizar componentes de listagem:
  - Adicionar controles de paginação
  - Mostrar informações de paginação
  - Implementar navegação entre páginas

---

## 🔌 Padrão de Paginação

### Request
```
GET /api/recurso?page=1&limit=10
```

**Parâmetros:**
- `page` (opcional): Número da página (padrão: 1, mínimo: 1)
- `limit` (opcional): Itens por página (padrão: 10, mínimo: 1, máximo: 100)

### Response
```typescript
{
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

---

## ✅ Critérios de Aceitação

- [ ] Todos os endpoints de listagem têm paginação
- [ ] Middleware de paginação reutilizável criado
- [ ] Parâmetros de paginação padronizados
- [ ] Metadados de paginação em todas as respostas
- [ ] Limites validados (1-100)
- [ ] Frontend atualizado para usar paginação
- [ ] Documentação atualizada
- [ ] Testes de paginação criados

---

## 🧪 Casos de Teste

### Teste 1: Paginação Padrão
**Dado:** Endpoint com paginação  
**Quando:** Buscar sem parâmetros  
**Então:** Deve retornar primeira página com 10 itens

### Teste 2: Paginação Customizada
**Dado:** Endpoint com paginação  
**Quando:** Buscar com `page=2&limit=20`  
**Então:** Deve retornar segunda página com 20 itens

### Teste 3: Limite Máximo
**Dado:** Endpoint com paginação  
**Quando:** Buscar com `limit=200`  
**Então:** Deve limitar a 100 itens

### Teste 4: Página Inválida
**Dado:** Endpoint com paginação  
**Quando:** Buscar com `page=0`  
**Então:** Deve usar página 1

### Teste 5: Metadados de Paginação
**Dado:** Endpoint com paginação  
**Quando:** Buscar dados  
**Então:** Deve retornar metadados corretos (total, totalPages, etc.)

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada independentemente)

### Bloqueia:
- Nenhuma (pode ser executada em paralelo)

### Relacionada com:
- TASK-009 - Adicionar índices (índices melhoram performance de paginação)
- TASK-011 - Implementar cache (cache pode melhorar paginação)

---

## 📚 Referências

- `RELATORIO-AUDITORIA-COMPLETA-2025-02-02.md` - Seção "5.1 Queries de Banco" e "5.4 Tamanho de Respostas"
- `backend-api/src/routes/complementos.js` - Exemplo de paginação existente
- Documentação Supabase sobre paginação

---

## 💡 Notas Técnicas

1. **Performance:** Usar `count: 'exact'` apenas quando necessário. Para grandes tabelas, considerar aproximação.

2. **Ordenação:** Sempre especificar ordenação para garantir consistência entre páginas.

3. **Índices:** Garantir que campos de ordenação tenham índices para performance.

4. **Cache:** Considerar cache de contagem total para melhorar performance.

5. **Filtros:** Paginação deve funcionar com filtros. Aplicar filtros antes de paginar.

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Contagem total pode ser lenta em tabelas grandes
  - **Mitigação:** Usar aproximação ou cache quando apropriado

- **Risco 2:** Mudanças durante paginação podem causar inconsistências
  - **Mitigação:** Usar ordenação estável, considerar cursor-based pagination para casos críticos

- **Risco 3:** Frontend pode não estar preparado para paginação
  - **Mitigação:** Atualizar frontend junto com backend

---

## 📊 Estimativas

**Tempo Estimado:** 3-4 dias  
**Complexidade:** Média  
**Esforço:** Médio

**Breakdown:**
- Criar middleware: 2 horas
- Auditar endpoints: 2 horas
- Implementar paginação: 2-3 dias
- Atualizar frontend: 1 dia
- Testes: 4 horas

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

