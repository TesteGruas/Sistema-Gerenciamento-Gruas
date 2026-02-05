import express from 'express'
import Joi from 'joi'
import crypto from 'crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'
import { sendWelcomeEmail } from '../services/email.service.js'

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
  usuario_senha: Joi.string().min(6).optional().allow('', null)
})

// Schema para atualização (campos opcionais e sem validação de senha)
const clienteUpdateSchema = Joi.object({
  nome: Joi.string().min(2).optional(),
  cnpj: Joi.string().allow('').optional(),
  email: Joi.string().email().allow('').optional(),
  telefone: Joi.string().allow('').optional(),
  endereco: Joi.string().allow('').optional(),
  cidade: Joi.string().allow('').optional(),
  estado: Joi.string().length(2).allow('').optional(),
  cep: Joi.string().pattern(/^[\d]{2}\.?[\d]{3}-?[\d]{3}$/).allow('').optional(),
  contato: Joi.string().allow('').optional(),
  contato_email: Joi.string().email().allow('').optional(),
  contato_cpf: Joi.string().allow('').optional(),
  contato_telefone: Joi.string().allow('').optional(),
  status: Joi.string().valid('ativo', 'inativo', 'bloqueado', 'pendente').optional(),
  criar_usuario: Joi.boolean().optional(),
  usuario_senha: Joi.string().min(8).optional()
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
router.get('/', authenticateToken, requirePermission('clientes:visualizar'), async (req, res) => {
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
router.get('/:id', authenticateToken, requirePermission('clientes:visualizar'), async (req, res) => {
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
router.post('/', authenticateToken, requirePermission('clientes:criar'), async (req, res) => {
  try {
    const { error, value } = clienteSchema.validate(req.body, {
      abortEarly: false,
      messages: {
        'string.min': 'O campo {#label} deve ter no mínimo {#limit} caracteres',
        'string.max': 'O campo {#label} deve ter no máximo {#limit} caracteres',
        'string.email': 'O email fornecido é inválido',
        'any.required': 'O campo {#label} é obrigatório',
        'string.pattern.base': 'O formato do campo {#label} é inválido',
        'string.length': 'O campo {#label} deve ter exatamente {#limit} caracteres'
      }
    })
    if (error) {
      // Mapear mensagens de erro para português mais amigável
      const mensagensErro = {
        'nome': 'O nome é obrigatório e deve ter no mínimo 2 caracteres',
        'cnpj': 'O CNPJ fornecido é inválido',
        'email': 'O email fornecido é inválido',
        'contato_email': 'O email do representante fornecido é inválido',
        'contato_cpf': 'O CPF do representante fornecido é inválido',
        'cep': 'O CEP fornecido é inválido',
        'estado': 'O estado deve ter exatamente 2 caracteres',
        'usuario_senha': 'A senha do usuário deve ter no mínimo 6 caracteres'
      }
      
      const primeiroErro = error.details[0]
      const campo = primeiroErro.path[0]
      const mensagemAmigavel = mensagensErro[campo] || primeiroErro.message
      
      return res.status(400).json({
        error: 'Dados inválidos',
        message: mensagemAmigavel,
        details: primeiroErro.message
      })
    }

    const { criar_usuario, usuario_senha, ...clienteData } = value

    // Iniciar transação
    let usuarioId = null
    let senhaTemporaria = null
    let usuarioJaExistia = false

    // Criar usuário se solicitado (padrão: true se houver contato e contato_email)
    const deveCriarUsuario = criar_usuario !== false && value.contato && value.contato_email
    
    if (deveCriarUsuario) {
      try {
        // Verificar se já existe um usuário com este email
        const { data: existingUser } = await supabaseAdmin
          .from('usuarios')
          .select('id, nome')
          .eq('email', value.contato_email)
          .maybeSingle()

        if (existingUser) {
          // Usuário já existe, apenas vincular ao cliente
          console.log(`ℹ️ Usuário já existe com email ${value.contato_email}, vinculando ao cliente`)
          usuarioId = existingUser.id
          usuarioJaExistia = true
          
          // Verificar se o usuário já tem perfil de cliente, se não tiver, adicionar
          const { data: perfilExistente } = await supabaseAdmin
            .from('usuario_perfis')
            .select('id')
            .eq('usuario_id', usuarioId)
            .eq('perfil_id', 6) // ID do perfil "Cliente"
            .eq('status', 'Ativa')
            .maybeSingle()
          
          if (!perfilExistente) {
            // Adicionar perfil de cliente ao usuário existente
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
              console.error('Erro ao atribuir perfil de cliente ao usuário existente:', perfilError)
            }
          }
        } else {
          // Usuário não existe, criar novo

          // Gerar senha temporária (usar a fornecida ou gerar uma nova)
          senhaTemporaria = usuario_senha || generateSecurePassword()

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
        }

      } catch (usuarioError) {
        console.error('Erro ao criar/vincular usuário:', usuarioError)
        return res.status(500).json({
          error: 'Erro ao criar/vincular usuário',
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
      // Se falhou ao criar cliente, remover usuário do Auth e da tabela (apenas se foi criado novo, não se já existia)
      if (usuarioId && deveCriarUsuario && !usuarioJaExistia) {
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
      usuario_vinculado: usuarioJaExistia,
      usuario_id: usuarioId
    }

    // Enviar email e WhatsApp se criou novo usuário (não enviar se apenas vinculou existente)
    if (deveCriarUsuario && usuarioId && !usuarioJaExistia && senhaTemporaria && value.contato_email) {
      // Enviar email de boas-vindas
      console.log('📧 Tentando enviar email de boas-vindas para cliente...')
      console.log('📧 Dados:', { nome: value.contato, email: value.contato_email, senha: '***' })
      
      try {
        const emailResult = await sendWelcomeEmail({
          nome: value.contato,
          email: value.contato_email,
          senha_temporaria: senhaTemporaria
        })
        console.log(`✅ Email de boas-vindas enviado com sucesso para ${value.contato_email}`, emailResult)
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de boas-vindas:', emailError)
        console.error('❌ Stack trace:', emailError.stack)
        // Não falha a criação do cliente se o email falhar
      }

      // Enviar mensagem WhatsApp com instruções de acesso (não bloquear criação se falhar)
      try {
        const { enviarMensagemNovoUsuarioCliente } = await import('../services/whatsapp-service.js');
        await enviarMensagemNovoUsuarioCliente(
          data,
          value.contato_email,
          senhaTemporaria
        ).catch(whatsappError => {
          console.error('❌ Erro ao enviar mensagem WhatsApp (não bloqueia criação):', whatsappError);
        });
      } catch (importError) {
        console.error('❌ Erro ao importar serviço WhatsApp (não bloqueia criação):', importError);
      }
    }

    let mensagemSucesso = 'Cliente criado com sucesso'
    if (usuarioId) {
      if (usuarioJaExistia) {
        mensagemSucesso = 'Cliente criado e usuário existente vinculado com sucesso'
      } else {
        mensagemSucesso = 'Cliente e usuário criados com sucesso. Email e WhatsApp com senha temporária enviados.'
      }
    }

    res.status(201).json({
      success: true,
      data: responseData,
      message: mensagemSucesso
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
router.put('/:id', authenticateToken, requirePermission('clientes:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = clienteUpdateSchema.validate(req.body, {
      abortEarly: false,
      messages: {
        'string.min': 'O campo {#label} deve ter no mínimo {#limit} caracteres',
        'string.max': 'O campo {#label} deve ter no máximo {#limit} caracteres',
        'string.email': 'O email fornecido é inválido',
        'any.required': 'O campo {#label} é obrigatório',
        'string.pattern.base': 'O formato do campo {#label} é inválido',
        'string.length': 'O campo {#label} deve ter exatamente {#limit} caracteres'
      }
    })
    if (error) {
      // Mapear mensagens de erro para português mais amigável
      const mensagensErro = {
        'nome': 'O nome deve ter no mínimo 2 caracteres',
        'cnpj': 'O CNPJ fornecido é inválido',
        'email': 'O email fornecido é inválido',
        'contato_email': 'O email do representante fornecido é inválido',
        'contato_cpf': 'O CPF do representante fornecido é inválido',
        'cep': 'O CEP fornecido é inválido',
        'estado': 'O estado deve ter exatamente 2 caracteres'
      }
      
      const primeiroErro = error.details[0]
      const campo = primeiroErro.path[0]
      const mensagemAmigavel = mensagensErro[campo] || primeiroErro.message
      
      return res.status(400).json({
        error: 'Dados inválidos',
        message: mensagemAmigavel,
        details: primeiroErro.message
      })
    }

    // Separar campos de usuário dos dados do cliente
    const { criar_usuario, usuario_senha, ...clienteData } = value

    // Buscar cliente atual para verificar se já tem usuário vinculado
    const { data: clienteAtual, error: erroBusca } = await supabaseAdmin
      .from('clientes')
      .select('contato_usuario_id, contato, contato_email')
      .eq('id', id)
      .single()

    if (erroBusca) {
      if (erroBusca.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          message: 'O cliente com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar cliente',
        message: erroBusca.message
      })
    }

    // Se deve criar usuário e o cliente não tem usuário vinculado
    let usuarioId = clienteAtual.contato_usuario_id
    let senhaTemporaria = null
    let usuarioJaExistia = false
    let usuarioCriadoAgora = false

    if (criar_usuario && !usuarioId && clienteData.contato && clienteData.contato_email) {
      try {
        // Verificar se já existe um usuário com este email
        const { data: existingUser } = await supabaseAdmin
          .from('usuarios')
          .select('id, nome')
          .eq('email', clienteData.contato_email)
          .maybeSingle()

        if (existingUser) {
          // Usuário já existe, apenas vincular ao cliente
          console.log(`ℹ️ Usuário já existe com email ${clienteData.contato_email}, vinculando ao cliente`)
          usuarioId = existingUser.id
          usuarioJaExistia = true
          
          // Verificar se o usuário já tem perfil de cliente, se não tiver, adicionar
          const { data: perfilExistente } = await supabaseAdmin
            .from('usuario_perfis')
            .select('id')
            .eq('usuario_id', usuarioId)
            .eq('perfil_id', 6) // ID do perfil "Cliente"
            .eq('status', 'Ativa')
            .maybeSingle()
          
          if (!perfilExistente) {
            // Adicionar perfil de cliente ao usuário existente
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
              console.error('Erro ao atribuir perfil de cliente ao usuário existente:', perfilError)
            }
          }
        } else {
          // Usuário não existe, criar novo
          senhaTemporaria = usuario_senha || generateSecurePassword()

          // 1. Criar usuário no Supabase Auth primeiro
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: clienteData.contato_email,
            password: senhaTemporaria,
            email_confirm: true,
            user_metadata: {
              nome: clienteData.contato,
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
            nome: clienteData.contato,
            email: clienteData.contato_email,
            cpf: clienteData.contato_cpf || null,
            telefone: clienteData.contato_telefone || null,
            endereco: clienteData.endereco || null,
            cidade: clienteData.cidade || null,
            estado: clienteData.estado || null,
            cep: clienteData.cep || null,
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
          usuarioCriadoAgora = true

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
          }

          // Enviar email e WhatsApp se criou novo usuário
          if (senhaTemporaria && clienteData.contato_email) {
            // Enviar email de boas-vindas
            try {
              await sendWelcomeEmail({
                nome: clienteData.contato,
                email: clienteData.contato_email,
                senha_temporaria: senhaTemporaria
              })
            } catch (emailError) {
              console.error('❌ Erro ao enviar email de boas-vindas:', emailError)
            }

            // Enviar mensagem WhatsApp
            try {
              const { enviarMensagemNovoUsuarioCliente } = await import('../services/whatsapp-service.js');
              await enviarMensagemNovoUsuarioCliente(
                { ...clienteData, id: id, contato_usuario_id: usuarioId },
                clienteData.contato_email,
                senhaTemporaria
              ).catch(whatsappError => {
                console.error('❌ Erro ao enviar mensagem WhatsApp:', whatsappError);
              });
            } catch (importError) {
              console.error('❌ Erro ao importar serviço WhatsApp:', importError);
            }
          }
        }
      } catch (usuarioError) {
        console.error('Erro ao criar/vincular usuário:', usuarioError)
        return res.status(500).json({
          error: 'Erro ao criar/vincular usuário',
          message: usuarioError.message
        })
      }
    }

    // Preparar dados de atualização
    const updateData = {
      ...clienteData,
      updated_at: new Date().toISOString()
    }

    // Se criou/vincular usuário, atualizar contato_usuario_id
    if (usuarioId) {
      updateData.contato_usuario_id = usuarioId
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('clientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({
        error: 'Erro ao atualizar cliente',
        message: updateError.message
      })
    }

    // Preparar resposta
    const responseData = {
      ...data,
      usuario_criado: usuarioCriadoAgora,
      usuario_vinculado: usuarioJaExistia,
      usuario_id: usuarioId
    }

    let mensagemSucesso = 'Cliente atualizado com sucesso'
    if (usuarioCriadoAgora) {
      mensagemSucesso = 'Cliente atualizado e usuário criado com sucesso. Email e WhatsApp com senha temporária enviados.'
    } else if (usuarioJaExistia) {
      mensagemSucesso = 'Cliente atualizado e usuário existente vinculado com sucesso'
    }

    res.json({
      success: true,
      data: responseData,
      message: mensagemSucesso
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
/**
 * GET /api/clientes/usuario/:usuario_id
 * Buscar cliente por usuario_id
 * Se o usuário for cliente, só pode buscar seu próprio cliente
 * 
 * O usuario_id pode ser:
 * - UUID do Supabase Auth
 * - ID numérico da tabela usuarios
 * - Email do usuário
 */
router.get('/usuario/:usuario_id', authenticateToken, async (req, res) => {
  try {
    const { usuario_id } = req.params
    const userId = req.user?.id
    const userEmail = req.user?.email

    // Se o usuário for cliente, só pode buscar seu próprio cliente
    const userRole = req.user?.role?.toLowerCase() || ''
    if (userRole.includes('cliente') || req.user?.level === 1) {
      // Comparar UUIDs, IDs numéricos ou emails
      const isSameUser = usuario_id === userId || 
                        usuario_id === req.user?.id?.toString() ||
                        (userEmail && (usuario_id === userEmail || usuario_id.toLowerCase() === userEmail.toLowerCase()))
      
      if (!isSameUser) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar este cliente'
        })
      }
    }

    // Buscar o ID numérico do usuário na tabela usuarios
    let usuarioIdNumerico = null

    // Se for um número, tentar usar diretamente
    if (!isNaN(usuario_id) && !usuario_id.includes('-')) {
      usuarioIdNumerico = parseInt(usuario_id)
    } else {
      // É UUID ou email, buscar na tabela usuarios pelo email
      // Usar o email do usuário autenticado se disponível, senão usar o usuario_id como email
      const emailParaBuscar = userEmail || (usuario_id.includes('@') ? usuario_id : null)
      
      if (emailParaBuscar) {
        const { data: usuario, error: usuarioError } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .eq('email', emailParaBuscar)
          .single()

        if (usuario && !usuarioError) {
          usuarioIdNumerico = usuario.id
        }
      }
    }

    // Se ainda não encontrou, tentar buscar pelo ID do usuário autenticado
    if (!usuarioIdNumerico && req.user?.id) {
      // Buscar usuário na tabela usuarios pelo email do usuário autenticado
      if (userEmail) {
        const { data: usuario, error: usuarioError } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .eq('email', userEmail)
          .single()

        if (usuario && !usuarioError) {
          usuarioIdNumerico = usuario.id
        }
      }
    }

    if (!usuarioIdNumerico) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'Não foi possível encontrar o usuário na tabela usuarios. Verifique se o usuário está cadastrado corretamente.'
      })
    }

    // Buscar cliente pelo ID numérico do usuário
    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('contato_usuario_id', usuarioIdNumerico)
      .single()

    if (error || !cliente) {
      // Se não encontrou, verificar se o erro é porque não existe registro
      if (error?.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          message: 'Nenhum cliente encontrado para este usuário. Verifique se o cliente está vinculado ao usuário.'
        })
      }
      
      return res.status(404).json({
        error: 'Cliente não encontrado',
        message: 'Nenhum cliente encontrado para este usuário'
      })
    }

    res.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('Erro ao buscar cliente por usuario_id:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

router.delete('/:id', authenticateToken, requirePermission('clientes:excluir'), async (req, res) => {
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
