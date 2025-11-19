import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'
import { enviarMensagemWebhook, buscarTelefoneWhatsAppUsuario } from '../services/whatsapp-service.js'

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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por título ou mensagem
 *     responses:
 *       200:
 *         description: Lista de notificações
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const offset = (page - 1) * limit
    let userId = req.user.id

    // Se userId é UUID, buscar o ID inteiro da tabela usuarios
    if (typeof userId === 'string' && userId.includes('-')) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', req.user.email)
        .single()

      if (userError || !userData) {
        console.log('⚠️ Usuário não encontrado na tabela usuarios:', req.user.email)
        return res.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        })
      }

      userId = userData.id
    }

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

    // Filtro por busca (título ou mensagem)
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase()
      query = query.or(`titulo.ilike.%${searchTerm}%,mensagem.ilike.%${searchTerm}%`)
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
    let userId = req.user.id

    // Se userId é UUID, buscar o ID inteiro da tabela usuarios
    if (typeof userId === 'string' && userId.includes('-')) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', req.user.email)
        .single()

      if (userError || !userData) {
        console.log('⚠️ Usuário não encontrado na tabela usuarios:', req.user.email)
        return res.json({
          success: true,
          data: []
        })
      }

      userId = userData.id
    }

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
    let userId = req.user.id

    // Se userId é UUID, buscar o ID inteiro da tabela usuarios
    if (typeof userId === 'string' && userId.includes('-')) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', req.user.email)
        .single()

      if (userError || !userData) {
        console.log('⚠️ Usuário não encontrado na tabela usuarios:', req.user.email)
        return res.json({
          success: true,
          count: 0
        })
      }

      userId = userData.id
    }

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
router.post('/', authenticateToken, requirePermission('notificacoes:criar'), async (req, res) => {
  console.log(`[notificacoes] 🆕 Nova requisição de criação de notificação recebida`)
  console.log(`[notificacoes] 📋 Dados recebidos:`, JSON.stringify(req.body))
  
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

    // Inicializar variáveis de WhatsApp ANTES de qualquer processamento
    let whatsappEnviados = 0
    let whatsappErros = 0
    
    console.log(`[notificacoes] ✅ Notificações criadas no banco: ${data?.length || 0}`)
    console.log(`[notificacoes] 👥 Usuários únicos para WhatsApp: ${usuariosUnicos.length}`)
    console.log(`[notificacoes] 📋 IDs dos usuários:`, usuariosUnicos)
    
    // Enviar notificações via WhatsApp (não bloqueia a resposta)
    if (data && data.length > 0 && usuariosUnicos.length > 0) {
      // Executar envio de WhatsApp de forma assíncrona (não bloqueia a resposta)
      (async () => {
        try {
          console.log(`[notificacoes] 🚀 Iniciando envio de WhatsApp para ${usuariosUnicos.length} usuário(s)`)
          
          // Formatar mensagem para WhatsApp
          const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000'
          const linkNotificacao = value.link 
            ? (value.link.startsWith('http') ? value.link : `${FRONTEND_URL}${value.link}`)
            : null
          
          const mensagemWhatsApp = `🔔 *${value.titulo}*

${value.mensagem}

${linkNotificacao ? `\n🔗 Acesse: ${linkNotificacao}` : ''}

---
_Enviado por: ${value.remetente || 'Sistema'}_`

          console.log(`[notificacoes] 📝 Mensagem WhatsApp formatada (primeiros 100 chars):`, mensagemWhatsApp.substring(0, 100) + '...')

          // Enviar WhatsApp para cada destinatário único
          for (const usuarioId of usuariosUnicos) {
            try {
              console.log(`[notificacoes] 🔍 [${usuarioId}] Buscando telefone WhatsApp...`)
              const telefone = await buscarTelefoneWhatsAppUsuario(usuarioId)
              
              if (telefone) {
                console.log(`[notificacoes] 📞 [${usuarioId}] Telefone encontrado: ${telefone}`)
                const resultado = await enviarMensagemWebhook(
                  telefone,
                  mensagemWhatsApp,
                  linkNotificacao,
                  {
                    tipo: 'notificacao',
                    destinatario_nome: `Usuário ${usuarioId}`
                  }
                )
                
                if (resultado.sucesso) {
                  whatsappEnviados++
                  console.log(`[notificacoes] ✅ [${usuarioId}] WhatsApp enviado com sucesso`)
                } else {
                  whatsappErros++
                  console.warn(`[notificacoes] ❌ [${usuarioId}] Erro ao enviar WhatsApp:`, resultado.erro)
                }
              } else {
                console.warn(`[notificacoes] ⚠️ [${usuarioId}] Telefone WhatsApp não encontrado`)
              }
            } catch (error) {
              whatsappErros++
              console.error(`[notificacoes] ❌ [${usuarioId}] Erro ao processar WhatsApp:`, error.message)
              console.error(`[notificacoes] Stack trace:`, error.stack)
            }
          }
          
          console.log(`[notificacoes] 📊 Resumo WhatsApp: ${whatsappEnviados} enviados, ${whatsappErros} erros, ${usuariosUnicos.length} total`)
        } catch (error) {
          console.error(`[notificacoes] ❌ Erro geral ao processar WhatsApp:`, error.message)
          console.error(`[notificacoes] Stack trace:`, error.stack)
        }
      })()
    } else {
      console.warn(`[notificacoes] ⚠️ Não há dados ou usuários para enviar WhatsApp. Data: ${data?.length || 0}, Usuários: ${usuariosUnicos.length}`)
    }

    // Retornar resposta imediatamente (não esperar WhatsApp)
    const mensagemResposta = `Notificação criada com sucesso para ${usuariosUnicos.length} usuário(s)`
    
    // Garantir que o campo whatsapp sempre seja retornado
    const resposta = {
      success: true,
      data: data,
      message: mensagemResposta,
      whatsapp: {
        enviados: 0, // Será atualizado assincronamente
        erros: 0,
        total: usuariosUnicos.length,
        status: 'processando' // Indica que está sendo processado
      }
    }
    
    console.log(`[notificacoes] 📤 Preparando resposta completa:`)
    console.log(`[notificacoes]    - success: ${resposta.success}`)
    console.log(`[notificacoes]    - data: ${resposta.data?.length || 0} notificação(ões)`)
    console.log(`[notificacoes]    - message: ${resposta.message}`)
    console.log(`[notificacoes]    - whatsapp.enviados: ${resposta.whatsapp.enviados}`)
    console.log(`[notificacoes]    - whatsapp.erros: ${resposta.whatsapp.erros}`)
    console.log(`[notificacoes]    - whatsapp.total: ${resposta.whatsapp.total}`)
    console.log(`[notificacoes]    - whatsapp.status: ${resposta.whatsapp.status}`)
    console.log(`[notificacoes] 📤 Resposta completa:`, JSON.stringify(resposta, null, 2))
    
    res.status(201).json(resposta)
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
    let userId = req.user.id

    // Se userId é UUID, buscar o ID inteiro da tabela usuarios
    if (typeof userId === 'string' && userId.includes('-')) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', req.user.email)
        .single()

      if (userError || !userData) {
        console.log('⚠️ Usuário não encontrado na tabela usuarios:', req.user.email)
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          message: 'Usuário não encontrado na tabela de usuários'
        })
      }

      userId = userData.id
    }

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
    let userId = req.user.id

    // Se userId é UUID, buscar o ID inteiro da tabela usuarios
    if (typeof userId === 'string' && userId.includes('-')) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', req.user.email)
        .single()

      if (userError || !userData) {
        console.log('⚠️ Usuário não encontrado na tabela usuarios:', req.user.email)
        return res.json({
          success: true,
          count: 0,
          message: 'Nenhuma notificação para marcar como lida'
        })
      }

      userId = userData.id
    }

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
    let userId = req.user.id

    // Se userId é UUID, buscar o ID inteiro da tabela usuarios
    if (typeof userId === 'string' && userId.includes('-')) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', req.user.email)
        .single()

      if (userError || !userData) {
        console.log('⚠️ Usuário não encontrado na tabela usuarios:', req.user.email)
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          message: 'Usuário não encontrado na tabela de usuários'
        })
      }

      userId = userData.id
    }

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
    let userId = req.user.id

    // Se userId é UUID, buscar o ID inteiro da tabela usuarios
    if (typeof userId === 'string' && userId.includes('-')) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', req.user.email)
        .single()

      if (userError || !userData) {
        console.log('⚠️ Usuário não encontrado na tabela usuarios:', req.user.email)
        return res.json({
          success: true,
          count: 0,
          message: 'Nenhuma notificação para excluir'
        })
      }

      userId = userData.id
    }

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

