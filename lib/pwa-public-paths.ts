/**
 * Rotas PWA que não exigem sessão (login, redirect OAuth, recuperação de senha, etc.).
 * Não use `pathname.startsWith('/')` para a raiz — isso casa com qualquer rota.
 */
export function isPwaPublicAuthPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  if (pathname === "/") return true
  if (["/pwa/login", "/pwa/redirect", "/pwa/forgot-password"].includes(pathname)) return true
  if (pathname.startsWith("/pwa/test-api")) return true
  if (pathname.startsWith("/pwa/reset-password")) return true
  return false
}
