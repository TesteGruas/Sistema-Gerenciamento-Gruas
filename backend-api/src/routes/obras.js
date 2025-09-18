import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para obras
const obraSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  cliente_id: Joi.number().integer().positive().required(),
  endereco: Joi.string().required(),
  cidade: Joi.string().required(),
  estado: Joi.string().min(2).max(2).required(),
  tipo: Joi.string().required(),
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).optional(),
  contato_obra: Joi.string().allow('').optional(),
  telefone_obra: Joi.string().allow('').optional(),
  email_obra: Joi.string().email().allow('').optional(),
  status: Joi.string().valid('Planejamento', 'Em Andamento', 'Pausada', 'Concluída', 'Cancelada').default('Pausada'),
  created_at: Joi.date().optional(),
  updated_at: Joi.date().optional(),
  // Campos adicionais para criação automática de cliente
  cliente_nome: Joi.string().optional(),
  cliente_cnpj: Joi.string().optional(),
  cliente_email: Joi.string().email().allow('').optional(),
  cliente_telefone: Joi.string().allow('').optional()
})

/**
 * @swagger
 * /api/obras:
 *   get:
 *     summary: Listar todas as obras
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Planejamento, Em Andamento, Pausada, Concluída, Cancelada]
 *         description: Filtrar por status
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: Filtrar por cliente
 *     responses:
 *       200:
 *         description: Lista de obras
 */
router.get('/', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status, cliente_id } = req.query

    let query = supabaseAdmin
      .from('obras')
      .select(`
        *,
        clientes (
          id,
          nome,
          cnpj,
          email,
          telefone
        )
      `, { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }
    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id)
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar obras',
        message: error.message
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao listar obras:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{id}:
 *   get:
 *     summary: Obter obra por ID
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     responses:
 *       200:
 *         description: Dados da obra
 *       404:
 *         description: Obra não encontrada
 */
router.get('/:id', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('obras')
      .select(`
        *,
        clientes (
          id,
          nome,
          cnpj,
          email,
          telefone
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Obra não encontrada',
          message: 'A obra com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar obra',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras:
 *   post:
 *     summary: Criar nova obra
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - cliente_id
 *               - endereco
 *               - cidade
 *               - estado
 *               - data_inicio
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               cliente_id:
 *                 type: integer
 *               endereco:
 *                 type: string
 *               cidade:
 *                 type: string
 *               estado:
 *                 type: string
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Planejamento, Em Andamento, Pausada, Concluída, Cancelada]
 *     responses:
 *       201:
 *         description: Obra criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('criar_obras'), async (req, res) => {
  try {
    console.log('🔍 DEBUG - Dados recebidos para criação de obra:', req.body)
    
    const { error, value } = obraSchema.validate(req.body)
    if (error) {
      console.error('❌ Erro de validação:', error.details)
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message,
        allErrors: error.details
      })
    }
    
    console.log('✅ Dados validados com sucesso:', value)

    // Verificar se cliente existe
    console.log('🔍 DEBUG - Verificando se cliente existe:', value.cliente_id)
    
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome')
      .eq('id', value.cliente_id)
      .single()

    console.log('📊 Resultado da consulta do cliente:')
    console.log('  - Cliente encontrado:', cliente)
    console.log('  - Erro:', clienteError)

    if (clienteError || !cliente) {
      console.log('❌ Cliente não encontrado, tentando criar automaticamente...')
      
      // Se o cliente não existe, tentar criar automaticamente
      // Verificar se há dados do cliente no corpo da requisição
      const { cliente_nome, cliente_cnpj, cliente_email, cliente_telefone } = req.body
      
      if (cliente_nome && cliente_cnpj) {
        console.log('🔧 Criando cliente automaticamente com dados:', {
          nome: cliente_nome,
          cnpj: cliente_cnpj,
          email: cliente_email,
          telefone: cliente_telefone
        })
        
        // Verificar se cliente já existe pelo CNPJ
        const { data: clienteExistente, error: clienteExistenteError } = await supabaseAdmin
          .from('clientes')
          .select('id, nome, cnpj')
          .eq('cnpj', cliente_cnpj)
          .single()

        if (clienteExistente) {
          console.log('✅ Cliente já existe pelo CNPJ:', clienteExistente)
          // Atualizar o cliente_id para usar o cliente existente
          value.cliente_id = clienteExistente.id
        } else {
          // Criar novo cliente
          const clienteData = {
            nome: cliente_nome,
            cnpj: cliente_cnpj,
            email: cliente_email || null,
            telefone: cliente_telefone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          console.log('📝 Dados do cliente a ser criado:', clienteData)

          const { data: novoCliente, error: insertClienteError } = await supabaseAdmin
            .from('clientes')
            .insert(clienteData)
            .select()
            .single()

          if (insertClienteError) {
            console.error('❌ Erro ao criar cliente:', insertClienteError)
            return res.status(500).json({
              error: 'Erro ao criar cliente',
              message: insertClienteError.message
            })
          }

          console.log('✅ Cliente criado com sucesso:', novoCliente?.id)
          // Atualizar o cliente_id para usar o novo cliente
          value.cliente_id = novoCliente.id
        }
      } else {
        console.log('❌ Dados insuficientes para criar cliente automaticamente')
        return res.status(404).json({
          error: 'Cliente não encontrado',
          message: 'O cliente especificado não existe e não há dados suficientes para criar um novo'
        })
      }
    } else {
      console.log('✅ Cliente encontrado:', cliente.nome)
    }

    // Preparar dados da obra (apenas campos que existem na tabela obras)
    const obraData = {
      nome: value.nome,
      cliente_id: value.cliente_id,
      endereco: value.endereco,
      cidade: value.cidade,
      estado: value.estado,
      tipo: value.tipo,
      cep: value.cep,
      contato_obra: value.contato_obra,
      telefone_obra: value.telefone_obra,
      email_obra: value.email_obra,
      status: value.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Dados da obra a ser criada:', obraData)

    const { data, error: insertError } = await supabaseAdmin
      .from('obras')
      .insert(obraData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erro ao criar obra:', insertError)
      return res.status(500).json({
        error: 'Erro ao criar obra',
        message: insertError.message
      })
    }

    console.log('✅ Obra criada com sucesso:', data?.id)

    res.status(201).json({
      success: true,
      data,
      message: 'Obra criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{id}:
 *   put:
 *     summary: Atualizar obra
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Planejamento, Em Andamento, Pausada, Concluída, Cancelada]
 *               data_prevista_fim:
 *                 type: string
 *                 format: date
 *               valor_total:
 *                 type: number
 *     responses:
 *       200:
 *         description: Obra atualizada com sucesso
 *       404:
 *         description: Obra não encontrada
 */
router.put('/:id', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = obraSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Preparar dados da obra (apenas campos que existem na tabela obras)
    const updateData = {
      nome: value.nome,
      cliente_id: value.cliente_id,
      endereco: value.endereco,
      cidade: value.cidade,
      estado: value.estado,
      tipo: value.tipo,
      cep: value.cep,
      contato_obra: value.contato_obra,
      telefone_obra: value.telefone_obra,
      email_obra: value.email_obra,
      status: value.status,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('obras')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Obra não encontrada',
          message: 'A obra com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar obra',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Obra atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{id}:
 *   delete:
 *     summary: Excluir obra
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     responses:
 *       200:
 *         description: Obra excluída com sucesso
 *       404:
 *         description: Obra não encontrada
 */
router.delete('/:id', authenticateToken, requirePermission('excluir_obras'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('obras')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir obra',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Obra excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// Endpoint de teste para verificar se há triggers no banco
router.post('/teste-cliente-trigger', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Testando se há triggers que criam clientes automaticamente...')
    
    const clienteIdTeste = 99999 // ID que não existe
    
    // Primeiro, vamos verificar se o cliente existe
    const { data: clienteAntes, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome')
      .eq('id', clienteIdTeste)
      .single()

    console.log('📊 Cliente ANTES do teste:', clienteAntes)
    console.log('📊 Erro na consulta:', clienteError)

    // Tentar criar uma obra com cliente inexistente
    const obraData = {
      nome: 'Obra Teste Trigger',
      cliente_id: clienteIdTeste,
      endereco: 'Rua Teste, 123',
      cidade: 'Cidade Teste',
      estado: 'SP',
      tipo: 'Residencial',
      status: 'Pausada',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Tentando criar obra com cliente inexistente:', obraData)

    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .insert(obraData)
      .select()
      .single()

    if (obraError) {
      console.log('❌ Erro ao criar obra (esperado):', obraError.message)
    } else {
      console.log('⚠️ Obra criada mesmo com cliente inexistente:', obra?.id)
    }

    // Verificar se o cliente foi criado automaticamente
    const { data: clienteDepois, error: clienteDepoisError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome')
      .eq('id', clienteIdTeste)
      .single()

    console.log('📊 Cliente DEPOIS do teste:', clienteDepois)

    // Limpar dados de teste se foram criados
    if (obra && !obraError) {
      await supabaseAdmin.from('obras').delete().eq('id', obra.id)
      console.log('🧹 Obra de teste removida')
    }

    if (clienteDepois && !clienteDepoisError) {
      await supabaseAdmin.from('clientes').delete().eq('id', clienteIdTeste)
      console.log('🧹 Cliente de teste removido')
    }

    res.json({
      success: true,
      data: {
        cliente_antes: clienteAntes,
        cliente_depois: clienteDepois,
        obra_criada: obra,
        erro_obra: obraError?.message,
        tem_trigger_cliente: !clienteDepoisError && clienteDepois,
        obra_criada_sem_cliente: !obraError && obra
      },
      message: 'Teste de trigger concluído'
    })
  } catch (error) {
    console.error('Erro no teste de trigger:', error)
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    })
  }
})

// Endpoint de teste para validação de dados de obra
router.post('/teste-validacao', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Testando validação de dados de obra...')
    console.log('📊 Dados recebidos:', req.body)
    
    const { error, value } = obraSchema.validate(req.body)
    
    if (error) {
      console.log('❌ Erro de validação:', error.details)
      return res.json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message,
        allErrors: error.details
      })
    }
    
    console.log('✅ Dados validados com sucesso:', value)
    
    res.json({
      success: true,
      data: value,
      message: 'Dados válidos'
    })
  } catch (error) {
    console.error('Erro no teste de validação:', error)
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    })
  }
})

// Endpoint de teste para verificar cliente ID 1
router.get('/teste-cliente-1', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Testando se cliente ID 1 existe...')
    
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, cnpj, email, telefone')
      .eq('id', 1)
      .single()

    console.log('📊 Cliente ID 1:', cliente)
    console.log('📊 Erro:', clienteError)

    res.json({
      success: true,
      data: {
        cliente,
        erro: clienteError?.message,
        existe: !clienteError && cliente
      },
      message: cliente ? 'Cliente ID 1 existe' : 'Cliente ID 1 não existe'
    })
  } catch (error) {
    console.error('Erro no teste do cliente ID 1:', error)
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    })
  }
})

// Endpoint para criar cliente padrão ID 1 se não existir
router.post('/criar-cliente-padrao', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Criando cliente padrão ID 1...')
    
    // Verificar se cliente ID 1 já existe
    const { data: clienteExistente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, cnpj')
      .eq('id', 1)
      .single()

    if (clienteExistente) {
      console.log('✅ Cliente ID 1 já existe:', clienteExistente)
      return res.json({
        success: true,
        data: clienteExistente,
        message: 'Cliente ID 1 já existe'
      })
    }

    // Criar cliente padrão ID 1
    const clienteData = {
      id: 1,
      nome: 'Cliente Padrão',
      cnpj: '00000000000000',
      email: null,
      telefone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Dados do cliente padrão a ser criado:', clienteData)

    const { data: novoCliente, error: insertError } = await supabaseAdmin
      .from('clientes')
      .insert(clienteData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erro ao criar cliente padrão:', insertError)
      return res.status(500).json({
        error: 'Erro ao criar cliente padrão',
        message: insertError.message
      })
    }

    console.log('✅ Cliente padrão criado com sucesso:', novoCliente?.id)

    res.status(201).json({
      success: true,
      data: novoCliente,
      message: 'Cliente padrão criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar cliente padrão:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// Endpoint para criar cliente automaticamente quando não existe
router.post('/criar-cliente-automatico', authenticateToken, async (req, res) => {
  try {
    const { nome, cnpj, email, telefone } = req.body

    console.log('🔍 DEBUG - Criando cliente automaticamente:', { nome, cnpj, email, telefone })

    // Verificar se cliente já existe pelo CNPJ
    const { data: clienteExistente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, cnpj')
      .eq('cnpj', cnpj)
      .single()

    if (clienteExistente) {
      console.log('✅ Cliente já existe:', clienteExistente)
      return res.json({
        success: true,
        data: clienteExistente,
        message: 'Cliente já existe'
      })
    }

    // Criar novo cliente
    const clienteData = {
      nome,
      cnpj,
      email: email || null,
      telefone: telefone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Dados do cliente a ser criado:', clienteData)

    const { data: novoCliente, error: insertError } = await supabaseAdmin
      .from('clientes')
      .insert(clienteData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erro ao criar cliente:', insertError)
      return res.status(500).json({
        error: 'Erro ao criar cliente',
        message: insertError.message
      })
    }

    console.log('✅ Cliente criado com sucesso:', novoCliente?.id)

    res.status(201).json({
      success: true,
      data: novoCliente,
      message: 'Cliente criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar cliente automaticamente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
