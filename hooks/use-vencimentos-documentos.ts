"use client"

import { useEffect, useRef } from "react"
import { colaboradoresDocumentosApi, CertificadoBackend, DocumentoAdmissionalBackend } from "@/lib/api-colaboradores-documentos"
import { NotificacoesAPI } from "@/lib/api-notificacoes"
import { getFuncionarioId, UserData } from "@/lib/get-funcionario-id"

interface DocumentoVencendo {
  id: string
  tipo: 'certificado' | 'documento_admissional'
  nome: string
  data_validade: string
  dias_para_vencer: number
  vencido: boolean
}

/**
 * Hook para verificar vencimentos de documentos (certificados e documentos admissionais)
 * e criar notificações quando necessário
 */

// Constante única para a chave do localStorage - DEVE SER EXATAMENTE A MESMA na página de notificações
// Exportada para garantir que a mesma chave seja usada em todos os lugares
export const STORAGE_KEY_NOTIFICACOES_LOCAIS = 'notificacoes_vencimentos_locais'

export function useVencimentosDocumentos() {
  const verificandoRef = useRef(false)
  const ultimaVerificacaoRef = useRef<number>(0)
  const tokenRef = useRef<string | null>(null)

  useEffect(() => {
    // Não executar no servidor
    if (typeof window === 'undefined') {
      return
    }

    // Verificar vencimentos a cada 6 horas (21600000 ms)
    const INTERVALO_VERIFICACAO = 6 * 60 * 60 * 1000
    
    // Verificar se o token mudou (usuário fez login)
    const verificarTokenMudou = () => {
      const tokenAtual = localStorage.getItem('access_token')
      if (tokenAtual && tokenAtual !== tokenRef.current) {
        tokenRef.current = tokenAtual
        ultimaVerificacaoRef.current = 0 // Resetar para permitir verificação imediata
      }
      return tokenAtual
    }
    
    const verificarVencimentos = async () => {
      // Verificar se o token mudou
      const tokenAtual = verificarTokenMudou()
      
      // Evitar múltiplas verificações simultâneas
      if (verificandoRef.current) {
        return
      }
      
      // Verificar se já foi verificado recentemente (menos de 2 minutos para debug)
      const agora = Date.now()
      const TEMPO_MINIMO_ENTRE_VERIFICACOES = 2 * 60 * 1000 // 2 minutos para debug
      const tempoDesdeUltimaVerificacao = agora - ultimaVerificacaoRef.current
      
      // Se o token mudou, permitir verificação imediata mesmo se foi verificado recentemente
      const tokenMudou = tokenAtual && tokenAtual !== tokenRef.current
      if (!tokenMudou && tempoDesdeUltimaVerificacao < TEMPO_MINIMO_ENTRE_VERIFICACOES) {
        return
      }
      
      if (tokenMudou) {
        tokenRef.current = tokenAtual
      }

      verificandoRef.current = true
      ultimaVerificacaoRef.current = agora

      try {
        // Obter dados do usuário
        if (typeof window === 'undefined') {
          verificandoRef.current = false
          return
        }

        const userDataStr = localStorage.getItem('user_data')
        const token = localStorage.getItem('access_token')

        if (!userDataStr || !token) {
          verificandoRef.current = false
          return
        }

        const user: UserData = JSON.parse(userDataStr)

        // Obter funcionario_id
        const funcionarioId = await getFuncionarioId(user, token)
        
        if (!funcionarioId) {
          verificandoRef.current = false
          return
        }

        // Buscar certificados e documentos admissionais
        const [certificadosResponse, documentosResponse] = await Promise.all([
          colaboradoresDocumentosApi.certificados.listar(funcionarioId).catch(() => ({ success: false, data: [] })),
          colaboradoresDocumentosApi.documentosAdmissionais.listar(funcionarioId).catch(() => ({ success: false, data: [] }))
        ])

        const certificados: CertificadoBackend[] = certificadosResponse.success ? certificadosResponse.data : []
        const documentos: DocumentoAdmissionalBackend[] = documentosResponse.success ? documentosResponse.data : []

        // Verificar vencimentos
        const documentosVencendo: DocumentoVencendo[] = []

        // Verificar certificados
        certificados.forEach((certificado) => {
          if (!certificado.data_validade) {
            return
          }

          const dataValidade = new Date(certificado.data_validade)
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)
          dataValidade.setHours(0, 0, 0, 0)

          // Verificar se a data é válida
          if (isNaN(dataValidade.getTime())) {
            return
          }

          const diasParaVencer = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          const vencido = diasParaVencer < 0

          // Notificar se vencido ou se vence em até 30 dias
          if (vencido || (diasParaVencer >= 0 && diasParaVencer <= 30)) {
            documentosVencendo.push({
              id: certificado.id,
              tipo: 'certificado',
              nome: certificado.nome || certificado.tipo,
              data_validade: certificado.data_validade,
              dias_para_vencer: diasParaVencer,
              vencido
            })
          }
        })

        // Verificar documentos admissionais
        documentos.forEach((documento) => {
          if (!documento.data_validade) {
            return
          }

          const dataValidade = new Date(documento.data_validade)
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)
          dataValidade.setHours(0, 0, 0, 0)

          // Verificar se a data é válida
          if (isNaN(dataValidade.getTime())) {
            return
          }

          const diasParaVencer = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          const vencido = diasParaVencer < 0

          // Notificar se vencido ou se vence em até 30 dias
          if (vencido || (diasParaVencer >= 0 && diasParaVencer <= 30)) {
            documentosVencendo.push({
              id: documento.id,
              tipo: 'documento_admissional',
              nome: documento.tipo,
              data_validade: documento.data_validade,
              dias_para_vencer: diasParaVencer,
              vencido
            })
          }
        })

        // Criar notificações para documentos que ainda não foram notificados hoje
        const hojeStr = new Date().toDateString()
        const notificacoesHojeKey = `notificacoes_vencimentos_${hojeStr}`
        const notificacoesHoje: string[] = JSON.parse(
          localStorage.getItem(notificacoesHojeKey) || '[]'
        )

        let notificacoesCriadas = 0
        for (const doc of documentosVencendo) {
          const notificacaoKey = `${doc.tipo}_${doc.id}`
          
          // Se já foi notificado hoje, verificar se foi realmente criada (não apenas tentada)
          if (notificacoesHoje.includes(notificacaoKey)) {
            // Verificar se a notificação realmente existe na API
            try {
              const notificacoesResponse = await NotificacoesAPI.listar({ limit: 100 })
              const notificacaoExiste = notificacoesResponse.data?.some((n: any) => 
                n.titulo?.includes(doc.nome) || n.mensagem?.includes(doc.nome)
              )
              
              if (notificacaoExiste) {
                continue
              } else {
                // Se não existe na API, remover do cache para tentar criar novamente
                const index = notificacoesHoje.indexOf(notificacaoKey)
                if (index > -1) {
                  notificacoesHoje.splice(index, 1)
                }
              }
            } catch (err) {
              // Se não conseguir verificar, tentar criar de qualquer forma
              const index = notificacoesHoje.indexOf(notificacaoKey)
              if (index > -1) {
                notificacoesHoje.splice(index, 1)
              }
            }
          }

          // Criar notificação
          const titulo = doc.vencido
            ? `⚠️ Documento vencido: ${doc.nome}`
            : `⏰ Documento vencendo: ${doc.nome}`

          const mensagem = doc.vencido
            ? `O ${doc.tipo === 'certificado' ? 'certificado' : 'documento admissional'} "${doc.nome}" está vencido desde ${Math.abs(doc.dias_para_vencer)} ${Math.abs(doc.dias_para_vencer) === 1 ? 'dia' : 'dias'}.`
            : `O ${doc.tipo === 'certificado' ? 'certificado' : 'documento admissional'} "${doc.nome}" vence em ${doc.dias_para_vencer} ${doc.dias_para_vencer === 1 ? 'dia' : 'dias'}.`

          // Verificar se já sabemos que a API retorna 403 (cache de falhas)
          const cacheFalhasKey = 'notificacoes_api_falha_403'
          const apiFalha403 = localStorage.getItem(cacheFalhasKey) === 'true'
          
          if (!apiFalha403) {
            // Tentar criar na API primeiro
            try {
              // Obter dados do usuário para criar notificação para ele mesmo
              const userDataStr = localStorage.getItem('user_data')
              const user: UserData = userDataStr ? JSON.parse(userDataStr) : null
              
              // Tentar obter funcionario_id novamente para garantir que temos o ID correto
              const token = localStorage.getItem('access_token')
              let funcionarioIdParaNotificacao: number | null = funcionarioId
              
              if (!funcionarioIdParaNotificacao && user && token) {
                try {
                  const novoId = await getFuncionarioId(user, token)
                  funcionarioIdParaNotificacao = novoId
                } catch (err) {
                  // Silenciar erro
                  funcionarioIdParaNotificacao = null
                }
              }
              
              // Criar notificação com destinatário específico (o próprio funcionário)
              const notificacaoData: any = {
                titulo,
                mensagem,
                tipo: 'warning',
                link: `/pwa/perfil?tab=${doc.tipo === 'certificado' ? 'certificados' : 'documentos-admissionais'}`
              }
              
              // Se temos o funcionario_id, especificar como destinatário
              if (funcionarioIdParaNotificacao) {
                notificacaoData.destinatarios = [{
                  tipo: 'funcionario',
                  id: String(funcionarioIdParaNotificacao)
                }]
              }
              
              const notificacao = await NotificacoesAPI.criar(notificacaoData)

              notificacoesCriadas++

              // Marcar como notificado hoje APENAS se foi criada com sucesso
              notificacoesHoje.push(notificacaoKey)
              
              // Se chegou aqui, a API funcionou, remover flag de falha
              localStorage.removeItem(cacheFalhasKey)
              continue // Pular para próximo documento
            } catch (error: any) {
              // Verificar diferentes formas de acessar o status do erro
              const statusCode = error?.response?.status || error?.status || (error?.message?.includes('403') ? 403 : null)
              
              // Se for 403, marcar no cache e ir para fallback local
              if (statusCode === 403 || statusCode === 401) {
                // Marcar que a API retorna 403 para não tentar novamente
                localStorage.setItem(cacheFalhasKey, 'true')
              }
            }
          }
          
          // Fallback local (executa se apiFalha403 ou se deu erro 403)
          try {
            
            // Salvar notificação localmente como fallback
            const notificacaoLocal = {
              id: `local_${doc.id}_${Date.now()}`,
              titulo,
              mensagem,
              tipo: 'warning',
              link: `/pwa/perfil?tab=${doc.tipo === 'certificado' ? 'certificados' : 'documentos-admissionais'}`,
              data: new Date().toISOString(),
              lida: false,
              local: true // Marcar como notificação local
            }
            
            // Salvar no localStorage para exibição posterior
            // IMPORTANTE: usar a constante definida no topo do arquivo
            let notificacoesLocais: any[] = []
            
            try {
              const locaisStr = localStorage.getItem(STORAGE_KEY_NOTIFICACOES_LOCAIS)
              if (locaisStr) {
                const parsed = JSON.parse(locaisStr)
                // Garantir que sempre seja um array
                notificacoesLocais = Array.isArray(parsed) ? parsed : []
              }
            } catch (parseError) {
              notificacoesLocais = []
            }
            
            // Verificar se já existe uma notificação local para este documento hoje
            const existeLocal = notificacoesLocais.some((n: any) => 
              n && typeof n === 'object' &&
              n.titulo === titulo && 
              n.data && 
              new Date(n.data).toDateString() === new Date().toDateString()
            )
            
            if (!existeLocal) {
              // Garantir que é um array antes de fazer push
              if (!Array.isArray(notificacoesLocais)) {
                notificacoesLocais = []
              }
              
              notificacoesLocais.push(notificacaoLocal)
              
              try {
                // Sempre salvar como array
                const arrayParaSalvar = Array.isArray(notificacoesLocais) ? notificacoesLocais : [notificacaoLocal]
                localStorage.setItem(STORAGE_KEY_NOTIFICACOES_LOCAIS, JSON.stringify(arrayParaSalvar))
                notificacoesCriadas++
                
                // Disparar evento customizado para notificar a página de notificações
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('notificacoes-locais-atualizadas', {
                    detail: { total: arrayParaSalvar.length }
                  }))
                }
              } catch (storageError) {
                // Silenciar erro
              }
            }
            
            // NÃO marcar como notificado no cache se falhou na API
            // Isso permite tentar criar novamente na próxima verificação (mas só se a API voltar a funcionar)
          } catch (fallbackError) {
            // Silenciar erros no fallback
          }
        }

        // Salvar lista de notificações de hoje
        localStorage.setItem(notificacoesHojeKey, JSON.stringify(notificacoesHoje))
        
        // Disparar evento customizado final após todas as notificações serem processadas
        if (typeof window !== 'undefined' && notificacoesCriadas > 0) {
          try {
            const locaisStr = localStorage.getItem(STORAGE_KEY_NOTIFICACOES_LOCAIS)
            const locais = locaisStr ? JSON.parse(locaisStr) : []
            const total = Array.isArray(locais) ? locais.length : 0
            window.dispatchEvent(new CustomEvent('notificacoes-locais-atualizadas', {
              detail: { total }
            }))
          } catch (err) {
            // Silenciar erro
          }
        }

        // Limpar notificações antigas (mais de 7 dias)
        // IMPORTANTE: NÃO remover a chave de notificações locais (STORAGE_KEY_NOTIFICACOES_LOCAIS)
        try {
          const chaves = Object.keys(localStorage)
          chaves.forEach((chave) => {
            // Pular a chave de notificações locais - ela não deve ser removida aqui
            if (chave === STORAGE_KEY_NOTIFICACOES_LOCAIS) {
              return
            }
            
            if (chave.startsWith('notificacoes_vencimentos_')) {
              const dataStr = chave.replace('notificacoes_vencimentos_', '')
              const data = new Date(dataStr)
              
              // Verificar se a data é válida
              if (isNaN(data.getTime())) {
                // Se a data não for válida, remover a chave (mas não a de notificações locais)
                localStorage.removeItem(chave)
                return
              }
              
              const diasAtras = Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24))
              
              if (diasAtras > 7) {
                localStorage.removeItem(chave)
              }
            }
          })
        } catch (cleanupError) {
          console.error('Erro ao limpar notificações antigas:', cleanupError)
        }

      } catch (error) {
        // Silenciar erros
      } finally {
        verificandoRef.current = false
      }
    }

    // Função para verificar token e executar se necessário
    const verificarEExecutar = () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        // Resetar última verificação para forçar execução imediata
        ultimaVerificacaoRef.current = 0
        verificarVencimentos()
      }
    }

    // Verificar imediatamente após um pequeno delay
    const timeoutId = setTimeout(() => {
      verificarEExecutar()
    }, 2000) // 2 segundos após o componente montar

    // Monitorar mudanças no localStorage (token/login) - funciona entre tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' && e.newValue) {
        setTimeout(() => verificarEExecutar(), 1000) // Pequeno delay para garantir que dados estão salvos
      }
    }

    // Monitorar mudanças no localStorage
    window.addEventListener('storage', handleStorageChange)

    // Verificar periodicamente se o token apareceu (para detectar login no mesmo tab)
    const checkInterval = setInterval(() => {
      const token = localStorage.getItem('access_token')
      if (token && token !== tokenRef.current) {
        tokenRef.current = token
        verificarEExecutar()
      }
    }, 3000) // Verificar a cada 3 segundos

    // Verificar periodicamente (intervalo longo)
    const intervalId = setInterval(() => {
      const token = localStorage.getItem('access_token')
      if (token) {
        verificarVencimentos()
      }
    }, INTERVALO_VERIFICACAO)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
      clearInterval(checkInterval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
}

