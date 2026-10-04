import React, { useState } from 'react'
import { useVault } from '@/hooks/useVault'
import { PinKeypad } from '@/components/vault/PinKeypad'
import { PinSetupModal } from '@/components/vault/PinSetupModal'
import { VaultUnlockedView } from '@/components/vault/VaultUnlockedView'
import { Loader2 } from 'lucide-react'

export const VaultView: React.FC = () => {
  const {
    isConfigured,
    isLocked,
    isLoading,
    error,
    unlockVault,
    setupPin,
    clearError,
  } = useVault()

  const [pin, setPin] = useState<string>('')
  const [isShakeError, setIsShakeError] = useState<boolean>(false)

  // 1. Initial configuration check loading state
  if (isConfigured === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
        <div className="flex flex-col items-center gap-2.5">
          <Loader2 className="w-5 h-5 animate-spin text-[#2D4739]" />
          <p className="text-xs text-[#5C6861] font-medium">Checking vault configuration...</p>
        </div>
      </div>
    )
  }

  // 2. First-time user setup: Guided 2-step PIN setup
  if (!isConfigured) {
    return (
      <PinSetupModal
        onPinConfigured={async (newPin) => {
          return await setupPin(newPin)
        }}
        isLoading={isLoading}
      />
    )
  }

  // 3. Unlocked state: Render Vault contents and management UI
  if (!isLocked) {
    return <VaultUnlockedView />
  }

  // 4. Locked state: Render 6-digit PIN keypad
  const handlePinComplete = async (enteredPin: string) => {
    setIsShakeError(false)
    const success = await unlockVault(enteredPin)
    if (!success) {
      setIsShakeError(true)
      setTimeout(() => {
        setPin('')
        setIsShakeError(false)
      }, 900)
    }
  }

  return (
    <PinKeypad
      value={pin}
      onChange={(nextPin) => {
        setPin(nextPin)
        if (isShakeError) setIsShakeError(false)
        if (error) clearError()
      }}
      onComplete={handlePinComplete}
      isError={isShakeError || Boolean(error)}
      errorMessage={error || (isShakeError ? 'Incorrect PIN. Please try again.' : null)}
      isLoading={isLoading}
      title="Encrypted Vault"
      description="Enter your 6-digit master PIN to decrypt credentials and secure records."
      badgeText="PBKDF2 • AES-GCM-256 Client-Side"
    />
  )
}
