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

  let sub = subscription
  if (typeof sub === 'string') {
    try {
      sub = JSON.parse(sub)
    } catch {
      throw new Error('WEB_PUSH_INVALID_SUBSCRIPTION_JSON')
    }
  }

  return webpush.sendNotification(sub, JSON.stringify(payload))
}
