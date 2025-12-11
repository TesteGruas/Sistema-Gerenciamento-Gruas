# Solução para Erros de MIME Type e removeChild

## Problemas Identificados

### 1. Erro de MIME Type
```
Refused to execute script from 'http://72.60.60.118:3000/_next/static/css/6ad9841b43ad2bc9.css' 
because its MIME type ('text/css') is not executable
```

**Causa**: O navegador está tentando executar um arquivo CSS como JavaScript. Isso pode acontecer por:
- Configuração incorreta de headers no Next.js (tentando definir Content-Type manualmente)
- Problema com proxy reverso (nginx/Apache) servindo arquivos com tipo MIME errado
- Cache do navegador com versão antiga do HTML

### 2. Erro de removeChild
```
Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node': 
The node to be removed is not a child of this node
```

**Causa**: Problema de hidratação do React, geralmente causado por:
- Diferenças entre HTML renderizado no servidor e no cliente
- Uso incorreto da tag `<head>` no Next.js 13+
- Problemas com Strict Mode do React

## Soluções Implementadas

### 1. Correção do `next.config.mjs`
- ✅ Removida a configuração manual de `Content-Type` para CSS e JS (o Next.js já faz isso automaticamente)
- ✅ Adicionada configuração `output: 'standalone'` para garantir output correto
- ✅ Desabilitado `reactStrictMode` temporariamente para evitar problemas de hidratação

### 2. Correção do `app/layout.tsx`
- ✅ Removida a tag `<head>` manual (Next.js 13+ gerencia isso automaticamente)
- ✅ Movidos os estilos inline para usar as classes CSS variables diretamente
- ✅ Uso correto das fontes através de className

## Ações Necessárias no Servidor

### Se estiver usando Nginx como proxy reverso:

Adicione/verifique estas configurações no seu `nginx.conf`:

```nginx
server {
    listen 80;
    server_name 72.60.60.118;

    location /_next/static/ {
        # Arquivos estáticos do Next.js
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # NÃO definir Content-Type manualmente - deixar o Next.js fazer isso
        # O Next.js já envia os headers corretos
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Headers importantes
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Se estiver usando PM2 ou outro gerenciador de processos:

1. **Limpar cache do build**:
```bash
rm -rf .next
npm run build
```

2. **Reiniciar o servidor**:
```bash
pm2 restart all
# ou
pm2 restart nextjs-app
```

### Limpar cache do navegador:

1. Abra as ferramentas de desenvolvedor (F12)
2. Clique com botão direito no botão de recarregar
3. Selecione "Esvaziar cache e recarregar forçadamente"

Ou use:
- **Chrome/Edge**: Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)
- **Firefox**: Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)

## Verificação

Após aplicar as correções:

1. **Verificar se o build está correto**:
```bash
npm run build
```

2. **Verificar os headers HTTP**:
```bash
curl -I http://72.60.60.118:3000/_next/static/css/6ad9841b43ad2bc9.css
```

Deve retornar:
```
Content-Type: text/css; charset=utf-8
```

3. **Verificar se não há erros no console do navegador**

## Se o problema persistir

1. **Verificar logs do servidor**:
```bash
pm2 logs
# ou
journalctl -u nextjs -f
```

2. **Verificar se há problemas com o service worker**:
   - Abra DevTools > Application > Service Workers
   - Desregistre todos os service workers
   - Recarregue a página

3. **Verificar configuração do servidor web** (se houver):
   - Certifique-se de que não está sobrescrevendo Content-Type
   - Verifique se não há regras de rewrite que possam estar interferindo

## Notas Importantes

- O Next.js gerencia automaticamente os tipos MIME corretos
- Não é necessário (e pode causar problemas) definir Content-Type manualmente nos headers do Next.js
- O erro de `removeChild` geralmente é resolvido ao corrigir problemas de hidratação
- Se o problema persistir, pode ser necessário verificar se há um proxy reverso ou CDN interferindo



