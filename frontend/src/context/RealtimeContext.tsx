import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { connectWs, type WsClient, type WsEvent, type WsStatus } from '../api/ws'
import { useAuth } from './AuthContext'

interface RealtimeContextType {
  status: WsStatus
  unreadCount: number
  setUnreadCount: (n: number) => void
  subscribe: (handler: (event: WsEvent) => void) => () => void
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [status, setStatus] = useState<WsStatus>('fechado')
  const [unreadCount, setUnreadCount] = useState(0)
  const handlersRef = useRef(new Set<(event: WsEvent) => void>())
  const clientRef = useRef<WsClient | null>(null)

  const subscribe = useCallback((handler: (event: WsEvent) => void) => {
    handlersRef.current.add(handler)
    return () => {
      handlersRef.current.delete(handler)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      clientRef.current?.close()
      clientRef.current = null
      setStatus('fechado')
      return
    }

    const client = connectWs(
      token,
      (event) => {
        handlersRef.current.forEach((handler) => handler(event))
        if (event.type === 'unread_count') {
          setUnreadCount(event.count as number)
        }
        if (event.type === 'auth_expired') {
          localStorage.removeItem('token')
          localStorage.removeItem('role')
          window.location.href = '/login'
        }
      },
      setStatus,
    )
    clientRef.current = client

    return () => {
      client.close()
      clientRef.current = null
    }
  }, [token])

  return (
    <RealtimeContext.Provider value={{ status, unreadCount, setUnreadCount, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime precisa estar dentro de RealtimeProvider')
  return ctx
}