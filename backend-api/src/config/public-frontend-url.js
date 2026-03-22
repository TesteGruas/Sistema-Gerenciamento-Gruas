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
  const explicit = (process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || '')
    .trim()
    .replace(/\/+$/, '')
  if (explicit) return explicit

  if (process.env.NODE_ENV === 'production') {
    return PUBLIC_FRONTEND_DEFAULT
  }

  return 'http://localhost:3000'
}
