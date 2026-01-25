import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import Joi from 'joi';

const router = express.Router();

// Schema de validação
const contaPagarSchema = Joi.object({
  fornecedor_id: Joi.number().integer().allow(null),
  descricao: Joi.string().min(3).max(500).required(),
  valor: Joi.number().min(0).required(),
  data_vencimento: Joi.date().required(),
  data_pagamento: Joi.date().allow(null),
  status: Joi.string().valid('pendente', 'pago', 'vencido', 'cancelado').default('pendente'),
  categoria: Joi.string().max(50).allow('', null),
  observacoes: Joi.string().allow('', null)
});

/**
 * @swagger
 * /api/contas-pagar:
 *   get:
 *     summary: Lista todas as contas a pagar
 *     tags: [Contas a Pagar]
 */
router.get('/', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { status, fornecedor_id, categoria, data_inicio, data_fim, limite = 100, pagina = 1 } = req.query;

    // Buscar contas a pagar
    let queryContas = supabaseAdmin
      .from('contas_pagar')
      .select(`
        *,
        fornecedor:fornecedores(id, nome, cnpj)
      `, { count: 'exact' })
      .order('data_vencimento', { ascending: true });

    // Aplicar filtros nas contas
    if (status) {
      queryContas = queryContas.eq('status', status);
    }
    if (fornecedor_id) {
      queryContas = queryContas.eq('fornecedor_id', fornecedor_id);
    }
    if (categoria) {
      queryContas = queryContas.eq('categoria', categoria);
    }
    if (data_inicio) {
      queryContas = queryContas.gte('data_vencimento', data_inicio);
    }
    if (data_fim) {
      queryContas = queryContas.lte('data_vencimento', data_fim);
    }

    // Paginação
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    queryContas = queryContas.range(offset, offset + parseInt(limite) - 1);

    const { data: contasData, error: contasError, count: contasCount } = await queryContas;

    if (contasError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar contas a pagar',
        message: contasError.message
      });
    }

    // Buscar notas fiscais de entrada
    let queryNotas = supabaseAdmin
      .from('notas_fiscais')
      .select(`
        id,
        numero_nf,
        serie,
        data_emissao,
        data_vencimento,
        valor_total,
        valor_liquido,
        status,
        fornecedor_id,
        observacoes,
        created_at,
        updated_at,
        fornecedor:fornecedores(id, nome, cnpj)
      `)
      .eq('tipo', 'entrada')
      .neq('status', 'cancelada');

    // Aplicar filtros nas notas fiscais
    if (status) {
      // Mapear status de contas para status de notas
      const statusMap = {
        'pendente': 'pendente',
        'pago': 'paga',
        'vencido': 'vencida',
        'cancelado': 'cancelada'
      };
      if (statusMap[status]) {
        queryNotas = queryNotas.eq('status', statusMap[status]);
      }
    }
    if (fornecedor_id) {
      queryNotas = queryNotas.eq('fornecedor_id', fornecedor_id);
    }

    const { data: notasData, error: notasError } = await queryNotas;

    if (notasError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar notas fiscais',
        message: notasError.message
      });
    }

    // Aplicar filtros de data manualmente nas notas fiscais
    let notasFiltradas = notasData || [];
    if (data_inicio || data_fim) {
      notasFiltradas = notasFiltradas.filter(nota => {
        const dataRef = nota.data_vencimento || nota.data_emissao;
        if (!dataRef) return false;
        if (data_inicio && dataRef < data_inicio) return false;
        if (data_fim && dataRef > data_fim) return false;
        return true;
      });
    }

    // Transformar notas fiscais em formato de contas a pagar
    const notasFormatadas = notasFiltradas.map(nota => ({
      id: `nf_${nota.id}`, // Prefixo para identificar que é nota fiscal
      tipo: 'nota_fiscal',
      descricao: `Nota Fiscal ${nota.numero_nf}${nota.serie ? ` - Série ${nota.serie}` : ''}`,
      valor: parseFloat(nota.valor_liquido || nota.valor_total || 0), // Usar valor_liquido se disponível
      data_vencimento: nota.data_vencimento || nota.data_emissao,
      data_pagamento: nota.status === 'paga' ? nota.updated_at?.split('T')[0] : null,
      status: nota.status === 'paga' ? 'pago' : nota.status === 'vencida' ? 'vencido' : 'pendente',
      fornecedor: nota.fornecedor ? {
        id: nota.fornecedor.id,
        nome: nota.fornecedor.nome,
        cnpj: nota.fornecedor.cnpj
      } : null,
      categoria: null,
      observacoes: nota.observacoes,
      created_at: nota.created_at,
      updated_at: nota.updated_at,
      // Campos específicos da nota fiscal
      numero_nf: nota.numero_nf,
      serie: nota.serie,
      data_emissao: nota.data_emissao,
      valor_total: parseFloat(nota.valor_total || 0),
      valor_liquido: parseFloat(nota.valor_liquido || nota.valor_total || 0)
    }));

    // Combinar contas e notas fiscais
    const todasContas = [
      ...(contasData || []).map(conta => ({ ...conta, tipo: 'conta_pagar' })),
      ...notasFormatadas
    ];

    // Ordenar por data de vencimento
    todasContas.sort((a, b) => {
      const dataA = new Date(a.data_vencimento || a.created_at).getTime();
      const dataB = new Date(b.data_vencimento || b.created_at).getTime();
      return dataA - dataB;
    });

    res.json({
      success: true,
      data: todasContas,
      total: (contasCount || 0) + notasFormatadas.length,
      pagina: parseInt(pagina),
      total_paginas: Math.ceil(((contasCount || 0) + notasFormatadas.length) / parseInt(limite))
    });
  } catch (error) {
    console.error('Erro ao listar contas a pagar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-pagar/vencendo:
 *   get:
 *     summary: Lista contas vencendo nos próximos 7 dias
 */
router.get('/vencendo', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 7);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('contas_pagar')
      .select(`
        *,
        fornecedor:fornecedores(id, nome, cnpj)
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
 * /api/contas-pagar/vencidas:
 *   get:
 *     summary: Lista contas já vencidas
 */
router.get('/vencidas', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('contas_pagar')
      .select(`
        *,
        fornecedor:fornecedores(id, nome, cnpj)
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
        .from('contas_pagar')
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
 * /api/contas-pagar/alertas:
 *   get:
 *     summary: Sistema de alertas para contas a pagar
 */
router.get('/alertas', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 7);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];

    // Contas vencidas
    const { data: vencidas, error: erroVencidas } = await supabaseAdmin
      .from('contas_pagar')
      .select('id, descricao, valor, data_vencimento, categoria')
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje);

    // Contas vencendo
    const { data: vencendo, error: erroVencendo } = await supabaseAdmin
      .from('contas_pagar')
      .select('id, descricao, valor, data_vencimento, categoria')
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
 * /api/contas-pagar/{id}:
 *   get:
 *     summary: Busca uma conta a pagar por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('contas_pagar')
      .select(`
        *,
        fornecedor:fornecedores(id, nome, cnpj, email, telefone)
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
    console.error('Erro ao buscar conta a pagar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-pagar:
 *   post:
 *     summary: Cria uma nova conta a pagar
 */
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error: validationError, value } = contaPagarSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationError.details[0].message
      });
    }

    const { data, error } = await supabaseAdmin
      .from('contas_pagar')
      .insert([value])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar conta a pagar',
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Conta a pagar criada com sucesso',
      data
    });
  } catch (error) {
    console.error('Erro ao criar conta a pagar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-pagar/{id}:
 *   put:
 *     summary: Atualiza uma conta a pagar
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar dados
    const { error: validationError, value } = contaPagarSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationError.details[0].message
      });
    }

    const { data, error } = await supabaseAdmin
      .from('contas_pagar')
      .update({ ...value, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar conta a pagar',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Conta a pagar atualizada com sucesso',
      data
    });
  } catch (error) {
    console.error('Erro ao atualizar conta a pagar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-pagar/{id}/pagar:
 *   post:
 *     summary: Marca uma conta como paga
 */
router.post('/:id/pagar', async (req, res) => {
  try {
    const { id } = req.params;
    const { data_pagamento = new Date().toISOString().split('T')[0] } = req.body;

    const { data, error } = await supabaseAdmin
      .from('contas_pagar')
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
 * /api/contas-pagar/{id}:
 *   delete:
 *     summary: Exclui uma conta a pagar
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('contas_pagar')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir conta a pagar',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Conta a pagar excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir conta a pagar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;

