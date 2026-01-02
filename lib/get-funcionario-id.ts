/**
 * Utilitário para buscar ID numérico do funcionário
 * Resolve o problema de UUID vs ID numérico
 */

export interface UserData {
  id: string | number
  email?: string
  nome?: string
  profile?: {
    funcionario_id?: number
  }
  funcionario_id?: number
  user_metadata?: {
    funcionario_id?: number
  }
}

/**
 * Buscar ID numérico do funcionário
 */
export async function getFuncionarioId(user: UserData, token: string): Promise<number | null> {
  // Primeiro, tentar usar IDs já disponíveis
  let funcionarioId = user.profile?.funcionario_id || 
                      user.funcionario_id || 
                      user.user_metadata?.funcionario_id
  
  // Verificar se é um ID numérico válido
  if (funcionarioId && !isNaN(Number(funcionarioId)) && Number(funcionarioId) > 0) {
    return Number(funcionarioId)
  }
  
  // Se o user.id for numérico e parecer ser um ID de funcionário, usar como fallback
  if (user.id && !isNaN(Number(user.id)) && Number(user.id) > 100) {
    return Number(user.id)
  }
  
  // Se não encontrar ID numérico, tentar buscar na API
  let emailResponse: Response | null = null
  let nomeResponse: Response | null = null
  
  try {
    let apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
                 process.env.NEXT_PUBLIC_API_URL || 
                 'http://localhost:3001'
    
    // Remover /api do final se existir para evitar duplicação
    apiUrl = apiUrl.replace(/\/api\/?$/, '')
    
    // Tentar buscar por email primeiro (mais preciso)
    if (user.email) {
      emailResponse = await fetch(
        `${apiUrl}/api/funcionarios?search=${encodeURIComponent(user.email)}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (emailResponse.ok) {
        const emailData = await emailResponse.json()
        const funcionarios = emailData.data || []
        
        // Procurar funcionário que corresponde ao usuário
        const funcionario = funcionarios.find((f: any) => {
          // Verificar se o funcionário tem usuário vinculado
          const usuarioVinculado = Array.isArray(f.usuario) 
            ? f.usuario.find((u: any) => u.id === user.id || u.email === user.email)
            : f.usuario
          
          return usuarioVinculado?.id === user.id || 
                 usuarioVinculado?.email === user.email ||
                 f.email === user.email
        })
        
        if (funcionario && funcionario.id && !isNaN(Number(funcionario.id))) {
          return Number(funcionario.id)
        }
      }
    }
    
    // Se não encontrou por email, tentar buscar por nome
    if (user.nome) {
      nomeResponse = await fetch(
        `${apiUrl}/api/funcionarios?search=${encodeURIComponent(user.nome)}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (nomeResponse.ok) {
        const nomeData = await nomeResponse.json()
        const funcionarios = nomeData.data || []
        
        // Procurar funcionário que corresponde ao usuário
        const funcionario = funcionarios.find((f: any) => {
          const usuarioVinculado = Array.isArray(f.usuario) 
            ? f.usuario.find((u: any) => u.id === user.id || u.email === user.email)
            : f.usuario
          
          return usuarioVinculado?.id === user.id || 
                 usuarioVinculado?.email === user.email ||
                 f.nome === user.nome
        })
        
        if (funcionario && funcionario.id && !isNaN(Number(funcionario.id))) {
          return Number(funcionario.id)
        }
      }
    }
    
    // Se receber 403 (Forbidden), não tentar novamente
    if (emailResponse?.status === 403 || nomeResponse?.status === 403) {
      return null
    }
    
    return null
  } catch (error) {
    return null
  }
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

