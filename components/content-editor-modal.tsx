"use client"

import { useState, useEffect } from "react"
import { X, Save, Settings, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { useContent } from "./content-context"
import { useAuth } from "./auth-context"
import { supabase } from "@/lib/supabase-client"

export function ContentEditorButton() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg border border-border text-foreground transition-transform hover:scale-110"
        aria-label="Edit site content"
      >
        <Settings className="h-5 w-5" />
      </button>
      <ContentEditorModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

type ContentEditorModalProps = { isOpen: boolean; onClose: () => void }
type ReasonItem = { title: string; text: string }

async function upsertSection(section: string, updatedContent: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from("site_content")
    .upsert({ section, content: updatedContent }, { onConflict: "section" })
  if (error) throw error
}

const FIELD_LABELS: Record<string, Record<string, string>> = {
  hero: {
    subtitle: "Badge text", title1: "Name 1", title2: "Name 2",
    description: "Description", cta: "Button text",
  },
  counter: {
    anniversary_date: "Anniversary date (YYYY-MM-DD)",
    subtitle: "Subtitle", title: "Heading", description: "Description",
  },
  countdown: {
    subtitle: "Subtitle", title: "Heading", description: "Description",
  },
  gallery: { subtitle: "Subtitle", title: "Heading" },
  videos: { subtitle: "Subtitle", title: "Heading", description: "Caption" },
  reasons: { subtitle: "Subtitle", title: "Heading" },
  letter: {
    subtitle: "Subtitle", title: "Heading",
    from: "From name", to: "To name", date: "Date shown", message: "Letter message",
  },
  bucketlist: { subtitle: "Subtitle", title: "Heading" },
  timeline: { subtitle: "Subtitle", title: "Heading" },
  closing: { quote: "Quote", description: "Description", signature: "Signature", tagline: "Tagline" },
  envelope: {
    button: "Button text", letter_heading: "Letter heading",
    letter_names: "Names on letter", letter_footer: "Letter footer",
    welcome_message: "Welcome message",
  },
  dayliketoday: { title: "Heading", message: "Message", cta: "Button text" },
}

function ContentEditorModal({ isOpen, onClose }: ContentEditorModalProps) {
  const { content, refreshContent } = useContent()
  const [openSection, setOpenSection] = useState<string | null>("hero")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!isOpen) return null

  const sections = [
    { key: "hero", label: "Hero" },
    { key: "counter", label: "Love Counter" },
    { key: "countdown", label: "Anniversary Countdown" },
    { key: "gallery", label: "Gallery" },
    { key: "videos", label: "Videos" },
    { key: "reasons", label: "Reasons I Love You" },
    { key: "letter", label: "Love Letter" },
    { key: "bucketlist", label: "Bucket List" },
    { key: "timeline", label: "Our Timeline" },
    { key: "closing", label: "Closing" },
    { key: "envelope", label: "Intro Envelope" },
    { key: "dayliketoday", label: "Anniversary Day Popup" },
  ]

  const handleSaveField = async (section: string, key: string, value: string): Promise<boolean> => {
    setSaving(true)
    setSaveError(null)
    try {
      const currentSection = content[section] || {}
      await upsertSection(section, { ...currentSection, [key]: value })
      await refreshContent()
      return true
    } catch (err) {
      console.error("Failed to save:", err)
      setSaveError("Failed to save. Please try again.")
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSaveReasons = async (items: ReasonItem[]): Promise<boolean> => {
    setSaving(true)
    setSaveError(null)
    try {
      const currentSection = content["reasons"] || {}
      await upsertSection("reasons", { ...currentSection, items })
      await refreshContent()
      return true
    } catch (err) {
      console.error("Failed to save:", err)
      setSaveError("Failed to save. Please try again.")
      return false
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-2xl p-4 pb-24">
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-xl border border-border bg-card/95 px-5 py-3 shadow-sm backdrop-blur-md">
          <h2 className="font-serif text-xl font-semibold">Edit Site Content</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {saveError && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{saveError}</div>
        )}

        <div className="space-y-3">
          {sections.map(({ key, label }) => {
            const isSectionOpen = openSection === key
            const sectionContent = content[key] || {}
            return (
              <div key={key} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenSection(isSectionOpen ? null : key)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-medium hover:bg-muted/50 transition-colors"
                >
                  <span className="font-serif">{label}</span>
                  {isSectionOpen
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isSectionOpen && (
                  <div className="border-t border-border px-5 pb-5 pt-4">
                    {key === "reasons" ? (
                      <ReasonsEditor
                        sectionContent={sectionContent}
                        onSaveField={(fieldKey, value) => handleSaveField(key, fieldKey, value)}
                        onSaveItems={handleSaveReasons}
                        saving={saving}
                      />
                    ) : (
                      <SimpleFieldsEditor
                        sectionKey={key}
                        sectionContent={sectionContent}
                        onSave={handleSaveField}
                        saving={saving}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SimpleFieldsEditor({
  sectionKey, sectionContent, onSave, saving,
}: {
  sectionKey: string
  sectionContent: Record<string, unknown>
  onSave: (section: string, key: string, value: string) => Promise<boolean>
  saving: boolean
}) {
  const labels = FIELD_LABELS[sectionKey] || {}

  const toStrings = (sc: Record<string, unknown>) => {
    const init: Record<string, string> = {}
    Object.entries(sc).forEach(([k, v]) => {
      if (k === "items") return
      init[k] = typeof v === "string" ? v : JSON.stringify(v, null, 2)
    })
    return init
  }

  const [drafts, setDrafts] = useState<Record<string, string>>(() => toStrings(sectionContent))
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setDrafts(toStrings(sectionContent))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sectionContent)])

  const handleSave = async (fieldKey: string) => {
    const ok = await onSave(sectionKey, fieldKey, drafts[fieldKey] ?? "")
    if (ok) {
      setSaved((s) => ({ ...s, [fieldKey]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [fieldKey]: false })), 2000)
    }
  }

  return (
    <div className="space-y-4">
      {Object.entries(sectionContent)
        .filter(([k]) => k !== "items")
        .map(([fieldKey]) => {
          const label = labels[fieldKey] || fieldKey
          const draft = drafts[fieldKey] ?? ""
          const isMultiline = draft.length > 80 || draft.includes("\n")
          return (
            <div key={fieldKey} className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
              {isMultiline ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDrafts((d) => ({ ...d, [fieldKey]: e.target.value }))}
                  rows={fieldKey === "message" ? 8 : 3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDrafts((d) => ({ ...d, [fieldKey]: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              )}
              <button
                onClick={() => handleSave(fieldKey)}
                disabled={saving}
                className={`mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  saved[fieldKey]
                    ? "bg-green-500/15 text-green-700 dark:text-green-400"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                <Save className="h-3 w-3" />
                {saved[fieldKey] ? "Saved!" : "Save"}
              </button>
            </div>
          )
        })}
    </div>
  )
}

function ReasonsEditor({
  sectionContent, onSaveField, onSaveItems, saving,
}: {
  sectionContent: Record<string, unknown>
  onSaveField: (key: string, value: string) => Promise<boolean>
  onSaveItems: (items: ReasonItem[]) => Promise<boolean>
  saving: boolean
}) {
  const labels = FIELD_LABELS["reasons"] || {}
  const [subtitleDraft, setSubtitleDraft] = useState((sectionContent.subtitle as string) || "")
  const [titleDraft, setTitleDraft] = useState((sectionContent.title as string) || "")
  const [headerSaved, setHeaderSaved] = useState<Record<string, boolean>>({})
  const [items, setItems] = useState<ReasonItem[]>((sectionContent.items as ReasonItem[]) || [])
  const [itemsSaved, setItemsSaved] = useState(false)

  useEffect(() => {
    setSubtitleDraft((sectionContent.subtitle as string) || "")
    setTitleDraft((sectionContent.title as string) || "")
    setItems((sectionContent.items as ReasonItem[]) || [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sectionContent)])

  const handleSaveHeader = async (key: string, value: string) => {
    const ok = await onSaveField(key, value)
    if (ok) {
      setHeaderSaved((s) => ({ ...s, [key]: true }))
      setTimeout(() => setHeaderSaved((s) => ({ ...s, [key]: false })), 2000)
    }
  }

  const updateItem = (index: number, field: keyof ReasonItem, value: string) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))

  const handleSaveItems = async () => {
    const ok = await onSaveItems(items)
    if (ok) {
      setItemsSaved(true)
      setTimeout(() => setItemsSaved(false), 2000)
    }
  }

  return (
    <div className="space-y-5">
      {[
        { key: "subtitle", label: labels.subtitle || "Subtitle", value: subtitleDraft, set: setSubtitleDraft },
        { key: "title", label: labels.title || "Heading", value: titleDraft, set: setTitleDraft },
      ].map(({ key, label, value, set }) => (
        <div key={key} className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
          <input
            type="text" value={value}
            onChange={(e) => set(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <button
            onClick={() => handleSaveHeader(key, value)}
            disabled={saving}
            className={`mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              headerSaved[key] ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            <Save className="h-3 w-3" />
            {headerSaved[key] ? "Saved!" : "Save"}
          </button>
        </div>
      ))}

      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason cards</p>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-input bg-background p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium">Card {index + 1}</span>
                <button
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-muted-foreground">Title</label>
                <input
                  type="text" value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  className="w-full rounded border border-input bg-card px-2.5 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-muted-foreground">Text</label>
                <textarea
                  value={item.text}
                  onChange={(e) => updateItem(index, "text", e.target.value)}
                  rows={2}
                  className="w-full rounded border border-input bg-card px-2.5 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setItems((prev) => [...prev, { title: "New reason", text: "Describe why you love them." }])}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" /> Add a reason
        </button>
        <button
          onClick={handleSaveItems}
          disabled={saving}
          className={`mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            itemsSaved ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          <Save className="h-3 w-3" />
          {itemsSaved ? "Saved!" : "Save all cards"}
        </button>
      </div>
    </div>
  )
}
