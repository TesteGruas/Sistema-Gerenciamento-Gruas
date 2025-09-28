import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

/**
 * @swagger
 * /api/notas-fiscais-locacao:
 *   get:
 *     summary: Lista notas fiscais de locação com filtros opcionais
 *     tags: [Notas Fiscais Locação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por número ou série
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, emitida, cancelada]
 *         description: Status da nota fiscal
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Tipo da nota fiscal
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *       - in: query
 *         name: locacao_id
 *         schema:
 *           type: integer
 *         description: ID da locação
 *     responses:
 *       200:
 *         description: Lista de notas fiscais de locação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID da nota fiscal
 *                       numero:
 *                         type: string
 *                         description: Número da nota fiscal
 *                       serie:
 *                         type: string
 *                         description: Série da nota fiscal
 *                       cliente_id:
 *                         type: integer
 *                         description: ID do cliente
 *                       locacao_id:
 *                         type: integer
 *                         description: ID da locação
 *                       data_emissao:
 *                         type: string
 *                         format: date
 *                         description: Data de emissão
 *                       valor_total:
 *                         type: number
 *                         description: Valor total da nota fiscal
 *                       status:
 *                         type: string
 *                         description: Status da nota fiscal
 *                       tipo:
 *                         type: string
 *                         description: Tipo da nota fiscal
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *                       clientes:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                       locacoes:
 *                         type: object
 *                         properties:
 *                           numero:
 *                             type: string
 *                           equipamento_id:
 *                             type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, tipo, cliente_id, locacao_id } = req.query
    
    let query = supabase
      .from('notas_fiscais')
      .select(`
        *,
        clientes:cliente_id(nome),
        locacoes:locacao_id(numero, equipamento_id)
      `)
      .not('locacao_id', 'is', null) // Apenas notas fiscais de locação
      .order('created_at', { ascending: false })

    // Filtros
    if (search) {
      query = query.or(`numero.ilike.%${search}%,serie.ilike.%${search}%`)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }
    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id)
    }
    if (locacao_id) {
      query = query.eq('locacao_id', locacao_id)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar notas fiscais de locação:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }

    res.json({
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar notas fiscais de locação:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

/**
 * @swagger
 * /api/notas-fiscais-locacao/{id}:
 *   get:
 *     summary: Obtém uma nota fiscal de locação específica por ID
 *     tags: [Notas Fiscais Locação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     responses:
 *       200:
 *         description: Dados da nota fiscal de locação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID da nota fiscal
 *                     numero:
 *                       type: string
 *                       description: Número da nota fiscal
 *                     serie:
 *                       type: string
 *                       description: Série da nota fiscal
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     locacao_id:
 *                       type: integer
 *                       description: ID da locação
 *                     data_emissao:
 *                       type: string
 *                       format: date
 *                       description: Data de emissão
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da nota fiscal
 *                     status:
 *                       type: string
 *                       description: Status da nota fiscal
 *                     tipo:
 *                       type: string
 *                       description: Tipo da nota fiscal
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     clientes:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                     locacoes:
 *                       type: object
 *                       properties:
 *                         numero:
 *                           type: string
 *                         equipamento_id:
 *                           type: integer
 *       404:
 *         description: Nota fiscal não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('notas_fiscais')
      .select(`
        *,
        clientes:cliente_id(nome),
        locacoes:locacao_id(numero, equipamento_id)
      `)
      .eq('id', id)
      .not('locacao_id', 'is', null)
      .single()

    if (error) {
      console.error('Erro ao buscar nota fiscal:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }

    if (!data) {
      return res.status(404).json({ error: 'Nota fiscal não encontrada' })
    }

    res.json({ data })
  } catch (error) {
    console.error('Erro ao buscar nota fiscal:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

/**
 * @swagger
 * /api/notas-fiscais-locacao:
 *   post:
 *     summary: Cria uma nova nota fiscal de locação
 *     tags: [Notas Fiscais Locação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *               - cliente_id
 *               - locacao_id
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número da nota fiscal
 *               serie:
 *                 type: string
 *                 description: Série da nota fiscal
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               locacao_id:
 *                 type: integer
 *                 description: ID da locação
 *               data_emissao:
 *                 type: string
 *                 format: date
 *                 description: Data de emissão (YYYY-MM-DD)
 *               valor_total:
 *                 type: number
 *                 description: Valor total da nota fiscal
 *               status:
 *                 type: string
 *                 enum: [pendente, emitida, cancelada]
 *                 default: pendente
 *                 description: Status da nota fiscal
 *               tipo:
 *                 type: string
 *                 description: Tipo da nota fiscal
 *               observacoes:
 *                 type: string
 *                 description: Observações da nota fiscal
 *     responses:
 *       201:
 *         description: Nota fiscal criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   description: Dados da nota fiscal criada
 *       400:
 *         description: Dados inválidos ou campos obrigatórios
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const notaData = req.body

    // Validações básicas
    if (!notaData.numero || !notaData.cliente_id || !notaData.locacao_id) {
      return res.status(400).json({ error: 'Campos obrigatórios: numero, cliente_id, locacao_id' })
    }

    const { data, error } = await supabase
      .from('notas_fiscais')
      .insert([notaData])
      .select(`
        *,
        clientes:cliente_id(nome),
        locacoes:locacao_id(numero, equipamento_id)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar nota fiscal:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }

    res.status(201).json({ data })
  } catch (error) {
    console.error('Erro ao criar nota fiscal:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

/**
 * @swagger
 * /api/notas-fiscais-locacao/{id}:
 *   put:
 *     summary: Atualiza uma nota fiscal de locação existente
 *     tags: [Notas Fiscais Locação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número da nota fiscal
 *               serie:
 *                 type: string
 *                 description: Série da nota fiscal
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               locacao_id:
 *                 type: integer
 *                 description: ID da locação
 *               data_emissao:
 *                 type: string
 *                 format: date
 *                 description: Data de emissão (YYYY-MM-DD)
 *               valor_total:
 *                 type: number
 *                 description: Valor total da nota fiscal
 *               status:
 *                 type: string
 *                 enum: [pendente, emitida, cancelada]
 *                 description: Status da nota fiscal
 *               tipo:
 *                 type: string
 *                 description: Tipo da nota fiscal
 *               observacoes:
 *                 type: string
 *                 description: Observações da nota fiscal
 *     responses:
 *       200:
 *         description: Nota fiscal atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   description: Dados atualizados da nota fiscal
 *       404:
 *         description: Nota fiscal não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabase
      .from('notas_fiscais')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        clientes:cliente_id(nome),
        locacoes:locacao_id(numero, equipamento_id)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar nota fiscal:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }

    if (!data) {
      return res.status(404).json({ error: 'Nota fiscal não encontrada' })
    }

    res.json({ data })
  } catch (error) {
    console.error('Erro ao atualizar nota fiscal:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

/**
 * @swagger
 * /api/notas-fiscais-locacao/{id}:
 *   delete:
 *     summary: Exclui uma nota fiscal de locação
 *     tags: [Notas Fiscais Locação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     responses:
 *       200:
 *         description: Nota fiscal excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('notas_fiscais')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir nota fiscal:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }

    res.json({ message: 'Nota fiscal excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir nota fiscal:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

/**
 * @swagger
 * /api/notas-fiscais-locacao/stats:
 *   get:
 *     summary: Obtém estatísticas das notas fiscais de locação
 *     tags: [Notas Fiscais Locação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas das notas fiscais de locação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_notas:
 *                       type: integer
 *                       description: Total de notas fiscais
 *                     valor_total:
 *                       type: number
 *                       description: Valor total das notas fiscais
 *                     notas_pendentes:
 *                       type: integer
 *                       description: Número de notas pendentes
 *                     notas_emitidas:
 *                       type: integer
 *                       description: Número de notas emitidas
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .from('notas_fiscais')
      .select('status, valor_total')
      .not('locacao_id', 'is', null)

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return res.status(500).json({ error: 'Erro interno do servidor' })
    }

    const totalNotas = stats.length
    const valorTotal = stats.reduce((sum, item) => sum + (item.valor_total || 0), 0)
    const notasPendentes = stats.filter(item => item.status === 'pendente').length
    const notasEmitidas = stats.filter(item => item.status === 'emitida').length

    res.json({
      data: {
        total_notas: totalNotas,
        valor_total: valorTotal,
        notas_pendentes: notasPendentes,
        notas_emitidas: notasEmitidas
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

/**
 * @swagger
 * /api/notas-fiscais-locacao/{id}/upload:
 *   post:
 *     summary: Upload de arquivo para uma nota fiscal de locação
 *     tags: [Notas Fiscais Locação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     responses:
 *       200:
 *         description: Upload de arquivo processado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 file_url:
 *                   type: string
 *                   description: URL do arquivo enviado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/upload', async (req, res) => {
  try {
    const { id } = req.params
    
    // Aqui você implementaria a lógica de upload de arquivo
    // Por enquanto, retornamos um placeholder
    res.json({ 
      message: 'Upload de arquivo implementado',
      file_url: `/uploads/notas-fiscais/${id}/arquivo.pdf`
    })
  } catch (error) {
    console.error('Erro no upload:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router
