import type { SVGProps } from "react";

type IconName = "arrow-left" | "arrow-right" | "plus" | "check" | "close" | "calendar" | "sun" | "trash" | "edit" | "copy" | "grip" | "inbox";

const paths: Record<IconName, React.ReactNode> = {
  copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" /></>,
  grip: <><path d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" strokeWidth="3" /></>,
  inbox: <><path d="m4 4-2 10v6h20v-6L20 4H4Z" /><path d="M2 14h6l2 3h4l2-3h6" /></>,
  "arrow-left": <path d="m14 6-6 6 6 6M8 12h12" />,
  "arrow-right": <path d="m10 6 6 6-6 6M4 12h12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  calendar: <><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4M16 3v4M4 11h16" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  edit: <><path d="m15 4 5 5M4 20l5-1L20 8a2.8 2.8 0 0 0-4-4L5 15l-1 5Z" /></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

export function CheckBox({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: () => void; label: string }) {
  return <button type="button" className="check-hit" role="checkbox" aria-checked={checked} aria-label={label} disabled={disabled} onClick={onChange}><span className={`checkbox ${checked ? "checked" : ""}`}>{checked && <Icon name="check" width="15" height="15" />}</span></button>;
}

export function TaskProgress({ completed, total }: { completed: number; total: number }) {
  return <span className="task-progress" role="progressbar" aria-label="Виконано піддій" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}>
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle className="progress-ring-track" cx="20" cy="20" r="17" />
      <circle className="progress-ring-fill" cx="20" cy="20" r="17" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - completed / total} transform="rotate(-90 20 20)" />
    </svg>
    <span>{completed}/{total}</span>
  </span>;
}
