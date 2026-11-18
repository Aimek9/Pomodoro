import React from 'react';
import { CheckCircle2, Play, X } from 'lucide-react';
import { Category, TimerMode } from '../types/pomodoro';

interface SessionCompleteBannerProps {
  completedMode: TimerMode;
  durationMinutes: number;
  category: Category;
  taskTitle: string | null;
  suggestedNextMode: TimerMode;
  onStartNext: (nextMode: TimerMode) => void;
  onDismiss: () => void;
}

const NEXT_LABEL: Record<TimerMode, string> = {
  work: 'Démarrer la session de travail',
  shortBreak: 'Démarrer la pause courte',
  longBreak: 'Démarrer la pause longue',
};

export const SessionCompleteBanner: React.FC<SessionCompleteBannerProps> = ({
  completedMode,
  durationMinutes,
  category,
  taskTitle,
  suggestedNextMode,
  onStartNext,
  onDismiss,
}) => {
  const completedLabel =
    completedMode === 'work'
      ? 'Session de concentration terminée'
      : completedMode === 'shortBreak'
      ? 'Pause courte terminée'
      : 'Pause longue terminée';

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white dark:bg-[#111827] border border-emerald-500/50 rounded-xl p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {completedLabel}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {durationMinutes} min
            {completedMode === 'work' && (
              <>
                {' '}· {category}
                {taskTitle ? ` · ${taskTitle}` : ''}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onStartNext(suggestedNextMode)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{NEXT_LABEL[suggestedNextMode]}</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer la notification"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
