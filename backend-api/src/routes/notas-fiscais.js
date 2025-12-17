import express from 'express';
import multer from 'multer';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import Joi from 'joi';
import { XMLParser } from 'fast-xml-parser';

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    // Tipos de arquivo permitidos para notas fiscais
    const allowedTypes = [
      'application/pdf',
      'application/xml',
      'text/xml',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF ou XML.'), false);
    }
  }
});

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
  medicao_id: Joi.number().integer().positive().optional(),
  locacao_id: Joi.number().integer().positive().optional(),
  tipo_nota: Joi.string().valid('locacao', 'circulacao_equipamentos', 'outros_equipamentos', 'medicao', 'fornecedor').optional(),
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
router.post('/:id/upload', upload.single('arquivo'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    // Verificar se a nota fiscal existe
    const { data: notaFiscal, error: notaError } = await supabase
      .from('notas_fiscais')
      .select('id')
      .eq('id', id)
      .single();

    if (notaError || !notaFiscal) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.originalname.split('.').pop();
    const fileName = `nf_${id}_${timestamp}_${randomString}.${extension}`;
    const filePath = `notas-fiscais/${id}/${fileName}`;

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
    }

    // Atualizar nota fiscal com informações do arquivo
    const { data: updatedNota, error: updateError } = await supabase
      .from('notas_fiscais')
      .update({
        nome_arquivo: file.originalname,
        tamanho_arquivo: file.size,
        tipo_arquivo: tipoArquivo,
        arquivo_nf: arquivoUrl
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: updatedNota,
      message: 'Arquivo enviado com sucesso'
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

    // Retornar URL do arquivo para download
    res.json({
      success: true,
      data: {
        nome_arquivo: data.nome_arquivo,
        url: data.arquivo_nf
      }
    });
  } catch (error) {
    console.error('Erro ao obter arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Funções auxiliares para importação de XML
/**
 * Remove caracteres não numéricos do CNPJ
 */
const limparCNPJ = (cnpj) => {
  if (!cnpj) return null;
  return cnpj.replace(/\D/g, '');
};

/**
 * Busca cliente por CNPJ
 */
const buscarClientePorCNPJ = async (cnpj) => {
  try {
    const cnpjLimpo = limparCNPJ(cnpj);
    if (!cnpjLimpo || cnpjLimpo.length < 11) return null;

    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, cnpj')
      .or(`cnpj.eq.${cnpjLimpo},cnpj.ilike.%${cnpjLimpo}%`)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Erro ao buscar cliente por CNPJ:', error);
    return null;
  }
};

/**
 * Busca fornecedor por CNPJ
 */
const buscarFornecedorPorCNPJ = async (cnpj) => {
  try {
    const cnpjLimpo = limparCNPJ(cnpj);
    if (!cnpjLimpo || cnpjLimpo.length < 11) return null;

    const { data, error } = await supabaseAdmin
      .from('fornecedores')
      .select('id, nome, cnpj')
      .or(`cnpj.eq.${cnpjLimpo},cnpj.ilike.%${cnpjLimpo}%`)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar fornecedor:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Erro ao buscar fornecedor por CNPJ:', error);
    return null;
  }
};

/**
 * Determina o tipo de nota baseado no CFOP e natureza da operação
 */
const determinarTipoNota = (cfop, natOp) => {
  if (!cfop && !natOp) return 'fornecedor';

  const natOpLower = (natOp || '').toLowerCase();
  const cfopStr = String(cfop || '');

  // Verificar natureza da operação
  if (natOpLower.includes('locação') || natOpLower.includes('locacao')) {
    return 'locacao';
  }
  if (natOpLower.includes('medição') || natOpLower.includes('medicao')) {
    return 'medicao';
  }
  if (natOpLower.includes('circulação') || natOpLower.includes('circulacao')) {
    return 'circulacao_equipamentos';
  }

  // Verificar CFOP
  if (cfopStr.startsWith('5')) {
    // CFOP 5xxx geralmente são saídas (locação, circulação)
    if (cfopStr === '5908' || cfopStr === '5909') {
      return 'locacao';
    }
    return 'locacao'; // Padrão para CFOP 5xxx
  }
  if (cfopStr.startsWith('6')) {
    // CFOP 6xxx são entradas
    return 'fornecedor';
  }

  return 'fornecedor'; // Padrão
};

/**
 * Converte data ISO para formato YYYY-MM-DD
 */
const formatarData = (dataISO) => {
  if (!dataISO) return null;
  try {
    const data = new Date(dataISO);
    if (isNaN(data.getTime())) return null;
    return data.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

/**
 * Parse do XML da NFe
 */
const parseXMLNFe = (xmlBuffer) => {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
      parseTrueNumberOnly: false,
      arrayMode: false
    });

    const xmlString = xmlBuffer.toString('utf-8');
    const jsonObj = parser.parse(xmlString);

    // Acessar a estrutura da NFe (pode variar dependendo do namespace)
    const nfeProc = jsonObj.nfeProc || jsonObj['nfeProc'] || jsonObj;
    const nfe = nfeProc.NFe || nfeProc['NFe'] || nfeProc;
    const infNFe = nfe.infNFe || nfe['infNFe'] || nfe;

    if (!infNFe) {
      throw new Error('Estrutura XML inválida: não foi possível encontrar infNFe');
    }

    // Extrair dados do ide (identificação)
    const ide = infNFe.ide || {};
    const numeroNF = ide.nNF || ide['nNF'] || '';
    const serie = ide.serie || ide['serie'] || '';
    const dhEmi = ide.dhEmi || ide['dhEmi'] || '';
    const dhSaiEnt = ide.dhSaiEnt || ide['dhSaiEnt'] || '';
    const tpNF = ide.tpNF || ide['tpNF'] || '1'; // 1 = Saída, 0 = Entrada
    const natOp = ide.natOp || ide['natOp'] || '';

    // Extrair dados do emitente
    const emit = infNFe.emit || {};
    const cnpjEmitente = emit.CNPJ || emit['CNPJ'] || '';
    const nomeEmitente = emit.xNome || emit['xNome'] || '';

    // Extrair dados do destinatário
    const dest = infNFe.dest || {};
    const cnpjDestinatario = dest.CNPJ || dest['CNPJ'] || '';
    const nomeDestinatario = dest.xNome || dest['xNome'] || '';

    // Extrair dados dos produtos (primeiro item)
    const det = infNFe.det || {};
    const detArray = Array.isArray(det) ? det : [det];
    const primeiroItem = detArray[0] || {};
    const prod = primeiroItem.prod || {};
    const cfop = prod.CFOP || prod['CFOP'] || '';

    // Extrair totais
    const total = infNFe.total || {};
    const icmsTot = total.ICMSTot || total['ICMSTot'] || {};
    const valorTotal = parseFloat(icmsTot.vNF || icmsTot['vNF'] || '0');

    // Extrair informações adicionais
    const infAdic = infNFe.infAdic || {};
    const infCpl = infAdic.infCpl || infAdic['infCpl'] || '';

    // Extrair protocolo
    const protNFe = nfeProc.protNFe || nfeProc['protNFe'] || {};
    const infProt = protNFe.infProt || protNFe['infProt'] || {};
    const chNFe = infProt.chNFe || infProt['chNFe'] || '';
    const cStat = infProt.cStat || infProt['cStat'] || '';
    const xMotivo = infProt.xMotivo || infProt['xMotivo'] || '';

    // Validar se a NFe está autorizada
    if (cStat !== '100') {
      throw new Error(`NFe não autorizada. Status: ${cStat} - ${xMotivo}`);
    }

    // Determinar tipo (entrada ou saída)
    const tipo = tpNF === '0' ? 'entrada' : 'saida';

    // Determinar tipo de nota
    const tipoNota = determinarTipoNota(cfop, natOp);

    // Montar observações
    let observacoes = '';
    if (natOp) {
      observacoes += `Natureza da operação: ${natOp}\n`;
    }
    if (infCpl) {
      observacoes += infCpl;
    }
    if (chNFe) {
      observacoes += `\nChave de acesso: ${chNFe}`;
    }

    return {
      numero_nf: String(numeroNF),
      serie: String(serie || ''),
      data_emissao: formatarData(dhEmi),
      data_vencimento: formatarData(dhSaiEnt),
      valor_total: valorTotal,
      tipo: tipo,
      tipo_nota: tipoNota,
      observacoes: observacoes.trim(),
      // Dados para busca
      cnpj_emitente: cnpjEmitente,
      nome_emitente: nomeEmitente,
      cnpj_destinatario: cnpjDestinatario,
      nome_destinatario: nomeDestinatario,
      // Dados adicionais
      chave_acesso: chNFe,
      cfop: cfop,
      natureza_operacao: natOp
    };
  } catch (error) {
    console.error('Erro ao fazer parse do XML:', error);
    throw new Error(`Erro ao processar XML: ${error.message}`);
  }
};

/**
 * @swagger
 * /api/notas-fiscais/importar-xml:
 *   post:
 *     summary: Importar nota fiscal a partir de XML
 *     tags: [Notas Fiscais]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Arquivo XML da NFe
 *     responses:
 *       200:
 *         description: Nota fiscal importada com sucesso
 *       400:
 *         description: Dados inválidos ou XML inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/importar-xml', upload.single('arquivo'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo XML enviado'
      });
    }

    // Validar se é XML
    if (!file.mimetype.includes('xml') && !file.originalname.toLowerCase().endsWith('.xml')) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo deve ser um XML válido'
      });
    }

    // Fazer parse do XML
    let dadosNFe;
    try {
      dadosNFe = parseXMLNFe(file.buffer);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao processar XML',
        error: parseError.message
      });
    }

    // Buscar cliente ou fornecedor
    let cliente_id = null;
    let fornecedor_id = null;
    const avisos = [];

    if (dadosNFe.tipo === 'saida') {
      // Para notas de saída, buscar cliente pelo CNPJ do destinatário
      if (dadosNFe.cnpj_destinatario) {
        const cliente = await buscarClientePorCNPJ(dadosNFe.cnpj_destinatario);
        if (cliente) {
          cliente_id = cliente.id;
        } else {
          avisos.push(`Cliente não encontrado: ${dadosNFe.nome_destinatario} (CNPJ: ${dadosNFe.cnpj_destinatario}). Você pode vincular manualmente após a importação.`);
        }
      }
    } else {
      // Para notas de entrada, buscar fornecedor pelo CNPJ do emitente
      if (dadosNFe.cnpj_emitente) {
        const fornecedor = await buscarFornecedorPorCNPJ(dadosNFe.cnpj_emitente);
        if (fornecedor) {
          fornecedor_id = fornecedor.id;
        } else {
          avisos.push(`Fornecedor não encontrado: ${dadosNFe.nome_emitente} (CNPJ: ${dadosNFe.cnpj_emitente}). Você pode vincular manualmente após a importação.`);
        }
      }
    }

    // Verificar se já existe nota fiscal com mesmo número e série
    const { data: notaExistente } = await supabaseAdmin
      .from('notas_fiscais')
      .select('id, numero_nf, serie')
      .eq('numero_nf', dadosNFe.numero_nf)
      .eq('serie', dadosNFe.serie || '')
      .single();

    if (notaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Nota fiscal já existe no sistema',
        data: {
          id: notaExistente.id,
          numero_nf: notaExistente.numero_nf,
          serie: notaExistente.serie
        }
      });
    }

    // Criar nota fiscal
    const notaFiscalData = {
      numero_nf: dadosNFe.numero_nf,
      serie: dadosNFe.serie || null,
      data_emissao: dadosNFe.data_emissao,
      data_vencimento: dadosNFe.data_vencimento || null,
      valor_total: dadosNFe.valor_total,
      tipo: dadosNFe.tipo,
      status: 'pendente',
      tipo_nota: dadosNFe.tipo_nota,
      cliente_id: cliente_id,
      fornecedor_id: fornecedor_id,
      observacoes: dadosNFe.observacoes || null
    };

    // Validar dados
    const { error: validationError, value: validatedData } = notaFiscalSchema.validate(notaFiscalData);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        error: validationError.details[0].message
      });
    }

    // Inserir nota fiscal
    const { data: notaCriada, error: insertError } = await supabaseAdmin
      .from('notas_fiscais')
      .insert(validatedData)
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar nota fiscal:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar nota fiscal',
        error: insertError.message
      });
    }

    // Fazer upload do XML como arquivo anexo
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `nf_${notaCriada.id}_${timestamp}_${randomString}.xml`;
      const filePath = `notas-fiscais/${notaCriada.id}/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('arquivos-obras')
        .upload(filePath, file.buffer, {
          contentType: 'application/xml',
          cacheControl: '3600',
          upsert: false
        });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('arquivos-obras')
          .getPublicUrl(filePath);

        const arquivoUrl = urlData?.publicUrl || `${process.env.SUPABASE_URL}/storage/v1/object/public/arquivos-obras/${filePath}`;

        // Atualizar nota fiscal com informações do arquivo
        await supabaseAdmin
          .from('notas_fiscais')
          .update({
            nome_arquivo: file.originalname,
            tamanho_arquivo: file.size,
            tipo_arquivo: 'xml',
            arquivo_nf: arquivoUrl
          })
          .eq('id', notaCriada.id);
      }
    } catch (uploadError) {
      console.error('Erro ao fazer upload do XML:', uploadError);
      avisos.push('Nota fiscal criada, mas houve erro ao anexar o arquivo XML.');
    }

    // Buscar dados completos da nota criada
    const { data: notaCompleta } = await supabaseAdmin
      .from('notas_fiscais')
      .select(`
        *,
        clientes(id, nome, cnpj),
        fornecedores(id, nome, cnpj)
      `)
      .eq('id', notaCriada.id)
      .single();

    res.json({
      success: true,
      data: notaCompleta,
      message: 'Nota fiscal importada com sucesso',
      avisos: avisos.length > 0 ? avisos : undefined
    });
  } catch (error) {
    console.error('Erro ao importar XML:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
