/**
 * Tipos de benefício que exigem PDF mensal + assinatura no PWA.
 */
export const TIPOS_BENEFICIO_DOCUMENTAL = [
  'Termo de Reconhecimento e Ciência',
  'Recibo / Ajuda de Custo – Vale Refeição',
  'Recibo Ajuda de Custo',
  'Recibo / Ajuda de Custo – Vale Transporte',
  'Vale Transporte',
]

export function isBeneficioDocumental(tipoNome) {
  const t = String(tipoNome || '').trim()
  return TIPOS_BENEFICIO_DOCUMENTAL.some(
    (nome) => nome.toLowerCase() === t.toLowerCase()
  )
}

/**
 * Mapeia nome do tipo de benefício → chave em REGRAS_ASSINATURA_POR_TIPO_DOCUMENTO
 */
export function beneficioTipoParaTipoDocumentoAssinatura(tipoNome) {
  const t = String(tipoNome || '').trim()
  const map = {
    'Termo de Reconhecimento e Ciência': 'termo_reconhecimento_ciencia',
    'Recibo / Ajuda de Custo – Vale Refeição': 'recibo_vale_refeicao',
    'Recibo Ajuda de Custo': 'recibo_vale_refeicao',
    'Recibo / Ajuda de Custo – Vale Transporte': 'recibo_vale_transporte',
    'Vale Transporte': 'recibo_vale_transporte',
  }
  return map[t] || undefined
}
