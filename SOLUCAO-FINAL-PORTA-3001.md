# ✅ Solução Final: Forçar Porta 3001 em Todas as Requisições

## 🔧 Correções Aplicadas

### 1. **`lib/api.ts`**
   - ✅ `buildApiUrl()` usa URLs relativas (`/api/...`) no cliente
   - ✅ Axios usa URL relativa no cliente

### 2. **`app/lib/auth.ts`**
   - ✅ Criado método `getApiUrl()` que usa URLs relativas no cliente
   - ✅ Todas as chamadas `/api/auth/login` e `/api/auth/me` agora usam URLs relativas

### 3. **`lib/user-context.tsx`**
   - ✅ Login usa URL relativa `/api/auth/login`

### 4. **`app/pwa/login/page.tsx`**
   - ✅ Usa URL relativa `/api/auth/login`

### 5. **`next.config.mjs`**
   - ✅ Rewrite configurado para sempre usar porta 3001 em produção

## 🚀 O Que Fazer no Servidor

### Passo 1: Corrigir o `.env`

```bash
cd ~/Sistema-Gerenciamento-Gruas
nano .env
```

**Altere:**
```env
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3000/api
NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
```

**Para:**
```env
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001
NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
```

### Passo 2: Fazer Pull e Rebuild

```bash
# Fazer pull das alterações
git pull

# Limpar build anterior
rm -rf .next

# Definir variáveis para o build
export NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
export NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001
export NODE_ENV=production

# Fazer rebuild
npm run build

# Reiniciar PM2
pm2 restart gruas-frontend
```

### Passo 3: Verificar

```bash
# Ver logs
pm2 logs gruas-frontend --lines 50

# No navegador:
# 1. Abra DevTools (F12)
# 2. Vá na aba Network
# 3. Tente fazer login
# 4. Verifique que as requisições vão para porta 3001
```

## 🔍 Como Funciona Agora

### Antes (ERRADO):
```
Cliente → http://72.60.60.118:3000/api/auth/login ❌
```

### Depois (CORRETO):
```
Cliente → /api/auth/login (URL relativa)
         ↓
Next.js Rewrite → http://72.60.60.118:3001/api/auth/login ✅
```

## ⚠️ Importante

1. **Sempre fazer rebuild** após alterar variáveis `NEXT_PUBLIC_*`
2. **Não incluir `/api`** no final das URLs no `.env`
3. **Verificar no navegador** (DevTools > Network) que está usando porta 3001

## 📝 Checklist

- [ ] `.env` corrigido (porta 3001, sem `/api` no final)
- [ ] `git pull` feito
- [ ] `.next` limpo (`rm -rf .next`)
- [ ] Variáveis exportadas antes do build
- [ ] `npm run build` executado
- [ ] PM2 reiniciado
- [ ] Testado no navegador - verificar Network tab

