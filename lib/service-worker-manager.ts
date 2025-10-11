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
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker não é suportado neste navegador');
      return null;
    }

    try {
      console.log('[SW Manager] Registrando service worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW Manager] Service worker registrado:', this.registration);

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
        console.log('[SW Manager] Nova versão do service worker detectada');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW Manager] Nova versão instalada');
            
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
      console.log('[SW Manager] Mensagem do SW:', event.data);
      
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
      console.log('[SW Manager] Service worker tomou controle');
    });
  }

  /**
   * Verificar atualizações do service worker
   */
  async checkForUpdates() {
    if (!this.registration) return;

    try {
      console.log('[SW Manager] Verificando atualizações...');
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

    console.log('[SW Manager] Ativando nova versão...');
    
    // Enviar mensagem para o SW pular espera
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Recarregar página quando o novo SW estiver ativo
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Manager] Recarregando página para nova versão...');
      window.location.reload();
    });
  }

  /**
   * Callback para quando houver atualização disponível
   */
  onUpdate(callback: (registration: ServiceWorkerRegistration) => void) {
    this.onUpdateCallback = callback;
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
      console.log('[SW Manager] Sincronização registrada:', tag);
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
    console.log('[SW Manager] Sincronizando aprovações...');
    
    // Disparar evento customizado para os componentes
    window.dispatchEvent(new CustomEvent('sw-sync-aprovacoes'));
    
    // Buscar fila do localStorage e sincronizar
    const fila = JSON.parse(localStorage.getItem('fila_aprovacoes') || '[]');
    if (fila.length > 0) {
      // Os componentes devem ter listeners para este evento
      console.log(`[SW Manager] ${fila.length} aprovações na fila`);
    }
  }

  private handleSyncAssinaturas() {
    console.log('[SW Manager] Sincronizando assinaturas...');
    window.dispatchEvent(new CustomEvent('sw-sync-assinaturas'));
    
    const fila = JSON.parse(localStorage.getItem('fila_assinaturas_documentos') || '[]');
    if (fila.length > 0) {
      console.log(`[SW Manager] ${fila.length} assinaturas na fila`);
    }
  }

  private handleSyncPonto() {
    console.log('[SW Manager] Sincronizando registros de ponto...');
    window.dispatchEvent(new CustomEvent('sw-sync-ponto'));
    
    const fila = JSON.parse(localStorage.getItem('fila_registros_ponto') || '[]');
    if (fila.length > 0) {
      console.log(`[SW Manager] ${fila.length} registros na fila`);
    }
  }

  /**
   * Registrar todas as sincronizações pendentes
   */
  async syncAll() {
    console.log('[SW Manager] Registrando todas as sincronizações...');
    
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
      console.log('[SW Manager] Service worker desregistrado');
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

  const manager = getServiceWorkerManager();
  const registration = await manager.register();

  // Configurar notificação de atualização
  manager.onUpdate((reg) => {
    console.log('[SW Manager] Nova versão disponível!');
    
    // Você pode mostrar um toast ou modal aqui
    const shouldUpdate = confirm(
      'Uma nova versão do aplicativo está disponível. Deseja atualizar agora?'
    );
    
    if (shouldUpdate) {
      manager.activateUpdate();
    }
  });

  // Registrar sincronizações quando voltar online
  window.addEventListener('online', () => {
    console.log('[SW Manager] Conexão restaurada, iniciando sincronização...');
    manager.syncAll();
  });

  return registration;
}

