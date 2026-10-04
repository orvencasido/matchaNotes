import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Note, NoteInsert, NoteUpdate } from '@/types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface CreateNoteInput {
  title?: string
  content?: string
  category?: string
  tags?: string[]
  is_pinned?: boolean
}

export interface UseNotesReturn {
  notes: Note[]
  isLoading: boolean
  error: string | null
  saveStatus: SaveStatus
  createNote: (input?: CreateNoteInput) => Promise<Note | null>
  updateNote: (id: string, updates: Partial<NoteUpdate>) => Promise<boolean>
  saveNoteDebounced: (id: string, updates: Partial<NoteUpdate>, delayMs?: number) => void
  flushPendingSave: () => Promise<void>
  deleteNote: (id: string) => Promise<boolean>
  togglePin: (id: string) => Promise<boolean>
  refetchNotes: () => Promise<void>
}

export function useNotes(): UseNotesReturn {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Debounce ref to track pending saves
  const pendingSaveRef = useRef<{
    id: string
    updates: Partial<NoteUpdate>
    timer: ReturnType<typeof setTimeout>
  } | null>(null)

  const sortNotes = (items: Note[]): Note[] => {
    return [...items].sort((a, b) => {
      // Pinned first
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1
      }
      // Then newest updated_at
      const dateA = new Date(a.updated_at).getTime()
      const dateB = new Date(b.updated_at).getTime()
      return dateB - dateA
    })
  }

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchErr } = await supabase
        .from('notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (fetchErr) {
        throw fetchErr
      }

      setNotes(data || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch notes'
      setError(msg)
      console.error('Error fetching notes:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    let ignore = false

    const loadInitialNotes = async () => {
      if (!user) {
        setNotes([])
        setIsLoading(false)
        return
      }

      try {
        const { data, error: fetchErr } = await supabase
          .from('notes')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('updated_at', { ascending: false })

        if (!ignore) {
          if (fetchErr) {
            setError(fetchErr.message)
          } else {
            setNotes(data || [])
            setError(null)
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch notes'
          setError(msg)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadInitialNotes()
    return () => {
      ignore = true
    }
  }, [user])

  // Realtime subscription for notes
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`public:notes:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNote = payload.new as Note
            setNotes((prev) => {
              if (prev.some((n) => n.id === newNote.id)) return prev
              return sortNotes([newNote, ...prev])
            })
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Note
            setNotes((prev) =>
              sortNotes(prev.map((n) => (n.id === updated.id ? updated : n)))
            )
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old.id
            setNotes((prev) => prev.filter((n) => n.id !== oldId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Create note
  const createNote = useCallback(
    async (input?: CreateNoteInput): Promise<Note | null> => {
      if (!user) {
        setError('You must be signed in to create a note')
        return null
      }

      try {
        setError(null)
        setSaveStatus('saving')

        const newNoteData: NoteInsert = {
          user_id: user.id,
          title: input?.title ?? '',
          content: input?.content ?? '',
          category: input?.category ?? 'General',
          is_pinned: input?.is_pinned ?? false,
          tags: input?.tags ?? [],
        }

        const { data, error: insertErr } = await supabase
          .from('notes')
          .insert(newNoteData)
          .select()
          .single()

        if (insertErr) {
          throw insertErr
        }

        setSaveStatus('saved')
        // Optimistically insert and sort
        setNotes((prev) => {
          if (prev.some((n) => n.id === data.id)) return prev
          return sortNotes([data, ...prev])
        })

        return data
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create note'
        setError(msg)
        setSaveStatus('error')
        console.error('Error creating note:', err)
        return null
      }
    },
    [user]
  )

  // Direct Update Note
  const updateNote = useCallback(
    async (id: string, updates: Partial<NoteUpdate>): Promise<boolean> => {
      if (!user) return false

      try {
        setSaveStatus('saving')
        const now = new Date().toISOString()

        // Optimistic UI update
        setNotes((prev) =>
          sortNotes(
            prev.map((n) =>
              n.id === id ? { ...n, ...updates, updated_at: now } : n
            )
          )
        )

        const { error: updateErr } = await supabase
          .from('notes')
          .update(updates)
          .eq('id', id)

        if (updateErr) {
          throw updateErr
        }

        setSaveStatus('saved')
        return true
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update note'
        setError(msg)
        setSaveStatus('error')
        console.error('Error updating note:', err)
        return false
      }
    },
    [user]
  )

  // Flush any pending debounced save immediately
  const flushPendingSave = useCallback(async () => {
    if (pendingSaveRef.current) {
      const { id, updates, timer } = pendingSaveRef.current
      clearTimeout(timer)
      pendingSaveRef.current = null
      await updateNote(id, updates)
    }
  }, [updateNote])

  // Debounced auto-save (400-600ms default 500ms)
  const saveNoteDebounced = useCallback(
    (id: string, updates: Partial<NoteUpdate>, delayMs: number = 500) => {
      // Optimistically update local state immediately so inputs feel instant
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
      )
      setSaveStatus('saving')

      if (pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current.timer)
      }

      const timer = setTimeout(async () => {
        pendingSaveRef.current = null
        try {
          const { error: updateErr } = await supabase
            .from('notes')
            .update(updates)
            .eq('id', id)

          if (updateErr) throw updateErr
          setSaveStatus('saved')
        } catch (err: unknown) {
          console.error('Debounced save error:', err)
          setSaveStatus('error')
        }
      }, delayMs)

      pendingSaveRef.current = { id, updates, timer }
    },
    []
  )

  // Toggle Pin
  const togglePin = useCallback(
    async (id: string): Promise<boolean> => {
      const note = notes.find((n) => n.id === id)
      if (!note) return false
      return updateNote(id, { is_pinned: !note.is_pinned })
    },
    [notes, updateNote]
  )

  // Delete Note
  const deleteNote = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false

      // Cancel any pending save for this note
      if (pendingSaveRef.current?.id === id) {
        clearTimeout(pendingSaveRef.current.timer)
        pendingSaveRef.current = null
      }

      // Optimistic delete
      setNotes((prev) => prev.filter((n) => n.id !== id))

      try {
        const { error: delErr } = await supabase
          .from('notes')
          .delete()
          .eq('id', id)

        if (delErr) throw delErr
        return true
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete note'
        setError(msg)
        console.error('Error deleting note:', err)
        // Rollback by refetching
        fetchNotes()
        return false
      }
    },
    [user, fetchNotes]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current.timer)
      }
    }
  }, [])

  return {
    notes,
    isLoading,
    error,
    saveStatus,
    createNote,
    updateNote,
    saveNoteDebounced,
    flushPendingSave,
    deleteNote,
    togglePin,
    refetchNotes: fetchNotes,
  }
}
