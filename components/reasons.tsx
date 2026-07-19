"use client"

import { Heart } from "lucide-react"
import { useContent } from "./content-context"

type ReasonItem = {
  title: string
  text: string
}

export function Reasons() {
  const { content } = useContent()
  const reasonsContent = content.reasons || {}
  const items = (reasonsContent.items as ReasonItem[]) || []

  return (
    <section id="reasons" className="bg-secondary/50 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-accent-foreground">
            {reasonsContent.subtitle as string}
          </p>
          <h2 className="text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
            {reasonsContent.title as string}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((reason) => (
            <article
              key={reason.title}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Heart className="size-5 fill-primary" />
              </span>
              <h3 className="font-serif text-2xl font-semibold text-foreground">
                {reason.title}
              </h3>
              <p className="text-pretty leading-relaxed text-muted-foreground">
                {reason.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
