"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { usePWAPermissions } from "@/hooks/use-pwa-permissions"
import {
  type PWAProfile,
  canAccessRoute,
  getPWAProfileRedirect,
  PWA_PROFILE_ROUTE_ACCESS,
  PWA_PROFILE_ROUTE_PATTERNS,
} from "@/app/pwa/lib/pwa-profile"
import { PageLoader } from "@/components/ui/loader"

function isRestrictedRoute(pathname: string): boolean {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/pwa"

  for (const { pattern } of PWA_PROFILE_ROUTE_PATTERNS) {
    if (pattern.test(normalized)) return true
  }

  for (const routePrefix of Object.keys(PWA_PROFILE_ROUTE_ACCESS)) {
    if (normalized === routePrefix || normalized.startsWith(routePrefix + "/")) {
      return true
    }
  }

  return false
}

interface PWAProfileGuardProps {
  children: React.ReactNode
  /** Se informado, exige perfil específico (ignora canAccessRoute genérico) */
  allowedProfiles?: PWAProfile[]
}

export function PWAProfileGuard({ children, allowedProfiles }: PWAProfileGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { pwaProfile, loading, homePage } = usePWAPermissions()

  useEffect(() => {
    if (loading) return

    const normalized = pathname.split("?")[0]
    const restricted = allowedProfiles?.length
      ? true
      : isRestrictedRoute(normalized)

    if (!restricted) return

    if (!pwaProfile) {
      router.replace("/pwa/login")
      return
    }

    if (allowedProfiles?.length && !allowedProfiles.includes(pwaProfile)) {
      router.replace(homePage || getPWAProfileRedirect(pwaProfile))
      return
    }

    if (!allowedProfiles?.length && !canAccessRoute(pwaProfile, normalized)) {
      router.replace(homePage || getPWAProfileRedirect(pwaProfile))
    }
  }, [loading, pwaProfile, pathname, router, homePage, allowedProfiles])

  if (loading) {
    return <PageLoader text="Verificando acesso..." />
  }

  const normalized = pathname.split("?")[0]
  const restricted = allowedProfiles?.length ? true : isRestrictedRoute(normalized)

  if (restricted && pwaProfile) {
    if (allowedProfiles?.length && !allowedProfiles.includes(pwaProfile)) {
      return <PageLoader text="Redirecionando..." />
    }
    if (!allowedProfiles?.length && !canAccessRoute(pwaProfile, normalized)) {
      return <PageLoader text="Redirecionando..." />
    }
  }

  return <>{children}</>
}

export default PWAProfileGuard
