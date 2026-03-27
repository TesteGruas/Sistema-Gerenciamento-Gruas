-- Template de e-mail: envio de nota fiscal ao cliente (com anexos NF + boleto no backend)

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'nota_fiscal_enviada',
  'Nota fiscal enviada ao cliente',
  'Nota fiscal {{numero_nf}} — {{empresa}}',
  $NF_ENVIADA$
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nota fiscal</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:16px 8px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;border-bottom:2px solid #0d9488;text-align:center;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:#134e4a;">{{empresa}}</p>
              <p style="margin:10px 0 0;font-size:14px;color:#4b5563;">Nota fiscal e cobrança</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
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
                    <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#0d9488;">R$ {{valor_liquido_fmt}}</p>
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
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">© {{ano}} {{empresa}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$NF_ENVIADA$,
  '["cliente_nome","empresa","numero_nf","serie","tipo_nota_label","data_emissao_fmt","data_vencimento_fmt","valor_liquido_fmt","valor_total_fmt","boleto_numero","boleto_vencimento_fmt","boleto_valor_fmt","tem_boleto","texto_anexos","observacoes_html","ano"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;
