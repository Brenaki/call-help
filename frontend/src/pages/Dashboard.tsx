import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Ticket } from '../api/types'

export default function Dashboard() {
  const [chamados, setChamados] = useState<Ticket[]>([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get<Ticket[]>('/chamados')
      .then((r) => setChamados(r.data))
      .catch(() => setErro('Erro ao carregar chamados'))
  }, [])

  const abertos = chamados.filter((c) => c.status === 'aberto').length
  const andamento = chamados.filter((c) => c.status === 'em_andamento').length
  const resolvidos = chamados.filter((c) => c.status === 'resolvido').length

  return (
    <div>
      <h1>Dashboard</h1>
      {erro && <p className="erro">{erro}</p>}
      <div className="cards">
        <div className="card aberto">
          <h3>Abertos</h3>
          <div className="numero">{abertos}</div>
        </div>
        <div className="card andamento">
          <h3>Em Andamento</h3>
          <div className="numero">{andamento}</div>
        </div>
        <div className="card resolvido">
          <h3>Resolvidos</h3>
          <div className="numero">{resolvidos}</div>
        </div>
      </div>

      <h2>Chamados Recentes</h2>
      {chamados.length === 0 ? (
        <p>Nenhum chamado ainda.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Problema</th>
              <th>Status</th>
              <th>Prioridade</th>
            </tr>
          </thead>
          <tbody>
            {chamados.slice(0, 10).map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.user_name}</td>
                <td>{c.description}</td>
                <td>
                  <span className={`status-badge status-${c.status}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{c.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}