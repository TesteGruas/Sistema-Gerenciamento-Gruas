// Sistema de sincronização offline
interface PendingAction {
  id: string
  type: 'ponto' | 'documento' | 'outro'
  action: string
  data: any
  timestamp: number
  retries: number
}

export class OfflineSync {
  private static instance: OfflineSync
  private queue: PendingAction[] = []
  private readonly QUEUE_KEY = 'offline_sync_queue'
  private readonly MAX_RETRIES = 3
  private syncInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.loadQueue()
  }

  static getInstance(): OfflineSync {
    if (!OfflineSync.instance) {
      OfflineSync.instance = new OfflineSync()
    }
    return OfflineSync.instance
  }

  private loadQueue() {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY)
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Erro ao carregar fila de sincronização:', error)
      this.queue = []
    }
  }

  private saveQueue() {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue))
    } catch (error) {
      console.error('Erro ao salvar fila de sincronização:', error)
    }
  }

  addToQueue(type: 'ponto' | 'documento' | 'outro', action: string, data: any) {
    const pendingAction: PendingAction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      action,
      data,
      timestamp: Date.now(),
      retries: 0
    }

    this.queue.push(pendingAction)
    this.saveQueue()
    
    console.log(`[Offline] Ação adicionada à fila: ${action}`)
  }

  async processQueue(): Promise<{ success: number, failed: number }> {
    if (!navigator.onLine) {
      console.log('[Offline] Sem conexão, aguardando...')
      return { success: 0, failed: 0 }
    }

    let success = 0
    let failed = 0
    const remainingQueue: PendingAction[] = []

    for (const action of this.queue) {
      try {
        const result = await this.processAction(action)
        if (result) {
          success++
          console.log(`[Sync] Ação processada: ${action.action}`)
        } else {
          action.retries++
          if (action.retries < this.MAX_RETRIES) {
            remainingQueue.push(action)
          } else {
            failed++
            console.error(`[Sync] Ação falhou após ${this.MAX_RETRIES} tentativas:`, action.action)
          }
        }
      } catch (error) {
        console.error('[Sync] Erro ao processar ação:', error)
        action.retries++
        if (action.retries < this.MAX_RETRIES) {
          remainingQueue.push(action)
        } else {
          failed++
        }
      }
    }

    this.queue = remainingQueue
    this.saveQueue()

    return { success, failed }
  }

  private async processAction(action: PendingAction): Promise<boolean> {
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.error('[Sync] Token não encontrado')
      return false
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    try {
      const response = await fetch(`${baseUrl}${action.action}`, {
        method: action.data.method || 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(action.data.body)
      })

      return response.ok
    } catch (error) {
      console.error('[Sync] Erro na requisição:', error)
      return false
    }
  }

  startAutoSync(intervalMinutes: number = 5) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && this.queue.length > 0) {
        console.log('[Sync] Iniciando sincronização automática...')
        this.processQueue()
      }
    }, intervalMinutes * 60 * 1000)

    // Processar imediatamente se online
    if (navigator.onLine && this.queue.length > 0) {
      this.processQueue()
    }
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getQueue(): PendingAction[] {
    return [...this.queue]
  }

  clearQueue() {
    this.queue = []
    this.saveQueue()
  }

  // Métodos específicos para tipos de ação
  async syncPonto(funcionarioId: number, tipo: string, localizacao?: any) {
    const data = {
      method: 'POST',
      body: {
        funcionarioId,
        tipo,
        localizacao,
        timestamp: new Date().toISOString()
      }
    }

    if (navigator.onLine) {
      // Tenta enviar diretamente
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ponto`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data.body)
        })

        if (response.ok) {
          return { success: true, offline: false }
        }
      } catch (error) {
        console.error('[Sync] Erro ao enviar ponto:', error)
      }
    }

    // Se falhar ou estiver offline, adiciona à fila
    this.addToQueue('ponto', '/api/ponto', data)
    return { success: true, offline: true }
  }

  async syncDocumento(documentoId: number, assinatura: string) {
    const data = {
      method: 'PUT',
      body: {
        assinatura,
        dataAssinatura: new Date().toISOString()
      }
    }

    if (navigator.onLine) {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documentos/${documentoId}/assinar`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data.body)
        })

        if (response.ok) {
          return { success: true, offline: false }
        }
      } catch (error) {
        console.error('[Sync] Erro ao enviar assinatura:', error)
      }
    }

    this.addToQueue('documento', `/api/documentos/${documentoId}/assinar`, data)
    return { success: true, offline: true }
  }
}

// Instância singleton
export const offlineSync = OfflineSync.getInstance()

