"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, X } from "lucide-react"
import { useContent } from "./content-context"

function isValidDate(dateStr: string): boolean {
  const parts = dateStr.split("-")
  if (parts.length !== 3) return false
  const [y, m, d] = parts.map(Number)
  return !isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31
}

function isAnniversaryToday(anniversaryDate: string): boolean {
  if (!isValidDate(anniversaryDate)) return false
  const [, month, day] = anniversaryDate.split("-").map(Number)
  const now = new Date()
  return now.getMonth() + 1 === month && now.getDate() === day
}

export function DayLikeToday() {
  const { content } = useContent()
  const counter = content.counter || {}
  const dlt = content.dayliketoday || {}
  const anniversaryDate = (counter.anniversary_date as string) || "2025-10-20"

  const [visible, setVisible] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isAnniversaryToday(anniversaryDate)) return
    const dismissed = sessionStorage.getItem("anniversaryDismissed")
    if (!dismissed) setVisible(true)
  }, [anniversaryDate])

  // Focus close button when modal opens
  useEffect(() => {
    if (visible) closeRef.current?.focus()
  }, [visible])

  // Close on Escape key
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [visible])

  const dismiss = () => {
    sessionStorage.setItem("anniversaryDismissed", "true")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dlt-title"
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-md"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Floating hearts */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <Heart
            key={i}
            className="absolute animate-bounce fill-primary/30 text-primary/30"
            style={{
              left: `${8 + i * 8}%`,
              top: `${10 + (i % 4) * 20}%`,
              width: `${12 + (i % 3) * 8}px`,
              height: `${12 + (i % 3) * 8}px`,
              animationDuration: `${1.5 + (i % 4) * 0.5}s`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-primary/30 bg-card px-8 py-10 text-center shadow-2xl">
        <button
          ref={closeRef}
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close anniversary message"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Heart className="h-8 w-8 fill-primary text-primary" aria-hidden="true" />
        </div>

        <h2 id="dlt-title" className="text-balance font-serif text-3xl font-semibold text-foreground">
          {dlt.title as string}
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          {dlt.message as string}
        </p>

        <button
          onClick={dismiss}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium uppercase tracking-widest text-primary-foreground transition-transform hover:scale-105"
        >
          <Heart className="h-3.5 w-3.5 fill-primary-foreground" aria-hidden="true" />
          {dlt.cta as string}
        </button>
      </div>
    </div>
  )
}
