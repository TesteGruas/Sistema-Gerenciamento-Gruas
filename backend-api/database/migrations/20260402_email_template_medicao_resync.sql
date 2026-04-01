-- Alinha html_template medicao_enviada ao padrão em email.service.js (getDefaultMedicaoEnviadaTemplateHtml).
-- Inclui: Período (mês/ano) + {{periodo_formatado}}, datas de emissão, total de dias, {{grua_linha}}, Obra | Valor Total.

UPDATE email_templates
SET
  html_template = $MEDICAO_HTML$
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
$MEDICAO_HTML$,
  variaveis = '["numero","periodo","periodo_formatado","periodo_assunto","obra_nome_assunto","grua_nome_assunto","valor_total","valor_mensal_bruto","valor_aditivos","valor_custos_extras","valor_descontos","grua_nome","grua_linha","obra_nome","cliente_nome","data_medicao","data_inicio_emissao","data_fim_emissao","total_dias_emissao","link_pdf","empresa","bloco_comercial_html","historico_status_html","documentos_resumo_html"]'::jsonb
WHERE tipo = 'medicao_enviada';
