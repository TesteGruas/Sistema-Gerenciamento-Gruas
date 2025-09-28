import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /api/orcamentos-locacao:
 *   get:
 *     summary: Lista orçamentos de locação com filtros
 *     tags: [Orçamentos Locação]
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
 *           enum: [rascunho, enviado, aprovado, rejeitado, convertido]
 *         description: Status do orçamento
 *       - in: query
 *         name: tipo_orcamento
 *         schema:
 *           type: string
 *         description: Tipo do orçamento
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por número ou nome do cliente
 *     responses:
 *       200:
 *         description: Lista de orçamentos de locação
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
 *                         description: ID do orçamento
 *                       numero:
 *                         type: string
 *                         description: Número do orçamento
 *                       cliente_id:
 *                         type: integer
 *                         description: ID do cliente
 *                       data_orcamento:
 *                         type: string
 *                         format: date
 *                         description: Data do orçamento
 *                       data_validade:
 *                         type: string
 *                         format: date
 *                         description: Data de validade
 *                       valor_total:
 *                         type: number
 *                         description: Valor total do orçamento
 *                       desconto:
 *                         type: number
 *                         description: Valor do desconto
 *                       status:
 *                         type: string
 *                         enum: [rascunho, enviado, aprovado, rejeitado, convertido]
 *                         description: Status do orçamento
 *                       tipo_orcamento:
 *                         type: string
 *                         description: Tipo do orçamento
 *                       vendedor_id:
 *                         type: integer
 *                         description: ID do vendedor
 *                       condicoes_pagamento:
 *                         type: string
 *                         description: Condições de pagamento
 *                       prazo_entrega:
 *                         type: string
 *                         description: Prazo de entrega
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
 *                       funcionarios:
 *                         type: object
 *                         properties:
 *                           nome:
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
      tipo_orcamento,
      cliente_id,
      search 
    } = req.query;

    let query = supabase
      .from('orcamentos_locacao')
      .select(`
        *,
        clientes!inner(nome, cnpj),
        funcionarios!vendedor_id(nome)
      `);

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (tipo_orcamento && tipo_orcamento !== 'all') {
      query = query.eq('tipo_orcamento', tipo_orcamento);
    }

    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }

    if (search) {
      query = query.or(`numero.ilike.%${search}%,clientes.nome.ilike.%${search}%`);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenação
    query = query.order('data_orcamento', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar orçamentos de locação:', error);
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
    console.error('Erro na rota de orçamentos de locação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/orcamentos-locacao/{id}:
 *   get:
 *     summary: Obtém um orçamento de locação específico
 *     tags: [Orçamentos Locação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Dados do orçamento de locação
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
 *                       description: ID do orçamento
 *                     numero:
 *                       type: string
 *                       description: Número do orçamento
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     data_orcamento:
 *                       type: string
 *                       format: date
 *                       description: Data do orçamento
 *                     data_validade:
 *                       type: string
 *                       format: date
 *                       description: Data de validade
 *                     valor_total:
 *                       type: number
 *                       description: Valor total do orçamento
 *                     desconto:
 *                       type: number
 *                       description: Valor do desconto
 *                     status:
 *                       type: string
 *                       enum: [rascunho, enviado, aprovado, rejeitado, convertido]
 *                       description: Status do orçamento
 *                     tipo_orcamento:
 *                       type: string
 *                       description: Tipo do orçamento
 *                     vendedor_id:
 *                       type: integer
 *                       description: ID do vendedor
 *                     condicoes_pagamento:
 *                       type: string
 *                       description: Condições de pagamento
 *                     prazo_entrega:
 *                       type: string
 *                       description: Prazo de entrega
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
 *                     funcionarios:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         telefone:
 *                           type: string
 *                         email:
 *                           type: string
 *                     orcamento_itens_locacao:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           produto_servico:
 *                             type: string
 *                           descricao:
 *                             type: string
 *                           quantidade:
 *                             type: number
 *                           valor_unitario:
 *                             type: number
 *                           valor_total:
 *                             type: number
 *                           tipo:
 *                             type: string
 *                           unidade:
 *                             type: string
 *                           observacoes:
 *                             type: string
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orcamentos_locacao')
      .select(`
        *,
        clientes!inner(nome, cnpj, contato, telefone, email),
        funcionarios!vendedor_id(nome, telefone, email),
        orcamento_itens_locacao(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Orçamento não encontrado' 
        });
      }
      console.error('Erro ao buscar orçamento:', error);
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
    console.error('Erro na rota de orçamento específico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/orcamentos-locacao:
 *   post:
 *     summary: Cria um novo orçamento de locação
 *     tags: [Orçamentos Locação]
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
 *               - data_orcamento
 *               - data_validade
 *               - valor_total
 *               - tipo_orcamento
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número do orçamento
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               data_orcamento:
 *                 type: string
 *                 format: date
 *                 description: Data do orçamento
 *               data_validade:
 *                 type: string
 *                 format: date
 *                 description: Data de validade
 *               valor_total:
 *                 type: number
 *                 description: Valor total do orçamento
 *               desconto:
 *                 type: number
 *                 default: 0
 *                 description: Valor do desconto
 *               status:
 *                 type: string
 *                 enum: [rascunho, enviado, aprovado, rejeitado, convertido]
 *                 default: rascunho
 *                 description: Status do orçamento
 *               tipo_orcamento:
 *                 type: string
 *                 description: Tipo do orçamento
 *               vendedor_id:
 *                 type: integer
 *                 description: ID do vendedor
 *               condicoes_pagamento:
 *                 type: string
 *                 description: Condições de pagamento
 *               prazo_entrega:
 *                 type: string
 *                 description: Prazo de entrega
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     produto_servico:
 *                       type: string
 *                       description: Nome do produto/serviço
 *                     descricao:
 *                       type: string
 *                       description: Descrição do item
 *                     quantidade:
 *                       type: number
 *                       description: Quantidade
 *                     valor_unitario:
 *                       type: number
 *                       description: Valor unitário
 *                     valor_total:
 *                       type: number
 *                       description: Valor total do item
 *                     tipo:
 *                       type: string
 *                       description: Tipo do item
 *                     unidade:
 *                       type: string
 *                       description: Unidade de medida
 *                     observacoes:
 *                       type: string
 *                       description: Observações do item
 *     responses:
 *       201:
 *         description: Orçamento criado com sucesso
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
 *                       description: ID do orçamento criado
 *                     numero:
 *                       type: string
 *                       description: Número do orçamento
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     data_orcamento:
 *                       type: string
 *                       format: date
 *                       description: Data do orçamento
 *                     data_validade:
 *                       type: string
 *                       format: date
 *                       description: Data de validade
 *                     valor_total:
 *                       type: number
 *                       description: Valor total do orçamento
 *                     desconto:
 *                       type: number
 *                       description: Valor do desconto
 *                     status:
 *                       type: string
 *                       enum: [rascunho, enviado, aprovado, rejeitado, convertido]
 *                       description: Status do orçamento
 *                     tipo_orcamento:
 *                       type: string
 *                       description: Tipo do orçamento
 *                     vendedor_id:
 *                       type: integer
 *                       description: ID do vendedor
 *                     condicoes_pagamento:
 *                       type: string
 *                       description: Condições de pagamento
 *                     prazo_entrega:
 *                       type: string
 *                       description: Prazo de entrega
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
 *                     funcionarios:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                     orcamento_itens_locacao:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           produto_servico:
 *                             type: string
 *                           descricao:
 *                             type: string
 *                           quantidade:
 *                             type: number
 *                           valor_unitario:
 *                             type: number
 *                           valor_total:
 *                             type: number
 *                           tipo:
 *                             type: string
 *                           unidade:
 *                             type: string
 *                           observacoes:
 *                             type: string
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const {
      numero,
      cliente_id,
      data_orcamento,
      data_validade,
      valor_total,
      desconto = 0,
      status = 'rascunho',
      tipo_orcamento,
      vendedor_id,
      condicoes_pagamento,
      prazo_entrega,
      observacoes,
      itens = []
    } = req.body;

    // Validações básicas
    if (!numero || !cliente_id || !data_orcamento || !data_validade || !valor_total || !tipo_orcamento) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: numero, cliente_id, data_orcamento, data_validade, valor_total, tipo_orcamento'
      });
    }

    // Verificar se o número já existe
    const { data: existingOrcamento } = await supabase
      .from('orcamentos_locacao')
      .select('id')
      .eq('numero', numero)
      .single();

    if (existingOrcamento) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um orçamento com este número'
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

    // Criar o orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos_locacao')
      .insert({
        numero,
        cliente_id,
        data_orcamento,
        data_validade,
        valor_total,
        desconto,
        status,
        tipo_orcamento,
        vendedor_id,
        condicoes_pagamento,
        prazo_entrega,
        observacoes
      })
      .select()
      .single();

    if (orcamentoError) {
      console.error('Erro ao criar orçamento:', orcamentoError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: orcamentoError.message 
      });
    }

    // Criar os itens do orçamento
    if (itens && itens.length > 0) {
      const itensData = itens.map(item => ({
        orcamento_id: orcamento.id,
        produto_servico: item.produto_servico,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        tipo: item.tipo,
        unidade: item.unidade,
        observacoes: item.observacoes
      }));

      const { error: itensError } = await supabase
        .from('orcamento_itens_locacao')
        .insert(itensData);

      if (itensError) {
        console.error('Erro ao criar itens do orçamento:', itensError);
        // Se falhar ao criar itens, excluir o orçamento
        await supabase
          .from('orcamentos_locacao')
          .delete()
          .eq('id', orcamento.id);
        
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao criar itens do orçamento',
          error: itensError.message 
        });
      }
    }

    // Buscar o orçamento completo com itens
    const { data: orcamentoCompleto } = await supabase
      .from('orcamentos_locacao')
      .select(`
        *,
        clientes!inner(nome, cnpj),
        funcionarios!vendedor_id(nome),
        orcamento_itens_locacao(*)
      `)
      .eq('id', orcamento.id)
      .single();

    res.status(201).json({
      success: true,
      message: 'Orçamento criado com sucesso',
      data: orcamentoCompleto
    });

  } catch (error) {
    console.error('Erro na rota de criação de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/orcamentos-locacao/{id}:
 *   put:
 *     summary: Atualiza um orçamento de locação existente
 *     tags: [Orçamentos Locação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Número do orçamento
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               data_orcamento:
 *                 type: string
 *                 format: date
 *                 description: Data do orçamento
 *               data_validade:
 *                 type: string
 *                 format: date
 *                 description: Data de validade
 *               valor_total:
 *                 type: number
 *                 description: Valor total do orçamento
 *               desconto:
 *                 type: number
 *                 description: Valor do desconto
 *               status:
 *                 type: string
 *                 enum: [rascunho, enviado, aprovado, rejeitado, convertido]
 *                 description: Status do orçamento
 *               tipo_orcamento:
 *                 type: string
 *                 description: Tipo do orçamento
 *               vendedor_id:
 *                 type: integer
 *                 description: ID do vendedor
 *               condicoes_pagamento:
 *                 type: string
 *                 description: Condições de pagamento
 *               prazo_entrega:
 *                 type: string
 *                 description: Prazo de entrega
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     produto_servico:
 *                       type: string
 *                       description: Nome do produto/serviço
 *                     descricao:
 *                       type: string
 *                       description: Descrição do item
 *                     quantidade:
 *                       type: number
 *                       description: Quantidade
 *                     valor_unitario:
 *                       type: number
 *                       description: Valor unitário
 *                     valor_total:
 *                       type: number
 *                       description: Valor total do item
 *                     tipo:
 *                       type: string
 *                       description: Tipo do item
 *                     unidade:
 *                       type: string
 *                       description: Unidade de medida
 *                     observacoes:
 *                       type: string
 *                       description: Observações do item
 *     responses:
 *       200:
 *         description: Orçamento atualizado com sucesso
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
 *                       description: ID do orçamento
 *                     numero:
 *                       type: string
 *                       description: Número do orçamento
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     data_orcamento:
 *                       type: string
 *                       format: date
 *                       description: Data do orçamento
 *                     data_validade:
 *                       type: string
 *                       format: date
 *                       description: Data de validade
 *                     valor_total:
 *                       type: number
 *                       description: Valor total do orçamento
 *                     desconto:
 *                       type: number
 *                       description: Valor do desconto
 *                     status:
 *                       type: string
 *                       enum: [rascunho, enviado, aprovado, rejeitado, convertido]
 *                       description: Status do orçamento
 *                     tipo_orcamento:
 *                       type: string
 *                       description: Tipo do orçamento
 *                     vendedor_id:
 *                       type: integer
 *                       description: ID do vendedor
 *                     condicoes_pagamento:
 *                       type: string
 *                       description: Condições de pagamento
 *                     prazo_entrega:
 *                       type: string
 *                       description: Prazo de entrega
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
 *                     clientes:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         cnpj:
 *                           type: string
 *                     funcionarios:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                     orcamento_itens_locacao:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           produto_servico:
 *                             type: string
 *                           descricao:
 *                             type: string
 *                           quantidade:
 *                             type: number
 *                           valor_unitario:
 *                             type: number
 *                           valor_total:
 *                             type: number
 *                           tipo:
 *                             type: string
 *                           unidade:
 *                             type: string
 *                           observacoes:
 *                             type: string
 *       400:
 *         description: Dados inválidos ou orçamento convertido
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { itens } = updateData;

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.itens;

    // Verificar se o orçamento existe
    const { data: existingOrcamento } = await supabase
      .from('orcamentos_locacao')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingOrcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    // Não permitir edição de orçamentos convertidos
    if (existingOrcamento.status === 'convertido') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível editar orçamento convertido'
      });
    }

    // Se estiver atualizando o número, verificar se não existe outro com o mesmo número
    if (updateData.numero) {
      const { data: duplicateOrcamento } = await supabase
        .from('orcamentos_locacao')
        .select('id')
        .eq('numero', updateData.numero)
        .neq('id', id)
        .single();

      if (duplicateOrcamento) {
        return res.status(400).json({
          success: false,
          message: 'Já existe um orçamento com este número'
        });
      }
    }

    // Atualizar o orçamento
    const { data, error } = await supabase
      .from('orcamentos_locacao')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar orçamento:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    // Atualizar itens se fornecidos
    if (itens) {
      // Excluir itens existentes
      await supabase
        .from('orcamento_itens_locacao')
        .delete()
        .eq('orcamento_id', id);

      // Inserir novos itens
      if (itens.length > 0) {
        const itensData = itens.map(item => ({
          orcamento_id: id,
          produto_servico: item.produto_servico,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
          tipo: item.tipo,
          unidade: item.unidade,
          observacoes: item.observacoes
        }));

        const { error: itensError } = await supabase
          .from('orcamento_itens_locacao')
          .insert(itensData);

        if (itensError) {
          console.error('Erro ao atualizar itens do orçamento:', itensError);
          return res.status(500).json({ 
            success: false, 
            message: 'Erro ao atualizar itens do orçamento',
            error: itensError.message 
          });
        }
      }
    }

    // Buscar o orçamento completo com itens
    const { data: orcamentoCompleto } = await supabase
      .from('orcamentos_locacao')
      .select(`
        *,
        clientes!inner(nome, cnpj),
        funcionarios!vendedor_id(nome),
        orcamento_itens_locacao(*)
      `)
      .eq('id', id)
      .single();

    res.json({
      success: true,
      message: 'Orçamento atualizado com sucesso',
      data: orcamentoCompleto
    });

  } catch (error) {
    console.error('Erro na rota de atualização de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/orcamentos-locacao/{id}:
 *   delete:
 *     summary: Exclui um orçamento de locação
 *     tags: [Orçamentos Locação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Orçamento excluído com sucesso
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
 *         description: Não é possível excluir orçamento convertido
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o orçamento existe
    const { data: existingOrcamento } = await supabase
      .from('orcamentos_locacao')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingOrcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    // Não permitir exclusão de orçamentos convertidos
    if (existingOrcamento.status === 'convertido') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir orçamento convertido'
      });
    }

    // Excluir o orçamento (cascade irá excluir os itens)
    const { error } = await supabase
      .from('orcamentos_locacao')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir orçamento:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Orçamento excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de exclusão de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/orcamentos-locacao/{id}/enviar:
 *   post:
 *     summary: Envia um orçamento de locação
 *     tags: [Orçamentos Locação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Orçamento enviado com sucesso
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do orçamento
 *                     status:
 *                       type: string
 *                       enum: [enviado]
 *                       description: Status atualizado
 *                     data_envio:
 *                       type: string
 *                       format: date-time
 *                       description: Data de envio
 *       400:
 *         description: Apenas orçamentos em rascunho podem ser enviados
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/enviar', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o orçamento existe
    const { data: existingOrcamento } = await supabase
      .from('orcamentos_locacao')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingOrcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    if (existingOrcamento.status !== 'rascunho') {
      return res.status(400).json({
        success: false,
        message: 'Apenas orçamentos em rascunho podem ser enviados'
      });
    }

    // Enviar o orçamento
    const { data, error } = await supabase
      .from('orcamentos_locacao')
      .update({ 
        status: 'enviado',
        data_envio: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar orçamento:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Orçamento enviado com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de envio de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/orcamentos-locacao/{id}/aprovar:
 *   post:
 *     summary: Aprova um orçamento de locação
 *     tags: [Orçamentos Locação]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Orçamento aprovado com sucesso
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do orçamento
 *                     status:
 *                       type: string
 *                       enum: [aprovado]
 *                       description: Status atualizado
 *                     data_aprovacao:
 *                       type: string
 *                       format: date-time
 *                       description: Data de aprovação
 *       400:
 *         description: Apenas orçamentos enviados podem ser aprovados
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o orçamento existe
    const { data: existingOrcamento } = await supabase
      .from('orcamentos_locacao')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingOrcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    if (existingOrcamento.status !== 'enviado') {
      return res.status(400).json({
        success: false,
        message: 'Apenas orçamentos enviados podem ser aprovados'
      });
    }

    // Aprovar o orçamento
    const { data, error } = await supabase
      .from('orcamentos_locacao')
      .update({ 
        status: 'aprovado',
        data_aprovacao: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao aprovar orçamento:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Orçamento aprovado com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de aprovação de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;
