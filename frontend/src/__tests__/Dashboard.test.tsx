import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import { AuthProvider } from '../context/AuthContext'

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

const mockApi = await import('../api/client')

function renderDashboard(role = 'comum') {
  localStorage.setItem('token', 'tok')
  localStorage.setItem('role', role)
  return render(
    <AuthProvider>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('mostra os 5 cards de status', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Abertos')).toBeInTheDocument()
      expect(screen.getByText('Em andamento')).toBeInTheDocument()
      expect(screen.getByText('Aguardando cliente')).toBeInTheDocument()
      expect(screen.getByText('Resolvidos')).toBeInTheDocument()
      expect(screen.getByText('Fechados')).toBeInTheDocument()
    })
  })

  it('conta os chamados por status', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({
      data: [
        { id: 1, status: 'aberto', user_name: 'Ana', description: 'p1', priority: 'alta' },
        { id: 2, status: 'aberto', user_name: 'Bruno', description: 'p2', priority: 'media' },
        { id: 3, status: 'em_andamento', user_name: 'Carlos', description: 'p3', priority: 'baixa' },
        { id: 4, status: 'resolvido', user_name: 'Diego', description: 'p4', priority: 'alta' },
      ],
    })
    renderDashboard()

    await waitFor(() => {
      const numeros = screen.getAllByText(/^2$/)
      expect(numeros.length).toBeGreaterThanOrEqual(1)
      const uns = screen.getAllByText(/^1$/)
      expect(uns.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('mostra chamados aguardando o solicitante (comum)', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({
      data: [
        { id: 1, status: 'resolvido', user_name: 'Isabelle', description: 'Computador nao liga', priority: 'alta' },
        { id: 2, status: 'aberto', user_name: 'Bruno', description: 'Mouse quebrado', priority: 'media' },
      ],
    })
    renderDashboard('comum')

    await waitFor(() => {
      expect(screen.getByText('Aguardando você')).toBeInTheDocument()
      expect(screen.getByText('Computador nao liga')).toBeInTheDocument()
      expect(screen.queryByText('Mouse quebrado')).not.toBeInTheDocument()
    })
  })
})