import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

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
import equipamentosRoutes from './routes/equipamentos.js'
import relacionamentosRoutes from './routes/relacionamentos.js'
import gestaoGruasRoutes from './routes/gestao-gruas.js'
import livroGruaRoutes from './routes/livro-grua.js'
import relatoriosRoutes from './routes/relatorios.js'
import funcionalidadesAvancadasRoutes from './routes/funcionalidades-avancadas.js'
import arquivosRoutes from './routes/arquivos.js'
import arquivosTestRoutes from './routes/arquivos-test.js'
import custosMensaisRoutes from './routes/custos-mensais.js'
import obrasDocumentosRoutes from './routes/obras-documentos.js'
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
import aditivosRoutes from './routes/aditivos.js'
import orcamentosLocacaoRoutes from './routes/orcamentos-locacao.js'
import notasDebitoRoutes from './routes/notas-debito.js'
import notasFiscaisLocacaoRoutes from './routes/notas-fiscais-locacao.js'
import pontoEletronicoRoutes from './routes/ponto-eletronico.js'
import gruaComponentesRoutes from './routes/grua-componentes.js'
import gruaConfiguracoesRoutes from './routes/grua-configuracoes.js'
import gruaObrasRoutes from './routes/grua-obras.js'
import permissoesRoutes from './routes/permissoes.js'
import custosRoutes from './routes/custos.js'
import receitasRoutes from './routes/receitas.js'
import obraGruasRoutes from './routes/obra-gruas.js'
import rhRoutes from './routes/rh.js'
import historicoRoutes from './routes/historico.js'

const app = express()
const PORT = process.env.PORT || 3001

// ========================================
// CORS DEFINITIVO - FUNCIONA 100%
// ========================================

// CORS manual com logs detalhados
app.use((req, res, next) => {
  const origin = req.headers.origin
  const method = req.method
  const url = req.url
  
  console.log(`🌐 ${method} ${url} - Origin: ${origin || 'sem origin'}`)
  
  // Headers CORS obrigatórios para TODAS as requisições
  res.header('Access-Control-Allow-Origin', origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, User-Agent, X-Forwarded-For')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Max-Age', '86400')
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range')
  
  // Para requisições OPTIONS (preflight), responder imediatamente
  if (method === 'OPTIONS') {
    console.log(`✅ PREFLIGHT respondido para ${origin}`)
    return res.status(200).end()
  }
  
  console.log(`➡️ Requisição ${method} prosseguindo para ${url}`)
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

// Rate limiting (permissivo)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.'
  }
})
app.use(limiter)

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

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
    cors: 'ENABLED - Manual configuration',
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
app.use('/api/users', usersRoutes)
app.use('/api/gruas', gruasRoutes)
app.use('/api/estoque', estoqueRoutes)
app.use('/api/categorias', categoriasRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/obras', obrasRoutes)
app.use('/api/contratos', contratosRoutes)
app.use('/api/funcionarios', funcionariosRoutes)
app.use('/api/equipamentos', equipamentosRoutes)
app.use('/api/relacionamentos', relacionamentosRoutes)
app.use('/api/gestao-gruas', gestaoGruasRoutes)
app.use('/api/livro-grua', livroGruaRoutes)
app.use('/api/relatorios', relatoriosRoutes)
app.use('/api/funcionalidades-avancadas', funcionalidadesAvancadasRoutes)
app.use('/api/arquivos', arquivosRoutes)
app.use('/api/arquivos-test', arquivosTestRoutes)
app.use('/api/custos-mensais', custosMensaisRoutes)
app.use('/api/obras', obrasDocumentosRoutes)
app.use('/api/obras', obrasArquivosRoutes)
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
app.use('/api/aditivos', aditivosRoutes)
app.use('/api/orcamentos-locacao', orcamentosLocacaoRoutes)
app.use('/api/notas-debito', notasDebitoRoutes)
app.use('/api/notas-fiscais-locacao', notasFiscaisLocacaoRoutes)
app.use('/api/ponto-eletronico', pontoEletronicoRoutes)
app.use('/api/grua-componentes', gruaComponentesRoutes)
app.use('/api/grua-configuracoes', gruaConfiguracoesRoutes)
app.use('/api/grua-obras', gruaObrasRoutes)
app.use('/api/permissoes', permissoesRoutes)
app.use('/api/custos', custosRoutes)
app.use('/api/receitas', receitasRoutes)
app.use('/api/obra-gruas', obraGruasRoutes)
app.use('/api/rh', rhRoutes)
app.use('/api/historico', historicoRoutes)

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

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ==========================================')
  console.log(`📡 Servidor rodando na porta ${PORT}`)
  console.log(`🏠 Escutando em TODAS as interfaces (0.0.0.0)`)
  console.log('🌐 Disponível em:')
  console.log(`   http://localhost:${PORT}`)
  console.log(`   http://127.0.0.1:${PORT}`)
  console.log(`   http://72.60.60.118:${PORT}`)
  console.log(`📚 Documentação: http://localhost:${PORT}/api-docs`)
  console.log(`🏥 Health: http://localhost:${PORT}/health`)
  console.log(`🧪 Teste CORS: http://localhost:${PORT}/test-cors`)
  console.log(`🔑 Teste Login: http://localhost:${PORT}/test-login`)
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔓 CORS: CONFIGURAÇÃO MANUAL - TOTALMENTE LIBERADO`)
  console.log('🚀 ==========================================')
})

export default app