"use client"

import { Heart } from "lucide-react"
import { useState } from "react"
import { useContent } from "./content-context"

type LoveLetterEnvelopeProps = {
  onOpen: () => void
}

export function LoveLetterEnvelope({ onOpen }: LoveLetterEnvelopeProps) {
  const { content } = useContent()
  const envelope = content.envelope || {}

  const button = (envelope.button as string) || "Open Your Love Letter"
  const letterHeading = (envelope.letter_heading as string) || "With all my love"
  const letterNames = (envelope.letter_names as string) || "khaled & amyy"
  const letterFooter = (envelope.letter_footer as string) || "Forever & Always"
  const welcomeMessage = (envelope.welcome_message as string) || "Welcome to our story"

  const [stage, setStage] = useState<"sealed" | "opening" | "open" | "revealing">("sealed")
  const [showButton, setShowButton] = useState(true)

  const handleOpen = () => {
    setShowButton(false)
    setStage("opening")
    setTimeout(() => setStage("open"), 1200)
    setTimeout(() => setStage("revealing"), 1800)
    setTimeout(() => onOpen(), 3000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#f5e6d3] via-[#f9f1e6] to-[#fefcfa]">
      {/* Decorative hearts floating */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            <Heart className="h-4 w-4 fill-primary/20 text-primary/20" />
          </div>
        ))}
      </div>

      <div className="relative flex flex-col items-center">
        {/* Envelope container */}
        <div
          className="relative w-80 h-56"
          style={{ perspective: "1000px" }}
        >
          {/* Envelope body */}
          <div className="absolute inset-0 rounded-lg shadow-xl bg-gradient-to-br from-[#e8d4b8] to-[#d4bc94] border-2 border-[#c9a878]">
            {/* Inner envelope pattern */}
            <div className="absolute inset-2 rounded border border-[#c9a878]/50" />

            {/* Wax seal */}
            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                stage === "sealed" ? "opacity-100 scale-100" : "opacity-0 scale-150"
              }`}
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#b91c1c] to-[#7f1d1d] shadow-lg flex items-center justify-center">
                  <Heart className="h-8 w-8 fill-white text-white" />
                </div>
                {/* Seal drips */}
                <div className="absolute -bottom-1 left-1/2 w-3 h-4 bg-[#b91c1c] rounded-b-full -translate-x-1/2" />
                <div className="absolute -bottom-2 left-1/3 w-2 h-3 bg-[#b91c1c] rounded-b-full" />
                <div className="absolute -bottom-1 right-1/3 w-2 h-3 bg-[#b91c1c] rounded-b-full" />
              </div>
            </div>
          </div>

          {/* Envelope flap */}
          <div
            className="absolute left-0 right-0 top-0 h-28 origin-top"
            style={{
              transform: stage === "sealed" ? "rotateX(0deg)" : "rotateX(180deg)",
              transformStyle: "preserve-3d",
              transition: "transform 1.2s ease-in-out",
            }}
          >
            {/* Outside of flap */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#d4bc94] to-[#c9a878] rounded-t-lg border-2 border-b-0 border-[#b89560]"
              style={{
                clipPath: "polygon(0 0, 50% 100%, 100% 0)",
                backfaceVisibility: "hidden",
              }}
            />
            {/* Inside of flap */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#f5e6d3] to-[#e8d4b8]"
              style={{
                clipPath: "polygon(0 0, 50% 100%, 100% 0)",
                backfaceVisibility: "hidden",
                transform: "rotateX(180deg)",
              }}
            />
          </div>

          {/* Letter */}
          <div
            className="absolute inset-x-4 bottom-4 top-20 overflow-hidden rounded shadow-lg transition-all duration-1000 ease-out"
            style={{
              transform: stage === "sealed" || stage === "opening"
                ? "translateY(0) rotateX(0deg)"
                : "translateY(-120px) rotateX(-15deg)",
              transformOrigin: "bottom center",
            }}
          >
            <div className="h-full bg-gradient-to-b from-[#fefcfa] to-[#f5e6d3] p-6 flex flex-col items-center justify-center text-center border border-[#e8d4b8]">
              <Heart className="h-6 w-6 fill-primary text-primary mb-3" />
              <p className="font-serif text-lg text-foreground">{letterHeading}</p>
              <p className="mt-2 text-sm text-muted-foreground font-serif italic">{letterNames}</p>
              <div className="mt-4 w-16 h-px bg-primary/30" />
              <p className="mt-3 text-xs text-muted-foreground">{letterFooter}</p>
            </div>
          </div>
        </div>

        {/* Open button */}
        {showButton && (
          <button
            onClick={handleOpen}
            className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-serif text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            {button}
          </button>
        )}

        {/* Message */}
        {stage === "open" && (
          <p className="mt-8 font-serif text-xl text-foreground animate-fade-in">
            {welcomeMessage}
          </p>
        )}
      </div>

      {/* Fade to white overlay */}
      <div
        className={`fixed inset-0 bg-background pointer-events-none transition-opacity duration-1000 ${
          stage === "revealing" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  )
}
