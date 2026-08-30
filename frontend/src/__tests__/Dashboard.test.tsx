import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

const mockApi = await import('../api/client')

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('mostra os 3 cards de status', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Abertos')).toBeInTheDocument()
      expect(screen.getByText('Em Andamento')).toBeInTheDocument()
      expect(screen.getByText('Resolvidos')).toBeInTheDocument()
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

  it('mostra tabela de chamados recentes', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({
      data: [
        { id: 1, status: 'aberto', user_name: 'Isabelle', description: 'Computador nao liga', priority: 'alta' },
      ],
    })
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Isabelle')).toBeInTheDocument()
      expect(screen.getByText('Computador nao liga')).toBeInTheDocument()
    })
  })
})