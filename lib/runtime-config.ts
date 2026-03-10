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

  if (configured !== null) {
    return configured.replace(/\/api\/?$/, "")
  }

  if (typeof window !== "undefined") {
    return window.location.origin
  }

  return ""
}

export function getApiBasePath(): string {
  const origin = getApiOrigin()
  return origin ? `${origin}/api` : "/api"
}

export function getWebSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WEBSOCKET_URL?.trim()
  if (configured) return configured

  const apiOrigin = getApiOrigin()
  if (!apiOrigin) return ""

  if (apiOrigin.startsWith("https://")) {
    return apiOrigin.replace(/^https:\/\//, "wss://")
  }
  if (apiOrigin.startsWith("http://")) {
    return apiOrigin.replace(/^http:\/\//, "ws://")
  }

  return ""
}

export function normalizeApiTarget(url: string): string {
  if (!url) return "/api"
  if (url.startsWith("/")) return url
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `/${url}`
}
