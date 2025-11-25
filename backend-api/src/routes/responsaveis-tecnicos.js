import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Todas as rotas exigem autenticação
router.use(authenticateToken)

/**
 * GET /api/responsaveis-tecnicos/buscar?cpf=XXXXXXXXXXX
 * Busca responsável técnico por CPF/CNPJ (parcial ou completo)
 */
router.get('/buscar', async (req, res) => {
  try {
    const { cpf = '' } = req.query

    // Somente dígitos
    const cpfSomenteDigitos = String(cpf).replace(/\D/g, '')

    // Validar se tem pelo menos 5 dígitos
    if (!cpfSomenteDigitos || cpfSomenteDigitos.length < 5) {
      return res.status(400).json({ 
        success: false,
        error: 'CPF/CNPJ deve ter pelo menos 5 dígitos',
        message: 'Digite pelo menos 5 dígitos do CPF/CNPJ para buscar'
      })
    }

    // 1) Tentar encontrar em funcionarios (match exato por CPF)
    const { data: funcionarios, error: errFunc } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cpf, email, telefone')
      .eq('cpf', cpfSomenteDigitos)
      .limit(1)

    if (errFunc) throw errFunc

    if (Array.isArray(funcionarios) && funcionarios.length > 0) {
      const f = funcionarios[0]
      return res.json({
        success: true,
        data: {
          origem: 'funcionarios',
          funcionario_id: f.id,
          nome: f.nome,
          cpf_cnpj: f.cpf,
          email: f.email,
          telefone: f.telefone
        }
      })
    }

    // 2) Fallback: procurar na tabela responsaveis_tecnicos
    const { data: respTec, error } = await supabaseAdmin
      .from('responsaveis_tecnicos')
      .select('id, nome, cpf_cnpj, crea, email, telefone')
      .or(`cpf_cnpj.eq.${cpfSomenteDigitos},cpf_cnpj.ilike.%${cpfSomenteDigitos}%`)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Erro ao buscar na tabela responsaveis_tecnicos:', error)
      throw error
    }

    const found = Array.isArray(respTec) && respTec.length > 0 ? respTec[0] : null
    
    if (found) {
      return res.json({ 
        success: true, 
        data: found 
      })
    } else {
      // Não encontrado em nenhum lugar
      return res.json({ 
        success: true, 
        data: null 
      })
    }
  } catch (error) {
    console.error('Erro ao buscar responsável técnico por CPF/CNPJ:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

export default router


