/**
 * Tipos de benefício que exigem PDF mensal + assinatura no PWA.
 */
export const TIPOS_BENEFICIO_DOCUMENTAL = [
  'Termo de Reconhecimento e Ciência',
  'Recibo / Ajuda de Custo – Vale Refeição',
  'Recibo Ajuda de Custo',
  'Recibo / Ajuda de Custo – Vale Transporte',
  'Vale Transporte',
  'Recibo / Pagamento de Horas Extras',
  'Horas Extras',
] as const

export function isBeneficioDocumental(tipoNome: string | null | undefined): boolean {
  const t = String(tipoNome || '').trim().toLowerCase()
  return TIPOS_BENEFICIO_DOCUMENTAL.some((nome) => nome.toLowerCase() === t)
}
