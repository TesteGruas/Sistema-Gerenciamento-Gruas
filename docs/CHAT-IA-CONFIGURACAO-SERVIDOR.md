# 🚀 Configuração Rápida do Chat no Servidor

## Problema
O chat não aparece porque falta a chave da API do Google Gemini no arquivo `.env` do backend.

## Solução Rápida

### Passo 1: Obter a Chave da API do Google Gemini

1. Acesse: **https://aistudio.google.com/apikey**
2. Faça login com sua conta Google
3. Clique em **"Create API Key"** ou **"Get API Key"**
4. Copie a chave gerada (começa com `AIza...`)

> 💡 **Gratuito**: O tier gratuito oferece 60 requisições/minuto e 1.500 requisições/dia

### Passo 2: Adicionar no `.env` do Backend

No servidor, edite o arquivo `.env` na pasta `backend-api/`:

```bash
cd /home/Sistema-Gerenciamento-Gruas/backend-api
nano .env
```

Adicione estas linhas no final do arquivo:

```bash
# ========================================
# CONFIGURAÇÃO DO CHAT DE IA
# ========================================
# Google Gemini AI Configuration (para Chat de IA)
# Obtenha sua chave gratuita em: https://aistudio.google.com/apikey
GOOGLE_GEMINI_API_KEY=sua_chave_aqui
# Modelo do Gemini (padrão: gemini-2.5-flash-lite - 10 RPM, ideal para chat)
GEMINI_MODEL=gemini-2.5-flash-lite
```

**Exemplo:**
```bash
GOOGLE_GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-2.5-flash-lite
```

> ⚠️ **IMPORTANTE**: Nunca compartilhe sua chave de API publicamente. Se sua chave for exposta, ela será desabilitada automaticamente pelo Google por segurança.

### Passo 3: Reiniciar o Servidor Backend

Após adicionar a variável, reinicie o servidor:

```bash
# Se estiver usando PM2
pm2 restart backend-api

# Ou se estiver rodando diretamente
cd /home/Sistema-Gerenciamento-Gruas/backend-api
npm run start
# ou
node src/server.js
```

### Passo 4: Verificar se Funcionou

1. Acesse o sistema no navegador
2. Você deve ver um botão flutuante de chat no canto inferior direito
3. Clique no botão e teste enviando uma mensagem

## Verificação Rápida

Para verificar se a variável está configurada corretamente:

```bash
cd /home/Sistema-Gerenciamento-Gruas/backend-api
node -e "require('dotenv').config(); console.log('API Key:', process.env.GOOGLE_GEMINI_API_KEY ? '✅ Configurada' : '❌ Não encontrada')"
```

Se aparecer `✅ Configurada`, está tudo certo!

## Troubleshooting

### O chat não aparece
- ✅ Verifique se `GOOGLE_GEMINI_API_KEY` está no `.env` do backend
- ✅ Verifique se o servidor foi reiniciado após adicionar a variável
- ✅ Verifique os logs do servidor para erros

### Erro: "Serviço de IA não configurado"
- A chave da API não está configurada ou está incorreta
- Verifique se não há espaços extras na chave
- Reinicie o servidor

### Erro: "Limite de requisições excedido"
- O tier gratuito tem limite de 1.500 requisições/dia
- Aguarde o reset diário ou faça upgrade

## Estrutura do Arquivo .env Completo

Seu arquivo `.env` do backend deve ter algo assim:

```bash
# Supabase
SUPABASE_URL=https://mghdktkoejobsmdbvssl.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Servidor
NODE_ENV=development
PORT=3001
JWT_SECRET=...

# Email
EMAIL_ENCRYPTION_KEY=...
EMAIL_FROM_DEFAULT=...

# Chat de IA (ADICIONAR ESTA SEÇÃO)
GOOGLE_GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-2.5-flash
```

## Links Úteis

- **Obter API Key**: https://aistudio.google.com/apikey
- **Gerenciar Chaves**: https://aistudio.google.com/app/apikeys
- **Documentação**: https://ai.google.dev/gemini-api/docs/api-key

---

✅ **Pronto!** Após seguir estes passos, o chat deve aparecer e funcionar normalmente.
