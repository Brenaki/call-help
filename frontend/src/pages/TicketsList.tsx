import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Ticket } from '../api/types'

export default function TicketsList() {
  const [chamados, setChamados] = useState<Ticket[]>([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')

  async function carregar() {
    try {
      if (busca) {
        const r = await api.get<Ticket[]>(`/chamados/busca?q=${encodeURIComponent(busca)}`)
        setChamados(r.data)
      } else {
        const url = filtroStatus
          ? `/chamados?status=${filtroStatus}`
          : '/chamados'
        const r = await api.get<Ticket[]>(url)
        setChamados(r.data)
      }
    } catch {
      setErro('Erro ao carregar chamados')
    }
  }

  useEffect(() => {
    carregar()
  }, [filtroStatus, busca])

  function statusLabel(s: string) {
    return s === 'em_andamento' ? 'em andamento' : s
  }

  return (
    <div>
      <h1>Chamados</h1>
      {erro && <p className="erro">{erro}</p>}

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="resolvido">Resolvido</option>
        </select>
      </div>

      {chamados.length === 0 ? (
        <p>Nenhum chamado encontrado.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Equipamento</th>
              <th>Setor</th>
              <th>Problema</th>
              <th>Status</th>
              <th>Prioridade</th>
              <th>Tecnico</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {chamados.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.user_name}</td>
                <td>{c.equipment_name ?? '-'}</td>
                <td>{c.sector ?? '-'}</td>
                <td>{c.description}</td>
                <td>
                  <span className={`status-badge status-${c.status}`}>
                    {statusLabel(c.status)}
                  </span>
                </td>
                <td>{c.priority}</td>
                <td>{c.technical_lead ?? '-'}</td>
                <td>{c.date ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}