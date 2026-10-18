// Fixed time zone so server and client render identical strings (no hydration mismatch).
const dateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const date = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "18 Oct, 3:42 pm" */
export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

/** "18 Oct 2026" */
export function formatDate(iso: string) {
  return date.format(new Date(iso));
}

/** 18420 → "18.4k" */
export function formatCompact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
