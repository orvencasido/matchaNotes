import React, { useState, useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Globe,
  KeyRound,
  CreditCard,
  FileText,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  Lock,
  GripVertical,
  Folder,
} from 'lucide-react'
import type { DecryptedVaultItem } from '@/types'

export interface VaultCardProps {
  item: DecryptedVaultItem
  onEdit: (item: DecryptedVaultItem) => void
  onDelete: (id: string) => void
}

export const VaultCard: React.FC<VaultCardProps> = ({ item, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: undefined,
  }

  const [showPassword, setShowPassword] = useState(false)
  const [showCvv, setShowCvv] = useState(false)
  const [showCardNumber, setShowCardNumber] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const clipboardTimerRef = useRef<number | null>(null)

  const { title, category, payload, updatedAt } = item

  // Format date nicely
  const formattedDate = new Date(updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (clipboardTimerRef.current !== null) {
        window.clearTimeout(clipboardTimerRef.current)
      }
    }
  }, [])

  // Copy with auto-clear after 30 seconds
  const handleCopy = async (text: string, keyName: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(keyName)

      setTimeout(() => {
        setCopiedKey((prev) => (prev === keyName ? null : prev))
      }, 2000)

      // Schedule auto-clearing clipboard after 30 seconds
      if (clipboardTimerRef.current !== null) {
        window.clearTimeout(clipboardTimerRef.current)
      }

      clipboardTimerRef.current = window.setTimeout(async () => {
        try {
          const currentText = await navigator.clipboard.readText()
          if (currentText === text) {
            await navigator.clipboard.writeText('')
          }
        } catch {
          // Permissions or focus issues, ignore
        }
      }, 30000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  // Get icon and theme based on category
  const getCategoryDetails = () => {
    switch (category) {
      case 'Accounts':
        return {
          icon: Globe,
          label: 'Account',
          badgeBg: 'bg-[#E8EFE8]',
          badgeText: 'text-[#23392D]',
        }
      case 'Passwords':
        return {
          icon: KeyRound,
          label: 'Password',
          badgeBg: 'bg-[#E8EFE8]',
          badgeText: 'text-[#23392D]',
        }
      case 'Cards':
        return {
          icon: CreditCard,
          label: 'Card',
          badgeBg: 'bg-[#E8EFE8]',
          badgeText: 'text-[#23392D]',
        }
      case 'Notes':
        return {
          icon: FileText,
          label: 'Secure Note',
          badgeBg: 'bg-[#E8EFE8]',
          badgeText: 'text-[#23392D]',
        }
      default:
        return {
          icon: Lock,
          label: category,
          badgeBg: 'bg-[#E8EFE8]',
          badgeText: 'text-[#23392D]',
        }
    }
  }

  const { icon: CategoryIcon, label, badgeBg, badgeText } = getCategoryDetails()

  // Format card number to masked groups
  const formatCardNumber = (num?: string) => {
    if (!num) return ''
    const cleaned = num.replace(/\s+/g, '')
    if (showCardNumber) {
      return cleaned.replace(/(.{4})/g, '$1 ').trim()
    }
    if (cleaned.length <= 4) return '••••'
    return `•••• •••• •••• ${cleaned.slice(-4)}`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col justify-between p-4 rounded-2xl bg-[#F4F3EE] hover:bg-[#ECEAE3]/70 border border-[#E4E3DC] hover:shadow-xs transition-colors duration-150 ${
        isDragging
          ? 'z-30 shadow-md ring-1 ring-[#2D4739]/30 bg-[#F4F3EE] opacity-90 scale-[1.01]'
          : ''
      }`}
    >
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FBFBF9] border border-[#E4E3DC] text-[#2D4739] flex items-center justify-center shrink-0 shadow-2xs">
              <CategoryIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-[#19221C] truncate leading-tight">
                {title}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeBg} ${badgeText}`}
                >
                  {label}
                </span>
                {payload.group && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#E8EFE8] text-[#2D4739] border border-[#d2dfd2] max-w-[130px]"
                    title={`Group: ${payload.group}`}
                  >
                    <Folder className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{payload.group}</span>
                  </span>
                )}
                <span className="text-[10px] text-[#8A968F] font-mono">• {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder card"
              className="p-1.5 rounded-lg text-[#8A968F] opacity-40 sm:opacity-0 group-hover:opacity-70 hover:opacity-100 hover:text-[#2D4739] transition-opacity cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-[#5C6861] hover:text-[#19221C] hover:bg-[#FBFBF9] border border-transparent hover:border-[#E4E3DC] transition-all cursor-pointer"
              title="Edit record"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {isDeleting ? (
              <div className="flex items-center gap-1 bg-[#FBFBF9] border border-[#E4E3DC] px-1.5 py-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="text-rose-600 font-semibold hover:underline"
                >
                  Confirm
                </button>
                <span className="text-[#8A968F]">/</span>
                <button
                  type="button"
                  onClick={() => setIsDeleting(false)}
                  className="text-[#5C6861] hover:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="p-1.5 rounded-lg text-[#5C6861] hover:text-rose-600 hover:bg-[#FBFBF9] border border-transparent hover:border-[#E4E3DC] transition-all cursor-pointer"
                title="Delete item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card Body - Credentials & Fields */}
        <div className="space-y-2 mt-3 text-xs">
          {/* Username / Identifier */}
          {payload.username && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBFBF9] border border-[#E4E3DC]/80">
              <div className="min-w-0 flex-1 mr-2">
                <div className="text-[10px] text-[#8A968F] font-medium">Username</div>
                <div className="font-mono text-xs text-[#19221C] truncate select-all">
                  {payload.username}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(payload.username!, 'username')}
                className="p-1 rounded-md text-[#5C6861] hover:text-[#2D4739] hover:bg-[#ECEAE3] transition-colors shrink-0"
                title="Copy username"
              >
                {copiedKey === 'username' ? (
                  <Check className="w-3.5 h-3.5 text-[#2D4739]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {/* Password */}
          {payload.password && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FBFBF9] border border-[#E4E3DC]/80">
              <div className="min-w-0 flex-1 mr-2">
                <div className="text-[10px] text-[#8A968F] font-medium flex items-center gap-1.5">
                  <span>Password</span>
                  {copiedKey === 'password' && (
                    <span className="text-[9px] text-[#2D4739] font-medium animate-fadeIn">
                      Copied! (Auto-clears in 30s)
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-[#19221C] truncate select-all tracking-wider">
                  {showPassword ? payload.password : '••••••••••••••••'}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded-md text-[#5C6861] hover:text-[#19221C] hover:bg-[#ECEAE3] transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(payload.password!, 'password')}
                  className="p-1 rounded-md text-[#5C6861] hover:text-[#2D4739] hover:bg-[#ECEAE3] transition-colors"
                  title="Copy password (auto-clears in 30s)"
                >
                  {copiedKey === 'password' ? (
                    <Check className="w-3.5 h-3.5 text-[#2D4739]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Card Fields */}
          {category === 'Cards' && payload.cardNumber && (
            <div className="space-y-1.5 p-2 rounded-xl bg-[#FBFBF9] border border-[#E4E3DC]/80">
              {payload.cardHolder && (
                <div className="text-[10px] font-mono uppercase text-[#5C6861] tracking-wider truncate">
                  {payload.cardHolder}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs font-medium text-[#19221C] tracking-widest select-all">
                  {formatCardNumber(payload.cardNumber)}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowCardNumber(!showCardNumber)}
                    className="p-1 rounded-md text-[#5C6861] hover:text-[#19221C] hover:bg-[#ECEAE3] transition-colors"
                    title={showCardNumber ? 'Hide card number' : 'Show card number'}
                  >
                    {showCardNumber ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(payload.cardNumber!, 'card')}
                    className="p-1 rounded-md text-[#5C6861] hover:text-[#2D4739] hover:bg-[#ECEAE3] transition-colors"
                    title="Copy card number"
                  >
                    {copiedKey === 'card' ? (
                      <Check className="w-3.5 h-3.5 text-[#2D4739]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E4E3DC]/60 font-mono text-[#5C6861]">
                <div>
                  <span className="text-[9px] uppercase text-[#8A968F] mr-1">Exp:</span>
                  <span>{payload.expiryDate || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] uppercase text-[#8A968F]">CVV:</span>
                  <span>{showCvv ? payload.cvv : '•••'}</span>
                  <button
                    type="button"
                    onClick={() => setShowCvv(!showCvv)}
                    className="p-0.5 rounded text-[#5C6861] hover:text-[#19221C]"
                  >
                    {showCvv ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  {payload.cvv && (
                    <button
                      type="button"
                      onClick={() => handleCopy(payload.cvv!, 'cvv')}
                      className="p-0.5 rounded text-[#5C6861] hover:text-[#2D4739]"
                      title="Copy CVV"
                    >
                      {copiedKey === 'cvv' ? (
                        <Check className="w-3.5 h-3.5 text-[#2D4739]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Secure Notes / Recovery Content */}
          {payload.notes && (
            <div className="p-2 rounded-xl bg-[#FBFBF9] border border-[#E4E3DC]/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#8A968F] font-medium">Notes</span>
                <button
                  type="button"
                  onClick={() => handleCopy(payload.notes!, 'notes')}
                  className="p-0.5 rounded text-[#5C6861] hover:text-[#2D4739]"
                  title="Copy notes"
                >
                  {copiedKey === 'notes' ? (
                    <Check className="w-3.5 h-3.5 text-[#2D4739]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#5C6861] font-mono whitespace-pre-wrap line-clamp-3 select-all leading-relaxed">
                {payload.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: External link */}
      {payload.url && (
        <div className="mt-3 pt-2.5 border-t border-[#E4E3DC]/60 flex items-center justify-between text-[11px]">
          <a
            href={
              payload.url.startsWith('http://') || payload.url.startsWith('https://')
                ? payload.url
                : `https://${payload.url}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#2D4739] hover:underline font-medium truncate max-w-[85%]"
          >
            <span className="truncate">{payload.url.replace(/^https?:\/\//, '')}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      )}
    </div>
  )
}
