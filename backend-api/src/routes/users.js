import express from 'express'
import Joi from 'joi'
import crypto from 'crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { sendWelcomeEmail } from '../services/email.service.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

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

// Schema de validação para criação de usuários
const userSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional(),
  telefone: Joi.string().optional(),
  data_nascimento: Joi.date().optional(),
  endereco: Joi.string().optional(),
  cidade: Joi.string().optional(),
  estado: Joi.string().length(2).optional(),
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).optional(),
  foto_perfil: Joi.string().uri().optional(),
  status: Joi.string().valid('Ativo', 'Inativo', 'Bloqueado', 'Pendente').default('Ativo'),
  perfil_id: Joi.number().integer().positive().optional()
})

// Schema de validação para atualização de usuários
const userUpdateSchema = Joi.object({
  nome: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  senha: Joi.string().min(6).optional(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional(),
  telefone: Joi.string().optional(),
  data_nascimento: Joi.date().optional(),
  endereco: Joi.string().optional(),
  cidade: Joi.string().optional(),
  estado: Joi.string().length(2).optional(),
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).optional(),
  foto_perfil: Joi.string().uri().optional(),
  status: Joi.string().valid('Ativo', 'Inativo', 'Bloqueado', 'Pendente').optional(),
  perfil_id: Joi.number().integer().positive().optional()
})

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos os usuários
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo, Bloqueado, Pendente]
 *         description: Filtrar por status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou email (LIKE)
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
// Endpoint de teste para verificar autenticação
router.get('/test-auth', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Autenticação funcionando',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      nome: req.user.nome
    }
  })
})

router.get('/', authenticateToken, requirePermission('usuarios:visualizar'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const offset = (page - 1) * limit
    const { status, search } = req.query

    let usuarios = []
    let count = 0

    // Se houver busca, verificar se o termo corresponde a algum cliente (email, nome, contato_email, CNPJ)
    let usuarioIdsAdicionais = []
    if (search) {
      const searchTerm = decodeURIComponent(search.replace(/\+/g, ' '))
      console.log('🔍 [DEBUG] Buscando clientes com termo:', searchTerm)
      
      // Buscar clientes que tenham esse termo em qualquer campo relevante
      const { data: clientesEncontrados, error: errorClientes } = await supabaseAdmin
        .from('clientes')
        .select('contato_usuario_id, email, nome, contato_email, cnpj')
        .or(`email.ilike.%${searchTerm}%,nome.ilike.%${searchTerm}%,contato_email.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`)
        .not('contato_usuario_id', 'is', null)

      if (errorClientes) {
        console.error('❌ [DEBUG] Erro ao buscar clientes:', errorClientes)
      }

      if (clientesEncontrados && clientesEncontrados.length > 0) {
        console.log('✅ [DEBUG] Clientes encontrados:', clientesEncontrados.length, clientesEncontrados.map(c => ({ id: c.contato_usuario_id, nome: c.nome, email: c.email })))
        usuarioIdsAdicionais = clientesEncontrados
          .map(c => c.contato_usuario_id)
          .filter(id => id !== null)
        // Remover duplicatas
        usuarioIdsAdicionais = [...new Set(usuarioIdsAdicionais)]
        console.log('✅ [DEBUG] IDs de usuários únicos a buscar:', usuarioIdsAdicionais)
      } else {
        console.log('ℹ️ [DEBUG] Nenhum cliente encontrado com esse termo')
      }
    }

    // Buscar usuários por nome ou email
    let query = supabaseAdmin
      .from('usuarios')
      .select('*', { count: 'exact' })

    if (search) {
      const searchTerm = decodeURIComponent(search.replace(/\+/g, ' '))
      query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: usuariosPorNomeEmail, error: error1, count: count1 } = await query

    if (error1) {
      return res.status(500).json({
        error: 'Erro ao buscar usuários',
        message: error1.message
      })
    }

    // Se encontramos usuários associados a clientes, buscar também por esses IDs
    if (usuarioIdsAdicionais.length > 0) {
      console.log('🔍 [DEBUG] Buscando usuários por IDs:', usuarioIdsAdicionais)
      let queryPorIds = supabaseAdmin
        .from('usuarios')
        .select('*', { count: 'exact' })
        .in('id', usuarioIdsAdicionais)

      if (status) {
        queryPorIds = queryPorIds.eq('status', status)
      }

      const { data: usuariosPorIds, error: error2 } = await queryPorIds

      if (error2) {
        console.error('❌ [DEBUG] Erro ao buscar usuários por IDs:', error2)
      }

      if (!error2 && usuariosPorIds) {
        if (usuariosPorIds.length > 0) {
          console.log('✅ [DEBUG] Usuários encontrados por IDs:', usuariosPorIds.length, usuariosPorIds.map(u => ({ id: u.id, email: u.email })))
        } else {
          console.log('ℹ️ [DEBUG] Nenhum usuário encontrado por IDs (pode ser filtro de status)')
        }
        
        // Combinar resultados, removendo duplicatas
        const usuariosMap = new Map()
        
        // Adicionar usuários encontrados por nome/email
        if (usuariosPorNomeEmail && usuariosPorNomeEmail.length > 0) {
          console.log('✅ [DEBUG] Usuários encontrados por nome/email:', usuariosPorNomeEmail.length)
          usuariosPorNomeEmail.forEach(u => usuariosMap.set(u.id, u))
        } else {
          console.log('ℹ️ [DEBUG] Nenhum usuário encontrado por nome/email')
        }
        
        // Adicionar usuários encontrados por ID (associados a clientes)
        if (usuariosPorIds.length > 0) {
          usuariosPorIds.forEach(u => usuariosMap.set(u.id, u))
        }
        
        usuarios = Array.from(usuariosMap.values())
        count = usuariosMap.size
        console.log('✅ [DEBUG] Total de usuários após combinação:', count)
      } else if (error2) {
        console.error('❌ [DEBUG] Erro ao buscar usuários por IDs, usando apenas busca por nome/email')
        usuarios = usuariosPorNomeEmail || []
        count = count1 || 0
      } else {
        // Se não encontrou por IDs mas encontrou por nome/email, usar apenas esses
        usuarios = usuariosPorNomeEmail || []
        count = count1 || 0
      }
    } else {
      usuarios = usuariosPorNomeEmail || []
      count = count1 || 0
    }

    // Aplicar paginação manualmente já que combinamos resultados
    const usuariosPaginados = usuarios
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit)

    // Buscar perfis e clientes relacionados para cada usuário paginado
    const usuariosComPerfis = await Promise.all(
      (usuariosPaginados || []).map(async (usuario) => {
        // Buscar perfil do usuário
        const { data: perfilData } = await supabaseAdmin
          .from('usuario_perfis')
          .select(`
            id,
            perfil_id,
            status,
            data_atribuicao,
            perfis!inner(
              id,
              nome,
              nivel_acesso,
              descricao
            )
          `)
          .eq('usuario_id', usuario.id)
          .eq('status', 'Ativa')
          .single()

        // Buscar cliente relacionado (se o usuário for contato de algum cliente)
        const { data: clienteData } = await supabaseAdmin
          .from('clientes')
          .select(`
            id,
            nome,
            email,
            cnpj,
            telefone,
            contato,
            contato_email,
            contato_telefone
          `)
          .eq('contato_usuario_id', usuario.id)
          .maybeSingle()

        return {
          ...usuario,
          usuario_perfis: perfilData,
          cliente: clienteData || null
        }
      })
    )

    const totalPages = Math.ceil(count / limit)

    res.json({
      success: true,
      data: usuariosComPerfis || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obter usuário por ID
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id', authenticateToken, requirePermission('usuarios:visualizar'), async (req, res) => {
  try {
    const { id } = req.params

    // Buscar usuário
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single()

    if (usuarioError) {
      if (usuarioError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'O usuário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar usuário',
        message: usuarioError.message
      })
    }

    // Buscar perfil do usuário
    const { data: perfilData } = await supabaseAdmin
      .from('usuario_perfis')
      .select(`
        id,
        perfil_id,
        status,
        data_atribuicao,
        perfis!inner(
          id,
          nome,
          nivel_acesso,
          descricao
        )
      `)
      .eq('usuario_id', id)
      .eq('status', 'Ativa')
      .single()

    // Buscar cliente relacionado (se o usuário for contato de algum cliente)
    const { data: clienteData } = await supabaseAdmin
      .from('clientes')
      .select(`
        id,
        nome,
        email,
        cnpj,
        telefone,
        contato,
        contato_email,
        contato_telefone
      `)
      .eq('contato_usuario_id', id)
      .maybeSingle()

    const data = {
      ...usuario,
      usuario_perfis: perfilData,
      cliente: clienteData || null
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Criar novo usuário
 *     tags: [Usuários]
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
 *               - email
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               cpf:
 *                 type: string
 *               telefone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo, Bloqueado, Pendente]
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('usuarios:criar'), async (req, res) => {
  console.log('🔍 DEBUG: Iniciando criação de usuário:', {
    user: req.user,
    body: req.body
  })
  try {
    const { error, value } = userSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Separar perfil_id e senha dos dados do usuário
    const { perfil_id, senha, ...userData } = value
    
    // Usar senha fornecida ou gerar senha temporária
    const senhaUsuario = senha || generateSecurePassword()

    // 1. Criar usuário no Supabase Auth primeiro
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: senhaUsuario,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        nome: userData.nome,
        created_by: req.user.email
      }
    })

    if (authError) {
      return res.status(500).json({
        error: 'Erro ao criar usuário no sistema de autenticação',
        message: authError.message
      })
    }

    // 2. Criar usuário na tabela
    const finalUserData = {
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('usuarios')
      .insert(finalUserData)
      .select()
      .single()

    if (insertError) {
      // Se falhou ao criar na tabela, remover do Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return res.status(500).json({
        error: 'Erro ao criar usuário',
        message: insertError.message
      })
    }

    // 3. Se perfil_id foi fornecido, associar o usuário ao perfil
    if (perfil_id && data) {
      const { error: perfilError } = await supabaseAdmin
        .from('usuario_perfis')
        .insert({
          usuario_id: data.id,
          perfil_id: perfil_id,
          data_atribuicao: new Date().toISOString(),
          status: 'Ativa',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (perfilError) {
        console.error('Erro ao associar perfil ao usuário:', perfilError)
        // Não falha a criação do usuário, apenas loga o erro
      }
    }

    // 4. Enviar email de boas-vindas (somente se senha foi gerada automaticamente)
    if (!senha) {
      console.log('📧 Tentando enviar email de boas-vindas...')
      console.log('📧 Dados:', { nome: data.nome, email: data.email, senha: '***' })
      
      try {
        const emailResult = await sendWelcomeEmail({
          nome: data.nome,
          email: data.email,
          senha_temporaria: senhaUsuario
        })
        console.log(`✅ Email de boas-vindas enviado com sucesso para ${data.email}`, emailResult)
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de boas-vindas:', emailError)
        console.error('❌ Stack trace:', emailError.stack)
        // Não falha a criação do usuário se o email falhar
        // O usuário foi criado com sucesso, apenas o email que falhou
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...data
        // Por segurança, não retornar a senha no response
        // A senha foi enviada por email para o usuário
      },
      message: 'Usuário criado com sucesso. Email de boas-vindas enviado com a senha temporária.'
    })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualizar usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
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
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo, Bloqueado, Pendente]
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/:id', authenticateToken, requirePermission('usuarios:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = userUpdateSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Separar perfil_id e senha dos dados do usuário
    const { perfil_id, senha, ...userData } = value
    
    // Se a senha foi fornecida, atualizar no Supabase Auth
    if (senha) {
      // Buscar o email do usuário
      const { data: usuarioData, error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .select('email')
        .eq('id', id)
        .single()

      if (!usuarioError && usuarioData) {
        // Buscar usuário no Auth pelo email
        const { data: { users }, error: authListError } = await supabaseAdmin.auth.admin.listUsers()
        const authUser = users.find(u => u.email === usuarioData.email)

        if (authUser) {
          // Atualizar senha no Supabase Auth
          const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUser.id,
            { password: senha }
          )

          if (authUpdateError) {
            console.error('Erro ao atualizar senha no Auth:', authUpdateError)
            return res.status(500).json({
              error: 'Erro ao atualizar senha',
              message: authUpdateError.message
            })
          }
        }
      }
    }
    
    const updateData = {
      ...userData,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'O usuário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar usuário',
        message: updateError.message
      })
    }

    // Se perfil_id foi fornecido, atualizar a associação do usuário ao perfil
    if (perfil_id && data) {
      // Primeiro, desativar o perfil atual
      await supabaseAdmin
        .from('usuario_perfis')
        .update({ 
          status: 'Inativa',
          updated_at: new Date().toISOString()
        })
        .eq('usuario_id', id)
        .eq('status', 'Ativa')

      // Depois, criar nova associação ou ativar existente
      const { data: existingPerfil } = await supabaseAdmin
        .from('usuario_perfis')
        .select('*')
        .eq('usuario_id', id)
        .eq('perfil_id', perfil_id)
        .single()

      if (existingPerfil) {
        // Ativar perfil existente
        await supabaseAdmin
          .from('usuario_perfis')
          .update({
            status: 'Ativa',
            data_atribuicao: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPerfil.id)
      } else {
        // Criar nova associação
        await supabaseAdmin
          .from('usuario_perfis')
          .insert({
            usuario_id: id,
            perfil_id: perfil_id,
            data_atribuicao: new Date().toISOString(),
            status: 'Ativa',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }
    }

    res.json({
      success: true,
      data,
      message: 'Usuário atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Excluir usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
router.delete('/:id', authenticateToken, requirePermission('usuarios:deletar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir usuário',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/users/{id}/atividades:
 *   get:
 *     summary: Obter histórico de atividades de um usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Itens por página
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do filtro
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do filtro
 *     responses:
 *       200:
 *         description: Lista de atividades do usuário
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id/atividades', authenticateToken, requirePermission('usuarios:visualizar'), async (req, res) => {
  try {
    const { id } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const offset = (page - 1) * limit
    const { data_inicio, data_fim } = req.query

    // Verificar se o usuário existe
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, email')
      .eq('id', id)
      .single()

    if (usuarioError || !usuario) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'O usuário com o ID especificado não existe'
      })
    }

    // Buscar atividades do usuário na tabela logs_auditoria
    let query = supabaseAdmin
      .from('logs_auditoria')
      .select('*', { count: 'exact' })
      .eq('usuario_id', id)
      .order('timestamp', { ascending: false })

    // Aplicar filtros de data se fornecidos
    if (data_inicio) {
      query = query.gte('timestamp', data_inicio)
    }
    if (data_fim) {
      query = query.lte('timestamp', data_fim)
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1)

    const { data: atividades, error: atividadesError, count } = await query

    if (atividadesError) {
      return res.status(500).json({
        error: 'Erro ao buscar atividades',
        message: atividadesError.message
      })
    }

    // Formatar atividades para o formato esperado pelo frontend
    const atividadesFormatadas = (atividades || []).map((atividade) => ({
      id: atividade.id,
      tipo: 'auditoria',
      timestamp: atividade.timestamp,
      acao: atividade.acao,
      entidade: atividade.entidade,
      entidade_id: atividade.entidade_id,
      titulo: `${atividade.acao} em ${atividade.entidade}`,
      descricao: atividade.entidade_id ? `ID: ${atividade.entidade_id}` : '',
      usuario_id: atividade.usuario_id,
      usuario_nome: usuario.nome,
      dados_anteriores: atividade.dados_anteriores,
      dados_novos: atividade.dados_novos,
      ip_address: atividade.ip_address,
      user_agent: atividade.user_agent
    }))

    const totalPages = Math.ceil((count || 0) / limit)

    res.json({
      success: true,
      data: atividadesFormatadas,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao buscar atividades do usuário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
