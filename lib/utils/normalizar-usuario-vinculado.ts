/**
 * PostgREST pode devolver o embed `usuario` como objeto (1:1) ou array (1:N).
 * Sem normalizar, o front trata só array e mostra «Sem usuário» + esconde «Resetar Senha».
 */
export type UsuarioVinculadoResumo = {
  id: number
  nome: string
  email: string
  status: string
}

export function normalizarUsuarioVinculado(
  usuario: unknown
): UsuarioVinculadoResumo | undefined {
  if (!usuario) return undefined
  if (Array.isArray(usuario)) {
    const first = usuario[0]
    if (!first || typeof first !== 'object') return undefined
    return first as UsuarioVinculadoResumo
  }
  if (typeof usuario === 'object' && usuario !== null && 'id' in usuario) {
    return usuario as UsuarioVinculadoResumo
  }
  return undefined
}
