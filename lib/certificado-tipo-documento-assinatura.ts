/** Certificados NR (exceto NR12/NR18) — campo ALUNO / linha trabalhador */
export const TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO = 'certificado_padrao' as const

/** Certificado NR12 — 1.ª folha junto ao instrutor (ANDERSON); outras páginas canto inferior direito */
export const TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR12 = 'certificado_nr12' as const

/** Certificado NR18 / Operador de Grua — linha «Assinatura do trabalhador» (layout LD Group) */
export const TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR18 = 'certificado_nr18' as const

/** Ordem de Serviço / OS NR-1 — última página, «Assinatura do Colaborador» (não Emitente / SST) */
export const TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_ORDEM_SERVICO =
  'certificado_ordem_servico' as const

/** Mesma lógica que `backend-api/src/utils/certificado-tipo-assinatura.js` (download PDF com assinatura). */
export function certificadoTipoParaTipoDocumentoAssinatura(tipo: string): string {
  const s = String(tipo || '').trim()
  if (!s) return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO
  if (/^\s*aso\s*$/i.test(s) || /atestado\s*(de\s*)?sa[uú]de\s*ocupacional/i.test(s)) {
    return 'aso'
  }
  if (
    /ordem\s*de\s*servi[cç]o|\bordem\s*servi[cç]o\b/i.test(s) ||
    /^os$/i.test(s) ||
    /NR[\s_-]*0*1[\s_-]*O\.?\s*S\.?/i.test(s) ||
    (/\bNR\s*-?\s*0*1\b/i.test(s) && /\bO\.?\s*S\.?\b/i.test(s))
  ) {
    return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_ORDEM_SERVICO
  }
  if (/nr[\s_-]*0*12(?![0-9])/i.test(s)) return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR12
  if (/nr[\s_-]*0*18(?![0-9])/i.test(s) || /operador\s*de\s*grua/i.test(s)) {
    return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR18
  }
  const compact = s.replace(/[\s_-]+/g, '')
  if (/NR0*12(?![0-9])/i.test(compact)) return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR12
  if (/NR0*18(?![0-9])/i.test(compact)) return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR18
  return TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO
}
