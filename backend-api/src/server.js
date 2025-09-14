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

// Carregar variáveis de ambiente do arquivo .env no diretório backend-api
const projectRoot = path.resolve(__dirname, '..')
const envPath = path.join(projectRoot, '.env')

console.log('Servidor - Diretório do projeto:', projectRoot)
console.log('Servidor - Caminho do .env:', envPath)

const result = dotenv.config({ path: envPath })
if (result.error) {
  console.error('Servidor - Erro ao carregar .env:', result.error)
  // Tentar carregar do diretório atual como fallback
  dotenv.config()
} else {
  console.log('Servidor - Arquivo .env carregado com sucesso')
}

// Importar rotas
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import gruasRoutes from './routes/gruas.js'
import estoqueRoutes from './routes/estoque.js'
import clientesRoutes from './routes/clientes.js'
import obrasRoutes from './routes/obras.js'
import contratosRoutes from './routes/contratos.js'
import funcionariosRoutes from './routes/funcionarios.js'
import equipamentosRoutes from './routes/equipamentos.js'
import relacionamentosRoutes from './routes/relacionamentos.js'
import arquivosRoutes from './routes/arquivos.js'
import arquivosTestRoutes from './routes/arquivos-test.js'

const app = express()
const PORT = process.env.PORT || 3001

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

// Middlewares de segurança
app.use(helmet())

// Configuração CORS mais permissiva para desenvolvimento
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true)
    
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://http//72.60.60.118:3001',
      'http://http//72.60.60.118:3000',
      'http://127.0.0.1:3001',
      // Permitir IPs da rede local (192.168.x.x)
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3001$/,
      process.env.FRONTEND_URL
    ].filter(Boolean)
    
    // Verificar se a origin está na lista de permitidas (incluindo regex)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin)
      }
      return false
    })
    
    if (isAllowed) {
      callback(null, true)
    } else {
      console.log('CORS: Origin não permitida:', origin)
      callback(new Error('Não permitido pelo CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}

app.use(cors(corsOptions))

// Middleware para lidar com requisições OPTIONS (preflight)
app.options('*', (req, res) => {
  const origin = req.headers.origin
  
  // Verificar se a origin é permitida
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
     'http://http//72.60.60.118:3001',
      'http://http//72.60.60.118:3000',
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3001$/
  ]
  
  const isAllowed = !origin || allowedOrigins.some(allowedOrigin => {
    if (typeof allowedOrigin === 'string') {
      return allowedOrigin === origin
    } else if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin)
    }
    return false
  })
  
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*')
  } else {
    res.header('Access-Control-Allow-Origin', '*')
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(200)
})

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
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
    environment: process.env.NODE_ENV || 'development'
  })
})

// Rotas da API
app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/gruas', gruasRoutes)
app.use('/api/estoque', estoqueRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/obras', obrasRoutes)
app.use('/api/contratos', contratosRoutes)
app.use('/api/funcionarios', funcionariosRoutes)
app.use('/api/equipamentos', equipamentosRoutes)
app.use('/api/relacionamentos', relacionamentosRoutes)
app.use('/api/arquivos', arquivosRoutes)
app.use('/api/arquivos-test', arquivosTestRoutes)

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Gerenciamento de Gruas API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health'
  })
})

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err)
  
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
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📚 Documentação: http://localhost:${PORT}/api-docs`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health`)
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development---'}`)
})

export default app
