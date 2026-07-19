"use client"

import { Heart } from "lucide-react"
import { useContent } from "./content-context"

export function Closing() {
  const { content } = useContent()
  const closing = content.closing || {}

  return (
    <footer className="relative overflow-hidden px-6 py-24 text-center sm:py-32">
      <div className="mx-auto max-w-2xl">
        <Heart className="mx-auto mb-6 size-8 fill-primary text-primary" />
        <blockquote className="text-balance font-serif text-3xl font-medium leading-snug text-foreground sm:text-4xl">
          &ldquo;{closing.quote as string}&rdquo;
        </blockquote>
        <p className="mt-8 text-pretty leading-relaxed text-muted-foreground">
          {closing.description as string}
        </p>
        <p className="mt-10 font-serif text-2xl text-primary">
          {closing.signature as string}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {closing.tagline as string}
        </p>
      </div>
    </footer>
  )
}
