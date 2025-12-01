import express from 'express'
import multer from 'multer'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'
import { normalizeRoleName, getRoleLevel } from '../config/roles.js'

const router = express.Router()

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'), false)
    }
  }
})

// Função para gerar nome único do arquivo
const generateFileName = (originalName) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  return `assinado_${timestamp}_${random}.${extension}`
}

/**
 * GET /api/assinaturas/pendentes
 * Buscar documentos pendentes de assinatura para o usuário atual
 */
router.get('/pendentes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Buscar documentos onde o usuário é o próximo assinante
    const { data: documentos, error } = await supabaseAdmin
      .from('v_obras_documentos_completo')
      .select('*')
      .in('status', ['aguardando_assinatura', 'em_assinatura'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar documentos pendentes:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar documentos pendentes',
        error: error.message
      })
    }

    // Filtrar documentos onde o usuário atual é o próximo assinante
    const documentosPendentes = []
    
    for (const documento of documentos || []) {
      // Buscar assinaturas do documento
      const { data: assinaturas } = await supabaseAdmin
        .from('obras_documento_assinaturas')
        .select('*')
        .eq('documento_id', documento.id)
        .order('ordem', { ascending: true })

      if (assinaturas) {
        // Verificar se o usuário atual é o próximo assinante
        const proximaAssinatura = assinaturas.find(ass => ass.status === 'aguardando' && ass.user_id === userId)
        
        if (proximaAssinatura) {
          documentosPendentes.push({
            ...documento,
            assinaturas
          })
        }
      }
    }

    res.json({
      success: true,
      data: documentosPendentes
    })
  } catch (error) {
    console.error('Erro ao buscar documentos pendentes:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * GET /api/assinaturas/documentos
 * Buscar todos os documentos do usuário (pendentes, assinados, rejeitados)
 */
router.get('/documentos', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Buscar todas assinaturas do usuário
    const { data: minhasAssinaturas, error: assinaturasError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('documento_id')
      .eq('user_id', userId)

    if (assinaturasError) {
      console.error('Erro ao buscar assinaturas:', assinaturasError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar assinaturas',
        error: assinaturasError.message
      })
    }

    if (!minhasAssinaturas || minhasAssinaturas.length === 0) {
      return res.json({
        success: true,
        data: []
      })
    }

    const documentoIds = minhasAssinaturas.map(ass => ass.documento_id)

    // Buscar documentos
    const { data: documentos, error: documentosError } = await supabaseAdmin
      .from('v_obras_documentos_completo')
      .select('*')
      .in('id', documentoIds)
      .order('created_at', { ascending: false })

    if (documentosError) {
      console.error('Erro ao buscar documentos:', documentosError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar documentos',
        error: documentosError.message
      })
    }

    // Buscar assinaturas para cada documento
    const documentosComAssinaturas = await Promise.all(
      (documentos || []).map(async (doc) => {
        const { data: assinaturas } = await supabaseAdmin
          .from('obras_documento_assinaturas')
          .select('*')
          .eq('documento_id', doc.id)
          .order('ordem', { ascending: true })

        return {
          ...doc,
          assinaturas: assinaturas || []
        }
      })
    )

    res.json({
      success: true,
      data: documentosComAssinaturas
    })
  } catch (error) {
    console.error('Erro ao buscar documentos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * GET /api/assinaturas/documento/:id
 * Buscar documento específico por ID
 */
router.get('/documento/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('v_obras_documentos_completo')
      .select('*')
      .eq('id', id)
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
      .eq('documento_id', id)
      .order('ordem', { ascending: true })

    if (assinaturasError) {
      console.error('Erro ao buscar assinaturas:', assinaturasError)
    }

    res.json({
      success: true,
      data: {
        ...documento,
        assinaturas: assinaturas || []
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
 * POST /api/assinaturas/assinar/:id
 * Assinar um documento digitalmente
 */
router.post('/assinar/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { assinatura, geoloc, timestamp, observacoes } = req.body
    const userId = req.user.id

    if (!assinatura) {
      return res.status(400).json({
        success: false,
        message: 'Assinatura é obrigatória'
      })
    }

    // Buscar documento
    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .select('*')
      .eq('id', id)
      .single()

    if (documentoError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Verificar se o documento está em aguardando_assinatura ou em_assinatura
    if (!['aguardando_assinatura', 'em_assinatura'].includes(documento.status)) {
      return res.status(400).json({
        success: false,
        message: 'Documento não está disponível para assinatura'
      })
    }

    // Buscar assinatura do usuário
    const { data: assinaturaUser, error: assinaturaError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('documento_id', id)
      .eq('user_id', userId)
      .eq('status', 'aguardando')
      .single()

    if (assinaturaError || !assinaturaUser) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para assinar este documento'
      })
    }

    // Salvar assinatura no storage (opcional - aqui vou salvar como base64 no banco)
    // Em produção, você pode querer salvar a imagem da assinatura no Supabase Storage
    
    // Atualizar assinatura do usuário
    const { error: updateAssinaturaError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .update({
        status: 'assinado',
        data_assinatura: new Date().toISOString(),
        arquivo_assinado: assinatura, // Base64 da assinatura
        observacoes: observacoes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', assinaturaUser.id)

    if (updateAssinaturaError) {
      console.error('Erro ao atualizar assinatura:', updateAssinaturaError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar assinatura',
        error: updateAssinaturaError.message
      })
    }

    // Buscar todas as assinaturas do documento para verificar próximos passos
    const { data: todasAssinaturas, error: todasAssinaturasError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('documento_id', id)
      .order('ordem', { ascending: true })

    if (todasAssinaturasError) {
      console.error('Erro ao buscar assinaturas:', todasAssinaturasError)
    }

    // Verificar se há mais assinaturas pendentes
    const assinaturasPendentes = todasAssinaturas?.filter(ass => ass.status === 'pendente') || []
    const proximaAssinatura = assinaturasPendentes.length > 0 ? assinaturasPendentes[0] : null

    // Atualizar status do documento
    let novoStatus = documento.status
    let proximoAssinanteId = documento.proximo_assinante_id

    if (proximaAssinatura) {
      // Ainda há assinaturas pendentes - atualizar status para aguardando
      await supabaseAdmin
        .from('obras_documento_assinaturas')
        .update({ status: 'aguardando' })
        .eq('id', proximaAssinatura.id)
      
      novoStatus = 'em_assinatura'
      proximoAssinanteId = proximaAssinatura.user_id
    } else {
      // Todas assinaturas completas - documento assinado
      novoStatus = 'assinado'
      proximoAssinanteId = null
    }

    // Atualizar documento
    const { error: updateDocumentoError } = await supabaseAdmin
      .from('obras_documentos')
      .update({
        status: novoStatus,
        proximo_assinante_id: proximoAssinanteId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateDocumentoError) {
      console.error('Erro ao atualizar documento:', updateDocumentoError)
    }

    // Registrar no histórico
    await supabaseAdmin
      .from('obras_documento_historico')
      .insert({
        documento_id: id,
        user_id: userId,
        acao: 'assinou',
        user_nome: req.user.nome || req.user.email,
        user_email: req.user.email,
        user_role: req.user.role,
        observacoes: `Assinado via PWA${geoloc ? ` - Localização: ${geoloc}` : ''}`
      })

    res.json({
      success: true,
      message: 'Documento assinado com sucesso',
      data: {
        status: novoStatus,
        proximoAssinante: proximaAssinatura ? {
          user_id: proximaAssinatura.user_id,
          ordem: proximaAssinatura.ordem
        } : null
      }
    })
  } catch (error) {
    console.error('Erro ao assinar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * POST /api/assinaturas/recusar/:id
 * Recusar um documento
 */
router.post('/recusar/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { motivo, observacoes } = req.body
    const userId = req.user.id

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da rejeição é obrigatório'
      })
    }

    // Buscar documento
    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .select('*')
      .eq('id', id)
      .single()

    if (documentoError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Verificar se o usuário tem permissão para rejeitar
    const { data: assinaturaUser, error: assinaturaError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('documento_id', id)
      .eq('user_id', userId)
      .eq('status', 'aguardando')
      .single()

    if (assinaturaError || !assinaturaUser) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para rejeitar este documento'
      })
    }

    // Atualizar assinatura do usuário
    await supabaseAdmin
      .from('obras_documento_assinaturas')
      .update({
        status: 'rejeitado',
        observacoes: motivo,
        updated_at: new Date().toISOString()
      })
      .eq('id', assinaturaUser.id)

    // Atualizar documento para status rejeitado
    await supabaseAdmin
      .from('obras_documentos')
      .update({
        status: 'rejeitado',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    // Registrar no histórico
    await supabaseAdmin
      .from('obras_documento_historico')
      .insert({
        documento_id: id,
        user_id: userId,
        acao: 'rejeitou',
        user_nome: req.user.nome || req.user.email,
        user_email: req.user.email,
        user_role: req.user.role,
        observacoes: `Motivo: ${motivo}${observacoes ? ` - ${observacoes}` : ''}`
      })

    res.json({
      success: true,
      message: 'Documento rejeitado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao rejeitar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * GET /api/assinaturas/historico
 * Buscar histórico de assinaturas do usuário
 */
router.get('/historico', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const { data: assinaturas, error } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar histórico:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico',
        error: error.message
      })
    }

    res.json({
      success: true,
      data: assinaturas || []
    })
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * GET /api/assinaturas/:id/validar
 * Validar se um documento pode ser assinado pelo usuário atual
 */
router.get('/:id/validar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Buscar documento
    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .select('status')
      .eq('id', id)
      .single()

    if (documentoError || !documento) {
      return res.json({
        success: true,
        data: {
          valido: false,
          motivo: 'Documento não encontrado'
        }
      })
    }

    // Verificar status do documento
    if (!['aguardando_assinatura', 'em_assinatura'].includes(documento.status)) {
      return res.json({
        success: true,
        data: {
          valido: false,
          motivo: 'Documento não está disponível para assinatura'
        }
      })
    }

    // Verificar se o usuário é o próximo assinante
    const { data: assinatura, error: assinaturaError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('documento_id', id)
      .eq('user_id', userId)
      .eq('status', 'aguardando')
      .single()

    if (assinaturaError || !assinatura) {
      return res.json({
        success: true,
        data: {
          valido: false,
          motivo: 'Você não é o próximo assinante deste documento'
        }
      })
    }

    res.json({
      success: true,
      data: {
        valido: true
      }
    })
  } catch (error) {
    console.error('Erro ao validar:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * GET /api/assinaturas/documento/:id/download
 * Download do arquivo do documento
 */
router.get('/documento/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .select('caminho_arquivo, arquivo_original')
      .eq('id', id)
      .single()

    if (documentoError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Verificar se o caminho_arquivo existe
    if (!documento.caminho_arquivo) {
      console.error(`Documento ${id} não possui caminho_arquivo`)
      return res.status(404).json({
        success: false,
        message: 'Arquivo do documento não encontrado',
        error: 'O documento não possui um arquivo associado'
      })
    }

    // Gerar URL assinada para download
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .createSignedUrl(documento.caminho_arquivo, 3600) // 1 hora

    if (urlError) {
      console.error('Erro ao gerar URL:', {
        error: urlError,
        caminho_arquivo: documento.caminho_arquivo,
        documentoId: id
      })
      
      // Verificar se é erro de arquivo não encontrado
      if (urlError.statusCode === '404' || urlError.message?.includes('not found') || urlError.message?.includes('Object not found')) {
        return res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado no storage',
          error: 'O arquivo do documento não foi encontrado. Pode ter sido removido ou nunca foi enviado.',
          details: {
            caminho_arquivo: documento.caminho_arquivo,
            documento_id: id
          }
        })
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar link de download',
        error: urlError.message
      })
    }

    // Fazer download do arquivo e retornar como blob
    const fileResponse = await fetch(signedUrl.signedUrl)
    
    if (!fileResponse.ok) {
      console.error(`Erro ao baixar arquivo: ${fileResponse.status} ${fileResponse.statusText}`)
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado no storage',
        error: 'O arquivo não pôde ser baixado'
      })
    }

    const fileBlob = await fileResponse.arrayBuffer()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${documento.arquivo_original}"`)
    res.send(Buffer.from(fileBlob))
  } catch (error) {
    console.error('Erro ao fazer download:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * POST /api/assinaturas/:id/lembrete
 * Enviar lembrete para assinantes pendentes
 */
router.post('/:id/lembrete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Buscar documento
    const { data: documento } = await supabaseAdmin
      .from('obras_documentos')
      .select('*')
      .eq('id', id)
      .single()

    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Buscar assinantes pendentes
    const { data: assinaturasPendentes } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('documento_id', id)
      .in('status', ['aguardando', 'pendente'])

    // TODO: Implementar envio de e-mail ou notificação push
    // Por enquanto, apenas registramos no histórico

    await supabaseAdmin
      .from('obras_documento_historico')
      .insert({
        documento_id: id,
        user_id: req.user.id,
        acao: 'lembrete',
        user_nome: req.user.nome || req.user.email,
        user_email: req.user.email,
        user_role: req.user.role,
        observacoes: `Lembrete enviado para ${assinaturasPendentes?.length || 0} assinante(s)`
      })

    res.json({
      success: true,
      message: 'Lembrete enviado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao enviar lembrete:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * POST /api/assinaturas/:id/upload-assinado
 * Upload de arquivo assinado por responsável individual
 */
router.post('/:id/upload-assinado', authenticateToken, upload.single('arquivo'), async (req, res) => {
  try {
    console.log('=== DEBUG UPLOAD ASSINADO ===')
    console.log('ID da assinatura:', req.params.id)
    console.log('User ID:', req.user?.id)
    console.log('File:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'Nenhum arquivo')
    console.log('Body:', req.body)
    console.log('=== FIM DEBUG ===')
    
    const { id } = req.params
    const { observacoes } = req.body
    const userId = req.user.id

    if (!req.file) {
      console.log('❌ Erro: Nenhum arquivo enviado')
      return res.status(400).json({
        success: false,
        message: 'Arquivo é obrigatório'
      })
    }

    // Buscar assinatura (permite qualquer usuário autenticado fazer upload)
    // Aceita status 'aguardando' OU 'pendente' se for ordem=1 (primeira assinatura)
    const { data: assinatura, error: assinaturaError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('id', id)
      .single()

    if (assinaturaError || !assinatura) {
      console.log('❌ Assinatura não encontrada:', {
        id: id,
        currentUserId: userId,
        error: assinaturaError
      })
      
      return res.status(404).json({
        success: false,
        message: 'Assinatura não encontrada'
      })
    }

    // Verificar se a assinatura está em status válido para upload
    const statusValido = assinatura.status === 'aguardando' || 
                        (assinatura.status === 'pendente' && assinatura.ordem === 1)

    if (!statusValido) {
      console.log('❌ Status inválido para upload:', {
        id: id,
        status: assinatura.status,
        ordem: assinatura.ordem
      })
      
      return res.status(400).json({
        success: false,
        message: `Esta assinatura não pode receber upload agora (status: ${assinatura.status}, ordem: ${assinatura.ordem})`,
        debug: process.env.NODE_ENV === 'development' ? {
          currentStatus: assinatura.status,
          ordem: assinatura.ordem,
          hint: assinatura.ordem > 1 ? 'Aguarde a assinatura anterior ser concluída' : null
        } : undefined
      })
    }

    // Se era pendente e ordem=1, ativar automaticamente
    if (assinatura.status === 'pendente' && assinatura.ordem === 1) {
      console.log('🔄 Ativando primeira assinatura automaticamente:', assinatura.id)
      await supabaseAdmin
        .from('obras_documento_assinaturas')
        .update({ status: 'aguardando', updated_at: new Date().toISOString() })
        .eq('id', assinatura.id)
      
      assinatura.status = 'aguardando' // Atualizar objeto local
    }

    // Buscar documento
    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .select('*')
      .eq('id', assinatura.documento_id)
      .single()

    if (documentoError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Verificar se o documento está disponível para assinatura
    if (!['aguardando_assinatura', 'em_assinatura'].includes(documento.status)) {
      return res.status(400).json({
        success: false,
        message: 'Documento não está disponível para assinatura'
      })
    }

    // Gerar nome único do arquivo
    const fileName = generateFileName(req.file.originalname)
    const filePath = `assinados/${documento.id}/${assinatura.id}/${fileName}`

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .upload(filePath, req.file.buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload do arquivo',
        error: uploadError.message
      })
    }

    // Gerar URL pública do arquivo
    const { data: urlData } = supabaseAdmin.storage
      .from('arquivos-obras')
      .getPublicUrl(filePath)

    // Log de auditoria se upload foi feito por outro usuário
    if (assinatura.user_id !== userId) {
      console.log(`📝 Upload feito por usuário diferente:`, {
        assinaturaId: assinatura.id,
        responsavel: assinatura.user_id,
        uploadPor: userId,
        documento: documento.id
      })
    }

    // Atualizar assinatura
    const { error: updateAssinaturaError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .update({
        status: 'assinado',
        arquivo_assinado: urlData.publicUrl,
        data_assinatura: new Date().toISOString(),
        observacoes: observacoes || null,
        uploaded_por: userId, // Registrar quem fez o upload
        updated_at: new Date().toISOString()
      })
      .eq('id', assinatura.id)

    if (updateAssinaturaError) {
      console.error('Erro ao atualizar assinatura:', updateAssinaturaError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar assinatura',
        error: updateAssinaturaError.message
      })
    }

    // Buscar todas as assinaturas do documento para verificar próximos passos
    const { data: todasAssinaturas, error: todasAssinaturasError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('documento_id', documento.id)
      .order('ordem', { ascending: true })

    if (todasAssinaturasError) {
      console.error('Erro ao buscar assinaturas:', todasAssinaturasError)
    }

    // Verificar se há mais assinaturas pendentes
    const assinaturasPendentes = todasAssinaturas?.filter(ass => ass.status === 'pendente') || []
    const proximaAssinatura = assinaturasPendentes.length > 0 ? assinaturasPendentes[0] : null

    // Atualizar status do documento
    let novoStatus = documento.status
    let proximoAssinanteId = documento.proximo_assinante_id

    if (proximaAssinatura) {
      // Ainda há assinaturas pendentes - ativar próximo assinante
      await supabaseAdmin
        .from('obras_documento_assinaturas')
        .update({ status: 'aguardando' })
        .eq('id', proximaAssinatura.id)
      
      novoStatus = 'em_assinatura'
      proximoAssinanteId = proximaAssinatura.user_id
    } else {
      // Todas assinaturas completas - documento assinado
      novoStatus = 'assinado'
      proximoAssinanteId = null
    }

    // Atualizar documento
    const { error: updateDocumentoError } = await supabaseAdmin
      .from('obras_documentos')
      .update({
        status: novoStatus,
        proximo_assinante_id: proximoAssinanteId,
        updated_at: new Date().toISOString()
      })
      .eq('id', documento.id)

    if (updateDocumentoError) {
      console.error('Erro ao atualizar documento:', updateDocumentoError)
    }

    // Registrar no histórico
    await supabaseAdmin
      .from('obras_documento_historico')
      .insert({
        documento_id: documento.id,
        user_id: userId,
        acao: 'assinou',
        user_nome: req.user.nome || req.user.email,
        user_email: req.user.email,
        user_role: req.user.role,
        observacoes: `Arquivo assinado enviado${observacoes ? ` - ${observacoes}` : ''}`
      })

    res.json({
      success: true,
      message: 'Arquivo assinado enviado com sucesso',
      data: {
        assinatura_id: assinatura.id,
        arquivo_url: urlData.publicUrl,
        status: 'assinado',
        data_assinatura: new Date().toISOString(),
        proximo_assinante: proximaAssinatura ? {
          user_id: proximaAssinatura.user_id,
          ordem: proximaAssinatura.ordem
        } : null
      }
    })
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo assinado:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * GET /api/assinaturas/:id/arquivo-assinado
 * Download do arquivo assinado
 */
router.get('/:id/arquivo-assinado', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Buscar assinatura
    const { data: assinatura, error: assinaturaError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*')
      .eq('id', id)
      .single()

    if (assinaturaError || !assinatura) {
      return res.status(404).json({
        success: false,
        message: 'Assinatura não encontrada'
      })
    }

    // Verificar se o usuário tem permissão para acessar
    // (pode ser o assinante, criador do documento, ou admin)
    const { data: documento } = await supabaseAdmin
      .from('obras_documentos')
      .select('created_by')
      .eq('id', assinatura.documento_id)
      .single()

    // Verificar permissão: próprio usuário, criador do documento, ou admin (nível 10+)
    const podeAcessar = assinatura.user_id === userId || 
                       documento?.created_by === userId ||
                       req.user.level >= 10

    if (!podeAcessar) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar este arquivo'
      })
    }

    if (!assinatura.arquivo_assinado) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo assinado não encontrado'
      })
    }

    // Extrair caminho do arquivo da URL
    const url = new URL(assinatura.arquivo_assinado)
    const filePath = url.pathname.split('/').slice(3).join('/') // Remove '/storage/v1/object/arquivos-obras/'

    // Gerar URL assinada para download
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .createSignedUrl(filePath, 3600) // 1 hora

    if (urlError) {
      console.error('Erro ao gerar URL:', urlError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar link de download',
        error: urlError.message
      })
    }

    // Fazer download do arquivo e retornar como stream
    const fileResponse = await fetch(signedUrl.signedUrl)
    const fileBlob = await fileResponse.arrayBuffer()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="arquivo_assinado_${id}.pdf"`)
    res.send(Buffer.from(fileBlob))
  } catch (error) {
    console.error('Erro ao fazer download:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * PUT /api/assinaturas/:id/status
 * Atualizar status da assinatura (para casos especiais)
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status, observacoes } = req.body
    const userId = req.user.id

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status é obrigatório'
      })
    }

    // Verificar se o usuário é admin ou criador do documento
    const { data: assinatura, error: assinaturaError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .select('*, obras_documentos!inner(created_by)')
      .eq('id', id)
      .single()

    if (assinaturaError || !assinatura) {
      return res.status(404).json({
        success: false,
        message: 'Assinatura não encontrada'
      })
    }

    // Verificar permissão: admin (nível 10+) ou criador do documento
    const podeAtualizar = req.user.level >= 10 || 
                         assinatura.obras_documentos.created_by === userId

    if (!podeAtualizar) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para atualizar este status'
      })
    }

    // Atualizar assinatura
    const { error: updateError } = await supabaseAdmin
      .from('obras_documento_assinaturas')
      .update({
        status: status,
        observacoes: observacoes || assinatura.observacoes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao atualizar status:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status',
        error: updateError.message
      })
    }

    // Registrar no histórico
    await supabaseAdmin
      .from('obras_documento_historico')
      .insert({
        documento_id: assinatura.documento_id,
        user_id: userId,
        acao: 'status_alterado',
        user_nome: req.user.nome || req.user.email,
        user_email: req.user.email,
        user_role: req.user.role,
        observacoes: `Status alterado para: ${status}${observacoes ? ` - ${observacoes}` : ''}`
      })

    res.json({
      success: true,
      message: 'Status atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * POST /api/assinaturas/:id/cancelar
 * Cancelar um documento (apenas criador)
 */
router.post('/:id/cancelar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { motivo } = req.body
    const userId = req.user.id

    // Buscar documento
    const { data: documento, error: documentoError } = await supabaseAdmin
      .from('obras_documentos')
      .select('*')
      .eq('id', id)
      .single()

    if (documentoError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Verificar se o usuário é o criador
    if (documento.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Apenas o criador pode cancelar o documento'
      })
    }

    // Atualizar documento
    await supabaseAdmin
      .from('obras_documentos')
      .update({
        status: 'rejeitado',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    // Registrar no histórico
    await supabaseAdmin
      .from('obras_documento_historico')
      .insert({
        documento_id: id,
        user_id: userId,
        acao: 'cancelou',
        user_nome: req.user.nome || req.user.email,
        user_email: req.user.email,
        user_role: req.user.role,
        observacoes: motivo || 'Documento cancelado'
      })

    res.json({
      success: true,
      message: 'Documento cancelado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao cancelar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

export default router

