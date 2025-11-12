/**
 * Serviço para integração com Evolution API - WhatsApp
 * Baseado na documentação: docs/evolution-api-instance-creation.md
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

async function callEdgeFunction(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken()
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado')
  }

  // Usar URL relativa que será redirecionada pelo Next.js rewrite
  const response = await fetch(`/api/whatsapp-evolution${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    // Se for 404, pode ser que a rota não existe ou a instância não foi encontrada
    if (response.status === 404) {
      const error = await response.json().catch(() => ({ error: 'Rota não encontrada' }))
      throw new Error(error.error || error.message || 'Rota não encontrada')
    }
    const error = await response.json().catch(() => ({ error: 'Erro na requisição' }))
    throw new Error(error.error || error.message || 'Erro na requisição')
  }

  return response.json()
}

export interface WhatsAppInstance {
  id: string
  instance_name: string
  phone_number?: string
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  qr_code?: string
  qr_code_expires_at?: string
  error_message?: string
  last_status_check?: string
  created_at: string
  updated_at: string
}

export interface ConnectionState {
  instance: string
  state: 'open' | 'close' | 'connecting'
  status?: string
}

/**
 * Criar instância WhatsApp na Evolution API (única para todo o sistema)
 */
export async function createInstance(instanceName?: string): Promise<WhatsAppInstance> {
  try {
    const name = instanceName || 'sistema-whatsapp'
    
    const response = await callEdgeFunction('/instance/create', {
      method: 'POST',
      body: JSON.stringify({ instanceName: name }),
    })

    return response as WhatsAppInstance
  } catch (error) {
    console.error('Erro ao criar instância:', error)
    throw error
  }
}

/**
 * Obter QR Code para conexão
 */
export async function getQRCode(instanceName: string): Promise<string | null> {
  try {
    const response = await callEdgeFunction(`/instance/connect/${instanceName}`, {
      method: 'GET',
    })

    console.log('Resposta Evolution API para QR code:', response)
    
    // A Evolution API pode retornar o QR code em diferentes formatos
    // Tentar diferentes propriedades possíveis
    
    // Se for string direta (base64)
    if (typeof response === 'string') {
      // Se começa com data:image, extrair apenas a parte base64
      if (response.startsWith('data:image')) {
        const base64 = response.split(',')[1] || response
        return base64
      }
      // Se contém vírgulas mas não é data:image, pode ser múltiplas partes
      // O Evolution API pode retornar QR code em partes separadas por vírgulas
      // Nesse caso, precisamos juntar ou usar apenas a primeira parte
      if (response.includes(',') && response.length > 100) {
        // Se parece ser base64 com vírgulas no meio (formato do Evolution API)
        // Tentar usar a primeira parte que geralmente é a completa
        const parts = response.split(',')
        // A primeira parte geralmente contém o QR code completo
        return parts[0]
      }
      return response
    }
    
    // Verificar propriedades comuns
    if (response.base64) {
      const base64 = typeof response.base64 === 'string' ? response.base64 : response.base64.code || response.base64.base64
      if (base64) {
        return base64.includes(',') ? base64.split(',')[1] : base64
      }
    }
    
    if (response.code) {
      return response.code
    }
    
    if (response.qrcode) {
      if (typeof response.qrcode === 'string') {
        return response.qrcode.includes(',') ? response.qrcode.split(',')[1] : response.qrcode
      }
      if (response.qrcode.base64) {
        return response.qrcode.base64.includes(',') ? response.qrcode.base64.split(',')[1] : response.qrcode.base64
      }
      if (response.qrcode.code) {
        return response.qrcode.code
      }
    }
    
    if (response.instance?.qrcode) {
      const qrcode = response.instance.qrcode
      if (typeof qrcode === 'string') {
        return qrcode.includes(',') ? qrcode.split(',')[1] : qrcode
      }
      return qrcode.base64 || qrcode.code || null
    }
    
    console.warn('Formato de QR code não reconhecido. Dados recebidos:', JSON.stringify(response).substring(0, 500))
    return null
  } catch (error) {
    console.error('Erro ao obter QR code:', error)
    throw error
  }
}

/**
 * Obter estado de conexão da instância
 */
export async function getConnectionState(instanceName: string): Promise<ConnectionState> {
  try {
    const response = await callEdgeFunction(`/instance/connectionState/${instanceName}`, {
      method: 'GET',
    })

    return response as ConnectionState
  } catch (error) {
    console.error('Erro ao obter estado de conexão:', error)
    throw error
  }
}

/**
 * Sincronizar status da instância (única do sistema)
 */
export async function syncInstanceStatus(): Promise<WhatsAppInstance | null> {
  try {
    const response = await callEdgeFunction('/instance/sync', {
      method: 'GET',
    })

    return response as WhatsAppInstance | null
  } catch (error) {
    console.error('Erro ao sincronizar status:', error)
    throw error
  }
}

/**
 * Deletar instância
 */
export async function deleteInstance(instanceName: string): Promise<void> {
  try {
    await callEdgeFunction(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Erro ao deletar instância:', error)
    throw error
  }
}

/**
 * Obter instância única do sistema
 */
export async function getInstance(): Promise<WhatsAppInstance | null> {
  try {
    console.log('[WhatsApp Service] Buscando instância única do sistema em /instance')
    const response = await callEdgeFunction('/instance', {
      method: 'GET',
    })

    return response as WhatsAppInstance | null
  } catch (error: any) {
    console.error('[WhatsApp Service] Erro ao obter instância:', error)
    // Se for 404, pode ser que não existe instância ainda (não é erro crítico)
    if (error.message?.includes('404') || error.message?.includes('não encontrada')) {
      return null
    }
    throw error
  }
}

