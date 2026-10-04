import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  LogOut,
  Shield,
  FileText,
  KeyRound,
  Database,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react'

export const DashboardPlaceholder: React.FC = () => {
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#FBFBF9] text-[#19221C]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-10 bg-[#FBFBF9]/90 backdrop-blur-md border-b border-[#E4E3DC] px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2D4739] flex items-center justify-center text-[#FBFBF9] shadow-xs">
              <span className="font-semibold text-sm tracking-tight">M</span>
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-[#19221C]">
                Matcha<span className="text-[#4E6E58] font-normal">Notes</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8EFE8] border border-[#d6e4d6] text-xs font-medium text-[#2D4739]">
              <span className="w-2 h-2 rounded-full bg-[#4E6E58] animate-pulse" />
              <span className="max-w-[200px] truncate">{user?.email}</span>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E3DC] bg-[#F4F3EE] hover:bg-[#eae8df] text-xs font-medium text-[#19221C] transition focus:outline-none focus:ring-2 focus:ring-[#2D4739]/20 disabled:opacity-60"
              title="Sign Out"
            >
              {isSigningOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5 text-[#5C6861]" />
              )}
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        {/* Welcome / Phase 1 Status Banner */}
        <section className="bg-[#F4F3EE] border border-[#E4E3DC] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8EFE8] text-[#2D4739] text-xs font-medium mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Phase 1 Verified</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#19221C]">
                Foundation & Single-Tenant Auth Active
              </h1>
              <p className="mt-2 text-sm text-[#5C6861] max-w-2xl leading-relaxed">
                Your authenticated session is active. Database schema, typed Supabase client, custom Matcha design tokens, and authentication guards are operational.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D4739] text-[#FBFBF9] text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#A8D5BA]" />
              <span>Owner Authenticated</span>
            </div>
          </div>
        </section>

        {/* System & Architecture Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Notes Engine Card */}
          <div className="p-5 rounded-2xl bg-[#FBFBF9] border border-[#E4E3DC] hover:border-[#2D4739]/30 transition">
            <div className="w-9 h-9 rounded-xl bg-[#E8EFE8] flex items-center justify-center text-[#2D4739] mb-4">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-base text-[#19221C]">Notes & Attachments</h2>
            <p className="mt-1.5 text-xs text-[#5C6861] leading-relaxed">
              Markdown notes, categories, tags, and multi-file attachments storage mapped to Supabase.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E4E3DC] flex items-center text-xs font-medium text-[#2D4739]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D4739] mr-2" />
              <span>Schema Ready (Phase 2)</span>
            </div>
          </div>

          {/* Secure Vault Card */}
          <div className="p-5 rounded-2xl bg-[#FBFBF9] border border-[#E4E3DC] hover:border-[#2D4739]/30 transition">
            <div className="w-9 h-9 rounded-xl bg-[#E8EFE8] flex items-center justify-center text-[#2D4739] mb-4">
              <KeyRound className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-base text-[#19221C]">Client Encrypted Vault</h2>
            <p className="mt-1.5 text-xs text-[#5C6861] leading-relaxed">
              AES-GCM-256 + PBKDF2 zero-knowledge architecture. Ephemeral keys never stored in storage.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E4E3DC] flex items-center text-xs font-medium text-[#2D4739]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D4739] mr-2" />
              <span>Security Blueprint Primed</span>
            </div>
          </div>

          {/* Cloud Database Card */}
          <div className="p-5 rounded-2xl bg-[#FBFBF9] border border-[#E4E3DC] hover:border-[#2D4739]/30 transition">
            <div className="w-9 h-9 rounded-xl bg-[#E8EFE8] flex items-center justify-center text-[#2D4739] mb-4">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-base text-[#19221C]">PostgreSQL & RLS</h2>
            <p className="mt-1.5 text-xs text-[#5C6861] leading-relaxed">
              Strict row-level security policies enforcing owner-only read, write, and deletion.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E4E3DC] flex items-center text-xs font-medium text-[#2D4739]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D4739] mr-2" />
              <span>RLS Enforced</span>
            </div>
          </div>
        </section>

        {/* Session details */}
        <section className="bg-[#F4F3EE] border border-[#E4E3DC] rounded-2xl p-5 sm:p-6 text-xs text-[#5C6861] space-y-2">
          <div className="flex items-center gap-2 font-medium text-[#19221C]">
            <Shield className="w-4 h-4 text-[#2D4739]" />
            <span>Active Session Details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
            <div className="p-2.5 rounded-lg bg-[#FBFBF9] border border-[#E4E3DC]">
              <span className="text-[#5C6861] block mb-1">User ID:</span>
              <span className="text-[#19221C] break-all">{user?.id}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#FBFBF9] border border-[#E4E3DC]">
              <span className="text-[#5C6861] block mb-1">Authenticated Email:</span>
              <span className="text-[#19221C] break-all">{user?.email}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E4E3DC] py-4 px-4 sm:px-8 text-center text-xs text-[#9DA6A0]">
        MatchaNotes • Cerimonial Matcha & Off-White Personal Archive
      </footer>
    </div>
  )
}
