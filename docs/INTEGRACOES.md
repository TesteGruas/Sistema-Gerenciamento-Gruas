# Integrações Frontend-Backend-Database

## Status Geral: ✅ 100% Integrado

Este documento detalha todas as integrações implementadas no sistema.

## 📊 Resumo por Módulo

| Módulo | Frontend | Backend | Database | Status |
|--------|----------|---------|----------|--------|
| Notificações | ✅ | ✅ | ✅ | 100% |
| Aprovações Horas Extras | ✅ | ✅ | ✅ | 100% |
| Ponto Eletrônico | ✅ | ✅ | ✅ | 100% |
| Obras | ✅ | ✅ | ✅ | 100% |
| Gruas | ✅ | ✅ | ✅ | 100% |
| Assinaturas Digitais | ✅ | ✅ | ✅ | 100% |
| RH Completo | ✅ | ✅ | ✅ | 100% |
| Financeiro | ✅ | ✅ | ✅ | 100% |

## 🔄 Automações Implementadas

### 1. Receita Automática ao Finalizar Medição

**Arquivo**: `backend-api/src/routes/medicoes.js`

**Endpoint**: `PATCH /api/medicoes/:id/finalizar`

**Lógica**:
- Quando uma medição é finalizada (`status: 'finalizada'`)
- Busca `obra_id` através da configuração grua-obra
- Cria automaticamente registro em `receitas`:
  - `tipo`: 'locacao'
  - `obra_id`: da medição
  - `grua_id`: do equipamento (se for grua)
  - `valor`: `valor_total` da medição
  - `status`: 'confirmada'
  - `data_receita`: data atual

**Exemplo de uso**:
```bash
PATCH /api/medicoes/123/finalizar
# Cria automaticamente receita no financeiro
```

### 2. Custo Automático ao Registrar Manutenção

**Arquivo**: `backend-api/src/routes/livro-grua.js`

**Endpoint**: `POST /api/livro-grua`

**Lógica**:
- Quando entrada de tipo `'manutencao'` é criada no livro da grua
- Busca `obra_id` onde a grua está alocada
- Cria automaticamente registro em `custos`:
  - `tipo`: 'manutencao'
  - `obra_id`: da obra onde grua está
  - `grua_id`: da entrada do livro
  - `valor`: valor estimado (500.00 por padrão)
  - `status`: 'pendente'
  - `data_custo`: `data_entrada` do livro

**Exemplo de uso**:
```bash
POST /api/livro-grua
{
  "tipo_entrada": "manutencao",
  "grua_id": "G0001",
  ...
}
# Cria automaticamente custo no financeiro
```

## 🗄️ Migrações de Database

### Migration: `add_grua_id_to_financial_tables`

**Data**: Outubro 2025

**Mudanças**:
```sql
-- Adicionar coluna grua_id na tabela receitas
ALTER TABLE receitas ADD COLUMN grua_id VARCHAR REFERENCES gruas(id);

-- Adicionar coluna grua_id na tabela custos  
ALTER TABLE custos ADD COLUMN grua_id VARCHAR REFERENCES gruas(id);

-- Criar índices para otimização
CREATE INDEX idx_receitas_grua_id ON receitas(grua_id);
CREATE INDEX idx_custos_grua_id ON custos(grua_id);
```

**Impacto**:
- Permite rastreamento financeiro por grua
- Habilita relatórios de rentabilidade por equipamento
- Suporta automações financeiras

## 🔐 Autenticação

### JWT Token

**Geração**: `app/lib/auth.ts` - `AuthService.login()`

**Validação**: `backend-api/src/middleware/auth.js` - `authenticateToken`

**Fluxo**:
1. Login → Gera token JWT (exp: 24h)
2. Token armazenado em localStorage
3. Incluído em header `Authorization: Bearer <token>`
4. Middleware valida em cada requisição

### Contexto de Usuário

**Arquivo**: `lib/user-context.tsx`

**Hook**: `useUser()`

**Dados disponíveis**:
- `currentUser.id`
- `currentUser.name`
- `currentUser.email`
- `currentUser.role`
- `currentUser.permissoes`

## 📡 Integrações Frontend

### Removidas todas as simulações/mocks:

✅ **lib/api-notificacoes.ts** - API real implementada  
✅ **lib/api-ponto-eletronico.ts** - API real implementada  
✅ **lib/geolocation-validator.ts** - Busca obras via API  
✅ **app/lib/auth.ts** - getCurrentUser via /api/auth/me  
✅ **app/dashboard/assinatura/page.tsx** - Sem mocks  
✅ **app/dashboard/assinatura/[id]/page.tsx** - Sem mocks  
✅ **app/dashboard/obras/page.tsx** - Sem fallbacks  
✅ **app/dashboard/obras/[id]/page.tsx** - Sem fallbacks  
✅ **app/dashboard/gruas/page.tsx** - API integrada  

### Estados de Loading e Error

Todas as páginas implementam:
- Estado `loading` durante chamadas API
- Estado `error` para feedback ao usuário
- Componente `<Loader2>` para indicação visual
- `toast` para notificações de erro/sucesso

## 🔧 Validações Backend

### Joi Schemas Atualizados

**Receitas** (`backend-api/src/schemas/receita-schemas.js`):
```javascript
grua_id: Joi.string().optional()
```

**Custos** (`backend-api/src/routes/custos.js`):
```javascript
grua_id: Joi.string().optional()
```

## 📞 Suporte

Para dúvidas sobre integrações, consulte:
- README.md principal
- Documentação específica de cada módulo
- Código-fonte com comentários inline

---

**Última Atualização**: Outubro 2025  
**Versão**: 1.0.0

