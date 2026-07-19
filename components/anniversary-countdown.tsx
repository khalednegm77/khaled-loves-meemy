"use client"

import { useEffect, useState } from "react"
import { useContent } from "./content-context"

type Duration = { days: number; hours: number; minutes: number; seconds: number }

function isValidDate(dateStr: string): boolean {
  const parts = dateStr.split("-")
  if (parts.length !== 3) return false
  const [y, m, d] = parts.map(Number)
  return !isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31
}

function getNextAnniversary(anniversaryDate: string): Date {
  const [year, month, day] = anniversaryDate.split("-").map(Number)
  const now = new Date()
  let next = new Date(now.getFullYear(), month - 1, day)
  if (next <= now) next = new Date(now.getFullYear() + 1, month - 1, day)
  return next
}

function getCountdown(anniversaryDate: string): Duration {
  const next = getNextAnniversary(anniversaryDate)
  let diff = Math.max(0, next.getTime() - new Date().getTime())
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  diff -= days * (1000 * 60 * 60 * 24)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  diff -= hours * (1000 * 60 * 60)
  const minutes = Math.floor(diff / (1000 * 60))
  diff -= minutes * (1000 * 60)
  const seconds = Math.floor(diff / 1000)
  return { days, hours, minutes, seconds }
}

function Unit({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={`flex min-w-20 flex-col items-center gap-2 rounded-2xl border px-4 py-6 shadow-sm sm:min-w-28 sm:px-6 ${
      accent ? "border-primary/30 bg-primary/10" : "border-border bg-card"
    }`}>
      <span className="font-serif text-4xl font-semibold tabular-nums text-primary sm:text-5xl">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
    </div>
  )
}

export function AnniversaryCountdown() {
  const { content } = useContent()
  const counter = content.counter || {}
  const countdown = content.countdown || {}
  const anniversaryDate = (counter.anniversary_date as string) || "2025-10-20"

  const validDate = isValidDate(anniversaryDate) ? anniversaryDate : "2025-10-20"
  const [duration, setDuration] = useState<Duration | null>(null)

  useEffect(() => {
    setDuration(getCountdown(validDate))
    const id = setInterval(() => setDuration(getCountdown(validDate)), 1000)
    return () => clearInterval(id)
  }, [validDate])

  const d = duration ?? { days: 0, hours: 0, minutes: 0, seconds: 0 }

  const next = getNextAnniversary(validDate)
  const formatted = next.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <section className="bg-secondary/40 px-6 py-16 sm:py-24 text-center">
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-accent-foreground">
          {countdown.subtitle as string}
        </p>
        <h2 className="mb-2 text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
          {countdown.title as string}
        </h2>
        <p className="mb-10 text-sm text-muted-foreground">{formatted}</p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Unit value={d.days} label="Days" accent />
          <Unit value={d.hours} label="Hours" />
          <Unit value={d.minutes} label="Minutes" />
          <Unit value={d.seconds} label="Seconds" />
        </div>

        <p className="mx-auto mt-10 max-w-md text-pretty leading-relaxed text-muted-foreground">
          {countdown.description as string}
        </p>
      </div>
    </section>
  )
}
