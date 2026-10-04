import React, { useState, useRef } from 'react'
import {
  Pin,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  CheckSquare,
  Heading,
  Bold,
  List,
  Eye,
  Edit3,
  ArrowLeft,
  X,
  Loader2,
} from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { LightboxModal } from './LightboxModal'
import { useMedia } from '@/hooks/useMedia'
import type { Note, NoteUpdate } from '@/types'
import type { SaveStatus } from '@/hooks/useNotes'

interface NoteEditorProps {
  note: Note
  saveStatus: SaveStatus
  onSaveDebounced: (id: string, updates: Partial<NoteUpdate>, delayMs?: number) => void
  onSaveImmediate: (id: string, updates: Partial<NoteUpdate>) => Promise<boolean>
  onTogglePin: (id: string) => Promise<boolean>
  onDeleteNote: (id: string) => Promise<boolean>
  onBack?: () => void
}

const CATEGORIES = ['General', 'Personal', 'Work', 'Ideas', 'To-Do']

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  saveStatus,
  onSaveDebounced,
  onSaveImmediate,
  onTogglePin,
  onDeleteNote,
  onBack,
}) => {
  // Local state for instant typing responsiveness
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [category, setCategory] = useState(note.category || 'General')
  const [tags, setTags] = useState<string[]>(note.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('write')
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [lightboxItem, setLightboxItem] = useState<{ url: string; title: string } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Attachments hook scoped to this note
  const {
    items: attachments,
    uploadMedia,
    deleteMedia,
    isUploading,
  } = useMedia({ noteId: note.id })

  // Handle Title changes
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    onSaveDebounced(note.id, { title: newTitle })
  }

  // Handle Content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onSaveDebounced(note.id, { content: newContent })
  }

  // Handle Category changes
  const handleCategorySelect = async (cat: string) => {
    setCategory(cat)
    await onSaveImmediate(note.id, { category: cat })
  }

  // Handle Tag addition
  const handleAddTag = async () => {
    const trimmed = tagInput.trim().replace(/^#/, '')
    if (!trimmed || tags.includes(trimmed)) {
      setTagInput('')
      return
    }

    const nextTags = [...tags, trimmed]
    setTags(nextTags)
    setTagInput('')
    await onSaveImmediate(note.id, { tags: nextTags })
  }

  // Handle Tag removal
  const handleRemoveTag = async (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove)
    setTags(nextTags)
    await onSaveImmediate(note.id, { tags: nextTags })
  }

  // Copy note text
  const handleCopyNote = async () => {
    const fullText = `${title ? `${title}\n\n` : ''}${content}`
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  // Formatting helpers in textarea
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.slice(start, end)
    const replacement = `${prefix}${selected || ''}${suffix}`

    const updated =
      content.slice(0, start) + replacement + content.slice(end)

    handleContentChange(updated)

    // Reset cursor after update
    setTimeout(() => {
      textarea.focus()
      const newCursor = start + prefix.length + (selected ? selected.length : 0)
      textarea.setSelectionRange(newCursor, newCursor)
    }, 10)
  }

  // Keydown handler in textarea for smart list / to-do continuation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = textareaRef.current
      if (!textarea) return

      const pos = textarea.selectionStart
      const textBefore = content.substring(0, pos)
      const currentLine = textBefore.split('\n').pop() || ''

      // Checklist continuation: - [ ] or - [x]
      const checklistMatch = currentLine.match(/^(\s*[-*]\s*\[[ xX]?\]\s*)(.*)$/)
      if (checklistMatch) {
        // If line is empty checklist, pressing Enter clears it
        if (!checklistMatch[2].trim()) {
          e.preventDefault()
          const startOfLine = pos - currentLine.length
          const updated =
            content.substring(0, startOfLine) + content.substring(pos)
          handleContentChange(updated)
          setTimeout(() => {
            textarea.setSelectionRange(startOfLine, startOfLine)
          }, 0)
          return
        }

        // Otherwise insert next checkbox
        e.preventDefault()
        const continuation = '\n- [ ] '
        const updated =
          content.substring(0, pos) + continuation + content.substring(pos)
        handleContentChange(updated)
        setTimeout(() => {
          const newPos = pos + continuation.length
          textarea.setSelectionRange(newPos, newPos)
        }, 0)
        return
      }

      // Bullet continuation: - or *
      const bulletMatch = currentLine.match(/^(\s*[-*]\s+)(.*)$/)
      if (bulletMatch) {
        if (!bulletMatch[2].trim()) {
          e.preventDefault()
          const startOfLine = pos - currentLine.length
          const updated =
            content.substring(0, startOfLine) + content.substring(pos)
          handleContentChange(updated)
          setTimeout(() => {
            textarea.setSelectionRange(startOfLine, startOfLine)
          }, 0)
          return
        }

        e.preventDefault()
        const continuation = '\n- '
        const updated =
          content.substring(0, pos) + continuation + content.substring(pos)
        handleContentChange(updated)
        setTimeout(() => {
          const newPos = pos + continuation.length
          textarea.setSelectionRange(newPos, newPos)
        }, 0)
      }
    }
  }

  // File Upload Handling
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uploaded = await uploadMedia(file, note.id)
      if (uploaded && uploaded.signedUrl) {
        // Automatically insert markdown reference at the end of the note
        const imgMd = `\n\n![${uploaded.fileName}](${uploaded.signedUrl})\n`
        handleContentChange(content + imgMd)
      }
    }
  }

  // Drag and drop handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileUpload(e.dataTransfer.files)
    }
  }

  // Last-saved status indicator text
  const renderStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 text-[11px] text-[#5C6861] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Saving...
          </span>
        )
      case 'saved':
        return (
          <span className="flex items-center gap-1.5 text-[11px] text-[#2D4739] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4E6E58]" />
            Saved
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-[11px] text-rose-600 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Save error
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 text-[11px] text-[#8A968F] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A968F]/60" />
            Ready
          </span>
        )
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-full flex flex-col bg-[#FBFBF9] relative ${
        isDragging ? 'ring-2 ring-inset ring-[#2D4739] bg-[#E8EFE8]/20' : ''
      }`}
    >
      {/* Drag overlay notice */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#FBFBF9]/90 z-30 flex flex-col items-center justify-center pointer-events-none gap-2">
          <div className="w-12 h-12 rounded-2xl bg-[#E8EFE8] flex items-center justify-center text-[#2D4739]">
            <ImageIcon className="w-6 h-6 animate-bounce" />
          </div>
          <span className="text-sm font-semibold text-[#19221C]">Drop photos to attach</span>
          <span className="text-xs text-[#5C6861]">Uploads to secure note storage</span>
        </div>
      )}

      {/* Top Action Bar */}
      <header className="shrink-0 border-b border-[#E4E3DC] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 bg-[#FBFBF9]/80 backdrop-blur-xs select-none">
        {/* Left: Mobile Back button & Save Status */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-[#5C6861] hover:text-[#19221C] hover:bg-[#F4F3EE] rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
              aria-label="Back to notes list"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Notes</span>
            </button>
          )}

          <div className="hidden sm:block">{renderStatus()}</div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="sm:hidden mr-1">{renderStatus()}</div>

          {/* Pin toggle */}
          <button
            type="button"
            onClick={() => onTogglePin(note.id)}
            title={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              note.is_pinned
                ? 'bg-[#E8EFE8] text-[#23392D]'
                : 'text-[#5C6861] hover:text-[#19221C] hover:bg-[#F4F3EE]'
            }`}
          >
            <Pin
              className={`w-3.5 h-3.5 ${
                note.is_pinned ? 'fill-[#23392D]' : ''
              }`}
            />
          </button>

          {/* Copy note */}
          <button
            type="button"
            onClick={handleCopyNote}
            title="Copy note text"
            className="p-2 rounded-lg text-[#5C6861] hover:text-[#19221C] hover:bg-[#F4F3EE] transition-all cursor-pointer relative"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#2D4739]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Delete note */}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1 bg-[#F4F3EE] p-0.5 rounded-lg border border-[#E4E3DC]">
              <span className="text-[10px] text-[#5C6861] px-1 font-medium hidden sm:inline">
                Delete?
              </span>
              <button
                type="button"
                onClick={() => onDeleteNote(note.id)}
                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-medium transition cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-1.5 py-1 rounded text-[#5C6861] hover:text-[#19221C] text-[10px] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete note"
              className="p-2 rounded-lg text-[#5C6861] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Editor Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 max-w-3xl w-full mx-auto space-y-4">
        {/* Category Pill Selection */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES.map((cat) => {
            const isSelected = category.toLowerCase() === cat.toLowerCase()
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#2D4739] text-[#FBFBF9] shadow-xs'
                    : 'bg-[#F4F3EE] hover:bg-[#ECEAE3] text-[#5C6861] hover:text-[#19221C] border border-[#E4E3DC]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Note Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled Note"
          className="w-full text-xl sm:text-2xl font-bold text-[#19221C] placeholder:text-[#8A968F]/60 bg-transparent border-none outline-none tracking-tight"
        />

        {/* Tags Section */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8EFE8] text-[#23392D] font-mono text-[11px]"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-[#23392D]/60 hover:text-[#23392D] transition-colors cursor-pointer"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <div className="inline-flex items-center gap-1 bg-[#F4F3EE] border border-[#E4E3DC] rounded-md px-2 py-0.5">
            <span className="text-[#8A968F] text-[11px] font-mono">#</span>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              onBlur={handleAddTag}
              placeholder="add tag..."
              className="w-16 sm:w-20 bg-transparent outline-none text-[11px] text-[#19221C] placeholder:text-[#8A968F]"
            />
          </div>
        </div>

        {/* Editor Toolbar */}
        <div className="flex items-center justify-between border-y border-[#E4E3DC] py-1.5 select-none text-[#5C6861]">
          {/* Quick Markdown Inserts */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormatting('- [ ] ')}
              title="Add checklist item (- [ ])"
              className="p-1.5 rounded hover:bg-[#F4F3EE] hover:text-[#19221C] transition cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('## ')}
              title="Heading 2 (##)"
              className="p-1.5 rounded hover:bg-[#F4F3EE] hover:text-[#19221C] transition cursor-pointer"
            >
              <Heading className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              title="Bold (**text**)"
              className="p-1.5 rounded hover:bg-[#F4F3EE] hover:text-[#19221C] transition cursor-pointer"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('- ')}
              title="Bullet list (-)"
              className="p-1.5 rounded hover:bg-[#F4F3EE] hover:text-[#19221C] transition cursor-pointer"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Attach photo / image"
              className="p-1.5 rounded hover:bg-[#F4F3EE] hover:text-[#19221C] transition cursor-pointer flex items-center gap-1"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D4739]" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Edit / Preview Toggle */}
          <div className="flex items-center gap-1 bg-[#F4F3EE] p-0.5 rounded-lg border border-[#E4E3DC]">
            <button
              type="button"
              onClick={() => setViewMode('write')}
              className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'write'
                  ? 'bg-[#FBFBF9] text-[#19221C] shadow-xs'
                  : 'text-[#5C6861] hover:text-[#19221C]'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'preview'
                  ? 'bg-[#FBFBF9] text-[#19221C] shadow-xs'
                  : 'text-[#5C6861] hover:text-[#19221C]'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Note Body Area */}
        <div className="min-h-[300px]">
          {viewMode === 'write' ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your Notes here... "
              rows={16}
              className="w-full bg-transparent text-sm text-[#19221C] placeholder:text-[#8A968F]/60 border-none outline-none resize-none leading-relaxed font-sans"
            />
          ) : (
            <div className="py-2">
              <MarkdownRenderer
                content={content}
                onContentChange={(updated) => handleContentChange(updated)}
                onImageClick={(src, alt) => setLightboxItem({ url: src, title: alt })}
              />
            </div>
          )}
        </div>

        {/* Attached Media Previews */}
        {attachments.length > 0 && (
          <div className="pt-6 border-t border-[#E4E3DC] space-y-2">
            <h4 className="text-xs font-medium text-[#5C6861] uppercase tracking-wider font-mono">
              Attachments ({attachments.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group relative rounded-lg border border-[#E4E3DC] bg-[#F4F3EE] overflow-hidden aspect-video cursor-pointer"
                  onClick={() =>
                    setLightboxItem({
                      url: att.signedUrl,
                      title: att.fileName,
                    })
                  }
                >
                  {att.signedUrl ? (
                    <img
                      src={att.signedUrl}
                      alt={att.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8A968F]">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5">
                    <span className="text-[10px] text-white truncate max-w-[80%] font-mono">
                      {att.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMedia(att.id, att.storage_path)
                      }}
                      className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white transition cursor-pointer"
                      title="Delete attachment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <LightboxModal
          isOpen={true}
          imageUrl={lightboxItem.url}
          title={lightboxItem.title}
          onClose={() => setLightboxItem(null)}
        />
      )}
    </div>
  )
}
