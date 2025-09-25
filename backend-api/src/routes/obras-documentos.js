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
      user_id: Joi.number().integer().positive().required(),
      ordem: Joi.number().integer().positive().required()
    })
  ).min(1).required()
})

/**
 * @swagger
 * /api/obras/{obraId}/documentos:
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
 */
router.get('/:obraId/documentos', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
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
          .select(`
            *,
            usuarios (
              id,
              nome,
              email,
              role
            )
          `)
          .eq('documento_id', documento.id)
          .order('ordem', { ascending: true })

        if (assinaturasError) {
          console.error('Erro ao buscar assinaturas:', assinaturasError)
          return { ...documento, assinaturas: [] }
        }

        return {
          ...documento,
          ordemAssinatura: assinaturas
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
 * /api/obras/{obraId}/documentos:
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
 *               descricao:
 *                 type: string
 *               arquivo:
 *                 type: string
 *                 format: binary
 *               ordem_assinatura:
 *                 type: string
 *                 description: JSON string com array de objetos {user_id, ordem}
 *     responses:
 *       201:
 *         description: Documento criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:obraId/documentos', authenticateToken, requirePermission('criar_obras'), upload.single('arquivo'), async (req, res) => {
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
    const ordemAssinaturaArray = JSON.parse(ordem_assinatura)
    const { error: validationError } = documentoSchema.validate({
      titulo,
      descricao,
      ordem_assinatura: ordemAssinaturaArray
    })

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

    // Salvar documento no banco
    const documentoData = {
      obra_id: parseInt(obraId),
      titulo,
      descricao: descricao || null,
      arquivo_original: file.originalname,
      caminho_arquivo: filePath,
      status: 'rascunho',
      created_by: req.user.id,
      proximo_assinante_id: ordemAssinaturaArray[0]?.user_id || null
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
    const assinaturasData = ordemAssinaturaArray.map(item => ({
      documento_id: documento.id,
      user_id: item.user_id,
      ordem: item.ordem,
      status: item.ordem === 1 ? 'aguardando' : 'pendente'
    }))

    const { error: assinaturasError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .insert(assinaturasData)

    if (assinaturasError) {
      console.error('Erro ao salvar assinaturas:', assinaturasError)
      // Não falhar a operação, apenas logar o erro
    }

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
 * /api/obras/{obraId}/documentos/{documentoId}:
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
 *       404:
 *         description: Documento não encontrado
 */
router.get('/:obraId/documentos/:documentoId', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
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
      .select(`
        *,
        usuarios (
          id,
          nome,
          email,
          role
        )
      `)
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
 * /api/obras/{obraId}/documentos/{documentoId}/enviar:
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
 *       404:
 *         description: Documento não encontrado
 */
router.post('/:obraId/documentos/:documentoId/enviar', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
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
 * /api/obras/{obraId}/documentos/{documentoId}/download:
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
 *         description: Arquivo do documento
 *       404:
 *         description: Documento não encontrado
 */
router.get('/:obraId/documentos/:documentoId/download', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
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

    // Gerar URL assinada para download
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .createSignedUrl(documento.caminho_arquivo, 3600) // 1 hora

    if (urlError) {
      console.error('Erro ao gerar URL:', urlError)
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
 * /api/obras/{obraId}/documentos/{documentoId}:
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
 *       404:
 *         description: Documento não encontrado
 */
router.delete('/:obraId/documentos/:documentoId', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
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

export default router
