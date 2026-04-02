-- Unifica o visual dos templates de e-mail (modelo boas-vindas: card branco, header #007bff, rodapé).
-- Remove botões/links que abrem o app ou o PWA pelo e-mail (copiar URL no navegador ou usar o app instalado).

UPDATE email_templates SET
  html_template = $tpl$<!DOCTYPE html>
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
      <h2 style="margin-top:0;">Olá, {{nome}}! 👋</h2>
      <p>Seja bem-vindo(a) ao <strong>{{empresa}}</strong>!</p>
      <p>Sua conta foi criada com sucesso e você já pode acessar o sistema. Para garantir a segurança da sua conta, geramos uma senha temporária que deve ser alterada no primeiro acesso.</p>
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <h3 style="margin-top:0;">📧 Suas credenciais de acesso</h3>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Senha temporária:</strong> <code style="background: #fff; padding: 2px 6px; border: 1px solid #ddd;">{{senha_temporaria}}</code></p>
      </div>
      <div style="background: #e7f1ff; padding: 14px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #333;">
        <strong>Como acessar:</strong> use o <strong>aplicativo instalado</strong> no celular ou abra o sistema no <strong>navegador</strong> (endereço que sua empresa utiliza). Links de e-mail costumam <em>não abrir o app PWA</em> corretamente — prefira o atalho do sistema.
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
        Este é um e-mail automático, por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>$tpl$,
  variaveis = '["nome", "email", "senha_temporaria", "link_login", "empresa", "ano"]'::jsonb
WHERE tipo = 'welcome';

UPDATE email_templates SET
  html_template = $tpl$<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir senha</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
      <div style="font-size: 24px; font-weight: bold; color: #007bff;">🏗️ {{empresa}}</div>
    </div>
    <div style="padding: 20px 0; line-height: 1.6; color: #333;">
      <h2 style="margin-top:0;">Olá, {{nome}}! 🔒</h2>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanecerá a mesma.</p>
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <p style="margin:0 0 10px;font-size:14px;"><strong>Redefinir senha</strong></p>
        <p style="margin:0 0 12px;font-size:13px;color:#555;">Copie o endereço abaixo e abra no <strong>navegador</strong> do celular ou do computador. Links em e-mail nem sempre abrem o aplicativo (PWA) de forma confiável.</p>
        <p style="margin:0;font-size:11px;word-break:break-all;font-family:Consolas,monospace;color:#111;">{{reset_link}}</p>
      </div>
      <div style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <strong>⏱️ Atenção:</strong>
        <p style="margin: 10px 0 0;">Este link expira em <strong>{{expiry_time}}</strong>.</p>
      </div>
    </div>
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top: 10px; color: #999;">
        Este é um e-mail automático, por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>$tpl$
WHERE tipo = 'reset_password';

UPDATE email_templates SET
  html_template = $tpl$<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Senha alterada</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
      <div style="font-size: 24px; font-weight: bold; color: #007bff;">🏗️ {{empresa}}</div>
    </div>
    <div style="padding: 20px 0; line-height: 1.6; color: #333;">
      <h2 style="margin-top:0;">Olá, {{nome}}! ✅</h2>
      <p>Sua senha foi alterada com sucesso!</p>
      <div style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
        <p style="margin: 0;"><strong>✔️ Senha atualizada em:</strong> {{data_alteracao}}</p>
      </div>
      <p>Se você não realizou esta alteração, <strong>entre em contato com o suporte imediatamente</strong>.</p>
    </div>
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top: 10px; color: #999;">
        Este é um e-mail automático, por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>$tpl$
WHERE tipo = 'password_changed';

UPDATE email_templates SET
  html_template = $tpl$<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medição</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
      <div style="font-size: 24px; font-weight: bold; color: #007bff;">🏗️ {{empresa}}</div>
      <p style="margin:10px 0 0;font-size:14px;color:#4b5563;">Medição — análise e faturamento</p>
    </div>
    <div style="padding: 8px 0 0; line-height: 1.5; color: #333;">
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
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#007bff;">R$ {{valor_total}}</p>
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
            <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#16a34a;">R$ {{valor_aditivos}}</p>
          </td>
          <td width="25%" style="padding:6px 4px;vertical-align:top;">
            <p style="margin:0;font-size:11px;color:#6b7280;">Custos extras</p>
            <p style="margin:4px 0 0;font-size:13px;font-weight:600;">R$ {{valor_custos_extras}}</p>
          </td>
          <td width="25%" style="padding:6px 4px;vertical-align:top;">
            <p style="margin:0;font-size:11px;color:#6b7280;">Descontos</p>
            <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#dc2626;">R$ {{valor_descontos}}</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Histórico de status da medição</p>
      <div style="margin-bottom:20px;">{{historico_status_html}}</div>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Checklist de documentos</p>
      <div style="margin-bottom:16px;">{{documentos_resumo_html}}</div>
      <div style="background:#f8f9fa;padding:14px;border-left:4px solid #007bff;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#333;">PDF público da medição</p>
        <p style="margin:0 0 8px;font-size:12px;color:#555;">Copie o endereço abaixo e abra no <strong>navegador</strong> (o PDF também pode vir em anexo neste e-mail). Links em e-mail costumam não abrir o app PWA corretamente.</p>
        <p style="margin:0;font-size:11px;word-break:break-all;font-family:Consolas,monospace;color:#111;">{{link_pdf}}</p>
      </div>
    </div>
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top: 10px; color: #999;">
        E-mail automático — por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>$tpl$,
  variaveis = '["numero","periodo","periodo_formatado","periodo_assunto","obra_nome_assunto","grua_nome_assunto","valor_total","valor_mensal_bruto","valor_aditivos","valor_custos_extras","valor_descontos","grua_nome","grua_linha","obra_nome","cliente_nome","data_medicao","data_inicio_emissao","data_fim_emissao","total_dias_emissao","link_pdf","empresa","ano","bloco_comercial_html","historico_status_html","documentos_resumo_html"]'::jsonb
WHERE tipo = 'medicao_enviada';

UPDATE email_templates SET
  html_template = $tpl$<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background-color:#f4f4f4;margin:0;padding:0;">
  <div style="max-width:600px;margin:20px auto;background:white;padding:30px;border-radius:8px;">
    <div style="text-align:center;padding-bottom:20px;border-bottom:2px solid #007bff;">
      <div style="font-size:24px;font-weight:bold;color:#007bff;">🏗️ {{empresa}}</div>
      <p style="margin:10px 0 0;font-size:14px;color:#4b5563;">Ponto eletrônico</p>
    </div>
    <div style="padding:20px 0;line-height:1.6;color:#333;">
      <h2 style="margin-top:0;color:#1e40af;">Registro de ponto concluído</h2>
      <p>Um funcionário fechou o dia e aguarda sua assinatura.</p>
      <p><strong>Funcionário:</strong> {{funcionario_nome}}<br/><strong>Cargo:</strong> {{funcionario_cargo}}<br/><strong>Obra:</strong> {{obra_nome}}</p>
      <p><strong>Data:</strong> {{data_formatada}}</p>
      <table cellpadding="8" style="border-collapse:collapse;width:100%;border:1px solid #ddd;font-size:14px;margin:16px 0;">
        <tr><td style="border:1px solid #eee;">Entrada</td><td style="border:1px solid #eee;">{{entrada}}</td></tr>
        <tr><td style="border:1px solid #eee;">Saída almoço</td><td style="border:1px solid #eee;">{{saida_almoco}}</td></tr>
        <tr><td style="border:1px solid #eee;">Volta almoço</td><td style="border:1px solid #eee;">{{volta_almoco}}</td></tr>
        <tr><td style="border:1px solid #eee;">Saída</td><td style="border:1px solid #eee;">{{saida}}</td></tr>
      </table>
      <p><strong>Horas trabalhadas:</strong> {{horas_trabalhadas}}h · <strong>Extras:</strong> {{horas_extras}}h</p>
      <div style="background:#e7f1ff;padding:14px;border-radius:6px;margin:20px 0;font-size:14px;color:#333;">
        <strong>Próximo passo:</strong> abra o <strong>aplicativo</strong> instalado ou o sistema no <strong>navegador</strong> e acesse a área de aprovação de ponto. Links de e-mail costumam não abrir o PWA corretamente.
      </div>
    </div>
    <div style="text-align:center;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top:10px;color:#999;">E-mail automático — por favor não responda.<br/>© {{ano}} {{empresa}}. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>$tpl$,
  variaveis = '["funcionario_nome","funcionario_cargo","obra_nome","data_formatada","entrada","saida_almoco","volta_almoco","saida","horas_trabalhadas","horas_extras","link_assinar","empresa","ano"]'::jsonb
WHERE tipo = 'notificacao_ponto_responsavel';

UPDATE email_templates SET
  html_template = $tpl$<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background-color:#f4f4f4;margin:0;padding:0;">
  <div style="max-width:600px;margin:20px auto;background:white;padding:30px;border-radius:8px;">
    <div style="text-align:center;padding-bottom:20px;border-bottom:2px solid #007bff;">
      <div style="font-size:24px;font-weight:bold;color:#007bff;">🏗️ {{empresa}}</div>
      <p style="margin:10px 0 0;font-size:14px;color:#4b5563;">Ponto eletrônico</p>
    </div>
    <div style="padding:20px 0;line-height:1.6;color:#333;">
      <p>Olá, <strong>{{responsavel_nome}}</strong>,</p>
      <p>Existem registros de ponto pendentes de aprovação na obra <strong>{{obra_nome}}</strong>.</p>
      <div style="background:#fff3cd;padding:12px;border-left:4px solid #ffc107;margin:16px 0;">
        Acesse o aplicativo instalado ou o sistema no navegador para revisar e assinar. Notificações por link de e-mail costumam não abrir o app PWA de forma confiável.
      </div>
    </div>
    <div style="text-align:center;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top:10px;color:#999;">© {{ano}} {{empresa}}. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>$tpl$,
  variaveis = '["responsavel_nome","obra_nome","link_aprovacoes","empresa","ano"]'::jsonb
WHERE tipo = 'notificacao_ponto_pendente_generica';

UPDATE email_templates SET
  html_template = $tpl$<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background-color:#f4f4f4;margin:0;padding:0;">
  <div style="max-width:600px;margin:20px auto;background:white;padding:30px;border-radius:8px;">
    <div style="text-align:center;padding-bottom:20px;border-bottom:2px solid #007bff;">
      <div style="font-size:24px;font-weight:bold;color:#007bff;">🏗️ {{empresa}}</div>
      <p style="margin:10px 0 0;font-size:14px;color:#4b5563;">Ponto eletrônico</p>
    </div>
    <div style="padding:20px 0;line-height:1.6;color:#333;">
      <h2 style="margin-top:0;color:#15803d;">Ponto assinado pelo responsável</h2>
      <p>O responsável <strong>{{responsavel_nome}}</strong> assinou seu registro de <strong>{{data_formatada}}</strong>.</p>
      <p>Horas trabalhadas: <strong>{{horas_trabalhadas}}h</strong> · Extras: <strong>{{horas_extras}}h</strong></p>
      <div style="background:#e7f1ff;padding:14px;border-radius:6px;margin:20px 0;font-size:14px;">
        Falta a sua assinatura: abra o <strong>aplicativo</strong> ou o sistema no <strong>navegador</strong>. Links em e-mail costumam não abrir o PWA corretamente.
      </div>
    </div>
    <div style="text-align:center;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top:10px;color:#999;">© {{ano}} {{empresa}}. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>$tpl$,
  variaveis = '["responsavel_nome","data_formatada","horas_trabalhadas","horas_extras","link_assinar","empresa","ano"]'::jsonb
WHERE tipo = 'notificacao_ponto_funcionario';

UPDATE email_templates SET
  html_template = $tpl$<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background-color:#f4f4f4;margin:0;padding:0;">
  <div style="max-width:600px;margin:20px auto;background:white;padding:30px;border-radius:8px;">
    <div style="text-align:center;padding-bottom:20px;border-bottom:2px solid #007bff;">
      <div style="font-size:24px;font-weight:bold;color:#007bff;">🏗️ {{empresa}}</div>
      <p style="margin:10px 0 0;font-size:14px;color:#4b5563;">Ponto eletrônico</p>
    </div>
    <div style="padding:20px 0;line-height:1.6;color:#333;">
      <h2 style="margin-top:0;color:#b91c1c;">Registro não aprovado</h2>
      <p><strong>Responsável:</strong> {{responsavel_nome}}</p>
      <p><strong>Motivo:</strong> {{comentario}}</p>
      <p><strong>Data:</strong> {{data_formatada}}</p>
      <table cellpadding="8" style="border-collapse:collapse;width:100%;border:1px solid #ddd;font-size:14px;margin:12px 0;">
        <tr><td>Entrada</td><td>{{entrada}}</td></tr>
        <tr><td>Saída almoço</td><td>{{saida_almoco}}</td></tr>
        <tr><td>Volta almoço</td><td>{{volta_almoco}}</td></tr>
        <tr><td>Saída</td><td>{{saida}}</td></tr>
      </table>
      <p>Horas: {{horas_trabalhadas}}h · Extras: {{horas_extras}}h</p>
      <div style="background:#fef2f2;padding:14px;border-left:4px solid #dc2626;margin:16px 0;">
        Corrija os horários no <strong>aplicativo</strong> ou no <strong>navegador</strong> e reenvie para aprovação. Links de e-mail costumam não abrir o PWA corretamente.
      </div>
    </div>
    <div style="text-align:center;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top:10px;color:#999;">© {{ano}} {{empresa}}. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>$tpl$,
  variaveis = '["responsavel_nome","comentario","data_formatada","entrada","saida_almoco","volta_almoco","saida","horas_trabalhadas","horas_extras","link_corrigir","empresa","ano"]'::jsonb
WHERE tipo = 'notificacao_ponto_rejeicao';

UPDATE email_templates SET
  html_template = $tpl$<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nota fiscal</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
      <div style="font-size: 24px; font-weight: bold; color: #007bff;">🏗️ {{empresa}}</div>
      <p style="margin:10px 0 0;font-size:14px;color:#4b5563;">Nota fiscal e cobrança</p>
    </div>
    <div style="padding: 8px 0 0; line-height: 1.5; color: #333;">
      <p style="margin:0 0 12px;font-size:15px;color:#111827;">Olá, <strong>{{cliente_nome}}</strong>,</p>
      <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.5;">{{texto_anexos}}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr>
          <td width="50%" style="padding:6px 8px 6px 0;vertical-align:top;">
            <p style="margin:0;font-size:11px;color:#6b7280;">Número</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:600;">{{numero_nf}}</p>
          </td>
          <td width="50%" style="padding:6px 0 6px 8px;vertical-align:top;">
            <p style="margin:0;font-size:11px;color:#6b7280;">Série</p>
            <p style="margin:4px 0 0;font-size:14px;">{{serie}}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 8px 6px 0;vertical-align:top;">
            <p style="margin:0;font-size:11px;color:#6b7280;">Tipo</p>
            <p style="margin:4px 0 0;font-size:14px;">{{tipo_nota_label}}</p>
          </td>
          <td style="padding:6px 0 6px 8px;vertical-align:top;">
            <p style="margin:0;font-size:11px;color:#6b7280;">Valor líquido</p>
            <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#007bff;">R$ {{valor_liquido_fmt}}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:8px 0 0;vertical-align:top;">
            <p style="margin:0;font-size:11px;color:#6b7280;">Emissão · Vencimento</p>
            <p style="margin:4px 0 0;font-size:14px;">{{data_emissao_fmt}} · {{data_vencimento_fmt}}</p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Boleto vinculado</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:12px;">
        <tr>
          <td style="padding:4px 0;">
            <span style="font-size:12px;color:#6b7280;">Referência:</span>
            <span style="font-size:13px;font-weight:600;margin-left:6px;">{{boleto_numero}}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;">
            <span style="font-size:12px;color:#6b7280;">Vencimento:</span>
            <span style="font-size:13px;margin-left:6px;">{{boleto_vencimento_fmt}}</span>
            <span style="font-size:12px;color:#6b7280;margin-left:16px;">Valor:</span>
            <span style="font-size:13px;font-weight:600;margin-left:6px;">R$ {{boleto_valor_fmt}}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0 0;font-size:12px;color:#6b7280;">Há boleto em anexo: {{tem_boleto}}</td>
        </tr>
      </table>
      {{observacoes_html}}
    </div>
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top: 10px; color: #999;">
        E-mail automático — por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>$tpl$
WHERE tipo = 'nota_fiscal_enviada';
