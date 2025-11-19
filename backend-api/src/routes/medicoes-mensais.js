import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { 
  medicaoMensalSchema, 
  medicaoMensalUpdateSchema, 
  medicaoMensalFiltersSchema,
  gerarMedicaoAutomaticaSchema
} from '../schemas/medicao-mensal-schemas.js';

const router = express.Router();

/**
 * GET /api/medicoes-mensais
 * Listar medições mensais com filtros
 */
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { error: validationError, value } = medicaoMensalFiltersSchema.validate(req.query);
    if (validationError) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        message: validationError.details[0].message
      });
    }

    const { orcamento_id, periodo, status, data_inicio, data_fim, mes_referencia, ano_referencia, page, limit } = value;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('medicoes_mensais')
      .select(`
        *,
        orcamentos (
          id,
          numero,
          cliente_id,
          data_orcamento,
          valor_total,
          total_faturado_acumulado,
          ultima_medicao_periodo,
          clientes:cliente_id (
            id,
            nome,
            cnpj_cpf
          )
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (orcamento_id) query = query.eq('orcamento_id', orcamento_id);
    if (periodo) query = query.eq('periodo', periodo);
    if (status) query = query.eq('status', status);
    if (data_inicio) query = query.gte('data_medicao', data_inicio);
    if (data_fim) query = query.lte('data_medicao', data_fim);
    if (mes_referencia) query = query.eq('mes_referencia', mes_referencia);
    if (ano_referencia) query = query.eq('ano_referencia', ano_referencia);

    // Aplicar paginação e ordenação
    query = query.order('data_medicao', { ascending: false })
                 .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar medições mensais',
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
    console.error('Erro ao buscar medições mensais:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/medicoes-mensais/:id
 * Buscar medição mensal por ID com todos os itens
 */
router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar medição com orçamento
    const { data: medicao, error: medicaoError } = await supabaseAdmin
      .from('medicoes_mensais')
      .select(`
        *,
        orcamentos (
          id,
          numero,
          cliente_id,
          data_orcamento,
          valor_total,
          total_faturado_acumulado,
          clientes:cliente_id (
            id,
            nome,
            cnpj_cpf
          )
        )
      `)
      .eq('id', id)
      .single();

    if (medicaoError) {
      return res.status(404).json({
        error: 'Medição não encontrada',
        message: medicaoError.message
      });
    }

    // Buscar todos os itens relacionados
    const [
      { data: custosMensais, error: custosError },
      { data: horasExtras, error: horasError },
      { data: servicosAdicionais, error: servicosError },
      { data: aditivos, error: aditivosError }
    ] = await Promise.all([
      supabaseAdmin.from('medicao_custos_mensais').select('*').eq('medicao_id', id).order('id'),
      supabaseAdmin.from('medicao_horas_extras').select('*').eq('medicao_id', id).order('id'),
      supabaseAdmin.from('medicao_servicos_adicionais').select('*').eq('medicao_id', id).order('id'),
      supabaseAdmin.from('medicao_aditivos').select('*').eq('medicao_id', id).order('id')
    ]);

    if (custosError || horasError || servicosError || aditivosError) {
      return res.status(500).json({
        error: 'Erro ao buscar itens da medição',
        message: custosError?.message || horasError?.message || servicosError?.message || aditivosError?.message
      });
    }

    res.json({
      success: true,
      data: {
        ...medicao,
        custos_mensais: custosMensais || [],
        horas_extras: horasExtras || [],
        servicos_adicionais: servicosAdicionais || [],
        aditivos: aditivos || []
      }
    });
  } catch (error) {
    console.error('Erro ao buscar medição mensal:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/medicoes-mensais
 * Criar nova medição mensal
 */
router.post('/', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { error: validationError, value } = medicaoMensalSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { 
      custos_mensais, 
      horas_extras, 
      servicos_adicionais, 
      aditivos,
      ...medicaoData 
    } = value;

    // Criar medição
    const { data: medicao, error: medicaoError } = await supabaseAdmin
      .from('medicoes_mensais')
      .insert([medicaoData])
      .select()
      .single();

    if (medicaoError) {
      return res.status(500).json({
        error: 'Erro ao criar medição mensal',
        message: medicaoError.message
      });
    }

    // Criar itens relacionados se fornecidos
    const promises = [];

    if (custos_mensais && custos_mensais.length > 0) {
      promises.push(
        supabaseAdmin.from('medicao_custos_mensais')
          .insert(custos_mensais.map(item => ({ ...item, medicao_id: medicao.id })))
      );
    }

    if (horas_extras && horas_extras.length > 0) {
      promises.push(
        supabaseAdmin.from('medicao_horas_extras')
          .insert(horas_extras.map(item => ({ ...item, medicao_id: medicao.id })))
      );
    }

    if (servicos_adicionais && servicos_adicionais.length > 0) {
      promises.push(
        supabaseAdmin.from('medicao_servicos_adicionais')
          .insert(servicos_adicionais.map(item => ({ ...item, medicao_id: medicao.id })))
      );
    }

    if (aditivos && aditivos.length > 0) {
      promises.push(
        supabaseAdmin.from('medicao_aditivos')
          .insert(aditivos.map(item => ({ ...item, medicao_id: medicao.id })))
      );
    }

    // Aguardar todas as inserções
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    
    if (errors.length > 0) {
      console.error('Erros ao criar itens da medição:', errors);
      // Não falhar a criação da medição, apenas logar o erro
    }

    // Recalcular valores (trigger já faz isso, mas garantimos)
    await supabaseAdmin.rpc('recalcular_valores_medicao', { p_medicao_id: medicao.id }).catch(() => {
      // Se a função não existir, não é crítico (o trigger já calcula)
    });

    // Buscar medição atualizada
    const { data: medicaoAtualizada } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('*')
      .eq('id', medicao.id)
      .single();

    res.status(201).json({
      success: true,
      data: medicaoAtualizada || medicao,
      message: 'Medição mensal criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar medição mensal:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/medicoes-mensais/gerar-automatica
 * Gerar medição mensal automaticamente a partir do orçamento
 */
router.post('/gerar-automatica', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { error: validationError, value } = gerarMedicaoAutomaticaSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { orcamento_id, periodo, data_medicao, aplicar_valores_orcamento, incluir_horas_extras, incluir_servicos_adicionais } = value;

    // Verificar se já existe medição para este período
    const { data: medicaoExistente } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('id')
      .eq('orcamento_id', orcamento_id)
      .eq('periodo', periodo)
      .single();

    if (medicaoExistente) {
      return res.status(400).json({
        error: 'Medição já existe',
        message: `Já existe uma medição para o período ${periodo} deste orçamento`,
        data: { medicao_id: medicaoExistente.id }
      });
    }

    // Buscar orçamento completo
    const { data: orcamento, error: orcamentoError } = await supabaseAdmin
      .from('orcamentos')
      .select(`
        *,
        orcamento_custos_mensais (*),
        orcamento_horas_extras (*),
        orcamento_servicos_adicionais (*)
      `)
      .eq('id', orcamento_id)
      .single();

    if (orcamentoError || !orcamento) {
      return res.status(404).json({
        error: 'Orçamento não encontrado',
        message: 'O orçamento especificado não existe'
      });
    }

    // Extrair mês e ano do período
    const [ano, mes] = periodo.split('-').map(Number);

    // Gerar número da medição
    const numero = `MED-${periodo}-${orcamento.numero || orcamento_id}`;

    // Calcular valor mensal bruto (soma dos custos mensais do orçamento)
    let valorMensalBruto = 0;
    if (aplicar_valores_orcamento && orcamento.orcamento_custos_mensais) {
      valorMensalBruto = orcamento.orcamento_custos_mensais.reduce((total, item) => {
        return total + (parseFloat(item.valor_mensal) || 0);
      }, 0);
    }

    // Criar medição
    const medicaoData = {
      orcamento_id,
      numero,
      periodo,
      data_medicao,
      mes_referencia: mes,
      ano_referencia: ano,
      valor_mensal_bruto: valorMensalBruto,
      valor_aditivos: 0,
      valor_custos_extras: 0,
      valor_descontos: 0,
      status: 'pendente',
      created_by: req.user?.id
    };

    const { data: medicao, error: medicaoError } = await supabaseAdmin
      .from('medicoes_mensais')
      .insert([medicaoData])
      .select()
      .single();

    if (medicaoError) {
      return res.status(500).json({
        error: 'Erro ao criar medição mensal',
        message: medicaoError.message
      });
    }

    // Copiar custos mensais do orçamento
    if (aplicar_valores_orcamento && orcamento.orcamento_custos_mensais && orcamento.orcamento_custos_mensais.length > 0) {
      const custosMensaisData = orcamento.orcamento_custos_mensais.map(item => ({
        medicao_id: medicao.id,
        tipo: item.tipo,
        descricao: item.descricao,
        valor_mensal: item.valor_mensal,
        quantidade_meses: 1,
        valor_total: item.valor_mensal,
        observacoes: item.observacoes || ''
      }));

      await supabaseAdmin.from('medicao_custos_mensais').insert(custosMensaisData);
    }

    // Copiar tabela de horas extras do orçamento (se solicitado)
    if (incluir_horas_extras && orcamento.orcamento_horas_extras && orcamento.orcamento_horas_extras.length > 0) {
      const horasExtrasData = orcamento.orcamento_horas_extras.map(item => ({
        medicao_id: medicao.id,
        tipo: item.tipo,
        dia_semana: item.dia_semana,
        quantidade_horas: 0, // Será preenchido pelo usuário
        valor_hora: item.valor_hora,
        valor_total: 0, // Será calculado quando quantidade for preenchida
        observacoes: ''
      }));

      await supabaseAdmin.from('medicao_horas_extras').insert(horasExtrasData);
    }

    // Copiar serviços adicionais do orçamento (se solicitado)
    if (incluir_servicos_adicionais && orcamento.orcamento_servicos_adicionais && orcamento.orcamento_servicos_adicionais.length > 0) {
      const servicosAdicionaisData = orcamento.orcamento_servicos_adicionais.map(item => ({
        medicao_id: medicao.id,
        tipo: item.tipo,
        descricao: item.descricao,
        quantidade: item.quantidade || 1,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        observacoes: item.observacoes || ''
      }));

      await supabaseAdmin.from('medicao_servicos_adicionais').insert(servicosAdicionaisData);
    }

    // Buscar medição atualizada com valores recalculados
    const { data: medicaoAtualizada } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('*')
      .eq('id', medicao.id)
      .single();

    res.status(201).json({
      success: true,
      data: medicaoAtualizada || medicao,
      message: 'Medição mensal gerada automaticamente com sucesso'
    });
  } catch (error) {
    console.error('Erro ao gerar medição automática:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * PUT /api/medicoes-mensais/:id
 * Atualizar medição mensal
 */
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = medicaoMensalUpdateSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      });
    }

    const { 
      custos_mensais, 
      horas_extras, 
      servicos_adicionais, 
      aditivos,
      ...medicaoData 
    } = value;

    // Atualizar medição
    const { data: medicao, error: medicaoError } = await supabaseAdmin
      .from('medicoes_mensais')
      .update({
        ...medicaoData,
        updated_at: new Date().toISOString(),
        updated_by: req.user?.id
      })
      .eq('id', id)
      .select()
      .single();

    if (medicaoError) {
      return res.status(500).json({
        error: 'Erro ao atualizar medição mensal',
        message: medicaoError.message
      });
    }

    // Atualizar arrays se fornecidos
    if (custos_mensais !== undefined) {
      // Remover existentes e inserir novos
      await supabaseAdmin.from('medicao_custos_mensais').delete().eq('medicao_id', id);
      if (custos_mensais.length > 0) {
        await supabaseAdmin.from('medicao_custos_mensais')
          .insert(custos_mensais.map(item => ({ ...item, medicao_id: id })));
      }
    }

    if (horas_extras !== undefined) {
      await supabaseAdmin.from('medicao_horas_extras').delete().eq('medicao_id', id);
      if (horas_extras.length > 0) {
        await supabaseAdmin.from('medicao_horas_extras')
          .insert(horas_extras.map(item => ({ ...item, medicao_id: id })));
      }
    }

    if (servicos_adicionais !== undefined) {
      await supabaseAdmin.from('medicao_servicos_adicionais').delete().eq('medicao_id', id);
      if (servicos_adicionais.length > 0) {
        await supabaseAdmin.from('medicao_servicos_adicionais')
          .insert(servicos_adicionais.map(item => ({ ...item, medicao_id: id })));
      }
    }

    if (aditivos !== undefined) {
      await supabaseAdmin.from('medicao_aditivos').delete().eq('medicao_id', id);
      if (aditivos.length > 0) {
        await supabaseAdmin.from('medicao_aditivos')
          .insert(aditivos.map(item => ({ ...item, medicao_id: id })));
      }
    }

    // Buscar medição atualizada
    const { data: medicaoAtualizada } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('*')
      .eq('id', id)
      .single();

    res.json({
      success: true,
      data: medicaoAtualizada || medicao,
      message: 'Medição mensal atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar medição mensal:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * PATCH /api/medicoes-mensais/:id/finalizar
 * Finalizar medição mensal (atualiza orçamento automaticamente)
 */
router.patch('/:id/finalizar', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: medicao, error: medicaoError } = await supabaseAdmin
      .from('medicoes_mensais')
      .update({
        status: 'finalizada',
        data_finalizacao: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: req.user?.id
      })
      .eq('id', id)
      .select(`
        *,
        orcamentos (
          id,
          numero
        )
      `)
      .single();

    if (medicaoError) {
      return res.status(500).json({
        error: 'Erro ao finalizar medição mensal',
        message: medicaoError.message
      });
    }

    // O trigger já atualiza o orçamento automaticamente, mas vamos garantir
    // Buscar orçamento atualizado
    const { data: orcamentoAtualizado } = await supabaseAdmin
      .from('orcamentos')
      .select('id, total_faturado_acumulado, ultima_medicao_periodo')
      .eq('id', medicao.orcamento_id)
      .single();

    res.json({
      success: true,
      data: {
        ...medicao,
        orcamento: orcamentoAtualizado
      },
      message: 'Medição mensal finalizada com sucesso. Orçamento atualizado automaticamente.'
    });
  } catch (error) {
    console.error('Erro ao finalizar medição mensal:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/medicoes-mensais/orcamento/:orcamento_id
 * Listar todas as medições de um orçamento (histórico mensal)
 */
router.get('/orcamento/:orcamento_id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { orcamento_id } = req.params;

    const { data: medicoes, error } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('*')
      .eq('orcamento_id', orcamento_id)
      .order('periodo', { ascending: true });

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar medições do orçamento',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: medicoes || [],
      total: medicoes?.length || 0
    });
  } catch (error) {
    console.error('Erro ao buscar medições do orçamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * DELETE /api/medicoes-mensais/:id
 * Deletar medição mensal (apenas se não estiver finalizada)
 */
router.delete('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a medição pode ser deletada
    const { data: medicao, error: checkError } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('status')
      .eq('id', id)
      .single();

    if (checkError) {
      return res.status(404).json({
        error: 'Medição não encontrada',
        message: checkError.message
      });
    }

    if (medicao.status === 'finalizada') {
      return res.status(400).json({
        error: 'Não é possível excluir',
        message: 'Medições finalizadas não podem ser excluídas'
      });
    }

    // Deletar (CASCADE irá deletar todos os itens relacionados)
    const { error } = await supabaseAdmin
      .from('medicoes_mensais')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        error: 'Erro ao deletar medição mensal',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Medição mensal deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar medição mensal:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;

