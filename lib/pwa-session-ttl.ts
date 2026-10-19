import { getApiBasePath } from "@/lib/runtime-config"

/** Prazo desde a última entrada. Cada abertura do PWA empurra o limite por mais 7 dias. */
export const PWA_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const PWA_SESSION_STARTED_KEY = "pwa_session_started_at"

export function marcarInicioSessaoPwa(agora = Date.now()): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PWA_SESSION_STARTED_KEY, String(agora))
}

/** Só chamar depois de confirmar que a sessão ainda não venceu. */
export function renovarPrazoSessaoPwa(agora = Date.now()): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PWA_SESSION_STARTED_KEY, String(agora))
  try {
    const raw = localStorage.getItem("pwa_session_data")
    if (!raw) return
    const session = JSON.parse(raw) as { lastLogin?: number }
    session.lastLogin = agora
    localStorage.setItem("pwa_session_data", JSON.stringify(session))
  } catch {
    // O prazo principal continua em pwa_session_started_at.
  }
}

/** Sessões antigas, sem a marca, passam a contar 7 dias a partir desta verificação. */
export function garantirInicioSessaoPwa(): void {
  if (typeof window === "undefined") return
  const atual = localStorage.getItem(PWA_SESSION_STARTED_KEY)
  if (!atual || Number.isNaN(Number(atual))) marcarInicioSessaoPwa()
}

export function sessaoPwaVencida(): boolean {
  if (typeof window === "undefined") return false
  const inicio = Number(localStorage.getItem(PWA_SESSION_STARTED_KEY) || 0)
  if (!inicio) return false
  return Date.now() - inicio >= PWA_SESSION_TTL_MS
}

export function limparInicioSessaoPwa(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(PWA_SESSION_STARTED_KEY)
}

let refreshRecusadoPeloBackend = false

export function marcarRefreshRecusado(recusado: boolean): void {
  refreshRecusadoPeloBackend = recusado
}

export function refreshFoiRecusado(): boolean {
  return refreshRecusadoPeloBackend
}

export type RenovacaoSessaoPwa = "ok" | "recusada" | "indisponivel"

/**
 * Renova o access token. `recusada` só quando o backend rejeita a sessão (401/403).
 * Falha de rede ou instabilidade não desloga.
 */
export async function renovarSessaoPwa(): Promise<RenovacaoSessaoPwa> {
  if (typeof window === "undefined") return "indisponivel"
  const refresh = localStorage.getItem("refresh_token")
  if (!refresh) return "recusada"

  try {
    const response = await fetch(`${getApiBasePath()}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refresh}`,
        "Content-Type": "application/json",
      },
    })

    if (response.status === 401 || response.status === 403) return "recusada"
    if (!response.ok) return "indisponivel"

    const body = await response.json().catch(() => null)
    const access = body?.data?.access_token
    if (!body?.success || typeof access !== "string" || !access) return "recusada"

    localStorage.setItem("access_token", access)
    if (typeof body.data.refresh_token === "string" && body.data.refresh_token) {
      localStorage.setItem("refresh_token", body.data.refresh_token)
    }
    return "ok"
  } catch {
    return "indisponivel"
  }
}
