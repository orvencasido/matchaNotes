import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { NoteAttachment } from '@/types'

export interface MediaItem extends NoteAttachment {
  signedUrl: string
  fileName: string
}

export interface UseMediaOptions {
  noteId?: string | null
  autoFetch?: boolean
}

export interface UseMediaReturn {
  items: MediaItem[]
  isLoading: boolean
  isUploading: boolean
  error: string | null
  uploadMedia: (file: File, targetNoteId?: string | null) => Promise<MediaItem | null>
  deleteMedia: (id: string, storagePath: string) => Promise<boolean>
  refetchMedia: () => Promise<void>
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]

export function useMedia(options?: UseMediaOptions): UseMediaReturn {
  const { user } = useAuth()
  const noteId = options?.noteId
  const autoFetch = options?.autoFetch ?? true

  const [items, setItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const extractFileName = (storagePath: string): string => {
    const parts = storagePath.split('/')
    const raw = parts[parts.length - 1] || 'attachment'
    // Remove timestamp prefix like 1728000000000-
    return raw.replace(/^\d+[-_]/, '')
  }

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('note_attachments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (noteId !== undefined) {
        if (noteId === null) {
          query = query.is('note_id', null)
        } else {
          query = query.eq('note_id', noteId)
        }
      }

      const { data, error: fetchErr } = await query

      if (fetchErr) throw fetchErr

      if (!data || data.length === 0) {
        setItems([])
        return
      }

      // Generate signed URLs in batch (24h expiry)
      const paths = data.map((item) => item.storage_path)
      const { data: signedData, error: signedErr } = await supabase.storage
        .from('note-media')
        .createSignedUrls(paths, 86400)

      if (signedErr) {
        console.warn('Error generating signed URLs:', signedErr)
      }

      const signedUrlMap = new Map<string, string>()
      if (signedData) {
        signedData.forEach((item) => {
          if (item.signedUrl && item.path) {
            signedUrlMap.set(item.path, item.signedUrl)
          }
        })
      }

      const mediaItems: MediaItem[] = data.map((attachment) => ({
        ...attachment,
        signedUrl: signedUrlMap.get(attachment.storage_path) || '',
        fileName: extractFileName(attachment.storage_path),
      }))

      setItems(mediaItems)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch media attachments'
      setError(msg)
      console.error('Error fetching media:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user, noteId])

  useEffect(() => {
    if (!autoFetch) return
    let ignore = false

    const loadInitialMedia = async () => {
      if (!user) {
        setItems([])
        setIsLoading(false)
        return
      }

      try {
        let query = supabase
          .from('note_attachments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (noteId !== undefined) {
          if (noteId === null) {
            query = query.is('note_id', null)
          } else {
            query = query.eq('note_id', noteId)
          }
        }

        const { data, error: fetchErr } = await query

        if (fetchErr) throw fetchErr

        if (!data || data.length === 0) {
          if (!ignore) setItems([])
          return
        }

        // Generate signed URLs in batch (24h expiry)
        const paths = data.map((item) => item.storage_path)
        const { data: signedData } = await supabase.storage
          .from('note-media')
          .createSignedUrls(paths, 86400)

        const signedUrlMap = new Map<string, string>()
        if (signedData) {
          signedData.forEach((item) => {
            if (item.signedUrl && item.path) {
              signedUrlMap.set(item.path, item.signedUrl)
            }
          })
        }

        const mediaItems: MediaItem[] = data.map((attachment) => ({
          ...attachment,
          signedUrl: signedUrlMap.get(attachment.storage_path) || '',
          fileName: extractFileName(attachment.storage_path),
        }))

        if (!ignore) {
          setItems(mediaItems)
          setError(null)
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch media attachments'
          setError(msg)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadInitialMedia()
    return () => {
      ignore = true
    }
  }, [user, noteId, autoFetch])

  const uploadMedia = useCallback(
    async (file: File, targetNoteId?: string | null): Promise<MediaItem | null> => {
      if (!user) {
        setError('Must be signed in to upload')
        return null
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
        setError(`File size (${sizeMb} MB) exceeds maximum allowed limit of 50 MB`)
        return null
      }

      if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
        setError(`Unsupported file type: ${file.type}. Allowed: JPG, PNG, GIF, WebP, SVG, PDF`)
        return null
      }

      try {
        setIsUploading(true)
        setError(null)

        // Clean filename
        const cleanName = file.name
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .toLowerCase()
        const resolvedNoteId = targetNoteId !== undefined ? targetNoteId : noteId ?? null
        const subfolder = resolvedNoteId ? `note_${resolvedNoteId}` : 'gallery'
        const storagePath = `${user.id}/${subfolder}/${Date.now()}-${cleanName}`

        // 1. Upload to storage bucket
        const { error: uploadErr } = await supabase.storage
          .from('note-media')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream',
          })

        if (uploadErr) {
          throw uploadErr
        }

        // 2. Insert into note_attachments
        const { data: attachmentRow, error: insertErr } = await supabase
          .from('note_attachments')
          .insert({
            user_id: user.id,
            note_id: resolvedNoteId,
            storage_path: storagePath,
            mime_type: file.type || null,
            size_bytes: file.size,
          })
          .select()
          .single()

        if (insertErr) {
          // Attempt rollback from storage if table insert failed
          await supabase.storage.from('note-media').remove([storagePath])
          throw insertErr
        }

        // 3. Get signed URL for immediate preview
        const { data: signedData, error: signErr } = await supabase.storage
          .from('note-media')
          .createSignedUrl(storagePath, 86400)

        const signedUrl = signErr ? '' : signedData?.signedUrl || ''

        const newMediaItem: MediaItem = {
          ...attachmentRow,
          signedUrl,
          fileName: extractFileName(storagePath),
        }

        setItems((prev) => [newMediaItem, ...prev])
        return newMediaItem
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setError(msg)
        console.error('Error uploading media:', err)
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [user, noteId]
  )

  const deleteMedia = useCallback(
    async (id: string, storagePath: string): Promise<boolean> => {
      if (!user) return false

      try {
        setError(null)
        // Optimistic delete
        setItems((prev) => prev.filter((item) => item.id !== id))

        // 1. Delete from database
        const { error: dbErr } = await supabase
          .from('note_attachments')
          .delete()
          .eq('id', id)

        if (dbErr) throw dbErr

        // 2. Delete from storage
        const { error: storageErr } = await supabase.storage
          .from('note-media')
          .remove([storagePath])

        if (storageErr) {
          console.warn('Storage removal warning:', storageErr)
        }

        return true
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete attachment'
        setError(msg)
        console.error('Error deleting media:', err)
        fetchItems()
        return false
      }
    },
    [user, fetchItems]
  )

  return {
    items,
    isLoading,
    isUploading,
    error,
    uploadMedia,
    deleteMedia,
    refetchMedia: fetchItems,
  }
}
