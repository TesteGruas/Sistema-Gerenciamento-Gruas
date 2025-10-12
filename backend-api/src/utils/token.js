/**
 * ==============================================
 * Token Utilities
 * ==============================================
 * Utilitários para geração e validação de tokens
 * de redefinição de senha
 */

import crypto from 'crypto';

/**
 * Gera um token único e seguro
 * @returns {string} Token em formato hexadecimal
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Cria hash SHA-256 de um token
 * @param {string} token - Token original
 * @returns {string} Hash do token
 */
function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

/**
 * Verifica se um token está expirado
 * @param {Date} expiresAt - Data de expiração do token
 * @returns {boolean} True se expirado
 */
function isTokenExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * Gera data de expiração do token
 * @param {number} expiryMs - Tempo de expiração em milissegundos
 * @returns {Date} Data de expiração
 */
function getTokenExpiry(expiryMs = 3600000) {
  // Padrão: 1 hora
  return new Date(Date.now() + expiryMs);
}

export {
  generateToken,
  hashToken,
  isTokenExpired,
  getTokenExpiry
};

