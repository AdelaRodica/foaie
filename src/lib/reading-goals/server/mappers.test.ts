import { describe, expect, it } from "vitest";

import { ReadingGoalError } from "./errors";
import { mapAnnualReadingGoal } from "./mappers";

const row = {
  id: "goal-id",
  user_id: "private-user-id",
  year: 2026,
  target_count: 12,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-02-01T00:00:00.000Z",
};

describe("mapAnnualReadingGoal", () => {
  it("maps snake_case to the public camelCase domain model", () => {
    const goal = mapAnnualReadingGoal(row);

    expect(goal).toEqual({
      id: "goal-id",
      year: 2026,
      targetCount: 12,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    });
    expect(goal).not.toHaveProperty("user_id");
    expect(goal).not.toHaveProperty("userId");
  });

  it.each([
    { year: 2026.5 },
    { target_count: 0 },
    { target_count: Number.MAX_SAFE_INTEGER + 1 },
  ])("rejects an impossible database row %#", (override) => {
    expect(() => mapAnnualReadingGoal({ ...row, ...override })).toThrow(
      ReadingGoalError,
    );
  });
});
