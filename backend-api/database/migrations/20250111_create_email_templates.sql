-- =====================================================
-- Migration: Create email_templates table
-- Descrição: Tabela para armazenar templates de email editáveis
-- Data: 11/01/2025
-- =====================================================

-- Criar tabela de templates de email
CREATE TABLE IF NOT EXISTS email_templates (
  id BIGSERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  assunto VARCHAR(500) NOT NULL,
  html_template TEXT NOT NULL,
  variaveis JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  
  -- Foreign keys
  CONSTRAINT fk_email_templates_updated_by 
    FOREIGN KEY (updated_by) 
    REFERENCES usuarios(id) 
    ON DELETE SET NULL,
    
  -- Constraints
  CONSTRAINT chk_email_templates_tipo 
    CHECK (tipo IN ('welcome', 'reset_password', 'password_changed'))
);

-- Criar índice
CREATE INDEX idx_email_templates_tipo ON email_templates(tipo);

-- Comentários
COMMENT ON TABLE email_templates IS 'Templates de email personalizáveis pelo admin';
COMMENT ON COLUMN email_templates.tipo IS 'Tipo do template: welcome, reset_password, password_changed';
COMMENT ON COLUMN email_templates.nome IS 'Nome descritivo do template';
COMMENT ON COLUMN email_templates.assunto IS 'Assunto do email (pode conter variáveis)';
COMMENT ON COLUMN email_templates.html_template IS 'Template HTML completo com variáveis {{variavel}}';
COMMENT ON COLUMN email_templates.variaveis IS 'Array JSON com as variáveis disponíveis no template';
COMMENT ON COLUMN email_templates.ativo IS 'Se o template está ativo';
COMMENT ON COLUMN email_templates.updated_by IS 'ID do usuário que fez a última atualização';

-- Inserir templates padrão
INSERT INTO email_templates (tipo, nome, assunto, html_template, variaveis, ativo) VALUES
('welcome', 'Email de Boas-vindas', 'Bem-vindo ao {{empresa}}!', 
'<!DOCTYPE html>
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
      <h2>Olá, {{nome}}! 👋</h2>
      <p>Seja bem-vindo(a) ao <strong>{{empresa}}</strong>!</p>
      <p>Sua conta foi criada com sucesso e você já pode acessar o sistema. Para garantir a segurança da sua conta, geramos uma senha temporária que deve ser alterada no primeiro acesso.</p>
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <h3>📧 Suas Credenciais de Acesso</h3>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Senha Temporária:</strong> <code style="background: #fff; padding: 2px 6px; border: 1px solid #ddd;">{{senha_temporaria}}</code></p>
      </div>
      <div style="text-align: center;">
        <a href="{{link_login}}" style="display: inline-block; padding: 12px 30px; background: #007bff; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0;">Acessar o Sistema</a>
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
        Este é um email automático, por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>', 
'["nome", "email", "senha_temporaria", "link_login", "empresa", "ano"]'::jsonb, 
true),

('reset_password', 'Redefinição de Senha', 'Redefinir sua senha - {{empresa}}',
'<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
      <div style="font-size: 24px; font-weight: bold; color: #007bff;">🏗️ {{empresa}}</div>
    </div>
    <div style="padding: 20px 0; line-height: 1.6; color: #333;">
      <h2>Olá, {{nome}}! 🔒</h2>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{reset_link}}" style="display: inline-block; padding: 12px 30px; background: #007bff; color: white !important; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
      </div>
      <div style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <strong>⏱️ Atenção:</strong>
        <p style="margin: 10px 0;">Este link expira em <strong>{{expiry_time}}</strong>.</p>
      </div>
      <p style="font-size: 12px; color: #666;">
        Se o botão não funcionar, copie e cole o seguinte link no seu navegador:<br>
        <a href="{{reset_link}}" style="color: #007bff; word-break: break-all;">{{reset_link}}</a>
      </p>
    </div>
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top: 10px; color: #999;">
        Este é um email automático, por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>',
'["nome", "email", "reset_link", "expiry_time", "empresa", "ano"]'::jsonb,
true),

('password_changed', 'Senha Alterada', 'Sua senha foi alterada - {{empresa}}',
'<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Senha Alterada</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #28a745;">
      <div style="font-size: 24px; font-weight: bold; color: #28a745;">🏗️ {{empresa}}</div>
    </div>
    <div style="padding: 20px 0; line-height: 1.6; color: #333;">
      <h2>Olá, {{nome}}! ✅</h2>
      <p>Sua senha foi alterada com sucesso!</p>
      <div style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
        <p style="margin: 0;"><strong>✔️ Senha atualizada em:</strong> {{data_alteracao}}</p>
      </div>
      <p>Se você não realizou esta alteração, <strong>entre em contato com o suporte imediatamente</strong>.</p>
    </div>
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
      <p><strong>{{empresa}}</strong></p>
      <p style="margin-top: 10px; color: #999;">
        Este é um email automático, por favor não responda.<br>
        © {{ano}} {{empresa}}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>',
'["nome", "email", "data_alteracao", "empresa", "ano"]'::jsonb,
true);

