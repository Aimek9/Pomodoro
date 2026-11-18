import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import {
  Category,
  NavSection,
  PomodoroSession,
  Priority,
  Task,
  TimerConfig,
  TimerMode,
  TimerStatus,
} from './types/pomodoro';
import {
  DEFAULT_CONFIG,
  buildSampleWeekHistory,
  formatMinutesAsDuration,
  getInitialTasks,
  getLocalDateKey,
  getWeekDays,
  loadActiveCategory,
  loadActiveTaskId,
  loadConfig,
  loadSessions,
  loadTasks,
  loadTheme,
  saveActiveCategory,
  saveActiveTaskId,
  saveConfig,
  saveSessions,
  saveTasks,
  saveTheme,
} from './utils/storage';
import { playNotificationSound, sendDesktopNotification } from './utils/audio';
import { CircularTimer } from './components/CircularTimer';
import { TaskPanel } from './components/TaskPanel';
import { TasksView } from './components/TasksView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { FocusOverlay } from './components/FocusOverlay';
import { SessionCompleteBanner } from './components/SessionCompleteBanner';

interface CompletionNotice {
  completedMode: TimerMode;
  durationMinutes: number;
  category: Category;
  taskTitle: string | null;
  suggestedNextMode: TimerMode;
}

export default function App() {
  // Persistent state
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [sessions, setSessions] = useState<PomodoroSession[]>(() => loadSessions());
  const [config, setConfig] = useState<TimerConfig>(() => loadConfig());
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => loadActiveTaskId());
  const [activeCategory, setActiveCategory] = useState<Category>(() => loadActiveCategory());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadTheme());

  // Navigation & overlay state
  const [nav, setNav] = useState<NavSection>('cockpit');
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [completionNotice, setCompletionNotice] = useState<CompletionNotice | null>(null);

  // Timer state
  const [mode, setMode] = useState<TimerMode>('work');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  const getModeDurationMinutes = useCallback(
    (targetMode: TimerMode, cfg: TimerConfig = config) => {
      if (targetMode === 'work') return cfg.workDuration;
      if (targetMode === 'shortBreak') return cfg.shortBreakDuration;
      return cfg.longBreakDuration;
    },
    [config]
  );

  const [secondsLeft, setSecondsLeft] = useState<number>(() => loadConfig().workDuration * 60);
  const totalSeconds = getModeDurationMinutes(mode) * 60;

  // Drift-free timer refs
  const endTimestampRef = useRef<number | null>(null);
  const completionHandledRef = useRef<boolean>(false);

  // Apply theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  // Auto-save state changes
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  useEffect(() => {
    saveActiveTaskId(activeTaskId);
  }, [activeTaskId]);

  useEffect(() => {
    saveActiveCategory(activeCategory);
  }, [activeCategory]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId && !t.completed) || null,
    [tasks, activeTaskId]
  );

  // Clear activeTaskId if task was deleted or completed
  useEffect(() => {
    if (activeTaskId && !activeTask) {
      setActiveTaskId(null);
    }
  }, [activeTaskId, activeTask]);

  // Complete session handler
  const handlePhaseComplete = useCallback(
    (finishedMode: TimerMode) => {
      const durationMinutes = getModeDurationMinutes(finishedMode);
      const sessionCategory = activeTask ? activeTask.category : activeCategory;
      const sessionTaskTitle = activeTask ? activeTask.title : null;

      // Audio & desktop notification
      if (config.soundEnabled) {
        playNotificationSound(config.soundProfile, config.soundVolume);
      }

      const notifTitle =
        finishedMode === 'work'
          ? 'Session de concentration terminée'
          : 'Pause terminée — Prêt à reprendre';
      const notifBody =
        finishedMode === 'work'
          ? `${durationMinutes} min · ${sessionCategory}${sessionTaskTitle ? ` (${sessionTaskTitle})` : ''}`
          : 'Revenez au tableau de bord pour démarrer votre prochaine session.';

      if (config.desktopNotifications) {
        sendDesktopNotification(notifTitle, notifBody);
      }

      // Record work session in history & update task progress
      let nextMode: TimerMode = 'work';
      if (finishedMode === 'work') {
        const nowIso = new Date().toISOString();
        const newSession: PomodoroSession = {
          id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          mode: 'work',
          category: sessionCategory,
          taskId: activeTask ? activeTask.id : null,
          taskTitle: sessionTaskTitle,
          durationMinutes,
          completedAt: nowIso,
          dateKey: getLocalDateKey(new Date()),
        };
        setSessions((prev) => [newSession, ...prev]);

        if (activeTask) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === activeTask.id
                ? { ...t, completedPomodoros: t.completedPomodoros + 1 }
                : t
            )
          );
        }

        const nextCycles = completedCycles + 1;
        setCompletedCycles(nextCycles);
        nextMode = nextCycles % config.cyclesBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak';
      } else {
        nextMode = 'work';
      }

      setCompletionNotice({
        completedMode: finishedMode,
        durationMinutes,
        category: sessionCategory,
        taskTitle: sessionTaskTitle,
        suggestedNextMode: nextMode,
      });

      const shouldAutoStart =
        (finishedMode === 'work' && config.autoStartBreaks) ||
        (finishedMode !== 'work' && config.autoStartWork);

      const nextDurationSec = getModeDurationMinutes(nextMode) * 60;
      setMode(nextMode);
      setSecondsLeft(nextDurationSec);

      if (shouldAutoStart) {
        completionHandledRef.current = false;
        endTimestampRef.current = Date.now() + nextDurationSec * 1000;
        setStatus('running');
      } else {
        endTimestampRef.current = null;
        setStatus('idle');
      }
    },
    [activeTask, activeCategory, completedCycles, config, getModeDurationMinutes]
  );

  // Countdown loop
  const secondsLeftRef = useRef(secondsLeft);
  secondsLeftRef.current = secondsLeft;

  useEffect(() => {
    if (status !== 'running') return;

    if (!endTimestampRef.current) {
      endTimestampRef.current = Date.now() + secondsLeftRef.current * 1000;
    }

    const tick = () => {
      if (!endTimestampRef.current) return;
      const remainingMs = endTimestampRef.current - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setSecondsLeft(remainingSec);

      if (remainingSec <= 0 && !completionHandledRef.current) {
        completionHandledRef.current = true;
        endTimestampRef.current = null;
        handlePhaseComplete(mode);
      }
    };

    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [status, mode, handlePhaseComplete]);

  // Document title live countdown
  useEffect(() => {
    if (status === 'running' || status === 'paused') {
      const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
      const s = String(secondsLeft % 60).padStart(2, '0');
      const prefix = mode === 'work' ? 'Focus' : 'Pause';
      document.title = `${m}:${s} · ${prefix} — Cadence SI`;
    } else {
      document.title = 'Cadence SI — Pomodoro & Pilotage IT';
    }
  }, [status, secondsLeft, mode]);

  // Timer actions
  const handleStart = () => {
    setCompletionNotice(null);
    completionHandledRef.current = false;
    endTimestampRef.current = Date.now() + secondsLeft * 1000;
    setStatus('running');
  };

  const handlePause = () => {
    if (endTimestampRef.current) {
      const remainingSec = Math.max(0, Math.ceil((endTimestampRef.current - Date.now()) / 1000));
      setSecondsLeft(remainingSec);
    }
    endTimestampRef.current = null;
    setStatus('paused');
  };

  const handleResume = () => {
    completionHandledRef.current = false;
    endTimestampRef.current = Date.now() + secondsLeft * 1000;
    setStatus('running');
  };

  const handleReset = () => {
    endTimestampRef.current = null;
    completionHandledRef.current = false;
    setStatus('idle');
    setSecondsLeft(getModeDurationMinutes(mode) * 60);
  };

  const handleModeChange = (nextMode: TimerMode) => {
    endTimestampRef.current = null;
    completionHandledRef.current = false;
    setStatus('idle');
    setMode(nextMode);
    setSecondsLeft(getModeDurationMinutes(nextMode) * 60);
  };

  const handleDurationPreset = (targetMode: TimerMode, minutes: number) => {
    const clamped = Math.max(1, Math.min(180, minutes));
    setConfig((prev) => {
      if (targetMode === 'work') return { ...prev, workDuration: clamped };
      if (targetMode === 'shortBreak') return { ...prev, shortBreakDuration: clamped };
      return { ...prev, longBreakDuration: clamped };
    });
    if (targetMode === mode) {
      endTimestampRef.current = null;
      completionHandledRef.current = false;
      setStatus('idle');
      setSecondsLeft(clamped * 60);
    }
  };

  const handleSkipPhase = () => {
    endTimestampRef.current = null;
    completionHandledRef.current = false;
    setStatus('idle');
    const nextMode: TimerMode =
      mode === 'work'
        ? (completedCycles + 1) % config.cyclesBeforeLongBreak === 0
          ? 'longBreak'
          : 'shortBreak'
        : 'work';
    setMode(nextMode);
    setSecondsLeft(getModeDurationMinutes(nextMode) * 60);
  };

  const handleStartNextFromNotice = (nextMode: TimerMode) => {
    setCompletionNotice(null);
    const dur = getModeDurationMinutes(nextMode) * 60;
    setMode(nextMode);
    setSecondsLeft(dur);
    completionHandledRef.current = false;
    endTimestampRef.current = Date.now() + dur * 1000;
    setStatus('running');
  };

  // Config update from Settings
  const handleUpdateConfig = (partial: Partial<TimerConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      if (status === 'idle') {
        if (mode === 'work' && partial.workDuration !== undefined) {
          setSecondsLeft(partial.workDuration * 60);
        } else if (mode === 'shortBreak' && partial.shortBreakDuration !== undefined) {
          setSecondsLeft(partial.shortBreakDuration * 60);
        } else if (mode === 'longBreak' && partial.longBreakDuration !== undefined) {
          setSecondsLeft(partial.longBreakDuration * 60);
        }
      }
      return next;
    });
  };

  // Task operations
  const handleAddTask = (input: {
    title: string;
    category: Category;
    priority: Priority;
    estimatedPomodoros: number;
  }) => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: input.title,
      category: input.category,
      priority: input.priority,
      estimatedPomodoros: input.estimatedPomodoros,
      completedPomodoros: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
  };

  const handleToggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      })
    );
  };

  const handleUpdatePriority = (id: string, priority: Priority) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
  };

  const handleSelectTask = (id: string) => {
    setActiveTaskId(id);
    const target = tasks.find((t) => t.id === id);
    if (target) {
      setActiveCategory(target.category);
    }
  };

  const handleStartTaskFocus = (id: string) => {
    handleSelectTask(id);
    setNav('cockpit');
    if (mode !== 'work' && status === 'idle') {
      setMode('work');
      setSecondsLeft(config.workDuration * 60);
    }
  };

  // KPI Metrics
  const todayKey = getLocalDateKey(new Date());
  const weekDateSet = useMemo(
    () => new Set(getWeekDays(new Date()).map((d) => d.dateKey)),
    []
  );

  const kpis = useMemo(() => {
    const workSessions = sessions.filter((s) => s.mode === 'work');
    const todaySessions = workSessions.filter((s) => s.dateKey === todayKey);
    const weekSessions = workSessions.filter((s) => weekDateSet.has(s.dateKey));

    const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const weekMinutes = weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const completedTodayTasks = tasks.filter(
      (t) => t.completed && t.completedAt && getLocalDateKey(new Date(t.completedAt)) === todayKey
    ).length;
    const totalCompletedTasks = tasks.filter((t) => t.completed).length;

    return {
      todaySessionsCount: todaySessions.length,
      todayMinutes,
      weekMinutes,
      weekSessionsCount: weekSessions.length,
      completedTodayTasks,
      totalCompletedTasks,
      activeTasksCount: tasks.filter((t) => !t.completed).length,
    };
  }, [sessions, tasks, todayKey, weekDateSet]);

  const formattedTodayDate = useMemo(() => {
    const str = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
      {/* Top Navigation Bar — 3-Zone Contract */}
      <header className="border-b border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0D131F]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setNav('cockpit')}
            className="text-lg font-bold tracking-tight font-display text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          >
            Cadence SI
          </button>

          {/* Zone 2: 4 Single-line Navigation Links */}
          <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-7">
            {(
              [
                { id: 'cockpit', label: 'Cockpit' },
                { id: 'tasks', label: 'Tâches' },
                { id: 'history', label: 'Historique' },
                { id: 'settings', label: 'Paramètres' },
              ] as { id: NavSection; label: string }[]
            ).map((item) => {
              const isCurrent = nav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNav(item.id)}
                  className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isCurrent
                      ? 'border-emerald-500 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setFocusModeOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Mode Focus</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <nav
          aria-label="Navigation mobile"
          className="md:hidden border-t border-slate-100 dark:border-slate-800/80 px-4 flex items-center justify-between overflow-x-auto"
        >
          {(
            [
              { id: 'cockpit', label: 'Cockpit' },
              { id: 'tasks', label: 'Tâches' },
              { id: 'history', label: 'Historique' },
              { id: 'settings', label: 'Paramètres' },
            ] as { id: NavSection; label: string }[]
          ).map((item) => {
            const isCurrent = nav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setNav(item.id)}
                className={`py-2.5 px-2 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  isCurrent
                    ? 'border-emerald-500 text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Workspace Context Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              {nav === 'cockpit' && 'Pilotage & Concentration SI'}
              {nav === 'tasks' && 'Gestion des activités & priorités'}
              {nav === 'history' && 'Historique & Analytique'}
              {nav === 'settings' && 'Configuration du poste'}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formattedTodayDate} · Responsable Système d&apos;Information · Société de bourse
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleUpdateConfig({ soundEnabled: !config.soundEnabled })}
              aria-label={config.soundEnabled ? 'Couper les alertes sonores' : 'Activer les alertes sonores'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {config.soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{config.soundEnabled ? 'Son actif' : 'Muet'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? 'Clair' : 'Sombre'}</span>
            </button>
          </div>
        </div>

        {/* End-of-Session Notification Banner */}
        {completionNotice && (
          <SessionCompleteBanner
            completedMode={completionNotice.completedMode}
            durationMinutes={completionNotice.durationMinutes}
            category={completionNotice.category}
            taskTitle={completionNotice.taskTitle}
            suggestedNextMode={completionNotice.suggestedNextMode}
            onStartNext={handleStartNextFromNotice}
            onDismiss={() => setCompletionNotice(null)}
          />
        )}

        {nav === 'cockpit' && (
          <>
            {/* 4-Column KPI Summary Strip */}
            <section
              aria-label="Indicateurs du jour"
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Sessions réalisées
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-white">
                    {kpis.todaySessionsCount}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    aujourd&apos;hui
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Concentration du jour
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400">
                    {formatMinutesAsDuration(kpis.todayMinutes)}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tâches terminées
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-white">
                    {kpis.completedTodayTasks}
                  </span>
                  <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                    / {kpis.activeTasksCount + kpis.completedTodayTasks} du jour
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Temps cette semaine
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-white">
                    {formatMinutesAsDuration(kpis.weekMinutes)}
                  </span>
                  <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                    · {kpis.weekSessionsCount} sess.
                  </span>
                </div>
              </div>
            </section>

            {/* Primary 2-Column Cockpit Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 flex flex-col">
                <CircularTimer
                  mode={mode}
                  status={status}
                  secondsLeft={secondsLeft}
                  totalSeconds={totalSeconds}
                  completedCycles={completedCycles}
                  config={config}
                  activeCategory={activeCategory}
                  activeTask={activeTask}
                  onModeChange={handleModeChange}
                  onDurationPreset={handleDurationPreset}
                  onCategoryChange={setActiveCategory}
                  onClearTask={() => setActiveTaskId(null)}
                  onStart={handleStart}
                  onPause={handlePause}
                  onResume={handleResume}
                  onReset={handleReset}
                  onSkip={handleSkipPhase}
                />
              </div>

              <div className="lg:col-span-5 flex flex-col">
                <TaskPanel
                  tasks={tasks}
                  activeTaskId={activeTaskId}
                  onAddTask={handleAddTask}
                  onToggleComplete={handleToggleTaskComplete}
                  onSelectTask={handleSelectTask}
                  onDeleteTask={handleDeleteTask}
                  onOpenAllTasks={() => setNav('tasks')}
                />
              </div>
            </div>
          </>
        )}

        {nav === 'tasks' && (
          <TasksView
            tasks={tasks}
            activeTaskId={activeTaskId}
            onAddTask={handleAddTask}
            onUpdatePriority={handleUpdatePriority}
            onToggleComplete={handleToggleTaskComplete}
            onDeleteTask={handleDeleteTask}
            onStartTaskFocus={handleStartTaskFocus}
          />
        )}

        {nav === 'history' && (
          <HistoryView
            sessions={sessions}
            onLoadSampleHistory={() => setSessions(buildSampleWeekHistory())}
          />
        )}

        {nav === 'settings' && (
          <SettingsView
            config={config}
            theme={theme}
            onUpdateConfig={handleUpdateConfig}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            onClearHistory={() => setSessions([])}
            onResetAllData={() => {
              setSessions([]);
              setTasks(getInitialTasks());
              setConfig(DEFAULT_CONFIG);
              setActiveTaskId(null);
              setMode('work');
              setStatus('idle');
              setSecondsLeft(DEFAULT_CONFIG.workDuration * 60);
            }}
          />
        )}
      </main>

      {/* Distraction-Free Mode Focus Overlay */}
      <FocusOverlay
        isOpen={focusModeOpen}
        mode={mode}
        status={status}
        secondsLeft={secondsLeft}
        totalSeconds={totalSeconds}
        activeCategory={activeCategory}
        activeTask={activeTask}
        soundEnabled={config.soundEnabled}
        onToggleSound={() => handleUpdateConfig({ soundEnabled: !config.soundEnabled })}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onClose={() => setFocusModeOpen(false)}
      />
    </div>
  );
}
