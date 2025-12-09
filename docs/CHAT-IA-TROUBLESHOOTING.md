# 🔧 Troubleshooting - Chat de IA

## Problema: "Serviço de IA não configurado"

### ✅ Solução Rápida

**O servidor backend precisa ser reiniciado após adicionar a chave da API!**

### Passos para Resolver:

1. **Pare o servidor backend** (Ctrl+C no terminal onde está rodando)

2. **Verifique se a chave está no .env:**
   ```bash
   cd backend-api
   cat .env | grep GOOGLE_GEMINI
   ```
   
   Deve mostrar:
   ```
   GOOGLE_GEMINI_API_KEY=sua_chave_aqui
   ```
   
   > ⚠️ **NUNCA** compartilhe sua chave de API publicamente. Se exposta, ela será desabilitada automaticamente.

3. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

4. **Verifique os logs do servidor:**
   - Deve aparecer: `✅ Servidor - GOOGLE_GEMINI_API_KEY configurada`
   - Se aparecer: `⚠️ Servidor - GOOGLE_GEMINI_API_KEY não encontrada`, verifique o arquivo .env

5. **Teste novamente o chat**

### Verificação Rápida

Execute este comando para verificar se a variável está sendo lida:

```bash
cd backend-api
node -e "require('dotenv').config(); console.log('API Key:', process.env.GOOGLE_GEMINI_API_KEY ? '✅ Configurada' : '❌ Não encontrada')"
```

### Problemas Comuns

#### 1. Servidor não foi reiniciado
- **Sintoma:** Erro "Serviço de IA não configurado"
- **Solução:** Reinicie o servidor backend

#### 2. Arquivo .env no lugar errado
- **Sintoma:** Variável não encontrada mesmo após reiniciar
- **Solução:** Certifique-se de que o arquivo `.env` está em `backend-api/.env` (não na raiz do projeto)

#### 3. Espaços ou caracteres especiais na chave
- **Sintoma:** Erro ao fazer requisição
- **Solução:** Verifique se não há espaços antes ou depois do `=` no .env:
   ```
   ✅ Correto: GOOGLE_GEMINI_API_KEY=sua_chave_aqui
   ❌ Errado: GOOGLE_GEMINI_API_KEY = sua_chave_aqui
   
   > ⚠️ **NUNCA** compartilhe sua chave de API em commits, documentação pública ou repositórios.
   ```

#### 4. Chave inválida ou expirada
- **Sintoma:** Erro 401 ou 403 da API do Gemini
- **Solução:** Gere uma nova chave em https://makersuite.google.com/app/apikey

### Logs de Debug

O servidor agora mostra logs detalhados:
- `✅ Servidor - GOOGLE_GEMINI_API_KEY configurada` - Tudo OK
- `⚠️ Servidor - GOOGLE_GEMINI_API_KEY não encontrada` - Verifique o .env
- `🔍 [Chat IA] Verificando API key: ...` - Log de cada requisição

### Teste Manual da API

Para testar se a API está funcionando:

```bash
curl -X POST http://localhost:3001/api/chat-ia \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"message": "Olá, como você está?"}'
```

### Ainda não funciona?

1. Verifique os logs do servidor backend
2. Verifique o console do navegador (F12)
3. Verifique se o backend está rodando na porta correta (3001)
4. Verifique se o frontend está apontando para a URL correta do backend

