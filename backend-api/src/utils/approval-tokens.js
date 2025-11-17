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
    console.log(`[approval-tokens] Buscando aprovação por token: id=${aprovacao_id}, token=${token?.substring(0, 20)}...`);
    
    // Primeiro, buscar aprovação sem join para garantir que existe
    const { data: aprovacao, error: aprovacaoError } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('*')
      .eq('id', aprovacao_id)
      .eq('token_aprovacao', token)
      .single();
    
    if (aprovacaoError) {
      console.error('[approval-tokens] Erro ao buscar aprovação:', aprovacaoError);
      console.error('[approval-tokens] Código do erro:', aprovacaoError.code);
      console.error('[approval-tokens] Mensagem:', aprovacaoError.message);
      console.error('[approval-tokens] Detalhes:', JSON.stringify(aprovacaoError, null, 2));
      return null;
    }
    
    if (!aprovacao) {
      console.error('[approval-tokens] Aprovação não encontrada (data é null)');
      return null;
    }
    
    console.log(`[approval-tokens] Aprovação encontrada: ${aprovacao.id}, funcionario_id: ${aprovacao.funcionario_id}`);
    
    // Buscar funcionário separadamente (pode ser UUID ou número)
    let funcionario = null;
    try {
      const funcionarioId = aprovacao.funcionario_id;
      console.log(`[approval-tokens] Buscando funcionário com ID: ${funcionarioId} (tipo: ${typeof funcionarioId})`);
      
      // Tentar buscar diretamente
      const { data: funcionarioData, error: funcError } = await supabaseAdmin
        .from('funcionarios')
        .select('id, nome, cpf')
        .eq('id', funcionarioId)
        .single();
      
      if (funcError) {
        console.error(`[approval-tokens] Erro ao buscar funcionário:`, funcError);
        console.error(`[approval-tokens] Código do erro:`, funcError.code);
        console.error(`[approval-tokens] Mensagem:`, funcError.message);
        
        // Se o erro for porque não encontrou, tentar como string
        if (funcError.code === 'PGRST116') {
          console.log(`[approval-tokens] Tentando buscar funcionário como string...`);
          const { data: funcionarioData2, error: funcError2 } = await supabaseAdmin
            .from('funcionarios')
            .select('id, nome, cpf')
            .eq('id', funcionarioId.toString())
            .single();
          
          if (!funcError2 && funcionarioData2) {
            funcionario = funcionarioData2;
            console.log(`[approval-tokens] Funcionário encontrado (como string): ${funcionario.nome}`);
          } else {
            console.warn(`[approval-tokens] Funcionário não encontrado mesmo como string: ${funcionarioId}`);
          }
        }
      } else if (funcionarioData) {
        funcionario = funcionarioData;
        console.log(`[approval-tokens] Funcionário encontrado: ${funcionario.nome}`);
      } else {
        console.warn(`[approval-tokens] Funcionário não encontrado: ${funcionarioId}`);
      }
    } catch (funcSearchError) {
      console.error('[approval-tokens] Erro ao buscar funcionário (catch):', funcSearchError);
      console.error('[approval-tokens] Stack:', funcSearchError.stack);
    }
    
    // Buscar registro de ponto se necessário
    let registroPonto = null;
    if (aprovacao.registro_ponto_id) {
      try {
        const { data: registroData, error: registroError } = await supabaseAdmin
          .from('registros_ponto')
          .select('entrada, saida')
          .eq('id', aprovacao.registro_ponto_id)
          .single();
        
        if (!registroError && registroData) {
          registroPonto = registroData;
          console.log(`[approval-tokens] Registro de ponto encontrado`);
        }
      } catch (regError) {
        console.warn('[approval-tokens] Erro ao buscar registro de ponto:', regError);
      }
    }
    
    return {
      ...aprovacao,
      funcionarios: funcionario,
      registros_ponto: registroPonto
    };
  } catch (error) {
    console.error('[approval-tokens] Erro ao buscar aprovação por token:', error);
    console.error('[approval-tokens] Stack:', error.stack);
    return null;
  }
}

