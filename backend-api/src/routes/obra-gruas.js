import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticateToken)

// Schema de validação
const configuracaoSchema = Joi.object({
  obra_id: Joi.number().integer().required(),
  grua_id: Joi.string().required(),
  posicao_x: Joi.number().allow(null),
  posicao_y: Joi.number().allow(null),
  posicao_z: Joi.number().allow(null),
  angulo_rotacao: Joi.number().default(0),
  alcance_operacao: Joi.number().allow(null),
  area_cobertura: Joi.object().allow(null),
  data_instalacao: Joi.date().allow(null),
  observacoes: Joi.string().allow(null, '')
})

/**
 * @swagger
 * /api/obra-gruas/{obraId}:
 *   get:
 *     summary: Listar gruas de uma obra
 *     tags: [Obra Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     responses:
 *       200:
 *         description: Lista de gruas da obra
 */
router.get('/:obraId', requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obraId } = req.params
    
    // Primeiro buscar as configurações
    const { data: configuracoes, error: configError } = await supabaseAdmin
      .from('obra_gruas_configuracao')
      .select('*')
      .eq('obra_id', obraId)
      .eq('status', 'ativa')
      .order('data_instalacao', { ascending: false })

    if (configError) throw configError

    // Depois buscar os dados das gruas
    const gruaIds = configuracoes?.map(c => c.grua_id) || []
    let gruas = []
    
    if (gruaIds.length > 0) {
      const { data: gruasData, error: gruasError } = await supabaseAdmin
        .from('gruas')
        .select('id, name, modelo, fabricante, tipo, capacidade')
        .in('id', gruaIds)
      
      if (gruasError) throw gruasError
      gruas = gruasData || []
    }

    // Combinar os dados
    const data = configuracoes?.map(config => ({
      ...config,
      grua: gruas.find(g => g.id === config.grua_id) || null
    })) || []

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar gruas da obra',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obra-gruas:
 *   post:
 *     summary: Adicionar grua à obra
 *     tags: [Obra Gruas]
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
 *               - grua_id
 *             properties:
 *               obra_id:
 *                 type: integer
 *               grua_id:
 *                 type: string
 *               posicao_x:
 *                 type: number
 *               posicao_y:
 *                 type: number
 *               posicao_z:
 *                 type: number
 *               angulo_rotacao:
 *                 type: number
 *               alcance_operacao:
 *                 type: number
 *               area_cobertura:
 *                 type: object
 *               data_instalacao:
 *                 type: string
 *                 format: date
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Grua adicionada à obra com sucesso
 *       400:
 *         description: Dados inválidos ou grua já está ativa
 */
router.post('/', requirePermission('obras:editar'), async (req, res) => {
  try {
    console.log('📝 Requisição para adicionar grua à obra:', req.body)
    
    const { error, value } = configuracaoSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    console.log('✅ Dados validados:', value)

    // Listar todas as gruas ativas nesta obra para debug
    const { data: gruasAtivas, error: listError } = await supabaseAdmin
      .from('obra_gruas_configuracao')
      .select('id, grua_id, status')
      .eq('obra_id', value.obra_id)
      .eq('status', 'ativa')

    if (listError) {
      console.error('❌ Erro ao listar gruas ativas:', listError)
    } else {
      console.log(`📋 Gruas ativas na obra ${value.obra_id}:`, gruasAtivas)
    }

    // Verificar se a grua já está ativa nesta obra
    const { data: existente, error: checkError } = await supabaseAdmin
      .from('obra_gruas_configuracao')
      .select('id')
      .eq('obra_id', value.obra_id)
      .eq('grua_id', value.grua_id)
      .eq('status', 'ativa')
      .maybeSingle()

    console.log('🔍 Resultado da verificação:', { existente, checkError })

    // Ignora o erro PGRST116 (nenhum registro encontrado)
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar grua existente:', checkError)
      throw checkError
    }

    if (existente) {
      console.log(`⚠️ Grua ${value.grua_id} já está ativa na obra ${value.obra_id}`)
      return res.status(400).json({
        error: 'Grua já está ativa nesta obra',
        details: `A grua ${value.grua_id} já está registrada como ativa nesta obra`
      })
    }

    console.log(`✅ Grua ${value.grua_id} pode ser adicionada à obra ${value.obra_id}`)

    const { data, error: insertError } = await supabaseAdmin
      .from('obra_gruas_configuracao')
      .insert([{
        ...value,
        data_instalacao: value.data_instalacao || new Date().toISOString().split('T')[0]
      }])
      .select()
      .single()

    if (insertError) throw insertError

    res.status(201).json({
      success: true,
      data,
      message: 'Grua adicionada à obra com sucesso'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao adicionar grua à obra',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obra-gruas/{id}:
 *   put:
 *     summary: Atualizar configuração de grua na obra
 *     tags: [Obra Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da configuração
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               posicao_x:
 *                 type: number
 *               posicao_y:
 *                 type: number
 *               posicao_z:
 *                 type: number
 *               angulo_rotacao:
 *                 type: number
 *               alcance_operacao:
 *                 type: number
 *               area_cobertura:
 *                 type: object
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
 *       404:
 *         description: Configuração não encontrada
 */
router.put('/:id', requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = configuracaoSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('obra_gruas_configuracao')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Configuração não encontrada'
        })
      }
      throw updateError
    }

    res.json({
      success: true,
      data,
      message: 'Configuração atualizada com sucesso'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao atualizar configuração',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obra-gruas/{id}:
 *   delete:
 *     summary: Remover grua da obra
 *     tags: [Obra Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da configuração
 *     responses:
 *       200:
 *         description: Grua removida da obra com sucesso
 *       404:
 *         description: Configuração não encontrada
 */
router.delete('/:id', requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('obra_gruas_configuracao')
      .update({
        status: 'removida',
        data_remocao: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Configuração não encontrada'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data,
      message: 'Grua removida da obra com sucesso'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao remover grua da obra',
      message: error.message
    })
  }
})

export default router
