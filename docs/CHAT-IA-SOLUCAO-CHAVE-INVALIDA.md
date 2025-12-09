# ✅ Solução: Chave de API Inválida

## 🔍 Diagnóstico

O script de verificação confirmou que:
- ✅ A chave está correta no arquivo `.env`
- ✅ A chave está no formato correto (começa com "AIza", 39 caracteres)
- ✅ A chave funciona quando testada diretamente
- ✅ O modelo `gemini-2.5-flash-lite` está disponível

## ⚠️ Problema Provável

O servidor backend **não foi reiniciado** após atualizar o arquivo `.env`.

O Node.js carrega as variáveis de ambiente apenas quando o processo inicia. Se você atualizou o `.env` sem reiniciar o servidor, ele ainda está usando a chave antiga (ou nenhuma chave).

## ✅ Solução: Reiniciar o Servidor

### Opção 1: Se estiver usando PM2

```bash
cd backend-api
pm2 restart backend-api
# ou
pm2 restart all
```

### Opção 2: Se estiver rodando diretamente

1. **Pare o servidor** (Ctrl+C no terminal onde está rodando)

2. **Inicie novamente:**
   ```bash
   cd backend-api
   npm run start
   # ou
   npm run dev
   # ou
   node src/server.js
   ```

### Opção 3: Verificar se o servidor carregou a chave

Após reiniciar, verifique os logs do servidor. Você deve ver:

```
✅ Servidor - GOOGLE_GEMINI_API_KEY configurada
```

Se aparecer:
```
⚠️ Servidor - GOOGLE_GEMINI_API_KEY não encontrada no .env
```

Então há um problema com o caminho do `.env` ou o arquivo não está sendo lido.

## 🧪 Testar a Chave Manualmente

Execute o script de verificação:

```bash
cd backend-api
node scripts/verificar-chave-gemini.js
```

Este script:
- ✅ Verifica se a chave está no `.env`
- ✅ Valida o formato da chave
- ✅ Testa a chave fazendo uma requisição real à API
- ✅ Mostra erros detalhados se houver problema

## 📋 Checklist de Verificação

- [ ] A chave está no arquivo `backend-api/.env`
- [ ] A chave começa com `AIza` e tem mais de 30 caracteres
- [ ] Não há espaços antes ou depois da chave no `.env`
- [ ] O servidor foi **reiniciado** após atualizar o `.env`
- [ ] Os logs do servidor mostram: `✅ Servidor - GOOGLE_GEMINI_API_KEY configurada`
- [ ] O script de verificação passa: `node scripts/verificar-chave-gemini.js`

## 🔧 Se Ainda Não Funcionar

### 1. Verificar o caminho do .env

O servidor procura o `.env` em `backend-api/.env`. Verifique:

```bash
cd backend-api
ls -la .env
cat .env | grep GOOGLE_GEMINI
```

### 2. Verificar se há espaços na chave

```bash
cd backend-api
node -e "require('dotenv').config(); const key = process.env.GOOGLE_GEMINI_API_KEY; console.log('Chave:', JSON.stringify(key)); console.log('Tamanho:', key?.length);"
```

### 3. Verificar se o servidor está lendo o .env

Adicione um log temporário no `server.js`:

```javascript
console.log('Chave carregada:', process.env.GOOGLE_GEMINI_API_KEY ? 'SIM' : 'NÃO');
console.log('Primeiros 20 chars:', process.env.GOOGLE_GEMINI_API_KEY?.substring(0, 20));
```

### 4. Criar uma nova chave

Se nada funcionar, pode ser que a chave tenha sido desabilitada:

1. Acesse: https://aistudio.google.com/apikey
2. Crie uma nova chave
3. Atualize o `.env`
4. Reinicie o servidor

Veja o guia completo: `docs/CHAT-IA-NOVA-CHAVE-API.md`

## 📚 Scripts Úteis

### Verificar chave
```bash
node scripts/verificar-chave-gemini.js
```

### Verificar variáveis de ambiente
```bash
node -e "require('dotenv').config(); console.log('API Key:', process.env.GOOGLE_GEMINI_API_KEY ? '✅ Configurada' : '❌ Não encontrada')"
```

## 🎯 Resumo

**O problema mais comum é não reiniciar o servidor após atualizar o `.env`.**

Sempre que você atualizar o arquivo `.env`:
1. ✅ Pare o servidor
2. ✅ Inicie novamente
3. ✅ Verifique os logs para confirmar que a chave foi carregada
