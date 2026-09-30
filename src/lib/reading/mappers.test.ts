import { describe, expect, it } from "vitest";

import { ReadingError } from "./errors";
import {
  mapProgressEntry,
  mapReadingSession,
  type ProgressEntryRow,
  type ReadingSessionRow,
} from "./mappers";

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

function progressRow(overrides: Partial<ProgressEntryRow> = {}): ProgressEntryRow {
  return {
    id: "d1a940b8-e636-46f0-9612-5d437c8bf028",
    reading_session_id: "6ba18b3c-270a-4ae7-976b-69f9a8692bb4",
    kind: "PROGRESS",
    previous_value: 42,
    new_value: 57,
    occurred_on: "2026-09-30",
    created_at: "2026-09-30T10:00:00.000Z",
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

describe("mapProgressEntry", () => {
  it("maps a PROGRESS entry from snake_case to camelCase", () => {
    expect(mapProgressEntry(progressRow())).toEqual({
      id: "d1a940b8-e636-46f0-9612-5d437c8bf028",
      readingSessionId: "6ba18b3c-270a-4ae7-976b-69f9a8692bb4",
      kind: "PROGRESS",
      previousValue: 42,
      newValue: 57,
      occurredOn: "2026-09-30",
      createdAt: "2026-09-30T10:00:00.000Z",
    });
  });

  it("maps a CORRECTION entry", () => {
    expect(
      mapProgressEntry(progressRow({
        kind: "CORRECTION",
        previous_value: 57,
        new_value: 50,
      })),
    ).toMatchObject({ kind: "CORRECTION", previousValue: 57, newValue: 50 });
  });

  it("rejects an unexpected progress entry kind", () => {
    expect(() => mapProgressEntry(progressRow({ kind: "RECALCULATION" }))).toThrowError(
      ReadingError,
    );
    try {
      mapProgressEntry(progressRow({ kind: "RECALCULATION" }));
    } catch (error) {
      expect(error).toMatchObject({ kind: "unexpected", operation: "mapProgressEntry" });
    }
  });

  it("does not expose database field names or extra fields", () => {
    const databaseRowWithExtraField = { ...progressRow(), user_id: "hidden" };
    const serialized = JSON.stringify(mapProgressEntry(databaseRowWithExtraField));

    expect(serialized).not.toContain("user_id");
    expect(serialized).not.toContain("reading_session_id");
    expect(serialized).not.toContain("previous_value");
    expect(serialized).not.toContain("occurred_on");
  });
});
