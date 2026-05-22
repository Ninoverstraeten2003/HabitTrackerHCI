'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Task } from '@/lib/study-data'
import { TASK_TIMEOUT_SECONDS } from '@/lib/study-data'

interface TaskPanelProps {
  tasks: Task[]
  currentIndex: number
  onNext: (timedOut?: boolean) => void
  condition: 'accordion' | 'radial'
  participantId: number
}

const CONDITION_COLOR = {
  accordion: 'bg-teal-500',
  radial: 'bg-orange-500',
}
const CONDITION_RING = {
  accordion: 'ring-teal-400',
  radial: 'ring-orange-400',
}

export function TaskPanel({ tasks, currentIndex, onNext, condition, participantId }: TaskPanelProps) {
  const task = tasks[currentIndex]
  const isLast = currentIndex === tasks.length - 1

  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setRunning(false)
  }, [])

  // Reset on task change
  useEffect(() => {
    stopTimer()
    setElapsed(0)
    setRunning(false)
    setTimedOut(false)
  }, [currentIndex, stopTimer])

  // Tick
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1
        if (next >= TASK_TIMEOUT_SECONDS) {
          stopTimer()
          setTimedOut(true)
        }
        return next
      })
    }, 1000)
    return () => stopTimer()
  }, [running, stopTimer])

  const progress = Math.min((elapsed / TASK_TIMEOUT_SECONDS) * 100, 100)
  const remaining = TASK_TIMEOUT_SECONDS - elapsed
  const isWarning = remaining <= 30 && remaining > 0

  return (
    <aside className="w-full md:w-72 shrink-0 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col">
      {/* Header */}
      <div className={`${CONDITION_COLOR[condition]} text-white px-5 py-4`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium uppercase tracking-widest opacity-80">
            {condition === 'accordion' ? 'Accordion List' : 'Radial Menu'}
          </span>
          <span className="text-xs font-mono opacity-80">P{participantId}</span>
        </div>
        <p className="text-sm font-semibold">
          Task {currentIndex + 1} of {tasks.length}
        </p>
      </div>

      {/* Task */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {task.type}
          </span>
          {task.isWoZ && (
            <span className="ml-2 text-xs bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 font-medium">
              WoZ
            </span>
          )}
        </div>
        <p className="text-sm text-foreground leading-relaxed text-pretty">
          {task.instruction}
        </p>

        {/* Timer area */}
        <div className="mt-auto flex flex-col gap-3">
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                timedOut
                  ? 'bg-destructive'
                  : isWarning
                  ? 'bg-amber-500'
                  : `${CONDITION_COLOR[condition]}`
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-mono font-semibold ${
                timedOut ? 'text-destructive' : isWarning ? 'text-amber-600' : 'text-muted-foreground'
              }`}
            >
              {timedOut ? 'TIMED OUT' : `${remaining}s`}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{elapsed}s elapsed</span>
          </div>

          {/* Timer controls */}
          <div className="flex gap-2">
            {!running && !timedOut && elapsed === 0 && (
              <button
                onClick={() => setRunning(true)}
                className={`flex-1 text-xs font-semibold text-white py-2 rounded-lg ${CONDITION_COLOR[condition]} hover:opacity-90 transition-opacity`}
              >
                Start Timer
              </button>
            )}
            {running && (
              <button
                onClick={stopTimer}
                className="flex-1 text-xs font-semibold text-white py-2 rounded-lg bg-muted-foreground hover:opacity-90 transition-opacity"
              >
                Pause
              </button>
            )}
            {!running && elapsed > 0 && !timedOut && (
              <button
                onClick={() => setRunning(true)}
                className={`flex-1 text-xs font-semibold text-white py-2 rounded-lg ${CONDITION_COLOR[condition]} hover:opacity-90 transition-opacity`}
              >
                Resume
              </button>
            )}
          </div>

          {/* Next task */}
          <button
            onClick={() => onNext(timedOut)}
            className={`w-full text-sm font-semibold py-2.5 rounded-xl ring-2 ${CONDITION_RING[condition]} ${CONDITION_COLOR[condition]} text-white hover:opacity-90 active:scale-95 transition-all`}
          >
            {timedOut
              ? 'Mark Timeout & Next'
              : isLast
              ? 'Finish Condition'
              : 'Mark Done & Next'}
          </button>
        </div>
      </div>

      {/* Task progress dots */}
      <div className="px-5 pb-5 flex gap-1.5 justify-center">
        {tasks.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i < currentIndex
                ? `${CONDITION_COLOR[condition]} w-4`
                : i === currentIndex
                ? `${CONDITION_COLOR[condition]} w-6`
                : 'bg-muted w-4'
            }`}
          />
        ))}
      </div>
    </aside>
  )
}
