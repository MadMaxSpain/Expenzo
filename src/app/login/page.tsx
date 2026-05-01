'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      {/* Logo mark */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue flex items-center justify-center shadow-sm">
          <span className="text-white text-2xl font-mono font-semibold">€</span>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Expenzo</h1>
          <p className="text-gray-400 text-sm mt-1">Log fast. See clearly.</p>
        </div>
      </div>

      {/* Sign in card */}
      <div className="w-full max-w-sm bg-card rounded-2xl border border-black/8 p-6">
        <p className="text-sm text-gray-600 text-center mb-5">
          Sign in to sync your entries across all devices
        </p>
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-black/10 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all text-ink font-medium text-sm"
        >
          {/* Google G */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-8 text-center max-w-xs">
        Your data is private and encrypted. We never sell or share it.
      </p>
    </div>
  )
}
