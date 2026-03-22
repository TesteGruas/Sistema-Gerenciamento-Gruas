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

/**
 * `pwa_push_subscriptions.user_id` deve ser o mesmo `usuarios.id` usado em notificações/ponto.
 * O JWT/req.user às vezes expunha só o UUID do Supabase Auth — resolvemos sempre pela tabela.
 */
async function resolverUsuarioIdParaPushSubscription(reqUser) {
  const email = String(reqUser?.email || '').trim()
  if (email) {
    const { data: row, error } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle()
    if (!error && row?.id != null) {
      return String(row.id)
    }
  }
  const fallback = reqUser?.id
  return fallback != null && String(fallback).trim() !== '' ? String(fallback) : ''
}

const broadcastSchema = Joi.object({
  titulo: Joi.string().min(1).max(255).required(),
  mensagem: Joi.string().min(1).required(),
  tipo: Joi.string().valid('info', 'warning', 'error', 'success', 'grua', 'obra', 'financeiro', 'rh', 'estoque').default('info'),
  link: Joi.string().allow('', null).optional(),
  icone: Joi.string().allow('', null).optional()
})

const debugSendSchema = Joi.object({
  titulo: Joi.string().min(1).max(255).required(),
  mensagem: Joi.string().min(1).required(),
  link: Joi.string().allow('', null).optional(),
  icone: Joi.string().allow('', null).optional(),
  alvo: Joi.string().valid('eu', 'usuario', 'todos_inscritos').required(),
  usuario_id: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/))
    .when('alvo', {
      is: 'usuario',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
})

function normalizarUsuarioIdDebug(raw) {
  if (raw == null || raw === '') return null
  const n = Number(String(raw).trim())
  return Number.isFinite(n) && n > 0 ? String(n) : null
}

/** Normaliza JSON da coluna `subscription` (objeto ou string; evita wrapper acidental). */
function parseSubscriptionRecord(raw) {
  let s = raw
  if (s == null) {
    return { ok: false, message: 'subscription nula' }
  }
  if (typeof s === 'string') {
    try {
      s = JSON.parse(s)
    } catch {
      return { ok: false, message: 'subscription não é JSON válido' }
    }
  }
  if (typeof s === 'object' && s.subscription && typeof s.subscription === 'object') {
    s = s.subscription
  }
  const endpoint = s.endpoint
  const keys = s.keys
  if (!endpoint || typeof endpoint !== 'string') {
    return { ok: false, message: 'endpoint ausente ou inválido no objeto subscription' }
  }
  if (!keys?.p256dh || !keys?.auth) {
    return { ok: false, message: 'keys.p256dh ou keys.auth ausentes' }
  }
  return { ok: true, subscription: s }
}

function hostDoEndpoint(endpoint) {
  try {
    return new URL(endpoint).hostname
  } catch {
    return null
  }
}

function resumoErroWebPush(err) {
  const row = {
    statusCode: err?.statusCode ?? null,
    message: err?.message || String(err)
  }
  if (err?.body != null) {
    const b = typeof err.body === 'string' ? err.body : JSON.stringify(err.body)
    row.bodyPreview = b.length > 800 ? `${b.slice(0, 800)}…` : b
  }
  return row
}

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
    const userId = await resolverUsuarioIdParaPushSubscription(req.user)

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
      message: 'Dispositivo inscrito para push com sucesso',
      data: {
        usuario_id_gravado: userId,
        dica:
          'Deve ser o mesmo usuarios.id das notificações de ponto (ex. 181). Se era UUID antes, refaça subscribe após atualizar o backend.'
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

/**
 * Debug: envia apenas Web Push (PWA), sem persistir em `notificacoes` nem broadcast WS.
 * Requer permissão de admin de sistema (mesma visão do menu Configurações do Sistema).
 */
router.post('/debug-send', requirePermission('usuarios:gerenciar'), async (req, res) => {
  try {
    const { error, value } = debugSendSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: error.details[0].message
      })
    }

    if (!isWebPushConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Web Push não configurado',
        message: 'Defina VAPID no servidor (variáveis de ambiente) para enviar push'
      })
    }

    let query = supabaseAdmin
      .from('pwa_push_subscriptions')
      .select('id, user_id, endpoint, subscription')
      .eq('is_active', true)

    if (value.alvo === 'eu') {
      const me = req.user?.id != null ? String(req.user.id) : ''
      if (!me) {
        return res.status(401).json({
          success: false,
          error: 'Usuário inválido',
          message: 'Não foi possível identificar seu usuário na tabela usuarios'
        })
      }
      query = query.eq('user_id', me)
    } else if (value.alvo === 'usuario') {
      const uid = normalizarUsuarioIdDebug(value.usuario_id)
      if (!uid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          message: 'usuario_id inválido'
        })
      }
      query = query.eq('user_id', uid)
    }

    const { data: subscriptions, error: subscriptionsError } = await query

    if (subscriptionsError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar inscrições push',
        message: subscriptionsError.message
      })
    }

    const subscriptionsList = subscriptions || []
    const payload = {
      title: value.titulo,
      body: value.mensagem,
      icon: value.icone || '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: { url: value.link || '/pwa/notificacoes' },
      tag: `api-debug-push-${Date.now()}`,
      renotify: true
    }

    let pushEnviados = 0
    let pushFalhas = 0
    let pushInativos = 0
    const falhasDetalhe = []

    for (const item of subscriptionsList) {
      const parsed = parseSubscriptionRecord(item.subscription)
      if (!parsed.ok) {
        pushFalhas++
        falhasDetalhe.push({
          subscription_id: item.id,
          endpoint_host: item.endpoint ? hostDoEndpoint(item.endpoint) : null,
          motivo: 'subscription_invalida',
          message: parsed.message
        })
        continue
      }

      try {
        await sendWebPush(parsed.subscription, payload)
        pushEnviados++
      } catch (pushError) {
        const statusCode = pushError?.statusCode
        pushFalhas++
        const det = {
          subscription_id: item.id,
          endpoint_host: hostDoEndpoint(parsed.subscription.endpoint),
          ...resumoErroWebPush(pushError)
        }
        falhasDetalhe.push(det)
        if (process.env.NODE_ENV === 'development') {
          console.error('[push/debug-send] Falha web-push:', det)
        }
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

    const teve403 = falhasDetalhe.some((d) => d.statusCode === 403)
    const teve401 = falhasDetalhe.some((d) => d.statusCode === 401)

    return res.json({
      success: true,
      message: 'Push de debug processado (sem gravar notificações no banco)',
      data: {
        alvo: value.alvo,
        push_total_subscriptions: subscriptionsList.length,
        push_enviados: pushEnviados,
        push_falhas: pushFalhas,
        push_desativados: pushInativos,
        entrega_ok: pushEnviados > 0,
        falhas_detalhe: falhasDetalhe,
        dicas:
          teve403 || teve401
            ? [
                'HTTP 401/403 no Web Push quase sempre indica par VAPID (WEB_PUSH_VAPID_PUBLIC_KEY + PRIVATE_KEY + SUBJECT) diferente do usado quando o PWA chamou /push/subscribe.',
                'O aparelho precisa se inscrever contra o mesmo backend (mesmo .env) que você usa ao chamar /push/debug-send. Ambiente local vs produção costuma causar isso.',
                'Corrija o .env do backend, reinicie a API e no celular abra o PWA de novo, permita notificações (ou limpe dados do site) para gerar nova subscription.'
              ]
            : pushFalhas > 0 && pushEnviados === 0
              ? ['Veja falhas_detalhe.message e bodyPreview (resposta do serviço de push, ex. FCM).']
              : undefined
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
