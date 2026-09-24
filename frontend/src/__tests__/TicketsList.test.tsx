import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TicketsList from '../pages/TicketsList'
import { AuthProvider } from '../context/AuthContext'

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

const mockApi = await import('../api/client')

function renderList(role = 'comum', initialEntries: string[] = ['/chamados']) {
  localStorage.setItem('token', 'tok')
  localStorage.setItem('role', role)
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <TicketsList />
      </MemoryRouter>
    </AuthProvider>,
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
    expect(screen.getByLabelText(/filtrar por status/i)).toBeInTheDocument()
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
          date: '26/08/2026',
        },
      ],
    })
    renderList()

    await waitFor(() => {
      expect(screen.getByText('Isabelle')).toBeInTheDocument()
      expect(screen.getByText('Computador nao liga')).toBeInTheDocument()
      expect(screen.getByText('Em andamento', { selector: '.status-badge' })).toBeInTheDocument()
    })
  })

  it('filtra por status', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderList()

    await user.selectOptions(screen.getByLabelText(/filtrar por status/i), 'aberto')

    expect(mockApi.api.get).toHaveBeenCalledWith('/chamados?status=aberto')
  })

  it('busca por termo', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderList()

    await user.type(screen.getByPlaceholderText(/buscar/i), 'mouse')

    await waitFor(() => {
      expect(mockApi.api.get).toHaveBeenCalledWith('/chamados?q=mouse')
    })
  })

  it('mantém o filtro de status ao buscar um problema', async () => {
    const todos = [
      { id: 1, user_name: 'Ana', description: 'Mouse sem conexão', status: 'aberto', priority: 'media' },
      { id: 2, user_name: 'Bruno', description: 'Mouse substituído', status: 'resolvido', priority: 'baixa' },
    ]
    // backend filtra por status e termo
    vi.mocked(mockApi.api.get).mockImplementation(async (url: string) => {
      const urlText = String(url)
      const filtrados = todos.filter((c) => {
        if (urlText.includes('status=aberto') && c.status !== 'aberto') return false
        if (urlText.includes('q=mouse') && !c.description.toLowerCase().includes('mouse')) return false
        return true
      })
      return { data: filtrados }
    })
    const user = userEvent.setup()
    renderList()
    await user.selectOptions(screen.getByLabelText(/filtrar por status/i), 'aberto')
    await user.type(screen.getByPlaceholderText(/buscar/i), 'mouse')
    await waitFor(() => {
      expect(mockApi.api.get).toHaveBeenCalledWith('/chamados?q=mouse&status=aberto')
      expect(screen.getByText('Mouse sem conexão')).toBeInTheDocument()
      expect(screen.queryByText('Mouse substituído')).not.toBeInTheDocument()
    })
  })

  it('aplica o status vindo do painel', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    renderList('comum', ['/chamados?status=aberto'])
    await waitFor(() => expect(mockApi.api.get).toHaveBeenCalledWith('/chamados?status=aberto'))
    expect(screen.getByLabelText(/filtrar por status/i)).toHaveValue('aberto')
  })

  it('admin pode alternar escopo meus/todos', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderList('admin')
    await user.selectOptions(screen.getByLabelText(/escopo dos chamados/i), 'meus')
    await waitFor(() => {
      expect(mockApi.api.get).toHaveBeenCalledWith('/chamados?scope=meus')
    })
  })

  it('comum não tem seletor de escopo', () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    renderList('comum')
    expect(screen.queryByLabelText(/escopo dos chamados/i)).not.toBeInTheDocument()
  })

  it('mostra falha de carregamento sem apresentar um resultado vazio', async () => {
    vi.mocked(mockApi.api.get).mockRejectedValue(new Error('offline'))
    renderList()
    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao carregar chamados')
    expect(screen.queryByText('Nenhum chamado encontrado.')).not.toBeInTheDocument()
  })
})