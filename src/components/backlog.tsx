"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getTasks, newTask, reorderTasks, saveTask, type Task } from "@/lib/db";
import { Icon } from "./icons";
import TaskForm, { type TaskFields } from "./task-form";
import TaskList from "./task-list";

export default function Backlog() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    getTasks("").then((result) => { if (active) setTasks(result); }).catch(() => { if (active) setError("Не вдалося відкрити справи. Спробуй ще раз."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") setReload((value) => value + 1); };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);

  async function add(fields: TaskFields) {
    const task = await saveTask(newTask(fields.title, "", fields.description));
    setTasks((list) => [...list, task]);
  }

  async function change(operation: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await operation(); }
    catch { setError("Не вдалося зберегти зміни. Спробуй ще раз."); }
    finally { lock.current = false; setBusy(false); }
  }

  return <main className="app-shell">
    <header className="detail-nav"><Link className="back-link" href="/"><Icon name="arrow-left" />До плану</Link><span className="small-brand">мій день<span className="brand-dot">.</span></span></header>
    <section className="day-header"><p className="eyebrow">УСЕ МАЄ СВІЙ ЧАС.</p><h1>Без дати<span className="heading-dot">.</span></h1><p className="date-label">Справи, для яких день ще не обрано</p></section>
    <section className="plan-section"><div className="section-heading"><h2>Справи</h2><span>{tasks.length}</span></div>
      {error && <div className="error-box" role="alert">{error}<button className="text-button" onClick={() => setReload((value) => value + 1)}>Спробувати ще раз</button></div>}
      {loading ? <div className="loading-state" role="status">Відкриваю справи…</div> : tasks.length ? <TaskList tasks={tasks} busy={busy} onToggle={(task) => { void change(async () => { const updated = await saveTask({ ...task, done: !task.done }); setTasks((list) => list.map((item) => item.id === task.id ? updated : item)); }); }} onReorder={(next) => change(async () => { await reorderTasks("", next.map((task) => task.id)); setTasks(next); })} /> : !error && <div className="empty-state"><Icon name="inbox" width="36" height="36" /><h3>Поки що тут порожньо</h3></div>}
    </section>
    <footer className="bottom-bar"><button className="primary-button" onClick={() => setAdding(true)} disabled={loading || busy}>Додати справу<Icon name="plus" /></button><p>Менше шуму. Більше свого.</p></footer>
    {adding && <TaskForm initial={{ title: "", description: "", date: "" }} onSave={add} onClose={() => setAdding(false)} />}
  </main>;
}
