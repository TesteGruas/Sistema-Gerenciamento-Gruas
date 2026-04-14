-- Template editável para envio de faturamento (NF + boletos) a partir da medição.
-- Mesmas variáveis principais da medição (buildMedicaoEmailVars no backend).

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'medicao_faturamento_enviada',
  'Medição — faturamento (notas e boletos)',
  'FATURAMENTO — Medição {{numero}} — {{periodo_assunto}} — {{obra_nome_assunto}}',
  $FAT$
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Faturamento</title></head>
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:24px;">
    <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#134e4a;">{{empresa}}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;">Faturamento — notas fiscais e boletos</p>
    <p style="font-size:15px;color:#111827;">Olá, <strong>{{cliente_nome}}</strong>,</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;">Encaminhamos em anexo as <strong>notas fiscais</strong> e os <strong>boletos</strong> referentes à medição nº <strong>{{numero}}</strong>, período <strong>{{periodo_formatado}}</strong>, obra <strong>{{obra_nome}}</strong>.</p>
    <p style="font-size:14px;color:#374151;">Valor total (referência): <strong>R$ {{valor_total}}</strong></p>
    <p style="margin-top:20px;font-size:12px;color:#6b7280;">PDF da medição (consulta):<br/><span style="word-break:break-all;color:#111;">{{link_pdf}}</span></p>
    <p style="margin-top:24px;font-size:11px;color:#9ca3af;">{{empresa}} · © {{ano}}</p>
  </div>
</body>
</html>
$FAT$,
  '["numero","periodo","periodo_formatado","periodo_assunto","obra_nome_assunto","grua_nome_assunto","valor_total","cliente_nome","obra_nome","link_pdf","empresa","ano","grua_linha"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;
