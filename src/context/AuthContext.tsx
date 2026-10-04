import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthContext } from './auth-context-def'
import type { Session, User } from '@supabase/supabase-js'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return
      if (error) {
        console.error('Error fetching session:', error)
      }
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return { error: result.error }
  }

  const signOut = async () => {
    const result = await supabase.auth.signOut()
    return { error: result.error }
  }

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      signInWithPassword,
      signOut,
    }),
    [user, session, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
