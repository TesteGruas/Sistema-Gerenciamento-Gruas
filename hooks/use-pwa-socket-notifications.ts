"use client"

import { useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { getWebSocketUrl } from "@/lib/runtime-config"

/** Disparado quando a API envia notificação via Socket.IO (lista + badge no PWA). */
export const PWA_NOTIFICACOES_API_EVENT = "pwa-api-notificacoes-atualizar"

interface NovaNotificacaoPayload {
  id?: string
  titulo?: string
  mensagem?: string
  link?: string
}

/**
 * Mantém Socket.IO no PWA (layout autenticado) para atualizar lista/contagem em tempo quase real.
 * O dashboard usa `useWebSocketNotifications`; o PWA não montava socket antes.
 */
export function usePWASocketNotifications(userId: number | undefined) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || userId == null) return

    const token = localStorage.getItem("access_token")
    if (!token) return

    const url = getWebSocketUrl()
    if (!url) return

    const socket = io(url, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 8,
    })

    const refresh = () => {
      window.dispatchEvent(new CustomEvent(PWA_NOTIFICACOES_API_EVENT))
    }

    socket.on("nova-notificacao", (notificacao: NovaNotificacaoPayload) => {
      refresh()
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(notificacao?.titulo || "Nova notificação", {
            body: notificacao?.mensagem || "",
            icon: "/icon-192x192.png",
            badge: "/icon-72x72.png",
            tag: notificacao?.id ? `notificacao-${notificacao.id}` : "pwa-notif",
            data: { url: notificacao?.link || "/pwa/notificacoes" },
          })
        } catch {
          /* iOS / PWA pode restringir Notification() fora do SW */
        }
      }
    })

    socket.on("notificacao-atualizada", refresh)
    socket.on("todas-marcadas-lidas", refresh)

    socketRef.current = socket
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId])
}
