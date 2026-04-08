/**
 * Normaliza a resposta do POST /api/arquivos/upload para o path no bucket arquivos-obras.
 * Nunca retorna blob: — URLs blob não existem no Supabase.
 */
export function caminhoStorageAPartirDoUpload(
  data: { caminho?: string; arquivo?: string } | null | undefined
): string | null {
  const tentar = (v: string | undefined) => {
    const s = String(v || "").trim()
    if (!s || s.startsWith("blob:")) return null
    if (!/^https?:\/\//i.test(s)) return s.replace(/^\/+/, "") || null
    const idx = s.indexOf("/arquivos-obras/")
    if (idx !== -1) {
      const rest = s.slice(idx + "/arquivos-obras/".length).split("?")[0]
      try {
        return decodeURIComponent(rest) || null
      } catch {
        return rest || null
      }
    }
    return null
  }
  return tentar(data?.caminho) || tentar(data?.arquivo) || null
}

export function arquivoReferenciaEhBlobInvalida(ref: string | null | undefined): boolean {
  return String(ref || "").trim().startsWith("blob:")
}
