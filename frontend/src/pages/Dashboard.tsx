import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Ticket } from '../api/types'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import TicketTable from '../components/TicketTable'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { role, token } = useAuth()
  const isAdmin = role === 'admin'
  const [chamados, setChamados] = useState<Ticket[]>([])
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!token) return
    api.get<Ticket[]>('/chamados')
      .then((r) => { if (active) setChamados(r.data) })
      .catch(() => { if (active) setErro('Erro ao carregar chamados. Tente atualizar a página.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const stats = useMemo(() => [
    { title: 'Abertos', status: 'aberto', icon: 'ticket', description: 'Aguardando atendimento', className: 'aberto' },
    { title: 'Em andamento', status: 'em_andamento', icon: 'clock', description: 'Sendo atendidos', className: 'andamento' },
    { title: 'Aguardando cliente', status: 'aguardando_cliente', icon: 'chat', description: 'Pendentes com o solicitante', className: 'aguardando' },
    { title: 'Resolvidos', status: 'resolvido', icon: 'check', description: 'Aguardando confirmação', className: 'resolvido' },
    { title: 'Fechados', status: 'fechado', icon: 'check', description: 'Concluídos', className: 'fechado' },
  ] as const, [])

  const aguardandoVoce = useMemo(() => {
    if (isAdmin) return chamados.filter((c) => c.status === 'em_andamento')
    return chamados.filter((c) => c.status === 'aguardando_cliente' || c.status === 'resolvido')
  }, [chamados, isAdmin])

  return (
    <div>
      <PageHeader title="Visão geral" description="Acompanhe os chamados e mantenha sua instituição em funcionamento." action={<Link to="/chamados/novo" className="btn-primario"><Icon name="plus" />Abrir chamado</Link>} />
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="cards cards-cinco" aria-busy={loading}>{stats.map((stat) => (
        <Link to={`/chamados?status=${stat.status}`} className={`card ${stat.className}`} key={stat.status}>
          <div className="card-heading"><h3>{stat.title}</h3><span className="stat-icon"><Icon name={stat.icon} /></span></div>
          <div className="numero">{loading || erro ? '—' : chamados.filter((c) => c.status === stat.status).length}</div>
          <div className="card-bottom"><span>{stat.description}</span><Icon name="arrow" size={17} /></div>
        </Link>
      ))}</div>
      <div className="dashboard-grid">
        <section className="panel recent-tickets">
          <header className="panel-header">
            <div><h2>{isAdmin ? 'Aguardando a TI' : 'Aguardando você'}</h2><p>{isAdmin ? 'Chamados em andamento.' : 'Confirme as soluções ou responda a TI.'}</p></div>
            <Link to="/chamados" className="text-link">Ver todos <Icon name="arrow" size={16} /></Link>
          </header>
          {loading ? <p className="empty-state" role="status">Carregando chamados...</p> : !erro && (aguardandoVoce.length === 0 ? <div className="empty-state"><span className="empty-icon"><Icon name="check" size={28} /></span><h3>Nada pendente.</h3><p>{isAdmin ? 'Nenhum chamado em andamento neste momento.' : 'Nenhum chamado aguardando sua ação.'}</p></div> : <TicketTable tickets={aguardandoVoce.slice(0, 5)} compact />)}
        </section>
        <aside className="panel support-guide"><span className="guide-icon"><Icon name="headset" size={25} /></span><h2>Como podemos ajudar?</h2><p>Registre o problema para que a equipe de TI possa atender.</p><ul><li><Icon name="monitor" /><div><strong>Equipamentos</strong><span>Computadores, impressoras e projetores.</span></div></li><li><Icon name="network" /><div><strong>Internet e rede</strong><span>Wi-Fi, conexão e acesso à rede.</span></div></li><li><Icon name="dashboard" /><div><strong>Sistemas e acessos</strong><span>Programas, e-mail e contas institucionais.</span></div></li></ul><Link to="/chamados/novo" className="btn-secundario">Solicitar suporte <Icon name="arrow" size={17} /></Link></aside>
      </div>
    </div>
  )
}