/**
 * NR12 em qualquer formato legível (alinhado ao admin e a `PERFIS_ASSINATURA_DOCUMENTO` em pdf-signature-placement).
 * @param {string} tipo — valor de `certificados_colaboradores.tipo` (ex.: NR12, «Certificado NR12», NR 12)
 * @returns {'certificado_nr12'|'certificado_padrao'}
 */
export function certificadoTipoParaTipoDocumentoAssinatura(tipo) {
  const s = String(tipo || '').trim()
  if (!s) return 'certificado_padrao'
  if (/\bNR\s*-?\s*0*12\b/i.test(s)) return 'certificado_nr12'
  const compact = s.replace(/\s+/g, '')
  if (/NR0*12(?![0-9])/i.test(compact)) return 'certificado_nr12'
  return 'certificado_padrao'
}
