import { describe, expect, it } from "vitest";

import { deriveReadingActivityDates } from "./activity";

describe("deriveReadingActivityDates", () => {
  it("returns an empty list for empty sources", () => {
    expect(deriveReadingActivityDates([], [])).toEqual([]);
  });

  it("supports progress-only activity", () => {
    expect(deriveReadingActivityDates(["2026-10-03"], [])).toEqual([
      "2026-10-03",
    ]);
  });

  it("supports finished-only activity", () => {
    expect(deriveReadingActivityDates([], ["2026-10-05"])).toEqual([
      "2026-10-05",
    ]);
  });

  it("deduplicates each source and overlap between sources", () => {
    expect(
      deriveReadingActivityDates(
        ["2026-10-01", "2026-10-01", "2026-10-03"],
        ["2026-10-03", "2026-10-05", "2026-10-05"],
      ),
    ).toEqual(["2026-10-01", "2026-10-03", "2026-10-05"]);
  });

  it("sorts retroactive dates chronologically", () => {
    expect(
      deriveReadingActivityDates(
        ["2026-10-05", "2025-12-31"],
        ["2026-01-01", "2024-02-29"],
      ),
    ).toEqual(["2024-02-29", "2025-12-31", "2026-01-01", "2026-10-05"]);
  });

  it("does not mutate either input", () => {
    const progressDates = ["2026-10-03", "2026-10-01"];
    const finishedDates = ["2026-10-05", "2026-10-03"];
    const originalProgress = [...progressDates];
    const originalFinished = [...finishedDates];

    deriveReadingActivityDates(progressDates, finishedDates);

    expect(progressDates).toEqual(originalProgress);
    expect(finishedDates).toEqual(originalFinished);
  });

  it.each(["2026-02-29", "2026-13-01", "2026-1-01", "not-a-date"])(
    "rejects invalid civil date %s",
    (date) => {
      expect(() => deriveReadingActivityDates([date], [])).toThrow(RangeError);
    },
  );
});
