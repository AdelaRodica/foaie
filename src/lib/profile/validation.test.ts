import { describe, expect, it } from "vitest";

import { readingDaysPerWeekSchema } from "./validation";

describe("readingDaysPerWeekSchema", () => {
  it.each(["1", "3", "7"])("accepts %s", (readingDaysPerWeek) => {
    expect(
      readingDaysPerWeekSchema.parse({ readingDaysPerWeek }),
    ).toEqual({ readingDaysPerWeek: Number(readingDaysPerWeek) });
  });

  it.each(["", "text", "0", "8", "-1", "1.5", String(2 ** 53)])(
    "rejects %s",
    (readingDaysPerWeek) => {
      const result = readingDaysPerWeekSchema.safeParse({
        readingDaysPerWeek,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Elige entre 1 y 7 días de lectura por semana.",
        );
      }
    },
  );
});
