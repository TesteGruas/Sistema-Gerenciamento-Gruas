-- Link do responsável passa a oferecer aprovação ou recusa.
-- Só troca o texto padrão; não mexe em template já personalizado no painel.
UPDATE whatsapp_templates
SET texto_template = replace(texto_template, 'Acesse o sistema para assinar:', 'Aprove ou recuse neste link:')
WHERE tipo = 'ponto_responsavel'
  AND texto_template LIKE '%Acesse o sistema para assinar:%';

INSERT INTO whatsapp_templates (tipo, nome, texto_template, variaveis, ativo)
SELECT
  'ponto_dia_assinado',
  'WhatsApp — Dia de trabalho assinado (funcionário)',
  $t$✅ *Dia de trabalho assinado*||📅 Data: {{data_formatada}}|🏗️ Obra: {{obra_nome}}|⏱️ Horas: {{horas_trabalhadas}}h||O dia foi validado.$t$,
  '["data_formatada","obra_nome","horas_trabalhadas","link_espelho"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE tipo = 'ponto_dia_assinado');
