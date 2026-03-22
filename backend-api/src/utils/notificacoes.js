import { supabaseAdmin } from '../config/supabase.js';
import { getPublicFrontendUrl } from '../config/public-frontend-url.js';
import { enviarMensagemWebhook, buscarTelefoneWhatsAppUsuario } from '../services/whatsapp-service.js';
import { emitirNotificacao } from '../server.js';

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
      const baseUrl = getPublicFrontendUrl();
      const linkCompleto = link 
        ? (link.startsWith('http') ? link : `${baseUrl}${link}`)
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
    // VALIDAÇÃO: Verificar se o gestor tem usuario_id válido
    const usuarioId = gestor.usuario_id || gestor.id;

    if (!usuarioId) {
      console.warn(`[criarNotificacaoAprovacao] Gestor ${gestor.nome} (ID: ${gestor.id}) não possui usuario_id válido`);
      return; // Não criar notificação se não houver usuario_id
    }

    // Verificar se o usuário existe na tabela usuarios
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('id', usuarioId)
      .single();

    if (usuarioError || !usuario) {
      console.warn(`[criarNotificacaoAprovacao] Usuário ${usuarioId} não encontrado na tabela usuarios`);
      return; // Não criar notificação se o usuário não existir
    }

    const titulo = 'Aprovação de Horas Extras';
    const mensagem = `${registro.funcionario.nome} tem ${registro.horas_extras}h extras para aprovar`;
    const link = `/pwa/aprovacoes/${registro.id}`;

    const { data: notificacaoData, error } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: usuarioId,
        tipo: 'warning',
        titulo,
        mensagem,
        link,
        lida: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar notificação de aprovação:', error);
      throw error;
    }

    console.log(`Notificação de aprovação criada para gestor ${gestor.nome} (usuario_id: ${usuarioId})`);
    
    // Emitir via WebSocket (tempo real)
    if (notificacaoData) {
      try {
        emitirNotificacao(usuarioId, {
          id: String(notificacaoData.id),
          titulo,
          mensagem,
          tipo: 'warning',
          link,
          lida: false,
          data: notificacaoData.created_at,
          remetente: 'Sistema'
        })
      } catch (wsError) {
        console.error('Erro ao emitir WebSocket:', wsError.message)
      }
    }
    
    // Enviar via WhatsApp
    await enviarNotificacaoWhatsApp(usuarioId, titulo, mensagem, link);
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

    const { data: notificacaoData, error } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: registro.funcionario_id,
        tipo,
        titulo,
        mensagem,
        link,
        lida: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar notificação de resultado:', error);
      throw error;
    }

    console.log(`Notificação de resultado criada para funcionário ${registro.funcionario.nome}`);
    
    // Emitir via WebSocket (tempo real)
    if (notificacaoData) {
      try {
        emitirNotificacao(registro.funcionario_id, {
          id: String(notificacaoData.id),
          titulo,
          mensagem,
          tipo,
          link,
          lida: false,
          data: notificacaoData.created_at,
          remetente: gestor.nome || 'Sistema'
        })
      } catch (wsError) {
        console.error('Erro ao emitir WebSocket:', wsError.message)
      }
    }
    
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
    // VALIDAÇÃO: Verificar se o gestor tem usuario_id válido
    const usuarioId = gestor.usuario_id || gestor.id;

    if (!usuarioId) {
      console.warn(`[criarNotificacaoLembrete] Gestor ${gestor.nome} (ID: ${gestor.id}) não possui usuario_id válido`);
      return; // Não criar notificação se não houver usuario_id
    }

    // Verificar se o usuário existe na tabela usuarios
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('id', usuarioId)
      .single();

    if (usuarioError || !usuario) {
      console.warn(`[criarNotificacaoLembrete] Usuário ${usuarioId} não encontrado na tabela usuarios`);
      return; // Não criar notificação se o usuário não existir
    }

    const titulo = 'Lembrete: Aprovação Pendente';
    const mensagem = `Lembrete: ${registro.funcionario.nome} ainda tem ${registro.horas_extras}h extras aguardando aprovação há mais de 1 dia`;
    const link = `/pwa/aprovacoes/${registro.id}`;

    const { data: notificacaoData, error } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: usuarioId,
        tipo: 'info',
        titulo,
        mensagem,
        link,
        lida: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar notificação de lembrete:', error);
      throw error;
    }

    console.log(`Notificação de lembrete criada para gestor ${gestor.nome} (usuario_id: ${usuarioId})`);
    
    // Emitir via WebSocket (tempo real)
    if (notificacaoData) {
      try {
        emitirNotificacao(usuarioId, {
          id: String(notificacaoData.id),
          titulo,
          mensagem,
          tipo: 'info',
          link,
          lida: false,
          data: notificacaoData.created_at,
          remetente: 'Sistema'
        })
      } catch (wsError) {
        console.error('Erro ao emitir WebSocket:', wsError.message)
      }
    }
    
    // Enviar via WhatsApp
    await enviarNotificacaoWhatsApp(usuarioId, titulo, mensagem, link);
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

    // Filtrar apenas registros com funcionário que tem obra_atual_id não nulo
    const registrosComObra = (data || []).filter(registro => {
      const obraId = registro.funcionario?.obra_atual_id;
      return obraId !== null && obraId !== undefined && obraId !== 'null';
    });

    return registrosComObra;
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
    // VALIDAÇÃO: Verificar se obraId é válido
    if (!obraId || obraId === null || obraId === 'null' || obraId === undefined) {
      console.warn(`[buscarGestoresPorObra] obraId inválido: ${obraId}`);
      return [];
    }

    // Converter para número se necessário
    const obraIdNumero = typeof obraId === 'string' ? parseInt(obraId, 10) : obraId;

    if (isNaN(obraIdNumero) || obraIdNumero <= 0) {
      console.warn(`[buscarGestoresPorObra] Não foi possível converter obraId para número válido: ${obraId}`);
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('funcionarios')
      .select(`
        id, 
        nome, 
        cargo, 
        email,
        usuarios:usuarios!funcionario_id(id)
      `)
      .eq('obra_atual_id', obraIdNumero)
      .eq('status', 'Ativo')
      .in('cargo', ['Supervisor', 'Técnico Manutenção', 'Gerente', 'Coordenador']);

    if (error) {
      console.error('Erro ao buscar gestores por obra:', error);
      throw error;
    }

    // Mapear resultado para incluir usuario_id
    const gestoresComUsuario = (data || []).map(gestor => ({
      id: gestor.id,
      nome: gestor.nome,
      cargo: gestor.cargo,
      email: gestor.email,
      usuario_id: gestor.usuarios?.[0]?.id || null
    }));

    return gestoresComUsuario;
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
        // VALIDAÇÃO: Verificar se o funcionário tem obra_atual_id válido
        const obraId = registro.funcionario?.obra_atual_id;
        
        if (!obraId || obraId === null || obraId === 'null' || obraId === undefined) {
          console.warn(`[enviarLembretesAprovacao] Registro ${registro.id}: Funcionário ${registro.funcionario?.nome || 'N/A'} sem obra atribuída, pulando...`);
          continue; // Pular este registro
        }
        
        // Buscar gestores da obra do funcionário
        const gestores = await buscarGestoresPorObra(obraId);
        
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
