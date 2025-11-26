# ✅ Checklist Rápido - Implementação Complementos Backend

## 🎯 Passos Obrigatórios (Ordem de Execução)

### 1️⃣ **EXECUTAR MIGRATION** ⚠️ CRÍTICO
```sql
-- Copiar e executar no Supabase SQL Editor:
-- Arquivo: backend-api/database/migrations/20250225_create_complementos_catalogo.sql
```

**Como fazer:**
1. Abrir Supabase Dashboard → SQL Editor
2. Copiar todo o conteúdo do arquivo `.sql`
3. Colar e executar
4. Verificar: `SELECT * FROM complementos_catalogo LIMIT 1;`

---

### 2️⃣ **VERIFICAR ROTA NO SERVER.JS** ✅
Arquivo: `backend-api/src/server.js`

**Verificar se existe (linha ~117):**
```javascript
import complementosRoutes from './routes/complementos.js'
```

**Verificar se está registrada (linha ~353):**
```javascript
app.use('/api/complementos', complementosRoutes)
```

**Se não estiver, adicionar!**

---

### 3️⃣ **REINICIAR SERVIDOR BACKEND** 🔄
```bash
cd backend-api
npm start
# ou
node src/server.js
```

**Verificar no console:**
- ✅ Servidor iniciado
- ✅ Nenhum erro de importação
- ✅ Rota `/api/complementos` disponível

---

### 4️⃣ **TESTAR API** 🧪

**Teste básico (deve retornar lista vazia):**
```bash
curl -X GET "http://localhost:3001/api/complementos" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 0,
    "pages": 0
  }
}
```

---

### 5️⃣ **VERIFICAR PERMISSÕES** 🔐

**Verificar se usuário tem permissão:**
```sql
SELECT 
  p.nome as perfil,
  perm.chave as permissao
FROM perfis p
JOIN perfil_permissoes pp ON pp.perfil_id = p.id
JOIN permissoes perm ON perm.id = pp.permissao_id
WHERE perm.chave IN ('obras:visualizar', 'obras:criar', 'obras:editar', 'obras:excluir')
AND p.id = (SELECT perfil_id FROM usuario_perfis WHERE usuario_id = SEU_USUARIO_ID);
```

**Se não tiver, adicionar permissões ao perfil do usuário.**

---

## 📋 Funcionalidades Implementadas

### ✅ **Paginação**
- Parâmetros: `?page=1&limit=10`
- Retorna: `page`, `limit`, `total`, `pages`
- Limite máximo: 100 itens por página

### ✅ **Pesquisa**
- Parâmetro: `?search=garfo`
- Busca em: `nome`, `sku`, `descricao`
- Case-insensitive

### ✅ **Filtros**
- `?tipo=acessorio` ou `?tipo=servico`
- `?ativo=true` ou `?ativo=false`

### ✅ **CRUD Completo**
- `GET /api/complementos` - Listar
- `GET /api/complementos/:id` - Buscar por ID
- `POST /api/complementos` - Criar
- `PUT /api/complementos/:id` - Atualizar
- `DELETE /api/complementos/:id` - Excluir
- `PATCH /api/complementos/:id/toggle-ativo` - Alternar status

---

## 🐛 Problemas Comuns

### ❌ "relation complementos_catalogo does not exist"
**Solução:** Executar migration (Passo 1)

### ❌ "permission denied"
**Solução:** Verificar permissões (Passo 5)

### ❌ "Cannot GET /api/complementos"
**Solução:** Verificar se rota está registrada (Passo 2) e servidor reiniciado (Passo 3)

### ❌ Paginação retorna erro
**Solução:** Verificar se migration foi executada corretamente

---

## ✅ Checklist Final

- [ ] Migration executada no banco
- [ ] Tabela `complementos_catalogo` existe
- [ ] Rota importada no `server.js`
- [ ] Rota registrada no `server.js`
- [ ] Servidor reiniciado
- [ ] GET `/api/complementos` retorna 200
- [ ] Permissões configuradas
- [ ] Frontend consegue carregar dados

---

## 📝 Arquivos Modificados/Criados

1. ✅ `backend-api/database/migrations/20250225_create_complementos_catalogo.sql` (NOVO)
2. ✅ `backend-api/src/routes/complementos.js` (NOVO)
3. ✅ `backend-api/src/server.js` (MODIFICADO - adicionada rota)

---

## 🎯 Próximos Passos Após Backend

1. Testar no frontend: `http://localhost:3000/dashboard/complementos`
2. Verificar se dados carregam
3. Testar criar/editar/excluir
4. Testar pesquisa e filtros

---

**Status:** ✅ Backend 100% implementado  
**Próximo passo:** Executar migration e testar

