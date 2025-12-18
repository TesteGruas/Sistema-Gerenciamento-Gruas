import { supabaseAdmin } from '../config/supabase.js';

/**
 * Busca o supervisor responsável por uma obra (cliente/dono da obra)
 * O supervisor é o cliente da obra, não um funcionário
 * @param {number} obra_id - ID da obra
 * @returns {Promise<Object|null>} - Supervisor da obra (cliente) ou null
 */
async function buscarSupervisorPorObra(obra_id) {
  try {
    // Buscar a obra com o cliente vinculado
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select(`
        id,
        nome,
        cliente_id,
        responsavel_id,
        responsavel_nome,
        clientes (
          id,
          nome,
          email,
          contato_usuario_id
        )
      `)
      .eq('id', obra_id)
      .single();

    if (obraError) {
      console.error('[aprovacoes-helpers] Erro ao buscar obra:', obraError);
      return null;
    }

    if (!obra) {
      console.warn(`[aprovacoes-helpers] Obra ${obra_id} não encontrada`);
      return null;
    }

    // Prioridade 1: Buscar pelo cliente da obra (contato_usuario_id)
    if (obra.clientes && obra.clientes.contato_usuario_id) {
      const { data: usuarioCliente, error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .select('id, nome, email, role')
        .eq('id', obra.clientes.contato_usuario_id)
        .single();

      if (!usuarioError && usuarioCliente) {
        return {
          id: usuarioCliente.id,
          nome: usuarioCliente.nome || obra.clientes.nome,
          email: usuarioCliente.email || obra.clientes.email,
          cargo: 'Cliente',
          role: usuarioCliente.role
        };
      }
    }

    // Prioridade 2: Buscar pelo responsavel_id da obra (se for um usuário)
    if (obra.responsavel_id) {
      const { data: responsavelUsuario, error: responsavelError } = await supabaseAdmin
        .from('usuarios')
        .select('id, nome, email, role')
        .eq('id', obra.responsavel_id)
        .single();

      if (!responsavelError && responsavelUsuario) {
        return {
          id: responsavelUsuario.id,
          nome: responsavelUsuario.nome || obra.responsavel_nome,
          email: responsavelUsuario.email,
          cargo: 'Responsável',
          role: responsavelUsuario.role
        };
      }
    }

    // Se não encontrou supervisor (cliente), retornar null
    console.warn(`[aprovacoes-helpers] Obra ${obra_id} não possui supervisor (cliente) definido`);
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
    
    // Enviar via WhatsApp
    try {
      const { enviarMensagemWebhook, buscarTelefoneWhatsAppUsuario } = await import('../services/whatsapp-service.js');
      const telefone = await buscarTelefoneWhatsAppUsuario(usuario_id);
      
      if (telefone) {
        const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
        const linkAprovacao = `${FRONTEND_URL}/aprovacaop/${aprovacao.id}`;
        
        const mensagemWhatsApp = `🔔 *${titulo}*

${mensagem}

🔗 Acesse: ${linkAprovacao}

---
_Sistema de Gestão de Gruas_`;

        await enviarMensagemWebhook(
          telefone,
          mensagemWhatsApp,
          linkAprovacao,
          {
            tipo: 'notificacao_aprovacao',
            aprovacao_id: aprovacao.id,
            destinatario_nome: `Usuário ${usuario_id}`
          }
        );
      }
    } catch (whatsappError) {
      // Não falhar a criação da notificação se WhatsApp falhar
      console.warn(`[aprovacoes-helpers] Erro ao enviar WhatsApp para usuário ${usuario_id}:`, whatsappError.message);
    }
    
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

    // Verificar se está dentro do prazo
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
  return Math.round(diffHoras * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * Verifica se um usuário tem permissão para aprovar (é supervisor)
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

