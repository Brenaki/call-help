export type WsEvent = {
  type: string
  [key: string]: unknown
}

export type WsStatus = 'conectando' | 'conectado' | 'reconectando' | 'fechado'

type Handler = (event: WsEvent) => void

export interface WsClient {
  close: () => void
  status: () => WsStatus
}

export const WS_RECONNECT_MS = 10_000

/**
 * Conecta ao WebSocket do backend. Se a conexão cair, tenta
 * reconectar a cada 10 segundos. Retorna o cliente com controle.
 */
export function connectWs(
  token: string | null,
  onEvent: Handler,
  onStatusChange: (status: WsStatus) => void,
  options: { factory?: (url: string) => WebSocket; url?: string; reconnectMs?: number } = {},
): WsClient {
  if (!token) {
    onStatusChange('fechado')
    return { close: () => {}, status: () => 'fechado' }
  }

  const base = options.url ?? wsUrlFromHttp(import.meta.env.VITE_API_URL ?? 'http://localhost:8000')
  const factory = options.factory ?? ((url: string) => new WebSocket(url))
  const reconnectMs = options.reconnectMs ?? WS_RECONNECT_MS

  let socket: WebSocket | null = null
  let closedByUser = false
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let currentStatus: WsStatus = 'conectando'

  function setStatus(next: WsStatus) {
    currentStatus = next
    onStatusChange(next)
  }

  function scheduleReconnect() {
    if (closedByUser || reconnectTimer) return
    setStatus('reconectando')
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      open()
    }, reconnectMs)
  }

  function open() {
    setStatus('conectando')
    socket = factory(`${base}/ws?token=${encodeURIComponent(String(token))}`)

    socket.onopen = () => setStatus('conectado')

    socket.onmessage = (message) => {
      try {
        onEvent(JSON.parse(message.data) as WsEvent)
      } catch {
        // ignora mensagens inválidas
      }
    }

    socket.onclose = (event) => {
      socket = null
      if (closedByUser) {
        setStatus('fechado')
        return
      }
      // 4401 = auth expirada: não reconecta com token ruim
      if (event.code === 4401) {
        setStatus('fechado')
        onEvent({ type: 'auth_expired' })
        return
      }
      scheduleReconnect()
    }

    socket.onerror = () => {
      socket?.close()
    }
  }

  open()

  return {
    close() {
      closedByUser = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      socket?.close()
      setStatus('fechado')
    },
    status: () => currentStatus,
  }
}

/** Deriva a URL do WS a partir da base HTTP do axios. */
export function wsUrlFromHttp(httpBase: string): string {
  if (httpBase.startsWith('https')) return `wss://${httpBase.slice('https://'.length).replace(/\/$/, '')}`
  if (httpBase.startsWith('http')) return `ws://${httpBase.slice('http://'.length).replace(/\/$/, '')}`
  // base relativa (ex.: "/api" atrás do nginx): usa a origem atual
  if (httpBase.startsWith('/')) {
    const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocolo}//${window.location.host}${httpBase.replace(/\/$/, '').replace(/\/ws$/, '')}`
  }
  return httpBase
}