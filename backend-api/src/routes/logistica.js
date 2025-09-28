import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';

const router = express.Router();

// Schema de validação para manifesto
const manifestoSchema = Joi.object({
  numero_manifesto: Joi.string().min(1).max(50).required(),
  data_emissao: Joi.date().required(),
  motorista_id: Joi.number().integer().positive().required(),
  veiculo_id: Joi.number().integer().positive().optional(),
  origem: Joi.string().min(1).max(255).required(),
  destino: Joi.string().min(1).max(255).required(),
  status: Joi.string().valid('pendente', 'em_transito', 'entregue', 'cancelado').default('pendente'),
  observacoes: Joi.string().optional()
});

// Schema de validação para item do manifesto
const manifestoItemSchema = Joi.object({
  grua_id: Joi.string().required(),
  obra_origem_id: Joi.number().integer().positive().optional(),
  obra_destino_id: Joi.number().integer().positive().optional(),
  peso: Joi.number().min(0).optional(),
  dimensoes: Joi.string().max(100).optional(),
  observacoes: Joi.string().optional()
});

// Schema de validação para veículo
const veiculoSchema = Joi.object({
  placa: Joi.string().min(1).max(10).required(),
  modelo: Joi.string().min(1).max(100).required(),
  marca: Joi.string().min(1).max(50).required(),
  tipo: Joi.string().min(1).max(50).required(),
  capacidade: Joi.number().min(0).optional(),
  ano: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).optional(),
  status: Joi.string().valid('ativo', 'inativo', 'manutencao').default('ativo')
});

// ===== ROTAS DE MANIFESTOS =====

/**
 * @swagger
 * /api/logistica/manifestos:
 *   get:
 *     summary: Lista todos os manifestos de logística
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de manifestos
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
 *                         description: ID do manifesto
 *                       numero_manifesto:
 *                         type: string
 *                         description: Número do manifesto
 *                       data_emissao:
 *                         type: string
 *                         format: date
 *                         description: Data de emissão
 *                       motorista_id:
 *                         type: integer
 *                         description: ID do motorista
 *                       veiculo_id:
 *                         type: integer
 *                         description: ID do veículo
 *                       origem:
 *                         type: string
 *                         description: Local de origem
 *                       destino:
 *                         type: string
 *                         description: Local de destino
 *                       status:
 *                         type: string
 *                         enum: [pendente, em_transito, entregue, cancelado]
 *                         description: Status do manifesto
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
 *                       funcionarios:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           telefone:
 *                             type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/manifestos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('logistica_manifestos')
      .select(`
        *,
        funcionarios(nome, telefone)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar manifestos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logistica/manifestos:
 *   post:
 *     summary: Cria um novo manifesto de logística
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_manifesto
 *               - data_emissao
 *               - motorista_id
 *               - origem
 *               - destino
 *             properties:
 *               numero_manifesto:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Número do manifesto
 *               data_emissao:
 *                 type: string
 *                 format: date
 *                 description: Data de emissão
 *               motorista_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID do motorista
 *               veiculo_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID do veículo
 *               origem:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Local de origem
 *               destino:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Local de destino
 *               status:
 *                 type: string
 *                 enum: [pendente, em_transito, entregue, cancelado]
 *                 default: pendente
 *                 description: Status do manifesto
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       201:
 *         description: Manifesto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do manifesto criado
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/manifestos', async (req, res) => {
  try {
    const { error: validationError, value } = manifestoSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('logistica_manifestos')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Manifesto criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logistica/manifestos/{id}:
 *   get:
 *     summary: Obtém um manifesto específico
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do manifesto
 *     responses:
 *       200:
 *         description: Dados do manifesto
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
 *                       description: ID do manifesto
 *                     numero_manifesto:
 *                       type: string
 *                       description: Número do manifesto
 *                     data_emissao:
 *                       type: string
 *                       format: date
 *                       description: Data de emissão
 *                     motorista_id:
 *                       type: integer
 *                       description: ID do motorista
 *                     veiculo_id:
 *                       type: integer
 *                       description: ID do veículo
 *                     origem:
 *                       type: string
 *                       description: Local de origem
 *                     destino:
 *                       type: string
 *                       description: Local de destino
 *                     status:
 *                       type: string
 *                       enum: [pendente, em_transito, entregue, cancelado]
 *                       description: Status do manifesto
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
 *                     funcionarios:
 *                       type: object
 *                       properties:
 *                         nome:
 *                           type: string
 *                         telefone:
 *                           type: string
 *                         email:
 *                           type: string
 *       404:
 *         description: Manifesto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/manifestos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('logistica_manifestos')
      .select(`
        *,
        funcionarios(nome, telefone, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Manifesto não encontrado'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logistica/manifestos/{id}:
 *   put:
 *     summary: Atualiza um manifesto existente
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do manifesto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_manifesto
 *               - data_emissao
 *               - motorista_id
 *               - origem
 *               - destino
 *             properties:
 *               numero_manifesto:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Número do manifesto
 *               data_emissao:
 *                 type: string
 *                 format: date
 *                 description: Data de emissão
 *               motorista_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID do motorista
 *               veiculo_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID do veículo
 *               origem:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Local de origem
 *               destino:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Local de destino
 *               status:
 *                 type: string
 *                 enum: [pendente, em_transito, entregue, cancelado]
 *                 description: Status do manifesto
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       200:
 *         description: Manifesto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do manifesto atualizado
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Manifesto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/manifestos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = manifestoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('logistica_manifestos')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Manifesto não encontrado'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Manifesto atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logistica/manifestos/{id}:
 *   delete:
 *     summary: Exclui um manifesto
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do manifesto
 *     responses:
 *       200:
 *         description: Manifesto excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/manifestos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('logistica_manifestos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Manifesto excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logistica/manifestos/{id}/itens:
 *   get:
 *     summary: Lista os itens de um manifesto
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do manifesto
 *     responses:
 *       200:
 *         description: Lista de itens do manifesto
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
 *                       manifesto_id:
 *                         type: integer
 *                         description: ID do manifesto
 *                       grua_id:
 *                         type: string
 *                         description: ID da grua
 *                       obra_origem_id:
 *                         type: integer
 *                         description: ID da obra de origem
 *                       obra_destino_id:
 *                         type: integer
 *                         description: ID da obra de destino
 *                       peso:
 *                         type: number
 *                         description: Peso do item
 *                       dimensoes:
 *                         type: string
 *                         description: Dimensões do item
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
 *                       gruas:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           modelo:
 *                             type: string
 *                           fabricante:
 *                             type: string
 *                       obras_origem:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           endereco:
 *                             type: string
 *                       obras_destino:
 *                         type: object
 *                         properties:
 *                           nome:
 *                             type: string
 *                           endereco:
 *                             type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/manifestos/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('logistica_manifestos_itens')
      .select(`
        *,
        gruas(id, modelo, fabricante),
        obras_origem:obras!logistica_manifestos_itens_obra_origem_id_fkey(nome, endereco),
        obras_destino:obras!logistica_manifestos_itens_obra_destino_id_fkey(nome, endereco)
      `)
      .eq('manifesto_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar itens do manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logistica/manifestos/{id}/itens:
 *   post:
 *     summary: Adiciona um item a um manifesto
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do manifesto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grua_id
 *             properties:
 *               grua_id:
 *                 type: string
 *                 description: ID da grua
 *               obra_origem_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID da obra de origem
 *               obra_destino_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID da obra de destino
 *               peso:
 *                 type: number
 *                 minimum: 0
 *                 description: Peso do item
 *               dimensoes:
 *                 type: string
 *                 maxLength: 100
 *                 description: Dimensões do item
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       201:
 *         description: Item adicionado ao manifesto com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do item criado
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/manifestos/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = manifestoItemSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const itemData = {
      ...value,
      manifesto_id: parseInt(id)
    };

    const { data, error } = await supabase
      .from('logistica_manifestos_itens')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Item adicionado ao manifesto com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar item ao manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ROTAS DE VEÍCULOS =====

/**
 * @swagger
 * /api/logistica/veiculos:
 *   get:
 *     summary: Lista todos os veículos
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de veículos
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
 *                         description: ID do veículo
 *                       placa:
 *                         type: string
 *                         description: Placa do veículo
 *                       modelo:
 *                         type: string
 *                         description: Modelo do veículo
 *                       marca:
 *                         type: string
 *                         description: Marca do veículo
 *                       tipo:
 *                         type: string
 *                         description: Tipo do veículo
 *                       capacidade:
 *                         type: number
 *                         description: Capacidade do veículo
 *                       ano:
 *                         type: integer
 *                         description: Ano do veículo
 *                       status:
 *                         type: string
 *                         enum: [ativo, inativo, manutencao]
 *                         description: Status do veículo
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de atualização
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/veiculos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logistica/veiculos:
 *   post:
 *     summary: Cria um novo veículo
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - modelo
 *               - marca
 *               - tipo
 *             properties:
 *               placa:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10
 *                 description: Placa do veículo
 *               modelo:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Modelo do veículo
 *               marca:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Marca do veículo
 *               tipo:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Tipo do veículo
 *               capacidade:
 *                 type: number
 *                 minimum: 0
 *                 description: Capacidade do veículo
 *               ano:
 *                 type: integer
 *                 minimum: 1900
 *                 maximum: 2025
 *                 description: Ano do veículo
 *               status:
 *                 type: string
 *                 enum: [ativo, inativo, manutencao]
 *                 default: ativo
 *                 description: Status do veículo
 *     responses:
 *       201:
 *         description: Veículo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do veículo criado
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/veiculos', async (req, res) => {
  try {
    const { error: validationError, value } = veiculoSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('veiculos')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Veículo criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logistica/veiculos/{id}:
 *   get:
 *     summary: Obtém um veículo específico
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     responses:
 *       200:
 *         description: Dados do veículo
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
 *                       description: ID do veículo
 *                     placa:
 *                       type: string
 *                       description: Placa do veículo
 *                     modelo:
 *                       type: string
 *                       description: Modelo do veículo
 *                     marca:
 *                       type: string
 *                       description: Marca do veículo
 *                     tipo:
 *                       type: string
 *                       description: Tipo do veículo
 *                     capacidade:
 *                       type: number
 *                       description: Capacidade do veículo
 *                     ano:
 *                       type: integer
 *                       description: Ano do veículo
 *                     status:
 *                       type: string
 *                       enum: [ativo, inativo, manutencao]
 *                       description: Status do veículo
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
 *       404:
 *         description: Veículo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logistica/veiculos/{id}:
 *   put:
 *     summary: Atualiza um veículo existente
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placa
 *               - modelo
 *               - marca
 *               - tipo
 *             properties:
 *               placa:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10
 *                 description: Placa do veículo
 *               modelo:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Modelo do veículo
 *               marca:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Marca do veículo
 *               tipo:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Tipo do veículo
 *               capacidade:
 *                 type: number
 *                 minimum: 0
 *                 description: Capacidade do veículo
 *               ano:
 *                 type: integer
 *                 minimum: 1900
 *                 maximum: 2025
 *                 description: Ano do veículo
 *               status:
 *                 type: string
 *                 enum: [ativo, inativo, manutencao]
 *                 description: Status do veículo
 *     responses:
 *       200:
 *         description: Veículo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do veículo atualizado
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Veículo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = veiculoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('veiculos')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Veículo atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/logistica/veiculos/{id}:
 *   delete:
 *     summary: Exclui um veículo
 *     tags: [Logística]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     responses:
 *       200:
 *         description: Veículo excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('veiculos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Veículo excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
