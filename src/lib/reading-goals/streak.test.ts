import { describe, expect, it } from "vitest";

import {
  deriveCurrentWeekActiveDays,
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
    expect(deriveCurrentWeeklyReadingStreak(activityDates, currentDate, 1)).toBe(
      expected,
    );
  });

  it("uses the Monday boundary after Sunday", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2026-09-28", "2026-10-04", "2026-10-05"],
        "2026-10-11",
        1,
      ),
    ).toBe(2);
  });

  it("crosses the December/January year boundary", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2026-12-31", "2027-01-04"],
        "2027-01-06",
        1,
      ),
    ).toBe(2);
  });

  it("crosses a leap-day week boundary", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2024-02-29", "2024-03-04"],
        "2024-03-06",
        1,
      ),
    ).toBe(2);
  });

  it("ignores future dates without losing a live previous-week streak", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2026-09-28", "2026-10-08", "2027-01-01"],
        currentDate,
        1,
      ),
    ).toBe(1);
  });

  it("does not mutate activity dates", () => {
    const activityDates = ["2026-10-05", "2026-09-28"];
    const original = [...activityDates];

    deriveCurrentWeeklyReadingStreak(activityDates, currentDate, 1);
    deriveCurrentWeekActiveDays(activityDates, currentDate);
    deriveWeeklyReadingStreak(activityDates, currentDate, 1);

    expect(activityDates).toEqual(original);
  });

  it("rejects invalid civil dates", () => {
    expect(() =>
      deriveCurrentWeeklyReadingStreak(["2026-02-29"], currentDate, 1),
    ).toThrow(RangeError);
    expect(() =>
      deriveCurrentWeeklyReadingStreak([], "not-a-date", 1),
    ).toThrow(RangeError);
  });
});

describe("deriveLongestWeeklyReadingStreak", () => {
  it("returns zero without activity", () => {
    expect(deriveLongestWeeklyReadingStreak([], 1)).toBe(0);
  });

  it("counts one active week once", () => {
    expect(
      deriveLongestWeeklyReadingStreak(["2026-10-05", "2026-10-09"], 1),
    ).toBe(1);
  });

  it("finds consecutive weeks", () => {
    expect(
      deriveLongestWeeklyReadingStreak([
        "2026-09-21",
        "2026-09-28",
        "2026-10-05",
      ],
      1),
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
      ],
      1),
    ).toBe(3);
  });

  it("crosses the year boundary", () => {
    expect(
      deriveLongestWeeklyReadingStreak([
        "2026-12-21",
        "2026-12-31",
        "2027-01-04",
      ],
      1),
    ).toBe(3);
  });

  it("allows a retroactive date to bridge a gap", () => {
    const before = ["2026-09-21", "2026-10-05"];
    const after = [...before, "2026-09-28"];

    expect(deriveLongestWeeklyReadingStreak(before, 1)).toBe(1);
    expect(deriveLongestWeeklyReadingStreak(after, 1)).toBe(3);
  });

  it("does not mutate activity dates", () => {
    const activityDates = ["2027-01-04", "2026-12-31"];
    const original = [...activityDates];

    deriveLongestWeeklyReadingStreak(activityDates, 1);

    expect(activityDates).toEqual(original);
  });
});

describe("deriveWeeklyReadingStreak", () => {
  it("derives current and longest through one aggregate API", () => {
    expect(
      deriveWeeklyReadingStreak(
        ["2026-08-31", "2026-09-14", "2026-09-21", "2026-09-28"],
        currentDate,
        1,
      ),
    ).toEqual({ current: 3, longest: 3 });
  });

  it("keeps future activity out of current while retaining historical longest", () => {
    expect(
      deriveWeeklyReadingStreak(
        ["2026-09-28", "2026-10-08", "2026-10-12"],
        currentDate,
        1,
      ),
    ).toEqual({ current: 1, longest: 3 });
  });
});

describe("configurable weekly reading streak", () => {
  const configurableCurrentDate = "2026-10-09";
  const completedPreviousWeeks = [
    "2026-09-14",
    "2026-09-16",
    "2026-09-18",
    "2026-09-21",
    "2026-09-23",
    "2026-09-25",
    "2026-09-28",
    "2026-09-30",
    "2026-10-02",
  ];

  it.each([
    ["0/3", [], 3],
    ["1/3", ["2026-10-05"], 3],
    ["2/3", ["2026-10-05", "2026-10-06"], 3],
    ["3/3", ["2026-10-05", "2026-10-06", "2026-10-07"], 4],
    [
      "4/3",
      ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"],
      4,
    ],
  ] as const)("handles an open current week at %s", (_name, dates, expected) => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        [...completedPreviousWeeks, ...dates],
        configurableCurrentDate,
        3,
      ),
    ).toBe(expected);
  });

  it("treats a closed incomplete week as a gap", () => {
    const activityDates = [
      "2026-09-14",
      "2026-09-16",
      "2026-09-18",
      "2026-09-21",
      "2026-09-23",
      "2026-09-28",
      "2026-09-30",
      "2026-10-02",
      "2026-10-05",
    ];

    expect(
      deriveCurrentWeeklyReadingStreak(
        activityDates,
        configurableCurrentDate,
        3,
      ),
    ).toBe(1);
  });

  it("counts duplicate activities on one civil date only once", () => {
    const activityDates = [
      "2026-10-05",
      "2026-10-05",
      "2026-10-06",
      "2026-10-06",
    ];

    expect(
      deriveCurrentWeeklyReadingStreak(
        activityDates,
        configurableCurrentDate,
        3,
      ),
    ).toBe(0);
    expect(
      deriveCurrentWeekActiveDays(activityDates, configurableCurrentDate),
    ).toBe(2);
  });

  it.each([0, 8, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    "rejects invalid required days %s",
    (requiredDaysPerWeek) => {
      expect(() =>
        deriveWeeklyReadingStreak(
          [],
          configurableCurrentDate,
          requiredDaysPerWeek,
        ),
      ).toThrow(RangeError);
    },
  );

  it.each([1, 2, 3, 4, 5, 6, 7])(
    "accepts required days %s",
    (requiredDaysPerWeek) => {
      expect(
        deriveWeeklyReadingStreak(
          [],
          configurableCurrentDate,
          requiredDaysPerWeek,
        ),
      ).toEqual({ current: 0, longest: 0 });
    },
  );

  it("recalculates longest across all history when the threshold changes", () => {
    const activityDates = [
      "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04",
      "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11",
      "2026-09-14", "2026-09-15", "2026-09-16",
      "2026-09-21", "2026-09-22", "2026-09-23",
      "2026-09-28", "2026-09-29", "2026-09-30",
    ];

    expect(deriveLongestWeeklyReadingStreak(activityDates, 3)).toBe(5);
    expect(deriveLongestWeeklyReadingStreak(activityDates, 5)).toBe(2);
  });

  it("allows retroactive activity to complete a week and bridge a gap", () => {
    const before = [
      "2026-09-21", "2026-09-22", "2026-09-23",
      "2026-09-28", "2026-09-29",
      "2026-10-05", "2026-10-06", "2026-10-07",
    ];
    const after = [...before, "2026-09-30"];

    expect(deriveWeeklyReadingStreak(before, currentDate, 3)).toEqual({
      current: 1,
      longest: 1,
    });
    expect(deriveWeeklyReadingStreak(after, currentDate, 3)).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it("counts current-week days through currentDate and ignores future dates", () => {
    const activityDates = [
      "2026-10-05",
      "2026-10-05",
      "2026-10-06",
      "2026-10-08",
      "2026-10-11",
      "2027-01-01",
    ];

    expect(deriveCurrentWeekActiveDays(activityDates, currentDate)).toBe(2);
  });

  it("keeps Monday and Sunday in one completed week", () => {
    expect(
      deriveLongestWeeklyReadingStreak(["2026-09-28", "2026-10-04"], 2),
    ).toBe(1);
  });

  it("crosses Sunday to Monday with required days greater than one", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2026-09-28", "2026-10-04", "2026-10-05", "2026-10-06"],
        "2026-10-06",
        2,
      ),
    ).toBe(2);
  });

  it("crosses the year boundary with required days greater than one", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2026-12-31", "2027-01-03", "2027-01-04", "2027-01-06"],
        "2027-01-06",
        2,
      ),
    ).toBe(2);
  });

  it("crosses a leap-day boundary with required days greater than one", () => {
    expect(
      deriveCurrentWeeklyReadingStreak(
        ["2024-02-29", "2024-03-03", "2024-03-04", "2024-03-06"],
        "2024-03-06",
        2,
      ),
    ).toBe(2);
  });
});
