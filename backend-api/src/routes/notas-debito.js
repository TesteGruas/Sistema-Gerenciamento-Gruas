import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /api/notas-debito:
 *   get:
 *     summary: Lista notas de débito com filtros opcionais
 *     tags: [Notas de Débito]
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
 *           enum: [pendente, emitida, paga, cancelada]
 *         description: Status da nota de débito
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [multa, juros, correcao, outros]
 *         description: Tipo da nota de débito
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *       - in: query
 *         name: locacao_id
 *         schema:
 *           type: integer
 *         description: ID da locação
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por número ou descrição
 *     responses:
 *       200:
 *         description: Lista de notas de débito
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
 *                         description: ID da nota de débito
 *                       numero:
 *                         type: string
 *                         description: Número da nota de débito
 *                       cliente_id:
 *                         type: integer
 *                         description: ID do cliente
 *                       locacao_id:
 *                         type: integer
 *                         description: ID da locação
 *                       data_emissao:
 *                         type: string
 *                         format: date
 *                         description: Data de emissão
 *                       valor:
 *                         type: number
 *                         description: Valor da nota de débito
 *                       descricao:
 *                         type: string
 *                         description: Descrição da nota de débito
 *                       tipo:
 *                         type: string
 *                         description: Tipo da nota de débito
 *                       status:
 *                         type: string
 *                         description: Status da nota de débito
 *                       observacoes:
 *                         type: string
 *                         description: Observações
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *                       clientes:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           cnpj:
 *                             type: string
 *                       locacoes:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           numero:
 *                             type: string
 *                           equipamento_id:
 *                             type: integer
 *                           tipo_equipamento:
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
      cliente_id,
      locacao_id,
      search 
    } = req.query;

    let query = supabase
      .from('notas_debito')
      .select(`
        *,
        clientes!inner(nome, cnpj),
        locacoes(
          id,
          numero,
          equipamento_id,
          tipo_equipamento
        )
      `);

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (tipo && tipo !== 'all') {
      query = query.eq('tipo', tipo);
    }

    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }

    if (locacao_id) {
      query = query.eq('locacao_id', locacao_id);
    }

    if (search) {
      query = query.or(`numero.ilike.%${search}%,descricao.ilike.%${search}%`);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenação
    query = query.order('data_emissao', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar notas de débito:', error);
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
    console.error('Erro na rota de notas de débito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notas-debito/{id}:
 *   get:
 *     summary: Obtém uma nota de débito específica por ID
 *     tags: [Notas de Débito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota de débito
 *     responses:
 *       200:
 *         description: Dados da nota de débito
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
 *                       description: ID da nota de débito
 *                     numero:
 *                       type: string
 *                       description: Número da nota de débito
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     locacao_id:
 *                       type: integer
 *                       description: ID da locação
 *                     data_emissao:
 *                       type: string
 *                       format: date
 *                       description: Data de emissão
 *                     valor:
 *                       type: number
 *                       description: Valor da nota de débito
 *                     descricao:
 *                       type: string
 *                       description: Descrição da nota de débito
 *                     tipo:
 *                       type: string
 *                       description: Tipo da nota de débito
 *                     status:
 *                       type: string
 *                       description: Status da nota de débito
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     clientes:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         cnpj:
 *                           type: string
 *                         contato:
 *                           type: string
 *                         telefone:
 *                           type: string
 *                         email:
 *                           type: string
 *                     locacoes:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         numero:
 *                           type: string
 *                         equipamento_id:
 *                           type: integer
 *                         tipo_equipamento:
 *                           type: string
 *       404:
 *         description: Nota de débito não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notas_debito')
      .select(`
        *,
        clientes!inner(nome, cnpj, contato, telefone, email),
        locacoes(
          id,
          numero,
          equipamento_id,
          tipo_equipamento
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Nota de débito não encontrada' 
        });
      }
      console.error('Erro ao buscar nota de débito:', error);
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
    console.error('Erro na rota de nota de débito específica:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notas-debito:
 *   post:
 *     summary: Cria uma nova nota de débito
 *     tags: [Notas de Débito]
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
 *               - data_emissao
 *               - valor
 *               - descricao
 *               - tipo
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número da nota de débito
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               locacao_id:
 *                 type: integer
 *                 description: ID da locação (opcional)
 *               data_emissao:
 *                 type: string
 *                 format: date
 *                 description: Data de emissão (YYYY-MM-DD)
 *               valor:
 *                 type: number
 *                 description: Valor da nota de débito
 *               descricao:
 *                 type: string
 *                 description: Descrição da nota de débito
 *               tipo:
 *                 type: string
 *                 enum: [multa, juros, correcao, outros]
 *                 description: Tipo da nota de débito
 *               status:
 *                 type: string
 *                 enum: [pendente, emitida, paga, cancelada]
 *                 default: pendente
 *                 description: Status da nota de débito
 *               observacoes:
 *                 type: string
 *                 description: Observações da nota de débito
 *     responses:
 *       201:
 *         description: Nota de débito criada com sucesso
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
 *                   description: Dados da nota de débito criada
 *       400:
 *         description: Dados inválidos ou nota já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const {
      numero,
      cliente_id,
      locacao_id,
      data_emissao,
      valor,
      descricao,
      tipo,
      status = 'pendente',
      observacoes
    } = req.body;

    // Validações básicas
    if (!numero || !cliente_id || !data_emissao || !valor || !descricao || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: numero, cliente_id, data_emissao, valor, descricao, tipo'
      });
    }

    // Verificar se o número já existe
    const { data: existingNota } = await supabase
      .from('notas_debito')
      .select('id')
      .eq('numero', numero)
      .single();

    if (existingNota) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma nota de débito com este número'
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

    // Se locacao_id foi fornecido, verificar se existe
    if (locacao_id) {
      const { data: locacao } = await supabase
        .from('locacoes')
        .select('id, cliente_id')
        .eq('id', locacao_id)
        .single();

      if (!locacao) {
        return res.status(400).json({
          success: false,
          message: 'Locação não encontrada'
        });
      }

      // Verificar se a locação pertence ao cliente
      if (locacao.cliente_id !== parseInt(cliente_id)) {
        return res.status(400).json({
          success: false,
          message: 'A locação não pertence ao cliente especificado'
        });
      }
    }

    // Criar a nota de débito
    const { data, error } = await supabase
      .from('notas_debito')
      .insert({
        numero,
        cliente_id,
        locacao_id,
        data_emissao,
        valor,
        descricao,
        tipo,
        status,
        observacoes
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar nota de débito:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Nota de débito criada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de criação de nota de débito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notas-debito/{id}:
 *   put:
 *     summary: Atualiza uma nota de débito existente
 *     tags: [Notas de Débito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota de débito
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número da nota de débito
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               locacao_id:
 *                 type: integer
 *                 description: ID da locação
 *               data_emissao:
 *                 type: string
 *                 format: date
 *                 description: Data de emissão (YYYY-MM-DD)
 *               valor:
 *                 type: number
 *                 description: Valor da nota de débito
 *               descricao:
 *                 type: string
 *                 description: Descrição da nota de débito
 *               tipo:
 *                 type: string
 *                 enum: [multa, juros, correcao, outros]
 *                 description: Tipo da nota de débito
 *               status:
 *                 type: string
 *                 enum: [pendente, emitida, paga, cancelada]
 *                 description: Status da nota de débito
 *               observacoes:
 *                 type: string
 *                 description: Observações da nota de débito
 *     responses:
 *       200:
 *         description: Nota de débito atualizada com sucesso
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
 *                   description: Dados atualizados da nota de débito
 *       400:
 *         description: Dados inválidos ou nota paga
 *       404:
 *         description: Nota de débito não encontrada
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

    // Verificar se a nota de débito existe
    const { data: existingNota } = await supabase
      .from('notas_debito')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingNota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de débito não encontrada'
      });
    }

    // Não permitir edição de notas de débito pagas
    if (existingNota.status === 'paga') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível editar nota de débito paga'
      });
    }

    // Se estiver atualizando o número, verificar se não existe outro com o mesmo número
    if (updateData.numero) {
      const { data: duplicateNota } = await supabase
        .from('notas_debito')
        .select('id')
        .eq('numero', updateData.numero)
        .neq('id', id)
        .single();

      if (duplicateNota) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma nota de débito com este número'
        });
      }
    }

    // Atualizar a nota de débito
    const { data, error } = await supabase
      .from('notas_debito')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar nota de débito:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Nota de débito atualizada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de atualização de nota de débito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notas-debito/{id}:
 *   delete:
 *     summary: Exclui uma nota de débito
 *     tags: [Notas de Débito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota de débito
 *     responses:
 *       200:
 *         description: Nota de débito excluída com sucesso
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
 *         description: Não é possível excluir nota paga
 *       404:
 *         description: Nota de débito não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a nota de débito existe
    const { data: existingNota } = await supabase
      .from('notas_debito')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingNota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de débito não encontrada'
      });
    }

    // Não permitir exclusão de notas de débito pagas
    if (existingNota.status === 'paga') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir nota de débito paga'
      });
    }

    // Excluir a nota de débito
    const { error } = await supabase
      .from('notas_debito')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir nota de débito:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Nota de débito excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de exclusão de nota de débito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notas-debito/{id}/emitir:
 *   post:
 *     summary: Emite uma nota de débito
 *     tags: [Notas de Débito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota de débito
 *     responses:
 *       200:
 *         description: Nota de débito emitida com sucesso
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
 *                   description: Dados da nota de débito emitida
 *       400:
 *         description: Nota já está emitida
 *       404:
 *         description: Nota de débito não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/emitir', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a nota de débito existe
    const { data: existingNota } = await supabase
      .from('notas_debito')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingNota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de débito não encontrada'
      });
    }

    if (existingNota.status === 'emitida') {
      return res.status(400).json({
        success: false,
        message: 'Nota de débito já está emitida'
      });
    }

    // Emitir a nota de débito
    const { data, error } = await supabase
      .from('notas_debito')
      .update({ status: 'emitida' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao emitir nota de débito:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Nota de débito emitida com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de emissão de nota de débito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notas-debito/{id}/marcar-paga:
 *   post:
 *     summary: Marca uma nota de débito como paga
 *     tags: [Notas de Débito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota de débito
 *     responses:
 *       200:
 *         description: Nota de débito marcada como paga com sucesso
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
 *                   description: Dados da nota de débito marcada como paga
 *       400:
 *         description: Nota já está marcada como paga
 *       404:
 *         description: Nota de débito não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/marcar-paga', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a nota de débito existe
    const { data: existingNota } = await supabase
      .from('notas_debito')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingNota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de débito não encontrada'
      });
    }

    if (existingNota.status === 'paga') {
      return res.status(400).json({
        success: false,
        message: 'Nota de débito já está marcada como paga'
      });
    }

    // Marcar como paga
    const { data, error } = await supabase
      .from('notas_debito')
      .update({ status: 'paga' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao marcar nota de débito como paga:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Nota de débito marcada como paga com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de marcação de nota de débito como paga:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;
