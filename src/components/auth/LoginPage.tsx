import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { signInWithPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const { error } = await signInWithPassword(email, password)
      if (error) {
        setErrorMessage(error.message || 'Authentication failed. Please verify your credentials.')
      }
    } catch {
      setErrorMessage('An unexpected error occurred while connecting to the server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-dvh w-full flex flex-col justify-between bg-[#FBFBF9] text-[#19221C] px-4 py-8 sm:px-6 sm:py-12">
      {/* Top subtle branding / security tag */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Subtle Matcha leaf / note mark */}
          <div className="w-8 h-8 rounded-lg bg-[#2D4739] flex items-center justify-center text-[#FBFBF9] shadow-xs">
            <span className="font-semibold text-sm tracking-tight">M</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#19221C]">
            Matcha<span className="text-[#4E6E58] font-normal">Notes</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8EFE8] border border-[#d6e4d6] text-xs font-medium text-[#2D4739]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Private Vault</span>
        </div>
      </header>

      {/* Main Login Card */}
      <section className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-[#F4F3EE] border border-[#E4E3DC] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#19221C]">
              Owner Access
            </h1>
            <p className="mt-1 text-sm text-[#5C6861] leading-relaxed">
              Enter your credentials to decrypt notes and private vaults.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-[#FDF2F2] border border-[#F8D7DA] text-[#9E2A2B] text-xs sm:text-sm flex items-start gap-2.5 transition-all"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-medium uppercase tracking-wider text-[#5C6861] mb-1.5"
              >
                Account Email
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#5C6861] pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@domain.com"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FBFBF9] border border-[#E4E3DC] rounded-xl text-base text-[#19221C] placeholder:text-[#9DA6A0] focus:outline-none focus:ring-2 focus:ring-[#2D4739]/15 focus:border-[#2D4739] transition duration-150 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password-input"
                className="block text-xs font-medium uppercase tracking-wider text-[#5C6861] mb-1.5"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#5C6861] pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-11 py-2.5 bg-[#FBFBF9] border border-[#E4E3DC] rounded-xl text-base text-[#19221C] placeholder:text-[#9DA6A0] focus:outline-none focus:ring-2 focus:ring-[#2D4739]/15 focus:border-[#2D4739] transition duration-150 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  className="absolute right-2 p-1.5 text-[#5C6861] hover:text-[#19221C] rounded-lg transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[46px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2D4739] hover:bg-[#23392D] active:scale-[0.99] text-[#FBFBF9] font-medium text-sm transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2D4739]/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Privacy Notice - absolutely NO sign up link */}
          <div className="mt-6 pt-5 border-t border-[#E4E3DC] text-center">
            <p className="text-xs text-[#5C6861]">
              Single-tenant instance. Public registration is restricted.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center text-xs text-[#9DA6A0]">
        <span>MatchaNotes</span> • <span>Encrypted Personal Archive</span>
      </footer>
    </main>
  )
}
