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
 * Envia email de redefinição de senha
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
      reset_link: `${FRONTEND_URL}/auth/reset-password/${userData.token}`,
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
  sendPasswordChangedEmail,
  getEmailConfig,
  getTemplate,
  replaceVariables,
  logEmail
};

