/**
 * Rotas para funcionalidades avançadas
 * Sistema de Gerenciamento de Gruas
 * 
 * Funcionalidades:
 * - Notificações automáticas
 * - Calendário de locação
 * - Backup de dados
 * - Auditoria de operações
 * - Integrações externas
 * - Webhooks
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schemas de validação
const notificacaoSchema = Joi.object({
  tipo: Joi.string().valid('manutencao', 'vencimento_contrato', 'transferencia', 'alerta_geral').required(),
  titulo: Joi.string().min(5).max(100).required(),
  mensagem: Joi.string().min(10).max(500).required(),
  prioridade: Joi.string().valid('baixa', 'media', 'alta', 'critica').default('media'),
  destinatarios: Joi.array().items(Joi.string().email()).optional(),
  agendamento: Joi.date().optional()
})

const calendarioSchema = Joi.object({
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().required(),
  view: Joi.string().valid('dia', 'semana', 'mes', 'ano').default('mes'),
  filtros: Joi.object({
    grua_id: Joi.string().optional(),
    obra_id: Joi.number().integer().optional(),
    tipo_evento: Joi.string().valid('locacao', 'manutencao', 'transferencia', 'todos').default('todos')
  }).optional()
})

const auditoriaSchema = Joi.object({
  data_inicio: Joi.date().optional(),
  data_fim: Joi.date().optional(),
  usuario_id: Joi.number().integer().optional(),
  acao: Joi.string().optional(),
  entidade: Joi.string().optional(),
  limite: Joi.number().integer().min(1).max(1000).default(100)
})

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

/**
 * Enviar notificação (simulação - em produção usar serviço real)
 */
const enviarNotificacao = async (notificacao) => {
  console.log('📧 Enviando notificação:', {
    tipo: notificacao.tipo,
    titulo: notificacao.titulo,
    prioridade: notificacao.prioridade,
    destinatarios: notificacao.destinatarios?.length || 'todos'
  })

  // Em produção, aqui seria integrado com:
  // - Email (SendGrid, AWS SES, etc.)
  // - SMS (Twilio, etc.)
  // - Push notifications
  // - Slack/Discord webhooks
  // - Sistema interno de notificações

  return {
    enviada: true,
    timestamp: new Date().toISOString(),
    metodo: 'simulado'
  }
}

/**
 * Criar log de auditoria
 */
const criarLogAuditoria = async (dados) => {
  const { data, error } = await supabaseAdmin
    .from('logs_auditoria')
    .insert([{
      usuario_id: dados.usuario_id,
      acao: dados.acao,
      entidade: dados.entidade,
      entidade_id: dados.entidade_id,
      dados_anteriores: dados.dados_anteriores,
      dados_novos: dados.dados_novos,
      ip_address: dados.ip_address,
      user_agent: dados.user_agent,
      timestamp: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar log de auditoria:', error)
  }

  return data
}

/**
 * Gerar backup dos dados
 */
const gerarBackup = async (tipo = 'completo') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = {
    metadata: {
      tipo,
      timestamp,
      versao: '1.0.0',
      gerado_por: 'sistema'
    },
    dados: {}
  }

  try {
    // Backup de gruas
    const { data: gruas } = await supabaseAdmin
      .from('gruas')
      .select('*')
    backup.dados.gruas = gruas || []

    // Backup de obras
    const { data: obras } = await supabaseAdmin
      .from('obras')
      .select('*')
    backup.dados.obras = obras || []

    // Backup de clientes
    const { data: clientes } = await supabaseAdmin
      .from('clientes')
      .select('*')
    backup.dados.clientes = clientes || []

    // Backup de funcionários
    const { data: funcionarios } = await supabaseAdmin
      .from('funcionarios')
      .select('*')
    backup.dados.funcionarios = funcionarios || []

    // Backup de relacionamentos
    const { data: relacionamentos } = await supabaseAdmin
      .from('grua_obra')
      .select('*')
    backup.dados.relacionamentos = relacionamentos || []

    // Backup de histórico
    const { data: historico } = await supabaseAdmin
      .from('historico_locacoes')
      .select('*')
    backup.dados.historico = historico || []

    return backup

  } catch (error) {
    throw new Error(`Erro ao gerar backup: ${error.message}`)
  }
}

// =====================================================
// NOTIFICAÇÕES AUTOMÁTICAS
// =====================================================

/**
 * @swagger
 * /api/funcionalidades-avancadas/notificacoes:
 *   post:
 *     summary: Enviar notificação
 *     tags: [Funcionalidades Avançadas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - titulo
 *               - mensagem
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [manutencao, vencimento_contrato, transferencia, alerta_geral]
 *               titulo:
 *                 type: string
 *               mensagem:
 *                 type: string
 *               prioridade:
 *                 type: string
 *                 enum: [baixa, media, alta, critica]
 *               destinatarios:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *               agendamento:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Notificação enviada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/notificacoes', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = notificacaoSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Enviar notificação
    const resultado = await enviarNotificacao(value)

    // Salvar no banco (opcional)
    const { data: notificacao, error: saveError } = await supabaseAdmin
      .from('notificacoes')
      .insert([{
        tipo: value.tipo,
        titulo: value.titulo,
        mensagem: value.mensagem,
        prioridade: value.prioridade,
        destinatarios: value.destinatarios,
        agendamento: value.agendamento,
        status: 'enviada',
        enviada_em: new Date().toISOString()
      }])
      .select()
      .single()

    if (saveError) {
      console.warn('Erro ao salvar notificação:', saveError.message)
    }

    res.json({
      success: true,
      data: {
        notificacao: notificacao || null,
        envio: resultado
      },
      message: 'Notificação enviada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/funcionalidades-avancadas/notificacoes/automaticas:
 *   get:
 *     summary: Verificar notificações automáticas pendentes
 *     tags: [Funcionalidades Avançadas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificações automáticas
 */
router.get('/notificacoes/automaticas', async (req, res) => {
  try {
    const notificacoes = []

    // Verificar manutenções próximas
    const proximaSemana = new Date()
    proximaSemana.setDate(proximaSemana.getDate() + 7)

    const { data: manutencoesProximas } = await supabaseAdmin
      .from('gruas')
      .select('id, modelo, fabricante, proxima_manutencao')
      .not('proxima_manutencao', 'is', null)
      .lte('proxima_manutencao', proximaSemana.toISOString().split('T')[0])

    if (manutencoesProximas && manutencoesProximas.length > 0) {
      manutencoesProximas.forEach(grua => {
        const diasRestantes = Math.ceil((new Date(grua.proxima_manutencao) - new Date()) / (1000 * 60 * 60 * 24))
        notificacoes.push({
          tipo: 'manutencao',
          prioridade: diasRestantes <= 3 ? 'alta' : 'media',
          titulo: `Manutenção próxima - ${grua.modelo}`,
          mensagem: `A grua ${grua.modelo} (${grua.fabricante}) tem manutenção programada em ${diasRestantes} dias`,
          dados: {
            grua_id: grua.id,
            data_manutencao: grua.proxima_manutencao,
            dias_restantes: diasRestantes
          }
        })
      })
    }

    // Verificar contratos próximos do vencimento
    const proximoMes = new Date()
    proximoMes.setMonth(proximoMes.getMonth() + 1)

    const { data: contratosVencendo } = await supabaseAdmin
      .from('grua_obra')
      .select(`
        *,
        grua:gruas(modelo, fabricante),
        obra:obras(nome, cliente:clientes(nome))
      `)
      .eq('status', 'Ativa')
      .not('data_fim_locacao', 'is', null)
      .lte('data_fim_locacao', proximoMes.toISOString().split('T')[0])

    if (contratosVencendo && contratosVencendo.length > 0) {
      contratosVencendo.forEach(contrato => {
        const diasRestantes = Math.ceil((new Date(contrato.data_fim_locacao) - new Date()) / (1000 * 60 * 60 * 24))
        notificacoes.push({
          tipo: 'vencimento_contrato',
          prioridade: diasRestantes <= 7 ? 'alta' : 'media',
          titulo: `Contrato próximo do vencimento`,
          mensagem: `Contrato da grua ${contrato.grua?.modelo} na obra ${contrato.obra?.nome} vence em ${diasRestantes} dias`,
          dados: {
            contrato_id: contrato.id,
            data_vencimento: contrato.data_fim_locacao,
            dias_restantes: diasRestantes
          }
        })
      })
    }

    // Verificar gruas com baixa utilização
    const { data: todasGruas } = await supabaseAdmin
      .from('gruas')
      .select('id, modelo, fabricante, status')

    const gruasBaixaUtilizacao = []
    for (const grua of todasGruas || []) {
      const { data: locacoes } = await supabaseAdmin
        .from('historico_locacoes')
        .select('data_inicio, data_fim')
        .eq('grua_id', grua.id)
        .gte('data_inicio', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (!locacoes || locacoes.length === 0) {
        gruasBaixaUtilizacao.push(grua)
      }
    }

    if (gruasBaixaUtilizacao.length > 0) {
      notificacoes.push({
        tipo: 'alerta_geral',
        prioridade: 'baixa',
        titulo: 'Gruas com baixa utilização',
        mensagem: `${gruasBaixaUtilizacao.length} grua(s) sem locação nos últimos 30 dias`,
        dados: {
          gruas: gruasBaixaUtilizacao.map(g => ({ id: g.id, modelo: g.modelo }))
        }
      })
    }

    res.json({
      success: true,
      data: {
        total_notificacoes: notificacoes.length,
        notificacoes: notificacoes.sort((a, b) => {
          const prioridadeOrder = { 'alta': 4, 'media': 3, 'baixa': 2, 'critica': 5 }
          return prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade]
        })
      }
    })

  } catch (error) {
    console.error('Erro ao verificar notificações automáticas:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// CALENDÁRIO DE LOCAÇÃO
// =====================================================

/**
 * @swagger
 * /api/funcionalidades-avancadas/calendario:
 *   get:
 *     summary: Obter calendário de locações
 *     tags: [Funcionalidades Avançadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período
 *       - in: query
 *         name: data_fim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [dia, semana, mes, ano]
 *           default: mes
 *         description: Visualização do calendário
 *     responses:
 *       200:
 *         description: Dados do calendário
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/calendario', async (req, res) => {
  try {
    // Validar parâmetros
    const { error, value } = calendarioSchema.validate(req.query)
    if (error) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      })
    }

    const { data_inicio, data_fim, view, filtros } = value

    // Buscar eventos de locação
    let query = supabaseAdmin
      .from('grua_obra')
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo),
        obra:obras(id, nome, endereco, cliente:clientes(nome))
      `)
      .gte('data_inicio_locacao', data_inicio)
      .lte('data_fim_locacao', data_fim)

    if (filtros?.grua_id) {
      query = query.eq('grua_id', filtros.grua_id)
    }
    if (filtros?.obra_id) {
      query = query.eq('obra_id', filtros.obra_id)
    }

    const { data: locacoes, error: locacoesError } = await query

    if (locacoesError) {
      return res.status(500).json({
        error: 'Erro ao buscar locações',
        message: locacoesError.message
      })
    }

    // Buscar eventos de manutenção
    const { data: manutencoes, error: manutencoesError } = await supabaseAdmin
      .from('gruas')
      .select('id, modelo, fabricante, proxima_manutencao')
      .not('proxima_manutencao', 'is', null)
      .gte('proxima_manutencao', data_inicio)
      .lte('proxima_manutencao', data_fim)

    if (manutencoesError) {
      console.warn('Erro ao buscar manutenções:', manutencoesError.message)
    }

    // Processar eventos
    const eventos = []

    // Adicionar locações
    locacoes?.forEach(locacao => {
      eventos.push({
        id: `locacao_${locacao.id}`,
        tipo: 'locacao',
        titulo: `${locacao.grua?.modelo} - ${locacao.obra?.nome}`,
        data_inicio: locacao.data_inicio_locacao,
        data_fim: locacao.data_fim_locacao,
        status: locacao.status,
        cor: locacao.status === 'Ativa' ? '#10B981' : '#6B7280',
        detalhes: {
          grua: locacao.grua,
          obra: locacao.obra,
          valor_locacao: locacao.valor_locacao_mensal
        }
      })
    })

    // Adicionar manutenções
    manutencoes?.forEach(grua => {
      eventos.push({
        id: `manutencao_${grua.id}`,
        tipo: 'manutencao',
        titulo: `Manutenção - ${grua.modelo}`,
        data_inicio: grua.proxima_manutencao,
        data_fim: grua.proxima_manutencao,
        status: 'agendada',
        cor: '#F59E0B',
        detalhes: {
          grua: {
            id: grua.id,
            modelo: grua.modelo,
            fabricante: grua.fabricante
          }
        }
      })
    })

    // Ordenar eventos por data
    eventos.sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio))

    // Agrupar por período conforme view
    let eventosAgrupados = {}
    
    eventos.forEach(evento => {
      const data = new Date(evento.data_inicio)
      let chave = ''

      switch (view) {
        case 'dia':
          chave = data.toISOString().split('T')[0]
          break
        case 'semana':
          const inicioSemana = new Date(data)
          inicioSemana.setDate(data.getDate() - data.getDay())
          chave = inicioSemana.toISOString().split('T')[0]
          break
        case 'mes':
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
          break
        case 'ano':
          chave = data.getFullYear().toString()
          break
      }

      if (!eventosAgrupados[chave]) {
        eventosAgrupados[chave] = []
      }
      eventosAgrupados[chave].push(evento)
    })

    res.json({
      success: true,
      data: {
        periodo: {
          data_inicio,
          data_fim,
          view
        },
        filtros,
        total_eventos: eventos.length,
        eventos_agrupados: eventosAgrupados,
        eventos: eventos
      }
    })

  } catch (error) {
    console.error('Erro ao gerar calendário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// BACKUP DE DADOS
// =====================================================

/**
 * @swagger
 * /api/funcionalidades-avancadas/backup:
 *   post:
 *     summary: Gerar backup dos dados
 *     tags: [Funcionalidades Avançadas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [completo, incremental, especifico]
 *                 default: completo
 *               tabelas:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tabelas específicas (apenas para tipo especifico)
 *     responses:
 *       200:
 *         description: Backup gerado com sucesso
 *       500:
 *         description: Erro ao gerar backup
 */
router.post('/backup', async (req, res) => {
  try {
    const { tipo = 'completo', tabelas = [] } = req.body

    console.log(`🔄 Gerando backup ${tipo}...`)

    const backup = await gerarBackup(tipo)

    // Em produção, aqui seria salvo em:
    // - AWS S3
    // - Google Cloud Storage
    // - Azure Blob Storage
    // - Sistema de arquivos local
    // - Banco de dados de backup

    // Por enquanto, retornamos o backup diretamente
    res.json({
      success: true,
      data: {
        backup_id: `backup_${Date.now()}`,
        tipo,
        tamanho_estimado: JSON.stringify(backup).length,
        timestamp: backup.metadata.timestamp,
        estatisticas: {
          gruas: backup.dados.gruas.length,
          obras: backup.dados.obras.length,
          clientes: backup.dados.clientes.length,
          funcionarios: backup.dados.funcionarios.length,
          relacionamentos: backup.dados.relacionamentos.length,
          historico: backup.dados.historico.length
        }
      },
      message: 'Backup gerado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao gerar backup:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// AUDITORIA DE OPERAÇÕES
// =====================================================

/**
 * @swagger
 * /api/funcionalidades-avancadas/auditoria:
 *   get:
 *     summary: Consultar logs de auditoria
 *     tags: [Funcionalidades Avançadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *         description: Filtrar por usuário
 *       - in: query
 *         name: acao
 *         schema:
 *           type: string
 *         description: Filtrar por ação
 *       - in: query
 *         name: entidade
 *         schema:
 *           type: string
 *         description: Filtrar por entidade
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Número máximo de resultados
 *     responses:
 *       200:
 *         description: Logs de auditoria
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/auditoria', async (req, res) => {
  try {
    // Validar parâmetros
    const { error, value } = auditoriaSchema.validate(req.query)
    if (error) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      })
    }

    const { data_inicio, data_fim, usuario_id, acao, entidade, limite } = value

    // Buscar logs de auditoria
    let query = supabaseAdmin
      .from('logs_auditoria')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limite)

    if (data_inicio) {
      query = query.gte('timestamp', data_inicio)
    }
    if (data_fim) {
      query = query.lte('timestamp', data_fim)
    }
    if (usuario_id) {
      query = query.eq('usuario_id', usuario_id)
    }
    if (acao) {
      query = query.ilike('acao', `%${acao}%`)
    }
    if (entidade) {
      query = query.eq('entidade', entidade)
    }

    const { data: logs, error: logsError } = await query

    if (logsError) {
      return res.status(500).json({
        error: 'Erro ao buscar logs de auditoria',
        message: logsError.message
      })
    }

    // Estatísticas de auditoria
    const estatisticas = {
      total_logs: logs?.length || 0,
      acoes_mais_comuns: {},
      entidades_mais_modificadas: {},
      usuarios_mais_ativos: {}
    }

    logs?.forEach(log => {
      // Contar ações
      estatisticas.acoes_mais_comuns[log.acao] = (estatisticas.acoes_mais_comuns[log.acao] || 0) + 1
      
      // Contar entidades
      estatisticas.entidades_mais_modificadas[log.entidade] = (estatisticas.entidades_mais_modificadas[log.entidade] || 0) + 1
      
      // Contar usuários
      estatisticas.usuarios_mais_ativos[log.usuario_id] = (estatisticas.usuarios_mais_ativos[log.usuario_id] || 0) + 1
    })

    res.json({
      success: true,
      data: {
        filtros: {
          data_inicio,
          data_fim,
          usuario_id,
          acao,
          entidade,
          limite
        },
        estatisticas,
        logs: logs || []
      }
    })

  } catch (error) {
    console.error('Erro ao consultar auditoria:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/funcionalidades-avancadas/auditoria/log:
 *   post:
 *     summary: Criar log de auditoria
 *     tags: [Funcionalidades Avançadas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - acao
 *               - entidade
 *               - entidade_id
 *             properties:
 *               acao:
 *                 type: string
 *               entidade:
 *                 type: string
 *               entidade_id:
 *                 type: string
 *               dados_anteriores:
 *                 type: object
 *               dados_novos:
 *                 type: object
 *     responses:
 *       200:
 *         description: Log criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/auditoria/log', async (req, res) => {
  try {
    const { acao, entidade, entidade_id, dados_anteriores, dados_novos } = req.body

    if (!acao || !entidade || !entidade_id) {
      return res.status(400).json({
        error: 'Dados obrigatórios',
        message: 'acao, entidade e entidade_id são obrigatórios'
      })
    }

    const log = await criarLogAuditoria({
      usuario_id: req.user?.id || null,
      acao,
      entidade,
      entidade_id,
      dados_anteriores,
      dados_novos,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    })

    res.json({
      success: true,
      data: log,
      message: 'Log de auditoria criado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// WEBHOOKS
// =====================================================

/**
 * @swagger
 * /api/funcionalidades-avancadas/webhooks:
 *   post:
 *     summary: Configurar webhook
 *     tags: [Funcionalidades Avançadas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - eventos
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               eventos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [grua_criada, grua_atualizada, locacao_iniciada, locacao_finalizada, manutencao_agendada]
 *               ativo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Webhook configurado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/webhooks', async (req, res) => {
  try {
    const { url, eventos, ativo = true } = req.body

    if (!url || !eventos || !Array.isArray(eventos)) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'url e eventos são obrigatórios'
      })
    }

    // Salvar configuração do webhook
    const { data: webhook, error: webhookError } = await supabaseAdmin
      .from('webhooks')
      .insert([{
        url,
        eventos,
        ativo,
        secret: Math.random().toString(36).substring(2, 15),
        criado_em: new Date().toISOString()
      }])
      .select()
      .single()

    if (webhookError) {
      return res.status(500).json({
        error: 'Erro ao configurar webhook',
        message: webhookError.message
      })
    }

    res.json({
      success: true,
      data: webhook,
      message: 'Webhook configurado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// CONFIGURAÇÃO E SETUP
// =====================================================

/**
 * @swagger
 * /api/funcionalidades-avancadas/setup:
 *   post:
 *     summary: Configurar tabelas para funcionalidades avançadas
 *     tags: [Funcionalidades Avançadas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tabelas configuradas com sucesso
 *       500:
 *         description: Erro na configuração
 */
router.post('/setup', async (req, res) => {
  try {
    console.log('🔧 Configurando tabelas para funcionalidades avançadas...')

    const tabelas = [
      'notificacoes',
      'logs_auditoria', 
      'webhooks',
      'backups',
      'configuracoes_sistema'
    ]

    const resultados = {}

    for (const tabela of tabelas) {
      try {
        // Verificar se a tabela existe
        const { data, error } = await supabaseAdmin
          .from(tabela)
          .select('*')
          .limit(1)

        if (error && error.code === '42P01') {
          resultados[tabela] = {
            existe: false,
            erro: 'Tabela não existe - execute o SQL manualmente'
          }
        } else if (error) {
          resultados[tabela] = {
            existe: false,
            erro: error.message
          }
        } else {
          resultados[tabela] = {
            existe: true,
            registros: data?.length || 0
          }
        }
      } catch (err) {
        resultados[tabela] = {
          existe: false,
          erro: err.message
        }
      }
    }

    // Verificar se todas as tabelas existem
    const tabelasFaltando = Object.entries(resultados)
      .filter(([_, resultado]) => !resultado.existe)
      .map(([tabela, _]) => tabela)

    if (tabelasFaltando.length > 0) {
      return res.status(400).json({
        error: 'Tabelas não encontradas',
        message: 'Execute o SQL abaixo no Supabase para criar as tabelas:',
        tabelas_faltando: tabelasFaltando,
        sql_file: 'create-tabelas-avancadas.sql',
        instrucoes: [
          '1. Acesse o painel do Supabase',
          '2. Vá para SQL Editor',
          '3. Execute o conteúdo do arquivo create-tabelas-avancadas.sql',
          '4. Teste novamente este endpoint'
        ],
        resultados
      })
    }

    // Testar funcionalidades básicas
    const testes = {}

    // Teste de notificação
    try {
      const { data: notificacao, error: notifError } = await supabaseAdmin
        .from('notificacoes')
        .insert([{
          tipo: 'alerta_geral',
          titulo: 'Teste de Configuração',
          mensagem: 'Teste de configuração das funcionalidades avançadas',
          prioridade: 'baixa',
          status: 'enviada'
        }])
        .select()
        .single()

      if (notifError) {
        testes.notificacoes = { sucesso: false, erro: notifError.message }
      } else {
        // Limpar teste
        await supabaseAdmin
          .from('notificacoes')
          .delete()
          .eq('id', notificacao.id)
        
        testes.notificacoes = { sucesso: true }
      }
    } catch (err) {
      testes.notificacoes = { sucesso: false, erro: err.message }
    }

    // Teste de auditoria
    try {
      const { data: log, error: logError } = await supabaseAdmin
        .from('logs_auditoria')
        .insert([{
          acao: 'teste_configuracao',
          entidade: 'sistema',
          entidade_id: '1',
          dados_novos: { teste: true }
        }])
        .select()
        .single()

      if (logError) {
        testes.auditoria = { sucesso: false, erro: logError.message }
      } else {
        // Limpar teste
        await supabaseAdmin
          .from('logs_auditoria')
          .delete()
          .eq('id', log.id)
        
        testes.auditoria = { sucesso: true }
      }
    } catch (err) {
      testes.auditoria = { sucesso: false, erro: err.message }
    }

    // Teste de configurações
    try {
      const { data: config, error: configError } = await supabaseAdmin
        .from('configuracoes_sistema')
        .select('chave, valor')
        .limit(1)

      if (configError) {
        testes.configuracoes = { sucesso: false, erro: configError.message }
      } else {
        testes.configuracoes = { 
          sucesso: true, 
          configuracoes_encontradas: config?.length || 0 
        }
      }
    } catch (err) {
      testes.configuracoes = { sucesso: false, erro: err.message }
    }

    res.json({
      success: true,
      message: 'Funcionalidades avançadas configuradas e testadas com sucesso!',
      data: {
        tabelas: resultados,
        testes,
        funcionalidades_disponiveis: [
          'Notificações automáticas',
          'Logs de auditoria',
          'Webhooks',
          'Backup de dados',
          'Configurações do sistema'
        ]
      }
    })

  } catch (error) {
    console.error('Erro ao configurar funcionalidades avançadas:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
