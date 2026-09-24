import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { NotificationItem } from '../api/types'
import Icon from './Icon'
import { useRealtime } from '../context/RealtimeContext'

export default function Notifications() {
  const { unreadCount, setUnreadCount, subscribe } = useRealtime()
  const [aberto, setAberto] = useState(false)
  const [itens, setItens] = useState<NotificationItem[]>([])
  const [carregado, setCarregado] = useState(false)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  async function carregar() {
    try {
      const [lista, contador] = await Promise.all([
        api.get<NotificationItem[]>('/notificacoes'),
        api.get<{ count: number }>('/notificacoes/nao-lidas'),
      ])
      setItens(lista.data)
      setUnreadCount(contador.data.count)
      setCarregado(true)
    } catch {
      /* silencioso */
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // nova notificação via WS entra no topo da lista
  useEffect(() => {
    return subscribe((event) => {
      if (event.type === 'notification') {
        const notification = event.notification as NotificationItem
        setItens((atuais) => [notification, ...atuais].slice(0, 50))
      }
    })
  }, [subscribe])

  // fecha ao clicar fora
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function marcarTodas() {
    await api.put('/notificacoes/ler-todas')
    setItens((atuais) => atuais.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function abrir(notification: NotificationItem) {
    if (!notification.is_read) {
      await api.put(`/notificacoes/${notification.id}/ler`)
      setUnreadCount(Math.max(0, unreadCount - 1))
    }
    setAberto(false)
    if (notification.ticket_id) navigate(`/chamados/${notification.ticket_id}`)
  }

  return (
    <div className="notifications" ref={ref}>
      <button
        className="icon-button"
        aria-label={`Notificações${unreadCount ? ` (${unreadCount} não lidas)` : ''}`}
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {aberto && (
        <div className="notification-dropdown" role="dialog" aria-label="Notificações">
          <header>
            <strong>Notificações</strong>
            {unreadCount > 0 && <button className="text-link" onClick={marcarTodas}>Marcar todas como lidas</button>}
          </header>
          {!carregado ? (
            <p className="notification-empty">Carregando...</p>
          ) : itens.length === 0 ? (
            <p className="notification-empty">Você está em dia. Nada por aqui.</p>
          ) : (
            <ul>
              {itens.map((n) => (
                <li key={n.id}>
                  <button
                    className={`notification-item ${n.is_read ? '' : 'nao-lida'}`}
                    onClick={() => abrir(n)}
                  >
                    <span className="notification-icon"><Icon name={n.type === 'comment' ? 'chat' : 'ticket'} size={16} /></span>
                    <span>
                      <span className="notification-message">{n.message}</span>
                      <small>{n.created_at ? new Date(n.created_at).toLocaleString('pt-BR') : ''}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}