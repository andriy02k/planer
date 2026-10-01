"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dateKey, dayTitle, fromKey, isDateKey, longDate, shiftDay } from "@/lib/dates";
import { getTasks, isTaskDone, newTask, saveTask, type Task } from "@/lib/db";
import { CheckBox, Icon, TaskProgress } from "./icons";
import TaskForm, { type TaskFields } from "./task-form";

export default function Planner() {
  const [selected, setSelected] = useState("");
  const [today, setToday] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const selectedRef = useRef("");
  const [reload, setReload] = useState(0);
  selectedRef.current = selected;

  useEffect(() => {
    const sync = () => {
      const now = dateKey();
      setToday(now);
      const query = new URLSearchParams(window.location.search).get("day");
      setSelected(isDateKey(query) ? query : now);
    };
    sync();
    window.addEventListener("popstate", sync);
    const refresh = () => { if (document.visibilityState === "visible") { setToday(dateKey()); setReload((v) => v + 1); } };
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(() => setToday(dateKey()), 60000);
    return () => { window.removeEventListener("popstate", sync); document.removeEventListener("visibilitychange", refresh); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setLoading(true); setTasks([]); setError("");
    getTasks(selected).then((result) => { if (active) setTasks(result); }).catch(() => { if (active) setError("Не вдалося відкрити план. Перевір, чи браузер дозволяє збереження даних."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selected, reload]);

  function select(day: string) {
    setSelected(day);
    window.history.replaceState(null, "", `/?day=${day}`);
  }

  async function toggle(task: Task) {
    if (busyRef.current || task.subtasks.length > 0) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const changed = { ...task, done: !task.done };
      await saveTask(changed);
      if (selectedRef.current === task.date) setTasks((list) => list.map((item) => item.id === task.id ? changed : item));
    } catch { setError("Не вдалося зберегти зміни. Спробуй ще раз."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function add(fields: TaskFields) {
    const task = newTask(fields.title, fields.date, fields.description);
    await saveTask(task);
    if (fields.date === selectedRef.current) setTasks((list) => [...list, task]);
    else select(fields.date);
  }

  const completed = tasks.filter(isTaskDone).length;
  const progress = tasks.length ? (completed / tasks.length) * 100 : 0;
  const weekStart = selected && today ? selected < today ? selected : shiftDay(today, Math.floor(Math.max(0, Math.round((fromKey(selected).getTime() - fromKey(today).getTime()) / 86400000)) / 7) * 7) : "";
  const days = weekStart ? Array.from({ length: 7 }, (_, i) => shiftDay(weekStart, i)) : [];

  return <main className="app-shell">
    <header className="brand"><span className="brand-mark"><Icon name="sun" width="19" height="19" /></span><span>мій день<span className="brand-dot">.</span></span><span className="brand-note">крок за кроком</span></header>
    <section className="day-header"><p className="eyebrow">ТРОХИ ФОКУСУ. ТРОХИ СПОКОЮ.</p><div className="title-row"><h1>{selected ? dayTitle(selected) : "Мій день"}<span className="heading-dot">.</span></h1><label className="calendar-button" aria-label="Обрати дату"><Icon name="calendar" /><input type="date" aria-label="Обрати дату" value={selected} onChange={(event) => { if (isDateKey(event.target.value)) select(event.target.value); }} /></label></div><p className="date-label">{selected ? longDate(selected) : "Твій простір для важливого"}</p></section>
    <nav className="week" aria-label="Дні плану">
      <button className="week-arrow icon-button" aria-label="Попередні сім днів" onClick={() => select(shiftDay(selected, -7))} disabled={!selected}><Icon name="arrow-left" width="17" /></button>
      <div className="week-days">{days.map((day) => <button key={day} className={`day-button ${day === selected ? "selected" : ""} ${day === today ? "today" : ""}`} onClick={() => select(day)} aria-pressed={day === selected} aria-label={longDate(day)}><span>{fromKey(day).toLocaleDateString("uk-UA", { weekday: "short" })}</span><strong>{fromKey(day).getDate()}</strong><i /></button>)}</div>
      <button className="week-arrow icon-button" aria-label="Наступні сім днів" onClick={() => select(shiftDay(selected, 7))} disabled={!selected}><Icon name="arrow-right" width="17" /></button>
    </nav>
    {selected && selected !== today && <button className="back-today" onClick={() => select(today)}>Повернутися до сьогодні <Icon name="arrow-left" width="14" /></button>}
    <section className="plan-section" aria-labelledby="plan-title">
      <div className="section-heading"><h2 id="plan-title">План на день</h2><span>{!loading && !error ? `${completed} / ${tasks.length}` : "—"}</span></div>
      <div className="progress-track" role="progressbar" aria-label="Виконано дій" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={tasks.length || 1}><div style={{ width: `${progress}%` }} /></div>
      {error && <div className="error-box" role="alert"><p>{error}</p><button className="text-button" onClick={() => setReload((v) => v + 1)}>Спробувати ще раз</button></div>}
      {loading ? <div className="loading-state" role="status"><span className="loading-dot" />Відкриваю твій план…</div> : !error || tasks.length > 0 ? tasks.length ? <div className="task-list">{tasks.map((task) => <div className={`task-row ${isTaskDone(task) ? "done" : ""}`} key={task.id}>
        {task.subtasks.length > 0 ? <Link className="progress-hit" href={`/tasks/${task.id}`} aria-label={`Піддії: ${task.title}`}><TaskProgress completed={task.subtasks.filter((subtask) => subtask.done).length} total={task.subtasks.length} /></Link> : <CheckBox checked={task.done} disabled={busy} onChange={() => toggle(task)} label={`${task.done ? "Позначити невиконаною" : "Виконати"}: ${task.title}`} />}
        <Link className="task-link" href={`/tasks/${task.id}`}><span className="task-copy"><span className="task-title">{task.title}</span></span><Icon name="arrow-right" width="16" /></Link>
      </div>)}</div> : <div className="empty-state"><div className="empty-art"><span className="art-ring" /><Icon name="sun" width="34" height="34" /><span className="art-spark">✦</span></div><h3>День починається з однієї дії</h3><p>Додай те, що хочеш зробити.<br />Решта — крок за кроком.</p></div> : null}
      {!loading && tasks.length > 0 && !error && <p className="plan-caption" aria-live="polite">{completed === tasks.length ? "Усе зроблено. Час видихнути ✨" : "Кожна маленька дія має значення."}</p>}
    </section>
    <footer className="bottom-bar"><button className="primary-button" onClick={() => setAdding(true)} disabled={!selected || loading}><span>Додати дію</span><Icon name="plus" /></button><p>Менше шуму. Більше свого.</p></footer>
    {adding && <TaskForm initial={{ title: "", description: "", date: selected }} onSave={add} onClose={() => setAdding(false)} />}
  </main>;
}
