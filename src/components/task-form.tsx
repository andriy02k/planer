"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

export type TaskFields = { title: string; description: string; date: string };

export default function TaskForm({ initial, editing = false, onSave, onClose }: {
  initial: TaskFields;
  editing?: boolean;
  onSave: (fields: TaskFields) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [fields, setFields] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  return <dialog ref={dialog} className="task-dialog" onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }} onClick={(event) => { if (event.target === dialog.current && !saving) onClose(); }}>
    <form className="dialog-content" onSubmit={async (event) => {
      event.preventDefault();
      if (!fields.title.trim() || saving) return;
      setSaving(true); setError("");
      try { await onSave({ ...fields, title: fields.title.trim(), description: fields.description.trim() }); onClose(); }
      catch { setError("Не вдалося зберегти дію. Спробуй ще раз."); setSaving(false); }
    }}>
      <div className="dialog-heading"><h2>{editing ? "Редагувати дію" : "Нова дія"}</h2><button type="button" className="icon-button" onClick={onClose} disabled={saving} aria-label="Закрити"><Icon name="close" /></button></div>
      <label className="field">Що потрібно зробити?<input autoFocus required maxLength={200} value={fields.title} onChange={(e) => setFields({ ...fields, title: e.target.value })} placeholder="Наприклад, прочитати 10 сторінок" disabled={saving} /></label>
      <label className="field">Подробиці <span className="optional">необов’язково</span><textarea rows={4} maxLength={10000} value={fields.description} onChange={(e) => setFields({ ...fields, description: e.target.value })} placeholder="Залиши тут усе, що допоможе почати…" disabled={saving} /></label>
      {error && <p role="alert" className="error">{error}</p>}
      <button className="primary-button" disabled={saving || !fields.title.trim()}>{saving ? "Зберігаю…" : editing ? "Зберегти зміни" : "Додати дію"}<Icon name={editing ? "check" : "plus"} /></button>
    </form>
  </dialog>;
}
