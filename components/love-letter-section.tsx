"use client"

import { Heart, Lock } from "lucide-react"
import { useContent } from "./content-context"

export function LoveLetterSection() {
  const { content } = useContent()
  const letter = content.letter || {}

  const message = (letter.message as string) || ""
  const paragraphs = message.split("\n\n").filter(Boolean)

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-primary/5 px-6 py-20 sm:py-28">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-2xl">
        {/* Section header */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-accent-foreground">
            {letter.subtitle as string}
          </p>
          <h2 className="text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
            {letter.title as string}
          </h2>
        </div>

        {/* Letter card */}
        <div className="relative rounded-3xl border border-primary/20 bg-card shadow-xl">
          {/* Card top bar */}
          <div className="flex items-center justify-between rounded-t-3xl border-b border-primary/10 bg-primary/5 px-7 py-4">
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">To</p>
              <p className="font-serif text-lg font-medium text-foreground">{letter.to as string}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">From</p>
              <p className="font-serif text-lg font-medium text-foreground">{letter.from as string}</p>
            </div>
          </div>

          {/* Letter body */}
          <div className="px-7 py-8 sm:px-10 sm:py-10">
            <div className="space-y-5">
              {paragraphs.map((para, i) => (
                <p
                  key={i}
                  className={`font-serif leading-loose text-foreground/90 ${
                    i === 0
                      ? "text-xl font-medium text-primary"
                      : "text-base sm:text-lg"
                  }`}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Signature */}
            <div className="mt-10 flex items-center justify-between border-t border-primary/10 pt-6">
              <p className="text-xs text-muted-foreground">{letter.date as string}</p>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 fill-primary text-primary" />
                <p className="font-serif text-lg text-primary">{letter.from as string}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
