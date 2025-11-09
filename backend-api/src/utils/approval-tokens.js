import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Gera um token único e seguro para aprovação
 * Token formato: {aprovacao_id}_{timestamp}_{random_hash}
 * @param {string} aprovacao_id - ID da aprovação
 * @returns {Promise<string>} - Token gerado
 */
export async function gerarTokenAprovacao(aprovacao_id) {
  try {
    // Gerar componentes do token
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    
    // Criar hash único combinando aprovacao_id, timestamp e random
    const tokenData = `${aprovacao_id}_${timestamp}_${randomBytes}`;
    const hash = crypto.createHash('sha256').update(tokenData).digest('hex');
    
    // Token final: base64 do hash (mais seguro e URL-safe)
    const token = Buffer.from(hash).toString('base64url');
    
    // Salvar token no banco de dados
    const { error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .update({ token_aprovacao: token })
      .eq('id', aprovacao_id);
    
    if (error) {
      console.error('[approval-tokens] Erro ao salvar token no banco:', error);
      throw error;
    }
    
    console.log(`[approval-tokens] Token gerado para aprovação ${aprovacao_id}`);
    return token;
  } catch (error) {
    console.error('[approval-tokens] Erro ao gerar token:', error);
    throw error;
  }
}

/**
 * Valida um token de aprovação
 * Verifica se o token existe, está associado à aprovação correta e não expirou (48h)
 * @param {string} token - Token a ser validado
 * @param {string} aprovacao_id - ID da aprovação
 * @returns {Promise<Object>} - { valido: boolean, aprovacao: Object|null, motivo: string }
 */
export async function validarToken(token, aprovacao_id) {
  try {
    if (!token || !aprovacao_id) {
      return {
        valido: false,
        aprovacao: null,
        motivo: 'Token ou ID de aprovação não fornecido'
      };
    }
    
    // Buscar aprovação com o token
    const { data: aprovacao, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('*')
      .eq('id', aprovacao_id)
      .eq('token_aprovacao', token)
      .single();
    
    if (error || !aprovacao) {
      return {
        valido: false,
        aprovacao: null,
        motivo: 'Token inválido ou não encontrado'
      };
    }
    
    // Verificar se a aprovação está pendente
    if (aprovacao.status !== 'pendente') {
      return {
        valido: false,
        aprovacao,
        motivo: `Aprovação já está ${aprovacao.status}`
      };
    }
    
    // Verificar expiração (48 horas a partir da data_submissao)
    const dataSubmissao = new Date(aprovacao.data_submissao);
    const agora = new Date();
    const diffMs = agora - dataSubmissao;
    const diffHoras = diffMs / (1000 * 60 * 60);
    
    if (diffHoras > 48) {
      return {
        valido: false,
        aprovacao,
        motivo: 'Token expirado (válido por 48 horas)'
      };
    }
    
    // Verificar se ainda está dentro do prazo de aprovação (data_limite)
    const dataLimite = new Date(aprovacao.data_limite);
    if (agora > dataLimite) {
      return {
        valido: false,
        aprovacao,
        motivo: 'Prazo de aprovação expirado'
      };
    }
    
    return {
      valido: true,
      aprovacao,
      motivo: null
    };
  } catch (error) {
    console.error('[approval-tokens] Erro ao validar token:', error);
    return {
      valido: false,
      aprovacao: null,
      motivo: 'Erro ao validar token'
    };
  }
}

/**
 * Busca aprovação por token (sem validar expiração)
 * Útil para exibir dados da aprovação
 * @param {string} token - Token da aprovação
 * @param {string} aprovacao_id - ID da aprovação
 * @returns {Promise<Object|null} - Aprovação encontrada ou null
 */
export async function buscarAprovacaoPorToken(token, aprovacao_id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select(`
        *,
        funcionarios:funcionario_id (
          id,
          nome,
          cpf
        ),
        registros_ponto:registro_ponto_id (
          entrada,
          saida,
          obra_id
        )
      `)
      .eq('id', aprovacao_id)
      .eq('token_aprovacao', token)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('[approval-tokens] Erro ao buscar aprovação por token:', error);
    return null;
  }
}

