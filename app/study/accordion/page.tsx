'use client'

import { Suspense, useCallback, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getTasksForSet, INITIAL_CATEGORIES, type HabitCategory, type Habit } from '@/lib/study-data'
import { TaskPanel } from '@/components/study/task-panel'
import { WozOverlay } from '@/components/study/woz-overlay'
import { SessionComplete } from '@/components/study/session-complete'

function AccordionStudy() {
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
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [view, setView] = useState<'list' | 'stats' | 'add' | 'edit'>('list')
  const [addCatId, setAddCatId] = useState<string>('')

  // Add habit form state
  const [newName, setNewName] = useState('')
  const [newFreq, setNewFreq] = useState('Daily')
  const [newReminder, setNewReminder] = useState('08:00')

  // Edit reminder state
  const [editReminder, setEditReminder] = useState('')

  const handleNext = useCallback((elapsedTime: number, timedOut: boolean) => {
    setTaskResults((prev) => [...prev, { task: tasks[taskIndex].id, time: elapsedTime, timeout: timedOut }])
    if (taskIndex < tasks.length - 1) {
      setTaskIndex((i) => i + 1)
      setSelectedHabit(null)
      setView('list')
    } else {
      setDone(true)
    }
  }, [taskIndex, tasks])

  function toggleCategory(id: string) {
    setExpandedCat((prev) => (prev === id ? null : id))
    setSelectedHabit(null)
    setView('list')
  }

  function selectHabit(habit: Habit) {
    setSelectedHabit(habit)
    setView('list')
  }

  function openStats(habit: Habit) {
    setSelectedHabit(habit)
    setView('stats')
  }

  function openEdit(habit: Habit) {
    setSelectedHabit(habit)
    setEditReminder(habit.reminder)
    setView('edit')
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
    setSelectedHabit(null)
    setView('list')
  }

  function deleteHabit(habit: Habit) {
    setCategories((cats) =>
      cats.map((c) => ({
        ...c,
        habits: c.habits.filter((h) => h.id !== habit.id),
      }))
    )
    setSelectedHabit(null)
    setView('list')
  }

  function openAddHabit(catId: string) {
    setAddCatId(catId)
    setNewName('')
    setNewFreq('Daily')
    setNewReminder('08:00')
    setView('add')
  }

  function saveNewHabit() {
    if (!newName.trim()) return
    const newHabit: Habit = {
      id: `new-${Date.now()}`,
      name: newName.trim(),
      frequency: newFreq,
      reminder: newReminder,
      streak: 0,
      categoryId: addCatId,
    }
    setCategories((cats) =>
      cats.map((c) => (c.id === addCatId ? { ...c, habits: [...c.habits, newHabit] } : c))
    )
    setView('list')
  }

  function triggerWoz() {
    setShowWoz(true)
  }

  if (done) {
    return (
      <SessionComplete
        condition="accordion"
        participantId={pid}
        taskSetLabel={taskSet}
        conditionIndex={conditionIndex}
        results={taskResults}
      />
    )
  }

  const currentTask = tasks[taskIndex]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <TaskPanel
        tasks={tasks}
        currentIndex={taskIndex}
        onNext={handleNext}
        condition="accordion"
        participantId={pid}
      />

      {/* App area */}
      <div className="flex-1 flex flex-col">
        {/* App header */}
        <header className="bg-teal-500 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-base">My Habits</h1>
            <p className="text-xs opacity-80">Accordion List</p>
          </div>
          <span className="text-xs font-mono bg-white/20 rounded-full px-3 py-1">
            Task {taskIndex + 1} / {tasks.length}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <div className="divide-y divide-border">
              {categories.map((cat) => (
                <div key={cat.id}>
                  {/* Category row */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-foreground">{cat.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {cat.habits.length} habit{cat.habits.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                          expandedCat === cat.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded habits */}
                  {expandedCat === cat.id && (
                    <div className="bg-muted/30 border-t border-border">
                      {cat.habits.map((habit) => (
                        <div
                          key={habit.id}
                          className={`flex items-center justify-between px-6 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${
                            selectedHabit?.id === habit.id ? 'bg-accent' : ''
                          }`}
                          onClick={() => selectHabit(habit)}
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{habit.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {habit.frequency} · {habit.reminder}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                              🔥 {habit.streak}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Habit actions when selected */}
                      {selectedHabit && cat.habits.find((h) => h.id === selectedHabit.id) && (
                        <div className="px-6 py-3 bg-card border-t border-border flex flex-wrap gap-2">
                          <button
                            onClick={() => openStats(selectedHabit)}
                            className="text-xs font-medium bg-muted border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors"
                          >
                            Weekly Stats
                          </button>
                          <button
                            onClick={() => openEdit(selectedHabit)}
                            className="text-xs font-medium bg-muted border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors"
                          >
                            Edit Reminder
                          </button>
                          <button
                            onClick={() => deleteHabit(selectedHabit)}
                            className="text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {/* Add habit + bulk action */}
                      <div className="px-6 py-3 flex items-center justify-between">
                        <button
                          onClick={() => openAddHabit(cat.id)}
                          className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1"
                        >
                          <span aria-hidden="true">+</span> Add habit
                        </button>
                        {(cat.id === 'old-goals' || cat.id === 'finished') && (
                          <button
                            onClick={triggerWoz}
                            className="text-xs font-medium bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-200 transition-colors text-slate-600"
                          >
                            {cat.id === 'old-goals' ? 'Archive All' : 'Export All'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── STATS VIEW ── */}
          {view === 'stats' && selectedHabit && (
            <div className="p-6 flex flex-col gap-5">
              <button
                onClick={() => setView('list')}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedHabit.name}</h2>
                <p className="text-sm text-muted-foreground">Weekly Statistics</p>
              </div>

              {/* Streak highlight */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 flex items-center gap-4">
                <span className="text-3xl" aria-hidden="true">🔥</span>
                <div>
                  <p className="text-sm text-teal-700 font-medium">Current Streak</p>
                  <p className="text-3xl font-bold text-teal-600">
                    {selectedHabit.streak} <span className="text-base font-normal">days</span>
                  </p>
                </div>
              </div>

              {/* Weekly bar chart (static) */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  This Week
                </p>
                <div className="flex items-end gap-2 h-24">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const done = i < 5
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t-sm transition-all ${
                            done ? 'bg-teal-400' : 'bg-muted'
                          }`}
                          style={{ height: done ? `${60 + Math.random() * 30}px` : '20px' }}
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

          {/* ── ADD HABIT VIEW ── */}
          {view === 'add' && (
            <div className="p-6 flex flex-col gap-5">
              <button
                onClick={() => setView('list')}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h2 className="text-lg font-semibold text-foreground">Add New Habit</h2>
              <p className="text-sm text-muted-foreground -mt-3">
                Adding to: <strong className="text-foreground">{categories.find((c) => c.id === addCatId)?.name}</strong>
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Habit Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Drink Water"
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
                  onClick={saveNewHabit}
                  disabled={!newName.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-teal-500 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add Habit
                </button>
              </div>
            </div>
          )}

          {/* ── EDIT VIEW ── */}
          {view === 'edit' && selectedHabit && (
            <div className="p-6 flex flex-col gap-5">
              <button
                onClick={() => setView('list')}
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
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-teal-500 hover:opacity-90 transition-opacity"
              >
                Save Reminder
              </button>
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

export default function AccordionPage() {
  return (
    <Suspense>
      <AccordionStudy />
    </Suspense>
  )
}
