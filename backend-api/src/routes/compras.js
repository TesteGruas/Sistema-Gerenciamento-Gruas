import express from 'express';
import multer from 'multer';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import Joi from 'joi';
import { criarMovimentacoesCompra } from '../utils/movimentacoes-estoque.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    // Tipos de arquivo permitidos
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF, imagem, Word ou Excel.'), false);
    }
  }
});

// Schema de validação para compra
const compraSchema = Joi.object({
  fornecedor_id: Joi.number().integer().positive().required(),
  numero_pedido: Joi.string().min(1).max(50).required(),
  data_pedido: Joi.date().required(),
  data_entrega: Joi.date().optional(),
  valor_total: Joi.number().min(0).required(),
  status: Joi.string().valid('pendente', 'aprovado', 'enviado', 'recebido', 'cancelado').default('pendente'),
  observacoes: Joi.string().optional()
});

// Schema de validação para item de compra
const compraItemSchema = Joi.object({
  produto_id: Joi.string().optional(),
  descricao: Joi.string().min(1).required(),
  quantidade: Joi.number().min(0).required(),
  valor_unitario: Joi.number().min(0).required()
});

/**
 * @swagger
 * /api/compras:
 *   get:
 *     summary: Lista todas as compras
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de compras
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
 *                         description: ID da compra
 *                       fornecedor_id:
 *                         type: integer
 *                         description: ID do fornecedor
 *                       numero_pedido:
 *                         type: string
 *                         description: Número do pedido
 *                       data_pedido:
 *                         type: string
 *                         format: date
 *                         description: Data do pedido
 *                       data_entrega:
 *                         type: string
 *                         format: date
 *                         description: Data de entrega
 *                       valor_total:
 *                         type: number
 *                         description: Valor total da compra
 *                       status:
 *                         type: string
 *                         enum: [pendente, aprovado, enviado, recebido, cancelado]
 *                         description: Status da compra
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
 *                       fornecedores:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           cnpj:
 *                             type: string
 *                           telefone:
 *                             type: string
 *                           email:
 *                             type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        fornecedores(nome, cnpj, telefone, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar compras:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/compras:
 *   post:
 *     summary: Cria uma nova compra
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fornecedor_id
 *               - numero_pedido
 *               - data_pedido
 *               - valor_total
 *             properties:
 *               fornecedor_id:
 *                 type: integer
 *                 description: ID do fornecedor
 *               numero_pedido:
 *                 type: string
 *                 maxLength: 50
 *                 description: Número do pedido
 *               data_pedido:
 *                 type: string
 *                 format: date
 *                 description: Data do pedido
 *               data_entrega:
 *                 type: string
 *                 format: date
 *                 description: Data de entrega
 *               valor_total:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor total da compra
 *               status:
 *                 type: string
 *                 enum: [pendente, aprovado, enviado, recebido, cancelado]
 *                 default: pendente
 *                 description: Status da compra
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       201:
 *         description: Compra criada com sucesso
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
 *                       description: ID da compra criada
 *                     fornecedor_id:
 *                       type: integer
 *                       description: ID do fornecedor
 *                     numero_pedido:
 *                       type: string
 *                       description: Número do pedido
 *                     data_pedido:
 *                       type: string
 *                       format: date
 *                       description: Data do pedido
 *                     data_entrega:
 *                       type: string
 *                       format: date
 *                       description: Data de entrega
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da compra
 *                     status:
 *                       type: string
 *                       enum: [pendente, aprovado, enviado, recebido, cancelado]
 *                       description: Status da compra
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
    const { error: validationError, value } = compraSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('compras')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    // Se a compra foi criada com status 'recebido', criar movimentações de estoque
    if (value.status === 'recebido') {
      console.log('🔄 Compra recebida - criando movimentações de estoque...');
      
      // Buscar itens da compra (se existirem)
      const { data: itens, error: itensError } = await supabase
        .from('compras_itens')
        .select('*')
        .eq('compra_id', data.id);

      if (itensError) {
        console.error('❌ Erro ao buscar itens da compra:', itensError);
      } else if (itens && itens.length > 0) {
        // Criar movimentações de estoque
        const movimentacoes = await criarMovimentacoesCompra(data, itens, 1); // TODO: usar ID do usuário logado
        console.log(`✅ Criadas ${movimentacoes.length} movimentações de estoque para a compra ${data.id}`);
      }
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Compra criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/compras/{id}:
 *   get:
 *     summary: Obtém uma compra específica
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     responses:
 *       200:
 *         description: Dados da compra
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
 *                       description: ID da compra
 *                     fornecedor_id:
 *                       type: integer
 *                       description: ID do fornecedor
 *                     numero_pedido:
 *                       type: string
 *                       description: Número do pedido
 *                     data_pedido:
 *                       type: string
 *                       format: date
 *                       description: Data do pedido
 *                     data_entrega:
 *                       type: string
 *                       format: date
 *                       description: Data de entrega
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da compra
 *                     status:
 *                       type: string
 *                       enum: [pendente, aprovado, enviado, recebido, cancelado]
 *                       description: Status da compra
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
 *                     fornecedores:
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
 *                         endereco:
 *                           type: string
 *                         cidade:
 *                           type: string
 *                         estado:
 *                           type: string
 *       404:
 *         description: Compra não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        fornecedores(nome, cnpj, telefone, email, endereco, cidade, estado)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Compra não encontrada'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/compras/{id}:
 *   put:
 *     summary: Atualiza uma compra existente
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fornecedor_id:
 *                 type: integer
 *                 description: ID do fornecedor
 *               numero_pedido:
 *                 type: string
 *                 maxLength: 50
 *                 description: Número do pedido
 *               data_pedido:
 *                 type: string
 *                 format: date
 *                 description: Data do pedido
 *               data_entrega:
 *                 type: string
 *                 format: date
 *                 description: Data de entrega
 *               valor_total:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor total da compra
 *               status:
 *                 type: string
 *                 enum: [pendente, aprovado, enviado, recebido, cancelado]
 *                 description: Status da compra
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       200:
 *         description: Compra atualizada com sucesso
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
 *                       description: ID da compra
 *                     fornecedor_id:
 *                       type: integer
 *                       description: ID do fornecedor
 *                     numero_pedido:
 *                       type: string
 *                       description: Número do pedido
 *                     data_pedido:
 *                       type: string
 *                       format: date
 *                       description: Data do pedido
 *                     data_entrega:
 *                       type: string
 *                       format: date
 *                       description: Data de entrega
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da compra
 *                     status:
 *                       type: string
 *                       enum: [pendente, aprovado, enviado, recebido, cancelado]
 *                       description: Status da compra
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Compra não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = compraSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('compras')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Compra não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Compra atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/compras/{id}:
 *   delete:
 *     summary: Exclui uma compra
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     responses:
 *       200:
 *         description: Compra excluída com sucesso
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
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('compras')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Compra excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/compras/{id}/itens:
 *   get:
 *     summary: Lista itens de uma compra
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     responses:
 *       200:
 *         description: Lista de itens da compra
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
 *                       compra_id:
 *                         type: integer
 *                         description: ID da compra
 *                       produto_id:
 *                         type: string
 *                         description: ID do produto
 *                       descricao:
 *                         type: string
 *                         description: Descrição do item
 *                       quantidade:
 *                         type: number
 *                         description: Quantidade
 *                       valor_unitario:
 *                         type: number
 *                         description: Valor unitário
 *                       valor_total:
 *                         type: number
 *                         description: Valor total do item
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *                       produtos:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           descricao:
 *                             type: string
 *                           unidade_medida:
 *                             type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('compras_itens')
      .select(`
        *,
        produtos(nome, descricao, unidade_medida)
      `)
      .eq('compra_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar itens da compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/compras/{id}/itens:
 *   post:
 *     summary: Adiciona um item à compra
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descricao
 *               - quantidade
 *               - valor_unitario
 *             properties:
 *               produto_id:
 *                 type: string
 *                 description: ID do produto
 *               descricao:
 *                 type: string
 *                 description: Descrição do item
 *               quantidade:
 *                 type: number
 *                 minimum: 0
 *                 description: Quantidade
 *               valor_unitario:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor unitário
 *     responses:
 *       201:
 *         description: Item adicionado à compra com sucesso
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
 *                       description: ID do item criado
 *                     compra_id:
 *                       type: integer
 *                       description: ID da compra
 *                     produto_id:
 *                       type: string
 *                       description: ID do produto
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
router.post('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = compraItemSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const itemData = {
      ...value,
      compra_id: parseInt(id)
    };

    const { data, error } = await supabase
      .from('compras_itens')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Item adicionado à compra com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar item à compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/compras/{id}/receber:
 *   post:
 *     summary: Marca uma compra como recebida e cria movimentações de estoque
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     responses:
 *       200:
 *         description: Compra marcada como recebida com sucesso
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
 *                     compra:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: ID da compra
 *                         fornecedor_id:
 *                           type: integer
 *                           description: ID do fornecedor
 *                         numero_pedido:
 *                           type: string
 *                           description: Número do pedido
 *                         data_pedido:
 *                           type: string
 *                           format: date
 *                           description: Data do pedido
 *                         data_entrega:
 *                           type: string
 *                           format: date
 *                           description: Data de entrega
 *                         valor_total:
 *                           type: number
 *                           description: Valor total da compra
 *                         status:
 *                           type: string
 *                           enum: [recebido]
 *                           description: Status atualizado
 *                         observacoes:
 *                           type: string
 *                           description: Observações
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           description: Data de atualização
 *                     movimentacoes_criadas:
 *                       type: integer
 *                       description: Número de movimentações de estoque criadas
 *                     movimentacoes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Movimentações de estoque criadas
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       400:
 *         description: Compra já está marcada como recebida
 *       404:
 *         description: Compra não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/receber', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar compra atual
    const { data: compra, error: compraError } = await supabase
      .from('compras')
      .select('*')
      .eq('id', id)
      .single();

    if (compraError || !compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra não encontrada'
      });
    }

    // Verificar se já está recebida
    if (compra.status === 'recebido') {
      return res.status(400).json({
        success: false,
        message: 'Compra já está marcada como recebida'
      });
    }

    // Atualizar status da compra para recebido
    const { data: compraAtualizada, error: updateError } = await supabase
      .from('compras')
      .update({ 
        status: 'recebido',
        data_entrega: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Buscar itens da compra
    const { data: itens, error: itensError } = await supabase
      .from('compras_itens')
      .select('*')
      .eq('compra_id', id);

    if (itensError) {
      console.error('❌ Erro ao buscar itens da compra:', itensError);
    }

    let movimentacoes = [];
    if (itens && itens.length > 0) {
      // Criar movimentações de estoque
      movimentacoes = await criarMovimentacoesCompra(compraAtualizada, itens, 1); // TODO: usar ID do usuário logado
      console.log(`✅ Criadas ${movimentacoes.length} movimentações de estoque para a compra ${id}`);
    }

    res.json({
      success: true,
      data: {
        compra: compraAtualizada,
        movimentacoes_criadas: movimentacoes.length,
        movimentacoes
      },
      message: 'Compra marcada como recebida e movimentações de estoque criadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao marcar compra como recebida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/compras/{id}/upload:
 *   post:
 *     summary: Faz upload de arquivo para uma compra
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - arquivo
 *             properties:
 *               arquivo:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo para upload (máximo 10MB)
 *     responses:
 *       200:
 *         description: Arquivo enviado com sucesso
 *       400:
 *         description: Nenhum arquivo enviado
 *       404:
 *         description: Compra não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/upload', authenticateToken, upload.single('arquivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    // Verificar se a compra existe
    const { data: compra, error: compraError } = await supabase
      .from('compras')
      .select('id')
      .eq('id', id)
      .single();

    if (compraError || !compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra não encontrada'
      });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.originalname.split('.').pop();
    const fileName = `compra_${id}_${timestamp}_${randomString}.${extension}`;
    const filePath = `compras/${id}/${fileName}`;

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
        success: false,
        message: 'Erro ao fazer upload do arquivo',
        error: uploadError.message
      });
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabaseAdmin.storage
      .from('arquivos-obras')
      .getPublicUrl(filePath);

    const arquivoUrl = urlData?.publicUrl || `${process.env.SUPABASE_URL}/storage/v1/object/public/arquivos-obras/${filePath}`;

    // Determinar tipo de arquivo
    let tipoArquivo = 'pdf';
    if (file.mimetype.includes('xml')) {
      tipoArquivo = 'xml';
    } else if (file.mimetype.startsWith('image/')) {
      tipoArquivo = 'imagem';
    } else if (file.mimetype.includes('word') || file.mimetype.includes('document')) {
      tipoArquivo = 'documento';
    } else if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet')) {
      tipoArquivo = 'planilha';
    }

    // Atualizar compra com informações do arquivo
    const { data: updatedCompra, error: updateError } = await supabase
      .from('compras')
      .update({
        arquivo_compra: arquivoUrl,
        nome_arquivo: file.originalname,
        tamanho_arquivo: file.size,
        tipo_arquivo: tipoArquivo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      // Se falhar ao salvar no banco, remover o arquivo do storage
      await supabaseAdmin.storage
        .from('arquivos-obras')
        .remove([filePath]);
      
      console.error('Erro ao salvar metadados:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar metadados do arquivo',
        error: updateError.message
      });
    }

    res.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      data: {
        url: arquivoUrl,
        nome_arquivo: file.originalname,
        tamanho: file.size,
        tipo: tipoArquivo
      }
    });

  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
