/**
 * Lista de cargos pré-definidos para RH
 */

export const CARGOS_PREDEFINIDOS = [
  'Montador de Grua',
  'operador de grua',
  'sinaleiro',
  'auxiliar em eletromecanica',
  'tecnico em eletromecanica',
  'analista de RH',
  'soldador',
  'analista financeiro',
  'ajudante geral',
  'auxiliar de montagem',
  'auxiliar de transporte',
  'mestre de soldagem'
] as const

export type CargoPredefinido = typeof CARGOS_PREDEFINIDOS[number]

/**
 * Verifica se um cargo está na lista de pré-definidos
 */
export function isCargoPredefinido(cargo: string): boolean {
  return CARGOS_PREDEFINIDOS.some(c => c.toLowerCase() === cargo.toLowerCase())
}

/**
 * Retorna a lista de cargos pré-definidos formatada
 */
export function getCargosPredefinidos(): string[] {
  return [...CARGOS_PREDEFINIDOS]
}

