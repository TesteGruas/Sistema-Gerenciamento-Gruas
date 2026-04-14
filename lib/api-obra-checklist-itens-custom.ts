import { buildApiUrl, fetchWithAuth } from "@/lib/api"

/** Catálogo de itens custom por obra: checklist diário do livro vs checklist de manutenção */
export type ObraChecklistItemCatalogoTipo = "checklist_diario" | "manutencao"

export type ObraChecklistItemCustom = {
  id: number
  label: string
  tipo?: ObraChecklistItemCatalogoTipo
  created_at?: string
}

export async function listarChecklistItensCustomObra(
  obraId: number,
  tipo: ObraChecklistItemCatalogoTipo = "checklist_diario"
): Promise<{ success: boolean; data: ObraChecklistItemCustom[]; message?: string }> {
  const q = new URLSearchParams({ tipo })
  const url = buildApiUrl(`obras/${obraId}/checklist-itens-custom?${q.toString()}`)
  const res = await fetchWithAuth(url)
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      String(json.message || json.error || `Erro ${res.status}`)
    )
  }
  const raw = json.data
  const data = Array.isArray(raw) ? (raw as ObraChecklistItemCustom[]) : []
  return { success: Boolean(json.success ?? true), data }
}

export async function criarChecklistItemCustomObra(
  obraId: number,
  label: string,
  tipo: ObraChecklistItemCatalogoTipo = "checklist_diario"
): Promise<{ success: boolean; data: ObraChecklistItemCustom; message?: string }> {
  const url = buildApiUrl(`obras/${obraId}/checklist-itens-custom`)
  const res = await fetchWithAuth(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label: label.trim(), tipo })
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.message || json.error || `Erro ${res.status}`)
  }
  return json
}
