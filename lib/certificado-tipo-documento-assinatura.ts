/** Certificados NR (exceto NR12) — campo ALUNO */
export const TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO = 'certificado_padrao' as const

/** Certificado NR12 — 1.ª folha junto ao instrutor (ANDERSON); outras páginas canto inferior direito */
export const TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR12 = 'certificado_nr12' as const

/** Mesma lógica que `backend-api/src/utils/certificado-tipo-assinatura.js` (download PDF com assinatura). */
export function certificadoTipoParaTipoDocumentoAssinatura(tipo: string): string {
  const s = String(tipo || '').trim()
  if (!s) return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO
  if (/\bNR\s*-?\s*0*12\b/i.test(s)) return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR12
  const compact = s.replace(/\s+/g, '')
  if (/NR0*12(?![0-9])/i.test(compact)) return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR12
  return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO
}
