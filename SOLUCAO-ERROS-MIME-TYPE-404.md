# Solução para Erros de MIME Type e 404 em Arquivos Estáticos

## Problemas Identificados

### 1. Erros de MIME Type
```
Refused to apply style from 'http://localhost:3000/_next/static/css/app/layout.css?v=...' 
because its MIME type ('text/html') is not a supported stylesheet MIME type
```

### 2. Erros 404 em Arquivos Estáticos
```
GET http://localhost:3000/_next/static/chunks/app-pages-internals.js net::ERR_ABORTED 404 (Not Found)
GET http://localhost:3000/_next/static/chunks/app/layout.js net::ERR_ABORTED 404 (Not Found)
GET http://localhost:3000/_next/static/chunks/app/pwa/page.js net::ERR_ABORTED 404 (Not Found)
```

### 3. Erros de Execução de Script
```
Refused to execute script from '<URL>' because its MIME type ('text/html') 
is not executable, and strict MIME type checking is enabled.
```

## Causas Raiz

Estes erros ocorrem quando:

1. **Build não foi executado ou está desatualizado**: O Next.js precisa gerar os arquivos estáticos em `.next/static/`
2. **Cache corrompido**: O cache do Next.js pode estar corrompido ou desatualizado
3. **Configuração incorreta**: A configuração `output: 'standalone'` estava ativa em desenvolvimento
4. **Ordem incorreta de headers**: Headers genéricos estavam sendo aplicados antes dos específicos para arquivos estáticos
5. **Servidor retornando HTML em vez de arquivos**: Quando um arquivo não é encontrado, o Next.js retorna uma página 404 (HTML) em vez do arquivo correto

## Soluções Implementadas

### 1. Correção do `next.config.mjs`

#### a) Output Standalone Apenas em Produção
```javascript
// Antes (sempre ativo):
output: 'standalone',

// Depois (apenas em produção):
...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),
```

**Por quê?** O modo `standalone` é otimizado para produção e pode causar problemas em desenvolvimento, especialmente com arquivos estáticos.

#### b) Ordem Correta dos Headers
```javascript
async headers() {
  return [
    // 1. PRIMEIRO: Headers para arquivos estáticos do Next.js
    {
      source: '/_next/static/:path*',
      headers: [...]
    },
    // 2. SEGUNDO: Headers específicos para CSS e JS
    {
      source: '/_next/static/:path*.css',
      headers: [...]
    },
    {
      source: '/_next/static/:path*.js',
      headers: [...]
    },
    // 3. ÚLTIMO: Headers genéricos para páginas
    {
      source: '/:path*',
      headers: [...]
    },
  ];
}
```

**Por quê?** O Next.js processa os headers na ordem em que aparecem. Se um header genérico (`/:path*`) vier antes dos específicos (`/_next/static/:path*`), ele pode interferir no serviço correto dos arquivos estáticos.

### 2. Script de Limpeza e Rebuild

Criado o script `scripts/fix-mime-type-errors.sh` que:
- Para o servidor Next.js
- Limpa o cache do Next.js (`.next/`)
- Limpa o cache do node_modules
- Reconstroi o projeto

## Como Resolver

### Opção 1: Usar o Script Automático (Recomendado)

```bash
./scripts/fix-mime-type-errors.sh
```

### Opção 2: Passos Manuais

1. **Parar o servidor Next.js**:
   ```bash
   # Pressione Ctrl+C no terminal onde o servidor está rodando
   # Ou execute:
   pkill -f "next dev"
   ```

2. **Limpar cache do Next.js**:
   ```bash
   rm -rf .next
   ```

3. **Limpar cache do node_modules** (opcional):
   ```bash
   rm -rf node_modules/.cache
   ```

4. **Rebuild do projeto**:
   ```bash
   npm run build
   ```

5. **Limpar cache do navegador**:
   - **Chrome/Edge**: 
     - Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)
     - Ou: DevTools > Application > Clear storage > Clear site data
   - **Firefox**: 
     - Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)
     - Ou: DevTools > Storage > Clear All

6. **Reiniciar o servidor**:
   ```bash
   npm run dev
   ```

7. **Acessar a aplicação**:
   - Abra `http://localhost:3000/pwa` em uma janela anônima/privada
   - Verifique o console do navegador (F12) para confirmar que não há mais erros

## Verificação

Após aplicar as correções, verifique:

1. **Console do navegador**: Não deve haver erros de MIME type ou 404
2. **Network tab**: Os arquivos estáticos devem retornar status 200 com MIME types corretos:
   - CSS: `text/css; charset=utf-8`
   - JS: `application/javascript; charset=utf-8`
3. **Página carrega corretamente**: A aplicação deve funcionar normalmente

## Teste Rápido

Execute este comando para verificar se os arquivos estáticos estão sendo servidos corretamente:

```bash
# Verificar se o diretório .next/static existe
ls -la .next/static

# Verificar se há arquivos CSS e JS
ls -la .next/static/css
ls -la .next/static/chunks
```

## Se o Problema Persistir

1. **Verificar se o servidor está rodando**:
   ```bash
   lsof -i :3000
   ```

2. **Verificar logs do servidor**:
   - Procure por erros no terminal onde o `npm run dev` está rodando

3. **Verificar se há problemas com o service worker**:
   - DevTools > Application > Service Workers
   - Desregistre todos os service workers
   - Recarregue a página

4. **Verificar configuração do proxy reverso** (se aplicável):
   - Se estiver usando Nginx ou outro proxy, verifique se não está sobrescrevendo os headers
   - Veja `SOLUCAO-ERROS-MIME-TYPE.md` para configurações de Nginx

5. **Verificar variáveis de ambiente**:
   ```bash
   # Verificar se NODE_ENV está correto
   echo $NODE_ENV
   ```

## Notas Importantes

- ⚠️ **Nunca defina Content-Type manualmente** nos headers do Next.js para arquivos estáticos. O Next.js já faz isso automaticamente.
- ⚠️ **O modo `standalone` deve ser usado apenas em produção**. Em desenvolvimento, pode causar problemas com hot-reload e arquivos estáticos.
- ⚠️ **A ordem dos headers é importante**. Headers específicos devem vir antes dos genéricos.
- ⚠️ **Sempre limpe o cache do navegador** após fazer mudanças na configuração do Next.js.

## Referências

- [Next.js - Static File Serving](https://nextjs.org/docs/basic-features/static-file-serving)
- [Next.js - Headers](https://nextjs.org/docs/api-reference/next.config.js/headers)
- [Next.js - Output Configuration](https://nextjs.org/docs/api-reference/next.config.js/output)

