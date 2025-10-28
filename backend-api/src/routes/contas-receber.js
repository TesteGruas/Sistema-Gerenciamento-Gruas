import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import Joi from 'joi';

const router = express.Router();

// Schema de validação
const contaReceberSchema = Joi.object({
  cliente_id: Joi.number().integer().allow(null),
  obra_id: Joi.number().integer().allow(null),
  descricao: Joi.string().min(3).max(500).required(),
  valor: Joi.number().min(0).required(),
  data_vencimento: Joi.date().required(),
  data_pagamento: Joi.date().allow(null),
  status: Joi.string().valid('pendente', 'pago', 'vencido', 'cancelado').default('pendente'),
  observacoes: Joi.string().allow('', null)
});

/**
 * @swagger
 * /api/contas-receber:
 *   get:
 *     summary: Lista todas as contas a receber
 *     tags: [Contas a Receber]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, pago, vencido, cancelado]
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 */
router.get('/', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { status, cliente_id, data_inicio, data_fim, limite = 100, pagina = 1 } = req.query;

    let query = supabaseAdmin
      .from('contas_receber')
      .select(`
        *,
        cliente:clientes(id, nome, cnpj),
        obra:obras(id, nome)
      `, { count: 'exact' })
      .order('data_vencimento', { ascending: true });

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }
    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }
    if (data_inicio) {
      query = query.gte('data_vencimento', data_inicio);
    }
    if (data_fim) {
      query = query.lte('data_vencimento', data_fim);
    }

    // Paginação
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    query = query.range(offset, offset + parseInt(limite) - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar contas a receber',
        message: error.message
      });
    }

    res.json({
      success: true,
      data,
      total: count,
      pagina: parseInt(pagina),
      total_paginas: Math.ceil(count / parseInt(limite))
    });
  } catch (error) {
    console.error('Erro ao listar contas a receber:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-receber/vencendo:
 *   get:
 *     summary: Lista contas vencendo nos próximos 7 dias
 */
router.get('/vencendo', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 7);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('contas_receber')
      .select(`
        *,
        cliente:clientes(id, nome, cnpj),
        obra:obras(id, nome)
      `)
      .eq('status', 'pendente')
      .gte('data_vencimento', hoje)
      .lte('data_vencimento', dataLimiteStr)
      .order('data_vencimento', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar contas vencendo',
        message: error.message
      });
    }

    res.json({
      success: true,
      data,
      total: data.length
    });
  } catch (error) {
    console.error('Erro ao listar contas vencendo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-receber/vencidas:
 *   get:
 *     summary: Lista contas já vencidas
 */
router.get('/vencidas', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('contas_receber')
      .select(`
        *,
        cliente:clientes(id, nome, cnpj),
        obra:obras(id, nome)
      `)
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)
      .order('data_vencimento', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar contas vencidas',
        message: error.message
      });
    }

    // Atualizar status para 'vencido' automaticamente
    if (data.length > 0) {
      const ids = data.map(c => c.id);
      await supabaseAdmin
        .from('contas_receber')
        .update({ status: 'vencido' })
        .in('id', ids);
    }

    res.json({
      success: true,
      data,
      total: data.length
    });
  } catch (error) {
    console.error('Erro ao listar contas vencidas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-receber/alertas:
 *   get:
 *     summary: Sistema de alertas para contas a receber
 */
router.get('/alertas', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 7);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];

    // Contas vencidas
    const { data: vencidas, error: erroVencidas } = await supabaseAdmin
      .from('contas_receber')
      .select('id, descricao, valor, data_vencimento')
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje);

    // Contas vencendo
    const { data: vencendo, error: erroVencendo } = await supabaseAdmin
      .from('contas_receber')
      .select('id, descricao, valor, data_vencimento')
      .eq('status', 'pendente')
      .gte('data_vencimento', hoje)
      .lte('data_vencimento', dataLimiteStr);

    const totalVencidas = vencidas?.reduce((sum, c) => sum + parseFloat(c.valor), 0) || 0;
    const totalVencendo = vencendo?.reduce((sum, c) => sum + parseFloat(c.valor), 0) || 0;

    res.json({
      success: true,
      alertas: {
        vencidas: {
          quantidade: vencidas?.length || 0,
          valor_total: totalVencidas,
          contas: vencidas || []
        },
        vencendo: {
          quantidade: vencendo?.length || 0,
          valor_total: totalVencendo,
          contas: vencendo || []
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-receber/{id}:
 *   get:
 *     summary: Busca uma conta a receber por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('contas_receber')
      .select(`
        *,
        cliente:clientes(id, nome, cnpj, email, telefone),
        obra:obras(id, nome, endereco, cidade)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada',
        message: error.message
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao buscar conta a receber:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-receber:
 *   post:
 *     summary: Cria uma nova conta a receber
 */
router.post('/', authenticateToken, requirePermission('financeiro:criar'), async (req, res) => {
  try {
    // Validar dados
    const { error: validationError, value } = contaReceberSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationError.details[0].message
      });
    }

    const { data, error } = await supabaseAdmin
      .from('contas_receber')
      .insert([value])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar conta a receber',
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Conta a receber criada com sucesso',
      data
    });
  } catch (error) {
    console.error('Erro ao criar conta a receber:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-receber/{id}:
 *   put:
 *     summary: Atualiza uma conta a receber
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar dados
    const { error: validationError, value } = contaReceberSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationError.details[0].message
      });
    }

    const { data, error } = await supabaseAdmin
      .from('contas_receber')
      .update({ ...value, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar conta a receber',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Conta a receber atualizada com sucesso',
      data
    });
  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-receber/{id}/pagar:
 *   post:
 *     summary: Marca uma conta como paga
 */
router.post('/:id/pagar', authenticateToken, requirePermission('financeiro:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { data_pagamento = new Date().toISOString().split('T')[0] } = req.body;

    const { data, error } = await supabaseAdmin
      .from('contas_receber')
      .update({ 
        status: 'pago',
        data_pagamento,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao marcar conta como paga',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Conta marcada como paga com sucesso',
      data
    });
  } catch (error) {
    console.error('Erro ao marcar conta como paga:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-receber/{id}:
 *   delete:
 *     summary: Exclui uma conta a receber
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('contas_receber')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir conta a receber',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Conta a receber excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir conta a receber:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;

