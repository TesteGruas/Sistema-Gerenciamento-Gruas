import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticateToken)

// Schema de validação
const medicaoComponenteSchema = Joi.object({
  medicao_id: Joi.number().integer().required(),
  componente_id: Joi.number().integer().required(),
  quantidade_utilizada: Joi.number().integer().min(1).default(1),
  horas_utilizacao: Joi.number().min(0).default(0),
  custo_unitario: Joi.number().min(0).default(0),
  desgaste_percentual: Joi.number().min(0).max(100).default(0),
  observacoes: Joi.string().allow(null, '')
})

// Função para calcular custos automáticos
const calcularCustosAutomaticos = async (medicaoId) => {
  const { data: componentes } = await supabaseAdmin
    .from('medicao_componentes')
    .select('custo_total, desgaste_percentual')
    .eq('medicao_id', medicaoId)

  const custosComponentes = componentes?.reduce((total, comp) => 
    total + (comp.custo_total || 0), 0) || 0

  const desgasteTotal = componentes?.reduce((total, comp) => 
    total + (comp.desgaste_percentual || 0), 0) || 0

  const eficiencia = Math.max(0, 100 - desgasteTotal)

  return {
    custos_componentes: custosComponentes,
    eficiencia_operacional: eficiencia,
    componentes_utilizados: componentes?.length || 0
  }
}

/**
 * @swagger
 * /api/medicoes-componentes:
 *   post:
 *     summary: Adicionar componente à medição
 *     tags: [Medições Componentes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medicao_id
 *               - componente_id
 *             properties:
 *               medicao_id:
 *                 type: integer
 *               componente_id:
 *                 type: integer
 *               quantidade_utilizada:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *               horas_utilizacao:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *               custo_unitario:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *               desgaste_percentual:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 0
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Componente adicionado à medição com sucesso
 *       400:
 *         description: Dados inválidos ou componente já está incluído
 */
router.post('/', requirePermission('editar_obras'), async (req, res) => {
  try {
    const { error, value } = medicaoComponenteSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se componente já está na medição
    const { data: existente } = await supabaseAdmin
      .from('medicao_componentes')
      .select('id')
      .eq('medicao_id', value.medicao_id)
      .eq('componente_id', value.componente_id)
      .single()

    if (existente) {
      return res.status(400).json({
        error: 'Componente já está incluído nesta medição'
      })
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('medicao_componentes')
      .insert([value])
      .select(`
        *,
        componente:grua_componentes(nome, tipo, modelo, fabricante)
      `)
      .single()

    if (insertError) throw insertError

    // Recalcular custos automáticos
    const calculos = await calcularCustosAutomaticos(value.medicao_id)
    
    await supabaseAdmin
      .from('medicoes')
      .update({
        ...calculos,
        updated_at: new Date().toISOString()
      })
      .eq('id', value.medicao_id)

    res.status(201).json({
      success: true,
      data,
      calculos,
      message: 'Componente adicionado à medição com sucesso'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao adicionar componente à medição',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/medicoes-componentes/{medicaoId}/componentes:
 *   get:
 *     summary: Listar componentes de uma medição
 *     tags: [Medições Componentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: medicaoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da medição
 *     responses:
 *       200:
 *         description: Lista de componentes da medição
 */
router.get('/:medicaoId/componentes', requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { medicaoId } = req.params

    const { data, error } = await supabaseAdmin
      .from('medicao_componentes')
      .select(`
        *,
        componente:grua_componentes(
          id, nome, tipo, modelo, fabricante, 
          quantidade_disponivel, quantidade_em_uso
        )
      `)
      .eq('medicao_id', medicaoId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar componentes da medição',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/medicoes-componentes/{id}:
 *   put:
 *     summary: Atualizar componente na medição
 *     tags: [Medições Componentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do componente na medição
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantidade_utilizada:
 *                 type: integer
 *                 minimum: 1
 *               horas_utilizacao:
 *                 type: number
 *                 minimum: 0
 *               custo_unitario:
 *                 type: number
 *                 minimum: 0
 *               desgaste_percentual:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Componente atualizado com sucesso
 *       404:
 *         description: Componente não encontrado na medição
 */
router.put('/:id', requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = medicaoComponenteSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('medicao_componentes')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        componente:grua_componentes(nome, tipo, modelo, fabricante)
      `)
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Componente não encontrado na medição'
        })
      }
      throw updateError
    }

    // Recalcular custos automáticos
    const calculos = await calcularCustosAutomaticos(value.medicao_id)
    
    await supabaseAdmin
      .from('medicoes')
      .update({
        ...calculos,
        updated_at: new Date().toISOString()
      })
      .eq('id', value.medicao_id)

    res.json({
      success: true,
      data,
      calculos,
      message: 'Componente atualizado com sucesso'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao atualizar componente',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/medicoes-componentes/{id}:
 *   delete:
 *     summary: Remover componente da medição
 *     tags: [Medições Componentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do componente na medição
 *     responses:
 *       200:
 *         description: Componente removido da medição com sucesso
 *       404:
 *         description: Componente não encontrado na medição
 */
router.delete('/:id', requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params

    // Buscar medição_id antes de deletar
    const { data: componente } = await supabaseAdmin
      .from('medicao_componentes')
      .select('medicao_id')
      .eq('id', id)
      .single()

    if (!componente) {
      return res.status(404).json({
        error: 'Componente não encontrado na medição'
      })
    }

    const { error } = await supabaseAdmin
      .from('medicao_componentes')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Recalcular custos automáticos
    const calculos = await calcularCustosAutomaticos(componente.medicao_id)
    
    await supabaseAdmin
      .from('medicoes')
      .update({
        ...calculos,
        updated_at: new Date().toISOString()
      })
      .eq('id', componente.medicao_id)

    res.json({
      success: true,
      calculos,
      message: 'Componente removido da medição com sucesso'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao remover componente da medição',
      message: error.message
    })
  }
})

export default router
