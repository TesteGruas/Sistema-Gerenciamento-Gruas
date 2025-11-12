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
    
    console.log(`[approval-tokens] Validando token: id=${aprovacao_id}, token=${token?.substring(0, 20)}...`);
    
    // Buscar aprovação com o token
    const { data: aprovacao, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('*')
      .eq('id', aprovacao_id)
      .eq('token_aprovacao', token)
      .single();
    
    if (error) {
      console.error('[approval-tokens] Erro ao buscar aprovação na validação:', error);
      return {
        valido: false,
        aprovacao: null,
        motivo: `Token inválido ou não encontrado: ${error.message || 'Erro desconhecido'}`
      };
    }
    
    if (!aprovacao) {
      console.error('[approval-tokens] Aprovação não encontrada na validação');
      return {
        valido: false,
        aprovacao: null,
        motivo: 'Token inválido ou não encontrado'
      };
    }
    
    console.log(`[approval-tokens] Aprovação encontrada na validação: ${aprovacao.id}, status: ${aprovacao.status}`);
    
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
    console.log(`[approval-tokens] Buscando aprovação por token: id=${aprovacao_id}`);
    
    // Buscar aprovação sem join com registros_ponto primeiro (porque registro_ponto_id é UUID mas registros_ponto.id é VARCHAR)
    const { data, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select(`
        *,
        funcionarios:funcionario_id (
          id,
          nome,
          cpf
        )
      `)
      .eq('id', aprovacao_id)
      .eq('token_aprovacao', token)
      .single();
    
    if (error) {
      console.error('[approval-tokens] Erro ao buscar aprovação:', error);
      console.error('[approval-tokens] Detalhes do erro:', JSON.stringify(error, null, 2));
      return null;
    }
    
    if (!data) {
      console.error('[approval-tokens] Aprovação não encontrada (data é null)');
      return null;
    }
    
    console.log(`[approval-tokens] Aprovação encontrada: ${data.id}, funcionario: ${data.funcionarios?.nome || 'não encontrado'}`);
    
    // Buscar registro de ponto separadamente se necessário
    // Como registro_ponto_id é UUID mas registros_ponto.id é VARCHAR,
    // não podemos fazer join direto. Vamos buscar pelo ID que está nas observações ou pular
    // Por enquanto, retornar sem registro_ponto já que não é crítico para a aprovação
    return {
      ...data,
      registros_ponto: null // Não podemos fazer join devido à incompatibilidade de tipos
    };
  } catch (error) {
    console.error('[approval-tokens] Erro ao buscar aprovação por token:', error);
    console.error('[approval-tokens] Stack:', error.stack);
    return null;
  }
}

