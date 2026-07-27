/**
 * Rotas para gerenciamento de remuneração
 * Sistema de Gerenciamento de Gruas - Módulo RH
 * Gerencia: Folha de Pagamento, Descontos, Benefícios
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'
import { checkPermission } from '../middleware/permissions.js'
import { adicionarAssinaturaPorAncorasOuFallback } from '../utils/pdf-signature.js'
import {
  isBeneficioDocumental,
  beneficioTipoParaTipoDocumentoAssinatura
} from '../utils/beneficio-documental.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(authenticateToken)

function mesReferenciaParaDataInicio(mesReferencia) {
  const m = String(mesReferencia || '').trim()
  if (!/^\d{4}-\d{2}$/.test(m)) return null
  return `${m}-01`
}

async function baixarArquivoBeneficioBuffer(urlOrPath) {
  const raw = String(urlOrPath || '').trim()
  if (!raw) throw new Error('Caminho do arquivo vazio')
  if (/^blob:/i.test(raw)) {
    throw new Error('URL temporária (blob) inválida. Envie o PDF novamente no RH.')
  }

  let storagePath = null
  if (!/^https?:\/\//i.test(raw)) {
    storagePath = raw.replace(/^\/+/, '')
  } else {
    try {
      const u = new URL(raw)
      const needle = '/arquivos-obras/'
      const idx = u.pathname.indexOf(needle)
      if (idx !== -1) storagePath = decodeURIComponent(u.pathname.slice(idx + needle.length))
    } catch {
      /* ignore */
    }
  }

  if (storagePath) {
    const { data, error } = await supabaseAdmin.storage.from('arquivos-obras').download(storagePath)
    if (!error && data) return Buffer.from(await data.arrayBuffer())
  }

  if (/^https?:\/\//i.test(raw)) {
    const resp = await fetch(raw)
    if (!resp.ok) throw new Error(`Falha ao baixar arquivo (${resp.status})`)
    return Buffer.from(await resp.arrayBuffer())
  }

  throw new Error('Arquivo não encontrado no storage')
}

// ============== FOLHA DE PAGAMENTO ==============

/**
 * GET /api/remuneracao/folha-pagamento
 * Listar folhas de pagamento
 */
router.get('/folha-pagamento', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      funcionario_id,
      mes,
      status
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('folha_pagamento')
      .select('*, funcionarios(nome, cargo)', { count: 'exact' })

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }

    if (mes) {
      query = query.eq('mes', mes)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query
      .order('mes', { ascending: false })
      .range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao listar folha de pagamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar folha de pagamento',
      error: error.message
    })
  }
})

/**
 * GET /api/remuneracao/folha-pagamento/:id
 * Obter folha de pagamento por ID
 */
router.get('/folha-pagamento/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: folha, error: folhaError } = await supabaseAdmin
      .from('folha_pagamento')
      .select('*, funcionarios(nome, cargo, cpf)')
      .eq('id', id)
      .single()

    if (folhaError) {
      if (folhaError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Folha de pagamento não encontrada'
        })
      }
      throw folhaError
    }

    // Buscar descontos desta folha
    const { data: descontos } = await supabaseAdmin
      .from('funcionario_descontos')
      .select('*, descontos_tipo(tipo, descricao)')
      .eq('folha_pagamento_id', id)

    res.json({
      success: true,
      data: {
        ...folha,
        descontos
      }
    })
  } catch (error) {
    console.error('Erro ao buscar folha de pagamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar folha de pagamento',
      error: error.message
    })
  }
})

/**
 * POST /api/remuneracao/folha-pagamento
 * Criar folha de pagamento
 */
router.post('/folha-pagamento', async (req, res) => {
  try {
    const {
      funcionario_id,
      mes,
      salario_base,
      horas_trabalhadas,
      horas_extras,
      valor_hora_extra,
      observacoes
    } = req.body

    // Validar dados
    if (!funcionario_id || !mes || !salario_base) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios: funcionario_id, mes, salario_base'
      })
    }

    // Verificar se já existe folha para este funcionário neste mês
    const { data: existente } = await supabaseAdmin
      .from('folha_pagamento')
      .select('id')
      .eq('funcionario_id', funcionario_id)
      .eq('mes', mes)
      .single()

    if (existente) {
      return res.status(409).json({
        success: false,
        message: 'Já existe folha de pagamento para este funcionário neste mês'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('folha_pagamento')
      .insert({
        funcionario_id,
        mes,
        salario_base,
        horas_trabalhadas: horas_trabalhadas || 0,
        horas_extras: horas_extras || 0,
        valor_hora_extra: valor_hora_extra || 0,
        observacoes
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Folha de pagamento criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar folha de pagamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar folha de pagamento',
      error: error.message
    })
  }
})

/**
 * PUT /api/remuneracao/folha-pagamento/:id
 * Atualizar folha de pagamento
 */
router.put('/folha-pagamento/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabaseAdmin
      .from('folha_pagamento')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Folha de pagamento atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar folha de pagamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar folha de pagamento',
      error: error.message
    })
  }
})

// ============== TIPOS DE DESCONTOS ==============

/**
 * GET /api/remuneracao/descontos-tipo
 * Listar tipos de descontos
 */
router.get('/descontos-tipo', async (req, res) => {
  try {
    const { ativo = 'true' } = req.query

    let query = supabaseAdmin
      .from('descontos_tipo')
      .select('*')

    if (ativo === 'true') {
      query = query.eq('ativo', true)
    }

    query = query.order('tipo', { ascending: true })

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao listar tipos de descontos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tipos de descontos',
      error: error.message
    })
  }
})

/**
 * POST /api/remuneracao/descontos-tipo
 * Criar tipo de desconto
 */
router.post('/descontos-tipo', async (req, res) => {
  try {
    const {
      tipo,
      descricao,
      valor,
      percentual,
      obrigatorio
    } = req.body

    if (!tipo || !descricao) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: tipo, descricao'
      })
    }

    if ((!valor || valor === 0) && (!percentual || percentual === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Informe ao menos um: valor ou percentual'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('descontos_tipo')
      .insert({
        tipo,
        descricao,
        valor: valor || 0,
        percentual: percentual || 0,
        obrigatorio: obrigatorio || false
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Tipo de desconto criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar tipo de desconto:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar tipo de desconto',
      error: error.message
    })
  }
})

// ============== TIPOS DE BENEFÍCIOS ==============

/**
 * GET /api/remuneracao/beneficios-tipo
 * Listar tipos de benefícios
 */
router.get('/beneficios-tipo', async (req, res) => {
  try {
    const { ativo = 'true' } = req.query

    let query = supabaseAdmin
      .from('beneficios_tipo')
      .select('*')

    if (ativo === 'true') {
      query = query.eq('ativo', true)
    }

    query = query.order('tipo', { ascending: true })

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao listar tipos de benefícios:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tipos de benefícios',
      error: error.message
    })
  }
})

/**
 * POST /api/remuneracao/beneficios-tipo
 * Criar tipo de benefício
 */
router.post('/beneficios-tipo', async (req, res) => {
  try {
    const {
      tipo,
      descricao,
      valor,
      percentual
    } = req.body

    if (!tipo || !descricao || (!valor && valor !== 0)) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: tipo, descricao, valor'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('beneficios_tipo')
      .insert({
        tipo,
        descricao,
        valor,
        percentual: percentual || 0
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Tipo de benefício criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar tipo de benefício:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar tipo de benefício',
      error: error.message
    })
  }
})

// ============== DESCONTOS DO FUNCIONÁRIO ==============

/**
 * POST /api/remuneracao/funcionario-descontos
 * Adicionar desconto à folha
 */
router.post('/funcionario-descontos', async (req, res) => {
  try {
    const {
      folha_pagamento_id,
      desconto_tipo_id,
      valor,
      observacoes
    } = req.body

    if (!folha_pagamento_id || !desconto_tipo_id || (!valor && valor !== 0)) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: folha_pagamento_id, desconto_tipo_id, valor'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('funcionario_descontos')
      .insert({
        folha_pagamento_id,
        desconto_tipo_id,
        valor,
        observacoes
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Desconto adicionado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao adicionar desconto:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar desconto',
      error: error.message
    })
  }
})

// ============== BENEFÍCIOS DO FUNCIONÁRIO ==============

/**
 * GET /api/remuneracao/funcionario-beneficios
 * Listar benefícios de funcionários
 * Query: funcionario_id, status, mes_referencia (YYYY-MM)
 */
router.get('/funcionario-beneficios', async (req, res) => {
  try {
    const { funcionario_id, status, mes_referencia } = req.query

    let query = supabaseAdmin
      .from('funcionario_beneficios')
      .select('*, funcionarios(nome, cargo), beneficios_tipo(tipo, descricao, valor)')
      .order('id', { ascending: false })

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }

    // status omitido ou 'todos' → sem filtro (PWA/RH precisam ver pendentes e inativos)
    if (status && status !== 'todos' && status !== 'all') {
      query = query.eq('status', status)
    }

    if (mes_referencia && /^\d{4}-\d{2}$/.test(String(mes_referencia))) {
      query = query.eq('mes_referencia', mes_referencia)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao listar benefícios:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar benefícios',
      error: error.message
    })
  }
})

/**
 * POST /api/remuneracao/funcionario-beneficios
 * Adicionar benefício ao funcionário
 * Aceita mes_referencia (YYYY-MM) e/ou data_inicio; arquivo (PDF) opcional/obrigatório conforme tipo.
 */
router.post('/funcionario-beneficios', async (req, res) => {
  try {
    const {
      funcionario_id,
      beneficio_tipo_id,
      data_inicio,
      mes_referencia,
      valor,
      observacoes,
      arquivo,
      status
    } = req.body

    if (!funcionario_id || !beneficio_tipo_id) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: funcionario_id, beneficio_tipo_id'
      })
    }

    let mesRef = mes_referencia ? String(mes_referencia).trim() : null
    if (mesRef && !/^\d{4}-\d{2}$/.test(mesRef)) {
      return res.status(400).json({
        success: false,
        message: 'mes_referencia deve estar no formato YYYY-MM'
      })
    }

    let dataInicio = data_inicio ? String(data_inicio).trim() : null
    if (!dataInicio && mesRef) {
      dataInicio = mesReferenciaParaDataInicio(mesRef)
    }
    if (!mesRef && dataInicio && /^\d{4}-\d{2}/.test(dataInicio)) {
      mesRef = dataInicio.slice(0, 7)
    }

    if (!dataInicio && !mesRef) {
      return res.status(400).json({
        success: false,
        message: 'Informe mes_referencia (YYYY-MM) ou data_inicio'
      })
    }

    const { data: tipoRow, error: tipoErr } = await supabaseAdmin
      .from('beneficios_tipo')
      .select('id, tipo')
      .eq('id', beneficio_tipo_id)
      .single()

    if (tipoErr || !tipoRow) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de benefício inválido'
      })
    }

    if (isBeneficioDocumental(tipoRow.tipo) && !arquivo) {
      return res.status(400).json({
        success: false,
        message: 'PDF obrigatório para este tipo de benefício'
      })
    }

    if (isBeneficioDocumental(tipoRow.tipo) && !mesRef) {
      return res.status(400).json({
        success: false,
        message: 'Mês/ano (mes_referencia) obrigatório para este tipo de benefício'
      })
    }

    const insertData = {
      funcionario_id,
      beneficio_tipo_id,
      data_inicio: dataInicio || mesReferenciaParaDataInicio(mesRef),
      observacoes: observacoes || null,
      status: status || 'ativo'
    }

    if (mesRef) insertData.mes_referencia = mesRef
    if (arquivo) insertData.arquivo = arquivo

    if (valor !== undefined && valor !== null && valor !== '') {
      insertData.valor = parseFloat(valor)
    }

    let { data, error } = await supabaseAdmin
      .from('funcionario_beneficios')
      .insert(insertData)
      .select('*, beneficios_tipo(tipo, descricao, valor)')
      .single()

    // Compatibilidade: bancos sem colunas novas ou sem "valor"
    if (error && /Could not find the '(valor|mes_referencia|arquivo|assinatura_digital|assinado_em|assinado_por)' column/i.test(String(error.message || ''))) {
      const msg = String(error.message || '')
      const retryData = { ...insertData }
      if (/valor/i.test(msg)) delete retryData.valor
      if (/mes_referencia/i.test(msg)) {
        delete retryData.mes_referencia
        console.warn('[beneficios] Coluna mes_referencia ausente — rode a migration 20260727_funcionario_beneficios_pdf_assinatura.sql')
      }
      if (/arquivo/i.test(msg)) {
        delete retryData.arquivo
        console.warn('[beneficios] Coluna arquivo ausente — rode a migration 20260727_funcionario_beneficios_pdf_assinatura.sql')
      }
      const retry = await supabaseAdmin
        .from('funcionario_beneficios')
        .insert(retryData)
        .select('*, beneficios_tipo(tipo, descricao, valor)')
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Benefício adicionado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao adicionar benefício:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar benefício',
      error: error.message
    })
  }
})

/**
 * PUT /api/remuneracao/funcionario-beneficios/:id
 * Atualizar benefício do funcionário
 */
router.put('/funcionario-beneficios/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body }
    delete updateData.id
    delete updateData.assinatura_digital
    delete updateData.assinado_em
    delete updateData.assinado_por

    if (updateData.mes_referencia) {
      const mesRef = String(updateData.mes_referencia).trim()
      if (!/^\d{4}-\d{2}$/.test(mesRef)) {
        return res.status(400).json({
          success: false,
          message: 'mes_referencia deve estar no formato YYYY-MM'
        })
      }
      updateData.mes_referencia = mesRef
      if (!updateData.data_inicio) {
        updateData.data_inicio = mesReferenciaParaDataInicio(mesRef)
      }
    }

    let { data, error } = await supabaseAdmin
      .from('funcionario_beneficios')
      .update(updateData)
      .eq('id', id)
      .select('*, beneficios_tipo(tipo, descricao, valor)')
      .single()

    if (error && String(error.message || '').includes("Could not find the 'valor' column")) {
      delete updateData.valor
      const retry = await supabaseAdmin
        .from('funcionario_beneficios')
        .update(updateData)
        .eq('id', id)
        .select('*, beneficios_tipo(tipo, descricao, valor)')
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Benefício atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar benefício:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar benefício',
      error: error.message
    })
  }
})

/**
 * DELETE /api/remuneracao/funcionario-beneficios/:id
 */
router.delete('/funcionario-beneficios/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin
      .from('funcionario_beneficios')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Benefício excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir benefício:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir benefício',
      error: error.message
    })
  }
})

/**
 * PUT /api/remuneracao/funcionario-beneficios/:id/assinatura
 * Assinar benefício documental (PWA / RH)
 */
router.put('/funcionario-beneficios/:id/assinatura', async (req, res) => {
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

    const { data: beneficio, error: findErr } = await supabaseAdmin
      .from('funcionario_beneficios')
      .select('*, beneficios_tipo(tipo)')
      .eq('id', id)
      .single()

    if (findErr || !beneficio) {
      return res.status(404).json({
        success: false,
        message: 'Benefício não encontrado'
      })
    }

    if (!beneficio.arquivo) {
      return res.status(400).json({
        success: false,
        message: 'Este benefício não possui PDF para assinar'
      })
    }

    const hasRHEditPermission = checkPermission(userRole, 'rh:editar')
    const userFuncionarioIdNum = userFuncionarioId ? Number(userFuncionarioId) : null
    const beneficioFuncionarioId = Number(beneficio.funcionario_id)
    const isOwn =
      userFuncionarioIdNum !== null &&
      !isNaN(beneficioFuncionarioId) &&
      userFuncionarioIdNum === beneficioFuncionarioId

    if (!hasRHEditPermission && !isOwn) {
      return res.status(403).json({
        success: false,
        message: 'Você só pode assinar seus próprios benefícios'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('funcionario_beneficios')
      .update({
        assinatura_digital,
        assinado_em: new Date().toISOString(),
        assinado_por: userId
      })
      .eq('id', id)
      .select('*, beneficios_tipo(tipo, descricao, valor)')
      .single()

    if (error) throw error

    res.json({ success: true, data, message: 'Benefício assinado com sucesso' })
  } catch (error) {
    console.error('Erro ao assinar benefício:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao assinar benefício',
      error: error.message
    })
  }
})

/**
 * GET /api/remuneracao/funcionario-beneficios/:id/download
 * Download do PDF do benefício (?comAssinatura=true)
 */
router.get('/funcionario-beneficios/:id/download', async (req, res) => {
  try {
    const { id } = req.params
    const { comAssinatura } = req.query

    const { data: beneficio, error: findErr } = await supabaseAdmin
      .from('funcionario_beneficios')
      .select('*, beneficios_tipo(tipo, descricao)')
      .eq('id', id)
      .single()

    if (findErr || !beneficio) {
      return res.status(404).json({
        success: false,
        message: 'Benefício não encontrado'
      })
    }

    if (!beneficio.arquivo) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo do benefício não encontrado'
      })
    }

    let pdfBuffer
    try {
      pdfBuffer = await baixarArquivoBeneficioBuffer(beneficio.arquivo)
    } catch (dlErr) {
      console.error('[beneficios/download] Falha ao obter bytes:', dlErr)
      return res.status(502).json({
        success: false,
        message: 'Arquivo não pôde ser baixado',
        details: process.env.NODE_ENV === 'development' ? String(dlErr?.message || dlErr) : undefined
      })
    }

    const tipoNome = beneficio.beneficios_tipo?.tipo || ''
    const wantSigned = comAssinatura === 'true' || comAssinatura === '1'

    if (wantSigned && beneficio.assinatura_digital) {
      try {
        const tipoDoc = beneficioTipoParaTipoDocumentoAssinatura(tipoNome)
        const arquivoNome =
          String(beneficio.arquivo || '')
            .split('/')
            .pop()
            .split('?')[0] || 'beneficio.pdf'
        const beforeLen = pdfBuffer.length
        pdfBuffer = await adicionarAssinaturaPorAncorasOuFallback(pdfBuffer, beneficio.assinatura_digital, {
          documento: {
            arquivo_original: arquivoNome,
            titulo: tipoNome,
            ...(tipoDoc ? { tipo_documento: tipoDoc } : {})
          },
          opacity: 1.0
        })
        if (pdfBuffer.length === beforeLen) {
          return res.status(422).json({
            success: false,
            message: 'Não foi possível aplicar a assinatura no PDF. Tente reassinar.'
          })
        }
      } catch (signatureError) {
        console.error('Erro ao compor assinatura no PDF (benefício):', signatureError)
        return res.status(422).json({
          success: false,
          message: 'Erro ao aplicar assinatura no PDF',
          error: signatureError.message
        })
      }
    } else if (wantSigned && !beneficio.assinatura_digital) {
      return res.status(400).json({
        success: false,
        message: 'Benefício ainda não foi assinado'
      })
    }

    const mes = beneficio.mes_referencia || 'sem-mes'
    const tipoSlug = String(tipoNome || 'beneficio').replace(/[^a-zA-Z0-9._-]/g, '_')
    const nomeArquivo = `${tipoSlug}_${mes}${wantSigned && beneficio.assinatura_digital ? '_assinado' : ''}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Erro ao baixar benefício:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao baixar benefício',
      error: error.message
    })
  }
})

export default router

