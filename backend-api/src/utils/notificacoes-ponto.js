import { supabaseAdmin } from '../config/supabase.js';
import { sendEmail } from '../services/email.service.js';
import { enviarMensagemWebhook } from '../services/whatsapp-service.js';
import { emitirNotificacao } from '../server.js';

const FRONTEND_URL = () => process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';

function formatarData(dataStr) {
  if (!dataStr) return '-';
  if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return new Date(dataStr).toLocaleDateString('pt-BR');
}

function formatarHoras(valor) {
  if (valor === null || valor === undefined) return '0';
  return Number(valor).toFixed(1);
}

function normalizarTelefoneWhatsapp(telefone) {
  if (!telefone) return null;
  let numero = String(telefone).replace(/\D/g, '');
  if (!numero) return null;
  if (!numero.startsWith('55')) {
    if (numero.startsWith('0')) numero = numero.substring(1);
    numero = `55${numero}`;
  }
  return numero;
}

// =========================================================
// TEMPLATE EMAIL 1 — Notificação ao Responsável de Obra
// =========================================================
function templateEmailResponsavel({ funcionarioNome, funcionarioCargo, obraNome, data, entrada, saidaAlmoco, voltaAlmoco, saida, horasTrabalhadas, horasExtras, linkAssinar }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <tr><td style="background:#2563eb;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Registro de Ponto Concluído</h1>
        <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Um funcionário fechou o dia — aguardando sua assinatura</p>
      </td></tr>
      <tr><td style="padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:8px 12px;background:#eff6ff;border-radius:6px;">
              <p style="margin:0;font-size:13px;color:#64748b;">Funcionário</p>
              <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#1e293b;">${funcionarioNome}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${funcionarioCargo || ''}</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
              <p style="margin:0;font-size:13px;color:#64748b;">Obra</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1e293b;">${obraNome || 'N/A'}</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;margin-bottom:16px;">
          <tr style="background:#f8fafc;">
            <td style="font-size:13px;color:#64748b;font-weight:600;">Data</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${formatarData(data)}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;">Entrada</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${entrada || '-'}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="font-size:13px;color:#64748b;">Saída Almoço</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${saidaAlmoco || '-'}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;">Volta Almoço</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${voltaAlmoco || '-'}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="font-size:13px;color:#64748b;">Saída</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${saida || '-'}</td>
          </tr>
        </table>
        <table width="100%" cellpadding="12" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin-bottom:20px;">
          <tr>
            <td style="text-align:center;">
              <p style="margin:0;font-size:13px;color:#64748b;">Horas Trabalhadas</p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#16a34a;">${formatarHoras(horasTrabalhadas)}h</p>
            </td>
            <td style="text-align:center;border-left:1px solid #bbf7d0;">
              <p style="margin:0;font-size:13px;color:#64748b;">Horas Extras</p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#ea580c;">${formatarHoras(horasExtras)}h</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <a href="${linkAssinar}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
              Assinar Agora
            </a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">Sistema de Gerenciamento de Gruas</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// =========================================================
// TEMPLATE EMAIL 2 — Notificação ao Funcionário
// =========================================================
function templateEmailFuncionario({ responsavelNome, data, horasTrabalhadas, horasExtras, linkAssinar }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <tr><td style="background:#16a34a;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Ponto Assinado pelo Responsável</h1>
        <p style="color:#bbf7d0;margin:8px 0 0;font-size:14px;">Falta a sua assinatura para validar o registro</p>
      </td></tr>
      <tr><td style="padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;text-align:center;">
              <p style="margin:0;font-size:14px;color:#64748b;">O responsável <strong style="color:#1e293b;">${responsavelNome}</strong> assinou seu registro de ponto.</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;margin-bottom:16px;">
          <tr style="background:#f8fafc;">
            <td style="font-size:13px;color:#64748b;font-weight:600;">Data</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${formatarData(data)}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;">Horas Trabalhadas</td>
            <td style="font-size:14px;color:#16a34a;font-weight:600;text-align:right;">${formatarHoras(horasTrabalhadas)}h</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="font-size:13px;color:#64748b;">Horas Extras</td>
            <td style="font-size:14px;color:#ea580c;font-weight:600;text-align:right;">${formatarHoras(horasExtras)}h</td>
          </tr>
        </table>
        <p style="font-size:14px;color:#475569;text-align:center;margin-bottom:20px;">
          Acesse o app e assine também para validar o seu registro.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <a href="${linkAssinar}" style="display:inline-block;padding:14px 32px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
              Assinar no App
            </a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">Sistema de Gerenciamento de Gruas</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// =========================================================
// MENSAGENS WHATSAPP
// =========================================================
function mensagemWhatsAppResponsavel({ funcionarioNome, obraNome, data, entrada, saida, horasTrabalhadas, horasExtras, link }) {
  return `📋 *Registro de ponto concluído*

👷 Funcionário: ${funcionarioNome}
🏗️ Obra: ${obraNome || 'N/A'}
📅 Data: ${formatarData(data)}
🕐 Entrada: ${entrada || '-'} | Saída: ${saida || '-'}
⏱️ Horas: ${formatarHoras(horasTrabalhadas)}h | Extras: ${formatarHoras(horasExtras)}h

Acesse o sistema para assinar: ${link}`;
}

function mensagemWhatsAppFuncionario({ responsavelNome, data, link }) {
  return `✅ *Seu ponto foi assinado pelo responsável*

👤 Responsável: ${responsavelNome}
📅 Data: ${formatarData(data)}

Acesse o app para assinar também e validar: ${link}`;
}

// =========================================================
// TEMPLATE EMAIL 3 — Rejeição pelo Responsável
// =========================================================
function templateEmailRejeicao({ responsavelNome, comentario, data, entrada, saidaAlmoco, voltaAlmoco, saida, horasTrabalhadas, horasExtras, linkCorrigir }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
      <tr><td style="background:#dc2626;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Registro de Ponto Não Aprovado</h1>
        <p style="color:#fecaca;margin:8px 0 0;font-size:14px;">O responsável não concordou com as horas — corrija no app</p>
      </td></tr>
      <tr><td style="padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;">
              <p style="margin:0;font-size:13px;color:#64748b;">Responsável</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1e293b;">${responsavelNome}</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;">
              <p style="margin:0;font-size:13px;color:#dc2626;font-weight:600;">Motivo</p>
              <p style="margin:4px 0 0;font-size:14px;color:#1e293b;">${comentario}</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;margin-bottom:16px;">
          <tr style="background:#f8fafc;">
            <td style="font-size:13px;color:#64748b;font-weight:600;">Data</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${formatarData(data)}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;">Entrada</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${entrada || '-'}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="font-size:13px;color:#64748b;">Saída Almoço</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${saidaAlmoco || '-'}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;">Volta Almoço</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${voltaAlmoco || '-'}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="font-size:13px;color:#64748b;">Saída</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${saida || '-'}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#64748b;">Horas</td>
            <td style="font-size:14px;color:#1e293b;text-align:right;">${formatarHoras(horasTrabalhadas)}h | Extras: ${formatarHoras(horasExtras)}h</td>
          </tr>
        </table>
        <p style="font-size:14px;color:#475569;text-align:center;margin-bottom:20px;">
          Acesse o app para corrigir os horários e reenviar para aprovação.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <a href="${linkCorrigir}" style="display:inline-block;padding:14px 32px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
              Editar Horas
            </a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">Sistema de Gerenciamento de Gruas</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function mensagemWhatsAppRejeicao({ responsavelNome, data, comentario, link }) {
  return `❌ *Registro de ponto não aprovado*

👤 Responsável: ${responsavelNome}
📅 Data: ${formatarData(data)}
💬 Motivo: ${comentario}

Acesse o app para corrigir as horas: ${link}`;
}

// =========================================================
// FUNÇÕES PRINCIPAIS DE NOTIFICAÇÃO
// =========================================================

/**
 * Notifica todos os responsáveis da obra quando um funcionário fecha o dia.
 * Envia: email + WhatsApp + notificação in-app
 */
export async function notificarResponsaveisObraPontoConcluido(registro, funcionario) {
  const obraId = registro.obra_id || funcionario.obra_atual_id;
  if (!obraId) {
    console.warn('[notificacoes-ponto] Sem obra_id, não é possível notificar responsáveis');
    return;
  }

  try {
    const { data: responsaveis, error } = await supabaseAdmin
      .from('responsaveis_obra')
      .select('id, nome, email, telefone, usuario')
      .eq('obra_id', obraId)
      .eq('ativo', true);

    if (error || !responsaveis || responsaveis.length === 0) {
      console.log('[notificacoes-ponto] Nenhum responsável ativo encontrado para obra', obraId);
      return;
    }

    const { data: obra } = await supabaseAdmin
      .from('obras')
      .select('nome')
      .eq('id', obraId)
      .single();

    const obraNome = obra?.nome || `Obra #${obraId}`;
    const baseUrl = FRONTEND_URL();
    const linkAssinar = `${baseUrl}/pwa/aprovacao-assinatura?id=${registro.id}`;

    for (const resp of responsaveis) {
      try {
        // 1) Email
        if (resp.email) {
          await sendEmail({
            to: resp.email,
            subject: `Registro de ponto concluído — ${funcionario.nome || 'Funcionário'} — ${formatarData(registro.data)}`,
            html: templateEmailResponsavel({
              funcionarioNome: funcionario.nome || 'Funcionário',
              funcionarioCargo: funcionario.cargo || '',
              obraNome,
              data: registro.data,
              entrada: registro.entrada,
              saidaAlmoco: registro.saida_almoco,
              voltaAlmoco: registro.volta_almoco,
              saida: registro.saida,
              horasTrabalhadas: registro.horas_trabalhadas,
              horasExtras: registro.horas_extras,
              linkAssinar
            }),
            tipo: 'notificacao_ponto_responsavel'
          }).catch(e => console.error('[notificacoes-ponto] Erro email responsável:', e.message));
        }

        // 2) WhatsApp
        const telefoneResponsavel = normalizarTelefoneWhatsapp(resp.telefone);
        if (telefoneResponsavel) {
          await enviarMensagemWebhook(
            telefoneResponsavel,
            mensagemWhatsAppResponsavel({
              funcionarioNome: funcionario.nome || 'Funcionário',
              obraNome,
              data: registro.data,
              entrada: registro.entrada,
              saida: registro.saida,
              horasTrabalhadas: registro.horas_trabalhadas,
              horasExtras: registro.horas_extras,
              link: linkAssinar
            }),
            linkAssinar,
            { tipo: 'ponto_responsavel', destinatario_nome: resp.nome }
          ).catch(e => console.error('[notificacoes-ponto] Erro WhatsApp responsável:', e.message));
        } else {
          console.warn(`[notificacoes-ponto] Responsável ${resp.nome || resp.id} sem telefone válido para WhatsApp`);
        }

        // 3) Notificação in-app (precisa de usuario_id)
        const usuarioId = await resolverUsuarioId(resp);
        if (usuarioId) {
          const { data: notif } = await supabaseAdmin
            .from('notificacoes')
            .insert({
              usuario_id: usuarioId,
              tipo: 'info',
              titulo: 'Registro de ponto concluído',
              mensagem: `${funcionario.nome || 'Funcionário'} fechou o dia ${formatarData(registro.data)} — aguardando sua assinatura`,
              link: `/pwa/aprovacao-assinatura?id=${registro.id}`,
              lida: false,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (notif) {
            try { emitirNotificacao(usuarioId, notif); } catch (e) { /* websocket offline */ }
          }
        }
      } catch (e) {
        console.error(`[notificacoes-ponto] Erro ao notificar responsável ${resp.nome}:`, e.message);
      }
    }

    console.log(`[notificacoes-ponto] Notificações enviadas para ${responsaveis.length} responsável(is) da obra ${obraNome}`);
  } catch (e) {
    console.error('[notificacoes-ponto] Erro geral ao notificar responsáveis:', e);
  }
}

/**
 * Notifica o funcionário quando o responsável assina seu registro.
 * Envia: email + WhatsApp + notificação in-app
 */
export async function notificarFuncionarioPontoAssinado(registro, funcionario, responsavel) {
  const baseUrl = FRONTEND_URL();
  const linkAssinar = `${baseUrl}/pwa/aprovacao-assinatura?id=${registro.id}`;
  const responsavelNome = responsavel?.nome || 'Responsável';

  try {
    // Buscar email e telefone do funcionário
    const { data: funcData } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, email, telefone_whatsapp, telefone')
      .eq('id', funcionario.id || funcionario.funcionario_id || registro.funcionario_id)
      .single();

    const emailFunc = funcData?.email;
    const telefoneFunc = normalizarTelefoneWhatsapp(funcData?.telefone_whatsapp || funcData?.telefone);
    const usuarioIdFunc = await resolverUsuarioIdPorFuncionario(
      funcData?.id || funcionario.id || funcionario.funcionario_id || registro.funcionario_id
    );

    // 1) Email
    if (emailFunc) {
      await sendEmail({
        to: emailFunc,
        subject: `Ponto assinado pelo responsável — ${formatarData(registro.data)}`,
        html: templateEmailFuncionario({
          responsavelNome,
          data: registro.data,
          horasTrabalhadas: registro.horas_trabalhadas,
          horasExtras: registro.horas_extras,
          linkAssinar
        }),
        tipo: 'notificacao_ponto_funcionario'
      }).catch(e => console.error('[notificacoes-ponto] Erro email funcionário:', e.message));
    }

    // 2) WhatsApp
    if (telefoneFunc) {
      await enviarMensagemWebhook(
        telefoneFunc,
        mensagemWhatsAppFuncionario({
          responsavelNome,
          data: registro.data,
          link: linkAssinar
        }),
        linkAssinar,
        { tipo: 'ponto_funcionario', destinatario_nome: funcData?.nome || 'Funcionário' }
      ).catch(e => console.error('[notificacoes-ponto] Erro WhatsApp funcionário:', e.message));
    }

    // 3) Notificação in-app
    if (usuarioIdFunc) {
      const { data: notif } = await supabaseAdmin
        .from('notificacoes')
        .insert({
          usuario_id: usuarioIdFunc,
          tipo: 'success',
          titulo: 'Ponto assinado pelo responsável',
          mensagem: `${responsavelNome} assinou seu registro de ${formatarData(registro.data)}. Acesse o app para assinar também.`,
          link: `/pwa/aprovacao-assinatura?id=${registro.id}`,
          lida: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (notif) {
        try { emitirNotificacao(usuarioIdFunc, notif); } catch (e) { /* websocket offline */ }
      }
    }

    console.log(`[notificacoes-ponto] Funcionário ${funcData?.nome || registro.funcionario_id} notificado sobre assinatura do responsável`);
  } catch (e) {
    console.error('[notificacoes-ponto] Erro ao notificar funcionário:', e);
  }
}

/**
 * Notifica o funcionário quando o responsável rejeita (não concorda com) seu registro.
 * Envia: email + WhatsApp + notificação in-app
 */
export async function notificarFuncionarioPontoRejeitado(registro, funcionario, responsavel, comentario) {
  const baseUrl = FRONTEND_URL();
  const linkCorrigir = `${baseUrl}/pwa/aprovacoes`;
  const responsavelNome = responsavel?.nome || 'Responsável';

  try {
    const { data: funcData } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, email, telefone_whatsapp, telefone')
      .eq('id', funcionario.id || funcionario.funcionario_id || registro.funcionario_id)
      .single();

    const emailFunc = funcData?.email;
    const telefoneFunc = funcData?.telefone_whatsapp || funcData?.telefone;
    const usuarioIdFunc = await resolverUsuarioIdPorFuncionario(
      funcData?.id || funcionario.id || funcionario.funcionario_id || registro.funcionario_id
    );

    // 1) Email
    if (emailFunc) {
      await sendEmail({
        to: emailFunc,
        subject: `Registro de ponto não aprovado — ${formatarData(registro.data)}`,
        html: templateEmailRejeicao({
          responsavelNome,
          comentario: comentario || 'Sem comentário',
          data: registro.data,
          entrada: registro.entrada,
          saidaAlmoco: registro.saida_almoco,
          voltaAlmoco: registro.volta_almoco,
          saida: registro.saida,
          horasTrabalhadas: registro.horas_trabalhadas,
          horasExtras: registro.horas_extras,
          linkCorrigir
        }),
        tipo: 'notificacao_ponto_rejeicao'
      }).catch(e => console.error('[notificacoes-ponto] Erro email rejeição:', e.message));
    }

    // 2) WhatsApp
    if (telefoneFunc) {
      await enviarMensagemWebhook(
        telefoneFunc,
        mensagemWhatsAppRejeicao({ responsavelNome, data: registro.data, comentario: comentario || 'Sem comentário', link: linkCorrigir }),
        linkCorrigir,
        { tipo: 'ponto_rejeicao', destinatario_nome: funcData?.nome || 'Funcionário' }
      ).catch(e => console.error('[notificacoes-ponto] Erro WhatsApp rejeição:', e.message));
    }

    // 3) Notificação in-app
    if (usuarioIdFunc) {
      const { data: notif } = await supabaseAdmin
        .from('notificacoes')
        .insert({
          usuario_id: usuarioIdFunc,
          tipo: 'warning',
          titulo: 'Registro de ponto não aprovado',
          mensagem: `${responsavelNome} não concordou com seu registro de ${formatarData(registro.data)}. Motivo: ${comentario || 'Sem comentário'}. Corrija as horas no app.`,
          link: `/pwa/aprovacoes`,
          lida: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (notif) {
        try { emitirNotificacao(usuarioIdFunc, notif); } catch (e) { /* websocket offline */ }
      }
    }

    console.log(`[notificacoes-ponto] Funcionário ${funcData?.nome || registro.funcionario_id} notificado sobre rejeição do responsável`);
  } catch (e) {
    console.error('[notificacoes-ponto] Erro ao notificar funcionário (rejeição):', e);
  }
}

// =========================================================
// HELPERS INTERNOS
// =========================================================

async function resolverUsuarioId(responsavel) {
  if (!responsavel.email) return null;

  try {
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', responsavel.email)
      .single();

    return usuario?.id || null;
  } catch {
    return null;
  }
}

async function resolverUsuarioIdPorFuncionario(funcionarioId) {
  if (!funcionarioId) return null;

  try {
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('funcionario_id', funcionarioId)
      .single();

    return usuario?.id || null;
  } catch {
    return null;
  }
}
