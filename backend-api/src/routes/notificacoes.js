import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para notificações
const notificacaoSchema = Joi.object({
  titulo: Joi.string().min(1).max(255).required(),
  mensagem: Joi.string().min(1).required(),
  tipo: Joi.string().valid('info', 'warning', 'error', 'success', 'grua', 'obra', 'financeiro', 'rh', 'estoque').required(),
  link: Joi.string().uri({ relativeOnly: true }).allow('').optional(),
  icone: Joi.string().max(100).allow('').optional(),
  destinatarios: Joi.array().items(
    Joi.object({
      tipo: Joi.string().valid('geral', 'cliente', 'funcionario', 'obra').required(),
      id: Joi.string().allow('').optional(),
      nome: Joi.string().allow('').optional(),
      info: Joi.string().allow('').optional()
    })
  ).optional(),
  remetente: Joi.string().max(255).allow('').optional()
})

/**
 * @swagger
 * /api/notificacoes:
 *   get:
 *     summary: Listar todas as notificações do usuário autenticado
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [info, warning, error, success, grua, obra, financeiro, rh, estoque]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: lida
 *         schema:
 *           type: boolean
 *         description: Filtrar por lida (true/false)
 *     responses:
 *       200:
 *         description: Lista de notificações
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const offset = (page - 1) * limit
    const userId = req.user.id

    let query = supabaseAdmin
      .from('notificacoes')
      .select('*', { count: 'exact' })
      .eq('usuario_id', userId)

    // Filtro por tipo
    if (req.query.tipo) {
      query = query.eq('tipo', req.query.tipo)
    }

    // Filtro por lida
    if (req.query.lida !== undefined) {
      const lida = req.query.lida === 'true'
      query = query.eq('lida', lida)
    }

    query = query
      .range(offset, offset + limit - 1)
      .order('data', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar notificações',
        message: error.message
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao listar notificações:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/notificacoes/nao-lidas:
 *   get:
 *     summary: Listar apenas notificações não lidas
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array de notificações não lidas
 */
router.get('/nao-lidas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const { data, error } = await supabaseAdmin
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', userId)
      .eq('lida', false)
      .order('data', { ascending: false })

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar notificações não lidas',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao listar notificações não lidas:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/notificacoes/count/nao-lidas:
 *   get:
 *     summary: Retorna contagem de notificações não lidas
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contagem de não lidas
 */
router.get('/count/nao-lidas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const { count, error } = await supabaseAdmin
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .eq('lida', false)

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao contar notificações não lidas',
        message: error.message
      })
    }

    res.json({
      success: true,
      count: count || 0
    })
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/notificacoes:
 *   post:
 *     summary: Criar nova notificação
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - mensagem
 *               - tipo
 *             properties:
 *               titulo:
 *                 type: string
 *               mensagem:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [info, warning, error, success, grua, obra, financeiro, rh, estoque]
 *               destinatarios:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Notificação criada com sucesso
 */
router.post('/', authenticateToken, requirePermission('criar_notificacoes'), async (req, res) => {
  try {
    const { error: validationError, value } = notificacaoSchema.validate(req.body)
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationError.details[0].message
      })
    }

    const destinatarios = value.destinatarios || []
    const destinatariosUsuarios = []

    // Processar destinatários e determinar usuários que receberão a notificação
    if (destinatarios.length === 0 || destinatarios.some(d => d.tipo === 'geral')) {
      // Notificação geral - enviar para todos os usuários
      const { data: usuarios, error: usuariosError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('status', 'Ativo')

      if (usuariosError) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar usuários',
          message: usuariosError.message
        })
      }

      destinatariosUsuarios.push(...usuarios.map(u => u.id))
    } else {
      // Processar destinatários específicos
      for (const dest of destinatarios) {
        if (dest.tipo === 'cliente' && dest.id) {
          // Buscar usuário vinculado ao cliente
          const { data: cliente } = await supabaseAdmin
            .from('clientes')
            .select('contato_usuario_id')
            .eq('id', dest.id)
            .single()

          if (cliente?.contato_usuario_id) {
            destinatariosUsuarios.push(cliente.contato_usuario_id)
          }
        } else if (dest.tipo === 'funcionario' && dest.id) {
          // Buscar usuario_id vinculado ao funcionario_id
          const { data: usuario } = await supabaseAdmin
            .from('usuarios')
            .select('id')
            .eq('funcionario_id', dest.id)
            .eq('status', 'Ativo')
            .single()

          if (usuario?.id) {
            destinatariosUsuarios.push(usuario.id)
          }
        } else if (dest.tipo === 'obra' && dest.id) {
          // Buscar usuários relacionados à obra (pode expandir essa lógica)
          // Por ora, buscar responsáveis pela obra
          const { data: obra } = await supabaseAdmin
            .from('obras')
            .select('responsavel_id')
            .eq('id', dest.id)
            .single()

          if (obra?.responsavel_id) {
            destinatariosUsuarios.push(obra.responsavel_id)
          }
        }
      }
    }

    // Remover duplicatas
    const usuariosUnicos = [...new Set(destinatariosUsuarios)]

    if (usuariosUnicos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum destinatário válido encontrado',
        message: 'Não foi possível identificar usuários para enviar a notificação'
      })
    }

    // Criar notificação para cada usuário
    const notificacoes = usuariosUnicos.map(usuarioId => ({
      titulo: value.titulo,
      mensagem: value.mensagem,
      tipo: value.tipo,
      link: value.link || null,
      icone: value.icone || null,
      destinatarios: destinatarios,
      remetente: value.remetente || req.user.nome || 'Sistema',
      usuario_id: usuarioId,
      lida: false,
      data: new Date().toISOString()
    }))

    const { data, error: insertError } = await supabaseAdmin
      .from('notificacoes')
      .insert(notificacoes)
      .select()

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar notificação',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data: data,
      message: `Notificação criada com sucesso para ${usuariosUnicos.length} usuário(s)`
    })
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/notificacoes/{id}/marcar-lida:
 *   patch:
 *     summary: Marca notificação específica como lida
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação marcada como lida
 */
router.patch('/:id/marcar-lida', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Verificar se a notificação pertence ao usuário
    const { data: notificacao, error: checkError } = await supabaseAdmin
      .from('notificacoes')
      .select('id')
      .eq('id', id)
      .eq('usuario_id', userId)
      .single()

    if (checkError || !notificacao) {
      return res.status(404).json({
        success: false,
        error: 'Notificação não encontrada',
        message: 'A notificação não existe ou você não tem permissão para acessá-la'
      })
    }

    const { error: updateError } = await supabaseAdmin
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id)
      .eq('usuario_id', userId)

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao marcar notificação como lida',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    })
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/notificacoes/marcar-todas-lidas:
 *   patch:
 *     summary: Marca todas as notificações do usuário como lidas
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas as notificações foram marcadas como lidas
 */
router.patch('/marcar-todas-lidas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Primeiro contar quantas notificações não lidas existem
    const { count } = await supabaseAdmin
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .eq('lida', false)

    // Atualizar todas
    const { error: updateError } = await supabaseAdmin
      .from('notificacoes')
      .update({ lida: true })
      .eq('usuario_id', userId)
      .eq('lida', false)

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao marcar todas as notificações como lidas',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas',
      count: count || 0
    })
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/notificacoes/{id}:
 *   delete:
 *     summary: Exclui notificação específica
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação excluída com sucesso
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Verificar se a notificação pertence ao usuário
    const { data: notificacao, error: checkError } = await supabaseAdmin
      .from('notificacoes')
      .select('id')
      .eq('id', id)
      .eq('usuario_id', userId)
      .single()

    if (checkError || !notificacao) {
      return res.status(404).json({
        success: false,
        error: 'Notificação não encontrada',
        message: 'A notificação não existe ou você não tem permissão para excluí-la'
      })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('notificacoes')
      .delete()
      .eq('id', id)
      .eq('usuario_id', userId)

    if (deleteError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir notificação',
        message: deleteError.message
      })
    }

    res.json({
      success: true,
      message: 'Notificação excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir notificação:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/notificacoes/todas:
 *   delete:
 *     summary: Exclui todas as notificações do usuário
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas as notificações foram excluídas
 */
router.delete('/todas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Primeiro contar quantas notificações existem
    const { count } = await supabaseAdmin
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)

    // Excluir todas
    const { error: deleteError } = await supabaseAdmin
      .from('notificacoes')
      .delete()
      .eq('usuario_id', userId)

    if (deleteError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir todas as notificações',
        message: deleteError.message
      })
    }

    res.json({
      success: true,
      message: 'Todas as notificações foram excluídas',
      count: count || 0
    })
  } catch (error) {
    console.error('Erro ao excluir todas as notificações:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router

