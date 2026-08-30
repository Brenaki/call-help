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
  user_name: string
  equipment_name: string | null
  sector: string | null
  localization: string | null
  problem_type: string | null
  description: string
  priority: string
  status: string
  technical_lead: string | null
  date: string | null
}