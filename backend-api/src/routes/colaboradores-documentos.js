/**
 * Rotas para gerenciamento de documentos e certificados de colaboradores
 * Sistema de Gerenciamento de Gruas - Módulo RH
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'
import { checkPermission } from '../middleware/permissions.js'
import {
  baixarEAdicionarAssinatura,
  adicionarAssinaturaEmTodasPaginas,
  adicionarAssinaturaPorAncorasOuFallback
} from '../utils/pdf-signature.js'
import { tipoAdmissionalParaTipoDocumentoAssinatura } from '../utils/tipo-admissional-assinatura.js'
import { certificadoTipoParaTipoDocumentoAssinatura } from '../utils/certificado-tipo-assinatura.js'

const router = express.Router()

/**
 * Obtém o path dentro do bucket a partir de caminho relativo ou URL do Supabase.
 */
function resolveArquivosObrasStoragePath(urlOrPath) {
  const raw = String(urlOrPath || '').trim()
  if (!raw) return null
  if (/^blob:/i.test(raw)) return null
  if (!/^https?:\/\//i.test(raw)) {
    const p = raw.replace(/^\/+/, '')
    return p || null
  }
  try {
    const u = new URL(raw)
    let pathname = u.pathname
    try {
      pathname = decodeURIComponent(u.pathname)
    } catch {
      /* path já decodificado ou inválido para decode */
    }
    const needle = '/arquivos-obras/'
    const idx = pathname.indexOf(needle)
    if (idx !== -1) {
      const rest = pathname.slice(idx + needle.length)
      return rest || null
    }
  } catch (_) {
    /* URL inválida */
  }
  return null
}

/**
 * Baixa bytes do bucket arquivos-obras usando o client admin (bucket privado).
 * Caminho relativo (ex.: geral/arq.pdf) ou URL Supabase contendo /arquivos-obras/.
 * Nunca chama fetch() com caminho relativo (isso gera "fetch failed" no Node).
 */
async function downloadArquivosObrasBuffer(urlOrPath) {
  const raw = String(urlOrPath || '').trim()
  if (!raw) {
    throw new Error('Caminho do arquivo vazio')
  }
  if (/^blob:/i.test(raw)) {
    throw new Error(
      'Este documento foi gravado com URL temporária do navegador (blob), que não existe no storage. Edite o documento no RH e envie o arquivo novamente.'
    )
  }

  const storagePath = resolveArquivosObrasStoragePath(raw)

  if (storagePath) {
    const { data, error } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .download(storagePath)

    if (!error && data) {
      return Buffer.from(await data.arrayBuffer())
    }

    const msg = error?.message || String(error || 'download falhou')
    throw new Error(`Storage (${storagePath.slice(0, 96)}): ${msg}`)
  }

  if (/^https?:\/\//i.test(raw)) {
    const res = await fetch(raw)
    if (!res.ok) {
      throw new Error(`Download HTTP ${res.status}`)
    }
    return Buffer.from(await res.arrayBuffer())
  }

  throw new Error(
    'Referência de arquivo inválida (esperado caminho no bucket ou URL do Supabase com /arquivos-obras/)'
  )
}

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// ==================== CERTIFICADOS ====================

/**
 * POST /api/colaboradores/:id/certificados
 * Criar certificado para colaborador
 * 
 * Permite que:
 * - Usuários com permissão rh:editar criem certificados para qualquer funcionário
 * - Operadores criem certificados apenas para si mesmos
 */
router.post('/:id/certificados', async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, nome, data_validade, arquivo } = req.body
    const userRole = req.user?.role
    const userFuncionarioId = req.user?.funcionario_id

    // Verificar permissões: rh:editar OU criar para si mesmo
    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const funcionarioId = parseInt(id, 10)
    
    // Garantir que ambos sejam números para comparação correta
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const isCreatingForSelf = userFuncionarioIdNum !== null && 
                              !isNaN(funcionarioId) && 
                              funcionarioId === userFuncionarioIdNum

    if (!hasRHEditPermission && !isCreatingForSelf) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para criar certificados para outros funcionários. Você só pode criar certificados para si mesmo.',
        required: 'rh:editar ou criar para si mesmo',
        userRole: userRole || 'Desconhecido',
        debug: process.env.NODE_ENV === 'development' ? {
          userFuncionarioId: userFuncionarioIdNum,
          targetFuncionarioId: funcionarioId,
          isCreatingForSelf
        } : undefined
      })
    }

    const schema = Joi.object({
      tipo: Joi.string().required(),
      nome: Joi.string().min(2).required(),
      data_validade: Joi.date().allow(null).optional(),
      arquivo: Joi.string().allow(null, '').optional()
    })

    const { error: validationError } = schema.validate({ tipo, nome, data_validade, arquivo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data, error } = await supabaseAdmin
      .from('certificados_colaboradores')
      .insert({
        funcionario_id: funcionarioId,
        tipo,
        nome,
        data_validade,
        arquivo
      })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar certificado:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/colaboradores/:id/certificados
 * Listar certificados do colaborador
 */
router.get('/:id/certificados', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('certificados_colaboradores')
      .select('*')
      .eq('funcionario_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar certificados:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/certificados/:id
 * Atualizar certificado
 */
router.put('/certificados/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, nome, data_validade, arquivo } = req.body

    // Validar que o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        error: 'ID inválido', 
        message: 'O ID do certificado deve ser um UUID válido' 
      })
    }

    const schema = Joi.object({
      tipo: Joi.string().optional(),
      nome: Joi.string().min(2).optional(),
      data_validade: Joi.date().allow(null).optional(),
      arquivo: Joi.string().allow(null, '').optional()
    })

    const { error: validationError } = schema.validate({ tipo, nome, data_validade, arquivo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const updateData = {}
    if (tipo !== undefined) updateData.tipo = tipo
    if (nome !== undefined) updateData.nome = nome
    if (data_validade !== undefined) updateData.data_validade = data_validade
    if (arquivo !== undefined) updateData.arquivo = arquivo

    const { data, error } = await supabaseAdmin
      .from('certificados_colaboradores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar certificado:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * DELETE /api/certificados/:id
 * Excluir certificado
 */
router.delete('/certificados/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params

    // Validar que o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        error: 'ID inválido', 
        message: 'O ID do certificado deve ser um UUID válido' 
      })
    }

    const { error } = await supabaseAdmin
      .from('certificados_colaboradores')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Certificado excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir certificado:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/certificados/vencendo
 * Listar certificados vencendo em até 30 dias
 */
router.get('/certificados/vencendo', async (req, res) => {
  try {
    const hoje = new Date()
    const limite = new Date()
    limite.setDate(hoje.getDate() + 30)

    const { data, error } = await supabaseAdmin
      .from('certificados_colaboradores')
      .select(`
        *,
        funcionarios(id, nome, cargo)
      `)
      .not('data_validade', 'is', null)
      .gte('data_validade', hoje.toISOString().split('T')[0])
      .lte('data_validade', limite.toISOString().split('T')[0])
      .eq('alerta_enviado', false)
      .order('data_validade', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar certificados vencendo:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/certificados/:id/assinatura
 * Adicionar assinatura digital ao certificado
 */
router.put('/certificados/:id/assinatura', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { assinatura_digital } = req.body
    const userId = req.user.id
    const userRole = req.user?.role
    const userFuncionarioId = req.user?.funcionario_id

    const schema = Joi.object({
      assinatura_digital: Joi.string().required()
    })
    const { error: validationError } = schema.validate({ assinatura_digital })
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.details[0].message
      })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido',
        message: 'O ID do certificado deve ser um UUID válido'
      })
    }

    const { data: certificado, error: certificadoError } = await supabaseAdmin
      .from('certificados_colaboradores')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (certificadoError || !certificado) {
      return res.status(404).json({
        success: false,
        message: 'Certificado não encontrado'
      })
    }

    if (certificado.assinatura_digital && certificado.assinado_em) {
      return res.status(400).json({
        success: false,
        message: 'Este certificado já foi assinado.',
        data: { assinado_em: certificado.assinado_em }
      })
    }

    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const certFuncionarioId = Number(certificado.funcionario_id)
    const isSigningOwn =
      userFuncionarioIdNum !== null &&
      !Number.isNaN(certFuncionarioId) &&
      userFuncionarioIdNum === certFuncionarioId

    if (!hasRHEditPermission && !isSigningOwn) {
      return res.status(403).json({
        success: false,
        message: 'Você só pode assinar seus próprios certificados.',
        required: 'rh:editar ou ser o funcionário dono do certificado'
      })
    }

    const { data: updatedCertificado, error: updateError } = await supabaseAdmin
      .from('certificados_colaboradores')
      .update({
        assinatura_digital,
        assinado_por: userId,
        assinado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({
      success: true,
      message: 'Certificado assinado com sucesso',
      data: updatedCertificado
    })
  } catch (error) {
    console.error('Erro ao assinar certificado:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * GET /api/certificados/:id/download
 * Download do certificado (com opção de incluir assinatura)
 */
router.get('/certificados/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { comAssinatura } = req.query

    // Validar que o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'ID inválido', 
        message: 'O ID do certificado deve ser um UUID válido' 
      })
    }

    // Buscar certificado
    const { data: certificado, error: certificadoError } = await supabaseAdmin
      .from('certificados_colaboradores')
      .select('*')
      .eq('id', id)
      .single()

    if (certificadoError || !certificado) {
      return res.status(404).json({
        success: false,
        message: 'Certificado não encontrado'
      })
    }

    if (!certificado.arquivo) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo do certificado não encontrado'
      })
    }

    const userRole = req.user?.role
    const userFuncionarioId = req.user?.funcionario_id
    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const certFuncionarioId = Number(certificado.funcionario_id)
    const canAccess =
      hasRHEditPermission ||
      (userFuncionarioIdNum !== null &&
        !Number.isNaN(certFuncionarioId) &&
        userFuncionarioIdNum === certFuncionarioId)

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para baixar este certificado'
      })
    }

    // Obter URL do arquivo
    let arquivoUrl = certificado.arquivo

    // Se não for URL completa, tentar obter do Supabase Storage
    if (!arquivoUrl.startsWith('http')) {
      try {
        const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
          .from('arquivos-obras')
          .createSignedUrl(arquivoUrl, 3600)

        if (!urlError && signedUrl) {
          arquivoUrl = signedUrl.signedUrl
        } else {
          // Fallback: tentar URL pública
          const supabaseUrl = process.env.SUPABASE_URL || ''
          if (supabaseUrl) {
            arquivoUrl = `${supabaseUrl}/storage/v1/object/public/arquivos-obras/${arquivoUrl}`
          }
        }
      } catch (urlErr) {
        console.error('Erro ao obter URL do arquivo:', urlErr)
      }
    }

    // Baixar o PDF
    const fileResponse = await fetch(arquivoUrl)
    
    if (!fileResponse.ok) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado',
        error: 'O arquivo do certificado não pôde ser baixado'
      })
    }

    let pdfBuffer = Buffer.from(await fileResponse.arrayBuffer())

    if ((comAssinatura === 'true' || comAssinatura === '1') && certificado.assinatura_digital) {
      try {
        const arquivoNome =
          String(certificado.arquivo || '')
            .split('/')
            .pop()
            .split('?')[0] || 'certificado.pdf'
        const tituloCert = [certificado.tipo, certificado.nome].filter(Boolean).join(' — ')
        const tipoDocCert = certificadoTipoParaTipoDocumentoAssinatura(certificado.tipo)
        pdfBuffer = await adicionarAssinaturaPorAncorasOuFallback(pdfBuffer, certificado.assinatura_digital, {
          documento: {
            arquivo_original: arquivoNome,
            titulo: tituloCert,
            tipo_documento: tipoDocCert
          },
          opacity: 1.0
        })
      } catch (signatureError) {
        console.error('[CERTIFICADO] Erro ao compor assinatura no PDF:', signatureError)
      }
    }

    // Gerar nome do arquivo
    const nomeArquivo = `certificado_${certificado.tipo}_${certificado.nome}${certificado.assinatura_digital ? '_assinado' : ''}.pdf`
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Sanitizar nome do arquivo

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Erro ao fazer download do certificado:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

// ==================== DOCUMENTOS ADMISSIONAIS ====================

/**
 * POST /api/colaboradores/:id/documentos-admissionais
 * Criar documento admissional para colaborador
 * 
 * Permite que:
 * - Usuários com permissão rh:editar criem documentos admissionais para qualquer funcionário
 * - Operadores criem documentos admissionais apenas para si mesmos
 */
router.post('/:id/documentos-admissionais', async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, data_validade, arquivo } = req.body
    const userRole = req.user?.role
    const userFuncionarioId = req.user?.funcionario_id

    // Verificar permissões: rh:editar OU criar para si mesmo
    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const funcionarioId = parseInt(id, 10)
    
    // Garantir que ambos sejam números para comparação correta
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const isCreatingForSelf = userFuncionarioIdNum !== null && 
                              !isNaN(funcionarioId) && 
                              funcionarioId === userFuncionarioIdNum

    if (!hasRHEditPermission && !isCreatingForSelf) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para criar documentos admissionais para outros funcionários. Você só pode criar documentos admissionais para si mesmo.',
        required: 'rh:editar ou criar para si mesmo',
        userRole: userRole || 'Desconhecido',
        debug: process.env.NODE_ENV === 'development' ? {
          userFuncionarioId: userFuncionarioIdNum,
          targetFuncionarioId: funcionarioId,
          isCreatingForSelf
        } : undefined
      })
    }

    const schema = Joi.object({
      tipo: Joi.string().required(),
      data_validade: Joi.date().allow(null).optional(),
      arquivo: Joi.string().required()
    })

    const { error: validationError } = schema.validate({ tipo, data_validade, arquivo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data, error } = await supabaseAdmin
      .from('documentos_admissionais')
      .insert({
        funcionario_id: funcionarioId,
        tipo,
        data_validade,
        arquivo
      })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar documento admissional:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/colaboradores/:id/documentos-admissionais
 * Listar documentos admissionais do colaborador
 */
router.get('/:id/documentos-admissionais', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('documentos_admissionais')
      .select('*')
      .eq('funcionario_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar documentos admissionais:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/colaboradores/documentos-admissionais/:id/assinatura
 * Colaborador assina o próprio documento admissional (ou RH com permissão).
 */
router.put('/documentos-admissionais/:id/assinatura', async (req, res) => {
  try {
    const { id } = req.params
    const { assinatura_digital } = req.body
    const userId = req.user.id
    const userRole = req.user?.role
    const userFuncionarioId = req.user?.funcionario_id

    const schema = Joi.object({
      assinatura_digital: Joi.string().required()
    })

    const { error: validationError } = schema.validate({ assinatura_digital })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const idLimpo = String(id || '').trim()
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documentos_admissionais')
      .select('*')
      .eq('id', idLimpo)
      .maybeSingle()

    if (docError) {
      console.error('[documentos-admissionais/assinatura] Erro ao buscar documento:', docError)
      const hint =
        docError.message?.includes('assinatura_digital') || docError.message?.includes('assinado')
          ? 'Execute a migration que adiciona assinatura_digital/assinado_em/assinado_por em documentos_admissionais.'
          : ''
      return res.status(500).json({
        error: 'Erro ao buscar documento',
        message: docError.message || 'Falha na consulta',
        ...(hint ? { hint } : {})
      })
    }

    if (!doc) {
      return res.status(404).json({
        error: 'Documento não encontrado',
        message: 'O documento admissional não foi encontrado'
      })
    }

    if (doc.assinatura_digital && doc.assinado_em) {
      return res.status(400).json({
        error: 'Documento já assinado',
        message: 'Este documento já foi assinado.',
        data: { assinado_em: doc.assinado_em }
      })
    }

    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const docFuncionarioId = Number(doc.funcionario_id)
    const isSigningOwn =
      userFuncionarioIdNum !== null &&
      !Number.isNaN(docFuncionarioId) &&
      userFuncionarioIdNum === docFuncionarioId

    if (!hasRHEditPermission && !isSigningOwn) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você só pode assinar seus próprios documentos admissionais.',
        required: 'rh:editar ou ser o funcionário dono do documento'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('documentos_admissionais')
      .update({
        assinatura_digital,
        assinado_em: new Date().toISOString(),
        assinado_por: userId
      })
      .eq('id', idLimpo)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao assinar documento admissional:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/colaboradores/documentos-admissionais/:id/download
 * Query: comAssinatura=true para embutir assinatura no PDF
 */
router.get('/documentos-admissionais/:id/download', async (req, res) => {
  try {
    const { id } = req.params
    const { comAssinatura } = req.query
    const userRole = req.user?.role
    const userFuncionarioId = req.user?.funcionario_id

    const idLimpoDl = String(id || '').trim()
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documentos_admissionais')
      .select('*')
      .eq('id', idLimpoDl)
      .maybeSingle()

    if (docError) {
      console.error('[documentos-admissionais/download] Erro ao buscar documento:', docError)
      return res.status(500).json({
        success: false,
        message: docError.message || 'Erro ao buscar documento'
      })
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Documento não encontrado' })
    }

    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const docFuncionarioId = Number(doc.funcionario_id)
    const canAccess =
      hasRHEditPermission ||
      (userFuncionarioIdNum !== null &&
        !Number.isNaN(docFuncionarioId) &&
        userFuncionarioIdNum === docFuncionarioId)

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para baixar este documento'
      })
    }

    if (!doc.arquivo) {
      return res.status(404).json({ success: false, message: 'Arquivo não encontrado' })
    }

    let pdfBuffer
    try {
      pdfBuffer = await downloadArquivosObrasBuffer(doc.arquivo)
    } catch (dlErr) {
      console.error('[documentos-admissionais/download] Falha ao obter bytes:', dlErr)
      return res.status(502).json({
        success: false,
        message: 'Arquivo não pôde ser baixado',
        details: process.env.NODE_ENV === 'development' ? String(dlErr?.message || dlErr) : undefined
      })
    }

    if ((comAssinatura === 'true' || comAssinatura === '1') && doc.assinatura_digital) {
      try {
        const tipoDoc = tipoAdmissionalParaTipoDocumentoAssinatura(doc.tipo)
        const arquivoNome =
          String(doc.arquivo || '')
            .split('/')
            .pop()
            .split('?')[0] || 'documento.pdf'
        pdfBuffer = await adicionarAssinaturaPorAncorasOuFallback(pdfBuffer, doc.assinatura_digital, {
          documento: {
            arquivo_original: arquivoNome,
            titulo: doc.tipo || '',
            ...(tipoDoc ? { tipo_documento: tipoDoc } : {})
          },
          opacity: 1.0
        })
      } catch (signatureError) {
        console.error('Erro ao compor assinatura no PDF (admissional):', signatureError)
      }
    }

    const nomeArquivo = `admissional_${String(doc.tipo || 'doc').replace(/[^a-zA-Z0-9._-]/g, '_')}${doc.assinatura_digital ? '_assinado' : ''}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Erro ao baixar documento admissional:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * PUT /api/documentos-admissionais/:id
 * Atualizar documento admissional
 */
router.put('/documentos-admissionais/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, data_validade, arquivo } = req.body

    const updateData = {}
    if (tipo !== undefined) updateData.tipo = tipo
    if (data_validade !== undefined) updateData.data_validade = data_validade
    if (arquivo !== undefined) updateData.arquivo = arquivo

    const { data, error } = await supabaseAdmin
      .from('documentos_admissionais')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar documento admissional:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * DELETE /api/documentos-admissionais/:id
 * Excluir documento admissional
 */
router.delete('/documentos-admissionais/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('documentos_admissionais')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Documento admissional excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir documento admissional:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/documentos-admissionais/vencendo
 * Listar documentos admissionais vencendo em até 30 dias
 */
router.get('/documentos-admissionais/vencendo', async (req, res) => {
  try {
    const hoje = new Date()
    const limite = new Date()
    limite.setDate(hoje.getDate() + 30)

    const { data, error } = await supabaseAdmin
      .from('documentos_admissionais')
      .select(`
        *,
        funcionarios(id, nome, cargo)
      `)
      .not('data_validade', 'is', null)
      .gte('data_validade', hoje.toISOString().split('T')[0])
      .lte('data_validade', limite.toISOString().split('T')[0])
      .eq('alerta_enviado', false)
      .order('data_validade', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar documentos admissionais vencendo:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== DOCUMENTOS DE DEMISSÃO ====================

/**
 * POST /api/colaboradores/:id/documentos-demissao
 */
router.post('/:id/documentos-demissao', async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, data_validade, arquivo } = req.body
    const userRole = req.user?.role
    const userFuncionarioId = req.user?.funcionario_id

    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const funcionarioId = parseInt(id, 10)
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const isCreatingForSelf =
      userFuncionarioIdNum !== null &&
      !isNaN(funcionarioId) &&
      funcionarioId === userFuncionarioIdNum

    if (!hasRHEditPermission && !isCreatingForSelf) {
      return res.status(403).json({
        error: 'Acesso negado',
        message:
          'Sem permissão para criar documentos de demissão para outro funcionário.',
        required: 'rh:editar ou criar para si mesmo'
      })
    }

    const schema = Joi.object({
      tipo: Joi.string().required(),
      data_validade: Joi.date().allow(null).optional(),
      arquivo: Joi.string().required()
    })

    const { error: validationError } = schema.validate({ tipo, data_validade, arquivo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data, error } = await supabaseAdmin
      .from('documentos_demissao')
      .insert({
        funcionario_id: funcionarioId,
        tipo,
        data_validade,
        arquivo
      })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar documento de demissão:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/colaboradores/:id/documentos-demissao
 */
router.get('/:id/documentos-demissao', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('documentos_demissao')
      .select('*')
      .eq('funcionario_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar documentos de demissão:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/colaboradores/documentos-demissao/:id/assinatura
 */
router.put('/documentos-demissao/:id/assinatura', async (req, res) => {
  try {
    const { id } = req.params
    const { assinatura_digital } = req.body
    const userId = req.user.id
    const userRole = req.user?.role
    const userFuncionarioId = req.user?.funcionario_id

    const schema = Joi.object({
      assinatura_digital: Joi.string().required()
    })

    const { error: validationError } = schema.validate({ assinatura_digital })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const idLimpo = String(id || '').trim()
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documentos_demissao')
      .select('*')
      .eq('id', idLimpo)
      .maybeSingle()

    if (docError) {
      console.error('[documentos-demissao/assinatura] Erro ao buscar documento:', docError)
      return res.status(500).json({
        error: 'Erro ao buscar documento',
        message: docError.message || 'Falha na consulta'
      })
    }

    if (!doc) {
      return res.status(404).json({
        error: 'Documento não encontrado',
        message: 'O documento não foi encontrado'
      })
    }

    if (doc.assinatura_digital && doc.assinado_em) {
      return res.status(400).json({
        error: 'Documento já assinado',
        message: 'Este documento já foi assinado.',
        data: { assinado_em: doc.assinado_em }
      })
    }

    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const docFuncionarioId = Number(doc.funcionario_id)
    const isSigningOwn =
      userFuncionarioIdNum !== null &&
      !Number.isNaN(docFuncionarioId) &&
      userFuncionarioIdNum === docFuncionarioId

    if (!hasRHEditPermission && !isSigningOwn) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você só pode assinar seus próprios documentos.',
        required: 'rh:editar ou ser o funcionário dono do documento'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('documentos_demissao')
      .update({
        assinatura_digital,
        assinado_em: new Date().toISOString(),
        assinado_por: userId
      })
      .eq('id', idLimpo)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao assinar documento de demissão:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/colaboradores/documentos-demissao/:id/download
 */
router.get('/documentos-demissao/:id/download', async (req, res) => {
  try {
    const { id } = req.params
    const { comAssinatura } = req.query
    const userRole = req.user?.role
    const userFuncionarioId = req.user?.funcionario_id

    const idLimpoDl = String(id || '').trim()
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documentos_demissao')
      .select('*')
      .eq('id', idLimpoDl)
      .maybeSingle()

    if (docError) {
      return res.status(500).json({
        success: false,
        message: docError.message || 'Erro ao buscar documento'
      })
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Documento não encontrado' })
    }

    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const docFuncionarioId = Number(doc.funcionario_id)
    const canAccess =
      hasRHEditPermission ||
      (userFuncionarioIdNum !== null &&
        !Number.isNaN(docFuncionarioId) &&
        userFuncionarioIdNum === docFuncionarioId)

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para baixar este documento'
      })
    }

    if (!doc.arquivo) {
      return res.status(404).json({ success: false, message: 'Arquivo não encontrado' })
    }

    let pdfBuffer
    try {
      pdfBuffer = await downloadArquivosObrasBuffer(doc.arquivo)
    } catch (dlErr) {
      console.error('[documentos-demissao/download] Falha ao obter bytes:', dlErr)
      return res.status(502).json({
        success: false,
        message: 'Arquivo não pôde ser baixado',
        details: process.env.NODE_ENV === 'development' ? String(dlErr?.message || dlErr) : undefined
      })
    }

    if ((comAssinatura === 'true' || comAssinatura === '1') && doc.assinatura_digital) {
      try {
        pdfBuffer = await adicionarAssinaturaEmTodasPaginas(pdfBuffer, doc.assinatura_digital, {
          horizontalAlign: 'left',
          marginLeft: 56,
          marginBottom: 52,
          height: 88,
          pages: 'last',
          opacity: 1.0
        })
      } catch (signatureError) {
        console.error('Erro ao compor assinatura no PDF (demissão):', signatureError)
      }
    }

    const nomeArquivo = `demissao_${String(doc.tipo || 'doc').replace(/[^a-zA-Z0-9._-]/g, '_')}${doc.assinatura_digital ? '_assinado' : ''}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Erro ao baixar documento de demissão:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * PUT /api/colaboradores/documentos-demissao/:id
 */
router.put('/documentos-demissao/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, data_validade, arquivo } = req.body

    const updateData = {}
    if (tipo !== undefined) updateData.tipo = tipo
    if (data_validade !== undefined) updateData.data_validade = data_validade
    if (arquivo !== undefined) updateData.arquivo = arquivo

    const { data, error } = await supabaseAdmin
      .from('documentos_demissao')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar documento de demissão:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * DELETE /api/colaboradores/documentos-demissao/:id
 */
router.delete('/documentos-demissao/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin.from('documentos_demissao').delete().eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Documento excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir documento de demissão:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== HOLERITES ====================

/**
 * POST /api/colaboradores/:id/holerites
 * Upload de holerite para colaborador
 */
router.post('/:id/holerites', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { mes_referencia, arquivo } = req.body

    const schema = Joi.object({
      mes_referencia: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
      arquivo: Joi.string().required()
    })

    const { error: validationError } = schema.validate({ mes_referencia, arquivo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Verificar se já existe holerite para este mês
    const { data: existing } = await supabaseAdmin
      .from('holerites')
      .select('id')
      .eq('funcionario_id', id)
      .eq('mes_referencia', mes_referencia)
      .single()

    let result
    if (existing) {
      // Atualizar existente
      const { data, error } = await supabaseAdmin
        .from('holerites')
        .update({ arquivo })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Criar novo
      const { data, error } = await supabaseAdmin
        .from('holerites')
        .insert({
          funcionario_id: parseInt(id),
          mes_referencia,
          arquivo
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Erro ao salvar holerite:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/colaboradores/:id/holerites
 * Listar holerites do colaborador
 */
router.get('/:id/holerites', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('holerites')
      .select('*')
      .eq('funcionario_id', id)
      .order('mes_referencia', { ascending: false })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar holerites:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/holerites/:id/assinatura
 * Adicionar assinatura digital ao holerite
 * 
 * Permite que:
 * - Usuários com permissão rh:editar assinem holerites de qualquer funcionário
 * - Funcionários assinem seus próprios holerites
 */
router.put('/holerites/:id/assinatura', async (req, res) => {
  try {
    const { id } = req.params
    const { assinatura_digital } = req.body
    const userId = req.user.id
    const userRole = req.user?.role
    const userFuncionarioId = req.user?.funcionario_id

    const schema = Joi.object({
      assinatura_digital: Joi.string().required()
    })

    const { error: validationError } = schema.validate({ assinatura_digital })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Buscar holerite para verificar funcionário
    const { data: holerite, error: holeriteError } = await supabaseAdmin
      .from('holerites')
      .select('funcionario_id, assinatura_digital, assinado_em')
      .eq('id', id)
      .single()

    if (holeriteError || !holerite) {
      return res.status(404).json({ 
        error: 'Holerite não encontrado',
        message: 'O holerite especificado não foi encontrado'
      })
    }

    // Verificar se já está assinado
    if (holerite.assinatura_digital && holerite.assinado_em) {
      return res.status(400).json({
        error: 'Holerite já assinado',
        message: 'Este holerite já foi assinado. Não é possível re-assinar.',
        data: {
          assinado_em: holerite.assinado_em
        }
      })
    }

    // Verificar permissões: rh:editar OU assinar próprio holerite
    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const holeriteFuncionarioId = Number(holerite.funcionario_id)
    const isSigningOwnHolerite = userFuncionarioIdNum !== null && 
                                 !isNaN(holeriteFuncionarioId) && 
                                 userFuncionarioIdNum === holeriteFuncionarioId

    if (!hasRHEditPermission && !isSigningOwnHolerite) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para assinar este holerite. Você só pode assinar seus próprios holerites.',
        required: 'rh:editar ou ser o funcionário dono do holerite',
        userRole: userRole || 'Desconhecido',
        debug: process.env.NODE_ENV === 'development' ? {
          userFuncionarioId: userFuncionarioIdNum,
          holeriteFuncionarioId: holeriteFuncionarioId,
          isSigningOwnHolerite
        } : undefined
      })
    }

    // Atualizar holerite com assinatura
    // A aprovação é automática quando o holerite está assinado (por trás dos panos)
    const { data, error } = await supabaseAdmin
      .from('holerites')
      .update({
        assinatura_digital,
        assinado_em: new Date().toISOString(),
        assinado_por: userId
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Aprovação automática: quando um holerite é assinado, ele é considerado aprovado automaticamente
    // Não há necessidade de um botão separado de aprovação - a assinatura já implica aprovação
    console.log(`[HOLERITES] Holerite ${id} assinado e aprovado automaticamente por usuário ${userId}`)

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao assinar holerite:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * DELETE /api/holerites/:id
 * Excluir holerite
 */
router.delete('/holerites/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('holerites')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Holerite excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir holerite:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/holerites/:id/download
 * Download do holerite
 * Query params:
 *   - comAssinatura=true: Adiciona a assinatura no PDF antes de baixar
 */
router.get('/holerites/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { comAssinatura } = req.query

    // Buscar holerite
    const { data: holerite, error: holeriteError } = await supabaseAdmin
      .from('holerites')
      .select('*')
      .eq('id', id)
      .single()

    if (holeriteError || !holerite) {
      return res.status(404).json({
        success: false,
        message: 'Holerite não encontrado'
      })
    }

    if (!holerite.arquivo) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo do holerite não encontrado'
      })
    }

    // Obter URL do arquivo
    let arquivoUrl = holerite.arquivo

    // Se não for URL completa, tentar obter do Supabase Storage
    if (!arquivoUrl.startsWith('http')) {
      try {
        const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
          .from('arquivos-obras')
          .createSignedUrl(arquivoUrl, 3600)

        if (!urlError && signedUrl) {
          arquivoUrl = signedUrl.signedUrl
        } else {
          // Fallback: tentar URL pública
          const supabaseUrl = process.env.SUPABASE_URL || ''
          if (supabaseUrl) {
            arquivoUrl = `${supabaseUrl}/storage/v1/object/public/arquivos-obras/${arquivoUrl}`
          }
        }
      } catch (urlErr) {
        console.error('Erro ao obter URL do arquivo:', urlErr)
      }
    }

    // Baixar o PDF
    const fileResponse = await fetch(arquivoUrl)
    
    if (!fileResponse.ok) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado',
        error: 'O arquivo do holerite não pôde ser baixado'
      })
    }

    let pdfBuffer = Buffer.from(await fileResponse.arrayBuffer())

    // Se comAssinatura=true e holerite tem assinatura, compor no PDF (última página, rodapé esquerdo)
    if ((comAssinatura === 'true' || comAssinatura === '1') && holerite.assinatura_digital) {
      try {
        console.log('📥 [HOLERITE] Compondo assinatura no PDF (padrão holerite)...')
        pdfBuffer = await adicionarAssinaturaEmTodasPaginas(pdfBuffer, holerite.assinatura_digital, {
          // Padrão holerite: canto inferior esquerdo, acima do rótulo/linha "Assinatura", só na última página
          horizontalAlign: 'left',
          marginLeft: 56,
          marginBottom: 52,
          height: 88,
          pages: 'last',
          opacity: 1.0
        })
        console.log('✅ [HOLERITE] Assinatura composta no PDF')
      } catch (signatureError) {
        console.error('❌ [HOLERITE] Erro ao adicionar assinatura no PDF:', signatureError)
        // Continuar mesmo se houver erro - retornar PDF original
      }
    }

    // Gerar nome do arquivo
    const nomeArquivo = `holerite_${holerite.mes_referencia}${holerite.assinatura_digital ? '_assinado' : ''}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Erro ao fazer download do holerite:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

export default router

