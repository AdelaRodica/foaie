import { z } from "zod";

function isValidIanaTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("es-ES", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

const displayName = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim();
    return normalized === "" ? null : normalized;
  },
  z.string().max(80).nullable(),
);

const timezone = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine(isValidIanaTimezone);

export const profilePreferencesSchema = z.object({
  displayName,
  timezone,
});

const READING_DAYS_MESSAGE =
  "Elige entre 1 y 7 días de lectura por semana.";

export const readingDaysPerWeekSchema = z.object({
  readingDaysPerWeek: z.coerce
    .number({ error: READING_DAYS_MESSAGE })
    .int(READING_DAYS_MESSAGE)
    .min(1, READING_DAYS_MESSAGE)
    .max(7, READING_DAYS_MESSAGE),
});
