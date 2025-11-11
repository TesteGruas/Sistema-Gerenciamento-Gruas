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
 * Busca telefone WhatsApp do cliente
 * @param {number} cliente_id - ID do cliente
 * @returns {Promise<string|null>} - Telefone WhatsApp ou null
 */
async function buscarTelefoneWhatsAppCliente(cliente_id) {
  try {
    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .select('telefone')
      .eq('id', cliente_id)
      .single();
    
    if (!error && cliente && cliente.telefone) {
      return formatarTelefone(cliente.telefone);
    }
    
    console.warn(`[whatsapp-service] Telefone WhatsApp não encontrado para cliente ${cliente_id}`);
    return null;
  } catch (error) {
    console.error('[whatsapp-service] Erro ao buscar telefone WhatsApp do cliente:', error);
    return null;
  }
}

/**
 * Busca telefone WhatsApp do gestor (funcionário ou usuário)
 * @param {number} gestor_id - ID do gestor (pode ser funcionario_id ou user_id)
 * @param {boolean} isFuncionario - Se true, busca em funcionarios, senão em usuarios
 * @returns {Promise<string|null>} - Telefone WhatsApp ou null
 */
async function buscarTelefoneWhatsAppGestor(gestor_id, isFuncionario = false) {
  try {
    if (isFuncionario) {
      // Buscar em funcionarios
      const { data: funcionario, error: funcError } = await supabaseAdmin
        .from('funcionarios')
        .select('telefone_whatsapp, telefone, user_id')
        .eq('id', gestor_id)
        .single();
      
      if (funcError) {
        console.warn(`[whatsapp-service] Erro ao buscar funcionário ${gestor_id}:`, funcError);
      }
      
      if (!funcError && funcionario) {
        console.log(`[whatsapp-service] Funcionário encontrado: ${funcionario.telefone_whatsapp || funcionario.telefone || 'sem telefone'}`);
        const telefone = funcionario.telefone_whatsapp || funcionario.telefone;
        if (telefone) {
          const telefoneFormatado = formatarTelefone(telefone);
          console.log(`[whatsapp-service] Telefone formatado: ${telefone} -> ${telefoneFormatado}`);
          return telefoneFormatado;
        }
        
        // Se não tem telefone no funcionario, tentar buscar no usuario vinculado
        if (funcionario.user_id) {
          const { data: usuario, error: userError } = await supabaseAdmin
            .from('usuarios')
            .select('telefone')
            .eq('id', funcionario.user_id)
            .single();
          
          if (!userError && usuario && usuario.telefone) {
            const telefoneFormatado = formatarTelefone(usuario.telefone);
            console.log(`[whatsapp-service] Telefone encontrado no usuário vinculado: ${telefoneFormatado}`);
            return telefoneFormatado;
          }
        }
      }
    } else {
      // Buscar em usuarios
      const { data: usuario, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('telefone')
        .eq('id', gestor_id)
        .single();
      
      if (!userError && usuario && usuario.telefone) {
        const telefoneFormatado = formatarTelefone(usuario.telefone);
        console.log(`[whatsapp-service] Telefone encontrado no usuário: ${telefoneFormatado}`);
        return telefoneFormatado;
      }
    }
    
    console.warn(`[whatsapp-service] Telefone WhatsApp não encontrado para gestor ${gestor_id} (isFuncionario: ${isFuncionario})`);
    return null;
  } catch (error) {
    console.error('[whatsapp-service] Erro ao buscar telefone WhatsApp do gestor:', error);
    return null;
  }
}

/**
 * Busca gestores responsáveis de uma obra
 * @param {number} obra_id - ID da obra
 * @returns {Promise<Array>} - Lista de gestores com seus dados
 */
async function buscarGestoresObra(obra_id) {
  try {
    const gestores = [];
    
    // Buscar obra para pegar responsavel_id
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('responsavel_id, responsavel_nome')
      .eq('id', obra_id)
      .single();
    
    if (!obraError && obra && obra.responsavel_id) {
      // Adicionar responsável da obra
      // Primeiro tentar buscar em funcionarios (responsavel_id pode ser funcionario_id)
      const { data: responsavelFunc, error: respFuncError } = await supabaseAdmin
        .from('funcionarios')
        .select('id, nome, telefone, telefone_whatsapp, user_id')
        .eq('id', obra.responsavel_id)
        .single();
      
      if (!respFuncError && responsavelFunc) {
        // Responsável é um funcionário
        gestores.push({
          id: responsavelFunc.id,
          nome: responsavelFunc.nome || obra.responsavel_nome,
          tipo: 'responsavel',
          isFuncionario: true
        });
      } else {
        // Se não encontrou em funcionarios, tentar em usuarios
        const { data: responsavel, error: respError } = await supabaseAdmin
          .from('usuarios')
          .select('id, nome, email')
          .eq('id', obra.responsavel_id)
          .single();
        
        if (!respError && responsavel) {
          gestores.push({
            id: responsavel.id,
            nome: responsavel.nome || obra.responsavel_nome,
            tipo: 'responsavel',
            isFuncionario: false
          });
        }
      }
    }
    
    // Buscar funcionários gestores alocados na obra via funcionarios_obras
    const { data: funcionariosObra, error: funcObraError } = await supabaseAdmin
      .from('funcionarios_obras')
      .select(`
        funcionario_id,
        funcionarios(
          id,
          nome,
          cargo,
          user_id,
          telefone_whatsapp,
          telefone
        )
      `)
      .eq('obra_id', obra_id)
      .eq('status', 'ativo');
    
    if (!funcObraError && funcionariosObra) {
      for (const fo of funcionariosObra) {
        // funcionarios pode ser um objeto ou array dependendo da relação
        const funcionario = Array.isArray(fo.funcionarios) ? fo.funcionarios[0] : fo.funcionarios;
        if (funcionario && ['Supervisor', 'Técnico Manutenção', 'Gerente', 'Coordenador'].includes(funcionario.cargo)) {
          // Verificar se já não foi adicionado (evitar duplicatas)
          const jaExiste = gestores.some(g => 
            (g.isFuncionario && g.id === funcionario.id) || 
            (!g.isFuncionario && g.id === funcionario.user_id)
          );
          
          if (!jaExiste) {
            gestores.push({
              id: funcionario.id,
              nome: funcionario.nome,
              cargo: funcionario.cargo,
              tipo: 'gestor',
              isFuncionario: true
            });
          }
        }
      }
    }
    
    // Também buscar gestores via obra_atual_id (compatibilidade)
    const { data: funcionariosObraAtual, error: funcObraAtualError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, user_id, telefone_whatsapp, telefone')
      .eq('obra_atual_id', obra_id)
      .eq('status', 'Ativo')
      .in('cargo', ['Supervisor', 'Técnico Manutenção', 'Gerente', 'Coordenador']);
    
    if (!funcObraAtualError && funcionariosObraAtual) {
      for (const funcionario of funcionariosObraAtual) {
        const jaExiste = gestores.some(g => 
          (g.isFuncionario && g.id === funcionario.id) || 
          (!g.isFuncionario && g.id === funcionario.user_id)
        );
        
        if (!jaExiste) {
          gestores.push({
            id: funcionario.id,
            nome: funcionario.nome,
            cargo: funcionario.cargo,
            tipo: 'gestor',
            isFuncionario: true
          });
        }
      }
    }
    
    return gestores;
  } catch (error) {
    console.error('[whatsapp-service] Erro ao buscar gestores da obra:', error);
    return [];
  }
}

/**
 * Envia mensagem via webhook n8n (função auxiliar reutilizável)
 * @param {string} telefone - Telefone formatado
 * @param {string} mensagem - Mensagem a ser enviada
 * @param {string} link - Link opcional para incluir no payload
 * @returns {Promise<Object>} - { sucesso: boolean, erro: string|null }
 */
async function enviarMensagemWebhook(telefone, mensagem, link = null) {
  if (!telefone) {
    console.warn(`[whatsapp-service] ⚠️ Telefone não fornecido para envio de webhook`);
    return {
      sucesso: false,
      erro: 'Telefone não fornecido'
    };
  }
  
  const payload = {
    number: telefone,
    text: mensagem
  };
  
  if (link) {
    payload.link = link;
  }
  
  console.log(`[whatsapp-service] 📤 Preparando webhook para ${telefone}`);
  console.log(`[whatsapp-service] 📤 URL: ${WHATSAPP_WEBHOOK_URL}`);
  console.log(`[whatsapp-service] 📤 Payload:`, JSON.stringify(payload, null, 2));
  
  let tentativas = 0;
  const maxTentativas = 3;
  let ultimoErro = null;
  
  while (tentativas < maxTentativas) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
      
      console.log(`[whatsapp-service] 📤 Tentativa ${tentativas + 1}/${maxTentativas} - Enviando POST para webhook...`);
      
      const response = await fetch(WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`[whatsapp-service] 📥 Resposta do webhook: Status ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`[whatsapp-service] ❌ Erro HTTP: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json().catch(() => ({}));
      console.log(`[whatsapp-service] 📥 Resposta do webhook:`, JSON.stringify(responseData, null, 2));
      
      console.log(`[whatsapp-service] ✅ Mensagem enviada com sucesso para ${telefone}`);
      
      return {
        sucesso: true,
        erro: null,
        telefone: telefone
      };
    } catch (error) {
      tentativas++;
      ultimoErro = error;
      console.error(`[whatsapp-service] ❌ Tentativa ${tentativas}/${maxTentativas} falhou:`, error.message);
      if (error.stack) {
        console.error(`[whatsapp-service] Stack trace:`, error.stack);
      }
      
      if (tentativas < maxTentativas) {
        const delay = 1000 * tentativas;
        console.log(`[whatsapp-service] ⏳ Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`[whatsapp-service] ❌ Falha ao enviar mensagem após ${maxTentativas} tentativas para ${telefone}`);
  return {
    sucesso: false,
    erro: `Erro ao enviar mensagem: ${ultimoErro?.message || 'Erro desconhecido'}`,
    telefone: telefone
  };
}

/**
 * Formata mensagem de nova obra para WhatsApp
 * @param {Object} obra - Dados da obra
 * @param {Object} cliente - Dados do cliente
 * @returns {string} - Mensagem formatada
 */
function formatarMensagemNovaObra(obra, cliente) {
  const dataInicio = obra.data_inicio 
    ? new Date(obra.data_inicio).toLocaleDateString('pt-BR')
    : 'Não informada';
  const enderecoCompleto = [obra.endereco, obra.cidade, obra.estado]
    .filter(Boolean)
    .join(', ');
  
  const mensagem = `🏗️ *Nova Obra Criada*

📋 *Obra:* ${obra.nome || 'Sem nome'}
👤 *Cliente:* ${cliente?.nome || 'Não informado'}
📍 *Endereço:* ${enderecoCompleto || 'Não informado'}
👷 *Responsável:* ${obra.responsavel_nome || 'Não informado'}
📅 *Data Início:* ${dataInicio}
📊 *Status:* ${obra.status || 'Não informado'}

Acesse o sistema para mais detalhes:
${FRONTEND_URL}/dashboard/obras/${obra.id}

---
_Sistema de Gestão de Gruas_`;

  return mensagem;
}

/**
 * Formata mensagem de novo usuário funcionário para WhatsApp
 * @param {Object} funcionario - Dados do funcionário
 * @param {string} email - Email do usuário
 * @param {string} senhaTemporaria - Senha temporária
 * @returns {string} - Mensagem formatada
 */
function formatarMensagemNovoUsuarioFuncionario(funcionario, email, senhaTemporaria) {
  const nomeFuncionario = funcionario?.nome || 'Funcionário';
  
  const mensagem = `👋 *Bem-vindo ao Sistema de Gestão de Gruas!*

Olá ${nomeFuncionario},

Seu acesso ao sistema foi criado com sucesso!

📧 *Email:* ${email}
🔑 *Senha Temporária:* ${senhaTemporaria}

⚠️ *Importante:* Altere sua senha no primeiro acesso.

🔗 *Link de Acesso:*
${FRONTEND_URL}/login

---
_Sistema de Gestão de Gruas_`;

  return mensagem;
}

/**
 * Envia mensagem de nova obra para cliente e gestores responsáveis
 * @param {Object} obra - Dados da obra criada
 * @returns {Promise<Object>} - { sucesso: boolean, enviados: number, erros: Array }
 */
export async function enviarMensagemNovaObra(obra) {
  try {
    console.log(`[whatsapp-service] Iniciando envio de mensagens para nova obra ${obra.id}`);
    
    const resultados = {
      sucesso: true,
      enviados: 0,
      erros: []
    };
    
    // Buscar dados completos da obra (garantir que temos todos os campos, especialmente responsavel_nome)
    let obraCompleta;
    const { data: obraData, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome, cliente_id, endereco, cidade, estado, data_inicio, status, responsavel_id, responsavel_nome')
      .eq('id', obra.id)
      .single();
    
    if (obraError || !obraData) {
      console.warn(`[whatsapp-service] Erro ao buscar dados completos da obra, usando dados fornecidos:`, obraError);
      // Usar dados fornecidos como fallback
      obraCompleta = obra;
    } else {
      obraCompleta = obraData;
    }
    
    // Buscar dados completos do cliente
    let cliente = null;
    if (obraCompleta.cliente_id) {
      const { data: clienteData, error: clienteError } = await supabaseAdmin
        .from('clientes')
        .select('id, nome, telefone')
        .eq('id', obraCompleta.cliente_id)
        .single();
      
      if (!clienteError && clienteData) {
        cliente = clienteData;
      }
    }
    
    // Formatar mensagem usando obra completa
    const mensagem = formatarMensagemNovaObra(obraCompleta, cliente);
    const linkObra = `${FRONTEND_URL}/dashboard/obras/${obraCompleta.id}`;
    
    // Lista de destinatários (cliente + responsável/gestores)
    const destinatarios = [];
    
    // 1. Adicionar cliente
    if (cliente) {
      const telefoneCliente = await buscarTelefoneWhatsAppCliente(cliente.id);
      if (telefoneCliente) {
        destinatarios.push({
          tipo: 'cliente',
          nome: cliente.nome,
          telefone: telefoneCliente
        });
        console.log(`[whatsapp-service] ✅ Cliente adicionado: ${cliente.nome} (${telefoneCliente})`);
      } else {
        resultados.erros.push('Cliente: Telefone WhatsApp não cadastrado');
        console.warn(`[whatsapp-service] ⚠️ Telefone WhatsApp não disponível para cliente ${cliente.id}`);
      }
    }
    
    // 2. Buscar responsável e adicionar à lista
    if (obraCompleta.responsavel_id) {
      console.log(`[whatsapp-service] 🔍 Buscando responsável ID: ${obraCompleta.responsavel_id}`);
      
      // Verificar se é funcionário
      const { data: funcionario, error: funcError } = await supabaseAdmin
        .from('funcionarios')
        .select('id, nome, telefone, telefone_whatsapp')
        .eq('id', obraCompleta.responsavel_id)
        .single();
      
      if (!funcError && funcionario) {
        const telefoneResponsavel = await buscarTelefoneWhatsAppGestor(funcionario.id, true);
        if (telefoneResponsavel) {
          destinatarios.push({
            tipo: 'responsavel',
            nome: funcionario.nome || obraCompleta.responsavel_nome || 'Responsável',
            telefone: telefoneResponsavel
          });
          console.log(`[whatsapp-service] ✅ Responsável adicionado: ${funcionario.nome} (${telefoneResponsavel})`);
        } else {
          resultados.erros.push(`Responsável ${funcionario.nome}: Telefone WhatsApp não cadastrado`);
          console.warn(`[whatsapp-service] ⚠️ Telefone WhatsApp não disponível para responsável ${funcionario.id}`);
        }
      } else {
        // Tentar como usuário
        const { data: usuario, error: userError } = await supabaseAdmin
          .from('usuarios')
          .select('id, nome, telefone')
          .eq('id', obraCompleta.responsavel_id)
          .single();
        
        if (!userError && usuario) {
          const telefoneResponsavel = await buscarTelefoneWhatsAppGestor(usuario.id, false);
          if (telefoneResponsavel) {
            destinatarios.push({
              tipo: 'responsavel',
              nome: usuario.nome || obraCompleta.responsavel_nome || 'Responsável',
              telefone: telefoneResponsavel
            });
            console.log(`[whatsapp-service] ✅ Responsável adicionado: ${usuario.nome} (${telefoneResponsavel})`);
          } else {
            resultados.erros.push(`Responsável ${usuario.nome}: Telefone WhatsApp não cadastrado`);
            console.warn(`[whatsapp-service] ⚠️ Telefone WhatsApp não disponível para responsável ${usuario.id}`);
          }
        } else {
          console.warn(`[whatsapp-service] ⚠️ Responsável ${obraCompleta.responsavel_id} não encontrado no banco`);
        }
      }
    }
    
    // 3. Buscar outros gestores (se houver)
    const gestores = await buscarGestoresObra(obraCompleta.id);
    console.log(`[whatsapp-service] Encontrados ${gestores.length} gestores adicionais para a obra`);
    
    // Adicionar gestores que não são o responsável
    for (const gestor of gestores) {
      // Pular se já é o responsável
      if (obraCompleta.responsavel_id && gestor.id === obraCompleta.responsavel_id) {
        console.log(`[whatsapp-service] Gestor ${gestor.nome} já está na lista como responsável, pulando...`);
        continue;
      }
      
      const telefoneGestor = await buscarTelefoneWhatsAppGestor(gestor.id, gestor.isFuncionario);
      if (telefoneGestor) {
        destinatarios.push({
          tipo: 'gestor',
          nome: gestor.nome,
          telefone: telefoneGestor
        });
        console.log(`[whatsapp-service] ✅ Gestor adicionado: ${gestor.nome} (${telefoneGestor})`);
      }
    }
    
    console.log(`[whatsapp-service] 📋 Total de destinatários: ${destinatarios.length}`);
    console.log(`[whatsapp-service] 📋 Destinatários:`, destinatarios.map(d => `${d.tipo}: ${d.nome} (${d.telefone})`));
    
    // 4. Enviar mensagem para CADA destinatário (POST separado para cada um)
    for (const destinatario of destinatarios) {
      console.log(`[whatsapp-service] ===== Enviando para ${destinatario.tipo}: ${destinatario.nome} (${destinatario.telefone}) =====`);
      const resultado = await enviarMensagemWebhook(destinatario.telefone, mensagem, linkObra);
      if (resultado.sucesso) {
        resultados.enviados++;
        console.log(`[whatsapp-service] ✅ Mensagem enviada com sucesso para ${destinatario.tipo} ${destinatario.nome}`);
      } else {
        resultados.erros.push(`${destinatario.tipo} ${destinatario.nome}: ${resultado.erro}`);
        console.error(`[whatsapp-service] ❌ Erro ao enviar para ${destinatario.tipo} ${destinatario.nome}: ${resultado.erro}`);
      }
    }
    
    if (resultados.enviados === 0 && resultados.erros.length > 0) {
      resultados.sucesso = false;
    }
    
    console.log(`[whatsapp-service] Envio de mensagens concluído: ${resultados.enviados} enviadas, ${resultados.erros.length} erros`);
    
    return resultados;
  } catch (error) {
    console.error('[whatsapp-service] Erro ao enviar mensagens de nova obra:', error);
    return {
      sucesso: false,
      enviados: 0,
      erros: [error.message || 'Erro desconhecido']
    };
  }
}

/**
 * Envia mensagem de novo usuário funcionário com instruções de acesso
 * @param {Object} funcionario - Dados do funcionário
 * @param {string} email - Email do usuário criado
 * @param {string} senhaTemporaria - Senha temporária gerada
 * @returns {Promise<Object>} - { sucesso: boolean, erro: string|null }
 */
export async function enviarMensagemNovoUsuarioFuncionario(funcionario, email, senhaTemporaria) {
  try {
    console.log(`[whatsapp-service] Iniciando envio de mensagem para novo usuário funcionário ${funcionario.id}`);
    
    // Buscar telefone do funcionário
    let telefone = null;
    
    // Tentar buscar telefone_whatsapp ou telefone do funcionário
    if (funcionario.telefone_whatsapp) {
      telefone = formatarTelefone(funcionario.telefone_whatsapp);
    } else if (funcionario.telefone) {
      telefone = formatarTelefone(funcionario.telefone);
    }
    
    // Se não encontrou no funcionário, tentar buscar no usuário vinculado
    if (!telefone && funcionario.user_id) {
      const { data: usuario, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('telefone')
        .eq('id', funcionario.user_id)
        .single();
      
      if (!userError && usuario && usuario.telefone) {
        telefone = formatarTelefone(usuario.telefone);
      }
    }
    
    if (!telefone) {
      console.warn(`[whatsapp-service] Telefone WhatsApp não disponível para funcionário ${funcionario.id}`);
      return {
        sucesso: false,
        erro: 'Telefone WhatsApp do funcionário não cadastrado'
      };
    }
    
    // Formatar mensagem
    const mensagem = formatarMensagemNovoUsuarioFuncionario(funcionario, email, senhaTemporaria);
    const linkLogin = `${FRONTEND_URL}/login`;
    
    // Enviar mensagem
    const resultado = await enviarMensagemWebhook(telefone, mensagem, linkLogin);
    
    if (resultado.sucesso) {
      console.log(`[whatsapp-service] Mensagem de novo usuário enviada com sucesso para ${telefone}`);
    } else {
      console.error(`[whatsapp-service] Erro ao enviar mensagem de novo usuário: ${resultado.erro}`);
    }
    
    return resultado;
  } catch (error) {
    console.error('[whatsapp-service] Erro ao enviar mensagem de novo usuário funcionário:', error);
    return {
      sucesso: false,
      erro: error.message || 'Erro desconhecido'
    };
  }
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

