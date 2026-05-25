import { supabaseAdmin } from '../config/supabase.js';

/**
 * Busca o supervisor responsável por uma obra (responsável de obra cadastrado)
 * @param {number} obra_id - ID da obra
 * @returns {Promise<Object|null>} - Usuário supervisor ou null
 */
async function buscarSupervisorPorObra(obra_id) {
  try {
    const { data: responsaveis, error: respError } = await supabaseAdmin
      .from('responsaveis_obra')
      .select('id, nome, email, telefone, obra_id')
      .eq('obra_id', obra_id)
      .eq('ativo', true)
      .order('created_at', { ascending: true })
      .limit(1);

    if (respError) {
      console.error('[aprovacoes-helpers] Erro ao buscar responsaveis_obra:', respError);
      return null;
    }

    const responsavel = responsaveis?.[0];
    if (!responsavel?.email) {
      console.warn(`[aprovacoes-helpers] Obra ${obra_id} não possui responsável de obra ativo`);
      return null;
    }

    const emailNorm = String(responsavel.email).toLowerCase().trim();
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, email, role, telefone')
      .ilike('email', emailNorm)
      .maybeSingle();

    if (usuarioError) {
      console.error('[aprovacoes-helpers] Erro ao buscar usuário do responsável:', usuarioError);
      return null;
    }

    if (usuario) {
      return {
        id: usuario.id,
        nome: usuario.nome || responsavel.nome,
        email: usuario.email || responsavel.email,
        telefone: usuario.telefone || responsavel.telefone || null,
        cargo: 'Responsável de Obra',
        role: usuario.role,
      };
    }

    console.warn(
      `[aprovacoes-helpers] Responsável de obra ${responsavel.email} sem usuário vinculado (obra ${obra_id})`
    );
    return null;
  } catch (error) {
    console.error('[aprovacoes-helpers] Erro ao buscar supervisor por obra:', error);
    return null;
  }
}

/**
 * Calcula a data limite para aprovação (7 dias a partir de agora)
 * @returns {Date} - Data limite (now + 7 dias)
 */
function calcularDataLimite() {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() + 7);
  return dataLimite;
}

/**
 * Calcula a data para envio de lembrete (3 dias a partir de agora)
 * @returns {Date} - Data para lembrete (now + 3 dias)
 */
function calcularDataLembrete() {
  const dataLembrete = new Date();
  dataLembrete.setDate(dataLembrete.getDate() + 3);
  return dataLembrete;
}

/**
 * Cria notificação para aprovação de horas extras
 * @param {Object} aprovacao - Dados da aprovação
 * @param {number} usuario_id - ID do usuário que receberá a notificação
 * @param {string} tipo - Tipo da notificação (nova_aprovacao, lembrete, aprovado, rejeitado, cancelado)
 * @param {string} titulo - Título da notificação
 * @param {string} mensagem - Mensagem da notificação
 * @returns {Promise<Object>} - Notificação criada
 */
async function criarNotificacaoAprovacao(aprovacao, usuario_id, tipo, titulo, mensagem) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notificacoes_horas_extras')
      .insert({
        aprovacao_id: aprovacao.id,
        usuario_id: usuario_id,
        tipo: tipo,
        titulo: titulo,
        mensagem: mensagem,
        lida: false
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[aprovacoes-helpers] Notificação criada: ${tipo} para usuário ${usuario_id}`);
    
    return data;
  } catch (error) {
    console.error('[aprovacoes-helpers] Erro ao criar notificação:', error);
    throw error;
  }
}

/**
 * Valida se uma aprovação está dentro do prazo e pode ser processada
 * @param {string} aprovacao_id - ID da aprovação
 * @returns {Promise<Object>} - { valida: boolean, aprovacao: Object, motivo: string }
 */
async function validarAprovacaoValida(aprovacao_id) {
  try {
    const { data: aprovacao, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('*')
      .eq('id', aprovacao_id)
      .single();

    if (error) throw error;

    if (!aprovacao) {
      return { valida: false, aprovacao: null, motivo: 'Aprovação não encontrada' };
    }

    if (aprovacao.status !== 'pendente') {
      return { valida: false, aprovacao, motivo: `Aprovação já está ${aprovacao.status}` };
    }

    const dataLimite = new Date(aprovacao.data_limite);
    const agora = new Date();

    if (agora > dataLimite) {
      return { valida: false, aprovacao, motivo: 'Prazo de aprovação expirado (7 dias)' };
    }

    return { valida: true, aprovacao, motivo: null };
  } catch (error) {
    console.error('[aprovacoes-helpers] Erro ao validar aprovação:', error);
    return { valida: false, aprovacao: null, motivo: 'Erro ao validar aprovação' };
  }
}

/**
 * Busca funcionário por ID
 * @param {number} funcionario_id - ID do funcionário
 * @returns {Promise<Object|null>} - Dados do funcionário
 */
async function buscarFuncionario(funcionario_id) {
  try {
    const { data, error } = await supabaseAdmin
      .from('funcionarios')
      .select('*, usuarios(*)')
      .eq('id', funcionario_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[aprovacoes-helpers] Erro ao buscar funcionário:', error);
    return null;
  }
}

/**
 * Calcula o número de horas trabalhadas
 * @param {Date} entrada - Horário de entrada
 * @param {Date} saida - Horário de saída
 * @returns {number} - Horas trabalhadas
 */
function calcularHorasTrabalhadas(entrada, saida) {
  const diffMs = new Date(saida) - new Date(entrada);
  const diffHoras = diffMs / (1000 * 60 * 60);
  return Math.round(diffHoras * 100) / 100;
}

/**
 * Verifica se um usuário tem permissão para aprovar (é supervisor designado)
 * @param {number} usuario_id - ID do usuário
 * @param {number} supervisor_id - ID do supervisor esperado
 * @returns {boolean} - true se o usuário pode aprovar
 */
function verificarPermissaoAprovacao(usuario_id, supervisor_id) {
  return parseInt(usuario_id) === parseInt(supervisor_id);
}

/**
 * Formata data para exibição em notificações
 * @param {Date} data - Data a ser formatada
 * @returns {string} - Data formatada
 */
function formatarDataNotificacao(data) {
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcula dias restantes até a data limite
 * @param {Date} dataLimite - Data limite
 * @returns {number} - Número de dias restantes
 */
function calcularDiasRestantes(dataLimite) {
  const agora = new Date();
  const limite = new Date(dataLimite);
  const diffMs = limite - agora;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDias);
}

export {
  buscarSupervisorPorObra,
  calcularDataLimite,
  calcularDataLembrete,
  criarNotificacaoAprovacao,
  validarAprovacaoValida,
  buscarFuncionario,
  calcularHorasTrabalhadas,
  verificarPermissaoAprovacao,
  formatarDataNotificacao,
  calcularDiasRestantes
};
