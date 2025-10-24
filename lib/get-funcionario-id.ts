/**
 * Utilitário para buscar ID numérico do funcionário
 * Resolve o problema de UUID vs ID numérico
 */

export interface UserData {
  id: string | number
  profile?: {
    funcionario_id?: number
  }
  funcionario_id?: number
}

/**
 * Buscar ID numérico do funcionário
 */
export async function getFuncionarioId(user: UserData, token: string): Promise<number | null> {
  // Primeiro, tentar usar IDs já disponíveis
  let funcionarioId = user.profile?.funcionario_id || user.funcionario_id
  
  // Verificar se é um ID numérico válido
  if (funcionarioId && !isNaN(Number(funcionarioId))) {
    console.log('✅ [getFuncionarioId] ID do funcionário encontrado nos dados do usuário:', funcionarioId)
    return Number(funcionarioId)
  }
  
  // Se o user.id for numérico, usar como fallback (pode ser o mesmo ID)
  if (user.id && !isNaN(Number(user.id))) {
    console.log('⚠️ [getFuncionarioId] Usando ID do usuário como fallback:', user.id)
    return Number(user.id)
  }
  
  // Se não encontrar ID numérico e o user.id for UUID, tentar buscar na API
  if (user.id && typeof user.id === 'string' && user.id.includes('-')) {
    console.log('⚠️ [getFuncionarioId] ID do usuário é UUID, tentando buscar funcionário...')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
      
      // Buscar funcionários e filtrar por usuário
      const response = await fetch(
        `${apiUrl}/api/funcionarios?search=${user.email || user.nome}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        const funcionarios = data.data || []
        
        // Procurar funcionário que corresponde ao usuário
        const funcionario = funcionarios.find((f: any) => 
          f.usuario?.id === user.id || 
          f.usuario?.email === user.email ||
          f.email === user.email
        )
        
        if (funcionario && funcionario.id && !isNaN(Number(funcionario.id))) {
          console.log('✅ [getFuncionarioId] ID do funcionário encontrado via busca:', funcionario.id)
          return Number(funcionario.id)
        }
      }
      
      console.warn('⚠️ [getFuncionarioId] ID do funcionário não encontrado na API')
      return null
    } catch (error) {
      console.error('❌ [getFuncionarioId] Erro ao buscar ID do funcionário:', error)
      return null
    }
  }
  
  console.warn('⚠️ [getFuncionarioId] ID do funcionário não encontrado')
  return null
}

/**
 * Verificar se um ID é numérico
 */
export function isNumericId(id: any): boolean {
  return id && !isNaN(Number(id)) && Number(id) > 0
}

/**
 * Buscar ID do funcionário com fallback
 */
export async function getFuncionarioIdWithFallback(
  user: UserData, 
  token: string, 
  fallbackMessage: string = 'ID do funcionário não encontrado'
): Promise<number> {
  const funcionarioId = await getFuncionarioId(user, token)
  
  if (!funcionarioId) {
    throw new Error(fallbackMessage)
  }
  
  return funcionarioId
}

