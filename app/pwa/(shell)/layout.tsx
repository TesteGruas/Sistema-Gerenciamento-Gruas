"use client"

import type { ReactNode } from "react"
import { EmpresaProvider } from "@/hooks/use-empresa"
import { PWALayoutAppShell } from "@/components/pwa-layout-app-shell"

export default function PwaShellLayout({ children }: { children: ReactNode }) {
  return (
    <EmpresaProvider>
      <PWALayoutAppShell>{children}</PWALayoutAppShell>
    </EmpresaProvider>
  )
}
