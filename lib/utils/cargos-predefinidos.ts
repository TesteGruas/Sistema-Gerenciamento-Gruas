/**
 * Lista de cargos pré-definidos para RH
 */

export const CARGOS_PREDEFINIDOS = [
  'Montador de Grua',
  'Operador de Grua',
  'Sinaleiro',
  'Auxiliar em Eletromecânica',
  'Técnico em Eletromecânica',
  'Analista de RH',
  'Soldador',
  'Analista Financeiro',
  'Ajudante Geral',
  'Auxiliar de Montagem',
  'Auxiliar de Transporte',
  'Mestre de Soldagem'
] as const

export type CargoPredefinido = typeof CARGOS_PREDEFINIDOS[number]

/**
 * Formata um cargo com iniciais maiúsculas (Title Case)
 * Ex: "operador de grua" -> "Operador de Grua"
 */
export function formatarCargo(cargo: string): string {
  if (!cargo) return ''
  
  // Lista de palavras que devem ficar em minúsculas (exceto se for a primeira palavra)
  const palavrasMinusculas = ['de', 'da', 'do', 'das', 'dos', 'em', 'e', 'a', 'o']
  
  return cargo
    .toLowerCase()
    .split(' ')
    .map((palavra, index) => {
      // Primeira palavra sempre maiúscula
      if (index === 0) {
        return palavra.charAt(0).toUpperCase() + palavra.slice(1)
      }
      // Se for palavra minúscula, manter minúscula
      if (palavrasMinusculas.includes(palavra)) {
        return palavra
      }
      // Demais palavras com primeira letra maiúscula
      return palavra.charAt(0).toUpperCase() + palavra.slice(1)
    })
    .join(' ')
}

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

