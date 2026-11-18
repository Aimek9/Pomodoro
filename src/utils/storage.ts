import { Category, PomodoroSession, Task, TimerConfig } from '../types/pomodoro';

const STORAGE_KEYS = {
  TASKS: 'cadence_si_tasks_v1',
  SESSIONS: 'cadence_si_sessions_v1',
  CONFIG: 'cadence_si_config_v1',
  ACTIVE_TASK_ID: 'cadence_si_active_task_v1',
  ACTIVE_CATEGORY: 'cadence_si_active_category_v1',
  THEME: 'cadence_si_theme_v1',
};

export const DEFAULT_CONFIG: TimerConfig = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  soundProfile: 'chime',
  soundVolume: 0.75,
  desktopNotifications: false,
};

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getInitialTasks(): Task[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'task-init-1',
      title: 'Revue des accès privilégiés & comptes PAM (Trading)',
      category: 'Cybersécurité/SSI',
      priority: 'Haute',
      estimatedPomodoros: 3,
      completedPomodoros: 0,
      completed: false,
      createdAt: now,
    },
    {
      id: 'task-init-2',
      title: 'Préparation dossier conformité DORA & plan de continuité',
      category: 'Conformité',
      priority: 'Haute',
      estimatedPomodoros: 4,
      completedPomodoros: 0,
      completed: false,
      createdAt: now,
    },
    {
      id: 'task-init-3',
      title: 'Arbitrage budget & roadmap infrastructure passerelle FIX',
      category: 'Gouvernance SI',
      priority: 'Moyenne',
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      completed: false,
      createdAt: now,
    },
    {
      id: 'task-init-4',
      title: 'Suivi incidents N2 et patch management serveurs Middle-Office',
      category: 'Support & Exploitation',
      priority: 'Moyenne',
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      completed: false,
      createdAt: now,
    },
  ];
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return getInitialTasks();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialTasks();
  } catch {
    return getInitialTasks();
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSessions(): PomodoroSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: PomodoroSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadConfig(): TimerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: TimerConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

export function loadActiveTaskId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TASK_ID);
  } catch {
    return null;
  }
}

export function saveActiveTaskId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TASK_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TASK_ID);
    }
  } catch {
    // Ignore
  }
}

export function loadActiveCategory(): Category {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ACTIVE_CATEGORY);
    return (val as Category) || 'Gouvernance SI';
  } catch {
    return 'Gouvernance SI';
  }
}

export function saveActiveCategory(cat: Category): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CATEGORY, cat);
  } catch {
    // Ignore
  }
}

export function loadTheme(): 'dark' | 'light' {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.THEME);
    return val === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // Ignore
  }
}

export function formatMinutesAsDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} min`;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = day === 0 ? -6 : 1 - day; // Monday as start of week
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeekDays(referenceDate: Date = new Date()): { dateKey: string; label: string; shortLabel: string; isToday: boolean }[] {
  const monday = getStartOfWeek(referenceDate);
  const todayKey = getLocalDateKey(new Date());
  const shortDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const fullDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = getLocalDateKey(d);
    return {
      dateKey: key,
      label: `${fullDays[i]} ${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      shortLabel: shortDays[i],
      isToday: key === todayKey,
    };
  });
}

export function buildSampleWeekHistory(): PomodoroSession[] {
  const weekDays = getWeekDays(new Date());
  const todayKey = getLocalDateKey(new Date());
  const entries: PomodoroSession[] = [];
  const samples: Array<{ category: Category; title: string; duration: number; hour: number }> = [
    { category: 'Cybersécurité/SSI', title: 'Audit pare-feu périmètre bourse & règles NAT', duration: 45, hour: 9 },
    { category: 'Gouvernance SI', title: 'Préparation Comité Direction SI mensuel', duration: 50, hour: 11 },
    { category: 'Conformité', title: 'Revue piste d’audit réglementaire AMF', duration: 45, hour: 14 },
    { category: 'Projets IT', title: 'Migration cluster base de données ordres', duration: 50, hour: 10 },
    { category: 'Support & Exploitation', title: 'Analyse latence flux marché & SLA', duration: 25, hour: 15 },
    { category: 'Réunions', title: 'Point hebdomadaire RSSI & prestataires SOC', duration: 25, hour: 16 },
    { category: 'Formation', title: 'Veille réglementaire DORA & résilience opérationnelle', duration: 45, hour: 17 },
  ];

  let idx = 0;
  weekDays.forEach((day, dayIndex) => {
    // Populate days up to yesterday (or 2 sessions on past days)
    if (day.dateKey > todayKey || dayIndex >= 5) return;
    const count = day.isToday ? 1 : dayIndex % 2 === 0 ? 3 : 2;
    for (let j = 0; j < count; j++) {
      const sample = samples[(idx++) % samples.length];
      const [y, m, d] = day.dateKey.split('-').map(Number);
      const completedDate = new Date(y, m - 1, d, sample.hour + j, 30, 0);
      entries.push({
        id: `demo-${day.dateKey}-${j}-${Date.now()}`,
        mode: 'work',
        category: sample.category,
        taskId: null,
        taskTitle: sample.title,
        durationMinutes: sample.duration,
        completedAt: completedDate.toISOString(),
        dateKey: day.dateKey,
      });
    }
  });

  return entries;
}
