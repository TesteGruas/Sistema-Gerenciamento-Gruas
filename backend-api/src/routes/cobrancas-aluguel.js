import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schema de validação para cobrança de aluguel
const cobrancaSchema = Joi.object({
  aluguel_id: Joi.string().uuid().required(),
  mes: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  conta_bancaria_id: Joi.number().integer().positive().required(),
  valor_aluguel: Joi.number().positive().required(),
  valor_custos: Joi.number().min(0).default(0),
  data_vencimento: Joi.date().required(),
  boleto_id: Joi.number().integer().positive().optional(),
  observacoes: Joi.string().allow('', null).optional()
})

/**
 * @swagger
 * /api/cobrancas-aluguel:
 *   get:
 *     summary: Lista todas as cobranças de aluguel
 *     tags: [Cobranças Aluguel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: aluguel_id
 *         schema:
 *           type: string
 *         description: Filtrar por ID do aluguel
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         description: Filtrar por mês (YYYY-MM)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, pago, atrasado, cancelado]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de cobranças
 */
router.get('/', requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { aluguel_id, mes, status, include_canceladas } = req.query

    let query = supabaseAdmin
      .from('cobrancas_aluguel')
      .select(`
        *,
        alugueis_residencias (
          id,
          valor_mensal,
          dia_vencimento,
          residencias (nome, endereco),
          funcionarios (nome, cpf)
        ),
        contas_bancarias (id, banco, agencia, conta),
        movimentacoes_bancarias (id, valor, descricao),
        boletos (id, numero_boleto, descricao, valor, data_vencimento, status)
      `)
      .order('mes', { ascending: false })
      .order('data_vencimento', { ascending: false })

    if (aluguel_id) {
      query = query.eq('aluguel_id', aluguel_id)
    }
    if (mes) {
      query = query.eq('mes', mes)
    }
    if (status) {
      query = query.eq('status', status)
    } else if (include_canceladas !== 'true') {
      // Por padrão, excluir cobranças canceladas
      query = query.neq('status', 'cancelado')
    }

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao listar cobranças:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/cobrancas-aluguel:
 *   post:
 *     summary: Cria uma nova cobrança de aluguel
 *     tags: [Cobranças Aluguel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aluguel_id
 *               - mes
 *               - conta_bancaria_id
 *               - valor_aluguel
 *               - data_vencimento
 *             properties:
 *               aluguel_id:
 *                 type: string
 *               mes:
 *                 type: string
 *                 pattern: '^\d{4}-\d{2}$'
 *               conta_bancaria_id:
 *                 type: integer
 *               valor_aluguel:
 *                 type: number
 *               valor_custos:
 *                 type: number
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cobrança criada com sucesso
 */
router.post('/', requirePermission('financeiro:editar'), async (req, res) => {
  try {
    const { error: validationError, value } = cobrancaSchema.validate(req.body)

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      })
    }

    // Verificar se aluguel existe
    const { data: aluguel, error: aluguelError } = await supabaseAdmin
      .from('alugueis_residencias')
      .select('id, valor_mensal, dia_vencimento, residencias(nome), funcionarios(nome)')
      .eq('id', value.aluguel_id)
      .single()

    if (aluguelError || !aluguel) {
      return res.status(404).json({
        success: false,
        message: 'Aluguel não encontrado'
      })
    }

    // Verificar se conta bancária existe
    const { data: conta, error: contaError } = await supabaseAdmin
      .from('contas_bancarias')
      .select('id, banco')
      .eq('id', value.conta_bancaria_id)
      .single()

    if (contaError || !conta) {
      return res.status(404).json({
        success: false,
        message: 'Conta bancária não encontrada'
      })
    }

    // Verificar se já existe cobrança para este mês
    const { data: cobrancaExistente } = await supabaseAdmin
      .from('cobrancas_aluguel')
      .select('id')
      .eq('aluguel_id', value.aluguel_id)
      .eq('mes', value.mes)
      .eq('status', 'cancelado', { foreignTable: null })
      .single()

    if (cobrancaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Já existe cobrança para este mês'
      })
    }

    // Calcular valor total
    const valorTotal = parseFloat(value.valor_aluguel) + parseFloat(value.valor_custos || 0)

    const userId = req.user?.id

    // Verificar se boleto existe (se fornecido)
    let boletoId = null
    if (value.boleto_id) {
      const { data: boleto, error: boletoError } = await supabaseAdmin
        .from('boletos')
        .select('id, tipo')
        .eq('id', value.boleto_id)
        .single()

      if (boletoError || !boleto) {
        return res.status(404).json({
          success: false,
          message: 'Boleto não encontrado'
        })
      }

      if (boleto.tipo !== 'pagar') {
        return res.status(400).json({
          success: false,
          message: 'Boleto deve ser do tipo "pagar"'
        })
      }

      boletoId = boleto.id
    }

    // Criar cobrança
    const { data: cobranca, error: cobrancaError } = await supabaseAdmin
      .from('cobrancas_aluguel')
      .insert({
        aluguel_id: value.aluguel_id,
        mes: value.mes,
        conta_bancaria_id: value.conta_bancaria_id,
        valor_aluguel: value.valor_aluguel,
        valor_custos: value.valor_custos || 0,
        valor_total: valorTotal,
        data_vencimento: value.data_vencimento,
        boleto_id: boletoId,
        observacoes: value.observacoes || null,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (cobrancaError) throw cobrancaError

    // Criar movimentação bancária automaticamente
    const descricaoMovimentacao = `Cobrança Aluguel ${aluguel.residencias?.nome || 'Residência'} - ${value.mes}${value.valor_custos > 0 ? ' (inclui custos)' : ''}`
    
    const { data: movimentacao, error: movimentacaoError } = await supabaseAdmin
      .from('movimentacoes_bancarias')
      .insert({
        conta_bancaria_id: value.conta_bancaria_id,
        tipo: 'saida',
        valor: valorTotal,
        descricao: descricaoMovimentacao,
        referencia: `COB-ALUGUEL-${cobranca.id}`,
        data: value.data_vencimento,
        categoria: 'Aluguel',
        observacoes: value.observacoes || null
      })
      .select()
      .single()

    if (movimentacaoError) {
      console.error('Erro ao criar movimentação bancária:', movimentacaoError)
      // Não falhar a criação da cobrança se a movimentação falhar, apenas logar o erro
    } else {
      // Atualizar cobrança com ID da movimentação
      await supabaseAdmin
        .from('cobrancas_aluguel')
        .update({ movimentacao_bancaria_id: movimentacao.id })
        .eq('id', cobranca.id)
    }

    // Criar conta a pagar automaticamente
    const formatarMoeda = (valor) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
    }
    
    const descricaoContaPagar = `Aluguel ${aluguel.residencias?.nome || 'Residência'} - ${value.mes}${value.valor_custos > 0 ? ` (Aluguel: ${formatarMoeda(value.valor_aluguel)} + Custos: ${formatarMoeda(value.valor_custos)})` : ''}`
    
    const { data: contaPagar, error: contaPagarError } = await supabaseAdmin
      .from('contas_pagar')
      .insert({
        descricao: descricaoContaPagar,
        valor: valorTotal,
        data_vencimento: value.data_vencimento,
        status: 'pendente',
        categoria: 'Aluguel',
        observacoes: `Cobrança de aluguel ID: ${cobranca.id}. ${value.observacoes || ''}`.trim()
      })
      .select()
      .single()

    if (contaPagarError) {
      console.error('Erro ao criar conta a pagar:', contaPagarError)
      // Não falhar a criação da cobrança se a conta a pagar falhar, apenas logar o erro
    }

    // Buscar cobrança completa
    const { data: cobrancaCompleta } = await supabaseAdmin
      .from('cobrancas_aluguel')
      .select(`
        *,
        alugueis_residencias (
          id,
          valor_mensal,
          dia_vencimento,
          residencias (nome, endereco),
          funcionarios (nome, cpf)
        ),
        contas_bancarias (id, banco, agencia, conta),
        movimentacoes_bancarias (id, valor, descricao),
        boletos (id, numero_boleto, descricao, valor, data_vencimento, status)
      `)
      .eq('id', cobranca.id)
      .single()

    res.status(201).json({
      success: true,
      data: cobrancaCompleta,
      message: 'Cobrança criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar cobrança:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/cobrancas-aluguel/gerar-mensais:
 *   post:
 *     summary: Gera cobranças mensais automaticamente para aluguéis ativos
 *     tags: [Cobranças Aluguel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mes:
 *                 type: string
 *                 pattern: '^\d{4}-\d{2}$'
 *                 description: 'Mês para gerar cobranças (padrão: mês atual)'
 *               conta_bancaria_id:
 *                 type: integer
 *                 description: Conta bancária padrão (opcional)
 *     responses:
 *       200:
 *         description: Cobranças geradas com sucesso
 */
router.post('/gerar-mensais', requirePermission('financeiro:editar'), async (req, res) => {
  try {
    const { mes, conta_bancaria_id } = req.body

    // Determinar mês (padrão: próximo mês)
    const hoje = new Date()
    const mesParaGerar = mes || new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).toISOString().slice(0, 7)

    // Buscar todos os aluguéis ativos
    const { data: alugueis, error: alugueisError } = await supabaseAdmin
      .from('alugueis_residencias')
      .select('id, valor_mensal, dia_vencimento, data_inicio, residencias(nome)')
      .eq('status', 'ativo')

    if (alugueisError) throw alugueisError

    const cobrancasCriadas = []
    const erros = []

    for (const aluguel of alugueis || []) {
      try {
        // Verificar se já existe cobrança para este mês
        const { data: cobrancaExistente } = await supabaseAdmin
          .from('cobrancas_aluguel')
          .select('id')
          .eq('aluguel_id', aluguel.id)
          .eq('mes', mesParaGerar)
          .single()

        if (cobrancaExistente) {
          erros.push({
            aluguel_id: aluguel.id,
            mensagem: 'Cobrança já existe para este mês'
          })
          continue
        }

        // Se não foi informada conta bancária, usar a primeira ativa
        let contaId = conta_bancaria_id
        if (!contaId) {
          const { data: primeiraConta } = await supabaseAdmin
            .from('contas_bancarias')
            .select('id')
            .eq('status', 'ativa')
            .limit(1)
            .single()

          if (!primeiraConta) {
            erros.push({
              aluguel_id: aluguel.id,
              mensagem: 'Nenhuma conta bancária ativa encontrada'
            })
            continue
          }
          contaId = primeiraConta.id
        }

        // Calcular data de vencimento
        const [ano, mesNum] = mesParaGerar.split('-').map(Number)
        const diaVencimento = aluguel.dia_vencimento || 5
        const dataVencimento = new Date(ano, mesNum - 1, diaVencimento).toISOString().split('T')[0]

        const valorTotal = parseFloat(aluguel.valor_mensal || 0)

        // Criar cobrança
        const { data: cobranca, error: cobrancaError } = await supabaseAdmin
          .from('cobrancas_aluguel')
          .insert({
            aluguel_id: aluguel.id,
            mes: mesParaGerar,
            conta_bancaria_id: contaId,
            valor_aluguel: valorTotal,
            valor_custos: 0,
            valor_total: valorTotal,
            data_vencimento: dataVencimento,
            created_by: req.user?.id,
            updated_by: req.user?.id
          })
          .select()
          .single()

        if (cobrancaError) throw cobrancaError

        // Criar movimentação bancária
        const descricaoMovimentacao = `Cobrança Aluguel ${aluguel.residencias?.nome || 'Residência'} - ${mesParaGerar}`
        
        const { data: movimentacao, error: movimentacaoError } = await supabaseAdmin
          .from('movimentacoes_bancarias')
          .insert({
            conta_bancaria_id: contaId,
            tipo: 'saida',
            valor: valorTotal,
            descricao: descricaoMovimentacao,
            referencia: `COB-ALUGUEL-${cobranca.id}`,
            data: dataVencimento,
            categoria: 'Aluguel'
          })
          .select()
          .single()

        if (movimentacaoError) {
          console.error('Erro ao criar movimentação:', movimentacaoError)
        } else {
          await supabaseAdmin
            .from('cobrancas_aluguel')
            .update({ movimentacao_bancaria_id: movimentacao.id })
            .eq('id', cobranca.id)
        }

        cobrancasCriadas.push(cobranca.id)
      } catch (error) {
        erros.push({
          aluguel_id: aluguel.id,
          mensagem: error.message
        })
      }
    }

    res.json({
      success: true,
      data: {
        mes: mesParaGerar,
        cobrancas_criadas: cobrancasCriadas.length,
        erros: erros.length,
        detalhes: {
          sucessos: cobrancasCriadas,
          erros: erros
        }
      },
      message: `${cobrancasCriadas.length} cobrança(s) criada(s) com sucesso`
    })
  } catch (error) {
    console.error('Erro ao gerar cobranças mensais:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/cobrancas-aluguel/{id}:
 *   get:
 *     summary: Busca uma cobrança por ID
 *     tags: [Cobranças Aluguel]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('cobrancas_aluguel')
      .select(`
        *,
        alugueis_residencias (
          id,
          valor_mensal,
          dia_vencimento,
          residencias (nome, endereco),
          funcionarios (nome, cpf)
        ),
        contas_bancarias (id, banco, agencia, conta),
        movimentacoes_bancarias (id, valor, descricao),
        boletos (id, numero_boleto, descricao, valor, data_vencimento, status)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Cobrança não encontrada'
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar cobrança:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/cobrancas-aluguel/{id}:
 *   put:
 *     summary: Atualiza uma cobrança de aluguel
 *     tags: [Cobranças Aluguel]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requirePermission('financeiro:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const updateSchema = Joi.object({
      valor_custos: Joi.number().min(0).optional(),
      data_vencimento: Joi.date().optional(),
      data_pagamento: Joi.date().allow(null).optional(),
      boleto_id: Joi.number().integer().positive().allow(null).optional(),
      observacoes: Joi.string().allow('', null).optional()
    })

    const { error: validationError, value } = updateSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      })
    }

    // Buscar cobrança atual
    const { data: cobrancaAtual, error: cobrancaError } = await supabaseAdmin
      .from('cobrancas_aluguel')
      .select('*')
      .eq('id', id)
      .single()

    if (cobrancaError || !cobrancaAtual) {
      return res.status(404).json({
        success: false,
        message: 'Cobrança não encontrada'
      })
    }

    // Verificar se boleto existe (se fornecido)
    let boletoId = value.boleto_id !== undefined ? value.boleto_id : cobrancaAtual.boleto_id
    if (value.boleto_id !== undefined && value.boleto_id !== null) {
      const { data: boleto, error: boletoError } = await supabaseAdmin
        .from('boletos')
        .select('id, tipo')
        .eq('id', value.boleto_id)
        .single()

      if (boletoError || !boleto) {
        return res.status(404).json({
          success: false,
          message: 'Boleto não encontrado'
        })
      }

      if (boleto.tipo !== 'pagar') {
        return res.status(400).json({
          success: false,
          message: 'Boleto deve ser do tipo "pagar"'
        })
      }

      boletoId = boleto.id
    }

    // Calcular novo valor total se valor_custos mudou
    let valorTotal = cobrancaAtual.valor_total
    if (value.valor_custos !== undefined) {
      valorTotal = parseFloat(cobrancaAtual.valor_aluguel) + parseFloat(value.valor_custos)
    }

    const userId = req.user?.id
    const updateData = {
      ...value,
      boleto_id: boletoId,
      valor_total: valorTotal,
      updated_by: userId
    }

    const { data: cobrancaAtualizada, error: updateError } = await supabaseAdmin
      .from('cobrancas_aluguel')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        alugueis_residencias (
          id,
          valor_mensal,
          dia_vencimento,
          residencias (nome, endereco),
          funcionarios (nome, cpf)
        ),
        contas_bancarias (id, banco, agencia, conta),
        movimentacoes_bancarias (id, valor, descricao)
      `)
      .single()

    if (updateError) throw updateError

    // Se o valor total mudou e existe movimentação bancária, atualizar
    if (cobrancaAtualizada.movimentacao_bancaria_id && valorTotal !== cobrancaAtual.valor_total) {
      await supabaseAdmin
        .from('movimentacoes_bancarias')
        .update({ valor: valorTotal })
        .eq('id', cobrancaAtualizada.movimentacao_bancaria_id)
    }

    res.json({
      success: true,
      data: cobrancaAtualizada,
      message: 'Cobrança atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar cobrança:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/cobrancas-aluguel/{id}:
 *   delete:
 *     summary: Cancela uma cobrança de aluguel
 *     tags: [Cobranças Aluguel]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requirePermission('financeiro:editar'), async (req, res) => {
  try {
    const { id } = req.params

    // Buscar cobrança
    const { data: cobranca, error: cobrancaError } = await supabaseAdmin
      .from('cobrancas_aluguel')
      .select('movimentacao_bancaria_id, boleto_id')
      .eq('id', id)
      .single()

    if (cobrancaError || !cobranca) {
      return res.status(404).json({
        success: false,
        message: 'Cobrança não encontrada'
      })
    }

    // Atualizar status para cancelado
    const { data: cobrancaAtualizada, error: updateError } = await supabaseAdmin
      .from('cobrancas_aluguel')
      .update({ status: 'cancelado' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar status da cobrança:', updateError)
      throw updateError
    }

    console.log('✅ Cobrança cancelada:', { id, status: cobrancaAtualizada?.status })

    // Se existe movimentação bancária, deletar ou reverter
    if (cobranca.movimentacao_bancaria_id) {
      // Deletar movimentação (o trigger vai atualizar o saldo automaticamente)
      await supabaseAdmin
        .from('movimentacoes_bancarias')
        .delete()
        .eq('id', cobranca.movimentacao_bancaria_id)
    }

    // Buscar e cancelar/deletar conta a pagar relacionada
    // A conta a pagar tem observações que mencionam o ID da cobrança
    const { data: contasPagar, error: contasError } = await supabaseAdmin
      .from('contas_pagar')
      .select('id')
      .eq('categoria', 'Aluguel')
      .ilike('observacoes', `%Cobrança de aluguel ID: ${id}%`)

    if (!contasError && contasPagar && contasPagar.length > 0) {
      // Cancelar ou deletar as contas a pagar relacionadas
      for (const conta of contasPagar) {
        await supabaseAdmin
          .from('contas_pagar')
          .update({ status: 'cancelado' })
          .eq('id', conta.id)
      }
    }

    // Se existe boleto vinculado, não deletamos o boleto (pode ser usado em outro lugar)
    // Apenas removemos a vinculação
    if (cobranca.boleto_id) {
      await supabaseAdmin
        .from('cobrancas_aluguel')
        .update({ boleto_id: null })
        .eq('id', id)
    }

    res.json({
      success: true,
      message: 'Cobrança cancelada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao cancelar cobrança:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

export default router
