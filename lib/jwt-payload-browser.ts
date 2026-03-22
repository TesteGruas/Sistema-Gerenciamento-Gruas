/**
 * Decodifica o payload (2º segmento) de um JWT no browser.
 * Nome do ficheiro distinto de jwt-decode-client para evitar cache/HMR corrompido no Turbopack.
 */

const BASE64URL_PAYLOAD = /^[A-Za-z0-9_-]+$/

export function normalizeAccessToken(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null
  let t = raw.trim().replace(/\s+/g, "")
  if (!t) return null
  const lower = t.toLowerCase()
  if (lower.startsWith("bearer")) {
    t = t.slice(6).trim()
    if (t.startsWith(":")) t = t.slice(1).trim()
  }
  if (t.length >= 2 && ((t[0] === '"' && t[t.length - 1] === '"') || (t[0] === "'" && t[t.length - 1] === "'"))) {
    try {
      const parsed = JSON.parse(t)
      if (typeof parsed === "string") t = parsed.trim()
      else t = t.slice(1, -1)
    } catch {
      t = t.slice(1, -1)
    }
  }
  return t || null
}

export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const trimmed = normalizeAccessToken(token)
    if (!trimmed) return null
    const parts = trimmed.split(".")
    if (parts.length < 2 || !parts[1]) return null
    const payloadSeg = parts[1]
    if (!BASE64URL_PAYLOAD.test(payloadSeg)) return null

    let base64 = payloadSeg.replace(/-/g, "+").replace(/_/g, "/")
    const pad = base64.length % 4
    if (pad) base64 += "=".repeat(4 - pad)

    let binary: string
    try {
      binary = atob(base64)
    } catch {
      return null
    }

    let jsonStr = binary
    try {
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
      jsonStr = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
    } catch {
      /* usa binary como está */
    }

    try {
      return JSON.parse(jsonStr) as T
    } catch {
      return null
    }
  } catch {
    return null
  }
}
