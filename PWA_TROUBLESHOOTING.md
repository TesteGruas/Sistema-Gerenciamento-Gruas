# 🔧 PWA Troubleshooting - Problemas e Soluções

## 🚨 Problema: Erro ao fazer login no PWA Mobile

### Sintomas:
- Login não funciona no PWA
- Erro de conexão
- Credenciais não são aceitas
- Tela fica em loading infinito

---

## ✅ Soluções:

### 1. Verificar URL da API ⚙️

**Problema:** A variável de ambiente `NEXT_PUBLIC_API_URL` pode estar apontando para `localhost` em produção.

**Solução:**

No servidor, crie/edite o arquivo `.env`:

```bash
# No servidor
cd /home/Sistema-Gerenciamento-Gruas

# Editar .env
nano .env
```

Adicione/atualize estas linhas:

```env
# Trocar localhost pelo domínio/IP real do servidor
NEXT_PUBLIC_API_URL=http://SEU_DOMINIO_OU_IP:3001
NEXT_PUBLIC_API_BASE_URL=http://SEU_DOMINIO_OU_IP:3001/api

# Exemplo para IP
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.100:3001/api

# Exemplo para domínio
NEXT_PUBLIC_API_URL=https://api.seudominio.com
NEXT_PUBLIC_API_BASE_URL=https://api.seudominio.com/api
```

**Depois de editar, reconstruir:**
```bash
npm run build
pm2 restart all
```

---

### 2. Verificar Backend Rodando 🔍

**Verificar se o backend está ativo:**

```bash
# Ver status do backend
pm2 list

# Verificar logs
pm2 logs backend-api

# Testar endpoint de login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"teste@123"}'
```

**Se não estiver rodando:**
```bash
cd /home/Sistema-Gerenciamento-Gruas/backend-api
pm2 start npm --name "backend-api" -- start
```

---

### 3. Problemas de CORS 🌐

**Sintoma:** Erro de CORS no console do navegador

**Solução:** Verificar/adicionar configuração de CORS no backend

No arquivo `backend-api/src/index.js` ou `server.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://SEU_IP:3000',
    'https://SEU_DOMINIO.com'
  ],
  credentials: true
}));
```

---

### 4. Verificar Logs do Navegador 📱

**No mobile (Chrome/Safari):**

1. **Chrome Android:**
   - Conectar celular via USB
   - Abrir Chrome no PC
   - Ir em `chrome://inspect`
   - Selecionar o dispositivo
   - Ver console

2. **Safari iOS:**
   - Ativar "Web Inspector" no iPhone (Ajustes > Safari > Avançado)
   - Conectar ao Mac
   - Safari > Develop > [Seu iPhone] > [Página PWA]

**Procurar por logs que começam com:**
- `[PWA Login]` - Logs do login
- Erros de `fetch` - Problemas de rede
- Erros `401` ou `403` - Problemas de autenticação
- Erros `500` - Problemas no servidor

---

### 5. Testar em Modo Desenvolvimento 🧪

**No desktop primeiro:**

```bash
# No seu computador local
cd /Users/samuellinkon/Desktop/projeto-grua-final/Sistema-Gerenciamento-Gruas

# Verificar .env.local
cat .env.local

# Deve ter:
NEXT_PUBLIC_API_URL=http://localhost:3001

# Rodar em dev
npm run dev

# Acessar
# http://localhost:3000/pwa/login
```

**Testar com o IP do servidor:**

```env
# .env.local
NEXT_PUBLIC_API_URL=http://IP_DO_SERVIDOR:3001
```

---

### 6. Limpar Cache e Storage 🧹

**No navegador mobile:**

1. Abrir DevTools (instruções acima)
2. Application > Storage > Clear site data
3. Recarregar a página

**Ou programaticamente:**

Adicionar botão de "Limpar Cache" na página de login:

```tsx
const handleClearCache = () => {
  localStorage.clear()
  sessionStorage.clear()
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name))
    })
  }
  window.location.reload()
}
```

---

### 7. Verificar Formato da Resposta da API 📋

**A API deve retornar:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "user": {
      "id": 1,
      "nome": "Nome do Usuário",
      "cargo": "Operador",
      "email": "user@example.com"
    },
    "refresh_token": "opcional..."
  },
  "message": "Login realizado com sucesso"
}
```

**Se o formato for diferente, ajustar o código:**

```tsx
// Se a API retornar apenas { token, user }
if (response.ok) {
  const token = data.token || data.access_token
  const user = data.user || data.data
  
  localStorage.setItem('access_token', token)
  localStorage.setItem('user_data', JSON.stringify(user))
  // ...
}
```

---

### 8. Credenciais de Teste 🔐

**Credenciais padrão para teste:**

```
Usuário: admin@admin.com
Senha: teste@123
```

**Se não funcionar, verificar no banco:**

```sql
-- Conectar ao banco
psql -U postgres -d gruas_db

-- Ver usuários
SELECT id, email, nome FROM usuarios;

-- Resetar senha de um usuário
UPDATE usuarios 
SET password = '$2b$10$HASH_DA_SENHA' 
WHERE email = 'admin@admin.com';
```

---

### 9. Configurar HTTPS (Produção) 🔒

**PWAs requerem HTTPS em produção!**

**Opção 1: Nginx com Let's Encrypt**

```nginx
server {
    listen 80;
    server_name seudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name seudominio.com;
    
    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

**Opção 2: Cloudflare (mais fácil)**
- Adicionar domínio no Cloudflare
- Ativar SSL/TLS automático
- Configurar DNS para apontar para seu servidor

---

### 10. Debug Completo - Checklist 📝

Execute este checklist completo:

```bash
# 1. Backend está rodando?
pm2 list | grep backend

# 2. Backend está respondendo?
curl http://localhost:3001/api/auth/login

# 3. Variáveis de ambiente corretas?
cat .env | grep NEXT_PUBLIC

# 4. Build está atualizado?
ls -la .next/

# 5. Porta 3000 está aberta?
netstat -tuln | grep 3000

# 6. Porta 3001 está aberta?
netstat -tuln | grep 3001

# 7. Firewall permite conexões?
sudo ufw status

# 8. Logs do PM2
pm2 logs --lines 50
```

---

## 🎯 Logs Úteis

### Logs de Debug no Login PWA

A versão melhorada do login agora mostra logs detalhados:

```
[PWA Login] Tentando login em: http://...
[PWA Login] Dados: { email: "..." }
[PWA Login] Status da resposta: 200
[PWA Login] Resposta da API: { ... }
[PWA Login] Login bem-sucedido!
```

**Procurar por:**
- Status diferente de 200/201
- Erros de JSON parsing
- Mensagens de erro da API
- Problemas de CORS

---

## 🚀 Solução Rápida (Comandos)

```bash
# 1. Ir para o diretório
cd /home/Sistema-Gerenciamento-Gruas

# 2. Atualizar .env
nano .env
# Adicionar: NEXT_PUBLIC_API_URL=http://SEU_IP:3001

# 3. Rebuild
npm run build

# 4. Verificar backend
pm2 list
pm2 logs backend-api

# 5. Reiniciar tudo
pm2 restart all

# 6. Testar
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"teste@123"}'
```

---

## 📱 Testando no Mobile

### Via IP Local (mesma rede Wi-Fi):

1. Descobrir IP do servidor:
```bash
ip addr show | grep inet
# ou
hostname -I
```

2. No mobile, acessar:
```
http://IP_DO_SERVIDOR:3000/pwa/login
```

### Via Túnel (ngrok):

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000 (frontend)
ngrok http 3000

# Em outro terminal, expor porta 3001 (backend)
ngrok http 3001

# Atualizar .env com a URL do ngrok do backend
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io

# Rebuild
npm run build && pm2 restart all

# Acessar via URL do ngrok do frontend
```

---

## ✅ Checklist Final

- [ ] Backend rodando (`pm2 list`)
- [ ] Variável `NEXT_PUBLIC_API_URL` correta
- [ ] Build atualizado (`npm run build`)
- [ ] CORS configurado no backend
- [ ] Firewall permite portas 3000 e 3001
- [ ] HTTPS configurado (produção)
- [ ] Credenciais de teste funcionando
- [ ] Logs do console verificados
- [ ] Cache limpo no navegador

---

## 🆘 Ainda com Problemas?

1. **Ver logs completos:**
```bash
pm2 logs --lines 100
```

2. **Testar endpoint diretamente:**
```bash
curl -v http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"teste@123"}'
```

3. **Verificar console do navegador:**
- Abrir DevTools
- Tab Console
- Procurar por erros vermelhos
- Procurar por `[PWA Login]`

4. **Criar issue no GitHub com:**
- Logs do console
- Logs do PM2
- Configuração do .env
- Status code da resposta
- Mensagem de erro exata

---

**Última atualização:** 10/10/2025
**Versão:** 2.0

