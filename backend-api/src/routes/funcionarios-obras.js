/**
 * Rotas para gerenciamento de alocação de funcionários em obras
 * Sistema de Gerenciamento de Gruas - Módulo RH
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(authenticateToken)

// Schema de validação para alocação
const funcionarioObraSchema = Joi.object({
  funcionario_id: Joi.number().integer().positive().required(),
  obra_id: Joi.number().integer().positive().required(),
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().greater(Joi.ref('data_inicio')).allow(null).optional(),
  horas_trabalhadas: Joi.number().min(0).default(0),
  valor_hora: Joi.number().min(0).optional(),
  status: Joi.string().valid('ativo', 'finalizado', 'transferido').default('ativo'),
  observacoes: Joi.string().allow(null, '').optional(),
  is_supervisor: Joi.boolean().default(false)
})

/**
 * GET /funcionarios-obras
 * Listar alocações
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      funcionario_id,
      obra_id,
      status
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    // Converter funcionario_id e obra_id para números se existirem
    const funcionarioIdNum = funcionario_id ? parseInt(funcionario_id) : null
    const obraIdNum = obra_id ? parseInt(obra_id) : null

    console.log('[FUNCIONARIOS-OBRAS] Buscando alocações:', {
      funcionario_id: funcionario_id,
      funcionarioIdNum,
      obra_id: obra_id,
      obraIdNum,
      status,
      page: pageNum,
      limit: limitNum
    })

    let query = supabaseAdmin
      .from('funcionarios_obras')
      .select(`
        id,
        funcionario_id,
        obra_id,
        data_inicio,
        data_fim,
        horas_trabalhadas,
        valor_hora,
        total_receber,
        status,
        is_supervisor,
        observacoes,
        created_at,
        updated_at,
        funcionarios(
          id, 
          nome, 
          cargo, 
          salario,
          cargo_info:cargos!cargo_id(
            id,
            nome,
            nivel,
            descricao
          )
        ),
        obras(id, nome, cidade, estado, status)
      `, { count: 'exact' })

    if (funcionarioIdNum && !isNaN(funcionarioIdNum)) {
      query = query.eq('funcionario_id', funcionarioIdNum)
      console.log('[FUNCIONARIOS-OBRAS] Filtrando por funcionario_id:', funcionarioIdNum)
    }

    if (obraIdNum && !isNaN(obraIdNum)) {
      query = query.eq('obra_id', obraIdNum)
      console.log('[FUNCIONARIOS-OBRAS] Filtrando por obra_id:', obraIdNum)
    }

    if (status) {
      query = query.eq('status', status)
      console.log('[FUNCIONARIOS-OBRAS] Filtrando por status:', status)
    }

    query = query
      .order('data_inicio', { ascending: false })
      .range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('[FUNCIONARIOS-OBRAS] Erro na query:', error)
      throw error
    }

    // Filtrar alocações com data_fim no passado (mesmo que status seja 'ativo')
    // Uma alocação com data_fim no passado não deve ser considerada ativa
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0) // Zerar horas para comparação apenas de data
    
    let alocacoesFiltradas = data || []
    if (status === 'ativo') {
      alocacoesFiltradas = alocacoesFiltradas.filter(aloc => {
        // Se não tem data_fim, considerar ativa
        if (!aloc.data_fim) return true
        
        // Se tem data_fim, verificar se ainda não passou
        const dataFim = new Date(aloc.data_fim)
        dataFim.setHours(0, 0, 0, 0)
        const aindaAtiva = dataFim >= hoje
        
        if (!aindaAtiva) {
          console.log(`[FUNCIONARIOS-OBRAS] Alocação ${aloc.id} tem data_fim no passado (${aloc.data_fim}), removendo de resultados ativos`)
        }
        
        return aindaAtiva
      })
    }

    console.log('[FUNCIONARIOS-OBRAS] Resultado:', {
      total: count || 0,
      encontrados: data?.length || 0,
      filtrados: alocacoesFiltradas.length,
      alocacoes: alocacoesFiltradas.map(a => ({
        id: a.id,
        funcionario_id: a.funcionario_id,
        obra_id: a.obra_id,
        status: a.status,
        data_fim: a.data_fim,
        obra_nome: a.obras?.nome
      }))
    })

    res.json({
      success: true,
      data: alocacoesFiltradas,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: alocacoesFiltradas.length, // Usar quantidade filtrada
        pages: Math.ceil((alocacoesFiltradas.length) / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao listar alocações:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar alocações',
      error: error.message
    })
  }
})

/**
 * GET /funcionarios-obras/:id
 * Obter alocação por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('funcionarios_obras')
      .select(`
        *,
        funcionarios(id, nome, cargo, salario, telefone, email),
        obras(id, nome, endereco, cidade, estado, status)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Alocação não encontrada'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar alocação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar alocação',
      error: error.message
    })
  }
})

/**
 * POST /funcionarios-obras
 * Criar alocação de funcionário em obra
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = funcionarioObraSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      })
    }

    // Verificar se funcionário já está alocado em alguma obra ativa
    const { data: alocacaoAtiva } = await supabaseAdmin
      .from('funcionarios_obras')
      .select('id, obra_id, obras(nome)')
      .eq('funcionario_id', value.funcionario_id)
      .eq('status', 'ativo')
      .single()

    if (alocacaoAtiva) {
      return res.status(409).json({
        success: false,
        message: `Funcionário já está alocado na obra: ${alocacaoAtiva.obras?.nome || alocacaoAtiva.obra_id}`
      })
    }

    // Debug: verificar valor antes de inserir
    console.log('[FUNCIONARIOS-OBRAS] Valor antes de inserir:', {
      funcionario_id: value.funcionario_id,
      obra_id: value.obra_id,
      is_supervisor: value.is_supervisor,
      is_supervisor_type: typeof value.is_supervisor
    })

    const { data, error } = await supabaseAdmin
      .from('funcionarios_obras')
      .insert(value)
      .select('*, is_supervisor')
      .single()

    if (error) {
      console.error('[FUNCIONARIOS-OBRAS] Erro ao inserir:', error)
      throw error
    }

    // Atualizar obra_atual_id do funcionário quando vinculado a uma obra ativa
    if (data.status === 'ativo') {
      const { error: updateError } = await supabaseAdmin
        .from('funcionarios')
        .update({ obra_atual_id: data.obra_id })
        .eq('id', data.funcionario_id)

      if (updateError) {
        console.error('[FUNCIONARIOS-OBRAS] Erro ao atualizar obra_atual_id:', updateError)
        // Não falhar a criação da alocação se a atualização falhar
      } else {
        console.log('[FUNCIONARIOS-OBRAS] obra_atual_id atualizado para funcionário:', data.funcionario_id)
      }
    }

    // Debug: verificar o que foi salvo
    console.log('[FUNCIONARIOS-OBRAS] Dados salvos:', {
      id: data.id,
      funcionario_id: data.funcionario_id,
      obra_id: data.obra_id,
      is_supervisor: data.is_supervisor,
      is_supervisor_type: typeof data.is_supervisor
    })

    res.status(201).json({
      success: true,
      data,
      message: 'Funcionário alocado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar alocação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar alocação',
      error: error.message
    })
  }
})

/**
 * PUT /funcionarios-obras/:id
 * Atualizar alocação
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Validar dados (permitindo atualizações parciais)
    const partialSchema = funcionarioObraSchema.fork(
      ['funcionario_id', 'obra_id', 'data_inicio'],
      (schema) => schema.optional()
    )

    const { error: validationError, value } = partialSchema.validate(updateData, {
      abortEarly: false,
      stripUnknown: true
    })

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      })
    }

    // Buscar alocação atual antes de atualizar para obter funcionario_id e obra_id
    const { data: alocacaoAtual } = await supabaseAdmin
      .from('funcionarios_obras')
      .select('funcionario_id, obra_id')
      .eq('id', id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('funcionarios_obras')
      .update(value)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Atualizar obra_atual_id do funcionário se status for 'ativo'
    if (value.status === 'ativo' || (!value.status && data.status === 'ativo')) {
      const obraId = value.obra_id || data.obra_id || alocacaoAtual?.obra_id
      const funcionarioId = alocacaoAtual?.funcionario_id || data.funcionario_id

      if (obraId && funcionarioId) {
        const { error: updateError } = await supabaseAdmin
          .from('funcionarios')
          .update({ obra_atual_id: obraId })
          .eq('id', funcionarioId)

        if (updateError) {
          console.error('[FUNCIONARIOS-OBRAS] Erro ao atualizar obra_atual_id:', updateError)
        } else {
          console.log('[FUNCIONARIOS-OBRAS] obra_atual_id atualizado para funcionário:', funcionarioId)
        }
      }
    }

    res.json({
      success: true,
      data,
      message: 'Alocação atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar alocação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar alocação',
      error: error.message
    })
  }
})

/**
 * POST /funcionarios-obras/:id/finalizar
 * Finalizar alocação
 */
router.post('/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params
    const { data_fim } = req.body

    if (!data_fim) {
      return res.status(400).json({
        success: false,
        message: 'Data de fim é obrigatória'
      })
    }

    // Buscar funcionario_id antes de finalizar
    const { data: alocacaoAtual } = await supabaseAdmin
      .from('funcionarios_obras')
      .select('funcionario_id, obra_id')
      .eq('id', id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('funcionarios_obras')
      .update({
        status: 'finalizado',
        data_fim
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Remover obra_atual_id do funcionário quando a alocação é finalizada
    if (alocacaoAtual?.funcionario_id) {
      // Verificar se o funcionário ainda tem outras alocações ativas
      const { data: outrasAlocacoes } = await supabaseAdmin
        .from('funcionarios_obras')
        .select('obra_id')
        .eq('funcionario_id', alocacaoAtual.funcionario_id)
        .eq('status', 'ativo')
        .neq('id', id)
        .limit(1)
        .single()

      if (outrasAlocacoes) {
        // Se tem outras alocações ativas, atualizar para a primeira encontrada
        const { error: updateError } = await supabaseAdmin
          .from('funcionarios')
          .update({ obra_atual_id: outrasAlocacoes.obra_id })
          .eq('id', alocacaoAtual.funcionario_id)

        if (updateError) {
          console.error('[FUNCIONARIOS-OBRAS] Erro ao atualizar obra_atual_id:', updateError)
        }
      } else {
        // Se não tem outras alocações ativas, remover obra_atual_id
        const { error: updateError } = await supabaseAdmin
          .from('funcionarios')
          .update({ obra_atual_id: null })
          .eq('id', alocacaoAtual.funcionario_id)

        if (updateError) {
          console.error('[FUNCIONARIOS-OBRAS] Erro ao remover obra_atual_id:', updateError)
        } else {
          console.log('[FUNCIONARIOS-OBRAS] obra_atual_id removido do funcionário:', alocacaoAtual.funcionario_id)
        }
      }
    }

    res.json({
      success: true,
      data,
      message: 'Alocação finalizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao finalizar alocação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao finalizar alocação',
      error: error.message
    })
  }
})

/**
 * POST /funcionarios-obras/:id/transferir
 * Transferir funcionário para outra obra
 */
router.post('/:id/transferir', async (req, res) => {
  try {
    const { id } = req.params
    const { nova_obra_id, data_transferencia } = req.body

    if (!nova_obra_id) {
      return res.status(400).json({
        success: false,
        message: 'ID da nova obra é obrigatório'
      })
    }

    // Buscar alocação atual
    const { data: alocacaoAtual, error: fetchError } = await supabaseAdmin
      .from('funcionarios_obras')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Finalizar alocação atual
    await supabaseAdmin
      .from('funcionarios_obras')
      .update({
        status: 'transferido',
        data_fim: data_transferencia || new Date().toISOString().split('T')[0]
      })
      .eq('id', id)

    // Criar nova alocação
    const { data: novaAlocacao, error: createError } = await supabaseAdmin
      .from('funcionarios_obras')
      .insert({
        funcionario_id: alocacaoAtual.funcionario_id,
        obra_id: nova_obra_id,
        data_inicio: data_transferencia || new Date().toISOString().split('T')[0],
        valor_hora: alocacaoAtual.valor_hora,
        status: 'ativo',
        observacoes: `Transferido da obra ${alocacaoAtual.obra_id}`
      })
      .select()
      .single()

    if (createError) throw createError

    // Atualizar obra_atual_id do funcionário para a nova obra
    const { error: updateError } = await supabaseAdmin
      .from('funcionarios')
      .update({ obra_atual_id: nova_obra_id })
      .eq('id', alocacaoAtual.funcionario_id)

    if (updateError) {
      console.error('[FUNCIONARIOS-OBRAS] Erro ao atualizar obra_atual_id na transferência:', updateError)
    } else {
      console.log('[FUNCIONARIOS-OBRAS] obra_atual_id atualizado na transferência para funcionário:', alocacaoAtual.funcionario_id)
    }

    res.json({
      success: true,
      data: novaAlocacao,
      message: 'Funcionário transferido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao transferir funcionário:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao transferir funcionário',
      error: error.message
    })
  }
})

/**
 * DELETE /funcionarios-obras/:id
 * Deletar alocação
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se alocação existe
    const { data: alocacao } = await supabaseAdmin
      .from('funcionarios_obras')
      .select('id, status, funcionario_id, obra_id')
      .eq('id', id)
      .single()

    if (!alocacao) {
      return res.status(404).json({
        success: false,
        message: 'Alocação não encontrada'
      })
    }

    // Não permitir deletar alocações finalizadas
    if (alocacao.status === 'finalizado') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar alocação finalizada'
      })
    }

    const { error } = await supabaseAdmin
      .from('funcionarios_obras')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Se a alocação deletada era ativa, atualizar obra_atual_id do funcionário
    if (alocacao.status === 'ativo' && alocacao.funcionario_id) {
      // Verificar se o funcionário ainda tem outras alocações ativas
      const { data: outrasAlocacoes } = await supabaseAdmin
        .from('funcionarios_obras')
        .select('obra_id')
        .eq('funcionario_id', alocacao.funcionario_id)
        .eq('status', 'ativo')
        .limit(1)
        .single()

      if (outrasAlocacoes) {
        // Se tem outras alocações ativas, atualizar para a primeira encontrada
        const { error: updateError } = await supabaseAdmin
          .from('funcionarios')
          .update({ obra_atual_id: outrasAlocacoes.obra_id })
          .eq('id', alocacao.funcionario_id)

        if (updateError) {
          console.error('[FUNCIONARIOS-OBRAS] Erro ao atualizar obra_atual_id:', updateError)
        }
      } else {
        // Se não tem outras alocações ativas, remover obra_atual_id
        const { error: updateError } = await supabaseAdmin
          .from('funcionarios')
          .update({ obra_atual_id: null })
          .eq('id', alocacao.funcionario_id)

        if (updateError) {
          console.error('[FUNCIONARIOS-OBRAS] Erro ao remover obra_atual_id:', updateError)
        } else {
          console.log('[FUNCIONARIOS-OBRAS] obra_atual_id removido do funcionário:', alocacao.funcionario_id)
        }
      }
    }

    res.json({
      success: true,
      message: 'Alocação deletada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar alocação:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar alocação',
      error: error.message
    })
  }
})

/**
 * GET /funcionarios-obras/obra/:obra_id/funcionarios
 * Listar funcionários de uma obra
 */
router.get('/obra/:obra_id/funcionarios', async (req, res) => {
  try {
    const { obra_id } = req.params
    const { status = 'ativo' } = req.query

    const { data, error } = await supabaseAdmin
      .from('funcionarios_obras')
      .select(`
        *,
        funcionarios(id, nome, cargo, salario, telefone, email)
      `)
      .eq('obra_id', obra_id)
      .eq('status', status)

    if (error) throw error

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao listar funcionários da obra:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar funcionários da obra',
      error: error.message
    })
  }
})

export default router

