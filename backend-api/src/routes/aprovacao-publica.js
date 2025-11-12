import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { validarToken, buscarAprovacaoPorToken } from '../utils/approval-tokens.js';
import crypto from 'crypto';

const router = express.Router();

// Rate limiting simples (em memória)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requisições por 15 minutos

/**
 * Middleware de rate limiting por IP
 */
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const limit = rateLimitMap.get(ip);
  
  if (now > limit.resetTime) {
    // Resetar contador
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Muitas requisições. Tente novamente em alguns minutos.'
    });
  }
  
  limit.count++;
  next();
}

/**
 * Middleware para validar token obrigatório
 */
function validarTokenMiddleware(req, res, next) {
  const { token } = req.query;
  const { id } = req.params;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token de aprovação é obrigatório'
    });
  }
  
  req.token = token;
  req.aprovacao_id = id;
  next();
}

// Aplicar rate limiting em todas as rotas
router.use(rateLimitMiddleware);

/**
 * GET /api/aprovacao/:id
 * Retorna dados da aprovação validando o token
 * Rota pública (não requer autenticação)
 */
router.get('/:id', validarTokenMiddleware, async (req, res) => {
  try {
    const { token, aprovacao_id } = req;
    
    console.log(`[aprovacao-publica] Buscando aprovação: id=${aprovacao_id}, token=${token?.substring(0, 20)}...`);
    
    // Validar token
    const validacao = await validarToken(token, aprovacao_id);
    
    if (!validacao.valido) {
      console.log(`[aprovacao-publica] Token inválido: ${validacao.motivo}`);
      return res.status(400).json({
        success: false,
        message: validacao.motivo,
        aprovacao: null
      });
    }
    
    // Buscar dados completos da aprovação
    const aprovacao = await buscarAprovacaoPorToken(token, aprovacao_id);
    
    if (!aprovacao) {
      console.log(`[aprovacao-publica] Aprovação não encontrada após validação`);
      return res.status(404).json({
        success: false,
        message: 'Aprovação não encontrada'
      });
    }
    
    console.log(`[aprovacao-publica] Aprovação encontrada: ${aprovacao.id}`);
    
    // Formatar dados para resposta
    const dataTrabalho = new Date(aprovacao.data_trabalho).toLocaleDateString('pt-BR');
    const dataLimite = new Date(aprovacao.data_limite).toLocaleDateString('pt-BR');
    
    res.json({
      success: true,
      data: {
        id: aprovacao.id,
        funcionario: {
          nome: aprovacao.funcionarios?.nome || 'Funcionário',
          cpf: aprovacao.funcionarios?.cpf || null
        },
        horas_extras: parseFloat(aprovacao.horas_extras).toFixed(2),
        data_trabalho: dataTrabalho,
        data_limite: dataLimite,
        observacoes: aprovacao.observacoes || null,
        status: aprovacao.status,
        registro_ponto: aprovacao.registros_ponto ? {
          entrada: aprovacao.registros_ponto.entrada,
          saida: aprovacao.registros_ponto.saida
        } : null
      }
    });
  } catch (error) {
    console.error('[aprovacao-publica] Erro ao buscar aprovação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar aprovação',
      error: error.message
    });
  }
});

/**
 * POST /api/aprovacao/:id/aprovar
 * Aprova uma solicitação de horas extras via token
 * Rota pública (não requer autenticação)
 */
router.post('/:id/aprovar', validarTokenMiddleware, async (req, res) => {
  try {
    const { token, aprovacao_id } = req;
    const { observacoes } = req.body;
    
    // Validar token
    const validacao = await validarToken(token, aprovacao_id);
    
    if (!validacao.valido) {
      return res.status(400).json({
        success: false,
        message: validacao.motivo
      });
    }
    
    const aprovacao = validacao.aprovacao;
    
    // Atualizar aprovação para aprovado
    const { data: aprovacaoAtualizada, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .update({
        status: 'aprovado',
        observacoes: observacoes || aprovacao.observacoes,
        data_aprovacao: new Date().toISOString()
      })
      .eq('id', aprovacao_id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Registrar IP e user agent para auditoria
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    console.log(`[aprovacao-publica] Aprovação ${aprovacao_id} aprovada via token. IP: ${ip}`);
    
    res.json({
      success: true,
      message: 'Horas extras aprovadas com sucesso',
      data: {
        id: aprovacaoAtualizada.id,
        status: aprovacaoAtualizada.status,
        data_aprovacao: aprovacaoAtualizada.data_aprovacao
      }
    });
  } catch (error) {
    console.error('[aprovacao-publica] Erro ao aprovar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar horas extras',
      error: error.message
    });
  }
});

/**
 * POST /api/aprovacao/:id/rejeitar
 * Rejeita uma solicitação de horas extras via token
 * Rota pública (não requer autenticação)
 */
router.post('/:id/rejeitar', validarTokenMiddleware, async (req, res) => {
  try {
    const { token, aprovacao_id } = req;
    const { motivo } = req.body;
    
    // Validar token
    const validacao = await validarToken(token, aprovacao_id);
    
    if (!validacao.valido) {
      return res.status(400).json({
        success: false,
        message: validacao.motivo
      });
    }
    
    const aprovacao = validacao.aprovacao;
    
    // Motivo é obrigatório para rejeição
    if (!motivo || motivo.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da rejeição é obrigatório'
      });
    }
    
    // Atualizar aprovação para rejeitado
    const { data: aprovacaoAtualizada, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .update({
        status: 'rejeitado',
        observacoes: motivo,
        data_aprovacao: new Date().toISOString()
      })
      .eq('id', aprovacao_id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Registrar IP e user agent para auditoria
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    console.log(`[aprovacao-publica] Aprovação ${aprovacao_id} rejeitada via token. IP: ${ip}, Motivo: ${motivo}`);
    
    res.json({
      success: true,
      message: 'Horas extras rejeitadas',
      data: {
        id: aprovacaoAtualizada.id,
        status: aprovacaoAtualizada.status,
        data_aprovacao: aprovacaoAtualizada.data_aprovacao
      }
    });
  } catch (error) {
    console.error('[aprovacao-publica] Erro ao rejeitar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar horas extras',
      error: error.message
    });
  }
});

export default router;

