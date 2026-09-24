import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Ticket } from '../api/types'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import TicketTable from '../components/TicketTable'
import { useAuth } from '../context/AuthContext'

const STATUS_VALIDOS = ['aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado']

export default function TicketsList() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const [params, setParams] = useSearchParams()
  const requestedStatus = params.get('status') || ''
  const filtroStatus = STATUS_VALIDOS.includes(requestedStatus) ? requestedStatus : ''
  const scope = params.get('scope') || 'todos'
  const busca = params.get('q') || ''
  const requestKey = `${filtroStatus}:${busca}:${scope}`
  const [result, setResult] = useState<{ key: string; tickets: Ticket[]; error: string } | null>(null)
  const loading = result?.key !== requestKey
  const erro = loading ? '' : result?.error
  const chamados = loading ? [] : (result?.tickets || [])

  useEffect(() => {
    let active = true
    const partes: string[] = []
    if (busca) partes.push(`q=${encodeURIComponent(busca)}`)
    if (filtroStatus) partes.push(`status=${filtroStatus}`)
    if (isAdmin && scope === 'meus') partes.push('scope=meus')
    const url = partes.length ? `/chamados?${partes.join('&')}` : '/chamados'
    api.get<Ticket[]>(url)
      .then((r) => { if (active) setResult({ key: requestKey, tickets: r.data, error: '' }) })
      .catch(() => { if (active) setResult({ key: requestKey, tickets: [], error: 'Erro ao carregar chamados. Tente novamente em instantes.' }) })
    return () => { active = false }
  }, [filtroStatus, busca, scope, isAdmin, requestKey])

  function updateFilter(key: string, value: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value && !(key === 'scope' && value === 'todos')) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  return (
    <div>
      <PageHeader title="Chamados" description="Consulte as solicitações de TI, acompanhe o andamento e participe da conversa." action={<Link to="/chamados/novo" className="btn-primario"><Icon name="plus" />Abrir chamado</Link>} />
      <section className="panel">
        <div className="filtros">
          <label className="search-field"><Icon name="search" /><input aria-label="Buscar chamados" type="search" placeholder="Buscar por problema, solicitante ou equipamento..." value={busca} onChange={(e) => updateFilter('q', e.target.value)} /></label>
          <select aria-label="Filtrar por status" value={filtroStatus} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="em_andamento">Em andamento</option>
            <option value="aguardando_cliente">Aguardando cliente</option>
            <option value="resolvido">Resolvido</option>
            <option value="fechado">Fechado</option>
          </select>
          {isAdmin && (
            <select aria-label="Escopo dos chamados" value={scope} onChange={(e) => updateFilter('scope', e.target.value)}>
              <option value="todos">Todos os chamados</option>
              <option value="meus">Meus chamados</option>
            </select>
          )}
          {(busca || filtroStatus || scope !== 'todos') && <button className="text-link" onClick={() => setParams({})}>Limpar filtros</button>}
        </div>
        {erro ? <p className="erro panel-message" role="alert">{erro}</p> : loading ? <p className="empty-state" role="status">Carregando chamados...</p> : chamados.length === 0 ? <div className="empty-state"><span className="empty-icon"><Icon name="search" size={28} /></span><h2>Nenhum chamado encontrado.</h2><p>{busca || filtroStatus ? 'Experimente outro termo ou limpe os filtros.' : 'As solicitações da sua instituição aparecerão aqui.'}</p></div> : <><TicketTable tickets={chamados} /><div className="table-footer">{chamados.length} {chamados.length === 1 ? 'chamado encontrado' : 'chamados encontrados'}</div></>}
      </section>
    </div>
  )
}