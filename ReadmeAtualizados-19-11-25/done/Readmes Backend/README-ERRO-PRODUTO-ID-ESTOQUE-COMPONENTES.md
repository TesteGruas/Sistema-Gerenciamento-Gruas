# Erro: produto_id NOT NULL na Tabela Estoque ao Criar Componentes

## 📋 Descrição do Problema

Ao criar um componente de grua através da API `/api/grua-componentes`, ocorre o seguinte erro:

```
{
    "error": "Erro ao criar componente",
    "message": "null value in column \"produto_id\" of relation \"estoque\" violates not-null constraint"
}
```

## 🔍 Causa Raiz

O problema ocorre devido a um **trigger no banco de dados** que sincroniza automaticamente componentes de gruas com a tabela `estoque`. 

### Fluxo do Problema:

1. Quando um componente é criado na tabela `grua_componentes`, um trigger (`trigger_sincronizar_componente_estoque`) é executado automaticamente
2. Este trigger tenta criar um registro na tabela `estoque` com:
   - `componente_id` = ID do componente criado
   - `tipo_item` = 'componente'
   - `produto_id` = NULL (pois componentes não são produtos)
3. A tabela `estoque` possui uma constraint que exige `produto_id` NOT NULL, causando o erro

### Arquivo do Trigger

O trigger está definido em:
```
backend-api/database/migrations/20250202_integrar_componentes_estoque.sql
```

Função: `sincronizar_componente_estoque()` (linhas 32-76)

## ✅ Solução

Foi criada uma migration para corrigir o problema:

**Arquivo:** `backend-api/database/migrations/20250221_fix_estoque_produto_id_nullable.sql`

### O que a migration faz:

1. **Adiciona o campo `produto_id`** à tabela `estoque` se não existir (como UUID nullable)
2. **Cria uma constraint CHECK** que permite:
   - `produto_id` NULL quando `tipo_item = 'componente'`
   - `produto_id` NOT NULL quando `tipo_item = 'produto'`
   - Compatibilidade com registros antigos
3. **Adiciona índice** para melhorar performance nas consultas

### Aplicar a Migration

Execute a migration no banco de dados:

```bash
# Opção 1: Via psql diretamente
psql -U seu_usuario -d seu_banco -f backend-api/database/migrations/20250221_fix_estoque_produto_id_nullable.sql

# Opção 2: Via script de migração do projeto (se existir)
cd backend-api
npm run migrate

# Opção 3: Via Supabase CLI (se estiver usando Supabase)
supabase db execute -f database/migrations/20250221_fix_estoque_produto_id_nullable.sql
```

**⚠️ IMPORTANTE:** Antes de aplicar a migration, verifique se não há registros em `estoque` com `tipo_item = 'produto'` e `produto_id = NULL`. Se houver, será necessário corrigi-los manualmente primeiro.

## 🔧 Verificação

Após aplicar a migration, verifique se a correção foi aplicada corretamente:

```sql
-- 1. Verificar se produto_id é nullable
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'estoque'
AND column_name = 'produto_id';

-- Resultado esperado: is_nullable = 'YES'

-- 2. Verificar constraint criada
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'estoque'::regclass
AND conname = 'check_produto_id_tipo_item';

-- 3. Verificar se há registros de componentes em estoque
SELECT 
    tipo_item,
    COUNT(*) as total,
    COUNT(produto_id) as com_produto_id,
    COUNT(*) - COUNT(produto_id) as sem_produto_id
FROM estoque
GROUP BY tipo_item;

-- 4. Testar criação de componente via API
-- Deve funcionar sem erro agora
```

## 📝 Estrutura Esperada da Tabela Estoque

Após a correção, a tabela `estoque` deve suportar:

| Campo | Tipo | Nullable | Descrição |
|-------|------|----------|-----------|
| `id` | SERIAL | NOT NULL | ID do registro |
| `produto_id` | UUID | **NULL** | ID do produto (quando tipo_item = 'produto') |
| `componente_id` | INTEGER | NULL | ID do componente (quando tipo_item = 'componente') |
| `tipo_item` | VARCHAR(20) | NOT NULL | 'produto' ou 'componente' |
| `quantidade_atual` | INTEGER | | Quantidade total |
| `quantidade_reservada` | INTEGER | | Quantidade em uso/reservada |
| `quantidade_disponivel` | INTEGER | | Quantidade disponível |
| `valor_total` | DECIMAL | | Valor total do estoque |

## 🎯 Comportamento Esperado

### Ao Criar um Componente:

1. Componente é inserido em `grua_componentes`
2. Trigger `sincronizar_componente_estoque` é executado
3. Registro é criado em `estoque` com:
   - `tipo_item = 'componente'`
   - `componente_id = <id_do_componente>`
   - `produto_id = NULL` ✅ (agora permitido)

### Ao Criar um Produto:

1. Produto é inserido em `produtos`
2. Registro é criado em `estoque` com:
   - `tipo_item = 'produto'`
   - `produto_id = <id_do_produto>`
   - `componente_id = NULL`

## ⚠️ Observações Importantes

1. **Registros Existentes**: Se já existirem registros em `estoque` com `tipo_item = 'produto'` e `produto_id = NULL`, a migration pode falhar. Nesse caso, será necessário corrigir esses registros antes de aplicar a migration.

2. **Rollback**: Se necessário fazer rollback, execute:
   ```sql
   ALTER TABLE estoque DROP CONSTRAINT IF EXISTS check_produto_id_tipo_item;
   ```

3. **Performance**: O índice em `produto_id` ajuda nas consultas que filtram por produto.

## 🔗 Arquivos Relacionados

- **Trigger de Sincronização**: `backend-api/database/migrations/20250202_integrar_componentes_estoque.sql`
- **Migration de Correção**: `backend-api/database/migrations/20250221_fix_estoque_produto_id_nullable.sql`
- **Rota da API**: `backend-api/src/routes/grua-componentes.js`

## 📅 Data de Correção

**Data:** 21/02/2025  
**Versão:** 1.0

