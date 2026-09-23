export function formatPublicationDate(
  date: string | null,
  precision: string | null,
) {
  if (!date || !precision) return null;

  const [year, month, day] = date.split("-").map(Number);
  if (precision === "YEAR") return String(year);

  const value = new Date(Date.UTC(year, month - 1, day));
  if (precision === "MONTH") {
    return new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(value);
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function formatAudioDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}
