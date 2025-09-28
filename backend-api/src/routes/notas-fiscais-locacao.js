import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Listar notas fiscais de locação
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

// Buscar nota fiscal por ID
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

// Criar nova nota fiscal
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

// Atualizar nota fiscal
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

// Excluir nota fiscal
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

// Estatísticas de notas fiscais
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

// Upload de arquivo
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
