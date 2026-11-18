export type Category =
  | 'Gouvernance SI'
  | 'Cybersécurité/SSI'
  | 'Projets IT'
  | 'Support & Exploitation'
  | 'Conformité'
  | 'Réunions'
  | 'Formation';

export const CATEGORIES: Category[] = [
  'Gouvernance SI',
  'Cybersécurité/SSI',
  'Projets IT',
  'Support & Exploitation',
  'Conformité',
  'Réunions',
  'Formation',
];

export const CATEGORY_ACCENTS: Record<Category, { bar: string; text: string }> = {
  'Gouvernance SI': {
    bar: 'bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  'Cybersécurité/SSI': {
    bar: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
  },
  'Projets IT': {
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  'Support & Exploitation': {
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  'Conformité': {
    bar: 'bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  'Réunions': {
    bar: 'bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
  },
  'Formation': {
    bar: 'bg-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
  },
};

export type Priority = 'Haute' | 'Moyenne' | 'Basse';

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused';

export type SoundProfile = 'chime' | 'bell' | 'pulse';

export type NavSection = 'cockpit' | 'tasks' | 'history' | 'settings';

export interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface PomodoroSession {
  id: string;
  mode: TimerMode;
  category: Category;
  taskId: string | null;
  taskTitle: string | null;
  durationMinutes: number;
  completedAt: string; // ISO timestamp
  dateKey: string; // YYYY-MM-DD local date
}

export interface TimerConfig {
  workDuration: number; // default 25, 45, 50 or custom
  shortBreakDuration: number; // 5 to 10 (or custom)
  longBreakDuration: number; // 15 to 30 (or custom)
  cyclesBeforeLongBreak: number; // e.g., 4
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  soundProfile: SoundProfile;
  soundVolume: number; // 0 to 1
  desktopNotifications: boolean;
}
