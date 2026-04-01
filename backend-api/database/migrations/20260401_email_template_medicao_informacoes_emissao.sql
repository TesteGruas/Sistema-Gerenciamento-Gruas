-- Template medicao_enviada: mesmas informações da tela (período legível, datas de emissão, total de dias).
-- Novas variáveis: periodo_formatado, data_inicio_emissao, data_fim_emissao, total_dias_emissao

UPDATE email_templates
SET variaveis = COALESCE(variaveis, '[]'::jsonb) || '["periodo_formatado","data_inicio_emissao","data_fim_emissao","total_dias_emissao"]'::jsonb
WHERE tipo = 'medicao_enviada'
  AND NOT (COALESCE(variaveis, '[]'::jsonb) @> '["periodo_formatado"]'::jsonb);

UPDATE email_templates
SET html_template = REPLACE(
  html_template,
  '<p style="margin:0;font-size:11px;color:#6b7280;">Período</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{periodo}}</p>',
  '<p style="margin:0;font-size:11px;color:#6b7280;">Período (mês/ano)</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{periodo_formatado}}</p>'
)
WHERE tipo = 'medicao_enviada'
  AND html_template LIKE '%Período</p>%'
  AND html_template LIKE '%{{periodo}}</p>%'
  AND html_template NOT LIKE '%periodo_formatado%';

UPDATE email_templates
SET html_template = REPLACE(
  html_template,
  '                <tr>
                  <td style="padding:6px 8px 6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Data da medição</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{data_medicao}}</p>
                  </td>
                  <td style="padding:6px 0 6px 8px;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Grua</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{grua_nome}}</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:6px 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Obra</p>
                    <p style="margin:4px 0 0;font-size:14px;">{{obra_nome}}</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 0 0;vertical-align:top;">
                    <p style="margin:0;font-size:11px;color:#6b7280;">Valor total</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#2563eb;">R$ {{valor_total}}</p>
                  </td>
                </tr>',
  '                <tr>
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
                    <p style="margin:4px 0 0;font-size:14px;">{{grua_nome}}</p>
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
                </tr>'
)
WHERE tipo = 'medicao_enviada'
  AND html_template LIKE '%Data da medição%';
