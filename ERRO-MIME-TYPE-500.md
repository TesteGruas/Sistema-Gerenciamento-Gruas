# Entendendo o Erro de MIME Type com Status 500

## 🔍 Análise do Problema

Os erros que você está vendo indicam que:

1. **Arquivos estáticos retornam erro 500** (Internal Server Error)
2. **O servidor retorna HTML** em vez dos arquivos CSS/JS corretos
3. **O navegador rejeita o HTML** porque espera CSS ou JavaScript

### Erros Observados:
```
Refused to apply style from 'http://localhost:3000/_next/static/css/app/layout.css?v=...' 
because its MIME type ('text/html') is not a supported stylesheet MIME type

GET http://localhost:3000/_next/static/chunks/main-app.js?v=... net::ERR_ABORTED 500 (Internal Server Error)

Refused to execute script from 'http://localhost:3000/_next/static/chunks/main-app.js?v=...' 
because its MIME type ('text/html') is not executable
```

## 🎯 Causa Raiz

Quando o Next.js tenta servir um arquivo estático e encontra um erro interno (500), ele retorna uma página HTML de erro em vez do arquivo solicitado. O navegador então rejeita esse HTML porque espera CSS ou JavaScript.

### Possíveis Causas:

1. **Erro no código causando crash do servidor**
   - Erro de sintaxe ou runtime no código
   - Importação de módulo que não existe
   - Erro em componente do layout ou página inicial

2. **Build corrompido ou incompleto**
   - Build interrompido ou com erros
   - Cache corrompido do Next.js
   - Arquivos estáticos não gerados corretamente

3. **Problema com o servidor de desenvolvimento**
   - Servidor travado ou em estado inconsistente
   - Múltiplas instâncias do servidor rodando
   - Porta 3000 ocupada por outro processo

4. **Problema com configuração**
   - Configuração do `next.config.mjs` causando erro
   - Problema com rewrites ou headers
   - Variáveis de ambiente incorretas

## ✅ Solução Passo a Passo

### Passo 1: Verificar e Parar o Servidor

```bash
# Verificar se há processos do Next.js rodando
ps aux | grep "next dev"

# Parar todos os processos do Next.js
pkill -f "next dev"

# Verificar se a porta 3000 está livre
lsof -i :3000

# Se houver processo na porta 3000, matá-lo
kill -9 $(lsof -t -i:3000)
```

### Passo 2: Limpar Cache e Build

```bash
cd /Users/samuellinkon/Desktop/projeto-grua-final/Sistema-Gerenciamento-Gruas

# Limpar cache do Next.js
rm -rf .next

# Limpar cache do node_modules (opcional mas recomendado)
rm -rf node_modules/.cache

# Limpar cache do navegador (instruções abaixo)
```

### Passo 3: Verificar Erros no Código

```bash
# Verificar erros de TypeScript
npm run lint

# Tentar fazer build para ver se há erros
npm run build
```

Se houver erros no build, corrija-os antes de continuar.

### Passo 4: Rebuild e Reiniciar

```bash
# Rebuild do projeto
npm run build

# Se o build for bem-sucedido, iniciar o servidor
npm run dev
```

### Passo 5: Limpar Cache do Navegador

**Chrome/Edge:**
- Pressione `Cmd+Shift+Delete` (Mac) ou `Ctrl+Shift+Delete` (Windows)
- Ou: DevTools (F12) > Application > Clear storage > Clear site data
- Ou: Use uma janela anônima/privada

**Firefox:**
- Pressione `Cmd+Shift+Delete` (Mac) ou `Ctrl+Shift+Delete` (Windows)
- Ou: DevTools > Storage > Clear All

### Passo 6: Verificar se o Problema Foi Resolvido

1. Abra o DevTools (F12)
2. Vá para a aba Network
3. Recarregue a página (Cmd+Shift+R ou Ctrl+Shift+R)
4. Verifique os arquivos estáticos:
   - Devem retornar status **200** (não 500)
   - Devem ter MIME type correto:
     - CSS: `text/css; charset=utf-8`
     - JS: `application/javascript; charset=utf-8`

## 🔧 Solução Rápida (Script Automático)

Use o script já existente no projeto:

```bash
chmod +x scripts/fix-mime-type-errors.sh
./scripts/fix-mime-type-errors.sh
```

Este script faz automaticamente:
- Para o servidor Next.js
- Limpa o cache do Next.js
- Limpa o cache do node_modules
- Rebuild do projeto

## 🐛 Debug Avançado

Se o problema persistir, verifique:

### 1. Logs do Servidor

Verifique o terminal onde o `npm run dev` está rodando para ver erros específicos.

### 2. Verificar Arquivos Estáticos

```bash
# Verificar se os arquivos existem
ls -la .next/static/css
ls -la .next/static/chunks

# Verificar se há arquivos recentes
find .next/static -type f -mtime -1
```

### 3. Verificar Service Worker

O service worker pode estar interceptando requisições e causando problemas:

1. Abra DevTools (F12)
2. Vá para Application > Service Workers
3. Desregistre todos os service workers
4. Limpe o cache
5. Recarregue a página

### 4. Verificar Configuração

Verifique se o `next.config.mjs` está correto:

```bash
# Verificar sintaxe do arquivo de configuração
node -c next.config.mjs
```

### 5. Testar com Build de Produção

```bash
# Build de produção
npm run build

# Iniciar servidor de produção
npm start
```

Se funcionar em produção mas não em desenvolvimento, o problema pode estar relacionado ao hot-reload ou cache de desenvolvimento.

## 📋 Checklist de Verificação

- [ ] Servidor Next.js parado
- [ ] Cache do Next.js limpo (`.next/` removido)
- [ ] Build executado com sucesso (`npm run build`)
- [ ] Nenhum erro no console do servidor
- [ ] Cache do navegador limpo
- [ ] Service workers desregistrados
- [ ] Arquivos estáticos retornam status 200
- [ ] MIME types corretos nos arquivos estáticos

## ⚠️ Notas Importantes

1. **Nunca defina Content-Type manualmente** nos headers do Next.js para arquivos estáticos. O Next.js já faz isso automaticamente.

2. **O modo `standalone` deve ser usado apenas em produção**. Em desenvolvimento, pode causar problemas.

3. **A ordem dos headers é importante**. Headers específicos (`/_next/static/:path*`) devem vir antes dos genéricos (`/:path*`).

4. **Se o problema persistir**, pode ser necessário verificar se há erros no código que estão causando crash do servidor durante o carregamento dos arquivos estáticos.

## 🔗 Referências

- [SOLUCAO-ERROS-MIME-TYPE-404.md](./SOLUCAO-ERROS-MIME-TYPE-404.md) - Solução para erros 404
- [SOLUCAO-ERROS-MIME-TYPE.md](./SOLUCAO-ERROS-MIME-TYPE.md) - Solução geral para MIME types
- [SOLUCAO-ERROS-SERVIDOR.md](./SOLUCAO-ERROS-SERVIDOR.md) - Solução para erros de servidor








