import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import Brand from './Brand'
import Icon from './Icon'
import Notifications from './Notifications'

const titles: Record<string, string> = { '/': 'Visão geral', '/chamados': 'Chamados', '/chamados/novo': 'Abrir chamado', '/equipamentos': 'Equipamentos', '/salas': 'Salas', '/usuarios': 'Usuários' }

export default function Layout() {
  const { role, logout } = useAuth()
  const { status } = useRealtime()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const link = ({ isActive }: { isActive: boolean }) => isActive ? 'nav-link ativo' : 'nav-link'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const wsLabel = status === 'conectado' ? 'Conectado' : status === 'reconectando' ? 'Reconectando...' : status === 'conectando' ? 'Conectando...' : 'Offline'

  return (
    <div className="layout">
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><Brand /><button className="icon-button mobile-only" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><Icon name="close" /></button></div>
        <nav id="main-navigation" aria-label="Navegação principal" onClick={() => setMenuOpen(false)}>
          <span className="nav-label">ATENDIMENTO</span>
          <NavLink to="/" className={link} end><Icon name="dashboard" />Visão geral</NavLink>
          <NavLink to="/chamados" className={link} end><Icon name="ticket" />Chamados</NavLink>
          <NavLink to="/chamados/novo" className={link}><Icon name="plus" />Abrir chamado</NavLink>
          {role === 'admin' && <><span className="nav-label">ADMINISTRAÇÃO</span><NavLink to="/equipamentos" className={link}><Icon name="monitor" />Equipamentos</NavLink><NavLink to="/salas" className={link}><Icon name="building" />Salas</NavLink><NavLink to="/usuarios" className={link}><Icon name="users" />Usuários</NavLink></>}
        </nav>
        <div className="sidebar-note"><Icon name="headset" size={24} /><strong>Tecnologia que apoia.</strong><p>Suporte para o dia a dia de escolas e empresas.</p></div>
        <div className="sidebar-account"><span className="avatar"><Icon name="users" /></span><div><strong>{role === 'admin' ? 'Administrador' : 'Solicitante'}</strong><small>Portal de suporte</small></div><button onClick={handleLogout} className="icon-button" aria-label="Sair" title="Sair"><Icon name="logout" /></button></div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button className="icon-button mobile-only" aria-label="Abrir menu" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /></button>
            <span>Central de suporte</span><span className="breadcrumb-divider">/</span><strong>{titles[pathname] || (pathname.startsWith('/chamados/') ? 'Chamado' : 'Call Help')}</strong>
          </div>
          <div className="topbar-actions">
            <span className={`ws-status ws-${status}`} role="status" aria-label={`Tempo real: ${wsLabel}`}>
              <span className="ws-dot" aria-hidden="true" />{wsLabel}
            </span>
            <Notifications />
          </div>
        </header>
        <main id="conteudo" className="conteudo" tabIndex={-1}><Outlet /></main>
        <footer className="app-footer"><span>Call Help · Central de suporte de TI</span><span>Conectando pessoas e soluções.</span></footer>
      </div>
    </div>
  )
}
