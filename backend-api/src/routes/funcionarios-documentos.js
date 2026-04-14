/**
 * Rotas para gerenciamento de documentos de funcionários
 * Sistema de Gerenciamento de Gruas - Módulo RH
 * Gerencia: RG, CPF, CTPS, PIS, Título de Eleitor, Reservista, CNH, etc.
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'
import { checkPermission } from '../middleware/permissions.js'
import {
  adicionarAssinaturaPorAncorasOuFallback,
  normalizarTipoDocumentoParaRegraAssinatura
} from '../utils/pdf-signature.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(authenticateToken)

const sanitizeFileName = (fileName) => {
  return String(fileName || 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

function extrairCaminhoArquivosObras(arquivoUrl) {
  if (!arquivoUrl || typeof arquivoUrl !== 'string') return null
  const s = arquivoUrl.trim()
  if (/^blob:/i.test(s)) return null
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s)
      const pathname = decodeURIComponent(u.pathname)
      const needle = '/arquivos-obras/'
      const idx = pathname.indexOf(needle)
      if (idx === -1) return null
      const rest = pathname.slice(idx + needle.length).replace(/^\/+/, '')
      return rest || null
    } catch {
      return null
    }
  }
  return s.replace(/^\/+/, '') || null
}

async function baixarPdfBufferDeArquivoUrl(arquivoUrl) {
  const storagePath = extrairCaminhoArquivosObras(arquivoUrl)
  if (storagePath) {
    const { data, error } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .download(storagePath)
    if (!error && data) {
      return Buffer.from(await data.arrayBuffer())
    }
  }
  if (!/^https?:\/\//i.test(String(arquivoUrl))) {
    throw new Error('Caminho ou URL do PDF inválida')
  }
  const res = await fetch(arquivoUrl)
  if (!res.ok) {
    throw new Error(`Falha ao baixar PDF (${res.status})`)
  }
  return Buffer.from(await res.arrayBuffer())
}

// Schema de validação para documentos
const documentoSchema = Joi.object({
  funcionario_id: Joi.number().integer().positive().required(),
  tipo: Joi.string().valid(
    'rg', 'cpf', 'ctps', 'pis', 'pasep',
    'titulo_eleitor', 'certificado_reservista',
    'cnh', 'certificado_aso', 'certificado_nr',
    'comprovante_residencia', 'certidao_nascimento',
    'certidao_casamento', 'acordo_compensacao', 'contrato_experiencia_prorrogacao',
    'solicitacao_vale_transporte', 'termo_responsabilidade', 'ficha_entrega_epis', 'ficha_registro_empregado',
    'certificado_padrao', 'certificado_nr12', 'outros'
  ).required(),
  nome: Joi.string().min(2).max(255).required(),
  numero: Joi.string().min(1).max(100).required(),
  orgao_emissor: Joi.string().max(100).allow(null, '').optional(),
  data_emissao: Joi.date().allow(null).optional(),
  data_vencimento: Joi.date().allow(null).optional(),
  arquivo_url: Joi.string().uri().allow(null, '').optional(),
  observacoes: Joi.string().allow(null, '').optional()
})

// Schema para atualização (funcionario_id e tipo não podem ser alterados)
const documentoUpdateSchema = documentoSchema.fork(
  ['funcionario_id', 'tipo'],
  (schema) => schema.optional()
).append({
  id: Joi.number().integer().positive().required()
})

// ============== LISTAR DOCUMENTOS ==============

/**
 * GET /funcionarios/documentos
 * Listar documentos de funcionários
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      funcionario_id,
      tipo
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('funcionario_documentos')
      .select('*, funcionarios(nome, cpf)', { count: 'exact' })

    // Filtros
    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    // Paginação e ordenação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao listar documentos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar documentos',
      error: error.message
    })
  }
})

// ============== OBTER DOCUMENTO ==============

/**
 * GET /funcionarios/documentos/:id
 * Obter documento específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('funcionario_documentos')
      .select('*, funcionarios(nome, cpf, cargo)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Documento não encontrado'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao obter documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao obter documento',
      error: error.message
    })
  }
})

// ============== CRIAR DOCUMENTO ==============

/**
 * POST /funcionarios/documentos
 * Criar novo documento
 */
router.post('/', async (req, res) => {
  try {
    // Validação
    const { error: validationError, value } = documentoSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details.map(d => d.message)
      })
    }

    // Verificar se funcionário existe
    const { data: funcionario } = await supabaseAdmin
      .from('funcionarios')
      .select('id')
      .eq('id', value.funcionario_id)
      .single()

    if (!funcionario) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      })
    }

    // Inserir documento
    const { data, error } = await supabaseAdmin
      .from('funcionario_documentos')
      .insert(value)
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Documento criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar documento',
      error: error.message
    })
  }
})

// ============== ATUALIZAR DOCUMENTO ==============

/**
 * PUT /funcionarios/documentos/:id
 * Atualizar documento existente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validação
    const { error: validationError, value } = documentoUpdateSchema.validate({
      ...req.body,
      id: parseInt(id)
    })

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details.map(d => d.message)
      })
    }

    // Verificar se documento existe
    const { data: existing } = await supabaseAdmin
      .from('funcionario_documentos')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Remover campos que não podem ser atualizados
    const { id: _, funcionario_id, ...updateData } = value
    updateData.updated_at = new Date().toISOString()

    // Atualizar documento
    const { data, error } = await supabaseAdmin
      .from('funcionario_documentos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Documento atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar documento',
      error: error.message
    })
  }
})

// ============== EXCLUIR DOCUMENTO ==============

/**
 * DELETE /funcionarios/documentos/:id
 * Excluir documento
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se documento existe
    const { data: existing } = await supabaseAdmin
      .from('funcionario_documentos')
      .select('id, nome, tipo')
      .eq('id', id)
      .single()

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Excluir documento
    const { error } = await supabaseAdmin
      .from('funcionario_documentos')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: `Documento ${existing.nome} excluído com sucesso`
    })
  } catch (error) {
    console.error('Erro ao excluir documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir documento',
      error: error.message
    })
  }
})

// ============== LISTAR DOCUMENTOS POR FUNCIONÁRIO ==============

/**
 * GET /funcionarios/documentos/funcionario/:funcionario_id
 * Listar documentos admissionais / RH (`funcionario_documentos`).
 * Colaborador: apenas o próprio `funcionario_id`. Gestão: quem tem `funcionarios:visualizar`.
 */
router.get('/funcionario/:funcionario_id', async (req, res) => {
  try {
    const { funcionario_id } = req.params
    const fid = parseInt(funcionario_id, 10)
    if (Number.isNaN(fid) || fid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID do funcionário inválido'
      })
    }

    const meuFid = Number(req.user?.funcionario_id || 0)
    const role = req.user?.role
    const podeVerOutros = checkPermission(role, 'funcionarios:visualizar')
    if (meuFid !== fid && !podeVerOutros) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para listar estes documentos'
      })
    }

    // Verificar se funcionário existe
    const { data: funcionario } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome')
      .eq('id', fid)
      .single()

    if (!funcionario) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      })
    }

    // Buscar documentos
    const { data, error } = await supabaseAdmin
      .from('funcionario_documentos')
      .select('*')
      .eq('funcionario_id', fid)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      data,
      funcionario: funcionario.nome
    })
  } catch (error) {
    console.error('Erro ao listar documentos do funcionário:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar documentos do funcionário',
      error: error.message
    })
  }
})

/**
 * POST /funcionarios/documentos/:id/assinar-colaborador
 * Assinatura digital no PDF de documento RH (mesma lógica de âncoras do módulo de obras).
 */
router.post('/:id/assinar-colaborador', async (req, res) => {
  try {
    const docId = parseInt(req.params.id, 10)
    if (Number.isNaN(docId) || docId <= 0) {
      return res.status(400).json({ success: false, message: 'ID do documento inválido' })
    }

    const { assinatura, geoloc, observacoes } = req.body || {}
    if (!assinatura || typeof assinatura !== 'string') {
      return res.status(400).json({ success: false, message: 'Assinatura é obrigatória' })
    }

    const { data: documento, error: docError } = await supabaseAdmin
      .from('funcionario_documentos')
      .select('*')
      .eq('id', docId)
      .single()

    if (docError || !documento) {
      return res.status(404).json({ success: false, message: 'Documento não encontrado' })
    }

    const meuFid = Number(req.user?.funcionario_id || 0)
    if (meuFid !== Number(documento.funcionario_id)) {
      return res.status(403).json({
        success: false,
        message: 'Você não pode assinar este documento'
      })
    }

    const arquivoUrl = documento.arquivo_url
    if (!arquivoUrl || /^blob:/i.test(String(arquivoUrl).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Documento sem PDF válido no servidor. Peça ao RH para reenviar o arquivo.'
      })
    }

    let pdfBuffer
    try {
      pdfBuffer = await baixarPdfBufferDeArquivoUrl(arquivoUrl)
    } catch (e) {
      console.error('[RH assinar-colaborador] download PDF:', e)
      return res.status(500).json({
        success: false,
        message: e?.message || 'Erro ao baixar o PDF do documento'
      })
    }

    const arquivoOriginal = `${sanitizeFileName(documento.nome)}.pdf`
    const tipoRegra = normalizarTipoDocumentoParaRegraAssinatura(documento.tipo) || undefined
    let pdfComAssinatura
    try {
      pdfComAssinatura = await adicionarAssinaturaPorAncorasOuFallback(pdfBuffer, assinatura, {
        documento: {
          arquivo_original: arquivoOriginal,
          titulo: documento.nome,
          tipo_documento: tipoRegra,
          tipo_funcionario_documento: tipoRegra
        }
      })
    } catch (e) {
      console.error('[RH assinar-colaborador] PDF assinatura:', e)
      return res.status(500).json({
        success: false,
        message: 'Erro ao aplicar assinatura no PDF',
        error: e.message
      })
    }

    const ts = Date.now()
    const filePath = `assinados-rh-funcionario/${documento.funcionario_id}/${docId}/assinado_${ts}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .upload(filePath, pdfComAssinatura, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('[RH assinar-colaborador] upload:', uploadError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao gravar PDF assinado',
        error: uploadError.message
      })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('arquivos-obras')
      .getPublicUrl(filePath)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      return res.status(500).json({ success: false, message: 'Erro ao gerar URL pública do PDF' })
    }

    const obsExtra = [
      observacoes,
      geoloc ? `Localização: ${geoloc}` : null,
      `Assinado pelo colaborador em ${new Date().toISOString()}`
    ].filter(Boolean).join(' | ')

    const observacoesNovas = [documento.observacoes, obsExtra].filter(Boolean).join('\n')

    const { data: atualizado, error: upDocError } = await supabaseAdmin
      .from('funcionario_documentos')
      .update({
        arquivo_url: publicUrl,
        observacoes: observacoesNovas,
        updated_at: new Date().toISOString()
      })
      .eq('id', docId)
      .select()
      .single()

    if (upDocError) {
      console.error('[RH assinar-colaborador] update doc:', upDocError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar documento após assinatura',
        error: upDocError.message
      })
    }

    res.json({
      success: true,
      message: 'Documento assinado com sucesso',
      data: atualizado
    })
  } catch (error) {
    console.error('Erro em assinar-colaborador:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

export default router

