"use client"

import { useAuth } from "./auth-context"
import { LoginForm } from "./login-form"
import { LoveLetterEnvelope } from "./love-letter-envelope"
import { Hero } from "./hero"
import { LoveCounter } from "./love-counter"
import { AnniversaryCountdown } from "./anniversary-countdown"
import { Gallery } from "./gallery"
import { Videos } from "./videos"
import { Reasons } from "./reasons"
import { LoveLetterSection } from "./love-letter-section"
import { OurTimeline } from "./our-timeline"
import { BucketListSection } from "./bucket-list-section"
import { Closing } from "./closing"
import { DayLikeToday } from "./day-like-today"
import { ContentEditorButton } from "./content-editor-modal"
import { useState, useEffect } from "react"
import { LogOut } from "lucide-react"

export function AppWrapper() {
  const { user, loading, signOut } = useAuth()
  const [showEnvelope, setShowEnvelope] = useState(false)
  const [envelopeOpened, setEnvelopeOpened] = useState(false)

  useEffect(() => {
    if (user && !envelopeOpened) {
      const seenEnvelope = sessionStorage.getItem("envelopeOpened")
      if (seenEnvelope) {
        setEnvelopeOpened(true)
      } else {
        setShowEnvelope(true)
      }
    }
  }, [user, envelopeOpened])

  const handleEnvelopeOpen = () => {
    sessionStorage.setItem("envelopeOpened", "true")
    setEnvelopeOpened(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (!user) return <LoginForm />

  if (showEnvelope && !envelopeOpened) {
    return <LoveLetterEnvelope onOpen={handleEnvelopeOpen} />
  }

  return (
    <>
      <main className="min-h-screen bg-background">
        <Hero />
        <LoveCounter />
        <AnniversaryCountdown />
        <Gallery />
        <Videos />
        <Reasons />
        <LoveLetterSection />
        <OurTimeline />
        <BucketListSection />
        <Closing />
      </main>

      <DayLikeToday />

      {/* Floating action buttons */}
      <ContentEditorButton />
      <button
        onClick={signOut}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg border border-border text-foreground transition-transform hover:scale-110"
        aria-label="Sign out"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </>
  )
}
