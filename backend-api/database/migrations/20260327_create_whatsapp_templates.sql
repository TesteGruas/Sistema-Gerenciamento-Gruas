-- Templates de WhatsApp editáveis no painel
-- Fluxos cobertos: nova obra, criação de usuário, reset de senha, forgot password e aprovação de horas.

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  texto_template TEXT NOT NULL,
  variaveis JSONB NOT NULL DEFAULT '[]'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  updated_by INTEGER NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_tipo ON whatsapp_templates(tipo);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_ativo ON whatsapp_templates(ativo);

CREATE OR REPLACE FUNCTION update_whatsapp_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_whatsapp_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER trigger_update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_templates_updated_at();

INSERT INTO whatsapp_templates (tipo, nome, texto_template, variaveis, ativo)
VALUES
(
  'nova_obra',
  'WhatsApp — Nova obra criada',
  '🏗️ *Nova Obra Criada*||📋 *Obra:* {{obra_nome}}|👤 *Cliente:* {{cliente_nome}}|📍 *Endereço:* {{endereco_completo}}|👷 *Responsável:* {{responsavel_nome}}|📅 *Data Início:* {{data_inicio}}|📊 *Status:* {{status_obra}}||Acesse o sistema para mais detalhes:|{{link_obra}}||---|_Sistema de Gestão de Gruas_',
  '["obra_nome","cliente_nome","endereco_completo","responsavel_nome","data_inicio","status_obra","link_obra"]'::jsonb,
  true
),
(
  'novo_usuario_funcionario',
  'WhatsApp — Boas-vindas (funcionário)',
  '👋 *Bem-vindo ao Sistema de Gestão de Gruas!*||Olá {{nome}},||Seu acesso ao sistema foi criado com sucesso!||📧 *Email:* {{email}}|🔑 *Senha Temporária:* {{senha_temporaria}}||⚠️ *Importante:* Altere sua senha no primeiro acesso.||🔗 *Link de Acesso:*|{{link_login}}||---|_Sistema de Gestão de Gruas_',
  '["nome","email","senha_temporaria","link_login"]'::jsonb,
  true
),
(
  'novo_usuario_cliente',
  'WhatsApp — Boas-vindas (cliente)',
  '👋 *Bem-vindo ao Sistema de Gestão de Gruas!*||Olá {{contato_nome}},||Seu acesso ao sistema foi criado com sucesso para a empresa *{{empresa_nome}}*!||📧 *Email:* {{email}}|🔑 *Senha Temporária:* {{senha_temporaria}}||⚠️ *Importante:* Altere sua senha no primeiro acesso.||🔗 *Link de Acesso:*|{{link_login}}||---|_Sistema de Gestão de Gruas_',
  '["contato_nome","empresa_nome","email","senha_temporaria","link_login"]'::jsonb,
  true
),
(
  'reset_senha_funcionario',
  'WhatsApp — Reset de senha (funcionário)',
  '🔐 *Redefinição de Senha - Sistema de Gestão de Gruas*||Olá {{nome}},||Sua senha foi redefinida com sucesso!||📧 *Email:* {{email}}|🔑 *Nova Senha Temporária:* {{senha_temporaria}}||⚠️ *Importante:* Altere sua senha no próximo acesso.||🔗 *Link de Acesso:*|{{link_login}}||---|_Sistema de Gestão de Gruas_',
  '["nome","email","senha_temporaria","link_login"]'::jsonb,
  true
),
(
  'forgot_password',
  'WhatsApp — Esqueci minha senha',
  '🔐 *Redefinição de Senha - Sistema de Gestão de Gruas*||Olá {{nome}},||Você solicitou a redefinição de sua senha.||Clique no link abaixo para criar uma nova senha:||{{reset_link}}||⏰ *Este link expira em {{tempo_expiracao}}.*||⚠️ *Importante:* Se você não solicitou esta redefinição, ignore esta mensagem.||---|_Sistema de Gestão de Gruas_',
  '["nome","reset_link","tempo_expiracao"]'::jsonb,
  true
),
(
  'aprovacao_horas_extras',
  'WhatsApp — Aprovação de horas extras',
  '🔔 *Nova Solicitação de Aprovação de Horas Extras*||👤 *Funcionário:* {{funcionario_nome}}|📅 *Data do Trabalho:* {{data_trabalho}}|⏰ *Horas Extras:* {{horas_extras}}h|📋 *Status:* Pendente||⏳ *Prazo para aprovação:* 7 dias||Clique no link abaixo para aprovar ou rejeitar:||{{link_aprovacao}}||---|_Sistema de Gestão de Gruas_',
  '["funcionario_nome","data_trabalho","horas_extras","link_aprovacao"]'::jsonb,
  true
)
ON CONFLICT (tipo) DO NOTHING;
