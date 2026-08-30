import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TicketsList from '../pages/TicketsList'

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

const mockApi = await import('../api/client')

function renderList() {
  return render(
    <MemoryRouter>
      <TicketsList />
    </MemoryRouter>,
  )
}

describe('TicketsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('mostra campo de busca e filtro de status', () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    renderList()
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument()
    expect(screen.getByText(/todos os status/i)).toBeInTheDocument()
  })

  it('lista chamados em tabela', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          user_name: 'Isabelle',
          equipment_name: 'Computador 02',
          sector: 'Informatica',
          description: 'Computador nao liga',
          status: 'em_andamento',
          priority: 'alta',
          technical_lead: 'Joao',
          date: '26/08/2026',
        },
      ],
    })
    renderList()

    await waitFor(() => {
      expect(screen.getByText('Isabelle')).toBeInTheDocument()
      expect(screen.getByText('Computador nao liga')).toBeInTheDocument()
      expect(screen.getByText('Joao')).toBeInTheDocument()
    })
  })

  it('filtra por status', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderList()

    await user.selectOptions(screen.getByRole('combobox'), 'aberto')

    expect(mockApi.api.get).toHaveBeenCalledWith('/chamados?status=aberto')
  })

  it('busca por termo', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderList()

    await user.type(screen.getByPlaceholderText(/buscar/i), 'mouse')

    await waitFor(() => {
      expect(mockApi.api.get).toHaveBeenCalledWith(
        expect.stringContaining('/chamados/busca?q=mouse'),
      )
    })
  })
})