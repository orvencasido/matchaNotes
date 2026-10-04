import { useContext } from 'react'
import { VaultContext, type VaultContextType } from '@/context/vault-context-def'

export const useVault = (): VaultContextType => {
  const context = useContext(VaultContext)
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider')
  }
  return context
}

export type { VaultContextType }
