import { supabaseAdmin } from '../config/supabase.js';
import { sendEmail } from '../services/email.service.js';
import { enviarMensagemWebhook } from '../services/whatsapp-service.js';
import { isWebPushConfigured, sendWebPush } from '../services/web-push-service.js';
import { emitirNotificacao } from '../server.js';
import { buscarSupervisorPorObra } from './aprovacoes-helpers.js';
import { validarTelefoneWhatsappBrasil, normalizarTelefoneBrasilParaWhatsApp } from './telefone-brasil.js';

const FRONTEND_URL = () => process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';

/** Links absolutos para e-mail / WhatsApp (devem abrir fora do app). */
function urlPwaAbs(path) {
  const base = String(FRONTEND_URL() || '').replace(/\/+$/, '');
  const p = String(path || '').startsWith('/') ? path : `/${path || ''}`;
  return `${base}${p}`;
}

/**
 * Payload Web Push: use paths relativos (/icon..., /pwa/...).
 * O service worker resolve com o origin do PWA; FRONTEND_URL errado (ex. localhost) quebrava ícone/toque no iOS.
 */
function pushPwaRelativo({ icon, badge, path }) {
  return {
    icon: icon || '/icon-192x192.png',
    badge: badge || '/icon-72x72.png',
    data: { url: path.startsWith('/') ? path : `/${path}` }
  };
}

/** SMTP / webhooks externos podem travar minutos — não bloquear a API. */
const MS_TIMEOUT_EMAIL =
  Number(process.env.NOTIFICACAO_PONTO_TIMEOUT_EMAIL_MS) > 0
    ? Number(process.env.NOTIFICACAO_PONTO_TIMEOUT_EMAIL_MS)
    : 12000;
const MS_TIMEOUT_WHATSAPP =
  Number(process.env.NOTIFICACAO_PONTO_TIMEOUT_WHATSAPP_MS) > 0
    ? Number(process.env.NOTIFICACAO_PONTO_TIMEOUT_WHATSAPP_MS)
    : 15000;
const MS_TIMEOUT_PUSH =
  Number(process.env.NOTIFICACAO_PONTO_TIMEOUT_PUSH_MS) > 0
    ? Number(process.env.NOTIFICACAO_PONTO_TIMEOUT_PUSH_MS)
    : 10000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`[notificacoes-ponto] Timeout ${label} após ${ms}ms`)),
        ms
      )
    )
  ]);
}

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
  return normalizarTelefoneBrasilParaWhatsApp(telefone);
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
 * Indica se há alguém para receber notificação de ponto assinatura:
 * responsáveis em `responsaveis_obra` OU supervisor da obra (cliente / responsavel_id).
 */
export async function obraTemDestinatariosNotificacaoPonto(obraId) {
  if (!obraId) return false;
  try {
    const { data: rows } = await supabaseAdmin
      .from('responsaveis_obra')
      .select('id')
      .eq('obra_id', obraId)
      .eq('ativo', true)
      .limit(1);
    if (rows && rows.length > 0) return true;
    const supervisor = await buscarSupervisorPorObra(obraId);
    return !!supervisor;
  } catch (e) {
    console.error('[notificacoes-ponto] obraTemDestinatariosNotificacaoPonto:', e.message);
    return false;
  }
}

/** Avisa o funcionário (in-app) quando o telefone do responsável está preenchido mas inválido — sem inventar DDD. */
async function notificarFuncionarioAvisoTelefoneResponsavel(registro, funcionario, nomeResponsavel, mensagem) {
  const fid = funcionario?.id || funcionario?.funcionario_id || registro?.funcionario_id;
  if (!fid || !mensagem) return;
  const uid = await resolverUsuarioIdPorFuncionario(fid);
  if (!uid) return;
  const agora = new Date().toISOString();
  const { data: notif } = await supabaseAdmin
    .from('notificacoes')
    .insert({
      usuario_id: uid,
      tipo: 'warning',
      titulo: 'Telefone do responsável incompleto',
      mensagem: `Não foi possível enviar WhatsApp para ${nomeResponsavel || 'o responsável'}: ${mensagem} Peça ao administrador para corrigir o telefone em Responsáveis da obra.`,
      link: `/pwa/espelho-ponto`,
      lida: false,
      remetente: 'Sistema',
      destinatarios: [],
      data: agora,
      created_at: agora
    })
    .select()
    .single();

  if (notif) {
    try {
      emitirNotificacao(uid, notif);
    } catch (e) {
      /* websocket offline */
    }
  }
}

async function enviarPacoteNotificacaoResponsavelPonto({
  nome,
  email,
  telefone,
  usuarioIdDireto,
  responsavelRow,
  registro,
  funcionario,
  obraNome,
  linkAssinar
}) {
  const usuarioId =
    typeof usuarioIdDireto === 'number' && !Number.isNaN(usuarioIdDireto)
      ? usuarioIdDireto
      : await resolverUsuarioId(responsavelRow || { email, usuario: null });

  const telValidacao = validarTelefoneWhatsappBrasil(telefone);
  const telefoneNormWhatsapp = telValidacao.ok ? telValidacao.e164 : null;
  const aviso_whatsapp_cadastro =
    telefone && String(telefone).trim() !== '' && !telValidacao.ok ? telValidacao.mensagem : null;

  if (aviso_whatsapp_cadastro) {
    void notificarFuncionarioAvisoTelefoneResponsavel(registro, funcionario, nome, aviso_whatsapp_cadastro).catch((e) =>
      console.error('[notificacoes-ponto] Erro ao enviar aviso ao funcionário (telefone responsável):', e.message)
    );
  }

  /** Resultado do envio Web Push (VAPID + pwa_push_subscriptions) — null se não houve usuario_id */
  let pushWebResultado = null;

  const loginResponsavelObra = responsavelRow?.usuario != null ? String(responsavelRow.usuario).trim() : '';

  console.log(
    '[notificacoes-ponto] ▶ Disparando notificação ao responsável',
    JSON.stringify(
      {
        registro_ponto_id: registro?.id ?? null,
        destinatario_nome: nome || null,
        email: email || null,
        telefone_cadastro: telefone || null,
        telefone_whatsapp_usado_no_disparo: telefoneNormWhatsapp || null,
        usuario_campo_responsaveis_obra: loginResponsavelObra || null,
        usuario_id_tabela_usuarios: usuarioId ?? null,
        canais_previstos: {
          email: Boolean(email),
          whatsapp: Boolean(telefoneNormWhatsapp),
          notificacao_in_app_e_push: Boolean(usuarioId)
        }
      },
      null,
      0
    )
  );

  if (!usuarioId && (email || responsavelRow?.usuario)) {
    console.warn(
      `[notificacoes-ponto] Responsável "${nome || '—'}" sem vínculo com usuarios (email/login). In-app/push não enviados.`
    );
  }

  // 1) In-app + push primeiro (rápido; não depende de SMTP nem webhook WhatsApp)
  if (usuarioId) {
    const agora = new Date().toISOString();
    const { data: notif } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: usuarioId,
        tipo: 'info',
        titulo: 'Registro de ponto concluído',
        mensagem: `${funcionario.nome || 'Funcionário'} fechou o dia ${formatarData(registro.data)} — aguardando sua assinatura`,
        link: `/pwa/aprovacao-assinatura?id=${registro.id}`,
        lida: false,
        remetente: 'Sistema',
        destinatarios: [],
        data: agora,
        created_at: agora
      })
      .select()
      .single();

    if (notif) {
      try {
        emitirNotificacao(usuarioId, notif);
      } catch (e) {
        /* websocket offline */
      }
    }

    try {
      pushWebResultado = await withTimeout(
        enviarPushParaUsuario(usuarioId, {
          title: 'Ponto pendente de assinatura',
          body: `${funcionario.nome || 'Funcionário'} finalizou o dia e aguarda sua assinatura.`,
          ...pushPwaRelativo({ path: `/pwa/aprovacao-assinatura?id=${registro.id}` }),
          tag: `ponto-pendente-${registro.id}`
        }),
        MS_TIMEOUT_PUSH,
        'push'
      );
      console.log(
        '[notificacoes-ponto] Push web (PWA) para usuario_id=%s registro=%s → %s',
        usuarioId,
        registro?.id,
        JSON.stringify(pushWebResultado)
      );
    } catch (e) {
      console.warn('[notificacoes-ponto] Push falhou ou timeout:', e.message);
      pushWebResultado = { erro: e.message, mensagem_usuario: `Timeout ou erro no push: ${e.message}` };
    }
  }

  // 2) E-mail e WhatsApp em background (SMTP/webhook podem travar → não bloqueiam a resposta HTTP)
  if (email) {
    void withTimeout(
      sendEmail({
        to: email,
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
      }),
      MS_TIMEOUT_EMAIL,
      'email'
    )
      .then(() => console.log('[notificacoes-ponto] E-mail responsável concluído (background):', email))
      .catch((e) => console.error('[notificacoes-ponto] Erro/timeout email responsável:', e.message));
  }

  if (telefoneNormWhatsapp) {
    void withTimeout(
      enviarMensagemWebhook(
        telefoneNormWhatsapp,
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
        { tipo: 'ponto_responsavel', destinatario_nome: nome }
      ),
      MS_TIMEOUT_WHATSAPP,
      'whatsapp'
    )
      .then((r) =>
        console.log(
          '[notificacoes-ponto] WhatsApp responsável concluído (background):',
          telefoneNormWhatsapp,
          r?.sucesso === false ? r?.erro : 'ok'
        )
      )
      .catch((e) => console.error('[notificacoes-ponto] Erro/timeout WhatsApp responsável:', e.message));
  }

  return {
    nome: nome || null,
    email: email || null,
    telefone: telefone || null,
    usuario_campo_responsaveis_obra: loginResponsavelObra || null,
    usuario_id_para_app_e_push: usuarioId ?? null,
    whatsapp_numero_normalizado: telefoneNormWhatsapp || null,
    fonte: responsavelRow ? 'responsaveis_obra' : 'supervisor_ou_cliente_obra',
    canais_disparados: {
      email: Boolean(email),
      whatsapp: Boolean(telefoneNormWhatsapp),
      notificacao_app_e_push: Boolean(usuarioId)
    },
    aviso_whatsapp_cadastro: aviso_whatsapp_cadastro || null,
    push_web: pushWebResultado
  };
}

/**
 * Confirma ao funcionário que o dia foi encerrado e enviado ao responsável (in-app + push + WhatsApp, se houver telefone).
 * Diferente do fluxo para responsáveis: o usuário que bateu ponto não recebia nada antes.
 */
async function notificarFuncionarioDiaEnviadoAssinatura(registro, funcionario, obraNome) {
  const fid = funcionario?.id || funcionario?.funcionario_id || registro?.funcionario_id;
  if (!fid) {
    console.log('[notificacoes-ponto] Confirmação ao funcionário: sem funcionario_id — ignorado');
    return { ok: false, motivo: 'sem_funcionario_id' };
  }

  let nomeFunc = funcionario?.nome;
  let telefoneFunc = funcionario?.telefone_whatsapp || funcionario?.telefone;

  if (!nomeFunc || !telefoneFunc) {
    const { data: f } = await supabaseAdmin
      .from('funcionarios')
      .select('nome, telefone, telefone_whatsapp')
      .eq('id', fid)
      .maybeSingle();
    nomeFunc = nomeFunc || f?.nome;
    telefoneFunc = telefoneFunc || f?.telefone_whatsapp || f?.telefone;
  }

  const usuarioIdFunc = await resolverUsuarioIdPorFuncionario(fid);
  const baseUrl = FRONTEND_URL();
  const linkEspelho = `${baseUrl}/pwa/espelho-ponto`;

  if (usuarioIdFunc) {
    const agora = new Date().toISOString();
    const { data: notif } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: usuarioIdFunc,
        tipo: 'success',
        titulo: 'Ponto enviado para assinatura',
        mensagem: `Seu registro de ${formatarData(registro.data)} em ${obraNome || 'sua obra'} foi enviado ao responsável.`,
        link: `/pwa/espelho-ponto`,
        lida: false,
        remetente: 'Sistema',
        destinatarios: [],
        data: agora,
        created_at: agora
      })
      .select()
      .single();

    if (notif) {
      try {
        emitirNotificacao(usuarioIdFunc, notif);
      } catch (e) {
        /* websocket offline */
      }
    }

    try {
      const pushResultado = await withTimeout(
        enviarPushParaUsuario(usuarioIdFunc, {
          title: 'Ponto enviado ao responsável',
          body: `Seu dia ${formatarData(registro.data)} em ${obraNome || 'obra'} foi agendado para assinatura.`,
          ...pushPwaRelativo({ path: '/pwa/espelho-ponto' }),
          tag: `ponto-func-confirm-${registro.id}`
        }),
        MS_TIMEOUT_PUSH,
        'push_funcionario'
      );
      console.log(
        '[notificacoes-ponto] Push ao funcionário (confirmação) usuario_id=%s → %s',
        usuarioIdFunc,
        JSON.stringify(pushResultado)
      );
    } catch (e) {
      console.warn('[notificacoes-ponto] Push funcionário (confirmação) falhou ou timeout:', e.message);
    }
  } else {
    console.log(
      '[notificacoes-ponto] Funcionário id=%s sem usuário vinculado (usuarios.funcionario_id) — in-app/push não enviados',
      fid
    );
  }

  const telVal = validarTelefoneWhatsappBrasil(telefoneFunc);
  const telNorm = telVal.ok ? telVal.e164 : null;
  const aviso_whatsapp_cadastro =
    telefoneFunc && String(telefoneFunc).trim() !== '' && !telVal.ok ? telVal.mensagem : null;

  if (aviso_whatsapp_cadastro && usuarioIdFunc) {
    const agoraAviso = new Date().toISOString();
    const { data: notifAviso } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: usuarioIdFunc,
        tipo: 'warning',
        titulo: 'Telefone incompleto no seu cadastro',
        mensagem: `WhatsApp não foi enviado: ${aviso_whatsapp_cadastro} Atualize seu telefone ou avise o RH/administrador.`,
        link: `/pwa/espelho-ponto`,
        lida: false,
        remetente: 'Sistema',
        destinatarios: [],
        data: agoraAviso,
        created_at: agoraAviso
      })
      .select()
      .single();
    if (notifAviso) {
      try {
        emitirNotificacao(usuarioIdFunc, notifAviso);
      } catch (e) {
        /* websocket offline */
      }
    }
  }

  if (telNorm) {
    const msg = `✅ *Ponto registrado*\n\n${nomeFunc ? `Olá ${nomeFunc}! ` : ''}Seu dia ${formatarData(registro.data)} na obra *${obraNome || 'N/A'}* foi enviado para assinatura do responsável.\n${linkEspelho}`;
    void withTimeout(
      enviarMensagemWebhook(telNorm, msg, linkEspelho, {
        tipo: 'ponto_confirmacao_funcionario',
        destinatario_nome: nomeFunc || 'Funcionário'
      }),
      MS_TIMEOUT_WHATSAPP,
      'whatsapp_funcionario'
    )
      .then((r) =>
        console.log(
          '[notificacoes-ponto] WhatsApp funcionário (confirmação) concluído:',
          telNorm,
          r?.sucesso === false ? r?.erro : 'ok'
        )
      )
      .catch((e) => console.error('[notificacoes-ponto] Erro/timeout WhatsApp funcionário:', e.message));
  } else if (!telefoneFunc || !String(telefoneFunc).trim()) {
    console.log('[notificacoes-ponto] Funcionário sem telefone cadastrado — WhatsApp não enviado (confirmação)');
  } else {
    console.log('[notificacoes-ponto] Funcionário com telefone inválido — WhatsApp não enviado (aviso in-app se houver usuário)');
  }

  return {
    ok: true,
    funcionario_id: fid,
    usuario_id: usuarioIdFunc || null,
    whatsapp_numero_normalizado: telNorm || null,
    aviso_whatsapp_cadastro: aviso_whatsapp_cadastro || null
  };
}

/**
 * Notifica todos os responsáveis da obra quando um funcionário fecha o dia.
 * Envia: email + WhatsApp + notificação in-app
 */
export async function notificarResponsaveisObraPontoConcluido(registro, funcionario) {
  const obraId = await resolverObraIdParaNotificacao(registro, funcionario);
  if (!obraId) {
    console.warn('[notificacoes-ponto] Sem obra_id, não é possível notificar responsáveis');
    return {
      ok: false,
      motivo: 'sem_obra_id',
      obra_id: null,
      destinatarios: []
    };
  }

  console.log(
    '[notificacoes-ponto] Iniciando lote de notificações — registro=%s obra_id=%s funcionario="%s" (id=%s)',
    registro?.id,
    obraId,
    funcionario?.nome || '—',
    funcionario?.id ?? funcionario?.funcionario_id ?? registro?.funcionario_id ?? '—'
  );

  try {
    const { data: responsaveis, error } = await supabaseAdmin
      .from('responsaveis_obra')
      .select('id, nome, email, telefone, usuario')
      .eq('obra_id', obraId)
      .eq('ativo', true);

    if (error) {
      console.error('[notificacoes-ponto] Erro ao listar responsaveis_obra:', error.message);
    }

    const lista = responsaveis || [];

    if (lista.length > 0) {
      console.log(
        '[notificacoes-ponto] Destinatários em responsaveis_obra (obra %s): %s',
        obraId,
        JSON.stringify(
          lista.map((r) => ({
            id: r.id,
            nome: r.nome,
            email: r.email || null,
            telefone: r.telefone || null,
            usuario: r.usuario || null
          }))
        )
      );
    }

    const { data: obra } = await supabaseAdmin
      .from('obras')
      .select('nome')
      .eq('id', obraId)
      .single();

    const obraNome = obra?.nome || `Obra #${obraId}`;
    const baseUrl = FRONTEND_URL();
    const linkAssinar = `${baseUrl}/pwa/aprovacao-assinatura?id=${registro.id}`;

    /** @type {Array<Record<string, unknown>>} */
    const destinatarios = [];

    for (const resp of lista) {
      try {
        const det = await enviarPacoteNotificacaoResponsavelPonto({
          nome: resp.nome,
          email: resp.email,
          telefone: resp.telefone,
          usuarioIdDireto: undefined,
          responsavelRow: resp,
          registro,
          funcionario,
          obraNome,
          linkAssinar
        });
        if (det) destinatarios.push({ responsavel_obra_id: resp.id, ...det });
      } catch (e) {
        console.error(`[notificacoes-ponto] Erro ao notificar responsável ${resp.nome}:`, e.message);
      }
    }

    let modo = lista.length > 0 ? 'responsaveis_obra' : 'nenhum';

    if (lista.length === 0) {
      const supervisor = await buscarSupervisorPorObra(obraId);
      if (supervisor) {
        console.log(
          '[notificacoes-ponto] Fallback supervisor da obra — usuario_id=%s nome="%s" email=%s telefone=%s',
          supervisor.id,
          supervisor.nome || '—',
          supervisor.email || '(sem)',
          supervisor.telefone || '(sem)'
        );
        modo = 'supervisor_obra';
        try {
          const det = await enviarPacoteNotificacaoResponsavelPonto({
            nome: supervisor.nome,
            email: supervisor.email,
            telefone: supervisor.telefone,
            usuarioIdDireto: supervisor.id,
            responsavelRow: null,
            registro,
            funcionario,
            obraNome,
            linkAssinar
          });
          if (det) destinatarios.push(det);
        } catch (e) {
          console.error('[notificacoes-ponto] Erro ao notificar supervisor (fallback):', e.message);
        }
      } else {
        console.log('[notificacoes-ponto] Nenhum responsável ativo nem supervisor da obra para notificar — obra', obraId);
      }
    }

    console.log(
      `[notificacoes-ponto] Fluxo de notificação concluído — ${lista.length} responsável(is) em responsaveis_obra — obra ${obraNome}` +
        (lista.length === 0 ? ' (tentativa fallback supervisor)' : '')
    );

    let funcionario_confirmacao = null;
    try {
      funcionario_confirmacao = await notificarFuncionarioDiaEnviadoAssinatura(registro, funcionario, obraNome);
    } catch (err) {
      console.error('[notificacoes-ponto] Erro ao notificar funcionário (confirmação):', err.message);
    }

    /** @type {Array<{ tipo: string, nome: string|null, mensagem: string }>} */
    const avisos_telefone_cadastro = [];
    for (const d of destinatarios) {
      if (d.aviso_whatsapp_cadastro) {
        avisos_telefone_cadastro.push({
          tipo: 'responsavel_obra',
          nome: typeof d.nome === 'string' ? d.nome : null,
          mensagem: d.aviso_whatsapp_cadastro
        });
      }
    }
    if (funcionario_confirmacao?.aviso_whatsapp_cadastro) {
      avisos_telefone_cadastro.push({
        tipo: 'funcionario',
        nome: null,
        mensagem: funcionario_confirmacao.aviso_whatsapp_cadastro
      });
    }

    const resumo = {
      ok: true,
      obra_id: obraId,
      obra_nome: obraNome,
      modo,
      quantidade_destinatarios: destinatarios.length,
      destinatarios,
      funcionario_confirmacao,
      avisos_telefone_cadastro,
      onde_ver_logs_servidor:
        'Terminal do backend (Node). No navegador só aparecem estes dados se a API os devolver no JSON (campo destinatarios).'
    };
    console.log('[notificacoes-ponto] Resumo retorno API:', JSON.stringify(resumo, null, 0));
    return resumo;
  } catch (e) {
    console.error('[notificacoes-ponto] Erro geral ao notificar responsáveis:', e);
    return {
      ok: false,
      motivo: 'erro',
      erro: e.message,
      obra_id: obraId,
      destinatarios: []
    };
  }
}

/**
 * Notificação genérica de pendência de aprovação para responsáveis da obra.
 * Não depende de registro/funcionário específico.
 */
export async function notificarResponsaveisObraPontosPendentes(obraId) {
  if (!obraId) return { success: false, motivo: 'obra_id_ausente' };

  try {
    const { data: responsaveis, error } = await supabaseAdmin
      .from('responsaveis_obra')
      .select('id, nome, email, telefone, usuario')
      .eq('obra_id', obraId)
      .eq('ativo', true);

    if (error) {
      console.error('[notificacoes-ponto] Erro ao listar responsaveis_obra (pendência genérica):', error.message);
    }

    let lista = responsaveis || [];
    if (lista.length === 0) {
      const supervisor = await buscarSupervisorPorObra(obraId);
      if (supervisor) {
        console.log(
          `[notificacoes-ponto] Pendência genérica: sem responsaveis_obra — notificando supervisor obra #${obraId} (usuário ${supervisor.id})`
        );
        lista = [
          {
            id: null,
            nome: supervisor.nome,
            email: supervisor.email,
            telefone: supervisor.telefone,
            usuario: null,
            __usuarioId: supervisor.id
          }
        ];
      }
    }

    if (lista.length === 0) {
      console.log('[notificacoes-ponto] Nenhum responsável ativo nem supervisor para obra', obraId);
      return { success: false, motivo: 'sem_responsaveis', obra_id: obraId };
    }

    const { data: obra } = await supabaseAdmin
      .from('obras')
      .select('nome')
      .eq('id', obraId)
      .single();

    const obraNome = obra?.nome || `Obra #${obraId}`;
    const baseUrl = FRONTEND_URL();
    const linkAprovacoes = `${baseUrl}/pwa/aprovacoes`;

    const diagnostico = [];

    for (const resp of lista) {
      try {
        if (resp.email) {
          await sendEmail({
            to: resp.email,
            subject: `Existem pontos pendentes de aprovação — ${obraNome}`,
            html: `<p>Olá ${resp.nome || 'responsável'},</p>
                   <p>Existem registros de ponto pendentes de aprovação na obra <strong>${obraNome}</strong>.</p>
                   <p><a href="${linkAprovacoes}">Acessar aprovações</a></p>`,
            tipo: 'notificacao_ponto_pendente_generica'
          }).catch(e => console.error('[notificacoes-ponto] Erro email pendência genérica:', e.message));
        }

        const telefoneResponsavel = normalizarTelefoneWhatsapp(resp.telefone);
        if (telefoneResponsavel) {
          await enviarMensagemWebhook(
            telefoneResponsavel,
            `📋 *Pontos pendentes de aprovação*\n\nHá registros aguardando sua assinatura na obra *${obraNome}*.\nAcesse: ${linkAprovacoes}`,
            linkAprovacoes,
            { tipo: 'ponto_pendente_generico', destinatario_nome: resp.nome }
          ).catch(e => console.error('[notificacoes-ponto] Erro WhatsApp pendência genérica:', e.message));
        }

        const usuarioId =
          resp.__usuarioId != null && resp.__usuarioId !== undefined
            ? resp.__usuarioId
            : await resolverUsuarioId(resp);
        let pushResultado = null;
        if (usuarioId) {
          const { data: notif } = await supabaseAdmin
            .from('notificacoes')
            .insert({
              usuario_id: usuarioId,
              tipo: 'info',
              titulo: 'Pontos pendentes de aprovação',
              mensagem: `Existem registros aguardando sua assinatura em ${obraNome}.`,
              link: '/pwa/aprovacoes',
              lida: false,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (notif) {
            try { emitirNotificacao(usuarioId, notif); } catch (e) { /* websocket offline */ }
          }

          pushResultado = await enviarPushParaUsuario(usuarioId, {
            title: 'Pontos pendentes de aprovação',
            body: `Existem registros aguardando sua assinatura em ${obraNome}.`,
            ...pushPwaRelativo({ path: '/pwa/aprovacoes' }),
            tag: `ponto-pendente-generico-${obraId}`
          });
        }

        diagnostico.push({
          responsavel_id: resp.id,
          responsavel_nome: resp.nome,
          email: resp.email,
          telefone: resp.telefone,
          usuario_id_resolvido: usuarioId || null,
          push: pushResultado || { configurado: false, subscriptions_ativas: 0, enviados: 0, falhas: 0, desativados: 0 }
        });
      } catch (e) {
        console.error(`[notificacoes-ponto] Erro ao notificar responsável ${resp.nome}:`, e.message);
        diagnostico.push({
          responsavel_id: resp.id,
          responsavel_nome: resp.nome,
          erro: e.message
        });
      }
    }
    return { success: true, obra_id: obraId, diagnostico };
  } catch (e) {
    console.error('[notificacoes-ponto] Erro geral ao notificar pendência genérica:', e);
    return { success: false, motivo: 'erro_geral', erro: e.message };
  }
}

/**
 * Notifica o funcionário quando o responsável assina seu registro.
 * Envia: email + WhatsApp + notificação in-app + push PWA (quando houver usuário e subscription)
 */
export async function notificarFuncionarioPontoAssinado(registro, funcionario, responsavel) {
  const baseUrl = FRONTEND_URL();
  const linkAssinar = `${baseUrl}/pwa/aprovacao-assinatura?id=${registro.id}`;
  const responsavelNome = responsavel?.nome || 'Responsável';

  try {
    const fid =
      funcionario?.id || funcionario?.funcionario_id || registro?.funcionario_id;

    if (!fid) {
      console.warn('[notificacoes-ponto] notificarFuncionarioPontoAssinado: sem funcionario_id — ignorado');
      return;
    }

    const { data: funcData, error: errFunc } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, email, telefone_whatsapp, telefone')
      .eq('id', fid)
      .maybeSingle();

    if (errFunc) {
      console.error('[notificacoes-ponto] Erro ao buscar funcionário (assinatura responsável):', errFunc.message);
    }

    const emailFunc = funcData?.email || null;
    const telefoneFunc = normalizarTelefoneWhatsapp(funcData?.telefone_whatsapp || funcData?.telefone);

    let usuarioIdFunc = await resolverUsuarioIdPorFuncionario(fid);
    if (!usuarioIdFunc && emailFunc) {
      usuarioIdFunc = await buscarUsuarioIdPorEmail(emailFunc);
      if (usuarioIdFunc) {
        console.log(
          '[notificacoes-ponto] Assinatura responsável: usuario_id do funcionário resolvido por email (fallback usuarios.email)'
        );
      }
    }

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

    // 3) Notificação in-app + push (mesmo fluxo que “ponto enviado ao responsável”)
    if (usuarioIdFunc) {
      const agora = new Date().toISOString();
      const { data: notif, error: errNotif } = await supabaseAdmin
        .from('notificacoes')
        .insert({
          usuario_id: usuarioIdFunc,
          tipo: 'success',
          titulo: 'Ponto assinado pelo responsável',
          mensagem: `${responsavelNome} assinou seu registro de ${formatarData(registro.data)}. Acesse o app para assinar também.`,
          link: `/pwa/aprovacao-assinatura?id=${registro.id}`,
          lida: false,
          created_at: agora
        })
        .select()
        .single();

      if (errNotif) {
        console.error(
          '[notificacoes-ponto] Erro ao inserir notificação (assinatura responsável):',
          errNotif.message
        );
      }

      if (notif) {
        try {
          emitirNotificacao(usuarioIdFunc, notif);
        } catch (e) {
          /* websocket offline */
        }
      }

      try {
        const pushResultado = await withTimeout(
          enviarPushParaUsuario(usuarioIdFunc, {
            title: 'Assine seu ponto',
            body: `${responsavelNome} assinou seu registro de ${formatarData(registro.data)}. Toque para abrir e assinar.`,
            ...pushPwaRelativo({ path: `/pwa/aprovacao-assinatura?id=${registro.id}` }),
            tag: `ponto-func-assinar-${registro.id}`
          }),
          MS_TIMEOUT_PUSH,
          'push_funcionario_assinatura_resp'
        );
        console.log(
          '[notificacoes-ponto] Push ao funcionário (assinatura responsável) usuario_id=%s → %s',
          usuarioIdFunc,
          JSON.stringify(pushResultado)
        );
      } catch (e) {
        console.warn('[notificacoes-ponto] Push funcionário (assinatura responsável) falhou ou timeout:', e.message);
      }
    } else {
      console.warn(
        '[notificacoes-ponto] Funcionário id=%s sem usuario_id (cadastre usuarios.funcionario_id ou use o mesmo email do colaborador no login) — in-app/push não enviados. Email/WhatsApp seguem se configurados.',
        fid
      );
    }

    console.log(
      `[notificacoes-ponto] Funcionário ${funcData?.nome || fid} notificado sobre assinatura do responsável (canais conforme cadastro)`
    );
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
    const fid =
      funcionario?.id || funcionario?.funcionario_id || registro?.funcionario_id;

    if (!fid) {
      console.warn('[notificacoes-ponto] notificarFuncionarioPontoRejeitado: sem funcionario_id — ignorado');
      return;
    }

    const { data: funcData, error: errFunc } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, email, telefone_whatsapp, telefone')
      .eq('id', fid)
      .maybeSingle();

    if (errFunc) {
      console.error('[notificacoes-ponto] Erro ao buscar funcionário (rejeição):', errFunc.message);
    }

    const emailFunc = funcData?.email || null;
    const telefoneFunc = funcData?.telefone_whatsapp || funcData?.telefone;

    let usuarioIdFunc = await resolverUsuarioIdPorFuncionario(fid);
    if (!usuarioIdFunc && emailFunc) {
      usuarioIdFunc = await buscarUsuarioIdPorEmail(emailFunc);
      if (usuarioIdFunc) {
        console.log(
          '[notificacoes-ponto] Rejeição: usuario_id do funcionário resolvido por email (fallback usuarios.email)'
        );
      }
    }

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

    // 3) Notificação in-app + push
    if (usuarioIdFunc) {
      const agora = new Date().toISOString();
      const { data: notif, error: errNotif } = await supabaseAdmin
        .from('notificacoes')
        .insert({
          usuario_id: usuarioIdFunc,
          tipo: 'warning',
          titulo: 'Registro de ponto não aprovado',
          mensagem: `${responsavelNome} não concordou com seu registro de ${formatarData(registro.data)}. Motivo: ${comentario || 'Sem comentário'}. Corrija as horas no app.`,
          link: `/pwa/aprovacoes`,
          lida: false,
          created_at: agora
        })
        .select()
        .single();

      if (errNotif) {
        console.error('[notificacoes-ponto] Erro ao inserir notificação (rejeição):', errNotif.message);
      }

      if (notif) {
        try {
          emitirNotificacao(usuarioIdFunc, notif);
        } catch (e) {
          /* websocket offline */
        }
      }

      try {
        const pushResultado = await withTimeout(
          enviarPushParaUsuario(usuarioIdFunc, {
            title: 'Ponto não aprovado',
            body: `${responsavelNome} pediu correção no seu registro de ${formatarData(registro.data)}.`,
            ...pushPwaRelativo({ path: '/pwa/aprovacoes' }),
            tag: `ponto-func-rejeicao-${registro.id}`
          }),
          MS_TIMEOUT_PUSH,
          'push_funcionario_rejeicao'
        );
        console.log(
          '[notificacoes-ponto] Push ao funcionário (rejeição) usuario_id=%s → %s',
          usuarioIdFunc,
          JSON.stringify(pushResultado)
        );
      } catch (e) {
        console.warn('[notificacoes-ponto] Push funcionário (rejeição) falhou ou timeout:', e.message);
      }
    } else {
      console.warn(
        '[notificacoes-ponto] Funcionário id=%s sem usuario_id — in-app/push não enviados (rejeição).',
        fid
      );
    }

    console.log(
      `[notificacoes-ponto] Funcionário ${funcData?.nome || fid} notificado sobre rejeição do responsável`
    );
  } catch (e) {
    console.error('[notificacoes-ponto] Erro ao notificar funcionário (rejeição):', e);
  }
}

// =========================================================
// HELPERS INTERNOS
// =========================================================

/** Escapa % e _ para ILIKE tratar o email como texto literal (evita falso positivo com _ no email). */
function escapeLikeLiteralEmail(email) {
  return String(email).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Resolve usuarios.id a partir do email com várias tentativas (cadastro às vezes difere em maiúsculas).
 */
async function buscarUsuarioIdPorEmail(email) {
  const e = (email || '').trim();
  if (!e) return null;

  const tentativas = [e, e.toLowerCase(), e.toUpperCase()];
  for (const candidato of tentativas) {
    try {
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .is('deleted_at', null)
        .eq('email', candidato)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') continue;
      if (data?.id) return data.id;
    } catch {
      /* continua */
    }
  }

  // ILIKE com padrão literal (case-insensitive sem wildcards acidentais)
  try {
    const literal = escapeLikeLiteralEmail(e);
    const { data: rows, error } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .is('deleted_at', null)
      .ilike('email', literal)
      .limit(2);
    if (error) return null;
    if (rows?.length === 1) return rows[0].id;
    if (rows?.length > 1) {
      console.warn('[notificacoes-ponto] Vários usuários com mesmo email (ilike literal):', e);
    }
  } catch {
    /* ignora */
  }

  return null;
}

async function resolverUsuarioId(responsavel) {
  if (!responsavel) return null;

  // Campo `usuario` pode ser o ID numérico do usuário (cadastro legado)
  if (responsavel.usuario != null && String(responsavel.usuario).trim() !== '') {
    const raw = String(responsavel.usuario).trim();
    if (/^\d+$/.test(raw)) {
      const asNum = parseInt(raw, 10);
      try {
        const { data: porId } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .eq('id', asNum)
          .is('deleted_at', null)
          .maybeSingle();
        if (porId?.id) return porId.id;
      } catch {
        /* continua */
      }
    }
  }

  const emailCandidato =
    responsavel.email ||
    (typeof responsavel.usuario === 'string' && responsavel.usuario.includes('@')
      ? responsavel.usuario.trim()
      : null);

  if (emailCandidato) {
    const id = await buscarUsuarioIdPorEmail(emailCandidato);
    if (id) return id;
    console.warn(
      '[notificacoes-ponto] Email do responsável de obra não encontrou linha em usuarios (notificação in-app/push):',
      emailCandidato
    );
    return null;
  }

  return null;
}

async function resolverUsuarioIdPorFuncionario(funcionarioId) {
  if (!funcionarioId) return null;

  try {
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('funcionario_id', funcionarioId)
      .maybeSingle();

    return usuario?.id || null;
  } catch {
    return null;
  }
}

/**
 * Primeira obra_id em alocações RH ativas (status ativo + data_fim futura ou nula).
 * Ordem: data_inicio mais recente primeiro.
 */
async function obraIdDeAlocacaoAtivaFuncionario(funcionarioId) {
  const { data: alocacoes, error } = await supabaseAdmin
    .from('funcionarios_obras')
    .select('obra_id, data_fim, data_inicio')
    .eq('funcionario_id', funcionarioId)
    .eq('status', 'ativo')
    .order('data_inicio', { ascending: false });

  if (error || !alocacoes?.length) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (const a of alocacoes) {
    if (!a?.obra_id) continue;
    if (!a.data_fim) return a.obra_id;
    const df = new Date(a.data_fim);
    df.setHours(0, 0, 0, 0);
    if (df >= hoje) return a.obra_id;
  }
  return null;
}

export async function resolverObraIdParaNotificacao(registro, funcionario) {
  const obraIdDireto = registro?.obra_id || funcionario?.obra_atual_id || funcionario?.obraAtualId;
  if (obraIdDireto) return obraIdDireto;

  const funcionarioId = registro?.funcionario_id || funcionario?.id || funcionario?.funcionario_id;
  if (!funcionarioId) return null;

  try {
    const { data: funcData } = await supabaseAdmin
      .from('funcionarios')
      .select('obra_atual_id')
      .eq('id', funcionarioId)
      .single();

    if (funcData?.obra_atual_id) return funcData.obra_atual_id;

    const obraAlocacao = await obraIdDeAlocacaoAtivaFuncionario(funcionarioId);
    if (obraAlocacao) {
      console.log(
        '[notificacoes-ponto] obra_id resolvida via funcionarios_obras (alocação ativa): %s funcionario=%s',
        obraAlocacao,
        funcionarioId
      );
      return obraAlocacao;
    }

    const { data: vinculoGrua } = await supabaseAdmin
      .from('grua_funcionario')
      .select('obra_id')
      .eq('funcionario_id', funcionarioId)
      .eq('status', 'Ativo')
      .not('obra_id', 'is', null)
      .order('data_inicio', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (vinculoGrua?.obra_id) {
      console.log(
        '[notificacoes-ponto] obra_id resolvida via grua_funcionario: %s funcionario=%s',
        vinculoGrua.obra_id,
        funcionarioId
      );
      return vinculoGrua.obra_id;
    }

    return null;
  } catch {
    return null;
  }
}

async function enviarPushParaUsuario(usuarioId, payload) {
  const baseVazio = {
    configurado: isWebPushConfigured(),
    subscriptions_ativas: 0,
    enviados: 0,
    falhas: 0,
    desativados: 0,
    mensagem_usuario: null
  };

  if (!usuarioId) {
    return { ...baseVazio, mensagem_usuario: 'Sem usuario_id vinculado ao responsável — in-app/push não enviados.' };
  }

  if (!isWebPushConfigured()) {
    console.warn(
      '[notificacoes-ponto] Push: WEB_PUSH_VAPID_PUBLIC_KEY / PRIVATE_KEY / SUBJECT ausentes no .env — push desativado no servidor.'
    );
    return {
      ...baseVazio,
      configurado: false,
      mensagem_usuario:
        'Push não configurado no servidor (defina WEB_PUSH_VAPID_SUBJECT, WEB_PUSH_VAPID_PUBLIC_KEY e WEB_PUSH_VAPID_PRIVATE_KEY no backend).'
    };
  }

  try {
    const { data: subscriptions } = await supabaseAdmin
      .from('pwa_push_subscriptions')
      .select('id, subscription')
      .eq('user_id', String(usuarioId))
      .eq('is_active', true);

    if (!subscriptions || subscriptions.length === 0) {
      console.warn(
        '[notificacoes-ponto] Push: nenhuma subscription ativa em pwa_push_subscriptions para user_id=%s — abra o PWA logado como este usuário e permita notificações.',
        String(usuarioId)
      );
      return {
        configurado: true,
        subscriptions_ativas: 0,
        enviados: 0,
        falhas: 0,
        desativados: 0,
        mensagem_usuario:
          'Nenhum dispositivo inscrito para notificações push. No celular: abra o PWA (sistemairbana.com.br/pwa), faça login como responsável e ative as notificações do navegador.'
      };
    }

    let enviados = 0;
    let falhas = 0;
    let desativados = 0;

    for (const item of subscriptions) {
      try {
        await sendWebPush(item.subscription, payload);
        enviados++;
      } catch (pushError) {
        falhas++;
        const statusCode = pushError?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabaseAdmin
            .from('pwa_push_subscriptions')
            .update({
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          desativados++;
        }
      }
    }

    const mensagemUsuario =
      enviados > 0
        ? null
        : falhas > 0
          ? 'Push não entregue (assinatura expirada ou navegador revogou). Abra o PWA e permita notificações de novo.'
          : 'Nenhuma entrega push.';

    if (enviados === 0) {
      console.warn(
        '[notificacoes-ponto] Push: 0 enviados para user_id=%s (falhas=%s, desativados=%s)',
        String(usuarioId),
        falhas,
        desativados
      );
    } else {
      console.log(
        '[notificacoes-ponto] Push: %s entregue(s) ao FCM/Web Push para user_id=%s',
        enviados,
        String(usuarioId)
      );
    }

    return {
      configurado: true,
      subscriptions_ativas: subscriptions.length,
      enviados,
      falhas,
      desativados,
      mensagem_usuario: mensagemUsuario
    };
  } catch (error) {
    console.error('[notificacoes-ponto] Erro ao enviar push:', error.message);
    return {
      configurado: true,
      subscriptions_ativas: 0,
      enviados: 0,
      falhas: 1,
      desativados: 0,
      erro: error.message,
      mensagem_usuario: `Erro ao enviar push: ${error.message}`
    };
  }
}
