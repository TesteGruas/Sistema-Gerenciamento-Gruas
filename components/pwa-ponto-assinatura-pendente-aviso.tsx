"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FilePenLine } from "lucide-react"
import * as pontoApi from "@/lib/api-ponto-eletronico"
import { formatDateYYYYMMDDLocal } from "@/lib/date-local"
import {
  isPendenteAssinaturaFuncionarioStatus,
  isPendenteCorrecaoStatus,
} from "@/lib/ponto-registro-status"
import { getFuncionarioIdWithFallback, type UserData } from "@/lib/get-funcionario-id"

const POLL_MS = 4 * 60 * 1000

function readResponsavelObra(): boolean {
  if (typeof window === "undefined") return false
  try {
    const raw = localStorage.getItem("user_data")
    if (!raw) return false
    const ud = JSON.parse(raw)
    const tipo = ud?.user_metadata?.tipo || ud?.user?.user_metadata?.tipo
    const responsavelFlag =
      Boolean(ud?.is_responsavel_obra) ||
      (Array.isArray(ud?.obras_responsavel) && ud.obras_responsavel.length > 0)
    return tipo === "responsavel_obra" || responsavelFlag
  } catch {
    return false
  }
}

type Props = {
  sessionUser: UserData | null
  sessionLoading: boolean
  isAuthenticated: boolean
  permissionsLoading: boolean
  isClientUser: boolean
}

export function PwaPontoAssinaturaPendenteAviso({
  sessionUser,
  sessionLoading,
  isAuthenticated,
  permissionsLoading,
  isClientUser,
}: Props) {
  const pathname = usePathname()
  const [count, setCount] = useState(0)
  /** Primeiro registro pendente (mesmo padrão do espelho/aprovações: `/pwa/aprovacao-assinatura?id=`). */
  const [primeiroPendenteId, setPrimeiroPendenteId] = useState<string | null>(null)

  const skip = useMemo(
    () => readResponsavelObra() || isClientUser,
    [isClientUser]
  )

  const hideOnRoute = Boolean(
    pathname?.includes("/login") ||
      pathname?.includes("/redirect") ||
      pathname?.includes("/aprovacoes") ||
      pathname?.includes("/aprovacao-assinatura")
  )

  const fetchPendentes = useCallback(async () => {
    if (typeof window === "undefined") return
    if (skip) {
      setCount(0)
      setPrimeiroPendenteId(null)
      return
    }
    if (!isAuthenticated || sessionLoading || permissionsLoading) return

    const token = localStorage.getItem("access_token")
    if (!token || !sessionUser) {
      setCount(0)
      setPrimeiroPendenteId(null)
      return
    }

    try {
      const funcionarioId = await getFuncionarioIdWithFallback(
        sessionUser,
        token,
        "ID do funcionário não encontrado"
      )

      const hoje = new Date()
      const inicio = new Date(hoje)
      inicio.setDate(inicio.getDate() - 30)

      const { data } = await pontoApi.apiRegistrosPonto.listar({
        funcionario_id: funcionarioId,
        data_inicio: formatDateYYYYMMDDLocal(inicio),
        data_fim: formatDateYYYYMMDDLocal(hoje),
        limit: 500,
      })

      const pendentes = (data || []).filter(
        (r) =>
          isPendenteAssinaturaFuncionarioStatus(r.status) || isPendenteCorrecaoStatus(r.status)
      )
      pendentes.sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")))
      setCount(pendentes.length)
      const primeiro = pendentes[0]
      const pid = primeiro?.id != null ? String(primeiro.id) : null
      setPrimeiroPendenteId(pid)
    } catch {
      setCount(0)
      setPrimeiroPendenteId(null)
    }
  }, [isAuthenticated, sessionLoading, permissionsLoading, sessionUser, skip])

  useEffect(() => {
    void fetchPendentes()
  }, [fetchPendentes])

  useEffect(() => {
    if (sessionLoading || permissionsLoading || !isAuthenticated) return
    const t = window.setInterval(() => void fetchPendentes(), POLL_MS)
    return () => window.clearInterval(t)
  }, [fetchPendentes, isAuthenticated, sessionLoading, permissionsLoading])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void fetchPendentes()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [fetchPendentes])

  if (hideOnRoute || skip || count <= 0) return null

  const hrefAssinar =
    primeiroPendenteId != null && primeiroPendenteId.length > 0
      ? `/pwa/aprovacao-assinatura?id=${encodeURIComponent(primeiroPendenteId)}`
      : "/pwa/aprovacoes"

  return (
    <div
      className="pointer-events-none fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-[130] flex justify-center px-3"
      role="status"
    >
      <div className="pointer-events-auto flex w-full max-w-lg items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2.5 shadow-md">
        <FilePenLine className="h-5 w-5 shrink-0 text-orange-700" aria-hidden />
        <p className="min-w-0 flex-1 text-xs font-medium text-orange-950">
          {count === 1
            ? "Há 1 registro de ponto aguardando sua assinatura."
            : `Há ${count} registros de ponto aguardando sua assinatura.`}
        </p>
        <Link
          href={hrefAssinar}
          className="shrink-0 rounded-md bg-[#871b0b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6f1609]"
        >
          Assinar
        </Link>
      </div>
    </div>
  )
}
