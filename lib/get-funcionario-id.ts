/**
 * Utilitário para buscar ID numérico do funcionário
 * Resolve o problema de UUID vs ID numérico
 */
import { getApiOrigin } from './runtime-config'

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
  // PRIORIDADE MÁXIMA: Usar funcionario_id da tabela usuarios (profile.funcionario_id ou user.funcionario_id)
  // Este é o vínculo correto entre usuarios e funcionarios
  const funcionarioIdFromTable = user.profile?.funcionario_id || user.funcionario_id

  if (funcionarioIdFromTable && !isNaN(Number(funcionarioIdFromTable)) && Number(funcionarioIdFromTable) > 0) {
    // Verificar se o funcionário existe na API antes de retornar
    try {
      const cleanApiUrl = getApiOrigin()

      const checkResponse = await fetch(
        `${cleanApiUrl}/api/funcionarios/${funcionarioIdFromTable}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Se o funcionário existe na API, usar o funcionario_id da tabela
      if (checkResponse.ok) {
        return Number(funcionarioIdFromTable)
      }

      // Se não existe (404), tentar funcionario_id do metadata
      if (checkResponse.status === 404) {
        // Continuar para tentar funcionario_id do metadata
      }
    } catch {
      // Em caso de erro na verificação, tentar funcionario_id do metadata
    }
  }

  // PRIORIDADE 2: Usar funcionario_id do metadata se não encontrou na tabela
  // O funcionario_id do metadata pode estar desatualizado, mas é melhor que nada
  const funcionarioIdFromMetadata = user.user_metadata?.funcionario_id

  if (
    funcionarioIdFromMetadata &&
    !isNaN(Number(funcionarioIdFromMetadata)) &&
    Number(funcionarioIdFromMetadata) > 0 &&
    Number(funcionarioIdFromMetadata) !== Number(funcionarioIdFromTable)
  ) {
    try {
      const cleanApiUrl = getApiOrigin()

      const checkResponse = await fetch(
        `${cleanApiUrl}/api/funcionarios/${funcionarioIdFromMetadata}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (checkResponse.ok) {
        return Number(funcionarioIdFromMetadata)
      }

      if (checkResponse.status === 404) {
        // Continuar para usar user.id como fallback
      }
    } catch {
      // Em caso de erro na verificação, tentar usar user.id como fallback
    }
  }

  // PRIORIDADE 3: Tentar usar funcionario_id sem validação de API como fallback
  const funcionarioId =
    user.profile?.funcionario_id || user.funcionario_id || user.user_metadata?.funcionario_id

  if (funcionarioId && !isNaN(Number(funcionarioId)) && Number(funcionarioId) > 0) {
    return Number(funcionarioId)
  }

  // Se não encontrar ID numérico, tentar buscar na API
  let emailResponse: Response | null = null
  let nomeResponse: Response | null = null

  try {
    const apiUrl = getApiOrigin()

    // Tentar buscar por email primeiro (mais preciso)
    if (user.email) {
      emailResponse = await fetch(
        `${apiUrl}/api/funcionarios?search=${encodeURIComponent(user.email)}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (emailResponse.ok) {
        const emailData = await emailResponse.json()
        const funcionarios = emailData.data || []

        const funcionario = funcionarios.find((f: any) => {
          const usuarioVinculado = Array.isArray(f.usuario)
            ? f.usuario.find((u: any) => u.id === user.id || u.email === user.email)
            : f.usuario

          return (
            usuarioVinculado?.id === user.id ||
            usuarioVinculado?.email === user.email ||
            f.email === user.email
          )
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
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (nomeResponse.ok) {
        const nomeData = await nomeResponse.json()
        const funcionarios = nomeData.data || []

        const funcionario = funcionarios.find((f: any) => {
          const usuarioVinculado = Array.isArray(f.usuario)
            ? f.usuario.find((u: any) => u.id === user.id || u.email === user.email)
            : f.usuario

          return (
            usuarioVinculado?.id === user.id ||
            usuarioVinculado?.email === user.email ||
            f.nome === user.nome
          )
        })

        if (funcionario && funcionario.id && !isNaN(Number(funcionario.id))) {
          return Number(funcionario.id)
        }
      }
    }

    if (emailResponse?.status === 403 || nomeResponse?.status === 403) {
      return null
    }

    if (user.id && !isNaN(Number(user.id)) && Number(user.id) > 0) {
      return Number(user.id)
    }

    return null
  } catch {
    if (user.id && !isNaN(Number(user.id)) && Number(user.id) > 0) {
      return Number(user.id)
    }
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
