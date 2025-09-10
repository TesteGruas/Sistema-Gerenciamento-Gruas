import express from 'express'
import multer from 'multer'

const router = express.Router()

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
  }
})

// Rota de teste simples (sem autenticação)
router.post('/test-upload/:obraId', upload.single('arquivo'), async (req, res) => {
  try {
    console.log('🔍 DEBUG: Rota de teste chamada')
    console.log('🔍 DEBUG: Obra ID:', req.params.obraId)
    console.log('🔍 DEBUG: Arquivo recebido:', req.file ? req.file.originalname : 'Nenhum arquivo')
    console.log('🔍 DEBUG: Categoria:', req.body.categoria)
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      })
    }

    res.json({
      success: true,
      message: 'Arquivo recebido com sucesso (teste)',
      data: {
        id: Date.now(),
        nome_original: req.file.originalname,
        tamanho: req.file.size,
        tipo_mime: req.file.mimetype,
        categoria: req.body.categoria || 'geral'
      }
    })

  } catch (error) {
    console.error('❌ Erro no teste de upload:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

// Rota de teste específica para gruas (sem autenticação)
router.post('/test-upload-grua/:gruaId', upload.single('arquivo'), async (req, res) => {
  try {
    console.log('🔍 DEBUG: Rota de teste para grua chamada')
    console.log('🔍 DEBUG: Grua ID:', req.params.gruaId)
    console.log('🔍 DEBUG: Arquivo recebido:', req.file ? req.file.originalname : 'Nenhum arquivo')
    console.log('🔍 DEBUG: Categoria:', req.body.categoria)
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      })
    }

    // Simular resposta de sucesso para gruas
    res.json({
      success: true,
      message: 'Arquivo da grua recebido com sucesso (teste)',
      data: {
        id: Date.now(),
        nome_original: req.file.originalname,
        tamanho: req.file.size,
        tipo_mime: req.file.mimetype,
        categoria: req.body.categoria || 'geral',
        grua_id: req.params.gruaId
      }
    })
  } catch (error) {
    console.error('Erro no teste de upload da grua:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

export default router
