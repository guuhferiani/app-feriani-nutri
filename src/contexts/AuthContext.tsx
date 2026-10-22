import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  betterAuthClient,
  getCachedUser,
  setCachedUser,
  translateAuthError,
  syncNutricionista,
  getNutricionistaByEmail,
  type UserSession,
  type NutricionistaRecord,
} from '@/lib/auth-client'

interface AuthContextType {
  user: UserSession | null
  nutricionista: NutricionistaRecord | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshNutricionista: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => getCachedUser())
  const [nutricionista, setNutricionista] = useState<NutricionistaRecord | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Atualiza os dados do nutricionista a partir da tabela public.nutricionistas
  const refreshNutricionista = useCallback(async () => {
    if (!user?.email) {
      setNutricionista(null)
      return
    }
    try {
      const record = await getNutricionistaByEmail(user.email)
      if (record) {
        setNutricionista(record)
      } else {
        // Se ainda não estiver na tabela, sincroniza imediatamente
        const synced = await syncNutricionista({
          id: user.id,
          nome: user.name,
          email: user.email,
        })
        if (synced) setNutricionista(synced)
      }
    } catch (err) {
      console.error('Erro ao buscar dados do nutricionista:', err)
    }
  }, [user?.email, user?.id, user?.name])

  // Checagem e validação da sessão com o Neon Auth ao carregar
  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      try {
        const cached = getCachedUser()
        if (cached && isMounted) {
          setUser(cached)
        }

        // Consulta sessão ativa no Neon Auth
        const sessionRes = await betterAuthClient.getSession()
        if (!isMounted) return

        if (sessionRes?.data?.user) {
          const u: UserSession = {
            id: sessionRes.data.user.id,
            name: sessionRes.data.user.name,
            email: sessionRes.data.user.email,
            createdAt: sessionRes.data.user.createdAt
              ? new Date(sessionRes.data.user.createdAt).toISOString()
              : undefined,
          }
          setUser(u)
          setCachedUser(u)

          // Garante registro no Neon nutricionistas
          const nutri = await syncNutricionista({
            id: u.id,
            nome: u.name,
            email: u.email,
          })
          if (nutri && isMounted) {
            setNutricionista(nutri)
          }
        } else if (!cached) {
          // Nenhuma sessão encontrada
          setUser(null)
          setCachedUser(null)
          setNutricionista(null)
        }
      } catch (err) {
        console.warn('Verificação de sessão remota:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [])

  // Atualiza nutricionista sempre que user mudar
  useEffect(() => {
    if (user?.email) {
      refreshNutricionista()
    }
  }, [user?.email, refreshNutricionista])

  const signIn = async (email: string, password: string) => {
    try {
      const res = await betterAuthClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      })

      if (res.error) {
        return { success: false, error: translateAuthError(res.error) }
      }

      if (res.data?.user) {
        const u: UserSession = {
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          createdAt: res.data.user.createdAt
            ? new Date(res.data.user.createdAt).toISOString()
            : undefined,
        }
        setUser(u)
        setCachedUser(u)

        // Sincroniza e garante gravação na tabela nutricionistas
        const nutriRecord = await syncNutricionista({
          id: u.id,
          nome: u.name,
          email: u.email,
        })
        if (nutriRecord) {
          setNutricionista(nutriRecord)
        }

        return { success: true }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: translateAuthError(err) }
    }
  }

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanName = name.trim()

      const res = await betterAuthClient.signUp.email({
        name: cleanName,
        email: cleanEmail,
        password,
      })

      if (res.error) {
        return { success: false, error: translateAuthError(res.error) }
      }

      if (res.data?.user) {
        const u: UserSession = {
          id: res.data.user.id,
          name: res.data.user.name || cleanName,
          email: res.data.user.email || cleanEmail,
        }
        setUser(u)
        setCachedUser(u)

        // Salvar nome e email do nutricionista na tabela nutricionistas do Neon
        const nutriRecord = await syncNutricionista({
          id: u.id,
          nome: cleanName,
          email: cleanEmail,
        })
        if (nutriRecord) {
          setNutricionista(nutriRecord)
        }

        return { success: true }
      }

      // Caso o retorno não contenha o user diretamente, tente auto-login
      const loginAttempt = await signIn(cleanEmail, password)
      return loginAttempt
    } catch (err: any) {
      return { success: false, error: translateAuthError(err) }
    }
  }

  const signOut = async () => {
    try {
      await betterAuthClient.signOut()
    } catch (err) {
      console.warn('Erro ao finalizar sessão remota:', err)
    } finally {
      setUser(null)
      setNutricionista(null)
      setCachedUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        nutricionista,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshNutricionista,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
