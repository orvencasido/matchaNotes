import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Trash2,
  AlertCircle,
  File,
} from 'lucide-react'
import { useMedia, type MediaItem } from '@/hooks/useMedia'
import { useUI } from '@/hooks/useUI'
import { LightboxModal } from '@/components/notes/LightboxModal'

export const MediaView: React.FC = () => {
  const { searchQuery, headerActionTrigger } = useUI()
  const {
    items,
    isLoading,
    isUploading,
    error,
    uploadMedia,
    deleteMedia,
  } = useMedia()

  const [isDragging, setIsDragging] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastActionTriggerRef = useRef(headerActionTrigger)

  // Trigger file picker when Header "+ Upload" is clicked
  useEffect(() => {
    if (headerActionTrigger > lastActionTriggerRef.current) {
      lastActionTriggerRef.current = headerActionTrigger
      fileInputRef.current?.click()
    }
  }, [headerActionTrigger])

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadError(null)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const res = await uploadMedia(file, null)
      if (!res) {
        setUploadError(`Failed to upload ${file.name}`)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files)
    }
  }

  // Filter media items using searchQuery
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter(
      (item) =>
        item.fileName.toLowerCase().includes(q) ||
        (item.mime_type && item.mime_type.toLowerCase().includes(q))
    )
  }, [items, searchQuery])

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 lg:p-10 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E3DC] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#19221C] tracking-tight">
            Media Gallery
          </h1>
          <p className="text-xs text-[#5C6861] mt-0.5 font-mono">
            {items.length} {items.length === 1 ? 'file' : 'files'} stored in note-media
          </p>
        </div>

        {/* Upload Trigger Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D4739] hover:bg-[#23392D] disabled:opacity-50 text-[#FBFBF9] text-xs font-medium transition cursor-pointer self-start sm:self-auto shadow-xs"
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>Upload Media</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Error notification banner */}
      {(error || uploadError) && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError || error}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer text-center ${
          isDragging
            ? 'border-[#2D4739] bg-[#E8EFE8]/40 scale-[0.99]'
            : 'border-[#E4E3DC] hover:border-[#2D4739]/50 bg-[#F4F3EE]/40 hover:bg-[#F4F3EE]/80'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-[#E8EFE8] flex items-center justify-center text-[#2D4739] transition-transform group-hover:scale-105">
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-[#19221C]">
            {isUploading
              ? 'Uploading to secure storage...'
              : 'Drop photos here or browse to upload'}
          </p>
          <p className="text-[11px] text-[#5C6861] font-mono">
            JPG, PNG, GIF, WebP, SVG, PDF up to 50MB
          </p>
        </div>
      </div>

      {/* Media Grid */}
      {isLoading && items.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center gap-2 text-xs text-[#5C6861]">
          <Loader2 className="w-6 h-6 animate-spin text-[#2D4739]" />
          <span>Loading media gallery...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center text-xs text-[#5C6861] space-y-2">
          <ImageIcon className="w-8 h-8 text-[#8A968F]/60 mx-auto" />
          <p className="font-medium text-sm text-[#19221C]">No media files found</p>
          <p className="text-[11px] text-[#8A968F]">
            {searchQuery
              ? `No media matches "${searchQuery}"`
              : 'Upload images or attachments to see them in this gallery.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            const isImage = item.mime_type?.startsWith('image/')

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group rounded-xl border border-[#E4E3DC] bg-[#FBFBF9] hover:border-[#2D4739]/40 hover:shadow-xs overflow-hidden transition-all flex flex-col cursor-pointer relative"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-[#F4F3EE] flex items-center justify-center relative overflow-hidden">
                  {isImage && item.signedUrl ? (
                    <img
                      src={item.signedUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-[#5C6861]">
                      <File className="w-8 h-8 text-[#8A968F]" />
                      <span className="text-[10px] font-mono uppercase">
                        {item.mime_type?.split('/')[1] || 'FILE'}
                      </span>
                    </div>
                  )}

                  {/* Hover Delete Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMedia(item.id, item.storage_path)
                    }}
                    title="Delete media"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Meta details footer */}
                <div className="p-2.5 sm:p-3 text-xs flex flex-col justify-between flex-1 bg-[#FBFBF9]">
                  <span className="font-medium text-[#19221C] truncate mb-1">
                    {item.fileName}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-[#5C6861] font-mono">
                    <span>{formatFileSize(item.size_bytes)}</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal for Selected Image */}
      {selectedItem && (
        <LightboxModal
          isOpen={true}
          imageUrl={selectedItem.signedUrl}
          title={selectedItem.fileName}
          subtitle={`${formatFileSize(selectedItem.size_bytes)} • ${formatDate(
            selectedItem.created_at
          )}`}
          onClose={() => setSelectedItem(null)}
          onDelete={() => {
            deleteMedia(selectedItem.id, selectedItem.storage_path)
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}
