/**
 * Checklist diário do livro da grua — itens fixos + extras dinâmicos (API livro_grua).
 */

export const CHECKLIST_LIVRO_GRUA_ITENS_FIXOS = [
  { key: "cabos", label: "Cabos" },
  { key: "polias", label: "Polias" },
  { key: "estrutura", label: "Estrutura" },
  { key: "movimentos", label: "Movimentos" },
  { key: "freios", label: "Freios" },
  { key: "limitadores", label: "Limitadores" },
  { key: "indicadores", label: "Indicadores" },
  { key: "aterramento", label: "Aterramento" }
] as const

export type ChecklistLivroGruaItemFixoKey = (typeof CHECKLIST_LIVRO_GRUA_ITENS_FIXOS)[number]["key"]

export type ChecklistItemExtra = {
  id: string
  label: string
  ok: boolean
  /** ID em obra_checklist_itens_custom (tipo checklist_diario), quando o item veio do catálogo da obra */
  obra_item_id?: number
}

export function normalizeChecklistItensExtras(raw: unknown): ChecklistItemExtra[] {
  if (raw == null) return []
  let v: unknown = raw
  if (typeof v === "string") {
    try {
      v = JSON.parse(v)
    } catch {
      return []
    }
  }
  if (!Array.isArray(v)) return []
  const out: ChecklistItemExtra[] = []
  for (const item of v) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === "string" && o.id.length ? o.id : ""
    const label = typeof o.label === "string" ? o.label.trim() : ""
    if (!id || !label) continue
    const obraItemId = o.obra_item_id
    const extra: ChecklistItemExtra = { id, label, ok: Boolean(o.ok) }
    if (typeof obraItemId === "number" && Number.isFinite(obraItemId)) {
      extra.obra_item_id = obraItemId
    }
    out.push(extra)
  }
  return out
}

function itemFixoMarcado(entrada: Record<string, unknown>, key: string): boolean {
  const v = entrada[key]
  return v === true || v === 1 || v === "1"
}

/** Conta itens fixos marcados + extras com ok=true; total = 8 + quantidade de extras. */
export function contagemChecklistLivroGrua(entrada: Record<string, unknown>): {
  marcados: number
  total: number
} {
  let marcados = 0
  for (const { key } of CHECKLIST_LIVRO_GRUA_ITENS_FIXOS) {
    if (itemFixoMarcado(entrada, key)) marcados++
  }
  const extras = normalizeChecklistItensExtras(entrada.checklist_itens_extras)
  const total = CHECKLIST_LIVRO_GRUA_ITENS_FIXOS.length + extras.length
  marcados += extras.filter((e) => e.ok).length
  return { marcados, total }
}

export type ChecklistItemStatusLinha = {
  label: string
  ok: boolean
}

/** Lista todos os itens do checklist (fixos + extras) com status ok. */
export function listarItensChecklistLivroGrua(
  entrada: Record<string, unknown>
): ChecklistItemStatusLinha[] {
  const fixos = CHECKLIST_LIVRO_GRUA_ITENS_FIXOS.map(({ key, label }) => ({
    label,
    ok: itemFixoMarcado(entrada, key)
  }))
  const extras = normalizeChecklistItensExtras(entrada.checklist_itens_extras).map((e) => ({
    label: e.label,
    ok: e.ok
  }))
  return [...fixos, ...extras]
}

/**
 * Texto para PDF/export: contagem + cada item com Sim/Não.
 * Ex.: "8/8 — Cabos: Sim; Polias: Sim; …"
 */
export function formatarItensVerificadosChecklistLivroGrua(
  entrada: Record<string, unknown>
): string {
  const { marcados, total } = contagemChecklistLivroGrua(entrada)
  const detalhe = listarItensChecklistLivroGrua(entrada)
    .map((item) => `${item.label}: ${item.ok ? "Sim" : "Não"}`)
    .join("; ")
  if (!detalhe) return `${marcados}/${total}`
  return `${marcados}/${total} — ${detalhe}`
}

export function novoIdItemExtra(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `extra_${crypto.randomUUID()}`
  }
  return `extra_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
