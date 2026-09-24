import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connectWs, wsUrlFromHttp, WS_RECONNECT_MS, type WsEvent } from '../api/ws'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  url: string
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  onerror: (() => void) | null = null
  closed = false

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  close() {
    this.closed = true
  }

  simulateOpen() {
    this.onopen?.()
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }

  simulateClose(code = 1006) {
    this.onclose?.({ code })
  }
}

function setup() {
  FakeWebSocket.instances = []
  const events: WsEvent[] = []
  const statuses: string[] = []
  const client = connectWs(
    'tok',
    (e) => events.push(e),
    (s) => statuses.push(s),
    {
      factory: (url) => new FakeWebSocket(url) as unknown as WebSocket,
      url: 'ws://fake',
      reconnectMs: WS_RECONNECT_MS,
    },
  )
  return { client, events, statuses }
}

describe('connectWs', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('conecta e recebe eventos', () => {
    const { events, statuses } = setup()
    const socket = FakeWebSocket.instances[0]
    socket.simulateOpen()
    socket.simulateMessage({ type: 'connected', user_id: 1 })
    expect(events[0].type).toBe('connected')
    expect(statuses).toContain('conectado')
  })

  it('tenta reconectar a cada 10 segundos após queda', () => {
    setup()
    const primeiro = FakeWebSocket.instances[0]
    primeiro.simulateOpen()
    primeiro.simulateClose(1006)

    // ainda não reconectou
    expect(FakeWebSocket.instances.length).toBe(1)

    // após 10s reconecta
    vi.advanceTimersByTime(WS_RECONNECT_MS)
    expect(FakeWebSocket.instances.length).toBe(2)

    // cai de novo e reconecta mais uma vez
    FakeWebSocket.instances[1].simulateClose(1006)
    vi.advanceTimersByTime(WS_RECONNECT_MS)
    expect(FakeWebSocket.instances.length).toBe(3)
  })

  it('não reconecta quando auth expira (4401)', () => {
    const { events } = setup()
    FakeWebSocket.instances[0].simulateClose(4401)
    vi.advanceTimersByTime(WS_RECONNECT_MS * 5)
    expect(FakeWebSocket.instances.length).toBe(1)
    expect(events.some((e) => e.type === 'auth_expired')).toBe(true)
  })

  it('close() interrompe reconexões', () => {
    const { client } = setup()
    FakeWebSocket.instances[0].simulateClose(1006)
    client.close()
    vi.advanceTimersByTime(WS_RECONNECT_MS * 3)
    expect(FakeWebSocket.instances.length).toBe(1)
  })

  it('sem token fica fechado', () => {
    const statuses: string[] = []
    connectWs(null, () => {}, (s) => statuses.push(s))
    expect(statuses[0]).toBe('fechado')
  })
})

describe('wsUrlFromHttp', () => {
  it('deriva ws de http', () => {
    expect(wsUrlFromHttp('http://localhost:8000')).toBe('ws://localhost:8000')
  })
  it('deriva wss de https', () => {
    expect(wsUrlFromHttp('https://api.exemplo.com')).toBe('wss://api.exemplo.com')
  })
})