/**
 * Teste Manual de WebSocket
 * 
 * Uso:
 * 1. Obter um token JWT válido (fazer login via API)
 * 2. Substituir TEST_TOKEN abaixo
 * 3. Executar: node src/tests/websocket-manual-test.js
 */

import { io } from 'socket.io-client'

const SOCKET_URL = process.env.WEBSOCKET_URL || 'http://localhost:3001'
const TEST_TOKEN = process.env.TEST_TOKEN || 'SEU_TOKEN_JWT_AQUI'

console.log('🧪 Teste Manual de WebSocket')
console.log('📡 URL:', SOCKET_URL)
console.log('🔑 Token:', TEST_TOKEN.substring(0, 20) + '...')
console.log('')

if (TEST_TOKEN === 'SEU_TOKEN_JWT_AQUI') {
  console.error('❌ Por favor, defina TEST_TOKEN ou configure no .env')
  console.log('')
  console.log('Exemplo:')
  console.log('  TEST_TOKEN=seu_token_aqui node src/tests/websocket-manual-test.js')
  process.exit(1)
}

const socket = io(SOCKET_URL, {
  auth: {
    token: TEST_TOKEN
  },
  transports: ['websocket', 'polling'],
  reconnection: true
})

// Eventos de conexão
socket.on('connect', () => {
  console.log('✅ [TESTE] Conectado ao servidor')
  console.log('   Socket ID:', socket.id)
  console.log('')
})

socket.on('disconnect', (reason) => {
  console.log('❌ [TESTE] Desconectado:', reason)
  console.log('')
})

socket.on('connect_error', (error) => {
  console.error('❌ [TESTE] Erro de conexão:', error.message)
  console.log('')
  process.exit(1)
})

// Evento de autenticação
socket.on('connected', (data) => {
  console.log('✅ [TESTE] Autenticado com sucesso')
  console.log('   User ID:', data.userId)
  console.log('   Timestamp:', data.timestamp)
  console.log('')
  
  // Testar eventos após autenticação
  setTimeout(() => {
    console.log('🧪 [TESTE] Testando eventos...')
    console.log('')
    
    // Teste: Marcar notificação como lida (substituir ID real)
    const testNotificacaoId = '1'
    console.log(`📝 [TESTE] Enviando marcar-lida para notificação ${testNotificacaoId}...`)
    socket.emit('marcar-lida', { notificacaoId: testNotificacaoId })
    
    // Teste: Marcar todas como lidas
    setTimeout(() => {
      console.log('📝 [TESTE] Enviando marcar-todas-lidas...')
      socket.emit('marcar-todas-lidas')
    }, 2000)
  }, 1000)
})

// Evento: Nova notificação
socket.on('nova-notificacao', (notificacao) => {
  console.log('🔔 [TESTE] Nova notificação recebida!')
  console.log('   ID:', notificacao.id)
  console.log('   Título:', notificacao.titulo)
  console.log('   Mensagem:', notificacao.mensagem)
  console.log('   Tipo:', notificacao.tipo)
  console.log('   Lida:', notificacao.lida)
  console.log('')
})

// Evento: Notificação atualizada
socket.on('notificacao-atualizada', (data) => {
  console.log('✅ [TESTE] Notificação atualizada')
  console.log('   ID:', data.id)
  console.log('   Lida:', data.lida)
  console.log('')
})

// Evento: Todas marcadas como lidas
socket.on('todas-marcadas-lidas', (data) => {
  console.log('✅ [TESTE] Todas as notificações foram marcadas como lidas')
  console.log('   Timestamp:', data.timestamp)
  console.log('')
})

// Evento: Erro
socket.on('erro', (data) => {
  console.error('❌ [TESTE] Erro:', data.mensagem)
  console.log('')
})

// Manter conexão aberta por 30 segundos para testes
setTimeout(() => {
  console.log('⏱️  [TESTE] Teste concluído. Desconectando...')
  socket.disconnect()
  process.exit(0)
}, 30000)

console.log('⏳ [TESTE] Aguardando conexão...')
console.log('   (O teste rodará por 30 segundos)')
console.log('')

