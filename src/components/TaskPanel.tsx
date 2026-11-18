import React, { useMemo, useState } from 'react';
import { Check, Plus, Target, Trash2 } from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_ACCENTS,
  Category,
  Priority,
  Task,
} from '../types/pomodoro';

interface TaskPanelProps {
  tasks: Task[];
  activeTaskId: string | null;
  onAddTask: (task: {
    title: string;
    category: Category;
    priority: Priority;
    estimatedPomodoros: number;
  }) => void;
  onToggleComplete: (id: string) => void;
  onSelectTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenAllTasks: () => void;
}

const PRIORITY_STYLE: Record<Priority, string> = {
  Haute: 'text-rose-600 dark:text-rose-400',
  Moyenne: 'text-amber-600 dark:text-amber-400',
  Basse: 'text-slate-500 dark:text-slate-400',
};

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  activeTaskId,
  onAddTask,
  onToggleComplete,
  onSelectTask,
  onDeleteTask,
  onOpenAllTasks,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Cybersécurité/SSI');
  const [priority, setPriority] = useState<Priority>('Haute');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(2);
  const [filterCategory, setFilterCategory] = useState<Category | 'Toutes'>('Toutes');
  const [showCompleted, setShowCompleted] = useState<'active' | 'completed'>('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAddTask({
      title: trimmed,
      category,
      priority,
      estimatedPomodoros,
    });
    setTitle('');
  };

  const filteredTasks = useMemo(() => {
    const priorityRank: Record<Priority, number> = { Haute: 0, Moyenne: 1, Basse: 2 };
    return tasks
      .filter((t) => (showCompleted === 'active' ? !t.completed : t.completed))
      .filter((t) => (filterCategory === 'Toutes' ? true : t.category === filterCategory))
      .sort((a, b) => {
        if (a.id === activeTaskId) return -1;
        if (b.id === activeTaskId) return 1;
        return priorityRank[a.priority] - priorityRank[b.priority];
      });
  }, [tasks, showCompleted, filterCategory, activeTaskId]);

  return (
    <section
      aria-label="File des tâches"
      className="flex-1 flex flex-col bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6"
    >
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            File des tâches
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Priorités SI, sécurité et gouvernance
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAllTasks}
          className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          Vue complète
        </button>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleSubmit} className="mt-4 pb-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
        <div>
          <label htmlFor="quick-task-title" className="sr-only">
            Nouvelle tâche
          </label>
          <input
            id="quick-task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ajouter une action (ex. Audit firewall, Comité DORA)..."
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <select
            aria-label="Catégorie de la tâche"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <select
              aria-label="Priorité"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="flex-1 px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Haute">Priorité Haute</option>
              <option value="Moyenne">Priorité Moyenne</option>
              <option value="Basse">Priorité Basse</option>
            </select>

            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
              <label htmlFor="quick-task-est" className="text-[11px] text-slate-500 dark:text-slate-400">
                Pom.
              </label>
              <input
                id="quick-task-est"
                type="number"
                min={1}
                max={12}
                value={estimatedPomodoros}
                onChange={(e) => setEstimatedPomodoros(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                className="w-10 text-xs font-mono-tabular text-center bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Ajouter la tâche</span>
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setShowCompleted('active')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              showCompleted === 'active'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            À faire ({tasks.filter((t) => !t.completed).length})
          </button>
          <button
            type="button"
            onClick={() => setShowCompleted('completed')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              showCompleted === 'completed'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Terminées ({tasks.filter((t) => t.completed).length})
          </button>
        </div>

        <select
          aria-label="Filtrer par catégorie"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as Category | 'Toutes')}
          className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="Toutes">Toutes catégories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100 dark:divide-slate-800/80 pr-0.5">
        {filteredTasks.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {showCompleted === 'active'
                ? 'Aucune tâche en attente dans cette catégorie.'
                : 'Aucune tâche terminée pour le moment.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isSelected = task.id === activeTaskId;
            const catAccent = CATEGORY_ACCENTS[task.category];
            const pct = Math.min(
              100,
              Math.round((task.completedPomodoros / Math.max(1, task.estimatedPomodoros)) * 100)
            );

            return (
              <div
                key={task.id}
                className={`py-3.5 transition-colors ${
                  isSelected ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] -mx-2 px-2 rounded-lg' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleComplete(task.id)}
                    aria-label={task.completed ? `Rouvrir ${task.title}` : `Marquer ${task.title} comme terminée`}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      task.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className={catAccent.text}>{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className={PRIORITY_STYLE[task.priority]}>{task.priority}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {task.completedPomodoros}/{task.estimatedPomodoros}
                      </span>
                      {isSelected && !task.completed && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            Ciblée
                          </span>
                        </>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${catAccent.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!task.completed && (
                      <button
                        type="button"
                        onClick={() => onSelectTask(task.id)}
                        title="Associer au chronomètre"
                        aria-label={`Cibler la tâche ${task.title}`}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Target className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      title="Supprimer la tâche"
                      aria-label={`Supprimer ${task.title}`}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
