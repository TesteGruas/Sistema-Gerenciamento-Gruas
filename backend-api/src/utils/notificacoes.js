import { supabaseAdmin } from '../config/supabase.js';
import { enviarMensagemWebhook, buscarTelefoneWhatsAppUsuario } from '../services/whatsapp-service.js';

/**
 * Cria uma notificação de aprovação de horas extras para o gestor
 * @param {Object} registro - Dados do registro de ponto
 * @param {Object} gestor - Dados do gestor
 */
/**
 * Função auxiliar para enviar notificação via WhatsApp
 * @param {number} usuario_id - ID do usuário destinatário
 * @param {string} titulo - Título da notificação
 * @param {string} mensagem - Mensagem da notificação
 * @param {string} link - Link opcional
 */
async function enviarNotificacaoWhatsApp(usuario_id, titulo, mensagem, link = null) {
  try {
    const telefone = await buscarTelefoneWhatsAppUsuario(usuario_id);
    
    if (telefone) {
      const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
      const linkCompleto = link 
        ? (link.startsWith('http') ? link : `${FRONTEND_URL}${link}`)
        : null;
      
      const mensagemWhatsApp = `🔔 *${titulo}*

${mensagem}

${linkCompleto ? `\n🔗 Acesse: ${linkCompleto}` : ''}

---
_Sistema de Gestão de Gruas_`;

      await enviarMensagemWebhook(
        telefone,
        mensagemWhatsApp,
        linkCompleto,
        {
          tipo: 'notificacao',
          destinatario_nome: `Usuário ${usuario_id}`
        }
      );
    }
  } catch (error) {
    // Não falhar a criação da notificação se WhatsApp falhar
    console.warn(`[notificacoes] Erro ao enviar WhatsApp para usuário ${usuario_id}:`, error.message);
  }
}

export async function criarNotificacaoAprovacao(registro, gestor) {
  try {
    const titulo = 'Aprovação de Horas Extras';
    const mensagem = `${registro.funcionario.nome} tem ${registro.horas_extras}h extras para aprovar`;
    const link = `/pwa/aprovacoes/${registro.id}`;

    const { error } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: gestor.id,
        tipo: 'warning',
        titulo,
        mensagem,
        link,
        lida: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao criar notificação de aprovação:', error);
      throw error;
    }

    console.log(`Notificação de aprovação criada para gestor ${gestor.nome}`);
    
    // Enviar via WhatsApp
    await enviarNotificacaoWhatsApp(gestor.id, titulo, mensagem, link);
  } catch (error) {
    console.error('Erro na função criarNotificacaoAprovacao:', error);
    throw error;
  }
}

/**
 * Cria uma notificação de resultado da aprovação para o funcionário
 * @param {Object} registro - Dados do registro de ponto
 * @param {string} resultado - 'aprovado' ou 'rejeitado'
 * @param {Object} gestor - Dados do gestor que aprovou/rejeitou
 */
export async function criarNotificacaoResultado(registro, resultado, gestor) {
  try {
    const tipo = resultado === 'aprovado' ? 'success' : 'error';
    const titulo = resultado === 'aprovado' ? 'Horas Extras Aprovadas' : 'Horas Extras Rejeitadas';
    const mensagem = resultado === 'aprovado' 
      ? `Suas horas extras de ${registro.data} foram aprovadas por ${gestor.nome}`
      : `Suas horas extras de ${registro.data} foram rejeitadas por ${gestor.nome}`;
    const link = `/dashboard/ponto`;

    const { error } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: registro.funcionario_id,
        tipo,
        titulo,
        mensagem,
        link,
        lida: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao criar notificação de resultado:', error);
      throw error;
    }

    console.log(`Notificação de resultado criada para funcionário ${registro.funcionario.nome}`);
    
    // Enviar via WhatsApp
    await enviarNotificacaoWhatsApp(registro.funcionario_id, titulo, mensagem, link);
  } catch (error) {
    console.error('Erro na função criarNotificacaoResultado:', error);
    throw error;
  }
}

/**
 * Cria uma notificação de lembrete para gestores com aprovações pendentes
 * @param {Object} registro - Dados do registro de ponto
 * @param {Object} gestor - Dados do gestor
 */
export async function criarNotificacaoLembrete(registro, gestor) {
  try {
    const titulo = 'Lembrete: Aprovação Pendente';
    const mensagem = `Lembrete: ${registro.funcionario.nome} ainda tem ${registro.horas_extras}h extras aguardando aprovação há mais de 1 dia`;
    const link = `/pwa/aprovacoes/${registro.id}`;

    const { error } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: gestor.id,
        tipo: 'info',
        titulo,
        mensagem,
        link,
        lida: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao criar notificação de lembrete:', error);
      throw error;
    }

    console.log(`Notificação de lembrete criada para gestor ${gestor.nome}`);
    
    // Enviar via WhatsApp
    await enviarNotificacaoWhatsApp(gestor.id, titulo, mensagem, link);
  } catch (error) {
    console.error('Erro na função criarNotificacaoLembrete:', error);
    throw error;
  }
}

/**
 * Busca registros pendentes de aprovação há mais de 1 dia
 * @returns {Array} Lista de registros pendentes
 */
export async function buscarRegistrosPendentesAntigos() {
  try {
    const umDiaAtras = new Date();
    umDiaAtras.setDate(umDiaAtras.getDate() - 1);

    const { data, error } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, obra_atual_id)
      `)
      .eq('status', 'Pendente Aprovação')
      .lt('created_at', umDiaAtras.toISOString());

    if (error) {
      console.error('Erro ao buscar registros pendentes antigos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro na função buscarRegistrosPendentesAntigos:', error);
    throw error;
  }
}

/**
 * Busca gestores de uma obra específica
 * @param {number} obraId - ID da obra
 * @returns {Array} Lista de gestores da obra
 */
export async function buscarGestoresPorObra(obraId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, email')
      .eq('obra_atual_id', obraId)
      .eq('status', 'Ativo')
      .in('cargo', ['Supervisor', 'Técnico Manutenção', 'Gerente', 'Coordenador']);

    if (error) {
      console.error('Erro ao buscar gestores por obra:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro na função buscarGestoresPorObra:', error);
    throw error;
  }
}

/**
 * Envia notificações de lembrete para todos os registros pendentes antigos
 */
export async function enviarLembretesAprovacao() {
  try {
    console.log('Iniciando envio de lembretes de aprovação...');
    
    const registrosPendentes = await buscarRegistrosPendentesAntigos();
    
    if (registrosPendentes.length === 0) {
      console.log('Nenhum registro pendente antigo encontrado');
      return;
    }

    console.log(`Encontrados ${registrosPendentes.length} registros pendentes antigos`);

    for (const registro of registrosPendentes) {
      try {
        // Buscar gestores da obra do funcionário
        const gestores = await buscarGestoresPorObra(registro.funcionario.obra_atual_id);
        
        // Enviar lembrete para cada gestor
        for (const gestor of gestores) {
          await criarNotificacaoLembrete(registro, gestor);
        }
      } catch (error) {
        console.error(`Erro ao processar registro ${registro.id}:`, error);
        // Continuar com os próximos registros mesmo se um falhar
      }
    }

    console.log('Envio de lembretes concluído');
  } catch (error) {
    console.error('Erro na função enviarLembretesAprovacao:', error);
    throw error;
  }
}
