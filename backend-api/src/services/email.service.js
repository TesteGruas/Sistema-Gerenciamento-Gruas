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
import { getPublicFrontendUrl } from '../config/public-frontend-url.js';

// Chave de criptografia (deve estar no .env)
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'default-key-32-chars-minimum!!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

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
    console.log('[createTransporter] Buscando configurações de email...');
    const config = await getEmailConfig();
    
    if (!config.email_enabled) {
      const erro = 'Envio de emails está desativado nas configurações';
      console.error('[createTransporter]', erro);
      throw new Error(erro);
    }
    
    // Debug: Log das configurações (sem expor senha)
    console.log('[createTransporter] Configurações SMTP:', {
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      user: config.smtp_user ? '***' : 'não definido',
      email_enabled: config.email_enabled,
      email_from: config.email_from
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
    
    console.log('[createTransporter] Transporter criado com sucesso');
    return { transporter, config };
  } catch (error) {
    console.error('[createTransporter] Erro ao criar transporter:', error);
    console.error('[createTransporter] Stack trace:', error.stack);
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
    console.log('[sendEmail] Iniciando envio de email para:', options.to);
    const { transporter, config } = await createTransporter();
    
    const mailOptions = {
      from: `"${config.email_from_name}" <${config.email_from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };
    
    console.log('[sendEmail] Opções do email:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html_length: mailOptions.html?.length
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log('[sendEmail] Email enviado com sucesso:', {
      messageId: info.messageId,
      response: info.response
    });
    
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
    console.error('[sendEmail] Erro ao enviar email:', error);
    console.error('[sendEmail] Stack trace:', error.stack);
    console.error('[sendEmail] Detalhes do erro:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Registrar log de falha
    try {
      await logEmail({
        tipo: options.tipo || 'custom',
        destinatario: options.to,
        assunto: options.subject,
        status: 'falha',
        erro: error.message,
        tentativas: 1
      });
    } catch (logError) {
      console.error('[sendEmail] Erro ao registrar log de email:', logError);
    }
    
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
      link_login: `${getPublicFrontendUrl()}/login`,
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
 * Envia email de reset de senha com nova senha temporária
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.nome - Nome do usuário
 * @param {string} userData.email - Email do usuário
 * @param {string} userData.senha_temporaria - Nova senha temporária gerada
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendPasswordResetEmail(userData) {
  try {
    // Validação de entrada
    if (!userData) {
      throw new Error('Dados do usuário não fornecidos');
    }
    
    if (!userData.email) {
      throw new Error('Email do usuário não fornecido');
    }
    
    if (!userData.senha_temporaria) {
      throw new Error('Senha temporária não fornecida');
    }
    
    const nome = userData.nome || 'Usuário';
    const email = userData.email;
    const senhaTemporaria = userData.senha_temporaria;
    const linkLogin = `${getPublicFrontendUrl()}/login`;
    const ano = new Date().getFullYear();
    
    console.log(`[sendPasswordResetEmail] Preparando envio de email para ${email}`);
    
    // Template HTML específico para reset de senha
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinição de Senha - Sistema de Gerenciamento de Gruas</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .credentials {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .credentials h2 {
            color: #2c3e50;
            font-size: 16px;
            margin-top: 0;
        }
        .credential-item {
            margin: 10px 0;
        }
        .credential-label {
            font-weight: bold;
            color: #555;
        }
        .password {
            font-family: monospace;
            font-size: 18px;
            color: #e74c3c;
            font-weight: bold;
            background-color: #fff;
            padding: 5px 10px;
            border-radius: 3px;
            display: inline-block;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .button {
            display: inline-block;
            background-color: #3498db;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #2980b9;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #777;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Redefinição de Senha</h1>
        </div>
        <div class="content">
            <div class="greeting">
                Olá, <strong>${nome}</strong>! 👋
            </div>
            <p>Sua senha foi redefinida com sucesso!</p>
            
            <div class="credentials">
                <h2>📧 Suas Credenciais de Acesso</h2>
                <div class="credential-item">
                    <span class="credential-label">Email:</span> ${email}
                </div>
                <div class="credential-item">
                    <span class="credential-label">Nova Senha Temporária:</span>
                    <div class="password">${senhaTemporaria}</div>
                </div>
            </div>
            
            <div class="warning">
                ⚠️ <strong>Importante:</strong> Altere sua senha no próximo acesso ao sistema.
            </div>
            
            <div style="text-align: center;">
                <a href="${linkLogin}" class="button">Acessar o Sistema</a>
            </div>
        </div>
        <div class="footer">
            <p><strong>Redefinição de Senha - Sistema de Gerenciamento de Gruas</strong></p>
            <p>© ${ano} - Todos os direitos reservados</p>
        </div>
    </div>
</body>
</html>`;
    
    const assunto = `🔐 Redefinição de Senha - Sistema de Gerenciamento de Gruas`;
    
    console.log(`[sendPasswordResetEmail] Chamando sendEmail para ${email}`);
    const resultado = await sendEmail({
      to: email,
      subject: assunto,
      html: html,
      tipo: 'reset_password'
    });
    
    console.log(`[sendPasswordResetEmail] Email enviado com sucesso para ${email}`, resultado);
    return resultado;
  } catch (error) {
    console.error('[sendPasswordResetEmail] Erro ao enviar email de reset de senha:', error);
    console.error('[sendPasswordResetEmail] Stack trace:', error.stack);
    console.error('[sendPasswordResetEmail] Dados recebidos:', {
      nome: userData?.nome,
      email: userData?.email,
      tem_senha: !!userData?.senha_temporaria
    });
    throw error;
  }
}

/**
 * Envia email de redefinição de senha com token (para forgot-password)
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.nome - Nome do usuário
 * @param {string} userData.email - Email do usuário
 * @param {string} userData.token - Token de redefinição
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendResetPasswordEmail(userData) {
  try {
    const template = await getTemplate('reset_password');
    
    const data = {
      nome: userData.nome,
      email: userData.email,
      reset_link: `${getPublicFrontendUrl()}/auth/reset-password/${userData.token}`,
      expiry_time: '1 hora',
      empresa: 'Sistema de Gerenciamento de Gruas',
      ano: new Date().getFullYear()
    };
    
    const html = replaceVariables(template.html_template, data);
    const assunto = replaceVariables(template.assunto, data);
    
    return await sendEmail({
      to: userData.email,
      subject: assunto,
      html: html,
      tipo: 'reset_password'
    });
  } catch (error) {
    console.error('Erro ao enviar email de redefinição:', error);
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
  sendResetPasswordEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  getEmailConfig,
  getTemplate,
  replaceVariables,
  logEmail
};

