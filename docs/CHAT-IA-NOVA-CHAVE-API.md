# 🔑 Como Criar uma Nova Chave de API do Google Gemini

## ⚠️ Problema: Chave de API Reportada como Vazada

Se você recebeu o erro:
```
[403 Forbidden] Your API key was reported as leaked. Please use another API key.
```

Isso significa que sua chave de API foi exposta publicamente (em commits, documentação, repositórios públicos, etc.) e foi automaticamente desabilitada pelo Google por segurança.

## ✅ Solução: Criar uma Nova Chave

### Passo 1: Acessar o Google AI Studio

1. Acesse: **https://aistudio.google.com/apikey**
2. Faça login com sua conta Google
3. Você verá suas chaves de API existentes

### Passo 2: Criar Nova Chave

1. Clique em **"Create API Key"** ou **"Get API Key"**
2. Selecione o projeto (ex: "Gruas")
3. Clique em **"Create API key in new project"** ou selecione um projeto existente
4. **Copie a nova chave** gerada (começa com `AIza...`)

### Passo 3: Revogar a Chave Antiga (Recomendado)

1. No painel de chaves, encontre a chave antiga (vazada)
2. Clique nos **três pontos** (⋮) ao lado da chave
3. Selecione **"Delete"** ou **"Revoke"**
4. Confirme a exclusão

> 💡 **Dica**: É uma boa prática revogar chaves antigas que foram expostas para evitar uso não autorizado.

### Passo 4: Atualizar no Backend

1. Abra o arquivo `.env` na pasta `backend-api/`
2. **Substitua** a chave antiga pela nova:

```bash
# Antes (chave vazada - NÃO USE)
# GOOGLE_GEMINI_API_KEY=AIzaSyAY75VeolQjTrpf0YtOEHmRk_carKr-zNs

# Agora (nova chave)
GOOGLE_GEMINI_API_KEY=sua_nova_chave_aqui
GEMINI_MODEL=gemini-2.5-flash-lite
```

3. **Salve** o arquivo

### Passo 5: Reiniciar o Servidor

```bash
cd backend-api

# Se estiver usando PM2
pm2 restart backend-api

# Ou se estiver rodando diretamente
npm run start
# ou
node src/server.js
```

### Passo 6: Verificar se Funcionou

1. Acesse o sistema no navegador
2. Teste o chat de IA
3. Se funcionar, está tudo certo! ✅

## 🔒 Boas Práticas de Segurança

### ✅ FAÇA:

- ✅ Mantenha a chave de API **apenas no arquivo `.env`**
- ✅ Adicione `.env` ao `.gitignore` (nunca commite o `.env`)
- ✅ Use variáveis de ambiente no servidor de produção
- ✅ Revogue chaves antigas que foram expostas
- ✅ Use chaves diferentes para desenvolvimento e produção

### ❌ NÃO FAÇA:

- ❌ **NUNCA** commite a chave de API no Git
- ❌ **NUNCA** compartilhe a chave em documentação pública
- ❌ **NUNCA** coloque a chave em código fonte
- ❌ **NUNCA** compartilhe a chave em mensagens, emails ou chats
- ❌ **NUNCA** use a mesma chave em múltiplos projetos públicos

## 🛡️ Verificar se .env está no .gitignore

Para garantir que sua chave não seja commitada acidentalmente:

```bash
# Verificar se .env está no .gitignore
cat .gitignore | grep -E "^\.env$|^\.env$"

# Se não estiver, adicione:
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

## 🔍 Verificar Commits Antigos

Se você já commitou a chave acidentalmente:

1. **Remova do histórico do Git** (se o repositório for privado):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend-api/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

2. **Ou crie uma nova chave** (mais seguro se o repositório for público)

3. **Force push** (apenas se tiver certeza):
   ```bash
   git push origin --force --all
   ```

> ⚠️ **ATENÇÃO**: Force push pode afetar outros desenvolvedores. Use com cuidado!

## 📊 Verificar Uso da Nova Chave

Após criar a nova chave, você pode verificar o uso em:

- **Dashboard**: https://ai.dev/usage?tab=rate-limit
- **API Keys**: https://aistudio.google.com/app/apikeys

## 🆘 Problemas Comuns

### Erro 403 ainda aparece

- Verifique se atualizou o `.env` corretamente
- Verifique se reiniciou o servidor
- Verifique se a nova chave foi criada corretamente
- Aguarde alguns minutos (pode haver cache)

### Não consigo criar nova chave

- Verifique se tem permissões no projeto do Google Cloud
- Verifique se não excedeu o limite de chaves por projeto
- Tente criar em um projeto diferente

### Chave funciona localmente mas não no servidor

- Verifique se a variável de ambiente está configurada no servidor
- Verifique se o servidor foi reiniciado após adicionar a variável
- Verifique se o arquivo `.env` está no diretório correto no servidor

## 📚 Referências

- [Google AI Studio - API Keys](https://aistudio.google.com/apikey)
- [Documentação Gemini API](https://ai.google.dev/gemini-api/docs)
- [Boas Práticas de Segurança](https://ai.google.dev/gemini-api/docs/safety-settings)
