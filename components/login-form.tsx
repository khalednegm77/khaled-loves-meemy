"use client"

import { useState } from "react"
import { Heart, Mail, Eye, EyeOff } from "lucide-react"
import { useAuth } from "./auth-context"

export function LoginForm() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const { error } = isCreatingAccount
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password)

      if (error) {
        const errorMessage = error.message.toLowerCase()
        if (errorMessage.includes("email not confirmed")) {
          setError("Please confirm your email from the message Supabase sent you.")
        } else if (errorMessage.includes("failed to fetch") || errorMessage.includes("network")) {
          setError("Supabase could not be reached. Please check the project URL and anon key.")
        } else if (isCreatingAccount && errorMessage.includes("already registered")) {
          setError("This email already has an account. Switch to Sign In.")
        } else if (isCreatingAccount) {
          setError("We could not create that account. Check the email and password, then try again.")
        } else {
          setError("Invalid email or password. If you do not have an account, choose Create account below.")
        }
      } else if (isCreatingAccount) {
        setMessage("Account created. Check your email to confirm it, then sign in.")
        setIsCreatingAccount(false)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 fill-primary text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            khaled <span className="text-primary">&</span> amyy
          </h1>
          <p className="mt-2 text-muted-foreground">Welcome to our story</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg">
          {error && (
            <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
              {message}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Secret word
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-4 pr-10 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                placeholder="Enter the secret word"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Please wait…" : isCreatingAccount ? "Create account" : "Sign In"}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCreatingAccount((current) => !current)
              setError(null)
              setMessage(null)
            }}
            className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {isCreatingAccount ? "Already have an account? Sign in" : "Need an account? Create one"}
          </button>
        </form>
      </div>
    </div>
  )
}
