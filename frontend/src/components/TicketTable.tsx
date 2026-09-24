import { useNavigate } from 'react-router-dom'
import type { Ticket } from '../api/types'

const statuses: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  aguardando_cliente: 'Aguardando cliente',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
}
const priorities: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

export default function TicketTable({ tickets, compact = false }: { tickets: Ticket[]; compact?: boolean }) {
  const navigate = useNavigate()

  return (
    <div className="table-scroll" role="region" aria-label={compact ? 'Chamados recentes' : 'Lista de chamados'} tabIndex={0}>
      <table className="tabela">
        <thead><tr><th>Chamado / problema</th><th>Solicitante</th><th>Local / setor</th><th>Status</th><th>Prioridade</th>{!compact && <th>Data</th>}</tr></thead>
        <tbody>{tickets.map((ticket) => (
          <tr
            key={ticket.id}
            className="ticket-row"
            tabIndex={0}
            aria-label={`Abrir chamado ${ticket.description}`}
            onClick={() => navigate(`/chamados/${ticket.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/chamados/${ticket.id}`)}
          >
            <td className="ticket-description"><span className="ticket-id">#{String(ticket.id).padStart(4, '0')}</span><strong>{ticket.description}</strong><small>{ticket.equipment_name || ticket.problem_type || 'Suporte de TI'}</small></td>
            <td>{ticket.user_name}</td>
            <td><span>{ticket.localization || 'Não informado'}</span><small>{ticket.sector || 'Sem setor'}</small></td>
            <td><span className={`status-badge status-${ticket.status}`}>{statuses[ticket.status] || ticket.status}</span></td>
            <td><span className={`priority priority-${ticket.priority}`}>{priorities[ticket.priority] || ticket.priority}</span></td>
            {!compact && <td className="date-cell">{ticket.date || '—'}</td>}
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}