-- Template WhatsApp: responsável de obra com login e senha provisória (editável em /dashboard/configuracoes/templates-whatsapp).
-- Variáveis: {{nome}}, {{obra_nome}}, {{email_login}}, {{senha_provisoria}}, {{link_login}} — | vira quebra de linha no envio.

INSERT INTO whatsapp_templates (tipo, nome, texto_template, variaveis, ativo)
SELECT
  'responsavel_obra_credenciais',
  'WhatsApp — Responsável de obra (acesso com senha)',
  $t$Olá, {{nome}}!||Você está cadastrado(a) como responsável de obra em *{{obra_nome}}*.||Login: {{email_login}}|Senha provisória: {{senha_provisoria}}||Também enviamos esses dados para o seu e-mail (confira caixa de entrada e spam).||Link para entrar: {{link_login}}||Após o primeiro acesso, altere a senha no sistema.$t$,
  '["nome","obra_nome","email_login","senha_provisoria","link_login"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE tipo = 'responsavel_obra_credenciais');
