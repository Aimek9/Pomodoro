import React, { useMemo, useState } from 'react';
import { Check, Plus, Search, Target, Trash2 } from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_ACCENTS,
  Category,
  Priority,
  Task,
} from '../types/pomodoro';

interface TasksViewProps {
  tasks: Task[];
  activeTaskId: string | null;
  onAddTask: (task: {
    title: string;
    category: Category;
    priority: Priority;
    estimatedPomodoros: number;
  }) => void;
  onUpdatePriority: (id: string, priority: Priority) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onStartTaskFocus: (id: string) => void;
}

const PRIORITY_STYLE: Record<Priority, string> = {
  Haute: 'text-rose-600 dark:text-rose-400',
  Moyenne: 'text-amber-600 dark:text-amber-400',
  Basse: 'text-slate-500 dark:text-slate-400',
};

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  activeTaskId,
  onAddTask,
  onUpdatePriority,
  onToggleComplete,
  onDeleteTask,
  onStartTaskFocus,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Gouvernance SI');
  const [priority, setPriority] = useState<Priority>('Haute');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(2);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'Toutes'>('Toutes');
  const [filterPriority, setFilterPriority] = useState<Priority | 'Toutes'>('Toutes');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');

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
    const q = search.trim().toLowerCase();
    const rank: Record<Priority, number> = { Haute: 0, Moyenne: 1, Basse: 2 };
    return tasks
      .filter((t) => {
        if (filterStatus === 'active') return !t.completed;
        if (filterStatus === 'completed') return t.completed;
        return true;
      })
      .filter((t) => (filterCat === 'Toutes' ? true : t.category === filterCat))
      .filter((t) => (filterPriority === 'Toutes' ? true : t.priority === filterPriority))
      .filter((t) => (q ? t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return rank[a.priority] - rank[b.priority];
      });
  }, [tasks, search, filterCat, filterPriority, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Add Task Bar */}
      <section
        aria-label="Nouvelle tâche"
        className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6"
      >
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          Planifier une activité SI
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label htmlFor="full-task-title" className="sr-only">
              Intitulé de la tâche
            </label>
            <input
              id="full-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Intitulé de l'activité, projet ou audit..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Catégorie"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Priorité"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Haute">Haute</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Basse">Basse</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              aria-label="Sessions estimées"
              type="number"
              min={1}
              max={12}
              value={estimatedPomodoros}
              onChange={(e) => setEstimatedPomodoros(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
              title="Nombre de sessions Pomodoro estimées"
              className="w-16 px-2.5 py-2.5 text-sm font-mono-tabular text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </div>
        </form>
      </section>

      {/* Filter & Data Table */}
      <section
        aria-label="Registre des tâches"
        className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
      >
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg self-start">
            {(
              [
                { id: 'active', label: 'En cours' },
                { id: 'completed', label: 'Terminées' },
                { id: 'all', label: 'Toutes' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              aria-label="Filtrer par catégorie"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value as Category | 'Toutes')}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="Toutes">Toutes catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrer par priorité"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Priority | 'Toutes')}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="Toutes">Toutes priorités</option>
              <option value="Haute">Priorité Haute</option>
              <option value="Moyenne">Priorité Moyenne</option>
              <option value="Basse">Priorité Basse</option>
            </select>
          </div>
        </div>

        {/* High-density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 pl-6 pr-3 w-10">État</th>
                <th className="py-3 px-3">Activité</th>
                <th className="py-3 px-3">Catégorie</th>
                <th className="py-3 px-3">Priorité</th>
                <th className="py-3 px-3 text-right">Avancement</th>
                <th className="py-3 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    Aucune tâche ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isActive = task.id === activeTaskId;
                  const catAccent = CATEGORY_ACCENTS[task.category];
                  const pct = Math.min(
                    100,
                    Math.round((task.completedPomodoros / Math.max(1, task.estimatedPomodoros)) * 100)
                  );

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isActive ? 'bg-emerald-500/[0.04]' : ''
                      }`}
                    >
                      <td className="py-3 pl-6 pr-3">
                        <button
                          type="button"
                          onClick={() => onToggleComplete(task.id)}
                          aria-label={task.completed ? 'Rouvrir la tâche' : 'Marquer comme terminée'}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            task.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                          }`}
                        >
                          {task.completed && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      <td className="py-3 px-3 max-w-md">
                        <span
                          className={`font-medium ${
                            task.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {task.title}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-xs font-medium">
                        <span className={catAccent.text}>{task.category}</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          aria-label={`Priorité de ${task.title}`}
                          value={task.priority}
                          onChange={(e) => onUpdatePriority(task.id, e.target.value as Priority)}
                          className={`text-xs font-medium bg-transparent focus:outline-none cursor-pointer ${PRIORITY_STYLE[task.priority]}`}
                        >
                          <option value="Haute" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                            Haute
                          </option>
                          <option value="Moyenne" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                            Moyenne
                          </option>
                          <option value="Basse" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                            Basse
                          </option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${catAccent.bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono-tabular text-slate-600 dark:text-slate-300">
                            {task.completedPomodoros}/{task.estimatedPomodoros}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {!task.completed && (
                            <button
                              type="button"
                              onClick={() => onStartTaskFocus(task.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                            >
                              <Target className="w-3.5 h-3.5" />
                              <span>{isActive ? 'En focus' : 'Cibler'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            aria-label="Supprimer"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
