import { useState, useEffect } from 'react'
import { getFuncionarioId } from '@/lib/get-funcionario-id'

interface PWAUserData {
  user: any | null
  pontoHoje: any | null
  documentosPendentes: number
  horasTrabalhadas: string
  loading: boolean
  error: string | null
}

export function usePWAUser(): PWAUserData {
  const [user, setUser] = useState<any>(null)
  const [pontoHoje, setPontoHoje] = useState<any>(null)
  const [documentosPendentes, setDocumentosPendentes] = useState<number>(0)
  const [horasTrabalhadas, setHorasTrabalhadas] = useState<string>('0h 0min')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null

    const loadUserData = async () => {
      // Evitar execuções múltiplas simultâneas
      if (!isMounted) return

      try {
        setLoading(true)
        setError(null)

        // Verificar se estamos no cliente
        if (typeof window === 'undefined') {
          setLoading(false)
          return
        }

        // Carregar dados do usuário do localStorage
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
        setUser(parsedUser)

        const token = localStorage.getItem('access_token')
        if (!token) {
          // Não lançar erro, apenas retornar sem token (situação normal na página de login)
          if (isMounted) {
            setLoading(false)
          }
          return
        }

        // Carregar ponto de hoje (silenciosamente, sem quebrar a página)
        try {
          const hoje = new Date().toISOString().split('T')[0]
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
          
          // Buscar ID numérico do funcionário usando função utilitária
          const funcionarioId = await getFuncionarioId(parsedUser, token)
          
          // Se não encontrar ID numérico, pular carregamento do ponto
          if (!funcionarioId) {
            return
          }
          
          const pontoResponse = await fetch(
            `${apiUrl}/api/ponto-eletronico/registros?data_inicio=${hoje}&data_fim=${hoje}&funcionario_id=${funcionarioId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (pontoResponse.ok && isMounted) {
            const pontoData = await pontoResponse.json()
            if (pontoData.data && pontoData.data.length > 0) {
              const ponto = pontoData.data[0]
              setPontoHoje(ponto)

              // Calcular horas trabalhadas
              if (ponto.entrada && ponto.saida_almoco && ponto.volta_almoco && ponto.saida) {
                const entrada = new Date(ponto.entrada)
                const saida = new Date(ponto.saida)
                const saidaAlmoco = new Date(ponto.saida_almoco)
                const voltaAlmoco = new Date(ponto.volta_almoco)
                
                // Fórmula correta: (Saída Almoço - Entrada) + (Saída - Volta do Almoço)
                const periodoManha = saidaAlmoco.getTime() - entrada.getTime()
                const periodoTarde = saida.getTime() - voltaAlmoco.getTime()
                const totalDiff = periodoManha + periodoTarde
                
                const horas = Math.floor(totalDiff / (1000 * 60 * 60))
                const minutos = Math.floor((totalDiff % (1000 * 60 * 60)) / (1000 * 60))
                
                setHorasTrabalhadas(`${horas}h ${minutos}min`)
              } else if (ponto.entrada && ponto.saida) {
                // Se não tem horários de almoço, calcula como (Saída - Entrada)
                const entrada = new Date(ponto.entrada)
                const saida = new Date(ponto.saida)
                const totalDiff = saida.getTime() - entrada.getTime()
                
                const horas = Math.floor(totalDiff / (1000 * 60 * 60))
                const minutos = Math.floor((totalDiff % (1000 * 60 * 60)) / (1000 * 60))
                
                // Se for menos de 8 horas, mostra como negativo
                if (horas < 8) {
                  const horasNegativas = 8 - horas
                  setHorasTrabalhadas(`${horas}h ${minutos}min (-${horasNegativas}h)`)
                } else {
                  setHorasTrabalhadas(`${horas}h ${minutos}min`)
                }
              }
            }
          } else {
          }
        } catch (pontoError) {
          // Não lançar erro, apenas continuar sem dados de ponto
          // Definir valores padrão para evitar quebras
          if (isMounted) {
            setPontoHoje(null)
            setHorasTrabalhadas('0h 0min')
          }
        }

        // Carregar documentos pendentes (silenciosamente, sem quebrar a página)
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
          const docsResponse = await fetch(
            `${apiUrl}/api/assinaturas/pendentes`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (docsResponse.ok && isMounted) {
            const docsData = await docsResponse.json()
            setDocumentosPendentes(docsData.data?.length || 0)
          }
        } catch (docsError) {
          // Não lançar erro, apenas continuar sem dados de documentos
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
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Carregar dados inicialmente
    loadUserData()

    // Atualizar dados a cada 1 minuto (apenas se o componente ainda estiver montado)
    intervalId = setInterval(() => {
      if (isMounted) {
        loadUserData()
      }
    }, 60 * 1000)

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

