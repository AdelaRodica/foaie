import { describe, expect, it } from "vitest";

import { deriveReadingGoalsOverview } from "./overview";
import type { AnnualReadingGoal } from "./types";

function createGoal(year = 2026, targetCount = 4): AnnualReadingGoal {
  return {
    id: "goal-id",
    year,
    targetCount,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("deriveReadingGoalsOverview", () => {
  it("returns null progress without a goal", () => {
    expect(
      deriveReadingGoalsOverview({
        currentDate: "2026-10-08",
        goal: null,
        finishedDates: ["2026-10-05"],
        progressDates: [],
        readingDaysPerWeek: 1,
      }),
    ).toEqual({
      currentDate: "2026-10-08",
      year: 2026,
      goal: null,
      goalProgress: null,
      readingDaysPerWeek: 1,
      currentWeekActiveDays: 1,
      streak: { current: 1, longest: 1 },
    });
  });

  it("derives the current year and counts finished sessions independently", () => {
    const goal = createGoal();

    expect(
      deriveReadingGoalsOverview({
        currentDate: "2026-10-08",
        goal,
        finishedDates: [
          "2025-12-31",
          "2026-10-05",
          "2026-10-05",
          "2026-10-06",
        ],
        progressDates: ["2026-10-05", "2026-10-06"],
        readingDaysPerWeek: 2,
      }),
    ).toEqual({
      currentDate: "2026-10-08",
      year: 2026,
      goal,
      goalProgress: {
        year: 2026,
        targetCount: 4,
        currentCount: 3,
        remainingCount: 1,
        achieved: false,
        exceeded: false,
      },
      readingDaysPerWeek: 2,
      currentWeekActiveDays: 2,
      streak: { current: 1, longest: 1 },
    });
  });

  it("counts two same-day finishes twice for the goal but once for activity", () => {
    const overview = deriveReadingGoalsOverview({
      currentDate: "2026-10-08",
      goal: createGoal(2026, 2),
      finishedDates: ["2026-10-05", "2026-10-05"],
      progressDates: ["2026-10-05"],
      readingDaysPerWeek: 2,
    });

    expect(overview.goalProgress?.currentCount).toBe(2);
    expect(overview.currentWeekActiveDays).toBe(1);
    expect(overview.streak).toEqual({ current: 0, longest: 0 });
  });

  it("derives a year boundary from currentDate", () => {
    expect(
      deriveReadingGoalsOverview({
        currentDate: "2026-12-31",
        goal: createGoal(2026),
        finishedDates: ["2026-12-31", "2027-01-01"],
        progressDates: [],
        readingDaysPerWeek: 1,
      }).goalProgress?.currentCount,
    ).toBe(1);
  });

  it("rejects a goal from a different year", () => {
    expect(() =>
      deriveReadingGoalsOverview({
        currentDate: "2026-12-31",
        goal: createGoal(2027),
        finishedDates: [],
        progressDates: [],
        readingDaysPerWeek: 1,
      }),
    ).toThrow(RangeError);
  });

  it("does not mutate date inputs", () => {
    const finishedDates = ["2026-10-05", "2026-09-28"];
    const progressDates = ["2026-10-06"];
    const originalFinished = [...finishedDates];
    const originalProgress = [...progressDates];

    deriveReadingGoalsOverview({
      currentDate: "2026-10-08",
      goal: createGoal(),
      finishedDates,
      progressDates,
      readingDaysPerWeek: 1,
    });

    expect(finishedDates).toEqual(originalFinished);
    expect(progressDates).toEqual(originalProgress);
  });
});
