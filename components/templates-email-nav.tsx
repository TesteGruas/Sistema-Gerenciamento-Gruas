"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { LayoutGrid, LayoutTemplate, FileText, Loader2 } from "lucide-react"
import api from "@/lib/api"

type TemplateRow = { tipo: string; nome: string; ativo: boolean }

export function TemplatesEmailSidebar() {
  const pathname = usePathname()
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get("/email-config/templates")
        if (!cancelled && res.data?.data) {
          setTemplates(res.data.data)
        }
      } catch {
        if (!cancelled) setTemplates([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pathname])

  const overviewActive = pathname === "/dashboard/configuracoes/templates-email"

  return (
    <aside className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r bg-muted/40">
      <div className="p-4 md:p-5 md:sticky md:top-4">
        <div className="flex items-center gap-2 mb-4">
          <LayoutTemplate className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-sm leading-tight">Templates de e-mail</p>
            <p className="text-xs text-muted-foreground">Modelos e variáveis</p>
          </div>
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 -mx-1 px-1">
          <Link
            href="/dashboard/configuracoes/templates-email"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap",
              overviewActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            Visão geral
          </Link>

          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Carregando…
            </div>
          ) : (
            templates.map((t) => {
              const href = `/dashboard/configuracoes/templates-email/edit/${encodeURIComponent(t.tipo)}`
              const active = pathname === href || pathname?.startsWith(`${href}/`)
              return (
                <Link
                  key={t.tipo}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap min-w-0",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted text-foreground"
                  )}
                  title={t.tipo}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t.nome}</span>
                </Link>
              )
            })
          )}
        </nav>
      </div>
    </aside>
  )
}
