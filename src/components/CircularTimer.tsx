import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SlidersHorizontal,
  X,
  Check,
} from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_ACCENTS,
  Category,
  Task,
  TimerConfig,
  TimerMode,
  TimerStatus,
} from '../types/pomodoro';

interface CircularTimerProps {
  mode: TimerMode;
  status: TimerStatus;
  secondsLeft: number;
  totalSeconds: number;
  completedCycles: number;
  config: TimerConfig;
  activeCategory: Category;
  activeTask: Task | null;
  onModeChange: (mode: TimerMode) => void;
  onDurationPreset: (mode: TimerMode, minutes: number) => void;
  onCategoryChange: (category: Category) => void;
  onClearTask: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

const MODE_META: Record<
  TimerMode,
  {
    label: string;
    strokeClass: string;
    accentText: string;
    primaryBg: string;
    presets: number[];
  }
> = {
  work: {
    label: 'Travail',
    strokeClass: 'stroke-emerald-500',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    primaryBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    presets: [25, 45, 50],
  },
  shortBreak: {
    label: 'Pause courte',
    strokeClass: 'stroke-sky-500',
    accentText: 'text-sky-600 dark:text-sky-400',
    primaryBg: 'bg-sky-600 hover:bg-sky-500 text-white',
    presets: [5, 8, 10],
  },
  longBreak: {
    label: 'Pause longue',
    strokeClass: 'stroke-amber-500',
    accentText: 'text-amber-600 dark:text-amber-400',
    primaryBg: 'bg-amber-600 hover:bg-amber-500 text-white',
    presets: [15, 20, 30],
  },
};

export const CircularTimer: React.FC<CircularTimerProps> = ({
  mode,
  status,
  secondsLeft,
  totalSeconds,
  completedCycles,
  config,
  activeCategory,
  activeTask,
  onModeChange,
  onDurationPreset,
  onCategoryChange,
  onClearTask,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const currentMinutes =
    mode === 'work'
      ? config.workDuration
      : mode === 'shortBreak'
      ? config.shortBreakDuration
      : config.longBreakDuration;
  const [customMinutes, setCustomMinutes] = useState<string>(String(currentMinutes));

  const meta = MODE_META[mode];
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - secondsLeft / totalSeconds)) : 0;
  const progressPercent = Math.round(progress * 100);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Geometry
  const size = 296;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const cycleIndex = (completedCycles % config.cyclesBeforeLongBreak) + 1;
  const hasElapsed = secondsLeft < totalSeconds;

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customMinutes, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 180) {
      onDurationPreset(mode, parsed);
      setShowCustomInput(false);
    }
  };

  const openCustomEditor = () => {
    setCustomMinutes(String(currentMinutes));
    setShowCustomInput((prev) => !prev);
  };

  const displayCategory = activeTask ? activeTask.category : activeCategory;
  const catAccent = CATEGORY_ACCENTS[displayCategory];

  return (
    <section
      aria-label="Chronomètre Pomodoro"
      className="flex-1 flex flex-col justify-between bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8"
    >
      {/* Mode Switcher & Duration Presets */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Phase du chronomètre"
            className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => {
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setShowCustomInput(false);
                    onModeChange(m);
                  }}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {MODE_META[m].label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            <span>Cycle {cycleIndex} / {config.cyclesBeforeLongBreak}</span>
          </div>
        </div>

        {/* Duration Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">Durée :</span>
            {meta.presets.map((preset) => {
              const isSelected = currentMinutes === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    onDurationPreset(mode, preset);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono-tabular font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  {preset} min
                </button>
              );
            })}
            <button
              type="button"
              onClick={openCustomEditor}
              aria-expanded={showCustomInput}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                showCustomInput || !meta.presets.includes(currentMinutes)
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {!meta.presets.includes(currentMinutes) ? `${currentMinutes} min` : 'Personnaliser'}
              </span>
            </button>
          </div>

          {showCustomInput && (
            <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5">
              <label htmlFor="custom-minutes-input" className="sr-only">
                Durée personnalisée en minutes
              </label>
              <input
                id="custom-minutes-input"
                type="number"
                min={1}
                max={180}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-16 px-2.5 py-1 text-xs font-mono-tabular bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">min</span>
              <button
                type="submit"
                aria-label="Appliquer la durée"
                className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Central Circular Chronometer */}
      <div className="flex flex-col items-center justify-center my-6">
        <div className="relative flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="max-w-full h-auto"
            role="img"
            aria-label={`Chronomètre ${meta.label} : ${formattedTime}, ${progressPercent}% écoulé`}
          >
            {/* 60 subtle minute graduation ticks */}
            {Array.from({ length: 60 }, (_, idx) => {
              const angle = (idx * 6 - 90) * (Math.PI / 180);
              const isMajor = idx % 5 === 0;
              const rOuter = center - 6;
              const rInner = isMajor ? center - 14 : center - 10;
              const x1 = center + rInner * Math.cos(angle);
              const y1 = center + rInner * Math.sin(angle);
              const x2 = center + rOuter * Math.cos(angle);
              const y2 = center + rOuter * Math.sin(angle);
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className={
                    isMajor
                      ? 'stroke-slate-300 dark:stroke-slate-600'
                      : 'stroke-slate-200 dark:stroke-slate-800'
                  }
                  strokeWidth={isMajor ? 1.75 : 1}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Track circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-slate-100 dark:stroke-slate-800/90"
            />

            {/* Progress circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              className={`${meta.strokeClass} transition-[stroke-dashoffset] duration-300 ease-out`}
            />
          </svg>

          {/* Center Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <span className={`text-xs font-medium tracking-wide ${meta.accentText}`}>
              {meta.label}
            </span>
            <div className="mt-1 text-5xl sm:text-[3.5rem] leading-none font-bold tracking-tight font-mono-tabular text-slate-900 dark:text-white">
              {formattedTime}
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
              <span>{progressPercent}%</span>
              <span aria-hidden="true">·</span>
              <span>
                {status === 'running'
                  ? 'En cours'
                  : status === 'paused'
                  ? 'En pause'
                  : 'Prêt'}
              </span>
            </div>
          </div>
        </div>

        {/* Linear subtle progress bar */}
        <div className="w-full max-w-xs mt-2">
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                mode === 'work'
                  ? 'bg-emerald-500'
                  : mode === 'shortBreak'
                  ? 'bg-sky-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category & Active Task Context + Controls */}
      <div className="flex flex-col gap-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {activeTask ? (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className={`font-medium ${catAccent.text}`}>
                      {activeTask.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {activeTask.completedPomodoros}/{activeTask.estimatedPomodoros} sessions
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {activeTask.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClearTask}
                  title="Dissocier la tâche"
                  aria-label="Dissocier la tâche active"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="timer-category-select"
                  className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"
                >
                  Catégorie de session
                </label>
                <select
                  id="timer-category-select"
                  value={activeCategory}
                  onChange={(e) => onCategoryChange(e.target.value as Category)}
                  className="text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Main Control Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {status === 'idle' && (
            <button
              type="button"
              onClick={onStart}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 dark:focus-visible:ring-offset-slate-900 ${meta.primaryBg}`}
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Démarrer</span>
            </button>
          )}

          {status === 'running' && (
            <button
              type="button"
              onClick={onPause}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Pause</span>
            </button>
          )}

          {status === 'paused' && (
            <button
              type="button"
              onClick={onResume}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${meta.primaryBg}`}
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Reprendre</span>
            </button>
          )}

          {(status !== 'idle' || hasElapsed) && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Réinitialiser</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSkip}
            title="Passer à la phase suivante"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <SkipForward className="w-4 h-4" aria-hidden="true" />
            <span>Phase suivante</span>
          </button>
        </div>
      </div>
    </section>
  );
};
