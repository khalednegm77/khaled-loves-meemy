"use client"

import { useRef, useState, useEffect } from "react"
import { Film, Play, Volume2, VolumeX, VolumeOff } from "lucide-react"
import { useContent } from "./content-context"
import { useReveal } from "@/lib/use-reveal"

const allVideos: { src: string; caption: string }[] = [
  { src: "/videos/Snapchat-1109714542.mp4", caption: "Us, in motion" },
  { src: "/videos/Snapchat-1198825990.mp4", caption: "Caught mid-laugh" },
  { src: "/videos/Snapchat-1416293601.mp4", caption: "Just being us" },
  { src: "/videos/Snapchat-1712190426.mp4", caption: "Silly little moments" },
  { src: "/videos/Snapchat-1762725773.mp4", caption: "Our kind of fun" },
  { src: "/videos/Snapchat-285810565.mp4", caption: "Never a dull second" },
  { src: "/videos/Snapchat-386119415.mp4", caption: "Forever like this" },
  { src: "/videos/Snapchat-444916219.mp4", caption: "My favorite person" },
  { src: "/videos/Snapchat-460482894.mp4", caption: "Always you and me" },
  { src: "/videos/Snapchat-524881199.mp4", caption: "My favorite view" },
  { src: "/videos/Snapchat-294982742.mp4", caption: "You make my heart smile" },
  { src: "/videos/VID-20260701-WA0010.mp4", caption: "Together, always" },
  { src: "/videos/VID-20260716-WA0060.mp4", caption: "Another favorite moment" },
  { src: "/videos/VID-20260716-WA0076.mp4", caption: "A moment to replay" },
  { src: "/videos/VID-20260716-WA0081.mp4", caption: "Only us" },
  { src: "/videos/VID-20260716-WA0091.mp4", caption: "A memory in motion" },
  { src: "/videos/VID-20260716-WA0096.mp4", caption: "Forever a favorite" },
]

export function Videos() {
  const { content } = useContent()
  const videosContent = content.videos || {}
  const [errored, setErrored] = useState<Record<string, boolean>>({})
  const [retryCount, setRetryCount] = useState<Record<string, number>>({})
  const videos = allVideos

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [allMuted, setAllMuted] = useState(true)
  const [playingVideos, setPlayingVideos] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useReveal<HTMLElement>()

  // Autoplay / pause: play when visible, pause when off-screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset.index)
          const video = videoRefs.current[index]
          if (!video) return

          if (entry.isIntersecting) {
            setPlayingVideos((prev) => {
              const next = new Set(prev)
              next.add(index)
              return next
            })
            void video.play().catch(() => { })
          } else {
            setPlayingVideos((prev) => {
              const next = new Set(prev)
              next.delete(index)
              return next
            })
            video.pause()
          }
        })
      },
      { threshold: 0.4 }
    )

    const figures = containerRef.current?.querySelectorAll("[data-index]")
    figures?.forEach((f) => observer.observe(f))

    return () => observer.disconnect()
  }, [videos.length])

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) video.muted = true
    })
  }, [])

  function handleToggleSound(index: number) {
    const video = videoRefs.current[index]
    if (!video) return

    if (activeIndex === index && !video.muted) {
      video.muted = true
      setActiveIndex(null)
      setAllMuted(true)
    } else {
      videoRefs.current.forEach((v, i) => {
        if (v) v.muted = i !== index
      })
      video.muted = false
      video.volume = 1
      void video.play()
      setActiveIndex(index)
      setAllMuted(false)
    }
  }

  function handleMuteAll() {
    videoRefs.current.forEach((video) => {
      if (video) video.muted = true
    })
    setActiveIndex(null)
    setAllMuted(true)
  }

  return (
    <section
      ref={sectionRef}
      id="videos"
      className="reveal mx-auto w-full max-w-6xl overflow-hidden px-5 py-16 sm:px-6 sm:py-24"
    >
      {/* Section header */}
      <div className="mb-10 text-center sm:mb-14">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--rose-gold)] sm:text-sm">
          {videosContent.subtitle as string}
        </p>
        <h2 className="text-balance font-serif text-3xl font-semibold text-foreground sm:text-5xl">
          {videosContent.title as string}
        </h2>
        {videos.length > 0 && (
          <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {videosContent.description as string}
          </p>
        )}
      </div>

      {videos.length > 0 ? (
        <>
          {/* Mute-all control */}
          <div className="mb-5 flex justify-end sm:mb-6">
            <button
              onClick={handleMuteAll}
              disabled={allMuted}
              className="flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--champagne-deep)]/30 bg-white/60 px-5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-[var(--rose-gold)] hover:text-[var(--rose-gold)] hover:shadow-md disabled:opacity-50 disabled:hover:border-[var(--champagne-deep)]/30 disabled:hover:text-muted-foreground disabled:hover:shadow-sm"
            >
              {allMuted ? (
                <VolumeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              )}
              {allMuted ? "All muted" : "Mute all"}
            </button>
          </div>

          {/* Video grid — 1 col mobile, 2 col tablet, 3 col desktop */}
          <div
            ref={containerRef}
            className="reveal-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6"
          >
            {videos.map((video, index) => {
              const isActive = activeIndex === index
              const isPlaying = playingVideos.has(index)
              return (
                <figure
                  key={video.src}
                  data-index={index}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--champagne-deep)]/20 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] transition-all duration-500 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.2)] sm:rounded-3xl"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSound(index)}
                    className="block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rose-gold)] focus-visible:ring-offset-2"
                    aria-label={isActive ? `Mute ${video.caption}` : `Play ${video.caption} with sound`}
                  >
                    <video
                      ref={(el) => { videoRefs.current[index] = el }}
                      src={video.src}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="aspect-[9/16] h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      onError={() => {
                        const attempts = (retryCount[video.src] || 0) + 1
                        if (attempts <= 3) {
                          setRetryCount((prev) => ({ ...prev, [video.src]: attempts }))
                          const el = videoRefs.current[index]
                          if (el) {
                            setTimeout(() => { el.load() }, 800 * attempts)
                          }
                        } else {
                          setErrored((prev) => ({ ...prev, [video.src]: true }))
                        }
                      }}
                    />

                    {/* Play button overlay — desktop hover only */}
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/30 opacity-0 backdrop-blur-md transition-all duration-400 group-hover:scale-110 group-hover:opacity-100 sm:h-16 sm:w-16">
                        <Play className="h-6 w-6 fill-white text-white sm:h-7 sm:w-7" aria-hidden="true" />
                      </span>
                    </span>

                    {/* Sound indicator badge */}
                    <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors duration-300 group-hover:bg-black/55">
                      {isActive ? (
                        <Volume2 className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <VolumeX className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>

                    {/* Playing indicator dot */}
                    {isPlaying && (
                      <span className="absolute left-3 top-3 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-sm" />
                    )}

                    {/* Retry overlay for failed videos */}
                    {errored[video.src] && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
                        <p className="px-4 text-center text-sm text-white/90">Couldn&apos;t load this video</p>
                        <button
                          type="button"
                          onClick={() => {
                            setErrored((prev) => ({ ...prev, [video.src]: false }))
                            setRetryCount((prev) => ({ ...prev, [video.src]: 0 }))
                            const el = videoRefs.current[index]
                            if (el) { el.load(); el.play().catch(() => { }) }
                          }}
                          className="rounded-full bg-white/90 px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-white"
                        >
                          Tap to retry
                        </button>
                      </div>
                    )}
                  </button>

                  {/* Caption with soft gradient */}
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pb-5 font-serif text-base text-white sm:text-lg">
                    {video.caption}
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--champagne-deep)]/30 bg-white/50 px-6 py-16 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--blush)] text-[var(--rose-gold)]">
            <Film className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="font-serif text-2xl text-foreground">Your clips will live here</p>
          <p className="mt-2 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Add your video clips to the <code className="text-xs">/public/videos/</code> folder and they&apos;ll appear here.
          </p>
        </div>
      )}
    </section>
  )
}
