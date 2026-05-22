export function formatDisplayDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const isoDate = value.includes("T") ? value.slice(0, 10) : value;
  const [year, month, day] = isoDate.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
}
