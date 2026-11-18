import React, { useMemo, useState } from 'react';
import { Calendar, Download, Sparkles } from 'lucide-react';
import { CATEGORIES, CATEGORY_ACCENTS, Category, PomodoroSession } from '../types/pomodoro';
import {
  formatMinutesAsDuration,
  getLocalDateKey,
  getWeekDays,
} from '../utils/storage';

interface HistoryViewProps {
  sessions: PomodoroSession[];
  onLoadSampleHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  onLoadSampleHistory,
}) => {
  const [period, setPeriod] = useState<'today' | 'week'>('week');
  const todayKey = getLocalDateKey(new Date());
  const weekDays = useMemo(() => getWeekDays(new Date()), []);
  const weekDateSet = useMemo(() => new Set(weekDays.map((d) => d.dateKey)), [weekDays]);

  const workSessions = useMemo(
    () => sessions.filter((s) => s.mode === 'work'),
    [sessions]
  );

  const scopedSessions = useMemo(() => {
    const filtered =
      period === 'today'
        ? workSessions.filter((s) => s.dateKey === todayKey)
        : workSessions.filter((s) => weekDateSet.has(s.dateKey));
    return [...filtered].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }, [workSessions, period, todayKey, weekDateSet]);

  const totalMinutes = useMemo(
    () => scopedSessions.reduce((acc, s) => acc + s.durationMinutes, 0),
    [scopedSessions]
  );

  // Weekly daily totals for bar chart
  const dailyChartData = useMemo(() => {
    const totals = weekDays.map((day) => {
      const daySessions = workSessions.filter((s) => s.dateKey === day.dateKey);
      const mins = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      return {
        ...day,
        minutes: mins,
        count: daySessions.length,
      };
    });
    const maxMins = Math.max(60, ...totals.map((d) => d.minutes));
    return { totals, maxMins };
  }, [weekDays, workSessions]);

  // Category distribution
  const categoryBreakdown = useMemo(() => {
    const map = new Map<Category, { minutes: number; count: number }>();
    CATEGORIES.forEach((cat) => map.set(cat, { minutes: 0, count: 0 }));
    scopedSessions.forEach((s) => {
      const prev = map.get(s.category) || { minutes: 0, count: 0 };
      map.set(s.category, {
        minutes: prev.minutes + s.durationMinutes,
        count: prev.count + 1,
      });
    });

    return CATEGORIES.map((cat) => {
      const val = map.get(cat)!;
      const pct = totalMinutes > 0 ? Math.round((val.minutes / totalMinutes) * 100) : 0;
      return { category: cat, ...val, pct };
    })
      .filter((item) => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  }, [scopedSessions, totalMinutes]);

  const handleExportCsv = () => {
    const header = ['Date', 'Heure', 'Type', 'Catégorie', 'Tâche', 'Durée (min)'].join(';');
    const rows = scopedSessions.map((s) => {
      const dt = new Date(s.completedAt);
      const timeStr = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const safeTitle = (s.taskTitle || 'Session libre').replace(/;/g, ',');
      return [s.dateKey, timeStr, 'Travail', s.category, safeTitle, String(s.durationMinutes)].join(';');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadence-si-historique-${period}-${todayKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setPeriod('today')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              period === 'today'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              period === 'week'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Cette semaine
          </button>
        </div>

        <div className="flex items-center gap-3">
          {scopedSessions.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Weekly Chart */}
        <section
          aria-label="Activité hebdomadaire"
          className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between"
        >
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Charge de concentration hebdomadaire
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Minutes de travail effectif par jour (Lundi – Dimanche)
              </p>
            </div>
            <div className="text-right font-mono-tabular">
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {formatMinutesAsDuration(
                  dailyChartData.totals.reduce((acc, d) => acc + d.minutes, 0)
                )}
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                Total semaine
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-4">
            {dailyChartData.totals.map((day) => {
              const heightPct =
                day.minutes > 0
                  ? Math.max(8, Math.round((day.minutes / dailyChartData.maxMins) * 100))
                  : 0;
              return (
                <div key={day.dateKey} className="flex flex-col items-center h-full justify-end gap-2">
                  <span className="text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400">
                    {day.minutes > 0 ? `${day.minutes}m` : '–'}
                  </span>
                  <div className="w-full max-w-[38px] flex-1 bg-slate-100 dark:bg-slate-800/70 rounded-md flex items-end overflow-hidden">
                    {day.minutes > 0 && (
                      <div
                        title={`${day.label} : ${day.minutes} min (${day.count} sessions)`}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          day.isToday
                            ? 'bg-emerald-500'
                            : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      day.isToday
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {day.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Category Breakdown */}
        <section
          aria-label="Répartition par domaine"
          className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Répartition par domaine SI
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {period === 'today' ? "Aujourd'hui" : 'Semaine en cours'} · {scopedSessions.length} sessions
                </p>
              </div>
              <span className="text-sm font-mono-tabular font-semibold text-slate-900 dark:text-white">
                {formatMinutesAsDuration(totalMinutes)}
              </span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aucune session enregistrée sur cette période.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {categoryBreakdown.map((item) => {
                  const accent = CATEGORY_ACCENTS[item.category];
                  return (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className={`font-medium ${accent.text}`}>
                          {item.category}
                        </span>
                        <span className="font-mono-tabular text-slate-600 dark:text-slate-300">
                          {formatMinutesAsDuration(item.minutes)} · {item.pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${accent.bar}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Session Log Table */}
      <section
        aria-label="Journal des sessions"
        className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Journal détaillé des sessions
          </h2>
          <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
            {scopedSessions.length} entrée{scopedSessions.length > 1 ? 's' : ''}
          </span>
        </div>

        {scopedSessions.length === 0 ? (
          <div className="p-10 text-center space-y-4">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="max-w-md mx-auto space-y-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Aucune session terminée sur cette période
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Terminez une session depuis le chronomètre pour alimenter automatiquement votre suivi quotidien et hebdomadaire.
              </p>
            </div>
            {workSessions.length === 0 && (
              <button
                type="button"
                onClick={onLoadSampleHistory}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Charger un exemple d&apos;historique hebdomadaire</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 pl-6 pr-3">Date &amp; Heure</th>
                  <th className="py-3 px-3">Catégorie</th>
                  <th className="py-3 px-3">Tâche associée</th>
                  <th className="py-3 pl-3 pr-6 text-right">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {scopedSessions.map((s) => {
                  const dt = new Date(s.completedAt);
                  const dateLabel = dt.toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                  });
                  const timeLabel = dt.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const accent = CATEGORY_ACCENTS[s.category];

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 pl-6 pr-3 whitespace-nowrap text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                        {dateLabel} · {timeLabel}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-xs font-medium">
                        <span className={accent.text}>{s.category}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 dark:text-slate-100">
                        {s.taskTitle || 'Session de concentration libre'}
                      </td>
                      <td className="py-2.5 pl-3 pr-6 text-right whitespace-nowrap text-xs font-mono-tabular font-semibold text-slate-900 dark:text-white">
                        {s.durationMinutes} min
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
