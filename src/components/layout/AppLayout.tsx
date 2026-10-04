import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { useUI } from '@/hooks/useUI'

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { activeView } = useUI()
  const isNotesView = activeView === 'notes'

  return (
    <div className="h-dvh min-h-dvh w-full flex bg-[#FBFBF9] text-[#19221C] antialiased overflow-hidden select-text">
      {/* Desktop Navigation Rail */}
      <Sidebar />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Header scoped exclusively to Notes view */}
        {isNotesView && <Header />}

        {/* Main Scrollable View Area: Single scroll container with momentum scrolling and safe bottom clearance */}
        <main className="flex-1 overflow-y-auto overscroll-y-contain momentum-scroll pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0 focus:outline-none">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  )
}

