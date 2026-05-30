/** Zero-pads a number to two digits (e.g. 3 -> "03"). */
export const pad = (n: number) => String(n).padStart(2, "0");

/** Formats a Date as a `datetime-local` input value (no timezone offset). */
export function toLocalDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Human-friendly summary of a `datetime-local` value, e.g. "Tomorrow · 9:00 AM". */
export function formatDateTimeSummary(value: string): string {
  if (!value) return "Pick a time";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Pick a time";

  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;

  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${date} · ${time}`;
}
