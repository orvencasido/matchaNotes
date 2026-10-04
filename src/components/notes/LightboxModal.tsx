import React, { useEffect, useState } from 'react'
import { X, Download, Copy, Trash2, Check, ExternalLink } from 'lucide-react'

interface LightboxModalProps {
  isOpen: boolean
  imageUrl: string
  title: string
  subtitle?: string
  onClose: () => void
  onDelete?: () => void
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  imageUrl,
  title,
  subtitle,
  onClose,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) return null

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = title || 'download'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#19221C]/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full flex flex-col bg-[#FBFBF9] rounded-2xl shadow-2xl border border-[#E4E3DC] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 border-b border-[#E4E3DC] bg-[#F4F3EE]/70 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-[#19221C] truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-[#5C6861] font-mono truncate">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy URL"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#FBFBF9] hover:bg-[#ECEAE3] text-[#5C6861] hover:text-[#19221C] text-xs font-medium border border-[#E4E3DC] transition-all flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2D4739]" />
                  <span className="hidden sm:inline text-[#2D4739]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="Download image"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#FBFBF9] hover:bg-[#ECEAE3] text-[#5C6861] hover:text-[#19221C] text-xs font-medium border border-[#E4E3DC] transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full image in new tab"
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-[#FBFBF9] hover:bg-[#ECEAE3] text-[#5C6861] hover:text-[#19221C] text-xs border border-[#E4E3DC] transition-all flex items-center cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-1 bg-[#FBFBF9] p-1 rounded-lg border border-[#E4E3DC]">
                    <span className="text-[10px] text-[#5C6861] px-1 font-medium">Delete?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        onDelete()
                      }}
                      className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-medium transition cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-1.5 py-0.5 rounded text-[#5C6861] hover:text-[#19221C] text-[10px] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete image"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="p-1.5 rounded-lg text-[#5C6861] hover:text-[#19221C] hover:bg-[#ECEAE3] transition-all cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="p-4 flex-1 flex items-center justify-center bg-[#FBFBF9] overflow-auto min-h-[300px] max-h-[75vh]">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-sm"
          />
        </div>
      </div>
    </div>
  )
}
