import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue(undefined),
    token: null,
    role: null,
    logout: vi.fn(),
  }),
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
}

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('mostra campos de email e senha', () => {
    renderLogin()
    expect(screen.getByLabelText('E-mail institucional')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('mostra botao de entrar', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('preenche email e senha', async () => {
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('E-mail institucional'), 'teste@escola.edu')
    await user.type(screen.getByLabelText('Senha'), '123456')

    expect(screen.getByLabelText('E-mail institucional')).toHaveValue('teste@escola.edu')
  })

  it('envia o formulario', async () => {
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('E-mail institucional'), 'admin@escola.edu')
    await user.type(screen.getByLabelText('Senha'), '123456')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
  })
})