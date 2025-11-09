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
import aditivosRoutes from './routes/aditivos.js'
import orcamentosLocacaoRoutes from './routes/orcamentos-locacao.js'
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
import gruasMensaisRoutes from './routes/gruas-mensais.js'
import checklistDevolucaoRoutes from './routes/checklist-devolucao.js'
import notificacoesRoutes from './routes/notificacoes.js'
import emailConfigRoutes from './routes/email-config.js'
import contasReceberRoutes from './routes/contas-receber.js'
import contasPagarRoutes from './routes/contas-pagar.js'
import rentabilidadeRoutes from './routes/rentabilidade.js'
import projecoesRoutes from './routes/projecoes.js'
import exportarRelatoriosRoutes from './routes/exportar-relatorios.js'
import relatoriosFaturamentoRoutes from './routes/relatorios-faturamento.js'
import relatoriosImpostosRoutes from './routes/relatorios-impostos.js'
import aprovacoesHorasExtrasRoutes from './routes/aprovacoes-horas-extras.js'
import aprovacaoPublicaRoutes from './routes/aprovacao-publica.js'
import buscaGlobalRoutes from './routes/busca-global.js'
import colaboradoresDocumentosRoutes from './routes/colaboradores-documentos.js'
import checklistDiarioRoutes from './routes/checklist-diario.js'
import manutencoesRoutes from './routes/manutencoes.js'
import ordemComprasRoutes from './routes/ordem-compras.js'
import responsaveisTecnicosRoutes from './routes/responsaveis-tecnicos.js'
import whatsappTestRoutes from './routes/whatsapp-test.js'

// Importar jobs
import { iniciarJobVerificacaoAprovacoes } from './jobs/verificar-aprovacoes.js'
import { inicializarScheduler } from './jobs/scheduler.js'

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
app.use('/api/equipamentos', equipamentosRoutes)
app.use('/api/relacionamentos', relacionamentosRoutes)
app.use('/api/gestao-gruas', gestaoGruasRoutes)
app.use('/api/livro-grua', livroGruaRoutes)
app.use('/api/relatorios', relatoriosRoutes)
app.use('/api/funcionalidades-avancadas', funcionalidadesAvancadasRoutes)
app.use('/api/arquivos', arquivosRoutes)
app.use('/api/arquivos-test', arquivosTestRoutes)
app.use('/api/custos-mensais', custosMensaisRoutes)
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
app.use('/api/aditivos', aditivosRoutes)
app.use('/api/orcamentos-locacao', orcamentosLocacaoRoutes)
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
app.use('/api/gruas-mensais', gruasMensaisRoutes)
app.use('/api/checklist-devolucao', checklistDevolucaoRoutes)
app.use('/api/notificacoes', notificacoesRoutes)
app.use('/api/email-config', emailConfigRoutes)
app.use('/api/contas-receber', contasReceberRoutes)
app.use('/api/contas-pagar', contasPagarRoutes)
app.use('/api/rentabilidade', rentabilidadeRoutes)
app.use('/api/projecoes', projecoesRoutes)
app.use('/api/exportar-relatorios', exportarRelatoriosRoutes)
app.use('/api/relatorios-faturamento', relatoriosFaturamentoRoutes)
app.use('/api/relatorios-impostos', relatoriosImpostosRoutes)
app.use('/api/aprovacoes-horas-extras', aprovacoesHorasExtrasRoutes)
app.use('/api/busca-global', buscaGlobalRoutes)
app.use('/api/colaboradores', colaboradoresDocumentosRoutes)
app.use('/api/checklist-diario', checklistDiarioRoutes)
app.use('/api/manutencoes', manutencoesRoutes)
app.use('/api/ordem-compras', ordemComprasRoutes)
app.use('/api/responsaveis-tecnicos', responsaveisTecnicosRoutes)
app.use('/api/whatsapp', whatsappTestRoutes)

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

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ==========================================')
  console.log(`📡 Servidor rodando na porta ${PORT}`)
  console.log(`🏠 Escutando em TODAS as interfaces (0.0.0.0)`)
  console.log('🌐 Disponível em:')
  console.log(`   http://localhost:${PORT}`)
  console.log(`   http://127.0.0.1:${PORT}`)
  console.log(`📚 Documentação: http://localhost:${PORT}/api-docs`)
  console.log(`🏥 Health: http://localhost:${PORT}/health`)
  console.log(`🧪 Teste CORS: http://localhost:${PORT}/test-cors`)
  console.log(`🔑 Teste Login: http://localhost:${PORT}/test-login`)
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔓 CORS: CONFIGURAÇÃO MANUAL - TOTALMENTE LIBERADO`)
  console.log('🚀 ==========================================')
})

export default app