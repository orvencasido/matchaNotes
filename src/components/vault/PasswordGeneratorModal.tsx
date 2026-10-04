import React, { useState } from 'react'
import { X, RefreshCw, Copy, Check, Shield } from 'lucide-react'
import { generateSecurePassword } from '@/lib/crypto'

export interface PasswordGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [length, setLength] = useState<number>(18)
  const [uppercase, setUppercase] = useState<boolean>(true)
  const [lowercase, setLowercase] = useState<boolean>(true)
  const [numbers, setNumbers] = useState<boolean>(true)
  const [symbols, setSymbols] = useState<boolean>(true)

  const [password, setPassword] = useState<string>(() =>
    generateSecurePassword({ length: 18, uppercase: true, lowercase: true, numbers: true, symbols: true })
  )
  const [copied, setCopied] = useState<boolean>(false)

  if (!isOpen) return null

  const handleRegenerate = () => {
    const next = generateSecurePassword({ length, uppercase, lowercase, numbers, symbols })
    setPassword(next)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      // Auto-clear clipboard after 30 seconds
      setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText()
          if (current === password) {
            await navigator.clipboard.writeText('')
          }
        } catch {
          // Ignore read permissions
        }
      }, 30000)
    } catch (err) {
      console.error('Failed to copy password:', err)
    }
  }

  // Calculate crude entropy score
  let poolSize = 0
  if (lowercase) poolSize += 26
  if (uppercase) poolSize += 26
  if (numbers) poolSize += 10
  if (symbols) poolSize += 26
  const entropy = Math.round(length * (poolSize > 0 ? Math.log2(poolSize) : 0))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FBFBF9] rounded-2xl border border-[#E4E3DC] shadow-xl overflow-hidden flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E3DC] bg-[#F4F3EE]/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE8] text-[#2D4739] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#19221C]">
                Secure Password Generator
              </h2>
              <p className="text-[11px] text-[#5C6861]">
                Cryptographically random CSPRNG entropy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5C6861] hover:text-[#19221C] hover:bg-[#ECEAE3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Password Display & Copy */}
          <div className="p-3.5 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] flex items-center justify-between gap-2">
            <div className="font-mono text-sm font-medium text-[#19221C] tracking-wider break-all select-all">
              {password}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleRegenerate}
                className="p-2 rounded-lg text-[#5C6861] hover:text-[#2D4739] hover:bg-[#ECEAE3] transition-colors"
                title="Generate another"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  copied
                    ? 'bg-[#2D4739] text-[#FBFBF9]'
                    : 'bg-[#E8EFE8] text-[#23392D] hover:bg-[#dce6dc]'
                }`}
                title="Copy and auto-clear in 30s"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Entropy indicator */}
          <div className="flex items-center justify-between text-[11px] text-[#5C6861]">
            <span>Strength: <strong className="text-[#2D4739] font-medium">{entropy >= 90 ? 'Very Strong' : entropy >= 60 ? 'Strong' : 'Moderate'}</strong></span>
            <span className="font-mono">{entropy} bits entropy</span>
          </div>

          {/* Length Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-medium text-[#19221C]">
              <span>Password Length</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F4F3EE] border border-[#E4E3DC]">
                {length}
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(e) => {
                setLength(Number(e.target.value))
                setTimeout(handleRegenerate, 10)
              }}
              className="w-full accent-[#2D4739] cursor-pointer"
            />
          </div>

          {/* Option Toggles */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] cursor-pointer">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => {
                  setUppercase(e.target.checked)
                  setTimeout(handleRegenerate, 10)
                }}
                className="accent-[#2D4739] rounded"
              />
              <span className="text-[#19221C] font-medium">Uppercase (A-Z)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] cursor-pointer">
              <input
                type="checkbox"
                checked={lowercase}
                onChange={(e) => {
                  setLowercase(e.target.checked)
                  setTimeout(handleRegenerate, 10)
                }}
                className="accent-[#2D4739] rounded"
              />
              <span className="text-[#19221C] font-medium">Lowercase (a-z)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] cursor-pointer">
              <input
                type="checkbox"
                checked={numbers}
                onChange={(e) => {
                  setNumbers(e.target.checked)
                  setTimeout(handleRegenerate, 10)
                }}
                className="accent-[#2D4739] rounded"
              />
              <span className="text-[#19221C] font-medium">Numbers (0-9)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] cursor-pointer">
              <input
                type="checkbox"
                checked={symbols}
                onChange={(e) => {
                  setSymbols(e.target.checked)
                  setTimeout(handleRegenerate, 10)
                }}
                className="accent-[#2D4739] rounded"
              />
              <span className="text-[#19221C] font-medium">Symbols (!@#$)</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F4F3EE]/50 border-t border-[#E4E3DC] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#2D4739] text-[#FBFBF9] font-medium hover:bg-[#23392D] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
