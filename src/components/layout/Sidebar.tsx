import React, { useState } from 'react'
import {
  FileText,
  CheckSquare,
  Image as ImageIcon,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Loader2,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUI } from '@/hooks/useUI'
import type { NavView } from '@/types/navigation'

interface NavItem {
  id: NavView
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'notes', label: 'All Notes', icon: FileText },
  { id: 'todos', label: 'To-Dos', icon: CheckSquare },
  { id: 'media', label: 'Media Gallery', icon: ImageIcon },
  { id: 'vault', label: 'Encrypted Vault', icon: Shield, badge: 'PIN' },
]

export const Sidebar: React.FC = () => {
  const { user, signOut } = useAuth()
  const { activeView, setActiveView, isSidebarCollapsed, toggleSidebar } = useUI()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  // Derive initial for profile avatar
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'M'

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 h-full bg-[#F4F3EE] border-r border-[#E4E3DC] transition-all duration-200 select-none ${
        isSidebarCollapsed ? 'w-18' : 'w-64'
      }`}
      aria-label="Sidebar navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#E4E3DC]/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#2D4739] text-[#FBFBF9] flex items-center justify-center font-medium text-sm shadow-xs shrink-0">
            <span>M</span>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm tracking-tight text-[#19221C] truncate">
                Matcha<span className="text-[#4E6E58] font-normal">Notes</span>
              </span>
              <span className="text-[10px] text-[#5C6861] tracking-wide uppercase font-mono">
                Personal Archive
              </span>
            </div>
          )}
        </div>

        {/* Collapse rail toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-[#5C6861] hover:text-[#19221C] hover:bg-[#E8EFE8]/70 transition-colors cursor-pointer"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-[#E8EFE8] text-[#23392D] shadow-xs'
                  : 'text-[#5C6861] hover:text-[#19221C] hover:bg-[#ECEAE3]/70'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              {/* Active vertical hairline pip */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#2D4739]" />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-[#2D4739]' : 'text-[#5C6861] group-hover:text-[#19221C]'
                }`}
              />

              {!isSidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'border-[#2D4739]/20 bg-[#2D4739]/10 text-[#23392D]'
                          : 'border-[#E4E3DC] bg-[#FBFBF9] text-[#5C6861]'
                      }`}
                    >
                      <Lock className="w-2.5 h-2.5" />
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[#E4E3DC]/70 bg-[#F4F3EE]">
        <div
          className={`flex items-center gap-2.5 ${
            isSidebarCollapsed ? 'justify-center flex-col' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-full bg-[#E8EFE8] border border-[#d2dfd2] text-[#2D4739] flex items-center justify-center font-medium text-xs shrink-0"
              title={user?.email || 'Authenticated User'}
            >
              {userInitial}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-[#19221C] truncate max-w-[125px]">
                  {user?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-[#5C6861] truncate max-w-[125px]">
                  {user?.email}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="p-1.5 rounded-md text-[#5C6861] hover:text-[#19221C] hover:bg-[#ECEAE3] transition-colors disabled:opacity-50 cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            {isSigningOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#2D4739]" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
