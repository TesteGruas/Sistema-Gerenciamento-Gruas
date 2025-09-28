import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /api/medicoes:
 *   get:
 *     summary: Lista medições com filtros opcionais
 *     tags: [Medições]
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
 *         description: Limite de registros por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, aprovada, finalizada, cancelada]
 *         description: Status da medição
 *       - in: query
 *         name: locacao_id
 *         schema:
 *           type: integer
 *         description: ID da locação
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *         description: Período da medição
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por número ou período
 *     responses:
 *       200:
 *         description: Lista de medições
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
 *                         description: ID da medição
 *                       numero:
 *                         type: string
 *                         description: Número da medição
 *                       locacao_id:
 *                         type: integer
 *                         description: ID da locação
 *                       periodo:
 *                         type: string
 *                         description: Período da medição
 *                       data_medicao:
 *                         type: string
 *                         format: date
 *                         description: Data da medição
 *                       valor_base:
 *                         type: number
 *                         description: Valor base da medição
 *                       valor_aditivos:
 *                         type: number
 *                         description: Valor dos aditivos
 *                       valor_total:
 *                         type: number
 *                         description: Valor total da medição
 *                       status:
 *                         type: string
 *                         description: Status da medição
 *                       observacoes:
 *                         type: string
 *                         description: Observações
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *                       locacoes:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           numero:
 *                             type: string
 *                           cliente_id:
 *                             type: integer
 *                           equipamento_id:
 *                             type: integer
 *                           tipo_equipamento:
 *                             type: string
 *                           clientes:
 *                             type: object
 *                             properties:
 *                               nome:
 *                                 type: string
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
      locacao_id,
      periodo,
      search 
    } = req.query;

    let query = supabase
      .from('medicoes')
      .select(`
        *,
        locacoes!inner(
          id,
          numero,
          cliente_id,
          equipamento_id,
          tipo_equipamento,
          clientes!inner(nome)
        )
      `);

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (locacao_id) {
      query = query.eq('locacao_id', locacao_id);
    }

    if (periodo) {
      query = query.eq('periodo', periodo);
    }

    if (search) {
      query = query.or(`numero.ilike.%${search}%,periodo.ilike.%${search}%`);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenação
    query = query.order('data_medicao', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar medições:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

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
    console.error('Erro na rota de medições:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/medicoes/{id}:
 *   get:
 *     summary: Obtém uma medição específica por ID
 *     tags: [Medições]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da medição
 *     responses:
 *       200:
 *         description: Dados da medição
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
 *                       description: ID da medição
 *                     numero:
 *                       type: string
 *                       description: Número da medição
 *                     locacao_id:
 *                       type: integer
 *                       description: ID da locação
 *                     periodo:
 *                       type: string
 *                       description: Período da medição
 *                     data_medicao:
 *                       type: string
 *                       format: date
 *                       description: Data da medição
 *                     valor_base:
 *                       type: number
 *                       description: Valor base da medição
 *                     valor_aditivos:
 *                       type: number
 *                       description: Valor dos aditivos
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da medição
 *                     status:
 *                       type: string
 *                       description: Status da medição
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     locacoes:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         numero:
 *                           type: string
 *                         cliente_id:
 *                           type: integer
 *                         equipamento_id:
 *                           type: integer
 *                         tipo_equipamento:
 *                           type: string
 *                         clientes:
 *                           type: object
 *                           properties:
 *                             nome:
 *                               type: string
 *                     aditivos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Aditivos associados à medição
 *       404:
 *         description: Medição não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('medicoes')
      .select(`
        *,
        locacoes!inner(
          id,
          numero,
          cliente_id,
          equipamento_id,
          tipo_equipamento,
          clientes!inner(nome)
        ),
        aditivos(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Medição não encontrada' 
        });
      }
      console.error('Erro ao buscar medição:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Erro na rota de medição específica:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/medicoes:
 *   post:
 *     summary: Cria uma nova medição
 *     tags: [Medições]
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
 *               - locacao_id
 *               - periodo
 *               - data_medicao
 *               - valor_base
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número da medição
 *               locacao_id:
 *                 type: integer
 *                 description: ID da locação
 *               periodo:
 *                 type: string
 *                 description: Período da medição
 *               data_medicao:
 *                 type: string
 *                 format: date
 *                 description: Data da medição (YYYY-MM-DD)
 *               valor_base:
 *                 type: number
 *                 description: Valor base da medição
 *               valor_aditivos:
 *                 type: number
 *                 default: 0
 *                 description: Valor dos aditivos
 *               status:
 *                 type: string
 *                 enum: [pendente, aprovada, finalizada, cancelada]
 *                 default: pendente
 *                 description: Status da medição
 *               observacoes:
 *                 type: string
 *                 description: Observações da medição
 *     responses:
 *       201:
 *         description: Medição criada com sucesso
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
 *                   description: Dados da medição criada
 *       400:
 *         description: Dados inválidos ou medição já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const {
      numero,
      locacao_id,
      periodo,
      data_medicao,
      valor_base,
      valor_aditivos = 0,
      status = 'pendente',
      observacoes
    } = req.body;

    // Validações básicas
    if (!numero || !locacao_id || !periodo || !data_medicao || !valor_base) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: numero, locacao_id, periodo, data_medicao, valor_base'
      });
    }

    // Verificar se o número já existe
    const { data: existingMedicao } = await supabase
      .from('medicoes')
      .select('id')
      .eq('numero', numero)
      .single();

    if (existingMedicao) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma medição com este número'
      });
    }

    // Verificar se a locação existe
    const { data: locacao } = await supabase
      .from('locacoes')
      .select('id, valor_mensal')
      .eq('id', locacao_id)
      .single();

    if (!locacao) {
      return res.status(400).json({
        success: false,
        message: 'Locação não encontrada'
      });
    }

    // Verificar se já existe medição para este período nesta locação
    const { data: existingPeriodo } = await supabase
      .from('medicoes')
      .select('id')
      .eq('locacao_id', locacao_id)
      .eq('periodo', periodo)
      .single();

    if (existingPeriodo) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma medição para este período nesta locação'
      });
    }

    // Calcular valor total
    const valor_total = parseFloat(valor_base) + parseFloat(valor_aditivos);

    // Criar a medição
    const { data, error } = await supabase
      .from('medicoes')
      .insert({
        numero,
        locacao_id,
        periodo,
        data_medicao,
        valor_base,
        valor_aditivos,
        valor_total,
        status,
        observacoes
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar medição:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Medição criada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de criação de medição:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/medicoes/{id}:
 *   put:
 *     summary: Atualiza uma medição existente
 *     tags: [Medições]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da medição
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número da medição
 *               locacao_id:
 *                 type: integer
 *                 description: ID da locação
 *               periodo:
 *                 type: string
 *                 description: Período da medição
 *               data_medicao:
 *                 type: string
 *                 format: date
 *                 description: Data da medição (YYYY-MM-DD)
 *               valor_base:
 *                 type: number
 *                 description: Valor base da medição
 *               valor_aditivos:
 *                 type: number
 *                 description: Valor dos aditivos
 *               status:
 *                 type: string
 *                 enum: [pendente, aprovada, finalizada, cancelada]
 *                 description: Status da medição
 *               observacoes:
 *                 type: string
 *                 description: Observações da medição
 *     responses:
 *       200:
 *         description: Medição atualizada com sucesso
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
 *                   description: Dados atualizados da medição
 *       400:
 *         description: Dados inválidos ou medição finalizada
 *       404:
 *         description: Medição não encontrada
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

    // Verificar se a medição existe
    const { data: existingMedicao } = await supabase
      .from('medicoes')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingMedicao) {
      return res.status(404).json({
        success: false,
        message: 'Medição não encontrada'
      });
    }

    // Não permitir edição de medições finalizadas
    if (existingMedicao.status === 'finalizada') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível editar medição finalizada'
      });
    }

    // Se estiver atualizando o número, verificar se não existe outro com o mesmo número
    if (updateData.numero) {
      const { data: duplicateMedicao } = await supabase
        .from('medicoes')
        .select('id')
        .eq('numero', updateData.numero)
        .neq('id', id)
        .single();

      if (duplicateMedicao) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma medição com este número'
        });
      }
    }

    // Recalcular valor total se necessário
    if (updateData.valor_base !== undefined || updateData.valor_aditivos !== undefined) {
      const valor_base = updateData.valor_base || existingMedicao.valor_base;
      const valor_aditivos = updateData.valor_aditivos || existingMedicao.valor_aditivos;
      updateData.valor_total = parseFloat(valor_base) + parseFloat(valor_aditivos);
    }

    // Atualizar a medição
    const { data, error } = await supabase
      .from('medicoes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar medição:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Medição atualizada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de atualização de medição:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/medicoes/{id}:
 *   delete:
 *     summary: Exclui uma medição
 *     tags: [Medições]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da medição
 *     responses:
 *       200:
 *         description: Medição excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Não é possível excluir medição finalizada
 *       404:
 *         description: Medição não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a medição existe
    const { data: existingMedicao } = await supabase
      .from('medicoes')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingMedicao) {
      return res.status(404).json({
        success: false,
        message: 'Medição não encontrada'
      });
    }

    // Não permitir exclusão de medições finalizadas
    if (existingMedicao.status === 'finalizada') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir medição finalizada'
      });
    }

    // Excluir a medição
    const { error } = await supabase
      .from('medicoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir medição:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Medição excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de exclusão de medição:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/medicoes/{id}/finalizar:
 *   post:
 *     summary: Finaliza uma medição
 *     tags: [Medições]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da medição
 *     responses:
 *       200:
 *         description: Medição finalizada com sucesso
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
 *                   description: Dados da medição finalizada
 *       400:
 *         description: Medição já está finalizada
 *       404:
 *         description: Medição não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a medição existe
    const { data: existingMedicao } = await supabase
      .from('medicoes')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingMedicao) {
      return res.status(404).json({
        success: false,
        message: 'Medição não encontrada'
      });
    }

    if (existingMedicao.status === 'finalizada') {
      return res.status(400).json({
        success: false,
        message: 'Medição já está finalizada'
      });
    }

    // Finalizar a medição
    const { data, error } = await supabase
      .from('medicoes')
      .update({ status: 'finalizada' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao finalizar medição:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Medição finalizada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de finalização de medição:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;
