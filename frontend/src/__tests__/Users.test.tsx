import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Users from '../pages/Users'

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockApi = await import('../api/client')

function renderUsers() {
  return render(
    <MemoryRouter>
      <Users />
    </MemoryRouter>,
  )
}

describe('Users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('mostra formulario de cadastro', () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    renderUsers()
    expect(screen.getByText('Novo Usuário')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument()
  })

  it('lista usuarios', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({
      data: [
        { id: 1, name: 'Isabelle', email: 'isabelle@escola.edu', role: 'comum', sector: 'Informatica' },
      ],
    })
    renderUsers()

    await waitFor(() => {
      expect(screen.getByText('Isabelle')).toBeInTheDocument()
      expect(screen.getByText('isabelle@escola.edu')).toBeInTheDocument()
    })
  })

  it('cadastra usuario novo', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    vi.mocked(mockApi.api.post).mockResolvedValue({})
    const user = userEvent.setup()
    renderUsers()

    await user.type(screen.getByLabelText('Nome'), 'Joao')
    await user.type(screen.getByLabelText('Email'), 'joao@escola.edu')
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    expect(mockApi.api.post).toHaveBeenCalledWith('/usuarios', {
      name: 'Joao',
      email: 'joao@escola.edu',
      role: 'comum',
      sector: null,
    })
  })

  it('remove usuario', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({
      data: [{ id: 3, name: 'Para Remover', email: 'r@escola.edu', role: 'comum', sector: null }],
    })
    vi.mocked(mockApi.api.delete).mockResolvedValue({})
    const user = userEvent.setup()
    renderUsers()

    await waitFor(() => expect(screen.getByText('Para Remover')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /remover/i }))

    expect(mockApi.api.delete).toHaveBeenCalledWith('/usuarios/3')
  })
})
