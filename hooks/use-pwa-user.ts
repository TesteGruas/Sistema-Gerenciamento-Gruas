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
    const loadUserData = async () => {
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
          throw new Error('Dados do usuário não encontrados')
        }

        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        const token = localStorage.getItem('access_token')
        if (!token) {
          throw new Error('Token não encontrado')
        }

        // Carregar ponto de hoje (silenciosamente, sem quebrar a página)
        try {
          const hoje = new Date().toISOString().split('T')[0]
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
          
          // Buscar ID numérico do funcionário usando função utilitária
          const funcionarioId = await getFuncionarioId(parsedUser, token)
          
          // Se não encontrar ID numérico, pular carregamento do ponto
          if (!funcionarioId) {
            console.warn('🔍 [usePWAUser] ID do funcionário não disponível, pulando carregamento do ponto')
            return
          }
          
          console.log('🔍 [usePWAUser] Carregando ponto para funcionarioId:', funcionarioId)
          
          const pontoResponse = await fetch(
            `${apiUrl}/api/ponto-eletronico/registros?data_inicio=${hoje}&data_fim=${hoje}&funcionario_id=${funcionarioId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (pontoResponse.ok) {
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
            console.warn('[PWA User Hook] Endpoint de ponto não disponível ou retornou erro:', pontoResponse.status)
          }
        } catch (pontoError) {
          console.warn('[PWA User Hook] Erro ao carregar ponto (continuando sem dados):', pontoError)
          // Não lançar erro, apenas continuar sem dados de ponto
          // Definir valores padrão para evitar quebras
          setPontoHoje(null)
          setHorasTrabalhadas('0h 0min')
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

          if (docsResponse.ok) {
            const docsData = await docsResponse.json()
            setDocumentosPendentes(docsData.data?.length || 0)
          } else {
            console.warn('[PWA User Hook] Endpoint de documentos não disponível ou retornou erro:', docsResponse.status)
          }
        } catch (docsError) {
          console.warn('[PWA User Hook] Erro ao carregar documentos (continuando sem dados):', docsError)
          // Não lançar erro, apenas continuar sem dados de documentos
        }

      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()

    // Atualizar dados a cada 1 minuto
    const interval = setInterval(() => {
      loadUserData()
    }, 60 * 1000)

    return () => clearInterval(interval)
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

