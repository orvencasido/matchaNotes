import React from 'react'
import { FileText, CheckSquare, Image as ImageIcon, Shield } from 'lucide-react'
import { useUI } from '@/hooks/useUI'
import type { NavView } from '@/types/navigation'

interface MobileNavItem {
  id: NavView
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const MOBILE_ITEMS: MobileNavItem[] = [
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'todos', label: 'To-Dos', icon: CheckSquare },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'vault', label: 'Vault', icon: Shield },
]

export const MobileNav: React.FC = () => {
  const { activeView, setActiveView } = useUI()

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 bg-[#FBFBF9]/95 backdrop-blur-md border-t border-[#E4E3DC] z-30 px-2 pt-1.5 pb-[max(0.5rem,calc(0.5rem+env(safe-area-inset-bottom,0px)))] flex items-center justify-around select-none shadow-[0_-4px_16px_rgba(0,0,0,0.02)]"
      aria-label="Mobile navigation"
      role="tablist"
    >
      {MOBILE_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeView === item.id

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={item.label}
            onClick={() => setActiveView(item.id)}
            className={`flex-1 min-h-[48px] min-w-[48px] py-1 px-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-90 ${
              isActive
                ? 'text-[#2D4739]'
                : 'text-[#5C6861] hover:text-[#19221C] hover:bg-[#F4F3EE]/60'
            }`}
          >
            <div
              className={`w-9 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${
                isActive
                  ? 'bg-[#E8EFE8] text-[#2D4739] shadow-xs'
                  : 'text-[#5C6861]'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span
              className={`text-[10px] tracking-tight leading-none ${
                isActive ? 'font-semibold text-[#2D4739]' : 'font-medium text-[#5C6861]'
              }`}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
