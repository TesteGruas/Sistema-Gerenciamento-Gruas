/**
 * Data civil local do dispositivo (YYYY-MM-DD).
 * Evita `toISOString().split('T')[0]`, que usa UTC e pode voltar o dia anterior no Brasil.
 */
export function formatDateYYYYMMDDLocal(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Interpreta o prefixo "YYYY-MM-DD" como data civil no fuso local.
 * `new Date("2026-04-14")` em JS é meia-noite UTC → no BR aparece um dia antes ao formatar.
 */
export function parseYYYYMMDDLocal(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim())
  if (!m) return null
  const y = parseInt(m[1], 10)
  const mo = parseInt(m[2], 10) - 1
  const d = parseInt(m[3], 10)
  return new Date(y, mo, d)
}
