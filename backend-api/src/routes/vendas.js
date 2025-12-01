import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';
import { criarMovimentacoesVenda } from '../utils/movimentacoes-estoque.js';

const router = express.Router();

// Schema de validação para venda
const vendaSchema = Joi.object({
  cliente_id: Joi.number().integer().positive().required(),
  obra_id: Joi.number().integer().positive().optional(),
  numero_venda: Joi.string().min(1).max(50).required(),
  data_venda: Joi.date().required(),
  valor_total: Joi.number().min(0).required(),
  status: Joi.string().valid('pendente', 'confirmada', 'cancelada', 'finalizada').default('pendente'),
  tipo_venda: Joi.string().valid('equipamento', 'servico', 'locacao').required(),
  observacoes: Joi.string().optional()
});

// Schema de validação para item de venda
const vendaItemSchema = Joi.object({
  produto_id: Joi.string().optional(),
  grua_id: Joi.string().optional(),
  descricao: Joi.string().min(1).required(),
  quantidade: Joi.number().min(0).required(),
  valor_unitario: Joi.number().min(0).required()
});

/**
 * @swagger
 * /api/vendas:
 *   get:
 *     summary: Lista todas as vendas
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vendas
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
 *                         description: ID da venda
 *                       cliente_id:
 *                         type: integer
 *                         description: ID do cliente
 *                       obra_id:
 *                         type: integer
 *                         description: ID da obra
 *                       numero_venda:
 *                         type: string
 *                         description: Número da venda
 *                       data_venda:
 *                         type: string
 *                         format: date
 *                         description: Data da venda
 *                       valor_total:
 *                         type: number
 *                         description: Valor total da venda
 *                       status:
 *                         type: string
 *                         enum: [pendente, confirmada, cancelada, finalizada]
 *                         description: Status da venda
 *                       tipo_venda:
 *                         type: string
 *                         enum: [equipamento, servico, locacao]
 *                         description: Tipo da venda
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
 *                       clientes:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           cnpj:
 *                             type: string
 *                       obras:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           endereco:
 *                             type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = supabase
      .from('vendas')
      .select(`
        *,
        clientes(nome, cnpj),
        obras(nome, endereco)
      `)
      .order('created_at', { ascending: false });

    // Aplicar busca se fornecida
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      
      // Buscar todas as vendas primeiro para poder filtrar por relacionamentos
      const { data: allVendas, error: allError } = await supabase
        .from('vendas')
        .select(`
          *,
          clientes(nome, cnpj),
          obras(nome, endereco)
        `)
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      // Filtrar no JavaScript para permitir busca em relacionamentos
      const filteredVendas = (allVendas || []).filter(venda => {
        const numeroMatch = venda.numero_venda?.toLowerCase().includes(searchTerm);
        const clienteMatch = venda.clientes?.nome?.toLowerCase().includes(searchTerm);
        const obraMatch = venda.obras?.nome?.toLowerCase().includes(searchTerm);
        return numeroMatch || clienteMatch || obraMatch;
      });

      return res.json({
        success: true,
        data: filteredVendas || []
      });
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendas:
 *   post:
 *     summary: Cria uma nova venda
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cliente_id
 *               - numero_venda
 *               - data_venda
 *               - valor_total
 *               - tipo_venda
 *             properties:
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               obra_id:
 *                 type: integer
 *                 description: ID da obra
 *               numero_venda:
 *                 type: string
 *                 maxLength: 50
 *                 description: Número da venda
 *               data_venda:
 *                 type: string
 *                 format: date
 *                 description: Data da venda
 *               valor_total:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor total da venda
 *               status:
 *                 type: string
 *                 enum: [pendente, confirmada, cancelada, finalizada]
 *                 default: pendente
 *                 description: Status da venda
 *               tipo_venda:
 *                 type: string
 *                 enum: [equipamento, servico, locacao]
 *                 description: Tipo da venda
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       201:
 *         description: Venda criada com sucesso
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
 *                       description: ID da venda criada
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     obra_id:
 *                       type: integer
 *                       description: ID da obra
 *                     numero_venda:
 *                       type: string
 *                       description: Número da venda
 *                     data_venda:
 *                       type: string
 *                       format: date
 *                       description: Data da venda
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da venda
 *                     status:
 *                       type: string
 *                       enum: [pendente, confirmada, cancelada, finalizada]
 *                       description: Status da venda
 *                     tipo_venda:
 *                       type: string
 *                       enum: [equipamento, servico, locacao]
 *                       description: Tipo da venda
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = vendaSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('vendas')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    // Se a venda foi criada com status 'confirmada', criar movimentações de estoque
    if (value.status === 'confirmada') {
      console.log('🔄 Venda confirmada - criando movimentações de estoque...');
      
      // Buscar itens da venda (se existirem)
      const { data: itens, error: itensError } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', data.id);

      if (itensError) {
        console.error('❌ Erro ao buscar itens da venda:', itensError);
      } else if (itens && itens.length > 0) {
        // Criar movimentações de estoque
        const movimentacoes = await criarMovimentacoesVenda(data, itens, 1); // TODO: usar ID do usuário logado
        console.log(`✅ Criadas ${movimentacoes.length} movimentações de estoque para a venda ${data.id}`);
      }
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Venda criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendas/{id}:
 *   get:
 *     summary: Obtém uma venda específica
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da venda
 *     responses:
 *       200:
 *         description: Dados da venda
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
 *                       description: ID da venda
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     obra_id:
 *                       type: integer
 *                       description: ID da obra
 *                     numero_venda:
 *                       type: string
 *                       description: Número da venda
 *                     data_venda:
 *                       type: string
 *                       format: date
 *                       description: Data da venda
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da venda
 *                     status:
 *                       type: string
 *                       enum: [pendente, confirmada, cancelada, finalizada]
 *                       description: Status da venda
 *                     tipo_venda:
 *                       type: string
 *                       enum: [equipamento, servico, locacao]
 *                       description: Tipo da venda
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
 *                     clientes:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         cnpj:
 *                           type: string
 *                         telefone:
 *                           type: string
 *                         email:
 *                           type: string
 *                     obras:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         endereco:
 *                           type: string
 *                         cidade:
 *                           type: string
 *                         estado:
 *                           type: string
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('vendas')
      .select(`
        *,
        clientes(nome, cnpj, telefone, email),
        obras(nome, endereco, cidade, estado)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendas/{id}:
 *   put:
 *     summary: Atualiza uma venda existente
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da venda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               obra_id:
 *                 type: integer
 *                 description: ID da obra
 *               numero_venda:
 *                 type: string
 *                 description: Número da venda
 *               data_venda:
 *                 type: string
 *                 format: date
 *                 description: Data da venda
 *               valor_total:
 *                 type: number
 *                 description: Valor total da venda
 *               status:
 *                 type: string
 *                 enum: [pendente, confirmada, cancelada, finalizada]
 *                 description: Status da venda
 *               tipo_venda:
 *                 type: string
 *                 enum: [equipamento, servico, locacao]
 *                 description: Tipo da venda
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       200:
 *         description: Venda atualizada com sucesso
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
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = vendaSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('vendas')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Venda atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendas/{id}:
 *   delete:
 *     summary: Exclui uma venda
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da venda
 *     responses:
 *       200:
 *         description: Venda excluída com sucesso
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
 *         description: Venda não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('vendas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Venda excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendas/{id}/itens:
 *   get:
 *     summary: Lista os itens de uma venda
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da venda
 *     responses:
 *       200:
 *         description: Lista de itens da venda
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
 *                         description: ID do item
 *                       venda_id:
 *                         type: integer
 *                         description: ID da venda
 *                       produto_id:
 *                         type: integer
 *                         description: ID do produto
 *                       grua_id:
 *                         type: integer
 *                         description: ID da grua
 *                       quantidade:
 *                         type: number
 *                         description: Quantidade
 *                       valor_unitario:
 *                         type: number
 *                         description: Valor unitário
 *                       valor_total:
 *                         type: number
 *                         description: Valor total
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
 *                       produtos:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           descricao:
 *                             type: string
 *                           categoria:
 *                             type: string
 *                           unidade:
 *                             type: string
 *                       gruas:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           modelo:
 *                             type: string
 *                           capacidade:
 *                             type: number
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('vendas_itens')
      .select(`
        *,
        produtos(nome, descricao),
        gruas(id, modelo, fabricante)
      `)
      .eq('venda_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar itens da venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendas/{id}/itens:
 *   post:
 *     summary: Adiciona um item a uma venda
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da venda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               produto_id:
 *                 type: integer
 *                 description: ID do produto
 *               grua_id:
 *                 type: integer
 *                 description: ID da grua
 *               quantidade:
 *                 type: number
 *                 description: Quantidade
 *               valor_unitario:
 *                 type: number
 *                 description: Valor unitário
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       201:
 *         description: Item adicionado com sucesso
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
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = vendaItemSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const itemData = {
      ...value,
      venda_id: parseInt(id)
    };

    const { data, error } = await supabase
      .from('vendas_itens')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Item adicionado à venda com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar item à venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendas/{id}/confirmar:
 *   post:
 *     summary: Confirma uma venda e cria movimentações de estoque
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da venda
 *     responses:
 *       200:
 *         description: Venda confirmada com sucesso
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
 *       400:
 *         description: Venda já confirmada
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/confirmar', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar venda atual
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .select('*')
      .eq('id', id)
      .single();

    if (vendaError || !venda) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada'
      });
    }

    // Verificar se já está confirmada
    if (venda.status === 'confirmada') {
      return res.status(400).json({
        success: false,
        message: 'Venda já está confirmada'
      });
    }

    // Atualizar status da venda para confirmada
    const { data: vendaAtualizada, error: updateError } = await supabase
      .from('vendas')
      .update({ 
        status: 'confirmada',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Buscar itens da venda
    const { data: itens, error: itensError } = await supabase
      .from('vendas_itens')
      .select('*')
      .eq('venda_id', id);

    if (itensError) {
      console.error('❌ Erro ao buscar itens da venda:', itensError);
    }

    let movimentacoes = [];
    if (itens && itens.length > 0) {
      // Criar movimentações de estoque
      movimentacoes = await criarMovimentacoesVenda(vendaAtualizada, itens, 1); // TODO: usar ID do usuário logado
      console.log(`✅ Criadas ${movimentacoes.length} movimentações de estoque para a venda ${id}`);
    }

    res.json({
      success: true,
      data: {
        venda: vendaAtualizada,
        movimentacoes_criadas: movimentacoes.length,
        movimentacoes
      },
      message: 'Venda confirmada e movimentações de estoque criadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao confirmar venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/vendas/from-orcamento/{orcamentoId}:
 *   post:
 *     summary: Cria uma venda a partir de um orçamento aprovado
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orcamentoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       201:
 *         description: Venda criada com sucesso
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
 *                     venda:
 *                       type: object
 *                       description: Dados da venda criada
 *                     itens_criados:
 *                       type: integer
 *                       description: Número de itens criados
 *       400:
 *         description: Orçamento não está aprovado
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/from-orcamento/:orcamentoId', async (req, res) => {
  try {
    const { orcamentoId } = req.params;

    // Buscar orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          cnpj,
          email
        ),
        orcamento_itens (*)
      `)
      .eq('id', orcamentoId)
      .single();

    if (orcamentoError || !orcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    // Verificar se o orçamento está aprovado
    if (orcamento.status !== 'aprovado') {
      return res.status(400).json({
        success: false,
        message: 'Apenas orçamentos aprovados podem ser convertidos em vendas'
      });
    }

    // Gerar número da venda
    const numeroVenda = `VEN-${Date.now()}`;

    // Criar venda baseada no orçamento
    const vendaData = {
      cliente_id: orcamento.cliente_id,
      obra_id: orcamento.obra_id || null,
      orcamento_id: orcamento.id,
      numero_venda: numeroVenda,
      data_venda: new Date().toISOString().split('T')[0],
      valor_total: orcamento.valor_total,
      status: 'pendente', // Venda criada como pendente
      tipo_venda: orcamento.tipo_orcamento,
      observacoes: `Venda criada a partir do orçamento ${orcamento.id}. ${orcamento.observacoes || ''}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .insert([vendaData])
      .select()
      .single();

    if (vendaError) {
      throw vendaError;
    }

    // Criar itens da venda baseados nos itens do orçamento
    console.log('🔍 Orçamento itens:', orcamento.orcamento_itens);
    if (orcamento.orcamento_itens && orcamento.orcamento_itens.length > 0) {
      const itensVenda = orcamento.orcamento_itens.map(item => ({
        venda_id: venda.id,
        produto_id: item.produto_id || null, // Preservar produto_id do orçamento se existir
        descricao: item.produto_servico,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario
        // valor_total é uma coluna gerada, não precisa ser especificada
      }));

      console.log('📝 Itens da venda a serem inseridos:', itensVenda);

      const { error: itensError } = await supabase
        .from('vendas_itens')
        .insert(itensVenda);

      if (itensError) {
        console.error('❌ Erro ao criar itens da venda:', itensError);
        // Não falha a operação, apenas loga o erro
      } else {
        console.log('✅ Itens da venda criados com sucesso');
      }
    } else {
      console.log('⚠️ Orçamento não tem itens para copiar');
    }

    // Atualizar status do orçamento para "convertido"
    await supabase
      .from('orcamentos')
      .update({ 
        status: 'convertido',
        updated_at: new Date().toISOString()
      })
      .eq('id', orcamentoId);

    res.status(201).json({
      success: true,
      data: venda,
      message: 'Venda criada com sucesso a partir do orçamento'
    });
  } catch (error) {
    console.error('Erro ao criar venda a partir de orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
