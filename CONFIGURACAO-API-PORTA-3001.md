# 🔧 Configuração: API na Porta 3001

## 📋 Resumo

Todas as chamadas de API devem usar a porta **3001** (backend). O frontend roda na porta **3000** e faz proxy das requisições `/api/*` para o backend na porta 3001 através do rewrite do Next.js.

## ✅ Correções Aplicadas

### 1. **`lib/api.ts`**
   - ✅ `buildApiUrl()` agora usa URLs relativas (`/api/...`) no cliente
   - ✅ Axios usa URL relativa no cliente para aproveitar o rewrite do Next.js
   - ✅ No servidor (SSR), usa URL absoluta

### 2. **`next.config.mjs`**
   - ✅ Rewrite configurado para redirecionar `/api/*` → `http://72.60.60.118:3001/api/*` em produção
   - ✅ Fallback correto para porta 3001

### 3. **Arquivos Corrigidos**
   - ✅ `app/pwa/login/page.tsx` - usa `/api/auth/login`
   - ✅ `app/pwa/gerenciar-funcionarios/page.tsx` - usa `/api/funcionarios`
   - ✅ `app/pwa/page.tsx` - usa `/api/funcionarios`
   - ✅ `app/pwa/holerites/page.tsx` - usa `/api/funcionarios`

## 🚀 Configuração no Servidor

### Passo 1: Criar/Atualizar arquivo `.env` na raiz do projeto

```bash
cd ~/Sistema-Gerenciamento-Gruas
nano .env
```

Adicione ou atualize:

```env
# Configurações do projeto
NODE_ENV=production

# Configurações da API
# IMPORTANTE: NÃO incluir /api no final
NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001
```

### Passo 2: Atualizar `ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: "gruas-frontend",
      cwd: "/home/Sistema-Gerenciamento-Gruas",
      script: "node",
      args: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NEXT_PUBLIC_API_URL: "http://72.60.60.118:3001"  // ← SEM /api no final
      }
    }
  ]
};
```

### Passo 3: Rebuild do Next.js

**CRÍTICO:** Variáveis `NEXT_PUBLIC_*` são injetadas no código durante o BUILD. Você DEVE fazer rebuild após alterar essas variáveis.

```bash
cd ~/Sistema-Gerenciamento-Gruas

# Definir variáveis de ambiente para o build
export NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
export NODE_ENV=production

# Fazer o build
npm run build

# Reiniciar o PM2
pm2 restart gruas-frontend
```

### Passo 4: Verificar

```bash
# Verificar logs
pm2 logs gruas-frontend --lines 50

# Testar a API diretamente
curl http://72.60.60.118:3001/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

## 🔍 Como Funciona

### No Cliente (Browser)
1. Código faz: `fetch('/api/funcionarios')`
2. Next.js intercepta e faz rewrite: `/api/funcionarios` → `http://72.60.60.118:3001/api/funcionarios`
3. Requisição vai para o backend na porta 3001 ✅

### No Servidor (SSR)
1. Código usa URL absoluta: `http://72.60.60.118:3001/api/funcionarios`
2. Requisição vai direto para o backend ✅

## ⚠️ Importante

1. **Variáveis `NEXT_PUBLIC_*` são injetadas no BUILD TIME**
   - Se você mudar depois do build, precisa fazer rebuild
   - Não adicione `/api` no final da URL - o Next.js adiciona automaticamente

2. **URLs Relativas vs Absolutas**
   - No cliente: sempre use URLs relativas (`/api/...`) para aproveitar o rewrite
   - No servidor: use URLs absolutas quando necessário

3. **Portas**
   - Frontend: 3000 (Next.js)
   - Backend: 3001 (API)
   - O rewrite do Next.js faz o proxy automaticamente

## 🐛 Debug

Se ainda estiver usando porta 3000:

1. **Verificar variável durante o build:**
   ```bash
   echo $NEXT_PUBLIC_API_URL
   # Deve mostrar: http://72.60.60.118:3001
   ```

2. **Verificar código compilado:**
   ```bash
   grep -r "72.60.60.118" .next/standalone/server.js | head -5
   ```

3. **Verificar rewrite:**
   - O rewrite está em `next.config.mjs` linha 160-191
   - Deve redirecionar `/api/*` para `http://72.60.60.118:3001/api/*`

4. **Limpar cache e rebuild:**
   ```bash
   rm -rf .next
   npm run build
   pm2 restart gruas-frontend
   ```

## 📝 Checklist

- [ ] Arquivo `.env` criado/atualizado com `NEXT_PUBLIC_API_URL=http://72.60.60.118:3001`
- [ ] `ecosystem.config.js` atualizado com a variável
- [ ] Build feito com a variável definida: `export NEXT_PUBLIC_API_URL=... && npm run build`
- [ ] PM2 reiniciado: `pm2 restart gruas-frontend`
- [ ] Testado no navegador - verificar Network tab que está usando porta 3001

