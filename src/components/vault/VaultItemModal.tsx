import React, { useState } from 'react'
import {
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Globe,
  KeyRound,
  CreditCard,
  FileText,
  User,
  Shield,
  Loader2,
} from 'lucide-react'
import { generateSecurePassword } from '@/lib/crypto'
import type {
  VaultCategory,
  DecryptedVaultItem,
  CreateVaultItemInput,
  UpdateVaultItemInput,
} from '@/types'

export interface VaultItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    data: CreateVaultItemInput | { id: string; updates: UpdateVaultItemInput }
  ) => Promise<boolean>
  initialItem?: DecryptedVaultItem | null
  isLoading?: boolean
}

const CATEGORIES: { label: string; value: VaultCategory; icon: React.ElementType }[] = [
  { label: 'Accounts', value: 'Accounts', icon: Globe },
  { label: 'Passwords', value: 'Passwords', icon: KeyRound },
  { label: 'Cards', value: 'Cards', icon: CreditCard },
  { label: 'Notes', value: 'Notes', icon: FileText },
]

export const VaultItemModal: React.FC<VaultItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  isLoading = false,
}) => {
  const isEditing = Boolean(initialItem)

  const [title, setTitle] = useState(initialItem?.title || '')
  const [category, setCategory] = useState<VaultCategory>(
    (initialItem?.category as VaultCategory) || 'Accounts'
  )
  const [username, setUsername] = useState(initialItem?.payload?.username || '')
  const [password, setPassword] = useState(initialItem?.payload?.password || '')
  const [url, setUrl] = useState(initialItem?.payload?.url || '')
  const [notes, setNotes] = useState(initialItem?.payload?.notes || '')

  // Card specific
  const [cardNumber, setCardNumber] = useState(initialItem?.payload?.cardNumber || '')
  const [cardHolder, setCardHolder] = useState(initialItem?.payload?.cardHolder || '')
  const [expiryDate, setExpiryDate] = useState(initialItem?.payload?.expiryDate || '')
  const [cvv, setCvv] = useState(initialItem?.payload?.cvv || '')

  const [showPassword, setShowPassword] = useState(false)
  const [showCvv, setShowCvv] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword({ length: 18, symbols: true, numbers: true })
    setPassword(generated)
    setShowPassword(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setValidationError('Please enter a title')
      return
    }

    setValidationError(null)

    const payload = {
      ...(category === 'Cards'
        ? {
            cardNumber: cardNumber.trim(),
            cardHolder: cardHolder.trim(),
            expiryDate: expiryDate.trim(),
            cvv: cvv.trim(),
            notes: notes.trim(),
          }
        : {
            username: username.trim(),
            password: password,
            url: url.trim(),
            notes: notes.trim(),
          }),
    }

    let success = false
    if (isEditing && initialItem) {
      success = await onSave({
        id: initialItem.id,
        updates: {
          title: title.trim(),
          category,
          payload,
        },
      })
    } else {
      success = await onSave({
        title: title.trim(),
        category,
        payload,
      })
    }

    if (success) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FBFBF9] rounded-2xl border border-[#E4E3DC] shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E3DC] bg-[#F4F3EE]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE8] text-[#2D4739] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#19221C]">
                {isEditing ? 'Edit Vault Item' : 'New Encrypted Item'}
              </h2>
              <p className="text-[11px] text-[#5C6861]">
                AES-GCM-256 client-side encrypted record
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {validationError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {validationError}
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block font-medium text-[#19221C] mb-1.5">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isSelected = category === cat.value
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#2D4739] border-[#2D4739] text-[#FBFBF9] shadow-xs'
                        : 'bg-[#F4F3EE] border-[#E4E3DC] text-[#5C6861] hover:bg-[#ECEAE3] hover:text-[#19221C]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-medium text-[#19221C] mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={category === 'Cards' ? 'e.g. Chase Sapphire Reserve' : 'e.g. GitHub Account'}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] text-[#19221C] placeholder-[#8A968F] focus:outline-none focus:border-[#2D4739] focus:bg-[#FBFBF9] transition-all text-xs"
            />
          </div>

          {/* Fields for Accounts & Passwords */}
          {category !== 'Cards' && (
            <>
              {/* Username / Email */}
              <div>
                <label className="block font-medium text-[#19221C] mb-1">
                  Username / Identifier
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A968F]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user@example.com or handle"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] text-[#19221C] placeholder-[#8A968F] focus:outline-none focus:border-[#2D4739] focus:bg-[#FBFBF9] transition-all text-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-[#19221C]">Password</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="inline-flex items-center gap-1 text-[11px] text-[#2D4739] hover:underline font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Secure</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A968F]">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] text-[#19221C] placeholder-[#8A968F] font-mono focus:outline-none focus:border-[#2D4739] focus:bg-[#FBFBF9] transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A968F] hover:text-[#19221C]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block font-medium text-[#19221C] mb-1">
                  Website / URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A968F]">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/login"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] text-[#19221C] placeholder-[#8A968F] focus:outline-none focus:border-[#2D4739] focus:bg-[#FBFBF9] transition-all text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {/* Fields for Cards */}
          {category === 'Cards' && (
            <>
              <div>
                <label className="block font-medium text-[#19221C] mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="e.g. JANE DOE"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] text-[#19221C] placeholder-[#8A968F] focus:outline-none focus:border-[#2D4739] focus:bg-[#FBFBF9] transition-all text-xs uppercase"
                />
              </div>

              <div>
                <label className="block font-medium text-[#19221C] mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4000 1234 5678 9010"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] text-[#19221C] placeholder-[#8A968F] font-mono focus:outline-none focus:border-[#2D4739] focus:bg-[#FBFBF9] transition-all text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#19221C] mb-1">
                    Expiration (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="08/29"
                    maxLength={5}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] text-[#19221C] placeholder-[#8A968F] font-mono focus:outline-none focus:border-[#2D4739] focus:bg-[#FBFBF9] transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#19221C] mb-1">
                    CVV / Security Code
                  </label>
                  <div className="relative">
                    <input
                      type={showCvv ? 'text' : 'password'}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-3.5 py-2 pr-9 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] text-[#19221C] placeholder-[#8A968F] font-mono focus:outline-none focus:border-[#2D4739] focus:bg-[#FBFBF9] transition-all text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCvv(!showCvv)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A968F] hover:text-[#19221C]"
                    >
                      {showCvv ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Secure Notes / Recovery Codes */}
          <div>
            <label className="block font-medium text-[#19221C] mb-1">
              {category === 'Notes' ? 'Confidential Content' : 'Encrypted Notes / Recovery Codes'}
            </label>
            <textarea
              rows={category === 'Notes' ? 6 : 3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                category === 'Notes'
                  ? 'Paste recovery seeds, private keys, or confidential notes here...'
                  : 'Optional secondary notes, backup codes, or PIN...'
              }
              className="w-full px-3.5 py-2 rounded-xl bg-[#F4F3EE] border border-[#E4E3DC] text-[#19221C] placeholder-[#8A968F] focus:outline-none focus:border-[#2D4739] focus:bg-[#FBFBF9] transition-all text-xs resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F4F3EE] hover:bg-[#ECEAE3] text-[#5C6861] font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D4739] hover:bg-[#23392D] text-[#FBFBF9] font-medium shadow-xs transition-all disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Save Encrypted Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
