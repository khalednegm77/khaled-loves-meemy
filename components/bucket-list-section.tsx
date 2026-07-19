"use client"

import { useState, useEffect } from "react"
import { useContent } from "./content-context"
import { supabase } from "@/lib/supabase-client"

type BucketItem = { text: string; done: boolean; emoji: string }

const LS_KEY = "bucketlist_checked"

function loadLocal(): Record<number, boolean> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}")
  } catch {
    return {}
  }
}

function saveLocal(map: Record<number, boolean>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map))
  } catch { /* ignore */ }
}

export function BucketListSection() {
  const { content, refreshContent } = useContent()
  const bucketlist = content.bucketlist || {}
  const baseItems = (bucketlist.items as BucketItem[]) || []

  const [localOverrides, setLocalOverrides] = useState<Record<number, boolean>>({})

  useEffect(() => {
    setLocalOverrides(loadLocal())
  }, [])

  const items = baseItems.map((item, i) =>
    i in localOverrides ? { ...item, done: localOverrides[i] } : item
  )

  const handleToggle = async (index: number) => {
    const newDone = !items[index].done
    const newOverrides = { ...localOverrides, [index]: newDone }
    setLocalOverrides(newOverrides)
    saveLocal(newOverrides)

    const updated = items.map((item, i) =>
      i === index ? { ...item, done: newDone } : item
    )

    try {
      const { error } = await supabase
        .from("site_content")
        .upsert(
          { section: "bucketlist", content: { ...bucketlist, items: updated } },
          { onConflict: "section" }
        )
      if (!error) {
        const cleared = { ...newOverrides }
        delete cleared[index]
        setLocalOverrides(cleared)
        saveLocal(cleared)
        await refreshContent()
      }
    } catch { /* local state already applied */ }
  }

  return (
    <section id="bucketlist" className="mx-auto w-full max-w-4xl px-6 py-20 sm:py-28">
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-accent-foreground">
          {bucketlist.subtitle as string}
        </p>
        <h2 className="text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
          {bucketlist.title as string}
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleToggle(index)}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/30 hover:shadow-sm"
          >
            <span
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                item.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              }`}
            >
              {item.done && (
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>

            <span className="text-2xl">{item.emoji}</span>

            <span className="font-serif text-base leading-snug text-foreground">
              {item.text}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
