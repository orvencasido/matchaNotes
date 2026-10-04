import React, { useState } from 'react'
import { ShieldCheck, KeyRound, AlertTriangle } from 'lucide-react'
import { PinKeypad } from './PinKeypad'

export interface PinSetupModalProps {
  onPinConfigured: (pin: string) => Promise<boolean>
  isLoading?: boolean
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  onPinConfigured,
  isLoading = false,
}) => {
  const [step, setStep] = useState<1 | 2>(1)
  const [firstPin, setFirstPin] = useState<string>('')
  const [confirmPin, setConfirmPin] = useState<string>('')
  const [isError, setIsError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFirstPinComplete = (pin: string) => {
    setIsError(false)
    setErrorMessage(null)
    setFirstPin(pin)
    setConfirmPin('')
    setStep(2)
  }

  const handleConfirmPinComplete = async (pin: string) => {
    if (pin !== firstPin) {
      setIsError(true)
      setErrorMessage('PINs do not match. Please try again.')
      setTimeout(() => {
        setFirstPin('')
        setConfirmPin('')
        setStep(1)
        setIsError(false)
        setErrorMessage(null)
      }, 1200)
      return
    }

    setIsError(false)
    setErrorMessage(null)
    const success = await onPinConfigured(pin)
    if (!success) {
      setIsError(true)
      setErrorMessage('Failed to configure PIN. Please try again.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-6">
      {/* Setup Step Progress Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EFE8] border border-[#d2dfd2] text-[#23392D] text-xs font-medium mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2D4739]" />
        <span>{step === 1 ? 'Step 1 of 2: Create Master PIN' : 'Step 2 of 2: Confirm PIN'}</span>
      </div>

      {step === 1 ? (
        <PinKeypad
          value={firstPin}
          onChange={(val) => {
            setFirstPin(val)
            if (isError) setIsError(false)
          }}
          onComplete={handleFirstPinComplete}
          isError={isError}
          errorMessage={errorMessage}
          isLoading={isLoading}
          icon={<KeyRound className="w-5 h-5 text-[#2D4739]" />}
          title="Create Master PIN"
          description="Choose a memorable 6-digit numeric PIN to protect your confidential passwords and credentials."
          badgeText="Zero-Knowledge • PBKDF2 100k Iterations"
        />
      ) : (
        <PinKeypad
          value={confirmPin}
          onChange={(val) => {
            setConfirmPin(val)
            if (isError) setIsError(false)
          }}
          onComplete={handleConfirmPinComplete}
          isError={isError}
          errorMessage={errorMessage}
          isLoading={isLoading}
          icon={<ShieldCheck className="w-5 h-5 text-[#2D4739]" />}
          title="Confirm Master PIN"
          description="Re-enter your 6-digit PIN to ensure accuracy and derive your local master key."
          badgeText="AES-GCM-256 Symmetric Derivation"
        />
      )}

      {/* Security Reassurance Box */}
      <div className="mt-4 max-w-sm mx-auto p-3.5 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] flex items-start gap-2.5 text-left text-xs text-[#5C6861] leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-[#8A968F] shrink-0 mt-0.5" />
        <span>
          <strong className="font-semibold text-[#19221C]">Zero-Knowledge Architecture:</strong> Your PIN is never stored or transmitted to the server. If you forget your PIN, encrypted credentials cannot be recovered.
        </span>
      </div>
    </div>
  )
}
