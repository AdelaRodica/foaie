import { describe, expect, it } from "vitest";

import { LibraryError } from "./errors";
import { mapLibraryItem, type LibraryItemRow } from "./mappers";
import type { CurrentReadingState, ReadingSession } from "../reading/types";

const pendingState: CurrentReadingState = { kind: "PENDING", session: null };
const emptyHistory = {
  sessionCount: 0,
  readingCount: 0,
  finishedCount: 0,
  abandonedCount: 0,
} as const;

const readingSession: ReadingSession & { status: "READING" } = {
  id: "b18dab83-297b-4c6e-8a91-668831ef1594",
  userEditionId: "b31b8fc1-23df-459a-a663-05571f597f4c",
  status: "READING",
  startedAt: "2026-09-28",
  finishedAt: null,
  abandonedAt: null,
  currentValue: 42,
  progressUnit: "PAGES",
  createdAt: "2026-09-28T12:00:00.000Z",
};

const readingState: CurrentReadingState = {
  kind: "READING",
  session: readingSession,
};

function row(overrides: Partial<LibraryItemRow> = {}): LibraryItemRow {
  return {
    id: "b31b8fc1-23df-459a-a663-05571f597f4c",
    created_at: "2026-09-27T12:00:00.000Z",
    edition: {
      id: "eb0137ca-5856-46e8-a410-e547d7058c85",
      format: "PHYSICAL",
      cover_url: "https://example.com/cover.jpg",
      work: {
        id: "6d5045b1-a630-4368-855a-56897eb28b33",
        title: "Una obra",
        work_authors: [
          {
            position: 2,
            author: {
              id: "c13aa03e-dcd0-4fbd-a259-42fd35a548a2",
              name: "Segunda autora",
            },
          },
          {
            position: 1,
            author: {
              id: "b5aff4db-438b-48d6-a88d-7dcb06bef59c",
              name: "Primer autor",
            },
          },
        ],
      },
    },
    ...overrides,
  };
}

describe("mapLibraryItem", () => {
  it("maps the approved private library item shape", () => {
    expect(mapLibraryItem(row(), pendingState, emptyHistory)).toEqual({
      id: "b31b8fc1-23df-459a-a663-05571f597f4c",
      addedAt: "2026-09-27T12:00:00.000Z",
      currentReadingState: pendingState,
      readingHistory: emptyHistory,
      edition: {
        id: "eb0137ca-5856-46e8-a410-e547d7058c85",
        format: "PHYSICAL",
        coverSrc: "https://example.com/cover.jpg",
        work: {
          id: "6d5045b1-a630-4368-855a-56897eb28b33",
          title: "Una obra",
          authors: ["Primer autor", "Segunda autora"],
        },
      },
    });
  });

  it("maps a missing cover URL to a null cover source", () => {
    const value = row();
    if (!value.edition) throw new Error("invalid test fixture");

    expect(
      mapLibraryItem(
        { ...value, edition: { ...value.edition, cover_url: null } },
        pendingState,
        emptyHistory,
      )
        .edition.coverSrc,
    ).toBeNull();
  });

  it("uses author id as a stable tie breaker for equal positions", () => {
    const value = row();
    if (!value.edition?.work) throw new Error("invalid test fixture");

    const work = {
      ...value.edition.work,
      work_authors: [
        { position: 1, author: { id: "b", name: "Segundo" } },
        { position: 1, author: { id: "a", name: "Primero" } },
      ],
    };

    expect(
      mapLibraryItem(
        { ...value, edition: { ...value.edition, work } },
        pendingState,
        emptyHistory,
      ).edition.work.authors,
    ).toEqual(["Primero", "Segundo"]);
  });

  it("maps a work without authors to an empty array", () => {
    const value = row();
    if (!value.edition?.work) throw new Error("invalid test fixture");

    expect(
      mapLibraryItem(
        {
          ...value,
          edition: {
            ...value.edition,
            work: { ...value.edition.work, work_authors: [] },
          },
        },
        pendingState,
        emptyHistory,
      ).edition.work.authors,
    ).toEqual([]);
  });

  it.each([
    ["edition", { edition: null }],
    [
      "work",
      {
        edition: {
          id: "eb0137ca-5856-46e8-a410-e547d7058c85",
          format: "PHYSICAL",
          cover_url: null,
          work: null,
        },
      },
    ],
  ])("rejects a missing required %s relation", (_name, overrides) => {
    expect(() => mapLibraryItem(row(overrides), pendingState, emptyHistory)).toThrowError(
      LibraryError,
    );
    try {
      mapLibraryItem(row(overrides), pendingState, emptyHistory);
    } catch (error) {
      expect(error).toMatchObject({ kind: "unexpected" });
    }
  });

  it("does not expose database or bridge fields", () => {
    const result = mapLibraryItem(row(), pendingState, emptyHistory);
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain("user_id");
    expect(serialized).not.toContain("created_by_profile_id");
    expect(serialized).not.toContain("cover_storage_key");
    expect(serialized).not.toContain("work_authors");
    expect(serialized).not.toContain("position");
  });

  it("includes an active current reading state without changing catalog data", () => {
    const readingHistory = {
      sessionCount: 1,
      readingCount: 1,
      finishedCount: 0,
      abandonedCount: 0,
    } as const;
    const result = mapLibraryItem(row(), readingState, readingHistory);

    expect(result.currentReadingState).toBe(readingState);
    expect(result.readingHistory).toBe(readingHistory);
    expect(result.edition.work).toEqual({
      id: "6d5045b1-a630-4368-855a-56897eb28b33",
      title: "Una obra",
      authors: ["Primer autor", "Segunda autora"],
    });
  });
});
