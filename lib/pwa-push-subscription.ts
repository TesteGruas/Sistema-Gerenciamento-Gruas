import { getApiBasePath } from './runtime-config'

function base64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export async function ensurePushSubscription(): Promise<{ success: boolean; message: string }> {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Ambiente sem window' }
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { success: false, message: 'Navegador sem suporte a Push API' }
  }

  if (Notification.permission !== 'granted') {
    return { success: false, message: 'Permissão de notificação não concedida' }
  }

  const token = localStorage.getItem('access_token')
  if (!token) {
    return { success: false, message: 'Token não encontrado' }
  }

  const apiBase = getApiBasePath()

  const keyResponse = await fetch(`${apiBase}/push/public-key`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!keyResponse.ok) {
    return { success: false, message: 'Não foi possível obter chave pública do push' }
  }

  const keyPayload = await keyResponse.json()
  const publicKey = keyPayload?.data?.publicKey

  if (!publicKey) {
    return { success: false, message: 'Chave pública VAPID não configurada no backend' }
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(publicKey)
    })
  }

  const subscribeResponse = await fetch(`${apiBase}/push/subscribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ subscription })
  })

  if (!subscribeResponse.ok) {
    const errPayload = await subscribeResponse.json().catch(() => ({}))
    return {
      success: false,
      message: errPayload?.message || 'Falha ao registrar inscrição push no backend'
    }
  }

  return { success: true, message: 'Dispositivo inscrito para notificações push' }
}

export async function triggerApiPushBroadcast(input: {
  titulo: string
  mensagem: string
  tipo?: string
  link?: string
}): Promise<{ success: boolean; message: string; data?: any }> {
  const token = localStorage.getItem('access_token')
  if (!token) {
    return { success: false, message: 'Token não encontrado' }
  }

  const apiBase = getApiBasePath()
  const response = await fetch(`${apiBase}/push/broadcast`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    return {
      success: false,
      message: payload?.message || payload?.error || 'Falha ao disparar broadcast push'
    }
  }

  return {
    success: true,
    message: payload?.message || 'Broadcast executado',
    data: payload?.data
  }
}
