import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import NewTicket from '../pages/NewTicket'

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    token: 'fake-token',
    role: 'comum',
    userId: 2,
    name: 'Isabelle',
    mustChangePassword: false,
    logout: vi.fn(),
  }),
}))

function renderNewTicket() {
  return render(
    <MemoryRouter>
      <NewTicket />
    </MemoryRouter>,
  )
}

describe('NewTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('mostra os campos do formulario', () => {
    renderNewTicket()
    expect(screen.getByText('Solicitante')).toBeInTheDocument()
    expect(screen.getByText('Local')).toBeInTheDocument()
    expect(screen.getByText('Setor')).toBeInTheDocument()
    expect(screen.getByText('Tipo do Problema')).toBeInTheDocument()
    expect(screen.getByText('Descrição')).toBeInTheDocument()
    expect(screen.getByText('Prioridade')).toBeInTheDocument()
  })

  it('tem botao de abrir chamado', () => {
    renderNewTicket()
    expect(screen.getByRole('button', { name: /abrir chamado/i })).toBeInTheDocument()
  })

  it('preenche e envia o formulario', async () => {
    const { api } = await import('../api/client')
    vi.mocked(api.post).mockResolvedValue({})
    renderNewTicket()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Local'), 'Laboratorio 2')
    await user.type(screen.getByLabelText('Setor'), 'Informatica')
    await user.type(screen.getByLabelText('Descrição'), 'Computador nao liga')
    await user.click(screen.getByRole('button', { name: /abrir chamado/i }))

    expect(api.post).toHaveBeenCalledWith('/chamados', expect.objectContaining({
      user_name: 'Isabelle',
      localization: 'Laboratorio 2',
      sector: 'Informatica',
      description: 'Computador nao liga',
    }))
  })
})
