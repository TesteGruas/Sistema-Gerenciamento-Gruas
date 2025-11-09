import { supabaseAdmin } from '../config/supabase.js';
import { gerarTokenAprovacao } from '../utils/approval-tokens.js';
import { buscarFuncionario } from '../utils/aprovacoes-helpers.js';

const WHATSAPP_WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL || 'https://gsouzabd.app.n8n.cloud/webhook/irbana-notify';
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';

/**
 * Busca telefone WhatsApp do supervisor
 * @param {number} supervisor_id - ID do supervisor (usuário)
 * @returns {Promise<string|null>} - Telefone WhatsApp ou null
 */
async function buscarTelefoneWhatsAppSupervisor(supervisor_id) {
  try {
    // Primeiro, tentar buscar em funcionarios (se o supervisor for um funcionário)
    const { data: funcionario, error: funcError } = await supabaseAdmin
      .from('funcionarios')
      .select('telefone_whatsapp, telefone')
      .eq('user_id', supervisor_id)
      .single();
    
    if (!funcError && funcionario) {
      // Priorizar telefone_whatsapp, senão usar telefone comum
      const telefone = funcionario.telefone_whatsapp || funcionario.telefone;
      if (telefone) {
        return formatarTelefone(telefone);
      }
    }
    
    // Se não encontrou em funcionarios, buscar em usuarios (pode ter telefone direto)
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('telefone')
      .eq('id', supervisor_id)
      .single();
    
    if (!userError && usuario && usuario.telefone) {
      return formatarTelefone(usuario.telefone);
    }
    
    console.warn(`[whatsapp-service] Telefone WhatsApp não encontrado para supervisor ${supervisor_id}`);
    return null;
  } catch (error) {
    console.error('[whatsapp-service] Erro ao buscar telefone WhatsApp:', error);
    return null;
  }
}

/**
 * Formata telefone para formato internacional (5511999999999)
 * Remove caracteres especiais e adiciona código do país se necessário
 * @param {string} telefone - Telefone em qualquer formato
 * @returns {string} - Telefone formatado
 */
function formatarTelefone(telefone) {
  if (!telefone) return null;
  
  // Remover todos os caracteres não numéricos
  let numero = telefone.replace(/\D/g, '');
  
  // Se não começar com 55 (código do Brasil), adicionar
  if (!numero.startsWith('55')) {
    // Se começar com 0, remover
    if (numero.startsWith('0')) {
      numero = numero.substring(1);
    }
    numero = '55' + numero;
  }
  
  return numero;
}

/**
 * Formata mensagem de aprovação para WhatsApp
 * @param {Object} aprovacao - Dados da aprovação
 * @param {Object} funcionario - Dados do funcionário
 * @param {string} linkAprovacao - Link para aprovação
 * @returns {string} - Mensagem formatada
 */
function formatarMensagemAprovacao(aprovacao, funcionario, linkAprovacao) {
  const dataTrabalho = new Date(aprovacao.data_trabalho).toLocaleDateString('pt-BR');
  const horasExtras = parseFloat(aprovacao.horas_extras).toFixed(2);
  const nomeFuncionario = funcionario?.nome || `Funcionário #${aprovacao.funcionario_id}`;
  
  const mensagem = `🔔 *Nova Solicitação de Aprovação de Horas Extras*

👤 *Funcionário:* ${nomeFuncionario}
📅 *Data do Trabalho:* ${dataTrabalho}
⏰ *Horas Extras:* ${horasExtras}h
📋 *Status:* Pendente

⏳ *Prazo para aprovação:* 7 dias

Clique no link abaixo para aprovar ou rejeitar:

${linkAprovacao}

---
_Sistema de Gestão de Gruas_`;

  return mensagem;
}

/**
 * Envia mensagem de aprovação via WhatsApp (webhook Evolution API)
 * @param {Object} aprovacao - Dados da aprovação
 * @param {Object} supervisor - Dados do supervisor (opcional, será buscado se não fornecido)
 * @returns {Promise<Object>} - { sucesso: boolean, token: string|null, erro: string|null }
 */
export async function enviarMensagemAprovacao(aprovacao, supervisor = null) {
  try {
    // Buscar supervisor se não fornecido
    if (!supervisor) {
      const { data: supervisorData, error: supervisorError } = await supabaseAdmin
        .from('usuarios')
        .select('id, nome, email')
        .eq('id', aprovacao.supervisor_id)
        .single();
      
      if (supervisorError || !supervisorData) {
        console.error('[whatsapp-service] Supervisor não encontrado:', supervisorError);
        return {
          sucesso: false,
          token: null,
          erro: 'Supervisor não encontrado'
        };
      }
      
      supervisor = supervisorData;
    }
    
    // Buscar telefone WhatsApp do supervisor
    const telefone = await buscarTelefoneWhatsAppSupervisor(aprovacao.supervisor_id);
    
    if (!telefone) {
      console.warn(`[whatsapp-service] Telefone WhatsApp não disponível para supervisor ${aprovacao.supervisor_id}`);
      return {
        sucesso: false,
        token: null,
        erro: 'Telefone WhatsApp do supervisor não cadastrado'
      };
    }
    
    // Gerar token seguro para a aprovação
    const token = await gerarTokenAprovacao(aprovacao.id);
    
    // Buscar dados do funcionário
    const funcionario = await buscarFuncionario(aprovacao.funcionario_id);
    
    // Gerar link de aprovação
    const linkAprovacao = `${FRONTEND_URL}/aprovacaop/${aprovacao.id}?token=${token}`;
    
    // Formatar mensagem
    const mensagem = formatarMensagemAprovacao(aprovacao, funcionario, linkAprovacao);
    
    // Preparar payload para webhook
    const payload = {
      number: telefone,
      text: mensagem,
      link: linkAprovacao
    };
    
    // Enviar webhook para Evolution API via n8n
    let tentativas = 0;
    const maxTentativas = 3;
    let ultimoErro = null;
    
    while (tentativas < maxTentativas) {
      try {
        // Criar AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
        
        const response = await fetch(WHATSAPP_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json().catch(() => ({}));
        
        console.log(`[whatsapp-service] Mensagem enviada com sucesso para ${telefone}`);
        
        return {
          sucesso: true,
          token: token,
          erro: null,
          telefone: telefone
        };
      } catch (error) {
        tentativas++;
        ultimoErro = error;
        console.error(`[whatsapp-service] Tentativa ${tentativas}/${maxTentativas} falhou:`, error.message);
        
        // Aguardar antes de tentar novamente (exponential backoff)
        if (tentativas < maxTentativas) {
          await new Promise(resolve => setTimeout(resolve, 1000 * tentativas));
        }
      }
    }
    
    // Se todas as tentativas falharam
    console.error('[whatsapp-service] Falha ao enviar mensagem após', maxTentativas, 'tentativas');
    return {
      sucesso: false,
      token: token, // Token foi gerado mesmo se envio falhar
      erro: `Erro ao enviar mensagem: ${ultimoErro?.message || 'Erro desconhecido'}`
    };
  } catch (error) {
    console.error('[whatsapp-service] Erro ao enviar mensagem de aprovação:', error);
    return {
      sucesso: false,
      token: null,
      erro: error.message || 'Erro desconhecido'
    };
  }
}

