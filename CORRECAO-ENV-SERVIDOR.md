# 🔧 Correção do .env no Servidor

## ❌ Problemas Encontrados no seu .env

1. **`NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3000/api`**
   - ❌ Está usando porta **3000** (porta do frontend)
   - ❌ Tem `/api` no final (não deve ter)
   - ✅ Deve ser: `http://72.60.60.118:3001`

2. **`NEXT_PUBLIC_API_URL=http://72.60.60.118:3001`**
   - ✅ Porta correta (3001)
   - ⚠️ Se tiver `/api` no final, remover

## ✅ Correção

Substitua as linhas de configuração da API no seu `.env`:

```env
# Configurações da API - SERVIDOR DE PRODUÇÃO
# IMPORTANTE: 
# - PORT=3000 é do FRONTEND (Next.js)
# - Porta 3001 é do BACKEND (API)
# - NÃO incluir /api no final - o Next.js adiciona automaticamente
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001
NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
```

## 📝 Arquivo .env Completo Corrigido

```env
# Configurações do Supabase
PUBLIC_SUPABASE_URL=https://mghdktkoejobsmdbvssl.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naGRrdGtvZWpvYnNtZGJ2c3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDYzODcsImV4cCI6MjA3MjcyMjM4N30.9XpjiPOnY2BzulrpH6Cw3ZubTSbZ2NH5BH45tarXelA

# Configurações do projeto
NODE_ENV=production
PORT=3000

# Configurações de segurança
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# Configurações de e-mail (para notificações)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Configurações de backup
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Configurações da API - SERVIDOR DE PRODUÇÃO
# IMPORTANTE: 
# - PORT=3000 é do FRONTEND (Next.js)
# - Porta 3001 é do BACKEND (API)
# - NÃO incluir /api no final - o Next.js adiciona automaticamente
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001
NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
```

## 🚀 Passos para Aplicar

### 1. Editar o .env no servidor

```bash
cd ~/Sistema-Gerenciamento-Gruas
nano .env
```

### 2. Corrigir as linhas da API

Altere de:
```env
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3000/api
NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
```

Para:
```env
NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001
NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
```

### 3. Salvar e fazer rebuild

**CRÍTICO:** Variáveis `NEXT_PUBLIC_*` são injetadas no código durante o BUILD. Você DEVE fazer rebuild após alterar.

```bash
# Definir variáveis para o build
export NEXT_PUBLIC_API_URL=http://72.60.60.118:3001
export NEXT_PUBLIC_API_BASE_URL=http://72.60.60.118:3001
export NODE_ENV=production

# Fazer rebuild
npm run build

# Reiniciar PM2
pm2 restart gruas-frontend
```

### 4. Verificar

```bash
# Verificar logs
pm2 logs gruas-frontend --lines 50

# Testar no navegador
# Abra o DevTools (F12) > Network
# Tente fazer login
# Verifique que as requisições vão para porta 3001
```

## 🔍 Por que isso aconteceu?

- **Porta 3000** = Frontend (Next.js) - onde o usuário acessa
- **Porta 3001** = Backend (API) - onde estão os dados

O frontend faz proxy das requisições `/api/*` para o backend na porta 3001 através do rewrite do Next.js configurado em `next.config.mjs`.

## ⚠️ Importante

1. **NÃO incluir `/api` no final** das URLs porque:
   - O Next.js já adiciona `/api` no rewrite
   - Se você adicionar, fica `/api/api/...` (duplicado)

2. **Sempre fazer rebuild** após alterar variáveis `NEXT_PUBLIC_*`

3. **Verificar no navegador** após o rebuild para confirmar que está usando porta 3001

