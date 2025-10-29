import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para custos
const custoSchema = Joi.object({
  obra_id: Joi.number().integer().positive().required(),
  grua_id: Joi.string().optional(),
  tipo: Joi.string().valid('salario', 'material', 'servico', 'manutencao').required(),
  descricao: Joi.string().min(1).max(500).required(),
  valor: Joi.number().min(0).precision(2).required(),
  data_custo: Joi.date().iso().required(),
  funcionario_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('pendente', 'confirmado', 'cancelado').default('pendente'),
  observacoes: Joi.string().max(1000).allow('').optional()
})

// Schema para atualização
const custoUpdateSchema = custoSchema.fork(
  ['obra_id', 'tipo', 'descricao', 'valor', 'data_custo'],
  (schema) => schema.optional()
)

/**
 * @swagger
 * /api/custos:
 *   get:
 *     summary: Listar custos operacionais
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por obra
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [salario, material, servico, manutencao]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, confirmado, cancelado]
 *         description: Filtrar por status
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data início do período
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data fim do período
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de custos operacionais
 */
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obra_id, tipo, status, data_inicio, data_fim, page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit
    
    // Converter datas para string ISO se forem objetos Date
    const dataInicioStr = data_inicio instanceof Date ? data_inicio.toISOString().split('T')[0] : data_inicio
    const dataFimStr = data_fim instanceof Date ? data_fim.toISOString().split('T')[0] : data_fim

    let query = supabaseAdmin
      .from('custos')
      .select(`
        *,
        obras (
          id,
          nome,
          cliente_id,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (obra_id) query = query.eq('obra_id', obra_id)
    if (tipo) query = query.eq('tipo', tipo)
    if (status) query = query.eq('status', status)
    if (dataInicioStr) query = query.gte('data_custo', dataInicioStr)
    if (dataFimStr) query = query.lte('data_custo', dataFimStr)

    query = query
      .range(offset, offset + limit - 1)
      .order('data_custo', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar custos',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao listar custos:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos/export:
 *   get:
 *     summary: Exportar custos
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *           default: csv
 *         description: Formato de exportação
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por obra
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [salario, material, servico, manutencao]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, confirmado, cancelado]
 *         description: Filtrar por status
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data início do período
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data fim do período
 *     responses:
 *       200:
 *         description: Arquivo exportado
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { format = 'csv', obra_id, tipo, status, data_inicio, data_fim } = req.query
    
    // Converter datas para string ISO se forem objetos Date
    const dataInicioStr = data_inicio instanceof Date ? data_inicio.toISOString().split('T')[0] : data_inicio
    const dataFimStr = data_fim instanceof Date ? data_fim.toISOString().split('T')[0] : data_fim

    let query = supabaseAdmin
      .from('custos')
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)

    // Aplicar filtros
    if (obra_id) query = query.eq('obra_id', obra_id)
    if (tipo) query = query.eq('tipo', tipo)
    if (status) query = query.eq('status', status)
    if (dataInicioStr) query = query.gte('data_custo', dataInicioStr)
    if (dataFimStr) query = query.lte('data_custo', dataFimStr)

    query = query.order('data_custo', { ascending: false })

    const { data, error } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar custos para exportação',
        message: error.message
      })
    }

    if (format === 'csv') {
      // Gerar CSV
      const csvHeader = 'ID,Obra,Funcionário,Tipo,Descrição,Valor,Data,Status,Observações\n'
      const csvRows = (data || []).map(custo => {
        const obra = custo.obras?.nome || 'N/A'
        const funcionario = custo.funcionarios?.nome || 'N/A'
        const valor = parseFloat(custo.valor || 0).toFixed(2).replace('.', ',')
        const dataFormatada = new Date(custo.data_custo).toLocaleDateString('pt-BR')
        const observacoes = (custo.observacoes || '').replace(/"/g, '""')
        
        return `"${custo.id}","${obra}","${funcionario}","${custo.tipo}","${custo.descricao}","${valor}","${dataFormatada}","${custo.status}","${observacoes}"`
      }).join('\n')

      const csvContent = csvHeader + csvRows

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="custos-${new Date().toISOString().split('T')[0]}.csv"`)
      res.send('\uFEFF' + csvContent) // BOM para UTF-8
    } else {
      // Para XLSX, retornar JSON por enquanto (implementar XLSX depois se necessário)
      res.json({
        success: true,
        data: data || [],
        message: 'Exportação XLSX não implementada ainda'
      })
    }
  } catch (error) {
    console.error('Erro ao exportar custos:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos/{id}:
 *   get:
 *     summary: Obter custo por ID
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do custo
 *     responses:
 *       200:
 *         description: Dados do custo
 *       404:
 *         description: Custo não encontrado
 */
router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('custos')
      .select(`
        *,
        obras (
          id,
          nome,
          cliente_id,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Custo não encontrado',
          message: 'O custo com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar custo',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar custo:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos:
 *   post:
 *     summary: Criar novo custo
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - obra_id
 *               - tipo
 *               - descricao
 *               - valor
 *               - data_custo
 *             properties:
 *               obra_id:
 *                 type: integer
 *               tipo:
 *                 type: string
 *                 enum: [salario, material, servico, manutencao]
 *               descricao:
 *                 type: string
 *               valor:
 *                 type: number
 *               data_custo:
 *                 type: string
 *                 format: date
 *               funcionario_id:
 *                 type: integer
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Custo criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('obras:criar'), async (req, res) => {
  try {
    const { error: validationError, value } = custoSchema.validate(req.body)
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      })
    }

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome')
      .eq('id', value.obra_id)
      .single()

    if (obraError || !obra) {
      return res.status(404).json({
        error: 'Obra não encontrada',
        message: 'A obra especificada não existe'
      })
    }

    // Verificar se o funcionário existe (se fornecido)
    if (value.funcionario_id) {
      const { data: funcionario, error: funcionarioError } = await supabaseAdmin
        .from('funcionarios')
        .select('id, nome')
        .eq('id', value.funcionario_id)
        .single()

      if (funcionarioError || !funcionario) {
        return res.status(404).json({
          error: 'Funcionário não encontrado',
          message: 'O funcionário especificado não existe'
        })
      }
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('custos')
      .insert(value)
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single()

    if (insertError) {
      console.error('Erro ao criar custo:', insertError)
      return res.status(500).json({
        error: 'Erro ao criar custo',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Custo criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar custo:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos/{id}:
 *   put:
 *     summary: Atualizar custo
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do custo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               obra_id:
 *                 type: integer
 *               tipo:
 *                 type: string
 *                 enum: [salario, material, servico, manutencao]
 *               descricao:
 *                 type: string
 *               valor:
 *                 type: number
 *               data_custo:
 *                 type: string
 *                 format: date
 *               funcionario_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [pendente, confirmado, cancelado]
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Custo atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Custo não encontrado
 */
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { error: validationError, value } = custoUpdateSchema.validate(req.body)
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      })
    }

    // Verificar se o custo existe
    const { data: existingCusto, error: existingError } = await supabaseAdmin
      .from('custos')
      .select('id')
      .eq('id', id)
      .single()

    if (existingError || !existingCusto) {
      return res.status(404).json({
        error: 'Custo não encontrado',
        message: 'O custo especificado não existe'
      })
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('custos')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar custo:', updateError)
      return res.status(500).json({
        error: 'Erro ao atualizar custo',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Custo atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar custo:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos/{id}:
 *   delete:
 *     summary: Excluir custo
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do custo
 *     responses:
 *       200:
 *         description: Custo excluído com sucesso
 *       404:
 *         description: Custo não encontrado
 */
router.delete('/:id', authenticateToken, requirePermission('obras:excluir'), async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se o custo existe
    const { data: existingCusto, error: existingError } = await supabaseAdmin
      .from('custos')
      .select('id')
      .eq('id', id)
      .single()

    if (existingError || !existingCusto) {
      return res.status(404).json({
        error: 'Custo não encontrado',
        message: 'O custo especificado não existe'
      })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('custos')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir custo:', deleteError)
      return res.status(500).json({
        error: 'Erro ao excluir custo',
        message: deleteError.message
      })
    }

    res.json({
      success: true,
      message: 'Custo excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir custo:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos/resumo:
 *   get:
 *     summary: Obter resumo financeiro dos custos
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por obra
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data início do período
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data fim do período
 *     responses:
 *       200:
 *         description: Resumo financeiro
 */
router.get('/resumo', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obra_id, data_inicio, data_fim } = req.query
    
    // Converter datas para string ISO se forem objetos Date
    const dataInicioStr = data_inicio instanceof Date ? data_inicio.toISOString().split('T')[0] : data_inicio
    const dataFimStr = data_fim instanceof Date ? data_fim.toISOString().split('T')[0] : data_fim

    let query = supabaseAdmin
      .from('custos')
      .select('tipo, status, valor')

    if (obra_id) query = query.eq('obra_id', obra_id)
    if (dataInicioStr) query = query.gte('data_custo', dataInicioStr)
    if (dataFimStr) query = query.lte('data_custo', dataFimStr)

    const { data, error } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar resumo',
        message: error.message
      })
    }

    // Calcular estatísticas
    const resumo = {
      totalCustos: data.reduce((sum, custo) => sum + custo.valor, 0),
      totalConfirmados: data
        .filter(c => c.status === 'confirmado')
        .reduce((sum, custo) => sum + custo.valor, 0),
      totalPendentes: data
        .filter(c => c.status === 'pendente')
        .reduce((sum, custo) => sum + custo.valor, 0),
      custosPorTipo: data.reduce((acc, custo) => {
        acc[custo.tipo] = (acc[custo.tipo] || 0) + custo.valor
        return acc
      }, {}),
      totalRegistros: data.length
    }

    res.json({
      success: true,
      data: resumo
    })
  } catch (error) {
    console.error('Erro ao gerar resumo:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos/obra/{obra_id}:
 *   get:
 *     summary: Listar custos por obra
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obra_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data início do período
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data fim do período
 *     responses:
 *       200:
 *         description: Lista de custos da obra
 */
router.get('/obra/:obra_id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obra_id } = req.params
    const { data_inicio, data_fim } = req.query
    
    // Converter datas para string ISO se forem objetos Date
    const dataInicioStr = data_inicio instanceof Date ? data_inicio.toISOString().split('T')[0] : data_inicio
    const dataFimStr = data_fim instanceof Date ? data_fim.toISOString().split('T')[0] : data_fim

    let query = supabaseAdmin
      .from('custos')
      .select(`
        *,
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .eq('obra_id', obra_id)

    if (dataInicioStr) query = query.gte('data_custo', dataInicioStr)
    if (dataFimStr) query = query.lte('data_custo', dataFimStr)

    query = query.order('data_custo', { ascending: false })

    const { data, error } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar custos da obra',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao buscar custos da obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos/{id}/status:
 *   patch:
 *     summary: Atualizar status do custo
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do custo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pendente, confirmado, cancelado]
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Status inválido
 *       404:
 *         description: Custo não encontrado
 */
router.patch('/:id/status', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pendente', 'confirmado', 'cancelado'].includes(status)) {
      return res.status(400).json({
        error: 'Status inválido',
        message: 'Status deve ser: pendente, confirmado ou cancelado'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('custos')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Custo não encontrado',
          message: 'O custo especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar status',
        message: error.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Status atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos/{id}/confirm:
 *   patch:
 *     summary: Confirmar custo
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do custo
 *     responses:
 *       200:
 *         description: Custo confirmado com sucesso
 *       404:
 *         description: Custo não encontrado
 */
router.patch('/:id/confirm', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('custos')
      .update({ 
        status: 'confirmado',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao confirmar custo:', error)
      return res.status(500).json({
        error: 'Erro ao confirmar custo',
        message: error.message
      })
    }

    if (!data) {
      return res.status(404).json({
        error: 'Custo não encontrado',
        message: 'O custo especificado não existe'
      })
    }

    res.json({
      success: true,
      data,
      message: 'Custo confirmado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao confirmar custo:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos/{id}/cancel:
 *   patch:
 *     summary: Cancelar custo
 *     tags: [Custos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do custo
 *     responses:
 *       200:
 *         description: Custo cancelado com sucesso
 *       404:
 *         description: Custo não encontrado
 */
router.patch('/:id/cancel', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('custos')
      .update({ 
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          clientes (
            id,
            nome
          )
        ),
        funcionarios (
          id,
          nome,
          cargo
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao cancelar custo:', error)
      return res.status(500).json({
        error: 'Erro ao cancelar custo',
        message: error.message
      })
    }

    if (!data) {
      return res.status(404).json({
        error: 'Custo não encontrado',
        message: 'O custo especificado não existe'
      })
    }

    res.json({
      success: true,
      data,
      message: 'Custo cancelado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao cancelar custo:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
