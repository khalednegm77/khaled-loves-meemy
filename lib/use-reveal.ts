"use client"

import { useEffect, useRef } from "react"

/**
 * Adds the `is-visible` class to the element (and optionally its children
 * via `.reveal-stagger`) when it scrolls into view. Respects
 * prefers-reduced-motion automatically — the IntersectionObserver still
 * fires, but the CSS disables the animation.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: "60px", threshold: 0.12 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
