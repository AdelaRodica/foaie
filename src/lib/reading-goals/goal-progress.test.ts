import { describe, expect, it } from "vitest";

import { deriveAnnualReadingGoalProgress } from "./goal-progress";
import type { AnnualReadingGoal } from "./types";

function createGoal(targetCount = 12): AnnualReadingGoal {
  return {
    id: "goal-id",
    year: 2026,
    targetCount,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  };
}

describe("deriveAnnualReadingGoalProgress", () => {
  it.each([
    [0, 12, 12, false, false],
    [7, 12, 5, false, false],
    [12, 12, 0, true, false],
    [15, 12, 0, true, true],
    [7, 5, 0, true, true],
  ])(
    "derives %i / %i",
    (finishedCount, targetCount, remainingCount, achieved, exceeded) => {
      expect(
        deriveAnnualReadingGoalProgress(createGoal(targetCount), finishedCount),
      ).toEqual({
        year: 2026,
        targetCount,
        currentCount: finishedCount,
        remainingCount,
        achieved,
        exceeded,
      });
    },
  );

  it("does not mutate the goal", () => {
    const goal = createGoal();
    const original = { ...goal };

    deriveAnnualReadingGoalProgress(goal, 7);

    expect(goal).toEqual(original);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid targetCount %s",
    (targetCount) => {
      expect(() =>
        deriveAnnualReadingGoalProgress(createGoal(targetCount), 0),
      ).toThrow(RangeError);
    },
  );

  it.each([-1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid finishedCount %s",
    (finishedCount) => {
      expect(() =>
        deriveAnnualReadingGoalProgress(createGoal(), finishedCount),
      ).toThrow(RangeError);
    },
  );
});
