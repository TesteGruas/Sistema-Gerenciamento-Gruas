/**
 * Utilitário para detectar se o sistema está rodando como PWA
 */

export function isPWA(): boolean {
  if (typeof window === 'undefined') return false

  // Verificar se está em modo standalone (PWA instalado)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // Verificar se está em modo standalone no iOS
  if ((window.navigator as any).standalone === true) {
    return true
  }

  // Verificar se a URL atual está na rota /pwa
  if (window.location.pathname.startsWith('/pwa')) {
    return true
  }

  return false
}

/**
 * Retorna a URL de login apropriada baseado no contexto
 */
export function getLoginUrl(): string {
  return isPWA() ? '/pwa/login' : '/'
}

