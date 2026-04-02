-- Templates de WhatsApp para notificações de ponto (notificacoes-ponto.js).
-- Usa o mesmo padrão de {{variavel}} e | como quebra de linha (whatsapp-service.replaceWhatsAppTemplateVars).
-- Não sobrescreve linhas já existentes (personalizações no painel).

INSERT INTO whatsapp_templates (tipo, nome, texto_template, variaveis, ativo)
SELECT
  'ponto_responsavel',
  'WhatsApp — Registro de ponto (responsável)',
  $t$📋 *Registro de ponto concluído*||👷 Funcionário: {{funcionario_nome}}|🏗️ Obra: {{obra_nome}}|📅 Data: {{data_formatada}}|🕐 Entrada: {{entrada}} | Saída: {{saida}}|⏱️ Horas: {{horas_trabalhadas}}h | Extras: {{horas_extras}}h||Acesse o sistema para assinar: {{link_assinar}}$t$,
  '["funcionario_nome","obra_nome","data_formatada","entrada","saida","horas_trabalhadas","horas_extras","link_assinar"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE tipo = 'ponto_responsavel');

INSERT INTO whatsapp_templates (tipo, nome, texto_template, variaveis, ativo)
SELECT
  'ponto_confirmacao_funcionario',
  'WhatsApp — Ponto registrado (confirmação ao funcionário)',
  $t$✅ *Ponto registrado*||{{saudacao}}Seu dia {{data_formatada}} na obra *{{obra_nome}}* foi enviado para assinatura do responsável.|{{link_espelho}}$t$,
  '["saudacao","funcionario_nome","data_formatada","obra_nome","link_espelho"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE tipo = 'ponto_confirmacao_funcionario');

INSERT INTO whatsapp_templates (tipo, nome, texto_template, variaveis, ativo)
SELECT
  'ponto_funcionario_assinatura',
  'WhatsApp — Ponto assinado pelo responsável (funcionário)',
  $t$✅ *Seu ponto foi assinado pelo responsável*||👤 Responsável: {{responsavel_nome}}|📅 Data: {{data_formatada}}||Acesse o app para assinar também e validar: {{link_assinar}}$t$,
  '["responsavel_nome","data_formatada","link_assinar"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE tipo = 'ponto_funcionario_assinatura');

INSERT INTO whatsapp_templates (tipo, nome, texto_template, variaveis, ativo)
SELECT
  'ponto_rejeicao',
  'WhatsApp — Registro não aprovado (rejeição)',
  $t$❌ *Registro de ponto não aprovado*||👤 Responsável: {{responsavel_nome}}|📅 Data: {{data_formatada}}|💬 Motivo: {{comentario}}||Acesse o app para corrigir as horas: {{link_corrigir}}$t$,
  '["responsavel_nome","data_formatada","comentario","link_corrigir"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE tipo = 'ponto_rejeicao');

INSERT INTO whatsapp_templates (tipo, nome, texto_template, variaveis, ativo)
SELECT
  'ponto_pendente_generico',
  'WhatsApp — Pontos pendentes (responsável)',
  $t$📋 *Pontos pendentes de aprovação*||Há registros aguardando sua assinatura na obra *{{obra_nome}}*.|Acesse: {{link_aprovacoes}}$t$,
  '["obra_nome","link_aprovacoes"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE tipo = 'ponto_pendente_generico');
