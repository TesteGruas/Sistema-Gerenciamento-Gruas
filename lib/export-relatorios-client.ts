import { getApiBasePath } from "./runtime-config"

export function getAuthTokenRelatorios(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token") || localStorage.getItem("token")
}

export function downloadBlobArquivo(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

/**
 * Gera Excel no backend (POST /api/exportar-relatorios/excel/financeiro).
 * Usa `dados: { data: rows }` para cair no ramo genérico de criarAbaGenerica.
 */
export async function exportRelatorioExcelServidor(params: {
  tipoSlug: string
  data_inicio: string
  data_fim: string
  dados: Record<string, unknown>[]
}): Promise<void> {
  const base = getApiBasePath()
  const token = getAuthTokenRelatorios()
  // Evita o case especial `impostos` do backend (estrutura diferente de `dados.data`).
  const tipo =
    params.tipoSlug === "impostos" ? "relatorio-impostos-tabela" : params.tipoSlug

  const res = await fetch(`${base}/exportar-relatorios/excel/financeiro`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      tipo,
      data_inicio: params.data_inicio,
      data_fim: params.data_fim,
      dados: { data: params.dados },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as { message?: string; error?: string }))
    throw new Error(err.message || err.error || `Erro ${res.status} ao exportar`)
  }

  const blob = await res.blob()
  downloadBlobArquivo(
    blob,
    `relatorio-${params.tipoSlug}-${params.data_inicio}-${params.data_fim}.xlsx`
  )
}
