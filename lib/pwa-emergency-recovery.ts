"use client"

let recoveryInProgress = false

const LOGIN_PATH = "/pwa/login?recovery=1"

/**
 * Limpa dados locais do PWA para evitar app travada por cache corrompido.
 * Executa em best-effort: qualquer erro é logado e o fluxo segue.
 */
export async function clearPwaClientData(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    localStorage.clear()
  } catch (error) {
    console.warn("[PWA][Recovery] Falha ao limpar localStorage:", error)
  }

  try {
    sessionStorage.clear()
  } catch (error) {
    console.warn("[PWA][Recovery] Falha ao limpar sessionStorage:", error)
  }

  try {
    if ("caches" in window) {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((key) => caches.delete(key)))
    }
  } catch (error) {
    console.warn("[PWA][Recovery] Falha ao limpar CacheStorage:", error)
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }
  } catch (error) {
    console.warn("[PWA][Recovery] Falha ao desregistrar service workers:", error)
  }

  try {
    const indexedDbAny = indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string }>>
    }
    if (typeof indexedDbAny.databases === "function") {
      const databases = await indexedDbAny.databases()
      for (const db of databases) {
        if (db?.name) {
          indexedDB.deleteDatabase(db.name)
        }
      }
    }
  } catch (error) {
    console.warn("[PWA][Recovery] Falha ao limpar IndexedDB:", error)
  }
}

/**
 * Recuperação forçada: desloga, limpa caches/storage e vai para login.
 */
export async function forcePwaRecoveryLogout(reason: string): Promise<void> {
  if (typeof window === "undefined") return
  if (recoveryInProgress) return

  recoveryInProgress = true
  console.error("[PWA][Recovery] Recuperação forçada iniciada:", reason)

  try {
    await clearPwaClientData()
  } catch (error) {
    console.error("[PWA][Recovery] Erro durante limpeza de dados:", error)
  } finally {
    if (!window.location.pathname.startsWith("/pwa/login")) {
      window.location.replace(LOGIN_PATH)
    } else {
      recoveryInProgress = false
    }

    setTimeout(() => {
      recoveryInProgress = false
    }, 3000)
  }
}

