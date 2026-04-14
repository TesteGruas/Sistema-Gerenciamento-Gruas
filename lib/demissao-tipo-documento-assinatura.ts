/**
 * Alinhado a `backend-api/src/utils/tipo-demissao-assinatura.js`
 */
export function tipoDemissaoParaTipoDocumentoAssinatura(tipo: string): string {
  const t = String(tipo || '').trim()
  const map: Record<string, string> = {
    'Termo de Rescisão do Contrato': 'demissao_termo_rescisao',
    'Termo de Quitação': 'demissao_termo_quitacao',
    'Homologação da Rescisão': 'demissao_padrao',
    'Recibo de Verbas Rescisórias': 'demissao_padrao',
    'Comunicação de Desligamento (CD)': 'demissao_comunicacao_desligamento',
    'Seguro-Desemprego (requerimento / documentos)': 'demissao_padrao',
    'Devolução de EPI / Crachá': 'demissao_padrao',
    Outros: 'demissao_padrao',
    'Aviso Prévio Trabalhado': 'demissao_aviso_previo',
  }
  return map[t] || ''
}
