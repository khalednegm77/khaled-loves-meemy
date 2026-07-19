"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/lib/supabase-client"

type ContentContextType = {
  content: Record<string, Record<string, unknown>>
  loading: boolean
  refreshContent: () => Promise<void>
}

const defaultContent = {
  hero: {
    subtitle: "Our Love Story",
    title1: "khaled",
    title2: "amyy",
    description: "Two hearts, one beautiful story — written one ordinary, extraordinary day at a time.",
    cta: "See how long we've loved",
  },
  counter: {
    anniversary_date: "2025-10-20",
    subtitle: "Together since 20 October 2025",
    title: "Every second has been ours",
    description:
      "And the count keeps climbing — just like the way I fall for you a little more with each passing day.",
  },
  countdown: {
    subtitle: "Our next anniversary",
    title: "Counting down to us",
    description: "Every day that passes is one day closer to celebrating you again.",
  },
  gallery: {
    subtitle: "Moments we keep",
    title: "Our favorite memories",
  },
  videos: {
    subtitle: "Moments in motion",
    title: "Our memories, alive",
    description: "Tap any clip to turn its sound on.",
  },
  reasons: {
    subtitle: "From me to you",
    title: "Reasons I love you",
    items: [
      { title: "Your smile", text: "It turns the most ordinary moments into the ones I never want to forget." },
      { title: "The way you listen", text: "You make me feel heard, understood, and completely at home." },
      { title: "Your kindness", text: "The gentle way you treat the world reminds me how lucky I am to be yours." },
      { title: "Our inside jokes", text: "A whole language only we understand, built from a thousand little moments." },
      { title: "How you dream", text: "Every plan we make for the future feels brighter because you're in it." },
      { title: "Just being you", text: "I could list a thousand reasons, but really it all comes down to this." },
    ],
  },
  letter: {
    subtitle: "Only for you",
    title: "A letter from my heart",
    from: "khaled",
    to: "meemy",
    date: "20.10.2025",
    message:
      'bosy b"a ya meemy ya meemy\n\nana m4 3aref abda" mneen bs bgd ana bhb a3ee4 kol haga m3aky w sa3at kteer awy bgd lma b"3od lwahdy bfdl afakar feh hyatna m3 b3d ezay m4 3aref at5ylha mn 8eerek bgd\n\nkhalas rsmt most"bly 3leeky enty b"eety a8la haga feh hyaty w kol hyaty b34" kol tafseela feky bgd mn as8arhom l akbarhom\n\nbhb dehkna w hezarna w mrazytna feh b3d tool el wa"t bhb habtl bhb el tefla el gwaky awy bgd\n\nw 3omry ma tl3t 4a5syty deh m3 7d 8erek bgd w bt3rfy ttl3eny mn aw7sh mood mmkn awslo feh sanya bgd\n\nenty geety khalyty 7yaty b\'t helwa awy w nesfsy akmla m3aky bgd w bhbk awy ya meemy bgd.',
  },
  bucketlist: {
    subtitle: "Our dreams together",
    title: "Things we'll do",
    items: [
      { text: "Going to the cinema together", done: false, emoji: "🎬" },
      { text: "Sushi date", done: false, emoji: "🍣" },
      { text: "Meet each other", done: true, emoji: "🤗" },
      { text: "Live in the same city & hangout every day", done: false, emoji: "🏡" },
      { text: "Marry you", done: false, emoji: "💍" },
      { text: "Going to McDonald's on the wedding night with the dress", done: false, emoji: "🌙" },
      { text: "Honeymoon at Bali", done: false, emoji: "🌴" },
      { text: "Walk at the garden", done: false, emoji: "🌸" },
      { text: "Eating Pizza Hut", done: true, emoji: "🍕" },
      { text: "13/7 Prom together", done: false, emoji: "🎓" },
      { text: "30/6 Prom together", done: false, emoji: "🎓" },
      { text: "Watching Elle3ba", done: false, emoji: "🎮" },
      { text: "Omha trda 3ny", done: false, emoji: "🤲" },
    ],
  },
  timeline: {
    subtitle: "Our journey",
    title: "Every moment with you",
    items: [
      {
        date: "31 Dec 2025",
        emoji: "✈️",
        title: "Our First Trip",
        description: "The very first adventure we shared together — the start of everything.",
      },
      {
        date: "13 Jan 2026",
        emoji: "🌹",
        title: "A Date at the Terrace",
        description: "Our second date, just the two of us, at the terrace.",
      },
      {
        date: "23 Jan 2026",
        emoji: "🌙",
        title: "The Club Date",
        description: "Another night I keep replaying in my head.",
      },
      {
        date: "11 Feb 2026",
        emoji: "🏫",
        title: "Third Date at School",
        description: "Who knew school could feel this good.",
      },
      {
        date: "15 Feb 2026",
        emoji: "☕",
        title: "Coffee Island",
        description: "Coffee tastes better when it's with you.",
      },
      {
        date: "5 Mar 2026",
        emoji: "🌙",
        title: "School Sohoor",
        description: "One of my absolute best days at school — with you there.",
      },
      {
        date: "27 Mar 2026",
        emoji: "🎂",
        title: "Meemy's Birthday",
        description:
          "One of the best best days in my life. I broke my own rules just to see you happy.",
      },
      {
        date: "29 Apr 2026",
        emoji: "👕",
        title: "You Signed My T-shirt",
        description: "You signed my school t-shirt and stayed with me all day long.",
      },
      {
        date: "11 May 2026",
        emoji: "🕊️",
        title: "Making Things Right",
        description:
          "I made you upset, then came to school just to reconcile — because losing you, even for a moment, isn't an option.",
      },
      {
        date: "20 May 2026",
        emoji: "🎉",
        title: "Last Day at School",
        description:
          "We celebrated together and you picked me to go eat Pizza Hut. One of the sweetest endings.",
      },
      {
        date: "11 Jun 2026",
        emoji: "💔",
        title: "Last Time We Met",
        description: "The last day I saw you in person. I've missed you every single day since.",
      },
    ],
  },
  closing: {
    quote: "In a sea of people, my eyes will always search for you.",
    description:
      "Thank you for every laugh, every hug, and every quiet moment in between. You are my favorite person, my best friend, and my greatest adventure. I love you more than words could ever say.",
    signature: "khaled & amyy",
    tagline: "Forever & always",
  },
  envelope: {
    button: "Open Your Love Letter",
    letter_heading: "With all my love",
    letter_names: "khaled & amyy",
    letter_footer: "Forever & Always",
    welcome_message: "Welcome to our story",
  },
  dayliketoday: {
    title: "Happy Anniversary, Meemy 🤍",
    message:
      "One more year of you. One more year of us. I'd choose this, again and again, forever.",
    cta: "Keep reading our story",
  },
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Record<string, Record<string, unknown>>>(defaultContent)
  const [loading, setLoading] = useState(true)

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase.from("site_content").select("section, content")
      if (error) throw error
      if (data && data.length > 0) {
        const contentMap: Record<string, Record<string, unknown>> = {}
        data.forEach((item) => {
          contentMap[item.section] = item.content as Record<string, unknown>
        })
        setContent({ ...defaultContent, ...contentMap })
      }
    } catch (err: unknown) {
      // PGRST205 means the site_content table hasn't been created yet —
      // the app falls back to defaultContent, so no error badge needed.
      const code = (err as { code?: string })?.code
      if (code !== "PGRST205") {
        console.error("Failed to fetch content:", err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [])

  return (
    <ContentContext.Provider value={{ content, loading, refreshContent: fetchContent }}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const context = useContext(ContentContext)
  if (context === undefined) {
    throw new Error("useContent must be used within a ContentProvider")
  }
  return context
}
