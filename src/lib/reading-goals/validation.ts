import { z } from "zod";

const INVALID_YEAR_MESSAGE = "Introduce un año válido.";
const INVALID_TARGET_COUNT_MESSAGE =
  "Introduce un número de lecturas mayor que 0.";
const INVALID_GOAL_ID_MESSAGE =
  "No se ha podido identificar el objetivo de lectura.";

function parseIntegerString(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const normalizedValue = value.trim();

  if (normalizedValue === "" || !/^[+-]?\d+$/.test(normalizedValue)) {
    return value;
  }

  return Number(normalizedValue);
}

const yearSchema = z.preprocess(
  parseIntegerString,
  z
    .number({ error: INVALID_YEAR_MESSAGE })
    .int(INVALID_YEAR_MESSAGE)
    .refine(Number.isSafeInteger, INVALID_YEAR_MESSAGE),
);

const targetCountSchema = z.preprocess(
  parseIntegerString,
  z
    .number({ error: INVALID_TARGET_COUNT_MESSAGE })
    .int(INVALID_TARGET_COUNT_MESSAGE)
    .positive(INVALID_TARGET_COUNT_MESSAGE)
    .refine(Number.isSafeInteger, INVALID_TARGET_COUNT_MESSAGE),
);

const goalIdSchema = z.uuid(INVALID_GOAL_ID_MESSAGE);

export const createAnnualReadingGoalSchema = z
  .object({
    year: yearSchema,
    targetCount: targetCountSchema,
  })
  .strict();

export const updateAnnualReadingGoalSchema = z
  .object({
    goalId: goalIdSchema,
    targetCount: targetCountSchema,
  })
  .strict();

export const deleteAnnualReadingGoalSchema = z
  .object({
    goalId: goalIdSchema,
  })
  .strict();
