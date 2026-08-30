import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewTicket from './pages/NewTicket'
import TicketsList from './pages/TicketsList'
import Equipments from './pages/Equipments'
import Users from './pages/Users'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/chamados" element={<TicketsList />} />
            <Route path="/chamados/novo" element={<NewTicket />} />
            <Route path="/equipamentos" element={<Equipments />} />
            <Route path="/usuarios" element={<Users />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}