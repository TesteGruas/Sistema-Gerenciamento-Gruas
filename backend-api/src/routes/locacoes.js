import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /api/locacoes:
 *   get:
 *     summary: Lista locações com filtros
 *     tags: [Locações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativa, finalizada, suspensa, cancelada]
 *         description: Status da locação
 *       - in: query
 *         name: tipo_equipamento
 *         schema:
 *           type: string
 *           enum: [grua, plataforma]
 *         description: Tipo do equipamento
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por número, nome do cliente ou ID do equipamento
 *     responses:
 *       200:
 *         description: Lista de locações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID da locação
 *                       numero:
 *                         type: string
 *                         description: Número da locação
 *                       cliente_id:
 *                         type: integer
 *                         description: ID do cliente
 *                       equipamento_id:
 *                         type: string
 *                         description: ID do equipamento
 *                       tipo_equipamento:
 *                         type: string
 *                         enum: [grua, plataforma]
 *                         description: Tipo do equipamento
 *                       contrato_id:
 *                         type: string
 *                         description: ID do contrato
 *                       data_inicio:
 *                         type: string
 *                         format: date
 *                         description: Data de início
 *                       data_fim:
 *                         type: string
 *                         format: date
 *                         description: Data de fim
 *                       valor_mensal:
 *                         type: number
 *                         description: Valor mensal da locação
 *                       status:
 *                         type: string
 *                         enum: [ativa, finalizada, suspensa, cancelada]
 *                         description: Status da locação
 *                       observacoes:
 *                         type: string
 *                         description: Observações
 *                       funcionario_responsavel_id:
 *                         type: integer
 *                         description: ID do funcionário responsável
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *                       cliente_nome:
 *                         type: string
 *                         description: Nome do cliente
 *                       funcionario_nome:
 *                         type: string
 *                         description: Nome do funcionário responsável
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      tipo_equipamento, 
      cliente_id,
      search 
    } = req.query;

    let query = supabase
      .from('locacoes')
      .select(`
        *,
        clientes!locacoes_cliente_id_fkey(nome),
        funcionarios!locacoes_funcionario_responsavel_id_fkey(nome)
      `);

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (tipo_equipamento && tipo_equipamento !== 'all') {
      query = query.eq('tipo_equipamento', tipo_equipamento);
    }

    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }

    if (search) {
      query = query.or(`numero.ilike.%${search}%,cliente_nome.ilike.%${search}%,equipamento_id.ilike.%${search}%`);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenação
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar locações:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    // Processar dados para incluir nomes relacionados
    const locacoesProcessadas = (data || []).map(locacao => ({
      ...locacao,
      cliente_nome: locacao.clientes?.nome || 'N/A',
      funcionario_nome: locacao.funcionarios?.nome || 'N/A'
    }));

    res.json({
      success: true,
      data: locacoesProcessadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Erro na rota de locações:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/locacoes/{id}:
 *   get:
 *     summary: Obtém uma locação específica
 *     tags: [Locações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da locação
 *     responses:
 *       200:
 *         description: Dados da locação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID da locação
 *                     numero:
 *                       type: string
 *                       description: Número da locação
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     equipamento_id:
 *                       type: string
 *                       description: ID do equipamento
 *                     tipo_equipamento:
 *                       type: string
 *                       enum: [grua, plataforma]
 *                       description: Tipo do equipamento
 *                     contrato_id:
 *                       type: string
 *                       description: ID do contrato
 *                     data_inicio:
 *                       type: string
 *                       format: date
 *                       description: Data de início
 *                     data_fim:
 *                       type: string
 *                       format: date
 *                       description: Data de fim
 *                     valor_mensal:
 *                       type: number
 *                       description: Valor mensal da locação
 *                     status:
 *                       type: string
 *                       enum: [ativa, finalizada, suspensa, cancelada]
 *                       description: Status da locação
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     funcionario_responsavel_id:
 *                       type: integer
 *                       description: ID do funcionário responsável
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     cliente_nome:
 *                       type: string
 *                       description: Nome do cliente
 *                     funcionario_nome:
 *                       type: string
 *                       description: Nome do funcionário responsável
 *       404:
 *         description: Locação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('locacoes')
      .select(`
        *,
        clientes!locacoes_cliente_id_fkey(nome),
        funcionarios!locacoes_funcionario_responsavel_id_fkey(nome)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Locação não encontrada' 
        });
      }
      console.error('Erro ao buscar locação:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    // Processar dados para incluir nomes relacionados
    const locacaoProcessada = {
      ...data,
      cliente_nome: data.clientes?.nome || 'N/A',
      funcionario_nome: data.funcionarios?.nome || 'N/A'
    };

    res.json({
      success: true,
      data: locacaoProcessada
    });

  } catch (error) {
    console.error('Erro na rota de locação específica:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/locacoes:
 *   post:
 *     summary: Cria uma nova locação
 *     tags: [Locações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *               - cliente_id
 *               - equipamento_id
 *               - tipo_equipamento
 *               - data_inicio
 *               - valor_mensal
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número da locação
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               equipamento_id:
 *                 type: string
 *                 description: ID do equipamento
 *               tipo_equipamento:
 *                 type: string
 *                 enum: [grua, plataforma]
 *                 description: Tipo do equipamento
 *               contrato_id:
 *                 type: string
 *                 description: ID do contrato
 *               data_inicio:
 *                 type: string
 *                 format: date
 *                 description: Data de início
 *               data_fim:
 *                 type: string
 *                 format: date
 *                 description: Data de fim
 *               valor_mensal:
 *                 type: number
 *                 description: Valor mensal da locação
 *               status:
 *                 type: string
 *                 enum: [ativa, finalizada, suspensa, cancelada]
 *                 default: ativa
 *                 description: Status da locação
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *               funcionario_responsavel_id:
 *                 type: integer
 *                 description: ID do funcionário responsável
 *     responses:
 *       201:
 *         description: Locação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID da locação criada
 *                     numero:
 *                       type: string
 *                       description: Número da locação
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     equipamento_id:
 *                       type: string
 *                       description: ID do equipamento
 *                     tipo_equipamento:
 *                       type: string
 *                       enum: [grua, plataforma]
 *                       description: Tipo do equipamento
 *                     contrato_id:
 *                       type: string
 *                       description: ID do contrato
 *                     data_inicio:
 *                       type: string
 *                       format: date
 *                       description: Data de início
 *                     data_fim:
 *                       type: string
 *                       format: date
 *                       description: Data de fim
 *                     valor_mensal:
 *                       type: number
 *                       description: Valor mensal da locação
 *                     status:
 *                       type: string
 *                       enum: [ativa, finalizada, suspensa, cancelada]
 *                       description: Status da locação
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     funcionario_responsavel_id:
 *                       type: integer
 *                       description: ID do funcionário responsável
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *       400:
 *         description: Dados inválidos ou locação já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const {
      numero,
      cliente_id,
      equipamento_id,
      tipo_equipamento,
      contrato_id,
      data_inicio,
      data_fim,
      valor_mensal,
      status = 'ativa',
      observacoes,
      funcionario_responsavel_id
    } = req.body;

    // Validações básicas
    if (!numero || !cliente_id || !equipamento_id || !tipo_equipamento || !data_inicio || !valor_mensal) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: numero, cliente_id, equipamento_id, tipo_equipamento, data_inicio, valor_mensal'
      });
    }

    // Verificar se o número já existe
    const { data: existingLocacao } = await supabase
      .from('locacoes')
      .select('id')
      .eq('numero', numero)
      .single();

    if (existingLocacao) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma locação com este número'
      });
    }

    // Verificar se o cliente existe
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', cliente_id)
      .single();

    if (!cliente) {
      return res.status(400).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    // Verificar se o equipamento existe
    if (equipamento_id && tipo_equipamento === 'grua') {
      const { data: equipamento, error: equipamentoError } = await supabase
        .from('gruas')
        .select('id')
        .eq('id', equipamento_id)
        .single();

      if (equipamentoError || !equipamento) {
        return res.status(400).json({
          success: false,
          message: 'Equipamento não encontrado'
        });
      }
    }

    // Criar a locação
    const { data, error } = await supabase
      .from('locacoes')
      .insert({
        numero,
        cliente_id,
        equipamento_id,
        tipo_equipamento,
        contrato_id,
        data_inicio,
        data_fim,
        valor_mensal,
        status,
        observacoes,
        funcionario_responsavel_id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar locação:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Locação criada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de criação de locação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/locacoes/{id}:
 *   put:
 *     summary: Atualiza uma locação existente
 *     tags: [Locações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da locação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número da locação
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               equipamento_id:
 *                 type: string
 *                 description: ID do equipamento
 *               tipo_equipamento:
 *                 type: string
 *                 enum: [grua, plataforma]
 *                 description: Tipo do equipamento
 *               contrato_id:
 *                 type: string
 *                 description: ID do contrato
 *               data_inicio:
 *                 type: string
 *                 format: date
 *                 description: Data de início
 *               data_fim:
 *                 type: string
 *                 format: date
 *                 description: Data de fim
 *               valor_mensal:
 *                 type: number
 *                 description: Valor mensal da locação
 *               status:
 *                 type: string
 *                 enum: [ativa, finalizada, suspensa, cancelada]
 *                 description: Status da locação
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *               funcionario_responsavel_id:
 *                 type: integer
 *                 description: ID do funcionário responsável
 *     responses:
 *       200:
 *         description: Locação atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID da locação
 *                     numero:
 *                       type: string
 *                       description: Número da locação
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     equipamento_id:
 *                       type: string
 *                       description: ID do equipamento
 *                     tipo_equipamento:
 *                       type: string
 *                       enum: [grua, plataforma]
 *                       description: Tipo do equipamento
 *                     contrato_id:
 *                       type: string
 *                       description: ID do contrato
 *                     data_inicio:
 *                       type: string
 *                       format: date
 *                       description: Data de início
 *                     data_fim:
 *                       type: string
 *                       format: date
 *                       description: Data de fim
 *                     valor_mensal:
 *                       type: number
 *                       description: Valor mensal da locação
 *                     status:
 *                       type: string
 *                       enum: [ativa, finalizada, suspensa, cancelada]
 *                       description: Status da locação
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     funcionario_responsavel_id:
 *                       type: integer
 *                       description: ID do funcionário responsável
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
 *       400:
 *         description: Dados inválidos ou número já existe
 *       404:
 *         description: Locação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.created_at;

    // Verificar se a locação existe
    const { data: existingLocacao } = await supabase
      .from('locacoes')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingLocacao) {
      return res.status(404).json({
        success: false,
        message: 'Locação não encontrada'
      });
    }

    // Se estiver atualizando o número, verificar se não existe outro com o mesmo número
    if (updateData.numero) {
      const { data: duplicateLocacao } = await supabase
        .from('locacoes')
        .select('id')
        .eq('numero', updateData.numero)
        .neq('id', id)
        .single();

      if (duplicateLocacao) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma locação com este número'
        });
      }
    }

    // Atualizar a locação
    const { data, error } = await supabase
      .from('locacoes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar locação:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Locação atualizada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de atualização de locação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/locacoes/{id}:
 *   delete:
 *     summary: Exclui uma locação
 *     tags: [Locações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da locação
 *     responses:
 *       200:
 *         description: Locação excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       400:
 *         description: Não é possível excluir locação com medições finalizadas
 *       404:
 *         description: Locação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a locação existe
    const { data: existingLocacao } = await supabase
      .from('locacoes')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingLocacao) {
      return res.status(404).json({
        success: false,
        message: 'Locação não encontrada'
      });
    }

    // Verificar se há medições finalizadas
    const { data: medicoes } = await supabase
      .from('medicoes')
      .select('id')
      .eq('locacao_id', id)
      .eq('status', 'finalizada');

    if (medicoes && medicoes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir locação com medições finalizadas'
      });
    }

    // Excluir a locação (cascade irá excluir medições e aditivos)
    const { error } = await supabase
      .from('locacoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir locação:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Locação excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de exclusão de locação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/locacoes/stats/overview:
 *   get:
 *     summary: Obtém estatísticas das locações
 *     tags: [Locações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas das locações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_locacoes_ativas:
 *                       type: integer
 *                       description: Total de locações ativas
 *                     gruas_locadas:
 *                       type: integer
 *                       description: Quantidade de gruas locadas
 *                     plataformas_locadas:
 *                       type: integer
 *                       description: Quantidade de plataformas locadas
 *                     receita_mensal_atual:
 *                       type: number
 *                       description: Receita mensal atual
 *                     receita_por_periodo:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           periodo:
 *                             type: string
 *                             description: Período (mês/ano)
 *                           receita_total:
 *                             type: number
 *                             description: Receita total do período
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats/overview', async (req, res) => {
  try {
    // Buscar estatísticas das locações ativas
    const { data: locacoesAtivas, error: errorAtivas } = await supabase
      .from('view_locacoes_ativas')
      .select('*');

    if (errorAtivas) {
      console.error('Erro ao buscar locações ativas:', errorAtivas);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: errorAtivas.message 
      });
    }

    // Buscar receita por período
    const { data: receitaPeriodo, error: errorReceita } = await supabase
      .from('view_receita_periodo')
      .select('*')
      .limit(12)
      .order('periodo', { ascending: false });

    if (errorReceita) {
      console.error('Erro ao buscar receita por período:', errorReceita);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: errorReceita.message 
      });
    }

    // Calcular estatísticas
    const stats = {
      total_locacoes_ativas: locacoesAtivas?.length || 0,
      gruas_locadas: locacoesAtivas?.filter(l => l.tipo_equipamento === 'grua').length || 0,
      plataformas_locadas: locacoesAtivas?.filter(l => l.tipo_equipamento === 'plataforma').length || 0,
      receita_mensal_atual: receitaPeriodo?.[0]?.receita_total || 0,
      receita_por_periodo: receitaPeriodo || []
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erro na rota de estatísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;
