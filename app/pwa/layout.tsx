import type { ReactNode } from "react"

/**
 * Layout raiz do PWA: apenas Server Component (sem client graph).
 * Rotas públicas ficam em (public)/; app logado em (shell)/ — assim /pwa/login nunca carrega jwt/shell.
 */
export default function PWALayout({ children }: { children: ReactNode }) {
  return children
}
