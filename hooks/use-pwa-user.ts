import { useState, useEffect } from 'react'

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

        // Carregar ponto de hoje
        try {
          const hoje = new Date().toISOString().split('T')[0]
          const pontoResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros?data_inicio=${hoje}&data_fim=${hoje}&funcionario_id=${parsedUser.id}`,
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
              if (ponto.entrada) {
                const entrada = new Date(ponto.entrada)
                const saida = ponto.saida ? new Date(ponto.saida) : new Date()
                
                let diff = saida.getTime() - entrada.getTime()
                
                // Subtrair tempo de almoço se houver
                if (ponto.saida_almoco && ponto.volta_almoco) {
                  const saidaAlmoco = new Date(ponto.saida_almoco)
                  const voltaAlmoco = new Date(ponto.volta_almoco)
                  const tempoAlmoco = voltaAlmoco.getTime() - saidaAlmoco.getTime()
                  diff -= tempoAlmoco
                }
                
                const horas = Math.floor(diff / (1000 * 60 * 60))
                const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                
                setHorasTrabalhadas(`${horas}h ${minutos}min`)
              }
            }
          }
        } catch (pontoError) {
          console.error('Erro ao carregar ponto:', pontoError)
          // Não lançar erro, apenas continuar sem dados de ponto
        }

        // Carregar documentos pendentes
        try {
          const docsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/documentos/funcionario/${parsedUser.id}?status=pendente`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (docsResponse.ok) {
            const docsData = await docsResponse.json()
            setDocumentosPendentes(docsData.total || docsData.data?.length || 0)
          }
        } catch (docsError) {
          console.error('Erro ao carregar documentos:', docsError)
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

