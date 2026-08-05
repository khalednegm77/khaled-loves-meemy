"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    BookHeart,
    ChevronLeft,
    ChevronRight,
    Heart,
    HeartHandshake,
    PencilLine,
    Search,
    Sparkles,
    Trash2,
    WandSparkles,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-context"
import { supabase, supabaseConfigured } from "@/lib/supabase-client"
import { useReveal } from "@/lib/use-reveal"

type SafePlacePage = {
    id: string
    userId: string
    writerName: string
    message: string
    emotion: string
    severity: number
    needs: string[]
    createdAt: string
    updatedAt: string
    status: string
    favorite: boolean
    resolved: boolean
    conversation: Array<{ speaker: string; text: string; createdAt: string }>
}

type DraftState = {
    writerName: string
    emotion: string
    severity: number
    needs: string[]
    promptText: string
    message: string
    promptAnswers: Record<string, string>
    conversation: Array<{ speaker: string; text: string; createdAt: string }>
}

const EMOTIONS = [
    { icon: "❤️", label: "Loved" },
    { icon: "😊", label: "Happy" },
    { icon: "🥰", label: "Grateful" },
    { icon: "🥺", label: "Hurt" },
    { icon: "😔", label: "Sad" },
    { icon: "😡", label: "Angry" },
    { icon: "💔", label: "Heartbroken" },
    { icon: "🤍", label: "Confused" },
    { icon: "😞", label: "Disappointed" },
    { icon: "🙏", label: "Sorry" },
    { icon: "✨", label: "Hopeful" },
]

const NEEDS = [
    "I just wanted you to know.",
    "I want an apology.",
    "I want us to talk.",
    "I need reassurance.",
    "I need a hug ❤️",
    "I already forgive you.",
]

const PROMPTS = [
    "What happened?",
    "How did it make you feel?",
    "What made it difficult to tell me?",
    "What do you wish had happened instead?",
    "What would help you feel better now?",
]

const EMPTY_DRAFT: DraftState = {
    writerName: "",
    emotion: "🥺",
    severity: 2,
    needs: [],
    promptText: "",
    message: "",
    promptAnswers: {},
    conversation: [],
}

const STORAGE_KEY = "safe-place-pages"
const SHARED_STORAGE_KEY = `${STORAGE_KEY}:shared`

const DEDICATION = "This book belongs to two hearts... May every page bring us closer than the one before."

const READING_INVITATION = "Every feeling deserves to be understood before it's answered."

// Sentinel stored inside the conversation JSON so we can track "Do you feel
// understood?" votes without needing a new database column.
const UNDERSTOOD_MARK = "__UNDERSTOOD__"

const UNDERSTANDING_QUOTES = [
    "To love someone is to see them clearly and stay anyway.",
    "Understanding is the quietest, deepest form of love.",
    "The best relationships are built on the courage to listen.",
    "Being heard is so close to being loved that most people cannot tell the difference.",
    "Love grows where two people choose to understand instead of to win.",
    "Peace begins the moment we listen with the heart, not the ego.",
]

function understandingVotes(page: SafePlacePage) {
    return page.conversation.filter((entry) => entry.text === UNDERSTOOD_MARK)
}

function distinctUnderstanders(page: SafePlacePage) {
    return new Set(understandingVotes(page).map((entry) => entry.speaker)).size
}

function visibleConversation(page: SafePlacePage) {
    return page.conversation.filter((entry) => entry.text !== UNDERSTOOD_MARK)
}

function statusStyle(status: string) {
    switch (status) {
        case "Resolved With Love":
            return "border-[var(--rose-gold)] bg-[var(--rose-gold)]/15 text-[var(--rose-gold)]"
        case "Waiting for Other Person":
            return "border-[var(--champagne-deep)]/60 bg-[var(--champagne)]/40 text-[oklch(0.45_0.09_60)]"
        case "Discussion in Progress":
            return "border-[var(--blush-deep)]/60 bg-[var(--blush)]/60 text-[oklch(0.45_0.09_20)]"
        default:
            return "border-[var(--champagne-deep)]/50 bg-white/70 text-[oklch(0.45_0.06_25)]"
    }
}

function createPageId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function mapDbPage(row: any): SafePlacePage {
    return {
        id: row.id,
        userId: row.user_id,
        writerName: row.writer_name,
        message: row.message,
        emotion: row.emotion,
        severity: row.severity,
        needs: Array.isArray(row.needs) ? row.needs : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        status: row.status,
        favorite: Boolean(row.favorite),
        resolved: Boolean(row.resolved),
        conversation: Array.isArray(row.conversation) ? row.conversation : [],
    }
}

function mapPageToDb(page: SafePlacePage) {
    return {
        id: page.id,
        user_id: page.userId,
        writer_name: page.writerName,
        message: page.message,
        emotion: page.emotion,
        severity: page.severity,
        needs: page.needs,
        created_at: page.createdAt,
        updated_at: page.updatedAt,
        status: page.status,
        favorite: page.favorite,
        resolved: page.resolved,
        conversation: page.conversation,
    }
}

function severityLabel(value: number) {
    if (value <= 1) return "Small misunderstanding"
    if (value === 2) return "Something that bothered me"
    return "It really hurt me"
}

function getSeverityDisplay(value: number) {
    return `${"❤️".repeat(value)}${"🤍".repeat(3 - value)}`
}

export function SafePlaceBook() {
    const { user } = useAuth()
    const sectionRef = useReveal<HTMLElement>()
    const [bookOpen, setBookOpen] = useState(false)
    const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT)
    const [pages, setPages] = useState<SafePlacePage[]>([])
    const [showPrompts, setShowPrompts] = useState(false)
    const [showWriterName, setShowWriterName] = useState(true)
    const [search, setSearch] = useState("")
    const [activeFilter, setActiveFilter] = useState<"all" | "resolved" | "waiting" | "hurt" | "angry" | "happy" | "month" | "favorite">("all")
    const [editId, setEditId] = useState<string | null>(null)
    const [replyDraft, setReplyDraft] = useState("")
    const [selectedPage, setSelectedPage] = useState<number>(0)
    const [showConfirm, setShowConfirm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [replyUnlocked, setReplyUnlocked] = useState(false)
    const [celebrateId, setCelebrateId] = useState<string | null>(null)
    const [resolveQuote, setResolveQuote] = useState("")
    const touchStartX = useRef<number | null>(null)
    const touchEndX = useRef<number | null>(null)

    const pageCount = pages.length + 1

    const saveToStorage = useCallback((nextPages: SafePlacePage[]) => {
        if (typeof window === "undefined") return
        window.localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(nextPages))
    }, [])

    const loadPages = useCallback(async () => {
        if (supabaseConfigured) {
            const { data, error } = await supabase
                .from("safe_place_pages")
                .select("*")
                .order("created_at", { ascending: true })

            if (error) {
                // Surface instead of silently falling back to local/mock data.
                console.error(
                    "[v0] Failed to load safe_place_pages from Supabase:",
                    error.message,
                    "| code:",
                    error.code,
                    "| details:",
                    error.details,
                    "| hint:",
                    error.hint,
                )
            } else if (data) {
                const nextPages = data.map(mapDbPage)
                setPages(nextPages)
                saveToStorage(nextPages)
                return
            }
        } else {
            console.warn(
                "[v0] Supabase is NOT configured (missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Falling back to local storage — data will not sync to the database.",
            )
        }

        if (typeof window !== "undefined") {
            const raw = window.localStorage.getItem(SHARED_STORAGE_KEY)
            if (raw) {
                try {
                    setPages(JSON.parse(raw) as SafePlacePage[])
                    return
                } catch {
                    setPages([])
                }
            }
        }

        setPages([])
    }, [saveToStorage, user?.id])

    useEffect(() => {
        loadPages()
    }, [loadPages])

    // Real-time sync: when either linked partner writes, replies, or resolves a
    // page, refresh the shared book on every device instantly.
    useEffect(() => {
        if (!supabaseConfigured) return

        const channel = supabase
            .channel("safe-place-pages-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "safe_place_pages" },
                (payload) => {
                    console.log("[v0] Real-time update received:", payload.eventType, payload.new)
                    loadPages()
                },
            )
            .on("subscribe", () => {
                console.log("[v0] Real-time subscription connected")
            })
            .on("unsubscribe", () => {
                console.log("[v0] Real-time subscription disconnected")
            })
            .on("error", (err) => {
                console.error("[v0] Real-time subscription error:", err)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadPages])

    // Reset the reading gate whenever the reader turns to a different page.
    useEffect(() => {
        setReplyUnlocked(false)
    }, [selectedPage, activeFilter, search])

    const filteredPages = useMemo(() => {
        const searchValue = search.trim().toLowerCase()

        return pages.filter((page) => {
            const matchesSearch =
                searchValue.length === 0 ||
                [page.writerName, page.message, page.emotion, page.status, page.needs.join(" ")]
                    .join(" ")
                    .toLowerCase()
                    .includes(searchValue)

            const matchesFilter = (() => {
                if (activeFilter === "all") return true
                if (activeFilter === "resolved") return page.resolved
                if (activeFilter === "waiting") return page.status !== "Resolved With Love"
                if (activeFilter === "hurt") return page.emotion === "🥺"
                if (activeFilter === "angry") return page.emotion === "😡"
                if (activeFilter === "happy") return page.emotion === "😊" || page.emotion === "🥰"
                if (activeFilter === "month") {
                    const pageDate = new Date(page.createdAt)
                    const now = new Date()
                    return pageDate.getMonth() === now.getMonth() && pageDate.getFullYear() === now.getFullYear()
                }
                if (activeFilter === "favorite") return page.favorite
                return true
            })()

            return matchesSearch && matchesFilter
        })
    }, [pages, search, activeFilter])

    const selectedPageData = filteredPages[selectedPage] ?? null

    const resetDraft = useCallback(() => {
        setDraft({ ...EMPTY_DRAFT, writerName: draft.writerName })
        setShowPrompts(false)
        setEditId(null)
        setReplyDraft("")
    }, [draft.writerName])

    const closeAfterSave = () => {
        resetDraft()
        setSaveError(null)
        setShowConfirm(false)
        setBookOpen(false)
        setShowWriterName(true)
    }

    const handleSavePage = async () => {
        if (!draft.writerName.trim()) return

        const now = new Date().toISOString()
        const pageData: SafePlacePage = {
            id: editId ?? createPageId(),
            userId: user?.id ?? "guest",
            writerName: draft.writerName.trim(),
            message: draft.message.trim(),
            emotion: draft.emotion,
            severity: draft.severity,
            needs: draft.needs,
            createdAt: editId ? pages.find((page) => page.id === editId)?.createdAt ?? now : now,
            updatedAt: now,
            status: draft.message.trim().length > 0 ? "Waiting for Reply" : "Discussion in Progress",
            favorite: editId ? pages.find((page) => page.id === editId)?.favorite ?? false : false,
            resolved: editId ? pages.find((page) => page.id === editId)?.resolved ?? false : false,
            conversation: draft.conversation.length > 0 ? draft.conversation : [
                { speaker: draft.writerName.trim(), text: draft.message.trim(), createdAt: now },
            ],
        }

        setSaving(true)
        setSaveError(null)

        // Primary path: persist to Supabase and READ BACK from the database so the
        // UI reflects what is actually stored, not optimistic local state.
        if (supabaseConfigured) {
            const payload = mapPageToDb({
                ...pageData,
                userId: user?.id ?? pageData.userId,
            })

            const { data, error } = editId
                ? await supabase.from("safe_place_pages").update(payload).eq("id", editId).select()
                : await supabase.from("safe_place_pages").insert(payload).select()

            if (error) {
                console.error("[v0] Failed to save page to safe_place_pages:", {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                    status: error.status,
                })
                setSaveError(
                    error.message
                        ? `Could not save to the database: ${error.message}`
                        : "Could not save this page to the database. Please try again.",
                )
                setSaving(false)
                return // keep the confirmation open so the failure is visible
            }

            console.log("[v0] Saved page to safe_place_pages:", data)

            // Reload straight from Supabase (source of truth).
            await loadPages()
            setSaving(false)
            setSelectedPage(0)
            closeAfterSave()
            return
        }

        // Fallback path: Supabase not configured — keep the app usable locally but
        // make it explicit that the write did NOT reach the database.
        console.warn(
            "[v0] Supabase not configured — page saved to local storage only, NOT inserted into safe_place_pages.",
        )
        const nextPages = editId
            ? pages.map((page) => (page.id === editId ? pageData : page))
            : [...pages, pageData]
        setPages(nextPages)
        saveToStorage(nextPages)
        setSaving(false)
        setSaveError(
            "Database not connected (missing Supabase environment variables), so this page was saved locally only and will not sync.",
        )
    }

    const handleDelete = async (pageId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this page from your safe place book?")
        if (!confirmed) return

        const nextPages = pages.filter((page) => page.id !== pageId)
        setPages(nextPages)
        saveToStorage(nextPages)

        if (supabaseConfigured) {
            const { error } = await supabase.from("safe_place_pages").delete().eq("id", pageId)
            if (error) {
                console.error("[v0] Failed to delete page from safe_place_pages:", error.message, "| code:", error.code)
            } else {
                await loadPages()
            }
        }

        if (selectedPage >= filteredPages.length - 1) {
            setSelectedPage(Math.max(0, filteredPages.length - 2))
        }
    }

    const handleStartEdit = (page: SafePlacePage) => {
        setEditId(page.id)
        setBookOpen(true)
        setShowWriterName(false)
        setDraft({
            writerName: page.writerName,
            emotion: page.emotion,
            severity: page.severity,
            needs: page.needs,
            promptText: page.message,
            message: page.message,
            promptAnswers: {},
            conversation: page.conversation,
        })
    }

    const handleToggleFavorite = async (pageId: string) => {
        const target = pages.find((page) => page.id === pageId)
        if (!target) return
        const nextFavorite = !target.favorite

        const nextPages = pages.map((page) => (page.id === pageId ? { ...page, favorite: nextFavorite } : page))
        setPages(nextPages)
        saveToStorage(nextPages)

        if (supabaseConfigured) {
            const { error } = await supabase
                .from("safe_place_pages")
                .update({ favorite: nextFavorite, updated_at: new Date().toISOString() })
                .eq("id", pageId)
            if (error) {
                console.error("[v0] Failed to update favorite in safe_place_pages:", error.message, "| code:", error.code)
            }
        }
    }

    const handleReply = async (pageId: string) => {
        if (!replyDraft.trim()) return

        const page = pages.find((item) => item.id === pageId)
        if (!page) return

        const nextConversation = [
            ...page.conversation,
            { speaker: page.writerName, text: replyDraft.trim(), createdAt: new Date().toISOString() },
        ]

        const nextPages = pages.map((item) =>
            item.id === pageId ? { ...item, conversation: nextConversation, updatedAt: new Date().toISOString() } : item,
        )

        setPages(nextPages)
        saveToStorage(nextPages)
        setReplyDraft("")

        await persistConversation(pageId, nextConversation)
    }

    const persistConversation = async (
        pageId: string,
        conversation: SafePlacePage["conversation"],
        extra: Record<string, unknown> = {},
    ) => {
        if (supabaseConfigured) {
            const { error } = await supabase
                .from("safe_place_pages")
                .update({ conversation, updated_at: new Date().toISOString(), ...extra })
                .eq("id", pageId)
            if (error) {
                console.error(
                    "[v0] Failed to persist conversation to safe_place_pages:",
                    error.message,
                    "| code:",
                    error.code,
                )
            }
        }
    }

    const handleUnderstood = async (pageId: string) => {
        const page = pages.find((item) => item.id === pageId)
        if (!page) return

        const voterId = user?.id ?? "guest"
        // One vote per person — don't double count the same reader.
        if (understandingVotes(page).some((entry) => entry.speaker === voterId)) return

        const nextConversation = [
            ...page.conversation,
            { speaker: voterId, text: UNDERSTOOD_MARK, createdAt: new Date().toISOString() },
        ]

        const bothUnderstood =
            new Set(
                nextConversation
                    .filter((entry) => entry.text === UNDERSTOOD_MARK)
                    .map((entry) => entry.speaker),
            ).size >= 2

        const resolvedNow = bothUnderstood
        const nextStatus = resolvedNow ? "Resolved With Love" : "Waiting for Other Person"

        const nextPages = pages.map((item) =>
            item.id === pageId
                ? { ...item, conversation: nextConversation, resolved: resolvedNow, status: nextStatus }
                : item,
        )

        setPages(nextPages)
        saveToStorage(nextPages)

        if (resolvedNow) {
            setResolveQuote(UNDERSTANDING_QUOTES[Math.floor(Math.random() * UNDERSTANDING_QUOTES.length)])
            setCelebrateId(pageId)
            window.setTimeout(() => setCelebrateId(null), 6000)
        }

        await persistConversation(pageId, nextConversation, { resolved: resolvedNow, status: nextStatus })
    }

    const handleNotYet = async (pageId: string) => {
        const page = pages.find((item) => item.id === pageId)
        if (!page) return

        const voterId = user?.id ?? "guest"
        // Withdraw this reader's vote and reopen the discussion.
        const nextConversation = page.conversation.filter(
            (entry) => !(entry.text === UNDERSTOOD_MARK && entry.speaker === voterId),
        )

        const nextPages = pages.map((item) =>
            item.id === pageId
                ? { ...item, conversation: nextConversation, resolved: false, status: "Discussion in Progress" }
                : item,
        )

        setPages(nextPages)
        saveToStorage(nextPages)

        await persistConversation(pageId, nextConversation, { resolved: false, status: "Discussion in Progress" })
    }

    const pageTurn = () => {
        setBookOpen(true)
        setShowWriterName(true)
    }

    const goToNextPage = () => setSelectedPage((current) => Math.min(current + 1, filteredPages.length - 1))
    const goToPrevPage = () => setSelectedPage((current) => Math.max(current - 1, 0))

    const handleTouchStart = (event: React.TouchEvent) => {
        touchStartX.current = event.touches[0].clientX
        touchEndX.current = null
    }

    const handleTouchMove = (event: React.TouchEvent) => {
        touchEndX.current = event.touches[0].clientX
    }

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return

        const diff = touchStartX.current - touchEndX.current
        if (Math.abs(diff) > 40) {
            if (diff > 0) goToNextPage()
            else goToPrevPage()
        }

        touchStartX.current = null
        touchEndX.current = null
    }

    const firstSentence =
        draft.writerName.trim().length > 0
            ? `Welcome, ${draft.writerName.trim()} ❤️\n\nWrite everything your heart wants to say.\nNothing written here will ever be judged.`
            : "Who is writing today?"

    return (
        <section
            ref={sectionRef}
            id="safe-place-book"
            className="reveal mx-auto w-full max-w-6xl overflow-hidden px-5 py-16 sm:px-6 sm:py-24"
        >
            <div className="mb-10 text-center sm:mb-14">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--rose-gold)] sm:text-sm">A safe space for us</p>
                <h2 className="text-balance font-serif text-3xl font-semibold text-white sm:text-5xl">❤️ We Listen & We Fix ❤️</h2>
                <p className="mx-auto mt-4 max-w-3xl text-pretty leading-relaxed text-white">
                    Sometimes love isn&apos;t about never making mistakes. It&apos;s about having the courage to talk, the patience to listen,
                    and the love to understand. Every feeling is welcome here.
                </p>
                <Button
                    onClick={pageTurn}
                    className="mt-7 rounded-full bg-primary px-7 py-3 text-sm font-medium uppercase tracking-[0.24em] text-primary-foreground shadow-[0_20px_38px_-20px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_50px_-20px_rgba(0,0,0,0.38)]"
                >
                    <Heart className="mr-2 size-4 fill-current" />
                    Open Our Safe Place
                </Button>
            </div>

            <div className="mx-auto mb-10 max-w-2xl sm:mb-14">
                <div className="relative overflow-hidden rounded-[2rem] border border-[var(--rose-gold)]/40 bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(247,234,232,0.94))] px-7 py-10 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
                    <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/60" aria-hidden="true" />
                    <BookHeart className="mx-auto mb-4 size-7 text-[var(--rose-gold)]" />
                    <p className="text-xs uppercase tracking-[0.32em] text-[var(--rose-gold)]">Dedication</p>
                    <p className="mx-auto mt-4 max-w-md text-balance font-serif text-2xl leading-relaxed text-black sm:text-[1.75rem]">
                        {DEDICATION}
                    </p>
                    <div className="mt-5 text-xl text-[var(--rose-gold)]">khaled <span className="mx-1.5">❤</span> amyy</div>
                </div>
            </div>

            {bookOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                        {Array.from({ length: 28 }).map((_, index) => (
                            <span
                                key={index}
                                className="absolute text-[var(--rose-gold)]/80"
                                style={{
                                    left: `${(index * 13) % 100}%`,
                                    top: `${(index * 17) % 100}%`,
                                    animation: `float-heart ${5 + (index % 5)}s ease-in-out infinite`,
                                    animationDelay: `${index * 0.18}s`,
                                }}
                            >
                                ♥
                            </span>
                        ))}
                        {Array.from({ length: 28 }).map((_, index) => (
                            <span
                                key={`sparkle-${index}`}
                                className="absolute h-1.5 w-1.5 rounded-full bg-white/80"
                                style={{
                                    left: `${(index * 19) % 100}%`,
                                    top: `${(index * 23) % 100}%`,
                                    animation: `sparkle ${3 + (index % 4)}s ease-in-out infinite`,
                                    animationDelay: `${index * 0.16}s`,
                                }}
                            />
                        ))}
                    </div>

                    <div className="safe-book-shell mx-auto flex min-h-screen max-w-6xl items-start justify-center px-2 py-3 sm:px-5 sm:py-8">
                        <div className="safe-book relative max-h-[calc(100vh-1rem)] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(247,234,232,0.96))] p-3 shadow-[0_24px_80px_-26px_rgba(0,0,0,0.45)] sm:max-h-[calc(100vh-2rem)]">
                            <button
                                onClick={() => setBookOpen(false)}
                                className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-foreground shadow-sm transition-colors hover:bg-white"
                                aria-label="Close safe place book"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="book-edge absolute inset-0 rounded-[2rem] border border-[var(--rose-gold)]/40" />

                            <div className="relative grid gap-6 rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(247,235,233,0.98))] p-4 lg:grid-cols-[1.05fr_1.2fr] lg:p-6">
                                <div className="book-page-left relative overflow-hidden rounded-[1.5rem] border border-[var(--rose-gold)]/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(252,245,240,0.94))] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]">
                                    <div className="mb-5 flex items-center justify-between gap-3 text-sm font-medium text-[var(--rose-gold)]">
                                        <span className="flex items-center gap-2"><BookHeart className="size-4" /> Our Safe Place</span>
                                        <span>Page {pageCount} of {Math.max(pageCount, 1)}</span>
                                    </div>

                                    <div className="rounded-[1.25rem] border border-[var(--champagne-deep)]/40 bg-white/70 p-4 shadow-sm">
                                        <h3 className="font-serif text-2xl text-black">{showWriterName ? "Who is writing today?" : "Welcome, your heart"}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-black">{firstSentence}</p>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-medium text-black">Your Name</span>
                                            <input
                                                value={draft.writerName}
                                                onChange={(e) => setDraft((prev) => ({ ...prev, writerName: e.target.value }))}
                                                placeholder="Your Name"
                                                className="w-full rounded-xl border border-[var(--champagne-deep)]/50 bg-white/80 px-4 py-3 text-sm text-black outline-none transition focus:border-[var(--rose-gold)] focus:ring-2 focus:ring-[var(--rose-gold)]/25"
                                                required
                                            />
                                        </label>

                                        {draft.writerName.trim() && (
                                            <div className="rounded-2xl bg-[var(--blush)]/70 p-4 text-sm leading-relaxed text-black">
                                                Welcome, {draft.writerName.trim()} ❤️
                                                <br />
                                                Write everything your heart wants to say. Nothing written here will ever be judged.
                                            </div>
                                        )}

                                        <div className="rounded-2xl border border-[var(--champagne-deep)]/40 bg-white/70 p-4">
                                            <div className="mb-3 text-sm font-medium text-black">Choose your mood</div>
                                            <div className="flex flex-wrap gap-2">
                                                {EMOTIONS.map((emotion) => (
                                                    <button
                                                        key={emotion.label}
                                                        type="button"
                                                        onClick={() => setDraft((prev) => ({ ...prev, emotion: emotion.icon }))}
                                                        className={cn(
                                                            "rounded-full border px-3 py-2 text-sm transition-all",
                                                            draft.emotion === emotion.icon
                                                                ? "border-[var(--rose-gold)] bg-[var(--blush)] text-foreground"
                                                                : "border-[var(--champagne-deep)]/40 bg-white text-black hover:border-[var(--rose-gold)]",
                                                        )}
                                                    >
                                                        <span className="mr-1">{emotion.icon}</span>
                                                        {emotion.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="book-page-right relative overflow-hidden rounded-[1.5rem] border border-[var(--rose-gold)]/35 bg-[linear-gradient(180deg,rgba(255,253,251,0.98),rgba(253,248,243,0.96))] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]">
                                    <div className="mb-5 flex items-center gap-2 rounded-full border border-[var(--champagne-deep)]/45 bg-white/75 px-3 py-2 text-xs uppercase tracking-[0.24em] text-[var(--rose-gold)]">
                                        <Sparkles className="size-3.5" />
                                        Heartfelt note
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-[var(--champagne-deep)]/40 bg-white/70 p-4">
                                            <div className="mb-2 text-sm font-medium text-black">How serious is this?</div>
                                            <input
                                                type="range"
                                                min={1}
                                                max={3}
                                                value={draft.severity}
                                                onChange={(e) => setDraft((prev) => ({ ...prev, severity: Number(e.target.value) }))}
                                                className="w-full accent-[var(--rose-gold)]"
                                            />
                                            <div className="mt-2 flex items-center justify-between text-xs text-black">
                                                <span>💗 Small misunderstanding</span>
                                                <span>❤️ Something that bothered me</span>
                                                <span>💔 It really hurt me</span>
                                            </div>
                                            <p className="mt-2 text-sm text-black">Selected level: {severityLabel(draft.severity)}</p>
                                        </div>

                                        <div className="rounded-2xl border border-[var(--champagne-deep)]/40 bg-white/70 p-4">
                                            <div className="mb-2 text-sm font-medium text-black">What do you need from me?</div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {NEEDS.map((need) => {
                                                    const checked = draft.needs.includes(need)
                                                    return (
                                                        <label key={need} className="flex items-center gap-2 rounded-xl bg-[var(--soft-beige)] px-3 py-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() =>
                                                                    setDraft((prev) => ({
                                                                        ...prev,
                                                                        needs: checked ? prev.needs.filter((item) => item !== need) : [...prev.needs, need],
                                                                    }))
                                                                }
                                                                className="accent-[var(--rose-gold)]"
                                                            />
                                                            <span>{need}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-[var(--champagne-deep)]/40 bg-white/70 p-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowPrompts((prev) => !prev)}
                                                className="inline-flex items-center gap-2 rounded-full bg-[var(--blush)] px-4 py-2 text-sm font-medium text-foreground"
                                            >
                                                <WandSparkles className="size-4" />
                                                ❤️ Help Me Express My Feelings
                                            </button>

                                            {showPrompts && (
                                                <div className="mt-3 grid gap-2">
                                                    {PROMPTS.map((prompt) => (
                                                        <label key={prompt} className="block text-sm text-black">
                                                            <span className="mb-1 block">{prompt}</span>
                                                            <textarea
                                                                rows={2}
                                                                value={draft.promptAnswers[prompt] ?? ""}
                                                                onChange={(e) =>
                                                                    setDraft((prev) => ({
                                                                        ...prev,
                                                                        promptAnswers: { ...prev.promptAnswers, [prompt]: e.target.value },
                                                                    }))
                                                                }
                                                                className="w-full rounded-xl border border-[var(--champagne-deep)]/50 bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-[var(--rose-gold)] focus:ring-2 focus:ring-[var(--rose-gold)]/25"
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-2xl border border-[var(--champagne-deep)]/40 bg-white/70 p-4">
                                            <label className="block text-sm font-medium text-black">
                                                Your message
                                                <textarea
                                                    rows={7}
                                                    value={draft.message}
                                                    onChange={(e) => setDraft((prev) => ({ ...prev, message: e.target.value }))}
                                                    placeholder="Tell me everything..."
                                                    className="mt-2 w-full rounded-xl border border-[var(--champagne-deep)]/50 bg-white/90 px-3 py-3 text-sm outline-none transition focus:border-[var(--rose-gold)] focus:ring-2 focus:ring-[var(--rose-gold)]/25"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <Button
                                            onClick={() => {
                                                setSaveError(null)
                                                setShowConfirm(true)
                                            }}
                                            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                                            disabled={!draft.writerName.trim() || !draft.message.trim()}
                                        >
                                            ❤️ Save This Page
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={resetDraft}
                                            className="rounded-full border-[var(--champagne-deep)]/50 bg-white/70 px-5 py-2.5 text-sm font-medium"
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[2rem] border border-[var(--rose-gold)]/40 bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(247,235,233,0.98))] p-7 shadow-[0_28px_70px_-28px_rgba(0,0,0,0.5)]">
                        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--rose-gold)]">
                            <Heart className="size-4 fill-current" />
                            Before You Send
                        </div>
                        <p className="text-sm leading-relaxed text-black">
                            Take a breath, {draft.writerName.trim() || "love"}. These words will live on our page forever. Are they
                            what your heart truly wants to say?
                        </p>

                        <div className="mt-4 grid gap-3 rounded-2xl border border-[var(--champagne-deep)]/40 bg-white/75 p-4 text-sm text-black">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span><strong>From:</strong> {draft.writerName.trim() || "—"}</span>
                                <span><strong>Mood:</strong> {draft.emotion}</span>
                                <span><strong>Severity:</strong> {getSeverityDisplay(draft.severity)}</span>
                            </div>
                            {draft.needs.length > 0 && (
                                <div><strong>Needs:</strong> {draft.needs.join(", ")}</div>
                            )}
                            <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[var(--soft-beige)] p-3 leading-relaxed">
                                {draft.message.trim() || "…"}
                            </p>
                        </div>

                        {saveError && (
                            <p
                                role="alert"
                                className="mt-4 rounded-xl border border-[oklch(0.6_0.18_25)]/40 bg-[oklch(0.95_0.05_25)] px-4 py-3 text-sm text-[oklch(0.4_0.15_25)]"
                            >
                                {saveError}
                            </p>
                        )}

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSaveError(null)
                                    setShowConfirm(false)
                                }}
                                disabled={saving}
                                className="rounded-full border-[var(--champagne-deep)]/50 bg-white/70 px-6 py-2.5 text-sm font-medium"
                            >
                                <PencilLine className="mr-2 size-4" />
                                Edit
                            </Button>
                            <Button
                                onClick={handleSavePage}
                                disabled={saving}
                                className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                            >
                                <Heart className="mr-2 size-4 fill-current" />
                                {saving ? "Saving..." : "Send With Love"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.35fr]">
                <div className="rounded-[2rem] border border-[var(--champagne-deep)]/40 bg-white/65 p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                    <div className="mb-4 flex items-center gap-2 rounded-full border border-[var(--champagne-deep)]/45 bg-[var(--soft-beige)] px-3 py-2 text-xs uppercase tracking-[0.24em] text-[var(--rose-gold)]">
                        <Search className="size-3.5" />
                        Search & filter
                    </div>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search writer, date, emotion, status or keyword"
                        className="w-full rounded-xl border border-[var(--champagne-deep)]/50 bg-white/85 px-4 py-3 text-sm outline-none focus:border-[var(--rose-gold)] focus:ring-2 focus:ring-[var(--rose-gold)]/25"
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                        {[
                            ["all", "All"],
                            ["resolved", "Resolved"],
                            ["waiting", "Waiting"],
                            ["hurt", "Hurt"],
                            ["angry", "Angry"],
                            ["happy", "Happy"],
                            ["month", "This Month"],
                            ["favorite", "Favorites"],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setActiveFilter(value as typeof activeFilter)}
                                className={cn(
                                    "rounded-full border px-3 py-2 text-xs font-medium transition-all",
                                    activeFilter === value
                                        ? "border-[var(--rose-gold)] bg-[var(--blush)] text-foreground"
                                        : "border-[var(--champagne-deep)]/45 bg-white/80 text-black hover:border-[var(--rose-gold)]",
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--champagne-deep)]/40 bg-white/65 p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                    {filteredPages.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed border-[var(--champagne-deep)]/45 bg-[var(--soft-beige)] px-6 py-16 text-center">
                            <h3 className="font-serif text-2xl text-black">Our story hasn&apos;t written its first page yet.</h3>
                            <p className="mt-3 text-sm leading-relaxed text-black">
                                Whenever something is too difficult to say... Write it here. I&apos;ll always listen.
                            </p>
                        </div>
                    ) : (
                        <div
                            className="space-y-5"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--rose-gold)]">Page {selectedPage + 1} of {filteredPages.length}</p>
                                    <h3 className="font-serif text-2xl text-black">Written by {selectedPageData?.writerName}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={goToPrevPage}
                                        className="rounded-full border border-[var(--champagne-deep)]/45 bg-white/80 p-2 text-muted-foreground hover:text-[var(--rose-gold)]"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={goToNextPage}
                                        className="rounded-full border border-[var(--champagne-deep)]/45 bg-white/80 p-2 text-muted-foreground hover:text-[var(--rose-gold)]"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>

                            {selectedPageData && (
                                <article className="rounded-[1.75rem] border border-[var(--champagne-deep)]/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,245,239,0.95))] p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.22)]">
                                    <div className="grid gap-3 text-sm text-black sm:grid-cols-2">
                                        <div><strong>Written by:</strong> {selectedPageData.writerName}</div>
                                        <div><strong>Date:</strong> {new Date(selectedPageData.createdAt).toLocaleDateString()}</div>
                                        <div><strong>Mood:</strong> {selectedPageData.emotion}</div>
                                        <div><strong>Severity:</strong> {getSeverityDisplay(selectedPageData.severity)}</div>
                                        <div className="sm:col-span-2"><strong>Needs:</strong> {selectedPageData.needs.join(", ") || "—"}</div>
                                    </div>

                                    <div className="mt-3">
                                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", statusStyle(selectedPageData.status))}>
                                            {selectedPageData.resolved ? "❤️" : "🤍"} {selectedPageData.status}
                                        </span>
                                    </div>

                                    <div className="mt-5 rounded-[1.5rem] bg-white/85 p-4 shadow-sm">
                                        <p className="whitespace-pre-wrap leading-relaxed text-black">{selectedPageData.message}</p>
                                    </div>

                                    <div className="mt-5 rounded-[1.5rem] border border-[var(--champagne-deep)]/40 bg-white/80 p-4">
                                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-black">
                                            <HeartHandshake className="size-4 text-[var(--rose-gold)]" />
                                            Conversation
                                        </div>
                                        <div className="space-y-3">
                                            {visibleConversation(selectedPageData).map((entry, index) => (
                                                <div key={`${entry.createdAt}-${index}`} className="rounded-xl bg-[var(--soft-beige)] px-3 py-2">
                                                    <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-[var(--rose-gold)]">
                                                        <span>{entry.speaker}</span>
                                                        <span className="tracking-normal text-[oklch(0.55_0.03_25)]">
                                                            {new Date(entry.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm leading-relaxed text-black">{entry.text}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {replyUnlocked ? (
                                            <div className="mt-3 flex gap-2">
                                                <textarea
                                                    rows={2}
                                                    value={replyDraft}
                                                    onChange={(e) => setReplyDraft(e.target.value)}
                                                    placeholder="Reply inside this page"
                                                    className="flex-1 rounded-xl border border-[var(--champagne-deep)]/50 bg-white/90 px-3 py-2 text-sm text-black outline-none focus:border-[var(--rose-gold)] focus:ring-2 focus:ring-[var(--rose-gold)]/25"
                                                />
                                                <Button
                                                    onClick={() => handleReply(selectedPageData.id)}
                                                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                                                >
                                                    Reply
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="mt-4 rounded-2xl border border-dashed border-[var(--rose-gold)]/50 bg-[var(--blush)]/40 px-4 py-5 text-center">
                                                <p className="mx-auto max-w-md text-pretty font-serif text-lg italic leading-relaxed text-black">
                                                    &ldquo;{READING_INVITATION}&rdquo;
                                                </p>
                                                <Button
                                                    onClick={() => setReplyUnlocked(true)}
                                                    className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
                                                >
                                                    <Heart className="mr-2 size-4 fill-current" />
                                                    I&apos;ve listened — let me reply
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Do you feel understood? — resolves only when BOTH hearts agree */}
                                    {selectedPageData.resolved ? (
                                        <div className={cn(
                                            "relative mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--rose-gold)]/50 bg-[linear-gradient(160deg,rgba(255,246,244,0.95),rgba(247,232,229,0.97))] p-6 text-center",
                                            celebrateId === selectedPageData.id && "resolved-celebrate",
                                        )}>
                                            {celebrateId === selectedPageData.id && (
                                                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                                                    {Array.from({ length: 18 }).map((_, index) => (
                                                        <span
                                                            key={`petal-${index}`}
                                                            className="petal"
                                                            style={{
                                                                left: `${(index * 5.5) % 100}%`,
                                                                animationDelay: `${(index % 6) * 0.35}s`,
                                                                animationDuration: `${4 + (index % 4)}s`,
                                                            }}
                                                        >
                                                            🌹
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="relative">
                                                <div className="text-4xl">❤️</div>
                                                <div className="golden-seal mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--rose-gold)] bg-[linear-gradient(120deg,var(--champagne),var(--rose-gold))] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.4)]">
                                                    <Sparkles className="size-4" />
                                                    Resolved With Love ❤️
                                                </div>
                                                {resolveQuote && (
                                                    <p className="mx-auto mt-4 max-w-md text-pretty font-serif text-lg italic leading-relaxed text-black">
                                                        &ldquo;{resolveQuote}&rdquo;
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-5 rounded-[1.5rem] border border-[var(--champagne-deep)]/40 bg-white/80 p-5 text-center">
                                            <div className="mb-1 text-3xl">💔</div>
                                            <h4 className="font-serif text-xl text-black">Do you feel understood?</h4>
                                            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[oklch(0.45_0.04_25)]">
                                                The broken heart becomes whole only when both of you choose Yes.
                                                {distinctUnderstanders(selectedPageData) === 1 && " One heart is already waiting…"}
                                            </p>
                                            <div className="mt-4 flex flex-wrap justify-center gap-3">
                                                <Button
                                                    onClick={() => handleUnderstood(selectedPageData.id)}
                                                    disabled={understandingVotes(selectedPageData).some((v) => v.speaker === (user?.id ?? "guest"))}
                                                    className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                                                >
                                                    Yes ❤️
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleNotYet(selectedPageData.id)}
                                                    className="rounded-full border-[var(--champagne-deep)]/50 bg-white/70 px-6 py-2.5 text-sm font-medium"
                                                >
                                                    Not Yet 🤍
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-5 flex flex-wrap gap-2">
                                        <Button onClick={() => handleStartEdit(selectedPageData)} className="rounded-full bg-[var(--blush)] px-4 py-2 text-sm font-medium text-foreground">
                                            <PencilLine className="mr-2 size-4" />
                                            Edit
                                        </Button>
                                        <Button onClick={() => handleDelete(selectedPageData.id)} variant="outline" className="rounded-full border-[var(--champagne-deep)]/50 bg-white/80 px-4 py-2 text-sm font-medium">
                                            <Trash2 className="mr-2 size-4" />
                                            Delete
                                        </Button>
                                        <Button onClick={() => handleToggleFavorite(selectedPageData.id)} variant="outline" className="rounded-full border-[var(--champagne-deep)]/50 bg-white/80 px-4 py-2 text-sm font-medium">
                                            {selectedPageData.favorite ? "★ Favorite" : "☆ Favorite"}
                                        </Button>
                                    </div>
                                </article>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-[var(--champagne-deep)]/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(249,239,235,0.96))] p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.24)]">
                <div className="text-center">
                    <h3 className="font-serif text-3xl text-black">❤️ Our Promise ❤️</h3>
                    <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-black">
                        No matter how many pages this book has, we promise to choose listening over silence, understanding over pride,
                        forgiveness over anger, and love over everything else.
                    </p>
                    <div className="mt-4 text-2xl text-[var(--rose-gold)]">khaled <span className="mx-2">❤</span> amyy</div>
                </div>
            </div>
        </section>
    )
}
