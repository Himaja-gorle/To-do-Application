import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Circle, Plus, Sparkles, Trash2 } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

type Filter = 'all' | 'active' | 'completed';
const STORAGE_KEY = 'little-by-little-tasks';

function readTasks(): Task[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Task =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.completed === 'boolean' &&
        typeof item.createdAt === 'string',
    );
  } catch {
    return [];
  }
}

function formatTime(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function getGreetingDate() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function Home() {
  const [tasks, setTasks] = useState<Task[]>(readTasks);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // The list remains usable for this visit when storage is unavailable.
    }
  }, [tasks]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;
  const visibleTasks = useMemo(
    () => tasks.filter((task) => filter === 'all' || (filter === 'active' ? !task.completed : task.completed)),
    [tasks, filter],
  );

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setTasks((current) => [{ id: crypto.randomUUID(), title, completed: false, createdAt: new Date().toISOString() }, ...current]);
    setDraft('');
  };

  const toggleTask = (id: string) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task));
  };
  const deleteTask = (id: string) => setTasks((current) => current.filter((task) => task.id !== id));
  const clearCompleted = () => setTasks((current) => current.filter((task) => !task.completed));

  const emptyCopy = filter === 'active'
    ? { title: 'All clear for now.', description: 'You have no open tasks. Take a breath — you’ve made room.' }
    : filter === 'completed'
      ? { title: 'Nothing checked off yet.', description: 'Every small finish counts. Your completed tasks will gather here.' }
      : { title: 'A little room to begin.', description: 'Add the thing on your mind. It doesn’t have to be a big thing.' };

  return (
    <div className="app-shell">
      <div className="page-frame">
        <header className="masthead">
          <div className="brand" data-testid="text-app-brand">
            <span className="brand-mark" aria-hidden="true"><Sparkles size={16} strokeWidth={1.7} /></span>
            <span className="brand-name">little by little</span>
          </div>
          <div className="today-note" data-testid="text-today-date">{getGreetingDate()}</div>
        </header>

        <main className="main-wrap">
          <div className="eyebrow">A quieter kind of to-do list</div>
          <h1 className="hero-title">Make space for<br />what matters.</h1>
          <p className="hero-copy">A small place for the things you want to remember.<br className="desktop-break" /> One step at a time is still a way forward.</p>

          <form className="compose" onSubmit={addTask} data-testid="form-add-task">
            <input
              aria-label="Write a task"
              autoComplete="off"
              data-testid="input-task-title"
              maxLength={180}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What’s on your mind?"
              value={draft}
            />
            <button className="add-button" data-testid="button-add-task" type="submit" disabled={!draft.trim()}>
              <Plus size={17} strokeWidth={2} /><span>Add a task</span>
            </button>
          </form>

          <section className="list-section" aria-label="Your tasks">
            <div className="list-toolbar">
              <div className="filter-tabs" role="group" aria-label="Filter tasks">
                {(['all', 'active', 'completed'] as const).map((item) => (
                  <button
                    aria-pressed={filter === item}
                    className="filter-button"
                    data-testid={`button-filter-${item}`}
                    key={item}
                    onClick={() => setFilter(item)}
                    type="button"
                  >
                    {item === 'all' ? 'All' : item === 'active' ? 'To do' : 'Done'}
                    {item === 'all' && <span className="filter-count" data-testid="text-task-count"> {tasks.length}</span>}
                  </button>
                ))}
              </div>
              <div className="toolbar-right">
                <span className="task-count" data-testid="text-active-count">{activeCount} left</span>
                {completedCount > 0 && (
                  <button className="clear-button" data-testid="button-clear-completed" onClick={clearCompleted} type="button">
                    Clear done
                  </button>
                )}
              </div>
            </div>

            {visibleTasks.length > 0 ? (
              <ul className="task-list" aria-live="polite" data-testid="list-tasks">
                {visibleTasks.map((task) => (
                  <li className={`task-row${task.completed ? ' is-complete' : ''}`} data-testid={`task-row-${task.id}`} key={task.id}>
                    <button
                      aria-label={`${task.completed ? 'Mark as not done' : 'Mark as done'}: ${task.title}`}
                      aria-pressed={task.completed}
                      className="check-button"
                      data-testid={`button-toggle-task-${task.id}`}
                      onClick={() => toggleTask(task.id)}
                      type="button"
                    >
                      {task.completed && <Check size={14} strokeWidth={2.5} />}
                    </button>
                    <span className="task-title" data-testid={`text-task-title-${task.id}`}>{task.title}</span>
                    <time className="task-time" dateTime={task.createdAt} data-testid={`text-task-time-${task.id}`}>{formatTime(task.createdAt)}</time>
                    <button
                      aria-label={`Delete task: ${task.title}`}
                      className="delete-button"
                      data-testid={`button-delete-task-${task.id}`}
                      onClick={() => deleteTask(task.id)}
                      type="button"
                    >
                      <Trash2 size={16} strokeWidth={1.8} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state" data-testid="panel-empty-state">
                <div className="empty-art" aria-hidden="true"><Circle size={29} strokeWidth={1.4} /></div>
                <h2 className="empty-title" data-testid="text-empty-title">{emptyCopy.title}</h2>
                <p className="empty-copy" data-testid="text-empty-description">{emptyCopy.description}</p>
              </div>
            )}
            <div className="completion-note" aria-live="polite" data-testid="text-completion-note">
              {tasks.length > 0 && completedCount === tasks.length
                ? 'Everything you planned is done. Let that be enough.'
                : completedCount > 0
                  ? `${completedCount} ${completedCount === 1 ? 'small thing' : 'small things'} finished. Nice work.`
                  : ''}
            </div>
          </section>
          <footer className="footer-note" data-testid="text-footer-note">
            <span className="footer-dot" aria-hidden="true" /> Progress, at your own pace <span className="footer-dot" aria-hidden="true" />
          </footer>
        </main>
      </div>
    </div>
  );
}

function App() {
  return <Home />;
}

export default App;