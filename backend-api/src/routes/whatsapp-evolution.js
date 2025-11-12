/**
 * Rotas para integração com Evolution API - WhatsApp
 * Baseado na documentação: docs/evolution-api-instance-creation.md
 */

import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

/**
 * Obter configuração da Evolution API do banco
 */
async function getEvolutionAPIConfig() {
  try {
    const { data: config, error } = await supabaseAdmin
      .from('system_config')
      .select('key, value')
      .in('key', ['evolution_api_url', 'evolution_api_key'])

    if (error) {
      console.error('Erro ao buscar configuração Evolution API:', error)
      return null
    }

    const url = config.find(c => c.key === 'evolution_api_url')?.value
    const key = config.find(c => c.key === 'evolution_api_key')?.value

    if (!url || !key) {
      return null
    }

    return { url, key }
  } catch (error) {
    console.error('Erro ao obter configuração Evolution API:', error)
    return null
  }
}

/**
 * Proxy para Evolution API
 */
async function proxyToEvolutionAPI(config, method, endpoint, body = null) {
  try {
    const url = `${config.url}${endpoint}`
    
    const options = {
      method,
      headers: {
        'apikey': config.key,
        'Content-Type': 'application/json',
      },
    }

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body)
    }

    console.log(`[Evolution API] ${method} ${url}`)
    
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`[Evolution API] Erro ${response.status}: ${errorText}`)
      return {
        ok: false,
        status: response.status,
        error: errorText || response.statusText
      }
    }

    const data = await response.json().catch(() => ({}))
    return {
      ok: true,
      status: response.status,
      data
    }
  } catch (error) {
    console.error('[Evolution API] Erro na requisição:', error)
    return {
      ok: false,
      status: 500,
      error: error.message || 'Erro ao conectar com Evolution API'
    }
  }
}

/**
 * POST /api/whatsapp-evolution/instance/create
 * Criar instância WhatsApp na Evolution API
 */
router.post('/instance/create', async (req, res) => {
  try {
    const { instanceName } = req.body

    const config = await getEvolutionAPIConfig()
    if (!config) {
      return res.status(500).json({
        error: 'Evolution API não configurada. Configure as credenciais no painel Admin.'
      })
    }

    // Nome fixo para instância única do sistema
    const name = instanceName || 'sistema-whatsapp'

    // Verificar se já existe alguma instância no sistema (única instância)
    const { data: existingInstance } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', name)
      .single()

    if (existingInstance) {
      // Retornar a instância existente ao invés de erro
      // Mas verificar se precisa obter QR code
      if (existingInstance.status === 'disconnected' || existingInstance.status === 'connecting') {
        // Tentar obter QR code da Evolution API
        const qrResponse = await proxyToEvolutionAPI(
          config,
          'GET',
          `/instance/connect/${name}`
        )
        
        if (qrResponse.ok && (qrResponse.data?.code || qrResponse.data?.base64)) {
          const qrCode = qrResponse.data.code || qrResponse.data.base64
          const expiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutos
          
          const { data: updatedInstance } = await supabaseAdmin
            .from('whatsapp_instances')
            .update({
              qr_code: qrCode,
              qr_code_expires_at: expiresAt.toISOString(),
              status: 'connecting'
            })
            .eq('id', existingInstance.id)
            .select()
            .single()
          
          if (updatedInstance) {
            return res.status(200).json(updatedInstance)
          }
        }
      }
      
      return res.status(200).json(existingInstance)
    }

    // Criar instância na Evolution API
    const evolutionResponse = await proxyToEvolutionAPI(
      config,
      'POST',
      '/instance/create',
      {
        instanceName: name,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true
      }
    )

    if (!evolutionResponse.ok) {
      // Se a Evolution API retornar que já existe, buscar no banco
      if (evolutionResponse.error?.includes('already exists') || evolutionResponse.error?.includes('já existe')) {
        const { data: existingInstance } = await supabaseAdmin
          .from('whatsapp_instances')
          .select('*')
          .eq('instance_name', name)
          .single()
        
        if (existingInstance) {
          return res.status(200).json(existingInstance)
        }
      }
      
      return res.status(evolutionResponse.status || 500).json({
        error: evolutionResponse.error || 'Erro ao criar instância na Evolution API'
      })
    }

    // Salvar instância no banco (sem user_id - instância única do sistema)
    const { data: instanceData, error: dbError } = await supabaseAdmin
      .from('whatsapp_instances')
      .insert({
        instance_name: name,
        status: 'connecting',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar instância:', dbError)
      return res.status(500).json({
        error: 'Erro ao salvar instância no banco'
      })
    }

    return res.status(200).json(instanceData)
  } catch (error) {
    console.error('Erro ao criar instância:', error)
    return res.status(500).json({
      error: error.message || 'Erro interno do servidor'
    })
  }
})

/**
 * GET /api/whatsapp-evolution/instance/connect/:instanceName
 * Obter QR Code para conexão
 */
router.get('/instance/connect/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params

    // Buscar instância (única do sistema)
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id, instance_name')
      .eq('instance_name', instanceName)
      .single()

    if (instanceError || !instance) {
      return res.status(404).json({
        error: 'Instância não encontrada'
      })
    }

    const config = await getEvolutionAPIConfig()
    if (!config) {
      return res.status(500).json({
        error: 'Evolution API não configurada'
      })
    }

    // Obter QR code da Evolution API
    const evolutionResponse = await proxyToEvolutionAPI(
      config,
      'GET',
      `/instance/connect/${instanceName}`
    )

    if (!evolutionResponse.ok) {
      return res.status(evolutionResponse.status || 500).json({
        error: evolutionResponse.error || 'Erro ao obter QR code'
      })
    }

    // Atualizar QR code no banco se disponível
    if (evolutionResponse.data?.code || evolutionResponse.data?.base64) {
      let qrCode = evolutionResponse.data.code || evolutionResponse.data.base64
      
      // Se o QR code vier como array ou com vírgulas, pegar apenas a primeira parte
      if (typeof qrCode === 'string' && qrCode.includes(',')) {
        // Se parece ser um array de strings base64, usar a primeira
        const parts = qrCode.split(',')
        qrCode = parts[0] // Usar apenas a primeira parte
      }
      
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutos

      await supabaseAdmin
        .from('whatsapp_instances')
        .update({
          qr_code: qrCode,
          qr_code_expires_at: expiresAt.toISOString()
        })
        .eq('id', instance.id)
    }

    return res.status(200).json(evolutionResponse.data)
  } catch (error) {
    console.error('Erro ao obter QR code:', error)
    return res.status(500).json({
      error: error.message || 'Erro interno do servidor'
    })
  }
})

/**
 * GET /api/whatsapp-evolution/instance/connectionState/:instanceName
 * Obter estado de conexão da instância
 */
router.get('/instance/connectionState/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params

    // Verificar se a instância existe (única do sistema)
    const { data: instance } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .single()

    if (!instance) {
      return res.status(404).json({
        error: 'Instância não encontrada'
      })
    }

    const config = await getEvolutionAPIConfig()
    if (!config) {
      return res.status(500).json({
        error: 'Evolution API não configurada'
      })
    }

    const evolutionResponse = await proxyToEvolutionAPI(
      config,
      'GET',
      `/instance/connectionState/${instanceName}`
    )

    if (!evolutionResponse.ok) {
      return res.status(evolutionResponse.status || 500).json({
        error: evolutionResponse.error || 'Erro ao obter estado de conexão'
      })
    }

    return res.status(200).json(evolutionResponse.data)
  } catch (error) {
    console.error('Erro ao obter estado de conexão:', error)
    return res.status(500).json({
      error: error.message || 'Erro interno do servidor'
    })
  }
})

/**
 * GET /api/whatsapp-evolution/instance/sync/:userId
 * Sincronizar status da instância
 */
router.get('/instance/sync', async (req, res) => {
  try {
    // Buscar qualquer instância do sistema (priorizar conectadas)
    const { data: instances, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .order('status', { ascending: false }) // 'connected' vem antes de 'connecting'
      .order('created_at', { ascending: false })
      .limit(1)

    if (instanceError) {
      if (instanceError.code === 'PGRST116') {
        return res.status(200).json(null)
      }
      console.error('[WhatsApp Sync] Erro ao buscar instância:', instanceError)
      return res.status(200).json(null)
    }

    if (!instances || instances.length === 0) {
      return res.status(200).json(null)
    }

    const instance = instances[0]

    const config = await getEvolutionAPIConfig()
    if (!config) {
      return res.status(500).json({
        error: 'Evolution API não configurada'
      })
    }

    // Obter estado de conexão
    const evolutionResponse = await proxyToEvolutionAPI(
      config,
      'GET',
      `/instance/connectionState/${instance.instance_name}`
    )

    if (!evolutionResponse.ok) {
      console.log('[WhatsApp Sync] Erro ao obter estado da Evolution API, retornando instância atual')
      return res.status(200).json(instance) // Retornar instância atual mesmo se erro
    }

    const connectionState = evolutionResponse.data
    console.log('[WhatsApp Sync] Estado da Evolution API:', JSON.stringify(connectionState, null, 2))
    
    let status = instance.status
    let phoneNumber = instance.phone_number
    let errorMessage = null

    // A Evolution API pode retornar o estado em diferentes formatos:
    // 1. connectionState.state (direto)
    // 2. connectionState.instance.state (dentro do objeto instance)
    // 3. connectionState.status (string com número)
    const actualState = connectionState.instance?.state || connectionState.state
    
    console.log('[WhatsApp Sync] Estado detectado:', actualState)

    // Mapear estados da Evolution API
    if (actualState === 'open' || actualState === 'connected') {
      status = 'connected'
      console.log('[WhatsApp Sync] Instância está conectada!')
      
      // Tentar extrair número do WhatsApp de diferentes formatos
      if (connectionState.instance?.phoneNumber) {
        phoneNumber = connectionState.instance.phoneNumber
      } else if (connectionState.phoneNumber) {
        phoneNumber = connectionState.phoneNumber
      } else if (connectionState.status) {
        // O status pode conter o número do WhatsApp (formato: 5511999999999@s.whatsapp.net)
        const statusStr = String(connectionState.status)
        if (statusStr.includes('@')) {
          phoneNumber = statusStr.split('@')[0]
        } else {
          phoneNumber = statusStr
        }
      } else if (connectionState.instance?.instanceName) {
        // Se não tem número ainda, manter o que já existe
        phoneNumber = instance.phone_number
      }
      
      console.log('[WhatsApp Sync] Número do WhatsApp:', phoneNumber)
    } else if (actualState === 'connecting') {
      status = 'connecting'
      console.log('[WhatsApp Sync] Instância ainda conectando')
    } else if (actualState === 'close' || actualState === 'closed' || actualState === 'disconnected') {
      status = 'disconnected'
      console.log('[WhatsApp Sync] Instância desconectada')
    } else {
      // Se não reconheceu o estado, manter o atual mas logar
      console.warn('[WhatsApp Sync] Estado não reconhecido:', actualState, '- Mantendo status atual:', instance.status)
    }

    // Só atualizar se o status mudou ou se precisa atualizar o número
    const needsUpdate = status !== instance.status || 
                       (phoneNumber && phoneNumber !== instance.phone_number) ||
                       status === 'connected' // Sempre atualizar quando conectado para garantir

    if (needsUpdate) {
      console.log('[WhatsApp Sync] Atualizando banco de dados:', {
        status: `${instance.status} -> ${status}`,
        phoneNumber: phoneNumber || '(mantendo atual)'
      })
      
      // Atualizar no banco
      const { data: updatedInstance, error: updateError } = await supabaseAdmin
        .from('whatsapp_instances')
        .update({
          status,
          phone_number: phoneNumber || instance.phone_number, // Manter número atual se não tiver novo
          error_message: errorMessage,
          last_status_check: new Date().toISOString()
        })
        .eq('id', instance.id)
        .select()
        .single()

      if (updateError) {
        console.error('[WhatsApp Sync] Erro ao atualizar status:', updateError)
        return res.status(200).json(instance)
      }

      console.log('[WhatsApp Sync] Status atualizado com sucesso no banco')
      return res.status(200).json(updatedInstance)
    } else {
      console.log('[WhatsApp Sync] Nenhuma atualização necessária')
      return res.status(200).json(instance)
    }
  } catch (error) {
    console.error('Erro ao sincronizar status:', error)
    return res.status(500).json({
      error: error.message || 'Erro interno do servidor'
    })
  }
})

/**
 * GET /api/whatsapp-evolution/instance/:userId (DEPRECATED - manter para compatibilidade)
 * Esta rota está deprecated, mas mantida para evitar erros 404
 * Retorna a mesma coisa que /instance (instância única do sistema)
 * IMPORTANTE: Esta rota deve vir ANTES de /instance para evitar conflito
 */
router.get('/instance/:userId', async (req, res) => {
  console.log('[WhatsApp API] Rota deprecated /instance/:userId chamada, retornando instância do sistema')
  try {
    // Buscar qualquer instância do sistema (ignorar userId, priorizar conectadas)
    const { data: instances, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .order('status', { ascending: false }) // 'connected' vem antes de 'connecting'
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(200).json(null)
      }
      return res.status(500).json({
        error: 'Erro ao buscar instância'
      })
    }

    if (!instances || instances.length === 0) {
      return res.status(200).json(null)
    }

    return res.status(200).json(instances[0])
  } catch (error) {
    console.error('Erro ao obter instância (rota deprecated):', error)
    return res.status(500).json({
      error: error.message || 'Erro interno do servidor'
    })
  }
})

/**
 * GET /api/whatsapp-evolution/instance
 * Obter instância única do sistema
 */
router.get('/instance', async (req, res) => {
  try {
    console.log('[WhatsApp API] GET /instance - Buscando instância do sistema')
    // Buscar qualquer instância do sistema (priorizar conectadas)
    const { data: instances, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .order('status', { ascending: false }) // 'connected' vem antes de 'connecting'
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[WhatsApp API] Erro ao buscar instâncias:', error)
      // Se for erro de "nenhum resultado", retornar null (não é erro crítico)
      if (error.code === 'PGRST116') {
        return res.status(200).json(null)
      }
      return res.status(500).json({
        error: 'Erro ao buscar instância'
      })
    }

    if (!instances || instances.length === 0) {
      console.log('[WhatsApp API] Nenhuma instância encontrada')
      return res.status(200).json(null)
    }

    const instance = instances[0]
    console.log('[WhatsApp API] Instância encontrada:', instance.instance_name, 'Status:', instance.status)
    return res.status(200).json(instance)
  } catch (error) {
    console.error('Erro ao obter instância:', error)
    return res.status(500).json({
      error: error.message || 'Erro interno do servidor'
    })
  }
})

/**
 * DELETE /api/whatsapp-evolution/instance/delete/:instanceName
 * Deletar instância
 */
router.delete('/instance/delete/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params

    // Verificar se a instância existe (única do sistema)
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .single()

    if (instanceError || !instance) {
      return res.status(404).json({
        error: 'Instância não encontrada'
      })
    }

    const config = await getEvolutionAPIConfig()
    if (config) {
      // Deletar na Evolution API
      await proxyToEvolutionAPI(
        config,
        'DELETE',
        `/instance/delete/${instanceName}`
      )
    }

    // Deletar do banco
    await supabaseAdmin
      .from('whatsapp_instances')
      .delete()
      .eq('id', instance.id)

    return res.status(200).json({
      success: true,
      message: 'Instância deletada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar instância:', error)
    return res.status(500).json({
      error: error.message || 'Erro interno do servidor'
    })
  }
})

export default router

