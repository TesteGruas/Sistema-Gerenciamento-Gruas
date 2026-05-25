"use client"

import type { ReactNode } from "react"
import { EmpresaProvider } from "@/hooks/use-empresa"
import { PWALayoutAppShell } from "@/components/pwa-layout-app-shell"
import { PWAProfileGuard } from "@/components/pwa-profile-guard"

export default function PwaShellLayout({ children }: { children: ReactNode }) {
  return (
    <EmpresaProvider>
      <PWALayoutAppShell>
        <PWAProfileGuard>{children}</PWAProfileGuard>
      </PWALayoutAppShell>
    </EmpresaProvider>
  )
}
