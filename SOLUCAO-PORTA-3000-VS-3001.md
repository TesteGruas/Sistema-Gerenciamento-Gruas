# 🔧 Solução: Backend chamando porta 3000 em vez de 3001

## 📋 Problema Identificado

O frontend está fazendo requisições para `http://72.60.60.118:3000/api/auth/login` em vez de `http://72.60.60.118:3001/api/auth/login`.

## ✅ Correções Aplicadas

### 1. **Correção no `next.config.mjs`**
   - O rewrite agora garante que em produção sempre use a porta 3001
   - Fallback corrigido para usar `http://72.60.60.118:3001` em produção

### 2. **Correção no `app/pwa/login/page.tsx`**
   - Alterado para usar o rewrite do Next.js (`/api/auth/login`) em vez de construir URL manualmente
   - Isso garante que sempre use a configuração do `next.config.mjs`

## 🚀 Passos para Aplicar no Servidor

### Passo 1: Fazer pull das alterações
```bash
cd ~/Sistema-Gerenciamento-Gruas
git pull origin main  # ou a branch que você está usando
```

### Passo 2: Rebuild do Next.js
**IMPORTANTE:** Variáveis `NEXT_PUBLIC_*` precisam estar definidas durante o BUILD, não apenas no runtime.

```bash
# Definir variável de ambiente para o build
export NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
export NODE_ENV=production

# Fazer o build
npm run build
```

### Passo 3: Atualizar o `ecosystem.config.js` no servidor

Edite o arquivo `ecosystem.config.js` e adicione a variável:

```javascript
module.exports = {
  apps: [
    {
      name: "gruas-frontend",  // ← Use o nome correto que está no PM2
      cwd: "/home/Sistema-Gerenciamento-Gruas",
      script: "node",
      args: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NEXT_PUBLIC_API_URL: "http://72.60.60.118:3001"  // ← ADICIONAR ESTA LINHA
      }
    }
  ]
};
```

### Passo 4: Reiniciar o PM2
```bash
pm2 restart gruas-frontend
# ou
pm2 reload ecosystem.config.js
```

### Passo 5: Verificar se está funcionando

Execute o script de debug:
```bash
bash scripts/debug-api-url.sh
```

Ou teste manualmente:
```bash
# Verificar logs do PM2
pm2 logs gruas-frontend --lines 50

# Testar a API diretamente
curl -X POST http://72.60.60.118:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

## 🔍 Debug Adicional

Se o problema persistir, verifique:

1. **Variável durante o build:**
   ```bash
   # Verificar se a variável está definida
   echo $NEXT_PUBLIC_API_URL
   ```

2. **Código compilado:**
   ```bash
   # Verificar se o IP correto está no código compilado
   grep -r "72.60.60.118" .next/standalone/server.js | head -5
   ```

3. **Logs do navegador:**
   - Abra o DevTools (F12)
   - Vá na aba Network
   - Tente fazer login
   - Verifique qual URL está sendo chamada

4. **Verificar rewrite do Next.js:**
   ```bash
   # O rewrite deve estar redirecionando /api/* para http://72.60.60.118:3001/api/*
   # Isso é configurado no next.config.mjs
   ```

## ⚠️ Importante

- Variáveis `NEXT_PUBLIC_*` são injetadas no código durante o BUILD
- Se você mudar a variável depois do build, precisa fazer rebuild
- O rewrite do Next.js é avaliado no BUILD TIME, não no RUNTIME
- Por isso é importante definir `NEXT_PUBLIC_API_URL` antes de fazer `npm run build`

## 📝 Resumo da Solução

1. ✅ Código alterado para usar rewrite do Next.js (`/api/auth/login`)
2. ✅ `next.config.mjs` corrigido para sempre usar porta 3001 em produção
3. ⚠️ **AÇÃO NECESSÁRIA NO SERVIDOR:** Fazer rebuild com `NEXT_PUBLIC_API_URL=http://72.60.60.118:3001`

