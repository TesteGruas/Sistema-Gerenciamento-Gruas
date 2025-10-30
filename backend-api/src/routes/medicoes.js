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

    // Criar receita automática ao finalizar medição
    try {
      const medicao = data;
      const locacao = medicao.locacoes;
      
      // Log adicional para debug
      console.log(`[Medição] DEBUG - Dados da locação:`, {
        locacao_existe: !!locacao,
        locacao_id: locacao?.id,
        equipamento_id: locacao?.equipamento_id,
        tipo_equipamento: locacao?.tipo_equipamento,
        contrato_id: locacao?.contrato_id,
        valor_total: medicao.valor_total,
        condicao_atendida: !!(locacao && medicao.valor_total > 0)
      });
      
      if (locacao && medicao.valor_total > 0) {
        // Tentar buscar obra_id de múltiplas formas
        let obra_id = null;
        let metodo_busca = null;

        // Método 1: obra_gruas_configuracao
        const { data: configData } = await supabaseAdmin
          .from('obra_gruas_configuracao')
          .select('obra_id')
          .eq('grua_id', locacao.equipamento_id)
          .maybeSingle();

        console.log(`[Medição] Método 1 (obra_gruas_configuracao) - Resultado:`, { 
          tentou_buscar: true,
          grua_id_buscado: locacao.equipamento_id,
          encontrou: !!configData?.obra_id,
          dados: configData
        });

        if (configData?.obra_id) {
          obra_id = configData.obra_id;
          metodo_busca = 'obra_gruas_configuracao';
        }

        // Método 2: grua_obra (se método 1 falhar)
        if (!obra_id) {
          const { data: gruaObraData } = await supabaseAdmin
            .from('grua_obra')
            .select('obra_id')
            .eq('grua_id', locacao.equipamento_id)
            .eq('status', 'Ativa')
            .maybeSingle();
          
          console.log(`[Medição] Método 2 (grua_obra) - Resultado:`, { 
            tentou_buscar: true,
            grua_id_buscado: locacao.equipamento_id,
            encontrou: !!gruaObraData?.obra_id,
            dados: gruaObraData
          });
          
          if (gruaObraData?.obra_id) {
            obra_id = gruaObraData.obra_id;
            metodo_busca = 'grua_obra';
          }
        }

        // Método 3: contrato (se método 2 falhar)
        if (!obra_id && locacao.contrato_id) {
          const { data: contratoData } = await supabaseAdmin
            .from('contratos')
            .select('obra_id')
            .eq('id', locacao.contrato_id)
            .maybeSingle();
          
          console.log(`[Medição] Método 3 (contratos) - Resultado:`, { 
            tentou_buscar: true,
            contrato_id_buscado: locacao.contrato_id,
            encontrou: !!contratoData?.obra_id,
            dados: contratoData
          });
          
          if (contratoData?.obra_id) {
            obra_id = contratoData.obra_id;
            metodo_busca = 'contratos';
          }
        }
        
        // Log de debug
        console.log(`[Medição] Tentando criar receita automática:`, {
          medicao_id: medicao.id,
          medicao_numero: medicao.numero,
          locacao_id: locacao.id,
          equipamento_id: locacao.equipamento_id,
          tipo_equipamento: locacao.tipo_equipamento,
          obra_id,
          metodo_busca,
          valor: medicao.valor_total,
          status: obra_id ? 'sucesso' : 'falhou - obra_id não encontrado'
        });
        
        if (obra_id) {
          await supabaseAdmin
            .from('receitas')
            .insert({
              obra_id: obra_id,
              grua_id: locacao.tipo_equipamento === 'grua' ? locacao.equipamento_id : null,
              tipo: 'locacao',
              descricao: `Receita automática - Medição ${medicao.numero} finalizada`,
              valor: medicao.valor_total,
              data_receita: new Date().toISOString().split('T')[0],
              status: 'confirmada',
              observacoes: `Gerada automaticamente pela medição ID ${medicao.id} (método: ${metodo_busca})`
            });
          
          console.log(`[Medição] ✓ Receita automática criada para medição ${medicao.id} via ${metodo_busca}`);
        } else {
          console.warn(`[Medição] ✗ Não foi possível criar receita automática para medição ${medicao.id} - obra_id não encontrado`);
        }
      }
    } catch (receitaError) {
      // Não bloquear a finalização se houver erro na criação da receita
      console.error('[Medição] Erro ao criar receita automática:', receitaError);
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