import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Comment, Ticket, TicketEvent, User } from '../api/types'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  aguardando_cliente: 'Aguardando cliente',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
}

const PRIORITY_LABEL: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

/** Transições válidas por status (espelha o backend). */
const TRANSICOES: Record<string, string[]> = {
  aberto: ['em_andamento'],
  em_andamento: ['aguardando_cliente', 'resolvido'],
  aguardando_cliente: ['em_andamento', 'resolvido'],
  resolvido: ['em_andamento', 'fechado'],
  fechado: ['em_andamento'],
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const { role, token } = useAuth()
  const { subscribe } = useRealtime()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comentarios, setComentarios] = useState<Comment[]>([])
  const [eventos, setEventos] = useState<TicketEvent[]>([])
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [notaInterna, setNotaInterna] = useState(false)
  const [anexos, setAnexos] = useState<File[]>([])
  const [erroAnexo, setErroAnexo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [loading, setLoading] = useState(true)
  const isAdmin = role === 'admin'
  const threadRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ticketId = Number(id)

  async function carregar() {
    try {
      const [t, c] = await Promise.all([
        api.get<Ticket>(`/chamados/${ticketId}`),
        api.get<Comment[]>(`/chamados/${ticketId}/comentarios`),
      ])
      setTicket(t.data)
      setComentarios(c.data)
      const e = await api.get<TicketEvent[]>(`/chamados/${ticketId}/eventos`)
      setEventos(e.data)
    } catch {
      setErro('Não foi possível carregar o chamado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    if (isAdmin) {
      api.get<User[]>('/usuarios').then((r) => setUsuarios(r.data)).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, isAdmin, token])

  // tempo real: novo comentário ou mudança de status atualizam a tela
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (Number(event.ticket_id) !== ticketId) return
      if (event.type === 'comment') {
        const comment = event.comment as Comment
        if (isAdmin || !comment.is_internal) {
          setComentarios((atuais) =>
            atuais.some((c) => c.id === comment.id) ? atuais : [...atuais, comment],
          )
        }
      }
      if (event.type === 'status_change' && typeof event.status === 'string') {
        const novoStatus = event.status
        setTicket((atual) => (atual ? { ...atual, status: novoStatus } : atual))
        api.get<TicketEvent[]>(`/chamados/${ticketId}/eventos`)
          .then((r) => setEventos(r.data))
          .catch(() => {})
      }
    })
    return unsubscribe
  }, [subscribe, ticketId, isAdmin])

  useEffect(() => {
    const thread = threadRef.current
    if (thread && typeof thread.scrollTo === 'function') {
      thread.scrollTo({ top: thread.scrollHeight })
    } else if (thread) {
      thread.scrollTop = thread.scrollHeight
    }
  }, [comentarios.length])

  function validarArquivo(file: File): string | null {
    if (file.size > 5 * 1024 * 1024) {
      return `"${file.name}" passa de 5 MB. Envie um arquivo menor.`
    }
    return null
  }

  function adicionarArquivos(files: FileList | File[]) {
    setErroAnexo('')
    const aceitos: File[] = []
    for (const file of Array.from(files)) {
      const erro = validarArquivo(file)
      if (erro) {
        setErroAnexo(erro)
        continue
      }
      aceitos.push(file)
    }
    if (aceitos.length) setAnexos((atuais) => [...atuais, ...aceitos].slice(0, 5))
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const items = event.clipboardData?.items
    if (!items) return
    const imagens: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) imagens.push(new File([file], file.name || `colado-${Date.now()}.png`, { type: file.type }))
      }
    }
    if (imagens.length) {
      event.preventDefault()
      adicionarArquivos(imagens)
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (event.dataTransfer?.files?.length) adicionarArquivos(event.dataTransfer.files)
  }

  async function enviarResposta(e: FormEvent) {
    e.preventDefault()
    if (!mensagem.trim() && anexos.length === 0) return
    setEnviando(true)
    setErro('')
    try {
      const formData = new FormData()
      formData.append('body', mensagem.trim() || '(anexo)')
      formData.append('is_internal', notaInterna ? 'true' : 'false')
      anexos.forEach((file) => formData.append('files', file))
      const response = await api.post<Comment>(`/chamados/${ticketId}/comentarios`, formData)
      const novo = response.data
      if (isAdmin || !novo.is_internal) {
        setComentarios((atuais) => (atuais.some((c) => c.id === novo.id) ? atuais : [...atuais, novo]))
      }
      setMensagem('')
      setAnexos([])
      setNotaInterna(false)
      if (novo.ticket_status && novo.ticket_status !== ticket?.status) {
        const statusNovo = novo.ticket_status
        setTicket((atual) => (atual ? { ...atual, status: statusNovo } : atual))
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErro(detail || 'Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function mudarStatus(novoStatus: string) {
    try {
      const response = await api.put<Ticket>(`/chamados/${ticketId}/status`, { status: novoStatus })
      setTicket(response.data)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErro(detail || 'Não foi possível mudar o status.')
    }
  }

  async function atribuir(userId: string) {
    try {
      const response = await api.put<Ticket>(`/chamados/${ticketId}/atribuir`, { assigned_to: Number(userId) })
      setTicket(response.data)
    } catch {
      setErro('Não foi possível atribuir o técnico.')
    }
  }

  const opcoesStatus = useMemo(() => {
    if (!ticket) return []
    const destinos = TRANSICOES[ticket.status] || []
    return destinos.filter((destino) => {
      if (destino === 'fechado') return ticket.user_id !== null && !isAdmin
      return isAdmin
    })
  }, [ticket, isAdmin])

  if (loading) {
    return <p className="empty-state" role="status">Carregando chamado...</p>
  }
  if (!ticket) {
    return (
      <div className="empty-state">
        <h2>Chamado não encontrado.</h2>
        {erro && <p className="erro">{erro}</p>}
        <Link to="/chamados" className="text-link">Voltar para a lista</Link>
      </div>
    )
  }

  const fechado = ticket.status === 'fechado'

  return (
    <div>
      <PageHeader
        title={`Chamado #${String(ticket.id).padStart(4, '0')}`}
        description={ticket.description}
        action={<Link to="/chamados" className="btn-secundario">Voltar</Link>}
      />
      {erro && <p className="erro panel-message" role="alert">{erro}</p>}
      <div className="ticket-detail-grid">
        <section className="panel ticket-thread-panel" aria-label="Conversa do chamado">
          <header className="thread-header">
            <span className={`status-badge status-${ticket.status}`}>{STATUS_LABEL[ticket.status] || ticket.status}</span>
            <span className={`priority priority-${ticket.priority}`}>{PRIORITY_LABEL[ticket.priority]}</span>
            <span className="thread-meta">
              {ticket.user_name} · {ticket.localization || ticket.sector || 'Sem local'}
            </span>
          </header>
          <div className="thread" ref={threadRef} onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
            <div className="thread-opening">
              <strong>{ticket.description}</strong>
              <span>
                {ticket.equipment_name || ticket.problem_type || 'Suporte de TI'}
                {ticket.date && ` · ${ticket.date}`}
              </span>
            </div>
            {comentarios.map((c) => (
              <div
                key={c.id}
                className={`thread-message ${c.author_role === 'admin' ? 'msg-ti' : 'msg-solicitante'} ${c.is_internal ? 'msg-interna' : ''}`}
              >
                <div className="msg-header">
                  <strong>{c.author_name}</strong>
                  {c.is_internal && <span className="internal-tag">Interno</span>}
                  <time>{c.created_at ? new Date(c.created_at).toLocaleString('pt-BR') : ''}</time>
                </div>
                <p className="msg-body">{c.body}</p>
                {c.attachments.length > 0 && (
                  <ul className="msg-attachments">
                    {c.attachments.map((a) => (
                      <li key={a.id}>
                        <a href={`/anexos/${a.id}`} aria-label={`Baixar ${a.file_name}`}>
                          <Icon name="attachment" size={14} /> {a.file_name}
                        </a>
                        <small>{Math.max(1, Math.round(a.size_bytes / 1024))} KB</small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {eventos.length > 0 && (
              <div className="thread-events" aria-label="Histórico do chamado">
                {eventos
                  .filter((e) => e.event_type === 'status_change' || e.event_type === 'assignment')
                  .map((e) => (
                    <p key={e.id} className="thread-event">
                      <Icon name="clock" size={13} />
                      {e.event_type === 'status_change'
                        ? `Status: ${STATUS_LABEL[e.old_value || ''] || e.old_value} → ${STATUS_LABEL[e.new_value || ''] || e.new_value}`
                        : `Atribuído a ${e.new_value}`}
                      <span>por {e.user_name || 'sistema'}{e.created_at && ` · ${new Date(e.created_at).toLocaleString('pt-BR')}`}</span>
                    </p>
                  ))}
              </div>
            )}
          </div>
          {!fechado ? (
            <form className="thread-composer" onSubmit={enviarResposta} aria-label="Responder chamado">
              {anexos.length > 0 && (
                <ul className="pending-attachments">
                  {anexos.map((file, index) => (
                    <li key={`${file.name}-${index}`}>
                      {file.type.startsWith('image/') ? <span className="thumb" aria-hidden="true" /> : <Icon name="attachment" size={14} />}
                      <span className="thumb-name">{file.name}</span>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remover ${file.name}`}
                        onClick={() => setAnexos((atuais) => atuais.filter((_, i) => i !== index))}
                      >
                        <Icon name="close" size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {erroAnexo && <p className="erro" role="alert">{erroAnexo}</p>}
              <textarea
                aria-label="Mensagem"
                placeholder={isAdmin ? 'Responder ao solicitante...' : 'Escreva sua mensagem...'}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onPaste={onPaste}
              />
              <div className="composer-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.zip,.docx,.xlsx"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files && adicionarArquivos(e.target.files)}
                />
                <button type="button" className="icon-button" aria-label="Anexar arquivo" title="Anexar arquivo" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="attachment" size={18} />
                </button>
                {isAdmin && (
                  <label className="internal-toggle">
                    <input type="checkbox" checked={notaInterna} onChange={(e) => setNotaInterna(e.target.checked)} />
                    Resposta interna
                  </label>
                )}
                <span className="composer-hint">Você pode colar uma imagem aqui · Arquivos de até 5 MB</span>
                <button type="submit" className="btn-primario" disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          ) : (
            <p className="thread-closed">
              <Icon name="check" size={16} /> Chamado fechado em{' '}
              {ticket.closed_at ? new Date(ticket.closed_at).toLocaleString('pt-BR') : '—'}
            </p>
          )}
        </section>

        <aside className="ticket-sidebar" aria-label="Detalhes e ações">
          <section className="panel">
            <h2>Detalhes</h2>
            <dl className="ticket-facts">
              <div><dt>Solicitante</dt><dd>{ticket.user_name}</dd></div>
              <div><dt>Setor</dt><dd>{ticket.sector || '—'}</dd></div>
              <div><dt>Local</dt><dd>{ticket.localization || '—'}</dd></div>
              <div><dt>Equipamento</dt><dd>{ticket.equipment_name || '—'}</dd></div>
              <div><dt>Tipo</dt><dd>{ticket.problem_type || '—'}</dd></div>
              <div><dt>Aberto em</dt><dd>{ticket.created_at ? new Date(ticket.created_at).toLocaleString('pt-BR') : ticket.date || '—'}</dd></div>
            </dl>
          </section>

          <section className="panel">
            <h2>Ações</h2>
            {opcoesStatus.length > 0 ? (
              <div className="action-list">
                {opcoesStatus.map((status) => (
                  <button key={status} className="btn-secundario" onClick={() => mudarStatus(status)}>
                    {status === 'fechado' && 'Confirmar e fechar'}
                    {status === 'em_andamento' && (ticket.status === 'fechado' ? 'Reabrir chamado' : 'Mover para Em andamento')}
                    {status === 'aguardando_cliente' && 'Aguardando cliente'}
                    {status === 'resolvido' && 'Marcar como resolvido'}
                  </button>
                ))}
              </div>
            ) : (
              <p className="field-help">
                {ticket.status === 'resolvido'
                  ? 'Aguardando o solicitante confirmar e fechar.'
                  : 'Sem ações disponíveis para o seu perfil neste status.'}
              </p>
            )}
            {isAdmin && (
              <label className="assign-field">
                Técnico responsável
                <select
                  value={ticket.assigned_to ?? ''}
                  onChange={(e) => atribuir(e.target.value)}
                >
                  <option value="">Não atribuído</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </label>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}