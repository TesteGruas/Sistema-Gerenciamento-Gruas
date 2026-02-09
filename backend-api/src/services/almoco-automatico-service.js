import { supabaseAdmin } from '../config/supabase.js';
import { enviarMensagemWebhook } from './whatsapp-service.js';
import { buscarTelefoneWhatsAppUsuario } from './whatsapp-service.js';

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';

// Função auxiliar para emitir notificação via WebSocket (opcional)
async function tentarEmitirNotificacao(usuarioId, notificacao) {
  // Se SKIP_SERVER_IMPORT estiver definido, não tentar importar
  if (process.env.SKIP_SERVER_IMPORT === 'true') {
    return false;
  }
  
  try {
    // Import dinâmico apenas quando necessário
    const { emitirNotificacao } = await import('../server.js');
    emitirNotificacao(usuarioId, notificacao);
    return true;
  } catch (error) {
    // Se falhar (servidor já rodando ou outro erro), continuar sem WebSocket
    return false;
  }
}

/**
 * Busca funcionários que precisam receber notificação de almoço
 * Critérios:
 * - Têm entrada registrada hoje
 * - Não têm saída de almoço registrada
 * - Não receberam notificação hoje ainda
 * - Estão ativos
 */
export async function buscarFuncionariosParaNotificacaoAlmoco() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    console.log(`[almoco-automatico] 🔍 Buscando funcionários para notificação de almoço - ${hoje} ${horaAtual}`);
    
    // Buscar registros de ponto de hoje com entrada mas sem saída de almoço
    const { data: registros, error: registrosError } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        id,
        funcionario_id,
        data,
        entrada,
        saida_almoco,
        volta_almoco,
        saida,
        funcionario:funcionarios!fk_registros_ponto_funcionario(
          id,
          nome,
          telefone,
          status,
          usuario_id
        )
      `)
      .eq('data', hoje)
      .not('entrada', 'is', null)
      .is('saida_almoco', null)
      .is('volta_almoco', null);
    
    if (registrosError) {
      console.error('[almoco-automatico] ❌ Erro ao buscar registros:', registrosError);
      return [];
    }
    
    if (!registros || registros.length === 0) {
      console.log('[almoco-automatico] ℹ️ Nenhum registro encontrado para notificação');
      return [];
    }
    
    console.log(`[almoco-automatico] 📋 Encontrados ${registros.length} registros sem saída de almoço`);
    
    // Verificar quais já receberam notificação hoje
    const { data: notificacoesHoje, error: notifError } = await supabaseAdmin
      .from('notificacoes_almoco')
      .select('registro_ponto_id, funcionario_id')
      .eq('data', hoje)
      .in('status', ['enviada', 'respondida']);
    
    if (notifError) {
      console.error('[almoco-automatico] ❌ Erro ao buscar notificações:', notifError);
    }
    
    const idsComNotificacao = new Set(
      (notificacoesHoje || []).map(n => `${n.registro_ponto_id}_${n.funcionario_id}`)
    );
    
    // Filtrar registros que ainda não receberam notificação
    const registrosParaNotificar = registros.filter(r => {
      const chave = `${r.id}_${r.funcionario_id}`;
      const funcionario = r.funcionario;
      
      // Verificar se funcionário está ativo
      if (!funcionario || funcionario.status !== 'Ativo') {
        return false;
      }
      
      // Verificar se já recebeu notificação
      if (idsComNotificacao.has(chave)) {
        return false;
      }
      
      return true;
    });
    
    console.log(`[almoco-automatico] ✅ ${registrosParaNotificar.length} funcionários precisam receber notificação`);
    
    return registrosParaNotificar;
  } catch (error) {
    console.error('[almoco-automatico] ❌ Erro ao buscar funcionários:', error);
    return [];
  }
}

/**
 * Envia notificação de almoço via WhatsApp para um funcionário
 */
export async function enviarNotificacaoAlmoco(registro) {
  try {
    const funcionario = registro.funcionario;
    if (!funcionario) {
      console.error('[almoco-automatico] ❌ Funcionário não encontrado no registro');
      return { sucesso: false, erro: 'Funcionário não encontrado' };
    }
    
    // Buscar telefone WhatsApp do funcionário
    let telefone = funcionario.telefone;
    
    // Se não tiver telefone direto, buscar via usuário
    if (!telefone && funcionario.usuario_id) {
      const telefoneUsuario = await buscarTelefoneWhatsAppUsuario(funcionario.usuario_id);
      telefone = telefoneUsuario;
    }
    
    if (!telefone) {
      console.warn(`[almoco-automatico] ⚠️ Telefone não encontrado para funcionário ${funcionario.nome}`);
      return { sucesso: false, erro: 'Telefone não encontrado' };
    }
    
    // Formatar telefone (remover caracteres não numéricos, exceto +)
    telefone = telefone.replace(/[^\d+]/g, '');
    if (!telefone.startsWith('+')) {
      telefone = '+55' + telefone; // Adicionar código do Brasil se não tiver
    }
    
    const hoje = new Date().toISOString().split('T')[0];
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Criar mensagem com opções de resposta
    const mensagem = `🍽️ *Notificação de Almoço*

Olá, ${funcionario.nome}!

Está se aproximando o horário de almoço (12:00).

*Como você prefere?*

Responda com:
• *PAUSA* - Para parada para almoço
• *CORRIDO* - Para trabalho corrido (sem pausa)

⚠️ Se não responder até 12:00, será registrado como pausa para almoço.

---
_Sistema de Gestão de Gruas_`;
    
    // Enviar mensagem via WhatsApp
    const resultado = await enviarMensagemWebhook(
      telefone,
      mensagem,
      null,
      {
        tipo: 'notificacao_almoco',
        registro_ponto_id: registro.id
      }
    );
    
    if (resultado.sucesso) {
      // Registrar notificação de almoço no banco
      const { error: insertError } = await supabaseAdmin
        .from('notificacoes_almoco')
        .insert({
          registro_ponto_id: registro.id,
          funcionario_id: funcionario.id,
          data: hoje,
          hora_notificacao: horaAtual,
          telefone_destino: telefone,
          mensagem_enviada: mensagem,
          status: 'enviada',
          resposta: 'nao_respondido'
        });
      
      if (insertError) {
        console.error('[almoco-automatico] ❌ Erro ao registrar notificação:', insertError);
      } else {
        console.log(`[almoco-automatico] ✅ Notificação registrada para ${funcionario.nome}`);
      }

      // Criar notificação no app (tabela notificacoes) se o funcionário tiver usuario_id
      if (funcionario.usuario_id) {
        try {
          const tituloNotificacao = '🍽️ Notificação de Almoço';
          const mensagemNotificacao = `Olá, ${funcionario.nome}!\n\nEstá se aproximando o horário de almoço (12:00).\n\nComo você prefere?\n\n• PAUSA - Para parada para almoço\n• CORRIDO - Para trabalho corrido (sem pausa)\n\n⚠️ Se não responder até 12:00, será registrado como pausa para almoço.`;

          // Criar notificação no banco
          const { data: notificacaoApp, error: notifAppError } = await supabaseAdmin
            .from('notificacoes')
            .insert({
              titulo: tituloNotificacao,
              mensagem: mensagemNotificacao,
              tipo: 'info',
              usuario_id: funcionario.usuario_id,
              link: '/pwa/ponto',
              icone: '🍽️',
              lida: false,
              remetente: 'Sistema',
              destinatarios: []
            })
            .select()
            .single();

          if (notifAppError) {
            console.error('[almoco-automatico] ❌ Erro ao criar notificação no app:', notifAppError);
          } else {
            console.log(`[almoco-automatico] ✅ Notificação criada no app para ${funcionario.nome}`);
            
            // Emitir notificação via WebSocket para tempo real (se disponível)
            const wsEnviado = await tentarEmitirNotificacao(funcionario.usuario_id, {
              id: String(notificacaoApp.id),
              titulo: tituloNotificacao,
              mensagem: mensagemNotificacao,
              tipo: 'info',
              link: '/pwa/ponto',
              lida: false,
              data: notificacaoApp.data || notificacaoApp.created_at,
              remetente: 'Sistema',
              destinatarios: []
            });
            
            if (wsEnviado) {
              console.log(`[almoco-automatico] ✅ Notificação WebSocket emitida para ${funcionario.nome}`);
            } else {
              console.log(`[almoco-automatico] ℹ️ WebSocket não disponível (servidor pode já estar rodando ou em modo de teste)`);
            }
          }
        } catch (error) {
          console.error('[almoco-automatico] ⚠️ Erro ao criar notificação no app:', error);
          // Não falhar o processo se a notificação do app falhar
        }
      }
    }
    
    return resultado;
  } catch (error) {
    console.error('[almoco-automatico] ❌ Erro ao enviar notificação:', error);
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Envia notificações de almoço para todos os funcionários que precisam
 */
export async function enviarNotificacoesAlmoco() {
  try {
    console.log('[almoco-automatico] 🚀 Iniciando envio de notificações de almoço...');
    
    const funcionarios = await buscarFuncionariosParaNotificacaoAlmoco();
    
    if (funcionarios.length === 0) {
      console.log('[almoco-automatico] ℹ️ Nenhum funcionário precisa receber notificação');
      return {
        sucesso: true,
        enviados: 0,
        erros: []
      };
    }
    
    const resultados = {
      sucesso: true,
      enviados: 0,
      erros: []
    };
    
    // Enviar notificação para cada funcionário
    for (const registro of funcionarios) {
      const resultado = await enviarNotificacaoAlmoco(registro);
      
      if (resultado.sucesso) {
        resultados.enviados++;
        console.log(`[almoco-automatico] ✅ Notificação enviada para ${registro.funcionario.nome}`);
      } else {
        resultados.erros.push({
          funcionario: registro.funcionario.nome,
          erro: resultado.erro
        });
        console.error(`[almoco-automatico] ❌ Erro ao enviar para ${registro.funcionario.nome}:`, resultado.erro);
      }
      
      // Pequeno delay entre envios para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`[almoco-automatico] ✅ Processo concluído: ${resultados.enviados} enviados, ${resultados.erros.length} erros`);
    
    return resultados;
  } catch (error) {
    console.error('[almoco-automatico] ❌ Erro no processo de envio:', error);
    return {
      sucesso: false,
      enviados: 0,
      erros: [{ erro: error.message }]
    };
  }
}

/**
 * Registra saída de almoço automaticamente às 12:00
 * Para funcionários que não responderam ou escolheram "pausa"
 */
export async function registrarAlmocoAutomatico() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const horaAlmoco = '12:00';
    
    console.log(`[almoco-automatico] 🍽️ Registrando almoço automático - ${hoje} ${horaAlmoco}`);
    
    // Buscar registros de hoje com entrada mas sem saída de almoço
    const { data: registros, error: registrosError } = await supabaseAdmin
      .from('registros_ponto')
      .select('id, funcionario_id, data, entrada, saida_almoco, trabalho_corrido')
      .eq('data', hoje)
      .not('entrada', 'is', null)
      .is('saida_almoco', null);
    
    if (registrosError) {
      console.error('[almoco-automatico] ❌ Erro ao buscar registros:', registrosError);
      return { sucesso: false, registrados: 0, erros: [] };
    }
    
    if (!registros || registros.length === 0) {
      console.log('[almoco-automatico] ℹ️ Nenhum registro para processar');
      return { sucesso: true, registrados: 0, erros: [] };
    }
    
    // Verificar notificações para saber quem escolheu trabalho corrido
    const { data: notificacoes, error: notifError } = await supabaseAdmin
      .from('notificacoes_almoco')
      .select('registro_ponto_id, resposta')
      .eq('data', hoje)
      .in('resposta', ['pausa', 'trabalho_corrido']);
    
    if (notifError) {
      console.error('[almoco-automatico] ❌ Erro ao buscar notificações:', notifError);
    }
    
    const trabalhoCorridoPorRegistro = new Map();
    (notificacoes || []).forEach(n => {
      if (n.resposta === 'trabalho_corrido') {
        trabalhoCorridoPorRegistro.set(n.registro_ponto_id, true);
      }
    });
    
    const resultados = {
      sucesso: true,
      registrados: 0,
      trabalho_corrido: 0,
      erros: []
    };
    
    // Processar cada registro
    for (const registro of registros) {
      const isTrabalhoCorrido = trabalhoCorridoPorRegistro.get(registro.id) || false;
      
      if (isTrabalhoCorrido) {
        // Marcar como trabalho corrido (não registra saída de almoço)
        const { error: updateError } = await supabaseAdmin
          .from('registros_ponto')
          .update({
            trabalho_corrido: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', registro.id);
        
        if (updateError) {
          resultados.erros.push({
            registro_id: registro.id,
            erro: updateError.message
          });
        } else {
          resultados.trabalho_corrido++;
          console.log(`[almoco-automatico] ✅ Trabalho corrido marcado para registro ${registro.id}`);
        }
      } else {
        // Registrar saída de almoço automaticamente
        const { error: updateError } = await supabaseAdmin
          .from('registros_ponto')
          .update({
            saida_almoco: horaAlmoco,
            updated_at: new Date().toISOString()
          })
          .eq('id', registro.id);
        
        if (updateError) {
          resultados.erros.push({
            registro_id: registro.id,
            erro: updateError.message
          });
        } else {
          resultados.registrados++;
          console.log(`[almoco-automatico] ✅ Almoço registrado automaticamente para registro ${registro.id}`);
        }
      }
    }
    
    console.log(`[almoco-automatico] ✅ Processo concluído: ${resultados.registrados} almoços registrados, ${resultados.trabalho_corrido} trabalho corrido`);
    
    return resultados;
  } catch (error) {
    console.error('[almoco-automatico] ❌ Erro ao registrar almoço automático:', error);
    return {
      sucesso: false,
      registrados: 0,
      trabalho_corrido: 0,
      erros: [{ erro: error.message }]
    };
  }
}

/**
 * Processa resposta do funcionário via WhatsApp
 */
export async function processarRespostaAlmoco(telefone, mensagem, registroPontoId = null) {
  try {
    // Normalizar telefone
    telefone = telefone.replace(/[^\d+]/g, '');
    if (!telefone.startsWith('+')) {
      telefone = '+55' + telefone;
    }
    
    // Normalizar mensagem
    const mensagemNormalizada = mensagem.trim().toUpperCase();
    
    // Identificar resposta
    let resposta = null;
    if (mensagemNormalizada.includes('PAUSA') || mensagemNormalizada.includes('PARAR')) {
      resposta = 'pausa';
    } else if (mensagemNormalizada.includes('CORRIDO') || mensagemNormalizada.includes('TRABALHO CORRIDO')) {
      resposta = 'trabalho_corrido';
    } else {
      return { sucesso: false, erro: 'Resposta não reconhecida' };
    }
    
    const hoje = new Date().toISOString().split('T')[0];
    
    // Buscar notificação correspondente
    let query = supabaseAdmin
      .from('notificacoes_almoco')
      .select('id, registro_ponto_id, funcionario_id, status')
      .eq('data', hoje)
      .eq('telefone_destino', telefone)
      .eq('status', 'enviada');
    
    if (registroPontoId) {
      query = query.eq('registro_ponto_id', registroPontoId);
    }
    
    const { data: notificacoes, error: notifError } = await query.order('created_at', { ascending: false }).limit(1);
    
    if (notifError || !notificacoes || notificacoes.length === 0) {
      console.warn('[almoco-automatico] ⚠️ Notificação não encontrada para telefone:', telefone);
      return { sucesso: false, erro: 'Notificação não encontrada' };
    }
    
    const notificacao = notificacoes[0];
    
    // Atualizar notificação
    const { error: updateError } = await supabaseAdmin
      .from('notificacoes_almoco')
      .update({
        resposta: resposta,
        status: 'respondida',
        resposta_recebida_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', notificacao.id);
    
    if (updateError) {
      console.error('[almoco-automatico] ❌ Erro ao atualizar notificação:', updateError);
      return { sucesso: false, erro: updateError.message };
    }
    
    // Se for trabalho corrido, marcar no registro
    if (resposta === 'trabalho_corrido') {
      const { error: registroError } = await supabaseAdmin
        .from('registros_ponto')
        .update({
          trabalho_corrido: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificacao.registro_ponto_id);
      
      if (registroError) {
        console.error('[almoco-automatico] ❌ Erro ao marcar trabalho corrido:', registroError);
      }
    }
    
    console.log(`[almoco-automatico] ✅ Resposta processada: ${resposta} para registro ${notificacao.registro_ponto_id}`);
    
    return {
      sucesso: true,
      resposta: resposta,
      registro_ponto_id: notificacao.registro_ponto_id
    };
  } catch (error) {
    console.error('[almoco-automatico] ❌ Erro ao processar resposta:', error);
    return { sucesso: false, erro: error.message };
  }
}

