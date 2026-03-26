-- Templates de e-mail: medição enviada ao cliente (variáveis {{...}})
-- Remove a restrição rígida de tipos para permitir novos templates sem migração futura.

ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS chk_email_templates_tipo;

INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo)
VALUES (
  'medicao_enviada',
  'Medição enviada ao cliente',
  'Medição {{numero}} - {{periodo}}',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medição</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
      <div style="font-size: 22px; font-weight: bold; color: #1e3a8a;">{{empresa}}</div>
    </div>
    <div style="padding: 20px 0; line-height: 1.6; color: #333;">
      <h2 style="margin-top: 0;">Nova medição disponível</h2>
      <p>Uma nova medição foi enviada para sua análise e aprovação.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0;"><strong>Cliente</strong></td><td>{{cliente_nome}}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Obra</strong></td><td>{{obra_nome}}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Número</strong></td><td>{{numero}}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Período</strong></td><td>{{periodo}}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Data da medição</strong></td><td>{{data_medicao}}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Valor total</strong></td><td>R$ {{valor_total}}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Grua</strong></td><td>{{grua_nome}}</td></tr>
      </table>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{link_pdf}}" style="display: inline-block; padding: 12px 28px; background: #2563eb; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: 600;">Abrir PDF da medição</a>
      </div>
      <p style="font-size: 12px; color: #666;">Se o botão não funcionar, copie o link: <a href="{{link_pdf}}" style="color: #2563eb;">{{link_pdf}}</a></p>
    </div>
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
      <p>Este é um e-mail automático. Em caso de dúvidas, entre em contato com {{empresa}}.</p>
    </div>
  </div>
</body>
</html>',
  '["numero", "periodo", "valor_total", "grua_nome", "obra_nome", "cliente_nome", "data_medicao", "link_pdf", "empresa"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;
