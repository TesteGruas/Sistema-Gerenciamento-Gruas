# Configuração de CORS

## Problema

Após reiniciar o backend, você está recebendo erros de CORS:
```
Erro de CORS - fetch - obras?limit=1000
Erro de CORS - fetch - clientes?limit=1000
Erro de CORS - fetch - funcionarios?limit=1000
Erro de CORS - fetch - gruas?limit=1000
```

## Solução

A origem `http://72.60.60.118:3000` precisa estar na lista de origens permitidas do backend.

### 1. Configurar Variável de Ambiente

No arquivo `.env` do backend (`backend-api/.env`), adicione ou atualize:

```env
# Frontend URL (para links em emails e WhatsApp)
FRONTEND_URL=http://72.60.60.118:3000

# Origens permitidas para CORS (separadas por vírgula)
ALLOWED_ORIGINS=http://localhost:3000,http://72.60.60.118:3000,http://127.0.0.1:3000
```

### 2. Reiniciar o Backend

Após atualizar o arquivo `.env`, reinicie o backend:

```bash
# Se estiver usando PM2
pm2 restart backend-api

# Ou se estiver rodando diretamente
cd backend-api
npm start
```

### 3. Verificar se Funcionou

Teste o endpoint de CORS:

```bash
curl -H "Origin: http://72.60.60.118:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://72.60.60.118:3001/api/test-cors
```

Deve retornar status 200 com os headers CORS.

## Origens Já Configuradas no Código

O código já inclui as seguintes origens por padrão:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3001`
- `http://72.60.60.118:3000`
- `http://72.60.60.118:3001`

## Modo Desenvolvimento vs Produção

### Desenvolvimento
- Permite qualquer origem se `NODE_ENV=development`
- Loga avisos mas não bloqueia requisições

### Produção
- Apenas origens na lista `allowedOrigins` são permitidas
- Requisições de origens não permitidas retornam erro 403

## Troubleshooting

### 1. Verificar Logs do Backend

Os logs mostrarão quando uma origem é bloqueada:
```
🚫 CORS bloqueado: Origin http://exemplo.com não está na lista de origens permitidas
📋 Origens permitidas: http://localhost:3000, http://72.60.60.118:3000
```

### 2. Verificar Variáveis de Ambiente

```bash
# No servidor, verificar se as variáveis estão configuradas
cd backend-api
cat .env | grep -E "FRONTEND_URL|ALLOWED_ORIGINS"
```

### 3. Testar Endpoint de CORS

```bash
# Testar se o CORS está funcionando
curl -X GET http://72.60.60.118:3001/test-cors \
  -H "Origin: http://72.60.60.118:3000" \
  -v
```

Deve retornar os headers:
```
Access-Control-Allow-Origin: http://72.60.60.118:3000
Access-Control-Allow-Credentials: true
```

### 4. Verificar se o Backend Está Rodando

```bash
# Verificar se o backend está acessível
curl http://72.60.60.118:3001/api/health

# Ou verificar processos
pm2 list
```

## Configuração Completa do .env

Exemplo completo do arquivo `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://72.60.60.118:3000

# Frontend URL (para links em emails e WhatsApp)
FRONTEND_URL=http://72.60.60.118:3000

# Origens permitidas para CORS (separadas por vírgula)
ALLOWED_ORIGINS=http://localhost:3000,http://72.60.60.118:3000,http://127.0.0.1:3000
```

## Notas Importantes

1. **Sempre reinicie o backend** após alterar variáveis de ambiente
2. **Em produção**, use apenas origens específicas (não use `*`)
3. **Verifique os logs** se ainda houver problemas de CORS
4. **O frontend deve usar a mesma URL** configurada em `FRONTEND_URL`

