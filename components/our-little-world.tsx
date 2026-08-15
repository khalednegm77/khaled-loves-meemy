"use client"

import { useMemo, useState } from "react"
import {
    BookOpenText,
    Heart,
    ImageIcon,
    LockKeyhole,
    Mail,
    Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"

type Destination = {
    id: string
    title: string
    subtitle: string
    icon: typeof Mail
    message: string
}

const HEART_SYMBOLS = ["❤️", "♡", "💕", "💗", "🤍"]

const destinations: Destination[] = [
    {
        id: "love-mail",
        title: "Love Mail",
        subtitle: "Sweet notes for us",
        icon: Mail,
        message: "A tiny corner for all the gentle thoughts, little poems, and love notes we never want to lose.",
    },
    {
        id: "kiss",
        title: "Kiss",
        subtitle: "Soft little moments",
        icon: Heart,
        message: "A warm little place for the softest kisses, blushy smiles, and moments that say everything without words.",
    },
    {
        id: "our-story",
        title: "Our Story",
        subtitle: "Every chapter of us",
        icon: BookOpenText,
        message: "The story of us is still being written, one beautiful page at a time.",
    },
    {
        id: "memories",
        title: "Memories",
        subtitle: "Our favorite days",
        icon: ImageIcon,
        message: "A quiet place for glances, laughter, and the little details that make our world feel so alive.",
    },
]

export function HeartWallpaper() {
    const hearts = useMemo(
        () =>
            Array.from({ length: 26 }, (_, index) => ({
                id: index,
                symbol: HEART_SYMBOLS[index % HEART_SYMBOLS.length],
                left: `${(Math.random() * 100).toFixed(2)}%`,
                top: `${(Math.random() * 100).toFixed(2)}%`,
                size: `${10 + (index % 5) * 4}px`,
                opacity: (0.12 + (index % 6) * 0.07).toFixed(2),
                delay: `${(index * 0.75).toFixed(2)}s`,
                duration: `${15 + (index % 8) * 4}s`,
            })),
        [],
    )

    return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
            {hearts.map((heart) => (
                <span
                    key={heart.id}
                    className="heart-wallpaper absolute select-none"
                    style={{
                        left: heart.left,
                        top: heart.top,
                        fontSize: heart.size,
                        opacity: Number(heart.opacity),
                        animationDelay: heart.delay,
                        animationDuration: heart.duration,
                    }}
                >
                    {heart.symbol}
                </span>
            ))}
        </div>
    )
}

export function OurLittleWorld() {
    const [selectedId, setSelectedId] = useState(destinations[0].id)

    const selectedDestination =
        destinations.find((destination) => destination.id === selectedId) ?? destinations[0]

    const ActiveIcon = selectedDestination.icon

    return (
        <section className="relative isolate mt-8 overflow-hidden py-14 sm:mt-10 sm:py-18 lg:mt-12 lg:py-20">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(248,236,232,0.96)_35%,rgba(245,232,228,0.9)_100%)]" />

            <div className="mx-auto max-w-6xl px-5 sm:px-6">
                <div className="rounded-[2.25rem] border border-white/60 bg-white/60 p-5 shadow-[0_28px_90px_-34px_rgba(129,92,82,0.58)] backdrop-blur-xl sm:p-7 lg:p-10">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--rose-gold)]/25 bg-[var(--blush)]/75 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-[var(--foreground)] shadow-[0_10px_25px_-18px_rgba(129,92,82,0.55)]">
                            <Sparkles className="size-3.5 text-[var(--rose-gold)]" />
                            Our Little World
                        </div>

                        <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                            NEGM <span className="text-[var(--rose-gold)]">❤</span> AMYY
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg">
                            Our little world, made for two.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {destinations.map((destination) => {
                            const Icon = destination.icon
                            const isActive = destination.id === selectedId

                            return (
                                <button
                                    key={destination.id}
                                    type="button"
                                    onClick={() => setSelectedId(destination.id)}
                                    className={cn(
                                        "group relative overflow-hidden rounded-[1.5rem] border p-4 text-left transition-all duration-300 ease-out sm:p-5",
                                        isActive
                                            ? "border-[var(--rose-gold)]/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(250,242,238,0.88))] shadow-[0_18px_45px_-28px_rgba(127,94,86,0.6)]"
                                            : "border-[var(--champagne-deep)]/40 bg-white/70 hover:-translate-y-1 hover:border-[var(--rose-gold)]/40 hover:shadow-[0_18px_38px_-25px_rgba(127,94,86,0.5)]",
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                                            isActive ? "opacity-100" : "",
                                        )}
                                        style={{
                                            background:
                                                "radial-gradient(circle at top, rgba(255,255,255,0.9), rgba(250,235,233,0.78) 38%, rgba(247,236,229,0.2) 100%)",
                                        }}
                                    />

                                    <div className="relative flex h-full flex-col">
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-[var(--rose-gold)] shadow-sm">
                                            <Icon className="size-5" />
                                        </div>

                                        <p className="text-lg font-semibold text-foreground">{destination.title}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--rose-gold)]/90">
                                            {destination.subtitle}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-6 rounded-[1.75rem] border border-[var(--champagne-deep)]/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,244,240,0.94))] p-5 shadow-[0_18px_35px_-28px_rgba(129,92,82,0.42)] sm:p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--rose-gold)]/25 bg-[var(--blush)] text-[var(--rose-gold)]">
                                <ActiveIcon className="size-5" />
                            </div>
                            <div>
                                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--rose-gold)]">Private place</p>
                                <h3 className="font-serif text-2xl text-foreground">{selectedDestination.title}</h3>
                            </div>
                        </div>

                        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80">
                            {selectedDestination.message}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
