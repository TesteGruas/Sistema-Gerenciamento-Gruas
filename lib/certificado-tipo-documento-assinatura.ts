/** Certificados NR (exceto NR12) — campo ALUNO */
export const TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO = 'certificado_padrao' as const

/** Certificado NR12 — 1.ª folha junto ao instrutor (ANDERSON); outras páginas canto inferior direito */
export const TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR12 = 'certificado_nr12' as const

export function certificadoTipoParaTipoDocumentoAssinatura(tipo: string): string {
  const t = String(tipo || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
  if (t === 'NR12') return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR12
  return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO
}
