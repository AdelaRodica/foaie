import { describe, expect, it } from "vitest";

import {
  createAnnualReadingGoalSchema,
  deleteAnnualReadingGoalSchema,
  updateAnnualReadingGoalSchema,
} from "./validation";

const GOAL_ID = "6f059a14-4067-4c32-8f55-7ad353feca2c";

describe("annual reading goal validation", () => {
  it("parses valid create input without imposing an arbitrary year range", () => {
    expect(
      createAnnualReadingGoalSchema.parse({ year: "1800", targetCount: "12" }),
    ).toEqual({ year: 1800, targetCount: 12 });
  });

  it.each(["", "year", "2026.5", "9007199254740992"])(
    "rejects invalid year %j",
    (year) => {
      expect(
        createAnnualReadingGoalSchema.safeParse({ year, targetCount: "12" })
          .success,
      ).toBe(false);
    },
  );

  it.each(["", "many", "1.5", "0", "-1", "9007199254740992"])(
    "rejects invalid target count %j",
    (targetCount) => {
      expect(
        createAnnualReadingGoalSchema.safeParse({ year: "2026", targetCount })
          .success,
      ).toBe(false);
    },
  );

  it("parses valid update input", () => {
    expect(
      updateAnnualReadingGoalSchema.parse({ goalId: GOAL_ID, targetCount: "24" }),
    ).toEqual({ goalId: GOAL_ID, targetCount: 24 });
  });

  it("rejects an invalid update id", () => {
    expect(
      updateAnnualReadingGoalSchema.safeParse({
        goalId: "not-a-uuid",
        targetCount: "24",
      }).success,
    ).toBe(false);
  });

  it("parses valid delete input and rejects an invalid id", () => {
    expect(deleteAnnualReadingGoalSchema.parse({ goalId: GOAL_ID })).toEqual({
      goalId: GOAL_ID,
    });
    expect(deleteAnnualReadingGoalSchema.safeParse({ goalId: "" }).success).toBe(
      false,
    );
  });

  it("rejects unknown fields", () => {
    expect(
      createAnnualReadingGoalSchema.safeParse({
        year: "2026",
        targetCount: "12",
        unexpectedField: "unexpected-value",
      }).success,
    ).toBe(false);
  });
});
