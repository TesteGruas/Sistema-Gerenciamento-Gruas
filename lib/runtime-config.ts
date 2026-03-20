function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function sanitizeConfiguredApiUrl(raw?: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed === "/api") return ""
  if (trimmed.startsWith("/")) return trimmed.replace(/\/+$/, "")
  if (isAbsoluteHttpUrl(trimmed)) return trimmed.replace(/\/+$/, "")
  return null
}

export function getApiOrigin(): string {
  const configured = sanitizeConfiguredApiUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  )

  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    // Em produção o frontend deve sempre usar same-origin + proxy /api.
    return ""
  }

  if (configured !== null) {
    return configured.replace(/\/api\/?$/, "")
  }

  // Sem URL absoluta: usar caminho relativo `/api` (proxy do Next → backend em dev).
  // Evita montar `http://localhost:3000/api` quando o backend está em outra porta.
  if (typeof window !== "undefined") {
    return ""
  }

  return ""
}

export function getApiBasePath(): string {
  const origin = getApiOrigin()
  return origin ? `${origin}/api` : "/api"
}

/**
 * URL base para socket.io-client (use http/https — a lib negocia ws/wss).
 * Em produção com proxy same-origin, `getApiOrigin()` fica vazio; usamos o origin do browser.
 */
export function getWebSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WEBSOCKET_URL?.trim()
  if (configured) return configured

  if (typeof window !== "undefined") {
    return window.location.origin
  }

  const apiOrigin = getApiOrigin()
  if (!apiOrigin) return ""

  return apiOrigin
}

export function normalizeApiTarget(url: string): string {
  if (!url) return "/api"
  if (url.startsWith("/")) return url
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `/${url}`
}
