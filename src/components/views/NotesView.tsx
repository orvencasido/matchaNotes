import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  FileText,
  Pin,
  Clock,
  Plus,
  Loader2,
  Tag,
  AlertCircle,
} from 'lucide-react'
import { useNotes } from '@/hooks/useNotes'
import { useUI } from '@/hooks/useUI'
import { NoteEditor } from '@/components/notes/NoteEditor'
import type { Note } from '@/types'

// Format date nicely
const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export const NotesView: React.FC = () => {
  const { searchQuery, activeFilter, headerActionTrigger } = useUI()
  const {
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
  } = useNotes()

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [mobileShowEditor, setMobileShowEditor] = useState<boolean>(false)

  // Track headerActionTrigger to create note when rapid add is clicked
  const lastActionTriggerRef = useRef(headerActionTrigger)

  // Clean note content preview (strip markdown symbols)
  const getCleanPreview = (content: string): string => {
    if (!content) return 'No additional text'
    return content
      .replace(/^#+\s+/gm, '') // Remove heading markers
      .replace(/^[-*]\s*\[[ xX]\]\s*/gm, '') // Remove checkbox markers
      .replace(/^[-*]\s+/gm, '') // Remove list markers
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '') // Remove images
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Flatten links
      .replace(/[*_`#]/g, '') // Remove styling chars
      .replace(/\n+/g, ' ') // Flatten newlines
      .trim()
  }

  // Filter notes based on searchQuery and activeFilter
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = note.title.toLowerCase().includes(q)
        const matchesContent = note.content.toLowerCase().includes(q)
        const matchesTags = note.tags?.some((t) => t.toLowerCase().includes(q))
        const matchesCategory = note.category?.toLowerCase().includes(q)

        if (!matchesTitle && !matchesContent && !matchesTags && !matchesCategory) {
          return false
        }
      }

      // 2. Category Filter
      if (activeFilter === 'all') return true
      if (activeFilter === 'pinned') return note.is_pinned

      const noteCat = (note.category || '').toLowerCase()
      const filterCat = activeFilter.toLowerCase()

      if (filterCat === 'to-do' || filterCat === 'todo') {
        return noteCat === 'to-do' || noteCat === 'todo'
      }

      return noteCat === filterCat
    })
  }, [notes, searchQuery, activeFilter])

  // Active selected note
  const selectedNote = useMemo(() => {
    if (selectedNoteId) {
      const found = notes.find((n) => n.id === selectedNoteId)
      if (found) return found
    }
    return filteredNotes[0] || null
  }, [notes, selectedNoteId, filteredNotes])

  // Create new note action
  const handleCreateNewNote = useCallback(
    async (categoryName?: string) => {
      await flushPendingSave()
      const newNote = await createNote({
        title: '',
        content: '',
        category:
          categoryName ||
          (activeFilter !== 'all' && activeFilter !== 'pinned' ? activeFilter : 'General'),
        tags: [],
      })
      if (newNote) {
        setSelectedNoteId(newNote.id)
        setMobileShowEditor(true)
      }
    },
    [flushPendingSave, createNote, activeFilter]
  )

  // Respond to rapid Add button in Header
  useEffect(() => {
    if (headerActionTrigger > lastActionTriggerRef.current) {
      lastActionTriggerRef.current = headerActionTrigger
      handleCreateNewNote()
    }
  }, [headerActionTrigger, handleCreateNewNote])

  const handleSelectNote = async (note: Note) => {
    await flushPendingSave()
    setSelectedNoteId(note.id)
    setMobileShowEditor(true)
  }

  const handleDelete = async (id: string) => {
    const success = await deleteNote(id)
    if (success) {
      if (selectedNoteId === id) {
        setSelectedNoteId(null)
        setMobileShowEditor(false)
      }
    }
    return success
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#FBFBF9] overflow-hidden">
      {/* 
        Notes List Pane:
        - Visible on desktop always.
        - On mobile, visible when mobileShowEditor is false.
      */}
      <div
        className={`w-full md:w-80 lg:w-96 md:shrink-0 border-b md:border-b-0 md:border-r border-[#E4E3DC] bg-[#FBFBF9] flex flex-col h-full ${
          mobileShowEditor ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Subheader summary bar */}
        <div className="px-4 py-3 border-b border-[#E4E3DC] flex items-center justify-between text-xs text-[#5C6861] shrink-0 bg-[#F4F3EE]/50">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#19221C]">
              {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            </span>
            {searchQuery && (
              <span className="text-[10px] text-[#8A968F] font-mono truncate max-w-[120px]">
                matching &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleCreateNewNote()}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#2D4739] hover:bg-[#23392D] text-[#FBFBF9] text-[11px] font-medium transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Note</span>
          </button>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Note List Scroll Container */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#E4E3DC]">
          {isLoading && notes.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-xs text-[#5C6861] gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#2D4739]" />
              <span>Loading your notes...</span>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5C6861] space-y-3">
              <p>No notes found.</p>
              <button
                type="button"
                onClick={() => handleCreateNewNote()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8EFE8] text-[#23392D] hover:bg-[#dbe7db] font-medium text-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create first note</span>
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = selectedNote?.id === note.id
              const preview = getCleanPreview(note.content)

              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => handleSelectNote(note)}
                  className={`w-full text-left p-3.5 sm:p-4 transition-colors cursor-pointer block relative ${
                    isSelected
                      ? 'bg-[#F4F3EE]'
                      : 'hover:bg-[#F4F3EE]/60 bg-[#FBFBF9]'
                  }`}
                >
                  {/* Selected active bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2D4739]" />
                  )}

                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs sm:text-sm text-[#19221C] truncate">
                      {note.title || 'Untitled Note'}
                    </span>
                    {note.is_pinned && (
                      <Pin className="w-3 h-3 text-[#4E6E58] shrink-0 fill-[#4E6E58]" />
                    )}
                  </div>

                  <p className="text-[11px] text-[#5C6861] line-clamp-2 leading-relaxed mb-2.5 font-sans">
                    {preview}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#8A968F]">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(note.updated_at)}
                    </span>

                    <div className="flex items-center gap-1">
                      {note.tags && note.tags.length > 0 && (
                        <span className="hidden sm:inline-flex items-center gap-0.5 text-[#5C6861]">
                          <Tag className="w-2.5 h-2.5" />
                          {note.tags[0]}
                          {note.tags.length > 1 && ` +${note.tags.length - 1}`}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-[#E8EFE8] text-[#23392D] font-medium">
                        {note.category || 'General'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 
        Editor Pane:
        - Visible on desktop always.
        - On mobile, visible when mobileShowEditor is true.
      */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden bg-[#FBFBF9] ${
          !mobileShowEditor ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            saveStatus={saveStatus}
            onSaveDebounced={saveNoteDebounced}
            onSaveImmediate={updateNote}
            onTogglePin={togglePin}
            onDeleteNote={handleDelete}
            onBack={() => setMobileShowEditor(false)}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center text-[#5C6861]">
            <div className="flex flex-col items-center gap-3 max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#F4F3EE] border border-[#E4E3DC] flex items-center justify-center text-[#4E6E58]">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm text-[#19221C]">No Note Selected</h3>
              <p className="text-xs text-[#5C6861]">
                Choose a note from the left pane or create a new entry to begin.
              </p>
              <button
                type="button"
                onClick={() => handleCreateNewNote()}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D4739] hover:bg-[#23392D] text-[#FBFBF9] text-xs font-medium transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Note</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
