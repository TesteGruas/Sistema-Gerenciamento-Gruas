import express from 'express';
import Joi from 'joi';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Schema de validação
const produtoSchema = Joi.object({
  nome: Joi.string().min(1).max(255).required(),
  descricao: Joi.string().max(1000).optional(),
  categoria: Joi.string().max(100).required(),
  tipo: Joi.string().valid('venda', 'locacao', 'servico').required(),
  preco: Joi.number().min(0).precision(2).required(),
  preco_custo: Joi.number().min(0).precision(2).optional(),
  unidade: Joi.string().max(50).required(),
  estoque: Joi.number().integer().min(0).optional(),
  estoque_minimo: Joi.number().integer().min(0).optional(),
  fornecedor_id: Joi.string().uuid().optional(),
  status: Joi.string().valid('ativo', 'inativo').default('ativo'),
  observacoes: Joi.string().max(1000).optional()
});

const produtoUpdateSchema = produtoSchema.fork(
  ['nome', 'categoria', 'tipo', 'preco', 'unidade'],
  (schema) => schema.optional()
);

/**
 * @swagger
 * /api/produtos:
 *   get:
 *     summary: Listar produtos
 *     tags: [Produtos]
 */
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { categoria, tipo, status, fornecedor_id, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('produtos')
      .select(`
        *,
        fornecedores (
          id,
          nome
        )
      `, { count: 'exact' });

    if (categoria) query = query.eq('categoria', categoria);
    if (tipo) query = query.eq('tipo', tipo);
    if (status) query = query.eq('status', status);
    if (fornecedor_id) query = query.eq('fornecedor_id', fornecedor_id);
    if (search) {
      query = query.or(`nome.ilike.%${search}%,descricao.ilike.%${search}%,categoria.ilike.%${search}%`);
    }

    query = query
      .range(offset, offset + limit - 1)
      .order('nome', { ascending: true });

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/produtos/{id}:
 *   get:
 *     summary: Buscar produto por ID
 *     tags: [Produtos]
 */
router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select(`
        *,
        fornecedores (
          id,
          nome
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Produto não encontrado'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/produtos:
 *   post:
 *     summary: Criar produto
 *     tags: [Produtos]
 */
router.post('/', authenticateToken, requirePermission('obras:criar'), async (req, res) => {
  try {
    const { error: validationError, value } = produtoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    // Verificar se fornecedor existe (se fornecido)
    if (value.fornecedor_id) {
      const { data: fornecedor } = await supabaseAdmin
        .from('fornecedores')
        .select('id')
        .eq('id', value.fornecedor_id)
        .single();

      if (!fornecedor) {
        return res.status(404).json({
          error: 'Fornecedor não encontrado'
        });
      }
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('produtos')
      .insert(value)
      .select(`
        *,
        fornecedores (
          id,
          nome
        )
      `)
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      data,
      message: 'Produto criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/produtos/{id}:
 *   put:
 *     summary: Atualizar produto
 *     tags: [Produtos]
 */
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = produtoUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    // Verificar se fornecedor existe (se fornecido)
    if (value.fornecedor_id) {
      const { data: fornecedor } = await supabaseAdmin
        .from('fornecedores')
        .select('id')
        .eq('id', value.fornecedor_id)
        .single();

      if (!fornecedor) {
        return res.status(404).json({
          error: 'Fornecedor não encontrado'
        });
      }
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('produtos')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        fornecedores (
          id,
          nome
        )
      `)
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Produto não encontrado'
        });
      }
      throw updateError;
    }

    res.json({
      success: true,
      data,
      message: 'Produto atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/produtos/{id}:
 *   delete:
 *     summary: Excluir produto
 *     tags: [Produtos]
 */
router.delete('/:id', authenticateToken, requirePermission('obras:excluir'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error: deleteError } = await supabaseAdmin
      .from('produtos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Produto não encontrado'
        });
      }
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'Produto excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/produtos/stats:
 *   get:
 *     summary: Estatísticas de produtos
 *     tags: [Produtos]
 */
router.get('/stats', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select('tipo, categoria, status, estoque, preco');

    if (error) throw error;

    const stats = {
      total: data.length,
      ativos: data.filter(p => p.status === 'ativo').length,
      inativos: data.filter(p => p.status === 'inativo').length,
      porTipo: data.reduce((acc, p) => {
        acc[p.tipo] = (acc[p.tipo] || 0) + 1;
        return acc;
      }, {}),
      porCategoria: data.reduce((acc, p) => {
        acc[p.categoria] = (acc[p.categoria] || 0) + 1;
        return acc;
      }, {}),
      valorTotal: data.reduce((sum, p) => sum + (parseFloat(p.preco) * (p.estoque || 0)), 0),
      estoqueTotal: data.reduce((sum, p) => sum + (p.estoque || 0), 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/produtos/baixo-estoque:
 *   get:
 *     summary: Produtos com estoque baixo
 *     tags: [Produtos]
 */
router.get('/baixo-estoque', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select(`
        *,
        fornecedores (
          id,
          nome
        )
      `)
      .lte('estoque', supabaseAdmin.raw('estoque_minimo'))
      .eq('status', 'ativo')
      .order('estoque', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao buscar produtos com baixo estoque:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;

