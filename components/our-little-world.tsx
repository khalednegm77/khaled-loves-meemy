"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    BookOpenText,
    Heart,
    ImageIcon,
    Mail,
    Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-context"
import { supabase, supabaseConfigured } from "@/lib/supabase-client"

type Destination = {
    id: string
    title: string
    subtitle: string
    icon: typeof Mail
    message: string
}

type KissEvent = {
    id: string
    sender_id: string
    receiver_id: string
    sender_name: string
    receiver_name: string
    created_at: string
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

function getUserNameFromEmail(email?: string | null) {
    const normalized = (email ?? "").toLowerCase()

    if (normalized.includes("amyy")) return "Amyy"
    if (normalized.includes("negm") || normalized.includes("khaled")) return "Negm"

    return "Amyy"
}

function getFormattedKissTime(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Today"

    return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })
}

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
    const { user } = useAuth()
    const [selectedId, setSelectedId] = useState(destinations[0].id)
    const [notification, setNotification] = useState<string | null>(null)
    const [kissHistory, setKissHistory] = useState<KissEvent[]>([])
    const [isSendingKiss, setIsSendingKiss] = useState(false)
    const [kissBurst, setKissBurst] = useState(0)
    const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    const myName = useMemo(() => getUserNameFromEmail(user?.email), [user?.email])
    const partnerName = myName === "Negm" ? "Amyy" : "Negm"

    const selectedDestination =
        destinations.find((destination) => destination.id === selectedId) ?? destinations[0]

    const ActiveIcon = selectedDestination.icon

    const loadKissHistory = useCallback(async () => {
        if (!user || !supabaseConfigured) return

        const { data, error } = await supabase
            .from("kiss_events")
            .select("*")
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(8)

        if (error) {
            console.error("kiss_events load error", error)
            return
        }

        setKissHistory((data ?? []) as KissEvent[])
    }, [user])

    useEffect(() => {
        if (!notification) return

        const timer = window.setTimeout(() => setNotification(null), 3300)
        return () => window.clearTimeout(timer)
    }, [notification])

    useEffect(() => {
        if (!user || !supabaseConfigured) return

        void loadKissHistory()

        const channel = supabase
            .channel("kiss-events")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "kiss_events",
                },
                (payload) => {
                    const event = payload.new as KissEvent

                    setKissHistory((prev) => {
                        if (prev.some((item) => item.id === event.id)) return prev
                        return [event, ...prev].slice(0, 8)
                    })

                    if (event.receiver_id === user.id) {
                        setNotification(`💋 ${event.sender_name} sent you a kiss!`)
                        setKissBurst((prev) => prev + 1)
                    }
                },
            )
            .subscribe()

        subscriptionRef.current = channel

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [loadKissHistory, user])

    const handleSendKiss = useCallback(async () => {
        if (!user || !supabaseConfigured) {
            setNotification("Kiss unavailable right now.")
            return
        }

        const receiverName = myName === "Negm" ? "Amyy" : "Negm"

        let receiverId: string | null = null

        if (supabaseConfigured) {
            const { data, error } = await supabase
                .from("couple_members")
                .select("user_id, partner_user_id")
                .or(`user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
                .maybeSingle()

            if (!error && data) {
                receiverId = data.user_id === user.id ? data.partner_user_id : data.user_id
            }
        }

        if (!receiverId) {
            setNotification(`💋 Please finish the couple link for ${receiverName} before sending a kiss.`)
            return
        }

        setIsSendingKiss(true)

        const payload = {
            sender_id: user.id,
            receiver_id: receiverId,
            sender_name: myName,
            receiver_name: receiverName,
        }

        const { data, error } = await supabase
            .from("kiss_events")
            .insert(payload)
            .select()
            .single()

        setIsSendingKiss(false)

        if (error) {
            console.error("kiss_events insert error", error)
            setNotification("💋 The kiss could not be sent right now.")
            return
        }

        if (data) {
            setKissHistory((prev) => [data as KissEvent, ...prev.filter((item) => item.id !== data.id)].slice(0, 8))
            setNotification(`💋 Kiss sent to ${receiverName}`)
            setKissBurst((prev) => prev + 1)
        }
    }, [myName, user])

    const renderKissDetail = selectedId === "kiss" && (
        <div className="mt-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                    type="button"
                    onClick={handleSendKiss}
                    disabled={isSendingKiss}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_18px_35px_-20px_rgba(91,58,56,0.45)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSendingKiss ? "Sending..." : `💋 Send a Kiss`}
                </button>

                {notification && (
                    <div className="rounded-full border border-[var(--champagne-deep)]/50 bg-white/85 px-3 py-2 text-xs font-medium text-foreground shadow-sm">
                        {notification}
                    </div>
                )}
            </div>

            <div className="relative overflow-hidden rounded-[1.25rem] border border-[var(--champagne-deep)]/40 bg-white/80 p-4">
                <div
                    key={kissBurst}
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    aria-hidden="true"
                >
                    {Array.from({ length: 18 }).map((_, index) => (
                        <span
                            key={`${kissBurst}-${index}`}
                            className="kiss-particle"
                            style={{
                                left: `${10 + (index * 5) % 80}%`,
                                bottom: `${8 + (index % 4) * 12}%`,
                                animationDelay: `${index * 0.06}s`,
                            }}
                        >
                            💋
                        </span>
                    ))}
                </div>

                <div className="relative">
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--rose-gold)]">Kiss history</p>
                    <div className="mt-3 space-y-2">
                        {kissHistory.length === 0 ? (
                            <p className="text-sm text-foreground/70">No kisses yet. Send the first one for your little world.</p>
                        ) : (
                            kissHistory.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--soft-beige)] px-3 py-2 text-sm text-foreground">
                                    <div>
                                        <div className="font-medium text-foreground">
                                            {entry.sender_name} → {entry.receiver_name}
                                        </div>
                                        <div className="text-[0.7rem] uppercase tracking-[0.12em] text-[var(--rose-gold)]">
                                            {getFormattedKissTime(entry.created_at)}
                                        </div>
                                    </div>
                                    <span className="text-lg">💋</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

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

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                            {selectedDestination.id === "kiss" ? "A sweet little check-in between the two of you." : selectedDestination.message}
                        </p>

                        {selectedId === "kiss" && renderKissDetail}
                    </div>
                </div>
            </div>
        </section>
    )
}
