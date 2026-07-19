"use client"

import { useContent } from "./content-context"

type TimelineItem = {
  date: string
  emoji: string
  title: string
  description: string
}

export function OurTimeline() {
  const { content } = useContent()
  const timeline = content.timeline || {}
  const items = (timeline.items as TimelineItem[]) || []

  return (
    <section id="timeline" className="bg-secondary/40 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-accent-foreground">
            {timeline.subtitle as string}
          </p>
          <h2 className="text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
            {timeline.title as string}
          </h2>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div
            aria-hidden
            className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent sm:left-1/2 sm:-translate-x-px"
          />

          <div className="space-y-10">
            {items.map((item, index) => {
              const isLeft = index % 2 === 0
              return (
                <div
                  key={index}
                  className={`relative flex items-start gap-6 sm:gap-0 ${
                    isLeft ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  {/* Mobile: dot on left */}
                  <div className="relative z-10 flex-shrink-0 sm:hidden">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/30 bg-card text-lg shadow-sm">
                      {item.emoji}
                    </div>
                  </div>

                  {/* Desktop: spacer + dot */}
                  <div className="hidden sm:flex sm:w-1/2 sm:items-center sm:justify-center">
                    <div
                      className={`w-full ${
                        isLeft ? "pr-10 text-right" : "pl-10 text-left"
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {item.date}
                      </span>
                    </div>
                  </div>

                  {/* Desktop center dot */}
                  <div className="absolute left-1/2 hidden -translate-x-1/2 sm:flex">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary/30 bg-card text-xl shadow-sm">
                      {item.emoji}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 sm:w-1/2 ${
                      isLeft ? "sm:pl-10" : "sm:pr-10"
                    }`}
                  >
                    {/* Mobile date */}
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:hidden">
                      {item.date}
                    </p>
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                      <h3 className="font-serif text-xl font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* End marker */}
          <div className="relative mt-10 flex justify-start sm:justify-center">
            <div className="ml-[5px] sm:ml-0 flex h-10 w-10 -translate-x-0 sm:-translate-x-1/2 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-lg">
              🤍
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
