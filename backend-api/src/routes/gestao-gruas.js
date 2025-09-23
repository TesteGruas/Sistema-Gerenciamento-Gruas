/**
 * Rotas para gestão dinâmica de gruas
 * Sistema de Gerenciamento de Gruas
 * 
 * Funcionalidades:
 * - Transferência de gruas entre obras
 * - Histórico de locação
 * - Disponibilidade em tempo real
 * - Validação de conflitos de agendamento
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schemas de validação
const transferenciaSchema = Joi.object({
  grua_id: Joi.string().required(),
  obra_origem_id: Joi.number().integer().positive().required(),
  obra_destino_id: Joi.number().integer().positive().required(),
  data_transferencia: Joi.date().required(),
  funcionario_responsavel_id: Joi.number().integer().positive().required(),
  motivo: Joi.string().allow('').optional(),
  observacoes: Joi.string().allow('').optional()
})

// Schema para histórico de gruas (compatível com mocks)
const historicoGruaSchema = Joi.object({
  id: Joi.string().required(),
  gruaId: Joi.string().required(),
  data: Joi.date().required(),
  status: Joi.string().valid('ok', 'falha', 'manutencao').required(),
  observacoes: Joi.string().required(),
  funcionarioId: Joi.string().required(),
  funcionarioName: Joi.string().required(),
  tipo: Joi.string().valid('checklist', 'manutencao', 'falha').required(),
  notificacaoEnviada: Joi.boolean().optional()
})

const disponibilidadeSchema = Joi.object({
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().required(),
  tipo_grua: Joi.string().valid('Grua Torre', 'Grua Móvel', 'Guincho', 'Outros').optional(),
  capacidade_minima: Joi.string().optional()
})

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

/**
 * Verifica se uma grua está disponível em um período específico
 */
const verificarDisponibilidadeGrua = async (gruaId, dataInicio, dataFim) => {
  const { data: conflitos, error } = await supabaseAdmin
    .from('grua_obra')
    .select('id, data_inicio_locacao, data_fim_locacao, status')
    .eq('grua_id', gruaId)
    .eq('status', 'Ativa')
    .or(`and(data_inicio_locacao.lte.${dataFim},data_fim_locacao.gte.${dataInicio})`)

  if (error) {
    throw new Error(`Erro ao verificar disponibilidade: ${error.message}`)
  }

  return {
    disponivel: !conflitos || conflitos.length === 0,
    conflitos: conflitos || []
  }
}

/**
 * Obtém o status atual de uma grua
 */
const obterStatusAtualGrua = async (gruaId) => {
  // Buscar locação ativa
  const { data: locacaoAtiva, error: locacaoError } = await supabaseAdmin
    .from('grua_obra')
    .select(`
      *,
      obra:obras(id, nome, status),
      funcionario:grua_funcionario(
        funcionario:funcionarios(id, nome, cargo)
      )
    `)
    .eq('grua_id', gruaId)
    .eq('status', 'Ativa')
    .single()

  // Buscar dados da grua
  const { data: grua, error: gruaError } = await supabaseAdmin
    .from('gruas')
    .select('*')
    .eq('id', gruaId)
    .single()

  if (gruaError) {
    throw new Error(`Erro ao buscar grua: ${gruaError.message}`)
  }

  return {
    grua,
    locacao_ativa: locacaoAtiva,
    status: locacaoAtiva ? 'Ocupada' : 'Disponível',
    proxima_disponibilidade: locacaoAtiva ? locacaoAtiva.data_fim_locacao : null
  }
}

/**
 * Cria um registro de histórico de locação
 */
const criarHistoricoLocacao = async (dados) => {
  const { data, error } = await supabaseAdmin
    .from('historico_locacoes')
    .insert([{
      grua_id: dados.grua_id,
      obra_id: dados.obra_id,
      data_inicio: dados.data_inicio,
      data_fim: dados.data_fim,
      funcionario_responsavel_id: dados.funcionario_responsavel_id,
      tipo_operacao: dados.tipo_operacao, // 'Início', 'Transferência', 'Fim'
      valor_locacao: dados.valor_locacao,
      observacoes: dados.observacoes,
      created_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar histórico: ${error.message}`)
  }

  return data
}

// =====================================================
// ENDPOINTS PARA TRANSFERÊNCIA DE GRUAS
// =====================================================

/**
 * @swagger
 * /api/gestao-gruas/transferir:
 *   post:
 *     summary: Transferir grua de uma obra para outra
 *     tags: [Gestão de Gruas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grua_id
 *               - obra_origem_id
 *               - obra_destino_id
 *               - data_transferencia
 *               - funcionario_responsavel_id
 *             properties:
 *               grua_id:
 *                 type: string
 *               obra_origem_id:
 *                 type: integer
 *               obra_destino_id:
 *                 type: integer
 *               data_transferencia:
 *                 type: string
 *                 format: date
 *               funcionario_responsavel_id:
 *                 type: integer
 *               motivo:
 *                 type: string
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Grua transferida com sucesso
 *       400:
 *         description: Dados inválidos ou conflitos encontrados
 *       404:
 *         description: Grua ou obra não encontrada
 */
router.post('/transferir', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = transferenciaSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const {
      grua_id,
      obra_origem_id,
      obra_destino_id,
      data_transferencia,
      funcionario_responsavel_id,
      motivo,
      observacoes
    } = value

    // Verificar se grua existe
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('id, modelo, fabricante, status')
      .eq('id', grua_id)
      .single()

    if (gruaError || !grua) {
      return res.status(404).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Verificar se obras existem
    const { data: obraOrigem, error: obraOrigemError } = await supabaseAdmin
      .from('obras')
      .select('id, nome, status')
      .eq('id', obra_origem_id)
      .single()

    const { data: obraDestino, error: obraDestinoError } = await supabaseAdmin
      .from('obras')
      .select('id, nome, status')
      .eq('id', obra_destino_id)
      .single()

    if (obraOrigemError || !obraOrigem) {
      return res.status(404).json({
        error: 'Obra origem não encontrada',
        message: 'A obra de origem especificada não existe'
      })
    }

    if (obraDestinoError || !obraDestino) {
      return res.status(404).json({
        error: 'Obra destino não encontrada',
        message: 'A obra de destino especificada não existe'
      })
    }

    // Verificar se funcionário existe
    const { data: funcionario, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo')
      .eq('id', funcionario_responsavel_id)
      .single()

    if (funcionarioError || !funcionario) {
      return res.status(404).json({
        error: 'Funcionário não encontrado',
        message: 'O funcionário responsável especificado não existe'
      })
    }

    // Verificar se grua está realmente na obra origem
    const { data: locacaoAtual, error: locacaoError } = await supabaseAdmin
      .from('grua_obra')
      .select('*')
      .eq('grua_id', grua_id)
      .eq('obra_id', obra_origem_id)
      .eq('status', 'Ativa')
      .single()

    if (locacaoError || !locacaoAtual) {
      return res.status(400).json({
        error: 'Grua não está na obra origem',
        message: 'A grua especificada não está atualmente alocada na obra de origem'
      })
    }

    // Verificar disponibilidade na obra destino
    const disponibilidade = await verificarDisponibilidadeGrua(
      grua_id,
      data_transferencia,
      locacaoAtual.data_fim_locacao || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias se não houver data fim
    )

    if (!disponibilidade.disponivel) {
      return res.status(400).json({
        error: 'Conflito de agendamento',
        message: 'A grua não está disponível no período especificado',
        conflitos: disponibilidade.conflitos
      })
    }

    // Iniciar transação
    const { data: transferencia, error: transferenciaError } = await supabaseAdmin
      .from('grua_obra')
      .update({
        obra_id: obra_destino_id,
        data_inicio_locacao: data_transferencia,
        observacoes: `Transferida de ${obraOrigem.nome} para ${obraDestino.nome}. ${observacoes || ''}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', locacaoAtual.id)
      .select()
      .single()

    if (transferenciaError) {
      return res.status(500).json({
        error: 'Erro ao transferir grua',
        message: transferenciaError.message
      })
    }

    // Criar histórico de transferência
    await criarHistoricoLocacao({
      grua_id,
      obra_id: obra_destino_id,
      data_inicio: data_transferencia,
      data_fim: locacaoAtual.data_fim_locacao,
      funcionario_responsavel_id,
      tipo_operacao: 'Transferência',
      valor_locacao: locacaoAtual.valor_locacao_mensal,
      observacoes: `Transferida de ${obraOrigem.nome} para ${obraDestino.nome}. Motivo: ${motivo || 'Não informado'}`
    })

    // Atualizar funcionário responsável se necessário
    const { error: funcionarioError2 } = await supabaseAdmin
      .from('grua_funcionario')
      .update({
        funcionario_id: funcionario_responsavel_id,
        obra_id: obra_destino_id,
        data_inicio: data_transferencia,
        updated_at: new Date().toISOString()
      })
      .eq('grua_id', grua_id)
      .eq('status', 'Ativo')

    if (funcionarioError2) {
      console.warn('Erro ao atualizar funcionário responsável:', funcionarioError2.message)
    }

    res.json({
      success: true,
      data: {
        transferencia,
        grua: {
          id: grua.id,
          modelo: grua.modelo,
          fabricante: grua.fabricante
        },
        obra_origem: {
          id: obraOrigem.id,
          nome: obraOrigem.nome
        },
        obra_destino: {
          id: obraDestino.id,
          nome: obraDestino.nome
        },
        funcionario_responsavel: {
          id: funcionario.id,
          nome: funcionario.nome,
          cargo: funcionario.cargo
        },
        data_transferencia
      },
      message: `Grua ${grua.modelo} transferida com sucesso de ${obraOrigem.nome} para ${obraDestino.nome}`
    })

  } catch (error) {
    console.error('Erro ao transferir grua:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// ENDPOINTS PARA HISTÓRICO DE GRUAS
// =====================================================

/**
 * @swagger
 * /api/gestao-gruas/historico-grua/{grua_id}:
 *   get:
 *     summary: Obter histórico de manutenções e checklists de uma grua
 *     tags: [Gestão de Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grua_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da grua
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [checklist, manutencao, falha]
 *         description: Filtrar por tipo de histórico
 *     responses:
 *       200:
 *         description: Histórico da grua
 *       404:
 *         description: Grua não encontrada
 */
router.get('/historico-grua/:grua_id', async (req, res) => {
  try {
    const { grua_id } = req.params
    const { tipo } = req.query

    // Verificar se grua existe
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('id, modelo, fabricante, tipo, capacidade')
      .eq('id', grua_id)
      .single()

    if (gruaError || !grua) {
      return res.status(404).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Buscar histórico de manutenções/checklists
    let query = supabaseAdmin
      .from('historico_manutencoes')
      .select(`
        *,
        funcionario:funcionarios(id, nome, cargo)
      `)
      .eq('grua_id', grua_id)
      .order('data_manutencao', { ascending: false })

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    const { data: historico, error: historicoError } = await query

    if (historicoError) {
      return res.status(500).json({
        error: 'Erro ao buscar histórico',
        message: historicoError.message
      })
    }

    // Transformar dados para compatibilidade com mocks
    const historicoFormatado = historico.map(item => ({
      id: item.id.toString(),
      gruaId: grua_id,
      data: item.data_manutencao,
      status: item.status === 'Concluída' ? 'ok' : 
              item.status === 'Falha' ? 'falha' : 'manutencao',
      observacoes: item.observacoes || '',
      funcionarioId: item.funcionario_id?.toString() || '',
      funcionarioName: item.funcionario?.nome || 'Não informado',
      tipo: item.tipo || 'manutencao',
      notificacaoEnviada: item.notificacao_enviada || false
    }))

    res.json({
      success: true,
      data: {
        grua,
        historico: historicoFormatado,
        total_registros: historicoFormatado.length
      }
    })

  } catch (error) {
    console.error('Erro ao buscar histórico da grua:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// ENDPOINTS PARA HISTÓRICO DE LOCAÇÃO
// =====================================================

/**
 * @swagger
 * /api/gestao-gruas/historico/{grua_id}:
 *   get:
 *     summary: Obter histórico completo de locação de uma grua
 *     tags: [Gestão de Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grua_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da grua
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar a partir desta data
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar até esta data
 *     responses:
 *       200:
 *         description: Histórico de locação da grua
 *       404:
 *         description: Grua não encontrada
 */
router.get('/historico/:grua_id', async (req, res) => {
  try {
    const { grua_id } = req.params
    const { data_inicio, data_fim } = req.query

    // Verificar se grua existe
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('id, modelo, fabricante, tipo, capacidade')
      .eq('id', grua_id)
      .single()

    if (gruaError || !grua) {
      return res.status(404).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Buscar histórico de locações
    let query = supabaseAdmin
      .from('historico_locacoes')
      .select(`
        *,
        obra:obras(id, nome, endereco, cidade, estado, cliente_id, cliente:clientes(nome, cnpj)),
        funcionario:funcionarios(id, nome, cargo)
      `)
      .eq('grua_id', grua_id)
      .order('data_inicio', { ascending: false })

    // Aplicar filtros de data se fornecidos
    if (data_inicio) {
      query = query.gte('data_inicio', data_inicio)
    }
    if (data_fim) {
      query = query.lte('data_fim', data_fim)
    }

    const { data: historico, error: historicoError } = await query

    if (historicoError) {
      return res.status(500).json({
        error: 'Erro ao buscar histórico',
        message: historicoError.message
      })
    }

    // Buscar locação atual
    const { data: locacaoAtual, error: locacaoAtualError } = await supabaseAdmin
      .from('grua_obra')
      .select(`
        *,
        obra:obras(id, nome, endereco, cidade, estado, cliente_id, cliente:clientes(nome, cnpj))
      `)
      .eq('grua_id', grua_id)
      .eq('status', 'Ativa')
      .single()

    // Calcular estatísticas
    const estatisticas = {
      total_locacoes: historico.length,
      dias_total_locacao: historico.reduce((total, loc) => {
        if (loc.data_fim) {
          const inicio = new Date(loc.data_inicio)
          const fim = new Date(loc.data_fim)
          return total + Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24))
        }
        return total
      }, 0),
      receita_total: historico.reduce((total, loc) => total + (loc.valor_locacao || 0), 0),
      obras_visitadas: [...new Set(historico.map(loc => loc.obra_id))].length
    }

    res.json({
      success: true,
      data: {
        grua,
        locacao_atual: locacaoAtual,
        historico: historico || [],
        estatisticas
      }
    })

  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// ENDPOINTS PARA DISPONIBILIDADE EM TEMPO REAL
// =====================================================

/**
 * @swagger
 * /api/gestao-gruas/disponibilidade:
 *   get:
 *     summary: Verificar disponibilidade de gruas em tempo real
 *     tags: [Gestão de Gruas]
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
 *         name: tipo_grua
 *         schema:
 *           type: string
 *           enum: [Grua Torre, Grua Móvel, Guincho, Outros]
 *         description: Filtrar por tipo de grua
 *       - in: query
 *         name: capacidade_minima
 *         schema:
 *           type: string
 *         description: Capacidade mínima necessária
 *     responses:
 *       200:
 *         description: Lista de gruas disponíveis e ocupadas
 */
router.get('/disponibilidade', async (req, res) => {
  try {
    const { error, value } = disponibilidadeSchema.validate(req.query)
    if (error) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      })
    }

    const { data_inicio, data_fim, tipo_grua, capacidade_minima } = value

    // Buscar todas as gruas
    let query = supabaseAdmin
      .from('gruas')
      .select('*')

    if (tipo_grua) {
      query = query.eq('tipo', tipo_grua)
    }

    const { data: gruas, error: gruasError } = await query

    if (gruasError) {
      return res.status(500).json({
        error: 'Erro ao buscar gruas',
        message: gruasError.message
      })
    }

    // Verificar disponibilidade de cada grua
    const disponibilidade = await Promise.all(
      gruas.map(async (grua) => {
        const status = await obterStatusAtualGrua(grua.id)
        const disponibilidadePeriodo = await verificarDisponibilidadeGrua(
          grua.id,
          data_inicio,
          data_fim
        )

        return {
          ...grua,
          status_atual: status.status,
          locacao_ativa: status.locacao_ativa,
          disponivel_periodo: disponibilidadePeriodo.disponivel,
          conflitos_periodo: disponibilidadePeriodo.conflitos,
          proxima_disponibilidade: status.proxima_disponibilidade
        }
      })
    )

    // Filtrar por capacidade se especificada
    const gruasFiltradas = capacidade_minima
      ? disponibilidade.filter(grua => {
          // Lógica simples de comparação de capacidade
          const capacidadeGrua = parseFloat(grua.capacidade.replace(/[^\d.]/g, ''))
          const capacidadeMinima = parseFloat(capacidade_minima.replace(/[^\d.]/g, ''))
          return capacidadeGrua >= capacidadeMinima
        })
      : disponibilidade

    // Separar em disponíveis e ocupadas
    const gruasDisponiveis = gruasFiltradas.filter(grua => 
      grua.status_atual === 'Disponível' && grua.disponivel_periodo
    )
    const gruasOcupadas = gruasFiltradas.filter(grua => 
      grua.status_atual === 'Ocupada' || !grua.disponivel_periodo
    )

    res.json({
      success: true,
      data: {
        periodo: {
          data_inicio,
          data_fim
        },
        filtros: {
          tipo_grua,
          capacidade_minima
        },
        resumo: {
          total_gruas: gruasFiltradas.length,
          disponiveis: gruasDisponiveis.length,
          ocupadas: gruasOcupadas.length,
          taxa_disponibilidade: gruasFiltradas.length > 0 
            ? (gruasDisponiveis.length / gruasFiltradas.length * 100).toFixed(2)
            : 0
        },
        gruas_disponiveis: gruasDisponiveis,
        gruas_ocupadas: gruasOcupadas
      }
    })

  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/gestao-gruas/status/{grua_id}:
 *   get:
 *     summary: Obter status atual de uma grua específica
 *     tags: [Gestão de Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grua_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da grua
 *     responses:
 *       200:
 *         description: Status atual da grua
 *       404:
 *         description: Grua não encontrada
 */
router.get('/status/:grua_id', async (req, res) => {
  try {
    const { grua_id } = req.params

    const status = await obterStatusAtualGrua(grua_id)

    res.json({
      success: true,
      data: status
    })

  } catch (error) {
    console.error('Erro ao obter status da grua:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// ENDPOINTS PARA VALIDAÇÃO DE CONFLITOS
// =====================================================

/**
 * @swagger
 * /api/gestao-gruas/validar-conflitos:
 *   post:
 *     summary: Validar possíveis conflitos de agendamento
 *     tags: [Gestão de Gruas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grua_id
 *               - data_inicio
 *               - data_fim
 *             properties:
 *               grua_id:
 *                 type: string
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               data_fim:
 *                 type: string
 *                 format: date
 *               obra_id:
 *                 type: integer
 *                 description: ID da obra (opcional, para validar transferência)
 *     responses:
 *       200:
 *         description: Resultado da validação de conflitos
 */
router.post('/validar-conflitos', async (req, res) => {
  try {
    const { grua_id, data_inicio, data_fim, obra_id } = req.body

    if (!grua_id || !data_inicio || !data_fim) {
      return res.status(400).json({
        error: 'Dados obrigatórios',
        message: 'grua_id, data_inicio e data_fim são obrigatórios'
      })
    }

    // Verificar se grua existe
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('id, modelo, fabricante, status')
      .eq('id', grua_id)
      .single()

    if (gruaError || !grua) {
      return res.status(404).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Verificar disponibilidade
    const disponibilidade = await verificarDisponibilidadeGrua(grua_id, data_inicio, data_fim)

    // Se for uma transferência, verificar se a grua está na obra especificada
    let validacaoObra = null
    if (obra_id) {
      const { data: locacaoAtual, error: locacaoError } = await supabaseAdmin
        .from('grua_obra')
        .select('obra_id, obra:obras(nome)')
        .eq('grua_id', grua_id)
        .eq('obra_id', obra_id)
        .eq('status', 'Ativa')
        .single()

      validacaoObra = {
        esta_na_obra: !locacaoError && locacaoAtual,
        obra_atual: locacaoAtual?.obra?.nome || null
      }
    }

    // Buscar próximas disponibilidades se houver conflitos
    let proximasDisponibilidades = []
    if (!disponibilidade.disponivel) {
      const { data: locacoesFuturas, error: locacoesError } = await supabaseAdmin
        .from('grua_obra')
        .select('data_fim_locacao, obra:obras(nome)')
        .eq('grua_id', grua_id)
        .eq('status', 'Ativa')
        .gte('data_fim_locacao', new Date().toISOString())
        .order('data_fim_locacao', { ascending: true })

      if (!locacoesError && locacoesFuturas) {
        proximasDisponibilidades = locacoesFuturas.map(loc => ({
          data_disponivel: loc.data_fim_locacao,
          obra_atual: loc.obra?.nome
        }))
      }
    }

    res.json({
      success: true,
      data: {
        grua: {
          id: grua.id,
          modelo: grua.modelo,
          fabricante: grua.fabricante
        },
        periodo: {
          data_inicio,
          data_fim
        },
        disponivel: disponibilidade.disponivel,
        conflitos: disponibilidade.conflitos,
        validacao_obra: validacaoObra,
        proximas_disponibilidades: proximasDisponibilidades,
        recomendacoes: !disponibilidade.disponivel ? [
          'Considere ajustar as datas do agendamento',
          'Verifique se há outras gruas disponíveis no período',
          'Entre em contato com a obra atual para negociar a liberação antecipada'
        ] : [
          'Grua disponível para o período solicitado',
          'Pode prosseguir com o agendamento'
        ]
      }
    })

  } catch (error) {
    console.error('Erro ao validar conflitos:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// ENDPOINTS PARA CONFIGURAÇÃO E SETUP
// =====================================================

/**
 * @swagger
 * /api/gestao-gruas/setup-historico:
 *   post:
 *     summary: Configurar tabela de histórico de locações
 *     tags: [Gestão de Gruas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tabela configurada com sucesso
 *       500:
 *         description: Erro na configuração
 */
router.post('/setup-historico', async (req, res) => {
  try {
    console.log('🔧 Configurando tabela de histórico de locações...')

    // Verificar se a tabela já existe
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('historico_locacoes')
      .select('id')
      .limit(1)

    if (checkError && checkError.code === '42P01') {
      // Tabela não existe, vamos criar
      console.log('📝 Tabela não existe. Execute o SQL manualmente no Supabase:')
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS historico_locacoes (
          id SERIAL PRIMARY KEY,
          grua_id VARCHAR NOT NULL,
          obra_id INTEGER NOT NULL,
          data_inicio DATE NOT NULL,
          data_fim DATE,
          funcionario_responsavel_id INTEGER,
          tipo_operacao VARCHAR(20) NOT NULL CHECK (tipo_operacao IN ('Início', 'Transferência', 'Fim', 'Pausa', 'Retomada')),
          valor_locacao DECIMAL(10,2),
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      return res.status(400).json({
        error: 'Tabela não existe',
        message: 'Execute o SQL abaixo no Supabase para criar a tabela:',
        sql: createTableSQL,
        instrucoes: [
          '1. Acesse o painel do Supabase',
          '2. Vá para SQL Editor',
          '3. Execute o SQL fornecido acima',
          '4. Teste novamente este endpoint'
        ]
      })
    } else if (checkError) {
      return res.status(500).json({
        error: 'Erro ao verificar tabela',
        message: checkError.message
      })
    }

    // Testar inserção
    const { data: testData, error: testError } = await supabaseAdmin
      .from('historico_locacoes')
      .insert([{
        grua_id: 'TEST001',
        obra_id: 1,
        data_inicio: new Date().toISOString().split('T')[0],
        funcionario_responsavel_id: 1,
        tipo_operacao: 'Início',
        valor_locacao: 1000.00,
        observacoes: 'Teste de configuração'
      }])
      .select()

    if (testError) {
      return res.status(500).json({
        error: 'Erro ao testar tabela',
        message: testError.message
      })
    }

    // Limpar teste
    await supabaseAdmin
      .from('historico_locacoes')
      .delete()
      .eq('id', testData[0].id)

    res.json({
      success: true,
      message: 'Tabela de histórico de locações configurada e testada com sucesso!',
      data: {
        tabela_existe: true,
        teste_insercao: true,
        teste_remocao: true
      }
    })

  } catch (error) {
    console.error('Erro ao configurar histórico:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
