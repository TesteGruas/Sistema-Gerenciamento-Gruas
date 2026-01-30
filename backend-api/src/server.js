import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from './config/supabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carregar variáveis de ambiente
const projectRoot = path.resolve(__dirname, '..')
const envPath = path.join(projectRoot, '.env')

console.log('Servidor - Diretório do projeto:', projectRoot)
console.log('Servidor - Caminho do .env:', envPath)

const result = dotenv.config({ path: envPath })
if (result.error) {
  console.error('Servidor - Erro ao carregar .env:', result.error)
  dotenv.config()
} else {
  console.log('Servidor - Arquivo .env carregado com sucesso')
  // Verificar se a chave do Gemini está configurada
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    console.log('✅ Servidor - GOOGLE_GEMINI_API_KEY configurada')
  } else {
    console.warn('⚠️  Servidor - GOOGLE_GEMINI_API_KEY não encontrada no .env')
  }
}

// Importar rotas
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import gruasRoutes from './routes/gruas.js'
import estoqueRoutes from './routes/estoque.js'
import categoriasRoutes from './routes/categorias.js'
import clientesRoutes from './routes/clientes.js'
import obrasRoutes from './routes/obras.js'
import contratosRoutes from './routes/contratos.js'
import funcionariosRoutes from './routes/funcionarios.js'
import funcionariosDocumentosRoutes from './routes/funcionarios-documentos.js'
import equipamentosRoutes from './routes/equipamentos.js'
import relacionamentosRoutes from './routes/relacionamentos.js'
import gestaoGruasRoutes from './routes/gestao-gruas.js'
import livroGruaRoutes from './routes/livro-grua.js'
import relatoriosRoutes from './routes/relatorios.js'
import funcionalidadesAvancadasRoutes from './routes/funcionalidades-avancadas.js'
import arquivosRoutes from './routes/arquivos.js'
import arquivosTestRoutes from './routes/arquivos-test.js'
import custosMensaisRoutes from './routes/custos-mensais.js'
import itensCustosMensaisRoutes from './routes/itens-custos-mensais.js'
import obrasDocumentosRoutes from './routes/obras-documentos.js'
import assinaturasRoutes from './routes/assinaturas.js'
import obrasArquivosRoutes from './routes/obras-arquivos.js'
import vendasRoutes from './routes/vendas.js'
import comprasRoutes from './routes/compras.js'
import transferenciasRoutes from './routes/transferencias.js'
import contasBancariasRoutes from './routes/contas-bancarias.js'
import notasFiscaisRoutes from './routes/notas-fiscais.js'
import impostosRoutes from './routes/impostos.js'
import logisticaRoutes from './routes/logistica.js'
import financialDataRoutes from './routes/financial-data.js'
import orcamentosRoutes from './routes/orcamentos.js'
import locacoesRoutes from './routes/locacoes.js'
import medicoesRoutes from './routes/medicoes.js'
import medicoesMensaisRoutes from './routes/medicoes-mensais.js'
import aditivosRoutes from './routes/aditivos.js'
import notasDebitoRoutes from './routes/notas-debito.js'
import notasFiscaisLocacaoRoutes from './routes/notas-fiscais-locacao.js'
import pontoEletronicoRoutes from './routes/ponto-eletronico.js'
import pontoEletronicoGraficosRoutes from './routes/ponto-eletronico-graficos.js'
import gruaComponentesRoutes from './routes/grua-componentes.js'
import gruaConfiguracoesRoutes from './routes/grua-configuracoes.js'
import gruaObrasRoutes from './routes/grua-obras.js'
import permissoesRoutes from './routes/permissoes.js'
import custosRoutes from './routes/custos.js'
import receitasRoutes from './routes/receitas.js'
import obraGruasRoutes from './routes/obra-gruas.js'
import rhRoutes from './routes/rh.js'
import historicoRoutes from './routes/historico.js'
import historicoComponentesRoutes from './routes/historico-componentes.js'
import cargosRoutes from './routes/cargos.js'
import feriasRoutes from './routes/ferias.js'
import remuneracaoRoutes from './routes/remuneracao.js'
import valesRoutes from './routes/vales.js'
import horasMensaisRoutes from './routes/horas-mensais.js'
import funcionariosObrasRoutes from './routes/funcionarios-obras.js'
import historicoRhRoutes from './routes/historico-rh.js'
import relatoriosRhRoutes from './routes/relatorios-rh.js'
import fornecedoresRoutes from './routes/fornecedores.js'
import produtosRoutes from './routes/produtos.js'
import impostosFinanceirosRoutes from './routes/impostos-financeiros.js'
import tiposImpostosRoutes from './routes/tipos-impostos.js'
import gruasMensaisRoutes from './routes/gruas-mensais.js'
import checklistDevolucaoRoutes from './routes/checklist-devolucao.js'
import notificacoesRoutes from './routes/notificacoes.js'
import emailConfigRoutes from './routes/email-config.js'
import contasReceberRoutes from './routes/contas-receber.js'
import contasPagarRoutes from './routes/contas-pagar.js'
import boletosRoutes from './routes/boletos.js'
import rentabilidadeRoutes from './routes/rentabilidade.js'
import projecoesRoutes from './routes/projecoes.js'
import exportarRelatoriosRoutes from './routes/exportar-relatorios.js'
import exportarRoutes from './routes/exportar.js'
import relatoriosFaturamentoRoutes from './routes/relatorios-faturamento.js'
import relatoriosImpostosRoutes from './routes/relatorios-impostos.js'
import relatoriosOrcamentosRoutes from './routes/relatorios-orcamentos.js'
import relatoriosMedicoesRoutes from './routes/relatorios-medicoes.js'
import relatoriosComponentesRoutes from './routes/relatorios-componentes.js'
import aprovacoesHorasExtrasRoutes from './routes/aprovacoes-horas-extras.js'
import aprovacaoPublicaRoutes from './routes/aprovacao-publica.js'
import buscaGlobalRoutes from './routes/busca-global.js'
import colaboradoresDocumentosRoutes from './routes/colaboradores-documentos.js'
import geocodingRoutes from './routes/geocoding.js'
import checklistDiarioRoutes from './routes/checklist-diario.js'
import manutencoesRoutes from './routes/manutencoes.js'
import ordemComprasRoutes from './routes/ordem-compras.js'
import responsaveisTecnicosRoutes from './routes/responsaveis-tecnicos.js'
import whatsappTestRoutes from './routes/whatsapp-test.js'
import whatsappLogsRoutes from './routes/whatsapp-logs.js'
import whatsappEvolutionRoutes from './routes/whatsapp-evolution.js'
import complementosRoutes from './routes/complementos.js'
import alugueisResidenciasRoutes from './routes/alugueis-residencias.js'
import avatarRoutes from './routes/avatar.js'
import chatIaRoutes from './routes/chat-ia.js'
import configuracoesRoutes from './routes/configuracoes.js'

// Importar jobs
import { iniciarJobVerificacaoAprovacoes } from './jobs/verificar-aprovacoes.js'
import { inicializarScheduler } from './jobs/scheduler.js'

// Importar Redis
import { initRedis } from './config/redis.js'

const app = express()
const PORT = process.env.PORT || 3001

// Criar servidor HTTP para Socket.IO
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

    // Verificar token JWT
    let decoded
    try {
      // Tentar verificar como JWT primeiro
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (jwtError) {
      // Se falhar, tentar verificar com Supabase Auth
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        return next(new Error('Token inválido'))
      }
      decoded = {
        id: user.id,
        email: user.email
      }
    }
    
    // Buscar usuario_id (pode ser UUID ou integer)
    let userId = decoded.id
    
    // Se é UUID, buscar ID inteiro
    if (typeof userId === 'string' && userId.includes('-')) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', decoded.email)
        .single()
      
      if (userError || !userData) {
        return next(new Error('Usuário não encontrado'))
      }
      
      userId = userData.id
    }
    
    socket.userId = userId
    socket.userEmail = decoded.email
    
    next()
  } catch (error) {
    console.error('❌ [WebSocket] Erro na autenticação:', error.message)
    next(new Error('Token inválido'))
  }
})

// Gerenciar conexões WebSocket
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

// Inicializar Redis (opcional, não bloqueia se falhar)
initRedis().catch(err => {
  console.error('Erro ao inicializar Redis:', err)
})

// ========================================
// CORS RESTRITO - SEGURANÇA
// ========================================

// Configurar origens permitidas
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const isProduction = process.env.NODE_ENV === 'production'

// Origens permitidas em desenvolvimento
const devOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://72.60.60.118:3000', // Servidor de produção - frontend
  'http://72.60.60.118:3001', // Servidor de produção - backend (para testes)
]

// Origens permitidas em produção (apenas via variável de ambiente)
const prodOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : []

// Origens finais baseadas no ambiente
// Em produção, sempre incluir FRONTEND_URL e origem do servidor
const allowedOrigins = isProduction 
  ? [
      ...prodOrigins,
      FRONTEND_URL,
      'http://72.60.60.118:3000', // Sempre permitir frontend do servidor
    ].filter((origin, index, self) => self.indexOf(origin) === index) // Remover duplicatas
  : [...devOrigins, ...prodOrigins].filter((origin, index, self) => self.indexOf(origin) === index) // Remover duplicatas

// CORS restrito com validação de origem
app.use((req, res, next) => {
  const origin = req.headers.origin
  const method = req.method
  
  // Em produção, SEMPRE validar origem
  if (isProduction) {
    if (origin) {
      if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Credentials', 'true')
      } else {
        // Bloquear origem não permitida em produção
        console.warn(`🚫 CORS bloqueado em produção: Origin ${origin} não está na lista de origens permitidas`)
        console.warn(`📋 Origens permitidas: ${allowedOrigins.join(', ')}`)
        
        if (method === 'OPTIONS') {
          return res.status(403).json({ 
            error: 'Origin not allowed',
            message: 'A origem da requisição não está na lista de origens permitidas'
          })
        }
        // Para requisições não-OPTIONS, continuar mas sem header CORS
      }
    } else {
      // Requisições sem origin em produção são bloqueadas (exceto se for requisição direta do servidor)
      if (method === 'OPTIONS') {
        return res.status(403).json({ 
          error: 'Origin required',
          message: 'Requisições devem incluir header Origin em produção'
        })
      }
    }
  } else {
    // Em desenvolvimento, ser mais permissivo mas ainda validar quando possível
    if (origin) {
      if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Credentials', 'true')
      } else {
        // Em desenvolvimento, permitir mas avisar
        console.warn(`⚠️  CORS: Origin ${origin} não está na lista, mas permitindo em desenvolvimento`)
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Credentials', 'true')
      }
    } else {
      // Requisições sem origin em desenvolvimento são permitidas (Postman, curl, etc.)
      res.header('Access-Control-Allow-Origin', '*')
    }
  }
  
  // Headers CORS permitidos
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, User-Agent, X-Forwarded-For')
  res.header('Access-Control-Max-Age', '86400')
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range')
  
  // Para requisições OPTIONS (preflight), responder imediatamente
  if (method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  next()
})

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gerenciamento de Gruas API',
      version: '1.0.0',
      description: 'API REST para gerenciamento de gruas, estoque e clientes',
      contact: {
        name: 'Sistema IRBANA',
        email: 'contato@irbana.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desenvolvimento'
      },
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
}

const specs = swaggerJsdoc(swaggerOptions)

// Middlewares de segurança (relaxados)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

// Compressão de respostas HTTP (gzip/deflate)
// Comprime respostas JSON, HTML, CSS, JS, etc. para reduzir o tamanho das transferências
app.use(compression({
  level: 6, // Nível de compressão (0-9, 6 é um bom equilíbrio entre velocidade e tamanho)
  threshold: 1024, // Comprimir apenas respostas maiores que 1KB
  filter: (req, res) => {
    // Não comprimir se o cliente não suporta compressão
    if (req.headers['x-no-compression']) {
      return false
    }
    // Usar o filtro padrão do compression
    return compression.filter(req, res)
  }
}))

// Middlewares de parsing (antes do rate limiter para permitir verificação de email)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting (permissivo) - Excluindo rotas de configurações e login
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.'
  },
  skip: (req) => {
    // Excluir rotas de configurações do rate limit
    if (req.path.startsWith('/api/configuracoes')) {
      return true
    }
    // Excluir endpoint de login do rate limit global (rate limit do Supabase já é suficiente)
    if (req.path === '/api/auth/login' && req.method === 'POST') {
      return true
    }
    return false
  }
})
app.use(limiter)

// Logging
app.use(morgan('combined'))

// Documentação da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Sistema IRBANA'
}))

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    cors: `RESTRICTED - Allowed origins: ${allowedOrigins.join(', ')}`,
    request: {
      origin: req.headers.origin,
      method: req.method,
      userAgent: req.headers['user-agent']
    }
  })
})

// Rota de teste específica para CORS
app.get('/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS está funcionando!',
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString(),
    headers: req.headers
  })
})

// Teste POST para simular login
app.post('/test-login', (req, res) => {
  res.json({
    success: true,
    message: 'POST funcionando com CORS!',
    origin: req.headers.origin,
    body: req.body,
    timestamp: new Date().toISOString()
  })
})

// Rotas da API
app.use('/api/auth', authRoutes)

// Rotas de compatibilidade - redirecionamento para /auth/login
app.use('/auth', authRoutes)

// Rotas públicas (sem autenticação)
app.use('/api/aprovacao', aprovacaoPublicaRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/gruas', gruasRoutes)
app.use('/api/estoque', estoqueRoutes)
app.use('/api/categorias', categoriasRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/obras', obrasRoutes)
app.use('/api/contratos', contratosRoutes)
app.use('/api/funcionarios', funcionariosRoutes)
app.use('/api/funcionarios/documentos', funcionariosDocumentosRoutes)
app.use('/api/avatar', avatarRoutes)
app.use('/api/equipamentos', equipamentosRoutes)
app.use('/api/relacionamentos', relacionamentosRoutes)
app.use('/api/gestao-gruas', gestaoGruasRoutes)
app.use('/api/livro-grua', livroGruaRoutes)
app.use('/api/relatorios', relatoriosRoutes)
app.use('/api/funcionalidades-avancadas', funcionalidadesAvancadasRoutes)
app.use('/api/arquivos', arquivosRoutes)
app.use('/api/arquivos-test', arquivosTestRoutes)
app.use('/api/custos-mensais', custosMensaisRoutes)
app.use('/api/itens-custos-mensais', itensCustosMensaisRoutes)
app.use('/api/obras-documentos', obrasDocumentosRoutes)
app.use('/api/assinaturas', assinaturasRoutes)
app.use('/api/obras-arquivos', obrasArquivosRoutes)
app.use('/api/vendas', vendasRoutes)
app.use('/api/compras', comprasRoutes)
app.use('/api/transferencias', transferenciasRoutes)
app.use('/api/contas-bancarias', contasBancariasRoutes)
app.use('/api/notas-fiscais', notasFiscaisRoutes)
app.use('/api/impostos', impostosRoutes)
app.use('/api/logistica', logisticaRoutes)
app.use('/api/financial-data', financialDataRoutes)
app.use('/api/orcamentos', orcamentosRoutes)
app.use('/api/locacoes', locacoesRoutes)
app.use('/api/medicoes', medicoesRoutes)
app.use('/api/medicoes-mensais', medicoesMensaisRoutes)
app.use('/api/aditivos', aditivosRoutes)
app.use('/api/notas-debito', notasDebitoRoutes)
app.use('/api/notas-fiscais-locacao', notasFiscaisLocacaoRoutes)
app.use('/api/ponto-eletronico', pontoEletronicoRoutes)
app.use('/api/ponto-eletronico/graficos', pontoEletronicoGraficosRoutes)
app.use('/api/grua-componentes', gruaComponentesRoutes)
app.use('/api/grua-configuracoes', gruaConfiguracoesRoutes)
app.use('/api/grua-obras', gruaObrasRoutes)
app.use('/api/permissoes', permissoesRoutes)
app.use('/api/custos', custosRoutes)
app.use('/api/receitas', receitasRoutes)
app.use('/api/obra-gruas', obraGruasRoutes)
app.use('/api/rh', rhRoutes)
app.use('/api/historico', historicoRoutes)
app.use('/api/historico-componentes', historicoComponentesRoutes)
app.use('/api/cargos', cargosRoutes)
app.use('/api/ferias', feriasRoutes)
app.use('/api/remuneracao', remuneracaoRoutes)
app.use('/api/vales', valesRoutes)
app.use('/api/horas-mensais', horasMensaisRoutes)
app.use('/api/funcionarios-obras', funcionariosObrasRoutes)
app.use('/api/historico-rh', historicoRhRoutes)
app.use('/api/relatorios-rh', relatoriosRhRoutes)
app.use('/api/fornecedores', fornecedoresRoutes)
app.use('/api/produtos', produtosRoutes)
app.use('/api/impostos-financeiros', impostosFinanceirosRoutes)
app.use('/api/tipos-impostos', tiposImpostosRoutes)
app.use('/api/gruas-mensais', gruasMensaisRoutes)
app.use('/api/checklist-devolucao', checklistDevolucaoRoutes)
app.use('/api/notificacoes', notificacoesRoutes)
app.use('/api/email-config', emailConfigRoutes)
app.use('/api/configuracoes', configuracoesRoutes)
app.use('/api/contas-receber', contasReceberRoutes)
app.use('/api/contas-pagar', contasPagarRoutes)
app.use('/api/boletos', boletosRoutes)
app.use('/api/rentabilidade', rentabilidadeRoutes)
app.use('/api/projecoes', projecoesRoutes)
app.use('/api/exportar-relatorios', exportarRelatoriosRoutes)
app.use('/api/exportar', exportarRoutes)
app.use('/api/relatorios-faturamento', relatoriosFaturamentoRoutes)
app.use('/api/relatorios-impostos', relatoriosImpostosRoutes)
app.use('/api/relatorios', relatoriosOrcamentosRoutes)
app.use('/api/relatorios', relatoriosMedicoesRoutes)
app.use('/api/relatorios', relatoriosComponentesRoutes)
app.use('/api/aprovacoes-horas-extras', aprovacoesHorasExtrasRoutes)
app.use('/api/busca-global', buscaGlobalRoutes)
app.use('/api/colaboradores', colaboradoresDocumentosRoutes)
app.use('/api/checklist-diario', checklistDiarioRoutes)
app.use('/api/manutencoes', manutencoesRoutes)
app.use('/api/ordem-compras', ordemComprasRoutes)
app.use('/api/responsaveis-tecnicos', responsaveisTecnicosRoutes)
app.use('/api/whatsapp', whatsappTestRoutes)
app.use('/api/whatsapp-logs', whatsappLogsRoutes)
app.use('/api/whatsapp-evolution', whatsappEvolutionRoutes)
app.use('/api/complementos', complementosRoutes)
app.use('/api/alugueis-residencias', alugueisResidenciasRoutes)
app.use('/api/geocoding', geocodingRoutes)
app.use('/api/chat-ia', chatIaRoutes)

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Gerenciamento de Gruas API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
    testCors: '/test-cors',
    testLogin: '/test-login',
    cors: 'MANUAL CONFIGURATION - All origins allowed'
  })
})

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err)
  
  // Garantir CORS mesmo em erros
  if (!res.headersSent) {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.header('Access-Control-Allow-Credentials', 'true')
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.details
    })
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Token inválido ou expirado'
    })
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  })
})

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`)
  
  // Garantir CORS para 404
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  })
})

// Iniciar jobs
iniciarJobVerificacaoAprovacoes()
inicializarScheduler()

// Iniciar servidor HTTP (com WebSocket)
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ==========================================')
  console.log(`📡 Servidor HTTP rodando na porta ${PORT}`)
  console.log(`🔌 WebSocket Server ativo`)
  console.log(`🏠 Escutando em TODAS as interfaces (0.0.0.0)`)
  console.log('🌐 Disponível em:')
  console.log(`   http://localhost:${PORT}`)
  console.log(`   http://127.0.0.1:${PORT}`)
  console.log(`📚 Documentação: http://localhost:${PORT}/api-docs`)
  console.log(`🏥 Health: http://localhost:${PORT}/health`)
  console.log(`🧪 Teste CORS: http://localhost:${PORT}/test-cors`)
  console.log(`🔑 Teste Login: http://localhost:${PORT}/test-login`)
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 CORS: RESTRITO - Origens permitidas: ${allowedOrigins.join(', ')}`)
  console.log('🚀 ==========================================')
})

export default app