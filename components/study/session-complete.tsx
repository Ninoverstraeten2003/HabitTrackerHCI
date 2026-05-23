'use client'

import { useRouter } from 'next/navigation'

interface SessionCompleteProps {
  condition: 'accordion' | 'radial'
  participantId: number
  taskSetLabel: string
  conditionIndex: number
  results?: { task: string; time: number; timeout: boolean }[]
}

const CONDITION_COLOR = { accordion: 'bg-teal-500', radial: 'bg-orange-500' }
const CONDITION_LABEL = { accordion: 'Accordion List', radial: 'Radial Menu' }

export function SessionComplete({
  condition,
  participantId,
  taskSetLabel,
  conditionIndex,
  results = [],
}: SessionCompleteProps) {
  const router = useRouter()
  const isFirstCondition = conditionIndex === 0

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full flex flex-col items-center gap-6 text-center">
        {/* Badge */}
        <div className={`w-16 h-16 rounded-full ${CONDITION_COLOR[condition]} flex items-center justify-center`}>
          <svg
            className="w-9 h-9 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-semibold text-foreground mb-2 text-balance">
            Condition {conditionIndex + 1} Complete
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Participant <strong className="text-foreground">P{participantId}</strong> finished{' '}
            <strong className="text-foreground">{CONDITION_LABEL[condition]}</strong> (Task Set{' '}
            {taskSetLabel}).
          </p>
        </div>

        {/* Questionnaire reminder */}
        <div className="w-full bg-card border border-border rounded-xl p-5 text-left">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">
            Facilitator — Do Now
          </p>
          <ul className="text-sm text-foreground space-y-2 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-primary font-bold shrink-0">1.</span>
              <span>
                Administer the{' '}
                <a
                  href="https://forms.gle/jKPpcyWEayeToAtB9"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Custom Post-Condition Questionnaire
                </a>{' '}
                for the <strong>{CONDITION_LABEL[condition]}</strong> condition.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold shrink-0">2.</span>
              Record task error counts from your observation notes. (Times are logged below)
            </li>
            {isFirstCondition && (
              <li className="flex gap-2">
                <span className="text-primary font-bold shrink-0">3.</span>
                Give the participant a short break before launching Condition 2.
              </li>
            )}
          </ul>
        </div>

        {/* Results Table */}
        {results.length > 0 && (
          <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-left">
                Task Completion Times
              </p>
            </div>
            <div className="divide-y divide-border">
              {results.map((res, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium text-foreground">{res.task}</span>
                  <div className="flex items-center gap-3">
                    {res.timeout ? (
                      <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded">Timeout</span>
                    ) : (
                      <span className="font-mono text-muted-foreground">{res.time}s</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          {isFirstCondition ? (
            <button
              onClick={() => router.push('/')}
              className={`w-full py-3 rounded-xl text-sm font-semibold text-white ${CONDITION_COLOR[condition]} hover:opacity-90 transition-opacity`}
            >
              Back to Dashboard — Launch Condition 2
            </button>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:opacity-90 transition-opacity"
            >
              All Conditions Complete — Back to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
