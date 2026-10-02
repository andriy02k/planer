"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { isTaskDone, type Task } from "@/lib/db";
import { CheckBox, Icon, TaskProgress } from "./icons";

export default function TaskList({ tasks, busy, onToggle, onReorder }: {
  tasks: Task[];
  busy: boolean;
  onToggle: (task: Task) => void;
  onReorder: (tasks: Task[]) => Promise<void>;
}) {
  const list = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; startY: number; startScroll: number; y: number; offset: number; target: number }>();
  const dragRef = useRef(drag);
  const tasksRef = useRef(tasks);
  const reorderRef = useRef(onReorder);
  tasksRef.current = tasks;
  reorderRef.current = onReorder;
  const [announcement, setAnnouncement] = useState("");

  async function move(from: number, to: number) {
    if (from === to || to < 0 || to >= tasksRef.current.length) return;
    const next = [...tasksRef.current];
    const [task] = next.splice(from, 1);
    next.splice(to, 0, task);
    await reorderRef.current(next);
    setAnnouncement(`${task.title}: позиція ${to + 1}`);
  }

  useEffect(() => {
    let frame = 0;
    let pointerId: number | undefined;
    function update(y: number) {
      const current = dragRef.current;
      if (!current) return;
      const rows = [...(list.current?.querySelectorAll<HTMLElement>("[data-task-id]") || [])];
      let target = current.target;
      let distance = Infinity;
      rows.forEach((row, index) => {
        // The dragged card is translated; its original slot still determines the drop order.
        const rect = row.getBoundingClientRect();
        const center = (rect.top + rect.bottom) / 2 - (row.dataset.taskId === current.id ? current.offset : 0);
        if (Math.abs(center - y) < distance) { distance = Math.abs(center - y); target = index; }
      });
      const next = { ...current, y, offset: y - current.startY + window.scrollY - current.startScroll, target };
      dragRef.current = next; setDrag(next);
    }
    function scroll() {
      const current = dragRef.current;
      if (!current) return;
      const speed = current.y < 80 ? -10 : current.y > window.innerHeight - 130 ? 10 : 0;
      if (speed) { window.scrollBy(0, speed); update(current.y); }
      frame = requestAnimationFrame(scroll);
    }
    function pointerMove(event: globalThis.PointerEvent) {
      if (!dragRef.current) return;
      if (pointerId === undefined) { pointerId = event.pointerId; frame = requestAnimationFrame(scroll); }
      if (pointerId !== event.pointerId) return;
      event.preventDefault(); update(event.clientY);
    }
    function end(event: globalThis.PointerEvent) {
      if (!dragRef.current || (pointerId !== undefined && pointerId !== event.pointerId)) return;
      const current = dragRef.current;
      dragRef.current = undefined; setDrag(undefined); cancelAnimationFrame(frame); pointerId = undefined;
      if (event.type !== "pointercancel") void move(tasksRef.current.findIndex((task) => task.id === current.id), current.target);
    }
    function cancel(event: KeyboardEvent) {
      if (event.key === "Escape") { dragRef.current = undefined; setDrag(undefined); cancelAnimationFrame(frame); pointerId = undefined; }
    }
    window.addEventListener("pointermove", pointerMove, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("keydown", cancel);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("pointermove", pointerMove); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); window.removeEventListener("keydown", cancel); };
  }, []);

  function start(event: PointerEvent<HTMLButtonElement>, id: string, index: number) {
    if (busy || tasks.length < 2 || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = { id, startY: event.clientY, startScroll: window.scrollY, y: event.clientY, offset: 0, target: index };
    dragRef.current = next; setDrag(next);
  }

  return <div className="task-list" ref={list}>
    {tasks.map((task, index) => <div data-task-id={task.id} className={`task-row ${isTaskDone(task) ? "done" : ""} ${drag?.id === task.id ? "dragging" : ""} ${drag && drag.target === index && drag.id !== task.id ? "drop-target" : ""}`} key={task.id} style={drag?.id === task.id ? { transform: `translateY(${drag.offset}px)` } : undefined}>
      {task.subtasks.length > 0 ? <Link className="progress-hit" href={`/tasks/?id=${task.id}`} aria-label={`Піддії: ${task.title}`}><TaskProgress completed={task.subtasks.filter((subtask) => subtask.done).length} total={task.subtasks.length} /></Link> : <CheckBox checked={task.done} disabled={busy || !!drag} onChange={() => onToggle(task)} label={`${task.done ? "Позначити невиконаною" : "Виконати"}: ${task.title}`} />}
      <Link className="task-link" href={`/tasks/?id=${task.id}`}><span className="task-copy"><span className="task-title">{task.title}</span></span></Link>
      {tasks.length > 1 && <button className="icon-button drag-handle" aria-label={`Перетягнути: ${task.title}`} title="Перетягни або скористайся стрілками вгору/вниз" disabled={busy} onPointerDown={(event) => start(event, task.id, index)} onKeyDown={(event) => { if (!busy && !drag && (event.key === "ArrowUp" || event.key === "ArrowDown")) { event.preventDefault(); void move(index, index + (event.key === "ArrowUp" ? -1 : 1)); } }}><Icon name="grip" width="16" /></button>}
    </div>)}
    <span className="sr-only" aria-live="polite">{announcement}</span>
  </div>;
}
