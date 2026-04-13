/** Filtro por referência mês (input type="month" → "YYYY-MM") em datas ISO ou YYYY-MM-DD */
export function entradaNoMesReferencia(dataEntrada: string, mesReferencia: string): boolean {
  if (!mesReferencia) return true
  const s = (dataEntrada || "").trim()
  if (!s) return false
  const d = s.includes("T") ? new Date(s) : new Date(`${s.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return false
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const parts = mesReferencia.split("-").map((x) => parseInt(x, 10))
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return true
  return y === parts[0] && m === parts[1]
}
