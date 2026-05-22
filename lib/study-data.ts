export type TaskSet = 'A' | 'B'
export type Condition = 'accordion' | 'radial'

export interface Task {
  id: string
  type: 'Add Habit' | 'Edit Habit' | 'Navigate Deep' | 'Delete Habit' | 'WoZ Group Action'
  instruction: string
  isWoZ?: boolean
}

export const TASK_SET_A: Task[] = [
  {
    id: 'A-T1',
    type: 'Add Habit',
    instruction: "Add a new habit called 'Drink Water' in the 'Health' category, with a daily frequency.",
  },
  {
    id: 'A-T2',
    type: 'Edit Habit',
    instruction: "Change the reminder time for the habit 'Meditate' from 08:00 to 21:00.",
  },
  {
    id: 'A-T3',
    type: 'Navigate Deep',
    instruction: "Open the weekly statistics for the habit 'Run' and report the current streak length.",
  },
  {
    id: 'A-T4',
    type: 'Delete Habit',
    instruction: "Delete the habit 'Coffee tracking' from the 'Wellness' category.",
  },
  {
    id: 'A-T5',
    type: 'WoZ Group Action',
    instruction: "Archive all habits belonging to the 'Old goals' category at once.",
    isWoZ: true,
  },
]

export const TASK_SET_B: Task[] = [
  {
    id: 'B-T1',
    type: 'Add Habit',
    instruction: "Add a new habit called 'Read 10 pages' in the 'Learning' category, with a daily frequency.",
  },
  {
    id: 'B-T2',
    type: 'Edit Habit',
    instruction: "Change the reminder time for the habit 'Stretch' from 07:00 to 22:00.",
  },
  {
    id: 'B-T3',
    type: 'Navigate Deep',
    instruction: "Open the weekly statistics for the habit 'Journal' and report the current streak length.",
  },
  {
    id: 'B-T4',
    type: 'Delete Habit',
    instruction: "Delete the habit 'Sugar tracking' from the 'Wellness' category.",
  },
  {
    id: 'B-T5',
    type: 'WoZ Group Action',
    instruction: "Export all habits belonging to the 'Finished' category to a file.",
    isWoZ: true,
  },
]

export interface HabitCategory {
  id: string
  name: string
  color: string
  habits: Habit[]
}

export interface Habit {
  id: string
  name: string
  frequency: string
  reminder: string
  streak: number
  categoryId: string
}

export const INITIAL_CATEGORIES: HabitCategory[] = [
  {
    id: 'health',
    name: 'Health',
    color: '#0ea5a0',
    habits: [
      { id: 'h1', name: 'Meditate', frequency: 'Daily', reminder: '08:00', streak: 12, categoryId: 'health' },
      { id: 'h2', name: 'Eat Fruit', frequency: 'Daily', reminder: '09:00', streak: 5, categoryId: 'health' },
      { id: 'h3', name: 'Run', frequency: 'Weekly', reminder: '07:00', streak: 8, categoryId: 'health' },
    ],
  },
  {
    id: 'wellness',
    name: 'Wellness',
    color: '#f97316',
    habits: [
      { id: 'w1', name: 'Coffee tracking', frequency: 'Daily', reminder: '08:30', streak: 3, categoryId: 'wellness' },
      { id: 'w2', name: 'Sugar tracking', frequency: 'Daily', reminder: '12:00', streak: 7, categoryId: 'wellness' },
      { id: 'w3', name: 'Stretch', frequency: 'Daily', reminder: '07:00', streak: 14, categoryId: 'wellness' },
    ],
  },
  {
    id: 'learning',
    name: 'Learning',
    color: '#6366f1',
    habits: [
      { id: 'l1', name: 'Learn Spanish', frequency: 'Daily', reminder: '21:00', streak: 22, categoryId: 'learning' },
      { id: 'l2', name: 'Journal', frequency: 'Daily', reminder: '22:00', streak: 9, categoryId: 'learning' },
    ],
  },
  {
    id: 'old-goals',
    name: 'Old goals',
    color: '#94a3b8',
    habits: [
      { id: 'o1', name: 'Wake up early', frequency: 'Daily', reminder: '06:00', streak: 0, categoryId: 'old-goals' },
      { id: 'o2', name: 'No social media', frequency: 'Daily', reminder: '09:00', streak: 1, categoryId: 'old-goals' },
    ],
  },
  {
    id: 'finished',
    name: 'Finished',
    color: '#22c55e',
    habits: [
      { id: 'f1', name: 'Learn guitar', frequency: 'Weekly', reminder: '18:00', streak: 0, categoryId: 'finished' },
      { id: 'f2', name: '30-day challenge', frequency: 'Daily', reminder: '07:00', streak: 0, categoryId: 'finished' },
    ],
  },
]

export const TASK_TIMEOUT_SECONDS = 120

export function getParticipantConditions(participantId: number): Array<{ condition: Condition; taskSet: TaskSet }> {
  const isOdd = participantId % 2 !== 0
  if (isOdd) {
    return [
      { condition: 'accordion', taskSet: 'A' },
      { condition: 'radial', taskSet: 'B' },
    ]
  } else {
    return [
      { condition: 'radial', taskSet: 'A' },
      { condition: 'accordion', taskSet: 'B' },
    ]
  }
}

export function getTasksForSet(set: TaskSet): Task[] {
  return set === 'A' ? TASK_SET_A : TASK_SET_B
}
