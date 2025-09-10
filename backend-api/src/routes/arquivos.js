import express from 'express'
import multer from 'multer'
import { supabaseAdmin, supabase } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    // Tipos de arquivo permitidos
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain'
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
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  return `obra_${obraId}_${timestamp}_${randomString}.${extension}`
}

// Função para obter o tipo de arquivo baseado na extensão
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'imagem'
  if (mimetype === 'application/pdf') return 'pdf'
  if (mimetype.includes('word')) return 'documento'
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'planilha'
  if (mimetype === 'text/plain') return 'texto'
  return 'outro'
}

// Upload de arquivo para grua
router.post('/upload/grua/:gruaId', authenticateToken, upload.single('arquivo'), async (req, res) => {
  try {
    const { gruaId } = req.params
    const { descricao, categoria } = req.body
    const file = req.file

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      })
    }

    // Verificar se a grua existe e obter o obra_id da relação grua_obra
    const { data: gruaObra, error: gruaError } = await supabaseAdmin
      .from('grua_obra')
      .select(`
        grua_id,
        obra_id,
        status,
        gruas!inner(id, modelo, fabricante)
      `)
      .eq('grua_id', gruaId)
      .eq('status', 'Ativa')
      .single()

    if (gruaError || !gruaObra) {
      return res.status(404).json({
        success: false,
        message: 'Grua não encontrada ou não está ativa em nenhuma obra'
      })
    }

    // Gerar nome único para o arquivo
    const fileName = generateFileName(file.originalname, gruaId)
    const filePath = `gruas/${gruaId}/${fileName}`

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

    // Salvar metadados do arquivo no banco (usando o obra_id da relação grua_obra)
    const arquivoData = {
      obra_id: gruaObra.obra_id, // ID da obra onde a grua está ativa
      grua_id: gruaId, // ID da grua
      nome_original: file.originalname,
      nome_arquivo: fileName,
      caminho: filePath,
      tamanho: file.size,
      tipo_mime: file.mimetype,
      tipo_arquivo: getFileType(file.mimetype),
      descricao: descricao || null,
      categoria: categoria || 'geral',
      uploaded_by: req.user.id,
      created_at: new Date().toISOString()
    }

    const { data: arquivoRecord, error: dbError } = await supabaseAdmin
      .from('arquivos_obra')
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

    res.json({
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
    console.error('Erro no upload de arquivo da grua:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

// Upload de arquivo para obra
router.post('/upload/:obraId', authenticateToken, upload.single('arquivo'), async (req, res) => {
  try {
    const { obraId } = req.params
    const { descricao, categoria } = req.body
    const file = req.file

    if (!file) {
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

    // Gerar nome único para o arquivo
    const fileName = generateFileName(file.originalname, obraId)
    const filePath = `obras/${obraId}/${fileName}`

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
      nome_original: file.originalname,
      nome_arquivo: fileName,
      caminho: filePath,
      tamanho: file.size,
      tipo_mime: file.mimetype,
      tipo_arquivo: getFileType(file.mimetype),
      descricao: descricao || null,
      categoria: categoria || 'geral',
      uploaded_by: req.user.id,
      created_at: new Date().toISOString()
    }

    const { data: arquivoRecord, error: dbError } = await supabaseAdmin
      .from('arquivos_obra')
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

    res.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      data: arquivoRecord
    })

  } catch (error) {
    console.error('Erro no upload de arquivo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

// Upload múltiplo de arquivos
router.post('/upload-multiple/:obraId', authenticateToken, upload.array('arquivos', 10), async (req, res) => {
  try {
    const { obraId } = req.params
    const { categoria } = req.body
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

    const resultados = []
    const erros = []

    // Processar cada arquivo
    for (const file of files) {
      try {
        const fileName = generateFileName(file.originalname, obraId)
        const filePath = `obras/${obraId}/${fileName}`

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
          nome_original: file.originalname,
          nome_arquivo: fileName,
          caminho: filePath,
          tamanho: file.size,
          tipo_mime: file.mimetype,
          tipo_arquivo: getFileType(file.mimetype),
          descricao: null,
          categoria: categoria || 'geral',
          uploaded_by: req.user.id,
          created_at: new Date().toISOString()
        }

        const { data: arquivoRecord, error: dbError } = await supabaseAdmin
          .from('arquivos_obra')
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
          resultados.push(arquivoRecord)
        }

      } catch (error) {
        erros.push({
          arquivo: file.originalname,
          erro: error.message
        })
      }
    }

    res.json({
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

// Listar arquivos de uma grua
router.get('/grua/:gruaId', authenticateToken, async (req, res) => {
  try {
    const { gruaId } = req.params

    // Verificar se a grua existe e obter o obra_id da relação grua_obra
    const { data: gruaObra, error: gruaError } = await supabaseAdmin
      .from('grua_obra')
      .select(`
        grua_id,
        obra_id,
        status,
        gruas!inner(id, modelo, fabricante)
      `)
      .eq('grua_id', gruaId)
      .eq('status', 'Ativa')
      .single()

    if (gruaError || !gruaObra) {
      return res.status(404).json({
        success: false,
        message: 'Grua não encontrada ou não está ativa em nenhuma obra'
      })
    }

    // Buscar arquivos da grua
    const { data: arquivos, error: arquivosError } = await supabaseAdmin
      .from('arquivos_obra')
      .select('*')
      .eq('grua_id', gruaId)
      .order('created_at', { ascending: false })

    if (arquivosError) {
      console.error('Erro ao buscar arquivos:', arquivosError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar arquivos',
        error: arquivosError.message
      })
    }

    res.json({
      success: true,
      data: arquivos || []
    })

  } catch (error) {
    console.error('Erro ao listar arquivos da grua:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

// Listar arquivos de uma obra
router.get('/obra/:obraId', authenticateToken, async (req, res) => {
  try {
    const { obraId } = req.params
    const { categoria, tipo_arquivo } = req.query

    let query = supabaseAdmin
      .from('arquivos_obra')
      .select(`
        *,
        uploaded_by_user:usuarios!arquivos_obra_uploaded_by_fkey(
          id,
          nome,
          email
        )
      `)
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false })

    // Aplicar filtros se fornecidos
    if (categoria) {
      query = query.eq('categoria', categoria)
    }
    if (tipo_arquivo) {
      query = query.eq('tipo_arquivo', tipo_arquivo)
    }

    const { data: arquivos, error } = await query

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
      data: arquivos
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

// Obter URL de download de um arquivo
router.get('/download/:arquivoId', authenticateToken, async (req, res) => {
  try {
    const { arquivoId } = req.params

    // Buscar informações do arquivo
    const { data: arquivo, error: arquivoError } = await supabaseAdmin
      .from('arquivos_obra')
      .select('*')
      .eq('id', arquivoId)
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
      .createSignedUrl(arquivo.caminho, 3600) // URL válida por 1 hora

    if (urlError) {
      console.error('Erro ao gerar URL:', urlError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar URL de download',
        error: urlError.message
      })
    }

    res.json({
      success: true,
      data: {
        url: signedUrl.signedUrl,
        arquivo: {
          nome_original: arquivo.nome_original,
          tamanho: arquivo.tamanho,
          tipo_mime: arquivo.tipo_mime
        }
      }
    })

  } catch (error) {
    console.error('Erro ao gerar URL de download:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

// Atualizar metadados de um arquivo
router.put('/:arquivoId', authenticateToken, async (req, res) => {
  try {
    const { arquivoId } = req.params
    const { descricao, categoria } = req.body

    const updateData = {}
    if (descricao !== undefined) updateData.descricao = descricao
    if (categoria !== undefined) updateData.categoria = categoria

    const { data: arquivo, error } = await supabaseAdmin
      .from('arquivos_obra')
      .update(updateData)
      .eq('id', arquivoId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar arquivo:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar arquivo',
        error: error.message
      })
    }

    res.json({
      success: true,
      message: 'Arquivo atualizado com sucesso',
      data: arquivo
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

// Deletar arquivo
router.delete('/:arquivoId', authenticateToken, async (req, res) => {
  try {
    const { arquivoId } = req.params

    // Buscar informações do arquivo
    const { data: arquivo, error: arquivoError } = await supabaseAdmin
      .from('arquivos_obra')
      .select('*')
      .eq('id', arquivoId)
      .single()

    if (arquivoError || !arquivo) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      })
    }

    // Remover arquivo do storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('arquivos-obras')
      .remove([arquivo.caminho])

    if (storageError) {
      console.error('Erro ao remover arquivo do storage:', storageError)
      // Continuar mesmo se falhar no storage, pois pode já ter sido removido
    }

    // Remover registro do banco
    const { error: dbError } = await supabaseAdmin
      .from('arquivos_obra')
      .delete()
      .eq('id', arquivoId)

    if (dbError) {
      console.error('Erro ao remover registro do banco:', dbError)
      return res.status(500).json({
        success: false,
        message: 'Erro ao remover arquivo',
        error: dbError.message
      })
    }

    res.json({
      success: true,
      message: 'Arquivo removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

// Obter estatísticas de arquivos de uma obra
router.get('/stats/:obraId', authenticateToken, async (req, res) => {
  try {
    const { obraId } = req.params

    const { data: stats, error } = await supabaseAdmin
      .from('arquivos_obra')
      .select('tipo_arquivo, categoria, tamanho')
      .eq('obra_id', obraId)

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: error.message
      })
    }

    // Processar estatísticas
    const estatisticas = {
      total_arquivos: stats.length,
      tamanho_total: stats.reduce((acc, arquivo) => acc + (arquivo.tamanho || 0), 0),
      por_tipo: {},
      por_categoria: {}
    }

    stats.forEach(arquivo => {
      // Contar por tipo
      estatisticas.por_tipo[arquivo.tipo_arquivo] = 
        (estatisticas.por_tipo[arquivo.tipo_arquivo] || 0) + 1
      
      // Contar por categoria
      estatisticas.por_categoria[arquivo.categoria] = 
        (estatisticas.por_categoria[arquivo.categoria] || 0) + 1
    })

    res.json({
      success: true,
      data: estatisticas
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

export default router
