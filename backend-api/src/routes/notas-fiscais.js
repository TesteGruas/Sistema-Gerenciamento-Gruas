import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';

const router = express.Router();

// Schema de validação para nota fiscal
const notaFiscalSchema = Joi.object({
  numero_nf: Joi.string().min(1).max(50).required(),
  serie: Joi.string().max(10).optional(),
  data_emissao: Joi.date().required(),
  data_vencimento: Joi.date().optional(),
  valor_total: Joi.number().min(0).required(),
  tipo: Joi.string().valid('entrada', 'saida').required(),
  status: Joi.string().valid('pendente', 'paga', 'vencida', 'cancelada').default('pendente'),
  cliente_id: Joi.number().integer().positive().optional(),
  fornecedor_id: Joi.number().integer().positive().optional(),
  venda_id: Joi.number().integer().positive().optional(),
  compra_id: Joi.number().integer().positive().optional(),
  observacoes: Joi.string().optional()
});

/**
 * @swagger
 * /api/notas-fiscais:
 *   get:
 *     summary: Lista todas as notas fiscais
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notas fiscais
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
 *                         description: ID da nota fiscal
 *                       numero_nf:
 *                         type: string
 *                         description: Número da nota fiscal
 *                       serie:
 *                         type: string
 *                         description: Série da nota fiscal
 *                       data_emissao:
 *                         type: string
 *                         format: date
 *                         description: Data de emissão
 *                       data_vencimento:
 *                         type: string
 *                         format: date
 *                         description: Data de vencimento
 *                       valor_total:
 *                         type: number
 *                         description: Valor total da nota fiscal
 *                       tipo:
 *                         type: string
 *                         enum: [entrada, saida]
 *                         description: Tipo da nota fiscal
 *                       status:
 *                         type: string
 *                         enum: [pendente, paga, vencida, cancelada]
 *                         description: Status da nota fiscal
 *                       cliente_id:
 *                         type: integer
 *                         description: ID do cliente
 *                       fornecedor_id:
 *                         type: integer
 *                         description: ID do fornecedor
 *                       venda_id:
 *                         type: integer
 *                         description: ID da venda
 *                       compra_id:
 *                         type: integer
 *                         description: ID da compra
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
 *                       fornecedores:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           cnpj:
 *                             type: string
 *                       vendas:
 *                         type: object
 *                         properties:
 *                           numero_venda:
 *                             type: string
 *                       compras:
 *                         type: object
 *                         properties:
 *                           numero_pedido:
 *                             type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select(`
        *,
        clientes(nome, cnpj),
        fornecedores(nome, cnpj),
        vendas(numero_venda),
        compras(numero_pedido)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar notas fiscais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais:
 *   post:
 *     summary: Cria uma nova nota fiscal
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_nf
 *               - serie
 *               - data_emissao
 *               - data_vencimento
 *               - valor_total
 *               - tipo
 *               - status
 *             properties:
 *               numero_nf:
 *                 type: string
 *                 description: Número da nota fiscal
 *               serie:
 *                 type: string
 *                 description: Série da nota fiscal
 *               data_emissao:
 *                 type: string
 *                 format: date
 *                 description: Data de emissão
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento
 *               valor_total:
 *                 type: number
 *                 description: Valor total da nota fiscal
 *               tipo:
 *                 type: string
 *                 enum: [entrada, saida]
 *                 description: Tipo da nota fiscal
 *               status:
 *                 type: string
 *                 enum: [pendente, paga, vencida, cancelada]
 *                 description: Status da nota fiscal
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               fornecedor_id:
 *                 type: integer
 *                 description: ID do fornecedor
 *               venda_id:
 *                 type: integer
 *                 description: ID da venda
 *               compra_id:
 *                 type: integer
 *                 description: ID da compra
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       201:
 *         description: Nota fiscal criada com sucesso
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
 *                       description: ID da nota fiscal criada
 *                     numero_nf:
 *                       type: string
 *                       description: Número da nota fiscal
 *                     serie:
 *                       type: string
 *                       description: Série da nota fiscal
 *                     data_emissao:
 *                       type: string
 *                       format: date
 *                       description: Data de emissão
 *                     data_vencimento:
 *                       type: string
 *                       format: date
 *                       description: Data de vencimento
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da nota fiscal
 *                     tipo:
 *                       type: string
 *                       enum: [entrada, saida]
 *                       description: Tipo da nota fiscal
 *                     status:
 *                       type: string
 *                       enum: [pendente, paga, vencida, cancelada]
 *                       description: Status da nota fiscal
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     fornecedor_id:
 *                       type: integer
 *                       description: ID do fornecedor
 *                     venda_id:
 *                       type: integer
 *                       description: ID da venda
 *                     compra_id:
 *                       type: integer
 *                       description: ID da compra
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = notaFiscalSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('notas_fiscais')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Nota fiscal registrada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/{id}:
 *   get:
 *     summary: Busca uma nota fiscal por ID
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     responses:
 *       200:
 *         description: Dados da nota fiscal
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
 *                       description: ID da nota fiscal
 *                     numero_nf:
 *                       type: string
 *                       description: Número da nota fiscal
 *                     serie:
 *                       type: string
 *                       description: Série da nota fiscal
 *                     data_emissao:
 *                       type: string
 *                       format: date
 *                       description: Data de emissão
 *                     data_vencimento:
 *                       type: string
 *                       format: date
 *                       description: Data de vencimento
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da nota fiscal
 *                     tipo:
 *                       type: string
 *                       enum: [entrada, saida]
 *                       description: Tipo da nota fiscal
 *                     status:
 *                       type: string
 *                       enum: [pendente, paga, vencida, cancelada]
 *                       description: Status da nota fiscal
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     fornecedor_id:
 *                       type: integer
 *                       description: ID do fornecedor
 *                     venda_id:
 *                       type: integer
 *                       description: ID da venda
 *                     compra_id:
 *                       type: integer
 *                       description: ID da compra
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
 *                     fornecedores:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         cnpj:
 *                           type: string
 *                     vendas:
 *                       type: object
 *                       properties:
 *                         numero_venda:
 *                           type: string
 *                     compras:
 *                       type: object
 *                       properties:
 *                         numero_pedido:
 *                           type: string
 *       404:
 *         description: Nota fiscal não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notas_fiscais')
      .select(`
        *,
        clientes(nome, cnpj, telefone, email),
        fornecedores(nome, cnpj, telefone, email),
        vendas(numero_venda, data_venda),
        compras(numero_pedido, data_pedido)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/{id}:
 *   put:
 *     summary: Atualiza uma nota fiscal existente
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero_nf:
 *                 type: string
 *                 description: Número da nota fiscal
 *               serie:
 *                 type: string
 *                 description: Série da nota fiscal
 *               data_emissao:
 *                 type: string
 *                 format: date
 *                 description: Data de emissão
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento
 *               valor_total:
 *                 type: number
 *                 description: Valor total da nota fiscal
 *               tipo:
 *                 type: string
 *                 enum: [entrada, saida]
 *                 description: Tipo da nota fiscal
 *               status:
 *                 type: string
 *                 enum: [pendente, paga, vencida, cancelada]
 *                 description: Status da nota fiscal
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               fornecedor_id:
 *                 type: integer
 *                 description: ID do fornecedor
 *               venda_id:
 *                 type: integer
 *                 description: ID da venda
 *               compra_id:
 *                 type: integer
 *                 description: ID da compra
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       200:
 *         description: Nota fiscal atualizada com sucesso
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
 *                       description: ID da nota fiscal
 *                     numero_nf:
 *                       type: string
 *                       description: Número da nota fiscal
 *                     serie:
 *                       type: string
 *                       description: Série da nota fiscal
 *                     data_emissao:
 *                       type: string
 *                       format: date
 *                       description: Data de emissão
 *                     data_vencimento:
 *                       type: string
 *                       format: date
 *                       description: Data de vencimento
 *                     valor_total:
 *                       type: number
 *                       description: Valor total da nota fiscal
 *                     tipo:
 *                       type: string
 *                       enum: [entrada, saida]
 *                       description: Tipo da nota fiscal
 *                     status:
 *                       type: string
 *                       enum: [pendente, paga, vencida, cancelada]
 *                       description: Status da nota fiscal
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     fornecedor_id:
 *                       type: integer
 *                       description: ID do fornecedor
 *                     venda_id:
 *                       type: integer
 *                       description: ID da venda
 *                     compra_id:
 *                       type: integer
 *                       description: ID da compra
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Nota fiscal não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = notaFiscalSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('notas_fiscais')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Nota fiscal atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/{id}:
 *   delete:
 *     summary: Deleta uma nota fiscal
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     responses:
 *       200:
 *         description: Nota fiscal deletada com sucesso
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
 *       404:
 *         description: Nota fiscal não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notas_fiscais')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Nota fiscal excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/notas-fiscais/{id}/upload:
 *   post:
 *     summary: Faz upload de arquivo PDF/XML para uma nota fiscal
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da nota fiscal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome_arquivo
 *               - tamanho_arquivo
 *               - tipo_arquivo
 *             properties:
 *               nome_arquivo:
 *                 type: string
 *                 description: Nome do arquivo
 *               tamanho_arquivo:
 *                 type: number
 *                 description: Tamanho do arquivo em bytes
 *               tipo_arquivo:
 *                 type: string
 *                 enum: [pdf, xml]
 *                 description: Tipo do arquivo
 *     responses:
 *       200:
 *         description: Arquivo associado com sucesso
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
 *         description: Dados inválidos
 *       404:
 *         description: Nota fiscal não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/upload', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_arquivo, tamanho_arquivo, tipo_arquivo } = req.body;

    if (!nome_arquivo || !tamanho_arquivo || !tipo_arquivo) {
      return res.status(400).json({
        success: false,
        message: 'Dados do arquivo são obrigatórios'
      });
    }

    const { data, error } = await supabase
      .from('notas_fiscais')
      .update({
        nome_arquivo,
        tamanho_arquivo: parseInt(tamanho_arquivo),
        tipo_arquivo
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    // Aqui você implementaria o upload real do arquivo
    // Por exemplo, usando Supabase Storage:
    /*
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('notas-fiscais')
      .upload(`${id}/${nome_arquivo}`, arquivo);

    if (uploadError) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload do arquivo'
      });
    }
    */

    res.json({
      success: true,
      data,
      message: 'Arquivo vinculado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/notas-fiscais/:id/download - Download do arquivo
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('nome_arquivo, arquivo_nf')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    if (!data.arquivo_nf) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      });
    }

    // Aqui você implementaria a lógica de download do arquivo
    // Por enquanto, retornamos as informações do arquivo
    res.json({
      success: true,
      data: {
        nome_arquivo: data.nome_arquivo,
        caminho: data.arquivo_nf
      }
    });
  } catch (error) {
    console.error('Erro ao fazer download do arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
