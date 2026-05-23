'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getParticipantConditions } from '@/lib/study-data'

const CONDITION_LABELS = { accordion: 'Accordion List', radial: 'Radial Menu' }
const CONDITION_BG = { accordion: 'bg-teal-500', radial: 'bg-orange-500' }
const CONDITION_CARD = {
  accordion: 'bg-teal-50 border-teal-200',
  radial: 'bg-orange-50 border-orange-200',
}
const CONDITION_TEXT = { accordion: 'text-teal-800', radial: 'text-orange-800' }

export default function FacilitatorDashboard() {
  const router = useRouter()
  const [pid, setPid] = useState('')

  const pidNum = parseInt(pid, 10)
  const isValid = !isNaN(pidNum) && pidNum >= 1 && pidNum <= 99
  const conditions = isValid ? getParticipantConditions(pidNum) : null

  function handleStart(conditionIndex: number) {
    if (!isValid || !conditions) return
    const { condition, taskSet } = conditions[conditionIndex]
    const path = `/study/${condition}?pid=${pidNum}&taskSet=${taskSet}&conditionIndex=${conditionIndex}`
    router.push(path)
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Habit Tracker HCI Study</h1>
            <p className="text-sm text-muted-foreground">Facilitator Dashboard</p>
          </div>
          <span className="text-xs font-mono bg-muted text-muted-foreground px-3 py-1 rounded-full border border-border">
            FACILITATOR ONLY
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Study overview */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: 'Study Design', value: 'Within-Subjects' },
            { label: 'Conditions', value: 'Accordion / Radial' },
            { label: 'Task Timeout', value: '120 seconds' },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </section>

        {/* Counterbalancing */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-3">Counterbalancing Scheme</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="font-medium text-foreground mb-2">Odd IDs — P1, P3, P5…</p>
              <p className="text-muted-foreground">1st: Accordion (Task Set A)</p>
              <p className="text-muted-foreground">2nd: Radial (Task Set B)</p>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="font-medium text-foreground mb-2">Even IDs — P2, P4, P6…</p>
              <p className="text-muted-foreground">1st: Radial (Task Set A)</p>
              <p className="text-muted-foreground">2nd: Accordion (Task Set B)</p>
            </div>
          </div>
        </section>

        {/* Start session */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-5">Start Session</h2>

          <div className="flex items-center gap-3 mb-6">
            <label htmlFor="pid-input" className="text-sm font-medium text-foreground whitespace-nowrap">
              Participant ID
            </label>
            <input
              id="pid-input"
              type="number"
              min={1}
              max={99}
              value={pid}
              onChange={(e) => setPid(e.target.value)}
              placeholder="e.g. 3"
              className="border border-input bg-background rounded-lg px-4 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {pid && !isValid && (
              <span className="text-sm text-destructive">Enter a number 1–99</span>
            )}
          </div>

          {conditions && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground mb-1">
                Session order for <strong className="text-foreground">P{pidNum}</strong>:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {conditions.map((c, i) => (
                  <div
                    key={i}
                    className={`border rounded-xl p-5 flex flex-col gap-4 ${CONDITION_CARD[c.condition]}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${CONDITION_BG[c.condition]}`}
                      >
                        {i + 1}
                      </span>
                      <span className={`font-semibold text-sm ${CONDITION_TEXT[c.condition]}`}>
                        {CONDITION_LABELS[c.condition]}
                      </span>
                      <span className="ml-auto text-xs font-mono bg-white/70 rounded-full px-2 py-0.5 border border-current/10">
                        Task Set {c.taskSet}
                      </span>
                    </div>
                    <button
                      onClick={() => handleStart(i)}
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95 ${CONDITION_BG[c.condition]}`}
                    >
                      Launch Condition {i + 1}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Protocol reminders */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-3">Protocol Reminders</h2>
          <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">Timer start</span>
              <span>Participant&apos;s first interaction after reading the task.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-semibold shrink-0">Timer end</span>
              <span>Target state is visible or participant says &quot;Done&quot;.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-destructive font-semibold shrink-0">Timeout</span>
              <span>120 s reached — say &quot;Let&apos;s move on.&quot; Mark as failure.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-foreground font-semibold shrink-0">Error</span>
              <span>Any click that does not progress the task. Hesitation is NOT an error.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-600 font-semibold shrink-0">WoZ T5</span>
              <span>The &quot;Success&quot; overlay will trigger automatically when the participant clicks the correct bulk-action button.</span>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
