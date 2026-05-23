'use client'

import { Suspense, useCallback, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getTasksForSet, INITIAL_CATEGORIES, type HabitCategory, type Habit } from '@/lib/study-data'
import { TaskPanel } from '@/components/study/task-panel'
import { WozOverlay } from '@/components/study/woz-overlay'
import { SessionComplete } from '@/components/study/session-complete'

// ─── Radial menu types ────────────────────────────────────────────────────────
type RadialLevel = 'root' | 'category' | 'habit' | 'action' | 'stats' | 'add' | 'edit'

interface RadialState {
  level: RadialLevel
  selectedCategoryId: string | null
  selectedHabitId: string | null
  subMenu: 'stats' | 'edit' | 'delete' | null
}

// ─── Radial Menu SVG ──────────────────────────────────────────────────────────
interface RadialSlice {
  label: string
  sublabel?: string
  color: string
  textColor?: string
  id: string
  icon?: string
  isDanger?: boolean
}

interface RadialMenuProps {
  items: RadialSlice[]
  onSelect: (id: string) => void
  title?: string
  subtitle?: string
  centerLabel?: string
  onBack?: () => void
}

const TWO_PI = Math.PI * 2

function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToCart(cx, cy, r, startDeg)
  const e = polarToCart(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
}

function RadialMenu({ items, onSelect, title, subtitle, centerLabel, onBack }: RadialMenuProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  // Fixed logical coordinate space — all math stays the same
  const cx = 200
  const cy = 200
  const outerR = 180
  const innerR = 58
  const total = items.length
  const sliceDeg = 360 / total

  return (
    <div className="flex flex-col items-center gap-2 select-none w-full">
      {title && (
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">{title}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {/* SVG fills available width up to a generous max, stays square */}
      <svg
        viewBox="0 0 400 400"
        className="w-full max-w-[460px]"
        style={{ aspectRatio: '1 / 1' }}
        aria-label="Radial navigation menu"
        role="menu"
      >
        {items.map((item, i) => {
          const start = i * sliceDeg
          const end = (i + 1) * sliceDeg
          const midDeg = start + sliceDeg / 2
          const isHov = hovered === item.id
          const textR = innerR + (outerR - innerR) * 0.55
          const tp = polarToCart(cx, cy, textR, midDeg)
          const scale = isHov ? 1.04 : 1

          return (
            <g
              key={item.id}
              role="menuitem"
              aria-label={item.label}
              style={{ cursor: 'pointer', transform: `scale(${scale})`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform 0.12s ease' }}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(item.id)}
            >
              <path
                d={describeArc(cx, cy, outerR, start, end)}
                fill={isHov ? `${item.color}dd` : item.color}
                stroke="white"
                strokeWidth={3}
              />
              {/* Primary label */}
              <text
                x={tp.x}
                y={tp.y - (item.sublabel ? 10 : 0)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight="600"
                fill={item.textColor ?? 'white'}
                style={{ pointerEvents: 'none' }}
              >
                {item.label.length > 12 ? item.label.slice(0, 11) + '…' : item.label}
              </text>
              {item.sublabel && (
                <text
                  x={tp.x}
                  y={tp.y + 13}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fill={item.textColor ?? 'rgba(255,255,255,0.80)'}
                  style={{ pointerEvents: 'none' }}
                >
                  {item.sublabel}
                </text>
              )}
            </g>
          )
        })}

        {/* Center circle / back button */}
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill="white"
          stroke="#e5e7eb"
          strokeWidth={2}
          style={{ cursor: onBack ? 'pointer' : 'default' }}
          onClick={onBack}
        />
        {onBack && (
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={22}
            fill="#6b7280"
            style={{ pointerEvents: 'none' }}
          >
            ←
          </text>
        )}
        <text
          x={cx}
          y={onBack ? cy + 14 : cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fill="#9ca3af"
          style={{ pointerEvents: 'none' }}
        >
          {centerLabel ?? (onBack ? 'back' : 'select')}
        </text>
      </svg>

      {/* Hover tooltip */}
      <div className="h-7 flex items-center justify-center">
        {hovered && (
          <p className="text-sm font-medium text-foreground animate-in fade-in duration-100">
            {items.find((i) => i.id === hovered)?.label}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main study component ─────────────────────────────────────────────────────
function RadialStudy() {
  const params = useSearchParams()
  const pid = parseInt(params.get('pid') ?? '1', 10)
  const taskSet = (params.get('taskSet') ?? 'A') as 'A' | 'B'
  const conditionIndex = parseInt(params.get('conditionIndex') ?? '0', 10)
  const tasks = getTasksForSet(taskSet)

  const [taskIndex, setTaskIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [showWoz, setShowWoz] = useState(false)
  const [taskResults, setTaskResults] = useState<{ task: string; time: number; timeout: boolean }[]>([])

  // App state
  const [categories, setCategories] = useState<HabitCategory[]>(INITIAL_CATEGORIES)

  // Navigation state
  const [radial, setRadial] = useState<RadialState>({
    level: 'root',
    selectedCategoryId: null,
    selectedHabitId: null,
    subMenu: null,
  })

  // Form state
  const [newName, setNewName] = useState('')
  const [newFreq, setNewFreq] = useState('Daily')
  const [newReminder, setNewReminder] = useState('08:00')
  const [editReminder, setEditReminder] = useState('')
  const [formResult, setFormResult] = useState<string | null>(null)

  const handleNext = useCallback((elapsedTime: number, timedOut: boolean) => {
    setTaskResults((prev) => [...prev, { task: tasks[taskIndex].id, time: elapsedTime, timeout: timedOut }])
    if (taskIndex < tasks.length - 1) {
      setTaskIndex((i) => i + 1)
      setRadial({ level: 'root', selectedCategoryId: null, selectedHabitId: null, subMenu: null })
      setFormResult(null)
    } else {
      setDone(true)
    }
  }, [taskIndex, tasks])

  const selectedCategory = categories.find((c) => c.id === radial.selectedCategoryId) ?? null
  const selectedHabit = selectedCategory?.habits.find((h) => h.id === radial.selectedHabitId) ?? null

  // ── Root menu slices: categories ──────────────────────────────────────────
  const CAT_COLORS = ['#0ea5a0', '#f97316', '#6366f1', '#94a3b8', '#22c55e']
  const rootSlices: RadialSlice[] = categories.map((cat, i) => ({
    id: cat.id,
    label: cat.name,
    sublabel: `${cat.habits.length} habits`,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }))

  // ── Category menu slices: habits ──────────────────────────────────────────
  const categorySlices: RadialSlice[] = selectedCategory
    ? [
        ...selectedCategory.habits.slice(0, 5).map((h) => ({
          id: h.id,
          label: h.name,
          sublabel: `🔥 ${h.streak}`,
          color: CAT_COLORS[categories.findIndex((c) => c.id === selectedCategory.id) % CAT_COLORS.length],
        })),
        {
          id: '__add__',
          label: '+ Add',
          sublabel: 'new habit',
          color: '#64748b',
        },
        ...(selectedCategory.id === 'old-goals' || selectedCategory.id === 'finished'
          ? [{
              id: '__bulk__',
              label: selectedCategory.id === 'old-goals' ? 'Archive All' : 'Export All',
              sublabel: 'bulk action',
              color: '#374151',
            }]
          : []),
      ]
    : []

  // ── Habit action slices ───────────────────────────────────────────────────
  const habitColor =
    selectedCategory
      ? CAT_COLORS[categories.findIndex((c) => c.id === selectedCategory.id) % CAT_COLORS.length]
      : '#0ea5a0'

  const habitActionSlices: RadialSlice[] = [
    { id: 'stats', label: 'Weekly Stats', sublabel: 'streak', color: '#0891b2' },
    { id: 'edit', label: 'Edit Reminder', sublabel: 'time', color: habitColor },
    { id: 'delete', label: 'Delete', sublabel: 'habit', color: '#dc2626', isDanger: true },
    { id: 'back', label: 'Back', sublabel: 'to habits', color: '#94a3b8' },
  ]

  // ── Root select: go to category ───────────────────────────────────────────
  function onRootSelect(id: string) {
    setRadial({ level: 'category', selectedCategoryId: id, selectedHabitId: null, subMenu: null })
    setFormResult(null)
  }

  // ── Category select: go to habit or add / bulk ─────────────────────────────
  function onCategorySelect(id: string) {
    if (id === '__add__') {
      setNewName('')
      setNewFreq('Daily')
      setNewReminder('08:00')
      setRadial((r) => ({ ...r, level: 'add' }))
    } else if (id === '__bulk__') {
      setShowWoz(true)
    } else {
      setRadial((r) => ({ ...r, level: 'habit', selectedHabitId: id, subMenu: null }))
    }
    setFormResult(null)
  }

  // ── Habit action select ───────────────────────────────────────────────────
  function onHabitActionSelect(id: string) {
    if (id === 'back') {
      setRadial((r) => ({ ...r, level: 'category', selectedHabitId: null }))
    } else if (id === 'delete') {
      if (!selectedHabit || !selectedCategory) return
      setCategories((cats) =>
        cats.map((c) =>
          c.id === selectedCategory.id
            ? { ...c, habits: c.habits.filter((h) => h.id !== selectedHabit.id) }
            : c
        )
      )
      setFormResult(`Deleted "${selectedHabit.name}"`)
      setRadial((r) => ({ ...r, level: 'category', selectedHabitId: null }))
    } else if (id === 'stats') {
      setRadial((r) => ({ ...r, level: 'stats' }))
    } else if (id === 'edit') {
      setEditReminder(selectedHabit?.reminder ?? '08:00')
      setRadial((r) => ({ ...r, level: 'edit' }))
    }
  }

  function saveEdit() {
    if (!selectedHabit) return
    setCategories((cats) =>
      cats.map((c) => ({
        ...c,
        habits: c.habits.map((h) =>
          h.id === selectedHabit.id ? { ...h, reminder: editReminder } : h
        ),
      }))
    )
    setFormResult(`Reminder for "${selectedHabit.name}" set to ${editReminder}`)
    setRadial((r) => ({ ...r, level: 'category', selectedHabitId: null }))
  }

  function saveAddHabit() {
    if (!newName.trim() || !selectedCategory) return
    const newHabit: Habit = {
      id: `new-${Date.now()}`,
      name: newName.trim(),
      frequency: newFreq,
      reminder: newReminder,
      streak: 0,
      categoryId: selectedCategory.id,
    }
    setCategories((cats) =>
      cats.map((c) =>
        c.id === selectedCategory.id ? { ...c, habits: [...c.habits, newHabit] } : c
      )
    )
    setFormResult(`Added "${newHabit.name}" to ${selectedCategory.name}`)
    setRadial((r) => ({ ...r, level: 'category' }))
  }

  const currentTask = tasks[taskIndex]

  if (done) {
    return (
      <SessionComplete
        condition="radial"
        participantId={pid}
        taskSetLabel={taskSet}
        conditionIndex={conditionIndex}
        results={taskResults}
      />
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <TaskPanel
        tasks={tasks}
        currentIndex={taskIndex}
        onNext={handleNext}
        condition="radial"
        participantId={pid}
      />

      {/* App area */}
      <div className="flex-1 flex flex-col">
        {/* App header */}
        <header className="bg-orange-500 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-base">My Habits</h1>
            <p className="text-xs opacity-80">Radial Menu</p>
          </div>
          <span className="text-xs font-mono bg-white/20 rounded-full px-3 py-1">
            Task {taskIndex + 1} / {tasks.length}
          </span>
        </header>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 px-5 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30 min-h-8">
          <button
            onClick={() => setRadial({ level: 'root', selectedCategoryId: null, selectedHabitId: null, subMenu: null })}
            className="hover:text-foreground transition-colors"
          >
            Home
          </button>
          {radial.selectedCategoryId && (
            <>
              <span>/</span>
              <button
                onClick={() => setRadial((r) => ({ ...r, level: 'category', selectedHabitId: null, subMenu: null }))}
                className="hover:text-foreground transition-colors"
              >
                {selectedCategory?.name}
              </button>
            </>
          )}
          {radial.selectedHabitId && radial.level === 'habit' && (
            <>
              <span>/</span>
              <span className="text-foreground font-medium">{selectedHabit?.name}</span>
            </>
          )}
          {radial.level === 'stats' && <><span>/</span><span className="text-foreground font-medium">Stats</span></>}
          {radial.level === 'edit' && <><span>/</span><span className="text-foreground font-medium">Edit Reminder</span></>}
          {radial.level === 'add' && <><span>/</span><span className="text-foreground font-medium">Add Habit</span></>}
        </div>

        {/* Result flash */}
        {formResult && (
          <div className="mx-5 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {formResult}
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-4 md:p-8">

          {/* ── ROOT: category wheel ── */}
          {radial.level === 'root' && (
            <RadialMenu
              items={rootSlices}
              onSelect={onRootSelect}
              title="Select a Category"
              subtitle="Tap a segment to open"
              centerLabel="categories"
            />
          )}

          {/* ── CATEGORY: habit wheel ── */}
          {radial.level === 'category' && selectedCategory && (
            <RadialMenu
              items={categorySlices}
              onSelect={onCategorySelect}
              title={selectedCategory.name}
              subtitle={`${selectedCategory.habits.length} habits`}
              centerLabel="habits"
              onBack={() => setRadial({ level: 'root', selectedCategoryId: null, selectedHabitId: null, subMenu: null })}
            />
          )}

          {/* ── HABIT ACTIONS ── */}
          {radial.level === 'habit' && selectedHabit && (
            <RadialMenu
              items={habitActionSlices}
              onSelect={onHabitActionSelect}
              title={selectedHabit.name}
              subtitle={`${selectedHabit.frequency} · 🔥 ${selectedHabit.streak} streak`}
              centerLabel="actions"
              onBack={() => setRadial((r) => ({ ...r, level: 'category', selectedHabitId: null }))}
            />
          )}

          {/* ── STATS ── */}
          {radial.level === 'stats' && selectedHabit && (
            <div className="w-full max-w-sm flex flex-col gap-5">
              <button
                onClick={() => setRadial((r) => ({ ...r, level: 'habit' }))}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h2 className="text-lg font-semibold text-foreground">{selectedHabit.name} — Weekly Stats</h2>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 flex items-center gap-4">
                <span className="text-3xl" aria-hidden="true">🔥</span>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {selectedHabit.streak} <span className="text-base font-normal">days</span>
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">This Week</p>
                <div className="flex items-end gap-2 h-24">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const completed = i < 5
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t-sm ${completed ? 'bg-orange-400' : 'bg-muted'}`}
                          style={{ height: completed ? `${55 + (i * 11) % 35}px` : '20px' }}
                        />
                        <span className="text-xs text-muted-foreground">{day}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Completion Rate</p>
                  <p className="text-xl font-bold text-foreground">71%</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Best Streak</p>
                  <p className="text-xl font-bold text-foreground">{selectedHabit.streak + 4} days</p>
                </div>
              </div>
            </div>
          )}

          {/* ── EDIT REMINDER ── */}
          {radial.level === 'edit' && selectedHabit && (
            <div className="w-full max-w-sm flex flex-col gap-5">
              <button
                onClick={() => setRadial((r) => ({ ...r, level: 'habit' }))}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h2 className="text-lg font-semibold text-foreground">Edit Reminder</h2>
              <p className="text-sm text-muted-foreground -mt-3">
                Habit: <strong className="text-foreground">{selectedHabit.name}</strong>
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Current Reminder</label>
                <p className="text-2xl font-bold text-muted-foreground">{selectedHabit.reminder}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">New Reminder Time</label>
                <input
                  type="time"
                  value={editReminder}
                  onChange={(e) => setEditReminder(e.target.value)}
                  className="border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                onClick={saveEdit}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:opacity-90 transition-opacity"
              >
                Save Reminder
              </button>
            </div>
          )}

          {/* ── ADD HABIT ── */}
          {radial.level === 'add' && selectedCategory && (
            <div className="w-full max-w-sm flex flex-col gap-5">
              <button
                onClick={() => setRadial((r) => ({ ...r, level: 'category' }))}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h2 className="text-lg font-semibold text-foreground">Add New Habit</h2>
              <p className="text-sm text-muted-foreground -mt-3">
                Adding to: <strong className="text-foreground">{selectedCategory.name}</strong>
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Habit Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Read 10 pages"
                    className="border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Frequency</label>
                  <select
                    value={newFreq}
                    onChange={(e) => setNewFreq(e.target.value)}
                    className="border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Reminder Time</label>
                  <input
                    type="time"
                    value={newReminder}
                    onChange={(e) => setNewReminder(e.target.value)}
                    className="border border-input rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  onClick={saveAddHabit}
                  disabled={!newName.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add Habit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WoZ Overlay */}
      <WozOverlay
        visible={showWoz}
        onDismiss={() => setShowWoz(false)}
        action={
          currentTask?.id.includes('T5')
            ? taskSet === 'A'
              ? 'Archive All — Old Goals'
              : 'Export All — Finished'
            : 'Action'
        }
      />
    </div>
  )
}

export default function RadialPage() {
  return (
    <Suspense>
      <RadialStudy />
    </Suspense>
  )
}
