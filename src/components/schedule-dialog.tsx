"use client";

import { useEffect, useRef, useState } from "react";
import { dateKey, isDateKey } from "@/lib/dates";
import { Icon } from "./icons";

export default function ScheduleDialog({ date, onSave, onClose }: { date: string; onSave: (date: string) => Promise<void>; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(date || dateKey());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  async function save(value: string) {
    if (busy) return;
    setBusy(true); setError("");
    try { await onSave(value); onClose(); }
    catch { setError("Не вдалося змінити день. Спробуй ще раз."); setBusy(false); }
  }
  return <dialog className="task-dialog" ref={dialog} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <form className="dialog-content" onSubmit={(event) => { event.preventDefault(); if (isDateKey(selected)) void save(selected); }}>
      <div className="dialog-heading"><h2>Обрати день</h2><button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="Закрити"><Icon name="close" /></button></div>
      <label className="field">День для справи<input type="date" value={selected} required onChange={(event) => setSelected(event.target.value)} disabled={busy} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary-button" disabled={busy || !isDateKey(selected)}>{busy ? "Зберігаю…" : "Запланувати"}<Icon name="calendar" /></button>
      {date && <button type="button" className="text-button" onClick={() => save("")} disabled={busy}>Залишити без дати</button>}
    </form>
  </dialog>;
}
