/**
 * ==============================================
 * Email Service
 * ==============================================
 * Serviço para envio de emails com templates
 * personalizáveis e criptografia de credenciais
 */

import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

// Chave de criptografia (deve estar no .env)
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'default-key-32-chars-minimum!!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Criptografa texto usando AES-256-CBC
 * @param {string} text - Texto a ser criptografado
 * @returns {string} Texto criptografado
 */
function encrypt(text) {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw new Error('Falha na criptografia');
  }
}

/**
 * Descriptografa texto usando AES-256-CBC
 * @param {string} text - Texto criptografado
 * @returns {string} Texto original
 */
function decrypt(text) {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    throw new Error('Falha na descriptografia');
  }
}

/**
 * Busca configurações de email do banco de dados
 * @returns {Promise<Object>} Configurações SMTP
 */
async function getEmailConfig() {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_configs')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      throw new Error('Configurações de email não encontradas');
    }
    
    // Descriptografar credenciais
    const config = {
      ...data,
      smtp_user: decrypt(data.smtp_user),
      smtp_pass: decrypt(data.smtp_pass)
    };
    
    return config;
  } catch (error) {
    console.error('Erro ao buscar configurações de email:', error);
    throw error;
  }
}

/**
 * Cria transporter do nodemailer com as configurações do banco
 * @returns {Promise<Object>} Transporter configurado
 */
async function createTransporter() {
  try {
    const config = await getEmailConfig();
    
    if (!config.email_enabled) {
      throw new Error('Envio de emails está desativado');
    }
    
    // Debug: Log das configurações (sem expor senha)
    console.log('📧 Configurações SMTP:', {
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      user: config.smtp_user ? '***' : 'não definido'
    });
    
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure, // false para porta 2525, true para porta 465
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass
      },
      // Adicionar opções extras para debug
      logger: true,
      debug: false
    });
    
    return { transporter, config };
  } catch (error) {
    console.error('Erro ao criar transporter:', error);
    throw error;
  }
}

/**
 * Busca template de email do banco
 * @param {string} tipo - Tipo do template (welcome, reset_password, password_changed)
 * @returns {Promise<Object>} Template com variáveis
 */
async function getTemplate(tipo) {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('tipo', tipo)
      .eq('ativo', true)
      .single();
    
    if (error || !data) {
      throw new Error(`Template '${tipo}' não encontrado ou inativo`);
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    throw error;
  }
}

/**
 * Substitui variáveis no template
 * @param {string} template - Template HTML ou texto
 * @param {Object} data - Dados para substituir
 * @returns {string} Template com variáveis substituídas
 */
function replaceVariables(template, data) {
  let result = template;
  
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  
  return result;
}

/**
 * Registra log de email no banco
 * @param {Object} logData - Dados do log
 */
async function logEmail(logData) {
  try {
    await supabaseAdmin
      .from('email_logs')
      .insert({
        tipo: logData.tipo,
        destinatario: logData.destinatario,
        assunto: logData.assunto,
        status: logData.status,
        erro: logData.erro || null,
        tentativas: logData.tentativas || 1,
        enviado_em: logData.status === 'enviado' ? new Date().toISOString() : null
      });
  } catch (error) {
    console.error('Erro ao registrar log de email:', error);
  }
}

/**
 * Envia email genérico
 * @param {Object} options - Opções do email
 * @param {string} options.to - Destinatário
 * @param {string} options.subject - Assunto
 * @param {string} options.html - Conteúdo HTML
 * @param {string} options.tipo - Tipo para log (opcional)
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendEmail(options) {
  try {
    const { transporter, config } = await createTransporter();
    
    const mailOptions = {
      from: `"${config.email_from_name}" <${config.email_from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Registrar log de sucesso
    await logEmail({
      tipo: options.tipo || 'custom',
      destinatario: options.to,
      assunto: options.subject,
      status: 'enviado',
      tentativas: 1
    });
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    // Registrar log de falha
    await logEmail({
      tipo: options.tipo || 'custom',
      destinatario: options.to,
      assunto: options.subject,
      status: 'falha',
      erro: error.message,
      tentativas: 1
    });
    
    throw error;
  }
}

/**
 * Envia email de boas-vindas com senha temporária
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.nome - Nome do usuário
 * @param {string} userData.email - Email do usuário
 * @param {string} userData.senha_temporaria - Senha temporária gerada
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendWelcomeEmail(userData) {
  try {
    const template = await getTemplate('welcome');
    
    const data = {
      nome: userData.nome,
      email: userData.email,
      senha_temporaria: userData.senha_temporaria,
      link_login: `${FRONTEND_URL}/login`,
      empresa: 'Sistema de Gerenciamento de Gruas',
      ano: new Date().getFullYear()
    };
    
    const html = replaceVariables(template.html_template, data);
    const assunto = replaceVariables(template.assunto, data);
    
    return await sendEmail({
      to: userData.email,
      subject: assunto,
      html: html,
      tipo: 'welcome'
    });
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw error;
  }
}

/**
 * Envia email de reset de senha com senha temporária
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.nome - Nome do usuário
 * @param {string} userData.email - Email do usuário
 * @param {string} userData.senha_temporaria - Senha temporária gerada
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendPasswordResetEmail(userData) {
  try {
    // Usar template de reset_password ou criar um customizado
    let template;
    try {
      template = await getTemplate('reset_password');
    } catch (error) {
      // Se não encontrar template, usar template welcome como fallback
      template = await getTemplate('welcome');
    }
    
    const data = {
      nome: userData.nome,
      email: userData.email,
      senha_temporaria: userData.senha_temporaria,
      link_login: `${FRONTEND_URL}/login`,
      empresa: 'Sistema de Gerenciamento de Gruas',
      ano: new Date().getFullYear()
    };
    
    // Criar HTML customizado para reset de senha
    const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de Senha</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
      <div style="font-size: 24px; font-weight: bold; color: #007bff;">🏗️ Sistema de Gerenciamento de Gruas</div>
    </div>
    <div style="padding: 20px 0; line-height: 1.6; color: #333;">
      <h2>Redefinição de Senha 🔒</h2>
      <p>Olá, <strong>{{nome}}</strong>!</p>
      <p>Sua senha foi redefinida com sucesso. Uma nova senha temporária foi gerada para você.</p>
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <h3>📧 Suas Credenciais de Acesso</h3>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Nova Senha Temporária:</strong> <code style="background: #fff; padding: 2px 6px; border: 1px solid #ddd;">{{senha_temporaria}}</code></p>
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
      <p><strong>Sistema de Gerenciamento de Gruas</strong></p>
      <p style="margin-top: 10px; color: #999;">
        Este é um email automático, por favor não responda.<br>
        © {{ano}} Sistema de Gerenciamento de Gruas. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;
    
    const html = replaceVariables(htmlTemplate, data);
    const assunto = `Redefinição de Senha - Sistema de Gerenciamento de Gruas`;
    
    return await sendEmail({
      to: userData.email,
      subject: assunto,
      html: html,
      tipo: 'reset_password'
    });
  } catch (error) {
    console.error('Erro ao enviar email de reset de senha:', error);
    throw error;
  }
}

/**
 * Envia email de redefinição de senha
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.nome - Nome do usuário
 * @param {string} userData.email - Email do usuário
 * @param {string} userData.token - Token de redefinição
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendResetPasswordEmail(userData) {
  try {
    let template;
    try {
      template = await getTemplate('reset_password');
    } catch (templateError) {
      console.warn('⚠️ Template reset_password não encontrado, usando template HTML padrão:', templateError.message);
      // Usar template HTML padrão se não encontrar no banco
      template = {
        html_template: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px;">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
      <div style="font-size: 24px; font-weight: bold; color: #007bff;">🏗️ Sistema de Gerenciamento de Gruas</div>
    </div>
    <div style="padding: 20px 0; line-height: 1.6; color: #333;">
      <h2>Redefinição de Senha 🔒</h2>
      <p>Olá, <strong>{{nome}}</strong>!</p>
      <p>Você solicitou a redefinição de senha no Sistema de Gerenciamento de Gruas.</p>
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <p>Clique no botão abaixo para redefinir sua senha:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="{{reset_link}}" style="display: inline-block; padding: 12px 30px; background: #007bff; color: white !important; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">Ou copie e cole este link no seu navegador:</p>
        <p style="font-size: 12px; color: #007bff; word-break: break-all;">{{reset_link}}</p>
      </div>
      <div style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <strong>⚠️ Importante:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Este link expira em {{expiry_time}}</li>
          <li>Se você não solicitou esta redefinição, ignore este email</li>
          <li>Não compartilhe este link com ninguém</li>
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
</html>`,
        assunto: 'Redefinição de Senha - {{empresa}}'
      };
    }
    
    const data = {
      nome: userData.nome,
      email: userData.email,
      reset_link: `${FRONTEND_URL}/auth/reset-password/${userData.token}`,
      expiry_time: '1 hora',
      empresa: 'Sistema de Gerenciamento de Gruas',
      ano: new Date().getFullYear()
    };
    
    const html = replaceVariables(template.html_template, data);
    const assunto = replaceVariables(template.assunto, data);
    
    console.log(`📧 Enviando email de reset de senha para ${userData.email}`);
    const resultado = await sendEmail({
      to: userData.email,
      subject: assunto,
      html: html,
      tipo: 'reset_password'
    });
    console.log(`✅ Email de reset de senha enviado com sucesso:`, resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao enviar email de redefinição:', error);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
}

/**
 * Envia email de confirmação de alteração de senha
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.nome - Nome do usuário
 * @param {string} userData.email - Email do usuário
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendPasswordChangedEmail(userData) {
  try {
    const template = await getTemplate('password_changed');
    
    const data = {
      nome: userData.nome,
      email: userData.email,
      data_alteracao: new Date().toLocaleString('pt-BR'),
      empresa: 'Sistema de Gerenciamento de Gruas',
      ano: new Date().getFullYear()
    };
    
    const html = replaceVariables(template.html_template, data);
    const assunto = replaceVariables(template.assunto, data);
    
    return await sendEmail({
      to: userData.email,
      subject: assunto,
      html: html,
      tipo: 'password_changed'
    });
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    throw error;
  }
}

export {
  encrypt,
  decrypt,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetPasswordEmail,
  sendPasswordChangedEmail,
  getEmailConfig,
  getTemplate,
  replaceVariables,
  logEmail
};

