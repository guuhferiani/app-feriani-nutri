import { createAuthClient } from 'better-auth/react'
import { syncNutricionista, getNutricionistaByEmail, type NutricionistaRecord } from './neon-db'

export const NEON_AUTH_URL =
  import.meta.env.VITE_NEON_AUTH_URL ||
  'https://ep-bold-king-b6ngw6t6.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth'

export const betterAuthClient = createAuthClient({
  baseURL: NEON_AUTH_URL,
})

export interface UserSession {
  id: string
  name: string
  email: string
  createdAt?: string
}

const LOCAL_STORAGE_SESSION_KEY = 'feriani_nutri_session'

export function getCachedUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserSession
  } catch {
    return null
  }
}

export function setCachedUser(user: UserSession | null): void {
  try {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY)
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Traduz mensagens técnicas do Better Auth / Neon Auth para mensagens claras em português
 */
export function translateAuthError(error: any): string {
  if (!error) return 'Ocorreu um erro inesperado. Tente novamente.'

  const message = typeof error === 'string' ? error : error?.message || error?.statusText || ''

  const lower = message.toLowerCase()
  if (lower.includes('invalid email or password') || lower.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.'
  }
  if (lower.includes('user not found')) {
    return 'Nenhum nutricionista cadastrado com este e-mail.'
  }
  if (lower.includes('already exists') || lower.includes('user already exists') || lower.includes('email already')) {
    return 'Já existe uma conta cadastrada com este endereço de e-mail.'
  }
  if (lower.includes('password') && (lower.includes('short') || lower.includes('characters') || lower.includes('length'))) {
    return 'A senha deve possuir pelo menos 9 caracteres.'
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('connection')) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
  }

  return message || 'Não foi possível completar a operação. Verifique os dados informados.'
}

export { syncNutricionista, getNutricionistaByEmail }
export type { NutricionistaRecord }
