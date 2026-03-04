import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'
import { enviarMensagemWebhook, buscarTelefoneWhatsAppUsuario } from '../services/whatsapp-service.js'
import { emitirNotificacaoMultiplos } from '../server.js'

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

    console.log(`[notificacoes] 🚀 GET /api/notificacoes - Iniciando busca`)
    console.log(`[notificacoes] 📧 Email do usuário: ${req.user.email}`)
    console.log(`[notificacoes] 🆔 req.user.id inicial: ${userId} (tipo: ${typeof userId})`)

    // Se userId é UUID, buscar o ID inteiro da tabela usuarios
    if (typeof userId === 'string' && userId.includes('-')) {
      console.log(`[notificacoes] 🔄 Convertendo UUID para ID numérico`)
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
      console.log(`[notificacoes] ✅ ID numérico encontrado: ${userId}`)
    }
    
    console.log(`[notificacoes] 🆔 userId final para busca: ${userId} (tipo: ${typeof userId})`)
    
    // Verificar se é admin - admins veem TODAS as notificações
    const userRole = req.user.role || req.user.perfil?.nome || null
    const isAdmin = userRole && (
      userRole.toLowerCase() === 'admin' || 
      userRole.toLowerCase() === 'administrador' ||
      userRole.toLowerCase() === 'adm'
    )
    
    console.log(`[notificacoes] 👤 Role do usuário: ${userRole || 'N/A'}, É admin: ${isAdmin}`)

    // Buscar cliente vinculado ao usuário (se existir) - apenas se NÃO for admin
    let clienteId = null
    let clienteCnpj = null
    try {
      console.log(`[notificacoes] 🔍 Buscando cliente para usuario_id: ${userId} (tipo: ${typeof userId})`)
      const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('clientes')
        .select('id, cnpj')
        .eq('contato_usuario_id', userId)
        .single()

      if (clienteError) {
        console.log(`[notificacoes] ⚠️ Erro ao buscar cliente:`, clienteError)
        if (clienteError.code === 'PGRST116') {
          console.log(`[notificacoes] ℹ️ Usuário ${userId} não é cliente (nenhum registro encontrado)`)
        }
      } else if (cliente) {
        clienteId = cliente.id.toString()
        clienteCnpj = cliente.cnpj ? cliente.cnpj.replace(/\D/g, '') : null // Remove formatação do CNPJ
        console.log(`[notificacoes] ✅ Cliente encontrado: ID ${clienteId} (tipo: ${typeof clienteId}), CNPJ ${clienteCnpj || 'N/A'} para usuário ${userId}`)
      } else {
        console.log(`[notificacoes] ℹ️ Nenhum cliente encontrado para usuário ${userId}`)
      }
    } catch (error) {
      // Não é cliente, continuar normalmente
      console.log(`[notificacoes] ⚠️ Exceção ao buscar cliente para usuário ${userId}:`, error.message)
    }

    // Buscar notificações vinculadas ao usuario_id OU onde o cliente está nos destinatários
    let query = supabaseAdmin
      .from('notificacoes')
      .select('*', { count: 'exact' })

    // Se é ADMIN, não aplicar filtro de usuario_id (vai buscar TODAS as notificações)
    // Se não é cliente e não é admin, buscar apenas por usuario_id
    // Se é cliente, não aplicar filtro de usuario_id aqui (vai buscar por destinatários depois)
    if (isAdmin) {
      // Admin vê todas as notificações - não aplicar filtro de usuario_id
      console.log(`[notificacoes] 🔓 Admin detectado - buscando TODAS as notificações`)
    } else if (!clienteId) {
      // Não é cliente e não é admin - buscar apenas por usuario_id
      query = query.eq('usuario_id', userId)
    }
    // Se é cliente, não aplicar filtro aqui - vai buscar todas e filtrar por destinatários

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

    // Se é cliente, buscar também notificações onde o cliente está nos destinatários
    let notificacoesPorUsuario = []
    let notificacoesPorDestinatario = []
    let countTotal = 0

    // Query 1: Notificações vinculadas ao usuario_id
    // Se é ADMIN, buscar TODAS as notificações sem filtro de usuario_id
    // Se é cliente, NÃO buscar por usuario_id (apenas por destinatários específicos)
    // Se não é cliente e não é admin, buscar normalmente por usuario_id
    if (isAdmin) {
      // Admin vê todas as notificações - buscar todas sem filtro de usuario_id
      console.log(`[notificacoes] 🔓 Buscando TODAS as notificações (Admin)`)
      const queryAdmin = query
        .range(offset, offset + limit - 1)
        .order('data', { ascending: false })

      const { data: dataAdmin, error: errorAdmin, count: countAdmin } = await queryAdmin

      if (errorAdmin) {
        console.error('Erro ao buscar notificações (Admin):', errorAdmin)
      } else {
        notificacoesPorUsuario = dataAdmin || []
        countTotal = countAdmin || 0
        console.log(`[notificacoes] ✅ Admin - Encontradas ${notificacoesPorUsuario.length} notificações (total: ${countTotal})`)
        if (notificacoesPorUsuario.length > 0) {
          console.log(`[notificacoes] 📋 IDs:`, notificacoesPorUsuario.map(n => `${n.id} (usuario_id: ${n.usuario_id}, destinatarios: ${JSON.stringify(n.destinatarios)})`))
        }
      }
    } else if (!clienteId) {
      // Se não é cliente e não é admin, buscar por usuario_id normalmente
      console.log(`[notificacoes] 🔍 Buscando notificações por usuario_id: ${userId} (NÃO é cliente)`)
      const queryUsuario = query
        .range(offset, offset + limit - 1)
        .order('data', { ascending: false })

      const { data: dataUsuario, error: errorUsuario, count: countUsuario } = await queryUsuario

      if (errorUsuario) {
        console.error('Erro ao buscar notificações por usuario_id:', errorUsuario)
      } else {
        notificacoesPorUsuario = dataUsuario || []
        countTotal = countUsuario || 0
        console.log(`[notificacoes] ✅ Encontradas ${notificacoesPorUsuario.length} notificações por usuario_id ${userId}`)
        if (notificacoesPorUsuario.length > 0) {
          console.log(`[notificacoes] 📋 IDs:`, notificacoesPorUsuario.map(n => `${n.id} (usuario_id: ${n.usuario_id}, destinatarios: ${JSON.stringify(n.destinatarios)})`))
        }
      }
    } else {
      // Se é cliente, não buscar por usuario_id (vai buscar apenas por destinatários)
      console.log(`[notificacoes] ⏭️ Pulando busca por usuario_id (é cliente ${clienteId})`)
      notificacoesPorUsuario = []
      countTotal = 0
    }

    // Query 2: Se é cliente (e não é admin), buscar também notificações onde o cliente está nos destinatários
    // Admin não precisa desta query pois já busca todas as notificações
    if (clienteId && !isAdmin) {
      try {
        console.log(`[notificacoes] 🔍 Buscando notificações para cliente ID ${clienteId}, CNPJ ${clienteCnpj || 'N/A'} (usuario_id: ${userId})`)
        
        // Buscar todas as notificações que podem ter o cliente nos destinatários
        // Não excluir por usuario_id aqui, vamos filtrar depois para evitar perder notificações
        const { data: todasNotificacoes, error: errorDestinatario } = await supabaseAdmin
          .from('notificacoes')
          .select('*')
          .order('data', { ascending: false })
          .limit(1000) // Limite razoável para filtrar depois

        if (!errorDestinatario && todasNotificacoes) {
          console.log(`[notificacoes] 📋 Total de notificações encontradas: ${todasNotificacoes.length}`)
          
          // Filtrar manualmente onde o cliente está nos destinatários
          console.log(`[notificacoes] 🔍 Filtrando ${todasNotificacoes.length} notificações para cliente ID ${clienteId} (tipo: ${typeof clienteId}), CNPJ ${clienteCnpj || 'N/A'}`)
          
          notificacoesPorDestinatario = todasNotificacoes.filter(notif => {
            // Se é cliente, não excluir por usuario_id (já não buscamos por usuario_id)
            // Verificar se o cliente está nos destinatários
            if (notif.destinatarios && Array.isArray(notif.destinatarios)) {
              // Log para debug
              const temDestinatariosCliente = notif.destinatarios.some(dest => dest.tipo === 'cliente')
              if (temDestinatariosCliente) {
                console.log(`[notificacoes] 📝 Notificação ${notif.id} tem destinatários cliente:`, JSON.stringify(notif.destinatarios))
              }
              
              const temCliente = notif.destinatarios.some(dest => {
                if (dest.tipo !== 'cliente') return false
                
                // Comparar IDs de várias formas possíveis (string, número, etc)
                // Normalizar ambos para string e número para comparação robusta
                const destIdStr = String(dest.id || '').trim()
                const clienteIdStr = String(clienteId || '').trim()
                const destIdNum = parseInt(dest.id) || 0
                const clienteIdNum = parseInt(clienteId) || 0
                
                console.log(`[notificacoes] 🔍 Comparando: dest.id="${dest.id}" (tipo: ${typeof dest.id}) vs clienteId="${clienteId}" (tipo: ${typeof clienteId})`)
                console.log(`[notificacoes] 🔍 Strings: "${destIdStr}" vs "${clienteIdStr}"`)
                console.log(`[notificacoes] 🔍 Números: ${destIdNum} vs ${clienteIdNum}`)
                
                // Comparação robusta: string === string OU número === número OU conversões
                const matchId = (
                  destIdStr === clienteIdStr ||
                  destIdNum === clienteIdNum ||
                  String(destIdNum) === clienteIdStr ||
                  destIdStr === String(clienteIdNum) ||
                  (destIdNum > 0 && destIdNum === parseInt(clienteIdStr)) ||
                  (clienteIdNum > 0 && parseInt(destIdStr) === clienteIdNum)
                )
                
                // Comparar CNPJ (campo info) se disponível
                let matchCnpj = false
                if (clienteCnpj && dest.info) {
                  const destCnpj = dest.info.replace(/\D/g, '') // Remove formatação
                  matchCnpj = destCnpj === clienteCnpj
                  console.log(`[notificacoes] 🔍 Comparando CNPJ: destCnpj="${destCnpj}" vs clienteCnpj="${clienteCnpj}", match=${matchCnpj}`)
                }
                
                const match = matchId || matchCnpj
                
                if (match) {
                  console.log(`[notificacoes] ✅ Notificação ${notif.id} encontrada para cliente ${clienteId} (dest.id: ${dest.id}, tipo: ${typeof dest.id}, dest.info: ${dest.info}, matchId: ${matchId}, matchCnpj: ${matchCnpj})`)
                } else {
                  console.log(`[notificacoes] ❌ Notificação ${notif.id} NÃO corresponde ao cliente ${clienteId} (dest.id: ${dest.id}, tipo: ${typeof dest.id})`)
                }
                
                return match
              })
              
              return temCliente
            }
            return false
          })
          
          console.log(`[notificacoes] ✅ Notificações encontradas por destinatário: ${notificacoesPorDestinatario.length}`)
        } else if (errorDestinatario) {
          console.error(`[notificacoes] ❌ Erro ao buscar notificações por destinatário:`, errorDestinatario)
        }
      } catch (error) {
        console.error('Erro ao buscar notificações por destinatário:', error)
      }
    }

    // Combinar e ordenar notificações
    // Se é admin, já tem todas as notificações em notificacoesPorUsuario, não precisa combinar
    const todasNotificacoes = isAdmin 
      ? notificacoesPorUsuario 
      : [...notificacoesPorUsuario, ...notificacoesPorDestinatario]
    
    console.log(`[notificacoes] 📊 Resumo da busca:`)
    console.log(`  - Role: ${userRole || 'N/A'}`)
    console.log(`  - É Admin: ${isAdmin ? 'Sim' : 'Não'}`)
    console.log(`  - Cliente ID: ${clienteId || 'N/A'}`)
    console.log(`  - Cliente CNPJ: ${clienteCnpj || 'N/A'}`)
    console.log(`  - Usuario ID: ${userId}`)
    console.log(`  - Notificações por usuario_id: ${notificacoesPorUsuario.length}`)
    if (notificacoesPorUsuario.length > 0) {
      console.log(`  - IDs das notificações por usuario_id:`, notificacoesPorUsuario.map(n => n.id))
    }
    console.log(`  - Notificações por destinatário: ${notificacoesPorDestinatario.length}`)
    if (notificacoesPorDestinatario.length > 0) {
      console.log(`  - IDs das notificações por destinatário:`, notificacoesPorDestinatario.map(n => n.id))
    }
    console.log(`  - Total antes de remover duplicatas: ${todasNotificacoes.length}`)
    
    // Remover duplicatas (por ID)
    const notificacoesUnicas = todasNotificacoes.filter((notif, index, self) => 
      index === self.findIndex(n => n.id === notif.id)
    )
    
    console.log(`  - Total após remover duplicatas: ${notificacoesUnicas.length}`)

    // Aplicar filtros adicionais
    let notificacoesFiltradas = notificacoesUnicas

    // Filtro por tipo
    if (req.query.tipo) {
      notificacoesFiltradas = notificacoesFiltradas.filter(n => n.tipo === req.query.tipo)
    }

    // Filtro por lida
    if (req.query.lida !== undefined) {
      const lida = req.query.lida === 'true'
      notificacoesFiltradas = notificacoesFiltradas.filter(n => n.lida === lida)
    }

    // Filtro por busca (título ou mensagem)
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase()
      notificacoesFiltradas = notificacoesFiltradas.filter(n => 
        (n.titulo && n.titulo.toLowerCase().includes(searchTerm)) ||
        (n.mensagem && n.mensagem.toLowerCase().includes(searchTerm))
      )
    }

    // Ordenar por data (mais recente primeiro)
    notificacoesFiltradas.sort((a, b) => {
      const dateA = new Date(a.data || a.created_at).getTime()
      const dateB = new Date(b.data || b.created_at).getTime()
      return dateB - dateA
    })

    // Aplicar paginação manualmente
    const totalFiltrado = notificacoesFiltradas.length
    const notificacoesPaginadas = notificacoesFiltradas.slice(offset, offset + limit)
    const totalPages = Math.ceil(totalFiltrado / limit)

    console.log(`[notificacoes] 📤 Retornando ${notificacoesPaginadas.length} notificações (total filtrado: ${totalFiltrado})`)
    if (notificacoesPaginadas.length > 0) {
      console.log(`[notificacoes] 📋 IDs das notificações retornadas:`, notificacoesPaginadas.map(n => n.id))
    }

    res.json({
      success: true,
      data: notificacoesPaginadas,
      pagination: {
        page,
        limit,
        total: totalFiltrado,
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

    // Verificar se é admin
    const userRole = req.user.role || req.user.perfil?.nome || null
    const isAdmin = userRole && (
      userRole.toLowerCase() === 'admin' || 
      userRole.toLowerCase() === 'administrador' ||
      userRole.toLowerCase() === 'adm'
    )

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

    // Se é admin, buscar todas as notificações não lidas
    if (isAdmin) {
      const { data, error } = await supabaseAdmin
        .from('notificacoes')
        .select('*')
        .eq('lida', false)
        .order('data', { ascending: false })

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar notificações não lidas',
          message: error.message
        })
      }

      return res.json({
        success: true,
        data: data || []
      })
    }

    // Buscar cliente vinculado ao usuário (se existir)
    let clienteId = null
    let clienteCnpj = null
    try {
      const { data: cliente } = await supabaseAdmin
        .from('clientes')
        .select('id, cnpj')
        .eq('contato_usuario_id', userId)
        .single()

      if (cliente) {
        clienteId = cliente.id.toString()
        clienteCnpj = cliente.cnpj ? cliente.cnpj.replace(/\D/g, '') : null
      }
    } catch (error) {
      // Não é cliente, continuar normalmente
    }

    // Buscar notificações vinculadas ao usuario_id
    const { data: dataUsuario, error: errorUsuario } = await supabaseAdmin
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', userId)
      .eq('lida', false)
      .order('data', { ascending: false })

    if (errorUsuario) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar notificações não lidas',
        message: errorUsuario.message
      })
    }

    let notificacoesPorUsuario = dataUsuario || []
    let notificacoesPorDestinatario = []

    // Se é cliente, buscar também notificações onde o cliente está nos destinatários
    if (clienteId) {
      try {
        const { data: todasNotificacoes, error: errorDestinatario } = await supabaseAdmin
          .from('notificacoes')
          .select('*')
          .eq('lida', false)
          .order('data', { ascending: false })
          .limit(1000)

        if (!errorDestinatario && todasNotificacoes) {
          notificacoesPorDestinatario = todasNotificacoes.filter(notif => {
            // Se já está vinculada ao usuario_id, não incluir aqui
            if (notif.usuario_id === userId) {
              return false
            }
            
            // Verificar se o cliente está nos destinatários
            if (notif.destinatarios && Array.isArray(notif.destinatarios)) {
              return notif.destinatarios.some(dest => {
                if (dest.tipo !== 'cliente') return false
                
                // Comparar IDs
                const destId = dest.id?.toString() || String(dest.id || '')
                const clienteIdStr = clienteId.toString()
                const matchId = (
                  destId === clienteIdStr || 
                  destId === String(parseInt(clienteIdStr)) ||
                  parseInt(destId) === parseInt(clienteIdStr) ||
                  dest.id === parseInt(clienteId) ||
                  dest.id === clienteId
                )
                
                // Comparar CNPJ (campo info) se disponível
                let matchCnpj = false
                if (clienteCnpj && dest.info) {
                  const destCnpj = dest.info.replace(/\D/g, '')
                  matchCnpj = destCnpj === clienteCnpj
                }
                
                return matchId || matchCnpj
              })
            }
            return false
          })
        }
      } catch (error) {
        console.error('Erro ao buscar notificações por destinatário:', error)
      }
    }

    // Combinar e remover duplicatas
    const todasNotificacoes = [...notificacoesPorUsuario, ...notificacoesPorDestinatario]
    const notificacoesUnicas = todasNotificacoes.filter((notif, index, self) => 
      index === self.findIndex(n => n.id === notif.id)
    )

    res.json({
      success: true,
      data: notificacoesUnicas
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

    // Verificar se é admin
    const userRole = req.user.role || req.user.perfil?.nome || null
    const isAdmin = userRole && (
      userRole.toLowerCase() === 'admin' || 
      userRole.toLowerCase() === 'administrador' ||
      userRole.toLowerCase() === 'adm'
    )

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

    // Se é admin, contar todas as notificações não lidas
    if (isAdmin) {
      const { count, error } = await supabaseAdmin
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('lida', false)

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao contar notificações não lidas',
          message: error.message
        })
      }

      return res.json({
        success: true,
        count: count || 0
      })
    }

    // Buscar cliente vinculado ao usuário (se existir)
    let clienteId = null
    let clienteCnpj = null
    try {
      const { data: cliente } = await supabaseAdmin
        .from('clientes')
        .select('id, cnpj')
        .eq('contato_usuario_id', userId)
        .single()

      if (cliente) {
        clienteId = cliente.id.toString()
        clienteCnpj = cliente.cnpj ? cliente.cnpj.replace(/\D/g, '') : null
      }
    } catch (error) {
      // Não é cliente, continuar normalmente
    }

    // Buscar notificações vinculadas ao usuario_id
    const { count: countUsuario, error: errorUsuario } = await supabaseAdmin
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .eq('lida', false)

    if (errorUsuario) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao contar notificações não lidas',
        message: errorUsuario.message
      })
    }

    let countTotal = countUsuario || 0

    // Se é cliente, buscar também notificações onde o cliente está nos destinatários
    if (clienteId) {
      try {
        const { data: todasNotificacoes, error: errorDestinatario } = await supabaseAdmin
          .from('notificacoes')
          .select('*')
          .eq('lida', false)
          .limit(1000)

        if (!errorDestinatario && todasNotificacoes) {
          const notificacoesPorDestinatario = todasNotificacoes.filter(notif => {
            // Se já está vinculada ao usuario_id, não contar aqui
            if (notif.usuario_id === userId) {
              return false
            }
            
            // Verificar se o cliente está nos destinatários
            if (notif.destinatarios && Array.isArray(notif.destinatarios)) {
              return notif.destinatarios.some(dest => {
                if (dest.tipo !== 'cliente') return false
                
                // Comparar IDs
                const destId = dest.id?.toString() || String(dest.id || '')
                const clienteIdStr = clienteId.toString()
                const matchId = (
                  destId === clienteIdStr || 
                  destId === String(parseInt(clienteIdStr)) ||
                  parseInt(destId) === parseInt(clienteIdStr) ||
                  dest.id === parseInt(clienteId) ||
                  dest.id === clienteId
                )
                
                // Comparar CNPJ (campo info) se disponível
                let matchCnpj = false
                if (clienteCnpj && dest.info) {
                  const destCnpj = dest.info.replace(/\D/g, '')
                  matchCnpj = destCnpj === clienteCnpj
                }
                
                return matchId || matchCnpj
              })
            }
            return false
          })
          
          countTotal += notificacoesPorDestinatario.length
        }
      } catch (error) {
        console.error('Erro ao contar notificações por destinatário:', error)
      }
    }

    res.json({
      success: true,
      count: countTotal
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
          // Buscar usuario_id vinculado ao funcionario_id (com fallback robusto)
          const funcionarioId = Number(dest.id)
          if (Number.isNaN(funcionarioId)) {
            console.warn(`[notificacoes] ⚠️ destinatário funcionario_id inválido: ${dest.id}`)
            continue
          }

          const { data: usuariosFuncionario } = await supabaseAdmin
            .from('usuarios')
            .select('id, status')
            .eq('funcionario_id', funcionarioId)
            .limit(10)

          if (usuariosFuncionario && usuariosFuncionario.length > 0) {
            // Preferir usuário ativo, com fallback para qualquer vínculo existente.
            const usuarioAtivo = usuariosFuncionario.find(u => String(u.status).toLowerCase() === 'ativo')
            const usuarioSelecionado = usuarioAtivo || usuariosFuncionario[0]
            destinatariosUsuarios.push(usuarioSelecionado.id)
          } else {
            // Fallback: permitir que dest.id seja o próprio usuario_id
            const { data: usuarioPorId } = await supabaseAdmin
              .from('usuarios')
              .select('id')
              .eq('id', funcionarioId)
              .single()

            if (usuarioPorId?.id) {
              destinatariosUsuarios.push(usuarioPorId.id)
            } else {
              console.warn(`[notificacoes] ⚠️ Nenhum usuário encontrado para funcionário ${funcionarioId}`)
            }
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

    // Emitir notificações via WebSocket (tempo real)
    if (data && data.length > 0) {
      try {
        data.forEach((notificacao, index) => {
          const usuarioId = usuariosUnicos[index]
          if (usuarioId && notificacao) {
            emitirNotificacaoMultiplos([usuarioId], {
              id: String(notificacao.id),
              titulo: notificacao.titulo,
              mensagem: notificacao.mensagem,
              tipo: notificacao.tipo,
              link: notificacao.link,
              lida: false,
              data: notificacao.data || notificacao.created_at,
              remetente: notificacao.remetente,
              destinatarios: notificacao.destinatarios
            })
          }
        })
        console.log(`[notificacoes] 📤 WebSocket: ${data.length} notificação(ões) emitida(s)`)
      } catch (wsError) {
        console.error(`[notificacoes] ❌ Erro ao emitir WebSocket:`, wsError.message)
        // Não falhar a criação se WebSocket falhar
      }
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

