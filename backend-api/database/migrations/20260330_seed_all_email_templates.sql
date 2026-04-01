-- Seed / criação de templates de e-mail (sem sobrescrever edições do painel)
-- Tipos suportados hoje:
-- - medicao_enviada
-- - welcome, reset_password, password_changed
-- - notificacao_ponto_responsavel, notificacao_ponto_pendente_generica, notificacao_ponto_funcionario, notificacao_ponto_rejeicao

-- Garante que o CHECK de tipos não bloqueie templates novos.
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS chk_email_templates_tipo;

-- =====================================================
-- Conta e acesso
-- =====================================================

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'welcome',
  'Email de Boas-vindas',
  'Bem-vindo ao {{empresa}}!',
  $WELCOME$
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
      <div style="font-size: 24px; font-weight: bold; color: #007bff;">🏗️ {{empresa}}</div>
    </div>
    <div style="padding: 20px 0; line-height: 1.6; color: #333;">
      <h2>Olá, {{nome}}! 👋</h2>
      <p>Seja bem-vindo(a) ao <strong>{{empresa}}</strong>!</p>
      <p>Sua conta foi criada com sucesso e você já pode acessar o sistema. Para garantir a segurança da sua conta, geramos uma senha temporária que deve ser alterada no primeiro acesso.</p>
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <h3>📧 Suas Credenciais de Acesso</h3>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Senha Temporária:</strong> <code style="background: #fff; padding: 2px 6px; border: 1px solid #ddd;">{{senha_temporaria}}</code></p>
      </div>
      <div style="text-align: center;">
        <a href="{{link_login}}" style="display: inline-block; padding: 12px 30px; background: #007bff; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0;">Acessar o Sistema</a>
      </div>
      <div style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <strong>⚠️ Importante:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Esta é uma senha <strong>temporária</strong></li>
          <li>Altere sua senha no primeiro acesso</li>
          <li>Não compartilhe suas credenciais com ninguém</li>
        </ul>
      </div>
    </div>
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top: 10px; color: #999;">
        Este é um email automático, por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
$WELCOME$,
  '["nome", "email", "senha_temporaria", "link_login", "empresa", "ano"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'reset_password',
  'Redefinição de Senha',
  'Redefinir sua senha - {{empresa}}',
  $RESET_PASSWORD$
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
      <div style="font-size: 24px; font-weight: bold; color: #007bff;">🏗️ {{empresa}}</div>
    </div>
    <div style="padding: 20px 0; line-height: 1.6; color: #333;">
      <h2>Olá, {{nome}}! 🔒</h2>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{reset_link}}" style="display: inline-block; padding: 12px 30px; background: #007bff; color: white !important; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
      </div>
      <div style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <strong>⏱️ Atenção:</strong>
        <p style="margin: 10px 0;">Este link expira em <strong>{{expiry_time}}</strong>.</p>
      </div>
      <p style="font-size: 12px; color: #666;">
        Se o botão não funcionar, copie e cole o seguinte link no seu navegador:<br>
        <a href="{{reset_link}}" style="color: #007bff; word-break: break-all;">{{reset_link}}</a>
      </p>
    </div>
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top: 10px; color: #999;">
        Este é um email automático, por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
$RESET_PASSWORD$,
  '["nome", "email", "reset_link", "expiry_time", "empresa", "ano"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'password_changed',
  'Senha Alterada',
  'Sua senha foi alterada - {{empresa}}',
  $PASSWORD_CHANGED$
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Senha Alterada</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #28a745;">
      <div style="font-size: 24px; font-weight: bold; color: #28a745;">🏗️ {{empresa}}</div>
    </div>
    <div style="padding: 20px 0; line-height: 1.6; color: #333;">
      <h2>Olá, {{nome}}! ✅</h2>
      <p>Sua senha foi alterada com sucesso!</p>
      <div style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
        <p style="margin: 0;"><strong>✔️ Senha atualizada em:</strong> {{data_alteracao}}</p>
      </div>
      <p>Se você não realizou esta alteração, <strong>entre em contato com o suporte imediatamente</strong>.</p>
    </div>
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top: 10px; color: #999;">
        Este é um email automático, por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
$PASSWORD_CHANGED$,
  '["nome", "email", "data_alteracao", "empresa", "ano"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

-- =====================================================
-- Medição
-- =====================================================

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'medicao_enviada',
  'Medição enviada ao cliente',
  'MEDIÇÃO {{numero}} - {{periodo_assunto}} - {{obra_nome_assunto}} - {{grua_nome_assunto}}',
  $MEDICAO_ENVIADA$
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medição</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:16px 8px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;border-bottom:2px solid #2563eb;text-align:center;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:#1e3a8a;">{{empresa}}</p>
              <p style="margin:10px 0 0;font-size:14px;color:#4b5563;">Medição — análise e faturamento</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <div style="margin-bottom:4px;">{{bloco_comercial_html}}</div>
              <p style="margin:20px 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.03em;">Detalhes no sistema</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;" />

              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Informações básicas</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="50%" style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Número</p>
                    <p style="margin:4px 0 0;font-size:14px;font-weight:600;">{{numero}}</p>
                  </td>
                  <td width="50%" style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Período (mês/ano)</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{periodo_formatado}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Data Início Emissão</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{data_inicio_emissao}}</p>
                  </td>
                  <td style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Data Fim Emissão</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{data_fim_emissao}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Total de Dias</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{total_dias_emissao}}</p>
                  </td>
                  <td style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Grua</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{grua_linha}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Obra</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{obra_nome}}</p>
                  </td>
                  <td style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Valor Total</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#2563eb;">R$ {{valor_total}}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Valores</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="25%" style="padding:6px 4px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Valor mensal bruto</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;">R$ {{valor_mensal_bruto}}</p>
                  </td>
                  <td width="25%" style="padding:6px 4px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Aditivos</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;">R$ {{valor_aditivos}}</p>
                  </td>
                  <td width="25%" style="padding:6px 4px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Custos extras</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;">R$ {{valor_custos_extras}}</p>
                  </td>
                  <td width="25%" style="padding:6px 4px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Descontos</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:600;">R$ {{valor_descontos}}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Histórico de status da medição</p>
              <div style="margin-bottom:20px;">{{historico_status_html}}</div>

              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Documentos</p>
              <div style="margin-bottom:20px;">{{documentos_resumo_html}}</div>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background:#2563eb;">
                    <a href="{{link_pdf}}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff !important;text-decoration:none;">Abrir PDF da medição</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:11px;color:#6b7280;line-height:1.4;">Se o botão não abrir, copie e cole o link no navegador:<br/><a href="{{link_pdf}}" style="color:#2563eb;word-break:break-all;">{{link_pdf}}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;">
              E-mail automático — {{empresa}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$MEDICAO_ENVIADA$,
  '["numero", "periodo", "periodo_formatado", "periodo_assunto", "obra_nome_assunto", "grua_nome_assunto", "valor_total", "valor_mensal_bruto", "valor_aditivos", "valor_custos_extras", "valor_descontos", "grua_nome", "grua_linha", "obra_nome", "cliente_nome", "data_medicao", "data_inicio_emissao", "data_fim_emissao", "total_dias_emissao", "link_pdf", "empresa", "bloco_comercial_html", "historico_status_html", "documentos_resumo_html"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

-- =====================================================
-- Ponto eletrônico
-- =====================================================

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'notificacao_ponto_responsavel',
  'Ponto — e-mail ao responsável',
  'Registro de ponto concluído — {{funcionario_nome}} — {{data_formatada}}',
  $PONTO_RESPONSAVEL$
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#333;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#2563eb;margin-top:0;">Registro de ponto concluído</h2>
<p>Um funcionário fechou o dia e aguarda sua assinatura.</p>
<p><strong>Funcionário:</strong> {{funcionario_nome}}<br/>
<strong>Cargo:</strong> {{funcionario_cargo}}<br/>
<strong>Obra:</strong> {{obra_nome}}</p>
<p><strong>Data:</strong> {{data_formatada}}</p>
<table cellpadding="8" style="border-collapse:collapse;width:100%;border:1px solid #ddd;font-size:14px;">
<tr><td style="border:1px solid #eee;">Entrada</td><td style="border:1px solid #eee;">{{entrada}}</td></tr>
<tr><td style="border:1px solid #eee;">Saída almoço</td><td style="border:1px solid #eee;">{{saida_almoco}}</td></tr>
<tr><td style="border:1px solid #eee;">Volta almoço</td><td style="border:1px solid #eee;">{{volta_almoco}}</td></tr>
<tr><td style="border:1px solid #eee;">Saída</td><td style="border:1px solid #eee;">{{saida}}</td></tr>
</table>
<p><strong>Horas trabalhadas:</strong> {{horas_trabalhadas}}h · <strong>Extras:</strong> {{horas_extras}}h</p>
<p><a href="{{link_assinar}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff!important;text-decoration:none;border-radius:6px;">Assinar agora</a></p>
<p style="font-size:12px;color:#888;">Sistema de Gerenciamento de Gruas</p>
</body></html>
$PONTO_RESPONSAVEL$,
  '["funcionario_nome","funcionario_cargo","obra_nome","data_formatada","entrada","saida_almoco","volta_almoco","saida","horas_trabalhadas","horas_extras","link_assinar"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'notificacao_ponto_pendente_generica',
  'Ponto — pendências de aprovação na obra',
  'Existem pontos pendentes de aprovação — {{obra_nome}}',
  $PONTO_PENDENTE$
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;padding:24px;max-width:600px;margin:0 auto;">
<p>Olá, {{responsavel_nome}},</p>
<p>Existem registros de ponto pendentes de aprovação na obra <strong>{{obra_nome}}</strong>.</p>
<p><a href="{{link_aprovacoes}}">Acessar aprovações</a></p>
</body></html>
$PONTO_PENDENTE$,
  '["responsavel_nome","obra_nome","link_aprovacoes"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'notificacao_ponto_funcionario',
  'Ponto — assinado pelo responsável (funcionário)',
  'Ponto assinado pelo responsável — {{data_formatada}}',
  $PONTO_FUNCIONARIO$
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;padding:24px;max-width:600px;margin:0 auto;">
<h2 style="color:#16a34a;margin-top:0;">Ponto assinado pelo responsável</h2>
<p>O responsável <strong>{{responsavel_nome}}</strong> assinou seu registro de <strong>{{data_formatada}}</strong>.</p>
<p>Horas trabalhadas: <strong>{{horas_trabalhadas}}h</strong> · Extras: <strong>{{horas_extras}}h</strong></p>
<p><a href="{{link_assinar}}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff!important;text-decoration:none;border-radius:6px;">Assinar no app</a></p>
</body></html>
$PONTO_FUNCIONARIO$,
  '["responsavel_nome","data_formatada","horas_trabalhadas","horas_extras","link_assinar"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'notificacao_ponto_rejeicao',
  'Ponto — registro não aprovado',
  'Registro de ponto não aprovado — {{data_formatada}}',
  $PONTO_REJEICAO$
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;padding:24px;max-width:600px;margin:0 auto;">
<h2 style="color:#dc2626;margin-top:0;">Registro não aprovado</h2>
<p><strong>Responsável:</strong> {{responsavel_nome}}</p>
<p><strong>Motivo:</strong> {{comentario}}</p>
<p><strong>Data:</strong> {{data_formatada}}</p>
<table cellpadding="8" style="border-collapse:collapse;width:100%;border:1px solid #ddd;font-size:14px;">
<tr><td>Entrada</td><td>{{entrada}}</td></tr>
<tr><td>Saída almoço</td><td>{{saida_almoco}}</td></tr>
<tr><td>Volta almoço</td><td>{{volta_almoco}}</td></tr>
<tr><td>Saída</td><td>{{saida}}</td></tr>
</table>
<p>Horas: {{horas_trabalhadas}}h · Extras: {{horas_extras}}h</p>
<p><a href="{{link_corrigir}}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff!important;text-decoration:none;border-radius:6px;">Corrigir horas</a></p>
</body></html>
$PONTO_REJEICAO$,
  '["responsavel_nome","comentario","data_formatada","entrada","saida_almoco","volta_almoco","saida","horas_trabalhadas","horas_extras","link_corrigir"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;

