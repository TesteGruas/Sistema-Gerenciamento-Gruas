import express from 'express';
import Joi from 'joi';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Schema de validação
const complementoSchema = Joi.object({
  nome: Joi.string().min(1).max(255).required(),
  sku: Joi.string().min(1).max(50).required(),
  tipo: Joi.string().valid('acessorio', 'servico').required(),
  tipo_precificacao: Joi.string().valid('mensal', 'unico', 'por_metro', 'por_hora', 'por_dia').required(),
  unidade: Joi.string().valid('m', 'h', 'unidade', 'dia', 'mes').required(),
  preco_unitario_centavos: Joi.number().integer().min(0).required(),
  fator: Joi.number().min(0).optional(),
  descricao: Joi.string().max(1000).allow('').optional(),
  rule_key: Joi.string().max(100).allow('').optional(),
  ativo: Joi.boolean().default(true)
});

const complementoUpdateSchema = complementoSchema.fork(
  ['nome', 'sku', 'tipo', 'tipo_precificacao', 'unidade', 'preco_unitario_centavos'],
  (schema) => schema.optional()
);

/**
 * @swagger
 * /api/complementos:
 *   get:
 *     summary: Listar complementos do catálogo
 *     tags: [Complementos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [acessorio, servico]
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de complementos
 */
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { 
      tipo, 
      ativo, 
      search, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    // Validar e converter parâmetros de paginação
    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit)) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('complementos_catalogo')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (tipo && (tipo === 'acessorio' || tipo === 'servico')) {
      query = query.eq('tipo', tipo);
    }
    
    if (ativo !== undefined && ativo !== '') {
      const ativoBool = ativo === 'true' || ativo === true || ativo === '1';
      query = query.eq('ativo', ativoBool);
    }
    
    // Aplicar pesquisa (busca em nome, sku e descricao)
    if (search && String(search).trim() !== '') {
      const searchTerm = String(search).trim();
      query = query.or(`nome.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);
    }

    // Aplicar paginação e ordenação
    query = query
      .range(offset, offset + limitNum - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar complementos:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar complementos',
        message: error.message
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Erro na rota de complementos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/complementos/{id}:
 *   get:
 *     summary: Buscar complemento por ID
 *     tags: [Complementos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('complementos_catalogo')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Complemento não encontrado'
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar complemento',
        message: error.message
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao buscar complemento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/complementos:
 *   post:
 *     summary: Criar novo complemento
 *     tags: [Complementos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, requirePermission('obras:criar'), async (req, res) => {
  try {
    const { error: validationError, value } = complementoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationError.details.map(d => d.message)
      });
    }

    // Verificar se SKU já existe
    const { data: existing } = await supabaseAdmin
      .from('complementos_catalogo')
      .select('id')
      .eq('sku', value.sku)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'SKU já existe',
        message: 'Já existe um complemento com este SKU'
      });
    }

    const userId = req.user?.id;

    const { data, error } = await supabaseAdmin
      .from('complementos_catalogo')
      .insert({
        ...value,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar complemento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar complemento',
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro na rota de criar complemento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/complementos/{id}:
 *   put:
 *     summary: Atualizar complemento
 *     tags: [Complementos]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = complementoUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationError.details.map(d => d.message)
      });
    }

    // Se estiver atualizando o SKU, verificar se não existe outro com o mesmo SKU
    if (value.sku) {
      const { data: existing } = await supabaseAdmin
        .from('complementos_catalogo')
        .select('id')
        .eq('sku', value.sku)
        .neq('id', id)
        .single();

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'SKU já existe',
          message: 'Já existe outro complemento com este SKU'
        });
      }
    }

    const userId = req.user?.id;

    const { data, error } = await supabaseAdmin
      .from('complementos_catalogo')
      .update({
        ...value,
        updated_by: userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Complemento não encontrado'
        });
      }
      console.error('Erro ao atualizar complemento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar complemento',
        message: error.message
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro na rota de atualizar complemento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/complementos/{id}:
 *   delete:
 *     summary: Excluir complemento
 *     tags: [Complementos]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, requirePermission('obras:excluir'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('complementos_catalogo')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir complemento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir complemento',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Complemento excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro na rota de excluir complemento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/complementos/{id}/toggle-ativo:
 *   patch:
 *     summary: Alternar status ativo/inativo do complemento
 *     tags: [Complementos]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/toggle-ativo', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar o complemento atual
    const { data: complemento, error: fetchError } = await supabaseAdmin
      .from('complementos_catalogo')
      .select('ativo')
      .eq('id', id)
      .single();

    if (fetchError || !complemento) {
      return res.status(404).json({
        success: false,
        error: 'Complemento não encontrado'
      });
    }

    const userId = req.user?.id;

    const { data, error } = await supabaseAdmin
      .from('complementos_catalogo')
      .update({
        ativo: !complemento.ativo,
        updated_by: userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao alternar status do complemento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar status',
        message: error.message
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro na rota de alternar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;

