import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /api/aditivos:
 *   get:
 *     summary: Lista aditivos com filtros opcionais
 *     tags: [Aditivos]
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
 *           enum: [pendente, aprovado, rejeitado]
 *         description: Filtrar por status
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
 *       - in: query
 *         name: locacao_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da locação
 *       - in: query
 *         name: medicao_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da medição
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por descrição
 *     responses:
 *       200:
 *         description: Lista de aditivos
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
 *                         description: ID do aditivo
 *                       locacao_id:
 *                         type: integer
 *                         description: ID da locação
 *                       medicao_id:
 *                         type: integer
 *                         description: ID da medição
 *                       tipo:
 *                         type: string
 *                         description: Tipo do aditivo
 *                       descricao:
 *                         type: string
 *                         description: Descrição do aditivo
 *                       valor:
 *                         type: number
 *                         description: Valor do aditivo
 *                       data_aplicacao:
 *                         type: string
 *                         format: date
 *                         description: Data de aplicação
 *                       status:
 *                         type: string
 *                         enum: [pendente, aprovado, rejeitado]
 *                         description: Status do aditivo
 *                       observacoes:
 *                         type: string
 *                         description: Observações
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de atualização
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
 *                             type: string
 *                           tipo_equipamento:
 *                             type: string
 *                           clientes:
 *                             type: object
 *                             properties:
 *                               nome:
 *                                 type: string
 *                       medicoes:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           numero:
 *                             type: string
 *                           periodo:
 *                             type: string
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
      tipo,
      locacao_id,
      medicao_id,
      search 
    } = req.query;

    let query = supabase
      .from('aditivos')
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
        medicoes(
          id,
          numero,
          periodo
        )
      `);

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (tipo && tipo !== 'all') {
      query = query.eq('tipo', tipo);
    }

    if (locacao_id) {
      query = query.eq('locacao_id', locacao_id);
    }

    if (medicao_id) {
      query = query.eq('medicao_id', medicao_id);
    }

    if (search) {
      query = query.or(`descricao.ilike.%${search}%`);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenação
    query = query.order('data_aplicacao', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar aditivos:', error);
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
    console.error('Erro na rota de aditivos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/aditivos/{id}:
 *   get:
 *     summary: Obtém um aditivo específico
 *     tags: [Aditivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do aditivo
 *     responses:
 *       200:
 *         description: Dados do aditivo
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
 *                       description: ID do aditivo
 *                     locacao_id:
 *                       type: integer
 *                       description: ID da locação
 *                     medicao_id:
 *                       type: integer
 *                       description: ID da medição
 *                     tipo:
 *                       type: string
 *                       description: Tipo do aditivo
 *                     descricao:
 *                       type: string
 *                       description: Descrição do aditivo
 *                     valor:
 *                       type: number
 *                       description: Valor do aditivo
 *                     data_aplicacao:
 *                       type: string
 *                       format: date
 *                       description: Data de aplicação
 *                     status:
 *                       type: string
 *                       enum: [pendente, aprovado, rejeitado]
 *                       description: Status do aditivo
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
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
 *                           type: string
 *                         tipo_equipamento:
 *                           type: string
 *                         clientes:
 *                           type: object
 *                           properties:
 *                             nome:
 *                               type: string
 *                     medicoes:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         numero:
 *                           type: string
 *                         periodo:
 *                           type: string
 *       404:
 *         description: Aditivo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('aditivos')
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
        medicoes(
          id,
          numero,
          periodo
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Aditivo não encontrado' 
        });
      }
      console.error('Erro ao buscar aditivo:', error);
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
    console.error('Erro na rota de aditivo específico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/aditivos:
 *   post:
 *     summary: Cria um novo aditivo
 *     tags: [Aditivos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locacao_id
 *               - tipo
 *               - descricao
 *               - valor
 *               - data_aplicacao
 *             properties:
 *               locacao_id:
 *                 type: integer
 *                 description: ID da locação
 *               medicao_id:
 *                 type: integer
 *                 description: ID da medição (opcional)
 *               tipo:
 *                 type: string
 *                 description: Tipo do aditivo
 *               descricao:
 *                 type: string
 *                 description: Descrição do aditivo
 *               valor:
 *                 type: number
 *                 description: Valor do aditivo
 *               data_aplicacao:
 *                 type: string
 *                 format: date
 *                 description: Data de aplicação
 *               status:
 *                 type: string
 *                 enum: [pendente, aprovado, rejeitado]
 *                 default: pendente
 *                 description: Status do aditivo
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       201:
 *         description: Aditivo criado com sucesso
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
 *                   description: Dados do aditivo criado
 *       400:
 *         description: Dados inválidos ou locação/medição não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const {
      locacao_id,
      medicao_id,
      tipo,
      descricao,
      valor,
      data_aplicacao,
      status = 'pendente',
      observacoes
    } = req.body;

    // Validações básicas
    if (!locacao_id || !tipo || !descricao || !valor || !data_aplicacao) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: locacao_id, tipo, descricao, valor, data_aplicacao'
      });
    }

    // Verificar se a locação existe
    const { data: locacao } = await supabase
      .from('locacoes')
      .select('id')
      .eq('id', locacao_id)
      .single();

    if (!locacao) {
      return res.status(400).json({
        success: false,
        message: 'Locação não encontrada'
      });
    }

    // Se medicao_id foi fornecido, verificar se existe
    if (medicao_id) {
      const { data: medicao } = await supabase
        .from('medicoes')
        .select('id, locacao_id')
        .eq('id', medicao_id)
        .single();

      if (!medicao) {
        return res.status(400).json({
          success: false,
          message: 'Medição não encontrada'
        });
      }

      // Verificar se a medição pertence à locação
      if (medicao.locacao_id !== parseInt(locacao_id)) {
        return res.status(400).json({
          success: false,
          message: 'A medição não pertence à locação especificada'
        });
      }
    }

    // Criar o aditivo
    const { data, error } = await supabase
      .from('aditivos')
      .insert({
        locacao_id,
        medicao_id,
        tipo,
        descricao,
        valor,
        data_aplicacao,
        status,
        observacoes
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar aditivo:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    // Se o aditivo foi associado a uma medição, recalcular o valor_total da medição
    if (medicao_id) {
      await recalculateMedicaoTotal(medicao_id);
    }

    res.status(201).json({
      success: true,
      message: 'Aditivo criado com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de criação de aditivo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/aditivos/{id}:
 *   put:
 *     summary: Atualiza um aditivo existente
 *     tags: [Aditivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do aditivo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               locacao_id:
 *                 type: integer
 *                 description: ID da locação
 *               medicao_id:
 *                 type: integer
 *                 description: ID da medição
 *               tipo:
 *                 type: string
 *                 description: Tipo do aditivo
 *               descricao:
 *                 type: string
 *                 description: Descrição do aditivo
 *               valor:
 *                 type: number
 *                 description: Valor do aditivo
 *               data_aplicacao:
 *                 type: string
 *                 format: date
 *                 description: Data de aplicação
 *               status:
 *                 type: string
 *                 enum: [pendente, aprovado, rejeitado]
 *                 description: Status do aditivo
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       200:
 *         description: Aditivo atualizado com sucesso
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
 *                   description: Dados do aditivo atualizado
 *       404:
 *         description: Aditivo não encontrado
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

    // Verificar se o aditivo existe
    const { data: existingAditivo } = await supabase
      .from('aditivos')
      .select('id, medicao_id')
      .eq('id', id)
      .single();

    if (!existingAditivo) {
      return res.status(404).json({
        success: false,
        message: 'Aditivo não encontrado'
      });
    }

    // Atualizar o aditivo
    const { data, error } = await supabase
      .from('aditivos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar aditivo:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    // Se o aditivo está associado a uma medição, recalcular o valor_total
    if (existingAditivo.medicao_id) {
      await recalculateMedicaoTotal(existingAditivo.medicao_id);
    }

    res.json({
      success: true,
      message: 'Aditivo atualizado com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de atualização de aditivo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/aditivos/{id}:
 *   delete:
 *     summary: Exclui um aditivo
 *     tags: [Aditivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do aditivo
 *     responses:
 *       200:
 *         description: Aditivo excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Aditivo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o aditivo existe
    const { data: existingAditivo } = await supabase
      .from('aditivos')
      .select('id, medicao_id')
      .eq('id', id)
      .single();

    if (!existingAditivo) {
      return res.status(404).json({
        success: false,
        message: 'Aditivo não encontrado'
      });
    }

    // Excluir o aditivo
    const { error } = await supabase
      .from('aditivos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir aditivo:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    // Se o aditivo estava associado a uma medição, recalcular o valor_total
    if (existingAditivo.medicao_id) {
      await recalculateMedicaoTotal(existingAditivo.medicao_id);
    }

    res.json({
      success: true,
      message: 'Aditivo excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de exclusão de aditivo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/aditivos/{id}/aprovar:
 *   post:
 *     summary: Aprova um aditivo
 *     tags: [Aditivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do aditivo
 *     responses:
 *       200:
 *         description: Aditivo aprovado com sucesso
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
 *                   description: Dados do aditivo aprovado
 *       400:
 *         description: Aditivo já está aprovado
 *       404:
 *         description: Aditivo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o aditivo existe
    const { data: existingAditivo } = await supabase
      .from('aditivos')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingAditivo) {
      return res.status(404).json({
        success: false,
        message: 'Aditivo não encontrado'
      });
    }

    if (existingAditivo.status === 'aprovado') {
      return res.status(400).json({
        success: false,
        message: 'Aditivo já está aprovado'
      });
    }

    // Aprovar o aditivo
    const { data, error } = await supabase
      .from('aditivos')
      .update({ status: 'aprovado' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao aprovar aditivo:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Aditivo aprovado com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de aprovação de aditivo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/aditivos/{id}/rejeitar:
 *   post:
 *     summary: Rejeita um aditivo
 *     tags: [Aditivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do aditivo
 *     responses:
 *       200:
 *         description: Aditivo rejeitado com sucesso
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
 *                   description: Dados do aditivo rejeitado
 *       400:
 *         description: Aditivo já está rejeitado
 *       404:
 *         description: Aditivo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/rejeitar', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o aditivo existe
    const { data: existingAditivo } = await supabase
      .from('aditivos')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingAditivo) {
      return res.status(404).json({
        success: false,
        message: 'Aditivo não encontrado'
      });
    }

    if (existingAditivo.status === 'rejeitado') {
      return res.status(400).json({
        success: false,
        message: 'Aditivo já está rejeitado'
      });
    }

    // Rejeitar o aditivo
    const { data, error } = await supabase
      .from('aditivos')
      .update({ status: 'rejeitado' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao rejeitar aditivo:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Aditivo rejeitado com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de rejeição de aditivo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Função auxiliar para recalcular o valor total de uma medição
async function recalculateMedicaoTotal(medicaoId) {
  try {
    // Buscar a medição
    const { data: medicao } = await supabase
      .from('medicoes')
      .select('valor_base')
      .eq('id', medicaoId)
      .single();

    if (!medicao) return;

    // Buscar a soma dos aditivos aprovados
    const { data: aditivos } = await supabase
      .from('aditivos')
      .select('valor')
      .eq('medicao_id', medicaoId)
      .eq('status', 'aprovado');

    const valorAditivos = aditivos?.reduce((sum, aditivo) => sum + parseFloat(aditivo.valor), 0) || 0;
    const valorTotal = parseFloat(medicao.valor_base) + valorAditivos;

    // Atualizar a medição
    await supabase
      .from('medicoes')
      .update({ 
        valor_aditivos: valorAditivos,
        valor_total: valorTotal 
      })
      .eq('id', medicaoId);

  } catch (error) {
    console.error('Erro ao recalcular valor total da medição:', error);
  }
}

export default router;
