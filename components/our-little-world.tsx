"use client"

import { useState } from "react"
import { ArrowUpRight, Camera, Clock3, Heart, LockKeyhole, Mail, Sparkles } from "lucide-react"
import { useReveal } from "@/lib/use-reveal"

const destinations = [
  { title: "Love Mail", subtitle: "letters we keep", icon: Mail, href: "#safe-place-book" },
  { title: "Our Story", subtitle: "the chapters so far", icon: Clock3, href: "#timeline" },
  { title: "Memories", subtitle: "little moments, forever", icon: Camera, href: "#gallery" },
  { title: "Kiss", subtitle: "a tiny surprise", icon: Heart, placeholder: true },
  { title: "Secret Room", subtitle: "just for us", icon: LockKeyhole, placeholder: true },
] as const

const hearts = [
  ["12%", "9%", "0.9s"],
  ["24%", "41%", "2.7s"],
  ["76%", "19%", "1.8s"],
  ["89%", "58%", "3.5s"],
  ["7%", "76%", "2.2s"],
  ["68%", "82%", "4.1s"],
] as const

export function OurLittleWorld() {
  const sectionRef = useReveal<HTMLElement>()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <section ref={sectionRef} className="world-entrance reveal relative isolate overflow-hidden px-6 py-24 sm:py-32" aria-labelledby="world-title">
      <div className="world-wallpaper" aria-hidden="true">
        {hearts.map(([left, top, delay], index) => (
          <Heart key={index} className="world-heart" style={{ left, top, animationDelay: delay }} />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        <p className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.32em] text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          A little corner of forever
        </p>
        <h2 id="world-title" className="text-balance font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-7xl">
          Our Little World
        </h2>
        <p className="mt-4 font-serif text-2xl text-primary sm:text-3xl">Negm <span aria-hidden="true">♥</span> Amyy</p>
        <p className="mt-2 max-w-lg text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
          Five doors into the moments, promises, and tiny rituals that make us us.
        </p>

        <div className="reveal-stagger mt-12 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {destinations.map((destination) => {
            const Icon = destination.icon
            const cardClass = "world-card group flex min-h-44 flex-col items-center justify-between rounded-3xl border border-primary/15 bg-card/75 p-6 text-center shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

            if (destination.placeholder) {
              return (
                <button
                  key={destination.title}
                  type="button"
                  className={cardClass}
                  onClick={() => setMessage(destination.title === "Kiss" ? "A kiss is on its way, wherever you are." : "This room is still being kept secret.")}
                  aria-label={`Open ${destination.title}`}
                >
                  <Icon className="size-7 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  <span>
                    <span className="block font-serif text-2xl text-foreground">{destination.title}</span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-muted-foreground">{destination.subtitle}</span>
                  </span>
                  <span className="text-xs text-primary/70">tap to peek</span>
                </button>
              )
            }

            return (
              <a key={destination.title} href={destination.href} className={cardClass}>
                <Icon className="size-7 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                <span>
                  <span className="block font-serif text-2xl text-foreground">{destination.title}</span>
                  <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-muted-foreground">{destination.subtitle}</span>
                </span>
                <ArrowUpRight className="size-4 text-primary/70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </a>
            )
          })}
        </div>

        {message && (
          <div className="world-note mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/90 px-5 py-3 text-sm text-foreground shadow-md" role="status">
            <Heart className="size-4 fill-primary text-primary" aria-hidden="true" />
            {message}
            <button type="button" className="ml-2 text-xs uppercase tracking-widest text-primary" onClick={() => setMessage(null)}>Close</button>
          </div>
        )}
      </div>
    </section>
  )
}

