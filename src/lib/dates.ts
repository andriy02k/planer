export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function fromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function shiftDay(key: string, amount: number): string {
  const date = fromKey(key);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

export function isDateKey(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(fromKey(value)) === value;
}

export function dayTitle(key: string): string {
  const today = dateKey();
  if (key === today) return "Сьогодні";
  if (key === shiftDay(today, 1)) return "Завтра";
  if (key === shiftDay(today, -1)) return "Учора";
  return fromKey(key).toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

export function longDate(key: string): string {
  return fromKey(key).toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" });
}
