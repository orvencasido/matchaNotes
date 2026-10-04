import { createContext } from 'react'
import type { NavView, FilterCategory } from '@/types/navigation'

export interface UIContextType {
  activeView: NavView
  setActiveView: (view: NavView) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeFilter: FilterCategory
  setActiveFilter: (filter: FilterCategory) => void
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  headerActionTrigger: number
  triggerHeaderAction: () => void
}

export const UIContext = createContext<UIContextType | undefined>(undefined)
