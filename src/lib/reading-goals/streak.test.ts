import { describe, expect, it } from "vitest";

import {
  deriveCurrentWeeklyReadingStreak,
  deriveLongestWeeklyReadingStreak,
  deriveWeeklyReadingStreak,
} from "./streak";

const currentDate = "2026-10-07";

describe("deriveCurrentWeeklyReadingStreak", () => {
  it.each([
    ["no activity", [], 0],
    ["current week active", ["2026-10-05"], 1],
    ["previous and current active", ["2026-09-28", "2026-10-05"], 2],
    [
      "three consecutive active weeks",
      ["2026-09-21", "2026-09-28", "2026-10-05"],
      3,
    ],
    ["current week empty and previous active", ["2026-09-28"], 1],
    [
      "current week empty and two previous weeks active",
      ["2026-09-21", "2026-09-28"],
      2,
    ],
    ["previous week gap", ["2026-09-21"], 0],
    ["current active after previous gap", ["2026-09-21", "2026-10-05"], 1],
    [
      "several activities in the current week",
      ["2026-10-05", "2026-10-06", "2026-10-07"],
      1,
    ],
  ] as const)("handles %s", (_name, activityDates, expected) => {
    expect(deriveCurrentWeeklyReadingStreak(activityDates, currentDate)).toBe(
      expected,
    );
  });

  it("uses the Monday boundary after Sunday", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2026-09-28", "2026-10-04", "2026-10-05"],
        "2026-10-11",
      ),
    ).toBe(2);
  });

  it("crosses the December/January year boundary", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2026-12-31", "2027-01-04"],
        "2027-01-06",
      ),
    ).toBe(2);
  });

  it("crosses a leap-day week boundary", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2024-02-29", "2024-03-04"],
        "2024-03-06",
      ),
    ).toBe(2);
  });

  it("ignores future dates without losing a live previous-week streak", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2026-09-28", "2026-10-08", "2027-01-01"],
        currentDate,
      ),
    ).toBe(1);
  });

  it("does not mutate activity dates", () => {
    const activityDates = ["2026-10-05", "2026-09-28"];
    const original = [...activityDates];

    deriveCurrentWeeklyReadingStreak(activityDates, currentDate);

    expect(activityDates).toEqual(original);
  });

  it("rejects invalid civil dates", () => {
    expect(() =>
      deriveCurrentWeeklyReadingStreak(["2026-02-29"], currentDate),
    ).toThrow(RangeError);
    expect(() =>
      deriveCurrentWeeklyReadingStreak([], "not-a-date"),
    ).toThrow(RangeError);
  });
});

describe("deriveLongestWeeklyReadingStreak", () => {
  it("returns zero without activity", () => {
    expect(deriveLongestWeeklyReadingStreak([])).toBe(0);
  });

  it("counts one active week once", () => {
    expect(
      deriveLongestWeeklyReadingStreak(["2026-10-05", "2026-10-09"]),
    ).toBe(1);
  });

  it("finds consecutive weeks", () => {
    expect(
      deriveLongestWeeklyReadingStreak([
        "2026-09-21",
        "2026-09-28",
        "2026-10-05",
      ]),
    ).toBe(3);
  });

  it("selects the longest run across a gap", () => {
    expect(
      deriveLongestWeeklyReadingStreak([
        "2026-08-31",
        "2026-09-07",
        "2026-09-21",
        "2026-09-28",
        "2026-10-05",
      ]),
    ).toBe(3);
  });

  it("crosses the year boundary", () => {
    expect(
      deriveLongestWeeklyReadingStreak([
        "2026-12-21",
        "2026-12-31",
        "2027-01-04",
      ]),
    ).toBe(3);
  });

  it("allows a retroactive date to bridge a gap", () => {
    const before = ["2026-09-21", "2026-10-05"];
    const after = [...before, "2026-09-28"];

    expect(deriveLongestWeeklyReadingStreak(before)).toBe(1);
    expect(deriveLongestWeeklyReadingStreak(after)).toBe(3);
  });

  it("does not mutate activity dates", () => {
    const activityDates = ["2027-01-04", "2026-12-31"];
    const original = [...activityDates];

    deriveLongestWeeklyReadingStreak(activityDates);

    expect(activityDates).toEqual(original);
  });
});

describe("deriveWeeklyReadingStreak", () => {
  it("derives current and longest through one aggregate API", () => {
    expect(
      deriveWeeklyReadingStreak(
        ["2026-08-31", "2026-09-14", "2026-09-21", "2026-09-28"],
        currentDate,
      ),
    ).toEqual({ current: 3, longest: 3 });
  });

  it("keeps future activity out of current while retaining historical longest", () => {
    expect(
      deriveWeeklyReadingStreak(
        ["2026-09-28", "2026-10-08", "2026-10-12"],
        currentDate,
      ),
    ).toEqual({ current: 1, longest: 3 });
  });
});
