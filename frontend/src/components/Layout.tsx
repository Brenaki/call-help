import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { role, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const link = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link ativo' : 'nav-link'

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Call Help</h2>
        <nav>
          <NavLink to="/" className={link} end>Dashboard</NavLink>
          <NavLink to="/chamados" className={link}>Chamados</NavLink>
          <NavLink to="/chamados/novo" className={link}>Abrir Chamado</NavLink>
          {role === 'admin' && (
            <>
              <NavLink to="/equipamentos" className={link}>Equipamentos</NavLink>
              <NavLink to="/usuarios" className={link}>Usuarios</NavLink>
            </>
          )}
        </nav>
        <button onClick={handleLogout} className="btn-sair">Sair</button>
      </aside>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  )
}