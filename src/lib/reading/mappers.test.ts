import { describe, expect, it } from "vitest";

import { ReadingError } from "./errors";
import { mapReadingSession, type ReadingSessionRow } from "./mappers";

function row(overrides: Partial<ReadingSessionRow> = {}): ReadingSessionRow {
  return {
    id: "6ba18b3c-270a-4ae7-976b-69f9a8692bb4",
    user_edition_id: "e86afe43-c6fa-412a-9e9c-73b4cb173737",
    status: "READING",
    started_at: "2026-09-29",
    finished_at: null,
    abandoned_at: null,
    current_value: 42,
    progress_unit: "PAGES",
    created_at: "2026-09-29T10:00:00.000Z",
    ...overrides,
  };
}

describe("mapReadingSession", () => {
  it("maps the approved reading session shape", () => {
    expect(mapReadingSession(row())).toEqual({
      id: "6ba18b3c-270a-4ae7-976b-69f9a8692bb4",
      userEditionId: "e86afe43-c6fa-412a-9e9c-73b4cb173737",
      status: "READING",
      startedAt: "2026-09-29",
      finishedAt: null,
      abandonedAt: null,
      currentValue: 42,
      progressUnit: "PAGES",
      createdAt: "2026-09-29T10:00:00.000Z",
    });
  });

  it("preserves nullable dates", () => {
    expect(
      mapReadingSession(row({ started_at: null, finished_at: null, abandoned_at: null })),
    ).toMatchObject({ startedAt: null, finishedAt: null, abandonedAt: null });
  });

  it("rejects an unexpected status", () => {
    expect(() => mapReadingSession(row({ status: "PAUSED" }))).toThrowError(ReadingError);
    try {
      mapReadingSession(row({ status: "PAUSED" }));
    } catch (error) {
      expect(error).toMatchObject({ kind: "unexpected" });
    }
  });

  it("rejects an unexpected progress unit", () => {
    expect(() => mapReadingSession(row({ progress_unit: "CHAPTERS" }))).toThrowError(
      ReadingError,
    );
    try {
      mapReadingSession(row({ progress_unit: "CHAPTERS" }));
    } catch (error) {
      expect(error).toMatchObject({ kind: "unexpected" });
    }
  });

  it("does not expose database field names or extra fields", () => {
    const databaseRowWithExtraField = { ...row(), user_id: "hidden" };
    const result = mapReadingSession(databaseRowWithExtraField);
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain("user_id");
    expect(serialized).not.toContain("user_edition_id");
    expect(serialized).not.toContain("started_at");
    expect(serialized).not.toContain("progress_unit");
  });
});
