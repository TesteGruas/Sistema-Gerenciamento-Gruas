/**
 * Sistema de Persistência de Sessão para PWA
 * Implementa múltiplas estratégias para manter o usuário logado
 */

export interface SessionData {
  email: string
  token: string
  refreshToken?: string
  userData: any
  lastLogin: number
  biometricEnabled?: boolean
}

export interface BiometricCredentials {
  email: string
  publicKey: string
  credentialId: string
}

class SessionPersistenceManager {
  private static instance: SessionPersistenceManager
  private readonly STORAGE_KEYS = {
    SESSION: 'pwa_session_data',
    BIOMETRIC: 'pwa_biometric_credentials',
    REMEMBER_EMAIL: 'pwa_remember_email',
    LAST_ACTIVITY: 'pwa_last_activity'
  }

  private constructor() {}

  static getInstance(): SessionPersistenceManager {
    if (!SessionPersistenceManager.instance) {
      SessionPersistenceManager.instance = new SessionPersistenceManager()
    }
    return SessionPersistenceManager.instance
  }

  /**
   * Salvar dados da sessão com múltiplas estratégias
   */
  async saveSession(sessionData: SessionData): Promise<void> {
    try {
      // 1. LocalStorage (padrão)
      localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(sessionData))
      
      // 2. SessionStorage (backup)
      sessionStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(sessionData))
      
      // 3. IndexedDB (persistente) - apenas se disponível
      if (typeof window !== 'undefined' && window.indexedDB) {
        await this.saveToIndexedDB(sessionData)
      } else {
        console.warn('[SessionPersistence] IndexedDB não disponível, pulando salvamento')
      }
      
      // 4. Salvar email para "lembrar usuário"
      if (sessionData.email) {
        localStorage.setItem(this.STORAGE_KEYS.REMEMBER_EMAIL, sessionData.email)
      }
      
      // 5. Atualizar última atividade
      this.updateLastActivity()
      
      console.log('[SessionPersistence] Sessão salva com sucesso')
    } catch (error) {
      console.error('[SessionPersistence] Erro ao salvar sessão:', error)
    }
  }

  /**
   * Recuperar dados da sessão
   */
  async getSession(): Promise<SessionData | null> {
    try {
      // 1. Tentar LocalStorage primeiro
      const localData = localStorage.getItem(this.STORAGE_KEYS.SESSION)
      if (localData) {
        const session = JSON.parse(localData)
        if (this.isSessionValid(session)) {
          return session
        }
      }
      
      // 2. Tentar SessionStorage
      const sessionData = sessionStorage.getItem(this.STORAGE_KEYS.SESSION)
      if (sessionData) {
        const session = JSON.parse(sessionData)
        if (this.isSessionValid(session)) {
          return session
        }
      }
      
      // 3. Tentar IndexedDB - apenas se disponível
      if (typeof window !== 'undefined' && window.indexedDB) {
        const indexedData = await this.getFromIndexedDB()
        if (indexedData && this.isSessionValid(indexedData)) {
          return indexedData
        }
      }
      
      return null
    } catch (error) {
      console.error('[SessionPersistence] Erro ao recuperar sessão:', error)
      return null
    }
  }

  /**
   * Limpar dados da sessão
   */
  async clearSession(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.SESSION)
      sessionStorage.removeItem(this.STORAGE_KEYS.SESSION)
      localStorage.removeItem(this.STORAGE_KEYS.LAST_ACTIVITY)
      
      // Limpar IndexedDB - apenas se disponível
      if (typeof window !== 'undefined' && window.indexedDB) {
        await this.clearIndexedDB()
      }
      
      console.log('[SessionPersistence] Sessão limpa com sucesso')
    } catch (error) {
      console.error('[SessionPersistence] Erro ao limpar sessão:', error)
    }
  }

  /**
   * Verificar se a sessão ainda é válida
   */
  private isSessionValid(session: SessionData): boolean {
    if (!session || !session.token) return false
    
    // Verificar se não passou muito tempo desde o último login
    const maxIdleTime = 24 * 60 * 60 * 1000 // 24 horas
    const timeSinceLogin = Date.now() - (session.lastLogin || 0)
    
    return timeSinceLogin < maxIdleTime
  }

  /**
   * Salvar no IndexedDB
   */
  private async saveToIndexedDB(sessionData: SessionData): Promise<void> {
    return new Promise((resolve) => {
      // Verificar se IndexedDB está disponível
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('[SessionPersistence] IndexedDB não disponível')
        resolve()
        return
      }

      const request = indexedDB.open('PWASessionDB', 1)
      
      request.onerror = () => {
        console.warn('[SessionPersistence] Erro ao abrir IndexedDB para salvar:', request.error)
        resolve() // Não falhar se IndexedDB não funcionar
      }
      
      request.onsuccess = () => {
        try {
          const db = request.result
          
          // Verificar se o object store existe
          if (!db.objectStoreNames.contains('sessions')) {
            console.warn('[SessionPersistence] Object store "sessions" não existe, pulando salvamento')
            resolve()
            return
          }
          
          const transaction = db.transaction(['sessions'], 'readwrite')
          const store = transaction.objectStore('sessions')
          
          store.put(sessionData, 'current_session')
          transaction.oncomplete = () => {
            console.log('[SessionPersistence] Dados salvos no IndexedDB')
            resolve()
          }
          transaction.onerror = () => {
            console.warn('[SessionPersistence] Erro na transação:', transaction.error)
            resolve() // Não falhar se não conseguir salvar
          }
        } catch (error) {
          console.warn('[SessionPersistence] Erro ao salvar no IndexedDB:', error)
          resolve() // Não falhar se IndexedDB não funcionar
        }
      }
      
      request.onupgradeneeded = () => {
        try {
          const db = request.result
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions')
            console.log('[SessionPersistence] Object store "sessions" criado')
          }
        } catch (error) {
          console.warn('[SessionPersistence] Erro ao criar object store:', error)
        }
      }
    })
  }

  /**
   * Recuperar do IndexedDB
   */
  private async getFromIndexedDB(): Promise<SessionData | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PWASessionDB', 1)
      
      request.onerror = () => {
        console.warn('[SessionPersistence] Erro ao abrir IndexedDB:', request.error)
        resolve(null)
      }
      
      request.onsuccess = () => {
        try {
          const db = request.result
          
          // Verificar se o object store existe
          if (!db.objectStoreNames.contains('sessions')) {
            console.warn('[SessionPersistence] Object store "sessions" não existe')
            resolve(null)
            return
          }
          
          const transaction = db.transaction(['sessions'], 'readonly')
          const store = transaction.objectStore('sessions')
          const getRequest = store.get('current_session')
          
          getRequest.onsuccess = () => resolve(getRequest.result || null)
          getRequest.onerror = () => {
            console.warn('[SessionPersistence] Erro ao recuperar dados do IndexedDB:', getRequest.error)
            resolve(null)
          }
        } catch (error) {
          console.warn('[SessionPersistence] Erro ao acessar IndexedDB:', error)
          resolve(null)
        }
      }
    })
  }

  /**
   * Limpar IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PWASessionDB', 1)
      
      request.onerror = () => {
        console.warn('[SessionPersistence] Erro ao abrir IndexedDB para limpar:', request.error)
        resolve() // Não falhar se IndexedDB não funcionar
      }
      
      request.onsuccess = () => {
        try {
          const db = request.result
          
          // Verificar se o object store existe
          if (!db.objectStoreNames.contains('sessions')) {
            console.warn('[SessionPersistence] Object store "sessions" não existe para limpar')
            resolve()
            return
          }
          
          const transaction = db.transaction(['sessions'], 'readwrite')
          const store = transaction.objectStore('sessions')
          
          store.clear()
          transaction.oncomplete = () => resolve()
          transaction.onerror = () => {
            console.warn('[SessionPersistence] Erro ao limpar IndexedDB:', transaction.error)
            resolve() // Não falhar se não conseguir limpar
          }
        } catch (error) {
          console.warn('[SessionPersistence] Erro ao limpar IndexedDB:', error)
          resolve() // Não falhar se IndexedDB não funcionar
        }
      }
    })
  }

  /**
   * Atualizar última atividade
   */
  private updateLastActivity(): void {
    localStorage.setItem(this.STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString())
  }

  /**
   * Verificar se o usuário estava ativo recentemente
   */
  isRecentlyActive(): boolean {
    const lastActivity = localStorage.getItem(this.STORAGE_KEYS.LAST_ACTIVITY)
    if (!lastActivity) return false
    
    const timeSinceActivity = Date.now() - parseInt(lastActivity)
    const maxIdleTime = 2 * 60 * 60 * 1000 // 2 horas
    
    return timeSinceActivity < maxIdleTime
  }

  /**
   * Salvar email para "lembrar usuário"
   */
  saveRememberedEmail(email: string): void {
    localStorage.setItem(this.STORAGE_KEYS.REMEMBER_EMAIL, email)
  }

  /**
   * Recuperar email salvo
   */
  getRememberedEmail(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.REMEMBER_EMAIL)
  }

  /**
   * Limpar email salvo
   */
  clearRememberedEmail(): void {
    localStorage.removeItem(this.STORAGE_KEYS.REMEMBER_EMAIL)
  }

  /**
   * Configurar autenticação biométrica
   */
  async setupBiometricAuth(email: string): Promise<boolean> {
    try {
      // Verificar se o navegador suporta WebAuthn
      if (!window.PublicKeyCredential) {
        console.warn('[SessionPersistence] WebAuthn não suportado')
        return false
      }

      // Criar credencial biométrica
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "Sistema de Gruas PWA",
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(email),
            name: email,
            displayName: email
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      }) as PublicKeyCredential

      if (credential) {
        const biometricData: BiometricCredentials = {
          email,
          publicKey: Array.from(new Uint8Array(credential.rawId)).join(','),
          credentialId: credential.id
        }
        
        localStorage.setItem(this.STORAGE_KEYS.BIOMETRIC, JSON.stringify(biometricData))
        return true
      }
      
      return false
    } catch (error) {
      console.error('[SessionPersistence] Erro ao configurar autenticação biométrica:', error)
      return false
    }
  }

  /**
   * Autenticar com biometria
   */
  async authenticateWithBiometric(): Promise<SessionData | null> {
    try {
      const biometricData = localStorage.getItem(this.STORAGE_KEYS.BIOMETRIC)
      if (!biometricData) return null

      const { email, credentialId } = JSON.parse(biometricData)
      
      // Tentar autenticação biométrica
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            type: "public-key",
            id: new Uint8Array(credentialId.split(',').map(Number)),
            transports: ["internal"]
          }],
          userVerification: "required",
          timeout: 60000
        }
      }) as PublicKeyCredential

      if (assertion) {
        // Recuperar sessão salva para este email
        const session = await this.getSession()
        if (session && session.email === email) {
          return session
        }
      }
      
      return null
    } catch (error) {
      console.error('[SessionPersistence] Erro na autenticação biométrica:', error)
      return null
    }
  }

  /**
   * Verificar se biometria está configurada
   */
  isBiometricConfigured(): boolean {
    return localStorage.getItem(this.STORAGE_KEYS.BIOMETRIC) !== null
  }

  /**
   * Remover configuração biométrica
   */
  clearBiometricAuth(): void {
    localStorage.removeItem(this.STORAGE_KEYS.BIOMETRIC)
  }
}

export const sessionPersistence = SessionPersistenceManager.getInstance()
