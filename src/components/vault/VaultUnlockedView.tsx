import React, { useState, useMemo, useCallback } from 'react'
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
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  Search,
  Plus,
  Lock,
  Shield,
  KeyRound,
  X,
  ShieldAlert,
  Folder,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
} from 'lucide-react'
import { useVault } from '@/hooks/useVault'
import { VaultCard } from './VaultCard'
import { VaultItemModal } from './VaultItemModal'
import { PasswordGeneratorModal } from './PasswordGeneratorModal'
import type {
  DecryptedVaultItem,
  VaultCategory,
  CreateVaultItemInput,
  UpdateVaultItemInput,
} from '@/types'

type FilterOption = 'All' | VaultCategory

const FILTER_PILLS: FilterOption[] = ['All', 'Accounts', 'Passwords', 'Cards', 'Notes']

export const VaultUnlockedView: React.FC = () => {
  const {
    items,
    lockVault,
    createVaultItem,
    updateVaultItem,
    deleteVaultItem,
    reorderVaultItems,
    isActionLoading,
    error,
    clearError,
  } = useVault()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DecryptedVaultItem | null>(null)
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)

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

  // Filter & search logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (activeFilter !== 'All') {
        const itemCat = item.category.toLowerCase()
        const filterCat = activeFilter.toLowerCase()
        if (
          itemCat !== filterCat &&
          itemCat !== filterCat.slice(0, -1) &&
          `${itemCat}s` !== filterCat
        ) {
          return false
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchTitle = item.title.toLowerCase().includes(query)
        const matchUsername = item.payload.username?.toLowerCase().includes(query)
        const matchNotes = item.payload.notes?.toLowerCase().includes(query)
        const matchUrl = item.payload.url?.toLowerCase().includes(query)
        const matchCardHolder = item.payload.cardHolder?.toLowerCase().includes(query)
        const matchGroup = item.payload.group?.toLowerCase().includes(query)
        return (
          matchTitle ||
          Boolean(matchUsername) ||
          Boolean(matchNotes) ||
          Boolean(matchUrl) ||
          Boolean(matchCardHolder) ||
          Boolean(matchGroup)
        )
      }

      return true
    })
  }, [items, activeFilter, searchQuery])

  // Group items by group name (defaulting to "General" if not set)
  const groupedItems = useMemo(() => {
    const map = new Map<string, DecryptedVaultItem[]>()
    for (const item of filteredItems) {
      const groupName = item.payload?.group?.trim() || 'General'
      const list = map.get(groupName) || []
      list.push(item)
      map.set(groupName, list)
    }

    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      if (a === 'General') return 1
      if (b === 'General') return -1
      return a.localeCompare(b, undefined, { sensitivity: 'base' })
    })

    return sortedKeys.map((key) => ({
      group: key,
      items: map.get(key)!,
    }))
  }, [filteredItems])

  const allGroupNames = useMemo(() => groupedItems.map((g) => g.group), [groupedItems])
  const isSearching = Boolean(searchQuery.trim())

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  const areAllCollapsed =
    allGroupNames.length > 0 && allGroupNames.every((name) => collapsedGroups.has(name))

  const handleToggleAllGroups = () => {
    if (areAllCollapsed) {
      setCollapsedGroups(new Set())
    } else {
      setCollapsedGroups(new Set(allGroupNames))
    }
  }

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: items.length,
      Accounts: 0,
      Passwords: 0,
      Cards: 0,
      Notes: 0,
    }
    for (const it of items) {
      const cat = it.category
      if (counts[cat] !== undefined) {
        counts[cat]++
      } else {
        // Singular to plural normalization
        const plural = `${cat}s`
        if (counts[plural] !== undefined) {
          counts[plural]++
        }
      }
    }
    return counts
  }, [items])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setIsItemModalOpen(true)
  }

  const handleOpenEdit = (item: DecryptedVaultItem) => {
    setEditingItem(item)
    setIsItemModalOpen(true)
  }

  const handleSaveItem = async (
    data: CreateVaultItemInput | { id: string; updates: UpdateVaultItemInput }
  ): Promise<boolean> => {
    if ('id' in data) {
      return await updateVaultItem(data.id, data.updates)
    } else {
      const res = await createVaultItem(data)
      return res !== null
    }
  }

  const handleDeleteItem = async (id: string) => {
    await deleteVaultItem(id)
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const matchingGroup = groupedItems.find(
        (g) => g.items.some((i) => i.id === active.id) && g.items.some((i) => i.id === over.id)
      )

      if (matchingGroup) {
        reorderVaultItems(String(active.id), String(over.id), matchingGroup.items)
      } else {
        reorderVaultItems(String(active.id), String(over.id), filteredItems)
      }
    },
    [groupedItems, reorderVaultItems, filteredItems]
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[max(1.5rem,calc(1.5rem+env(safe-area-inset-top,0px)))] sm:pt-6 lg:pt-8 pb-6 sm:pb-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4E3DC]">
        {/* Title & Security Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8EFE8] border border-[#d2dfd2] text-[#2D4739] flex items-center justify-center shadow-2xs shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#19221C] tracking-tight">
                Secure Vault
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8EFE8] text-[#23392D] text-[10px] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Decrypted (Memory)</span>
              </span>
            </div>
            <p className="text-xs text-[#5C6861] mt-0.5">
              Zero-knowledge vault • Auto-locks after 3 min idle or tab switch
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Top-level Expand / Collapse All Toggle */}
          {allGroupNames.length > 0 && (
            <button
              type="button"
              onClick={handleToggleAllGroups}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F4F3EE] hover:bg-[#ECEAE3] text-[#19221C] text-xs font-medium border border-[#E4E3DC] transition-all cursor-pointer shadow-2xs active:scale-95"
              title={areAllCollapsed ? 'Expand all sections' : 'Collapse all sections'}
            >
              {areAllCollapsed ? (
                <>
                  <ChevronsDown className="w-3.5 h-3.5 text-[#2D4739]" />
                  <span>Expand All</span>
                </>
              ) : (
                <>
                  <ChevronsUp className="w-3.5 h-3.5 text-[#2D4739]" />
                  <span>Collapse All</span>
                </>
              )}
            </button>
          )}

          {/* Generator Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsGeneratorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F4F3EE] hover:bg-[#ECEAE3] text-[#19221C] text-xs font-medium border border-[#E4E3DC] transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Generate secure random password"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#2D4739]" />
            <span>Generate Password</span>
          </button>

          {/* + New Item Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D4739] hover:bg-[#23392D] text-[#FBFBF9] text-xs font-medium shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Item</span>
          </button>

          {/* Tactile Lock Vault Button */}
          <button
            type="button"
            onClick={lockVault}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-medium border border-rose-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Wipe keys and lock immediately"
          >
            <Lock className="w-3.5 h-3.5 text-rose-700" />
            <span>Lock Vault</span>
          </button>
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="p-1 rounded text-rose-600 hover:text-rose-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Row: Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A968F]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, usernames, notes, groups..."
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] text-[#19221C] placeholder-[#8A968F] focus:outline-none focus:border-[#2D4739] focus:bg-[#FBFBF9] transition-all text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A968F] hover:text-[#19221C]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {FILTER_PILLS.map((pill) => {
            const count = categoryCounts[pill] || 0
            const isActive = activeFilter === pill
            return (
              <button
                key={pill}
                type="button"
                onClick={() => setActiveFilter(pill)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2D4739] text-[#FBFBF9] shadow-2xs'
                    : 'bg-[#F4F3EE] text-[#5C6861] hover:bg-[#ECEAE3] hover:text-[#19221C] border border-[#E4E3DC]'
                }`}
              >
                <span>{pill}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#3C5D4B] text-[#FBFBF9]' : 'bg-[#E4E3DC] text-[#5C6861]'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grouped Items List */}
      {groupedItems.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-5">
            {groupedItems.map(({ group, items: groupItems }) => {
              const isCollapsed = !isSearching && collapsedGroups.has(group)

              return (
                <section
                  key={group}
                  className="rounded-2xl border border-[#E4E3DC] bg-[#FBFBF9] shadow-2xs overflow-hidden transition-all duration-200"
                >
                  {/* Section Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(group)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#F4F3EE]/70 hover:bg-[#ECEAE3] transition-colors text-left cursor-pointer select-none border-b border-transparent data-[expanded=true]:border-[#E4E3DC]"
                    data-expanded={!isCollapsed}
                    aria-expanded={!isCollapsed}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-[#E8EFE8] text-[#2D4739] flex items-center justify-center shrink-0">
                        <Folder className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#19221C] truncate tracking-tight">
                        {group}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#E4E3DC] text-[#5C6861] text-[10px] font-mono font-medium shrink-0">
                        {groupItems.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#5C6861]">
                      <span className="text-[11px] font-medium hidden sm:inline">
                        {isCollapsed ? 'Expand' : 'Collapse'}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-[#5C6861]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#5C6861]" />
                      )}
                    </div>
                  </button>

                  {/* Section Body */}
                  {!isCollapsed && (
                    <div className="p-4 bg-[#FBFBF9] animate-fadeIn">
                      <SortableContext
                        items={groupItems.map((i) => i.id)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupItems.map((item) => (
                            <VaultCard
                              key={item.id}
                              item={item}
                              onEdit={handleOpenEdit}
                              onDelete={handleDeleteItem}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        </DndContext>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#F4F3EE]/50 border border-dashed border-[#E4E3DC] my-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E8EFE8] text-[#2D4739] flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[#19221C]">
            {searchQuery || activeFilter !== 'All'
              ? 'No matching vault items'
              : 'Vault is empty'}
          </h3>
          <p className="text-xs text-[#5C6861] mt-1 max-w-sm">
            {searchQuery || activeFilter !== 'All'
              ? 'Try changing your search term or selecting a different category filter.'
              : 'Securely store your sensitive login credentials, recovery phrases, and cards with client-side encryption.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D4739] hover:bg-[#23392D] text-[#FBFBF9] text-xs font-medium shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Vault Item</span>
          </button>
        </div>
      )}

      {/* Item Modal (Create / Edit) */}
      <VaultItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false)
          setEditingItem(null)
        }}
        onSave={handleSaveItem}
        initialItem={editingItem}
        isLoading={isActionLoading}
        existingGroups={allGroupNames.filter((g) => g !== 'General')}
      />

      {/* Dedicated Standalone Password Generator Modal */}
      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
      />
    </div>
  )
}
