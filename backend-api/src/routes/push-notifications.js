import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'
import { emitirNotificacao } from '../server.js'
import {
  getWebPushPublicKey,
  isWebPushConfigured,
  sendWebPush
} from '../services/web-push-service.js'

const router = express.Router()

router.use(authenticateToken)

const subscribeSchema = Joi.object({
  subscription: Joi.object({
    endpoint: Joi.string().uri().required(),
    expirationTime: Joi.number().allow(null).optional(),
    keys: Joi.object({
      p256dh: Joi.string().required(),
      auth: Joi.string().required()
    }).required()
  }).required()
})

const broadcastSchema = Joi.object({
  titulo: Joi.string().min(1).max(255).required(),
  mensagem: Joi.string().min(1).required(),
  tipo: Joi.string().valid('info', 'warning', 'error', 'success', 'grua', 'obra', 'financeiro', 'rh', 'estoque').default('info'),
  link: Joi.string().allow('', null).optional(),
  icone: Joi.string().allow('', null).optional()
})

router.get('/public-key', (req, res) => {
  const publicKey = getWebPushPublicKey()

  if (!publicKey) {
    return res.status(503).json({
      success: false,
      error: 'Web Push não configurado',
      message: 'Chave pública VAPID não encontrada no servidor'
    })
  }

  return res.json({
    success: true,
    data: {
      publicKey
    }
  })
})

router.post('/subscribe', async (req, res) => {
  try {
    const { error, value } = subscribeSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: error.details[0].message
      })
    }

    const subscription = value.subscription
    const userId = String(req.user?.id || '')

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário inválido',
        message: 'Não foi possível identificar o usuário autenticado'
      })
    }

    const payload = {
      user_id: userId,
      endpoint: subscription.endpoint,
      subscription,
      user_agent: req.headers['user-agent'] || null,
      is_active: true,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: upsertError } = await supabaseAdmin
      .from('pwa_push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' })

    if (upsertError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao salvar inscrição',
        message: upsertError.message
      })
    }

    return res.json({
      success: true,
      message: 'Dispositivo inscrito para push com sucesso'
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: err.message
    })
  }
})

router.post('/unsubscribe', async (req, res) => {
  try {
    const endpoint = req.body?.endpoint
    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: 'endpoint é obrigatório'
      })
    }

    const { error } = await supabaseAdmin
      .from('pwa_push_subscriptions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('endpoint', endpoint)

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao remover inscrição',
        message: error.message
      })
    }

    return res.json({
      success: true,
      message: 'Inscrição removida com sucesso'
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: err.message
    })
  }
})

router.post('/broadcast', requirePermission('notificacoes:criar'), async (req, res) => {
  try {
    const { error, value } = broadcastSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: error.details[0].message
      })
    }

    const now = new Date().toISOString()

    // 1) Persistir notificações para usuários ativos
    const { data: usuariosAtivos, error: usuariosError } = await supabaseAdmin
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

    const usuariosIds = (usuariosAtivos || []).map(u => u.id)
    let notificacoesInseridas = []

    if (usuariosIds.length > 0) {
      const linhas = usuariosIds.map(usuarioId => ({
        titulo: value.titulo,
        mensagem: value.mensagem,
        tipo: value.tipo,
        link: value.link || null,
        icone: value.icone || null,
        remetente: req.user?.nome || req.user?.email || 'Sistema',
        destinatarios: [{ tipo: 'geral' }],
        usuario_id: usuarioId,
        lida: false,
        data: now
      }))

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('notificacoes')
        .insert(linhas)
        .select('id, usuario_id, titulo, mensagem, tipo, link, lida, data, remetente, destinatarios')

      if (insertError) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao persistir notificações',
          message: insertError.message
        })
      }

      notificacoesInseridas = inserted || []
    }

    // 2) Emitir websocket em tempo real (usuários online)
    for (const notificacao of notificacoesInseridas) {
      emitirNotificacao(notificacao.usuario_id, notificacao)
    }

    // 3) Enviar Web Push para dispositivos inscritos
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('pwa_push_subscriptions')
      .select('id, endpoint, subscription')
      .eq('is_active', true)

    if (subscriptionsError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar inscrições push',
        message: subscriptionsError.message
      })
    }

    const payload = {
      title: value.titulo,
      body: value.mensagem,
      icon: value.icone || '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: { url: value.link || '/pwa/notificacoes' },
      tag: `api-broadcast-${Date.now()}`
    }

    let pushEnviados = 0
    let pushFalhas = 0
    let pushInativos = 0
    const subscriptionsList = subscriptions || []

    if (isWebPushConfigured()) {
      for (const item of subscriptionsList) {
        try {
          await sendWebPush(item.subscription, payload)
          pushEnviados++
        } catch (pushError) {
          const statusCode = pushError?.statusCode
          pushFalhas++

          if (statusCode === 404 || statusCode === 410) {
            pushInativos++
            await supabaseAdmin
              .from('pwa_push_subscriptions')
              .update({
                is_active: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id)
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Broadcast processado com sucesso',
      data: {
        usuarios_notificados: usuariosIds.length,
        notificacoes_persistidas: notificacoesInseridas.length,
        push_configurado: isWebPushConfigured(),
        push_total_subscriptions: subscriptionsList.length,
        push_enviados: pushEnviados,
        push_falhas: pushFalhas,
        push_desativados: pushInativos
      }
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: err.message
    })
  }
})

export default router
