import React, { useState, useEffect } from 'react'
import type { NavView, FilterCategory } from '@/types/navigation'
import { UIContext } from './ui-context-def'

const SIDEBAR_STORAGE_KEY = 'matcha_sidebar_collapsed'

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<NavView>('notes')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed))
    } catch {
      // Ignore localStorage access errors
    }
  }, [isSidebarCollapsed])

  const [headerActionTrigger, setHeaderActionTrigger] = useState<number>(0)

  const triggerHeaderAction = () => {
    setHeaderActionTrigger((prev) => prev + 1)
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev)
  }

  return (
    <UIContext.Provider
      value={{
        activeView,
        setActiveView,
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        headerActionTrigger,
        triggerHeaderAction,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}
