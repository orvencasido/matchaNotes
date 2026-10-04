import { createContext } from 'react'
import type {
  DecryptedVaultItem,
  CreateVaultItemInput,
  UpdateVaultItemInput,
} from '@/types'

export interface VaultContextType {
  isConfigured: boolean | null
  isLocked: boolean
  isLoading: boolean
  isActionLoading: boolean
  error: string | null
  items: DecryptedVaultItem[]
  setupPin: (pin: string) => Promise<boolean>
  unlockVault: (pin: string) => Promise<boolean>
  lockVault: () => void
  createVaultItem: (data: CreateVaultItemInput) => Promise<DecryptedVaultItem | null>
  updateVaultItem: (id: string, data: UpdateVaultItemInput) => Promise<boolean>
  deleteVaultItem: (id: string) => Promise<boolean>
  reorderVaultItems: (activeId: string, overId: string, currentList?: DecryptedVaultItem[]) => Promise<boolean>
  refetchItems: () => Promise<void>
  checkVaultConfig: () => Promise<void>
  clearError: () => void
}

export const VaultContext = createContext<VaultContextType | undefined>(undefined)
