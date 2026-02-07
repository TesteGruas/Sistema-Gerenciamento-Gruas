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

    // Buscar contas a receber
    let queryContas = supabaseAdmin
      .from('contas_receber')
      .select(`
        *,
        cliente:clientes(id, nome, cnpj),
        obra:obras(id, nome)
      `);

    // Aplicar filtros nas contas
    if (status) {
      queryContas = queryContas.eq('status', status);
    }
    if (cliente_id) {
      queryContas = queryContas.eq('cliente_id', cliente_id);
    }
    if (data_inicio) {
      queryContas = queryContas.gte('data_vencimento', data_inicio);
    }
    if (data_fim) {
      queryContas = queryContas.lte('data_vencimento', data_fim);
    }

    const { data: contasData, error: contasError } = await queryContas;

    if (contasError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar contas a receber',
        message: contasError.message
      });
    }

    // Buscar notas fiscais de saída
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
        cliente_id,
        observacoes,
        tipo,
        tipo_nota,
        created_at,
        updated_at,
        cliente:clientes(id, nome, cnpj),
        // Campos de impostos estaduais
        base_calculo_icms,
        valor_icms,
        base_calculo_icms_st,
        valor_icms_st,
        valor_fcp_st,
        // Campos de impostos federais
        valor_ipi,
        valor_pis,
        valor_cofins,
        valor_inss,
        valor_ir,
        valor_csll,
        // Campos de impostos municipais
        base_calculo_issqn,
        valor_issqn,
        aliquota_issqn,
        // Retenções
        retencoes_federais,
        outras_retencoes,
        // Outros valores
        valor_frete,
        valor_seguro,
        valor_desconto,
        outras_despesas_acessorias
      `)
      .eq('tipo', 'saida')
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
    if (cliente_id) {
      queryNotas = queryNotas.eq('cliente_id', cliente_id);
    }

    const { data: notasData, error: notasError } = await queryNotas;

    if (notasError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar notas fiscais',
        message: notasError.message
      });
    }

    // Aplicar filtros de data manualmente (usando data_vencimento ou data_emissao como fallback)
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

    // Buscar boletos vinculados às notas fiscais de saída
    const notasIds = notasFiltradas.map(n => n.id);
    let boletosVinculados = [];
    if (notasIds.length > 0) {
      const { data: boletosData, error: boletosError } = await supabaseAdmin
        .from('boletos')
        .select('*')
        .in('nota_fiscal_id', notasIds)
        .eq('tipo', 'receber');
      
      if (!boletosError && boletosData) {
        boletosVinculados = boletosData;
      }
    }

    // Transformar notas fiscais em formato de contas a receber
    const notasFormatadas = notasFiltradas.map(nota => {
      // Buscar boleto vinculado a esta nota fiscal
      const boletoVinculado = boletosVinculados.find(b => b.nota_fiscal_id === nota.id);
      
      return {
        id: boletoVinculado ? `boleto_${boletoVinculado.id}` : `nf_${nota.id}`, // Priorizar boleto se existir
        tipo: boletoVinculado ? 'boleto' : 'nota_fiscal',
        descricao: boletoVinculado 
          ? `Boleto ${boletoVinculado.numero_boleto} - NF ${nota.numero_nf}${nota.serie ? ` Série ${nota.serie}` : ''}`
          : `Nota Fiscal ${nota.numero_nf}${nota.serie ? ` - Série ${nota.serie}` : ''}`,
        valor: boletoVinculado 
          ? parseFloat(boletoVinculado.valor || 0)
          : parseFloat(nota.valor_liquido || nota.valor_total || 0),
        data_vencimento: boletoVinculado 
          ? boletoVinculado.data_vencimento 
          : (nota.data_vencimento || nota.data_emissao),
        data_pagamento: boletoVinculado 
          ? (boletoVinculado.status === 'pago' ? boletoVinculado.data_pagamento : null)
          : (nota.status === 'paga' ? nota.updated_at?.split('T')[0] : null),
        status: boletoVinculado
          ? (boletoVinculado.status === 'pago' ? 'pago' : boletoVinculado.status === 'vencido' ? 'vencido' : 'pendente')
          : (nota.status === 'paga' ? 'pago' : nota.status === 'vencida' ? 'vencido' : 'pendente'),
        cliente: nota.cliente ? {
          id: nota.cliente.id,
          nome: nota.cliente.nome,
          cnpj: nota.cliente.cnpj
        } : null,
        obra: null, // Notas fiscais podem não ter obra vinculada diretamente
        observacoes: boletoVinculado?.observacoes || nota.observacoes,
        created_at: boletoVinculado?.created_at || nota.created_at,
        updated_at: boletoVinculado?.updated_at || nota.updated_at,
        // Campos específicos da nota fiscal
        numero_nf: nota.numero_nf,
        serie: nota.serie,
        data_emissao: nota.data_emissao,
        valor_total: parseFloat(nota.valor_total || 0),
        valor_liquido: parseFloat(nota.valor_liquido || nota.valor_total || 0),
        tipo: nota.tipo,
        tipo_nota: nota.tipo_nota,
        // Campos de impostos estaduais
        base_calculo_icms: parseFloat(nota.base_calculo_icms || 0),
        valor_icms: parseFloat(nota.valor_icms || 0),
        base_calculo_icms_st: parseFloat(nota.base_calculo_icms_st || 0),
        valor_icms_st: parseFloat(nota.valor_icms_st || 0),
        valor_fcp_st: parseFloat(nota.valor_fcp_st || 0),
        // Campos de impostos federais
        valor_ipi: parseFloat(nota.valor_ipi || 0),
        valor_pis: parseFloat(nota.valor_pis || 0),
        valor_cofins: parseFloat(nota.valor_cofins || 0),
        valor_inss: parseFloat(nota.valor_inss || 0),
        valor_ir: parseFloat(nota.valor_ir || 0),
        valor_csll: parseFloat(nota.valor_csll || 0),
        // Campos de impostos municipais
        base_calculo_issqn: parseFloat(nota.base_calculo_issqn || 0),
        valor_issqn: parseFloat(nota.valor_issqn || 0),
        aliquota_issqn: parseFloat(nota.aliquota_issqn || 0),
        // Retenções
        retencoes_federais: parseFloat(nota.retencoes_federais || 0),
        outras_retencoes: parseFloat(nota.outras_retencoes || 0),
        // Outros valores
        valor_frete: parseFloat(nota.valor_frete || 0),
        valor_seguro: parseFloat(nota.valor_seguro || 0),
        valor_desconto: parseFloat(nota.valor_desconto || 0),
        outras_despesas_acessorias: parseFloat(nota.outras_despesas_acessorias || 0),
        // Campos específicos do boleto
        numero_boleto: boletoVinculado?.numero_boleto,
        boleto_id: boletoVinculado?.id,
        nota_fiscal_id: nota.id
      };
    });

    // Combinar contas e notas fiscais
    const todasContas = [
      ...(contasData || []).map(conta => ({ ...conta, tipo: 'conta_receber' })),
      ...notasFormatadas
    ];

    // Ordenar por data de vencimento (decrescente - mais recentes primeiro)
    todasContas.sort((a, b) => {
      const dataA = new Date(a.data_vencimento);
      const dataB = new Date(b.data_vencimento);
      return dataB - dataA; // Invertido para ordem decrescente
    });

    // Aplicar paginação no resultado combinado
    const total = todasContas.length;
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    const dataPaginada = todasContas.slice(offset, offset + parseInt(limite));

    res.json({
      success: true,
      data: dataPaginada,
      total: total,
      pagina: parseInt(pagina),
      total_paginas: Math.ceil(total / parseInt(limite))
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

    // Notas fiscais de saída vencidas
    const { data: notasVencidas, error: erroNotasVencidas } = await supabaseAdmin
      .from('notas_fiscais')
      .select('id, numero_nf, serie, valor_total, valor_liquido, data_vencimento')
      .eq('tipo', 'saida')
      .eq('status', 'pendente')
      .neq('status', 'cancelada')
      .lt('data_vencimento', hoje);

    // Notas fiscais de saída vencendo
const { data: notasVencendo, error: erroNotasVencendo } = await supabaseAdmin
      .from('notas_fiscais')
      .select('id, numero_nf, serie, valor_total, valor_liquido, data_vencimento')
      .eq('tipo', 'saida')
      .eq('status', 'pendente')
      .neq('status', 'cancelada')
      .gte('data_vencimento', hoje)
      .lte('data_vencimento', dataLimiteStr);

    // Transformar notas fiscais em formato de contas
    const notasVencidasFormatadas = (notasVencidas || []).map(nota => ({
      id: `nf_${nota.id}`,
      descricao: `Nota Fiscal ${nota.numero_nf}${nota.serie ? ` - Série ${nota.serie}` : ''}`,
      valor: parseFloat(nota.valor_liquido || nota.valor_total || 0),
      data_vencimento: nota.data_vencimento
    }));

    const notasVencendoFormatadas = (notasVencendo || []).map(nota => ({
      id: `nf_${nota.id}`,
      descricao: `Nota Fiscal ${nota.numero_nf}${nota.serie ? ` - Série ${nota.serie}` : ''}`,
      valor: parseFloat(nota.valor_liquido || nota.valor_total || 0),
      data_vencimento: nota.data_vencimento
    }));

    // Combinar contas e notas fiscais
    const todasVencidas = [...(vencidas || []), ...notasVencidasFormatadas];
    const todasVencendo = [...(vencendo || []), ...notasVencendoFormatadas];

    const totalVencidas = todasVencidas.reduce((sum, c) => sum + parseFloat(c.valor), 0);
    const totalVencendo = todasVencendo.reduce((sum, c) => sum + parseFloat(c.valor), 0);

    res.json({
      success: true,
      alertas: {
        vencidas: {
          quantidade: todasVencidas.length,
          valor_total: totalVencidas,
          contas: todasVencidas
        },
        vencendo: {
          quantidade: todasVencendo.length,
          valor_total: totalVencendo,
          contas: todasVencendo
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

