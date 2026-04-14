/**
 * @param {string} tipo — valor de `certificados_colaboradores.tipo` (ex.: NR12, NR6)
 * @returns {'certificado_nr12'|'certificado_padrao'}
 */
export function certificadoTipoParaTipoDocumentoAssinatura(tipo) {
  const t = String(tipo || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
  if (t === 'NR12') return 'certificado_nr12'
  return 'certificado_padrao'
}
