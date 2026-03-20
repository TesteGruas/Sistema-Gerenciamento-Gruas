/**
 * Registra a subscription Web Push no backend após login, se o usuário já tiver
 * permitido notificações. Usado no dashboard e no PWA (chamadas idempotentes).
 */
export async function registerWebPushAfterAuth(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return
  }
  if (Notification.permission !== 'granted') return
  const token = localStorage.getItem('access_token')
  if (!token?.trim()) return

  try {
    await navigator.serviceWorker.ready
    const { ensurePushSubscription } = await import('@/lib/pwa-push-subscription')
    const result = await ensurePushSubscription()
    if (!result.success) {
      console.debug('[WebPush] Não registrado:', result.message)
    }
  } catch (e) {
    console.debug('[WebPush] Registro ignorado:', e)
  }
}
