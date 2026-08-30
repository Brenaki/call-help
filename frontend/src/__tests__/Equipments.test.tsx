import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Equipments from '../pages/Equipments'

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockApi = await import('../api/client')

function renderEquipments() {
  return render(
    <MemoryRouter>
      <Equipments />
    </MemoryRouter>,
  )
}

describe('Equipments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('mostra formulario de cadastro', () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    renderEquipments()
    expect(screen.getByText('Novo Equipamento')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument()
  })

  it('lista equipamentos', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({
      data: [
        { id: 1, name: 'Computador 02', type: 'Desktop', localization: 'Lab 2' },
      ],
    })
    renderEquipments()

    await waitFor(() => {
      expect(screen.getByText('Computador 02')).toBeInTheDocument()
      expect(screen.getByText('Desktop')).toBeInTheDocument()
    })
  })

  it('cadastra equipamento novo', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({ data: [] })
    vi.mocked(mockApi.api.post).mockResolvedValue({})
    const user = userEvent.setup()
    renderEquipments()

    await user.type(screen.getByLabelText('Nome'), 'Notebook 01')
    await user.type(screen.getByLabelText('Tipo'), 'Notebook')
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    expect(mockApi.api.post).toHaveBeenCalledWith('/equipamentos', {
      name: 'Notebook 01',
      type: 'Notebook',
      localization: null,
    })
  })

  it('remove equipamento', async () => {
    vi.mocked(mockApi.api.get).mockResolvedValue({
      data: [{ id: 5, name: 'Para Remover', type: null, localization: null }],
    })
    vi.mocked(mockApi.api.delete).mockResolvedValue({})
    const user = userEvent.setup()
    renderEquipments()

    await waitFor(() => expect(screen.getByText('Para Remover')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /remover/i }))

    expect(mockApi.api.delete).toHaveBeenCalledWith('/equipamentos/5')
  })
})