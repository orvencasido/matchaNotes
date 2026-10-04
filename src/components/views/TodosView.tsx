import React, { useState, useMemo, useRef, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Check,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  GripVertical,
} from 'lucide-react'
import { useNotes } from '@/hooks/useNotes'
import type { Note } from '@/types'

type TodoFilter = 'all' | 'pending' | 'completed'

// Helper to determine if a note is marked as completed
const isCompleted = (note: Note): boolean => {
  if (note.tags?.includes('completed')) return true
  if (note.content.startsWith('- [x]') || note.content === '[x]') return true
  return false
}

interface SortableTodoItemProps {
  note: Note
  onToggle: (note: Note) => void
  onDelete: (id: string) => void
}

const SortableTodoItem: React.FC<SortableTodoItemProps> = ({
  note,
  onToggle,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: note.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: undefined,
  }

  const completed = isCompleted(note)
  const displayTags = (note.tags || []).filter((t) => t !== 'completed')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2.5 sm:gap-3 p-3.5 hover:bg-[#F4F3EE]/50 group select-none ${
        isDragging
          ? 'z-30 shadow-md ring-1 ring-[#2D4739]/30 bg-[#F4F3EE] opacity-90 scale-[1.01] rounded-lg'
          : ''
      }`}
    >
      {/* Drag Handle on the left */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder task"
        className="p-0.5 text-[#8A968F] opacity-40 sm:opacity-0 group-hover:opacity-70 hover:opacity-100 hover:text-[#2D4739] transition-opacity cursor-grab active:cursor-grabbing touch-none shrink-0"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(note)}
        className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
          completed
            ? 'bg-[#2D4739] border-[#2D4739] text-[#FBFBF9]'
            : 'border-[#5C6861]/40 bg-[#FBFBF9] hover:border-[#2D4739]'
        }`}
        aria-label={completed ? 'Mark task incomplete' : 'Mark task complete'}
      >
        {completed && <Check className="w-3 h-3 stroke-[2.5]" />}
      </button>

      {/* Task Title */}
      <span
        onClick={() => onToggle(note)}
        className={`flex-1 text-xs sm:text-sm leading-relaxed cursor-pointer transition-colors ${
          completed
            ? 'line-through text-[#8A968F]'
            : 'text-[#19221C]'
        }`}
      >
        {note.title}
      </span>

      {/* Tags */}
      <div className="flex items-center gap-1.5 shrink-0">
        {displayTags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8EFE8] text-[#23392D]"
          >
            #{tag}
          </span>
        ))}

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          title="Delete task"
          className="p-1 rounded text-[#8A968F] hover:text-rose-600 hover:bg-rose-50 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export const TodosView: React.FC = () => {
  const {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    reorderNotes,
  } = useNotes()

  const [todoFilter, setTodoFilter] = useState<TodoFilter>('all')
  const [newText, setNewText] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('Task')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Extract todos: notes that have category === 'To-Do' OR tags include 'todo'
  const todoNotes = useMemo(() => {
    return notes.filter((n) => {
      const isTodoCategory =
        n.category.toLowerCase() === 'to-do' ||
        n.category.toLowerCase() === 'todo'
      const hasTodoTag = n.tags?.some((t) => t.toLowerCase() === 'todo')
      return isTodoCategory || hasTodoTag
    })
  }, [notes])

  // Handle toggling complete state
  const handleToggle = async (note: Note) => {
    const completed = isCompleted(note)
    const newCompleted = !completed

    let newTags = note.tags || []
    if (newCompleted) {
      if (!newTags.includes('completed')) {
        newTags = [...newTags, 'completed']
      }
    } else {
      newTags = newTags.filter((t) => t !== 'completed')
    }

    const newContent = newCompleted
      ? `- [x] ${note.title}`
      : `- [ ] ${note.title}`

    await updateNote(note.id, {
      tags: newTags,
      content: newContent,
    })
  }

  // Handle adding a new task
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newText.trim()
    if (!trimmed || isSubmitting) return

    try {
      setIsSubmitting(true)
      const tags = selectedTag ? [selectedTag] : ['Task']
      await createNote({
        title: trimmed,
        content: `- [ ] ${trimmed}`,
        category: 'To-Do',
        tags,
      })
      setNewText('')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter tasks based on status
  const filteredTodos = useMemo(() => {
    return todoNotes.filter((note) => {
      const completed = isCompleted(note)
      if (todoFilter === 'pending' && completed) return false
      if (todoFilter === 'completed' && !completed) return false
      return true
    })
  }, [todoNotes, todoFilter])

  const pendingCount = useMemo(
    () => todoNotes.filter((n) => !isCompleted(n)).length,
    [todoNotes]
  )

  const completedCount = useMemo(
    () => todoNotes.filter((n) => isCompleted(n)).length,
    [todoNotes]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      reorderNotes(String(active.id), String(over.id), filteredTodos)
    },
    [reorderNotes, filteredTodos]
  )

  const TAG_OPTIONS = ['Task', 'Work', 'Personal', 'Ideas', 'Urgent']

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 lg:px-10 pt-[max(1.5rem,calc(1.5rem+env(safe-area-inset-top,0px)))] sm:pt-8 lg:pt-10 pb-6 sm:pb-8 lg:pb-10 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E3DC] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#19221C] tracking-tight">
            To-Dos
          </h1>
          <p className="text-xs text-[#5C6861] mt-0.5 font-mono">
            {pendingCount} pending • {completedCount} completed
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#F4F3EE] p-0.5 rounded-lg border border-[#E4E3DC] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTodoFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              todoFilter === 'all'
                ? 'bg-[#FBFBF9] text-[#19221C] shadow-xs'
                : 'text-[#5C6861] hover:text-[#19221C]'
            }`}
          >
            All ({todoNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setTodoFilter('pending')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              todoFilter === 'pending'
                ? 'bg-[#FBFBF9] text-[#19221C] shadow-xs'
                : 'text-[#5C6861] hover:text-[#19221C]'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setTodoFilter('completed')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              todoFilter === 'completed'
                ? 'bg-[#FBFBF9] text-[#19221C] shadow-xs'
                : 'text-[#5C6861] hover:text-[#19221C]'
            }`}
          >
            Done ({completedCount})
          </button>
        </div>
      </div>

      {/* Fast Capture Bar */}
      <form
        onSubmit={handleAddTodo}
        className="bg-[#FBFBF9] border border-[#E4E3DC] focus-within:border-[#2D4739] focus-within:ring-1 focus-within:ring-[#2D4739]/30 rounded-xl p-2 sm:p-2.5 transition-all shadow-2xs space-y-2"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center text-[#8A968F] shrink-0 pl-1">
            <Circle className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="+ Add a task... (Press Enter to save)"
            className="flex-1 bg-transparent text-sm text-[#19221C] placeholder:text-[#8A968F] outline-none"
          />
          <button
            type="submit"
            disabled={!newText.trim() || isSubmitting}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2D4739] hover:bg-[#23392D] disabled:opacity-40 text-[#FBFBF9] text-xs font-medium transition cursor-pointer shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Add</span>
          </button>
        </div>

        {/* Tag selection pills for new task */}
        <div className="flex items-center gap-1.5 pl-7 pt-1 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-[#8A968F] font-mono shrink-0">Tag:</span>
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer shrink-0 ${
                selectedTag === tag
                  ? 'bg-[#2D4739] text-[#FBFBF9]'
                  : 'bg-[#F4F3EE] hover:bg-[#ECEAE3] text-[#5C6861]'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </form>

      {/* Task List */}
      <div className="border border-[#E4E3DC] rounded-xl overflow-hidden bg-[#FBFBF9] shadow-2xs">
        {isLoading && todoNotes.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5C6861] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#2D4739]" />
            <span>Loading tasks...</span>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#5C6861] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#8A968F]/60 mx-auto" />
            <p className="font-medium text-sm text-[#19221C]">
              {todoFilter === 'completed'
                ? 'No completed tasks yet.'
                : 'No pending tasks found.'}
            </p>
            <p className="text-[11px] text-[#8A968F]">
              Capture a task using the bar above.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTodos.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-[#E4E3DC]">
                {filteredTodos.map((note) => (
                  <SortableTodoItem
                    key={note.id}
                    note={note}
                    onToggle={handleToggle}
                    onDelete={deleteNote}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
