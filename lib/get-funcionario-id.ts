/**
 * Utilitário para buscar ID numérico do funcionário
 * Resolve o problema de UUID vs ID numérico
 */

export interface UserData {
  id: string | number
  email?: string
  nome?: string
  profile?: {
    id?: number
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
  console.log('[getFuncionarioId] Iniciando busca de ID:', {
    userId: user.id,
    profileId: user.profile?.id,
    funcionarioIdFromProfile: user.profile?.funcionario_id,
    funcionarioIdDirect: user.funcionario_id,
    funcionarioIdFromMetadata: user.user_metadata?.funcionario_id
  })
  
  // PRIORIDADE MÁXIMA: Usar funcionario_id da tabela usuarios (profile.funcionario_id ou user.funcionario_id)
  // Este é o vínculo correto entre usuarios e funcionarios
  const funcionarioIdFromTable = user.profile?.funcionario_id || user.funcionario_id
  
  if (funcionarioIdFromTable && !isNaN(Number(funcionarioIdFromTable)) && Number(funcionarioIdFromTable) > 0) {
    // Verificar se o funcionário existe na API antes de retornar
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
                     process.env.NEXT_PUBLIC_API_URL || 
                     'http://localhost:3001'
      const cleanApiUrl = apiUrl.replace(/\/api\/?$/, '')
      
      const checkResponse = await fetch(
        `${cleanApiUrl}/api/funcionarios/${funcionarioIdFromTable}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      // Se o funcionário existe na API, usar o funcionario_id da tabela
      if (checkResponse.ok) {
        console.log(`[getFuncionarioId] ✅ PRIORIDADE MÁXIMA: Funcionário ${funcionarioIdFromTable} encontrado na API (da tabela usuarios), usando este ID`)
        return Number(funcionarioIdFromTable)
      }
      
      // Se não existe (404), tentar funcionario_id do metadata
      if (checkResponse.status === 404) {
        console.log(`[getFuncionarioId] ⚠️ Funcionário ${funcionarioIdFromTable} NÃO encontrado na API (404), tentando funcionario_id do metadata`)
        // Continuar para tentar funcionario_id do metadata
      }
    } catch (checkError) {
      // Em caso de erro na verificação, tentar funcionario_id do metadata
      console.warn('[getFuncionarioId] Erro ao verificar funcionário da tabela, tentando funcionario_id do metadata:', checkError)
    }
  }
  
  // PRIORIDADE 2: Usar funcionario_id do metadata se não encontrou na tabela
  // O funcionario_id do metadata pode estar desatualizado, mas é melhor que nada
  const funcionarioIdFromMetadata = user.user_metadata?.funcionario_id
  
  if (funcionarioIdFromMetadata && !isNaN(Number(funcionarioIdFromMetadata)) && Number(funcionarioIdFromMetadata) > 0) {
    // Verificar se o funcionário existe na API antes de retornar
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
                     process.env.NEXT_PUBLIC_API_URL || 
                     'http://localhost:3001'
      const cleanApiUrl = apiUrl.replace(/\/api\/?$/, '')
      
      const checkResponse = await fetch(
        `${cleanApiUrl}/api/funcionarios/${funcionarioIdFromMetadata}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      // Se o funcionário existe na API, usar o funcionario_id do metadata
      if (checkResponse.ok) {
        console.log(`[getFuncionarioId] ✅ PRIORIDADE 2: Funcionário ${funcionarioIdFromMetadata} encontrado na API (do metadata), usando este ID`)
        return Number(funcionarioIdFromMetadata)
      }
      
      // Se não existe (404), usar user.id como fallback
      if (checkResponse.status === 404) {
        console.log(`[getFuncionarioId] ⚠️ Funcionário ${funcionarioIdFromMetadata} NÃO encontrado na API (404), usando user.id como fallback`)
        // Continuar para usar user.id como fallback
      }
    } catch (checkError) {
      // Em caso de erro na verificação, tentar usar user.id como fallback
      console.warn('[getFuncionarioId] Erro ao verificar funcionário do metadata, tentando user.id como fallback:', checkError)
    }
  }
  
  // PRIORIDADE 3: Se user.id for numérico e válido, usar como fallback
  // O user.id (119) é o ID da tabela usuarios, mas pode ser usado como fallback
  // se o funcionario_id não existir ou não for encontrado na API
  if (user.id && !isNaN(Number(user.id)) && Number(user.id) > 0) {
    const userId = Number(user.id)
    console.log(`[getFuncionarioId] ✅ PRIORIDADE 3: Usando user.id (${userId}) como fallback`)
    return userId
  }
  
  // PRIORIDADE 2: Tentar usar funcionario_id do metadata se user.id não for válido
  const funcionarioId = user.profile?.funcionario_id || 
                        user.funcionario_id || 
                        user.user_metadata?.funcionario_id
  
  if (funcionarioId && !isNaN(Number(funcionarioId)) && Number(funcionarioId) > 0) {
    return Number(funcionarioId)
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

