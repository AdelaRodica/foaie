import { describe, expect, it } from "vitest";

import {
  filterLibraryItemsByReadingState,
  parseLibraryReadingFilter,
  type LibraryReadingFilter,
} from "./filters";
import type { LibraryItem } from "./types";
import { deriveCurrentReadingState } from "../reading/current-state";
import { deriveReadingHistorySummary } from "../reading/history";
import type { ReadingSession, ReadingStatus } from "../reading/types";

function createSession(
  status: ReadingStatus,
  userEditionId: string,
  index: number,
): ReadingSession {
  return {
    id: `session-${userEditionId}-${index}`,
    userEditionId,
    status,
    startedAt: "2026-09-30",
    finishedAt: status === "FINISHED" ? "2026-09-30" : null,
    abandonedAt: status === "ABANDONED" ? "2026-09-30" : null,
    currentValue: 42,
    progressUnit: "PAGES",
    createdAt: "2026-09-30T10:00:00.000Z",
  };
}

function createItem(
  id: string,
  statuses: readonly ReadingStatus[],
): LibraryItem {
  const sessions = statuses.map((status, index) =>
    createSession(status, id, index),
  );

  return {
    id,
    addedAt: "2026-09-30T10:00:00.000Z",
    currentReadingState: deriveCurrentReadingState(sessions),
    readingHistory: deriveReadingHistorySummary(sessions),
    edition: {
      id: `edition-${id}`,
      format: "PHYSICAL",
      coverSrc: null,
      work: { id: `work-${id}`, title: `Work ${id}`, authors: [] },
    },
  };
}

describe("parseLibraryReadingFilter", () => {
  it.each([
    [undefined, "ALL"],
    ["pending", "PENDING"],
    ["reading", "READING"],
    ["finished", "FINISHED"],
    ["abandoned", "ABANDONED"],
    ["unknown", "ALL"],
    ["", "ALL"],
    [["reading", "finished"], "ALL"],
  ] satisfies ReadonlyArray<readonly [string | string[] | undefined, LibraryReadingFilter]>) (
    "maps %j to %s",
    (value, expected) => {
      expect(parseLibraryReadingFilter(value)).toBe(expected);
    },
  );
});

describe("filterLibraryItemsByReadingState", () => {
  const items = [
    createItem("pending", []),
    createItem("reading", ["READING"]),
    createItem("finished", ["FINISHED"]),
    createItem("abandoned", ["ABANDONED"]),
  ];

  it("returns every item in its original order for ALL", () => {
    expect(filterLibraryItemsByReadingState(items, "ALL")).toEqual(items);
  });

  it.each(["PENDING", "READING", "FINISHED", "ABANDONED"] as const)(
    "returns only the current %s state",
    (filter) => {
      expect(
        filterLibraryItemsByReadingState(items, filter).map(({ id }) => id),
      ).toEqual([filter.toLowerCase()]);
    },
  );

  it("does not mutate the input order", () => {
    const originalIds = items.map(({ id }) => id);

    filterLibraryItemsByReadingState(items, "FINISHED");

    expect(items.map(({ id }) => id)).toEqual(originalIds);
  });

  it("includes one membership in both historical filters", () => {
    const mixed = createItem("mixed", ["FINISHED", "ABANDONED"]);

    expect(filterLibraryItemsByReadingState([mixed], "FINISHED")).toEqual([mixed]);
    expect(filterLibraryItemsByReadingState([mixed], "ABANDONED")).toEqual([mixed]);
  });

  it("includes a rereading membership in active and finished filters", () => {
    const rereading = createItem("rereading", ["FINISHED", "READING"]);

    expect(filterLibraryItemsByReadingState([rereading], "FINISHED")).toEqual([
      rereading,
    ]);
    expect(filterLibraryItemsByReadingState([rereading], "READING")).toEqual([
      rereading,
    ]);
  });

  it("returns a membership with two finished sessions only once", () => {
    const reread = createItem("two-finished", ["FINISHED", "FINISHED"]);
    const result = filterLibraryItemsByReadingState([reread], "FINISHED");

    expect(reread.readingHistory.finishedCount).toBe(2);
    expect(result).toEqual([reread]);
  });
});
