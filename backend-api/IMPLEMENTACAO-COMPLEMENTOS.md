# 📋 Checklist Completo - Implementação de Complementos no Backend

Este documento lista **TODOS** os passos necessários para ter paginação, pesquisa e integração 100% funcionando no backend.

---

## ✅ 1. EXECUTAR MIGRATION NO BANCO DE DADOS

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard** → Seu projeto → **SQL Editor**
2. Copie o conteúdo completo do arquivo:
   ```
   backend-api/database/migrations/20250225_create_complementos_catalogo.sql
   ```
3. Cole no SQL Editor e execute
4. Verifique se a tabela foi criada:
   ```sql
   SELECT * FROM complementos_catalogo LIMIT 1;
   ```

### Opção B: Via psql (PostgreSQL CLI)

```bash
# Conectar ao banco
psql -h [SEU_HOST] -U [SEU_USUARIO] -d [SEU_DATABASE]

# Executar migration
\i backend-api/database/migrations/20250225_create_complementos_catalogo.sql
```

### Opção C: Via Script Node.js (Se disponível)

```bash
cd backend-api
node scripts/executar-migration.js 20250225_create_complementos_catalogo.sql
```

---

## ✅ 2. VERIFICAR ESTRUTURA DA TABELA

Execute no banco para confirmar que tudo está correto:

```sql
-- Verificar estrutura da tabela
\d complementos_catalogo

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'complementos_catalogo';

-- Verificar constraints
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'complementos_catalogo'::regclass;
```

**Resultado esperado:**
- ✅ Tabela `complementos_catalogo` existe
- ✅ 5 índices criados (sku, tipo, tipo_precificacao, ativo, created_at)
- ✅ Trigger `trigger_update_complementos_catalogo_updated_at` existe
- ✅ Foreign keys para `usuarios` (created_by, updated_by)

---

## ✅ 3. VERIFICAR ROTA REGISTRADA NO SERVER.JS

Arquivo: `backend-api/src/server.js`

**Verificar se existe:**
```javascript
import complementosRoutes from './routes/complementos.js'
```

**Verificar se está registrada:**
```javascript
app.use('/api/complementos', complementosRoutes)
```

**Se não estiver, adicionar:**
- Linha ~117: `import complementosRoutes from './routes/complementos.js'`
- Linha ~353: `app.use('/api/complementos', complementosRoutes)`

---

## ✅ 4. VERIFICAR PERMISSÕES NO SISTEMA

A rota usa as seguintes permissões:
- `obras:visualizar` - Para GET (listar e buscar)
- `obras:criar` - Para POST (criar)
- `obras:editar` - Para PUT e PATCH (atualizar e toggle ativo)
- `obras:excluir` - Para DELETE

**Verificar se os perfis têm essas permissões:**

```sql
-- Verificar permissões relacionadas a obras
SELECT 
  p.nome as perfil,
  perm.chave as permissao,
  pp.status
FROM perfis p
JOIN perfil_permissoes pp ON pp.perfil_id = p.id
JOIN permissoes perm ON perm.id = pp.permissao_id
WHERE perm.chave LIKE 'obras:%'
ORDER BY p.nome, perm.chave;
```

**Se não existirem, adicionar:**
```sql
-- Verificar se as permissões existem
SELECT * FROM permissoes WHERE chave LIKE 'obras:%';

-- Se não existirem, criar (exemplo)
INSERT INTO permissoes (chave, descricao, modulo) VALUES
  ('obras:visualizar', 'Visualizar obras e complementos', 'obras'),
  ('obras:criar', 'Criar obras e complementos', 'obras'),
  ('obras:editar', 'Editar obras e complementos', 'obras'),
  ('obras:excluir', 'Excluir obras e complementos', 'obras');
```

---

## ✅ 5. TESTAR ROTA DE API

### 5.1. Testar GET (Listar)

```bash
curl -X GET "http://localhost:3001/api/complementos?page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

### 5.2. Testar GET com Filtros

```bash
# Filtrar por tipo
curl -X GET "http://localhost:3001/api/complementos?tipo=acessorio&page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"

# Filtrar por status
curl -X GET "http://localhost:3001/api/complementos?ativo=true&page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"

# Pesquisar por texto
curl -X GET "http://localhost:3001/api/complementos?search=garfo&page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 5.3. Testar POST (Criar)

```bash
curl -X POST "http://localhost:3001/api/complementos" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Garfo Paleteiro",
    "sku": "ACESS-001",
    "tipo": "acessorio",
    "tipo_precificacao": "mensal",
    "unidade": "unidade",
    "preco_unitario_centavos": 50000,
    "descricao": "Garfo para movimentação de paletes",
    "ativo": true
  }'
```

### 5.4. Testar PUT (Atualizar)

```bash
curl -X PUT "http://localhost:3001/api/complementos/1" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Garfo Paleteiro Atualizado",
    "preco_unitario_centavos": 55000
  }'
```

### 5.5. Testar DELETE

```bash
curl -X DELETE "http://localhost:3001/api/complementos/1" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 5.6. Testar PATCH (Toggle Ativo)

```bash
curl -X PATCH "http://localhost:3001/api/complementos/1/toggle-ativo" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## ✅ 6. VERIFICAR PAGINAÇÃO E PESQUISA

### 6.1. Paginação

A paginação está implementada com:
- Parâmetros: `page` (padrão: 1) e `limit` (padrão: 50)
- Cálculo de offset: `(page - 1) * limit`
- Retorno inclui: `page`, `limit`, `total`, `pages`

**Teste de paginação:**
```bash
# Página 1, 10 itens
curl "http://localhost:3001/api/complementos?page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"

# Página 2, 10 itens
curl "http://localhost:3001/api/complementos?page=2&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 6.2. Pesquisa

A pesquisa busca em:
- `nome` (case-insensitive)
- `sku` (case-insensitive)
- `descricao` (case-insensitive)

**Teste de pesquisa:**
```bash
# Buscar por nome
curl "http://localhost:3001/api/complementos?search=garfo" \
  -H "Authorization: Bearer SEU_TOKEN"

# Buscar por SKU
curl "http://localhost:3001/api/complementos?search=ACESS-001" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 6.3. Filtros Combinados

```bash
# Tipo + Pesquisa + Paginação
curl "http://localhost:3001/api/complementos?tipo=acessorio&search=garfo&page=1&limit=5" \
  -H "Authorization: Bearer SEU_TOKEN"

# Status + Tipo + Paginação
curl "http://localhost:3001/api/complementos?ativo=true&tipo=servico&page=1&limit=20" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## ✅ 7. AJUSTES NECESSÁRIOS NA ROTA (SE HOUVER PROBLEMAS)

### 7.1. Corrigir Conversão de Tipos na Paginação

Se houver problemas com tipos, ajustar em `backend-api/src/routes/complementos.js`:

```javascript
// Linha 73 - Garantir conversão correta
const pageNum = parseInt(String(page)) || 1;
const limitNum = parseInt(String(limit)) || 50;
const offset = (pageNum - 1) * limitNum;

// Linha 92 - Usar variáveis convertidas
query = query.range(offset, offset + limitNum - 1)
```

### 7.2. Melhorar Tratamento de Erros

Adicionar logs mais detalhados:

```javascript
if (error) {
  console.error('Erro ao buscar complementos:', {
    error: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint
  });
  // ...
}
```

### 7.3. Adicionar Validação de Parâmetros

```javascript
// Validar page e limit
const pageNum = Math.max(1, parseInt(String(page)) || 1);
const limitNum = Math.min(100, Math.max(1, parseInt(String(limit)) || 50));
```

---

## ✅ 8. POPULAR DADOS INICIAIS (OPCIONAL)

Se quiser popular com dados iniciais:

```sql
-- Inserir complementos de exemplo
INSERT INTO complementos_catalogo (nome, sku, tipo, tipo_precificacao, unidade, preco_unitario_centavos, descricao, ativo) VALUES
  ('Garfo Paleteiro', 'ACESS-001', 'acessorio', 'mensal', 'unidade', 50000, 'Garfo para movimentação de paletes', true),
  ('Balde de Concreto', 'ACESS-002', 'acessorio', 'mensal', 'unidade', 30000, 'Balde para transporte de concreto', true),
  ('Serviço de Montagem', 'SERV-001', 'servico', 'por_hora', 'h', 15000, 'Mão de obra para montagem e fixação da grua', true),
  ('Serviço de Operador', 'SERV-005', 'servico', 'mensal', 'unidade', 800000, 'Locação mensal de operador de grua', true);
```

---

## ✅ 9. VERIFICAR LOGS DO SERVIDOR

Ao iniciar o servidor, verificar:

```bash
cd backend-api
npm start
```

**Verificar no console:**
- ✅ Servidor iniciado na porta 3001
- ✅ Nenhum erro de importação
- ✅ Rota `/api/complementos` registrada

**Testar health check:**
```bash
curl http://localhost:3001/health
```

---

## ✅ 10. TESTAR INTEGRAÇÃO COMPLETA

### 10.1. Frontend → Backend

1. Acessar: `http://localhost:3000/dashboard/complementos`
2. Verificar no Network (DevTools):
   - ✅ GET `/api/complementos?limit=1000` retorna 200
   - ✅ Resposta contém `success: true` e `data: []`

### 10.2. Criar Complemento

1. Clicar em "Adicionar Complemento"
2. Preencher formulário
3. Salvar
4. Verificar:
   - ✅ POST `/api/complementos` retorna 201
   - ✅ Item aparece na lista

### 10.3. Editar Complemento

1. Clicar em editar
2. Modificar dados
3. Salvar
4. Verificar:
   - ✅ PUT `/api/complementos/:id` retorna 200
   - ✅ Alterações aparecem na lista

### 10.4. Excluir Complemento

1. Clicar em excluir
2. Confirmar
3. Verificar:
   - ✅ DELETE `/api/complementos/:id` retorna 200
   - ✅ Item desaparece da lista

### 10.5. Toggle Ativo/Inativo

1. Clicar no ícone de status
2. Verificar:
   - ✅ PATCH `/api/complementos/:id/toggle-ativo` retorna 200
   - ✅ Status muda na lista

### 10.6. Pesquisa e Filtros

1. Digitar no campo de pesquisa
2. Selecionar filtro de tipo
3. Verificar:
   - ✅ GET com parâmetros `search` e `tipo` funciona
   - ✅ Resultados filtrados corretamente

---

## 🐛 TROUBLESHOOTING

### Erro: "relation complementos_catalogo does not exist"
**Solução:** Executar a migration (Passo 1)

### Erro: "permission denied"
**Solução:** Verificar permissões (Passo 4)

### Erro: "Cannot read property 'id' of undefined"
**Solução:** Verificar se `req.user` está sendo populado pelo middleware de autenticação

### Erro: "Invalid input syntax for type integer"
**Solução:** Verificar conversão de tipos na paginação (Passo 7.1)

### Erro: "duplicate key value violates unique constraint"
**Solução:** SKU já existe. Verificar se está tentando criar com SKU duplicado

### Paginação não funciona
**Solução:** 
- Verificar se `count: 'exact'` está no select
- Verificar se offset está sendo calculado corretamente
- Verificar se range está correto

### Pesquisa não funciona
**Solução:**
- Verificar se a sintaxe do `.or()` está correta
- Verificar se os campos existem na tabela
- Verificar se há índices nos campos pesquisados

---

## 📝 CHECKLIST FINAL

- [ ] Migration executada no banco
- [ ] Tabela `complementos_catalogo` existe e tem estrutura correta
- [ ] Rota registrada no `server.js`
- [ ] Permissões configuradas
- [ ] Servidor reiniciado
- [ ] GET `/api/complementos` funciona
- [ ] POST `/api/complementos` funciona
- [ ] PUT `/api/complementos/:id` funciona
- [ ] DELETE `/api/complementos/:id` funciona
- [ ] PATCH `/api/complementos/:id/toggle-ativo` funciona
- [ ] Paginação funciona (page, limit)
- [ ] Pesquisa funciona (search)
- [ ] Filtros funcionam (tipo, ativo)
- [ ] Frontend consegue carregar dados
- [ ] Frontend consegue criar/editar/excluir
- [ ] Logs não mostram erros

---

## 🎯 RESULTADO ESPERADO

Após seguir todos os passos:

✅ **Backend 100% funcional:**
- Paginação implementada e funcionando
- Pesquisa implementada e funcionando
- Filtros implementados e funcionando
- CRUD completo funcionando
- Autenticação e autorização funcionando

✅ **Frontend 100% integrado:**
- Carrega dados do backend
- Cria novos complementos
- Edita complementos existentes
- Exclui complementos
- Alterna status ativo/inativo
- Pesquisa e filtra corretamente

---

**Data de criação:** 2025-02-25  
**Última atualização:** 2025-02-25

