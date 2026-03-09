import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { 
  medicaoMensalSchema, 
  medicaoMensalUpdateSchema, 
  medicaoMensalFiltersSchema,
  gerarMedicaoAutomaticaSchema
} from '../schemas/medicao-mensal-schemas.js';

const router = express.Router();

// Função helper para formatar período (YYYY-MM) para "Mês Ano" (ex: "2025-12" -> "Dezembro 2025")
const formatarPeriodo = (periodo) => {
  if (!periodo) return periodo;
  try {
    const [ano, mes] = periodo.split('-');
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const mesIndex = parseInt(mes) - 1;
    if (mesIndex >= 0 && mesIndex < 12) {
      return `${meses[mesIndex]} ${ano}`;
    }
    return periodo;
  } catch {
    return periodo;
  }
};

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});

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

    const { orcamento_id, obra_id, grua_id, periodo, status, data_inicio, data_fim, mes_referencia, ano_referencia, search, page, limit } = value;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('medicoes_mensais')
      .select(`
        *,
        orcamentos:orcamento_id (
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
            cnpj,
            contato_cpf
          )
        ),
        obras:obra_id (
          id,
          nome,
          cliente_id,
          status,
          clientes:cliente_id (
            id,
            nome,
            cnpj
          )
        ),
        gruas:grua_id (
          id,
          name,
          modelo,
          fabricante,
          capacidade,
          status
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (orcamento_id) query = query.eq('orcamento_id', orcamento_id);
    if (obra_id) query = query.eq('obra_id', obra_id);
    if (grua_id) query = query.eq('grua_id', grua_id); // NOVO
    if (periodo) query = query.eq('periodo', periodo);
    if (status) query = query.eq('status', status);
    if (data_inicio) {
      // Converter Date para string ISO (YYYY-MM-DD) se necessário
      const dataInicioStr = data_inicio instanceof Date 
        ? data_inicio.toISOString().split('T')[0] 
        : data_inicio;
      query = query.gte('data_medicao', dataInicioStr);
    }
    if (data_fim) {
      // Converter Date para string ISO (YYYY-MM-DD) se necessário
      const dataFimStr = data_fim instanceof Date 
        ? data_fim.toISOString().split('T')[0] 
        : data_fim;
      query = query.lte('data_medicao', dataFimStr);
    }
    if (mes_referencia) query = query.eq('mes_referencia', mes_referencia);
    if (ano_referencia) query = query.eq('ano_referencia', ano_referencia);
    
    // Aplicar busca por texto
    if (search && search.trim()) {
      const searchTerm = search.trim()
      const searchPattern = `%${searchTerm}%`
      
      // Buscar IDs de obras que correspondem ao termo de busca
      const { data: obrasEncontradas } = await supabaseAdmin
        .from('obras')
        .select('id')
        .ilike('nome', searchPattern)
      
      const obraIds = obrasEncontradas?.map(o => o.id) || []
      
      // Buscar IDs de gruas que correspondem ao termo de busca
      const { data: gruasEncontradas } = await supabaseAdmin
        .from('gruas')
        .select('id')
        .or(`name.ilike.${searchPattern},modelo.ilike.${searchPattern},fabricante.ilike.${searchPattern}`)
      
      const gruaIds = gruasEncontradas?.map(g => g.id) || []
      
      // Construir condições de busca
      const searchConditions = []
      
      // Busca em numero e periodo
      searchConditions.push(`numero.ilike.%${searchTerm}%`)
      searchConditions.push(`periodo.ilike.%${searchTerm}%`)
      
      // Adicionar condições para obras e gruas se encontradas
      if (obraIds.length > 0) {
        searchConditions.push(`obra_id.in.(${obraIds.join(',')})`)
      }
      
      if (gruaIds.length > 0) {
        searchConditions.push(`grua_id.in.(${gruaIds.join(',')})`)
      }
      
      // Aplicar todas as condições com OR
      if (searchConditions.length > 0) {
        query = query.or(searchConditions.join(','))
      }
    }

    // Aplicar paginação e ordenação
    query = query.order('periodo', { ascending: false })
                 .order('data_medicao', { ascending: false })
                 .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar medições mensais',
        message: error.message
      });
    }

    // Buscar documentos para cada medição (se houver medições)
    let medicoesComDocumentos = data || []
    if (medicoesComDocumentos.length > 0) {
      const medicaoIds = medicoesComDocumentos.map(m => m.id)
      const { data: documentos, error: documentosError } = await supabaseAdmin
        .from('medicao_documentos')
        .select('*')
        .in('medicao_id', medicaoIds)
        .order('created_at', { ascending: false })

      if (!documentosError && documentos) {
        // Agrupar documentos por medicao_id
        const documentosPorMedicao = documentos.reduce((acc, doc) => {
          if (!acc[doc.medicao_id]) {
            acc[doc.medicao_id] = []
          }
          acc[doc.medicao_id].push(doc)
          return acc
        }, {})

        // Adicionar documentos a cada medição
        medicoesComDocumentos = medicoesComDocumentos.map((medicao) => ({
          ...medicao,
          documentos: documentosPorMedicao[medicao.id] || []
        }))
      }
    }

    res.json({
      success: true,
      data: medicoesComDocumentos,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
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

    // Buscar medição com orçamento e/ou obra
    const { data: medicao, error: medicaoError } = await supabaseAdmin
      .from('medicoes_mensais')
      .select(`
        *,
        orcamentos:orcamento_id (
          id,
          numero,
          cliente_id,
          data_orcamento,
          valor_total,
          total_faturado_acumulado,
          clientes:cliente_id (
            id,
            nome,
            cnpj,
            contato_cpf
          )
        ),
        obras:obra_id (
          id,
          nome,
          cliente_id,
          status,
          clientes:cliente_id (
            id,
            nome,
            cnpj
          )
        ),
        gruas:grua_id (
          id,
          name,
          modelo,
          fabricante,
          capacidade,
          status
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
      { data: aditivos, error: aditivosError },
      { data: documentos, error: documentosError }
    ] = await Promise.all([
      supabaseAdmin.from('medicao_custos_mensais').select('*').eq('medicao_id', id).order('id'),
      supabaseAdmin.from('medicao_horas_extras').select('*').eq('medicao_id', id).order('id'),
      supabaseAdmin.from('medicao_servicos_adicionais').select('*').eq('medicao_id', id).order('id'),
      supabaseAdmin.from('medicao_aditivos').select('*').eq('medicao_id', id).order('id'),
      supabaseAdmin.from('medicao_documentos').select('*').eq('medicao_id', id).order('created_at', { ascending: false })
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
        aditivos: aditivos || [],
        documentos: documentos || []
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
      obra_id,
      orcamento_id,
      grua_id,
      ...medicaoData 
    } = value;

    // Validar que pelo menos um dos três foi fornecido
    if (!obra_id && !orcamento_id && !grua_id) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'É necessário fornecer obra_id, orcamento_id ou grua_id'
      });
    }

    // Se obra_id foi fornecido, verificar se a obra existe
    if (obra_id) {
      const { data: obra, error: obraError } = await supabaseAdmin
        .from('obras')
        .select('id')
        .eq('id', obra_id)
        .single();

      if (obraError || !obra) {
        return res.status(404).json({
          error: 'Obra não encontrada',
          message: 'A obra especificada não existe'
        });
      }
    }

    // Se orcamento_id foi fornecido, verificar se o orçamento existe
    if (orcamento_id) {
      const { data: orcamento, error: orcamentoError } = await supabaseAdmin
        .from('orcamentos')
        .select('id')
        .eq('id', orcamento_id)
        .single();

      if (orcamentoError || !orcamento) {
        return res.status(404).json({
          error: 'Orçamento não encontrado',
          message: 'O orçamento especificado não existe'
        });
      }
    }

    // Se grua_id foi fornecido, verificar se a grua existe
    if (grua_id) {
      const { data: grua, error: gruaError } = await supabaseAdmin
        .from('gruas')
        .select('id')
        .eq('id', grua_id)
        .single();

      if (gruaError || !grua) {
        return res.status(404).json({
          error: 'Grua não encontrada',
          message: 'A grua especificada não existe'
        });
      }
    }

    // Verificar se já existe medição para este período
    let medicaoExistente;
    if (grua_id) {
      const { data } = await supabaseAdmin
        .from('medicoes_mensais')
        .select('id')
        .eq('grua_id', grua_id)
        .eq('periodo', medicaoData.periodo)
        .single();
      medicaoExistente = data;
    } else if (orcamento_id) {
      const { data } = await supabaseAdmin
        .from('medicoes_mensais')
        .select('id')
        .eq('orcamento_id', orcamento_id)
        .eq('periodo', medicaoData.periodo)
        .single();
      medicaoExistente = data;
    } else if (obra_id) {
      const { data } = await supabaseAdmin
        .from('medicoes_mensais')
        .select('id')
        .eq('obra_id', obra_id)
        .eq('periodo', medicaoData.periodo)
        .is('orcamento_id', null)
        .single();
      medicaoExistente = data;
    }

    if (medicaoExistente) {
      const periodoFormatado = formatarPeriodo(medicaoData.periodo);
      return res.status(400).json({
        error: 'Medição já existe',
        message: `Já existe uma medição para o período ${periodoFormatado}`,
        data: { medicao_id: medicaoExistente.id }
      });
    }

    // Adicionar obra_id, orcamento_id e grua_id aos dados da medição
    medicaoData.obra_id = obra_id || null;
    medicaoData.orcamento_id = orcamento_id || null;
    medicaoData.grua_id = grua_id ? String(grua_id) : null; // Converter para string pois gruas.id é VARCHAR
    medicaoData.created_by = req.user?.id;

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
    try {
      const { error: rpcError } = await supabaseAdmin.rpc('recalcular_valores_medicao', { p_medicao_id: medicao.id });
      if (rpcError) {
        // Se a função não existir, não é crítico (o trigger já calcula)
        console.log('Aviso: função recalcular_valores_medicao não disponível ou erro:', rpcError.message);
      }
    } catch (error) {
      // Se a função não existir, não é crítico (o trigger já calcula)
      console.log('Aviso: função recalcular_valores_medicao não disponível');
    }

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
      const periodoFormatado = formatarPeriodo(periodo);
      return res.status(400).json({
        error: 'Medição já existe',
        message: `Já existe uma medição para o período ${periodoFormatado} deste orçamento`,
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

    // Verificar se a medição existe
    const { data: medicaoAtual, error: checkError } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError) {
      return res.status(404).json({
        error: 'Medição não encontrada',
        message: checkError.message
      });
    }

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

    // O trigger já atualiza o orçamento automaticamente (se houver), mas vamos garantir
    let orcamentoAtualizado = null;
    if (medicao.orcamento_id) {
      const { data } = await supabaseAdmin
        .from('orcamentos')
        .select('id, total_faturado_acumulado, ultima_medicao_periodo')
        .eq('id', medicao.orcamento_id)
        .single();
      orcamentoAtualizado = data;
    }

    res.json({
      success: true,
      data: {
        ...medicao,
        orcamento: orcamentoAtualizado
      },
      message: medicao.orcamento_id 
        ? 'Medição mensal finalizada com sucesso. Orçamento atualizado automaticamente.'
        : 'Medição mensal finalizada com sucesso.'
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
 * GET /api/medicoes-mensais/obra/:obra_id
 * Listar todas as medições de uma obra (sem orçamento)
 */
router.get('/obra/:obra_id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obra_id } = req.params;

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome')
      .eq('id', obra_id)
      .single();

    if (obraError || !obra) {
      return res.status(404).json({
        error: 'Obra não encontrada',
        message: 'A obra especificada não existe'
      });
    }

    // Buscar medições da obra (sem orçamento)
    const { data: medicoes, error } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('*')
      .eq('obra_id', obra_id)
      .is('orcamento_id', null)
      .order('periodo', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar medições da obra',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: medicoes || [],
      total: medicoes?.length || 0
    });
  } catch (error) {
    console.error('Erro ao buscar medições da obra:', error);
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
 * GET /api/medicoes-mensais/grua/:grua_id
 * Listar todas as medições de uma grua
 */
router.get('/grua/:grua_id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { grua_id } = req.params;

    // Verificar se a grua existe
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('id, nome')
      .eq('id', grua_id)
      .single();

    if (gruaError || !grua) {
      return res.status(404).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      });
    }

    // Buscar medições da grua com todos os relacionamentos
    const { data: medicoes, error } = await supabaseAdmin
      .from('medicoes_mensais')
      .select(`
        *,
        obras:obra_id (
          id,
          nome,
          cliente_id,
          status,
          clientes:cliente_id (
            id,
            nome,
            cnpj
          )
        ),
        gruas:grua_id (
          id,
          name,
          modelo,
          fabricante,
          capacidade,
          status
        )
      `)
      .eq('grua_id', grua_id)
      .order('periodo', { ascending: false })
      .order('data_medicao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar medições da grua:', error);
      return res.status(500).json({
        error: 'Erro ao buscar medições da grua',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: medicoes || [],
      total: medicoes?.length || 0
    });
  } catch (error) {
    console.error('Erro ao buscar medições da grua:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * PATCH /api/medicoes-mensais/:id/enviar
 * Enviar medição ao cliente (bloqueia edição)
 */
router.patch('/:id/enviar', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, telefone } = req.body;

    // Buscar medição
    const { data: medicao, error: medicaoError } = await supabaseAdmin
      .from('medicoes_mensais')
      .select(`
        *,
        obras:obra_id (
          id,
          nome,
          cliente_id,
          clientes:cliente_id (
            id,
            nome,
            cnpj,
            email,
            telefone
          )
        ),
        orcamentos:orcamento_id (
          id,
          numero,
          cliente_id,
          clientes:cliente_id (
            id,
            nome,
            cnpj,
            email,
            telefone
          )
        ),
        gruas:grua_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (medicaoError || !medicao) {
      return res.status(404).json({
        error: 'Medição não encontrada',
        message: 'A medição especificada não existe'
      });
    }

    // Verificar se já foi enviada
    if (medicao.status === 'enviada') {
      return res.status(400).json({
        error: 'Medição já enviada',
        message: 'Esta medição já foi enviada ao cliente'
      });
    }

    // Atualizar medição: status enviada, bloquear edição
    const { data: medicaoAtualizada, error: updateError } = await supabaseAdmin
      .from('medicoes_mensais')
      .update({
        status: 'enviada',
        data_envio: new Date().toISOString(),
        editavel: false, // Bloquear edição após envio
        status_aprovacao: 'pendente',
        updated_at: new Date().toISOString(),
        updated_by: req.user?.id
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        error: 'Erro ao enviar medição',
        message: updateError.message
      });
    }

    // Buscar dados do cliente
    const cliente = medicao.obras?.clientes || medicao.orcamentos?.clientes;
    const emailCliente = email || cliente?.email;
    const telefoneCliente = telefone || cliente?.telefone;

    // Enviar notificações (e-mail e WhatsApp) - assíncrono
    if (emailCliente || telefoneCliente) {
      (async () => {
        try {
          const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
          const linkMedicao = `${FRONTEND_URL}/dashboard/medicoes/${id}`;

          // Enviar e-mail
          if (emailCliente) {
            try {
              const { sendEmail } = await import('../services/email.service.js');
              await sendEmail({
                to: emailCliente,
                subject: `Medição ${medicao.numero} - ${medicao.periodo}`,
                html: `
                  <h2>Nova Medição Disponível</h2>
                  <p>Uma nova medição foi enviada para sua aprovação:</p>
                  <ul>
                    <li><strong>Número:</strong> ${medicao.numero}</li>
                    <li><strong>Período:</strong> ${medicao.periodo}</li>
                    <li><strong>Valor Total:</strong> R$ ${parseFloat(medicao.valor_total || 0).toFixed(2)}</li>
                    ${medicao.gruas ? `<li><strong>Grua:</strong> ${medicao.gruas.name}</li>` : ''}
                  </ul>
                  <p><a href="${linkMedicao}">Visualizar Medição</a></p>
                `,
                tipo: 'medicao_enviada'
              });
            } catch (emailErr) {
              console.error('Erro ao enviar e-mail:', emailErr);
            }
          }

          // Enviar WhatsApp
          if (telefoneCliente) {
            try {
              const { enviarMensagemWebhook } = await import('../services/whatsapp-service.js');
              const mensagem = `🔔 *Nova Medição Disponível*\n\nMedição ${medicao.numero} - ${medicao.periodo}\nValor: R$ ${parseFloat(medicao.valor_total || 0).toFixed(2)}\n\n${linkMedicao}`;
              await enviarMensagemWebhook(telefoneCliente, mensagem, linkMedicao, { tipo: 'medicao_enviada' });
            } catch (whatsappErr) {
              console.error('Erro ao enviar WhatsApp:', whatsappErr);
            }
          }
        } catch (notifError) {
          console.error('Erro ao enviar notificações:', notifError);
        }
      })();
    }

    res.json({
      success: true,
      data: medicaoAtualizada,
      message: 'Medição enviada ao cliente com sucesso'
    });
  } catch (error) {
    console.error('Erro ao enviar medição:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * PATCH /api/medicoes-mensais/:id/aprovar
 * Aprovar ou rejeitar medição pelo cliente
 */
router.patch('/:id/aprovar', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status_aprovacao, observacoes_aprovacao } = req.body;

    if (!status_aprovacao || !['aprovada', 'rejeitada'].includes(status_aprovacao)) {
      return res.status(400).json({
        error: 'Status inválido',
        message: 'status_aprovacao deve ser "aprovada" ou "rejeitada"'
      });
    }

    // Buscar medição com obra e cliente
    const { data: medicao, error: medicaoError } = await supabaseAdmin
      .from('medicoes_mensais')
      .select(`
        id, 
        status, 
        status_aprovacao,
        obra_id,
        obras:obra_id (
          id,
          cliente_id
        )
      `)
      .eq('id', id)
      .single();

    if (medicaoError || !medicao) {
      return res.status(404).json({
        error: 'Medição não encontrada',
        message: 'A medição especificada não existe'
      });
    }

    if (medicao.status !== 'enviada') {
      return res.status(400).json({
        error: 'Medição não enviada',
        message: 'Apenas medições enviadas podem ser aprovadas/rejeitadas'
      });
    }

    // Verificar se o usuário é cliente e se a medição pertence a ele
    const userRole = req.user?.role?.toLowerCase() || ''
    if (userRole.includes('cliente') || req.user?.level === 1) {
      // Buscar cliente do usuário
      const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('clientes')
        .select('id')
        .eq('contato_usuario_id', req.user.id)
        .single()

      if (clienteError || !cliente) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Cliente não encontrado para este usuário'
        })
      }

      // Verificar se a obra da medição pertence ao cliente
      if (!medicao.obras || medicao.obras.cliente_id !== cliente.id) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para aprovar esta medição'
        })
      }
    }

    // Atualizar status de aprovação
    const { data: medicaoAtualizada, error: updateError } = await supabaseAdmin
      .from('medicoes_mensais')
      .update({
        status_aprovacao,
        data_aprovacao: new Date().toISOString(),
        aprovado_por: req.user?.id,
        observacoes_aprovacao: observacoes_aprovacao || null,
        updated_at: new Date().toISOString(),
        updated_by: req.user?.id
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        error: 'Erro ao atualizar aprovação',
        message: updateError.message
      });
    }

    res.json({
      success: true,
      data: medicaoAtualizada,
      message: `Medição ${status_aprovacao === 'aprovada' ? 'aprovada' : 'rejeitada'} com sucesso`
    });
  } catch (error) {
    console.error('Erro ao aprovar/rejeitar medição:', error);
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

/**
 * GET /api/medicoes-mensais/:id/documentos
 * Listar documentos de uma medição
 */
router.get('/:id/documentos', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: documentos, error } = await supabaseAdmin
      .from('medicao_documentos')
      .select('*')
      .eq('medicao_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar documentos',
        message: error.message
      });
    }

    res.json({
      success: true,
      data: documentos || []
    });
  } catch (error) {
    console.error('Erro ao buscar documentos da medição:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/medicoes-mensais/:id/documentos
 * Criar documento para uma medição (com upload de arquivo opcional)
 */
router.post('/:id/documentos', authenticateToken, requirePermission('obras:editar'), upload.single('arquivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_documento, numero_documento, caminho_arquivo, data_emissao, data_vencimento, valor, status, observacoes } = req.body;
    const file = req.file;

    if (!tipo_documento || !['nf_servico', 'nf_produto', 'nf_locacao', 'boleto', 'medicao_pdf'].includes(tipo_documento)) {
      return res.status(400).json({
        error: 'Tipo de documento inválido',
        message: 'Tipo deve ser: nf_servico, nf_produto, nf_locacao, boleto ou medicao_pdf'
      });
    }

    // Verificar se a medição existe
    const { data: medicao, error: medicaoError } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('id')
      .eq('id', id)
      .single();

    if (medicaoError || !medicao) {
      return res.status(404).json({
        error: 'Medição não encontrada',
        message: 'A medição especificada não existe'
      });
    }

    let arquivoPath = caminho_arquivo || null;

    // Se houver arquivo enviado, fazer upload para o Supabase Storage
    if (file) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.originalname.split('.').pop();
      const fileName = `medicao_${id}_${tipo_documento}_${timestamp}_${randomString}.${extension}`;
      const filePath = `medicoes/${id}/${fileName}`;

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('arquivos-obras')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return res.status(500).json({
          error: 'Erro ao fazer upload do arquivo',
          message: uploadError.message
        });
      }

      // Obter URL pública do arquivo
      const { data: urlData } = supabaseAdmin.storage
        .from('arquivos-obras')
        .getPublicUrl(filePath);

      arquivoPath = urlData?.publicUrl || filePath;
    }

    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('medicao_documentos')
      .insert([{
        medicao_id: parseInt(id),
        tipo_documento,
        numero_documento: numero_documento || null,
        caminho_arquivo: arquivoPath,
        data_emissao: data_emissao || null,
        data_vencimento: data_vencimento || null,
        valor: valor || null,
        status: status || 'pendente',
        observacoes: observacoes || null
      }])
      .select()
      .single();

    if (documentoError) {
      return res.status(500).json({
        error: 'Erro ao criar documento',
        message: documentoError.message
      });
    }

    res.status(201).json({
      success: true,
      data: documento,
      message: 'Documento criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * PUT /api/medicoes-mensais/:id/documentos/:documento_id
 * Atualizar documento de uma medição
 */
router.put('/:id/documentos/:documento_id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id, documento_id } = req.params;
    const { numero_documento, caminho_arquivo, data_emissao, data_vencimento, valor, status, observacoes } = req.body;

    // Verificar se o documento pertence à medição
    const { data: documentoExistente, error: checkError } = await supabaseAdmin
      .from('medicao_documentos')
      .select('id')
      .eq('id', documento_id)
      .eq('medicao_id', id)
      .single();

    if (checkError || !documentoExistente) {
      return res.status(404).json({
        error: 'Documento não encontrado',
        message: 'O documento especificado não existe ou não pertence a esta medição'
      });
    }

    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('medicao_documentos')
      .update({
        numero_documento: numero_documento !== undefined ? numero_documento : null,
        caminho_arquivo: caminho_arquivo !== undefined ? caminho_arquivo : null,
        data_emissao: data_emissao !== undefined ? data_emissao : null,
        data_vencimento: data_vencimento !== undefined ? data_vencimento : null,
        valor: valor !== undefined ? valor : null,
        status: status || 'pendente',
        observacoes: observacoes !== undefined ? observacoes : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', documento_id)
      .select()
      .single();

    if (documentoError) {
      return res.status(500).json({
        error: 'Erro ao atualizar documento',
        message: documentoError.message
      });
    }

    res.json({
      success: true,
      data: documento,
      message: 'Documento atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * DELETE /api/medicoes-mensais/:id/documentos/:documento_id
 * Remover documento de uma medição
 */
router.delete('/:id/documentos/:documento_id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id, documento_id } = req.params;

    // Verificar se o documento pertence à medição
    const { data: documentoExistente, error: checkError } = await supabaseAdmin
      .from('medicao_documentos')
      .select('id, caminho_arquivo')
      .eq('id', documento_id)
      .eq('medicao_id', id)
      .single();

    if (checkError || !documentoExistente) {
      return res.status(404).json({
        error: 'Documento não encontrado',
        message: 'O documento especificado não existe ou não pertence a esta medição'
      });
    }

    // Tentar remover arquivo do storage (best effort)
    const caminhoArquivo = documentoExistente.caminho_arquivo || '';
    const publicPrefix = '/storage/v1/object/public/arquivos-obras/';
    const publicIndex = caminhoArquivo.indexOf(publicPrefix);
    if (publicIndex !== -1) {
      const filePath = decodeURIComponent(caminhoArquivo.substring(publicIndex + publicPrefix.length));
      if (filePath) {
        await supabaseAdmin.storage.from('arquivos-obras').remove([filePath]);
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('medicao_documentos')
      .delete()
      .eq('id', documento_id)
      .eq('medicao_id', id);

    if (deleteError) {
      return res.status(500).json({
        error: 'Erro ao remover documento',
        message: deleteError.message
      });
    }

    res.json({
      success: true,
      message: 'Documento removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover documento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/medicoes-mensais/obras-sem-medicao
 * Listar obras ativas que não possuem medição para o período atual
 */
router.get('/obras-sem-medicao', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    // Calcular período atual (YYYY-MM)
    const agora = new Date();
    const periodoAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;

    // Buscar todas as obras ativas (status = 'Em Andamento')
    const { data: obrasAtivas, error: obrasError } = await supabaseAdmin
      .from('obras')
      .select('id, nome, status, cliente_id, clientes:cliente_id(id, nome)')
      .eq('status', 'Em Andamento');

    if (obrasError) {
      return res.status(500).json({
        error: 'Erro ao buscar obras',
        message: obrasError.message
      });
    }

    if (!obrasAtivas || obrasAtivas.length === 0) {
      return res.json({
        success: true,
        data: [],
        periodo: periodoAtual,
        message: 'Nenhuma obra ativa encontrada'
      });
    }

    // Buscar todas as medições do período atual
    const { data: medicoesPeriodo, error: medicoesError } = await supabaseAdmin
      .from('medicoes_mensais')
      .select('obra_id')
      .eq('periodo', periodoAtual);

    if (medicoesError) {
      return res.status(500).json({
        error: 'Erro ao buscar medições',
        message: medicoesError.message
      });
    }

    // Criar Set com IDs de obras que já têm medição
    const obrasComMedicao = new Set(
      (medicoesPeriodo || [])
        .map(m => m.obra_id)
        .filter(id => id !== null)
    );

    // Filtrar obras que não têm medição
    const obrasSemMedicao = obrasAtivas
      .filter(obra => !obrasComMedicao.has(obra.id))
      .map(obra => ({
        id: obra.id,
        nome: obra.nome,
        status: obra.status,
        cliente_id: obra.cliente_id,
        cliente: obra.clientes ? {
          id: obra.clientes.id,
          nome: obra.clientes.nome
        } : null
      }));

    res.json({
      success: true,
      data: obrasSemMedicao,
      periodo: periodoAtual,
      total: obrasSemMedicao.length,
      message: obrasSemMedicao.length > 0 
        ? `${obrasSemMedicao.length} obra(s) ativa(s) sem medição para o período ${periodoAtual}`
        : 'Todas as obras ativas possuem medição para o período atual'
    });
  } catch (error) {
    console.error('Erro ao buscar obras sem medição:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/medicoes-mensais/cliente/:cliente_id
 * Listar medições de um cliente (apenas enviadas, para aprovação)
 * Se o usuário for cliente, valida que o cliente_id corresponde ao usuário
 */
router.get('/cliente/:cliente_id', authenticateToken, async (req, res) => {
  try {
    const { cliente_id } = req.params
    const userId = req.user?.id

    // Se o usuário for cliente, verificar se o cliente_id corresponde ao usuário
    const userRole = req.user?.role?.toLowerCase() || ''
    if (userRole.includes('cliente') || req.user?.level === 1) {
      const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('clientes')
        .select('id')
        .eq('contato_usuario_id', userId)
        .eq('id', cliente_id)
        .single()

      if (clienteError || !cliente) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar estas medições'
        })
      }
    }

    // Buscar obras do cliente
    const { data: obras, error: obrasError } = await supabaseAdmin
      .from('obras')
      .select('id')
      .eq('cliente_id', cliente_id)

    if (obrasError) {
      return res.status(500).json({
        error: 'Erro ao buscar obras do cliente',
        message: obrasError.message
      })
    }

    const obraIds = obras?.map(o => o.id) || []

    if (obraIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        total: 0
      })
    }

    // Buscar medições das obras que estão enviadas (aguardando aprovação)
    const { data: medicoes, error } = await supabaseAdmin
      .from('medicoes_mensais')
      .select(`
        *,
        obras:obra_id (
          id,
          nome,
          cliente_id,
          status
        ),
        gruas:grua_id (
          id,
          name,
          modelo,
          fabricante,
          capacidade,
          status
        )
      `)
      .in('obra_id', obraIds)
      .eq('status', 'enviada')
      .order('periodo', { ascending: false })
      .order('data_medicao', { ascending: false })

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar medições',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: medicoes || [],
      total: medicoes?.length || 0
    })
  } catch (error) {
    console.error('Erro ao buscar medições do cliente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
});

export default router;

