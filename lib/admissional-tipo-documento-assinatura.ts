/**
 * Alinhado a `backend-api/src/utils/tipo-admissional-assinatura.js`
 */
export function tipoAdmissionalParaTipoDocumentoAssinatura(tipo: string): string {
  const t = String(tipo || '').trim()
  const map: Record<string, string> = {
    'Acordo de compensação de horas': 'acordo_compensacao',
    'Contrato de experiência / prorrogação': 'contrato_experiencia_prorrogacao',
    'Contrato de Experiência': 'contrato_experiencia_prorrogacao',
    'Solicitação de vale transporte': 'solicitacao_vale_transporte',
    'Vale Transporte': 'solicitacao_vale_transporte',
    'Termo de responsabilidade': 'termo_responsabilidade',
    'Termo de Reconhecimento e Ciência': 'termo_reconhecimento_ciencia',
    'Ficha de entrega de EPIs (IRBANA)': 'ficha_entrega_epis',
    'Ficha de Registro': 'ficha_registro_empregado',
    'Recibo Ajuda de Custo': 'recibo_vale_refeicao',
    'Recibo / Ajuda de Custo – Vale Refeição': 'recibo_vale_refeicao',
  }
  return map[t] || ''
}
