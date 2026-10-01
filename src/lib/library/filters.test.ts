import { describe, expect, it } from "vitest";

import {
  filterLibraryItemsByReadingState,
  parseLibraryReadingFilter,
  type LibraryReadingFilter,
} from "./filters";
import type { LibraryItem } from "./types";
import type { CurrentReadingState, ReadingSession } from "../reading/types";

function createSession(
  status: "READING" | "FINISHED" | "ABANDONED",
  userEditionId: string,
): ReadingSession {
  return {
    id: `session-${userEditionId}`,
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
  kind: CurrentReadingState["kind"],
): LibraryItem {
  let currentReadingState: CurrentReadingState;

  if (kind === "PENDING") {
    currentReadingState = { kind, session: null };
  } else if (kind === "READING") {
    currentReadingState = {
      kind,
      session: { ...createSession(kind, id), status: kind },
    };
  } else if (kind === "FINISHED") {
    currentReadingState = {
      kind,
      session: { ...createSession(kind, id), status: kind },
    };
  } else {
    currentReadingState = {
      kind,
      session: { ...createSession(kind, id), status: kind },
    };
  }

  return {
    id,
    addedAt: "2026-09-30T10:00:00.000Z",
    currentReadingState,
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
    createItem("pending", "PENDING"),
    createItem("reading", "READING"),
    createItem("finished", "FINISHED"),
    createItem("abandoned", "ABANDONED"),
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
});
