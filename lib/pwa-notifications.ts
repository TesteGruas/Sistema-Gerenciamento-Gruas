// Sistema de notificações PWA
import { getApiOrigin } from "./runtime-config"
import { getFuncionarioId } from "./get-funcionario-id"

export class PWANotifications {
  private static instance: PWANotifications
  private registration: ServiceWorkerRegistration | null = null
  private reminderTimeouts: Record<string, number> = {}
  private documentsIntervalId: number | null = null
  private remindersStarted = false

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

    const defaultOptions: NotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      vibrate: [200, 100, 200],
      ...options
    }

    if (this.registration) {
      await this.registration.showNotification(title, defaultOptions)
      return
    }

    // Fallback para navegadores sem service worker pronto
    new Notification(title, defaultOptions)
  }

  private getDailyStorageKey(tag: string): string {
    const today = new Date().toISOString().slice(0, 10)
    return `pwa_notif_${tag}_${today}`
  }

  private alreadyTriggeredToday(tag: string): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(this.getDailyStorageKey(tag)) === '1'
  }

  private markTriggeredToday(tag: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.getDailyStorageKey(tag), '1')
  }

  private scheduleDailyNotification(
    key: string,
    hour: number,
    minute: number,
    callback: () => Promise<void>
  ): void {
    if (typeof window === 'undefined') return

    if (this.reminderTimeouts[key]) {
      clearTimeout(this.reminderTimeouts[key])
    }

    const now = new Date()
    const next = new Date()
    next.setHours(hour, minute, 0, 0)

    if (now >= next) {
      next.setDate(next.getDate() + 1)
    }

    const timeoutMs = next.getTime() - now.getTime()

    this.reminderTimeouts[key] = window.setTimeout(async () => {
      try {
        await callback()
      } finally {
        this.scheduleDailyNotification(key, hour, minute, callback)
      }
    }, timeoutMs)
  }

  async notifyLunchReminder(force = false): Promise<void> {
    const tag = 'lunch-reminder-1130'
    if (!force && this.alreadyTriggeredToday(tag)) return

    await this.showNotification('Horário de Almoço', {
      body: 'São 11:30! Não esqueça de registrar sua saída para o almoço.',
      tag,
      data: { url: '/pwa/ponto' },
      actions: [
        { action: 'open', title: 'Registrar Ponto' },
        { action: 'close', title: 'Fechar' }
      ]
    })

    if (!force) {
      this.markTriggeredToday(tag)
    }
  }

  async scheduleLunchReminder(): Promise<void> {
    if (this.getPermission() !== 'granted') return
    this.scheduleDailyNotification('lunch-reminder-1130', 11, 30, async () => {
      await this.notifyLunchReminder()
    })
  }

  async notifyEndOfDayReminder(force = false): Promise<void> {
    const tag = 'end-of-day-reminder-1800'
    if (!force && this.alreadyTriggeredToday(tag)) return

    await this.showNotification('Fim do Expediente', {
      body: 'Lembre-se de registrar sua saída!',
      tag,
      data: { url: '/pwa/ponto' },
      actions: [
        { action: 'open', title: 'Registrar Ponto' },
        { action: 'close', title: 'Fechar' }
      ]
    })

    if (!force) {
      this.markTriggeredToday(tag)
    }
  }

  async scheduleEndOfDayReminder(): Promise<void> {
    if (this.getPermission() !== 'granted') return
    this.scheduleDailyNotification('end-of-day-reminder-1800', 18, 0, async () => {
      await this.notifyEndOfDayReminder()
    })
  }

  async startBackgroundReminders(): Promise<void> {
    if (this.remindersStarted) return
    if (this.getPermission() !== 'granted') return

    await this.initialize()
    await this.scheduleLunchReminder()
    await this.scheduleEndOfDayReminder()

    if (this.documentsIntervalId) {
      clearInterval(this.documentsIntervalId)
    }

    this.documentsIntervalId = window.setInterval(() => {
      this.checkDocumentsPending()
    }, 4 * 60 * 60 * 1000)

    setTimeout(() => {
      this.checkDocumentsPending()
    }, 5000)

    this.remindersStarted = true
  }

  async checkDocumentsPending(): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const userData = localStorage.getItem('user_data')
      if (!userData) return

      const user = JSON.parse(userData)
      let funcionarioId = Number(
        user?.profile?.funcionario_id ||
        user?.funcionario_id ||
        user?.user_metadata?.funcionario_id ||
        0
      )

      if (!funcionarioId || Number.isNaN(funcionarioId) || funcionarioId <= 0) {
        const resolvedId = await getFuncionarioId(user, token)
        funcionarioId = Number(resolvedId || 0)
      }

      if (!funcionarioId || Number.isNaN(funcionarioId) || funcionarioId <= 0) {
        return
      }

      const response = await fetch(
        `${getApiOrigin()}/api/funcionarios/documentos/funcionario/${funcionarioId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const documentos = Array.isArray(data?.data) ? data.data : []
        const possuiCampoStatus = documentos.some((doc: any) => doc && typeof doc.status !== 'undefined')
        const totalPendentes = possuiCampoStatus
          ? documentos.filter((doc: any) => String(doc?.status || '').toLowerCase() === 'pendente').length
          : documentos.length

        if (totalPendentes > 0) {
          this.showNotification('Documentos Pendentes', {
            body: `Você tem ${totalPendentes} documento(s) aguardando assinatura`,
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
    await this.startBackgroundReminders()
  }

  async sendDebugTypeNotification(tipo: string): Promise<void> {
    const config: Record<string, { title: string; body: string }> = {
      info: { title: 'Info', body: 'Notificação informativa de teste.' },
      warning: { title: 'Aviso', body: 'Notificação de aviso de teste.' },
      error: { title: 'Erro', body: 'Notificação de erro de teste.' },
      success: { title: 'Sucesso', body: 'Notificação de sucesso de teste.' },
      grua: { title: 'Grua', body: 'Notificação de grua de teste.' },
      obra: { title: 'Obra', body: 'Notificação de obra de teste.' },
      financeiro: { title: 'Financeiro', body: 'Notificação financeira de teste.' },
      rh: { title: 'RH', body: 'Notificação de RH de teste.' },
      estoque: { title: 'Estoque', body: 'Notificação de estoque de teste.' }
    }

    const item = config[tipo] || config.info
    await this.showNotification(`[DEBUG] ${item.title}`, {
      body: item.body,
      // Tag única para não suprimir alertas repetidos
      tag: `debug-${tipo}-${Date.now()}`,
      requireInteraction: true,
      renotify: true,
      data: { url: '/pwa/notificacoes' }
    })
  }

  async sendAllDebugNotifications(): Promise<void> {
    const tipos = ['info', 'warning', 'error', 'success', 'grua', 'obra', 'financeiro', 'rh', 'estoque']
    for (const tipo of tipos) {
      await this.sendDebugTypeNotification(tipo)
    }
  }

  getPermission(): NotificationPermission {
    if (typeof window === 'undefined') return 'denied'
    return 'Notification' in window ? Notification.permission : 'denied'
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'Notification' in window && 'serviceWorker' in navigator
  }
}

// Instância singleton
export const pwaNotifications = PWANotifications.getInstance()

