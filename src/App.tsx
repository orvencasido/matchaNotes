import React from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'
import { VaultProvider } from '@/context/VaultContext'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/components/auth/LoginPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { ActiveViewContainer } from '@/components/views/ActiveViewContainer'
import { Loader2 } from 'lucide-react'

const MainContent: React.FC = () => {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#FBFBF9] text-[#19221C]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D4739] flex items-center justify-center text-[#FBFBF9] shadow-xs animate-pulse">
            <span className="font-semibold text-base">M</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#5C6861] mt-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D4739]" />
            <span>Establishing secure session...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <AppLayout>
      <ActiveViewContainer />
    </AppLayout>
  )
}

export function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <VaultProvider>
          <MainContent />
        </VaultProvider>
      </UIProvider>
    </AuthProvider>
  )
}

export default App
