/**
 * URL pública do frontend para links absolutos (e-mail, WhatsApp, push, notificações).
 *
 * Prioridade:
 * 1. FRONTEND_URL
 * 2. PUBLIC_APP_URL
 * 3. Em NODE_ENV=production sem as acima → https://sistemairbana.com.br
 * 4. Desenvolvimento → http://localhost:3000
 */
export const PUBLIC_FRONTEND_DEFAULT = 'https://sistemairbana.com.br'

export function getPublicFrontendUrl() {
  const allowLocalhostPublicUrl =
    String(process.env.ALLOW_LOCALHOST_PUBLIC_URL || '')
      .trim()
      .toLowerCase() === 'true'

  // Prioridade (override explícito)
  const explicit =
    (process.env.PUBLIC_FRONTEND_URL ||
      process.env.FRONTEND_URL ||
      process.env.PUBLIC_APP_URL ||
      '') // eslint-disable-line no-extra-parens
      .trim()
      .replace(/\/+$/, '')

  if (explicit) {
    // Se configuraram FRONTEND_URL como localhost por padrão, mas a intenção
    // é que links públicos usem o domínio do sistema, forçamos o default.
    const isLocalhost =
      explicit.includes('localhost') || explicit.includes('127.0.0.1')
    if (isLocalhost && !allowLocalhostPublicUrl) return PUBLIC_FRONTEND_DEFAULT
    return explicit
  }

  if (process.env.NODE_ENV === 'production') return PUBLIC_FRONTEND_DEFAULT

  // Desenvolvimento também pode querer links do domínio real.
  return PUBLIC_FRONTEND_DEFAULT
}
