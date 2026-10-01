"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dayTitle, longDate } from "@/lib/dates";
import { deleteTask, getTask, isTaskDone, saveTask, type Task } from "@/lib/db";
import { CheckBox, Icon, TaskProgress } from "./icons";
import TaskForm, { type TaskFields } from "./task-form";

export default function TaskDetail({ id }: { id: string }) {
  const router = useRouter();
  const [task, setTask] = useState<Task>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [reload, setReload] = useState(0);
  const deleteDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    getTask(id).then((result) => { if (active) setTask(result); }).catch(() => { if (active) setError("Не вдалося відкрити дію. Спробуй ще раз."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);

  async function commit(next: Task): Promise<boolean> {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError("");
    try { const updated = { ...next, done: isTaskDone(next) }; await saveTask(updated); setTask(updated); return true; }
    catch { setError("Не вдалося зберегти зміни. Спробуй ще раз."); return false; }
    finally { lock.current = false; setBusy(false); }
  }

  async function edit(fields: TaskFields) {
    if (!task || !await commit({ ...task, ...fields })) throw new Error("Save failed");
  }

  async function remove() {
    if (!task || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await deleteTask(task.id); router.replace(`/?day=${task.date}`); }
    catch { setError("Не вдалося видалити дію. Спробуй ще раз."); deleteDialog.current?.close(); lock.current = false; setBusy(false); }
  }

  const completed = task?.subtasks.filter((subtask) => subtask.done).length || 0;

  return <main className="app-shell detail-shell">
    <header className="detail-nav"><Link className="back-link" href={task ? `/?day=${task.date}` : "/"}><Icon name="arrow-left" />До плану</Link><span className="small-brand">мій день<span className="brand-dot">.</span></span></header>
    {loading ? <div className="loading-state" role="status"><span className="loading-dot" />Відкриваю дію…</div> : task ? <>
      <section className="detail-header"><p className="eyebrow">{dayTitle(task.date)} · {longDate(task.date)}</p><h1 className={isTaskDone(task) ? "completed-title" : ""}>{task.title}</h1><div className="detail-status">
        {task.subtasks.length > 0 ? <span className="progress-hit"><TaskProgress completed={completed} total={task.subtasks.length} /></span> : <CheckBox checked={task.done} disabled={busy} onChange={() => commit({ ...task, done: !task.done })} label={task.done ? "Позначити дію невиконаною" : "Позначити дію виконаною"} />}
        <span>{task.subtasks.length > 0 ? isTaskDone(task) ? "Дію виконано" : "Прогрес піддій" : task.done ? "Дію виконано" : "Позначити виконаною"}</span><button className="icon-button edit-button" aria-label="Редагувати дію" onClick={() => setEditing(true)} disabled={busy}><Icon name="edit" /></button></div></section>
      <details className="description-section"><summary>Подробиці<Icon name="arrow-right" width="16" /></summary>{task.description ? <p className="description">{task.description}</p> : <button className="description-placeholder" onClick={() => setEditing(true)} disabled={busy}>Додай кілька слів, щоб було легше почати <Icon name="plus" width="16" /></button>}</details>
      <section className="subtask-section"><div className="section-heading"><h2>Маленькі кроки</h2><span>{completed} / {task.subtasks.length}</span></div>{task.subtasks.length > 0 && <div className="task-list">{task.subtasks.map((subtask) => <div className={`task-row subtask-row ${subtask.done ? "done" : ""}`} key={subtask.id}><CheckBox checked={subtask.done} disabled={busy} onChange={() => commit({ ...task, subtasks: task.subtasks.map((item) => item.id === subtask.id ? { ...item, done: !item.done } : item) })} label={`${subtask.done ? "Позначити невиконаною" : "Виконати"}: ${subtask.title}`} /><span className="task-title">{subtask.title}</span><button className="icon-button delete-subtask" aria-label={`Видалити піддію: ${subtask.title}`} disabled={busy} onClick={() => commit({ ...task, subtasks: task.subtasks.filter((item) => item.id !== subtask.id) })}><Icon name="close" width="16" /></button></div>)}</div>}
      <form className="subtask-form" onSubmit={async (event) => { event.preventDefault(); const title = subtaskTitle.trim(); if (!title || busy) return; if (await commit({ ...task, subtasks: [...task.subtasks, { id: crypto.randomUUID(), title, done: false }] })) setSubtaskTitle(""); }}><input aria-label="Нова піддія" placeholder="Додати маленький крок…" maxLength={200} value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} disabled={busy} /><button className="icon-button" type="submit" aria-label="Додати піддію" disabled={busy || !subtaskTitle.trim()}><Icon name="plus" /></button></form></section>
      {error && <p role="alert" className="error-box">{error}</p>}
      <footer className="detail-footer"><button className="delete-action" onClick={() => deleteDialog.current?.showModal()} disabled={busy}><Icon name="trash" width="16" />Видалити дію</button><p>Один крок ближче.</p></footer>
      {editing && <TaskForm editing initial={{ title: task.title, description: task.description, date: task.date }} onSave={edit} onClose={() => setEditing(false)} />}
      <dialog ref={deleteDialog} className="confirm-dialog" onCancel={(event) => { if (busy) event.preventDefault(); }}><div className="dialog-content"><h2>Видалити цю дію?</h2><p>Дію та її піддії буде видалено.</p><div className="confirm-actions"><button className="secondary-button" onClick={() => deleteDialog.current?.close()} disabled={busy}>Залишити</button><button className="danger-button" onClick={remove} disabled={busy}>{busy ? "Видаляю…" : "Видалити"}</button></div></div></dialog>
    </> : <div className="empty-state"><Icon name="sun" width="40" height="40" /><h1>{error ? "Не вдалося відкрити дію" : "Дію не знайдено"}</h1><p>{error || "Можливо, її вже видалено або вона збережена в іншому браузері."}</p>{error && <button className="secondary-button" onClick={() => setReload((value) => value + 1)}>Спробувати ще раз</button>}<Link className="text-button" href="/">Повернутися до плану</Link></div>}
  </main>;
}
