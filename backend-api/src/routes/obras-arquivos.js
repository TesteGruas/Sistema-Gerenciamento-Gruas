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
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar vários tipos de arquivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false)
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

// Função para determinar tipo de arquivo
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'imagem'
  if (mimetype === 'application/pdf') return 'pdf'
  if (mimetype.includes('word')) return 'documento'
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'planilha'
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'apresentacao'
  if (mimetype === 'text/plain') return 'texto'
  if (mimetype.includes('zip') || mimetype.includes('rar')) return 'compactado'
  return 'outro'
}

// Schema de validação para arquivos
const arquivoSchema = Joi.object({
  descricao: Joi.string().allow('').optional(),
  categoria: Joi.string().valid('geral', 'manual', 'certificado', 'licenca', 'contrato', 'relatorio', 'foto', 'outro').default('geral'),
  grua_id: Joi.string().allow('').optional(),
  is_public: Joi.boolean().default(false)
})

/**
 * @swagger
 * /api/obras/{obraId}/arquivos:
 *   get:
 *     summary: Listar arquivos de uma obra
 *     tags: [Obras Arquivos]
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
 *         name: categoria
 *         schema:
 *           type: string
 *           enum: [geral, manual, certificado, licenca, contrato, relatorio, foto, outro]
 *         description: Filtrar por categoria
 *       - in: query
 *         name: tipo_arquivo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de arquivo
 *       - in: query
 *         name: grua_id
 *         schema:
 *           type: string
 *         description: Filtrar por grua específica
 *     responses:
 *       200:
 *         description: Lista de arquivos da obra
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
 *                       grua_id:
 *                         type: string
 *                       nome_original:
 *                         type: string
 *                       nome_arquivo:
 *                         type: string
 *                       caminho:
 *                         type: string
 *                       tamanho:
 *                         type: integer
 *                       tipo_mime:
 *                         type: string
 *                       tipo_arquivo:
 *                         type: string
 *                       descricao:
 *                         type: string
 *                       categoria:
 *                         type: string
 *                       uploaded_by:
 *                         type: string
 *                       is_public:
 *                         type: boolean
 *                       download_count:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:obraId/arquivos', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obraId } = req.params
    const { categoria, tipo_arquivo, grua_id } = req.query

    let query = supabaseAdmin
      .from('v_obras_arquivos_completo')
      .select('*')
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false })

    if (categoria) {
      query = query.eq('categoria', categoria)
    }
    if (tipo_arquivo) {
      query = query.eq('tipo_arquivo', tipo_arquivo)
    }
    if (grua_id) {
      query = query.eq('grua_id', grua_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar arquivos:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar arquivos',
        error: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao listar arquivos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{obraId}/arquivos:
 *   post:
 *     summary: Upload de arquivo para uma obra
 *     tags: [Obras Arquivos]
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
 *               - arquivo
 *             properties:
 *               arquivo:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo para upload (máximo 100MB)
 *               descricao:
 *                 type: string
 *                 description: Descrição do arquivo
 *               categoria:
 *                 type: string
 *                 enum: [geral, manual, certificado, licenca, contrato, relatorio, foto, outro]
 *                 description: Categoria do arquivo
 *               grua_id:
 *                 type: string
 *                 description: ID da grua relacionada (opcional)
 *               is_public:
 *                 type: boolean
 *                 description: Se o arquivo é público
 *     responses:
 *       201:
 *         description: Arquivo enviado com sucesso
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
 *                     nome_original:
 *                       type: string
 *                     tamanho:
 *                       type: integer
 *                     tipo_mime:
 *                       type: string
 *                     categoria:
 *                       type: string
 *                     obra_id:
 *                       type: integer
 *                     grua_id:
 *                       type: string
 *                     url:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Obra ou grua não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:obraId/arquivos', authenticateToken, requirePermission('obras:editar'), upload.single('arquivo'), async (req, res) => {
  try {
    const { obraId } = req.params
    const { descricao, categoria, grua_id, is_public } = req.body
    const file = req.file

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      })
    }

    // Validar dados
    const { error: validationError } = arquivoSchema.validate({
      descricao,
      categoria,
      grua_id,
      is_public: is_public === 'true'
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

    // Verificar se a grua existe (se fornecida)
    if (grua_id) {
      const { data: grua, error: gruaError } = await supabaseAdmin
        .from('gruas')
        .select('id')
        .eq('id', grua_id)
        .single()

      if (gruaError || !grua) {
        return res.status(404).json({
          success: false,
          message: 'Grua não encontrada'
        })
      }
    }

    // Gerar nome único para o arquivo
    const fileName = generateFileName(file.originalname, obraId)
    const filePath = `obras/${obraId}/arquivos/${fileName}`

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

    // Salvar metadados do arquivo no banco
    const arquivoData = {
      obra_id: parseInt(obraId),
      grua_id: grua_id || null,
      nome_original: file.originalname,
      nome_arquivo: fileName,
      caminho: filePath,
      tamanho: file.size,
      tipo_mime: file.mimetype,
      tipo_arquivo: getFileType(file.mimetype),
      descricao: descricao || null,
      categoria: categoria || 'geral',
      uploaded_by: req.user.id,
      is_public: is_public === 'true' || false
    }

    const { data: arquivoRecord, error: dbError } = await supabaseAdmin
      .from('obras_arquivos')
      .insert(arquivoData)
      .select()
      .single()

    if (dbError) {
      // Se falhar ao salvar no banco, remover o arquivo do storage
      await supabaseAdmin.storage
        .from('arquivos-obras')
        .remove([filePath])
      
      console.error('Erro ao salvar metadados:', dbError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar metadados do arquivo',
        error: dbError.message
      })
    }

    res.status(201).json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      data: {
        id: arquivoRecord.id,
        nome_original: arquivoRecord.nome_original,
        tamanho: arquivoRecord.tamanho,
        tipo_mime: arquivoRecord.tipo_mime,
        categoria: arquivoRecord.categoria,
        obra_id: arquivoRecord.obra_id,
        grua_id: arquivoRecord.grua_id,
        url: uploadData.path
      }
    })

  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{obraId}/arquivos/{arquivoId}:
 *   get:
 *     summary: Obter arquivo específico
 *     tags: [Obras Arquivos]
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
 *         name: arquivoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do arquivo
 *     responses:
 *       200:
 *         description: Dados do arquivo
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
 *                     grua_id:
 *                       type: string
 *                     nome_original:
 *                       type: string
 *                     nome_arquivo:
 *                       type: string
 *                     caminho:
 *                       type: string
 *                     tamanho:
 *                       type: integer
 *                     tipo_mime:
 *                       type: string
 *                     tipo_arquivo:
 *                       type: string
 *                     descricao:
 *                       type: string
 *                     categoria:
 *                       type: string
 *                     uploaded_by:
 *                       type: string
 *                     is_public:
 *                       type: boolean
 *                     download_count:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Arquivo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:obraId/arquivos/:arquivoId', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obraId, arquivoId } = req.params

    const { data: arquivo, error: arquivoError } = await supabaseAdmin
      .from('v_obras_arquivos_completo')
      .select('*')
      .eq('id', arquivoId)
      .eq('obra_id', obraId)
      .single()

    if (arquivoError || !arquivo) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      })
    }

    res.json({
      success: true,
      data: arquivo
    })
  } catch (error) {
    console.error('Erro ao buscar arquivo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{obraId}/arquivos/{arquivoId}/download:
 *   get:
 *     summary: Download do arquivo
 *     tags: [Obras Arquivos]
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
 *         name: arquivoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do arquivo
 *     responses:
 *       200:
 *         description: URL de download do arquivo
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
 *         description: Arquivo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:obraId/arquivos/:arquivoId/download', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { obraId, arquivoId } = req.params

    const { data: arquivo, error: arquivoError } = await supabaseAdmin
      .from('obras_arquivos')
      .select('caminho, nome_original')
      .eq('id', arquivoId)
      .eq('obra_id', obraId)
      .single()

    if (arquivoError || !arquivo) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      })
    }

    // Gerar URL assinada para download
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .createSignedUrl(arquivo.caminho, 3600) // 1 hora

    if (urlError) {
      console.error('Erro ao gerar URL:', urlError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar link de download',
        error: urlError.message
      })
    }

    // Atualizar contador de downloads
    const { data: arquivoAtual, error: arquivoAtualError } = await supabaseAdmin
      .from('obras_arquivos')
      .select('download_count')
      .eq('id', arquivoId)
      .single()

    if (!arquivoAtualError && arquivoAtual) {
      await supabaseAdmin
        .from('obras_arquivos')
        .update({
          download_count: (arquivoAtual.download_count || 0) + 1,
          last_download_at: new Date().toISOString()
        })
        .eq('id', arquivoId)
    }

    res.json({
      success: true,
      data: {
        download_url: signedUrl.signedUrl,
        nome_arquivo: arquivo.nome_original
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
 * /api/obras/{obraId}/arquivos/{arquivoId}:
 *   put:
 *     summary: Atualizar metadados do arquivo
 *     tags: [Obras Arquivos]
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
 *         name: arquivoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do arquivo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descricao:
 *                 type: string
 *                 description: Nova descrição do arquivo
 *               categoria:
 *                 type: string
 *                 enum: [geral, manual, certificado, licenca, contrato, relatorio, foto, outro]
 *                 description: Nova categoria do arquivo
 *               is_public:
 *                 type: boolean
 *                 description: Se o arquivo deve ser público
 *     responses:
 *       200:
 *         description: Arquivo atualizado com sucesso
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
 *                   description: Dados atualizados do arquivo
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Arquivo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:obraId/arquivos/:arquivoId', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { obraId, arquivoId } = req.params
    const { descricao, categoria, is_public } = req.body

    // Validar dados
    const { error: validationError } = arquivoSchema.validate({
      descricao,
      categoria,
      is_public
    })

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        error: validationError.details[0].message
      })
    }

    // Verificar se o arquivo existe
    const { data: arquivo, error: arquivoError } = await supabaseAdmin
      .from('obras_arquivos')
      .select('id')
      .eq('id', arquivoId)
      .eq('obra_id', obraId)
      .single()

    if (arquivoError || !arquivo) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      })
    }

    // Atualizar arquivo
    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (descricao !== undefined) updateData.descricao = descricao
    if (categoria !== undefined) updateData.categoria = categoria
    if (is_public !== undefined) updateData.is_public = is_public

    const { data: updatedArquivo, error: updateError } = await supabaseAdmin
      .from('obras_arquivos')
      .update(updateData)
      .eq('id', arquivoId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar arquivo:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar arquivo',
        error: updateError.message
      })
    }

    res.json({
      success: true,
      message: 'Arquivo atualizado com sucesso',
      data: updatedArquivo
    })
  } catch (error) {
    console.error('Erro ao atualizar arquivo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{obraId}/arquivos/{arquivoId}:
 *   delete:
 *     summary: Excluir arquivo
 *     tags: [Obras Arquivos]
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
 *         name: arquivoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do arquivo
 *     responses:
 *       200:
 *         description: Arquivo excluído com sucesso
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
 *         description: Arquivo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:obraId/arquivos/:arquivoId', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { obraId, arquivoId } = req.params

    // Verificar se o arquivo existe
    const { data: arquivo, error: arquivoError } = await supabaseAdmin
      .from('obras_arquivos')
      .select('caminho')
      .eq('id', arquivoId)
      .eq('obra_id', obraId)
      .single()

    if (arquivoError || !arquivo) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      })
    }

    // Excluir arquivo do storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .remove([arquivo.caminho])

    if (storageError) {
      console.error('Erro ao remover arquivo do storage:', storageError)
      // Continuar mesmo se falhar ao remover do storage
    }

    // Excluir arquivo do banco
    const { error: deleteError } = await supabaseAdmin
      .from('obras_arquivos')
      .delete()
      .eq('id', arquivoId)

    if (deleteError) {
      console.error('Erro ao excluir arquivo:', deleteError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir arquivo',
        error: deleteError.message
      })
    }

    res.json({
      success: true,
      message: 'Arquivo excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{obraId}/arquivos/upload-multiple:
 *   post:
 *     summary: Upload múltiplo de arquivos
 *     tags: [Obras Arquivos]
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
 *               - arquivos
 *             properties:
 *               arquivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array de arquivos para upload (máximo 10 arquivos, 100MB cada)
 *               categoria:
 *                 type: string
 *                 enum: [geral, manual, certificado, licenca, contrato, relatorio, foto, outro]
 *                 description: Categoria padrão para todos os arquivos
 *     responses:
 *       201:
 *         description: Arquivos enviados com sucesso
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
 *                     sucessos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Arquivos enviados com sucesso
 *                     erros:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           arquivo:
 *                             type: string
 *                           erro:
 *                             type: string
 *                         description: Arquivos que falharam no upload
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Obra não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:obraId/arquivos/upload-multiple', authenticateToken, requirePermission('obras:editar'), upload.array('arquivos', 10), async (req, res) => {
  try {
    const { obraId } = req.params
    const { categoria, metadados } = req.body
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
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

    let metadadosArray = []
    if (metadados) {
      try {
        const parsed = typeof metadados === 'string' ? JSON.parse(metadados) : metadados
        metadadosArray = Array.isArray(parsed) ? parsed : []
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Campo "metadados" inválido. Envie um JSON array válido.',
          error: parseError.message
        })
      }
    }

    const resultados = []
    const erros = []

    // Processar cada arquivo
    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      try {
        const metadata = metadadosArray[index]
          || metadadosArray.find((m) => m?.nome_original && m.nome_original === file.originalname)
          || {}

        const categoriaArquivo = metadata.categoria || categoria || 'geral'
        const descricaoArquivo = metadata.descricao || null
        const gruaIdArquivo = metadata.grua_id || null
        const isPublicArquivo = metadata.is_public === true || metadata.is_public === 'true'
        const clientKey = metadata.client_key || null

        const fileName = generateFileName(file.originalname, obraId)
        const filePath = `obras/${obraId}/arquivos/${fileName}`

        // Validar categoria por arquivo
        const categoriasPermitidas = ['geral', 'manual', 'certificado', 'licenca', 'contrato', 'relatorio', 'foto', 'outro']
        if (!categoriasPermitidas.includes(categoriaArquivo)) {
          erros.push({
            arquivo: file.originalname,
            erro: `Categoria inválida: ${categoriaArquivo}`
          })
          continue
        }

        // Verificar se a grua existe (se fornecida no metadado)
        if (gruaIdArquivo) {
          const { data: grua, error: gruaError } = await supabaseAdmin
            .from('gruas')
            .select('id')
            .eq('id', gruaIdArquivo)
            .single()

          if (gruaError || !grua) {
            erros.push({
              arquivo: file.originalname,
              erro: `Grua não encontrada: ${gruaIdArquivo}`
            })
            continue
          }
        }

        // Upload para o Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('arquivos-obras')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          erros.push({
            arquivo: file.originalname,
            erro: uploadError.message
          })
          continue
        }

        // Salvar metadados do arquivo no banco
        const arquivoData = {
          obra_id: parseInt(obraId),
          grua_id: gruaIdArquivo,
          nome_original: file.originalname,
          nome_arquivo: fileName,
          caminho: filePath,
          tamanho: file.size,
          tipo_mime: file.mimetype,
          tipo_arquivo: getFileType(file.mimetype),
          descricao: descricaoArquivo,
          categoria: categoriaArquivo,
          uploaded_by: req.user.id,
          is_public: isPublicArquivo
        }

        const { data: arquivoRecord, error: dbError } = await supabaseAdmin
          .from('obras_arquivos')
          .insert(arquivoData)
          .select()
          .single()

        if (dbError) {
          // Remover arquivo do storage se falhar ao salvar no banco
          await supabaseAdmin.storage
            .from('arquivos-obras')
            .remove([filePath])
          
          erros.push({
            arquivo: file.originalname,
            erro: dbError.message
          })
        } else {
          resultados.push({
            ...arquivoRecord,
            client_key: clientKey,
            url: uploadData?.path || filePath
          })
        }

      } catch (error) {
        erros.push({
          arquivo: file.originalname,
          erro: error.message
        })
      }
    }

    res.status(201).json({
      success: true,
      message: `${resultados.length} arquivo(s) enviado(s) com sucesso`,
      data: {
        sucessos: resultados,
        erros: erros
      }
    })

  } catch (error) {
    console.error('Erro no upload múltiplo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

export default router
