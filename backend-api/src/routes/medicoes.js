import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { medicaoSchema, medicaoUpdateSchema, medicaoFiltersSchema } from '../schemas/medicao-schemas.js';

const router = express.Router();

// GET /api/medicoes - Listar medições com filtros
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { error: validationError, value } = medicaoFiltersSchema.validate(req.query);
    if (validationError) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        message: validationError.details[0].message
      });
    }

    const { locacao_id, periodo, status, data_inicio, data_fim, page, limit } = value;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('medicoes')
      .select(`
        *,
        locacoes (
          id,
          numero,
          cliente_id,
          equipamento_id,
          tipo_equipamento,
          valor_mensal,
          status,
          clientes (
            id,
            nome
          )
        )
      `);

    // Aplicar filtros
    if (locacao_id) query = query.eq('locacao_id', locacao_id);
    if (periodo) query = query.eq('periodo', periodo);
    if (status) query = query.eq('status', status);
    if (data_inicio) query = query.gte('data_medicao', data_inicio);
    if (data_fim) query = query.lte('data_medicao', data_fim);

    // Contar total
    const { count } = await query;
    
    // Aplicar paginação
    query = query.order('data_medicao', { ascending: false })
                 .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar medições',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar medições:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// GET /api/medicoes/:id - Buscar medição por ID
router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('medicoes')
      .select(`
        *,
        locacoes (
          id,
          numero,
          cliente_id,
          equipamento_id,
          tipo_equipamento,
          valor_mensal,
          status,
          clientes (
            id,
            nome
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'Medição não encontrada',
        message: error.message
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao buscar medição:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// POST /api/medicoes - Criar nova medição
router.post('/', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { error: validationError, value } = medicaoSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { data, error } = await supabaseAdmin
      .from('medicoes')
      .insert([value])
      .select(`
        *,
        locacoes (
          id,
          numero,
          cliente_id,
          equipamento_id,
          tipo_equipamento,
          valor_mensal,
          status,
          clientes (
            id,
            nome
          )
        )
      `)
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Erro ao criar medição',
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Medição criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar medição:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// PUT /api/medicoes/:id - Atualizar medição
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = medicaoUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { data, error } = await supabaseAdmin
      .from('medicoes')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        locacoes (
          id,
          numero,
          cliente_id,
          equipamento_id,
          tipo_equipamento,
          valor_mensal,
          status,
          clientes (
            id,
            nome
          )
        )
      `)
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Erro ao atualizar medição',
        message: error.message
      });
    }

    res.json({
      success: true,
      data,
      message: 'Medição atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar medição:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// DELETE /api/medicoes/:id - Deletar medição
router.delete('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('medicoes')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        error: 'Erro ao deletar medição',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Medição deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar medição:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// PATCH /api/medicoes/:id/finalizar - Finalizar medição
router.patch('/:id/finalizar', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('medicoes')
      .update({
        status: 'finalizada',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        locacoes (
          id,
          numero,
          cliente_id,
          equipamento_id,
          tipo_equipamento,
          valor_mensal,
          status,
          clientes (
            id,
            nome
          )
        )
      `)
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Erro ao finalizar medição',
        message: error.message
      });
    }

    res.json({
      success: true,
      data,
      message: 'Medição finalizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao finalizar medição:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;