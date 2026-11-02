export const DEMO_TODAY = "2026-11-09";
export const DEMO_PASSWORD = "demo123";
export const BRAND_NAME = "Rento";

export const ROOM_TYPES = [
  "Non-AC",
  "AC",
  "Non-AC · attached bath",
  "AC · attached bath",
] as const;

export const COMPLAINT_CATEGORIES = [
  "Maintenance",
  "Cleanliness",
  "Roommate",
  "Safety / urgent",
  "Other",
] as const;

export const ASSIGNEES = [
  "Anita (Warden)",
  "Ramesh (Plumber)",
  "Lakshmi (Housekeeping)",
  "Raju (Owner)",
] as const;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function parseIso(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

export function toIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDayMonth(iso: string) {
  const date = parseIso(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatFullDate(iso: string) {
  const date = parseIso(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthLabel(iso: string) {
  const date = parseIso(iso);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthLabelFromParts(year: number, monthIndex: number) {
  return `${MONTHS[monthIndex]} ${year}`;
}

export function dayDiff(from: string, to: string) {
  return Math.round(
    (parseIso(to).getTime() - parseIso(from).getTime()) / 86400000,
  );
}

export function addDays(iso: string, days: number) {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function nowLabel() {
  const time = new Date().toTimeString().slice(0, 5);
  return `${formatDayMonth(DEMO_TODAY)}, ${time}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatInr(value: number) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export function nextMonth(from = DEMO_TODAY) {
  const date = parseIso(from);
  let monthIndex = date.getMonth() + 1;
  let year = date.getFullYear();
  if (monthIndex > 11) {
    monthIndex = 0;
    year += 1;
  }
  return {
    label: monthLabelFromParts(year, monthIndex),
    year,
    monthIndex,
  };
}

export function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}
