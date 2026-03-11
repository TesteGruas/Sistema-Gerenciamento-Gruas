import webpush from 'web-push'

let configured = false

function ensureConfigured() {
  if (configured) return true

  const subject = process.env.WEB_PUSH_VAPID_SUBJECT
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY

  if (!subject || !publicKey || !privateKey) {
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export function isWebPushConfigured() {
  return ensureConfigured()
}

export function getWebPushPublicKey() {
  return process.env.WEB_PUSH_VAPID_PUBLIC_KEY || ''
}

export async function sendWebPush(subscription, payload) {
  if (!ensureConfigured()) {
    throw new Error('WEB_PUSH_NOT_CONFIGURED')
  }

  return webpush.sendNotification(subscription, JSON.stringify(payload))
}
