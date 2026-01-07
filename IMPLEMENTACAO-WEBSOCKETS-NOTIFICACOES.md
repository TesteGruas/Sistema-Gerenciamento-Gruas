# Implementação de WebSockets para Notificações em Tempo Real

**Objetivo:** Substituir polling por WebSockets para notificações instantâneas no PWA

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Dependências](#dependências)
4. [Implementação Backend](#implementação-backend)
5. [Implementação Frontend](#implementação-frontend)
6. [Integração com Sistema de Notificações](#integração-com-sistema-de-notificações)
7. [Testes](#testes)
8. [Deploy e Configuração](#deploy-e-configuração)

---

## 🎯 Visão Geral

### Situação Atual
- ✅ Sistema de notificações completo via REST API
- ✅ Polling a cada 30 segundos no frontend
- ⚠️ Notificações não são instantâneas
- ⚠️ Consumo desnecessário de recursos com polling

### Objetivo
- ✅ Notificações instantâneas via WebSocket
- ✅ Redução de carga no servidor
- ✅ Melhor experiência do usuário
- ✅ Suporte a reconexão automática

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│                 │
│  WebSocket      │◄──────┐
│  Client         │       │
└────────┬────────┘       │
         │                 │
         │ WebSocket       │
         │ (wss://)        │
         │                 │
         ▼                 │
┌─────────────────┐       │
│   Backend       │       │
│   (Express)     │       │
│                 │       │
│  WebSocket      │       │
│  Server         │       │
│  (Socket.IO)    │       │
└────────┬────────┘       │
         │                 │
         │                 │
         ▼                 │
┌─────────────────┐       │
│   Database      │       │
│   (Supabase)    │       │
│                 │       │
│  Notificações   │───────┘
│  Criadas        │
└─────────────────┘
```

### Fluxo de Notificação

1. **Criação de Notificação:**
   - Backend cria notificação no banco
   - Backend emite evento WebSocket para usuários afetados
   - Frontend recebe evento instantaneamente

2. **Marcar como Lida:**
   - Frontend envia evento via WebSocket
   - Backend atualiza banco
   - Backend confirma atualização

3. **Reconexão:**
   - Cliente detecta desconexão
   - Reconecta automaticamente
   - Sincroniza notificações pendentes

---

## 📦 Dependências

### Backend

```bash
cd backend-api
npm install socket.io
```

### Frontend

```bash
npm install socket.io-client
```

---

## 🔧 Implementação Backend

### 1. Modificar `server.js`

**Arquivo:** `backend-api/src/server.js`

```javascript
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
// ... outros imports

const app = express()
const PORT = process.env.PORT || 3001

// Criar servidor HTTP
const httpServer = createServer(app)

// Configurar Socket.IO com CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Suporta ambos
})

// Armazenar conexões por usuário
const userSockets = new Map() // userId -> Set<socketId>

// Middleware de autenticação Socket.IO
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    
    if (!token) {
      return next(new Error('Token não fornecido'))
    }

    // Verificar token JWT (usar mesma lógica do authenticateToken)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Buscar usuario_id (pode ser UUID ou integer)
    let userId = decoded.id
    
    // Se é UUID, buscar ID inteiro
    if (typeof userId === 'string' && userId.includes('-')) {
      const { data: userData } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', decoded.email)
        .single()
      
      if (userData) {
        userId = userData.id
      }
    }
    
    socket.userId = userId
    socket.userEmail = decoded.email
    
    next()
  } catch (error) {
    next(new Error('Token inválido'))
  }
})

// Gerenciar conexões
io.on('connection', (socket) => {
  const userId = socket.userId
  
  console.log(`✅ [WebSocket] Usuário ${userId} conectado (socket: ${socket.id})`)
  
  // Adicionar socket ao conjunto de sockets do usuário
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set())
  }
  userSockets.get(userId).add(socket.id)
  
  // Entrar em sala do usuário
  socket.join(`user:${userId}`)
  
  // Evento: Cliente pronto
  socket.emit('connected', {
    userId,
    timestamp: new Date().toISOString()
  })
  
  // Evento: Marcar notificação como lida
  socket.on('marcar-lida', async (data) => {
    try {
      const { notificacaoId } = data
      
      // Atualizar no banco
      const { error } = await supabaseAdmin
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', notificacaoId)
        .eq('usuario_id', userId)
      
      if (error) {
        socket.emit('erro', { mensagem: 'Erro ao marcar como lida' })
        return
      }
      
      // Confirmar atualização
      socket.emit('notificacao-atualizada', {
        id: notificacaoId,
        lida: true
      })
      
      console.log(`✅ [WebSocket] Notificação ${notificacaoId} marcada como lida por usuário ${userId}`)
    } catch (error) {
      console.error('❌ [WebSocket] Erro ao marcar como lida:', error)
      socket.emit('erro', { mensagem: 'Erro interno' })
    }
  })
  
  // Evento: Marcar todas como lidas
  socket.on('marcar-todas-lidas', async () => {
    try {
      const { error } = await supabaseAdmin
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', userId)
        .eq('lida', false)
      
      if (error) {
        socket.emit('erro', { mensagem: 'Erro ao marcar todas como lidas' })
        return
      }
      
      socket.emit('todas-marcadas-lidas', {
        timestamp: new Date().toISOString()
      })
      
      console.log(`✅ [WebSocket] Todas as notificações marcadas como lidas por usuário ${userId}`)
    } catch (error) {
      console.error('❌ [WebSocket] Erro ao marcar todas como lidas:', error)
      socket.emit('erro', { mensagem: 'Erro interno' })
    }
  })
  
  // Evento: Desconexão
  socket.on('disconnect', () => {
    console.log(`❌ [WebSocket] Usuário ${userId} desconectado (socket: ${socket.id})`)
    
    // Remover socket do conjunto
    if (userSockets.has(userId)) {
      userSockets.get(userId).delete(socket.id)
      
      // Se não há mais sockets, remover entrada
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId)
      }
    }
  })
})

// Função auxiliar para emitir notificação para usuário
export function emitirNotificacao(usuarioId, notificacao) {
  io.to(`user:${usuarioId}`).emit('nova-notificacao', {
    ...notificacao,
    timestamp: new Date().toISOString()
  })
  
  console.log(`📤 [WebSocket] Notificação ${notificacao.id} enviada para usuário ${usuarioId}`)
}

// Função auxiliar para emitir para múltiplos usuários
export function emitirNotificacaoMultiplos(usuarioIds, notificacao) {
  usuarioIds.forEach(usuarioId => {
    emitirNotificacao(usuarioId, notificacao)
  })
}

// Exportar io para uso em outras rotas
export { io }

// ... resto do código do servidor ...

// ALTERAR: Trocar app.listen por httpServer.listen
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ==========================================')
  console.log(`📡 Servidor HTTP rodando na porta ${PORT}`)
  console.log(`🔌 WebSocket Server ativo`)
  console.log(`🏠 Escutando em TODAS as interfaces (0.0.0.0)`)
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`)
  console.log('🚀 ==========================================')
})
```

### 2. Modificar Rota de Notificações

**Arquivo:** `backend-api/src/routes/notificacoes.js`

```javascript
import { emitirNotificacaoMultiplos } from '../server.js'

// ... código existente ...

router.post('/', authenticateToken, requirePermission('notificacoes:criar'), async (req, res) => {
  // ... código existente de criação ...
  
  // Após criar notificações no banco:
  if (data && data.length > 0) {
    // Emitir via WebSocket para cada usuário
    usuariosUnicos.forEach((usuarioId, index) => {
      const notificacao = data[index]
      if (notificacao) {
        emitirNotificacao(usuarioId, {
          id: notificacao.id,
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem,
          tipo: notificacao.tipo,
          link: notificacao.link,
          lida: false,
          data: notificacao.data,
          remetente: notificacao.remetente
        })
      }
    })
  }
  
  // ... resto do código ...
})
```

### 3. Criar Middleware de Autenticação Socket.IO

**Arquivo:** `backend-api/src/middleware/socket-auth.js`

```javascript
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabase.js'

export async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token
    
    if (!token) {
      return next(new Error('Token não fornecido'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    let userId = decoded.id
    
    // Se é UUID, buscar ID inteiro
    if (typeof userId === 'string' && userId.includes('-')) {
      const { data: userData } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', decoded.email)
        .single()
      
      if (userData) {
        userId = userData.id
      } else {
        return next(new Error('Usuário não encontrado'))
      }
    }
    
    socket.userId = userId
    socket.userEmail = decoded.email
    
    next()
  } catch (error) {
    next(new Error('Token inválido'))
  }
}
```

---

## 💻 Implementação Frontend

### 1. Criar Hook de WebSocket

**Arquivo:** `hooks/use-websocket-notifications.ts`

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Notificacao } from '@/lib/api-notificacoes'
import { useAuth } from '@/hooks/use-auth'

interface UseWebSocketNotificationsReturn {
  socket: Socket | null
  connected: boolean
  notificacoes: Notificacao[]
  novaNotificacao: Notificacao | null
  marcarComoLida: (id: string) => void
  marcarTodasComoLidas: () => void
}

const SOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001'

export function useWebSocketNotifications(): UseWebSocketNotificationsReturn {
  const { user, token } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [novaNotificacao, setNovaNotificacao] = useState<Notificacao | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Conectar ao WebSocket
  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) {
      return
    }

    // Desconectar socket anterior se existir
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    console.log('🔌 [WebSocket] Conectando...')

    const socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts
    })

    socket.on('connect', () => {
      console.log('✅ [WebSocket] Conectado')
      setConnected(true)
      reconnectAttempts.current = 0
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ [WebSocket] Desconectado:', reason)
      setConnected(false)

      // Tentar reconectar manualmente se não foi desconexão intencional
      if (reason === 'io server disconnect') {
        // Servidor desconectou, reconectar
        socket.connect()
      }
    })

    socket.on('connect_error', (error) => {
      console.error('❌ [WebSocket] Erro de conexão:', error.message)
      setConnected(false)
      
      reconnectAttempts.current++
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`🔄 [WebSocket] Tentando reconectar (${reconnectAttempts.current}/${maxReconnectAttempts})...`)
          connect()
        }, 5000 * reconnectAttempts.current)
      } else {
        console.error('❌ [WebSocket] Máximo de tentativas de reconexão atingido')
      }
    })

    socket.on('connected', (data) => {
      console.log('✅ [WebSocket] Autenticado:', data)
    })

    socket.on('nova-notificacao', (notificacao: Notificacao) => {
      console.log('🔔 [WebSocket] Nova notificação recebida:', notificacao)
      
      setNovaNotificacao(notificacao)
      setNotificacoes(prev => [notificacao, ...prev])
      
      // Mostrar notificação push do navegador (se permitido)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notificacao.titulo, {
          body: notificacao.mensagem,
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          tag: `notificacao-${notificacao.id}`,
          data: {
            url: notificacao.link || '/dashboard/notificacoes'
          }
        })
      }
    })

    socket.on('notificacao-atualizada', (data: { id: string; lida: boolean }) => {
      console.log('✅ [WebSocket] Notificação atualizada:', data)
      setNotificacoes(prev =>
        prev.map(n => (n.id === data.id ? { ...n, lida: data.lida } : n))
      )
    })

    socket.on('todas-marcadas-lidas', () => {
      console.log('✅ [WebSocket] Todas as notificações marcadas como lidas')
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    })

    socket.on('erro', (data: { mensagem: string }) => {
      console.error('❌ [WebSocket] Erro:', data.mensagem)
    })

    socketRef.current = socket
  }, [token])

  // Desconectar ao desmontar
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 [WebSocket] Desconectando...')
      socketRef.current.disconnect()
      socketRef.current = null
      setConnected(false)
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
  }, [])

  // Conectar quando token estiver disponível
  useEffect(() => {
    if (token && user) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [token, user, connect, disconnect])

  // Marcar como lida via WebSocket
  const marcarComoLida = useCallback((id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('marcar-lida', { notificacaoId: id })
    }
  }, [])

  // Marcar todas como lidas via WebSocket
  const marcarTodasComoLidas = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('marcar-todas-lidas')
    }
  }, [])

  return {
    socket: socketRef.current,
    connected,
    notificacoes,
    novaNotificacao,
    marcarComoLida,
    marcarTodasComoLidas
  }
}
```

### 2. Modificar Hook `useNotificacoes`

**Arquivo:** `hooks/useNotificacoes.ts`

```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { useWebSocketNotifications } from './use-websocket-notifications'

// ... código existente ...

export function useNotificacoes(usuario_id?: number): UseNotificacoesReturn {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usar WebSocket para notificações em tempo real
  const { 
    connected: wsConnected, 
    novaNotificacao,
    marcarComoLida: wsMarcarComoLida,
    marcarTodasComoLidas: wsMarcarTodasComoLidas
  } = useWebSocketNotifications()

  // ... código existente de fetchNotificacoes ...

  // Atualizar quando receber nova notificação via WebSocket
  useEffect(() => {
    if (novaNotificacao) {
      setNotificacoes(prev => {
        // Evitar duplicatas
        const existe = prev.find(n => n.id === novaNotificacao.id)
        if (existe) return prev
        
        return [novaNotificacao, ...prev]
      })
    }
  }, [novaNotificacao])

  // Marcar como lida (usar WebSocket se disponível, senão REST)
  const marcarComoLida = useCallback(async (notificacao_id: number) => {
    if (wsConnected) {
      wsMarcarComoLida(String(notificacao_id))
    } else {
      // Fallback para REST
      try {
        await api.patch(`notificacoes/${notificacao_id}/marcar-lida`);
        setNotificacoes(prev =>
          prev.map(n => (n.id === notificacao_id ? { ...n, lida: true } : n))
        );
      } catch (err: any) {
        console.error('Erro ao marcar notificação como lida:', err);
        throw err;
      }
    }
  }, [wsConnected, wsMarcarComoLida]);

  // Marcar todas como lidas (usar WebSocket se disponível, senão REST)
  const marcarTodasComoLidas = useCallback(async () => {
    if (wsConnected) {
      wsMarcarTodasComoLidas()
    } else {
      // Fallback para REST
      try {
        await api.patch(`notificacoes/marcar-todas-lidas`);
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      } catch (err: any) {
        console.error('Erro ao marcar todas notificações como lidas:', err);
        throw err;
      }
    }
  }, [wsConnected, wsMarcarTodasComoLidas]);

  // Reduzir polling quando WebSocket está conectado
  const POLLING_INTERVAL = wsConnected ? 300000 : 30000 // 5 min se WS, 30s se não

  // ... resto do código existente ...
}
```

### 3. Adicionar Indicador de Conexão

**Arquivo:** `components/notifications-dropdown.tsx`

```typescript
import { useWebSocketNotifications } from '@/hooks/use-websocket-notifications'

export function NotificationsDropdown() {
  const { connected } = useWebSocketNotifications()
  
  // ... código existente ...
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
          {/* Indicador de conexão WebSocket */}
          <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-gray-400'
          }`} title={connected ? 'Conectado' : 'Desconectado'} />
        </Button>
      </DropdownMenuTrigger>
      {/* ... resto do código ... */}
    </DropdownMenu>
  )
}
```

### 4. Adicionar Variável de Ambiente

**Arquivo:** `.env` (frontend)

```env
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001
```

**Arquivo:** `.env` (backend)

```env
WEBSOCKET_ENABLED=true
```

---

## 🔄 Integração com Sistema de Notificações

### Modificar Criação de Notificações

Todas as funções que criam notificações devem emitir via WebSocket:

**Arquivo:** `backend-api/src/utils/notificacoes.js`

```javascript
import { emitirNotificacao } from '../server.js'

export async function criarNotificacaoAprovacao(registro, gestor) {
  // ... código existente ...
  
  // Após criar no banco:
  if (!error && usuarioId) {
    // Emitir via WebSocket
    emitirNotificacao(usuarioId, {
      id: data.id,
      titulo,
      mensagem,
      tipo: 'warning',
      link,
      lida: false,
      data: new Date().toISOString(),
      remetente: 'Sistema'
    })
  }
  
  // ... resto do código ...
}
```

---

## 🧪 Testes

### Teste Manual

1. **Conectar ao WebSocket:**
   ```javascript
   // No console do navegador
   const socket = io('http://localhost:3001', {
     auth: { token: 'SEU_TOKEN_JWT' }
   })
   
   socket.on('connect', () => console.log('Conectado!'))
   socket.on('nova-notificacao', (data) => console.log('Nova notificação:', data))
   ```

2. **Criar Notificação:**
   - Criar notificação via API REST
   - Verificar se evento WebSocket é recebido

3. **Marcar como Lida:**
   ```javascript
   socket.emit('marcar-lida', { notificacaoId: '123' })
   ```

### Teste Automatizado

**Arquivo:** `backend-api/src/tests/websocket.test.js`

```javascript
import { io } from 'socket.io-client'

describe('WebSocket Notificações', () => {
  let socket
  
  beforeEach((done) => {
    socket = io('http://localhost:3001', {
      auth: { token: 'TEST_TOKEN' }
    })
    
    socket.on('connect', done)
  })
  
  afterEach(() => {
    if (socket.connected) {
      socket.disconnect()
    }
  })
  
  test('deve receber nova notificação', (done) => {
    socket.on('nova-notificacao', (notificacao) => {
      expect(notificacao).toHaveProperty('id')
      expect(notificacao).toHaveProperty('titulo')
      done()
    })
    
    // Criar notificação via API
    // ...
  })
})
```

---

## 🚀 Deploy e Configuração

### Variáveis de Ambiente

**Backend (.env):**
```env
WEBSOCKET_ENABLED=true
FRONTEND_URL=https://seu-dominio.com
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.seu-dominio.com
```

### Nginx (se usar)

```nginx
# WebSocket proxy
location /socket.io/ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### PM2 (se usar)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    script: './backend-api/src/server.js',
    instances: 1, // WebSocket precisa de sticky sessions
    exec_mode: 'cluster'
  }]
}
```

---

## ✅ Checklist de Implementação

### Backend
- [ ] Instalar `socket.io`
- [ ] Modificar `server.js` para usar HTTP server
- [ ] Configurar Socket.IO com CORS
- [ ] Implementar autenticação Socket.IO
- [ ] Criar eventos: `marcar-lida`, `marcar-todas-lidas`
- [ ] Criar função `emitirNotificacao()`
- [ ] Integrar com rota de criação de notificações
- [ ] Integrar com funções de notificação automática

### Frontend
- [ ] Instalar `socket.io-client`
- [ ] Criar hook `useWebSocketNotifications`
- [ ] Modificar `useNotificacoes` para usar WebSocket
- [ ] Adicionar indicador de conexão
- [ ] Adicionar fallback para REST quando WebSocket desconectado
- [ ] Adicionar notificações push do navegador
- [ ] Configurar variável de ambiente

### Testes
- [ ] Testar conexão/desconexão
- [ ] Testar recebimento de notificações
- [ ] Testar marcar como lida
- [ ] Testar reconexão automática
- [ ] Testar com múltiplos usuários

### Deploy
- [ ] Configurar variáveis de ambiente
- [ ] Configurar proxy reverso (Nginx)
- [ ] Testar em produção
- [ ] Monitorar conexões WebSocket

---

## 📊 Benefícios

### Performance
- ✅ Redução de 95% nas requisições HTTP (de polling a cada 30s para eventos)
- ✅ Notificações instantâneas (< 100ms)
- ✅ Menor carga no servidor

### Experiência do Usuário
- ✅ Notificações em tempo real
- ✅ Menor consumo de bateria (sem polling constante)
- ✅ Funciona mesmo com aba inativa (com notificações push)

### Escalabilidade
- ✅ Suporta milhares de conexões simultâneas
- ✅ Menor uso de banda
- ✅ Melhor para PWA offline

---

## 🐛 Troubleshooting

### Problema: WebSocket não conecta

**Solução:**
- Verificar se token JWT é válido
- Verificar CORS no servidor
- Verificar se porta está aberta
- Verificar logs do servidor

### Problema: Notificações duplicadas

**Solução:**
- Verificar se não há múltiplos listeners
- Verificar se polling está desabilitado quando WebSocket conectado
- Verificar se não há múltiplas instâncias do hook

### Problema: Reconexão não funciona

**Solução:**
- Verificar configuração de `reconnection` no cliente
- Verificar se servidor está acessível
- Verificar timeout de conexão

---

## 📝 Próximos Passos

1. **Implementar WebSocket** (seguir este guia)
2. **Desabilitar polling** quando WebSocket conectado
3. **Adicionar métricas** de conexões WebSocket
4. **Implementar rooms** para grupos de usuários
5. **Adicionar compressão** de mensagens WebSocket

---

**Autor:** Sistema IRBANA  
**Data:** 2025-01-27  
**Versão:** 1.0

