import type { CSSProperties } from 'react'

const paths = {
  headset: 'M4 14v-3a8 8 0 0 1 16 0v3M4 12H3v7h4v-7H4Zm16 0h1v7h-4v-7h3ZM20 19v2h-7',
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  ticket: 'M4 4h16v5a3 3 0 0 0 0 6v5H4v-5a3 3 0 0 0 0-6V4ZM14 7v2m0 3v1m0 3v1',
  plus: 'M12 5v14M5 12h14',
  monitor: 'M3 4h18v13H3zM8 21h8M12 17v4',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  logout: 'M9 4H3v16h6M10 12h11m-4-4 4 4-4 4',
  clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  check: 'm8 12 3 3 5-6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  school: 'm2 8 10-5 10 5-10 5L2 8Zm4 2v7l6 4 6-4v-7M22 8v8',
  building: 'M4 21V3h12v18M16 9h4v12M2 21h20M8 7h4M8 11h4M8 15h4M8 21v-2h4v2',
  network: 'M9 3h6v6H9zM2 16h6v6H2zM16 16h6v6h-6zM12 9v4M5 16v-3h14v3',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M6 18 18 6',
  info: 'M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z',
  attachment: 'M21.4 11.05 12.25 20a5 5 0 0 1-7.07-7.07l8.49-8.48a3.33 3.33 0 1 1 4.72 4.72l-8.5 8.48a1.67 1.67 0 0 1-2.36-2.36l7.78-7.78',
}
export type IconName = keyof typeof paths

export default function Icon({ name, size = 20, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>
}
