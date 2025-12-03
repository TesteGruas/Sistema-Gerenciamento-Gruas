# Solução para Erros no Servidor

## Problemas Identificados

### 1. Erro de MIME Type
```
Refused to execute script from 'http://72.60.60.118:3000/_next/static/css/6ad9841b43ad2bc9.css' 
because its MIME type ('text/css') is not executable
```

**Causa**: O navegador está tentando executar um arquivo CSS como JavaScript. Isso pode acontecer por:
- Problema com proxy reverso (nginx/Apache) servindo arquivos com tipo MIME errado
- Cache do navegador com versão antiga do HTML
- Problema no build do Next.js

### 2. Erro 500 no Login
```
POST http://72.60.60.118:3000/api/auth/login 500 (Internal Server Error)
SyntaxError: Unexpected token 'I', "Internal S"... is not valid JSON
```

**Causa**: 
- O backend não está rodando ou não está acessível na porta 3001
- O proxy do Next.js não está funcionando corretamente
- O backend está retornando uma página de erro HTML em vez de JSON

## Soluções Implementadas

### 1. Melhor Tratamento de Erro no Login ✅

Corrigido o código de login para:
- Verificar o `Content-Type` antes de tentar fazer parse de JSON
- Tratar respostas não-JSON (HTML, texto simples)
- Mostrar mensagens de erro mais claras ao usuário
- Adicionar logging detalhado para debug

**Arquivos modificados:**
- `app/page.tsx` - Login principal
- `app/pwa/login/page.tsx` - Login PWA

### 2. Verificação de Configuração do Servidor

#### Verificar se o Backend está Rodando

```bash
# Verificar se o backend está rodando na porta 3001
curl http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'

# Ou verificar se está acessível externamente
curl http://72.60.60.118:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'
```

#### Verificar Configuração do Next.js

O arquivo `next.config.mjs` está configurado para fazer proxy das requisições `/api/*` para o backend:

```javascript
async rewrites() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
                 (process.env.NODE_ENV === 'production' 
                   ? 'http://72.60.60.118:3001' 
                   : 'http://localhost:3001');
  
  return [
    {
      source: '/api/:path*',
      destination: `${apiUrl}/api/:path*`,
    },
  ];
}
```

**IMPORTANTE**: Verifique se a variável de ambiente `NEXT_PUBLIC_API_URL` está configurada corretamente no servidor.

### 3. Configuração do Proxy Reverso (Nginx)

Se estiver usando Nginx como proxy reverso, adicione/verifique estas configurações:

```nginx
server {
    listen 80;
    server_name 72.60.60.118;

    # Headers para arquivos estáticos do Next.js
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # NÃO definir Content-Type manualmente - deixar o Next.js fazer isso
        # O Next.js já envia os headers corretos automaticamente
    }

    # Headers para CSS especificamente
    location ~* \.css$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Content-Type "text/css; charset=utf-8";
    }

    # Headers para JavaScript
    location ~* \.js$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Content-Type "application/javascript; charset=utf-8";
    }

    # Proxy para o Next.js
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

### 4. Limpar Cache e Rebuild

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

3. **Limpar cache do navegador**:
   - Abra as ferramentas de desenvolvedor (F12)
   - Clique com botão direito no botão de recarregar
   - Selecione "Esvaziar cache e recarregar forçadamente"

   Ou use:
   - **Chrome/Edge**: Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)
   - **Firefox**: Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)

## Verificação

### 1. Verificar se o Backend está Acessível

```bash
# Testar o endpoint de login diretamente
curl -X POST http://72.60.60.118:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"teste@123"}'
```

Se retornar erro de conexão, o backend não está rodando ou não está acessível.

### 2. Verificar Headers HTTP dos Arquivos Estáticos

```bash
# Verificar headers do CSS
curl -I http://72.60.60.118:3000/_next/static/css/6ad9841b43ad2bc9.css
```

Deve retornar:
```
Content-Type: text/css; charset=utf-8
```

Se retornar outro Content-Type, há um problema na configuração do servidor/proxy.

### 3. Verificar Logs do Servidor

```bash
# Logs do PM2
pm2 logs

# Logs do Nginx (se estiver usando)
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Próximos Passos

1. **Verificar se o backend está rodando**:
   ```bash
   cd backend-api
   npm start
   # ou
   pm2 start backend-api
   ```

2. **Verificar variáveis de ambiente**:
   - `NEXT_PUBLIC_API_URL` deve apontar para o backend (ex: `http://72.60.60.118:3001`)
   - Verificar se o backend está configurado corretamente

3. **Testar o endpoint de login diretamente**:
   ```bash
   curl -X POST http://72.60.60.118:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@admin.com","password":"teste@123"}'
   ```

4. **Se o problema persistir**:
   - Verificar logs do servidor
   - Verificar configuração do proxy reverso
   - Verificar se há problemas de firewall bloqueando a porta 3001

## Melhorias Implementadas no Código

### Tratamento de Erro Melhorado

O código agora:
- ✅ Verifica o `Content-Type` antes de fazer parse de JSON
- ✅ Trata respostas não-JSON (HTML, texto simples)
- ✅ Mostra mensagens de erro mais claras
- ✅ Adiciona logging detalhado para debug

### Exemplo de Erro Tratado

Antes:
```javascript
const errorData = await response.json() // ❌ Falha se não for JSON
```

Depois:
```javascript
const contentType = response.headers.get('content-type')
if (contentType && contentType.includes('application/json')) {
  errorData = await response.json()
} else {
  const errorText = await response.text()
  errorData = { error: 'Erro interno do servidor...' }
}
```

## Contato

Se o problema persistir após seguir estes passos, verifique:
1. Logs do servidor (PM2, Nginx, etc.)
2. Configuração do firewall
3. Status do backend (se está rodando)
4. Variáveis de ambiente configuradas corretamente

