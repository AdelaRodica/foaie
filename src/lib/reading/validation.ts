import { z } from "zod";

const UUID_MESSAGE = "El identificador no es válido.";
const DATE_MESSAGE = "Introduce una fecha válida.";
const INTEGER_MESSAGE = "Introduce un número entero válido.";

export function isValidCivilDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return false;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
}

export const civilDateSchema = z
  .string({ error: DATE_MESSAGE })
  .refine(isValidCivilDate, DATE_MESSAGE);

const uuidSchema = z.string({ error: UUID_MESSAGE }).uuid(UUID_MESSAGE);

function parseIntegerString(value: unknown, optional: boolean): unknown {
  if (value === undefined || value === null) return optional ? undefined : value;
  if (typeof value !== "string") return value;

  const normalized = value.trim();
  if (normalized === "") return optional ? undefined : value;
  if (!/^[+-]?\d+$/.test(normalized)) return value;

  return Number(normalized);
}

const optionalIntegerSchema = z.preprocess(
  (value) => parseIntegerString(value, true),
  z.number({ error: INTEGER_MESSAGE }).int(INTEGER_MESSAGE).optional(),
);

const requiredIntegerSchema = z.preprocess(
  (value) => parseIntegerString(value, false),
  z.number({ error: INTEGER_MESSAGE }).int(INTEGER_MESSAGE),
);

export const startReadingSchema = z.object({
  userEditionId: uuidSchema,
  startedAt: civilDateSchema,
  progressUnit: z.enum(["PAGES", "PERCENT", "MINUTES"], {
    error: "Selecciona una unidad de progreso válida.",
  }),
  currentValue: optionalIntegerSchema,
}).strict();

export const recordReadingProgressSchema = z.object({
  sessionId: uuidSchema,
  targetValue: requiredIntegerSchema,
  kind: z.enum(["PROGRESS", "CORRECTION"], {
    error: "Selecciona una operación de progreso válida.",
  }),
  occurredOn: civilDateSchema,
}).strict();

export const finishReadingSchema = z.object({
  sessionId: uuidSchema,
  finishedAt: civilDateSchema,
}).strict();

export const abandonReadingSchema = z.object({
  sessionId: uuidSchema,
  abandonedAt: civilDateSchema,
}).strict();
