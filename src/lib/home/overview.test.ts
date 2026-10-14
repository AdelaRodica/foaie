import { describe, expect, it } from "vitest";

import type { HomeReading } from "./types";
import { deriveHomeOverview } from "./overview";

const book = {
  userEditionId: "membership-1",
  workId: "work-1",
  title: "Una habitación propia",
  authors: ["Virginia Woolf"],
  format: "PHYSICAL",
  coverSrc: null,
  pageCount: 160,
  audioDurationMinutes: null,
} as const;

function reading(
  input: Partial<HomeReading> & Pick<HomeReading, "id" | "status">,
): HomeReading {
  return {
    startedAt: "2026-01-01",
    finishedAt: input.status === "FINISHED" ? "2026-01-02" : null,
    currentValue: 20,
    progressUnit: "PAGES",
    createdAt: "2026-01-01T10:00:00.000Z",
    book,
    ...input,
  };
}

describe("deriveHomeOverview", () => {
  it("derives active, recent, monthly and yearly data from one reading set", () => {
    const overview = deriveHomeOverview({
      displayName: "Ana",
      currentDate: "2026-10-14",
      hasLibrary: true,
      readings: [
        reading({ id: "active", status: "READING", startedAt: "2026-10-10" }),
        reading({ id: "october", status: "FINISHED", finishedAt: "2026-10-12" }),
        reading({
          id: "audio",
          status: "FINISHED",
          finishedAt: "2026-02-02",
          book: {
            ...book,
            userEditionId: "membership-2",
            format: "AUDIOBOOK",
            pageCount: null,
            audioDurationMinutes: 485,
          },
        }),
        reading({ id: "older", status: "FINISHED", finishedAt: "2025-12-31" }),
      ],
      goal: {
        id: "goal",
        year: 2026,
        targetCount: 12,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      progressDates: ["2026-10-13"],
      readingDaysPerWeek: 2,
    });

    expect(overview.activeReadings.map(({ id }) => id)).toEqual(["active"]);
    expect(overview.recentFinished.map(({ id }) => id)).toEqual([
      "october",
      "audio",
      "older",
    ]);
    expect(overview.monthSummary).toMatchObject({
      finishedCount: 1,
      pageCount: 160,
      audioMinutes: 0,
    });
    expect(overview.yearSummary).toMatchObject({
      finishedCount: 2,
      pageCount: 160,
      audioMinutes: 485,
    });
    expect(overview.monthlyFinishedCounts[1]).toBe(1);
    expect(overview.monthlyFinishedCounts[9]).toBe(1);
    expect(overview.readingGoals.goalProgress?.currentCount).toBe(2);
    expect(overview.readingGoals.currentWeekActiveDays).toBe(2);
  });

  it("keeps missing page and audio totals visible instead of inventing values", () => {
    const overview = deriveHomeOverview({
      displayName: null,
      currentDate: "2026-10-14",
      hasLibrary: true,
      readings: [
        reading({
          id: "pages-missing",
          status: "FINISHED",
          finishedAt: "2026-10-01",
          book: { ...book, pageCount: null },
        }),
        reading({
          id: "audio-missing",
          status: "FINISHED",
          finishedAt: "2026-10-02",
          book: {
            ...book,
            format: "AUDIOBOOK",
            pageCount: null,
            audioDurationMinutes: null,
          },
        }),
      ],
      goal: null,
      progressDates: [],
      readingDaysPerWeek: 1,
    });

    expect(overview.monthSummary).toEqual({
      finishedCount: 2,
      pageCount: 0,
      audioMinutes: 0,
      readingsWithoutPages: 1,
      readingsWithoutAudioDuration: 1,
    });
    expect(overview.readingGoals.goalProgress).toBeNull();
  });

  it("represents an empty library without synthetic statistics", () => {
    const overview = deriveHomeOverview({
      displayName: null,
      currentDate: "2026-01-01",
      hasLibrary: false,
      readings: [],
      goal: null,
      progressDates: [],
      readingDaysPerWeek: 3,
    });

    expect(overview.hasLibrary).toBe(false);
    expect(overview.activeReadings).toEqual([]);
    expect(overview.recentFinished).toEqual([]);
    expect(overview.monthlyFinishedCounts).toEqual(Array(12).fill(0));
  });

  it("rejects invalid civil dates", () => {
    expect(() => deriveHomeOverview({
      displayName: null,
      currentDate: "2026-02-30",
      hasLibrary: false,
      readings: [],
      goal: null,
      progressDates: [],
      readingDaysPerWeek: 1,
    })).toThrow(RangeError);
  });
});
