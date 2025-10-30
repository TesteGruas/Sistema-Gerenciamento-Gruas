import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * @swagger
 * /api/busca-global:
 *   get:
 *     summary: Busca unificada em múltiplos módulos do sistema
 *     tags: [Busca]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca
 *       - in: query
 *         name: tipos
 *         schema:
 *           type: string
 *         description: Tipos de entidades para buscar (separados por vírgula). Opções - cliente,obra,funcionario,grua,produto,fornecedor
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Limite de resultados por tipo
 *     responses:
 *       200:
 *         description: Resultados da busca agregados por tipo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 query:
 *                   type: string
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientes:
 *                       type: array
 *                     obras:
 *                       type: array
 *                     funcionarios:
 *                       type: array
 *                     gruas:
 *                       type: array
 *                     produtos:
 *                       type: array
 *                     fornecedores:
 *                       type: array
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q, tipos, limit = 5 } = req.query
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'O termo de busca deve ter no mínimo 2 caracteres'
      })
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`
    const resultLimit = parseInt(limit) || 5
    
    // Determinar quais tipos buscar
    const tiposArray = tipos ? tipos.split(',').map(t => t.trim()) : ['cliente', 'obra', 'funcionario', 'grua', 'produto', 'fornecedor']
    
    const resultados = {
      clientes: [],
      obras: [],
      funcionarios: [],
      gruas: [],
      produtos: [],
      fornecedores: []
    }

    // Buscar clientes
    if (tiposArray.includes('cliente')) {
      const { data: clientes } = await supabaseAdmin
        .from('clientes')
        .select('id, nome, cnpj, email, telefone, status')
        .or(`nome.ilike.${searchTerm},cnpj.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .eq('status', 'ativo')
        .limit(resultLimit)
      
      resultados.clientes = (clientes || []).map(c => ({
        ...c,
        type: 'cliente',
        href: `/dashboard/clientes/${c.id}`,
        category: 'Clientes',
        description: c.cnpj ? `CNPJ: ${c.cnpj}` : c.email || ''
      }))
    }

    // Buscar obras
    if (tiposArray.includes('obra')) {
      const { data: obras } = await supabaseAdmin
        .from('obras')
        .select(`
          id, 
          nome, 
          endereco, 
          cidade, 
          estado, 
          status, 
          data_inicio,
          clientes (nome)
        `)
        .or(`nome.ilike.${searchTerm},endereco.ilike.${searchTerm},cidade.ilike.${searchTerm}`)
        .limit(resultLimit)
      
      resultados.obras = (obras || []).map(o => ({
        ...o,
        type: 'obra',
        href: `/dashboard/obras/${o.id}`,
        category: 'Obras',
        description: `${o.cidade || ''} ${o.estado || ''}`.trim(),
        metadata: {
          status: o.status,
          date: o.data_inicio,
          cliente: o.clientes?.nome
        }
      }))
    }

    // Buscar funcionários
    if (tiposArray.includes('funcionario')) {
      const { data: funcionarios } = await supabaseAdmin
        .from('funcionarios')
        .select('id, nome, cargo, email, telefone, status')
        .or(`nome.ilike.${searchTerm},email.ilike.${searchTerm},cpf.ilike.${searchTerm}`)
        .eq('status', 'Ativo')
        .limit(resultLimit)
      
      resultados.funcionarios = (funcionarios || []).map(f => ({
        ...f,
        type: 'funcionario',
        href: `/dashboard/rh/${f.id}`,
        category: 'RH',
        description: `${f.cargo}${f.email ? ` - ${f.email}` : ''}`,
        metadata: {
          status: f.status
        }
      }))
    }

    // Buscar gruas
    if (tiposArray.includes('grua')) {
      const { data: gruas } = await supabaseAdmin
        .from('gruas')
        .select('id, name, modelo, fabricante, tipo, status, localizacao')
        .or(`name.ilike.${searchTerm},modelo.ilike.${searchTerm},fabricante.ilike.${searchTerm}`)
        .limit(resultLimit)
      
      resultados.gruas = (gruas || []).map(g => ({
        ...g,
        type: 'grua',
        href: `/dashboard/gruas/${g.id}`,
        category: 'Equipamentos',
        description: `${g.modelo || ''}${g.fabricante ? ` - ${g.fabricante}` : ''}`.trim(),
        metadata: {
          status: g.status,
          localizacao: g.localizacao
        }
      }))
    }

    // Buscar produtos
    if (tiposArray.includes('produto')) {
      const { data: produtos } = await supabaseAdmin
        .from('produtos')
        .select(`
          id, 
          nome, 
          descricao, 
          codigo_barras, 
          valor_unitario, 
          status,
          categorias (nome)
        `)
        .or(`nome.ilike.${searchTerm},descricao.ilike.${searchTerm},codigo_barras.ilike.${searchTerm}`)
        .eq('status', 'Ativo')
        .limit(resultLimit)
      
      resultados.produtos = (produtos || []).map(p => ({
        ...p,
        type: 'produto',
        href: `/dashboard/estoque/produtos/${p.id}`,
        category: 'Estoque',
        description: p.descricao || '',
        metadata: {
          status: p.status,
          valor: p.valor_unitario,
          categoria: p.categorias?.nome
        }
      }))
    }

    // Buscar fornecedores
    if (tiposArray.includes('fornecedor')) {
      const { data: fornecedores } = await supabaseAdmin
        .from('fornecedores')
        .select('id, nome, cnpj, email, telefone, status')
        .or(`nome.ilike.${searchTerm},cnpj.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .eq('status', 'Ativo')
        .limit(resultLimit)
      
      resultados.fornecedores = (fornecedores || []).map(f => ({
        ...f,
        type: 'fornecedor',
        href: `/dashboard/fornecedores/${f.id}`,
        category: 'Fornecedores',
        description: f.cnpj ? `CNPJ: ${f.cnpj}` : f.email || '',
        metadata: {
          status: f.status
        }
      }))
    }

    // Calcular total de resultados
    const total = Object.values(resultados).reduce((sum, arr) => sum + arr.length, 0)

    res.json({
      success: true,
      query: q,
      total,
      data: resultados
    })

  } catch (error) {
    console.error('❌ Erro na busca global:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao realizar busca',
      message: error.message
    })
  }
})

export default router

