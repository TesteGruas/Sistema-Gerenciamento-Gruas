// Sistema de notificações PWA
export class PWANotifications {
  private static instance: PWANotifications
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {}

  static getInstance(): PWANotifications {
    if (!PWANotifications.instance) {
      PWANotifications.instance = new PWANotifications()
    }
    return PWANotifications.instance
  }

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.log('Notificações não suportadas neste navegador')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.ready
      return true
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error)
      return false
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    const permission = await this.requestPermission()
    
    if (permission !== 'granted') {
      console.log('Permissão de notificação negada')
      return
    }

    if (!this.registration) {
      await this.initialize()
    }

    if (this.registration) {
      const defaultOptions: NotificationOptions = {
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [200, 100, 200],
        ...options
      }

      await this.registration.showNotification(title, defaultOptions)
    }
  }

  async scheduleLunchReminder(): Promise<void> {
    const now = new Date()
    const lunch = new Date()
    lunch.setHours(12, 0, 0, 0)

    if (now < lunch) {
      const timeout = lunch.getTime() - now.getTime()
      setTimeout(() => {
        this.showNotification('Horário de Almoço', {
          body: 'Não esqueça de registrar sua saída para o almoço!',
          tag: 'lunch-reminder',
          data: { url: '/pwa/ponto' },
          actions: [
            { action: 'open', title: 'Registrar Ponto' },
            { action: 'close', title: 'Fechar' }
          ]
        })
      }, timeout)
    }
  }

  async scheduleEndOfDayReminder(): Promise<void> {
    const now = new Date()
    const endOfDay = new Date()
    endOfDay.setHours(18, 0, 0, 0)

    if (now < endOfDay) {
      const timeout = endOfDay.getTime() - now.getTime()
      setTimeout(() => {
        this.showNotification('Fim do Expediente', {
          body: 'Lembre-se de registrar sua saída!',
          tag: 'end-of-day-reminder',
          data: { url: '/pwa/ponto' },
          actions: [
            { action: 'open', title: 'Registrar Ponto' },
            { action: 'close', title: 'Fechar' }
          ]
        })
      }, timeout)
    }
  }

  async checkDocumentsPending(): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const userData = localStorage.getItem('user_data')
      if (!userData) return

      const user = JSON.parse(userData)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/documentos/funcionario/${user.id}?status=pendente`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const total = data.total || data.data?.length || 0

        if (total > 0) {
          this.showNotification('Documentos Pendentes', {
            body: `Você tem ${total} documento(s) aguardando assinatura`,
            tag: 'documents-pending',
            data: { url: '/pwa/documentos' },
            actions: [
              { action: 'open', title: 'Ver Documentos' },
              { action: 'close', title: 'Depois' }
            ]
          })
        }
      }
    } catch (error) {
      console.error('Erro ao verificar documentos:', error)
    }
  }

  async notifyPontoRegistered(tipo: string): Promise<void> {
    const tipoTexto = {
      'entrada': 'Entrada',
      'saida_almoco': 'Saída para Almoço',
      'volta_almoco': 'Retorno do Almoço',
      'saida': 'Saída'
    }[tipo] || tipo

    await this.showNotification('Ponto Registrado', {
      body: `${tipoTexto} registrado com sucesso às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      tag: 'ponto-registered',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png'
    })
  }

  async notifyDocumentSigned(documentName: string): Promise<void> {
    await this.showNotification('Documento Assinado', {
      body: `O documento "${documentName}" foi assinado com sucesso`,
      tag: 'document-signed',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png'
    })
  }

  async scheduleAllReminders(): Promise<void> {
    const permission = await this.requestPermission()
    
    if (permission === 'granted') {
      await this.scheduleLunchReminder()
      await this.scheduleEndOfDayReminder()
      
      // Verificar documentos pendentes a cada 4 horas
      setInterval(() => {
        this.checkDocumentsPending()
      }, 4 * 60 * 60 * 1000)
      
      // Verificar imediatamente
      setTimeout(() => {
        this.checkDocumentsPending()
      }, 5000)
    }
  }

  getPermission(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied'
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
  }
}

// Instância singleton
export const pwaNotifications = PWANotifications.getInstance()

