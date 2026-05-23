'use client'

import { useEffect, useState } from 'react'

interface WozOverlayProps {
  visible: boolean
  onDismiss: () => void
  action?: string
}

export function WozOverlay({ visible, onDismiss, action = 'Archive All' }: WozOverlayProps) {
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (visible) {
      setAnimating(true)
      const t = setTimeout(() => {
        onDismiss()
        setAnimating(false)
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [visible, onDismiss])


  if (!visible && !animating) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-5 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-9 h-9 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-1">Success!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">{action}</strong> completed successfully.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Wizard of Oz — auto-dismissing…
        </div>

        <button
          onClick={() => { setAnimating(false); onDismiss() }}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Dismiss early
        </button>
      </div>
    </div>
  )
}
