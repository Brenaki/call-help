export interface User {
  id: number
  name: string
  email: string
  role: string
  sector: string | null
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role: string
}

export interface Equipment {
  id: number
  name: string
  type: string | null
  localization: string | null
}

export interface Ticket {
  id: number
  user_id: number | null
  equipment_id: number | null
  assigned_to: number | null
  user_name: string
  equipment_name: string | null
  sector: string | null
  localization: string | null
  problem_type: string | null
  description: string
  priority: string
  status: string
  date: string | null
  created_at?: string | null
  updated_at?: string | null
  closed_at?: string | null
}

export interface Attachment {
  id: number
  ticket_id: number
  comment_id: number | null
  file_name: string
  stored_name: string
  mime_type: string
  size_bytes: number
  uploaded_by: number
  created_at?: string | null
}

export interface Comment {
  id: number
  ticket_id: number
  author_id: number
  author_name: string
  author_role: string
  is_internal: boolean
  body: string
  attachments: Attachment[]
  created_at: string | null
  ticket_status?: string
}

export interface TicketEvent {
  id: number
  ticket_id: number
  user_id: number | null
  user_name: string | null
  event_type: string
  old_value: string | null
  new_value: string | null
  created_at: string | null
}

export interface NotificationItem {
  id: number
  ticket_id: number | null
  type: string
  message: string
  is_read: boolean
  created_at: string | null
}