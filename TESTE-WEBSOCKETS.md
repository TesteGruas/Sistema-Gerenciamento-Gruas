# Guia de Testes - WebSockets para Notificações

## 🧪 Testes Manuais

### Pré-requisitos

1. ✅ Dependências instaladas:
   ```bash
   cd backend-api && npm install
   cd .. && npm install
   ```

2. ✅ Servidores rodando:
   - Backend: `cd backend-api && npm run dev` (porta 3001)
   - Frontend: `npm run dev` (porta 3000)

3. ✅ Variáveis de ambiente configuradas:
   - Backend: `FRONTEND_URL=http://localhost:3000`
   - Frontend: `NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001`

---

## 📋 Teste 1: Verificar Conexão WebSocket

### Passo a Passo:

1. **Abrir o navegador** e fazer login no sistema
2. **Abrir o Console do Desenvolvedor** (F12)
3. **Verificar logs:**
   - Deve aparecer: `🔌 [WebSocket] Conectando...`
   - Depois: `✅ [WebSocket] Conectado`
   - E: `✅ [WebSocket] Autenticado: { userId: ..., timestamp: ... }`

4. **Verificar indicador visual:**
   - No dropdown de notificações (ícone de sino)
   - Deve ter um **ponto verde** no canto inferior direito quando conectado
   - Ponto **cinza** quando desconectado

### ✅ Resultado Esperado:
- Conexão estabelecida com sucesso
- Indicador verde visível
- Logs de conexão no console

---

## 📋 Teste 2: Receber Notificação em Tempo Real

### Passo a Passo:

1. **Abrir duas abas/janelas** do sistema (ou usar dois navegadores)
2. **Fazer login com usuários diferentes** (ou mesmo usuário em abas diferentes)
3. **Na primeira aba:** Criar uma notificação:
   - Ir em `/dashboard/notificacoes`
   - Clicar em "Nova Notificação"
   - Preencher título e mensagem
   - Selecionar destinatário
   - Enviar

4. **Na segunda aba:** Observar:
   - A notificação deve aparecer **instantaneamente** (sem esperar polling)
   - Deve aparecer no console: `🔔 [WebSocket] Nova notificação recebida:`
   - Se tiver permissão de notificações do navegador, deve aparecer uma notificação push

### ✅ Resultado Esperado:
- Notificação aparece instantaneamente (< 1 segundo)
- Console mostra evento recebido
- Notificação push aparece (se permitido)

---

## 📋 Teste 3: Marcar como Lida via WebSocket

### Passo a Passo:

1. **Ter pelo menos uma notificação não lida**
2. **Abrir o dropdown de notificações**
3. **Clicar no botão de marcar como lida** (✓) em uma notificação
4. **Verificar no console:**
   - Deve aparecer: `✅ [WebSocket] Notificação atualizada:`
5. **Verificar na interface:**
   - A notificação deve desaparecer do contador de não lidas
   - O badge deve atualizar

### ✅ Resultado Esperado:
- Notificação marcada como lida instantaneamente
- Contador atualizado
- Console mostra confirmação

---

## 📋 Teste 4: Marcar Todas como Lidas via WebSocket

### Passo a Passo:

1. **Ter várias notificações não lidas**
2. **Abrir o dropdown de notificações**
3. **Clicar em "Marcar todas"**
4. **Verificar no console:**
   - Deve aparecer: `✅ [WebSocket] Todas as notificações marcadas como lidas`
5. **Verificar na interface:**
   - Todas as notificações devem ser marcadas como lidas
   - Contador deve zerar

### ✅ Resultado Esperado:
- Todas as notificações marcadas instantaneamente
- Contador zerado
- Console mostra confirmação

---

## 📋 Teste 5: Reconexão Automática

### Passo a Passo:

1. **Estar conectado** (ver indicador verde)
2. **Desconectar o backend** (parar o servidor ou desligar internet temporariamente)
3. **Observar no console:**
   - Deve aparecer: `❌ [WebSocket] Desconectado:`
   - Indicador deve ficar cinza
4. **Reconectar o backend** (reiniciar servidor ou internet)
5. **Observar:**
   - Deve tentar reconectar automaticamente
   - Deve aparecer: `🔄 [WebSocket] Tentando reconectar...`
   - Depois: `✅ [WebSocket] Conectado`
   - Indicador deve voltar ao verde

### ✅ Resultado Esperado:
- Detecta desconexão
- Tenta reconectar automaticamente
- Reconecta com sucesso

---

## 📋 Teste 6: Fallback para REST

### Passo a Passo:

1. **Desconectar WebSocket** (parar backend ou bloquear conexão)
2. **Tentar marcar notificação como lida**
3. **Verificar:**
   - Deve usar REST API como fallback
   - Deve funcionar normalmente (mais lento, mas funcional)
   - Polling deve voltar a 30 segundos

### ✅ Resultado Esperado:
- Sistema continua funcionando sem WebSocket
- Usa REST API como fallback
- Polling aumenta para compensar

---

## 📋 Teste 7: Notificações Automáticas

### Passo a Passo:

1. **Criar um registro de ponto** com horas extras
2. **Aguardar aprovação** (ou criar manualmente)
3. **Verificar:**
   - Notificação de aprovação deve aparecer via WebSocket
   - Deve aparecer instantaneamente para o gestor

### ✅ Resultado Esperado:
- Notificações automáticas funcionam via WebSocket
- Aparecem instantaneamente

---

## 🔍 Teste com Console do Navegador

### Teste Direto no Console:

```javascript
// 1. Verificar se Socket.IO está carregado
console.log('Socket.IO disponível:', typeof io !== 'undefined')

// 2. Conectar manualmente (se necessário)
const socket = io('http://localhost:3001', {
  auth: { token: localStorage.getItem('access_token') }
})

socket.on('connect', () => console.log('✅ Conectado'))
socket.on('nova-notificacao', (data) => console.log('🔔 Nova notificação:', data))
socket.on('disconnect', () => console.log('❌ Desconectado'))
```

---

## 🧪 Teste Automatizado (Backend)

### Criar arquivo: `backend-api/src/tests/websocket.test.js`

```javascript
import { io } from 'socket.io-client'

describe('WebSocket Notificações', () => {
  let socket
  const SOCKET_URL = 'http://localhost:3001'
  const TEST_TOKEN = 'SEU_TOKEN_JWT_AQUI' // Obter token válido

  beforeEach((done) => {
    socket = io(SOCKET_URL, {
      auth: { token: TEST_TOKEN },
      transports: ['websocket']
    })
    
    socket.on('connect', () => {
      console.log('✅ Conectado para teste')
      done()
    })
    
    socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error.message)
      done(error)
    })
  })

  afterEach(() => {
    if (socket.connected) {
      socket.disconnect()
    }
  })

  test('deve conectar ao servidor', (done) => {
    expect(socket.connected).toBe(true)
    done()
  })

  test('deve receber evento connected', (done) => {
    socket.on('connected', (data) => {
      expect(data).toHaveProperty('userId')
      expect(data).toHaveProperty('timestamp')
      done()
    })
  })

  test('deve receber nova notificação', (done) => {
    socket.on('nova-notificacao', (notificacao) => {
      expect(notificacao).toHaveProperty('id')
      expect(notificacao).toHaveProperty('titulo')
      expect(notificacao).toHaveProperty('mensagem')
      expect(notificacao).toHaveProperty('tipo')
      done()
    })
    
    // Criar notificação via API REST aqui
    // ...
  })

  test('deve marcar notificação como lida', (done) => {
    const notificacaoId = '123' // ID de teste
    
    socket.on('notificacao-atualizada', (data) => {
      expect(data.id).toBe(notificacaoId)
      expect(data.lida).toBe(true)
      done()
    })
    
    socket.emit('marcar-lida', { notificacaoId })
  })

  test('deve marcar todas como lidas', (done) => {
    socket.on('todas-marcadas-lidas', (data) => {
      expect(data).toHaveProperty('timestamp')
      done()
    })
    
    socket.emit('marcar-todas-lidas')
  })
})
```

---

## 📊 Checklist de Testes

### Conexão
- [ ] WebSocket conecta ao iniciar aplicação
- [ ] Indicador verde aparece quando conectado
- [ ] Logs de conexão aparecem no console
- [ ] Autenticação funciona corretamente

### Notificações
- [ ] Notificações aparecem instantaneamente
- [ ] Notificações push aparecem (se permitido)
- [ ] Notificações automáticas funcionam
- [ ] Múltiplos destinatários recebem notificações

### Ações
- [ ] Marcar como lida funciona via WebSocket
- [ ] Marcar todas como lidas funciona via WebSocket
- [ ] Atualização é instantânea na interface
- [ ] Contador de não lidas atualiza corretamente

### Reconexão
- [ ] Detecta desconexão
- [ ] Tenta reconectar automaticamente
- [ ] Reconecta com sucesso
- [ ] Indicador atualiza corretamente

### Fallback
- [ ] Usa REST quando WebSocket desconectado
- [ ] Polling aumenta quando desconectado
- [ ] Sistema continua funcionando sem WebSocket

### Performance
- [ ] Notificações aparecem em < 1 segundo
- [ ] Polling reduzido quando WebSocket conectado
- [ ] Menos requisições HTTP quando conectado

---

## 🐛 Troubleshooting

### Problema: WebSocket não conecta

**Verificar:**
1. Backend está rodando na porta 3001?
2. Token JWT é válido?
3. CORS está configurado corretamente?
4. Variável `NEXT_PUBLIC_WEBSOCKET_URL` está correta?

**Solução:**
```bash
# Verificar logs do backend
cd backend-api
npm run dev

# Verificar no console do navegador
# Deve aparecer erro específico
```

### Problema: Notificações não aparecem

**Verificar:**
1. WebSocket está conectado? (indicador verde)
2. Usuário tem permissão para receber notificações?
3. Notificação foi criada no banco?

**Solução:**
```javascript
// No console do navegador
// Verificar se está recebendo eventos
socket.on('nova-notificacao', (data) => {
  console.log('Notificação recebida:', data)
})
```

### Problema: Notificações duplicadas

**Verificar:**
1. Não há múltiplos listeners?
2. Polling está desabilitado quando WebSocket conectado?

**Solução:**
- Verificar se `useNotificacoes` não está sendo chamado múltiplas vezes
- Verificar se polling está reduzido quando `wsConnected === true`

---

## 📝 Logs Esperados

### Backend (Console)
```
✅ [WebSocket] Usuário 123 conectado (socket: abc123)
📤 [WebSocket] Notificação 456 enviada para usuário 123
✅ [WebSocket] Notificação 456 marcada como lida por usuário 123
❌ [WebSocket] Usuário 123 desconectado (socket: abc123)
```

### Frontend (Console do Navegador)
```
🔌 [WebSocket] Conectando...
✅ [WebSocket] Conectado
✅ [WebSocket] Autenticado: { userId: 123, timestamp: ... }
🔔 [WebSocket] Nova notificação recebida: { id: 456, ... }
✅ [WebSocket] Notificação atualizada: { id: 456, lida: true }
```

---

## ✅ Critérios de Sucesso

1. ✅ WebSocket conecta automaticamente ao fazer login
2. ✅ Notificações aparecem instantaneamente (< 1 segundo)
3. ✅ Marcar como lida funciona via WebSocket
4. ✅ Reconexão automática funciona
5. ✅ Fallback para REST funciona quando desconectado
6. ✅ Indicador visual mostra status correto
7. ✅ Notificações push aparecem (se permitido)
8. ✅ Polling reduzido quando WebSocket conectado

---

**Boa sorte com os testes! 🚀**

