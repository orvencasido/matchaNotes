import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Plus } from 'lucide-react'
import { useUI } from '@/hooks/useUI'
import type { FilterCategory, NavView } from '@/types/navigation'

interface FilterOption {
  id: FilterCategory
  label: string
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'personal', label: 'Personal' },
  { id: 'work', label: 'Work' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'to-do', label: 'To-Do' },
]

export const Header: React.FC = () => {
  const {
    activeView,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    triggerHeaderAction,
  } = useUI()

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  const getViewTitle = (view: NavView): string => {
    switch (view) {
      case 'notes':
        return 'Notes'
      case 'todos':
        return 'To-Dos'
      case 'media':
        return 'Media'
      case 'vault':
        return 'Vault'
      default:
        return 'MatchaNotes'
    }
  }

  const getActionLabel = () => {
    switch (activeView) {
      case 'todos':
        return 'New Task'
      case 'media':
        return 'Upload'
      case 'vault':
        return 'New Item'
      case 'notes':
      default:
        return 'New Note'
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    if (isMobileSearchOpen) {
      mobileSearchInputRef.current?.focus()
    } else {
      searchInputRef.current?.focus()
    }
  }

  const handleOpenMobileSearch = () => {
    setIsMobileSearchOpen(true)
  }

  const handleCloseMobileSearch = () => {
    setIsMobileSearchOpen(false)
    setSearchQuery('')
  }

  // Auto-focus mobile search input when opened
  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileSearchInputRef.current?.focus()
    }
  }, [isMobileSearchOpen])

  return (
    <header className="shrink-0 border-b border-[#E4E3DC] px-3 sm:px-4 lg:px-6 bg-[#FBFBF9]/95 backdrop-blur-md flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-20 select-none pt-[env(safe-area-inset-top,0px)] h-[calc(4rem+env(safe-area-inset-top,0px))]">
      {/* Mobile Search Expanded View */}
      {isMobileSearchOpen ? (
        <div className="flex lg:hidden items-center w-full gap-2 animate-in fade-in duration-150">
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-[#5C6861] absolute left-3 pointer-events-none" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${getViewTitle(activeView).toLowerCase()}...`}
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-[#F4F3EE] text-[#19221C] placeholder:text-[#8A968F] rounded-xl border border-[#E4E3DC] focus:border-[#2D4739] focus:bg-[#FBFBF9] focus:ring-1 focus:ring-[#2D4739]/30 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 p-1.5 text-[#5C6861] hover:text-[#19221C] rounded-lg transition cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleCloseMobileSearch}
            className="min-h-[44px] px-3 text-xs font-medium text-[#5C6861] hover:text-[#19221C] rounded-lg transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Cancel search"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Brand & Active View Title */}
          <div className="flex items-center gap-2.5 lg:hidden min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#2D4739] text-[#FBFBF9] flex items-center justify-center font-medium text-sm shadow-xs shrink-0">
              <span>M</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm tracking-tight text-[#19221C] truncate leading-tight">
                {getViewTitle(activeView)}
              </span>
              <span className="text-[10px] text-[#5C6861] leading-none tracking-tight">
                MatchaNotes
              </span>
            </div>
          </div>

          {/* Desktop Search Input Bar */}
          <div className="hidden lg:block flex-1 max-w-sm relative">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#5C6861] absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-[#F4F3EE] hover:bg-[#ECEAE3]/70 focus:bg-[#FBFBF9] text-[#19221C] placeholder:text-[#8A968F] rounded-lg border border-[#E4E3DC] focus:border-[#2D4739] focus:ring-1 focus:ring-[#2D4739]/30 transition-all outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 p-0.5 text-[#5C6861] hover:text-[#19221C] rounded transition cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block absolute right-2.5 font-mono text-[9px] text-[#8A968F] bg-[#EAE8DF] px-1.5 py-0.5 rounded border border-[#DDDCD4]">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Category / Tag Filter Pills (Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter.id
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer min-h-[32px] flex items-center ${
                    isActive
                      ? 'bg-[#2D4739] text-[#FBFBF9] shadow-xs'
                      : 'bg-[#F4F3EE] hover:bg-[#ECEAE3] text-[#5C6861] hover:text-[#19221C] border border-[#E4E3DC]'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>

          {/* Action Bar (Right side): Search Trigger & Rapid Add Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={handleOpenMobileSearch}
              className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#5C6861] hover:text-[#19221C] hover:bg-[#F4F3EE] active:scale-95 transition-all cursor-pointer relative"
              aria-label="Open search bar"
            >
              <Search className="w-4 h-4" />
              {searchQuery && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#2D4739]" />
              )}
            </button>

            {/* Rapid Add Button (Mobile: 44x44 icon button; Desktop: Pill button with label) */}
            <button
              type="button"
              onClick={triggerHeaderAction}
              className="min-w-[44px] min-h-[44px] px-3 rounded-xl lg:rounded-lg bg-[#2D4739] hover:bg-[#23392D] active:scale-95 text-[#FBFBF9] text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              aria-label={getActionLabel()}
              title={getActionLabel()}
            >
              <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{getActionLabel()}</span>
            </button>
          </div>
        </>
      )}
    </header>
  )
}
