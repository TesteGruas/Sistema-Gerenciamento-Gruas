/**
 * Mapeia `certificados_colaboradores.tipo` → chave em `REGRAS_ASSINATURA_POR_TIPO_DOCUMENTO`
 * (alinhado ao admin e a `PERFIS_ASSINATURA_DOCUMENTO` em pdf-signature-placement).
 * @param {string} tipo — ex.: NR12, «Certificado NR12», «Ordem de Serviço»
 * @returns {'certificado_nr12'|'certificado_ordem_servico'|'certificado_padrao'}
 */
export function certificadoTipoParaTipoDocumentoAssinatura(tipo) {
  const s = String(tipo || '').trim()
  if (!s) return 'certificado_padrao'
  if (/ordem\s*de\s*servi[cç]o|\bordem\s*servi[cç]o\b/i.test(s) || /^os$/i.test(s) || /\bNR\s*-?\s*0*1\b/i.test(s) && /\bO\.?\s*S\.?\b/i.test(s)) {
    return 'certificado_ordem_servico'
  }
  if (/\bNR\s*-?\s*0*12\b/i.test(s)) return 'certificado_nr12'
  const compact = s.replace(/\s+/g, '')
  if (/NR0*12(?![0-9])/i.test(compact)) return 'certificado_nr12'
  return 'certificado_padrao'
}
