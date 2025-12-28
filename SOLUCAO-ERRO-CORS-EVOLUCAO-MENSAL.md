# 🔧 Solução: Erro de CORS na rota evolucao-mensal

## ❌ Problema

O backend está bloqueando requisições CORS porque a origem `http://72.60.60.118:3000` não está na lista de origens permitidas.

## ✅ Solução

### Passo 1: Editar o `.env` do Backend

No servidor, edite o arquivo `.env` do backend:

```bash
cd ~/Sistema-Gerenciamento-Gruas/backend-api
nano .env
```

### Passo 2: Adicionar/Atualizar `ALLOWED_ORIGINS`

Adicione ou atualize a variável `ALLOWED_ORIGINS`:

```env
# Origens permitidas para CORS (separadas por vírgula)
ALLOWED_ORIGINS=http://72.60.60.118:3000,http://localhost:3000,http://localhost:3001
```

**IMPORTANTE:** 
- Inclua `http://72.60.60.118:3000` (frontend)
- Separe múltiplas origens por vírgula
- Não inclua espaços extras

### Passo 3: Atualizar `FRONTEND_URL` (opcional mas recomendado)

```env
# Frontend URL (para links em emails e WhatsApp)
FRONTEND_URL=http://72.60.60.118:3000
```

### Passo 4: Reiniciar o Backend

```bash
# Reiniciar o backend
pm2 restart gruas-backend

# Verificar logs
pm2 logs gruas-backend --lines 50
```

### Passo 5: Verificar

O backend deve mostrar no log:
```
🔒 CORS: RESTRITO - Origens permitidas: http://72.60.60.118:3000, ...
```

## 📝 Arquivo `.env` Completo do Backend (Exemplo)

```env
# Supabase Configuration
SUPABASE_URL=https://mghdktkoejobsmdbvssl.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# JWT Configuration
JWT_SECRET=...
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://72.60.60.118:3000

# Frontend URL (para links em emails e WhatsApp)
FRONTEND_URL=http://72.60.60.118:3000

# Origens permitidas para CORS (separadas por vírgula)
ALLOWED_ORIGINS=http://72.60.60.118:3000,http://localhost:3000,http://localhost:3001

# ... outras configurações ...
```

## 🔍 Como Verificar se Funcionou

1. **Verificar logs do backend:**
   ```bash
   pm2 logs gruas-backend | grep CORS
   ```

2. **Testar no navegador:**
   - Abra o DevTools (F12)
   - Vá na aba Network
   - Tente acessar a rota `evolucao-mensal`
   - Verifique que não há mais erro de CORS

3. **Testar diretamente:**
   ```bash
   curl -H "Origin: http://72.60.60.118:3000" \
        -H "Authorization: Bearer SEU_TOKEN" \
        http://72.60.60.118:3001/api/relatorios/dashboard/evolucao-mensal?meses=6
   ```

## ⚠️ Importante

- **Em produção**, o backend bloqueia requisições de origens não permitidas
- **Sempre inclua** `http://72.60.60.118:3000` na lista `ALLOWED_ORIGINS`
- **Reinicie o backend** após alterar o `.env`

## 🐛 Debug

Se ainda tiver erro de CORS:

1. **Verificar se a variável está definida:**
   ```bash
   pm2 env gruas-backend | grep ALLOWED_ORIGINS
   ```

2. **Verificar logs do backend:**
   ```bash
   pm2 logs gruas-backend --lines 100 | grep -i cors
   ```

3. **Verificar se o backend está em produção:**
   ```bash
   pm2 env gruas-backend | grep NODE_ENV
   ```

4. **Se necessário, adicionar origem manualmente no código:**
   - Edite `backend-api/src/server.js`
   - Adicione `http://72.60.60.118:3000` na lista `devOrigins` (linha 158)

