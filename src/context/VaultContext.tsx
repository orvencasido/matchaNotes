import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  generateSalt,
  deriveMasterKey,
  generateVerifierHash,
  encryptVaultPayload,
  decryptVaultPayload,
} from '@/lib/crypto'
import type {
  DecryptedVaultItem,
  DecryptedVaultPayload,
  VaultCategory,
  CreateVaultItemInput,
  UpdateVaultItemInput,
} from '@/types'
import { VaultContext } from './vault-context-def'

const IDLE_LOCK_MS = 3 * 60 * 1000 // 3 minutes

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()

  // In-memory master key: NEVER written to localStorage/sessionStorage
  const masterKeyRef = useRef<CryptoKey | null>(null)
  const vaultConfigRef = useRef<{ salt: string; verifier_hash: string } | null>(null)
  const idleTimerRef = useRef<number | null>(null)
  const lastActivityRef = useRef<number>(0)

  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
  const [isLocked, setIsLocked] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<DecryptedVaultItem[]>([])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Lock the vault, wiping the master key and decrypted items from memory
  const lockVault = useCallback(() => {
    masterKeyRef.current = null
    setItems([])
    setIsLocked(true)
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  // Check if vault_config exists for current user
  const checkVaultConfig = useCallback(async () => {
    if (!user) {
      setIsConfigured(null)
      lockVault()
      return
    }

    try {
      setIsLoading(true)
      const { data, error: fetchErr } = await supabase
        .from('vault_config')
        .select('salt, verifier_hash')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchErr) {
        console.error('Error fetching vault config:', fetchErr)
        setIsConfigured(false)
      } else if (data) {
        vaultConfigRef.current = data
        setIsConfigured(true)
      } else {
        vaultConfigRef.current = null
        setIsConfigured(false)
      }
    } catch (err) {
      console.error('Check vault config exception:', err)
      setIsConfigured(false)
    } finally {
      setIsLoading(false)
    }
  }, [user, lockVault])

  // Initial check on user change
  useEffect(() => {
    let ignore = false

    const checkInitialConfig = async () => {
      if (!user) {
        if (!ignore) {
          setIsConfigured(null)
          lockVault()
        }
        return
      }

      try {
        const { data, error: fetchErr } = await supabase
          .from('vault_config')
          .select('salt, verifier_hash')
          .eq('user_id', user.id)
          .maybeSingle()

        if (ignore) return

        if (fetchErr) {
          console.error('Error fetching vault config:', fetchErr)
          setIsConfigured(false)
        } else if (data) {
          vaultConfigRef.current = data
          setIsConfigured(true)
        } else {
          vaultConfigRef.current = null
          setIsConfigured(false)
        }
      } catch (err) {
        if (!ignore) {
          console.error('Check vault config exception:', err)
          setIsConfigured(false)
        }
      }
    }

    checkInitialConfig()

    return () => {
      ignore = true
    }
  }, [user, lockVault])

  // Setup PIN for first-time user
  const setupPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!user) {
        setError('No active user session')
        return false
      }
      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        setError('PIN must be exactly 6 numeric digits')
        return false
      }

      try {
        setIsLoading(true)
        setError(null)

        const salt = generateSalt()
        const verifierHash = await generateVerifierHash(pin, salt)

        const { error: upsertErr } = await supabase
          .from('vault_config')
          .upsert({
            user_id: user.id,
            salt,
            verifier_hash: verifierHash,
          })

        if (upsertErr) {
          throw upsertErr
        }

        vaultConfigRef.current = { salt, verifier_hash: verifierHash }

        // Derive in-memory master key
        const key = await deriveMasterKey(pin, salt)
        masterKeyRef.current = key

        setIsConfigured(true)
        setIsLocked(false)
        setItems([])
        return true
      } catch (err: unknown) {
        console.error('Setup PIN error:', err)
        setError(err instanceof Error ? err.message : 'Failed to configure vault')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [user]
  )

  // Decrypt items helper
  const decryptAllItems = useCallback(
    async (key: CryptoKey): Promise<DecryptedVaultItem[]> => {
      if (!user) return []

      const { data, error: fetchErr } = await supabase
        .from('vault_items')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (fetchErr || !data) {
        console.error('Fetch vault_items error:', fetchErr)
        return []
      }

      const decrypted: DecryptedVaultItem[] = []
      for (const row of data) {
        try {
          const payload = await decryptVaultPayload<DecryptedVaultPayload>(
            row.encrypted_payload,
            row.iv,
            key
          )
          decrypted.push({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            category: (row.category || 'Account') as VaultCategory,
            payload,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })
        } catch (decryptErr) {
          console.error('Failed to decrypt vault item id:', row.id, decryptErr)
          decrypted.push({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            category: (row.category || 'Account') as VaultCategory,
            payload: { notes: '[Decryption Error: corrupted or wrong key]' },
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })
        }
      }

      return decrypted
    },
    [user]
  )

  // Unlock Vault with entered 6-digit PIN
  const unlockVault = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!user) {
        setError('No active user session')
        return false
      }
      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        setError('PIN must be exactly 6 numeric digits')
        return false
      }

      try {
        setIsLoading(true)
        setError(null)

        let config = vaultConfigRef.current
        if (!config) {
          const { data, error: cfgErr } = await supabase
            .from('vault_config')
            .select('salt, verifier_hash')
            .eq('user_id', user.id)
            .single()

          if (cfgErr || !data) {
            setError('Vault not configured')
            setIsConfigured(false)
            return false
          }
          config = data
          vaultConfigRef.current = data
        }

        const candidateHash = await generateVerifierHash(pin, config.salt)
        if (candidateHash !== config.verifier_hash) {
          setError('Incorrect PIN. Please try again.')
          return false
        }

        const masterKey = await deriveMasterKey(pin, config.salt)
        masterKeyRef.current = masterKey

        const decryptedItems = await decryptAllItems(masterKey)
        setItems(decryptedItems)
        setIsLocked(false)
        setError(null)
        return true
      } catch (err: unknown) {
        console.error('Unlock vault error:', err)
        setError(err instanceof Error ? err.message : 'Failed to unlock vault')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [user, decryptAllItems]
  )

  // Refetch items in unlocked state
  const refetchItems = useCallback(async () => {
    if (!masterKeyRef.current || isLocked) return
    setIsLoading(true)
    try {
      const decrypted = await decryptAllItems(masterKeyRef.current)
      setItems(decrypted)
    } finally {
      setIsLoading(false)
    }
  }, [isLocked, decryptAllItems])

  // Create new encrypted item
  const createVaultItem = useCallback(
    async (input: CreateVaultItemInput): Promise<DecryptedVaultItem | null> => {
      if (!user || !masterKeyRef.current) {
        setError('Vault is locked')
        return null
      }

      try {
        setIsActionLoading(true)
        setError(null)

        const { ciphertext, iv } = await encryptVaultPayload(
          input.payload,
          masterKeyRef.current
        )

        const { data, error: insertErr } = await supabase
          .from('vault_items')
          .insert({
            user_id: user.id,
            title: input.title.trim(),
            category: input.category,
            encrypted_payload: ciphertext,
            iv,
          })
          .select()
          .single()

        if (insertErr || !data) {
          throw insertErr || new Error('Failed to insert vault item')
        }

        const newItem: DecryptedVaultItem = {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          category: (data.category || 'Account') as VaultCategory,
          payload: input.payload,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }

        setItems((prev) => [newItem, ...prev])
        return newItem
      } catch (err: unknown) {
        console.error('Create vault item error:', err)
        setError(err instanceof Error ? err.message : 'Failed to save encrypted item')
        return null
      } finally {
        setIsActionLoading(false)
      }
    },
    [user]
  )

  // Update existing item
  const updateVaultItem = useCallback(
    async (id: string, input: UpdateVaultItemInput): Promise<boolean> => {
      if (!user || !masterKeyRef.current) {
        setError('Vault is locked')
        return false
      }

      try {
        setIsActionLoading(true)
        setError(null)

        const updates: {
          title?: string
          category?: string
          encrypted_payload?: string
          iv?: string
          updated_at: string
        } = {
          updated_at: new Date().toISOString(),
        }

        if (input.title !== undefined) updates.title = input.title.trim()
        if (input.category !== undefined) updates.category = input.category
        if (input.payload !== undefined) {
          const { ciphertext, iv } = await encryptVaultPayload(
            input.payload,
            masterKeyRef.current
          )
          updates.encrypted_payload = ciphertext
          updates.iv = iv
        }

        const { error: updateErr } = await supabase
          .from('vault_items')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)

        if (updateErr) {
          throw updateErr
        }

        setItems((prev) =>
          prev.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                title: input.title !== undefined ? input.title.trim() : item.title,
                category: (input.category || item.category) as VaultCategory,
                payload: input.payload !== undefined ? input.payload : item.payload,
                updatedAt: updates.updated_at,
              }
            }
            return item
          })
        )

        return true
      } catch (err: unknown) {
        console.error('Update vault item error:', err)
        setError(err instanceof Error ? err.message : 'Failed to update item')
        return false
      } finally {
        setIsActionLoading(false)
      }
    },
    [user]
  )

  // Delete item
  const deleteVaultItem = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false

      try {
        setIsActionLoading(true)
        setError(null)

        const { error: delErr } = await supabase
          .from('vault_items')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (delErr) {
          throw delErr
        }

        setItems((prev) => prev.filter((item) => item.id !== id))
        return true
      } catch (err: unknown) {
        console.error('Delete vault item error:', err)
        setError(err instanceof Error ? err.message : 'Failed to delete item')
        return false
      } finally {
        setIsActionLoading(false)
      }
    },
    [user]
  )

  // Reset idle timer handler
  const resetIdleTimer = useCallback(() => {
    if (isLocked) return

    lastActivityRef.current = Date.now()

    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current)
    }

    idleTimerRef.current = window.setTimeout(() => {
      lockVault()
    }, IDLE_LOCK_MS)
  }, [isLocked, lockVault])

  // Setup idle timeout & visibility listeners when vault is unlocked
  useEffect(() => {
    if (isLocked) {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      return
    }

    // Start idle timer immediately on unlock
    resetIdleTimer()

    // Activity throttle
    let lastHandled = 0
    const handleActivity = () => {
      const now = Date.now()
      if (now - lastHandled > 1000) {
        lastHandled = now
        resetIdleTimer()
      }
    }

    // Instantly lock when switching tabs or locking device
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lockVault()
      }
    }

    window.addEventListener('mousedown', handleActivity, { passive: true })
    window.addEventListener('keydown', handleActivity, { passive: true })
    window.addEventListener('touchstart', handleActivity, { passive: true })
    window.addEventListener('scroll', handleActivity, { passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isLocked, resetIdleTimer, lockVault])

  return (
    <VaultContext.Provider
      value={{
        isConfigured,
        isLocked,
        isLoading,
        isActionLoading,
        error,
        items,
        setupPin,
        unlockVault,
        lockVault,
        createVaultItem,
        updateVaultItem,
        deleteVaultItem,
        refetchItems,
        checkVaultConfig,
        clearError,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}
