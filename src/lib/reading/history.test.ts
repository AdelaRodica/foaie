import { describe, expect, it } from "vitest";

import {
  deriveReadingHistorySummariesByUserEdition,
  deriveReadingHistorySummary,
} from "./history";
import type { ReadingSession, ReadingStatus } from "./types";

function createSession(
  status: ReadingStatus,
  id: string,
  userEditionId = "membership-id",
): ReadingSession {
  return {
    id,
    userEditionId,
    status,
    startedAt: "2026-01-01",
    finishedAt: status === "FINISHED" ? "2026-01-20" : null,
    abandonedAt: status === "ABANDONED" ? "2026-01-20" : null,
    currentValue: 42,
    progressUnit: "PAGES",
    createdAt: "2026-01-01T10:00:00.000Z",
  };
}

describe("deriveReadingHistorySummary", () => {
  it("returns zero counts for an empty history", () => {
    expect(deriveReadingHistorySummary([])).toEqual({
      sessionCount: 0,
      readingCount: 0,
      finishedCount: 0,
      abandonedCount: 0,
    });
  });

  it.each([
    ["READING", { readingCount: 1, finishedCount: 0, abandonedCount: 0 }],
    ["FINISHED", { readingCount: 0, finishedCount: 1, abandonedCount: 0 }],
    ["ABANDONED", { readingCount: 0, finishedCount: 0, abandonedCount: 1 }],
  ] as const)("counts one %s session", (status, counts) => {
    expect(deriveReadingHistorySummary([createSession(status, status)])).toEqual({
      sessionCount: 1,
      ...counts,
    });
  });

  it.each([
    [["FINISHED", "ABANDONED"], [0, 1, 1]],
    [["FINISHED", "READING"], [1, 1, 0]],
    [["FINISHED", "FINISHED"], [0, 2, 0]],
    [["READING", "FINISHED", "ABANDONED"], [1, 1, 1]],
  ] as const)("counts the mixed history %j independently", (statuses, counts) => {
    const sessions = statuses.map((status, index) =>
      createSession(status, `session-${index}`),
    );

    expect(deriveReadingHistorySummary(sessions)).toEqual({
      sessionCount: statuses.length,
      readingCount: counts[0],
      finishedCount: counts[1],
      abandonedCount: counts[2],
    });
  });

  it("is independent of order and does not mutate its input", () => {
    const sessions = [
      createSession("FINISHED", "session-1"),
      createSession("ABANDONED", "session-2"),
      createSession("FINISHED", "session-3"),
    ];
    const original = [...sessions];

    expect(deriveReadingHistorySummary(sessions)).toEqual(
      deriveReadingHistorySummary([...sessions].reverse()),
    );
    expect(sessions).toEqual(original);
  });
});

describe("deriveReadingHistorySummariesByUserEdition", () => {
  it("groups histories in one pass and initializes missing memberships", () => {
    const summaries = deriveReadingHistorySummariesByUserEdition(
      ["membership-a", "membership-b"],
      [
        createSession("FINISHED", "session-1", "membership-a"),
        createSession("ABANDONED", "session-2", "membership-a"),
      ],
    );

    expect(summaries.get("membership-a")).toEqual({
      sessionCount: 2,
      readingCount: 0,
      finishedCount: 1,
      abandonedCount: 1,
    });
    expect(summaries.get("membership-b")).toEqual({
      sessionCount: 0,
      readingCount: 0,
      finishedCount: 0,
      abandonedCount: 0,
    });
  });
});
