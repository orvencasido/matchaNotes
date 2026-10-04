import React, { useEffect, useCallback } from 'react'
import { Shield, Delete, Loader2, Lock } from 'lucide-react'

export interface PinKeypadProps {
  value: string
  onChange: (pin: string) => void
  onComplete: (pin: string) => void
  isError?: boolean
  errorMessage?: string | null
  isLoading?: boolean
  title?: string
  description?: string
  badgeText?: string
  disabled?: boolean
  icon?: React.ReactNode
}

export const PinKeypad: React.FC<PinKeypadProps> = ({
  value,
  onChange,
  onComplete,
  isError = false,
  errorMessage = null,
  isLoading = false,
  title = 'Encrypted Vault',
  description = 'Enter your 6-digit master PIN to decrypt credentials and secure records.',
  badgeText = 'PBKDF2 • AES-GCM-256 Client-Side',
  disabled = false,
  icon,
}) => {
  const handleDigit = useCallback(
    (digit: string) => {
      if (disabled || isLoading || value.length >= 6) return
      const next = value + digit
      onChange(next)
      if (next.length === 6) {
        onComplete(next)
      }
    },
    [disabled, isLoading, value, onChange, onComplete]
  )

  const handleDelete = useCallback(() => {
    if (disabled || isLoading || value.length === 0) return
    onChange(value.slice(0, -1))
  }, [disabled, isLoading, value, onChange])

  const handleClear = useCallback(() => {
    if (disabled || isLoading || value.length === 0) return
    onChange('')
  }, [disabled, isLoading, value, onChange])

  // Support physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input or textarea is active
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleDelete()
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleDigit, handleDelete, handleClear])

  return (
    <div className="max-w-md w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center min-h-[calc(100dvh-5rem)] lg:min-h-[calc(100dvh-2rem)] text-center select-none pt-[max(2rem,calc(1.5rem+env(safe-area-inset-top,0px)))]">
      {/* Icon Badge */}
      <div className="w-12 h-12 rounded-2xl bg-[#E8EFE8] border border-[#d2dfd2] text-[#2D4739] flex items-center justify-center mb-4 shadow-xs">
        {icon || <Shield className="w-5 h-5 text-[#2D4739]" />}
      </div>

      <h1 className="text-xl font-semibold text-[#19221C] tracking-tight">
        {title}
      </h1>
      <p className="text-xs text-[#5C6861] mt-1 max-w-xs leading-relaxed">
        {description}
      </p>

      {/* 6-dot indicator */}
      <div
        className={`flex items-center gap-3 my-8 transition-transform duration-200 ${
          isError ? 'animate-shake' : ''
        }`}
      >
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const isFilled = index < value.length
          return (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                isError
                  ? 'bg-rose-500/20 border-rose-500 scale-105'
                  : isFilled
                  ? 'bg-[#2D4739] border-[#2D4739] scale-110 shadow-xs'
                  : 'bg-transparent border-[#8A968F]/40'
              }`}
            />
          )
        })}
      </div>

      {/* Error Message */}
      {isError && errorMessage && (
        <div className="mb-4 text-xs font-medium text-rose-600 animate-fadeIn">
          {errorMessage}
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 mb-4 text-xs text-[#2D4739] font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Deriving cryptographic key...</span>
        </div>
      )}

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-3 w-64 mb-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled || isLoading}
            onClick={() => handleDigit(digit)}
            className="h-12 rounded-xl bg-[#F4F3EE] hover:bg-[#ECEAE3] active:bg-[#E8EFE8] text-[#19221C] font-mono text-base font-medium border border-[#E4E3DC] transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          disabled={disabled || isLoading || value.length === 0}
          onClick={handleClear}
          className="h-12 rounded-xl bg-[#F4F3EE]/60 hover:bg-[#ECEAE3] active:bg-[#E8EFE8] text-[#5C6861] text-xs font-mono font-medium border border-[#E4E3DC] transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Clear PIN"
        >
          C
        </button>

        {/* Digit 0 */}
        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={() => handleDigit('0')}
          className="h-12 rounded-xl bg-[#F4F3EE] hover:bg-[#ECEAE3] active:bg-[#E8EFE8] text-[#19221C] font-mono text-base font-medium border border-[#E4E3DC] transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          disabled={disabled || isLoading || value.length === 0}
          onClick={handleDelete}
          className="h-12 rounded-xl bg-[#F4F3EE]/60 hover:bg-[#ECEAE3] active:bg-[#E8EFE8] text-[#5C6861] flex items-center justify-center border border-[#E4E3DC] transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Backspace"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>

      {/* Security Specification Footer */}
      {badgeText && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F3EE] border border-[#E4E3DC] text-[10px] text-[#5C6861] font-mono">
          <Lock className="w-2.5 h-2.5 text-[#2D4739]" />
          <span>{badgeText}</span>
        </div>
      )}
    </div>
  )
}
