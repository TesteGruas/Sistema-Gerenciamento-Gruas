import express from 'express'
import Joi from 'joi'
import crypto from 'crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

// Função auxiliar para gerar senha segura aleatória
function generateSecurePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  const randomBytes = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length]
  }
  
  return password
}

const router = express.Router()

// Schema de validação para clientes
const clienteSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  cnpj: Joi.string().allow('').optional(), // CNPJ
  email: Joi.string().email().allow('').optional(),
  telefone: Joi.string().allow('').optional(),
  endereco: Joi.string().allow('').optional(),
  cidade: Joi.string().allow('').optional(),
  estado: Joi.string().length(2).allow('').optional(),
  cep: Joi.string().pattern(/^[\d]{2}\.?[\d]{3}-?[\d]{3}$/).allow('').optional(),
  contato: Joi.string().allow('').optional(), // Nome do representante
  contato_email: Joi.string().email().allow('').optional(), // Email do representante
  contato_cpf: Joi.string().allow('').optional(), // CPF do representante
  contato_telefone: Joi.string().allow('').optional(), // Telefone do representante
  status: Joi.string().valid('ativo', 'inativo', 'bloqueado', 'pendente').default('ativo').optional(),
  // Campos para criação do usuário
  criar_usuario: Joi.boolean().default(true).optional(),
  usuario_senha: Joi.string().min(6).when('criar_usuario', { is: true, then: Joi.required(), otherwise: Joi.optional() })
})

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Listar todos os clientes
 *     tags: [Clientes]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome, email ou CNPJ (LIKE)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, inativo, bloqueado, pendente]
 *         description: Filtrar por status do cliente
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get('/', authenticateToken, requirePermission('visualizar_clientes'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    let query = supabaseAdmin
      .from('clientes')
      .select(`
        *,
        usuario:usuarios!contato_usuario_id(
          id,
          nome,
          email,
          status
        )
      `, { count: 'exact' })

    // Aplicar filtro de busca
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`
      query = query.or(`nome.ilike.${searchTerm},email.ilike.${searchTerm},cnpj.ilike.${searchTerm}`)
    }

    // Aplicar filtro de status
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar clientes',
        message: error.message
      })
    }

    // Adicionar informações sobre usuário existente para cada cliente
    const clientesComUsuario = (data || []).map(cliente => ({
      ...cliente,
      usuario_existe: !!cliente.contato_usuario_id,
      usuario_criado: !!cliente.contato_usuario_id
    }))

    const totalPages = Math.ceil(count / limit)

    res.json({
      success: true,
      data: clientesComUsuario,
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao listar clientes:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/clientes/{id}:
 *   get:
 *     summary: Obter cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Dados do cliente
 *       404:
 *         description: Cliente não encontrado
 */
router.get('/:id', authenticateToken, requirePermission('visualizar_clientes'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select(`
        *,
        usuario:usuarios!contato_usuario_id(
          id,
          nome,
          email,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          message: 'O cliente com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar cliente',
        message: error.message
      })
    }

    // Adicionar informações sobre o usuário vinculado
    const responseData = {
      ...data,
      usuario_existe: !!data.contato_usuario_id,
      usuario_criado: !!data.contato_usuario_id
    }

    res.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Criar novo cliente
 *     tags: [Clientes]
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
 *               - cnpj
 *             properties:
 *               nome:
 *                 type: string
 *               cnpj:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               telefone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('criar_clientes'), async (req, res) => {
  try {
    const { error, value } = clienteSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { criar_usuario, usuario_senha, ...clienteData } = value

    // Iniciar transação
    let usuarioId = null
    let senhaTemporaria = null

    // Criar usuário se solicitado
    if (criar_usuario && value.contato && value.contato_email) {
      try {
        // Verificar se já existe um usuário com este email
        const { data: existingUser } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .eq('email', value.contato_email)
          .single()

        if (existingUser) {
          return res.status(400).json({
            error: 'Email já cadastrado',
            message: 'Já existe um usuário cadastrado com este email'
          })
        }

        // Gerar senha temporária
        senhaTemporaria = generateSecurePassword()

        // 1. Criar usuário no Supabase Auth primeiro
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: value.contato_email,
          password: senhaTemporaria,
          email_confirm: true, // Confirmar email automaticamente
          user_metadata: {
            nome: value.contato,
            tipo: 'cliente'
          }
        })

        if (authError) {
          return res.status(500).json({
            error: 'Erro ao criar usuário no sistema de autenticação',
            message: authError.message
          })
        }

        // 2. Criar usuário na tabela
        const usuarioData = {
          nome: value.contato,
          email: value.contato_email,
          cpf: value.contato_cpf || null,
          telefone: value.contato_telefone || null,
          endereco: value.endereco || null,
          cidade: value.cidade || null,
          estado: value.estado || null,
          cep: value.cep || null,
          status: 'Ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: novoUsuario, error: usuarioError } = await supabaseAdmin
          .from('usuarios')
          .insert(usuarioData)
          .select()
          .single()

        if (usuarioError) {
          // Se falhou ao criar na tabela, remover do Auth
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          
          return res.status(500).json({
            error: 'Erro ao criar usuário',
            message: usuarioError.message
          })
        }

        usuarioId = novoUsuario.id

        // Atribuir perfil de cliente ao usuário
        const { error: perfilError } = await supabaseAdmin
          .from('usuario_perfis')
          .insert({
            usuario_id: usuarioId,
            perfil_id: 6, // ID do perfil "Cliente"
            status: 'Ativa',
            data_atribuicao: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (perfilError) {
          console.error('Erro ao atribuir perfil ao usuário:', perfilError)
          // Não falhar a criação do cliente por causa disso
        }

      } catch (usuarioError) {
        console.error('Erro ao criar usuário:', usuarioError)
        return res.status(500).json({
          error: 'Erro ao criar usuário',
          message: usuarioError.message
        })
      }
    }

    // Criar cliente
    const clienteInsertData = {
      ...clienteData,
      contato_usuario_id: usuarioId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('clientes')
      .insert(clienteInsertData)
      .select()
      .single()

    if (insertError) {
      // Se falhou ao criar cliente, remover usuário do Auth e da tabela
      if (usuarioId && criar_usuario) {
        // Buscar authData
        try {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
          const authUser = users.find(u => u.email === value.contato_email)
          if (authUser) {
            await supabaseAdmin.auth.admin.deleteUser(authUser.id)
          }
        } catch (e) {
          console.error('Erro ao remover usuário do Auth:', e)
        }
        
        await supabaseAdmin
          .from('usuarios')
          .delete()
          .eq('id', usuarioId)
      }
      
      return res.status(500).json({
        error: 'Erro ao criar cliente',
        message: insertError.message
      })
    }

    const responseData = {
      ...data,
      usuario_criado: !!usuarioId,
      usuario_id: usuarioId
    }

    // Adicionar senha temporária se criou usuário
    if (criar_usuario && usuarioId && senhaTemporaria) {
      responseData.senha_temporaria = senhaTemporaria
    }

    res.status(201).json({
      success: true,
      data: responseData,
      message: usuarioId ? 'Cliente e usuário criados com sucesso. Senha temporária gerada.' : 'Cliente criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/clientes/{id}:
 *   put:
 *     summary: Atualizar cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               telefone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo, Bloqueado, Pendente]
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
router.put('/:id', authenticateToken, requirePermission('editar_clientes'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = clienteSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Filtrar campos que não devem ser salvos na tabela clientes
    const { criar_usuario, usuario_senha, ...clienteData } = value

    const updateData = {
      ...clienteData,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('clientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          message: 'O cliente com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar cliente',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Cliente atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/clientes/{id}:
 *   delete:
 *     summary: Excluir cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente excluído com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
router.delete('/:id', authenticateToken, requirePermission('excluir_clientes'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir cliente',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Cliente excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
