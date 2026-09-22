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
