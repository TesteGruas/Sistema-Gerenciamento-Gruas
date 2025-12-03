# 🚀 Executar Migration: eh_supervisor em funcionarios

## ⚠️ ERRO ATUAL
```
"Could not find the 'eh_supervisor' column of 'funcionarios' in the schema cache"
```

## ✅ SOLUÇÃO: Executar Migration

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard** → Seu projeto → **SQL Editor**
2. Copie o conteúdo completo do arquivo:
   ```
   backend-api/database/migrations/20250226_add_eh_supervisor_funcionarios.sql
   ```
3. Cole no SQL Editor e execute (botão "Run")
4. Verifique se a coluna foi criada:
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'funcionarios' 
   AND column_name = 'eh_supervisor';
   ```

### Opção 2: Via psql (PostgreSQL CLI)

```bash
# Conectar ao banco
psql -h [SEU_HOST] -U [SEU_USUARIO] -d [SEU_DATABASE]

# Executar migration
\i backend-api/database/migrations/20250226_add_eh_supervisor_funcionarios.sql

# Ou executar diretamente:
psql -h [SEU_HOST] -U [SEU_USUARIO] -d [SEU_DATABASE] -f backend-api/database/migrations/20250226_add_eh_supervisor_funcionarios.sql
```

### Opção 3: Executar SQL Diretamente

Execute este SQL no seu banco de dados:

```sql
-- Adicionar coluna eh_supervisor
ALTER TABLE funcionarios
ADD COLUMN IF NOT EXISTS eh_supervisor BOOLEAN DEFAULT false;

-- Criar índice para melhorar performance em consultas de supervisores
CREATE INDEX IF NOT EXISTS idx_funcionarios_eh_supervisor 
ON funcionarios(eh_supervisor) 
WHERE eh_supervisor = true;

-- Comentário na coluna
COMMENT ON COLUMN funcionarios.eh_supervisor IS 'Indica se o funcionário é supervisor (informação auxiliar do cadastro). O status real de supervisor é definido por obra na tabela funcionarios_obras.';
```

## ✅ Verificação

Após executar, verifique se funcionou:

```sql
-- Verificar se a coluna existe
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'funcionarios' 
AND column_name = 'eh_supervisor';

-- Verificar se o índice foi criado
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'funcionarios' 
AND indexname = 'idx_funcionarios_eh_supervisor';
```

**Resultado esperado:**
- ✅ Coluna `eh_supervisor` existe (tipo: boolean, default: false)
- ✅ Índice `idx_funcionarios_eh_supervisor` existe

## 🔄 Após Executar

1. **Reiniciar o servidor backend** (se estiver rodando):
   ```bash
   cd backend-api
   # Parar o servidor (Ctrl+C) e reiniciar
   npm start
   ```

2. **Testar criação de funcionário**:
   - Acesse: http://localhost:3000/dashboard/rh
   - Clique em "Novo Funcionário"
   - Marque o checkbox "Este funcionário será um supervisor?"
   - Preencha os dados e crie
   - Deve funcionar sem erro!

## 📝 Nota

Esta migration também precisa ser executada:
- `20250226_add_supervisor_funcionarios_obras.sql` (já deve estar executada, mas verifique)

Para verificar:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'funcionarios_obras' 
AND column_name = 'is_supervisor';
```

