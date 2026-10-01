import { describe, expect, it } from "vitest";

import {
  abandonReadingSchema,
  finishReadingSchema,
  isValidCivilDate,
  recordReadingProgressSchema,
  startReadingSchema,
} from "./validation";

const userEditionId = "d4e22d5c-6584-4a77-a64e-f6f02f9d82c5";
const sessionId = "73c55b91-4bed-4d68-928a-7ed6955b349b";

const validStart = {
  userEditionId,
  startedAt: "2026-01-01",
  progressUnit: "PAGES",
  currentValue: "",
};

const validProgress = {
  sessionId,
  targetValue: "35",
  kind: "PROGRESS",
  occurredOn: "2026-01-02",
};

describe("civil date validation", () => {
  it.each(["2026-01-01", "2024-02-29"])("accepts %s", (value) => {
    expect(isValidCivilDate(value)).toBe(true);
  });

  it.each([
    "26-01-01",
    "2026-1-01",
    "2026-00-10",
    "2026-13-10",
    "2026-02-29",
    "2026-04-31",
    "2026-99-99",
  ])("rejects %s", (value) => {
    expect(isValidCivilDate(value)).toBe(false);
  });

  it("uses civil-date validation in terminal schemas", () => {
    expect(finishReadingSchema.safeParse({ sessionId, finishedAt: "2024-02-29" }).success).toBe(true);
    expect(abandonReadingSchema.safeParse({ sessionId, abandonedAt: "2026-02-29" }).success).toBe(false);
  });
});

describe("start reading validation", () => {
  it("accepts a valid UUID and rejects an invalid UUID", () => {
    expect(startReadingSchema.safeParse(validStart).success).toBe(true);
    expect(startReadingSchema.safeParse({ ...validStart, userEditionId: "invalid" }).success).toBe(false);
  });

  it.each(["PAGES", "PERCENT", "MINUTES"])("accepts progress unit %s", (progressUnit) => {
    expect(startReadingSchema.safeParse({ ...validStart, progressUnit }).success).toBe(true);
  });

  it("rejects an unknown progress unit", () => {
    expect(startReadingSchema.safeParse({ ...validStart, progressUnit: "CHAPTERS" }).success).toBe(false);
  });

  it("keeps an empty optional current value absent", () => {
    const result = startReadingSchema.parse(validStart);
    expect(result.currentValue).toBeUndefined();
  });

  it.each([
    ["0", 0],
    ["35", 35],
  ])("parses current value %s as %i", (currentValue, expected) => {
    expect(startReadingSchema.parse({ ...validStart, currentValue }).currentValue).toBe(expected);
  });

  it.each(["1.5", "abc"])("rejects current value %s", (currentValue) => {
    expect(startReadingSchema.safeParse({ ...validStart, currentValue }).success).toBe(false);
  });
});

describe("reading progress validation", () => {
  it.each(["PROGRESS", "CORRECTION"])("accepts progress kind %s", (kind) => {
    expect(recordReadingProgressSchema.safeParse({ ...validProgress, kind }).success).toBe(true);
  });

  it("rejects an unknown progress kind", () => {
    expect(recordReadingProgressSchema.safeParse({ ...validProgress, kind: "RESET" }).success).toBe(false);
  });

  it.each([
    ["0", 0],
    ["120", 120],
  ])("parses target value %s as %i", (targetValue, expected) => {
    expect(recordReadingProgressSchema.parse({ ...validProgress, targetValue }).targetValue).toBe(expected);
  });

  it.each(["", "1.5", "abc"])("rejects target value %j", (targetValue) => {
    expect(recordReadingProgressSchema.safeParse({ ...validProgress, targetValue }).success).toBe(false);
  });
});
