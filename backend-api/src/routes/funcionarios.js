/**
 * Rotas para gerenciamento de funcionários
 * Sistema de Gerenciamento de Gruas
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schema de validação para funcionários
const funcionarioSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  cargo: Joi.string().valid('Operador', 'Sinaleiro', 'Técnico Manutenção', 'Supervisor', 'Mecânico', 'Engenheiro', 'Chefe de Obras').required(),
  telefone: Joi.string().max(20).allow(null, '').optional(),
  email: Joi.string().email().allow(null, '').optional(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/).allow(null, '').optional(),
  turno: Joi.string().valid('Diurno', 'Noturno', 'Sob Demanda').default('Diurno'),
  status: Joi.string().valid('Ativo', 'Inativo', 'Férias').default('Ativo'),
  data_admissao: Joi.date().allow(null).optional(),
  salario: Joi.number().min(0).allow(null).optional(),
  observacoes: Joi.string().allow(null, '').optional(),
  // Campos para criação do usuário
  criar_usuario: Joi.boolean().default(true).optional(),
  usuario_senha: Joi.string().min(6).when('criar_usuario', { is: true, then: Joi.required(), otherwise: Joi.optional() })
})

// Schema para atualização (campos opcionais)
const funcionarioUpdateSchema = funcionarioSchema.fork(
  ['nome', 'cargo'], 
  (schema) => schema.optional()
)

/**
 * @swagger
 * /api/funcionarios:
 *   get:
 *     summary: Listar todos os funcionários
 *     tags: [Funcionários]
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
 *           enum: [Ativo, Inativo, Férias]
 *         description: Filtrar por status
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico, Engenheiro, Chefe de Obras]
 *         description: Filtrar por cargo
 *       - in: query
 *         name: turno
 *         schema:
 *           type: string
 *           enum: [Diurno, Noturno, Sob Demanda]
 *         description: Filtrar por turno
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou email (LIKE)
 *     responses:
 *       200:
 *         description: Lista de funcionários
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
 *                     $ref: '#/components/schemas/Funcionario'
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
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const offset = (page - 1) * limit

    // Construir filtros
    let query = supabaseAdmin
      .from('funcionarios')
      .select(`
        *,
        usuario:usuarios!funcionario_id(
          id,
          nome,
          email,
          status
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }
    if (req.query.cargo) {
      query = query.eq('cargo', req.query.cargo)
    }
    if (req.query.turno) {
      query = query.eq('turno', req.query.turno)
    }
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`
      query = query.or(`nome.ilike.${searchTerm},email.ilike.${searchTerm}`)
    }

    // Aplicar paginação e ordenação (ID descendente para mostrar os mais recentes primeiro)
    query = query.order('id', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar funcionários',
        message: error.message
      })
    }

    // Adicionar informações sobre usuário existente para cada funcionário
    const funcionariosComUsuario = (data || []).map(funcionario => ({
      ...funcionario,
      usuario_existe: !!funcionario.usuario,
      usuario_criado: !!funcionario.usuario
    }))

    const totalPages = Math.ceil(count / limit)

    res.json({
      success: true,
      data: funcionariosComUsuario,
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao listar funcionários:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/funcionarios/buscar:
 *   get:
 *     summary: Buscar funcionários para autocomplete
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca (nome ou cargo)
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico, Engenheiro, Chefe de Obras]
 *         description: Filtrar por cargo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de funcionários encontrados
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
 *                       nome:
 *                         type: string
 *                       cargo:
 *                         type: string
 *                       status:
 *                         type: string
 *       400:
 *         description: Parâmetro de busca não fornecido
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/buscar', async (req, res) => {
  try {
    const { q, cargo, status } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Termo de busca inválido',
        message: 'O termo de busca deve ter pelo menos 2 caracteres'
      })
    }

    let query = supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, status')
      .or(`nome.ilike.%${q}%,cargo.ilike.%${q}%`)
      .limit(20)

    // Aplicar filtros adicionais
    if (cargo) {
      query = query.eq('cargo', cargo)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('nome')

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar funcionários',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/funcionarios/{id}:
 *   get:
 *     summary: Obter funcionário por ID
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Dados do funcionário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Funcionario'
 *       404:
 *         description: Funcionário não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('funcionarios')
      .select(`
        *,
        usuario:usuarios!funcionario_id(
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
          error: 'Funcionário não encontrado',
          message: 'O funcionário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar funcionário',
        message: error.message
      })
    }

    // Adicionar informações sobre o usuário vinculado
    const responseData = {
      ...data,
      usuario_existe: !!data.usuario,
      usuario_criado: !!data.usuario
    }

    res.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/funcionarios:
 *   post:
 *     summary: Criar novo funcionário
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FuncionarioInput'
 *     responses:
 *       201:
 *         description: Funcionário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Funcionario'
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = funcionarioSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { criar_usuario, usuario_senha, ...funcionarioData } = value

    // Verificar se CPF já existe (se fornecido)
    if (value.cpf) {
      const { data: existingFuncionario } = await supabaseAdmin
        .from('funcionarios')
        .select('id')
        .eq('cpf', value.cpf)
        .single()

      if (existingFuncionario) {
        return res.status(400).json({
          error: 'CPF já cadastrado',
          message: 'Já existe um funcionário cadastrado com este CPF'
        })
      }
    }

    // Iniciar transação
    let usuarioId = null

    // Criar usuário se solicitado
    if (criar_usuario && value.email) {
      try {
        // Verificar se já existe um usuário com este email
        const { data: existingUser } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .eq('email', value.email)
          .single()

        if (existingUser) {
          return res.status(400).json({
            error: 'Email já cadastrado',
            message: 'Já existe um usuário cadastrado com este email'
          })
        }

        // Criar funcionário primeiro
        const { data: novoFuncionario, error: funcionarioError } = await supabaseAdmin
          .from('funcionarios')
          .insert([funcionarioData])
          .select()
          .single()

        if (funcionarioError) {
          return res.status(500).json({
            error: 'Erro ao criar funcionário',
            message: funcionarioError.message
          })
        }

        // Mapear turno da tabela funcionarios para usuarios
        const mapearTurno = (turnoFuncionario) => {
          switch (turnoFuncionario) {
            case 'Diurno': return 'Manhã'
            case 'Noturno': return 'Noite'
            case 'Sob Demanda': return 'Integral'
            default: return 'Manhã' // Valor padrão
          }
        }

        // Criar usuário vinculado ao funcionário
        const usuarioData = {
          nome: value.nome,
          email: value.email,
          cpf: value.cpf || null,
          telefone: value.telefone || null,
          cargo: value.cargo,
          turno: mapearTurno(value.turno),
          data_admissao: value.data_admissao || null,
          salario: value.salario || null,
          status: value.status,
          funcionario_id: novoFuncionario.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: novoUsuario, error: usuarioError } = await supabaseAdmin
          .from('usuarios')
          .insert(usuarioData)
          .select()
          .single()

        if (usuarioError) {
          // Se falhou ao criar usuário, tentar remover o funcionário criado
          await supabaseAdmin
            .from('funcionarios')
            .delete()
            .eq('id', novoFuncionario.id)
          
          return res.status(500).json({
            error: 'Erro ao criar usuário',
            message: usuarioError.message
          })
        }

        usuarioId = novoUsuario.id

        // Atribuir perfil baseado no cargo do funcionário
        let perfilId = 4 // Operador por padrão
        switch (value.cargo) {
          case 'Supervisor':
            perfilId = 3
            break
          case 'Operador':
            perfilId = 4
            break
          default:
            perfilId = 4 // Operador para outros cargos
        }

        const { error: perfilError } = await supabaseAdmin
          .from('usuario_perfis')
          .insert({
            usuario_id: usuarioId,
            perfil_id: perfilId,
            status: 'Ativa',
            data_atribuicao: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (perfilError) {
          console.error('Erro ao atribuir perfil ao usuário:', perfilError)
          // Não falhar a criação do funcionário por causa disso
        }

        res.status(201).json({
          success: true,
          data: {
            ...novoFuncionario,
            usuario_criado: true,
            usuario_id: usuarioId
          },
          message: 'Funcionário e usuário criados com sucesso'
        })

      } catch (usuarioError) {
        console.error('Erro ao criar usuário:', usuarioError)
        return res.status(500).json({
          error: 'Erro ao criar usuário',
          message: usuarioError.message
        })
      }
    } else {
      // Criar apenas funcionário sem usuário
      const { data, error: createError } = await supabaseAdmin
        .from('funcionarios')
        .insert([funcionarioData])
        .select()
        .single()

      if (createError) {
        return res.status(500).json({
          error: 'Erro ao criar funcionário',
          message: createError.message
        })
      }

      res.status(201).json({
        success: true,
        data: {
          ...data,
          usuario_criado: false
        },
        message: 'Funcionário criado com sucesso'
      })
    }
  } catch (error) {
    console.error('Erro ao criar funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/funcionarios/{id}:
 *   put:
 *     summary: Atualizar funcionário
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FuncionarioInput'
 *     responses:
 *       200:
 *         description: Funcionário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Funcionario'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Funcionário não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados
    const { error, value } = funcionarioUpdateSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Filtrar campos que não devem ser salvos na tabela funcionarios
    const { criar_usuario, usuario_senha, ...funcionarioData } = value

    // Verificar se CPF já existe em outro funcionário (se fornecido)
    if (value.cpf) {
      const { data: existingFuncionario } = await supabaseAdmin
        .from('funcionarios')
        .select('id')
        .eq('cpf', value.cpf)
        .neq('id', id)
        .single()

      if (existingFuncionario) {
        return res.status(400).json({
          error: 'CPF já cadastrado',
          message: 'Já existe outro funcionário cadastrado com este CPF'
        })
      }
    }

    // Atualizar funcionário
    const { data, error: updateError } = await supabaseAdmin
      .from('funcionarios')
      .update({
        ...funcionarioData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Funcionário não encontrado',
          message: 'O funcionário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar funcionário',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/funcionarios/{id}:
 *   delete:
 *     summary: Excluir funcionário
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Funcionário excluído com sucesso
 *       404:
 *         description: Funcionário não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se funcionário existe
    const { data: funcionario, error: checkError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome')
      .eq('id', id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Funcionário não encontrado',
          message: 'O funcionário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao verificar funcionário',
        message: checkError.message
      })
    }

    // Verificar se funcionário está associado a alguma grua
    const { data: associacoes } = await supabaseAdmin
      .from('grua_funcionario')
      .select('id')
      .eq('funcionario_id', id)
      .eq('status', 'Ativo')

    if (associacoes && associacoes.length > 0) {
      return res.status(400).json({
        error: 'Funcionário em uso',
        message: 'Não é possível excluir o funcionário pois ele está associado a uma ou mais gruas ativas'
      })
    }

    // Excluir funcionário
    const { error: deleteError } = await supabaseAdmin
      .from('funcionarios')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return res.status(500).json({
        error: 'Erro ao excluir funcionário',
        message: deleteError.message
      })
    }

    res.json({
      success: true,
      message: `Funcionário ${funcionario.nome} excluído com sucesso`
    })
  } catch (error) {
    console.error('Erro ao excluir funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * components:
 *   schemas:
 *     Funcionario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do funcionário
 *         nome:
 *           type: string
 *           description: Nome completo do funcionário
 *         cargo:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico, Engenheiro, Chefe de Obras]
 *           description: Cargo do funcionário
 *         telefone:
 *           type: string
 *           description: Telefone de contato
 *         email:
 *           type: string
 *           format: email
 *           description: Email de contato
 *         cpf:
 *           type: string
 *           description: CPF do funcionário
 *         turno:
 *           type: string
 *           enum: [Diurno, Noturno, Sob Demanda]
 *           description: Turno de trabalho
 *         status:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *           description: Status do funcionário
 *         data_admissao:
 *           type: string
 *           format: date
 *           description: Data de admissão
 *         salario:
 *           type: number
 *           description: Salário do funcionário
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *     
 *     FuncionarioInput:
 *       type: object
 *       required:
 *         - nome
 *         - cargo
 *       properties:
 *         nome:
 *           type: string
 *           minLength: 2
 *           maxLength: 255
 *           description: Nome completo do funcionário
 *         cargo:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico, Engenheiro, Chefe de Obras]
 *           description: Cargo do funcionário
 *         telefone:
 *           type: string
 *           maxLength: 20
 *           description: Telefone de contato
 *         email:
 *           type: string
 *           format: email
 *           description: Email de contato
 *         cpf:
 *           type: string
 *           pattern: '^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$'
 *           description: CPF do funcionário (formato: 000.000.000-00 ou 00000000000)
 *         turno:
 *           type: string
 *           enum: [Diurno, Noturno, Sob Demanda]
 *           default: Diurno
 *           description: Turno de trabalho
 *         status:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *           default: Ativo
 *           description: Status do funcionário
 *         data_admissao:
 *           type: string
 *           format: date
 *           description: Data de admissão
 *         salario:
 *           type: number
 *           minimum: 0
 *           description: Salário do funcionário
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 */

export default router
