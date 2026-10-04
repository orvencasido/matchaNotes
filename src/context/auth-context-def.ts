import { createContext } from 'react'
import type { Session, User, AuthError } from '@supabase/supabase-js'

export interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
