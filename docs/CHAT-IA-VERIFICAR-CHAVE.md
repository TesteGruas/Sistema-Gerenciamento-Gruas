# 🔍 Como Verificar se a Chave do Gemini Está Funcionando

## 🚀 Verificação Rápida

Execute o script de verificação:

```bash
cd backend-api
npm run verificar-chave-gemini
```

Ou diretamente:

```bash
cd backend-api
node scripts/verificar-chave-gemini.js
```

## 📋 O que o Script Faz

1. ✅ Verifica se o arquivo `.env` existe e está sendo lido
2. ✅ Verifica se a variável `GOOGLE_GEMINI_API_KEY` está configurada
3. ✅ Valida o formato da chave (deve começar com "AIza")
4. ✅ Testa a chave fazendo uma requisição real à API do Gemini
5. ✅ Informa se está tudo funcionando ou qual é o problema

## 🔧 Problemas Comuns e Soluções

### ❌ Erro: "API key not valid"

**Possíveis causas:**
1. Chave incorreta ou incompleta
2. Chave foi revogada/expirada
3. Chave não tem permissões para usar a API do Gemini
4. Servidor não foi reiniciado após atualizar o .env

**Soluções:**
1. Verifique se a chave está completa (sem espaços)
2. Crie uma nova chave em: https://aistudio.google.com/apikey
3. Reinicie o servidor após atualizar o .env
4. Verifique se a chave tem permissões no Google AI Studio

### ❌ Erro: "GOOGLE_GEMINI_API_KEY não encontrada"

**Causa:** A variável não está no arquivo .env ou o servidor não está lendo o arquivo.

**Solução:**
1. Verifique se o arquivo está em `backend-api/.env` (não na raiz)
2. Verifique se a linha está correta: `GOOGLE_GEMINI_API_KEY=sua_chave_aqui`
3. Certifique-se de que não há espaços antes ou depois do `=`
4. Reinicie o servidor

### ⚠️ Aviso: "A chave não começa com 'AIza'"

**Causa:** A chave pode estar incorreta ou incompleta.

**Solução:**
1. Verifique se copiou a chave completa
2. Certifique-se de que não há espaços ou caracteres extras
3. Crie uma nova chave se necessário

## 📝 Exemplo de Saída do Script

### ✅ Sucesso

```
🔍 Verificando configuração da chave do Google Gemini...

📁 Caminho do .env: /caminho/para/backend-api/.env

📋 Configurações encontradas:
   Modelo: gemini-2.5-flash-lite
   Chave API: AIzaSyBXneKSJ4CysIwK0...

🧪 Testando chave com uma requisição simples...
   Tentando modelo: gemini-2.5-flash-lite

✅ SUCESSO! Chave está funcionando corretamente!
   Resposta do modelo: OK

🎉 Tudo configurado corretamente!
```

### ❌ Erro

```
🔍 Verificando configuração da chave do Google Gemini...

📁 Caminho do .env: /caminho/para/backend-api/.env

📋 Configurações encontradas:
   Modelo: gemini-2.5-flash-lite
   Chave API: AIzaSyBXneKSJ4CysIwK0...

🧪 Testando chave com uma requisição simples...
   Tentando modelo: gemini-2.5-flash-lite

❌ ERRO ao testar a chave:
   Mensagem: API key not valid. Please pass a valid API key.

💡 Problema: Chave de API inválida

🔧 Soluções possíveis:
   1. Verifique se copiou a chave completa (sem espaços)
   2. Verifique se a chave foi criada corretamente no Google AI Studio
   3. Acesse: https://aistudio.google.com/apikey
   4. Crie uma nova chave se necessário
   5. Certifique-se de que a chave tem permissões para usar a API do Gemini
```

## 🔄 Após Corrigir a Chave

1. **Atualize o arquivo `.env`** com a chave correta
2. **Reinicie o servidor:**
   ```bash
   # Se usar PM2
   pm2 restart backend-api
   
   # Ou
   npm run start
   ```
3. **Execute o script novamente** para verificar:
   ```bash
   npm run verificar-chave-gemini
   ```
4. **Teste o chat** no sistema

## 📚 Referências

- [Google AI Studio - API Keys](https://aistudio.google.com/apikey)
- [Documentação Gemini API](https://ai.google.dev/gemini-api/docs)
- [Guia de Nova Chave](./CHAT-IA-NOVA-CHAVE-API.md)
