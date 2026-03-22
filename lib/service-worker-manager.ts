/**
 * 🔧 Service Worker Manager
 * Gerencia registro, atualizações e sincronização do service worker
 */

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private onUpdateCallback: ((registration: ServiceWorkerRegistration) => void) | null = null;

  /**
   * Registrar o service worker
   */
  async register() {
    // Verificar suporte de forma mais robusta
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      // Silenciar aviso em ambientes onde não é suportado (SSR, navegadores antigos)
      if (typeof window !== 'undefined') {
        console.debug('Service Worker não é suportado neste navegador');
      }
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Configurar listeners
      this.setupListeners();

      // Verificar atualizações periodicamente (a cada 30 minutos)
      this.startUpdateChecks();

      // Verificar se há atualização imediatamente
      await this.checkForUpdates();

      return this.registration;
    } catch (error) {
      console.error('[SW Manager] Erro ao registrar service worker:', error);
      return null;
    }
  }

  /**
   * Configurar listeners do service worker
   */
  private setupListeners() {
    if (!this.registration) return;

    // Listener para novas instalações
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            
            // Notificar callback de atualização
            if (this.onUpdateCallback && this.registration) {
              this.onUpdateCallback(this.registration);
            }
          }
        });
      }
    });

    // Listener para mensagens do service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_APROVACOES') {
        this.handleSyncAprovacoes();
      } else if (event.data.type === 'SYNC_ASSINATURAS') {
        this.handleSyncAssinaturas();
      } else if (event.data.type === 'SYNC_PONTO') {
        this.handleSyncPonto();
      }
    });

    // Listener para quando o SW toma controle
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Service worker tomou controle
    });
  }

  /**
   * Verificar atualizações do service worker
   */
  async checkForUpdates() {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      console.error('[SW Manager] Erro ao verificar atualizações:', error);
    }
  }

  /**
   * Iniciar verificações periódicas de atualização
   */
  private startUpdateChecks() {
    // Verificar a cada 30 minutos
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30 * 60 * 1000);
  }

  /**
   * Parar verificações periódicas
   */
  stopUpdateChecks() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  /**
   * Ativar nova versão do service worker
   */
  async activateUpdate() {
    if (!this.registration || !this.registration.waiting) {
      console.warn('[SW Manager] Nenhuma atualização aguardando');
      return;
    }

    // Enviar mensagem para o SW pular espera
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Recarregar página quando o novo SW estiver ativo
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Callback para quando houver atualização disponível
   */
  onUpdate(callback: (registration: ServiceWorkerRegistration) => void) {
    this.onUpdateCallback = callback;

    // Se já existe atualização aguardando quando o callback é registrado,
    // notificar imediatamente para não perder a atualização.
    if (this.registration?.waiting) {
      callback(this.registration);
    }
  }

  /**
   * Registrar sincronização em background
   */
  async registerSync(tag: string) {
    if (!this.registration || !('sync' in this.registration)) {
      console.warn('[SW Manager] Background Sync não é suportado');
      return false;
    }

    try {
      await this.registration.sync.register(tag);
      return true;
    } catch (error) {
      console.error('[SW Manager] Erro ao registrar sincronização:', error);
      return false;
    }
  }

  /**
   * Enviar mensagem para o service worker
   */
  async sendMessage(message: any): Promise<any> {
    if (!navigator.serviceWorker.controller) {
      console.warn('[SW Manager] Nenhum service worker ativo');
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    });
  }

  /**
   * Obter versão do service worker
   */
  async getVersion(): Promise<string | null> {
    const response = await this.sendMessage({ type: 'GET_VERSION' });
    return response?.version || null;
  }

  /**
   * Limpar todos os caches
   */
  async clearCache(): Promise<boolean> {
    const response = await this.sendMessage({ type: 'CLEAR_CACHE' });
    return response?.success || false;
  }

  /**
   * Handlers de sincronização
   */
  private handleSyncAprovacoes() {
    // Disparar evento customizado para os componentes
    window.dispatchEvent(new CustomEvent('sw-sync-aprovacoes'));
    
    // Buscar fila do localStorage e sincronizar
    const fila = JSON.parse(localStorage.getItem('fila_aprovacoes') || '[]');
    // Os componentes devem ter listeners para este evento
  }

  private handleSyncAssinaturas() {
    window.dispatchEvent(new CustomEvent('sw-sync-assinaturas'));
    
    const fila = JSON.parse(localStorage.getItem('fila_assinaturas_documentos') || '[]');
  }

  private handleSyncPonto() {
    window.dispatchEvent(new CustomEvent('sw-sync-ponto'));
    
    const fila = JSON.parse(localStorage.getItem('fila_registros_ponto') || '[]');
  }

  /**
   * Registrar todas as sincronizações pendentes
   */
  async syncAll() {
    const tags = ['sync-aprovacoes', 'sync-assinaturas', 'sync-ponto'];
    
    for (const tag of tags) {
      await this.registerSync(tag);
    }
  }

  /**
   * Desregistrar o service worker (útil para debug)
   */
  async unregister() {
    if (!this.registration) return;

    try {
      await this.registration.unregister();
      this.stopUpdateChecks();
    } catch (error) {
      console.error('[SW Manager] Erro ao desregistrar service worker:', error);
    }
  }
}

// Singleton global
let swManager: ServiceWorkerManager | null = null;

/**
 * Obter instância do gerenciador de service worker
 */
export function getServiceWorkerManager(): ServiceWorkerManager {
  if (!swManager) {
    swManager = new ServiceWorkerManager();
  }
  return swManager;
}

/**
 * Inicializar service worker (chamar no load da página)
 */
export async function initServiceWorker() {
  if (typeof window === 'undefined') return null;

  // Next.js dev em localhost: SW antigo servia HTML/JS em cache → erros de módulo (jwt-decode, Turbopack).
  if (process.env.NODE_ENV === 'development') {
    const h = window.location.hostname;
    const isLocal = h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
    if (isLocal) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys.filter((k) => k.startsWith('irbana-pwa')).map((k) => caches.delete(k))
          );
        }
      } catch {
        /* ignore */
      }
      return null;
    }
  }

  const manager = getServiceWorkerManager();

  // Configurar atualização antes do registro para não perder eventos de updatefound.
  manager.onUpdate((_registration) => {
    // Em PWA, manter SW antigo após deploy pode deixar app preso em "Carregando..."
    // com chunks desatualizados. Ativamos a atualização automaticamente.
    manager.activateUpdate();
  });

  const registration = await manager.register();

  // Registrar sincronizações quando voltar online
  window.addEventListener('online', () => {
    manager.syncAll();
  });

  return registration;
}

