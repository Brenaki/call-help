import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { act, render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TicketDetail from '../pages/TicketDetail'
import { AuthProvider } from '../context/AuthContext'
import { RealtimeProvider } from '../context/RealtimeContext'

// WebSocket não existe no jsdom: mock global
class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  onerror: (() => void) | null = null
  constructor() {
    FakeWebSocket.instances.push(this)
  }
  close() {}
}
vi.stubGlobal('WebSocket', FakeWebSocket)

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

import { api } from '../api/client'

const ticket = {
  id: 7,
  user_id: 2,
  equipment_id: null,
  assigned_to: null,
  user_name: 'Isabelle',
  equipment_name: 'Projetor sala 12',
  sector: 'Pedagógico',
  localization: 'Sala 12',
  problem_type: 'Hardware',
  description: 'Projetor não liga',
  priority: 'alta',
  status: 'aberto',
  date: '2026-09-24',
}

const comentarios = [
  {
    id: 1,
    ticket_id: 7,
    author_id: 2,
    author_name: 'Isabelle',
    author_role: 'comum',
    is_internal: false,
    body: 'Ocorreu novamente hoje',
    attachments: [],
    created_at: '2026-09-24T10:00:00',
  },
  {
    id: 2,
    ticket_id: 7,
    author_id: 1,
    author_name: 'Admin',
    author_role: 'admin',
    is_internal: true,
    body: 'Nota interna: levar cabo novo',
    attachments: [],
    created_at: '2026-09-24T11:00:00',
  },
]

function renderDetail(role = 'comum') {
  localStorage.setItem('token', 'tok')
  localStorage.setItem('role', role)
  return render(
    <AuthProvider>
      <RealtimeProvider>
        <MemoryRouter initialEntries={['/chamados/7']}>
          <Routes>
            <Route path="/chamados/:id" element={<TicketDetail />} />
          </Routes>
        </MemoryRouter>
      </RealtimeProvider>
    </AuthProvider>,
  )
}

describe('TicketDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    FakeWebSocket.instances = []
  })
  afterEach(cleanup)

  it('mostra dados do chamado e thread de comentários', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/chamados/7') return { data: ticket }
      if (url === '/chamados/7/comentarios') return { data: comentarios }
      return { data: [] }
    })
    renderDetail('admin')

    expect((await screen.findAllByText('Projetor não liga')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Isabelle').length).toBeGreaterThan(0)
    expect(screen.getByText('Ocorreu novamente hoje')).toBeInTheDocument()
    // admin vê nota interna
    expect(screen.getByText('Nota interna: levar cabo novo')).toBeInTheDocument()
    // badge de status
    expect(screen.getByText('Aberto')).toBeInTheDocument()
  })

  it('solicitante não vê notas internas', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/chamados/7') return { data: ticket }
      if (url === '/chamados/7/comentarios') return { data: comentarios.filter((c) => !c.is_internal) }
      return { data: [] }
    })
    renderDetail('comum')

    expect((await screen.findAllByText('Projetor não liga')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Nota interna: levar cabo novo')).not.toBeInTheDocument()
    // sem botão de nota interna para comum
    expect(screen.queryByLabelText(/resposta interna/i)).not.toBeInTheDocument()
  })

  it('envia comentário e atualiza thread', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/chamados/7') return { data: ticket }
      if (url === '/chamados/7/comentarios') return { data: comentarios }
      return { data: [] }
    })
    const post = vi.mocked(api.post).mockResolvedValue({
      data: {
        id: 3,
        ticket_id: 7,
        author_id: 1,
        author_name: 'Admin',
        author_role: 'admin',
        is_internal: false,
        body: 'Estamos a caminho',
        attachments: [],
        created_at: '2026-09-24T12:00:00',
        ticket_status: 'em_andamento',
      },
    })
    renderDetail('admin')

    const textarea = await screen.findByLabelText(/mensagem/i)
    await userEvent.type(textarea, 'Estamos a caminho')
    ;(textarea.closest('form') as HTMLFormElement | null)?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )

    await waitFor(() => {
      expect(post).toHaveBeenCalled()
    })
  })

  it('colar imagem adiciona anexo pendente', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/chamados/7') return { data: ticket }
      if (url === '/chamados/7/comentarios') return { data: [] }
      return { data: [] }
    })
    renderDetail('comum')

    const textarea = await screen.findByLabelText(/mensagem/i)
    const arquivo = new File(['conteudo'], 'print.png', { type: 'image/png' })
    const paste = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(paste, 'clipboardData', {
      value: { items: [{ kind: 'file', type: 'image/png', getAsFile: () => arquivo }] },
    })
    textarea.dispatchEvent(paste)

    expect(await screen.findByText(/print\.png/)).toBeInTheDocument()
    expect(screen.getByText(/até 5 ?MB/i)).toBeInTheDocument()
  })

  it('não quebra ao receber comentário WS sem attachments', async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/chamados/7') return { data: ticket }
      if (url === '/chamados/7/comentarios') return { data: [] }
      return { data: [] }
    })
    renderDetail('comum')
    await screen.findAllByText('Projetor não liga')

    act(() => {
      FakeWebSocket.instances.at(-1)?.onmessage?.({
        data: JSON.stringify({
          type: 'comment',
          ticket_id: 7,
          comment: {
            id: 9,
            ticket_id: 7,
            author_id: 1,
            author_name: 'Admin',
            author_role: 'admin',
            is_internal: false,
            body: 'Mensagem recebida em tempo real',
            created_at: '2026-09-24T12:00:00',
          },
        }),
      })
    })

    expect(await screen.findByText('Mensagem recebida em tempo real')).toBeInTheDocument()
  })
})
