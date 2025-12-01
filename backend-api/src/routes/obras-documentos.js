import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const router = express.Router()

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas PDFs para documentos
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos para documentos'), false)
    }
  }
})

// Função para gerar nome único do arquivo
const generateFileName = (originalName, obraId) => {
  const ext = path.extname(originalName)
  const name = path.basename(originalName, ext)
  const timestamp = Date.now()
  const uuid = uuidv4().substring(0, 8)
  return `${name}_${timestamp}_${uuid}${ext}`
}

// Schema de validação para documentos
const documentoSchema = Joi.object({
  titulo: Joi.string().min(2).max(255).required(),
  descricao: Joi.string().allow('').optional(),
  ordem_assinatura: Joi.array().items(
    Joi.object({
      user_id: Joi.alternatives().try(
        Joi.string().uuid(), // UUID do Supabase Auth
        Joi.string().pattern(/^\d+$/) // ID numérico como string (funcionários/clientes)
      ).required(),
      ordem: Joi.number().integer().positive().required(),
      tipo: Joi.string().valid('interno', 'cliente').default('interno'),
      docu_sign_link: Joi.string().allow('').optional(), // Removido .uri() para permitir strings vazias
      status: Joi.string().valid('pendente', 'aguardando', 'assinado', 'rejeitado').default('pendente')
    })
  ).min(1).required()
})

/**
 * @swagger
 * /api/obras-documentos/todos:
 *   get:
 *     summary: Listar todos os documentos
 *     tags: [Obras Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [rascunho, aguardando_assinatura, em_assinatura, assinado, rejeitado]
 *         description: Filtrar por status
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por obra específica
 *     responses:
 *       200:
 *         description: Lista de todos os documentos
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
 *                       obra_id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       descricao:
 *                         type: string
 *                       arquivo_original:
 *                         type: string
 *                       caminho_arquivo:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [rascunho, aguardando_assinatura, em_assinatura, assinado, rejeitado]
 *                       created_by:
 *                         type: string
 *                       proximo_assinante_id:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       assinaturas:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             documento_id:
 *                               type: integer
 *                             user_id:
 *                               type: string
 *                             ordem:
 *                               type: integer
 *                             status:
 *                               type: string
 *                             tipo:
 *                               type: string
 *                             user_nome:
 *                               type: string
 *                             user_email:
 *                               type: string
 *                             user_cargo:
 *                               type: string
 *                       historico:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             documento_id:
 *                               type: integer
 *                             user_id:
 *                               type: string
 *                             acao:
 *                               type: string
 *                             user_nome:
 *                               type: string
 *                             user_email:
 *                               type: string
 *                             user_role:
 *                               type: string
 *                             observacoes:
 *                               type: string
 *                             data_acao:
 *                               type: string
 *                               format: date-time
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/todos', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { status, obra_id } = req.query

    let query = supabaseAdmin
      .from('v_obras_documentos_completo')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (obra_id) {
      query = query.eq('obra_id', obra_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar documentos:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar documentos',
        error: error.message
      })
    }

    // Buscar assinaturas para cada documento
    const documentosComAssinaturas = await Promise.all(
      (data || []).map(async (documento) => {
        const { data: assinaturas, error: assinaturasError } = await supabaseAdmin
          .from('obras_documento_assinaturas')
          .select('*')
          .eq('documento_id', documento.id)
          .order('ordem', { ascending: true })

        if (assinaturasError) {
          console.error('Erro ao buscar assinaturas:', assinaturasError)
        }

        // Buscar histórico
        const { data: historico, error: historicoError } = await supabaseAdmin
          .from('obras_documento_historico')
          .select('*')
          .eq('documento_id', documento.id)
          .order('data_acao', { ascending: false })

        if (historicoError) {
          console.error('Erro ao buscar histórico:', historicoError)
        }

        // Buscar dados dos usuários para as assinaturas
        const assinaturasComUsuario = await Promise.all((assinaturas || []).map(async (ass) => {
          console.log(`🔍 PROCESSANDO ASSINATURA:`, {
            user_id: ass.user_id,
            tipo: ass.tipo,
            ordem: ass.ordem
          })
          
          let userInfo = {
            user_nome: 'Usuário ID: ' + ass.user_id,
            user_email: '',
            user_cargo: ''
          }

          // Verificar se é UUID (usuário do Supabase Auth)
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          
          if (uuidPattern.test(ass.user_id)) {
            // Buscar no auth.users
            try {
              const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(ass.user_id)
              if (authUser?.user) {
                userInfo = {
                  user_nome: authUser.user.user_metadata?.nome || authUser.user.email || 'Usuário Auth',
                  user_email: authUser.user.email || '',
                  user_cargo: authUser.user.user_metadata?.cargo || 'Usuário'
                }
              }
            } catch (error) {
              console.log('Erro ao buscar usuário auth:', error.message)
            }
          } else {
            // Buscar em funcionários ou clientes baseado no tipo
            console.log(`🔍 Buscando usuário: ID=${ass.user_id}, Tipo=${ass.tipo}`)
            try {
              if (ass.tipo === 'cliente') {
                // Buscar cliente
                console.log(`📋 Buscando CLIENTE com ID: ${ass.user_id}`)
                const { data: cliente } = await supabaseAdmin
                  .from('clientes')
                  .select('nome, email')
                  .eq('id', ass.user_id)
                  .single()

                if (cliente) {
                  console.log(`✅ Cliente encontrado: ${cliente.nome}`)
                  userInfo = {
                    user_nome: cliente.nome || 'Cliente',
                    user_email: cliente.email || '',
                    user_cargo: 'Cliente'
                  }
                } else {
                  console.log(`❌ Cliente não encontrado com ID: ${ass.user_id}`)
                }
              } else {
                // Buscar funcionário (tipo 'interno' ou padrão)
                console.log(`👷 Buscando FUNCIONÁRIO com ID: ${ass.user_id}`)
                const { data: funcionario } = await supabaseAdmin
                  .from('funcionarios')
                  .select('nome, email, cargo')
                  .eq('id', ass.user_id)
                  .single()

                if (funcionario) {
                  console.log(`✅ Funcionário encontrado: ${funcionario.nome}`)
                  userInfo = {
                    user_nome: funcionario.nome || 'Funcionário',
                    user_email: funcionario.email || '',
                    user_cargo: funcionario.cargo || 'Funcionário'
                  }
                } else {
                  console.log(`❌ Funcionário não encontrado com ID: ${ass.user_id}`)
                }
              }
            } catch (error) {
              console.log('❌ Erro ao buscar usuário local:', error.message)
            }
          }

          const resultado = {
            ...ass,
            ...userInfo
          }
          
          console.log(`✅ RESULTADO FINAL:`, {
            user_id: resultado.user_id,
            tipo: resultado.tipo,
            user_nome: resultado.user_nome,
            user_cargo: resultado.user_cargo
          })
          
          return resultado
        }))

        return {
          ...documento,
          assinaturas: assinaturasComUsuario,
          historico: historico || []
        }
      })
    )

    res.json({
      success: true,
      data: documentosComAssinaturas
    })
  } catch (error) {
    console.error('Erro ao listar documentos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras-documentos/{obraId}/documentos:
 *   get:
 *     summary: Listar documentos de uma obra
 *     tags: [Obras Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [rascunho, aguardando_assinatura, em_assinatura, assinado, rejeitado]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de documentos da obra
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
 *                       obra_id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       descricao:
 *                         type: string
 *                       arquivo_original:
 *                         type: string
 *                       caminho_arquivo:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [rascunho, aguardando_assinatura, em_assinatura, assinado, rejeitado]
 *                       created_by:
 *                         type: string
 *                       proximo_assinante_id:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       ordemAssinatura:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             documento_id:
 *                               type: integer
 *                             user_id:
 *                               type: string
 *                             ordem:
 *                               type: integer
 *                             status:
 *                               type: string
 *                             tipo:
 *                               type: string
 *                             user_nome:
 *                               type: string
 *                             user_email:
 *                               type: string
 *                             user_cargo:
 *                               type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:obraId/documentos', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obraId } = req.params
    const { status } = req.query

    let query = supabaseAdmin
      .from('v_obras_documentos_completo')
      .select('*')
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar documentos:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar documentos',
        error: error.message
      })
    }

    // Buscar assinaturas para cada documento
    const documentosComAssinaturas = await Promise.all(
      data.map(async (documento) => {
        const { data: assinaturas, error: assinaturasError } = await supabaseAdmin
          .from('obras_documento_assinaturas')
          .select('*')
          .eq('documento_id', documento.id)
          .order('ordem', { ascending: true })

        if (assinaturasError) {
          console.error('Erro ao buscar assinaturas:', assinaturasError)
          return { ...documento, assinaturas: [] }
        }

        // Buscar dados dos usuários para as assinaturas
        const assinaturasComUsuario = await Promise.all((assinaturas || []).map(async (ass) => {
          console.log(`🔍 PROCESSANDO ASSINATURA:`, {
            user_id: ass.user_id,
            tipo: ass.tipo,
            ordem: ass.ordem
          })
          
          let userInfo = {
            user_nome: 'Usuário ID: ' + ass.user_id,
            user_email: '',
            user_cargo: ''
          }

          // Verificar se é UUID (usuário do Supabase Auth)
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          
          if (uuidPattern.test(ass.user_id)) {
            // Buscar no auth.users
            try {
              const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(ass.user_id)
              if (authUser?.user) {
                userInfo = {
                  user_nome: authUser.user.user_metadata?.nome || authUser.user.email || 'Usuário Auth',
                  user_email: authUser.user.email || '',
                  user_cargo: authUser.user.user_metadata?.cargo || 'Usuário'
                }
              }
            } catch (error) {
              console.log('Erro ao buscar usuário auth:', error.message)
            }
          } else {
            // Buscar em funcionários ou clientes baseado no tipo
            console.log(`🔍 Buscando usuário: ID=${ass.user_id}, Tipo=${ass.tipo}`)
            try {
              if (ass.tipo === 'cliente') {
                // Buscar cliente
                console.log(`📋 Buscando CLIENTE com ID: ${ass.user_id}`)
                const { data: cliente } = await supabaseAdmin
                  .from('clientes')
                  .select('nome, email')
                  .eq('id', ass.user_id)
                  .single()

                if (cliente) {
                  console.log(`✅ Cliente encontrado: ${cliente.nome}`)
                  userInfo = {
                    user_nome: cliente.nome || 'Cliente',
                    user_email: cliente.email || '',
                    user_cargo: 'Cliente'
                  }
                } else {
                  console.log(`❌ Cliente não encontrado com ID: ${ass.user_id}`)
                }
              } else {
                // Buscar funcionário (tipo 'interno' ou padrão)
                console.log(`👷 Buscando FUNCIONÁRIO com ID: ${ass.user_id}`)
                const { data: funcionario } = await supabaseAdmin
                  .from('funcionarios')
                  .select('nome, email, cargo')
                  .eq('id', ass.user_id)
                  .single()

                if (funcionario) {
                  console.log(`✅ Funcionário encontrado: ${funcionario.nome}`)
                  userInfo = {
                    user_nome: funcionario.nome || 'Funcionário',
                    user_email: funcionario.email || '',
                    user_cargo: funcionario.cargo || 'Funcionário'
                  }
                } else {
                  console.log(`❌ Funcionário não encontrado com ID: ${ass.user_id}`)
                }
              }
            } catch (error) {
              console.log('❌ Erro ao buscar usuário local:', error.message)
            }
          }

          const resultado = {
            ...ass,
            ...userInfo
          }
          
          console.log(`✅ RESULTADO FINAL:`, {
            user_id: resultado.user_id,
            tipo: resultado.tipo,
            user_nome: resultado.user_nome,
            user_cargo: resultado.user_cargo
          })
          
          return resultado
        }))

        return {
          ...documento,
          ordemAssinatura: assinaturasComUsuario
        }
      })
    )

    res.json({
      success: true,
      data: documentosComAssinaturas
    })
  } catch (error) {
    console.error('Erro ao listar documentos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras-documentos/{obraId}/documentos:
 *   post:
 *     summary: Criar novo documento para uma obra
 *     tags: [Obras Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - arquivo
 *               - ordem_assinatura
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título do documento
 *               descricao:
 *                 type: string
 *                 description: Descrição do documento
 *               arquivo:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo PDF do documento (máximo 50MB)
 *               ordem_assinatura:
 *                 type: string
 *                 description: JSON string com array de objetos de assinatura
 *                 example: '[{"user_id": "uuid-or-id", "ordem": 1, "tipo": "interno", "status": "pendente"}]'
 *     responses:
 *       201:
 *         description: Documento criado com sucesso
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
 *                     id:
 *                       type: integer
 *                     titulo:
 *                       type: string
 *                     arquivo_original:
 *                       type: string
 *                     status:
 *                       type: string
 *                     url:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Obra não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:obraId/documentos', authenticateToken, requirePermission('obras:criar'), upload.single('arquivo'), async (req, res) => {
  try {
    const { obraId } = req.params
    const { titulo, descricao, ordem_assinatura } = req.body
    const file = req.file

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      })
    }

    // Validar dados
    console.log('=== DEBUG PARSING ===')
    console.log('ordem_assinatura raw:', ordem_assinatura)
    console.log('typeof ordem_assinatura:', typeof ordem_assinatura)
    
    let ordemAssinaturaArray
    try {
      ordemAssinaturaArray = JSON.parse(ordem_assinatura)
      console.log('ordemAssinaturaArray parsed:', JSON.stringify(ordemAssinaturaArray, null, 2))
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse de ordem_assinatura:', parseError)
      return res.status(400).json({
        success: false,
        message: 'Formato inválido de ordem_assinatura',
        error: 'ordem_assinatura deve ser um JSON válido'
      })
    }
    
    const { error: validationError } = documentoSchema.validate({
      titulo,
      descricao,
      ordem_assinatura: ordemAssinaturaArray
    })
    
    console.log('validationError:', validationError)
    console.log('=== FIM DEBUG PARSING ===')

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        error: validationError.details[0].message
      })
    }

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome')
      .eq('id', obraId)
      .single()

    if (obraError || !obra) {
      return res.status(404).json({
        success: false,
        message: 'Obra não encontrada'
      })
    }

    // Gerar nome único para o arquivo
    const fileName = generateFileName(file.originalname, obraId)
    const filePath = `obras/${obraId}/documentos/${fileName}`

    // Upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload do arquivo',
        error: uploadError.message
      })
    }

    // Verificar se os usuários das assinaturas existem (auth.users para UUIDs, funcionários/clientes para IDs numéricos)
    const userIds = ordemAssinaturaArray.map(item => item.user_id)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    // Separar UUIDs e IDs numéricos
    const uuids = userIds.filter(id => uuidPattern.test(id))
    const numericIds = userIds.filter(id => !uuidPattern.test(id))
    
    // Verificar UUIDs no auth.users
    const usuariosInexistentes = []
    
    if (uuids.length > 0) {
      const { data: usuariosAuth, error: usuariosError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (usuariosError) {
        console.error('Erro ao verificar usuários auth:', usuariosError)
        return res.status(500).json({
          success: false,
          message: 'Erro ao verificar usuários auth',
          error: usuariosError.message
        })
      }
      
      const usuariosAuthIds = usuariosAuth.users.map(u => u.id)
      const uuidsInexistentes = uuids.filter(id => !usuariosAuthIds.includes(id))
      usuariosInexistentes.push(...uuidsInexistentes)
    }
    
    // Verificar IDs numéricos nas tabelas funcionários/clientes
    if (numericIds.length > 0) {
      for (const id of numericIds) {
        const { data: funcionario } = await supabaseAdmin
          .from('funcionarios')
          .select('id')
          .eq('id', id)
          .single()
          
        const { data: cliente } = await supabaseAdmin
          .from('clientes')
          .select('id')
          .eq('id', id)
          .single()
          
        if (!funcionario && !cliente) {
          usuariosInexistentes.push(id)
        }
      }
    }
    
    if (usuariosInexistentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Usuários não encontrados',
        error: `IDs de usuários não encontrados: ${usuariosInexistentes.join(', ')}`
      })
    }

    // Converter primeiro user_id para UUID se necessário
    const primeiroUserId = ordemAssinaturaArray[0]?.user_id
    let proximoAssinanteId = null
    
    if (primeiroUserId) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidPattern.test(primeiroUserId)) {
        const numericId = parseInt(primeiroUserId)
        if (!isNaN(numericId)) {
          proximoAssinanteId = `00000000-0000-0000-0000-${numericId.toString().padStart(12, '0')}`
        }
      } else {
        proximoAssinanteId = primeiroUserId
      }
    }

    // Salvar documento no banco
    const documentoData = {
      obra_id: parseInt(obraId),
      titulo,
      descricao: descricao || null,
      arquivo_original: file.originalname,
      caminho_arquivo: filePath,
      status: 'rascunho',
      created_by: req.user.id,
      proximo_assinante_id: proximoAssinanteId
    }

    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .insert(documentoData)
      .select()
      .single()

    if (documentoError) {
      // Se falhar ao salvar no banco, remover o arquivo do storage
      await supabaseAdmin.storage
        .from('arquivos-obras')
        .remove([filePath])
      
      console.error('Erro ao salvar documento:', documentoError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar documento',
        error: documentoError.message
      })
    }

    // Salvar ordem de assinaturas
    console.log('=== DEBUG ASSINATURAS ===')
    console.log('ordemAssinaturaArray:', JSON.stringify(ordemAssinaturaArray, null, 2))
    console.log('documento.id:', documento.id)
    
    const assinaturasData = ordemAssinaturaArray.map(item => ({
      documento_id: documento.id,
      user_id: item.user_id, // Usar o ID original (string)
      ordem: item.ordem,
      status: item.status || (item.ordem === 1 ? 'aguardando' : 'pendente'),
      tipo: item.tipo || 'interno', // Default para 'interno' se não especificado
      docu_sign_link: item.docu_sign_link || null
    }))

    console.log('assinaturasData preparado:', JSON.stringify(assinaturasData, null, 2))

    const { data: assinaturasInseridas, error: assinaturasError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .insert(assinaturasData)
      .select()

    if (assinaturasError) {
      console.error('Erro ao salvar assinaturas:', assinaturasError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar assinaturas',
        error: assinaturasError.message
      })
    }

    console.log('Assinaturas inseridas com sucesso:', assinaturasInseridas)
    console.log('=== FIM DEBUG ASSINATURAS ===')

    // Registrar no histórico
    await supabaseAdmin
      .from('obras_documento_historico')
      .insert({
        documento_id: documento.id,
        user_id: req.user.id,
        acao: 'criado',
        user_nome: req.user.nome,
        user_email: req.user.email,
        user_role: req.user.role,
        observacoes: 'Documento criado'
      })

    res.status(201).json({
      success: true,
      message: 'Documento criado com sucesso',
      data: {
        id: documento.id,
        titulo: documento.titulo,
        arquivo_original: documento.arquivo_original,
        status: documento.status,
        url: uploadData.path
      }
    })

  } catch (error) {
    console.error('Erro ao criar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras-documentos/{obraId}/documentos/{documentoId}:
 *   get:
 *     summary: Obter documento específico
 *     tags: [Obras Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *       - in: path
 *         name: documentoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do documento
 *     responses:
 *       200:
 *         description: Dados do documento
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
 *                     obra_id:
 *                       type: integer
 *                     titulo:
 *                       type: string
 *                     descricao:
 *                       type: string
 *                     arquivo_original:
 *                       type: string
 *                     caminho_arquivo:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [rascunho, aguardando_assinatura, em_assinatura, assinado, rejeitado]
 *                     created_by:
 *                       type: string
 *                     proximo_assinante_id:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     ordemAssinatura:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           documento_id:
 *                             type: integer
 *                           user_id:
 *                             type: string
 *                           ordem:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           tipo:
 *                             type: string
 *                     historicoAssinaturas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           documento_id:
 *                             type: integer
 *                           user_id:
 *                             type: string
 *                           acao:
 *                             type: string
 *                           user_nome:
 *                             type: string
 *                           user_email:
 *                             type: string
 *                           user_role:
 *                             type: string
 *                           observacoes:
 *                             type: string
 *                           data_acao:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Documento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:obraId/documentos/:documentoId', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obraId, documentoId } = req.params

    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('v_obras_documentos_completo')
      .select('*')
      .eq('id', documentoId)
      .eq('obra_id', obraId)
      .single()

    if (documentoError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Buscar assinaturas
    const { data: assinaturas, error: assinaturasError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('documento_id', documentoId)
      .order('ordem', { ascending: true })

    if (assinaturasError) {
      console.error('Erro ao buscar assinaturas:', assinaturasError)
    }

    // Buscar histórico
    const { data: historico, error: historicoError } = await supabaseAdmin
      .from('obras_documento_historico')
      .select('*')
      .eq('documento_id', documentoId)
      .order('data_acao', { ascending: false })

    if (historicoError) {
      console.error('Erro ao buscar histórico:', historicoError)
    }

    res.json({
      success: true,
      data: {
        ...documento,
        ordemAssinatura: assinaturas || [],
        historicoAssinaturas: historico || []
      }
    })
  } catch (error) {
    console.error('Erro ao buscar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras-documentos/{obraId}/documentos/{documentoId}/enviar:
 *   post:
 *     summary: Enviar documento para assinatura
 *     tags: [Obras Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *       - in: path
 *         name: documentoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do documento
 *     responses:
 *       200:
 *         description: Documento enviado para assinatura
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
 *         description: Documento não encontrado ou não está em rascunho
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:obraId/documentos/:documentoId/enviar', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { obraId, documentoId } = req.params

    // Verificar se o documento existe e está em rascunho
    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .select('*')
      .eq('id', documentoId)
      .eq('obra_id', obraId)
      .eq('status', 'rascunho')
      .single()

    if (documentoError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado ou não está em rascunho'
      })
    }

    // Atualizar status do documento
    const { error: updateError } = await supabaseAdmin
      .from('obras_documentos')
      .update({
        status: 'aguardando_assinatura',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentoId)

    if (updateError) {
      console.error('Erro ao atualizar documento:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar documento',
        error: updateError.message
      })
    }

    // Registrar no histórico
    await supabaseAdmin
      .from('obras_documento_historico')
      .insert({
        documento_id: documentoId,
        user_id: req.user.id,
        acao: 'enviado',
        user_nome: req.user.nome,
        user_email: req.user.email,
        user_role: req.user.role,
        observacoes: 'Documento enviado para assinatura'
      })

    res.json({
      success: true,
      message: 'Documento enviado para assinatura com sucesso'
    })
  } catch (error) {
    console.error('Erro ao enviar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras-documentos/{obraId}/documentos/{documentoId}/download:
 *   get:
 *     summary: Download do arquivo do documento
 *     tags: [Obras Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *       - in: path
 *         name: documentoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do documento
 *     responses:
 *       200:
 *         description: URL de download do arquivo do documento
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
 *                     download_url:
 *                       type: string
 *                       description: URL assinada para download (válida por 1 hora)
 *                     nome_arquivo:
 *                       type: string
 *                       description: Nome original do arquivo
 *       404:
 *         description: Documento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:obraId/documentos/:documentoId/download', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obraId, documentoId } = req.params

    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .select('caminho_arquivo, arquivo_original')
      .eq('id', documentoId)
      .eq('obra_id', obraId)
      .single()

    if (documentoError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Verificar se o caminho_arquivo existe
    if (!documento.caminho_arquivo) {
      console.error(`Documento ${documentoId} não possui caminho_arquivo`)
      return res.status(404).json({
        success: false,
        message: 'Arquivo do documento não encontrado',
        error: 'O documento não possui um arquivo associado'
      })
    }

    // Verificar se o arquivo existe no storage antes de gerar a URL
    const { data: fileList, error: listError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .list(documento.caminho_arquivo.split('/').slice(0, -1).join('/') || '', {
        limit: 1000,
        search: documento.caminho_arquivo.split('/').pop()
      })

    // Verificar se o arquivo existe diretamente
    const fileName = documento.caminho_arquivo.split('/').pop()
    const fileExists = fileList?.some(file => file.name === fileName)

    if (!fileExists && listError) {
      console.error(`Arquivo não encontrado no storage: ${documento.caminho_arquivo}`, listError)
    }

    // Tentar gerar URL assinada mesmo se não encontrou na listagem (pode ser problema de permissão)
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .createSignedUrl(documento.caminho_arquivo, 3600) // 1 hora

    if (urlError) {
      console.error('Erro ao gerar URL:', {
        error: urlError,
        caminho_arquivo: documento.caminho_arquivo,
        documentoId,
        obraId
      })
      
      // Verificar se é erro de arquivo não encontrado
      if (urlError.statusCode === '404' || urlError.message?.includes('not found') || urlError.message?.includes('Object not found')) {
        return res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado no storage',
          error: 'O arquivo do documento não foi encontrado. Pode ter sido removido ou nunca foi enviado.',
          details: {
            caminho_arquivo: documento.caminho_arquivo,
            documento_id: documentoId
          }
        })
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar link de download',
        error: urlError.message
      })
    }

    res.json({
      success: true,
      data: {
        download_url: signedUrl.signedUrl,
        nome_arquivo: documento.arquivo_original
      }
    })
  } catch (error) {
    console.error('Erro ao gerar download:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras-documentos/{obraId}/documentos/{documentoId}:
 *   put:
 *     summary: Atualizar documento
 *     tags: [Obras Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *       - in: path
 *         name: documentoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do documento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Novo título do documento
 *               descricao:
 *                 type: string
 *                 description: Nova descrição do documento
 *               status:
 *                 type: string
 *                 enum: [rascunho, aguardando_assinatura, em_assinatura, assinado, rejeitado]
 *                 description: Novo status do documento
 *     responses:
 *       200:
 *         description: Documento atualizado com sucesso
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
 *                   description: Dados atualizados do documento
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Documento não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Excluir documento
 *     tags: [Obras Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *       - in: path
 *         name: documentoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do documento
 *     responses:
 *       200:
 *         description: Documento excluído com sucesso
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
 *         description: Documento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:obraId/documentos/:documentoId', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { obraId, documentoId } = req.params
    const { titulo, descricao, status } = req.body

    // Validar dados
    const updateSchema = Joi.object({
      titulo: Joi.string().min(2).max(255).optional(),
      descricao: Joi.string().allow('').optional(),
      status: Joi.string().valid('rascunho', 'aguardando_assinatura', 'em_assinatura', 'assinado', 'rejeitado').optional()
    })

    const { error: validationError } = updateSchema.validate({ titulo, descricao, status })
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        error: validationError.details[0].message
      })
    }

    // Verificar se o documento existe
    const { data: documentoExistente, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .select('*')
      .eq('id', documentoId)
      .eq('obra_id', obraId)
      .single()

    if (documentoError || !documentoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Preparar dados para atualização
    const updateData = {}
    if (titulo !== undefined) updateData.titulo = titulo
    if (descricao !== undefined) updateData.descricao = descricao
    if (status !== undefined) updateData.status = status
    updateData.updated_at = new Date().toISOString()

    // Atualizar documento
    const { data: documentoAtualizado, error: updateError } = await supabaseAdmin
      .from('obras_documentos')
      .update(updateData)
      .eq('id', documentoId)
      .eq('obra_id', obraId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar documento:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar documento',
        error: updateError.message
      })
    }

    // Registrar no histórico
    await supabaseAdmin
      .from('obras_documento_historico')
      .insert({
        documento_id: documentoId,
        user_id: req.user.id,
        acao: 'atualizado',
        observacoes: `Documento atualizado: ${Object.keys(updateData).join(', ')}`
      })

    res.json({
      success: true,
      message: 'Documento atualizado com sucesso',
      data: documentoAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

router.delete('/:obraId/documentos/:documentoId', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { obraId, documentoId } = req.params

    // Verificar se o documento existe
    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .select('caminho_arquivo')
      .eq('id', documentoId)
      .eq('obra_id', obraId)
      .single()

    if (documentoError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Excluir arquivo do storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .remove([documento.caminho_arquivo])

    if (storageError) {
      console.error('Erro ao remover arquivo do storage:', storageError)
      // Continuar mesmo se falhar ao remover do storage
    }

    // Excluir documento do banco (cascade vai excluir assinaturas e histórico)
    const { error: deleteError } = await supabaseAdmin
      .from('obras_documentos')
      .delete()
      .eq('id', documentoId)

    if (deleteError) {
      console.error('Erro ao excluir documento:', deleteError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir documento',
        error: deleteError.message
      })
    }

    res.json({
      success: true,
      message: 'Documento excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras-documentos/documentos/{documentoId}:
 *   get:
 *     summary: Obter documento específico por ID
 *     tags: [Obras Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do documento
 *     responses:
 *       200:
 *         description: Documento encontrado
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
 *                     obra_id:
 *                       type: integer
 *                     titulo:
 *                       type: string
 *                     descricao:
 *                       type: string
 *                     arquivo_original:
 *                       type: string
 *                     caminho_arquivo:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [rascunho, aguardando_assinatura, em_assinatura, assinado, rejeitado]
 *                     created_by:
 *                       type: string
 *                     proximo_assinante_id:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     assinaturas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           documento_id:
 *                             type: integer
 *                           user_id:
 *                             type: string
 *                           ordem:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           tipo:
 *                             type: string
 *                           user_nome:
 *                             type: string
 *                           user_email:
 *                             type: string
 *                           user_cargo:
 *                             type: string
 *                     historico:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           documento_id:
 *                             type: integer
 *                           user_id:
 *                             type: string
 *                           acao:
 *                             type: string
 *                           user_nome:
 *                             type: string
 *                           user_email:
 *                             type: string
 *                           user_role:
 *                             type: string
 *                           observacoes:
 *                             type: string
 *                           data_acao:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Documento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/documentos/:documentoId', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { documentoId } = req.params

    // Buscar documento específico
    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('v_obras_documentos_completo')
      .select('*')
      .eq('id', documentoId)
      .single()

    if (documentoError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Buscar assinaturas do documento
    const { data: assinaturas, error: assinaturasError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('documento_id', documento.id)
      .order('ordem', { ascending: true })

    if (assinaturasError) {
      console.error('Erro ao buscar assinaturas:', assinaturasError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar assinaturas',
        error: assinaturasError.message
      })
    }

    // Buscar histórico do documento
    const { data: historico, error: historicoError } = await supabaseAdmin
      .from('obras_documento_historico')
      .select('*')
      .eq('documento_id', documento.id)
      .order('data_acao', { ascending: false })

    if (historicoError) {
      console.error('Erro ao buscar histórico:', historicoError)
    }

    // Buscar dados dos usuários para as assinaturas
    const assinaturasComUsuario = await Promise.all((assinaturas || []).map(async (ass) => {
      console.log(`🔍 PROCESSANDO ASSINATURA:`, {
        user_id: ass.user_id,
        tipo: ass.tipo,
        ordem: ass.ordem
      })
      
      let userInfo = {
        user_nome: 'Usuário ID: ' + ass.user_id,
        user_email: '',
        user_cargo: ''
      }

      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      if (uuidPattern.test(ass.user_id)) {
        // Buscar no auth.users
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(ass.user_id)
          if (authUser?.user) {
            userInfo = {
              user_nome: authUser.user.user_metadata?.nome || authUser.user.email || 'Usuário Auth',
              user_email: authUser.user.email || '',
              user_cargo: authUser.user.user_metadata?.cargo || 'Usuário'
            }
          }
        } catch (error) {
          console.log('Erro ao buscar usuário auth:', error.message)
        }
      } else {
        // Buscar em funcionários ou clientes baseado no tipo
        console.log(`🔍 Buscando usuário: ID=${ass.user_id}, Tipo=${ass.tipo}`)
        try {
          if (ass.tipo === 'cliente') {
            console.log(`📋 Buscando CLIENTE com ID: ${ass.user_id}`)
            const { data: cliente } = await supabaseAdmin
              .from('clientes')
              .select('nome, email')
              .eq('id', ass.user_id)
              .single()

            if (cliente) {
              console.log(`✅ Cliente encontrado: ${cliente.nome}`)
              userInfo = {
                user_nome: cliente.nome || 'Cliente',
                user_email: cliente.email || '',
                user_cargo: 'Cliente'
              }
            } else {
              console.log(`❌ Cliente não encontrado com ID: ${ass.user_id}`)
            }
          } else {
            console.log(`👷 Buscando FUNCIONÁRIO com ID: ${ass.user_id}`)
            const { data: funcionario } = await supabaseAdmin
              .from('funcionarios')
              .select('nome, email, cargo')
              .eq('id', ass.user_id)
              .single()

            if (funcionario) {
              console.log(`✅ Funcionário encontrado: ${funcionario.nome}`)
              userInfo = {
                user_nome: funcionario.nome || 'Funcionário',
                user_email: funcionario.email || '',
                user_cargo: funcionario.cargo || 'Funcionário'
              }
            } else {
              console.log(`❌ Funcionário não encontrado com ID: ${ass.user_id}`)
            }
          }
        } catch (error) {
          console.log('❌ Erro ao buscar usuário local:', error.message)
        }
      }

      const resultado = {
        ...ass,
        ...userInfo
      }
      
      console.log(`✅ RESULTADO FINAL:`, {
        user_id: resultado.user_id,
        tipo: resultado.tipo,
        user_nome: resultado.user_nome,
        user_cargo: resultado.user_cargo
      })
      
      return resultado
    }))

    const documentoCompleto = {
      ...documento,
      assinaturas: assinaturasComUsuario,
      historico: historico || []
    }

    res.json({
      success: true,
      data: documentoCompleto
    })

  } catch (error) {
    console.error('Erro ao buscar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

// Endpoint de teste para criar documento sem arquivo
router.post('/test/create-document', async (req, res) => {
  try {
    const { titulo, descricao, ordem_assinatura } = req.body
    
    console.log('=== TESTE CRIAÇÃO DOCUMENTO ===')
    console.log('titulo:', titulo)
    console.log('descricao:', descricao)
    console.log('ordem_assinatura:', ordem_assinatura)
    
    // Parse da ordem de assinatura
    const ordemAssinaturaArray = JSON.parse(ordem_assinatura)
    console.log('ordemAssinaturaArray:', JSON.stringify(ordemAssinaturaArray, null, 2))
    
    // Validar com Joi
    const { error: validationError } = documentoSchema.validate({
      titulo,
      descricao,
      ordem_assinatura: ordemAssinaturaArray
    })
    
    if (validationError) {
      console.error('Erro de validação:', validationError)
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        error: validationError.details[0].message
      })
    }
    
    // Verificar se os usuários existem (auth.users para UUIDs, funcionários/clientes para IDs numéricos)
    const userIds = ordemAssinaturaArray.map(item => item.user_id)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    // Separar UUIDs e IDs numéricos
    const uuids = userIds.filter(id => uuidPattern.test(id))
    const numericIds = userIds.filter(id => !uuidPattern.test(id))
    
    // Verificar UUIDs no auth.users
    const usuariosInexistentes = []
    
    if (uuids.length > 0) {
      const { data: usuariosAuth, error: usuariosError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (usuariosError) {
        console.error('Erro ao verificar usuários auth:', usuariosError)
        return res.status(500).json({
          success: false,
          message: 'Erro ao verificar usuários auth',
          error: usuariosError.message
        })
      }
      
      const usuariosAuthIds = usuariosAuth.users.map(u => u.id)
      const uuidsInexistentes = uuids.filter(id => !usuariosAuthIds.includes(id))
      usuariosInexistentes.push(...uuidsInexistentes)
    }
    
    // Verificar IDs numéricos nas tabelas funcionários/clientes
    if (numericIds.length > 0) {
      for (const id of numericIds) {
        const { data: funcionario } = await supabaseAdmin
          .from('funcionarios')
          .select('id')
          .eq('id', id)
          .single()
          
        const { data: cliente } = await supabaseAdmin
          .from('clientes')
          .select('id')
          .eq('id', id)
          .single()
          
        if (!funcionario && !cliente) {
          usuariosInexistentes.push(id)
        }
      }
    }
    
    if (usuariosInexistentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Usuários não encontrados',
        error: `IDs de usuários não encontrados: ${usuariosInexistentes.join(', ')}`
      })
    }

    // Buscar uma obra existente para teste
    const { data: obraExistente, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id')
      .limit(1)
      .single()

    if (obraError || !obraExistente) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma obra encontrada para teste'
      })
    }

    // Criar documento de teste
    // Converter primeiro user_id para UUID se necessário
    const primeiroUserId = ordemAssinaturaArray[0]?.user_id
    let proximoAssinanteId = null
    
    if (primeiroUserId) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidPattern.test(primeiroUserId)) {
        const numericId = parseInt(primeiroUserId)
        if (!isNaN(numericId)) {
          proximoAssinanteId = `00000000-0000-0000-0000-${numericId.toString().padStart(12, '0')}`
        }
      } else {
        proximoAssinanteId = primeiroUserId
      }
    }

    const documentoData = {
      obra_id: obraExistente.id,
      titulo,
      descricao: descricao || null,
      arquivo_original: 'teste.pdf',
      caminho_arquivo: 'teste/teste.pdf',
      status: 'rascunho',
      created_by: usuariosExistentesIds[0], // Usar um usuário que existe
      proximo_assinante_id: proximoAssinanteId
    }
    
    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .insert(documentoData)
      .select()
      .single()
    
    if (documentoError) {
      console.error('Erro ao criar documento:', documentoError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar documento',
        error: documentoError.message
      })
    }
    
    // Salvar assinaturas
    const assinaturasData = ordemAssinaturaArray.map(item => ({
      documento_id: documento.id,
      user_id: item.user_id, // Usar o ID original (string)
      ordem: item.ordem,
      status: item.status || (item.ordem === 1 ? 'aguardando' : 'pendente'),
      tipo: item.tipo || 'interno',
      docu_sign_link: item.docu_sign_link || null
    }))
    
    console.log('assinaturasData:', JSON.stringify(assinaturasData, null, 2))
    
    const { data: assinaturasInseridas, error: assinaturasError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .insert(assinaturasData)
      .select()
    
    if (assinaturasError) {
      console.error('Erro ao salvar assinaturas:', assinaturasError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar assinaturas',
        error: assinaturasError.message
      })
    }
    
    console.log('Assinaturas inseridas:', assinaturasInseridas)
    console.log('=== FIM TESTE ===')
    
    res.json({
      success: true,
      message: 'Documento de teste criado com sucesso',
      data: {
        documento,
        assinaturas: assinaturasInseridas
      }
    })
    
  } catch (error) {
    console.error('Erro no teste:', error)
    res.status(500).json({
      success: false,
      message: 'Erro no teste',
      error: error.message
    })
  }
})

// Endpoint para listar usuários disponíveis
router.get('/test/users', async (req, res) => {
  try {
    const { data: usuarios, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuários',
        error: error.message
      })
    }

    // Mapear dados dos usuários para formato mais simples
    const usuariosFormatados = usuarios.users.map(user => ({
      id: user.id,
      email: user.email,
      nome: user.user_metadata?.nome || user.email,
      role: user.user_metadata?.role || 'user'
    }))

    res.json({
      success: true,
      data: usuariosFormatados
    })

  } catch (error) {
    console.error('Erro no teste:', error)
    res.status(500).json({
      success: false,
      message: 'Erro no teste',
      error: error.message
    })
  }
})

// Endpoint de teste para verificar estrutura da tabela
router.get('/test/table-structure', async (req, res) => {
  try {
    // Verificar estrutura da tabela obras_documento_assinaturas
    const { data, error } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Erro ao verificar tabela:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar tabela',
        error: error.message
      })
    }

    // Buscar um usuário válido para teste
    const { data: usuarios, error: usuariosError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usuariosError || !usuarios.users.length) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum usuário encontrado para teste'
      })
    }

    // Tentar inserir um registro de teste
    const testData = {
      documento_id: 999999, // ID que não existe
      user_id: usuarios.users[0].id, // Usar ID de usuário válido
      ordem: 1,
      status: 'pendente',
      tipo: 'interno',
      docu_sign_link: 'test'
    }

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .insert(testData)
      .select()

    if (insertError) {
      console.error('Erro ao inserir teste:', insertError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao inserir teste',
        error: insertError.message,
        testData
      })
    }

    // Remover o registro de teste
    await supabaseAdmin
      .from('obras_documento_assinaturas')
      .delete()
      .eq('documento_id', 999999)

    res.json({
      success: true,
      message: 'Tabela funcionando corretamente',
      testInsert: insertData
    })

  } catch (error) {
    console.error('Erro no teste:', error)
    res.status(500).json({
      success: false,
      message: 'Erro no teste',
      error: error.message
    })
  }
})

export default router
