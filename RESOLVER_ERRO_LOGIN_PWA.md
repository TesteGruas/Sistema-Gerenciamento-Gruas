# 🚨 Como Resolver "Erro de login, tente novamente em alguns instantes"

## 📱 Passo a Passo para Resolver

### 1️⃣ PRIMEIRO: Use a Página de Diagnóstico

Acesse no seu navegador:
```
http://SEU_IP:3000/pwa/test-api
```

Ou clique no link "🔧 Problemas com login?" na página de login.

Essa página vai mostrar EXATAMENTE qual é o problema!

---

## 🔍 Principais Causas e Soluções

### ❌ Causa 1: Backend não está rodando

**Sintomas:**
- Erro de conectividade
- "Não foi possível conectar ao servidor"
- Página de teste mostra erro de rede

**Solução:**
```bash
# No servidor
pm2 list

# Se backend-api não estiver rodando
cd /home/Sistema-Gerenciamento-Gruas/backend-api
pm2 start npm --name "backend-api" -- start

# Verificar logs
pm2 logs backend-api
```

---

### ❌ Causa 2: URL da API está errada (MAIS COMUM!)

**Sintomas:**
- Funciona no computador, mas não no celular
- Erro de conexão timeout
- Página de teste mostra "localhost" mas você está em outro dispositivo

**O Problema:**
Se você está acessando o PWA pelo celular/tablet, NÃO PODE usar `localhost`!

**Solução:**

1. **Descobrir o IP do servidor:**
```bash
# No servidor
hostname -I
# ou
ip addr show | grep inet
```

2. **Atualizar .env:**
```bash
cd /home/Sistema-Gerenciamento-Gruas
nano .env
```

3. **Adicionar/Modificar:**
```env
# Trocar localhost pelo IP REAL do servidor
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001

# Ou se tiver domínio
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

4. **Rebuild e Restart:**
```bash
npm run build
pm2 restart all
```

5. **Testar:**
```bash
# No servidor, testar se funciona
curl http://192.168.1.100:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"teste@123"}'
```

---

### ❌ Causa 3: CORS bloqueando

**Sintomas:**
- No console do navegador: erro de CORS
- "Access-Control-Allow-Origin"
- Backend recebe a requisição mas navegador bloqueia

**Solução:**

Editar arquivo do backend: `backend-api/src/index.js` ou `server.js`

```javascript
const cors = require('cors');

// ANTES de qualquer rota, adicionar:
app.use(cors({
  origin: '*',  // OU especificar: ['http://192.168.1.100:3000', 'http://localhost:3000']
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
```

Depois:
```bash
pm2 restart backend-api
```

---

### ❌ Causa 4: Formato da resposta da API diferente

**Sintomas:**
- Conecta com a API
- Login retorna status 200
- Mas ainda dá erro

**Verificar na página de teste:**
A página vai mostrar o formato exato da resposta. Deve ser assim:

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "user": {
      "id": 1,
      "nome": "Nome",
      "email": "user@example.com"
    }
  }
}
```

**Se for diferente, ajustar o código do login.**

---

### ❌ Causa 5: Porta 3001 bloqueada no firewall

**Solução:**
```bash
# Verificar firewall
sudo ufw status

# Se estiver ativo, permitir porta 3001
sudo ufw allow 3001

# Ou desativar temporariamente para testar
sudo ufw disable
```

---

### ❌ Causa 6: Credenciais erradas

**Testar credenciais padrão:**
```
Usuário: admin@admin.com
Senha: teste@123
```

**Verificar no banco:**
```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Conectar ao banco
\c gruas_db

# Ver usuários
SELECT id, email, nome FROM usuarios;

# Se precisar criar usuário de teste
INSERT INTO usuarios (email, nome, password, perfil) 
VALUES ('admin@admin.com', 'Admin', '$2b$10$...', 'admin');
```

---

## 🎯 Solução Rápida (90% dos casos)

```bash
# 1. Descubra seu IP
hostname -I

# 2. Edite o .env
cd /home/Sistema-Gerenciamento-Gruas
nano .env

# 3. Adicione (substitua 192.168.1.100 pelo SEU IP):
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001

# 4. Salve (Ctrl+O, Enter, Ctrl+X)

# 5. Rebuild
npm run build

# 6. Restart
pm2 restart all

# 7. Teste no celular/tablet:
# Abra: http://192.168.1.100:3000/pwa/test-api
```

---

## 📱 Testando no Celular

### Via Wi-Fi Local:

1. **Celular e servidor na MESMA rede Wi-Fi**
2. **Acesse:** `http://IP_DO_SERVIDOR:3000/pwa/login`
3. **Exemplo:** `http://192.168.1.100:3000/pwa/login`

### Não funciona via dados móveis!

Se precisar testar fora da rede local, use:

**Opção A: ngrok**
```bash
npm install -g ngrok

# Terminal 1: Expor backend
ngrok http 3001

# Terminal 2: Expor frontend  
ngrok http 3000

# Atualizar .env com URL do ngrok do backend
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io

# Rebuild
npm run build && pm2 restart all

# Acessar via URL do ngrok do frontend
```

**Opção B: Configurar HTTPS com domínio real** (produção)

---

## 🔧 Verificação Completa

Execute estes comandos e me envie o resultado:

```bash
# 1. Status dos serviços
pm2 list

# 2. IP do servidor
hostname -I

# 3. Variáveis de ambiente
cat .env | grep NEXT_PUBLIC

# 4. Testar backend
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"teste@123"}'

# 5. Portas abertas
netstat -tuln | grep -E '3000|3001'

# 6. Logs do backend
pm2 logs backend-api --lines 20
```

---

## 📊 Checklist

Marque conforme for resolvendo:

- [ ] Backend está rodando (`pm2 list`)
- [ ] .env tem `NEXT_PUBLIC_API_URL` com IP correto
- [ ] Build foi refeito (`npm run build`)
- [ ] PM2 foi reiniciado (`pm2 restart all`)
- [ ] Página de teste (`/pwa/test-api`) está acessível
- [ ] Página de teste mostra "✅ Sistema funcionando"
- [ ] Login funciona no desktop
- [ ] Login funciona no mobile
- [ ] Console do navegador não mostra erros

---

## 🆘 Ainda não funciona?

**Envie para mim:**

1. **Print da página de teste** (`/pwa/test-api`)
2. **Resultado do comando:**
```bash
curl -X POST http://$(hostname -I | awk '{print $1}'):3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"teste@123"}' -v
```
3. **Console do navegador** (F12 > Console) mostrando o erro
4. **Logs do PM2:**
```bash
pm2 logs backend-api --lines 50
```

---

## ✅ Quando Funcionar

Você verá:
1. ✅ Na página de teste: "Sistema funcionando!"
2. ✅ Login bem-sucedido
3. ✅ Redirecionamento para `/pwa`
4. ✅ Dashboard carregando normalmente

---

**Última atualização:** 10/10/2025

**Dica:** 90% dos erros são resolvidos simplesmente trocando `localhost` pelo IP real do servidor no arquivo `.env`!

