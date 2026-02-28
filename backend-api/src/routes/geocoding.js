/**
 * Rotas para geocoding e conversão de CEP
 * Sistema de Gerenciamento de Gruas
 */

import express from 'express'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

/**
 * GET /api/geocoding/via-cep/:cep
 * Busca dados de endereço no ViaCEP (sem geocoding)
 */
router.get('/via-cep/:cep', async (req, res) => {
  try {
    const { cep } = req.params

    if (!cep) {
      return res.status(400).json({
        success: false,
        error: 'CEP é obrigatório'
      })
    }

    const cepLimpo = cep.replace(/\D/g, '')

    if (cepLimpo.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'CEP inválido. Deve conter 8 dígitos'
      })
    }

    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const viaCepData = viaCepResponse.ok ? await viaCepResponse.json() : null

    if (viaCepData && !viaCepData?.erro) {
      return res.json({
        success: true,
        data: viaCepData
      })
    }

    // Fallback: BrasilAPI (mantém o contrato semelhante ao ViaCEP)
    const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`)
    const brasilApiData = brasilApiResponse.ok ? await brasilApiResponse.json() : null

    if (brasilApiData && !brasilApiData?.errors) {
      return res.json({
        success: true,
        data: {
          cep: brasilApiData.cep || `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`,
          logradouro: brasilApiData.street || '',
          complemento: '',
          bairro: brasilApiData.neighborhood || '',
          localidade: brasilApiData.city || '',
          uf: brasilApiData.state || '',
          ibge: brasilApiData.city_ibge || '',
          gia: '',
          ddd: brasilApiData.ddd || '',
          siafi: ''
        }
      })
    }

    return res.status(404).json({
      success: false,
      error: 'CEP inválido ou não encontrado'
    })
  } catch (error) {
    console.error('Erro ao buscar dados do CEP no ViaCEP:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * GET /api/geocoding/cep/:cep
 * Converte CEP em coordenadas (latitude e longitude)
 */
router.get('/cep/:cep', async (req, res) => {
  try {
    const { cep } = req.params
    
    if (!cep) {
      return res.status(400).json({
        success: false,
        error: 'CEP é obrigatório'
      })
    }

    // Limpar CEP (remover caracteres não numéricos)
    const cepLimpo = cep.replace(/\D/g, '')
    
    if (cepLimpo.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'CEP inválido. Deve conter 8 dígitos'
      })
    }

    // Primeiro, obter endereço do CEP usando ViaCEP
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    
    if (!viaCepResponse.ok) {
      return res.status(404).json({
        success: false,
        error: 'CEP não encontrado'
      })
    }
    
    const viaCepData = await viaCepResponse.json()
    
    if (viaCepData.erro) {
      return res.status(404).json({
        success: false,
        error: 'CEP inválido ou não encontrado'
      })
    }
    
    // Construir diferentes formatos de endereço para tentar
    const formatosEndereco = [
      // Formato completo
      `${viaCepData.logradouro || ''}, ${viaCepData.bairro || ''}, ${viaCepData.localidade || ''}, ${viaCepData.uf || ''}, Brasil`.replace(/^,\s*|,\s*$/g, ''),
      // Formato com cidade e estado
      `${viaCepData.localidade || ''}, ${viaCepData.uf || ''}, Brasil`,
      // Formato apenas com CEP
      `CEP ${cepLimpo}, ${viaCepData.localidade || ''}, ${viaCepData.uf || ''}, Brasil`
    ].filter(addr => addr && addr.length > 5)
    
    let coordenadas = null
    let enderecoUsado = null
    
    // Tentar cada formato até encontrar coordenadas
    for (const endereco of formatosEndereco) {
      try {
        // Usar Nominatim para geocoding (do servidor, sem problemas de CORS)
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Sistema-Gerenciamento-Gruas/1.0',
              'Accept-Language': 'pt-BR,pt,en'
            }
          }
        )
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json()
          
          if (geocodeData && geocodeData.length > 0) {
            coordenadas = {
              lat: parseFloat(geocodeData[0].lat),
              lng: parseFloat(geocodeData[0].lon)
            }
            enderecoUsado = endereco
            break
          }
        }
      } catch (error) {
        console.warn(`Erro ao buscar coordenadas para formato "${endereco}":`, error.message)
        continue
      }
    }
    
    // Se ainda não encontrou, tentar usar uma API alternativa (BrasilAPI)
    if (!coordenadas) {
      try {
        const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`)
        
        if (brasilApiResponse.ok) {
          const brasilApiData = await brasilApiResponse.json()
          
          if (brasilApiData.location && brasilApiData.location.coordinates) {
            coordenadas = {
              lat: brasilApiData.location.coordinates.latitude,
              lng: brasilApiData.location.coordinates.longitude
            }
            enderecoUsado = `${brasilApiData.street || ''}, ${brasilApiData.neighborhood || ''}, ${brasilApiData.city || ''}, ${brasilApiData.state || ''}`
          }
        }
      } catch (error) {
        console.warn('Erro ao usar BrasilAPI:', error.message)
      }
    }
    
    if (!coordenadas) {
      return res.status(404).json({
        success: false,
        error: 'Coordenadas não encontradas para este CEP',
        details: 'Tentamos múltiplos formatos de endereço e APIs, mas não foi possível obter as coordenadas'
      })
    }
    
    res.json({
      success: true,
      data: {
        cep: cepLimpo,
        endereco: viaCepData,
        coordenadas: coordenadas,
        enderecoCompleto: enderecoUsado || formatosEndereco[0]
      }
    })
  } catch (error) {
    console.error('Erro ao converter CEP em coordenadas:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * GET /api/geocoding/endereco
 * Converte endereço completo em coordenadas (latitude e longitude)
 */
router.get('/endereco', async (req, res) => {
  try {
    const { q } = req.query
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Endereço é obrigatório (parâmetro q)'
      })
    }

    // Usar Nominatim para geocoding (do servidor, sem problemas de CORS)
    const geocodeResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Sistema-Gerenciamento-Gruas/1.0',
          'Accept-Language': 'pt-BR,pt,en'
        }
      }
    )
    
    if (!geocodeResponse.ok) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar coordenadas do endereço'
      })
    }
    
    const geocodeData = await geocodeResponse.json()
    
    if (!geocodeData || geocodeData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Coordenadas não encontradas para este endereço'
      })
    }
    
    res.json({
      success: true,
      data: {
        endereco: q,
        coordenadas: {
          lat: parseFloat(geocodeData[0].lat),
          lng: parseFloat(geocodeData[0].lon)
        },
        enderecoCompleto: geocodeData[0].display_name
      }
    })
  } catch (error) {
    console.error('Erro ao converter endereço em coordenadas:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router

