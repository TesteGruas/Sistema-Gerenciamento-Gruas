import { useState, useEffect, useRef } from 'react'
import { getFuncionarioId } from '@/lib/get-funcionario-id'

interface PWAUserData {
  user: any | null
  pontoHoje: any | null
  documentosPendentes: number
  horasTrabalhadas: string
  loading: boolean
  error: string | null
}

// Cache global para evitar múltiplas chamadas simultâneas
let globalLoadingState = false
let globalDataCache: {
  pontoHoje: any | null
  documentosPendentes: number
  horasTrabalhadas: string
  timestamp: number
} | null = null
const CACHE_DURATION = 30 * 1000 // 30 segundos

export function usePWAUser(): PWAUserData {
  const [user, setUser] = useState<any>(null)
  const [pontoHoje, setPontoHoje] = useState<any>(null)
  const [documentosPendentes, setDocumentosPendentes] = useState<number>(0)
  const [horasTrabalhadas, setHorasTrabalhadas] = useState<string>('0h 0min')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null

    const loadUserData = async () => {
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') {
        if (isMounted) {
          setLoading(false)
        }
        return
      }

      // Carregar dados do usuário do localStorage primeiro (sempre necessário)
      const userData = localStorage.getItem('user_data')
      if (!userData) {
        // Não lançar erro, apenas retornar sem dados (situação normal na página de login)
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      const parsedUser = JSON.parse(userData)
      if (!isMounted) return
      
      // Sempre definir o user primeiro
      setUser(parsedUser)

      // Verificar cache primeiro antes de fazer chamadas de API
      if (globalDataCache && (Date.now() - globalDataCache.timestamp) < CACHE_DURATION) {
        if (isMounted) {
          setPontoHoje(globalDataCache.pontoHoje)
          setDocumentosPendentes(globalDataCache.documentosPendentes)
          setHorasTrabalhadas(globalDataCache.horasTrabalhadas)
          setLoading(false)
        }
        return
      }
      
      // Evitar execuções múltiplas simultâneas
      if (!isMounted) {
        if (isMounted) {
          setLoading(false)
        }
        return
      }
      
      // Se já está carregando, aguardar ou usar cache
      if (loadingRef.current || globalLoadingState) {
        // Se há cache válido, usar cache e desativar loading
        if (globalDataCache && (Date.now() - globalDataCache.timestamp) < CACHE_DURATION) {
          if (isMounted) {
            setPontoHoje(globalDataCache.pontoHoje)
            setDocumentosPendentes(globalDataCache.documentosPendentes)
            setHorasTrabalhadas(globalDataCache.horasTrabalhadas)
            setLoading(false)
          }
        } else if (isMounted) {
          // Se não há cache mas está carregando, aguardar um pouco e tentar novamente
          setLoading(false)
        }
        return
      }
      
      loadingRef.current = true
      globalLoadingState = true

      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('access_token')
        if (!token) {
          // Não lançar erro, apenas retornar sem token (situação normal na página de login)
          if (isMounted) {
            setLoading(false)
          }
          return
        }

        // Verificar se o token não está expirado antes de fazer requisições
        try {
          const tokenParts = token.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            if (payload.exp) {
              const isExpired = payload.exp * 1000 < Date.now()
              if (isExpired) {
                // Token expirado, não fazer requisições
                if (isMounted) {
                  setLoading(false)
                }
                return
              }
            }
          }
        } catch (tokenError) {
          // Se não conseguir decodificar, continuar
        }

        // Carregar ponto de hoje (silenciosamente, sem quebrar a página)
        try {
          const hoje = new Date().toISOString().split('T')[0]
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
          
          // Buscar ID numérico do funcionário usando função utilitária
          const funcionarioId = await getFuncionarioId(parsedUser, token)
          
          // Se encontrar ID numérico, carregar ponto
          if (funcionarioId) {
            const pontoResponse = await fetch(
              `${apiUrl}/api/ponto-eletronico/registros?data_inicio=${hoje}&data_fim=${hoje}&funcionario_id=${funcionarioId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            )

            // Se receber 403 ou 401, token é inválido - não tentar novamente
            if (pontoResponse.status === 403 || pontoResponse.status === 401) {
              if (isMounted) {
                setPontoHoje(null)
                setHorasTrabalhadas('0h 0min')
              }
            } else if (pontoResponse.ok && isMounted) {
              const pontoData = await pontoResponse.json()
              let horasCalculadas = '0h 0min'
              
              if (pontoData.data && pontoData.data.length > 0) {
                const ponto = pontoData.data[0]
                setPontoHoje(ponto)

                // Função auxiliar para converter hora (HH:MM:SS ou HH:MM) em minutos
                const horaParaMinutos = (horaStr: string): number => {
                  if (!horaStr || typeof horaStr !== 'string') return 0
                  const partes = horaStr.split(':')
                  if (partes.length < 2) return 0
                  const horas = parseInt(partes[0], 10)
                  const minutos = parseInt(partes[1], 10)
                  if (isNaN(horas) || isNaN(minutos)) return 0
                  return horas * 60 + minutos
                }

                // Calcular horas trabalhadas
                if (ponto.entrada && ponto.saida_almoco && ponto.volta_almoco && ponto.saida) {
                  try {
                    // Fórmula correta: (Saída Almoço - Entrada) + (Saída - Volta do Almoço)
                    const entradaMin = horaParaMinutos(ponto.entrada)
                    const saidaAlmocoMin = horaParaMinutos(ponto.saida_almoco)
                    const voltaAlmocoMin = horaParaMinutos(ponto.volta_almoco)
                    const saidaMin = horaParaMinutos(ponto.saida)
                    
                    if (entradaMin > 0 && saidaAlmocoMin > entradaMin && voltaAlmocoMin > 0 && saidaMin > voltaAlmocoMin) {
                      const periodoManha = saidaAlmocoMin - entradaMin
                      const periodoTarde = saidaMin - voltaAlmocoMin
                      const totalMinutos = periodoManha + periodoTarde
                      
                      if (totalMinutos > 0) {
                        const horas = Math.floor(totalMinutos / 60)
                        const minutos = totalMinutos % 60
                        horasCalculadas = `${horas}h ${minutos}min`
                      } else {
                        horasCalculadas = '0h 0min'
                      }
                    } else {
                      horasCalculadas = '0h 0min'
                    }
                  } catch (error) {
                    console.error('Erro ao calcular horas com almoço:', error)
                    horasCalculadas = '0h 0min'
                  }
                } else if (ponto.entrada && ponto.saida) {
                  // Se não tem horários de almoço, calcula como (Saída - Entrada)
                  try {
                    const entradaMin = horaParaMinutos(ponto.entrada)
                    const saidaMin = horaParaMinutos(ponto.saida)
                    
                    if (entradaMin > 0 && saidaMin > entradaMin) {
                      const totalMinutos = saidaMin - entradaMin
                      const horas = Math.floor(totalMinutos / 60)
                      const minutos = totalMinutos % 60
                      horasCalculadas = `${horas}h ${minutos}min`
                    } else {
                      horasCalculadas = '0h 0min'
                    }
                  } catch (error) {
                    console.error('Erro ao calcular horas sem almoço:', error)
                    horasCalculadas = '0h 0min'
                  }
                } else if (ponto.entrada) {
                  // Se só tem entrada, calcular até agora
                  try {
                    const entradaMin = horaParaMinutos(ponto.entrada)
                    const agora = new Date()
                    const agoraMin = agora.getHours() * 60 + agora.getMinutes()
                    
                    if (entradaMin > 0 && agoraMin > entradaMin) {
                      const totalMinutos = agoraMin - entradaMin
                      const horas = Math.floor(totalMinutos / 60)
                      const minutos = totalMinutos % 60
                      horasCalculadas = `${horas}h ${minutos}min`
                    } else {
                      horasCalculadas = '0h 0min'
                    }
                  } catch (error) {
                    console.error('Erro ao calcular horas em andamento:', error)
                    horasCalculadas = '0h 0min'
                  }
                }
                
                // Garantir que sempre temos um valor válido
                if (!horasCalculadas || horasCalculadas === 'NaNh NaNmin' || horasCalculadas.includes('NaN') || horasCalculadas === 'undefinedh undefinedmin') {
                  horasCalculadas = '0h 0min'
                }
                
                setHorasTrabalhadas(horasCalculadas)
                
                // Atualizar cache global
                globalDataCache = {
                  pontoHoje: ponto,
                  documentosPendentes: globalDataCache?.documentosPendentes || 0,
                  horasTrabalhadas: horasCalculadas,
                  timestamp: Date.now()
                }
              }
            }
          }
        } catch (pontoError) {
          // Não lançar erro, apenas continuar sem dados de ponto
          // Definir valores padrão para evitar quebras
          if (isMounted) {
            setPontoHoje(null)
            setHorasTrabalhadas('0h 0min')
          }
        }

        // Carregar notificações não lidas (silenciosamente, sem quebrar a página)
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
          const notifResponse = await fetch(
            `${apiUrl}/api/notificacoes/count/nao-lidas`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          // Se receber 403 ou 401, token é inválido - não tentar novamente
          if (notifResponse.status === 403 || notifResponse.status === 401) {
            if (isMounted) {
              setDocumentosPendentes(0)
            }
          } else if (notifResponse.ok && isMounted) {
            const notifData = await notifResponse.json()
            const notifCount = notifData.count || 0
            setDocumentosPendentes(notifCount) // Reutilizando o estado para notificações
            
            // Atualizar cache global
            if (globalDataCache) {
              globalDataCache.documentosPendentes = notifCount
              globalDataCache.timestamp = Date.now()
            } else {
              globalDataCache = {
                pontoHoje: null,
                documentosPendentes: notifCount,
                horasTrabalhadas: '0h 0min',
                timestamp: Date.now()
              }
            }
          }
        } catch (notifError) {
          // Não lançar erro, apenas continuar sem dados de notificações
        }

      } catch (err) {
        // Não logar erro se for apenas ausência de dados (situação normal na página de login)
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        if (errorMessage !== 'Dados do usuário não encontrados' && 
            errorMessage !== 'Token não encontrado') {
          console.error('Erro ao carregar dados do usuário:', err)
        }
        if (isMounted) {
          // Não definir erro para situações normais (login)
          if (errorMessage !== 'Dados do usuário não encontrados' && 
              errorMessage !== 'Token não encontrado') {
            setError(errorMessage)
          } else {
            setError(null)
          }
        }
      } finally {
        // Sempre desativar loading e flags, mesmo se o componente foi desmontado
        loadingRef.current = false
        globalLoadingState = false
        // Sempre tentar desativar loading, o React vai ignorar se o componente foi desmontado
        try {
          setLoading(false)
        } catch (e) {
          // Ignorar erros se o componente foi desmontado
        }
      }
    }

    // Carregar dados inicialmente
    loadUserData()

    // Atualizar dados a cada 2 minutos (apenas se o componente ainda estiver montado)
    // Aumentado para 2 minutos para reduzir chamadas
    intervalId = setInterval(() => {
      if (isMounted && !loadingRef.current && !globalLoadingState) {
        // Limpar cache antes de recarregar
        globalDataCache = null
        loadUserData()
      }
    }, 2 * 60 * 1000)

    return () => {
      isMounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [])

  return { 
    user, 
    pontoHoje, 
    documentosPendentes, 
    horasTrabalhadas,
    loading, 
    error 
  }
}

